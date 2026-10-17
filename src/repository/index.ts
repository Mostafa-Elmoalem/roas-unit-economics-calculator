// The single owner of browser storage for app state and language (AD-5, CAP-8).
// Everything else talks to this repository; the storage engine behind it is injectable.
import {
  createProject,
  DEFAULT_PROJECT_NAME,
  generateId,
  hasLegacyState,
  isTelemetryEvent,
  isTelemetrySnapshot,
  mergeProjects,
  migrateLegacyState,
  parseBackup,
  sanitizeAppState,
  type AppState,
  type Language,
  type LegacyRawState,
  type Product,
  type Project,
  type TelemetryItem,
} from '@shared';
import { createDemoProducts } from '../lib/mockData';
import { createBrowserEngine, type StorageEngine } from './engine';
import { DEVICE_ID_KEY, LEGACY_STORAGE_KEYS, STATE_KEY, TELEMETRY_QUEUE_KEY } from './keys';

export { createBrowserEngine, createMemoryEngine } from './engine';
export type { StorageEngine } from './engine';
export { DEVICE_ID_KEY, LEGACY_STORAGE_KEYS, STATE_KEY, TELEMETRY_QUEUE_KEY } from './keys';

export interface Repository {
  /** Session -> local read, migrate-on-load, demo fallback. */
  load(): AppState;
  /** Synchronous dual-write of the whole state. */
  save(state: AppState): void;
  /** Re-write the last known state (beforeunload / pagehide / visibilitychange). */
  flush(): void;
  getLanguage(): Language;
  setLanguage(language: Language): void;
  /** Fresh demo state (new project id, fresh product ids). */
  createDemoState(): AppState;
  /** Parse, merge (LWW by id), persist, and return the restored state. Throws on malformed input. */
  restoreBackup(text: string): AppState;
  /** Read the stable anonymous deviceId, minting and persisting one on first use (CAP-12). */
  ensureDeviceId(): string;
  /** Queued telemetry items, oldest first. Never pruned or auto-deleted (C12). */
  getTelemetryQueue(): TelemetryItem[];
  /** Persist the queue as-is; trimming only ever happens after a successful send. */
  saveTelemetryQueue(items: TelemetryItem[]): void;
}

export function createDemoState(): AppState {
  const products = createDemoProducts();
  const project = createProject({
    name: DEFAULT_PROJECT_NAME,
    currency: 'USD',
    products,
  });

  return {
    schemaVersion: project.schemaVersion,
    activeProjectId: project.id,
    projects: [project],
    ui: {
      theme: 'system',
      language: 'en',
      view: 'dashboard',
      activeProductId: products[0]?.id ?? null,
      comparedProductIds: products.slice(0, 3).map((p) => p.id),
    },
  };
}

function readLegacyRaw(engine: StorageEngine): LegacyRawState {
  return {
    projectName: engine.get(LEGACY_STORAGE_KEYS.PROJECT_NAME),
    currency: engine.get(LEGACY_STORAGE_KEYS.CURRENCY),
    products: engine.get(LEGACY_STORAGE_KEYS.PRODUCTS),
    activeProductId: engine.get(LEGACY_STORAGE_KEYS.ACTIVE_PRODUCT_ID),
    view: engine.get(LEGACY_STORAGE_KEYS.VIEW),
    theme: engine.get(LEGACY_STORAGE_KEYS.THEME),
    comparedProductIds: engine.get(LEGACY_STORAGE_KEYS.COMPARED_PRODUCT_IDS),
    language: engine.get(LEGACY_STORAGE_KEYS.LANGUAGE),
  };
}

function visibleProducts(project: Project | undefined): Product[] {
  return project ? project.products.filter((p) => !p.deleted) : [];
}

