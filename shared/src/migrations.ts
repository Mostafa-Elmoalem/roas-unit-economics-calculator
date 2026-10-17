// Pure schema migration + payload sanitization (CAP-5).
// v0 = today's flat `roas_calc_*` keys; v1 = one AppState blob under `trueroas_v1_state`.
import {
  CURRENCIES,
  DEFAULT_PROJECT_NAME,
  SCHEMA_VERSION,
  THEME_MODES,
  VIEW_MODES,
  type AppState,
  type AppStateUi,
  type Currency,
  type FixedCostItem,
  type Language,
  type Product,
  type Project,
  type ThemeMode,
  type ViewMode,
} from './types';
import { createProject, generateId, matchCategory } from './operations';

/** Legacy v0 storage keys — never written to, only read once during migration. */
export const LEGACY_STORAGE_KEYS = {
  PROJECT_NAME: 'roas_calc_project_name',
  CURRENCY: 'roas_calc_currency',
  PRODUCTS: 'roas_calc_products',
  ACTIVE_PRODUCT_ID: 'roas_calc_active_id',
  VIEW: 'roas_calc_view',
  THEME: 'roas_calc_theme',
  COMPARED_PRODUCT_IDS: 'roas_calc_compared_ids',
  LANGUAGE: 'roas_calc_language',
} as const;

/** Raw (still-serialized) legacy values as read from the storage engine. */
export interface LegacyRawState {
  projectName?: string | null;
  currency?: string | null;
  products?: string | null;
  activeProductId?: string | null;
  view?: string | null;
  theme?: string | null;
  comparedProductIds?: string | null;
  language?: string | null;
}

export function hasLegacyState(raw: LegacyRawState): boolean {
  return Object.values(raw).some((v) => v !== null && v !== undefined && v !== '');
}

export interface SanitizeOptions {
  /** Regenerate entity ids instead of preserving them (v0→v1 migration). */
  regenerateIds?: boolean;
  /** Reject entities without a usable id (backup restore) instead of generating one. */
  requireId?: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Fallback for missing/malformed `updatedAt`: epoch keeps stale data from winning LWW merges. */
const EPOCH_ISO = new Date(0).toISOString();

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function toIsoOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

function parseJsonValue(raw: string | null | undefined): unknown {
  if (raw === null || raw === undefined || raw === '') return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function toCurrency(value: unknown): Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)
    ? (value as Currency)
    : 'USD';
}

function toView(value: unknown): ViewMode {
  return typeof value === 'string' && (VIEW_MODES as readonly string[]).includes(value)
    ? (value as ViewMode)
    : 'dashboard';
}

function toTheme(value: unknown): ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value)
    ? (value as ThemeMode)
    : 'system';
}

function toLanguage(value: unknown): Language {
  if (value === 'en' || value === 'ar') return value;
  // Legacy language key was a raw (unquoted) string; accept a JSON-quoted copy too.
  if (typeof value === 'string') {
    const parsed = parseJsonValue(value);
    if (parsed === 'en' || parsed === 'ar') return parsed;
  }
  return 'en';
}

function sanitizeFixedCosts(raw: unknown, options: SanitizeOptions): FixedCostItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecord).map((item) => ({
    id: options.regenerateIds ? generateId() : toNonEmptyString(item.id) ?? generateId(),
    name: toNonEmptyString(item.name) ?? 'Overhead',
    amount: toNumber(item.amount, 0),
  }));
}

