import { describe, expect, it } from 'vitest';
import { calculateProductMetrics } from './calculations';
import { createProduct, createProject, deleteProduct } from './operations';
import { TELEMETRY_EVENT_NAMES, buildBatch, buildEvent, buildSnapshot, isTelemetryEvent, isTelemetrySnapshot, metricsFromSnapshotInputs } from './telemetry';
import type { Product } from './types';

const NOW = '2026-10-17T10:00:00.000Z';

function collectKeys(value: unknown, keys: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const entry of value) collectKeys(entry, keys);
  } else if (typeof value === 'object' && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      keys.push(key);
      collectKeys(entry, keys);
    }
  }
  return keys;
}

describe('telemetry event names', () => {
  it('is exactly the decided event set (snake_case)', () => {
    expect([...TELEMETRY_EVENT_NAMES]).toEqual([
      'app_opened',
      'product_created',
      'product_updated',
      'product_deleted',
      'project_updated',
      'csv_imported',
      'backup_exported',
      'backup_restored',
    ]);
  });
});

describe('buildEvent', () => {
  it('mints a UUID id, stamps the injected time and keeps allowed props', () => {
    const event = buildEvent('product_created', { productId: 'p-1', category: 'fashion_apparel' }, NOW);

    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(event.name).toBe('product_created');
    expect(event.occurredAt).toBe(NOW);
    expect(event.props).toEqual({ productId: 'p-1', category: 'fashion_apparel' });
  });

  it('omits props entirely when none are given and never repeats ids', () => {
    const a = buildEvent('app_opened', undefined, NOW);
    const b = buildEvent('app_opened', undefined, NOW);

    expect(a.props).toBeUndefined();
    expect(a.id).not.toBe(b.id);
  });
});

describe('buildSnapshot — scrub at source (C7/AD-16)', () => {
  const secretProduct: Product = {
    ...createProduct({ name: 'Secret Product Name', sku: 'SECRET-SKU-42' }),
    fixedCosts: [{ id: 'fc-1', name: 'Secret Overhead Name', amount: 1234 }],
  };
  const project = createProject({
    name: 'Secret Project Name',
    currency: 'EGP',
    products: [secretProduct],
  });

  it('never lets names, SKUs, project names or fixed-cost item names into the payload', () => {
    const serialized = JSON.stringify(buildSnapshot(project, NOW));

    expect(serialized).not.toContain('Secret Product Name');
    expect(serialized).not.toContain('SECRET-SKU-42');
    expect(serialized).not.toContain('Secret Project Name');
    expect(serialized).not.toContain('Secret Overhead Name');
  });

  it('carries only allowlisted keys: category, currency, numeric inputs, fixedCostsTotal, metrics', () => {
    const keys = collectKeys(buildSnapshot(project, NOW)).map((key) => key.toLowerCase());

    expect(keys).not.toContain('name');
    expect(keys).not.toContain('sku');
    expect(keys).not.toContain('projectname');
    expect(keys).not.toContain('fixedcosts');
    expect(keys).toContain('fixedcoststotal');
    expect(keys).toContain('category');
    expect(keys).toContain('currency');
    expect(keys).toContain('metrics');
  });

  it('captures category, currency, numeric inputs, fixedCostsTotal and the computed metrics', () => {
    const snapshot = buildSnapshot(project, NOW);
    const [entry] = snapshot.products;

    expect(snapshot.projectId).toBe(project.id);
    expect(snapshot.capturedAt).toBe(NOW);
    expect(snapshot.currency).toBe('EGP');
    expect(entry.category).toBe(secretProduct.category);
    expect(entry.inputs.sellingPrice).toBe(secretProduct.sellingPrice);
    expect(entry.inputs.fixedCostsTotal).toBe(1234);
    expect(entry.inputs.adSpendMode).toBe(secretProduct.adSpendMode);
    expect(entry.metrics).toEqual(calculateProductMetrics(secretProduct));
  });

  it('excludes tombstoned products', () => {
    const removed = deleteProduct(secretProduct);
    const withTombstone = { ...project, products: [secretProduct, removed] };

    expect(buildSnapshot(withTombstone, NOW).products).toHaveLength(1);
  });

  it('normalizes non-finite values to zero so the payload stays JSON-safe', () => {
    const broken = { ...secretProduct, sellingPrice: Number.NaN, cogs: Number.POSITIVE_INFINITY };

    const snapshot = buildSnapshot({ ...project, products: [broken] }, NOW);
    expect(snapshot.products[0].inputs.sellingPrice).toBe(0);
    expect(snapshot.products[0].inputs.cogs).toBe(0);
    expect(JSON.parse(JSON.stringify(snapshot))).toBeTruthy();
  });
});

describe('metricsFromSnapshotInputs — server-side recomputation parity (AD-12)', () => {
  it('reproduces the client metrics for representative product shapes', () => {
    const shapes: Product[] = [
      createProduct({ name: 'Flat' }),
      createProduct({
        name: 'Subsidized',
        shippingMode: 'subsidized',
        courierShippingCost: 90,
        customerShippingFee: 60,
        units: 1000,
      }),
      createProduct({ name: 'Total mode', adSpendMode: 'total', totalAdSpend: 20000, units: 800 }),
      createProduct({ name: 'Loss maker', sellingPrice: 17, cogs: 12, adSpendPerUnit: 9, units: 300 }),
    ];

    for (const product of shapes) {
      const project = createProject({ products: [product] });
      const snapshot = buildSnapshot(project, NOW);
      const [{ inputs, metrics }] = snapshot.products;

      expect(metricsFromSnapshotInputs(inputs)).toEqual(metrics);
      expect(metricsFromSnapshotInputs(inputs)).toEqual(calculateProductMetrics(product));
    }
  });
});

describe('buildBatch', () => {
  it('assembles the wire shape and partitions items by kind', () => {
    const project = createProject({ products: [createProduct({ name: 'P' })] });
    const event = buildEvent('app_opened', undefined, NOW);
    const snapshot = buildSnapshot(project, NOW);
    const batch = buildBatch([event, snapshot, buildEvent('csv_imported', { productCount: 3 }, NOW)], 'device-1', NOW);

    expect(batch.schemaVersion).toBe(1);
    expect(batch.deviceId).toBe('device-1');
    expect(batch.sentAt).toBe(NOW);
    expect(batch.events).toHaveLength(2);
    expect(batch.snapshots).toHaveLength(1);
    expect(isTelemetryEvent(batch.events[0])).toBe(true);
    expect(isTelemetrySnapshot(batch.snapshots[0])).toBe(true);
    expect(isTelemetrySnapshot(batch.events[0])).toBe(false);
    expect(isTelemetryEvent(batch.snapshots[0])).toBe(false);
  });
});
