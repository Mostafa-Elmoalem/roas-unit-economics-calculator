// Store interface + Postgres implementation + in-memory stub for tests (AD-11/22).
// Dedupe is server-side and idempotent: `ON CONFLICT (id) DO NOTHING` on both item
// tables, so at-least-once delivery from the client collapses to stored-once rows.
import type pg from 'pg';
import type { CalculatedMetrics, TelemetryProps, TelemetrySnapshotInputs } from '@shared';

export interface StoredEvent {
  id: string;
  deviceId: string;
  name: string;
  occurredAt: string;
  props: TelemetryProps | null;
}

export interface StoredSnapshotProduct {
  category: string;
  currency: string;
  inputs: TelemetrySnapshotInputs;
  metrics: CalculatedMetrics;
}

export interface StoredSnapshot {
  id: string;
  deviceId: string;
  projectId: string;
  capturedAt: string;
  currency: string;
  products: StoredSnapshotProduct[];
}

export interface Store {
  /** Insert events, deduping by item id; returns how many rows were actually accepted. */
  saveEvents(events: StoredEvent[]): Promise<number>;
  /** Insert a snapshot and its product rows; false when the id already existed. */
  saveSnapshot(snapshot: StoredSnapshot): Promise<boolean>;
}

export function createPgStore(pool: pg.Pool): Store {
  return {
    async saveEvents(events: StoredEvent[]): Promise<number> {
      if (events.length === 0) return 0;

      const values: unknown[] = [];
      const rows = events.map((event, index) => {
        const base = index * 5;
        values.push(
          event.id,
          event.deviceId,
          event.name,
          event.occurredAt,
          event.props === null ? null : JSON.stringify(event.props)
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::jsonb)`;
      });

      const result = await pool.query(
        `INSERT INTO usage_events (id, device_id, name, occurred_at, props)
         VALUES ${rows.join(', ')}
         ON CONFLICT (id) DO NOTHING`,
        values
      );
      return result.rowCount ?? 0;
    },

    async saveSnapshot(snapshot: StoredSnapshot): Promise<boolean> {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const inserted = await client.query(
          `INSERT INTO snapshots (id, device_id, project_id, captured_at, currency)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING
         RETURNING id`,
          [snapshot.id, snapshot.deviceId, snapshot.projectId, snapshot.capturedAt, snapshot.currency]
        );
        if ((inserted.rowCount ?? 0) === 0) {
          await client.query('ROLLBACK');
          return false;
        }

        if (snapshot.products.length > 0) {
          const values: unknown[] = [];
          const rows = snapshot.products.map((product, index) => {
            const base = index * 6;
            values.push(
              snapshot.id,
              index,
              product.category,
              snapshot.currency,
              JSON.stringify(product.inputs),
              JSON.stringify(product.metrics)
            );
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::jsonb, $${base + 6}::jsonb)`;
          });

          await client.query(
            `INSERT INTO snapshot_products (snapshot_id, position, category, currency, inputs, metrics)
           VALUES ${rows.join(', ')}
           ON CONFLICT (snapshot_id, position) DO NOTHING`,
            values
          );
        }

        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

export interface MemoryStore extends Store {
  events: Map<string, StoredEvent>;
  snapshots: Map<string, StoredSnapshot>;
}

/** In-memory stub for CI tests — no Docker, no Postgres (Phase 1 precedent). */
export function createMemoryStore(): MemoryStore {
  const events = new Map<string, StoredEvent>();
  const snapshots = new Map<string, StoredSnapshot>();

  return {
    events,
    snapshots,

    async saveEvents(list: StoredEvent[]): Promise<number> {
      let inserted = 0;
      for (const event of list) {
        if (!events.has(event.id)) {
          events.set(event.id, event);
          inserted += 1;
        }
      }
      return inserted;
    },

    async saveSnapshot(snapshot: StoredSnapshot): Promise<boolean> {
      if (snapshots.has(snapshot.id)) return false;
      snapshots.set(snapshot.id, snapshot);
      return true;
    },
  };
}
