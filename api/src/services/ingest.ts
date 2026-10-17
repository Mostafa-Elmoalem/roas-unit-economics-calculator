// Ingest service: forbidden-field deep scan (C7), server-side metric recomputation
// with the shared domain (AD-12) and idempotent storage. Client-reported metrics
// are validated but never trusted as stored values.
import { metricsFromSnapshotInputs, type CalculatedMetrics } from '@shared';
import type { IngestBatchPayload } from '../schemas/ingest';
import type { Store, StoredEvent, StoredSnapshot } from '../db/store';

/** Keys that must never appear in a payload (names/SKUs/fixed-cost item objects, C7/AD-16). */
const FORBIDDEN_KEYS = new Set([
  'name',
  'sku',
  'projectname',
  'productname',
  'fixedcosts',
  'fixedcostitems',
]);

const MAX_SCAN_DEPTH = 16;

/**
 * Walk the raw parsed body (before any schema stripping) for forbidden keys anywhere.
 * `name` is allowed only in the event-name slot of the wire format — the direct `name`
 * property of entries in the top-level `events` array; anywhere else (props, snapshots,
 * top level) it is a scrubbed-source violation, even when its value looks like an event name.
 */
export function findForbiddenField(
  value: unknown,
  path: readonly (string | number)[] = []
): string | null {
  if (path.length > MAX_SCAN_DEPTH) return null;

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenField(value[index], [...path, index]);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (FORBIDDEN_KEYS.has(normalized)) {
        const isEventNameSlot =
          normalized === 'name' &&
          path.length === 2 &&
          path[0] === 'events' &&
          typeof path[1] === 'number';
        if (!isEventNameSlot) return key;
      }
      const found = findForbiddenField(entry, [...path, key]);
      if (found) return found;
    }
  }

  return null;
}

function allMetricsFinite(metrics: CalculatedMetrics): boolean {
  return Object.values(metrics).every(
    (value) => typeof value !== 'number' || Number.isFinite(value)
  );
}

export type IngestOutcome =
  | { ok: true; accepted: { events: number; snapshots: number } }
  | { ok: false; code: 'invalid_payload'; message: string };

export async function ingestBatch(payload: IngestBatchPayload, store: Store): Promise<IngestOutcome> {
  // Recompute every snapshot product with the single domain owner (AD-12).
  const snapshots: StoredSnapshot[] = [];
  for (const snapshot of payload.snapshots) {
    const products: StoredSnapshot['products'] = [];
    for (const product of snapshot.products) {
      const metrics = metricsFromSnapshotInputs(product.inputs);
      if (!allMetricsFinite(metrics)) {
        return { ok: false, code: 'invalid_payload', message: 'Snapshot inputs failed plausibility' };
      }
      products.push({
        category: product.category,
        currency: snapshot.currency,
        inputs: product.inputs,
        metrics,
      });
    }
    snapshots.push({
      id: snapshot.id,
      deviceId: payload.deviceId,
      projectId: snapshot.projectId,
      capturedAt: snapshot.capturedAt,
      currency: snapshot.currency,
      products,
    });
  }

  const events: StoredEvent[] = payload.events.map((event) => ({
    id: event.id,
    deviceId: payload.deviceId,
    name: event.name,
    occurredAt: event.occurredAt,
    props: event.props ?? null,
  }));

  const acceptedEvents = await store.saveEvents(events);
  let acceptedSnapshots = 0;
  for (const snapshot of snapshots) {
    if (await store.saveSnapshot(snapshot)) acceptedSnapshots += 1;
  }

  return { ok: true, accepted: { events: acceptedEvents, snapshots: acceptedSnapshots } };
}
