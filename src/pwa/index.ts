// Sealed PWA module (AD-20): the only place that touches service-worker
// registration. All optional/runtime specifics (including the
// `virtual:pwa-register` module) are imported inside the boot function, so the
// pure state machine in `flow.ts` stays node-testable — tests `vi.mock` the
// virtual module and call the exports below directly. Registration is
// fire-and-forget app-entry wiring (like telemetry's start): a hostile
// environment must never block or break boot.
import {
  acceptReload,
  getUpdateSnapshot,
  resetPersistGuardForTests,
  resetUpdateFlowForTests,
  updateAvailable,
} from './flow';

// Consumer-facing pure API (App toast + AppContext save sites).
export {
  type UpdateFlowPhase,
  type UpdateFlowSnapshot,
  dismissUpdate,
  getUpdateSnapshot,
  onUpdateSnapshot,
  requestStoragePersistence,
  updateAvailable,
} from './flow';

type UpdateServiceWorkerFn = (reloadPage?: boolean) => Promise<void>;

let triggerUpdate: UpdateServiceWorkerFn | null = null;

/**
 * Boot wiring: guarded SW registration. Returns immediately from unsupported
 * or hostile environments (no `serviceWorker` in navigator, virtual module
 * failure); any rejection is swallowed — boot never depends on the worker.
 * `onNeedRefresh` feeds the prompt flow only when a controller exists and a
 * new worker is waiting, so the toast is a strictly user-prompted update.
 */
export async function setupServiceWorker(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    triggerUpdate = await registerSW({
      onNeedRefresh: () => {
        updateAvailable();
      },
      onOfflineReady: () => {
        // Silent by design: the shell precache is the offline feature itself;
        // advertising it would fight the "half-offline expectations" guard.
      },
    });
  } catch {
    triggerUpdate = null; // unregistered app still works (plain web tab)
  }
}

/**
 * The update toast's Reload action: marks the accepted transition in the flow,
 * then hands skip-waiting to the waiting worker (the register module reloads
 * the page once the replacement takes control). Dismissed or idle flows make
 * this a silent no-op, and without a waiting worker the register module never
 * fires its reload.
 */
export function acceptUpdateReload(): void {
  if (getUpdateSnapshot().phase !== 'updateAvailable') return;
  acceptReload(); // toast hides now; page reload lands when the worker controls
  const trigger = triggerUpdate;
  if (!trigger) return;
  try {
    void trigger(true).catch(() => undefined);
  } catch {
    // hostile runtime: the accepted phase already hides the prompt
  }
}

/** Test teardown: registration wiring back to a pristine state. */
export function resetSetupForTests(): void {
  triggerUpdate = null;
  resetUpdateFlowForTests();
  resetPersistGuardForTests();
}
