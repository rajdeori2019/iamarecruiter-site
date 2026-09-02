const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

const PUBLIC_DIR = path.join(__dirname, 'public');
const CANONICAL_HOST = 'www.iamarecruiter.in';

// ---------------------------------------------------------------------
// Canonical host + legacy Wix migration.
// Redirect only when there is a genuine current equivalent. Retired
// time-sensitive pages return 410 instead of being sent to an unrelated URL.
// ---------------------------------------------------------------------
app.use((req, res, next) => {
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0].toLowerCase();
  if (forwardedHost === 'iamarecruiter.in') {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
  }
  next();
});

const LEGACY_REDIRECTS = {
  '/about-us': '/',
  '/joinus': '/join.html',
  '/subscriptions': '/join.html',
  '/mentorship': '/resources.html',
  '/eventspage': '/event.html',
  '/blog': '/resources.html',
  '/terms-conditions': '/terms.html',
  '/privacy-policy': '/privacy.html',
  '/refund-policy': '/cancellation.html',
  '/return-and-refund-policy': '/cancellation.html',
  '/cancellation-policy': '/cancellation.html',
  '/contact-us': '/contact.html',

  // Historical content with a clear current destination.
  '/post/from-a-small-town-to-a-global-talent-leader-the-inspiring-journey-of-pooja-rao': '/videos.html',
  '/post/failed-engineer-to-ta-rockstar': '/videos.html',
  '/post/from-small-town-in-assam-to-ai-startup-ceo-abhisek-s-inspiring-journey': '/videos.html',
  '/post/from-tier-3-college-to-talent-leader-ishita-gupta-s-inspiring-journey': '/videos.html',
  '/post/ca-to-changemaker-shraddha-s-bold-leap-i-am-a-recruiter-podcast': '/videos.html',
  '/post/from-army-boots-to-coaching-suits-major-kiran-s-power-move': '/videos.html',
  '/post/no-naukri-no-problem-siddharth-s-rise-to-ta-leadership': '/videos.html',
  '/post/5k-scam-to-founding-recruiting-monk': '/videos.html',
  '/post/from-100-rejections-to-rockstar-campus-recruiter-i-am-a-recruiter-podcast': '/videos.html',
  '/post/mehak-s-hr-odyssey-from-10-internships-to-skydiving-recruiter': '/videos.html',
  '/post/most-common-challenges-in-hiring': '/fractional-ta.html',
  '/post/honest-confession-from-a-first-time-founder': '/resources.html',
  '/post/selfcare-sunday-recruiters-i-am-a-recruiter': '/resources.html',
  '/post/i-am-a-recruiter-community-is-growing': '/'
};

Object.keys(LEGACY_REDIRECTS).forEach((from) => {
  app.get(from, (req, res) => res.redirect(301, LEGACY_REDIRECTS[from]));
});

const RETIRED_LEGACY_PATHS = new Set([
  '/shipping',
  '/shipping-policy',
  '/post/vantahire-team-is-hiring-freelance-recruiter',
  '/post/join-the-evalmatchai-beta'
]);

app.get(Array.from(RETIRED_LEGACY_PATHS), (req, res) => {
  res.status(410).sendFile(path.join(PUBLIC_DIR, 'gone.html'));
});

// Any other old Wix post has no verified equivalent yet. Returning 410 is
// safer than a blanket redirect that could be interpreted as a soft 404.
app.get(/^\/post\/.+/, (req, res) => {
  res.status(410).sendFile(path.join(PUBLIC_DIR, 'gone.html'));
});

// Prevent extensionless duplicates from competing with canonical .html URLs.
[
  'join', 'resources', 'fractional-ta', 'cohort', 'premium-1-1', 'event', 'videos',
  'contact', 'privacy', 'terms', 'cancellation'
].forEach((slug) => {
  app.get(`/${slug}`, (req, res) => res.redirect(301, `/${slug}.html`));
});

