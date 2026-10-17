import { describe, expect, it } from 'vitest';
import { buildBatch, buildEvent, buildSnapshot, createProduct, createProject } from '@shared';
import { createMemoryStore } from '../db/store';
import { findForbiddenField, ingestBatch } from './ingest';
import { ingestBatchSchema } from '../schemas/ingest';

const NOW = '2026-10-17T10:00:00.000Z';
const DEVICE_ID = '8b6a4f5e-2d0a-4f9c-9a3e-6b1d2c3e4f5a';

function validBatch() {
  const project = createProject({
    name: 'Scan Project',
    products: [createProduct({ name: 'Scan Product', sku: 'SCAN-1' })],
  });
  return buildBatch([buildEvent('product_created', { productId: 'p-1' }, NOW), buildSnapshot(project, NOW)], DEVICE_ID, NOW);
}

describe('findForbiddenField', () => {
  it('passes a fully allowlisted builder payload (including the event-name slot)', () => {
    expect(findForbiddenField(JSON.parse(JSON.stringify(validBatch())))).toBeNull();
  });

  it('flags names, SKUs, project names and fixed-cost item objects anywhere in the tree', () => {
    expect(findForbiddenField({ name: 'Secret Product Name' })).toBe('name');
    expect(findForbiddenField({ events: [{ props: { name: 'backup_restored' } }] })).toBe('name');
    expect(findForbiddenField({ events: [{ sku: 'SECRET' }] })).toBe('sku');
    expect(findForbiddenField({ a: { b: [{ projectName: 'Secret' }] } })).toBe('projectName');
    expect(findForbiddenField({ props: { productName: 'Secret' } })).toBe('productName');
    expect(findForbiddenField({ inputs: { fixedCosts: [{ id: 'x', name: 'y', amount: 1 }] } })).toBe('fixedCosts');
    expect(findForbiddenField({ fixedCostItems: [] })).toBe('fixedCostItems');
  });

  it('is case-insensitive and normalizes separators/whitespace', () => {
    expect(findForbiddenField({ SKU: 'SECRET' })).toBe('SKU');
    expect(findForbiddenField({ 'name ': 'Secret' })).toBe('name ');
    expect(findForbiddenField({ product_name: 'Secret' })).toBe('product_name');
    expect(findForbiddenField({ project_name: 'Secret' })).toBe('project_name');
    expect(findForbiddenField({ fixed_costs: [] })).toBe('fixed_costs');
  });

  it('does not flag the allowlisted summary keys (fixedCostsTotal) or the event-name slot', () => {
    expect(findForbiddenField({ inputs: { fixedCostsTotal: 500 } })).toBeNull();
    expect(findForbiddenField({ events: [{ name: 'backup_restored' }] })).toBeNull();
    // Unknown event names are not the scanner's job — the schema enum rejects them as invalid_payload.
    expect(findForbiddenField({ events: [{ name: 'not_a_known_event' }] })).toBeNull();
  });
});

describe('ingestBatch recomputation (AD-12)', () => {
  it('replaces every client-reported metric with the shared-domain recomputation', async () => {
    const store = createMemoryStore();
    const batch = validBatch();
    batch.snapshots[0].products[0].metrics.currentROAS = 12345;

    const parsed = ingestBatchSchema.safeParse(batch);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const outcome = await ingestBatch(parsed.data, store);

    expect(outcome).toEqual({ ok: true, accepted: { events: 1, snapshots: 1 } });
    const stored = [...store.snapshots.values()][0];
    expect(stored.products[0].metrics.currentROAS).not.toBe(12345);
    expect(stored.products[0].metrics.currentROAS).toBeLessThanOrEqual(10);
  });
});
