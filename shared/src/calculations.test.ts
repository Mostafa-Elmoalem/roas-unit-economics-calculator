import { describe, expect, it } from 'vitest';
import { createProduct } from './operations';
import {
  calculatePortfolioMetrics,
  calculateProductMetrics,
  formatCurrency,
  formatROAS,
  generateSensitivityMatrix,
} from './calculations';
import type { Product } from './types';

/**
 * Hand-checkable sample (spec AD-21): price 100, cogs 30, shipping 10, CPA 20.
 * Expected: BE CPA 60, BE ROAS ≈ 1.67, current ROAS 5.
 */
const makeProduct = (overrides: Partial<Product> = {}): Product =>
  createProduct({
    name: 'Hand-check Sample',
    sellingPrice: 100,
    cogs: 30,
    shippingPerUnit: 10,
    shippingMode: 'flat',
    fulfillmentRate: 100,
    adSpendPerUnit: 20,
    totalAdSpend: 20 * 100,
    adSpendMode: 'per-unit',
    units: 100,
    fixedCosts: [],
    ...overrides,
  });

describe('calculateProductMetrics — hand-checkable sample', () => {
  it('derives BE CPA 60 and BE ROAS ≈ 1.67 from price 100 / cogs 30 / shipping 10 / CPA 20', () => {
    const m = calculateProductMetrics(makeProduct());

    expect(m.grossMargin).toBe(60);
    expect(m.breakEvenCPA).toBe(60);
    expect(m.breakEvenROAS).toBeCloseTo(1.67, 2);
    expect(m.currentROAS).toBe(5);
  });

  it('scales raw totals by units and keeps per-unit profit at BE CPA - CPA', () => {
    const m = calculateProductMetrics(makeProduct());

    expect(m.rawNetProfitPerUnit).toBe(40);
    expect(m.rawTotalProfit).toBe(4000);
    expect(m.rawTotalRevenue).toBe(10000);
    expect(m.isProfitableRaw).toBe(true);
  });

  it('at 100% fulfillment the adjusted metrics equal the raw metrics (no drag)', () => {
    const m = calculateProductMetrics(makeProduct());

    expect(m.adjustedDeliveredUnits).toBe(100);
    expect(m.adjustedFailedUnits).toBe(0);
    expect(m.adjustedTotalShippingSpent).toBe(1000);
    expect(m.adjustedTotalProfit).toBe(4000);
    expect(m.adjustedBreakEvenCPA).toBe(60);
    expect(m.adjustedBreakEvenROAS).toBeCloseTo(1.67, 2);
    expect(m.isProfitableAdjusted).toBe(true);
  });

  it('includes fixed costs in the per-unit break-even math', () => {
    const withFixed = makeProduct({
      fixedCosts: [
        { id: 'fc-1', name: 'Studio', amount: 2000 },
        { id: 'fc-2', name: 'Salaries', amount: 3000 },
      ],
    });
    const m = calculateProductMetrics(withFixed);

    expect(m.totalFixedCosts).toBe(5000);
    expect(m.fixedCostPerUnit).toBe(50); // 5000 / 100 units
    // BE CPA = 100 - 30 - 10 - 50 = 10
    expect(m.breakEvenCPA).toBe(10);
    expect(m.breakEvenROAS).toBe(10);
  });
});

describe('calculateProductMetrics — edge cases', () => {
  it('COGS ≥ price yields no break-even ROAS (N/A)', () => {
    const m = calculateProductMetrics(
      makeProduct({ sellingPrice: 50, cogs: 60, shippingPerUnit: 10, fixedCosts: [] })
    );

    expect(m.breakEvenCPA).toBeLessThanOrEqual(0);
    expect(m.breakEvenROAS).toBeNull();
    expect(m.adjustedBreakEvenROAS).toBeNull();
    expect(formatROAS(m.breakEvenROAS)).toBe('N/A');
  });

  it('zero ad spend is guarded (no Infinity/NaN), and the formatter renders ∞ only for infinite ROAS', () => {
    const m = calculateProductMetrics(makeProduct({ adSpendPerUnit: 0, totalAdSpend: 0 }));

    expect(Number.isFinite(m.currentROAS)).toBe(true);
    expect(m.currentROAS).toBe(0);
    // Margin of safety degrades to minus the break-even ROAS when spend is zero.
    expect(m.marginOfSafetyROAS).toBeCloseTo(-m.breakEvenROAS!, 10);
    // The ∞ rendering path exists for mathematically infinite ROAS values.
    expect(formatROAS(Number.POSITIVE_INFINITY)).toBe('∞');
  });

  it('fulfillment drag lowers break-even and creates failed-shipment loss', () => {
    const m = calculateProductMetrics(makeProduct({ fulfillmentRate: 60 }));

    expect(m.adjustedDeliveredUnits).toBe(60);
    expect(m.adjustedFailedUnits).toBe(40);
    expect(m.adjustedFailedShippingLoss).toBe(400); // 40 failed × 10 flat shipping
    expect(m.adjustedTotalShippingSpent).toBe(1000); // 60×10 delivered + 40×10 failed
    // adjusted BE CPA = 0.6 × (100-30) − 10 − 0 = 32
    expect(m.adjustedBreakEvenCPA).toBe(32);
    expect(m.adjustedBreakEvenROAS).toBe(1.875); // 60 / 32
    expect(m.adjustedTotalProfit).toBe(1200); // 6000 − 1800 − 1000 − 2000
    // Raw metrics do not move with fulfillment.
    expect(m.rawTotalProfit).toBe(4000);
  });

  it('subsidized shipping splits courier cost between merchant and customer', () => {
    const m = calculateProductMetrics(
      makeProduct({
        shippingMode: 'subsidized',
        courierShippingCost: 90,
        customerShippingFee: 60,
        shippingPerUnit: 0,
      })
    );

    expect(m.effectiveDeliveredShippingCost).toBe(30); // courier − customer fee
    expect(m.effectiveReturnedShippingCost).toBe(90); // failed orders lose the full courier fee
  });
});

