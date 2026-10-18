// Pure PWA logic (sealed-module precedent of src/telemetry/): the update-prompt
// state machine and the one-shot storage-persistence guard. No DOM wiring and
// no service-worker knowledge — only `navigator.storage.persist()` is ever
// touched here (the single persistence concern, AD-20). `index.ts` is the only
// module that talks to the service worker, so node tests drive everything in
// this file with plain stubs.

// ---------------------------------------------------------------------------
// Update prompt flow: idle → update-available → (reloading | dismissed).
// Dismissal is intentionally NOT persisted anywhere: a dismissed update simply
// re-prompts in the next session (Design Notes); module state lives for one
// session only. Every transition is wrapped in a subscription notify, and the
// snapshot object is cached so external-store subscribers get referential
// stability between transitions.
// ---------------------------------------------------------------------------

export type UpdateFlowPhase = 'idle' | 'updateAvailable' | 'reloading' | 'dismissed';

export interface UpdateFlowSnapshot {
  phase: UpdateFlowPhase;
}

type UpdateFlowListener = (snapshot: UpdateFlowSnapshot) => void;

const SNAPSHOTS: Record<UpdateFlowPhase, UpdateFlowSnapshot> = {
  idle: { phase: 'idle' },
  updateAvailable: { phase: 'updateAvailable' },
  reloading: { phase: 'reloading' },
  dismissed: { phase: 'dismissed' },
};

let phase: UpdateFlowPhase = 'idle';
const listeners = new Set<UpdateFlowListener>();

function setPhase(next: UpdateFlowPhase): void {
  if (phase === next) return;
  phase = next;
  const snapshot = SNAPSHOTS[next];
  for (const listener of listeners) listener(snapshot);
}

/** Current snapshot (stable reference between transitions). */
export function getUpdateSnapshot(): UpdateFlowSnapshot {
  return SNAPSHOTS[phase];
}

/** Subscribe to snapshot transitions; returns the unsubscribe function. */
export function onUpdateSnapshot(listener: UpdateFlowListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * The worker reports new content waiting (virtual:pwa-register's
 * `onNeedRefresh`). After a dismissal the prompt stays hidden for the session
 * no matter how many times this fires; a reload restarts the machine.
 */
export function updateAvailable(): void {
  if (phase === 'dismissed' || phase === 'reloading') return;
  setPhase('updateAvailable');
}

/** User clicked Dismiss: no more prompts this session (never persisted). */
export function dismissUpdate(): void {
  if (phase !== 'updateAvailable') return;
  setPhase('dismissed');
}

/**
 * User clicked Reload: machine moves to the reloading phase (UI hides), the
 * caller in index.ts performs the actual skip-waiting handover.
 */
export function acceptReload(): void {
  if (phase !== 'updateAvailable') return;
  setPhase('reloading');
}

/** Test/session teardown: back to idle, listeners detached. */
export function resetUpdateFlowForTests(): void {
  phase = 'idle';
  listeners.clear();
}

// ---------------------------------------------------------------------------
// Storage persistence guard (AD-20): request `navigator.storage.persist()`
// exactly once per session, on the first data save, fire-and-forget.
// Unsupporting browser or a denial is a silent skip — persistence is an
// optimization on top of the repository's existing dual-storage, never a
// user-visible feature.
// ---------------------------------------------------------------------------

let persistRequested = false;

/**
 * At most one `navigator.storage.persist()` attempt per session (AD-20):
 * the first data save marks the request attempted, and any later save is a
 * no-op even if the browser is unsupported or the attempt was denied.
 */
export function requestStoragePersistence(): void {
  if (persistRequested) return;
  persistRequested = true;
  const manager = typeof navigator === 'undefined' ? undefined : navigator.storage;
  if (!manager || typeof manager.persist !== 'function') return; // silent skip
  // Fire-and-forget: a denial (or a throwing context) must never surface.
  void manager.persist.call(manager).catch(() => undefined);
}

/** Test teardown: allow exactly-one to be re-evaluated. */
export function resetPersistGuardForTests(): void {
  persistRequested = false;
}
