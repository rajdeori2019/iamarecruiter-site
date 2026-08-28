const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// ---------------------------------------------------------------------
// YouTube Shorts feed — fetched from the YouTube Data API, cached in
// memory, and refreshed on a schedule so page loads are fast and we
// never come close to the API's daily quota.
// ---------------------------------------------------------------------

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE || '@IAMARECRUITER';
const SHORTS_COUNT = 10;
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 hours

let shortsCache = { videos: [], updatedAt: null };
let cachedChannelUploadsPlaylistId = null;

async function resolveUploadsPlaylistId() {
  if (cachedChannelUploadsPlaylistId) return cachedChannelUploadsPlaylistId;

  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(YOUTUBE_CHANNEL_HANDLE)}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'Failed to resolve channel.');

  const channel = data.items && data.items[0];
  if (!channel) throw new Error('Channel not found for handle ' + YOUTUBE_CHANNEL_HANDLE);

  cachedChannelUploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
  return cachedChannelUploadsPlaylistId;
}

function parseIsoDurationToSeconds(iso) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchLatestShorts() {
  const uploadsPlaylistId = await resolveUploadsPlaylistId();

  // Pull the most recent uploads (more than we need, since not all are Shorts).
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=25&key=${YOUTUBE_API_KEY}`;
  const playlistRes = await fetch(playlistUrl);
  const playlistData = await playlistRes.json();
  if (!playlistRes.ok) throw new Error((playlistData.error && playlistData.error.message) || 'Failed to fetch uploads.');

  const items = playlistData.items || [];
  const videoIds = items.map((item) => item.contentDetails.videoId).filter(Boolean);
  if (!videoIds.length) return [];

  // Look up duration + stats to identify Shorts (YouTube's own cutoff: <= 3 minutes).
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json();
  if (!videosRes.ok) throw new Error((videosData.error && videosData.error.message) || 'Failed to fetch video details.');

  const shorts = (videosData.items || [])
    .filter((v) => parseIsoDurationToSeconds(v.contentDetails.duration) <= 180)
    .map((v) => ({
      id: v.id,
      title: v.snippet.title,
      thumbnail:
        (v.snippet.thumbnails.maxres && v.snippet.thumbnails.maxres.url) ||
        (v.snippet.thumbnails.high && v.snippet.thumbnails.high.url) ||
        (v.snippet.thumbnails.medium && v.snippet.thumbnails.medium.url) ||
        v.snippet.thumbnails.default.url,
      publishedAt: v.snippet.publishedAt,
      viewCount: v.statistics ? v.statistics.viewCount : null
    }))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, SHORTS_COUNT);

  return shorts;
}

async function refreshShortsCache() {
  if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY not set — /api/shorts will return an empty list.');
    return;
  }
  try {
    const videos = await fetchLatestShorts();
    shortsCache = { videos, updatedAt: new Date().toISOString() };
    console.log(`Shorts cache refreshed: ${videos.length} videos.`);
  } catch (err) {
    console.error('Failed to refresh Shorts cache:', err.message);
    // Keep serving whatever is already cached rather than wiping it out.
  }
}

app.get('/api/shorts', (req, res) => {
  res.json(shortsCache);
});

// Warm the cache on boot, then keep it refreshed on a timer.
refreshShortsCache();
setInterval(refreshShortsCache, REFRESH_INTERVAL_MS);

// Fallback straight to the homepage for anything unmatched.
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`I AM A RECRUITER site running on port ${PORT}`);
});
