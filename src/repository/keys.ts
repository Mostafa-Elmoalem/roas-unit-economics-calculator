// Namespaced, versioned storage keys (AD-5). The telemetry-queue namespace
// (`trueroas_v1_telemetry_*`) is reserved for the telemetry pipeline and is
// never pruned by state operations (C12).
export const STATE_KEY = 'trueroas_v1_state';
export const DEVICE_ID_KEY = 'trueroas_v1_device_id';
export const TELEMETRY_QUEUE_KEY = 'trueroas_v1_telemetry_queue';

export { LEGACY_STORAGE_KEYS } from '@shared';
