/**
 * Rate Limiter for MangaDex API requests
 * - Token bucket for api.mangadex.org (~5 req/s)
 * - Sliding window for /at-home/server/* (stricter: 35 req/min)
 * - Concurrency semaphore for chapter pages & cover image streams
 */

import { SITE_CONFIG } from '../../config/site.js';

class TokenBucket {
  constructor(ratePerSec, burst) {
    this.capacity = burst;
    this.tokens = burst;
    this.fillRate = ratePerSec; // tokens per second
    this.lastRefill = Date.now();
    this.queue = [];
    this.timer = null;
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.fillRate);
    this.lastRefill = now;
  }

  processQueue() {
    this.refill();

    while (this.queue.length > 0 && this.tokens >= 1) {
      this.tokens -= 1;
      const resolve = this.queue.shift();
      resolve();
    }

    if (this.queue.length > 0) {
      const waitTime = Math.max(10, Math.ceil((1 - this.tokens) / this.fillRate * 1000));
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.processQueue(), waitTime);
    }
  }

  acquire() {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }
}

class SlidingWindowLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.timestamps = [];
    this.queue = [];
    this.timer = null;
  }

  clean() {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }

  processQueue() {
    this.clean();

    while (this.queue.length > 0 && this.timestamps.length < this.maxRequests) {
      this.timestamps.push(Date.now());
      const resolve = this.queue.shift();
      resolve();
    }

    if (this.queue.length > 0) {
      const oldest = this.timestamps[0] || Date.now();
      const waitTime = Math.max(20, oldest + this.windowMs - Date.now() + 5);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.processQueue(), waitTime);
    }
  }

  acquire() {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }
}

class ConcurrencyPool {
  constructor(maxConcurrent) {
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return;
    }
    await new Promise((resolve) => this.queue.push(resolve));
    this.active++;
  }

  release() {
    this.active = Math.max(0, this.active - 1);
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }

  async run(task) {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }
}

// Global singletons for server process
export const apiTokenBucket = new TokenBucket(
  SITE_CONFIG.rateLimits.apiRequestsPerSecond,
  SITE_CONFIG.rateLimits.apiBurst
);

export const atHomeLimiter = new SlidingWindowLimiter(
  SITE_CONFIG.rateLimits.atHomeRequestsPerMinute,
  60 * 1000
);

export const imageConcurrencyPool = new ConcurrencyPool(
  SITE_CONFIG.rateLimits.maxConcurrentImageStreams
);

export { TokenBucket, SlidingWindowLimiter, ConcurrencyPool };
