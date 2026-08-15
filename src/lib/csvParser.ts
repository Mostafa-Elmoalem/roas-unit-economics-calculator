import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Product } from '../types';

export interface CSVParseResult {
  products: Product[];
  errors: string[];
  totalRows: number;
}

export function parseCustomCSVOrExcel(data: ArrayBuffer | string, isExcel: boolean): CSVParseResult {
  const errors: string[] = [];
  const products: Product[] = [];
  let rows: Record<string, any>[] = [];

  if (isExcel) {
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
    } catch (e: any) {
      return { products: [], errors: [`Excel Read Error: ${e.message}`], totalRows: 0 };
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

  const findValue = (row: Record<string, any>, candidates: string[]): any => {
    const rowKeys = Object.keys(row);
    for (const cand of candidates) {
      const matchedKey = rowKeys.find((k) => k.toLowerCase().trim() === cand.toLowerCase().trim());
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
        return row[matchedKey];
      }
    }
    return undefined;
  };

  rows.forEach((row, index) => {
    try {
      const name = findValue(row, ['title', 'name', 'product name', 'product', 'item']) || `Imported Item ${index + 1}`;
      const sku = findValue(row, ['sku', 'code', 'id']) || `IMP-${1000 + index}`;
      
      const priceRaw = findValue(row, ['price', 'selling price', 'selling_price', 'unit price', 'retail price']) || '50';
      const sellingPrice = Math.max(0, parseFloat(String(priceRaw).replace(/[^0-9.]/g, '')) || 50);

      const cogsRaw = findValue(row, ['cost', 'cogs', 'cost per unit', 'cost_per_unit', 'unit cost', 'cost per item', 'item cost']) || '15';
      const cogs = Math.max(0, parseFloat(String(cogsRaw).replace(/[^0-9.]/g, '')) || Math.round(sellingPrice * 0.3 * 100) / 100);

      const unitsRaw = findValue(row, ['units', 'stock', 'inventory', 'quantity', 'qty', 'units in batch', 'number of units']) || '500';
      const units = Math.max(1, parseInt(String(unitsRaw).replace(/[^0-9-]/g, ''), 10) || 500);

      const shippingRaw = findValue(row, ['shipping', 'shipping per unit', 'shipping cost', 'shipping_cost', 'delivery fee']) || '5';
      const shippingPerUnit = Math.max(0, parseFloat(String(shippingRaw).replace(/[^0-9.]/g, '')) || 5);

      const fulfillmentRaw = findValue(row, ['fulfillment rate', 'fulfillment', 'fulfillment_rate', 'delivery rate', 'delivery %']) || '80';
      const fulfillmentRate = Math.min(100, Math.max(10, parseFloat(String(fulfillmentRaw).replace(/[^0-9.]/g, '')) || 80));

      const adSpendRaw = findValue(row, ['ad spend', 'cpa', 'ad spend per unit', 'cost per acquisition', 'spend per unit', 'target cpa']) || String(Math.round(sellingPrice * 0.3 * 100) / 100);
      const adSpendPerUnit = Math.max(0, parseFloat(String(adSpendRaw).replace(/[^0-9.]/g, '')) || 15);

      const photoshoot = parseFloat(String(findValue(row, ['photoshoot', 'photo', 'creatives']) || '0').replace(/[^0-9.]/g, '')) || 0;
      const rent = parseFloat(String(findValue(row, ['rent', 'warehousing', 'warehouse']) || '0').replace(/[^0-9.]/g, '')) || 0;
      const salaries = parseFloat(String(findValue(row, ['salaries', 'salary', 'team', 'agency']) || '0').replace(/[^0-9.]/g, '')) || 0;

      const fixedCosts = [
        { id: `fc-imp-${index}-1`, name: 'Photoshoot & Creatives', amount: photoshoot > 0 ? photoshoot : Math.round(units * 0.5) },
        { id: `fc-imp-${index}-2`, name: 'Warehousing / Rent', amount: rent > 0 ? rent : Math.round(units * 0.8) },
        { id: `fc-imp-${index}-3`, name: 'Salaries & Media Buyer', amount: salaries > 0 ? salaries : Math.round(units * 1.0) },
      ];

      const product: Product = {
        id: `imp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`,
        name: String(name).trim(),
        sku: String(sku).trim(),
        sellingPrice,
        cogs,
        units,
        shippingPerUnit,
        fulfillmentRate,
        adSpendPerUnit,
        totalAdSpend: adSpendPerUnit * units,
        adSpendMode: 'per-unit',
        fixedCosts,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      products.push(product);
    } catch (e: any) {
      errors.push(`Row ${index + 1}: ${e.message || 'Parsing error'}`);
    }
  });

  return { products, errors, totalRows: rows.length };
}

export function generateSampleCSV(): string {
  const headers = [
    'Title',
    'SKU',
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
