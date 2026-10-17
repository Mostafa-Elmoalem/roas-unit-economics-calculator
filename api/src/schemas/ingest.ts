// Zod mirrors of the shared telemetry types (AD-15). Zod lives only in the api;
// parity with the shared builders is pinned by tests, never by duplicated rules.
// This layer enforces the I/O matrix's plausibility row: finite, non-negative,
// capped numbers, known enums, plausible timestamps and over-cap batch rejection.
import { z } from 'zod';
import {
  CATEGORIES,
  CURRENCIES,
  TELEMETRY_EVENT_NAMES,
  TELEMETRY_LIMITS,
  TELEMETRY_SCHEMA_VERSION,
} from '@shared';

/** Clock-skew tolerance for client timestamps; anything further in the future is implausible. */
const MAX_FUTURE_SKEW_MS = 24 * 60 * 60 * 1000;

export function isPlausibleTimestamp(value: string): boolean {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed) && parsed <= Date.now() + MAX_FUTURE_SKEW_MS;
}

const timestamp = z.string().refine(isPlausibleTimestamp, {
  message: 'Timestamp must be a valid ISO-8601 date not far in the future',
});

const amount = z.number().finite().min(0).max(TELEMETRY_LIMITS.maxNumber);
const metricNumber = z.number().finite();
const nullableMetric = metricNumber.nullable();

const propValue = z.union([
  z.string().min(1).max(TELEMETRY_LIMITS.maxPropValueLength),
  z.number().finite(),
  z.boolean(),
]);

const props = z
  .record(z.string().min(1).max(TELEMETRY_LIMITS.maxPropKeyLength), propValue)
  .refine((value) => Object.keys(value).length <= TELEMETRY_LIMITS.maxPropsPerEvent, {
    message: `At most ${TELEMETRY_LIMITS.maxPropsPerEvent} props are allowed`,
  });

const eventSchema = z.object({
  id: z.uuid(),
  name: z.enum(TELEMETRY_EVENT_NAMES),
  occurredAt: timestamp,
  props: props.optional(),
});

const inputsSchema = z.object({
  sellingPrice: amount,
  cogs: amount,
  units: z.number().int().min(0).max(TELEMETRY_LIMITS.maxUnits),
  shippingPerUnit: amount,
  fulfillmentRate: z.number().finite().min(0).max(100),
  adSpendPerUnit: amount,
  totalAdSpend: amount,
  adSpendMode: z.enum(['per-unit', 'total']),
  fixedCostsTotal: amount,
  shippingMode: z.enum(['flat', 'subsidized']).optional(),
  courierShippingCost: amount.optional(),
  customerShippingFee: amount.optional(),
});

const metricsSchema = z.object({
  totalFixedCosts: metricNumber,
  fixedCostPerUnit: metricNumber,
  grossMargin: metricNumber,
  grossMarginPercent: metricNumber,
  breakEvenCPA: metricNumber,
  breakEvenROAS: nullableMetric,
  currentROAS: metricNumber,
  rawNetProfitPerUnit: metricNumber,
  rawTotalProfit: metricNumber,
  rawTotalRevenue: metricNumber,
  rawNetMarginPercent: metricNumber,
  isProfitableRaw: z.boolean(),
  marginOfSafetyROAS: metricNumber,
  effectiveDeliveredShippingCost: metricNumber,
  effectiveReturnedShippingCost: metricNumber,
  adjustedDeliveredUnits: metricNumber,
  adjustedFailedUnits: metricNumber,
  adjustedRealizedRevenue: metricNumber,
  adjustedRealizedCOGS: metricNumber,
  adjustedTotalShippingSpent: metricNumber,
  adjustedTotalAdSpend: metricNumber,
  adjustedTotalProfit: metricNumber,
  adjustedProfitPerDeliveredUnit: metricNumber,
  adjustedProfitPerOrderedUnit: metricNumber,
  adjustedNetMarginPercent: metricNumber,
  adjustedBreakEvenCPA: metricNumber,
  adjustedBreakEvenROAS: nullableMetric,
  adjustedFailedShippingLoss: metricNumber,
  isProfitableAdjusted: z.boolean(),
  marginOfSafetyAdjustedROAS: metricNumber,
});

const snapshotProductSchema = z.object({
  category: z.enum(CATEGORIES),
  inputs: inputsSchema,
  metrics: metricsSchema,
});

const snapshotSchema = z.object({
  id: z.uuid(),
  projectId: z.uuid(),
  capturedAt: timestamp,
  currency: z.enum(CURRENCIES),
  products: z.array(snapshotProductSchema).max(TELEMETRY_LIMITS.maxSnapshotProducts),
});

export const ingestBatchSchema = z.object({
  schemaVersion: z.literal(TELEMETRY_SCHEMA_VERSION),
  deviceId: z.uuid(),
  sentAt: timestamp,
  events: z.array(eventSchema).max(TELEMETRY_LIMITS.maxEventsPerBatch),
  snapshots: z.array(snapshotSchema).max(TELEMETRY_LIMITS.maxSnapshotsPerBatch),
});

export type IngestBatchPayload = z.infer<typeof ingestBatchSchema>;
