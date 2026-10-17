import { describe, expect, it } from 'vitest';
import {
  buildBatch,
  buildEvent,
  buildSnapshot,
  calculateProductMetrics,
  createProduct,
  createProject,
  type IngestBatch,
  type Product,
} from '@shared';
import { createApp } from './app';
import { createMemoryStore } from './db/store';

const NOW = '2026-10-17T10:00:00.000Z';
const DEVICE_ID = '8b6a4f5e-2d0a-4f9c-9a3e-6b1d2c3e4f5a';

function makeFixtures(): { product: Product; batch: IngestBatch } {
  const product = createProduct({ name: 'Wire Product', sku: 'WIRE-1' });
  const project = createProject({ name: 'Wire Project', products: [product] });
  const batch = buildBatch([buildEvent('app_opened', undefined, NOW), buildSnapshot(project, NOW)], DEVICE_ID, NOW);
  return { product, batch };
}

interface JsonBody {
  ok?: boolean;
  status?: string;
  accepted?: { events: number; snapshots: number };
  error?: { code: string; message: string };
}

const json = async (response: Response): Promise<JsonBody> => (await response.json()) as JsonBody;

function setup(rateLimitPerMinute = 60) {
  const store = createMemoryStore();
  const app = createApp({
    store,
    config: { port: 3000, databaseUrl: 'postgres://unused', rateLimitPerMinute },
  });
  const post = (body: unknown) =>
    app.request('/api/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  return { app, store, post };
}

describe('GET /health', () => {
  it('reports ok', async () => {
    const { app } = setup();
    const response = await app.request('/health');

    expect(response.status).toBe(200);
    expect((await json(response)).status).toBe('ok');
  });
});

describe('POST /api/ingest — happy path (ONLINE_FLUSH / AD-12 / AD-15)', () => {
  it('accepts a batch assembled purely from shared builders and stores recomputed metrics', async () => {
    const { store, post } = setup();
    const { product, batch } = makeFixtures();
    // Tamper with the client-reported metrics: the server must not trust them.
    batch.snapshots[0].products[0].metrics.currentROAS = 999;
    batch.snapshots[0].products[0].metrics.adjustedTotalProfit = 999;

    const response = await post(batch);

    expect(response.status).toBe(200);
    const body = await json(response);
    expect(body.ok).toBe(true);
    expect(body.accepted).toEqual({ events: 1, snapshots: 1 });

    expect(store.events.size).toBe(1);
    const storedEvent = [...store.events.values()][0];
    expect(storedEvent.deviceId).toBe(DEVICE_ID);
    expect(storedEvent.name).toBe('app_opened');

    expect(store.snapshots.size).toBe(1);
    const storedSnapshot = [...store.snapshots.values()][0];
    expect(storedSnapshot.currency).toBe('USD');
    expect(storedSnapshot.products[0].category).toBe(product.category);
    expect(storedSnapshot.products[0].currency).toBe('USD');
    expect(storedSnapshot.products[0].metrics).toEqual(calculateProductMetrics(product));
    expect(storedSnapshot.products[0].metrics.currentROAS).not.toBe(999);
  });
});

describe('POST /api/ingest — DUPLICATE_BATCH', () => {
  it('stored once via id dedupe; the response reports accepted counts', async () => {
    const { store, post } = setup();
    const { batch } = makeFixtures();

    const first = await post(batch);
    const second = await post(structuredClone(batch));

    expect((await json(first)).accepted).toEqual({ events: 1, snapshots: 1 });
    expect((await json(second)).accepted).toEqual({ events: 0, snapshots: 0 });
    expect(store.events.size).toBe(1);
    expect(store.snapshots.size).toBe(1);
  });
});

describe('POST /api/ingest — FORBIDDEN_FIELDS (C7/AD-16)', () => {
  const cases: Array<[string, (batch: IngestBatch) => unknown]> = [
    [
      'top-level name',
      (batch) => ({ ...batch, name: 'Secret Product Name' }),
    ],
    [
      'sku inside a snapshot product',
      (batch) => {
        (batch.snapshots[0].products[0] as { sku?: string }).sku = 'SECRET-SKU';
        return batch;
      },
    ],
    [
      'projectName key',
      (batch) => ({ ...batch, projectName: 'Secret Project' }),
    ],
    [
      'fixed-cost item objects',
      (batch) => {
        (batch.snapshots[0].products[0].inputs as { fixedCosts?: unknown[] }).fixedCosts = [
          { id: 'fc-1', name: 'Secret Overhead', amount: 10 },
        ];
        return batch;
      },
    ],
    [
      'name inside event props',
      (batch) => {
        batch.events[0].props = { name: 'Secret Product Name' };
        return batch;
      },
    ],
  ];

  it('rejects every payload containing forbidden fields and stores nothing', async () => {
    for (const [label, mutate] of cases) {
      const { store, post } = setup();
      const { batch } = makeFixtures();

      const response = await post(mutate(structuredClone(batch)));
      const body = await json(response);

      expect(response.status, label).toBe(400);
      expect(body.error?.code, label).toBe('forbidden_field');
      expect(store.events.size, label).toBe(0);
      expect(store.snapshots.size, label).toBe(0);
    }
  });
});

describe('POST /api/ingest — RATE_LIMITED', () => {
  it('allows the limit then answers 429 rate_limited with nothing stored for the breach', async () => {
    const { store, post } = setup(2);
    const { batch } = makeFixtures();

    const statuses: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      statuses.push((await post(structuredClone(batch))).status);
    }

    expect(statuses).toEqual([200, 200, 429]);
    expect(store.events.size).toBe(1);
  });

  it('limits per deviceId', async () => {
    const { post } = setup(1);
    const { batch } = makeFixtures();
    const otherDevice = { ...structuredClone(batch), deviceId: '1f0f2a3b-4c5d-4e6f-8a9b-0c1d2e3f4a5b' };

    expect((await post(structuredClone(batch))).status).toBe(200);
    expect((await post(structuredClone(batch))).status).toBe(429);
    expect((await post(otherDevice)).status).toBe(200);
  });
});

