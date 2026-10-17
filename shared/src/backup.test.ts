import { describe, expect, it } from 'vitest';
import { mergeProjects, parseBackup, serializeBackup } from './backup';
import { createFixedCostItem, createProduct, createProject } from './operations';
import { SCHEMA_VERSION } from './types';
import type { AppState, Project } from './types';

const makeState = (projectOverrides: Partial<Project> = {}, exportedActive?: string | null): AppState => {
  const product = createProduct({
    name: 'Backup Product',
    category: 'home_kitchen',
    sellingPrice: 80,
    cogs: 25,
    fixedCosts: [createFixedCostItem('Studio', 750)],
  });
  const project = createProject({
    name: 'Backup Project',
    currency: 'EUR',
    products: [product],
    ...projectOverrides,
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    activeProjectId: exportedActive === undefined ? project.id : exportedActive,
    projects: [project],
    ui: {
      theme: 'dark',
      language: 'ar',
      view: 'calculator',
      activeProductId: product.id,
      comparedProductIds: [product.id],
    },
  };
};

describe('serializeBackup', () => {
  it('writes a versioned payload without device prefs', () => {
    const state = makeState();
    const payload = JSON.parse(serializeBackup(state));

    expect(payload.app).toBe('trueroas');
    expect(payload.kind).toBe('backup');
    expect(payload.schemaVersion).toBe(SCHEMA_VERSION);
    expect(typeof payload.exportedAt).toBe('string');
    expect(payload.projects).toHaveLength(1);
    expect(payload).not.toHaveProperty('ui'); // theme/language are device prefs, not project content
  });
});

describe('backup round-trip (BACKUP_ROUNDTRIP)', () => {
  it('restores project content semantically identical, and a re-export is equal', () => {
    const state = makeState();

    const parsed = parseBackup(serializeBackup(state));
    expect(parsed.projects).toEqual(state.projects);
    expect(parsed.activeProjectId).toBe(state.activeProjectId);

    // Actually re-serialize the parsed payload and compare (projects + activeProjectId).
    const reSerialized = serializeBackup({
      ...state,
      activeProjectId: parsed.activeProjectId,
      projects: parsed.projects,
    });
    const reParsed = parseBackup(reSerialized);
    expect(reParsed.projects).toEqual(parsed.projects);
    expect(reParsed.activeProjectId).toBe(parsed.activeProjectId);
  });

  it('preserves products, fixed costs, categories and currency exactly', () => {
    const parsed = parseBackup(serializeBackup(makeState()));
    const project = parsed.projects[0];
    const product = project.products[0];

    expect(project.name).toBe('Backup Project');
    expect(project.currency).toBe('EUR');
    expect(product.category).toBe('home_kitchen');
    expect(product.fixedCosts).toEqual([
      { id: expect.any(String), name: 'Studio', amount: 750 },
    ]);
  });
});

describe('malformed backup rejection (MALFORMED_BACKUP)', () => {
  it('rejects invalid JSON', () => {
    expect(() => parseBackup('not json at all')).toThrow(/not valid JSON/i);
  });

  it('rejects wrong app / kind / missing fields', () => {
    expect(() => parseBackup('{}')).toThrow(/app/i);
    expect(() => parseBackup(JSON.stringify({ app: 'other', kind: 'backup', schemaVersion: 1, projects: [{}] }))).toThrow(/app/i);
    expect(() => parseBackup(JSON.stringify({ app: 'trueroas', kind: 'export', schemaVersion: 1, projects: [{}] }))).toThrow(/kind/i);
    expect(() => parseBackup(JSON.stringify({ app: 'trueroas', kind: 'backup', projects: [{}] }))).toThrow(/schemaVersion/i);
    expect(() => parseBackup(JSON.stringify({ app: 'trueroas', kind: 'backup', schemaVersion: 1 }))).toThrow(/no projects/i);
    expect(() => parseBackup(JSON.stringify({ app: 'trueroas', kind: 'backup', schemaVersion: 1, projects: [] }))).toThrow(/no projects/i);
  });

  it('rejects backups from a newer schema and malformed projects', () => {
    const newer = { app: 'trueroas', kind: 'backup', schemaVersion: SCHEMA_VERSION + 1, projects: [{}] };
    expect(() => parseBackup(JSON.stringify(newer))).toThrow(/newer version/i);

    const missingId = { app: 'trueroas', kind: 'backup', schemaVersion: 1, projects: [{ name: 'no id' }] };
    expect(() => parseBackup(JSON.stringify(missingId))).toThrow(/malformed project/i);
  });

  it('rejects backups containing products without a usable id or non-object products', () => {
    const idlessProduct = {
      app: 'trueroas',
      kind: 'backup',
      schemaVersion: 1,
      projects: [{ id: 'p1', name: 'P', products: [{ name: 'No id' }] }],
    };
    expect(() => parseBackup(JSON.stringify(idlessProduct))).toThrow(/malformed product/i);

    const junkProduct = {
      app: 'trueroas',
      kind: 'backup',
      schemaVersion: 1,
      projects: [{ id: 'p1', name: 'P', products: [{ id: 'ok', name: 'Ok' }, 'junk'] }],
    };
    expect(() => parseBackup(JSON.stringify(junkProduct))).toThrow(/malformed product/i);
  });
});

describe('mergeProjects (BACKUP_CONFLICT)', () => {
  const local = createProject({
    id: 'p-same',
    name: 'Local',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  it('incoming wins only when strictly newer', () => {
    const newer = { ...local, name: 'Incoming', updatedAt: '2026-02-01T00:00:00.000Z' };
    expect(mergeProjects([local], [newer])[0].name).toBe('Incoming');

    const older = { ...local, name: 'Older', updatedAt: '2025-12-01T00:00:00.000Z' };
    expect(mergeProjects([local], [older])[0].name).toBe('Local');

    const equal = { ...local, name: 'Equal', updatedAt: local.updatedAt };
    expect(mergeProjects([local], [equal])[0].name).toBe('Local');
  });

  it('appends unknown ids and never removes local data', () => {
    const extra = createProject({ id: 'p-new', name: 'Extra' });
    const merged = mergeProjects([local], [extra]);

    expect(merged.map((p) => p.id)).toEqual(['p-same', 'p-new']);
    expect(mergeProjects([local], [])).toEqual([local]);
  });

  it('a project without updatedAt never beats a local copy (epoch fallback)', () => {
    const timestampLess = {
      app: 'trueroas',
      kind: 'backup',
      schemaVersion: 1,
      activeProjectId: 'p-same',
      projects: [{ id: 'p-same', name: 'Timestamp-less', products: [] }],
    };
    const incoming = parseBackup(JSON.stringify(timestampLess)).projects[0];

    expect(incoming.updatedAt).toBe(new Date(0).toISOString());
    expect(mergeProjects([local], [incoming])[0].name).toBe('Local');
  });
});
