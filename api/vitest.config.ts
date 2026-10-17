import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// The api consumes the same pure domain module as the web app (AD-12); CI stays
// Docker-free — tests inject an in-memory Store instead of Postgres.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
