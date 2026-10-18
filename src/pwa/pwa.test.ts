// Node tests for the PWA module (matrix rows reachable without a real SW):
// the update-prompt state machine, the guarded registration (a failing
// `virtual:pwa-register` must never break boot), the one-shot storage
// persistence guard, and an i18n key-presence check so missing prompt
// translations fail CI instead of shipping an English-only prompt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import enLocales from '../i18n/locales/en.json';
import arLocales from '../i18n/locales/ar.json';
import {
  acceptUpdateReload,
  dismissUpdate,
  getUpdateSnapshot,
  onUpdateSnapshot,
  requestStoragePersistence,
  resetSetupForTests,
  setupServiceWorker,
  updateAvailable,
} from './index';
import { acceptReload, resetUpdateFlowForTests } from './flow';

// `virtual:pwa-register` is a Vite-only virtual module; mocking the specifier
// keeps the hand-written registration wiring node-testable.
const updateSWMock = vi.hoisted(() =>
  vi.fn((_reloadPage?: boolean): Promise<void> => Promise.resolve())
);
const registerSWMock = vi.hoisted(() => vi.fn());

vi.mock('virtual:pwa-register', () => ({ registerSW: registerSWMock }));

interface CapturedRegisterOptions {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

function registeredOptions(): CapturedRegisterOptions {
  const call = registerSWMock.mock.calls[0] as [CapturedRegisterOptions] | undefined;
  if (!call) throw new Error('registerSW was not called');
  return call[0];
}

beforeEach(() => {
  registerSWMock.mockImplementation(() => updateSWMock);
  updateSWMock.mockClear();
  registerSWMock.mockClear();
});

afterEach(() => {
  resetSetupForTests();
  resetUpdateFlowForTests();
  vi.unstubAllGlobals();
});

describe('UPDATE_AVAILABLE / UPDATE_ACCEPTED / dismiss (prompt flow state machine)', () => {
  it('idle → updateAvailable on the worker wait callback; a repeat event keeps the prompt up', () => {
    expect(getUpdateSnapshot().phase).toBe('idle');

    updateAvailable();
    expect(getUpdateSnapshot().phase).toBe('updateAvailable');

    updateAvailable();
    expect(getUpdateSnapshot().phase).toBe('updateAvailable');
  });

  it('Reload acceptance hides the prompt and hands skip-waiting to the register module exactly once', async () => {
    vi.stubGlobal('navigator', { serviceWorker: {} });
    await setupServiceWorker();

    updateAvailable();
    acceptUpdateReload();

    expect(getUpdateSnapshot().phase).toBe('reloading');
    expect(updateSWMock).toHaveBeenCalledTimes(1);
    expect(updateSWMock).toHaveBeenCalledWith(true);

    // further acceptance attempts are one-shot (the waiting worker is activating)
    acceptUpdateReload();
    expect(updateSWMock).toHaveBeenCalledTimes(1);
    await Promise.resolve();
  });

  it('Dismiss hides the prompt for the session; later wait callbacks cannot re-prompt or reload', async () => {
    updateAvailable();
    dismissUpdate();
    expect(getUpdateSnapshot().phase).toBe('dismissed');

    updateAvailable();
    expect(getUpdateSnapshot().phase).toBe('dismissed');

    // reload cannot be hand-triggered from a dismissed session
    acceptUpdateReload();
    expect(updateSWMock).not.toHaveBeenCalled();
    await Promise.resolve();
  });

  it('pure acceptReload() is a no-op outside of the prompt phase', () => {
    acceptReload();
    expect(getUpdateSnapshot().phase).toBe('idle');
  });

  it('notifies subscribers only on actual transitions, and unsubscription detaches them', () => {
    const seen: string[] = [];
    const unsubscribe = onUpdateSnapshot((snapshot) => seen.push(snapshot.phase));

    updateAvailable();
    updateAvailable();
    dismissUpdate();
    unsubscribe();
    updateAvailable();

    expect(seen).toEqual(['updateAvailable', 'dismissed']);
  });
});

describe('guarded registration (FIRST_INSTALL / UPDATE_AVAILABLE error handling)', () => {
  it('registers through the virtual module and feeds onNeedRefresh into the flow', async () => {
    vi.stubGlobal('navigator', { serviceWorker: {} });
    await setupServiceWorker();

    expect(registerSWMock).toHaveBeenCalledTimes(1);
    expect(registeredOptions().onNeedRefresh).toBeTypeOf('function');

    registeredOptions().onNeedRefresh?.();
    expect(getUpdateSnapshot().phase).toBe('updateAvailable');
    // onOfflineReady stays silent: no user-facing toast for the precached shell
  });

  it('does nothing when the browser has no serviceWorker (flow stays idle, never prompts)', async () => {
    vi.stubGlobal('navigator', {}); // no serviceWorker at all
    await setupServiceWorker();

    expect(registerSWMock).not.toHaveBeenCalled();
    expect(getUpdateSnapshot().phase).toBe('idle');
    acceptUpdateReload();
    expect(updateSWMock).not.toHaveBeenCalled();
    await Promise.resolve();
  });

  it('a throwing virtual module never breaks the flow (silent guarded skip)', async () => {
    registerSWMock.mockImplementation(() => {
      throw new Error('worker universe collapsed');
    });
    vi.stubGlobal('navigator', { serviceWorker: {} });

    await expect(setupServiceWorker()).resolves.toBeUndefined();
    expect(updateSWMock).not.toHaveBeenCalled();
    expect(getUpdateSnapshot().phase).toBe('idle');
  });

  it('prompt-guard: the flow stays idle until the worker actually reports a waiting update', async () => {
    vi.stubGlobal('navigator', { serviceWorker: {} });
    await setupServiceWorker();

    // registration succeeded, but no wait callback arrives yet
    expect(getUpdateSnapshot().phase).toBe('idle');

    registeredOptions().onNeedRefresh?.();
    expect(getUpdateSnapshot().phase).toBe('updateAvailable');
  });
});

describe('FIRST_SAVE_PERSIST (one-shot storage persistence guard)', () => {
  it('requests persist exactly once across repeated data saves', () => {
    const persistMock = vi.fn(async () => true);
    vi.stubGlobal('navigator', { storage: { persist: persistMock } });

    requestStoragePersistence();
    requestStoragePersistence();
    requestStoragePersistence();

    expect(persistMock).toHaveBeenCalledTimes(1);
  });

  it('an unsupported browser consumes the session attempt silently', () => {
    vi.stubGlobal('navigator', {}); // no storage manager

    expect(() => requestStoragePersistence()).not.toThrow();

    // later saves (supporting manager appears late) still do not re-attempt
    const persistMock = vi.fn(async () => true);
    vi.stubGlobal('navigator', { storage: { persist: persistMock } });
    requestStoragePersistence();
    expect(persistMock).not.toHaveBeenCalled();
  });

  it('a denied persistence is swallowed and changes nothing else', async () => {
    const persistMock = vi.fn(async () => {
      throw new Error('denied');
    });
    vi.stubGlobal('navigator', { storage: { persist: persistMock } });

    expect(() => requestStoragePersistence()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 1)); // let the catch handler run (no unhandled rejection)

    expect(persistMock).toHaveBeenCalledTimes(1);
    requestStoragePersistence();
    expect(persistMock).toHaveBeenCalledTimes(1);
  });

  it('counts as attempted when navigator is absent (hostile runtime), never re-attempted', () => {
    vi.stubGlobal('navigator', undefined);
    expect(() => requestStoragePersistence()).not.toThrow();

    const persistMock = vi.fn(async () => true);
    vi.stubGlobal('navigator', { storage: { persist: persistMock } });
    requestStoragePersistence();
    expect(persistMock).not.toHaveBeenCalled();
  });
});