describe('POST /api/ingest — IMPLAUSIBLE payloads', () => {
  const cases: Array<[string, (batch: IngestBatch) => unknown]> = [
    ['unknown schemaVersion', (batch) => ({ ...batch, schemaVersion: 2 })],
    [
      'unknown event name',
      (batch) => {
        (batch.events[0] as { name: string }).name = 'unknown_event';
        return batch;
      },
    ],
    [
      'negative number',
      (batch) => {
        batch.snapshots[0].products[0].inputs.sellingPrice = -1;
        return batch;
      },
    ],
    [
      'oversized number',
      (batch) => {
        batch.snapshots[0].products[0].inputs.sellingPrice = 1e30;
        return batch;
      },
    ],
    [
      'non-integer units',
      (batch) => {
        batch.snapshots[0].products[0].inputs.units = 1.5;
        return batch;
      },
    ],
    [
      'fulfillmentRate above 100',
      (batch) => {
        batch.snapshots[0].products[0].inputs.fulfillmentRate = 150;
        return batch;
      },
    ],
    [
      'unknown category',
      (batch) => {
        (batch.snapshots[0].products[0] as { category: string }).category = 'random_category';
        return batch;
      },
    ],
    [
      'unknown currency',
      (batch) => {
        (batch.snapshots[0] as { currency: string }).currency = 'XYZ';
        return batch;
      },
    ],
    [
      'bad timestamp',
      (batch) => {
        batch.events[0].occurredAt = 'not-a-date';
        return batch;
      },
    ],
    [
      'timestamp far in the future',
      (batch) => ({ ...batch, sentAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString() }),
    ],
    ['over-cap batch', (batch) => ({ ...batch, events: Array.from({ length: 501 }, () => buildEvent('app_opened', undefined, NOW)) })],
  ];

  it('rejects each implausible payload with invalid_payload and stores nothing', async () => {
    for (const [label, mutate] of cases) {
      const { store, post } = setup();
      const { batch } = makeFixtures();

      const response = await post(mutate(structuredClone(batch)));
      const body = await json(response);

      expect(response.status, label).toBe(400);
      expect(body.error?.code, label).toBe('invalid_payload');
      expect(store.events.size, label).toBe(0);
      expect(store.snapshots.size, label).toBe(0);
    }
  });

  it('rejects non-JSON bodies', async () => {
    const { post } = setup();
    const response = await post('definitely not json');

    expect(response.status).toBe(400);
    expect((await json(response)).error?.code).toBe('invalid_payload');
  });
});

describe('unknown routes', () => {
  it('answers a structured 404', async () => {
    const { app } = setup();
    const response = await app.request('/api/nope');

    expect(response.status).toBe(404);
    expect((await json(response)).error?.code).toBe('not_found');
  });
});
