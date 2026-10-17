import { describe, expect, it } from 'vitest';
import { findRowValue, mapCategory, mapFixedCosts, normalizeHeader } from './csv';

/** The exact headers of the app's own sample template (`generateSampleCSV`). */
const TEMPLATE_ROW: Record<string, unknown> = {
  Title: 'Premium Oversized Graphic Tee',
  SKU: 'TEE-GRAPH-01',
  Category: 'fashion_apparel',
  'Selling Price': '45.00',
  COGS: '12.50',
  Units: '1000',
  'Shipping Per Unit': '4.50',
  'Fulfillment Rate (%)': '85',
  'Ad Spend Per Unit (CPA)': '14.00',
  'Photoshoot Cost': '500',
  'Rent Overhead': '800',
  'Salaries Overhead': '1200',
};

describe('normalizeHeader', () => {
  it('is case/punctuation/unit-suffix insensitive', () => {
    expect(normalizeHeader('Fulfillment Rate (%)')).toBe('fulfillment rate');
    expect(normalizeHeader('Ad Spend Per Unit (CPA)')).toBe('ad spend per unit');
    expect(normalizeHeader('Selling Price ($)')).toBe('selling price');
    expect(normalizeHeader('  COGS ')).toBe('cogs');
    expect(normalizeHeader('Cost-Per-Unit')).toBe('cost per unit');
  });
});

describe('findRowValue — template headers land', () => {
  it('finds every template column through the normalized candidates', () => {
    expect(findRowValue(TEMPLATE_ROW, ['title', 'name', 'product name'])).toBe(TEMPLATE_ROW.Title);
    expect(findRowValue(TEMPLATE_ROW, ['sku', 'code'])).toBe(TEMPLATE_ROW.SKU);
    expect(findRowValue(TEMPLATE_ROW, ['selling price', 'price'])).toBe('45.00');
    expect(findRowValue(TEMPLATE_ROW, ['cogs', 'cost', 'cost per unit'])).toBe('12.50');
    expect(findRowValue(TEMPLATE_ROW, ['units', 'quantity'])).toBe('1000');
    expect(findRowValue(TEMPLATE_ROW, ['shipping per unit', 'shipping'])).toBe('4.50');
    expect(findRowValue(TEMPLATE_ROW, ['fulfillment rate', 'fulfillment'])).toBe('85');
    expect(findRowValue(TEMPLATE_ROW, ['ad spend per unit', 'cpa'])).toBe('14.00');
    expect(findRowValue(TEMPLATE_ROW, ['category', 'product category'])).toBe('fashion_apparel');
  });

  it('tolerates a trailing unit suffix on an unparenthesized header', () => {
    expect(findRowValue({ 'Ad Spend Per Unit CPA': 14 }, ['ad spend per unit'])).toBe(14);
    expect(findRowValue({ 'Selling Price USD': 45 }, ['selling price'])).toBe(45);
    expect(findRowValue({ 'Fulfillment Rate Pct': 85 }, ['fulfillment rate'])).toBe(85);
  });

  it('does not match loosely related headers (no prefix matching)', () => {
    expect(findRowValue({ 'Cost per Acquisition': 5 }, ['cost per unit'])).toBeUndefined();
    expect(findRowValue({ 'Units In Batch': 500 }, ['unit price'])).toBeUndefined();
  });

  it('skips empty cells and falls through to the next candidate', () => {
    expect(findRowValue({ Title: '', Name: 'Backup Name' }, ['title', 'name'])).toBe('Backup Name');
    expect(findRowValue({ Title: '' }, ['title'])).toBeUndefined();
  });
});

describe('mapCategory', () => {
  it('matches enum values case-insensitively and maps unknown to `other`', () => {
    expect(mapCategory('fashion_apparel')).toBe('fashion_apparel');
    expect(mapCategory('Electronics_Gadgets')).toBe('electronics_gadgets');
    expect(mapCategory('FOOD_BEVERAGE')).toBe('food_beverage');
    expect(mapCategory('Shoes')).toBe('other');
    expect(mapCategory(undefined)).toBe('other');
  });
});

describe('mapFixedCosts — file values only, never fabricated', () => {
  it('maps all three template overhead columns with the file amounts', () => {
    const items = mapFixedCosts(TEMPLATE_ROW);

    expect(items).toEqual([
      { name: 'Photoshoot & Creatives', amount: 500 },
      { name: 'Warehousing / Rent', amount: 800 },
      { name: 'Salaries & Media Buyer', amount: 1200 },
    ]);
  });

  it('produces nothing for empty/absent overhead cells (defect fix — no fabrication)', () => {
    expect(mapFixedCosts({ Title: 'No overheads' })).toEqual([]);
    expect(
      mapFixedCosts({ 'Photoshoot Cost': '', 'Rent Overhead': '   ', 'Salaries Overhead': null })
    ).toEqual([]);
  });

  it('tolerates currency symbols in numeric strings from the file', () => {
    const items = mapFixedCosts({ 'Photoshoot Cost': '$500.50' });
    expect(items).toEqual([{ name: 'Photoshoot & Creatives', amount: 500.5 }]);
  });

  it('parses European decimal commas and grouped thousands correctly', () => {
    expect(mapFixedCosts({ 'Photoshoot Cost': '12,50' })).toEqual([
      { name: 'Photoshoot & Creatives', amount: 12.5 },
    ]);
    expect(mapFixedCosts({ 'Rent Overhead': '1.234,56' })).toEqual([
      { name: 'Warehousing / Rent', amount: 1234.56 },
    ]);
    expect(mapFixedCosts({ 'Salaries Overhead': '1,234.56' })).toEqual([
      { name: 'Salaries & Media Buyer', amount: 1234.56 },
    ]);
    expect(mapFixedCosts({ 'Salaries Overhead': '1234.56' })).toEqual([
      { name: 'Salaries & Media Buyer', amount: 1234.56 },
    ]);
    expect(mapFixedCosts({ 'Salaries Overhead': '12.5' })).toEqual([
      { name: 'Salaries & Media Buyer', amount: 12.5 },
    ]);
  });

  it('treats negative or unparseable cells as no item', () => {
    expect(mapFixedCosts({ 'Photoshoot Cost': '-500' })).toEqual([]);
    expect(mapFixedCosts({ 'Rent Overhead': 'n/a' })).toEqual([]);
    expect(mapFixedCosts({ 'Salaries Overhead': '--' })).toEqual([]);
  });

  it('keeps an explicit zero from the file (it is a real value, not an absence)', () => {
    const items = mapFixedCosts({ 'Rent Overhead': '0' });
    expect(items).toEqual([{ name: 'Warehousing / Rent', amount: 0 }]);
  });
});
