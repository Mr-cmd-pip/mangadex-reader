/**
 * MangaDex@Home Telemetry Reporting Client
 * 
 * Per MangaDex Docs:
 * For each image retrieved from a base url that does NOT contain 'mangadex.org',
 * report success/failure, bytes, duration, and cache hit state to https://api.mangadex.network/report.
 */

import { SITE_CONFIG } from '../../config/site.js';

export async function reportMangaDexHomeImage({ url, success, cached, bytes, duration }) {
  if (!url) return;

  // Only report images from third-party MangaDex@Home nodes, not mangadex.org domains
  try {
    const parsed = new URL(url);
    if (parsed.hostname.endsWith('mangadex.org')) {
      return;
    }
  } catch {
    return;
  }

  const payload = {
    url,
    success: Boolean(success),
    cached: Boolean(cached),
    bytes: Number.isFinite(bytes) ? Math.max(0, Math.round(bytes)) : 0,
    duration: Number.isFinite(duration) ? Math.max(0, Math.round(duration)) : 0,
  };

  // Asynchronous background fire-and-forget report
  try {
    await fetch(SITE_CONFIG.mangadex.networkReportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': SITE_CONFIG.upstreamUserAgent,
      },
      body: JSON.stringify(payload),
      // Fast timeout for reporting
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    // Non-fatal, do not break client image delivery
    console.debug(`[MD@Home Report Error] ${err.message}`);
  }
}
