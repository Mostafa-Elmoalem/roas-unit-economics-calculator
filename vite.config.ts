import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    // One alias for the pure domain module, shared by app and tests (AD-12).
    alias: {
      '@shared': fileURLToPath(new URL('./shared/src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['shared/src/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