// ---------------------------------------------------------------------
// Search + AI discovery layer.
// Served server-side so titles, descriptions, entity markup and visible
// explanatory content exist in the initial HTML response.
// ---------------------------------------------------------------------
const SEO_PAGES = {
  '/': {
    file: 'index.html',
    title: 'Recruiter Community India | Talent Acquisition Community | I AM A RECRUITER',
    description: 'Join I AM A RECRUITER, an India-first recruiter and talent acquisition community for working recruiters, sourcers and TA leaders. Network, learn and grow together.',
    canonical: 'https://www.iamarecruiter.in/',
    eyebrow: 'Recruiter Community India',
    heading: 'A recruiter and talent acquisition community for working TA professionals',
    intro: 'I AM A RECRUITER is an India-first recruiter community and talent acquisition community for recruiters, sourcers, talent partners and TA leaders who want practical learning, peer connection, events and career growth. The community is based in Bangalore and welcomes TA professionals who want to learn, contribute and build stronger professional relationships.',
    cards: [
      ['Fractional Talent Acquisition', '/fractional-ta.html', 'For founders and People leaders who need senior TA ownership without hiring a full-time Head of Talent Acquisition.'],
      ['Strategic Recruiter Cohort', '/cohort.html', 'For working recruiters who want structured, AI-enabled strategic talent acquisition training and applied proof of work.'],
      ['Senior Interview Coaching', '/premium-1-1.html', 'For experienced technology professionals who are getting interviews but need stronger seniority positioning and interview conversion.']
    ],
    faq: [
      ['What is I AM A RECRUITER?', 'I AM A RECRUITER is an India-first recruiter and talent acquisition community for working recruiters, sourcers, talent partners and TA leaders. It combines peer networking, live sessions, recruiter stories, practical learning and a WhatsApp community.'],
      ['Who can join this recruiter community?', 'The community is designed for working recruiters and talent acquisition professionals across experience levels, including in-house recruiters, agency recruiters, sourcers, freelancers and TA leaders.'],
      ['Is I AM A RECRUITER free to join?', 'Community membership is free. Paid offers such as the strategic recruiter cohort and Premium 1:1 support are separate and clearly identified before payment.'],
      ['Is this a talent acquisition community in India?', 'Yes. I AM A RECRUITER is India-first and based in Bangalore, while the professional network and public content can also be relevant to recruiters outside India.'],
      ['What do members get from the community?', 'Members can connect with other recruiters, take part in recruiter discussions and live sessions, learn from real career and hiring experiences, and follow the community across WhatsApp, LinkedIn, Instagram and YouTube.'],
      ['How do I join the recruiter community?', 'Use the Join page to submit your details. After registration, the website sends the community onboarding information and WhatsApp path.']
    ],
    schemaType: 'CollectionPage'
  },
  '/fractional-ta.html': {
    file: 'fractional-ta.html',
    title: 'Fractional Talent Acquisition | Fractional Head of TA for Tech Companies',
    description: 'Fractional talent acquisition leadership for scaling tech companies with stalled or complex hiring. Diagnose the hiring system, reset priorities and execute a focused 30-day acceleration.',
    canonical: 'https://www.iamarecruiter.in/fractional-ta.html',
    eyebrow: 'Fractional Talent Acquisition',
    heading: 'What is a Fractional Head of Talent Acquisition?',
    intro: 'Fractional talent acquisition gives a company experienced TA leadership for a defined period or part-time engagement without immediately adding a full-time Head of Talent Acquisition. For scaling technology companies, the work can include diagnosing why critical roles are stuck, calibrating requirements, improving sourcing and interview systems, creating hiring visibility and establishing clear ownership. I AM A RECRUITER uses a focused 30-day Tech Hiring Acceleration Sprint when the problem needs senior diagnosis plus hands-on execution.',
    faq: [
      ['What is fractional talent acquisition?', 'Fractional talent acquisition is a flexible model where an experienced TA leader works with a company for a defined period or part-time scope to diagnose, lead and improve hiring without becoming a full-time permanent Head of Talent Acquisition.'],
      ['What does a Fractional Head of Talent Acquisition do?', 'A Fractional Head of Talent Acquisition can own hiring diagnosis, role calibration, sourcing strategy, interview design, funnel visibility, hiring-manager cadence and recruiting execution depending on the company’s actual gap.'],
      ['When should a startup or scaling tech company use fractional TA?', 'It is most relevant when critical hiring is stalled, hiring demand has outgrown the current system, there is no senior TA owner, a new geography or specialist hiring need has appeared, or the company needs experienced ownership before making a full-time leadership hire.'],
      ['How is fractional TA different from a recruitment agency?', 'An agency typically focuses on supplying candidates for individual roles. Fractional TA works inside the hiring system and can own diagnosis, priorities, process, stakeholder decisions and execution. It is not simply CV forwarding.'],
      ['How is fractional TA different from an RPO or full-time Head of TA?', 'An RPO usually provides outsourced recruiting capacity, while a full-time Head of TA becomes a permanent employee. Fractional TA is designed for temporary or part-time senior ownership when the company needs leadership and execution but not necessarily a permanent TA leader yet.'],
      ['Does the 30-day Fractional TA sprint guarantee hires?', 'No. The sprint is designed to improve hiring diagnosis, operating discipline and execution. Candidate decisions, market conditions and employer decisions remain outside any guarantee.'],
      ['Where can the Fractional TA service be delivered?', 'The opportunity universe is global. The service is designed primarily for scaling technology companies and can be delivered remotely, with India and APAC experience providing additional operating context where relevant.']
    ],
    schemaType: 'WebPage'
  },
  '/cohort.html': {
    file: 'cohort.html',
    title: 'Strategic Talent Acquisition Cohort for Recruiters | AI-Enabled TA Training',
    description: 'A 6-week live strategic talent acquisition cohort for working recruiters in India. Build AI-enabled talent intelligence, hiring diagnosis, stakeholder advisory, sourcing, assessment and recruiting analytics capability.',
    canonical: 'https://www.iamarecruiter.in/cohort.html',
    eyebrow: 'Strategic Talent Acquisition Cohort',
    heading: 'Strategic recruiter training for working Talent Acquisition professionals',
    intro: 'The AI-Enabled Strategic Talent Advisor Cohort is a six-week live recruiter cohort for working TA professionals who already understand recruitment execution and want to operate more strategically. Unlike a generic recruitment course or prompt library, the program is built around applied talent intelligence, hiring diagnosis, hiring-manager advisory, sourcing strategy, skills-based assessment, recruiting analytics and AI governance.',
    faq: [
      ['What is a recruiter cohort?', 'A recruiter cohort is a live group-learning format where recruiters move through a structured program together, complete applied work and receive feedback. This cohort is capped at 10 participants so the format can include review, discussion and role-play rather than operate like a webinar.'],
      ['Is this a strategic talent acquisition training program?', 'Yes. The program focuses on the shift from recruiter execution to evidence-backed talent advisory: diagnosing requirements, understanding talent markets, advising hiring managers, building sourcing strategy, designing assessments and using recruiting analytics for business recommendations.'],
      ['Is this an AI recruitment course for recruiters?', 'AI is used throughout the program, but the course is not primarily about prompts. AI supports talent intelligence, diagnosis, sourcing, assessment and analytics, while verification, privacy, bias and hallucination control are treated as required governance skills.'],
      ['Who is this recruiter cohort for?', 'It is designed for working recruiters who already know recruitment fundamentals and want stronger analytical, consultative and business-facing capability. It is not positioned as a beginner recruitment course.'],
      ['What do participants build during the cohort?', 'Participants build six applied recruiting artifacts: a talent-market intelligence report, hiring feasibility diagnosis, stakeholder advisory output, sourcing strategy and talent map, skills-based assessment architecture, and recruiting funnel diagnostic with a leadership recommendation.'],
      ['Is the cohort available in India?', 'Yes. Batch 01 is India-first, delivered live online on Saturdays from 10:30 AM to 12:30 PM IST.'],
      ['Does completing the cohort guarantee a recruiter job or promotion?', 'No. The cohort is designed to improve strategic recruiting capability and proof of work. It does not guarantee a job, interview, promotion, salary increase or employer decision.']
    ],
    schemaType: 'WebPage'
  },
  '/premium-1-1.html': {
    file: 'premium-1-1.html',
    title: 'Interview Coaching for Senior Professionals in India | Premium 1:1',
    description: 'Role-specific 1:1 interview coaching for experienced technology professionals targeting Manager, Director, Head and Principal roles. Diagnose conversion gaps, calibrate seniority and pressure-test evidence.',
    canonical: 'https://www.iamarecruiter.in/premium-1-1.html',
    eyebrow: 'Senior Interview Coaching India',
    heading: '1:1 interview coaching for senior technology professionals',
    intro: 'Premium 1:1 is role-specific senior interview coaching for experienced technology professionals who are already getting relevant interviews but are not consistently converting them. The Interview Conversion Intensive focuses on the exact role, level and company so Manager, Senior Manager, Director, Head, Principal and senior specialist candidates can diagnose what their answers are failing to prove, calibrate evidence to the target seniority and pressure-test communication under realistic probing.',
    faq: [
      ['What is senior interview coaching?', 'Senior interview coaching is role- and level-specific preparation for experienced candidates whose interviews evaluate ownership, judgment, leadership, influence and business impact in addition to technical or functional competence.'],
      ['Who is Premium 1:1 interview coaching designed for?', 'It is designed primarily for experienced mid-to-senior technology professionals who are already getting relevant interviews and need help with interview conversion, seniority positioning, leadership evidence or high-stakes interview preparation.'],
      ['Is this executive interview coaching?', 'The same diagnostic approach can support senior leadership interviews such as Manager, Senior Manager, Director and Head roles. The service is not generic executive presence coaching; it is anchored to the target role, interview evidence and hiring evaluation.'],
      ['How is this different from generic interview preparation?', 'Generic interview preparation often focuses on common questions and answer templates. This service starts by diagnosing where the interview funnel is breaking, then calibrates the candidate’s real evidence to the exact target role and level before structured mock interviewing.'],
      ['Does the service include technical interview coaching?', 'The engagement can pressure-test how you communicate technical or functional evidence, but it does not promise deep technical teaching outside Prafulla Deori’s domain expertise. If the primary gap is technical skill rather than interview conversion, a different intervention may be more appropriate.'],
      ['How soon before an interview should I apply?', 'Applicants with an important interview approaching can apply with the interview date and stage. Urgency is considered during qualification, and the exact scope is confirmed before payment.'],
      ['Does 1:1 interview coaching guarantee an offer?', 'No. The service improves preparation, diagnosis, seniority calibration and interview execution. Interview calls, offers, compensation and final employer decisions are not guaranteed.']
    ],
    schemaType: 'WebPage'
  }
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function replaceMeta(html, name, value) {
  const escaped = escapeHtml(value);
  const nameRe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<meta\\s+name=["']${nameRe}["'][^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${escaped}">`;
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace('</head>', `${tag}\n</head>`);
}

function replacePropertyMeta(html, property, value) {
  const escaped = escapeHtml(value);
  const propRe = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<meta\\s+property=["']${propRe}["'][^>]*>`, 'i');
  const tag = `<meta property="${property}" content="${escaped}">`;
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace('</head>', `${tag}\n</head>`);
}

function buildEntitySchema(config) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.iamarecruiter.in/#organization',
        name: 'I AM A RECRUITER',
        legalName: 'Deori RecruiterHub OPC Solutions OPC Pvt Ltd',
        alternateName: 'I AM A RECRUITER™',
        url: 'https://www.iamarecruiter.in/',
        logo: 'https://www.iamarecruiter.in/assets/logo_trimmed.png',
        foundingDate: '2024-02',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'GM Infinite, A114, E Block, 1st Floor, Thirupalya Road, Electronic City Phase 1',
          addressLocality: 'Bangalore',
          postalCode: '560100',
          addressRegion: 'Karnataka',
          addressCountry: 'IN'
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+91-97429-44825',
          email: 'hello@iamarecruiter.in',
          contactType: 'customer support'
        },
        sameAs: [
          'https://www.linkedin.com/company/i-am-a-recruiter-community',
          'https://www.youtube.com/@IAMARECRUITER',
          'https://www.instagram.com/i.am.a.recruiter/',
          'https://www.facebook.com/profile.php?id=61556803922273'
        ],
        knowsAbout: [
          'Talent Acquisition', 'Recruitment', 'Recruiter Community', 'Sourcing',
          'Talent Intelligence', 'Recruiting Analytics', 'Interview Coaching'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.iamarecruiter.in/#website',
        url: 'https://www.iamarecruiter.in/',
        name: 'I AM A RECRUITER',
        publisher: { '@id': 'https://www.iamarecruiter.in/#organization' },
        inLanguage: 'en-IN'
      },
      {
        '@type': config.schemaType || 'WebPage',
        '@id': `${config.canonical}#webpage`,
        url: config.canonical,
        name: config.title,
        description: config.description,
        isPartOf: { '@id': 'https://www.iamarecruiter.in/#website' },
        about: { '@id': 'https://www.iamarecruiter.in/#organization' },
        inLanguage: 'en-IN',
        dateModified: '2026-09-03'
      }
    ]
  };
}