describe('i18n key presence (both locales carry the update prompt strings)', () => {
  it('en + ar expose pwa.updateAvailable / pwa.reload / pwa.dismiss with symmetric keys', () => {
    for (const key of ['updateAvailable', 'reload', 'dismiss'] as const) {
      expect(typeof enLocales.pwa[key]).toBe('string');
      expect((enLocales.pwa[key] as string).length).toBeGreaterThan(0);
      expect(typeof arLocales.pwa[key]).toBe('string');
      expect((arLocales.pwa[key] as string).length).toBeGreaterThan(0);
    }
    // keep the sections symmetric: a missing translation fails here, not in prod
    expect(Object.keys(arLocales.pwa).sort()).toEqual(Object.keys(enLocales.pwa).sort());
  });
});

// ---------------------------------------------------------------------------
// Production wiring pins (review V3 remedy, scan style of
// src/repository/storage-guard.test.ts): production wiring cannot be driven by
// node tests at runtime, so the exact call sites are pinned by source scan —
// a refactor that silently drops boot registration, the toast render, or one
// of the four persist sites fails here while all pure-logic suites stay green.
// Matches are line-anchored on the trimmed line start, so commenting a call
// out does NOT count as wired and a re-fire/re-order of sites fails loudly.
// ---------------------------------------------------------------------------
const SRC_WIRE = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));
const readSource = (relativePath: string): string => readFileSync(SRC_WIRE(relativePath), 'utf8');
const sourceLines = (source: string): string[] => source.split(/\r?\n/);
const lineStartsWith = (lines: string[], needle: string, from = 0): number =>
  lines.findIndex((line, index) => index >= from && line.trimStart().startsWith(needle));

