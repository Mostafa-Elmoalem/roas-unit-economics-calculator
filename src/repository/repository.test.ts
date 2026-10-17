import { describe, expect, it } from 'vitest';
import {
  activeProducts,
  createProduct,
  createProject,
  deleteProduct,
  findProject,
  serializeBackup,
  upsertProject,
} from '@shared';
import type { AppState } from '@shared';
import {
  createMemoryEngine,
  createRepository,
  LEGACY_STORAGE_KEYS,
  STATE_KEY,
} from './index';

describe('repository load — clean browser', () => {
  it('seeds the demo project and persists it under the single v1 key', () => {
    const engine = createMemoryEngine();
    const state = createRepository(engine).load();

    expect(state.schemaVersion).toBe(1);
    expect(state.projects).toHaveLength(1);
    expect(activeProducts(state.projects[0].products).length).toBeGreaterThan(0);

    const stored = engine.get(STATE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).activeProjectId).toBe(state.activeProjectId);
  });
});

describe('repository save/load round-trip', () => {
  it('a fresh repository on the same engine returns the saved state', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    const loaded = repo.load();

    const renamed: AppState = {
      ...loaded,
      projects: [{ ...loaded.projects[0], name: 'Renamed Project' }],
      ui: { ...loaded.ui, theme: 'light' },
    };
    repo.save(renamed);

    const reloaded = createRepository(engine).load();
    expect(reloaded.projects[0].name).toBe('Renamed Project');
    expect(reloaded.ui.theme).toBe('light');
    expect(reloaded.activeProjectId).toBe(loaded.activeProjectId);
  });

  it('flush rewrites the last state even after the stored copy is corrupted', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    const state = repo.load();

    engine.set(STATE_KEY, '{corrupt');
    repo.flush();

    expect(JSON.parse(engine.get(STATE_KEY)!)).toEqual(state);
  });
});

describe('two projects round-trip independently (CAP-4)', () => {
  it('editing the second project never modifies the first', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    const state = repo.load();

    const projectA = state.projects[0];
    const countA = activeProducts(projectA.products).length;

    // Create the second project through the domain API.
    const projectB = createProject({
      name: 'Second Project',
      products: [createProduct({ name: 'B Product 1' })],
    });
    let next: AppState = {
      ...state,
      activeProjectId: projectB.id,
      projects: upsertProject(state.projects, projectB),
    };
    repo.save(next);

    // Edit only B (adds a product, bumps updatedAt).
    const b = findProject(next, projectB.id)!;
    next = {
      ...next,
      projects: upsertProject(next.projects, {
        ...b,
        products: [createProduct({ name: 'B Product 2' }), ...b.products],
        updatedAt: new Date().toISOString(),
      }),
    };
    repo.save(next);

    const reloaded = createRepository(engine).load();
    expect(reloaded.projects).toHaveLength(2);

    const a2 = findProject(reloaded, projectA.id)!;
    const b2 = findProject(reloaded, projectB.id)!;
    expect(a2.name).toBe(projectA.name);
    expect(activeProducts(a2.products)).toHaveLength(countA);
    expect(a2.updatedAt).toBe(projectA.updatedAt);
    expect(activeProducts(b2.products).map((p) => p.name)).toEqual([
      'B Product 2',
      'B Product 1',
    ]);
  });
});

describe('legacy migration via injected engine (LEGACY_UPGRADE)', () => {
  it('reads v0 keys, writes v1, and leaves the legacy keys untouched', () => {
    const engine = createMemoryEngine({
      [LEGACY_STORAGE_KEYS.PROJECT_NAME]: JSON.stringify('Legacy Project'),
      [LEGACY_STORAGE_KEYS.CURRENCY]: JSON.stringify('EUR'),
      [LEGACY_STORAGE_KEYS.PRODUCTS]: JSON.stringify([
        {
          id: 'prod-1',
          name: 'Legacy Item',
          sellingPrice: 10,
          cogs: 3,
          units: 100,
          adSpendPerUnit: 2,
          fixedCosts: [{ id: 'fc-1', name: 'Rent', amount: 300 }],
        },
      ]),
      [LEGACY_STORAGE_KEYS.ACTIVE_PRODUCT_ID]: JSON.stringify('prod-1'),
      [LEGACY_STORAGE_KEYS.VIEW]: JSON.stringify('compare'),
      [LEGACY_STORAGE_KEYS.THEME]: JSON.stringify('dark'),
      [LEGACY_STORAGE_KEYS.COMPARED_PRODUCT_IDS]: JSON.stringify(['prod-1']),
      [LEGACY_STORAGE_KEYS.LANGUAGE]: 'ar',
    });

    const repo = createRepository(engine);
    const state = repo.load();

    expect(state.projects[0].name).toBe('Legacy Project');
    expect(state.projects[0].currency).toBe('EUR');
    expect(state.projects[0].products[0].name).toBe('Legacy Item');
    expect(state.projects[0].products[0].id).not.toBe('prod-1');
    expect(state.projects[0].products[0].category).toBe('other');
    expect(state.ui.language).toBe('ar');
    expect(state.ui.view).toBe('compare');
    expect(state.ui.theme).toBe('dark');

    // v0 keys are read once but never modified or deleted.
    expect(engine.get(LEGACY_STORAGE_KEYS.PROJECT_NAME)).toBe(JSON.stringify('Legacy Project'));
    expect(engine.get(LEGACY_STORAGE_KEYS.PRODUCTS)).toBeTruthy();
    expect(engine.get(STATE_KEY)).toBeTruthy();

    // A browser holding both v0 keys and the migrated v1 blob reads v1 (no double migration).
    const reloaded = createRepository(engine).load();
    expect(reloaded.projects[0].products[0].id).toBe(state.projects[0].products[0].id);
  });
});