const SEO_STYLE = `
<style id="search-discovery-style">
.seo-discovery{border-top:1px solid var(--border)}
.seo-discovery .section-head{max-width:880px}
.seo-discovery .seo-intro{font-size:1rem;color:var(--text-muted);max-width:900px}
.seo-service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);margin-top:34px}
.seo-service-card{display:block;background:var(--paper);padding:26px 24px}
.seo-service-card h3{font-family:var(--font-body);font-size:1.06rem;text-transform:none;font-weight:800;letter-spacing:0}
.seo-service-card p{margin-top:8px;color:var(--text-muted);font-size:.92rem}
.seo-service-card span{display:inline-block;margin-top:14px;font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--accent-ink)}
.seo-faq{margin-top:44px;border-top:1px solid var(--border)}
.seo-faq-item{padding:20px 0;border-bottom:1px solid var(--border)}
.seo-faq-item h3{font-family:var(--font-body);font-size:1rem;text-transform:none;font-weight:800;letter-spacing:0}
.seo-faq-item p{margin-top:8px;color:var(--text-muted);max-width:860px;font-size:.93rem}
.seo-related{margin-top:28px;font-family:var(--font-mono);font-size:11px;color:var(--text-muted);line-height:2}
.seo-related a{text-decoration:underline;text-underline-offset:3px}
@media(max-width:760px){.seo-service-grid{grid-template-columns:1fr}}
</style>`;

