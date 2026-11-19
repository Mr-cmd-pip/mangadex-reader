/**
 * In-Flight Request Deduplication & 429 Backoff Coordinator
 */

const inFlightMap = new Map();

let pauseUntil = 0;

/**
 * Deduplicates concurrent identical requests.
 * If a request for `key` is currently pending, returns the existing Promise.
 */
export async function dedupeInFlight(key, asyncFn) {
  if (inFlightMap.has(key)) {
    return inFlightMap.get(key);
  }

  const promise = (async () => {
    try {
      return await asyncFn();
    } finally {
      inFlightMap.delete(key);
    }
  })();

  inFlightMap.set(key, promise);
  return promise;
}

/**
 * Checks if requests are currently blocked due to a 429 response
 */
export async function waitIfPaused() {
  const now = Date.now();
  if (now < pauseUntil) {
    const delay = pauseUntil - now;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Triggered on HTTP 429. Pauses subsequent requests for the given duration.
 */
export function handle429(retryAfterSeconds = 5) {
  const durationMs = (Math.max(1, retryAfterSeconds) * 1000) + Math.floor(Math.random() * 500);
  pauseUntil = Math.max(pauseUntil, Date.now() + durationMs);
  console.warn(`[Proxy 429 Backoff] Backing off upstream requests for ${durationMs}ms`);
}
