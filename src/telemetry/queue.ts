// Pure queue operations over plain arrays — no storage access lives here (CAP-8).
import {
  TELEMETRY_LIMITS,
  isTelemetryEvent,
  type TelemetryItem,
} from '@shared';

export function appendItem(queue: TelemetryItem[], item: TelemetryItem): TelemetryItem[] {
  return [...queue, item];
}

/**
 * Take the oldest items that fit one sendable batch (caps shared with the server)
 * and return the remainder in order. Items over the per-kind cap stay for later.
 */
export function splitBatch(queue: TelemetryItem[]): {
  batch: TelemetryItem[];
  rest: TelemetryItem[];
} {
  const batch: TelemetryItem[] = [];
  const rest: TelemetryItem[] = [];
  let events = 0;
  let snapshots = 0;

  for (const item of queue) {
    const isEvent = isTelemetryEvent(item);
    if (isEvent ? events < TELEMETRY_LIMITS.maxEventsPerBatch : snapshots < TELEMETRY_LIMITS.maxSnapshotsPerBatch) {
      if (isEvent) events += 1;
      else snapshots += 1;
      batch.push(item);
    } else {
      rest.push(item);
    }
  }

  return { batch, rest };
}

/** Drop exactly the given item ids (only ever called after a successful send or suppression). */
export function filterOutIds(queue: TelemetryItem[], ids: ReadonlySet<string>): TelemetryItem[] {
  if (ids.size === 0) return queue;
  return queue.filter((item) => !ids.has(item.id));
}
