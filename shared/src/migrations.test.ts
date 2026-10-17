import { describe, expect, it } from 'vitest';
import {
  hasLegacyState,
  migrateLegacyState,
  sanitizeAppState,
  sanitizeProduct,
  sanitizeProject,
  LEGACY_STORAGE_KEYS,
} from './migrations';
import { createProduct } from './operations';
import { SCHEMA_VERSION } from './types';
import type { LegacyRawState } from './migrations';

/** Synthetic v0 payload — mirrors what the old flat `roas_calc_*` keys held (JSON-encoded, language raw). */
const LEGACY_RAW: LegacyRawState = {
  projectName: JSON.stringify('Legacy Store'),
  currency: JSON.stringify('EGP'),
  products: JSON.stringify([
    {
      id: 'prod-1',
      name: 'Legacy Tee',
      sku: 'TEE-1',
      sellingPrice: 45,
      cogs: 12.5,
      units: 1000,
      shippingPerUnit: 4.5,
      fulfillmentRate: 85,
      adSpendPerUnit: 14,
      totalAdSpend: 14000,
      adSpendMode: 'per-unit',
      fixedCosts: [{ id: 'fc-1', name: 'Photoshoot', amount: 500 }],
    },
    {
      id: 'prod-2',
      name: 'Legacy Mug',
      sku: 'MUG-1',
      sellingPrice: 30,
      cogs: 9,
      units: 500,
      shippingPerUnit: 3,
      fulfillmentRate: 90,
      adSpendPerUnit: 8,
      totalAdSpend: 4000,
      adSpendMode: 'per-unit',
      fixedCosts: [],
    },
  ]),
  activeProductId: JSON.stringify('prod-2'),
  view: JSON.stringify('calculator'),
  theme: JSON.stringify('dark'),
  comparedProductIds: JSON.stringify(['prod-1', 'prod-2']),
  language: 'ar',
};

describe('migrateLegacyState (v0 → v1)', () => {
  it('produces one intact v1 project: envelope, UUIDs, remapped references, `other` category', () => {
    const state = migrateLegacyState(LEGACY_RAW);

    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    expect(state.projects).toHaveLength(1);

    const project = state.projects[0];
    expect(project.name).toBe('Legacy Store');
    expect(project.currency).toBe('EGP');
    expect(project.schemaVersion).toBe(SCHEMA_VERSION);
    expect(project.deleted).toBe(false);
    expect(project.products).toHaveLength(2);

    for (const product of project.products) {
      expect(product.schemaVersion).toBe(SCHEMA_VERSION);
      expect(product.deleted).toBe(false);
      expect(product.category).toBe('other');
      expect(product.id).not.toMatch(/^prod-/);
    }

    // Reference remap: legacy `prod-2` active id points at the migrated Mug.
    const migratedMug = project.products.find((p) => p.name === 'Legacy Mug')!;
    expect(state.ui.activeProductId).toBe(migratedMug.id);
    expect(state.ui.comparedProductIds).toEqual(project.products.map((p) => p.id));

    // UI carried over: view JSON-quoted, theme JSON-quoted, language raw.
    expect(state.ui.view).toBe('calculator');
    expect(state.ui.theme).toBe('dark');
    expect(state.ui.language).toBe('ar');
    expect(state.activeProjectId).toBe(project.id);
  });

  it('keeps file values for products and fixed costs (no fabrication)', () => {
    const state = migrateLegacyState(LEGACY_RAW);
    const tee = state.projects[0].products.find((p) => p.name === 'Legacy Tee')!;

    expect(tee.sellingPrice).toBe(45);
    expect(tee.cogs).toBe(12.5);
    expect(tee.units).toBe(1000);
    expect(tee.fixedCosts).toHaveLength(1);
    expect(tee.fixedCosts[0].amount).toBe(500);
    expect(tee.fixedCosts[0].id).not.toBe('fc-1'); // ids regenerated to UUIDs
  });

  it('falls back to the injected demo products when the legacy product payload is corrupt, without crashing', () => {
    const fallback = [createProduct({ name: 'Demo Fallback' })];
    const state = migrateLegacyState({ products: '{not-json', projectName: JSON.stringify('Still works') }, fallback);

    expect(state.projects[0].products).toHaveLength(1);
    expect(state.projects[0].products[0].name).toBe('Demo Fallback');
    expect(state.ui.activeProductId).toBe(state.projects[0].products[0].id);
  });

  it('an unknown legacy active id falls back to the first product', () => {
    const state = migrateLegacyState({
      ...LEGACY_RAW,
      activeProductId: JSON.stringify('prod-does-not-exist'),
    });

    expect(state.ui.activeProductId).toBe(state.projects[0].products[0].id);
  });

  it('an empty v0 payload still yields a valid v1 project', () => {
    const state = migrateLegacyState({});

    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].products).toEqual([]);
    expect(state.ui.activeProductId).toBeNull();
    expect(state.ui.language).toBe('en');
    expect(state.ui.theme).toBe('system');
  });

  it('hasLegacyState detects only non-empty legacy payloads', () => {
    expect(hasLegacyState({})).toBe(false);
    expect(hasLegacyState({ projectName: null, products: '' })).toBe(false);
    expect(hasLegacyState({ projectName: JSON.stringify('x') })).toBe(true);
  });

  it('LEGACY_STORAGE_KEYS keeps the exact v0 key names untouched', () => {
    expect(LEGACY_STORAGE_KEYS).toEqual({
      PROJECT_NAME: 'roas_calc_project_name',
      CURRENCY: 'roas_calc_currency',
      PRODUCTS: 'roas_calc_products',
      ACTIVE_PRODUCT_ID: 'roas_calc_active_id',
      VIEW: 'roas_calc_view',
      THEME: 'roas_calc_theme',
      COMPARED_PRODUCT_IDS: 'roas_calc_compared_ids',
      LANGUAGE: 'roas_calc_language',
    });
  });
});

