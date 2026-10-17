import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  findRowValue,
  generateId,
  mapCategory,
  mapFixedCosts,
  SCHEMA_VERSION,
} from '@shared';
import type { Category, Product } from '@shared';

export interface CSVParseResult {
  products: Product[];
  errors: string[];
  totalRows: number;
}

const parseNumber = (value: unknown): number =>
  parseFloat(String(value).replace(/[^0-9.]/g, ''));

export function parseCustomCSVOrExcel(data: ArrayBuffer | string, isExcel: boolean): CSVParseResult {
  const errors: string[] = [];
  const products: Product[] = [];
  let rows: Record<string, unknown>[] = [];

  if (isExcel) {
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      return { products: [], errors: [`Excel Read Error: ${message}`], totalRows: 0 };
    }
  } else {
    const parsed = Papa.parse<Record<string, string>>(data as string, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors && parsed.errors.length > 0) {
      parsed.errors.forEach((err) => errors.push(`Row ${err.row}: ${err.message}`));
    }
    rows = parsed.data;
  }

  rows.forEach((row, index) => {
    try {
      const name =
        findRowValue(row, ['title', 'name', 'product name', 'product', 'item']) ||
        `Imported Item ${index + 1}`;
      const sku = findRowValue(row, ['sku', 'code', 'id']) || `IMP-${1000 + index}`;

      const priceRaw =
        findRowValue(row, ['price', 'selling price', 'selling_price', 'unit price', 'retail price']) ||
        '50';
      const sellingPrice = Math.max(0, parseNumber(priceRaw) || 50);

      const cogsRaw =
        findRowValue(row, ['cost', 'cogs', 'cost per unit', 'cost_per_unit', 'unit cost', 'cost per item', 'item cost']) ||
        '15';
      const cogs = Math.max(
        0,
        parseNumber(cogsRaw) || Math.round(sellingPrice * 0.3 * 100) / 100
      );

      const unitsRaw =
        findRowValue(row, ['units', 'stock', 'inventory', 'quantity', 'qty', 'units in batch', 'number of units']) ||
        '500';
      const units = Math.max(1, parseInt(String(unitsRaw).replace(/[^0-9-]/g, ''), 10) || 500);

      const shippingRaw =
        findRowValue(row, ['shipping', 'shipping per unit', 'shipping cost', 'shipping_cost', 'delivery fee']) ||
        '5';
      const shippingPerUnit = Math.max(0, parseNumber(shippingRaw) || 5);

      const fulfillmentRaw =
        findRowValue(row, ['fulfillment rate', 'fulfillment', 'fulfillment_rate', 'delivery rate', 'delivery %']) ||
        '80';
      const fulfillmentRate = Math.min(
        100,
        Math.max(10, parseNumber(fulfillmentRaw) || 80)
      );

      const adSpendRaw =
        findRowValue(row, [
          'ad spend per unit',
          'ad spend per unit (cpa)',
          'cost per acquisition',
          'cpa',
          'spend per unit',
          'target cpa',
          'ad spend',
        ]) || String(Math.round(sellingPrice * 0.3 * 100) / 100);
      const adSpendPerUnit = Math.max(0, parseNumber(adSpendRaw) || 15);

      // Fixed costs come from the file only — empty/absent means no items (defect fix).
      const mappedFixedCosts = mapFixedCosts(row);
      const fixedCosts = mappedFixedCosts.map((item) => ({
        id: generateId(),
        name: item.name,
        amount: item.amount,
      }));

      // Category maps case-insensitively to the enum, else `other` (CAP-6).
      const category: Category = mapCategory(
        findRowValue(row, ['category', 'product category', 'segment'])
      );

      const now = new Date().toISOString();
      const product: Product = {
        id: generateId(),
        name: String(name).trim(),
        sku: String(sku).trim(),
        category,
        sellingPrice,
        cogs,
        units,
        shippingPerUnit,
        fulfillmentRate,
        adSpendPerUnit,
        totalAdSpend: adSpendPerUnit * units,
        adSpendMode: 'per-unit',
        fixedCosts,
        createdAt: now,
        updatedAt: now,
        schemaVersion: SCHEMA_VERSION,
        deleted: false,
      };

      products.push(product);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Parsing error';
      errors.push(`Row ${index + 1}: ${message}`);
    }
  });

  return { products, errors, totalRows: rows.length };
}

export function generateSampleCSV(): string {
  const headers = [
    'Title',
    'SKU',
    'Category',
    'Selling Price',
    'COGS',
    'Units',
    'Shipping Per Unit',
    'Fulfillment Rate (%)',
    'Ad Spend Per Unit (CPA)',
    'Photoshoot Cost',
    'Rent Overhead',
    'Salaries Overhead',
  ];

  const sampleRows = [
    [
      'Premium Oversized Graphic Tee',
      'TEE-GRAPH-01',
      'fashion_apparel',
      '45.00',
      '12.50',
      '1000',
      '4.50',
      '85',
      '14.00',
      '500',
      '800',
      '1200',
    ],
    [
      'Wireless Ergonomic Mouse',
      'TECH-MOUSE-RGB',
      'electronics_gadgets',
      '68.00',
      '18.00',
      '750',
      '6.00',
      '90',
      '20.00',
      '600',
      '900',
      '1500',
    ],
    [
      'Organic Matcha Green Tea Powder (100g)',
      'MATCHA-ORG-100G',
      'food_beverage',
      '34.00',
      '6.20',
      '2000',
      '3.50',
      '92',
      '10.50',
      '400',
      '700',
      '1000',
    ],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((r) => r.map((cell) => (cell.includes(',') ? `"${cell}"` : cell)).join(',')),
  ].join('\n');

  return csvContent;
}
