import { SCHEMA_VERSION, generateId } from '@shared';
import type { Product } from '@shared';

/** Fresh demo catalog — full v1 envelope entities (seeded per call). */
export function createDemoProducts(): Product[] {
  const now = Date.now();
  const iso = (offsetDays: number, base: number = now) =>
    new Date(base - offsetDays * 24 * 3600 * 1000).toISOString();

  return [
    {
      id: generateId(),
      name: 'Oversized Heavyweight Hoodie (Autumn Edition)',
      sku: 'HD-HVY-BLK-L',
      category: 'fashion_apparel',
      sellingPrice: 78.0,
      cogs: 22.5,
      units: 1200,
      shippingPerUnit: 6.0,
      fulfillmentRate: 84,
      adSpendPerUnit: 24.0,
      totalAdSpend: 28800,
      adSpendMode: 'per-unit',
      fixedCosts: [
        { id: generateId(), name: 'Photoshoot & Models', amount: 800 },
        { id: generateId(), name: 'Studio & Warehousing Rent', amount: 1200 },
        { id: generateId(), name: 'Salaries & Media Buyer', amount: 2500 },
      ],
      createdAt: iso(7),
      updatedAt: iso(0),
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
    },
    {
      id: generateId(),
      name: 'ANC Wireless Pro Earbuds (Noise Cancelling)',
      sku: 'TECH-ANC-PRO-01',
      category: 'electronics_gadgets',
      sellingPrice: 129.0,
      cogs: 34.0,
      units: 850,
      shippingPerUnit: 7.5,
      fulfillmentRate: 91,
      adSpendPerUnit: 38.0,
      totalAdSpend: 32300,
      adSpendMode: 'per-unit',
      fixedCosts: [
        { id: generateId(), name: 'Influencer Gifting & UGC', amount: 1500 },
        { id: generateId(), name: 'Creative Video Ads Studio', amount: 1800 },
        { id: generateId(), name: 'Tech QA & Customer Support', amount: 950 },
      ],
      createdAt: iso(5),
      updatedAt: iso(0),
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
    },
    {
      id: generateId(),
      name: 'Hydrating Vitamin C Glow Face Serum (50ml)',
      sku: 'GLOW-VITC-50ML',
      category: 'beauty_personal_care',
      sellingPrice: 42.0,
      cogs: 6.8,
      units: 2500,
      shippingPerUnit: 4.5,
      fulfillmentRate: 88,
      adSpendPerUnit: 14.5,
      totalAdSpend: 36250,
      adSpendMode: 'per-unit',
      fixedCosts: [
        { id: generateId(), name: 'Product Photography & 3D', amount: 650 },
        { id: generateId(), name: 'Lab Certifications & Testing', amount: 900 },
        { id: generateId(), name: 'Custom Packaging Design', amount: 1100 },
      ],
      createdAt: iso(3),
      updatedAt: iso(0),
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
    },
    {
      id: generateId(),
      name: 'Smart Ergonomic Lumbar Support Cushion',
      sku: 'HOME-ERGO-CUSH-09',
      category: 'home_kitchen',
      sellingPrice: 54.0,
      cogs: 14.2,
      units: 600,
      shippingPerUnit: 8.5,
      fulfillmentRate: 76,
      adSpendPerUnit: 26.0,
      totalAdSpend: 15600,
      adSpendMode: 'per-unit',
      fixedCosts: [
        { id: generateId(), name: '3D Renderings & Ad Copy', amount: 450 },
        { id: generateId(), name: 'Warehousing Overhead', amount: 600 },
      ],
      createdAt: iso(1),
      updatedAt: iso(0),
      schemaVersion: SCHEMA_VERSION,
      deleted: false,
    },
  ];
}
