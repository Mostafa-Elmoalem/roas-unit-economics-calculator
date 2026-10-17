// The only module that knows the ingest endpoint (AD-8): fetch + sendBeacon with a
// Blob, plus the retry backoff schedule. Silent by construction — every failure is
// reported as an outcome value, never thrown at the caller.
import type { IngestBatch } from '@shared';
import {
  RETRY_BACKOFF_MAX_MS,
  RETRY_BACKOFF_MIN_MS,
  TELEMETRY_ENDPOINT,
} from './config';

/** ok = 2xx (trim the batch); retry = network/5xx/429 (keep items, back off); suppress = 4xx (keep items, skip this batch for the session). */
export type SendOutcome = 'ok' | 'retry' | 'suppress';

let backoffMs = RETRY_BACKOFF_MIN_MS;
let nextAttemptAt = 0;

/** Backoff state — retries start at 1 minute and double up to the 15-minute cap. */
export function canAttempt(now: number): boolean {
  return now >= nextAttemptAt;
}

export function resetBackoff(): void {
  backoffMs = RETRY_BACKOFF_MIN_MS;
  nextAttemptAt = 0;
}

export function applyBackoff(now: number): void {
  nextAttemptAt = now + backoffMs;
  backoffMs = Math.min(RETRY_BACKOFF_MAX_MS, backoffMs * 2);
}

export async function postBatch(batch: IngestBatch): Promise<SendOutcome> {
  try {
    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
      keepalive: true,
    });
    if (response.ok) return 'ok';
    if (response.status === 429 || response.status >= 500) return 'retry';
    return 'suppress';
  } catch {
    return 'retry';
  }
}

/** Best-effort page-hide send; the queue is always kept and deduped server-side. */
export function beaconBatch(batch: IngestBatch): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false;
  try {
    const blob = new Blob([JSON.stringify(batch)], { type: 'application/json' });
    return navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
  } catch {
    return false;
  }
}
