// Hand-written app-shell service worker (AD-20): the production worker is the
// built bundle of this file with the precache manifest injected at the literal
// `self.__WB_MANIFEST` — workbox-build matches that exact expression in the
// built output, so `self` is NEVER aliased through a local here: every
// reference stays a direct member access (TypeScript casts below are erased,
// keeping the runtime expression verbatim). It precaches the build-emitted
// app shell only and serves offline navigations from the precached index.html
// (C2, second visit onwards). Deliberately unregistered:
// - no route handler exists for the same-origin API — those requests bypass
//   this worker untouched (C8); telemetry already owns its own retry semantics
//   (C12), so no background sync and no push are registered either.
// - no runtime caching layer of any kind: everything below is precache-driven.
import { clientsClaim } from 'workbox-core';
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

// The DOM lib types `self` as Window, but inside this classic worker it is a
// ServiceWorkerGlobalScope carrying the injected precache manifest. The casts
// are erased at build time — they exist only to satisfy the app compilation.
type WorkerRuntimeSelf = {
  /** Build-injected precache manifest (vite-plugin-pwa injectManifest). */
  __WB_MANIFEST: { url: string; revision: string | null }[];
  skipWaiting(): Promise<void>;
};

// Precache the build-emitted static assets (hashed app shell + index.html).
precacheAndRoute((self as unknown as WorkerRuntimeSelf).__WB_MANIFEST);

// Offline navigations resolve to the precached index.html (app shell, C2).
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// User-prompted updates only (C8/AD-20): the app sends this message when the
// user explicitly accepts the in-app update prompt — never auto-deployed.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void (self as unknown as WorkerRuntimeSelf).skipWaiting();
  }
});

// An activated worker takes control so the accepted update lands on reload.
clientsClaim();