function buildDiscoveryBlock(config, includeFaq) {
  const cards = (config.cards || []).map((card) => `
    <a class="seo-service-card" href="${card[1]}">
      <h3>${escapeHtml(card[0])}</h3>
      <p>${escapeHtml(card[2])}</p>
      <span>Explore →</span>
    </a>`).join('');

  const faq = includeFaq ? `
    <div class="seo-faq" aria-label="Frequently asked questions">
      <div class="eyebrow">Frequently asked questions</div>
      ${config.faq.map((item) => `<div class="seo-faq-item"><h3>${escapeHtml(item[0])}</h3><p>${escapeHtml(item[1])}</p></div>`).join('')}
    </div>` : '';

  const related = config.canonical === 'https://www.iamarecruiter.in/' ? '' : `
    <p class="seo-related">Related: <a href="/">Recruiter community India</a> · <a href="/resources.html">Recruiter resources</a> · <a href="/fractional-ta.html">Fractional Talent Acquisition</a> · <a href="/cohort.html">Strategic Talent Acquisition Cohort</a> · <a href="/premium-1-1.html">Senior Interview Coaching</a></p>`;

  return `
<section class="section seo-discovery" aria-labelledby="search-intent-heading">
  <div class="container">
    <div class="section-head">
      <div class="eyebrow">${escapeHtml(config.eyebrow)}</div>
      <h2 id="search-intent-heading">${escapeHtml(config.heading)}</h2>
    </div>
    <p class="seo-intro">${escapeHtml(config.intro)}</p>
    ${cards ? `<div class="seo-service-grid">${cards}</div>` : ''}
    ${faq}
    ${related}
  </div>
</section>`;
}

