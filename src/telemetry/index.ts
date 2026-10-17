// Sealed telemetry module (AD-8, CAP-11): queues usage events and redacted project
// snapshots through the repository, flushes batches through fetch / sendBeacon,
// tolerates offline use, and honors the build-time kill-switch. Never blocks the UI:
// every exported mutation queues synchronously and every network call is fire-and-forget.
import {
  buildBatch,
  buildEvent,
  buildSnapshot,
  type Project,
  type TelemetryEventName,
  type TelemetryItem,
  type TelemetryProps,
} from '@shared';
import type { Repository } from '../repository';
import { applyBackoff, beaconBatch, canAttempt, postBatch, resetBackoff } from './client';
import { FLUSH_INTERVAL_MS, SNAPSHOT_THROTTLE_MS, isTelemetryEnabled } from './config';
import { appendItem, filterOutIds, splitBatch } from './queue';

let repository: Repository | null = null;
let deviceId: string | null = null;
let flushing = false;
let flushRequested = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let onlineHandler: (() => void) | null = null;

/** Batches rejected with a 4xx stay on disk but are skipped for this session (avoids hammering). */
const suppressedIds = new Set<string>();

/** Per-project throttle anchors for snapshot capture (in-session only; a reload re-snapshots). */
const lastSnapshotAt = new Map<string, number>();

const nowIso = (): string => new Date().toISOString();

function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

function queueItem(item: TelemetryItem): void {
  if (!repository) return;
  repository.saveTelemetryQueue(appendItem(repository.getTelemetryQueue(), item));
}

/** Initialize once per app session: mint/read the deviceId and register flush triggers. */
export function start(repo: Repository): void {
  if (repository) return;

  repository = repo;
  deviceId = repo.ensureDeviceId();
  queueItem(buildEvent('app_opened', undefined, nowIso()));

  if (typeof window !== 'undefined') {
    onlineHandler = () => {
      void flush();
    };
    window.addEventListener('online', onlineHandler);
    flushTimer = setInterval(() => {
      void flush();
    }, FLUSH_INTERVAL_MS);
  }
}

/** Tear down listeners and in-memory state (tests / hot reload). */
export function stop(): void {
  if (typeof window !== 'undefined' && onlineHandler) {
    window.removeEventListener('online', onlineHandler);
  }
  if (flushTimer !== null) clearInterval(flushTimer);
  repository = null;
  deviceId = null;
  flushing = false;
  flushRequested = false;
  onlineHandler = null;
  flushTimer = null;
  suppressedIds.clear();
  lastSnapshotAt.clear();
  resetBackoff();
}

/** Queue one usage event (props limited to ids/enums/counts by the shared contract). */
export function emit(name: TelemetryEventName, props?: TelemetryProps): void {
  if (!repository) return;
  queueItem(buildEvent(name, props, nowIso()));
}

/**
 * Capture an anonymized snapshot of the project, throttled to at most one per
 * project per window; the first call of a session is the session-start snapshot.
 */
export function notifyProjectChange(project: Project): void {
  if (!repository) return;

  const now = Date.now();
  const last = lastSnapshotAt.get(project.id) ?? 0;
  if (now - last < SNAPSHOT_THROTTLE_MS) return;

  lastSnapshotAt.set(project.id, now);
  queueItem(buildSnapshot(project, nowIso()));
}

async function flushQueued(): Promise<void> {
  if (!repository || !isTelemetryEnabled() || !isOnline()) return;

  for (;;) {
    if (!canAttempt(Date.now())) return;

    const queue = filterOutIds(repository.getTelemetryQueue(), suppressedIds);
    const { batch } = splitBatch(queue);
    if (batch.length === 0) return;

    const outcome = await postBatch(buildBatch(batch, deviceId ?? '', nowIso()));

    if (outcome === 'ok') {
      const sentIds = new Set(batch.map((item) => item.id));
      repository.saveTelemetryQueue(filterOutIds(repository.getTelemetryQueue(), sentIds));
      resetBackoff();
      continue; // drain the next chunk, including items queued while this one was in flight
    }

    if (outcome === 'suppress') {
      for (const item of batch) suppressedIds.add(item.id);
      return;
    }

    applyBackoff(Date.now());
    return;
  }
}

/** Push queued batches to the ingest endpoint; safe to call at any time (fire-and-forget). */
export async function flush(): Promise<void> {
  if (!repository || !isTelemetryEnabled() || !isOnline()) return;

  if (flushing) {
    flushRequested = true;
    return;
  }

  flushing = true;
  try {
    await flushQueued();
  } finally {
    flushing = false;
    if (flushRequested) {
      flushRequested = false;
      void flush();
    }
  }
}

/** Page-hide path: one best-effort beacon; the queue stays intact and dedupe happens server-side. */
export function beaconFlush(): void {
  if (!repository || !isTelemetryEnabled() || !isOnline()) return;

  const queue = filterOutIds(repository.getTelemetryQueue(), suppressedIds);
  const { batch } = splitBatch(queue);
  if (batch.length === 0) return;

  beaconBatch(buildBatch(batch, deviceId ?? '', nowIso()));
}
