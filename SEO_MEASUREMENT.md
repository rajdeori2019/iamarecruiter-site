# I AM A RECRUITER — SEO & LLM Measurement Framework

Last updated: 2026-09-03

## Non-negotiable rule

Do **not** assign a made-up website authority, domain authority, topical authority, LLM visibility, or ranking score.

A numerical score may only be reported when it comes from a named data source with a visible methodology or directly measured search data. If the data is unavailable, report **NOT MEASURED**.

## Four priority URLs

1. https://www.iamarecruiter.in/ — Recruiter Community / Talent Acquisition Community
2. https://www.iamarecruiter.in/fractional-ta.html — Fractional Talent Acquisition
3. https://www.iamarecruiter.in/cohort.html — Strategic Talent Acquisition Cohort
4. https://www.iamarecruiter.in/premium-1-1.html — Senior Interview Coaching / Premium 1:1

## Search-intent clusters to monitor

These are target intent clusters, not claimed search-volume estimates.

### Community
- recruiter community India
- talent acquisition community India
- TA community India
- recruitment community India

### Fractional TA
- fractional talent acquisition
- fractional head of talent acquisition
- fractional TA leadership
- tech hiring consultant

### Recruiter Cohort
- strategic talent acquisition cohort
- recruiter cohort India
- AI recruitment training for recruiters
- strategic recruiter training

### Premium 1:1
- interview coaching for senior professionals India
- senior interview coaching
- leadership interview coaching
- executive interview coaching India

## Weekly evidence to record

### Google Search Console
For each priority URL and target query where data exists:
- Date range
- Query
- Page
- Clicks
- Impressions
- CTR
- Average position
- Indexing status

Do not infer search volume from impressions. Search Console impressions represent this site's appearances, not total market demand.

### Google Generative AI reporting
If available in the Search Console account, record:
- Page
- Generative-AI impressions
- Clicks / visits where reported
- Country
- Device
- Date range

### ChatGPT / LLM referrals
Only report referral traffic once an analytics platform is actually installed and collecting it.
Track visits containing `utm_source=chatgpt.com` where available.
Do not equate crawler access with ranking.

### Backlinks / external authority
Use one or more named sources such as:
- Google Search Console Links report
- Ahrefs
- Semrush
- Majestic

Record the source and date alongside every metric.
Do not invent DA/DR/authority scores when a tool has not been queried.

## AI crawler distinction

- `OAI-SearchBot`: relevant to OpenAI search discovery/citation crawling.
- `ChatGPT-User`: user-initiated browsing requests.
- `GPTBot`: associated with potential model training; it is **not** a ChatGPT Search ranking signal.

Crawler access is necessary for discoverability but does not guarantee indexing, citation, ranking, or traffic.

## Migration monitoring

During the old Wix → current site migration:
- Verify 301 redirects for pages with a genuine replacement.
- Use 410/404 for retired pages with no equivalent.
- Do not blanket-redirect unrelated old URLs to the homepage.
- Watch Search Console for Not Found, Soft 404, Redirect Error, Duplicate and Crawled/Discovered-not-indexed issues.

## Acceptance rule for SEO work

An SEO change may be scored on implementation quality (technical correctness, relevance, crawlability, content quality), but **ranking success itself is only accepted from measured search data**.

No statement such as “we are likely to rank #1,” “authority is 8/10,” or “LLM visibility is 9/10” is allowed without data that directly supports it.
