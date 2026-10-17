// TrueROAS shared domain types — single source of truth (AD-12).
// Pure module: no storage, no React, no runtime dependencies.

export const CURRENCIES = ['USD', 'EGP', 'EUR', 'SAR', 'AED', 'GBP', 'CAD', 'AUD'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Default demo project name (used by seeding and legacy migration). */
export const DEFAULT_PROJECT_NAME = 'Q3 E-Commerce Performance Unit Economics';

/** Fixed product categories (AD-4). snake_case values are dataset aggregation keys. */
export const CATEGORIES = [
  'fashion_apparel',
  'beauty_personal_care',
  'home_kitchen',
  'electronics_gadgets',
  'health_wellness',
  'sports_outdoors',
  'baby_kids',
  'pet_supplies',
  'food_beverage',
  'accessories_jewelry',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Current persisted schema version. Bump only with a migration. */
export const SCHEMA_VERSION = 1;

export interface FixedCostItem {
  id: string;
  name: string;
  amount: number;
}

/** Versioned entity envelope (AD-3): UUID id, ISO-8601 updatedAt, tombstone, schemaVersion. */
export interface Product {
  id: string;
  name: string;
  sku?: string;
  category: Category;
  sellingPrice: number;
  cogs: number;
  units: number;
  shippingPerUnit: number;
  shippingMode?: 'flat' | 'subsidized';
  courierShippingCost?: number; // Total actual courier fee (e.g. 90 EGP)
  customerShippingFee?: number; // What the customer is charged (e.g. 60 EGP)
  fulfillmentRate: number; // 0 - 100
  adSpendPerUnit: number; // CPA
  totalAdSpend: number;
  adSpendMode: 'per-unit' | 'total';
  fixedCosts: FixedCostItem[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  deleted: boolean;
  deletedAt?: string;
}

/** Reserved for future per-project preferences; v1 keeps this empty. */
export interface ProjectSettings {
  [key: string]: unknown;
}

/** Project is the first-class aggregate (AD-2): one currency per project. */
export interface Project {
  id: string;
  name: string;
  currency: Currency;
  products: Product[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  deleted: boolean;
  deletedAt?: string;
}

export const VIEW_MODES = ['dashboard', 'calculator', 'compare'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const THEME_MODES = ['system', 'dark', 'light'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

/** UI state persisted alongside projects in the single v1 state blob. */
export interface AppStateUi {
  theme: ThemeMode;
  language: Language;
  view: ViewMode;
  activeProductId: string | null;
  comparedProductIds: string[];
}

/** Whole client state under `trueroas_v1_state` (AD-5). */
export interface AppState {
  schemaVersion: number;
  activeProjectId: string | null;
  projects: Project[];
  ui: AppStateUi;
}

/** Backup file payload (AD-7). Device prefs (theme/language) are not part of a backup. */
export interface BackupPayload {
  app: 'trueroas';
  kind: 'backup';
  schemaVersion: number;
  exportedAt: string;
  activeProjectId: string | null;
  projects: Project[];
}

export interface CalculatedMetrics {
  // Overheads
  totalFixedCosts: number;
  fixedCostPerUnit: number;

  // Raw Unit Economics (100% Fulfillment)
  grossMargin: number;
  grossMarginPercent: number;
  breakEvenCPA: number;
  breakEvenROAS: number | null; // null if breakEvenCPA <= 0
  currentROAS: number;
  rawNetProfitPerUnit: number;
  rawTotalProfit: number;
  rawTotalRevenue: number;
  rawNetMarginPercent: number;
  isProfitableRaw: boolean;
  marginOfSafetyROAS: number; // Current ROAS - BE ROAS

  // Fulfillment Adjusted Metrics
  effectiveDeliveredShippingCost: number;
  effectiveReturnedShippingCost: number;
  adjustedDeliveredUnits: number;
  adjustedFailedUnits: number;
  adjustedRealizedRevenue: number;
  adjustedRealizedCOGS: number;
  adjustedTotalShippingSpent: number;
  adjustedTotalAdSpend: number;
  adjustedTotalProfit: number;
  adjustedProfitPerDeliveredUnit: number;
  adjustedProfitPerOrderedUnit: number;
  adjustedNetMarginPercent: number;
  adjustedBreakEvenCPA: number;
  adjustedBreakEvenROAS: number | null;
  adjustedFailedShippingLoss: number;
  isProfitableAdjusted: boolean;
  marginOfSafetyAdjustedROAS: number;
}

export interface PortfolioMetrics {
  totalProducts: number;
  blendedBreakEvenROAS: number | null;
  blendedCurrentROAS: number;
  totalRawProfit: number;
  totalAdjustedProfit: number;
  totalRawRevenue: number;
  totalAdjustedRevenue: number;
  totalUnits: number;
  totalDeliveredUnits: number;
  totalAdSpend: number;
  totalFixedCosts: number;
  healthStatus: 'all-healthy' | 'warning' | 'critical';
  healthyCount: number;
  unhealthyCount: number;
  rawBlendedMarginPercent: number;
  adjustedBlendedMarginPercent: number;
}

export interface SensitivityScenario {
  fulfillmentRate: number;
  adSpendMultiplier: number;
  adSpendLabel: string;
  adSpendPerUnit: number;
  totalProfit: number;
  profitPerUnit: number;
  currentROAS: number;
  breakEvenROAS: number | null;
  netMarginPercent: number;
  isProfitable: boolean;
}
