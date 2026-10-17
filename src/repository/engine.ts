// Injectable storage engine — the only place in the app that touches browser
// storage APIs (AD-5, CAP-8). Nothing outside `src/repository/` may use these.
export interface StorageEngine {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/**
 * Browser engine: reads session first then local; writes synchronously to both
 * (dual-write zero-loss behavior preserved from the pre-repository app).
 */
export function createBrowserEngine(): StorageEngine {
  return {
    get(key: string): string | null {
      if (typeof window === 'undefined') return null;

      try {
        const sessionValue = window.sessionStorage?.getItem(key);
        if (sessionValue !== null && sessionValue !== undefined && sessionValue !== '') {
          return sessionValue;
        }
      } catch {
        // fall through to local
      }

      try {
        const localValue = window.localStorage?.getItem(key);
        if (localValue !== null && localValue !== undefined && localValue !== '') {
          return localValue;
        }
      } catch {
        // fall through to null
      }

      return null;
    },

    set(key: string, value: string): void {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage?.setItem(key, value);
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      try {
        window.sessionStorage?.setItem(key, value);
      } catch (err) {
        console.warn('SessionStorage save error:', err);
      }
    },
  };
}

/** In-memory engine for tests and SSR-ish environments. */
export function createMemoryEngine(initial: Record<string, string> = {}): StorageEngine {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => {
      store.set(key, value);
    },
  };
}
