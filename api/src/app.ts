// Hono assembly (AD-11/22): structured JSON logs, `GET /health`, and the single
// `POST /api/ingest` door. Route order: JSON parse -> forbidden-field scan ->
// schema validation -> rate limit -> service (recompute + store).
import { Hono, type Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiConfig } from './config';
import type { Store } from './db/store';
import { ingestBatchSchema } from './schemas/ingest';
import { findForbiddenField, ingestBatch } from './services/ingest';
import { createRateLimiter } from './services/rateLimit';

export interface AppDependencies {
  store: Store;
  config: ApiConfig;
}

function logEntry(entry: Record<string, unknown>): void {
  console.log(JSON.stringify(entry));
}

function errorResponse(c: Context, status: ContentfulStatusCode, code: string, message: string) {
  return c.json({ error: { code, message } }, status);
}

export function createApp({ store, config }: AppDependencies): Hono {
  const app = new Hono();
  const rateLimiter = createRateLimiter(config.rateLimitPerMinute);

  // Structured JSON request log (AD-22).
  app.use('*', async (c, next) => {
    const startedAt = Date.now();
    let status = 500;
    try {
      await next();
      status = c.res.status;
    } finally {
      logEntry({
        level: status >= 500 ? 'error' : 'info',
        msg: 'request',
        method: c.req.method,
        path: c.req.path,
        status,
        durationMs: Date.now() - startedAt,
      });
    }
  });

  app.get('/health', (c) => c.json({ status: 'ok', uptime: Math.round(process.uptime()) }));

  app.post('/api/ingest', async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return errorResponse(c, 400, 'invalid_payload', 'Body must be valid JSON');
    }

    // The scan runs on the raw body, before any schema stripping (C7/AD-16).
    const forbidden = findForbiddenField(raw);
    if (forbidden) {
      return errorResponse(c, 400, 'forbidden_field', `Field "${forbidden}" is not allowed`);
    }

    const parsed = ingestBatchSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(c, 400, 'invalid_payload', 'Payload failed validation');
    }

    if (!rateLimiter.check(parsed.data.deviceId)) {
      return errorResponse(c, 429, 'rate_limited', 'Too many requests for this device');
    }

    const outcome = await ingestBatch(parsed.data, store);
    if (!outcome.ok) {
      return errorResponse(c, 400, outcome.code, outcome.message);
    }

    return c.json({ ok: true, accepted: outcome.accepted });
  });

  app.notFound((c) => errorResponse(c, 404, 'not_found', 'Not found'));

  app.onError((error, c) => {
    logEntry({
      level: 'error',
      msg: 'unhandled error',
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse(c, 500, 'internal_error', 'Internal server error');
  });

  return app;
}