/** Sanitize/normalize one product into the v1 envelope; null when not a record. */
export function sanitizeProduct(raw: unknown, options: SanitizeOptions = {}): Product | null {
  if (!isRecord(raw)) return null;
  const now = new Date().toISOString();

  const id = options.regenerateIds ? undefined : toNonEmptyString(raw.id);
  if (id === undefined && options.requireId) return null;

  const units = Math.max(1, Math.round(toNumber(raw.units, 500)));
  const adSpendPerUnit = Math.max(0, toNumber(raw.adSpendPerUnit, 15));
  const totalAdSpend = Math.max(0, toNumber(raw.totalAdSpend, adSpendPerUnit * units));
  const shippingMode = raw.shippingMode === 'flat' || raw.shippingMode === 'subsidized'
    ? raw.shippingMode
    : undefined;

  const deleted = raw.deleted === true;
  const deletedAt = toNonEmptyString(raw.deletedAt);

  return {
    id: id ?? generateId(),
    name: toNonEmptyString(raw.name) ?? 'Untitled Product',
    sku: toNonEmptyString(raw.sku),
    category: matchCategory(raw.category),
    sellingPrice: Math.max(0, toNumber(raw.sellingPrice, 50)),
    cogs: Math.max(0, toNumber(raw.cogs, 15)),
    units,
    shippingPerUnit: Math.max(0, toNumber(raw.shippingPerUnit, 5)),
    shippingMode,
    courierShippingCost:
      raw.courierShippingCost === undefined ? undefined : Math.max(0, toNumber(raw.courierShippingCost, 0)),
    customerShippingFee:
      raw.customerShippingFee === undefined ? undefined : Math.max(0, toNumber(raw.customerShippingFee, 0)),
    fulfillmentRate: Math.min(100, Math.max(0, toNumber(raw.fulfillmentRate, 80))),
    adSpendPerUnit,
    totalAdSpend,
    adSpendMode: raw.adSpendMode === 'total' ? 'total' : 'per-unit',
    fixedCosts: sanitizeFixedCosts(raw.fixedCosts, options),
    createdAt: toIsoOr(raw.createdAt, now),
    updatedAt: toIsoOr(raw.updatedAt, EPOCH_ISO),
    schemaVersion: SCHEMA_VERSION,
    deleted,
    ...(deleted && deletedAt ? { deletedAt } : {}),
  };
}

/** Sanitize/normalize one project into the v1 envelope; null when not a record. */
export function sanitizeProject(raw: unknown, options: SanitizeOptions = {}): Project | null {
  if (!isRecord(raw)) return null;
  const now = new Date().toISOString();

  const id = options.regenerateIds ? undefined : toNonEmptyString(raw.id);
  if (id === undefined && options.requireId) return null;

  const products = Array.isArray(raw.products)
    ? raw.products
        .map((p) => sanitizeProduct(p, options))
        .filter((p): p is Product => p !== null)
    : [];

  const deleted = raw.deleted === true;
  const deletedAt = toNonEmptyString(raw.deletedAt);

  return {
    id: id ?? generateId(),
    name: toNonEmptyString(raw.name) ?? DEFAULT_PROJECT_NAME,
    currency: toCurrency(raw.currency),
    products,
    settings: isRecord(raw.settings) ? raw.settings : {},
    createdAt: toIsoOr(raw.createdAt, now),
    updatedAt: toIsoOr(raw.updatedAt, EPOCH_ISO),
    schemaVersion: SCHEMA_VERSION,
    deleted,
    ...(deleted && deletedAt ? { deletedAt } : {}),
  };
}

function sanitizeUi(raw: unknown, project: Project): AppStateUi {
  const ui = isRecord(raw) ? raw : {};
  const visible = project.products.filter((p) => !p.deleted);

  let activeProductId =
    typeof ui.activeProductId === 'string' && visible.some((p) => p.id === ui.activeProductId)
      ? ui.activeProductId
      : null;
  if (activeProductId === null) activeProductId = visible[0]?.id ?? null;

  // An intentionally empty comparison list is trusted; only a missing/unusable
  // value falls back to the first three products (former lazy-init behavior).
  const comparedProductIds = Array.isArray(ui.comparedProductIds)
    ? ui.comparedProductIds.filter(
        (id): id is string => typeof id === 'string' && visible.some((p) => p.id === id)
      )
    : visible.slice(0, 3).map((p) => p.id);

  return {
    theme: toTheme(ui.theme),
    language: toLanguage(ui.language),
    view: toView(ui.view),
    activeProductId,
    comparedProductIds,
  };
}