describe('production wiring pins (V3): boot registration, toast render, persist sites', () => {
  it('main.tsx invokes the guarded registration at boot (app-entry wiring)', () => {
    const lines = sourceLines(readSource('../main.tsx'));
    expect(lineStartsWith(lines, 'void setupServiceWorker()')).toBeGreaterThan(-1);
  });

  it('App.tsx renders the update toast exactly once, imported from the sealed module', () => {
    const source = readSource('../App.tsx');
    expect(source).toContain("import { UpdateToast } from './components/common/UpdateToast'");
    expect(sourceLines(source).filter((line) => line.trim() === '<UpdateToast />')).toHaveLength(1);
  });

  it('AppContext hooks the one-shot persist guard at exactly the 4 data-bearing sites', () => {
    const lines = sourceLines(readSource('../context/AppContext.tsx'));
    const CALL = 'requestStoragePersistence();';
    const callLines = lines.filter((line) => line.trimStart().startsWith(CALL));
    expect(callLines).toHaveLength(4);

    // each call must sit inside its data-bearing function, just before that
    // function's own telemetry emit (the save marker it belongs to)
    const sites = [
      {
        fn: 'addProduct',
        signature: 'const addProduct = (productData?: Partial<Product>)',
        saveMarker: "emitTelemetry('product_created', { productId: newProduct.id",
      },
      {
        fn: 'duplicateProduct',
        signature: 'const duplicateProduct = (id: string)',
        saveMarker: "emitTelemetry('product_created', { productId: duplicate.id",
      },
      {
        fn: 'importProducts (CSV)',
        signature: 'const importProducts = (newProducts: Product[]',
        saveMarker: "emitTelemetry('csv_imported',",
      },
      {
        fn: 'restoreBackupFromJson',
        signature: 'const restoreBackupFromJson = useCallback((text: string)',
        saveMarker: "emitTelemetry('backup_restored',",
      },
    ];

    let cursor = 0;
    for (const site of sites) {
      const fnStart = lineStartsWith(lines, site.signature, cursor);
      expect(fnStart, `${site.fn} definition missing`).toBeGreaterThan(-1);
      const call = lineStartsWith(lines, CALL, fnStart);
      expect(call, `${site.fn} lacks its persist call`).toBeGreaterThan(fnStart);
      const marker = lineStartsWith(lines, site.saveMarker, fnStart);
      expect(marker, `${site.fn} save marker missing`).toBeGreaterThan(-1);
      expect(call, `${site.fn} persist call must precede its telemetry emit`).toBeLessThan(marker);
      cursor = call + 1; // site occurrences must appear in this order
    }
    expect(
      lineStartsWith(lines, CALL, cursor),
      'a 5th persist call exists — the frozen matrix allows exactly 4 data-bearing sites'
    ).toBe(-1);
  });

  it('the commit choke point (fires on ANY save incl. language switch) is never persist-hooked', () => {
    const source = readSource('../context/AppContext.tsx');
    const commitStart = source.indexOf('const commit = useCallback(');
    const addProductStart = source.indexOf('const addProduct = (');
    expect(commitStart).toBeGreaterThan(-1);
    expect(addProductStart).toBeGreaterThan(commitStart);
    expect(source.slice(commitStart, addProductStart)).not.toContain('requestStoragePersistence');
  });

  it('UpdateToast drives the flow state machine (store subscription + Reload/Dismiss actions)', () => {
    const source = readSource('../components/common/UpdateToast.tsx');
    expect(source).toContain('useSyncExternalStore(onUpdateSnapshot, getUpdateSnapshot)');
    expect(source).toContain('onClick={acceptUpdateReload}');
    expect(source).toContain('onClick={dismissUpdate}');
  });

  it("vite.config.ts pins the VitePWA contract that generates the prompt-mode runtime", () => {
    const source = readSource('../../vite.config.ts');
    expect(source).toContain("strategies: 'injectManifest'");
    expect(source).toContain("registerType: 'prompt'");
    expect(source).toContain('injectRegister: false');
    // the shell glob must still cover index.html (the offline navigation target)
    const globStart = source.indexOf('globPatterns:');
    expect(globStart).toBeGreaterThan(-1);
    const globSlice = source.slice(globStart, source.indexOf(']', globStart) + 1);
    expect(globSlice).toContain('**/*.{js,css,html}');
  });

  it('nginx.conf serves the update artifacts with no-cache (the contract the update flow depends on)', () => {
    const source = readSource('../../nginx.conf');
    for (const location of ['location = /sw.js {', 'location = /manifest.webmanifest {']) {
      const start = source.indexOf(location);
      expect(start, `${location} block missing`).toBeGreaterThan(-1);
      const block = source.slice(start, source.indexOf('}', start));
      expect(block, `${location} must declare the no-cache policy`).toContain(
        'Cache-Control "no-cache, no-store, must-revalidate"'
      );
    }
  });
});
