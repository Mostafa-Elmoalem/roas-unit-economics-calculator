import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA baseline (AD-20): single source of PWA wiring. injectManifest keeps
    // the hand-written worker in src/sw.ts; registration itself is app-side and
    // user-prompted (src/pwa/). Dev SW stays off: Vite's dev server fights
    // Workbox precache expectations, so matrix rows are verified on builds.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      // The app registers through `virtual:pwa-register` (src/pwa/index.ts);
      // no extra inline/script registration in index.html.
      injectRegister: false,
      devOptions: { enabled: false },
      manifest: {
        name: 'TrueROAS',
        short_name: 'TrueROAS',
        description:
          'Professional Unit Economics and Break-Even ROAS Calculator with full Arabic/RTL support, fulfillment rate factoring, and scenario sensitivity analysis.',
        lang: 'en',
        dir: 'ltr',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: '#09090b',
        background_color: '#09090b',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      // Precache runtime covers the build-emitted app shell (glob defaults) plus
      // the manifest and icons the plugin auto-injects
      // (`manifest.webmanifest`, `/pwa-*.png`, `/apple-touch-icon.png`); no
      // route for the same-origin API in src/sw.ts — dynamic traffic bypasses
      // the worker (C8). Minify stays off: the SW minifier hoists `self` into a
      // local and destroys the literal `self.__WB_MANIFEST` injection point
      // workbox-build matches on.
      injectManifest: {
        globPatterns: ['**/*.{js,css,html}'],
        minify: false,
      },
    }),
  ],
  resolve: {
    // One alias for the pure domain module, shared by app and tests (AD-12).
    alias: {
      '@shared': fileURLToPath(new URL('./shared/src', import.meta.url)),
    },
  },
  // Same-origin `/api/*` in production (behind NPM); locally the dev server proxies
  // to the api service, path preserved (dev parity with prod).
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_URL ?? 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['shared/src/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