/** Validate/repair a stored v1 state blob; null when unusable (fall back to legacy/demo). */
export function sanitizeAppState(raw: unknown): AppState | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.projects)) return null;

  const projects = raw.projects
    .map((p) => sanitizeProject(p))
    .filter((p): p is Project => p !== null);
  if (projects.length === 0) return null;

  let activeProjectId =
    typeof raw.activeProjectId === 'string' && projects.some((p) => p.id === raw.activeProjectId)
      ? raw.activeProjectId
      : null;
  // Fallback matches findProject: prefer the first non-deleted project.
  if (activeProjectId === null) {
    activeProjectId = projects.find((p) => !p.deleted)?.id ?? projects[0].id;
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) as Project;

  return {
    schemaVersion: SCHEMA_VERSION,
    activeProjectId,
    projects,
    ui: sanitizeUi(raw.ui, activeProject),
  };
}

/**
 * Migrate today's flat `roas_calc_*` payload into a v1 AppState (CAP-5).
 * Non-destructive: callers must leave the legacy keys on disk.
 * `fallbackProducts` (demo seed) is used when the legacy product payload is
 * missing/corrupt/empty — matching the former "empty means demo data" behavior.
 */
export function migrateLegacyState(
  raw: LegacyRawState,
  fallbackProducts: Product[] = []
): AppState {
  const now = new Date().toISOString();

  const legacyProductsRaw = parseJsonValue(raw.products);
  const legacyProducts = Array.isArray(legacyProductsRaw)
    ? legacyProductsRaw.filter(isRecord)
    : [];

  // Build the product list with regenerated UUIDs and a legacy-id -> UUID map.
  const idMap = new Map<string, string>();
  const migratedProducts: Product[] = [];
  for (const legacyProduct of legacyProducts) {
    const legacyId = toNonEmptyString(legacyProduct.id);
    const migrated = sanitizeProduct(legacyProduct, { regenerateIds: true });
    if (!migrated) continue;
    migratedProducts.push(migrated);
    if (legacyId) idMap.set(legacyId, migrated.id);
  }

  const products = migratedProducts.length > 0 ? migratedProducts : fallbackProducts.map((p) => ({ ...p }));

  const legacyActiveId = parseJsonValue(raw.activeProductId);
  let activeProductId: string | null = null;
  if (typeof legacyActiveId === 'string') {
    activeProductId = idMap.get(legacyActiveId) ?? null;
  }
  if (activeProductId === null) activeProductId = products[0]?.id ?? null;

  const legacyComparedRaw = parseJsonValue(raw.comparedProductIds);
  const remappedCompared: string[] = [];
  if (Array.isArray(legacyComparedRaw)) {
    for (const legacyId of legacyComparedRaw) {
      if (typeof legacyId !== 'string') continue;
      const mapped = idMap.get(legacyId);
      if (mapped && !remappedCompared.includes(mapped)) remappedCompared.push(mapped);
    }
  }
  const comparedProductIds =
    remappedCompared.length > 0 ? remappedCompared : products.slice(0, 3).map((p) => p.id);

  const projectNameRaw = parseJsonValue(raw.projectName);
  const project = createProject({
    name: toNonEmptyString(projectNameRaw) ?? DEFAULT_PROJECT_NAME,
    currency: toCurrency(parseJsonValue(raw.currency)),
    products,
    createdAt: now,
    updatedAt: now,
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    activeProjectId: project.id,
    projects: [project],
    ui: {
      theme: toTheme(parseJsonValue(raw.theme)),
      language: toLanguage(raw.language),
      view: toView(parseJsonValue(raw.view)),
      activeProductId,
      comparedProductIds,
    },
  };
}
