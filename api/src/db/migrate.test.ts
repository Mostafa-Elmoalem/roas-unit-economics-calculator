import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_MIGRATIONS_DIR, loadMigrations, runMigrations, type MigrationClient } from './migrate';

const tempDirs: string[] = [];

function makeTempMigrations(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'trueroas-migrations-'));
  tempDirs.push(dir);
  for (const [name, sql] of Object.entries(files)) {
    writeFileSync(join(dir, name), sql);
  }
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

class FakeClient implements MigrationClient {
  queries: string[] = [];
  appliedVersions: number[] = [];
  failOn: string | null = null;

  async query(
    text: string,
    values?: unknown[]
  ): Promise<{ rowCount: number | null; rows: Array<Record<string, unknown>> }> {
    this.queries.push(text);
    if (this.failOn && text.includes(this.failOn)) throw new Error('migration failed');
    if (text.startsWith('SELECT version')) {
      return {
        rowCount: this.appliedVersions.length,
        rows: this.appliedVersions.map((version) => ({ version })),
      };
    }
    if (text.startsWith('INSERT INTO schema_migrations')) {
      this.appliedVersions.push(Number(values?.[0]));
      return { rowCount: 1, rows: [] };
    }
    return { rowCount: null, rows: [] };
  }
}

describe('loadMigrations', () => {
  it('loads the real migration set ascending, starting at 001_init', () => {
    const migrations = loadMigrations(DEFAULT_MIGRATIONS_DIR);

    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations[0].version).toBe(1);
    expect(migrations[0].name).toBe('001_init.sql');
    expect(migrations[0].sql).toContain('usage_events');
    expect(migrations[0].sql).toContain('snapshots');
    expect(migrations[0].sql).toContain('snapshot_products');

    const versions = migrations.map((migration) => migration.version);
    expect(versions).toEqual([...versions].sort((a, b) => a - b));
  });

  it('sorts out-of-order files by version and ignores non-migration files', () => {
    const dir = makeTempMigrations({
      '002_second.sql': 'CREATE TABLE beta();',
      '010_tenth.sql': 'CREATE TABLE gamma();',
      '001_first.sql': 'CREATE TABLE alpha();',
      'notes.txt': 'not a migration',
      'abc.sql': 'not a migration',
    });

    expect(loadMigrations(dir).map((migration) => [migration.version, migration.name])).toEqual([
      [1, '001_first.sql'],
      [2, '002_second.sql'],
      [10, '010_tenth.sql'],
    ]);
  });
});

describe('runMigrations', () => {
  it('applies pending migrations in ascending order inside transactions and records them', async () => {
    const dir = makeTempMigrations({
      '002_b.sql': 'CREATE TABLE beta();',
      '001_a.sql': 'CREATE TABLE alpha();',
    });
    const client = new FakeClient();

    const applied = await runMigrations(client, dir);

    expect(applied).toEqual([1, 2]);
    expect(client.appliedVersions).toEqual([1, 2]);
    expect(client.queries[0]).toContain('schema_migrations');

    const alphaIndex = client.queries.findIndex((query) => query.includes('CREATE TABLE alpha'));
    const betaIndex = client.queries.findIndex((query) => query.includes('CREATE TABLE beta'));
    expect(alphaIndex).toBeGreaterThan(-1);
    expect(alphaIndex).toBeLessThan(betaIndex);

    expect(client.queries.filter((query) => query === 'BEGIN')).toHaveLength(2);
    expect(client.queries.filter((query) => query === 'COMMIT')).toHaveLength(2);
  });

  it('is idempotent: already-recorded versions are skipped on the next run', async () => {
    const dir = makeTempMigrations({ '001_a.sql': 'CREATE TABLE alpha();' });
    const client = new FakeClient();

    expect(await runMigrations(client, dir)).toEqual([1]);
    const rerun = await runMigrations(client, dir);

    expect(rerun).toEqual([]);
    expect(client.queries.filter((query) => query.includes('CREATE TABLE alpha'))).toHaveLength(1);
  });

  it('rolls back a failing migration and rethrows', async () => {
    const dir = makeTempMigrations({
      '001_a.sql': 'CREATE TABLE alpha();',
      '002_b.sql': 'BOOM();',
    });
    const client = new FakeClient();
    client.failOn = 'BOOM';

    await expect(runMigrations(client, dir)).rejects.toThrow('migration failed');

    expect(client.appliedVersions).toEqual([1]);
    expect(client.queries.filter((query) => query === 'ROLLBACK')).toHaveLength(1);
  });

  it('dist/sql migrations match source migrations when dist exists', () => {
    const distDir = join(import.meta.dirname, '../../dist/sql');
    if (existsSync(distDir)) {
      const distMigrations = loadMigrations(distDir);
      const srcMigrations = loadMigrations(DEFAULT_MIGRATIONS_DIR);
      expect(distMigrations.map((m) => m.name)).toEqual(srcMigrations.map((m) => m.name));
    }
  });
});