function buildExtraFaq(config) {
  return config.faq.map((item) => `<details><summary>${escapeHtml(item[0])}</summary><p>${escapeHtml(item[1])}</p></details>`).join('');
}

function optimizeHtml(rawHtml, config) {
  let html = rawHtml;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(config.title)}</title>`);
  html = replaceMeta(html, 'description', config.description);
  html = replaceMeta(html, 'robots', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
  html = replacePropertyMeta(html, 'og:title', config.title);
  html = replacePropertyMeta(html, 'og:description', config.description);
  html = replacePropertyMeta(html, 'og:url', config.canonical);
  html = replaceMeta(html, 'twitter:card', 'summary_large_image');
  html = replaceMeta(html, 'twitter:title', config.title);
  html = replaceMeta(html, 'twitter:description', config.description);

  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${config.canonical}">`);
  } else {
    html = html.replace('</head>', `<link rel="canonical" href="${config.canonical}">\n</head>`);
  }

  const entitySchema = `<script type="application/ld+json" id="iaar-entity-schema">${JSON.stringify(buildEntitySchema(config))}</script>`;
  html = html.replace('</head>', `${SEO_STYLE}\n${entitySchema}\n</head>`);

  if (config.canonical === 'https://www.iamarecruiter.in/') {
    const block = buildDiscoveryBlock(config, true);
    html = html.replace(/<section class="cta-band/i, `${block}\n<section class="cta-band`);
  } else {
    const introBlock = buildDiscoveryBlock(config, false);
    const faqSectionRegex = /<section class="section[^>]*id="faq"[^>]*>/i;
    if (faqSectionRegex.test(html)) {
      html = html.replace(faqSectionRegex, `${introBlock}\n$&`);
    } else {
      html = html.replace(/<section class="cta-band/i, `${introBlock}\n<section class="cta-band`);
    }

    if (html.includes('<div class="faq reveal">')) {
      html = html.replace('<div class="faq reveal">', `<div class="faq reveal">${buildExtraFaq(config)}`);
    }
  }

  return html;
}

