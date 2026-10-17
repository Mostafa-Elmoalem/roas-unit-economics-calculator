-- 001_init — the ingest dataset (AD-15/17, C18-ready columns). Forward-only and idempotent.
-- Four tables only: usage_events, snapshots, snapshot_products, schema_migrations.
-- No devices/users tables before Phase 3.

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    integer PRIMARY KEY,
  name       text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- Anonymous usage events (deviceId attributes rows; never an account).
CREATE TABLE IF NOT EXISTS usage_events (
  id          uuid PRIMARY KEY,
  device_id   uuid NOT NULL,
  name        text NOT NULL,
  occurred_at timestamptz NOT NULL,
  props       jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_device_id ON usage_events (device_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_name ON usage_events (name);
CREATE INDEX IF NOT EXISTS idx_usage_events_occurred_at ON usage_events (occurred_at);

-- One anonymized snapshot per project change (throttled client-side).
CREATE TABLE IF NOT EXISTS snapshots (
  id          uuid PRIMARY KEY,
  device_id   uuid NOT NULL,
  project_id  uuid NOT NULL,
  captured_at timestamptz NOT NULL,
  currency    text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_device_id ON snapshots (device_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_currency ON snapshots (currency);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON snapshots (captured_at);

-- Product rows with category/currency as first-class columns for dataset group-bys;
-- inputs are the client allowlist, metrics are the server's shared-domain recomputation.
CREATE TABLE IF NOT EXISTS snapshot_products (
  snapshot_id uuid NOT NULL REFERENCES snapshots (id) ON DELETE CASCADE,
  position    integer NOT NULL,
  category    text NOT NULL,
  currency    text NOT NULL,
  inputs      jsonb NOT NULL,
  metrics     jsonb NOT NULL,
  PRIMARY KEY (snapshot_id, position)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_products_category ON snapshot_products (category);
CREATE INDEX IF NOT EXISTS idx_snapshot_products_currency ON snapshot_products (currency);
