// Forward-only, idempotent migration runner (AD-11/22). Migrations are plain .sql
// files named `<version>_<name>.sql`, applied in ascending version order inside a
// transaction each, and recorded in `schema_migrations`. Already-applied versions
// are skipped, so startup is safe to repeat.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface MigrationClient {
  query(
    text: string,
    values?: unknown[]
  ): Promise<{ rowCount: number | null; rows: Array<Record<string, unknown>> }>;
}

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/** Default migrations directory: `sql/` next to the (bundled) migrate module. */
export const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL('./sql/', import.meta.url));

const MIGRATION_FILE = /^(\d+)_(.+)\.sql$/;

export function loadMigrations(dir: string = DEFAULT_MIGRATIONS_DIR): Migration[] {
  return readdirSync(dir)
    .filter((file) => MIGRATION_FILE.test(file))
    .map((file) => {
      const match = MIGRATION_FILE.exec(file) as RegExpExecArray;
      return {
        version: Number(match[1]),
        name: file,
        sql: readFileSync(join(dir, file), 'utf8'),
      };
    })
    .sort((a, b) => a.version - b.version);
}

const CREATE_MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS schema_migrations (
  version    integer PRIMARY KEY,
  name       text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;

export async function runMigrations(
  client: MigrationClient,
  dir: string = DEFAULT_MIGRATIONS_DIR
): Promise<number[]> {
  await client.query(CREATE_MIGRATIONS_TABLE);

  const appliedResult = await client.query('SELECT version FROM schema_migrations');
  const applied = new Set(appliedResult.rows.map((row) => Number(row.version)));

  const appliedNow: number[] = [];
  for (const migration of loadMigrations(dir)) {
    if (applied.has(migration.version)) continue;

    await client.query('BEGIN');
    try {
      await client.query(migration.sql);
      await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
        migration.version,
        migration.name,
      ]);
      await client.query('COMMIT');
      appliedNow.push(migration.version);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  return appliedNow;
}
