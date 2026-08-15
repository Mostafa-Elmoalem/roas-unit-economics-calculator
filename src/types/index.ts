export type Currency = 'USD' | 'EGP' | 'EUR' | 'SAR' | 'AED' | 'GBP' | 'CAD' | 'AUD';

export interface FixedCostItem {
  id: string;
  name: string;
  amount: number;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  sellingPrice: number;
  cogs: number;
  units: number;
  shippingPerUnit: number;
  fulfillmentRate: number; // 0 - 100
  adSpendPerUnit: number; // CPA
  totalAdSpend: number;
  adSpendMode: 'per-unit' | 'total';
  fixedCosts: FixedCostItem[];
  createdAt: string;
  updatedAt: string;
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

export type ViewMode = 'dashboard' | 'calculator';
export type ThemeMode = 'system' | 'dark' | 'light';
