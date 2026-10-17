import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rateLimit';

describe('createRateLimiter — fixed window per deviceId', () => {
  it('allows up to the limit inside a window, rejects the next, and resets next window', () => {
    let time = 0;
    const limiter = createRateLimiter(2, () => time);

    expect(limiter.check('device-a')).toBe(true);
    expect(limiter.check('device-a')).toBe(true);
    expect(limiter.check('device-a')).toBe(false);

    time += 60_000;
    expect(limiter.check('device-a')).toBe(true);
  });

  it('counts deviceIds independently', () => {
    const limiter = createRateLimiter(1, () => 0);

    expect(limiter.check('device-a')).toBe(true);
    expect(limiter.check('device-a')).toBe(false);
    expect(limiter.check('device-b')).toBe(true);
  });
});
