// Environment configuration — config via env per deployment (AD-22).
export interface ApiConfig {
  port: number;
  databaseUrl: string;
  rateLimitPerMinute: number;
}

const DEFAULT_DATABASE_URL = 'postgres://trueroas:trueroas@localhost:5432/trueroas';

export function loadConfig(env: Record<string, string | undefined> = process.env): ApiConfig {
  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${env.PORT ?? ''}`);
  }

  const rateLimitPerMinute = Number(env.RATE_LIMIT_PER_MINUTE ?? '60');
  if (!Number.isInteger(rateLimitPerMinute) || rateLimitPerMinute <= 0) {
    throw new Error(`Invalid RATE_LIMIT_PER_MINUTE: ${env.RATE_LIMIT_PER_MINUTE ?? ''}`);
  }

  const databaseUrl = env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;

  return { port, databaseUrl, rateLimitPerMinute };
}