describe('calculatePortfolioMetrics', () => {
  it('returns the empty defaults for no products', () => {
    const p = calculatePortfolioMetrics([]);

    expect(p.totalProducts).toBe(0);
    expect(p.blendedBreakEvenROAS).toBeNull();
    expect(p.blendedCurrentROAS).toBe(0);
    expect(p.healthStatus).toBe('all-healthy');
  });

  it('blends revenue-weighted ROAS and flags critical health when >40% underperform', () => {
    const healthy = makeProduct(); // revenue 10000, profit 4000
    const unhealthy = makeProduct({
      name: 'Loser',
      sellingPrice: 50,
      cogs: 40,
      shippingPerUnit: 5,
      adSpendPerUnit: 10,
      totalAdSpend: 1000,
      units: 100,
      fixedCosts: [],
    }); // revenue 5000, raw profit (5 − 10) × 100 = −500

    const p = calculatePortfolioMetrics([healthy, unhealthy]);

    expect(p.totalProducts).toBe(2);
    expect(p.healthyCount).toBe(1);
    expect(p.unhealthyCount).toBe(1);
    expect(p.healthStatus).toBe('critical');
    expect(p.totalAdSpend).toBe(3000);
    expect(p.blendedCurrentROAS).toBe(5); // 15000 / 3000
    expect(p.blendedBreakEvenROAS).toBeCloseTo(15000 / 6500, 6);
    expect(p.totalRawProfit).toBe(3500); // 4000 − 500
  });
});

describe('generateSensitivityMatrix', () => {
  it('produces 6 fulfillment rates × 5 CPA multipliers and uses the domain CPA', () => {
    const matrix = generateSensitivityMatrix(makeProduct());

    expect(matrix.fulfillmentRates).toEqual([100, 90, 80, 70, 60, 50]);
    expect(matrix.adSpendMultipliers).toHaveLength(5);
    expect(matrix.scenarios).toHaveLength(6);
    matrix.scenarios.forEach((row) => expect(row).toHaveLength(5));

    const firstRow = matrix.scenarios[0];
    const current = firstRow.find((s) => s.adSpendMultiplier === 1)!;
    const discounted = firstRow.find((s) => s.adSpendMultiplier === 0.7)!;

    expect(current.adSpendPerUnit).toBe(20);
    expect(discounted.adSpendPerUnit).toBe(14);
    expect(current.currentROAS).toBe(5);
    expect(current.isProfitable).toBe(true);
  });
});

describe('formatters', () => {
  it('formats currency with the expected symbol and grouping', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency(1234.5, 'EGP')).toBe('EGP 1,234.50');
    expect(formatCurrency(1500000, 'USD', true)).toBe('$1.50M');
    expect(formatCurrency(12500, 'USD', true)).toBe('$12.5k');
    expect(formatCurrency(null)).toBe('$0.00');
  });

  it('formats ROAS with N/A and ∞ handling', () => {
    expect(formatROAS(1.666)).toBe('1.67x');
    expect(formatROAS(0)).toBe('0.00x');
    expect(formatROAS(null)).toBe('N/A');
    expect(formatROAS(undefined)).toBe('N/A');
    expect(formatROAS(Number.NaN)).toBe('N/A');
    expect(formatROAS(Number.POSITIVE_INFINITY)).toBe('∞');
  });
});
