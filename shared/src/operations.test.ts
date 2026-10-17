import { describe, expect, it } from 'vitest';
import {
  activeProducts,
  applyProductPatch,
  createFixedCostItem,
  createProduct,
  createProject,
  deleteProduct,
  duplicateProduct,
  findProject,
  generateId,
  matchCategory,
  resolveAdSpend,
  upsertProject,
} from './operations';
import { SCHEMA_VERSION } from './types';
import type { AppState } from './types';

describe('matchCategory', () => {
  it('matches enum values case-insensitively', () => {
    expect(matchCategory('fashion_apparel')).toBe('fashion_apparel');
    expect(matchCategory('FASHION_APPAREL')).toBe('fashion_apparel');
    expect(matchCategory('  Electronics_Gadgets ')).toBe('electronics_gadgets');
  });

  it('maps anything unknown to `other`', () => {
    expect(matchCategory('Shoes')).toBe('other');
    expect(matchCategory('')).toBe('other');
    expect(matchCategory(undefined)).toBe('other');
    expect(matchCategory(42)).toBe('other');
  });
});

describe('generateId', () => {
  it('produces unique RFC 4122 v4-shaped UUIDs', () => {
    const a = generateId();
    const b = generateId();

    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });
});

describe('createProduct', () => {
  it('stamps the v1 envelope with sane defaults', () => {
    const p = createProduct({ name: 'Test Item' });

    expect(p.name).toBe('Test Item');
    expect(p.category).toBe('other');
    expect(p.schemaVersion).toBe(SCHEMA_VERSION);
    expect(p.deleted).toBe(false);
    expect(p.deletedAt).toBeUndefined();
    expect(Number.isNaN(Date.parse(p.createdAt))).toBe(false);
  });
});

describe('ad-spend/units sync (single owner — AD-6)', () => {
  it('resolves per-unit mode to total = CPA × units', () => {
    const p = createProduct({ units: 200, adSpendMode: 'per-unit', adSpendPerUnit: 15 });

    expect(resolveAdSpend(p)).toEqual({ adSpendPerUnit: 15, totalAdSpend: 3000 });
  });

  it('resolves total mode to CPA = total / units', () => {
    const p = createProduct({ units: 100, adSpendMode: 'total', totalAdSpend: 1000 });

    expect(resolveAdSpend(p)).toEqual({ adSpendPerUnit: 10, totalAdSpend: 1000 });
  });

  it('treats zero units as one unit when resolving (guarded division)', () => {
    const p = createProduct({
      units: 0,
      adSpendMode: 'total',
      totalAdSpend: 1000,
      adSpendPerUnit: 0,
    });

    expect(resolveAdSpend(p)).toEqual({ adSpendPerUnit: 1000, totalAdSpend: 1000 });
  });

  it('per-unit patch: changing CPA recalculates the total', () => {
    const p = createProduct({
      units: 100,
      adSpendMode: 'per-unit',
      adSpendPerUnit: 20,
      totalAdSpend: 2000,
    });
    const patched = applyProductPatch(p, { adSpendPerUnit: 25 });

    expect(patched.adSpendPerUnit).toBe(25);
    expect(patched.totalAdSpend).toBe(2500);
    expect(Number.isNaN(Date.parse(patched.updatedAt))).toBe(false);
  });

  it('per-unit patch: changing units recalculates the total', () => {
    const p = createProduct({
      units: 100,
      adSpendMode: 'per-unit',
      adSpendPerUnit: 20,
      totalAdSpend: 2000,
    });
    const patched = applyProductPatch(p, { units: 200 });

    expect(patched.adSpendPerUnit).toBe(20);
    expect(patched.totalAdSpend).toBe(4000);
  });

  it('total patch: changing the total recalculates CPA', () => {
    const p = createProduct({
      units: 100,
      adSpendMode: 'total',
      totalAdSpend: 1000,
      adSpendPerUnit: 10,
    });
    const patched = applyProductPatch(p, { totalAdSpend: 2000 });

    expect(patched.adSpendPerUnit).toBe(20);
    expect(patched.totalAdSpend).toBe(2000);
  });

  it('total patch: changing units recalculates CPA', () => {
    const p = createProduct({
      units: 100,
      adSpendMode: 'total',
      totalAdSpend: 2000,
      adSpendPerUnit: 20,
    });
    const patched = applyProductPatch(p, { units: 50 });

    expect(patched.adSpendPerUnit).toBe(40);
    expect(patched.totalAdSpend).toBe(2000);
  });

  it('patches that touch neither CPA nor units nor total leave the sync untouched', () => {
    const p = createProduct({
      units: 100,
      adSpendMode: 'per-unit',
      adSpendPerUnit: 20,
      totalAdSpend: 2000,
    });
    const patched = applyProductPatch(p, { name: 'Renamed' });

    expect(patched.name).toBe('Renamed');
    expect(patched.adSpendPerUnit).toBe(20);
    expect(patched.totalAdSpend).toBe(2000);
  });

  it('zero units via patch collapse a per-unit total to zero', () => {
    const p = createProduct({
      units: 100,
      adSpendMode: 'per-unit',
      adSpendPerUnit: 20,
      totalAdSpend: 2000,
    });
    const patched = applyProductPatch(p, { units: 0 });

    expect(patched.totalAdSpend).toBe(0);
  });
});

describe('tombstones and duplication', () => {
  it('deleteProduct tombstones instead of removing', () => {
    const p = createProduct({ name: 'Doomed' });
    const tombstone = deleteProduct(p);

    expect(tombstone.deleted).toBe(true);
    expect(tombstone.deletedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(tombstone.deletedAt!))).toBe(false);
    expect(activeProducts([tombstone, createProduct({ name: 'Alive' })])).toHaveLength(1);
  });

  it('duplicateProduct regenerates ids (including fixed-cost item ids)', () => {
    const original = createProduct({
      name: 'Source',
      fixedCosts: [createFixedCostItem('Studio', 500)],
    });
    const copy = duplicateProduct(original);

    expect(copy.id).not.toBe(original.id);
    expect(copy.name).toBe('Source (Copy)');
    expect(copy.deleted).toBe(false);
    expect(copy.fixedCosts[0].id).not.toBe(original.fixedCosts[0].id);
    expect(copy.fixedCosts[0].amount).toBe(500);
  });
});

describe('project operations', () => {
  it('upsertProject appends unknown ids and replaces known ones in place', () => {
    const a = createProject({ name: 'A' });
    const b = createProject({ name: 'B' });

    const added = upsertProject([a], b);
    expect(added.map((p) => p.name)).toEqual(['A', 'B']);

    const replaced = upsertProject(added, { ...a, name: 'A2' });
    expect(replaced.map((p) => p.name)).toEqual(['A2', 'B']);
  });

  it('findProject prefers the requested id, then the first non-deleted project', () => {
    const deleted = { ...createProject({ name: 'Deleted' }), deleted: true };
    const alive = createProject({ name: 'Alive' });
    const state = {
      schemaVersion: SCHEMA_VERSION,
      activeProjectId: deleted.id,
      projects: [deleted, alive],
      ui: {
        theme: 'system' as const,
        language: 'en' as const,
        view: 'dashboard' as const,
        activeProductId: null,
        comparedProductIds: [],
      },
    } satisfies AppState;

    expect(findProject(state, alive.id)?.name).toBe('Alive');
    expect(findProject(state, deleted.id)?.name).toBe('Deleted');
    expect(findProject(state, 'missing')?.name).toBe('Alive');
  });
});
