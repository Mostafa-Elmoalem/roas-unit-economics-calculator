import { describe, expect, it } from 'vitest';
import type pg from 'pg';
import { createPgStore, type StoredEvent, type StoredSnapshot } from './store';

class RecordingPool {
  queries: Array<{ text: string; values?: unknown[] }> = [];
  released = false;
  shouldFailProductInsert = false;
  snapshotRowCount = 1;

  async query(text: string, values?: unknown[]) {
    this.queries.push({ text, values });
    return { rowCount: 1, rows: [] };
  }

  async connect() {
    return {
      query: async (text: string, values?: unknown[]) => {
        this.queries.push({ text, values });
        if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
          return { rowCount: null, rows: [] };
        }
        if (text.includes('INSERT INTO snapshots')) {
          return { rowCount: this.snapshotRowCount, rows: [{ id: 'snap-1' }] };
        }
        if (text.includes('INSERT INTO snapshot_products')) {
          if (this.shouldFailProductInsert) {
            throw new Error('product insert failure');
          }
          return { rowCount: values ? Math.floor(values.length / 6) : 1, rows: [] };
        }
        return { rowCount: 1, rows: [] };
      },
      release: () => {
        this.released = true;
      },
    };
  }
}

describe('createPgStore', () => {
  it('saveEvents returns 0 on empty list without issuing queries', async () => {
    const pool = new RecordingPool();
    const store = createPgStore(pool as unknown as pg.Pool);

    const count = await store.saveEvents([]);
    expect(count).toBe(0);
    expect(pool.queries).toHaveLength(0);
  });

  it('saveEvents formats correct parameters and offsets for multiple events', async () => {
    const pool = new RecordingPool();
    const store = createPgStore(pool as unknown as pg.Pool);

    const events: StoredEvent[] = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        deviceId: '22222222-2222-4222-8222-222222222222',
        name: 'app_opened',
        occurredAt: '2026-10-17T12:00:00.000Z',
        props: null,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        deviceId: '22222222-2222-4222-8222-222222222222',
        name: 'product_created',
        occurredAt: '2026-10-17T12:01:00.000Z',
        props: { productId: 'p1' },
      },
    ];

    const count = await store.saveEvents(events);
    expect(count).toBe(1);
    expect(pool.queries).toHaveLength(1);
    expect(pool.queries[0].text).toContain('($1, $2, $3, $4, $5::jsonb), ($6, $7, $8, $9, $10::jsonb)');
    expect(pool.queries[0].values).toHaveLength(10);
    expect(pool.queries[0].values?.[4]).toBeNull();
    expect(pool.queries[0].values?.[9]).toBe(JSON.stringify({ productId: 'p1' }));
  });

  it('saveSnapshot executes atomically inside a transaction and commits', async () => {
    const pool = new RecordingPool();
    const store = createPgStore(pool as unknown as pg.Pool);

    const snapshot: StoredSnapshot = {
      id: 'snap-1',
      deviceId: 'dev-1',
      projectId: 'proj-1',
      capturedAt: '2026-10-17T12:00:00.000Z',
      currency: 'USD',
      products: [
        {
          category: 'fashion',
          currency: 'USD',
          inputs: {
            sellingPrice: 50,
            cogs: 20,
            units: 100,
            shippingPerUnit: 5,
            fulfillmentRate: 100,
            adSpendPerUnit: 10,
            totalAdSpend: 1000,
            adSpendMode: 'per-unit',
            fixedCostsTotal: 0,
          },
          metrics: {
            totalFixedCosts: 0,
            fixedCostPerUnit: 0,
            grossMargin: 30,
            grossMarginPercent: 60,
            breakEvenCPA: 25,
            breakEvenROAS: 2,
            currentROAS: 5,
            rawNetProfitPerUnit: 15,
            rawTotalProfit: 1500,
            rawTotalRevenue: 5000,
            rawNetMarginPercent: 30,
            isProfitableRaw: true,
            marginOfSafetyROAS: 3,
            effectiveDeliveredShippingCost: 5,
            effectiveReturnedShippingCost: 0,
            adjustedDeliveredUnits: 100,
            adjustedFailedUnits: 0,
            adjustedRealizedRevenue: 5000,
            adjustedRealizedCOGS: 2000,
            adjustedTotalShippingSpent: 500,
            adjustedTotalAdSpend: 1000,
            adjustedTotalProfit: 1500,
            adjustedProfitPerDeliveredUnit: 15,
            adjustedProfitPerOrderedUnit: 15,
            adjustedNetMarginPercent: 30,
            adjustedBreakEvenCPA: 25,
            adjustedBreakEvenROAS: 2,
            adjustedFailedShippingLoss: 0,
            isProfitableAdjusted: true,
            marginOfSafetyAdjustedROAS: 3,
          },
        },
      ],
    };

    const saved = await store.saveSnapshot(snapshot);
    expect(saved).toBe(true);
    expect(pool.released).toBe(true);

    const texts = pool.queries.map((q) => q.text);
    expect(texts[0]).toBe('BEGIN');
    expect(texts[1]).toContain('INSERT INTO snapshots');
    expect(texts[2]).toContain('INSERT INTO snapshot_products');
    expect(texts[3]).toBe('COMMIT');
  });

  it('saveSnapshot rolls back and returns false if snapshot id already exists', async () => {
    const pool = new RecordingPool();
    pool.snapshotRowCount = 0; // Simulate conflict/no row inserted
    const store = createPgStore(pool as unknown as pg.Pool);

    const snapshot: StoredSnapshot = {
      id: 'snap-existing',
      deviceId: 'dev-1',
      projectId: 'proj-1',
      capturedAt: '2026-10-17T12:00:00.000Z',
      currency: 'USD',
      products: [],
    };

    const saved = await store.saveSnapshot(snapshot);
    expect(saved).toBe(false);
    expect(pool.released).toBe(true);

    const texts = pool.queries.map((q) => q.text);
    expect(texts[0]).toBe('BEGIN');
    expect(texts[1]).toContain('INSERT INTO snapshots');
    expect(texts[2]).toBe('ROLLBACK');
  });

  it('saveSnapshot rolls back and releases client if product insert fails', async () => {
    const pool = new RecordingPool();
    pool.shouldFailProductInsert = true;
    const store = createPgStore(pool as unknown as pg.Pool);

    const snapshot: StoredSnapshot = {
      id: 'snap-fail',
      deviceId: 'dev-1',
      projectId: 'proj-1',
      capturedAt: '2026-10-17T12:00:00.000Z',
      currency: 'USD',
      products: [
        {
          category: 'other',
          currency: 'USD',
          inputs: {} as any,
          metrics: {} as any,
        },
      ],
    };

    await expect(store.saveSnapshot(snapshot)).rejects.toThrow('product insert failure');
    expect(pool.released).toBe(true);

    const texts = pool.queries.map((q) => q.text);
    expect(texts[0]).toBe('BEGIN');
    expect(texts[1]).toContain('INSERT INTO snapshots');
    expect(texts[2]).toContain('INSERT INTO snapshot_products');
    expect(texts[3]).toBe('ROLLBACK');
  });
});