describe('corrupt or partial payloads fall back gracefully', () => {
  it('unparseable v1 JSON falls through to the demo seed', () => {
    const engine = createMemoryEngine({ [STATE_KEY]: '{corrupt' });
    const state = createRepository(engine).load();

    expect(state.projects).toHaveLength(1);
    expect(activeProducts(state.projects[0].products).length).toBeGreaterThan(0);
    expect(() => JSON.parse(engine.get(STATE_KEY)!)).not.toThrow();
  });

  it('a v1 blob with no projects falls through to the demo seed', () => {
    const engine = createMemoryEngine({
      [STATE_KEY]: JSON.stringify({ schemaVersion: 1, projects: [] }),
    });

    expect(createRepository(engine).load().projects).toHaveLength(1);
  });

  it('a repairable payload is sanitized, written back, and stamped with the envelope', () => {
    const engine = createMemoryEngine({
      [STATE_KEY]: JSON.stringify({
        schemaVersion: 1,
        activeProjectId: 'proj',
        projects: [
          {
            id: 'proj',
            name: 'Legacy-shaped',
            currency: 'USD',
            products: [{ id: 'p1', name: 'No envelope' }],
          },
        ],
      }),
    });

    const state = createRepository(engine).load();
    const product = state.projects[0].products[0];

    expect(product.schemaVersion).toBe(1);
    expect(product.category).toBe('other');
    expect(product.deleted).toBe(false);
    expect(state.ui.activeProductId).toBe('p1');

    const writtenBack = JSON.parse(engine.get(STATE_KEY)!);
    expect(writtenBack.projects[0].products[0].schemaVersion).toBe(1);
  });
});

describe('restoreBackup — merge semantics (BACKUP_CONFLICT) and safety', () => {
  it('incoming project wins when strictly newer, unknown projects append, local stays', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    const local = repo.load();
    const localProject = local.projects[0];

    const newerProject = {
      ...localProject,
      name: 'Incoming Newer',
      updatedAt: '2099-01-01T00:00:00.000Z',
    };
    const extraProject = createProject({ name: 'Imported Extra' });

    const restored = repo.restoreBackup(
      serializeBackup({
        schemaVersion: 1,
        activeProjectId: extraProject.id,
        projects: [newerProject, extraProject],
        ui: local.ui,
      })
    );

    expect(restored.projects).toHaveLength(2);
    expect(findProject(restored, localProject.id)!.name).toBe('Incoming Newer');
    expect(restored.projects[1].id).toBe(extraProject.id);
    // The backup's own active project is activated after the merge.
    expect(restored.activeProjectId).toBe(extraProject.id);
  });

  it('a clean-profile restore activates the backup\u2019s project (visible without a switcher)', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    const local = repo.load(); // fresh demo profile

    const importedProject = createProject({
      name: 'Restored Project',
      products: [createProduct({ name: 'Restored Product' })],
    });

    const restored = repo.restoreBackup(
      serializeBackup({
        schemaVersion: 1,
        activeProjectId: importedProject.id,
        projects: [importedProject],
        ui: local.ui,
      })
    );

    expect(restored.activeProjectId).toBe(importedProject.id);
    expect(findProject(restored, importedProject.id)!.name).toBe('Restored Project');
    // The active product follows the newly activated project.
    expect(restored.ui.activeProductId).toBe(importedProject.products[0].id);
  });

  it('older/equal local data is kept', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    const local = repo.load();
    const localProject = local.projects[0];

    const restored = repo.restoreBackup(
      serializeBackup({
        schemaVersion: 1,
        activeProjectId: localProject.id,
        projects: [
          { ...localProject, name: 'Older Incoming', updatedAt: '2000-01-01T00:00:00.000Z' },
        ],
        ui: local.ui,
      })
    );

    expect(findProject(restored, localProject.id)!.name).toBe(localProject.name);
  });

  it('malformed backups throw and leave stored state untouched', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    repo.load();
    const before = engine.get(STATE_KEY);

    expect(() => repo.restoreBackup('definitely not a backup')).toThrow();
    expect(engine.get(STATE_KEY)).toBe(before);
  });
});

describe('tombstones survive reload (CAP-5)', () => {
  it('a deleted product stays stored as a tombstone and is hidden from the active list', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);
    const state = repo.load();
    const project = state.projects[0];
    const target = activeProducts(project.products)[0];

    repo.save({
      ...state,
      projects: upsertProject(state.projects, {
        ...project,
        products: project.products.map((p) => (p.id === target.id ? deleteProduct(p) : p)),
        updatedAt: new Date().toISOString(),
      }),
    });

    const reloaded = createRepository(engine).load();
    const stored = findProject(reloaded, project.id)!.products;

    // Still physically present…
    expect(stored.some((p) => p.id === target.id)).toBe(true);
    const tombstone = stored.find((p) => p.id === target.id)!;
    expect(tombstone.deleted).toBe(true);
    expect(tombstone.deletedAt).toBeTruthy();
    // …but hidden from the UI-facing list.
    expect(activeProducts(stored).some((p) => p.id === target.id)).toBe(false);
  });
});

describe('language stays repository-owned', () => {
  it('setLanguage persists into the state blob and survives a reload', () => {
    const engine = createMemoryEngine();
    const repo = createRepository(engine);

    expect(repo.getLanguage()).toBe('en');
    repo.setLanguage('ar');

    expect(createRepository(engine).getLanguage()).toBe('ar');
    expect(JSON.parse(engine.get(STATE_KEY)!).ui.language).toBe('ar');
  });
});
