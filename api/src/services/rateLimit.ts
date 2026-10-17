// In-memory fixed-window rate limit per deviceId (single instance; tuning is Phase 5).
export interface RateLimiter {
  /** Records one request for the deviceId in the current window; false when over the limit. */
  check(deviceId: string): boolean;
}

const WINDOW_MS = 60_000;
const MAX_TRACKED_DEVICES = 10_000;

function pruneWindows(windows: Map<string, { start: number; count: number }>, windowStart: number): void {
  for (const [key, entry] of windows) {
    if (entry.start < windowStart) windows.delete(key);
  }
}

export function createRateLimiter(limitPerMinute: number, now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  return {
    check(deviceId: string): boolean {
      const windowStart = Math.floor(now() / WINDOW_MS) * WINDOW_MS;
      const entry = windows.get(deviceId);

      if (!entry || entry.start !== windowStart) {
        if (windows.size >= MAX_TRACKED_DEVICES) {
          pruneWindows(windows, windowStart);
          if (windows.size >= MAX_TRACKED_DEVICES) return false;
        }
        windows.set(deviceId, { start: windowStart, count: 1 });
        return true;
      }

      entry.count += 1;
      return entry.count <= limitPerMinute;
    },
  };
}
