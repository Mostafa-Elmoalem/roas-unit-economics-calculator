// Guard test (CAP-8): no code outside `src/repository/` may touch browser
// storage APIs. Scans every source file under `src/` and `shared/` (both are
// compiled into the app) with a case-sensitive match on the exact API names
// (so prose like "local storage" or the legacy "LocalStorage" UI string never
// trips it).
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORKSPACE_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SRC_DIR = fileURLToPath(new URL('..', import.meta.url));
const SHARED_DIR = fileURLToPath(new URL('../../shared/src/', import.meta.url));
const REPOSITORY_DIR = fileURLToPath(new URL('.', import.meta.url));

const FORBIDDEN_STORAGE_API = /\b(localStorage|sessionStorage|indexedDB)\b/;
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('storage ownership guard', () => {
  it('no localStorage/sessionStorage/indexedDB reference exists outside src/repository/', () => {
    const offenders: string[] = [];

    const files = [...listSourceFiles(SRC_DIR), ...listSourceFiles(SHARED_DIR)];
    for (const file of files) {
      if (file.startsWith(REPOSITORY_DIR)) continue;
      const content = readFileSync(file, 'utf8');
      if (FORBIDDEN_STORAGE_API.test(content)) {
        offenders.push(relative(WORKSPACE_ROOT, file));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('the scan actually covers app and shared sources (sanity check)', () => {
    const scanned = [...listSourceFiles(SRC_DIR), ...listSourceFiles(SHARED_DIR)].filter(
      (f) => !f.startsWith(REPOSITORY_DIR)
    );
    expect(scanned.length).toBeGreaterThan(10);
    expect(scanned.some((f) => f.endsWith(join('context', 'AppContext.tsx')))).toBe(true);
    expect(scanned.some((f) => f.endsWith(join('shared', 'src', 'migrations.ts')))).toBe(true);
  });
});