describe('sanitization of stored v1 payloads', () => {
  it('sanitizeAppState repairs a valid-ish payload and rejects an unusable one', () => {
    const repaired = sanitizeAppState({
      schemaVersion: SCHEMA_VERSION,
      activeProjectId: 'p1',
      projects: [{ id: 'p1', name: 'P1', currency: 'USD', products: [{ id: 'x', name: 'X' }] }],
      ui: { theme: 'dark', language: 'ar', view: 'compare' },
    });

    expect(repaired).not.toBeNull();
    expect(repaired!.ui.theme).toBe('dark');
    expect(repaired!.ui.language).toBe('ar');
    expect(repaired!.ui.view).toBe('compare');
    expect(repaired!.ui.activeProductId).toBe('x');
    expect(repaired!.projects[0].products[0].schemaVersion).toBe(SCHEMA_VERSION);

    expect(sanitizeAppState(null)).toBeNull();
    expect(sanitizeAppState({ projects: [] })).toBeNull();
    expect(sanitizeAppState({ schemaVersion: 1 })).toBeNull();
  });

  it('sanitizeProduct repairs loose numbers and unknown categories', () => {
    const p = sanitizeProduct({
      id: 'abc',
      name: 'Loose',
      units: '120',
      sellingPrice: '49.99',
      category: 'Beauty_Personal_Care',
      fulfillmentRate: 250,
    });

    expect(p).not.toBeNull();
    expect(p!.units).toBe(120);
    expect(p!.sellingPrice).toBe(49.99);
    expect(p!.category).toBe('beauty_personal_care');
    expect(p!.fulfillmentRate).toBe(100); // clamped
    expect(sanitizeProduct('nope')).toBeNull();
  });

  it('sanitizeProject with requireId rejects id-less projects (backup contract)', () => {
    expect(sanitizeProject({ name: 'No id' }, { requireId: true })).toBeNull();
    expect(sanitizeProject({ id: 'p1', name: 'Has id' }, { requireId: true })).not.toBeNull();
  });

  it('falls back to the first non-deleted project for activeProjectId', () => {
    const state = sanitizeAppState({
      schemaVersion: 1,
      projects: [
        { id: 'dead', name: 'Deleted', deleted: true, products: [] },
        { id: 'alive', name: 'Alive', products: [{ id: 'p1', name: 'P' }] },
      ],
      ui: {},
    });

    expect(state!.activeProjectId).toBe('alive');
    expect(state!.ui.activeProductId).toBe('p1');
  });

  it('trusts an intentionally empty comparison list but falls back for an absent key', () => {
    const base = {
      schemaVersion: 1,
      activeProjectId: 'p1',
      projects: [
        {
          id: 'p1',
          name: 'P',
          products: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
        },
      ],
    };

    const emptied = sanitizeAppState({ ...base, ui: { comparedProductIds: [] } });
    expect(emptied!.ui.comparedProductIds).toEqual([]);

    const missing = sanitizeAppState({ ...base, ui: {} });
    expect(missing!.ui.comparedProductIds).toEqual(['a', 'b', 'c']);
  });

  it('falls back to the epoch for updatedAt (never now) while createdAt defaults to now', () => {
    const project = sanitizeProject({ id: 'p1', name: 'No timestamps' })!;
    const product = sanitizeProduct({ id: 'x', name: 'No timestamps' })!;

    expect(project.updatedAt).toBe(new Date(0).toISOString());
    expect(product.updatedAt).toBe(new Date(0).toISOString());
    expect(Date.parse(project.createdAt)).toBeGreaterThan(0);
    expect(Date.parse(product.createdAt)).toBeGreaterThan(0);
  });
});
