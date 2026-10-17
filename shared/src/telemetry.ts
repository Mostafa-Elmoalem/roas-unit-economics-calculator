// Telemetry contract shared by web (producer) and api (validator + recomputer) — AD-15/16.
// Pure module: no storage, no React, no runtime dependencies. The snapshot allowlist
// here is the scrub-at-source boundary (C7): product names, SKUs, project names and
// fixed-cost item names never appear in any builder output.
import {
  SCHEMA_VERSION,
  type CalculatedMetrics,
  type Category,
  type Currency,
  type Product,
  type Project,
} from './types';
import { calculateProductMetrics } from './calculations';
import { activeProducts, generateId } from './operations';

/** Wire-format version of the ingest batch (independent of the app state schema). */
export const TELEMETRY_SCHEMA_VERSION = 1;

/** The complete, decided set of usage events (snake_case per the architecture conventions). */
export const TELEMETRY_EVENT_NAMES = [
  'app_opened',
  'product_created',
  'product_updated',
  'product_deleted',
  'project_updated',
  'csv_imported',
  'backup_exported',
  'backup_restored',
] as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];

/** Props are limited to ids, enum values and counts (C7) — never names or free text. */
export type TelemetryPropValue = string | number | boolean;
export type TelemetryProps = Record<string, TelemetryPropValue>;

export interface TelemetryEvent {
  id: string;
  name: TelemetryEventName;
  occurredAt: string;
  props?: TelemetryProps;
}

/** Numeric allowlist of product inputs — exactly the fields `calculateProductMetrics` reads. */
export interface TelemetrySnapshotInputs {
  sellingPrice: number;
  cogs: number;
  units: number;
  shippingPerUnit: number;
  fulfillmentRate: number;
  adSpendPerUnit: number;
  totalAdSpend: number;
  adSpendMode: 'per-unit' | 'total';
  fixedCostsTotal: number;
  shippingMode?: 'flat' | 'subsidized';
  courierShippingCost?: number;
  customerShippingFee?: number;
}

export interface TelemetrySnapshotProduct {
  category: Category;
  inputs: TelemetrySnapshotInputs;
  metrics: CalculatedMetrics;
}

export interface TelemetrySnapshot {
  id: string;
  projectId: string;
  capturedAt: string;
  currency: Currency;
  products: TelemetrySnapshotProduct[];
}

export type TelemetryItem = TelemetryEvent | TelemetrySnapshot;

export interface IngestBatch {
  schemaVersion: typeof TELEMETRY_SCHEMA_VERSION;
  deviceId: string;
  sentAt: string;
  events: TelemetryEvent[];
  snapshots: TelemetrySnapshot[];
}

/**
 * Caps shared by the client batcher and the server plausibility check so a legit
 * client can never produce a batch the api would reject as implausible.
 */
export const TELEMETRY_LIMITS = {
  maxEventsPerBatch: 500,
  maxSnapshotsPerBatch: 50,
  maxSnapshotProducts: 500,
  maxUnits: 1_000_000_000,
  maxNumber: 1_000_000_000_000_000,
  maxPropsPerEvent: 12,
  maxPropKeyLength: 64,
  maxPropValueLength: 64,
} as const;

const finite = (value: number | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

/** Pure event factory — `now` is injected so builders stay deterministic in tests. */
export function buildEvent(
  name: TelemetryEventName,
  props: TelemetryProps | undefined,
  now: string
): TelemetryEvent {
  return props === undefined
    ? { id: generateId(), name, occurredAt: now }
    : { id: generateId(), name, occurredAt: now, props };
}

function snapshotInputs(product: Product): TelemetrySnapshotInputs {
  const inputs: TelemetrySnapshotInputs = {
    sellingPrice: finite(product.sellingPrice),
    cogs: finite(product.cogs),
    units: finite(product.units),
    shippingPerUnit: finite(product.shippingPerUnit),
    fulfillmentRate: finite(product.fulfillmentRate),
    adSpendPerUnit: finite(product.adSpendPerUnit),
    totalAdSpend: finite(product.totalAdSpend),
    adSpendMode: product.adSpendMode === 'total' ? 'total' : 'per-unit',
    fixedCostsTotal: (product.fixedCosts ?? []).reduce(
      (sum, item) => sum + finite(Number(item.amount)),
      0
    ),
  };
  if (product.shippingMode === 'flat' || product.shippingMode === 'subsidized') {
    inputs.shippingMode = product.shippingMode;
  }
  if (product.courierShippingCost !== undefined) {
    inputs.courierShippingCost = Math.max(0, finite(product.courierShippingCost));
  }
  if (product.customerShippingFee !== undefined) {
    inputs.customerShippingFee = Math.max(0, finite(product.customerShippingFee));
  }
  return inputs;
}

/**
 * Build the anonymized snapshot of one project (C7 allowlist): category, currency,
 * numeric inputs (plus `fixedCostsTotal`) and the client's computed metrics.
 * Tombstoned products are excluded; the product list is capped to the shared limit.
 */
export function buildSnapshot(project: Project, now: string): TelemetrySnapshot {
  const products = activeProducts(project.products).slice(0, TELEMETRY_LIMITS.maxSnapshotProducts);
  return {
    id: generateId(),
    projectId: project.id,
    capturedAt: now,
    currency: project.currency,
    products: products.map((product) => ({
      category: product.category,
      inputs: snapshotInputs(product),
      metrics: calculateProductMetrics(product),
    })),
  };
}

/**
 * Rebuild the metrics from raw snapshot inputs with the single domain owner (AD-12).
 * The api uses this so stored metrics are always the server's recomputation, never
 * the client-reported numbers.
 */
export function metricsFromSnapshotInputs(inputs: TelemetrySnapshotInputs): CalculatedMetrics {
  const product: Product = {
    id: 'snapshot-input',
    name: '',
    category: 'other',
    sellingPrice: inputs.sellingPrice,
    cogs: inputs.cogs,
    units: inputs.units,
    shippingPerUnit: inputs.shippingPerUnit,
    shippingMode: inputs.shippingMode,
    courierShippingCost: inputs.courierShippingCost,
    customerShippingFee: inputs.customerShippingFee,
    fulfillmentRate: inputs.fulfillmentRate,
    adSpendPerUnit: inputs.adSpendPerUnit,
    totalAdSpend: inputs.totalAdSpend,
    adSpendMode: inputs.adSpendMode,
    fixedCosts: [{ id: 'snapshot-fixed-costs', name: '', amount: inputs.fixedCostsTotal }],
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    schemaVersion: SCHEMA_VERSION,
    deleted: false,
  };
  return calculateProductMetrics(product);
}

export function isTelemetryEvent(item: TelemetryItem): item is TelemetryEvent {
  return 'name' in item && 'occurredAt' in item;
}

export function isTelemetrySnapshot(item: TelemetryItem): item is TelemetrySnapshot {
  return 'projectId' in item && 'capturedAt' in item;
}

/** Assemble one wire batch from queued items (events and snapshots are separated). */
export function buildBatch(items: TelemetryItem[], deviceId: string, now: string): IngestBatch {
  return {
    schemaVersion: TELEMETRY_SCHEMA_VERSION,
    deviceId,
    sentAt: now,
    events: items.filter(isTelemetryEvent),
    snapshots: items.filter(isTelemetrySnapshot),
  };
}
