import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  activeProducts,
  applyProductPatch,
  calculatePortfolioMetrics,
  calculateProductMetrics,
  createProduct,
  deleteProduct as tombstoneProduct,
  duplicateProduct as duplicateProductOp,
  findProject,
  serializeBackup,
  upsertProject,
} from '@shared';
import type {
  AppState,
  CalculatedMetrics,
  Currency,
  Language,
  PortfolioMetrics,
  Product,
  Project,
  ThemeMode,
  ViewMode,
} from '@shared';
import { repository } from '../repository';
import { setAppLanguage } from '../i18n/config';

interface AppContextType {
  projectName: string;
  currency: Currency;
  products: Product[];
  activeProductId: string | null;
  view: ViewMode;
  searchQuery: string;
  activeProduct: Product | undefined;
  portfolioMetrics: PortfolioMetrics;
  activeProductMetrics: CalculatedMetrics | undefined;
  theme: ThemeMode;
  effectiveTheme: 'dark' | 'light';
  language: Language;
  comparedProductIds: string[];

  setProjectName: (name: string) => void;
  setCurrency: (currency: Currency) => void;
  setActiveProductId: (id: string | null) => void;
  setView: (view: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
  setComparedProductIds: (ids: string[]) => void;
  toggleComparedProduct: (id: string) => void;
  clearComparedProducts: () => void;

  addProduct: (productData?: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => Product;
  importProducts: (newProducts: Product[], replace?: boolean) => void;
  resetToDemoData: () => void;

  exportBackupJson: () => string;
  restoreBackupFromJson: (text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

const applyThemeToDOM = (effective: 'dark' | 'light') => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (effective === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Whole state loads (and migrates/seeds) through the single repository (CAP-8).
  const [state, setState] = useState<AppState>(() => repository.load());
  const stateRef = useRef(state);

  // Every mutation goes through one synchronous commit path: React state + dual-storage write.
  const commit = useCallback((updater: (prev: AppState) => AppState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    repository.save(next);
  }, []);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme);

  // Effective theme resolving 'system' to OS preference
  const theme = state.ui.theme;
  const effectiveTheme: 'dark' | 'light' = useMemo(() => {
    if (theme === 'system') return systemTheme;
    return theme;
  }, [theme, systemTheme]);

  // Listen to OS system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply effective theme to HTML element
  useEffect(() => {
    applyThemeToDOM(effectiveTheme);
  }, [effectiveTheme]);

  // Synchronous flush on tab close / background (zero-loss behavior preserved)
  useEffect(() => {
    const handleUnload = () => {
      repository.flush();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        repository.flush();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 2. Derived active project / product and metrics
  const activeProject = useMemo(
    () => findProject(state, state.activeProjectId),
    [state]
  );

  const products = useMemo(
    () => activeProducts(activeProject?.products ?? []),
    [activeProject]
  );

  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === state.ui.activeProductId) || products[0];
  }, [products, state.ui.activeProductId]);

  const portfolioMetrics = useMemo(() => {
    return calculatePortfolioMetrics(products);
  }, [products]);

  const activeProductMetrics = useMemo(() => {
    if (!activeProduct) return undefined;
    return calculateProductMetrics(activeProduct);
  }, [activeProduct]);

  // 3. Project-level helpers — all rules live in the domain module (CAP-9)
  const updateActiveProject = useCallback(
    (updater: (project: Project) => Project) => {
      commit((prev) => {
        const project = findProject(prev, prev.activeProjectId);
        if (!project) return prev;
        return { ...prev, projects: upsertProject(prev.projects, updater(project)) };
      });
    },
    [commit]
  );

  const updateProjectProducts = useCallback(
    (mapper: (products: Product[]) => Product[]) => {
      updateActiveProject((project) => ({
        ...project,
        products: mapper(project.products),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateActiveProject]
  );

  const setProjectName = (name: string) => {
    updateActiveProject((project) => ({ ...project, name, updatedAt: new Date().toISOString() }));
  };

  const setCurrency = (currency: Currency) => {
    updateActiveProject((project) => ({ ...project, currency, updatedAt: new Date().toISOString() }));
  };

  const setActiveProductId = (id: string | null) => {
    commit((prev) => ({ ...prev, ui: { ...prev.ui, activeProductId: id } }));
  };

  const setView = (view: ViewMode) => {
    commit((prev) => ({ ...prev, ui: { ...prev.ui, view } }));
  };

  const setTheme = (t: ThemeMode) => {
    commit((prev) => ({ ...prev, ui: { ...prev.ui, theme: t } }));
  };

  const toggleTheme = () => {
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  const setLanguage = (language: Language) => {
    commit((prev) =>
      prev.ui.language === language
        ? prev
        : { ...prev, ui: { ...prev.ui, language } }
    );
    setAppLanguage(language);
  };

  const setComparedProductIds = (ids: string[]) => {
    commit((prev) => ({ ...prev, ui: { ...prev.ui, comparedProductIds: ids } }));
  };

  const toggleComparedProduct = (id: string) => {
    commit((prev) => {
      const includes = prev.ui.comparedProductIds.includes(id);
      const next = includes
        ? prev.ui.comparedProductIds.filter((x) => x !== id)
        : [...prev.ui.comparedProductIds, id];
      return { ...prev, ui: { ...prev.ui, comparedProductIds: next } };
    });
  };

  const clearComparedProducts = () => {
    commit((prev) => ({ ...prev, ui: { ...prev.ui, comparedProductIds: [] } }));
  };

  // 4. Product actions — mutations delegated to domain operations (AD-6)
  const addProduct = (productData?: Partial<Product>): Product => {
    const current = stateRef.current;
    const project = findProject(current, current.activeProjectId);
    const visibleCount = project ? project.products.filter((p) => !p.deleted).length : 0;
    const newProduct = createProduct({
      ...productData,
      name: productData?.name || `New Product ${visibleCount + 1}`,
    });

    commit((prev) => {
      const activeProjectNow = findProject(prev, prev.activeProjectId);
      if (!activeProjectNow) return prev;
      const nextProject: Project = {
        ...activeProjectNow,
        products: [newProduct, ...activeProjectNow.products],
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        projects: upsertProject(prev.projects, nextProject),
        ui: { ...prev.ui, activeProductId: newProduct.id, view: 'calculator' },
      };
    });

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    updateProjectProducts((productsNow) =>
      productsNow.map((p) => (p.id === id ? applyProductPatch(p, updates) : p))
    );
  };

  const deleteProduct = (id: string) => {
    commit((prev) => {
      const project = findProject(prev, prev.activeProjectId);
      if (!project) return prev;

      const nextProducts = project.products.map((p) =>
        p.id === id ? tombstoneProduct(p) : p
      );
      const visible = activeProducts(nextProducts);

      const ui = { ...prev.ui, comparedProductIds: prev.ui.comparedProductIds.filter((x) => x !== id) };
      if (prev.ui.activeProductId === id) {
        ui.activeProductId = visible[0]?.id ?? null;
        if (visible.length === 0) {
          ui.view = 'dashboard';
        }
      }

      const nextProject: Project = {
        ...project,
        products: nextProducts,
        updatedAt: new Date().toISOString(),
      };
      return { ...prev, projects: upsertProject(prev.projects, nextProject), ui };
    });
  };

  const duplicateProduct = (id: string): Product => {
    const current = stateRef.current;
    const project = findProject(current, current.activeProjectId);
    const target = project?.products.find((p) => p.id === id && !p.deleted);
    if (!target) throw new Error('Product not found');

    const duplicate = duplicateProductOp(target);

    commit((prev) => {
      const activeProjectNow = findProject(prev, prev.activeProjectId);
      if (!activeProjectNow) return prev;
      const nextProject: Project = {
        ...activeProjectNow,
        products: [duplicate, ...activeProjectNow.products],
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        projects: upsertProject(prev.projects, nextProject),
        ui: { ...prev.ui, activeProductId: duplicate.id },
      };
    });

    return duplicate;
  };

  const importProducts = (newProducts: Product[], replace = false) => {
    commit((prev) => {
      const project = findProject(prev, prev.activeProjectId);
      if (!project) return prev;
      const nextProducts = replace ? newProducts : [...newProducts, ...project.products];
      const nextProject: Project = {
        ...project,
        products: nextProducts,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        projects: upsertProject(prev.projects, nextProject),
        ui: { ...prev.ui, activeProductId: newProducts[0]?.id || null },
      };
    });
  };

  const resetToDemoData = () => {
    const demo = repository.createDemoState();
    commit((prev) => ({
      ...prev,
      activeProjectId: demo.activeProjectId,
      projects: demo.projects,
      ui: {
        ...prev.ui,
        activeProductId: demo.ui.activeProductId,
        comparedProductIds: demo.ui.comparedProductIds,
      },
    }));
  };

  // 5. Backup / restore (CAP-10)
  const exportBackupJson = useCallback((): string => serializeBackup(stateRef.current), []);

  const restoreBackupFromJson = useCallback((text: string) => {
    const next = repository.restoreBackup(text); // throws on malformed input; state untouched
    stateRef.current = next;
    setState(next);
  }, []);

  return (
    <AppContext.Provider
      value={{
        projectName: activeProject?.name ?? '',
        currency: activeProject?.currency ?? 'USD',
        products,
        activeProductId: state.ui.activeProductId,
        view: state.ui.view,
        searchQuery,
        activeProduct,
        portfolioMetrics,
        activeProductMetrics,
        theme,
        effectiveTheme,
        language: state.ui.language,
        comparedProductIds: state.ui.comparedProductIds,
        setProjectName,
        setCurrency,
        setActiveProductId,
        setView,
        setSearchQuery,
        setTheme,
        toggleTheme,
        setLanguage,
        setComparedProductIds,
        toggleComparedProduct,
        clearComparedProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        importProducts,
        resetToDemoData,
        exportBackupJson,
        restoreBackupFromJson,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
