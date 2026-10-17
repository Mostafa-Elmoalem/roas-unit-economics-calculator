// Exercises the real CSV import entry point (`parseCustomCSVOrExcel`) with
// CSV-string input, so the template-header/fixed-cost defect fix is covered
// end-to-end. The template header row comes from `generateSampleCSV()` to
// prevent header drift.
import { describe, expect, it } from 'vitest';
import { generateSampleCSV, parseCustomCSVOrExcel } from './csvParser';

const TEMPLATE_HEADERS = generateSampleCSV().split('\n')[0];

describe('parseCustomCSVOrExcel — real parser with CSV input', () => {
  it('imports the generated sample template: overhead/fulfillment/CPA/category columns land', () => {
    const result = parseCustomCSVOrExcel(generateSampleCSV(), false);

    expect(result.errors).toEqual([]);
    expect(result.totalRows).toBe(3);
    expect(result.products).toHaveLength(3);

    const first = result.products[0];
    expect(first.name).toBe('Premium Oversized Graphic Tee');
    expect(first.category).toBe('fashion_apparel');
    expect(first.fulfillmentRate).toBe(85);
    expect(first.adSpendPerUnit).toBe(14);
    expect(first.fixedCosts).toEqual([
      { id: expect.any(String), name: 'Photoshoot & Creatives', amount: 500 },
      { id: expect.any(String), name: 'Warehousing / Rent', amount: 800 },
      { id: expect.any(String), name: 'Salaries & Media Buyer', amount: 1200 },
    ]);
  });

  it('empty overhead cells produce no fixed-cost items; filled cells carry the file amounts', () => {
    const csv = [
      TEMPLATE_HEADERS,
      'No Overheads,SKU-NO-OVH,electronics_gadgets,50,15,100,5,80,10,,,',
      'One Overhead,SKU-ONE-OVH,unknown_category_here,60,20,200,6,90,12,300,,',
    ].join('\n');

    const result = parseCustomCSVOrExcel(csv, false);

    expect(result.errors).toEqual([]);
    expect(result.totalRows).toBe(2);

    expect(result.products[0].fixedCosts).toEqual([]);
    expect(result.products[1].fixedCosts).toEqual([
      { id: expect.any(String), name: 'Photoshoot & Creatives', amount: 300 },
    ]);
    // Unknown category maps to `other` through the real parser too.
    expect(result.products[1].category).toBe('other');
  });
});
