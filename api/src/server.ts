// Entry point: load env, run migrations, serve. The api is the only process that
// holds database credentials (AD-11).
import { serve } from '@hono/node-server';
import pg from 'pg';
import { createApp } from './app';
import { loadConfig } from './config';
import { runMigrations } from './db/migrate';
import { createPgStore } from './db/store';

const { Pool } = pg;

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });
  pool.on('error', (err) => {
    console.error(JSON.stringify({ level: 'error', msg: 'pg pool error', error: err.message }));
  });

  const client = await pool.connect();
  let applied: number[];
  try {
    applied = await runMigrations(client);
  } finally {
    client.release();
  }
  console.log(JSON.stringify({ level: 'info', msg: 'migrations applied', versions: applied }));

  const app = createApp({ store: createPgStore(pool), config });
  const server = serve({ fetch: app.fetch, port: config.port, hostname: '0.0.0.0' }, (info) => {
    console.log(JSON.stringify({ level: 'info', msg: 'api listening', port: info.port }));
  });

  let isShuttingDown = false;
  const shutdown = (signal: string): void => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(JSON.stringify({ level: 'info', msg: 'shutting down', signal }));
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    // Do not hang forever on lingering keep-alive connections.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'api failed to start',
      error: error instanceof Error ? error.message : String(error),
    })
  );
  process.exit(1);
});
