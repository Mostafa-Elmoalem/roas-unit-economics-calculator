// Pure CSV/Excel header-matching helpers (CAP-6). No I/O here — the parser in
// `src/lib/csvParser.ts` does the Papa Parse / XLSX reading and calls these.
import { matchCategory } from './operations';
import type { Category } from './types';

/**
 * Normalize a spreadsheet header for matching: lowercase, punctuation removed,
 * parenthetical unit suffixes dropped (`Fulfillment Rate (%)` -> `fulfillment rate`,
 * `Ad Spend Per Unit (CPA)` -> `ad spend per unit`).
 */
export function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // drop parentheticals, e.g. (%), (CPA), ($)
    .replace(/[^a-z0-9]+/g, ' ') // punctuation / symbols / separators -> space
    .trim()
    .replace(/\s+/g, ' ');
}

/** Unit/currency suffixes tolerated at the end of a header (`Ad Spend Per Unit CPA`). */
const UNIT_SUFFIX_TOKENS = new Set([
  'cpa',
  'usd',
  'egp',
  'eur',
  'sar',
  'aed',
  'gbp',
  'cad',
  'aud',
  'pct',
  'percent',
]);

function stripUnitSuffix(normalized: string): string {
  const tokens = normalized.split(' ');
  while (tokens.length > 1 && UNIT_SUFFIX_TOKENS.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(' ');
}

/**
 * Find a cell value by candidate header names using normalized matching:
 * case/punctuation insensitive, tolerant of a trailing unit suffix (CPA, USD, %).
 */
export function findRowValue(
  row: Record<string, unknown>,
  candidates: string[]
): unknown {
  const entries = Object.keys(row).map((key) => {
    const normalized = normalizeHeader(key);
    return {
      exact: normalized,
      stripped: stripUnitSuffix(normalized),
      value: row[key],
    };
  });

  const matches = (entry: (typeof entries)[number], candidate: string) => {
    const normalizedCandidate = normalizeHeader(candidate);
    const strippedCandidate = stripUnitSuffix(normalizedCandidate);
    return entry.exact === normalizedCandidate || entry.stripped === strippedCandidate;
  };

  for (const candidate of candidates) {
    const match = entries.find(
      (entry) =>
        matches(entry, candidate) &&
        entry.value !== undefined &&
        entry.value !== null &&
        entry.value !== ''
    );
    if (match) return match.value;
  }
  return undefined;
}

export interface MappedFixedCost {
  name: string;
  amount: number;
}

/** Template overhead columns -> fixed-cost line items (file values only, never fabricated). */
export const FIXED_COST_COLUMNS: { candidates: string[]; label: string }[] = [
  { candidates: ['photoshoot cost', 'photoshoot', 'photo', 'creatives'], label: 'Photoshoot & Creatives' },
  { candidates: ['rent overhead', 'rent', 'warehousing', 'warehouse'], label: 'Warehousing / Rent' },
  { candidates: ['salaries overhead', 'salaries', 'salary', 'team', 'agency'], label: 'Salaries & Media Buyer' },
];

/**
 * Parse a file cell into an amount. Accepts plain ("1234.56"), US-grouped
 * ("1,234.56") and European ("12,50", "1.234,56") formats; negative or
 * unparseable cells yield null (treated as "no item").
 */
function toAmount(value: unknown): number | null {
  if (value === undefined || value === null) return null;

  let raw = String(value).trim().replace(/[^0-9.,+-]/g, '');
  if (raw === '') return null;

  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');

  if (hasComma && hasDot) {
    // Both separators present: the last one is the decimal separator, the other groups digits.
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      raw = raw.replace(/\./g, '').replace(/,/g, '.');
    } else {
      raw = raw.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Single comma with 1-2 trailing digits is a decimal comma ("12,50"); otherwise it groups digits.
    const lastGroup = raw.slice(raw.lastIndexOf(',') + 1);
    if (raw.indexOf(',') === raw.lastIndexOf(',') && /^\d{1,2}$/.test(lastGroup)) {
      raw = raw.replace(',', '.');
    } else {
      raw = raw.replace(/,/g, '');
    }
  }

  if (raw === '') return null;

  const amount = Number(raw);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/**
 * Map a row's fixed-cost cells to items. A column produces an item only when the
 * file carries a numeric value; empty/absent cells produce nothing (defect fix).
 */
export function mapFixedCosts(
  row: Record<string, unknown>
): MappedFixedCost[] {
  const items: MappedFixedCost[] = [];
  for (const column of FIXED_COST_COLUMNS) {
    const rawValue = findRowValue(row, column.candidates);
    const amount = toAmount(rawValue);
    if (amount === null) continue;
    items.push({ name: column.label, amount });
  }
  return items;
}

/** Category cell -> enum value; anything unknown maps to `other` (CAP-6). */
export function mapCategory(value: unknown): Category {
  return matchCategory(value);
}
