// Build-time telemetry configuration (AD-8). Vite bakes env values into the bundle,
// so the kill-switch is a build flag: with VITE_TELEMETRY_DISABLED=true every send
// is stopped while queueing continues quietly (CAP-11, C12).
export function isTelemetryEnabled(): boolean {
  return import.meta.env.VITE_TELEMETRY_DISABLED !== 'true';
}

/** The one endpoint this module knows (AD-8); same-origin `/api/*` in dev and prod. */
export const TELEMETRY_ENDPOINT = '/api/ingest';

/** Snapshots are throttled to at most one per project per window (session start adds one). */
export const SNAPSHOT_THROTTLE_MS = 60_000;

/** Idle flush cadence; `online` events and page hide trigger earlier flushes. */
export const FLUSH_INTERVAL_MS = 60_000;

/** Retry backoff bounds after a retryable failure (network / 5xx / 429). */
export const RETRY_BACKOFF_MIN_MS = 60_000;
export const RETRY_BACKOFF_MAX_MS = 15 * 60_000;