function registerSeoRoute(route, config) {
  app.get(route, (req, res, next) => {
    try {
      const filePath = path.join(PUBLIC_DIR, config.file);
      const raw = fs.readFileSync(filePath, 'utf8');
      res.type('html').send(optimizeHtml(raw, config));
    } catch (err) {
      next(err);
    }
  });
}

registerSeoRoute('/', SEO_PAGES['/']);
registerSeoRoute('/index.html', SEO_PAGES['/']);
registerSeoRoute('/fractional-ta.html', SEO_PAGES['/fractional-ta.html']);
registerSeoRoute('/cohort.html', SEO_PAGES['/cohort.html']);
registerSeoRoute('/premium-1-1.html', SEO_PAGES['/premium-1-1.html']);

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

// ---------------------------------------------------------------------
// YouTube Shorts feed.
// ---------------------------------------------------------------------
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE || '@IAMARECRUITER';
const SHORTS_COUNT = 10;
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;

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
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=25&key=${YOUTUBE_API_KEY}`;
  const playlistRes = await fetch(playlistUrl);
  const playlistData = await playlistRes.json();
  if (!playlistRes.ok) throw new Error((playlistData.error && playlistData.error.message) || 'Failed to fetch uploads.');

  const items = playlistData.items || [];
  const videoIds = items.map((item) => item.contentDetails.videoId).filter(Boolean);
  if (!videoIds.length) return [];

  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
  const videosRes = await fetch(videosUrl);
  const videosData = await videosRes.json();
  if (!videosRes.ok) throw new Error((videosData.error && videosData.error.message) || 'Failed to fetch video details.');

  return (videosData.items || [])
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
  }
}

app.get('/api/shorts', (req, res) => {
  res.json(shortsCache);
});

refreshShortsCache();
setInterval(refreshShortsCache, REFRESH_INTERVAL_MS);

// True 404 response for all other unknown URLs.
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.listen(PORT, () => {
  console.log(`I AM A RECRUITER site running on port ${PORT}`);
});
