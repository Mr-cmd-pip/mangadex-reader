/**
 * Upstream MangaDex API Client
 * - Enforces required User-Agent
 * - Explicitly strips/omits Via header
 * - Applies token-bucket or At-Home sliding-window rate limiting
 * - Deduplicates concurrent identical requests
 * - Honors 429 Retry-After with backoff
 */

import { SITE_CONFIG } from '../../config/site.js';
import { apiTokenBucket, atHomeLimiter } from './rate-limiter.js';
import { dedupeInFlight, waitIfPaused, handle429 } from './request-queue.js';
import blocklist from '../../config/blocklist.json' with { type: 'json' };

export async function fetchUpstream(endpoint, options = {}) {
  const isAtHome = endpoint.includes('/at-home/server');
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${SITE_CONFIG.mangadex.apiBase}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const method = (options.method || 'GET').toUpperCase();

  // Deduplication cache key
  const cacheKey = `${method}:${url}`;

  const execute = async (retryCount = 0) => {
    // 1. Wait if general requests are backed off due to 429
    await waitIfPaused();

    // 2. Acquire slot from appropriate rate limiter
    if (isAtHome) {
      await atHomeLimiter.acquire();
    } else {
      await apiTokenBucket.acquire();
    }

    // 3. Prepare headers: ensure descriptive User-Agent, never send Via
    const headers = new Headers(options.headers || {});
    headers.set('User-Agent', SITE_CONFIG.upstreamUserAgent);
    headers.delete('Via');
    headers.delete('via');

    // Strip client cookies and credentials from upstream requests
    headers.delete('cookie');
    headers.delete('authorization');

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: options.signal || AbortSignal.timeout(20000),
      });

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const xRetryAfterHeader = response.headers.get('X-RateLimit-Retry-After');
        let retrySeconds = 5;

        if (xRetryAfterHeader) {
          const timestamp = parseInt(xRetryAfterHeader, 10);
          if (!isNaN(timestamp)) {
            retrySeconds = Math.max(1, Math.round(timestamp - (Date.now() / 1000)));
          }
        } else if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed)) retrySeconds = parsed;
        }

        handle429(retrySeconds);

        if (retryCount < 2) {
          await waitIfPaused();
          return execute(retryCount + 1);
        }
      }

      return response;
    } catch (err) {
      if (retryCount < 1 && err.name !== 'AbortError') {
        return execute(retryCount + 1);
      }
      throw err;
    }
  };

  // Only deduplicate GET requests
  if (method === 'GET' && !options.noDedupe) {
    return dedupeInFlight(cacheKey, execute);
  }

  return execute();
}

/**
 * Checks if a given Manga ID or Scanlation Group ID is blocklisted
 */
export function isBlocklisted({ mangaId, groupId }) {
  if (mangaId && blocklist.blockedMangaIds?.includes(mangaId)) {
    return true;
  }
  if (groupId && blocklist.blockedGroupIds?.includes(groupId)) {
    return true;
  }
  return false;
}
