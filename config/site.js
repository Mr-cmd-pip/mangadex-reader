/**
 * Application & MangaDex API Configuration
 */

export const SITE_CONFIG = {
  name: 'MangaVerse',
  description: 'Clean, fast, ad-free reader for Manga, Manhwa, and Manhua powered by the public MangaDex API.',
  
  // REQUIRED BY MANGADEX DOCS:
  // Must be descriptive, not spoof a browser, and include contact email or repo URL.
  // TODO: Replace the placeholder below with your real contact email or repository URL before deploying!
  upstreamUserAgent: 'MangaVerse/0.1.0 (TODO: contact-email-or-repo-url)',

  // MangaDex Upstream Endpoints
  mangadex: {
    apiBase: 'https://api.mangadex.org',
    uploadsBase: 'https://uploads.mangadex.org',
    networkReportUrl: 'https://api.mangadex.network/report',
  },

  // Rate Limiting Rules (per MangaDex docs)
  rateLimits: {
    // ~5 requests/second guaranteed minimum allowance on api.mangadex.org
    apiRequestsPerSecond: 5,
    apiBurst: 5,

    // GET /at-home/server/{id} limit: 40 req/min upstream.
    // We clamp to 35 req/min for a safe headroom.
    atHomeRequestsPerMinute: 35,

    // Concurrency limit for chapter pages and covers (bypasses the 5 req/s queue)
    maxConcurrentImageStreams: 12,
  },

  // Caching TTLs (in seconds)
  cacheTTL: {
    tags: 86400,        // 24 hours
    mangaDetail: 3600,   // 1 hour
    chapterFeed: 300,    // 5 minutes
    atHomeServer: 180,   // 3 minutes (baseUrls expire in ~15m upstream)
    covers: 604800,      // 7 days
    pages: 86400,        // 24 hours
  },

  // Content Filtering Defaults
  contentRating: {
    default: ['safe', 'suggestive'],
    optInAllowed: ['erotica'], // client can opt-in to erotica
    neverAllowed: ['pornographic'], // strictly prohibited from requests and UI
  },

  // Pagination Safety Limits
  pagination: {
    maxBrowseLimit: 100,
    maxFeedLimit: 500,
    maxOffsetSum: 10000, // offset + limit cannot exceed 10,000 per MangaDex docs
  },
};
