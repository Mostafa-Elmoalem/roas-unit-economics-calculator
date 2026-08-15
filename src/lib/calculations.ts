import type { Product, CalculatedMetrics, PortfolioMetrics, Currency, SensitivityScenario } from '../types';

export function calculateProductMetrics(product: Product): CalculatedMetrics {
  const units = Math.max(1, product.units || 1);
  const sellingPrice = Math.max(0, product.sellingPrice || 0);
  const cogs = Math.max(0, product.cogs || 0);
  const shippingPerUnit = Math.max(0, product.shippingPerUnit || 0);
  const fulfillmentRate = Math.min(100, Math.max(0, product.fulfillmentRate ?? 80));
  const fulfillmentRatio = fulfillmentRate / 100;

  // Fixed Costs
  const totalFixedCosts = (product.fixedCosts || []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const fixedCostPerUnit = units > 0 ? totalFixedCosts / units : 0;

  // Ad Spend
  let adSpendPerUnit = 0;
  let totalAdSpend = 0;
  if (product.adSpendMode === 'total') {
    totalAdSpend = Math.max(0, product.totalAdSpend || 0);
    adSpendPerUnit = units > 0 ? totalAdSpend / units : 0;
  } else {
    adSpendPerUnit = Math.max(0, product.adSpendPerUnit || 0);
    totalAdSpend = adSpendPerUnit * units;
  }

  // --- 1. Raw Metrics (100% Fulfillment) ---
  const grossMargin = sellingPrice - cogs - shippingPerUnit;
  const grossMarginPercent = sellingPrice > 0 ? (grossMargin / sellingPrice) * 100 : 0;

  const breakEvenCPA = grossMargin - fixedCostPerUnit;
  const breakEvenROAS = breakEvenCPA > 0 ? sellingPrice / breakEvenCPA : null;

  const currentROAS = adSpendPerUnit > 0 ? sellingPrice / adSpendPerUnit : 0;

  const rawNetProfitPerUnit = breakEvenCPA - adSpendPerUnit;
  const rawTotalProfit = rawNetProfitPerUnit * units;
  const rawTotalRevenue = sellingPrice * units;
  const rawNetMarginPercent = rawTotalRevenue > 0 ? (rawTotalProfit / rawTotalRevenue) * 100 : 0;
  const isProfitableRaw = rawTotalProfit >= 0;

  const marginOfSafetyROAS =
    breakEvenROAS !== null ? currentROAS - breakEvenROAS : currentROAS > 0 ? currentROAS : 0;

  // --- 2. Fulfillment-Adjusted Metrics ---
  const adjustedDeliveredUnits = units * fulfillmentRatio;
  const adjustedFailedUnits = units * (1 - fulfillmentRatio);

  const adjustedRealizedRevenue = adjustedDeliveredUnits * sellingPrice;
  const adjustedRealizedCOGS = adjustedDeliveredUnits * cogs;
  const adjustedTotalShippingSpent = units * shippingPerUnit; // paid for all dispatched units
  const adjustedTotalAdSpend = totalAdSpend;

  const adjustedTotalProfit =
    adjustedRealizedRevenue -
    adjustedRealizedCOGS -
    adjustedTotalShippingSpent -
    adjustedTotalAdSpend -
    totalFixedCosts;

  const adjustedProfitPerDeliveredUnit =
    adjustedDeliveredUnits > 0 ? adjustedTotalProfit / adjustedDeliveredUnits : 0;

  const adjustedProfitPerOrderedUnit = units > 0 ? adjustedTotalProfit / units : 0;

  const adjustedNetMarginPercent =
    adjustedRealizedRevenue > 0 ? (adjustedTotalProfit / adjustedRealizedRevenue) * 100 : 0;

  // Adjusted Break-Even CPA
  const adjustedBreakEvenCPA =
    fulfillmentRatio * (sellingPrice - cogs) - shippingPerUnit - fixedCostPerUnit;

  const adjustedBreakEvenROAS =
    adjustedBreakEvenCPA > 0
      ? (fulfillmentRatio * sellingPrice) / adjustedBreakEvenCPA
      : null;

  const adjustedFailedShippingLoss = adjustedFailedUnits * shippingPerUnit;
  const isProfitableAdjusted = adjustedTotalProfit >= 0;

  const marginOfSafetyAdjustedROAS =
    adjustedBreakEvenROAS !== null
      ? currentROAS - adjustedBreakEvenROAS
      : currentROAS > 0
      ? currentROAS
      : 0;

  return {
    totalFixedCosts,
    fixedCostPerUnit,
    grossMargin,
    grossMarginPercent,
    breakEvenCPA,
    breakEvenROAS,
    currentROAS,
    rawNetProfitPerUnit,
    rawTotalProfit,
    rawTotalRevenue,
    rawNetMarginPercent,
    isProfitableRaw,
    marginOfSafetyROAS,
    adjustedDeliveredUnits,
    adjustedFailedUnits,
    adjustedRealizedRevenue,
    adjustedRealizedCOGS,
    adjustedTotalShippingSpent,
    adjustedTotalAdSpend,
    adjustedTotalProfit,
    adjustedProfitPerDeliveredUnit,
    adjustedProfitPerOrderedUnit,
    adjustedNetMarginPercent,
    adjustedBreakEvenCPA,
    adjustedBreakEvenROAS,
    adjustedFailedShippingLoss,
    isProfitableAdjusted,
    marginOfSafetyAdjustedROAS,
  };
}

export function calculatePortfolioMetrics(products: Product[]): PortfolioMetrics {
  if (!products || products.length === 0) {
    return {
      totalProducts: 0,
      blendedBreakEvenROAS: null,
      blendedCurrentROAS: 0,
      totalRawProfit: 0,
      totalAdjustedProfit: 0,
      totalRawRevenue: 0,
      totalAdjustedRevenue: 0,
      totalUnits: 0,
      totalDeliveredUnits: 0,
      totalAdSpend: 0,
      totalFixedCosts: 0,
      healthStatus: 'all-healthy',
      healthyCount: 0,
      unhealthyCount: 0,
      rawBlendedMarginPercent: 0,
      adjustedBlendedMarginPercent: 0,
    };
  }

  let totalRawRevenue = 0;
  let totalAdjustedRevenue = 0;
  let totalAdSpend = 0;
  let totalRawProfit = 0;
  let totalAdjustedProfit = 0;
  let totalUnits = 0;
  let totalDeliveredUnits = 0;
  let totalFixedCosts = 0;
  let healthyCount = 0;
  let unhealthyCount = 0;

  let weightedBECPADenom = 0;
  let weightedRevenueNum = 0;

  products.forEach((product) => {
    const metrics = calculateProductMetrics(product);
    totalRawRevenue += metrics.rawTotalRevenue;
    totalAdjustedRevenue += metrics.adjustedRealizedRevenue;
    totalAdSpend += metrics.adjustedTotalAdSpend;
    totalRawProfit += metrics.rawTotalProfit;
    totalAdjustedProfit += metrics.adjustedTotalProfit;
    totalUnits += product.units;
    totalDeliveredUnits += metrics.adjustedDeliveredUnits;
    totalFixedCosts += metrics.totalFixedCosts;

    if (metrics.isProfitableAdjusted) {
      healthyCount++;
    } else {
      unhealthyCount++;
    }

    if (metrics.breakEvenCPA > 0) {
      weightedBECPADenom += metrics.breakEvenCPA * product.units;
      weightedRevenueNum += metrics.rawTotalRevenue;
    }
  });

  const blendedCurrentROAS = totalAdSpend > 0 ? totalRawRevenue / totalAdSpend : 0;
  const blendedBreakEvenROAS =
    weightedBECPADenom > 0 ? weightedRevenueNum / weightedBECPADenom : null;

  const rawBlendedMarginPercent =
    totalRawRevenue > 0 ? (totalRawProfit / totalRawRevenue) * 100 : 0;
  const adjustedBlendedMarginPercent =
    totalAdjustedRevenue > 0 ? (totalAdjustedProfit / totalAdjustedRevenue) * 100 : 0;

  let healthStatus: 'all-healthy' | 'warning' | 'critical' = 'all-healthy';
  if (unhealthyCount === 0) {
    healthStatus = 'all-healthy';
  } else if (unhealthyCount <= products.length * 0.4) {
    healthStatus = 'warning';
  } else {
    healthStatus = 'critical';
  }

  return {
    totalProducts: products.length,
    blendedBreakEvenROAS,
    blendedCurrentROAS,
    totalRawProfit,
    totalAdjustedProfit,
    totalRawRevenue,
    totalAdjustedRevenue,
    totalUnits,
    totalDeliveredUnits,
    totalAdSpend,
    totalFixedCosts,
    healthStatus,
    healthyCount,
    unhealthyCount,
    rawBlendedMarginPercent,
    adjustedBlendedMarginPercent,
  };
}

export function generateSensitivityMatrix(product: Product): {
  fulfillmentRates: number[];
  adSpendMultipliers: { label: string; multiplier: number }[];
  scenarios: SensitivityScenario[][];
} {
  const fulfillmentRates = [100, 90, 80, 70, 60, 50];
  const adSpendMultipliers = [
    { label: '-30% CPA', multiplier: 0.7 },
    { label: '-15% CPA', multiplier: 0.85 },
    { label: 'Current CPA', multiplier: 1.0 },
    { label: '+15% CPA', multiplier: 1.15 },
    { label: '+30% CPA', multiplier: 1.3 },
  ];

  const baseAdSpend =
    product.adSpendMode === 'total'
      ? (product.totalAdSpend || 0) / (product.units || 1)
      : product.adSpendPerUnit || 0;

  const scenarios: SensitivityScenario[][] = fulfillmentRates.map((fRate) => {
    return adSpendMultipliers.map((mult) => {
      const simAdSpendPerUnit = baseAdSpend * mult.multiplier;
      const simProduct: Product = {
        ...product,
        fulfillmentRate: fRate,
        adSpendPerUnit: simAdSpendPerUnit,
        adSpendMode: 'per-unit',
      };
      const metrics = calculateProductMetrics(simProduct);

      return {
        fulfillmentRate: fRate,
        adSpendMultiplier: mult.multiplier,
        adSpendLabel: mult.label,
        adSpendPerUnit: simAdSpendPerUnit,
        totalProfit: metrics.adjustedTotalProfit,
        profitPerUnit: metrics.adjustedProfitPerOrderedUnit,
        currentROAS: metrics.currentROAS,
        breakEvenROAS: metrics.adjustedBreakEvenROAS,
        netMarginPercent: metrics.adjustedNetMarginPercent,
        isProfitable: metrics.isProfitableAdjusted,
      };
    });
  });

  return {
    fulfillmentRates,
    adSpendMultipliers,
    scenarios,
  };
}

// Helpers for formatting
export function formatCurrency(
  value: number | undefined | null,
  currency: Currency = 'USD',
  compact = false
): string {
  const num = Number(value) || 0;

  const currencySymbols: Record<Currency, string> = {
    USD: '$',
    EGP: 'EGP ',
    EUR: '€',
    SAR: 'SAR ',
    AED: 'AED ',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
  };

  const symbol = currencySymbols[currency] || '$';

  if (compact && Math.abs(num) >= 1000000) {
    return `${symbol}${(num / 1000000).toFixed(2)}M`;
  }
  if (compact && Math.abs(num) >= 1000) {
    return `${symbol}${(num / 1000).toFixed(1)}k`;
  }

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `${symbol}${formattedNum}`;
}

export function formatROAS(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  if (!isFinite(value)) {
    return '∞';
  }
  return `${value.toFixed(2)}x`;
}

export function formatPercent(value: number | undefined | null): string {
  const num = Number(value) || 0;
  return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
}
