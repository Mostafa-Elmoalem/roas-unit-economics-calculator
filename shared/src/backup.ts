// Full-fidelity JSON backup/restore (AD-7, CAP-10). Pure module.
import { SCHEMA_VERSION, type AppState, type BackupPayload, type Project } from './types';
import { sanitizeProject } from './migrations';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Serialize the whole state into a versioned backup payload string (device prefs excluded). */
export function serializeBackup(state: AppState): string {
  const payload: BackupPayload = {
    app: 'trueroas',
    kind: 'backup',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    activeProjectId: state.activeProjectId,
    projects: state.projects,
  };
  return JSON.stringify(payload, null, 2);
}

/** Parse and validate a backup file; throws a descriptive Error when malformed. */
export function parseBackup(text: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Backup file is not valid JSON');
  }

  if (!isRecord(parsed)) throw new Error('Backup file is not a TrueROAS backup');
  if (parsed.app !== 'trueroas') throw new Error('Unsupported backup app');
  if (parsed.kind !== 'backup') throw new Error('Unsupported backup kind');

  if (typeof parsed.schemaVersion !== 'number' || !Number.isFinite(parsed.schemaVersion)) {
    throw new Error('Backup is missing a valid schemaVersion');
  }
  if (parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error('Backup was created by a newer version of the app');
  }
  if (!Array.isArray(parsed.projects) || parsed.projects.length === 0) {
    throw new Error('Backup contains no projects');
  }

  const projects: Project[] = parsed.projects.map((rawProject) => {
    const project = sanitizeProject(rawProject, { requireId: true });
    if (!project) throw new Error('Backup contains a malformed project');
    // sanitizeProject silently drops unusable products (non-records, missing ids);
    // a backup must be rejected instead, mirroring the project-level check above.
    const rawProducts =
      isRecord(rawProject) && Array.isArray(rawProject.products) ? rawProject.products : [];
    if (project.products.length !== rawProducts.length) {
      throw new Error('Backup contains a malformed product');
    }
    return project;
  });

  const activeProjectId =
    typeof parsed.activeProjectId === 'string' &&
    projects.some((p) => p.id === parsed.activeProjectId)
      ? parsed.activeProjectId
      : projects[0].id;

  return {
    app: 'trueroas',
    kind: 'backup',
    schemaVersion: parsed.schemaVersion,
    exportedAt:
      typeof parsed.exportedAt === 'string' && !Number.isNaN(Date.parse(parsed.exportedAt))
        ? parsed.exportedAt
        : new Date().toISOString(),
    activeProjectId,
    projects,
  };
}

function isStrictlyNewer(incoming: string, local: string): boolean {
  const incomingTime = Date.parse(incoming);
  const localTime = Date.parse(local);
  if (Number.isNaN(incomingTime) || Number.isNaN(localTime)) return false;
  return incomingTime > localTime;
}

/**
 * Merge restored projects into local ones, last-write-wins on `updatedAt`:
 * a strictly newer incoming copy wins — including a strictly newer tombstone —
 * unknown incoming ids are appended, and local entries are kept whenever no
 * strictly newer incoming counterpart exists.
 */
export function mergeProjects(local: Project[], incoming: Project[]): Project[] {
  const merged = [...local];
  const indexById = new Map(merged.map((p, i) => [p.id, i]));

  for (const incomingProject of incoming) {
    const index = indexById.get(incomingProject.id);
    if (index === undefined) {
      indexById.set(incomingProject.id, merged.length);
      merged.push(incomingProject);
    } else if (isStrictlyNewer(incomingProject.updatedAt, merged[index].updatedAt)) {
      merged[index] = incomingProject;
    }
  }

  return merged;
}
