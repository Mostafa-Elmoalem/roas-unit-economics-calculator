import * as XLSX from 'xlsx';
import type { Product, Currency } from '../types';
import { calculatePortfolioMetrics, calculateProductMetrics } from './calculations';

export function exportPortfolioToExcel(
  projectName: string,
  products: Product[],
  currency: Currency
) {
  const portfolio = calculatePortfolioMetrics(products);
  const workbook = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryData = [
    ['E-COMMERCE PERFORMANCE UNIT ECONOMICS & BREAK-EVEN ROAS REPORT'],
    ['Project / Brand:', projectName],
    ['Currency:', currency],
    ['Export Date:', new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()],
    [''],
    ['PORTFOLIO BLENDED EXECUTIVE SUMMARY'],
    ['Metric', 'Value'],
    ['Total Active Products', portfolio.totalProducts],
    ['Blended Break-Even ROAS', portfolio.blendedBreakEvenROAS ? `${portfolio.blendedBreakEvenROAS.toFixed(2)}x` : 'N/A'],
    ['Blended Current ROAS', `${portfolio.blendedCurrentROAS.toFixed(2)}x`],
    ['Total Units In Batch', portfolio.totalUnits],
    ['Total Delivered Units (Fulfillment Factored)', Math.round(portfolio.totalDeliveredUnits)],
    ['Total Raw Revenue (100% Fulfillment)', portfolio.totalRawRevenue],
    ['Total Realized Revenue (Adjusted)', portfolio.totalAdjustedRevenue],
    ['Total Ad Spend', portfolio.totalAdSpend],
    ['Total Fixed Overheads', portfolio.totalFixedCosts],
    ['Total Raw Net Profit (100% Fulfillment)', portfolio.totalRawProfit],
    ['Raw Blended Net Margin (%)', `${portfolio.rawBlendedMarginPercent.toFixed(2)}%`],
    ['Total Adjusted Net Profit (Realistic)', portfolio.totalAdjustedProfit],
    ['Adjusted Blended Net Margin (%)', `${portfolio.adjustedBlendedMarginPercent.toFixed(2)}%`],
    ['Portfolio Health Status', portfolio.healthStatus.toUpperCase()],
    ['Profitable Products Count', portfolio.healthyCount],
    ['Underperforming / Loss Count', portfolio.unhealthyCount],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Portfolio Overview');

  // 2. Product Level Sheet
  const productsHeaders = [
    'Product Name',
    'SKU',
    'Units',
    'Selling Price',
    'COGS',
    'Shipping Per Unit',
    'Fulfillment Rate (%)',
    'Total Fixed Costs',
    'Fixed Cost / Unit',
    'Ad Spend / Unit (CPA)',
    'Total Ad Spend',
    'Break-Even CPA',
    'Break-Even ROAS',
    'Current ROAS',
    'ROAS Status',
    'Raw Profit / Unit',
    'Raw Total Profit',
    'Raw Net Margin (%)',
    'Delivered Units',
    'Realized Revenue',
    'Adjusted Total Profit',
    'Adjusted Profit / Unit',
    'Adjusted Net Margin (%)',
  ];

  const productsRows = products.map((p) => {
    const m = calculateProductMetrics(p);
    const roasStatus =
      m.breakEvenROAS !== null
        ? m.currentROAS >= m.breakEvenROAS
          ? 'Profitable (Above BE)'
          : 'Losing (Below BE)'
        : 'Negative Base Margin';

    return [
      p.name,
      p.sku || 'N/A',
      p.units,
      p.sellingPrice,
      p.cogs,
      p.shippingPerUnit,
      `${p.fulfillmentRate}%`,
      m.totalFixedCosts,
      Math.round(m.fixedCostPerUnit * 100) / 100,
      p.adSpendPerUnit,
      m.adjustedTotalAdSpend,
      Math.round(m.breakEvenCPA * 100) / 100,
      m.breakEvenROAS ? `${m.breakEvenROAS.toFixed(2)}x` : 'N/A',
      `${m.currentROAS.toFixed(2)}x`,
      roasStatus,
      Math.round(m.rawNetProfitPerUnit * 100) / 100,
      Math.round(m.rawTotalProfit * 100) / 100,
      `${m.rawNetMarginPercent.toFixed(2)}%`,
      Math.round(m.adjustedDeliveredUnits),
      Math.round(m.adjustedRealizedRevenue * 100) / 100,
      Math.round(m.adjustedTotalProfit * 100) / 100,
      Math.round(m.adjustedProfitPerOrderedUnit * 100) / 100,
      `${m.adjustedNetMarginPercent.toFixed(2)}%`,
    ];
  });

  const productsSheet = XLSX.utils.aoa_to_sheet([productsHeaders, ...productsRows]);
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Unit Economics Matrix');

  // 3. Overheads Breakdown Sheet
  const overheadHeaders = ['Product Name', 'Overhead Item', 'Amount'];
  const overheadRows: (string | number)[][] = [];

  products.forEach((p) => {
    (p.fixedCosts || []).forEach((fc) => {
      overheadRows.push([p.name, fc.name, fc.amount]);
    });
  });

  const overheadSheet = XLSX.utils.aoa_to_sheet([overheadHeaders, ...overheadRows]);
  XLSX.utils.book_append_sheet(workbook, overheadSheet, 'Fixed Overheads');

  const cleanName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `${cleanName}_Unit_Economics_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportSingleProductToCSV(product: Product, currency: Currency) {
  const m = calculateProductMetrics(product);

  const rows = [
    ['Metric', 'Value'],
    ['Product Name', product.name],
    ['SKU', product.sku || 'N/A'],
    ['Currency', currency],
    ['Selling Price', product.sellingPrice],
    ['COGS', product.cogs],
    ['Units in Batch', product.units],
    ['Shipping Per Unit', product.shippingPerUnit],
    ['Fulfillment Rate', `${product.fulfillmentRate}%`],
    ['Total Fixed Costs', m.totalFixedCosts],
    ['Fixed Cost / Unit', m.fixedCostPerUnit.toFixed(2)],
    ['Ad Spend / Unit (CPA)', product.adSpendPerUnit],
    ['Total Ad Spend', m.adjustedTotalAdSpend],
    ['Break-Even CPA', m.breakEvenCPA.toFixed(2)],
    ['Break-Even ROAS', m.breakEvenROAS ? `${m.breakEvenROAS.toFixed(2)}x` : 'N/A'],
    ['Current ROAS', `${m.currentROAS.toFixed(2)}x`],
    ['Raw Net Profit / Unit', m.rawNetProfitPerUnit.toFixed(2)],
    ['Raw Total Profit', m.rawTotalProfit.toFixed(2)],
    ['Raw Net Margin (%)', `${m.rawNetMarginPercent.toFixed(2)}%`],
    ['Delivered Units', Math.round(m.adjustedDeliveredUnits)],
    ['Failed Units', Math.round(m.adjustedFailedUnits)],
    ['Realized Revenue', m.adjustedRealizedRevenue.toFixed(2)],
    ['Realized COGS', m.adjustedRealizedCOGS.toFixed(2)],
    ['Total Shipping Spent', m.adjustedTotalShippingSpent.toFixed(2)],
    ['Adjusted Total Profit', m.adjustedTotalProfit.toFixed(2)],
    ['Adjusted Profit / Unit', m.adjustedProfitPerOrderedUnit.toFixed(2)],
    ['Adjusted Net Margin (%)', `${m.adjustedNetMarginPercent.toFixed(2)}%`],
  ];

  const csvContent = rows.map((r) => r.map((c) => (String(c).includes(',') ? `"${c}"` : c)).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${product.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_economics.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