export function createRepository(engine: StorageEngine): Repository {
  let cached: AppState | null = null;
  let cachedDeviceId: string | null = null;
  let cachedQueue: TelemetryItem[] | null = null;

  function persist(state: AppState): void {
    cached = state;
    engine.set(STATE_KEY, JSON.stringify(state));
  }

  function load(): AppState {
    if (cached) return cached;

    // 1. Current v1 state (session first, then local) — repaired/migrated on load.
    const storedRaw = engine.get(STATE_KEY);
    if (storedRaw) {
      try {
        const parsed = JSON.parse(storedRaw) as unknown;
        const sanitized = sanitizeAppState(parsed);
        if (sanitized) {
          cached = sanitized;
          if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
            engine.set(STATE_KEY, JSON.stringify(sanitized));
          }
          return cached;
        }
      } catch {
        // corrupt payload — fall through to legacy / demo
      }
    }

    // 2. Today's flat legacy keys — migrate non-destructively (keys stay on disk).
    const legacy = readLegacyRaw(engine);
    if (hasLegacyState(legacy)) {
      const migrated = migrateLegacyState(legacy, createDemoProducts());
      persist(migrated);
      return migrated;
    }

    // 3. Clean browser — seed the demo project (CLEAN_BROWSER).
    const demo = createDemoState();
    persist(demo);
    return demo;
  }

  function flush(): void {
    const state = cached ?? load();
    engine.set(STATE_KEY, JSON.stringify(state));
    cached = state;
    if (cachedDeviceId) engine.set(DEVICE_ID_KEY, cachedDeviceId);
    if (cachedQueue) engine.set(TELEMETRY_QUEUE_KEY, JSON.stringify(cachedQueue));
  }

  function setLanguage(language: Language): void {
    const state = load();
    if (state.ui.language === language) return;
    persist({ ...state, ui: { ...state.ui, language } });
  }

  function restoreBackup(text: string): AppState {
    const backup = parseBackup(text); // throws on malformed input; state untouched
    const current = load();

    const projects = mergeProjects(current.projects, backup.projects);

    // Activate the backup's own project when it exists after the merge, so a
    // clean-profile restore is visible (no project switcher this phase);
    // fallbacks: current active project, then the first merged project.
    let activeProjectId: string | null = null;
    if (backup.activeProjectId && projects.some((p) => p.id === backup.activeProjectId)) {
      activeProjectId = backup.activeProjectId;
    } else if (current.activeProjectId && projects.some((p) => p.id === current.activeProjectId)) {
      activeProjectId = current.activeProjectId;
    } else {
      activeProjectId = projects[0]?.id ?? null;
    }

    const activeProject = projects.find((p) => p.id === activeProjectId);
    const visible = visibleProducts(activeProject);
    const activeProductId = visible.some((p) => p.id === current.ui.activeProductId)
      ? current.ui.activeProductId
      : visible[0]?.id ?? null;

    const state: AppState = {
      ...current,
      activeProjectId,
      projects,
      ui: {
        ...current.ui,
        activeProductId,
        comparedProductIds: current.ui.comparedProductIds.filter((id) =>
          visible.some((p) => p.id === id)
        ),
      },
    };

    persist(state);
    return state;
  }

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function ensureDeviceId(): string {
    if (cachedDeviceId) return cachedDeviceId;

    const existing = engine.get(DEVICE_ID_KEY);
    if (existing && UUID_REGEX.test(existing.trim())) {
      const valid = existing.trim();
      cachedDeviceId = valid;
      return valid;
    }

    const minted = generateId();
    cachedDeviceId = minted;
    engine.set(DEVICE_ID_KEY, minted);
    return minted;
  }

  function getTelemetryQueue(): TelemetryItem[] {
    if (cachedQueue) return cachedQueue;

    let items: TelemetryItem[] = [];
    const raw = engine.get(TELEMETRY_QUEUE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          items = parsed.filter(
            (entry): entry is TelemetryItem => isTelemetryEvent(entry) || isTelemetrySnapshot(entry)
          );
        }
      } catch {
        // Unreadable queue reads as empty; the raw value stays untouched until a save replaces it.
      }
    }

    cachedQueue = items;
    return items;
  }

  function saveTelemetryQueue(items: TelemetryItem[]): void {
    cachedQueue = items;
    engine.set(TELEMETRY_QUEUE_KEY, JSON.stringify(items));
  }

  return {
    load,
    save: persist,
    flush,
    getLanguage: () => load().ui.language,
    setLanguage,
    createDemoState,
    restoreBackup,
    ensureDeviceId,
    getTelemetryQueue,
    saveTelemetryQueue,
  };
}

/** App-wide singleton backed by the browser dual-storage engine. */
export const repository: Repository = createRepository(createBrowserEngine());
