import { describe, it, expect } from 'vitest';
import { TokenBucket, SlidingWindowLimiter, ConcurrencyPool } from '../src/lib/rate-limiter.js';
import { dedupeInFlight } from '../src/lib/request-queue.js';

describe('Rate Limiter & Concurrency Pool', () => {
  it('TokenBucket should allow bursting up to capacity and pace tokens', async () => {
    const bucket = new TokenBucket(10, 3); // 10 tokens/s, max 3 burst
    const start = Date.now();

    // Acquire 3 tokens immediately
    await bucket.acquire();
    await bucket.acquire();
    await bucket.acquire();
    const burstDuration = Date.now() - start;
    expect(burstDuration).toBeLessThan(50);

    // 4th token requires waiting
    await bucket.acquire();
    const waitedDuration = Date.now() - start;
    expect(waitedDuration).toBeGreaterThanOrEqual(60);
  });

  it('SlidingWindowLimiter should pace requests to max allowance', async () => {
    const limiter = new SlidingWindowLimiter(2, 200); // 2 requests per 200ms
    const start = Date.now();

    await limiter.acquire();
    await limiter.acquire();
    expect(Date.now() - start).toBeLessThan(50);

    await limiter.acquire();
    expect(Date.now() - start).toBeGreaterThanOrEqual(180);
  });

  it('ConcurrencyPool should restrict active concurrent tasks', async () => {
    const pool = new ConcurrencyPool(2);
    let active = 0;
    let maxObservedActive = 0;

    const task = async () => {
      await pool.acquire();
      active++;
      maxObservedActive = Math.max(maxObservedActive, active);
      await new Promise((r) => setTimeout(r, 50));
      active--;
      pool.release();
    };

    await Promise.all([task(), task(), task(), task()]);
    expect(maxObservedActive).toBeLessThanOrEqual(2);
  });

  it('dedupeInFlight should join identical pending promises', async () => {
    let callCount = 0;
    const work = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 50));
      return 'result';
    };

    const [r1, r2, r3] = await Promise.all([
      dedupeInFlight('test-key', work),
      dedupeInFlight('test-key', work),
      dedupeInFlight('test-key', work),
    ]);

    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(r3).toBe('result');
    expect(callCount).toBe(1);
  });
});
