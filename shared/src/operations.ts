// Domain model operations — the single owner of entity mutations and the
// ad-spend/units sync rule (AD-6). Pure functions only.
import {
  CATEGORIES,
  SCHEMA_VERSION,
  type AppState,
  type Category,
  type FixedCostItem,
  type Product,
  type Project,
} from './types';

/** Category input matching rule (CAP-6): case-insensitive enum match, else `other`. */
export function matchCategory(value: unknown): Category {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    const found = CATEGORIES.find((c) => c === normalized);
    if (found) return found;
  }
  return 'other';
}

/** UUID v4 helper. Falls back when crypto.randomUUID is unavailable (non-secure contexts). */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4-shaped fallback — uniqueness only, not cryptographic.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Resolve the effective CPA / total ad spend for a product (single source of the sync rule). */
export function resolveAdSpend(product: Product): { adSpendPerUnit: number; totalAdSpend: number } {
  const units = Math.max(1, product.units || 1);
  if (product.adSpendMode === 'total') {
    const totalAdSpend = Math.max(0, product.totalAdSpend || 0);
    return { totalAdSpend, adSpendPerUnit: units > 0 ? totalAdSpend / units : 0 };
  }
  const adSpendPerUnit = Math.max(0, product.adSpendPerUnit || 0);
  return { adSpendPerUnit, totalAdSpend: adSpendPerUnit * units };
}

export function createFixedCostItem(name: string, amount: number): FixedCostItem {
  return { id: generateId(), name, amount };
}

export function createProduct(data: Partial<Product> = {}): Product {
  const now = new Date().toISOString();
  const units = data.units ?? 500;
  const adSpendPerUnit = data.adSpendPerUnit ?? 15.0;

  return {
    id: data.id ?? generateId(),
    name: data.name || 'New Product',
    sku: data.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    category: data.category ?? 'other',
    sellingPrice: data.sellingPrice ?? 50.0,
    cogs: data.cogs ?? 15.0,
    units,
    shippingPerUnit: data.shippingPerUnit ?? 5.0,
    shippingMode: data.shippingMode,
    courierShippingCost: data.courierShippingCost,
    customerShippingFee: data.customerShippingFee,
    fulfillmentRate: data.fulfillmentRate ?? 80,
    adSpendPerUnit,
    totalAdSpend: data.totalAdSpend ?? adSpendPerUnit * units,
    adSpendMode: data.adSpendMode ?? 'per-unit',
    fixedCosts:
      data.fixedCosts ??
      [
        createFixedCostItem('Photoshoot & Creatives', 500),
        createFixedCostItem('Rent & Overhead', 800),
        createFixedCostItem('Salaries & Media Buyer', 1200),
      ],
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
    schemaVersion: SCHEMA_VERSION,
    deleted: data.deleted ?? false,
    deletedAt: data.deletedAt,
  };
}

/**
 * Apply a partial update to a product, re-synchronizing CPA <-> total ad spend and
 * units (extracted verbatim from the former AppContext rule). Single owner (AD-6).
 */
export function applyProductPatch(product: Product, updates: Partial<Product>): Product {
  const updated: Product = {
    ...product,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.adSpendPerUnit !== undefined && updated.adSpendMode === 'per-unit') {
    updated.totalAdSpend = updated.adSpendPerUnit * (updated.units || 1);
  } else if (updates.totalAdSpend !== undefined && updated.adSpendMode === 'total') {
    updated.adSpendPerUnit = updated.totalAdSpend / (updated.units || 1);
  } else if (updates.units !== undefined) {
    if (updated.adSpendMode === 'per-unit') {
      updated.totalAdSpend = updated.adSpendPerUnit * updated.units;
    } else {
      updated.adSpendPerUnit = updated.totalAdSpend / (updated.units || 1);
    }
  }

  return updated;
}

/** Soft delete (tombstone) — the client never hard-deletes (CAP-5). */
export function deleteProduct(product: Product): Product {
  const now = new Date().toISOString();
  return { ...product, deleted: true, deletedAt: now, updatedAt: now };
}

export function duplicateProduct(product: Product): Product {
  const now = new Date().toISOString();
  return {
    ...product,
    id: generateId(),
    name: `${product.name} (Copy)`,
    sku: product.sku ? `${product.sku}-COPY` : undefined,
    fixedCosts: product.fixedCosts.map((fc) => ({ ...fc, id: generateId() })),
    createdAt: now,
    updatedAt: now,
    deleted: false,
    deletedAt: undefined,
  };
}

/** Products visible in the UI (tombstones stay stored). */
export function activeProducts(products: Product[]): Product[] {
  return products.filter((p) => !p.deleted);
}

export function createProject(data: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: data.id ?? generateId(),
    name: data.name ?? 'Untitled Project',
    currency: data.currency ?? 'USD',
    products: data.products ?? [],
    settings: data.settings ?? {},
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
    schemaVersion: SCHEMA_VERSION,
    deleted: data.deleted ?? false,
    deletedAt: data.deletedAt,
  };
}

/** Upsert a project by id (append unknown ids), preserving first-seen order. */
export function upsertProject(projects: Project[], project: Project): Project[] {
  const index = projects.findIndex((p) => p.id === project.id);
  if (index === -1) return [...projects, project];
  const next = [...projects];
  next[index] = project;
  return next;
}

export function findProject(state: AppState, projectId: string | null): Project | undefined {
  if (projectId) {
    const found = state.projects.find((p) => p.id === projectId);
    if (found) return found;
  }
  return state.projects.find((p) => !p.deleted) ?? state.projects[0];
}
