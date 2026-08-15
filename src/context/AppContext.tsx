import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Product, Currency, ViewMode, PortfolioMetrics, CalculatedMetrics } from '../types';
import { INITIAL_PRODUCTS } from '../lib/mockData';
import { calculatePortfolioMetrics, calculateProductMetrics } from '../lib/calculations';

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

  setProjectName: (name: string) => void;
  setCurrency: (currency: Currency) => void;
  setActiveProductId: (id: string | null) => void;
  setView: (view: ViewMode) => void;
  setSearchQuery: (query: string) => void;

  addProduct: (productData?: Partial<Product>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  duplicateProduct: (id: string) => Product;
  importProducts: (newProducts: Product[], replace?: boolean) => void;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const STORAGE_KEYS = {
  PROJECT_NAME: 'roas_calc_project_name',
  CURRENCY: 'roas_calc_currency',
  PRODUCTS: 'roas_calc_products',
  ACTIVE_PRODUCT_ID: 'roas_calc_active_id',
  VIEW: 'roas_calc_view',
};

// Dual-layer Storage Utility (Synchronous LocalStorage + SessionStorage)
const Storage = {
  get: <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;

    // 1. Try SessionStorage first
    try {
      const sessionItem = window.sessionStorage?.getItem(key);
      if (sessionItem !== null && sessionItem !== undefined && sessionItem !== '') {
        const parsed = JSON.parse(sessionItem);
        if (parsed !== undefined && parsed !== null) return parsed as T;
      }
    } catch {
      // fallback
    }

    // 2. Try LocalStorage
    try {
      const localItem = window.localStorage?.getItem(key);
      if (localItem !== null && localItem !== undefined && localItem !== '') {
        const parsed = JSON.parse(localItem);
        if (parsed !== undefined && parsed !== null) return parsed as T;
      }
    } catch {
      // fallback
    }

    return fallback;
  },

  set: <T,>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(value);
      try {
        window.localStorage?.setItem(key, serialized);
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      try {
        window.sessionStorage?.setItem(key, serialized);
      } catch (err) {
        console.warn('SessionStorage save error:', err);
      }
    } catch (err) {
      console.error('Storage serialization error:', err);
    }
  },
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initial State from Dual Storage (SessionStorage + LocalStorage)
  const [projectName, setProjectNameState] = useState<string>(() =>
    Storage.get(STORAGE_KEYS.PROJECT_NAME, 'Q3 E-Commerce Performance Unit Economics')
  );

  const [currency, setCurrencyState] = useState<Currency>(() =>
    Storage.get(STORAGE_KEYS.CURRENCY, 'USD' as Currency)
  );

  const [products, setProductsState] = useState<Product[]>(() => {
    const loaded = Storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return Array.isArray(loaded) && loaded.length > 0 ? loaded : INITIAL_PRODUCTS;
  });

  const [activeProductId, setActiveProductIdState] = useState<string | null>(() => {
    const loaded = Storage.get<string | null>(STORAGE_KEYS.ACTIVE_PRODUCT_ID, null);
    if (loaded && products.some((p) => p.id === loaded)) return loaded;
    return products[0]?.id ?? INITIAL_PRODUCTS[0]?.id ?? null;
  });

  const [view, setViewState] = useState<ViewMode>(() =>
    Storage.get(STORAGE_KEYS.VIEW, 'dashboard' as ViewMode)
  );

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Use refs to always have the latest synchronous state for pagehide/unload
  const stateRef = useRef({ projectName, currency, products, activeProductId, view });
  useEffect(() => {
    stateRef.current = { projectName, currency, products, activeProductId, view };
  }, [projectName, currency, products, activeProductId, view]);

  // Synchronous flush handler
  const flushToStorage = useCallback(() => {
    const s = stateRef.current;
    Storage.set(STORAGE_KEYS.PROJECT_NAME, s.projectName);
    Storage.set(STORAGE_KEYS.CURRENCY, s.currency);
    Storage.set(STORAGE_KEYS.PRODUCTS, s.products);
    Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, s.activeProductId);
    Storage.set(STORAGE_KEYS.VIEW, s.view);
  }, []);

  // Listen to beforeunload, pagehide, and visibilitychange to prevent data loss on reload/tab switch
  useEffect(() => {
    const handleUnload = () => {
      flushToStorage();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushToStorage();
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
  }, [flushToStorage]);

  // Reactive updates to storage
  useEffect(() => {
    Storage.set(STORAGE_KEYS.PROJECT_NAME, projectName);
  }, [projectName]);

  useEffect(() => {
    Storage.set(STORAGE_KEYS.CURRENCY, currency);
  }, [currency]);

  useEffect(() => {
    Storage.set(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, activeProductId);
  }, [activeProductId]);

  useEffect(() => {
    Storage.set(STORAGE_KEYS.VIEW, view);
  }, [view]);

  // 3. Derived active product and metrics
  const activeProduct = useMemo(() => {
    return products.find((p) => p.id === activeProductId) || products[0];
  }, [products, activeProductId]);

  const portfolioMetrics = useMemo(() => {
    return calculatePortfolioMetrics(products);
  }, [products]);

  const activeProductMetrics = useMemo(() => {
    if (!activeProduct) return undefined;
    return calculateProductMetrics(activeProduct);
  }, [activeProduct]);

  // Immediate synchronous setters
  const setProjectName = (name: string) => {
    setProjectNameState(name);
    Storage.set(STORAGE_KEYS.PROJECT_NAME, name);
  };

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    Storage.set(STORAGE_KEYS.CURRENCY, c);
  };

  const setActiveProductId = (id: string | null) => {
    setActiveProductIdState(id);
    Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, id);
  };

  const setView = (v: ViewMode) => {
    setViewState(v);
    Storage.set(STORAGE_KEYS.VIEW, v);
  };

  // Actions
  const addProduct = (productData?: Partial<Product>): Product => {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      id: newId,
      name: productData?.name || `New Product ${products.length + 1}`,
      sku: productData?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      sellingPrice: productData?.sellingPrice ?? 50.0,
      cogs: productData?.cogs ?? 15.0,
      units: productData?.units ?? 500,
      shippingPerUnit: productData?.shippingPerUnit ?? 5.0,
      fulfillmentRate: productData?.fulfillmentRate ?? 80,
      adSpendPerUnit: productData?.adSpendPerUnit ?? 15.0,
      totalAdSpend: (productData?.adSpendPerUnit ?? 15.0) * (productData?.units ?? 500),
      adSpendMode: productData?.adSpendMode ?? 'per-unit',
      fixedCosts: productData?.fixedCosts || [
        { id: `fc-${Date.now()}-1`, name: 'Photoshoot & Creatives', amount: 500 },
        { id: `fc-${Date.now()}-2`, name: 'Rent & Overhead', amount: 800 },
        { id: `fc-${Date.now()}-3`, name: 'Salaries & Media Buyer', amount: 1200 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextProducts = [newProduct, ...products];
    setProductsState(nextProducts);
    setActiveProductIdState(newId);
    setViewState('calculator');

    // Immediate synchronous save to both storages
    Storage.set(STORAGE_KEYS.PRODUCTS, nextProducts);
    Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, newId);
    Storage.set(STORAGE_KEYS.VIEW, 'calculator');

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProductsState((prev) => {
      const nextProducts = prev.map((p) => {
        if (p.id !== id) return p;

        const updated: Product = {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        // Recalculate synchronized ad spend
        if (updates.adSpendPerUnit !== undefined && updated.adSpendMode === 'per-unit') {
          updated.totalAdSpend = updated.adSpendPerUnit * (updated.units || 1);
        } else if (updates.totalAdSpend !== undefined && updated.adSpendMode === 'total') {
          updated.adSpendPerUnit = updated.totalAdSpend / (updated.units || 1);
        } else if (updates.units !== undefined) {
          if (updated.adSpendMode === 'per-unit') {
            updated.totalAdSpend = updated.adSpendPerUnit * updated.units;
          } else {
            updated.adSpendPerUnit = updated.totalAdSpend / (updated.units || 1);
          }
        }

        return updated;
      });

      // Synchronously write immediately to localStorage & sessionStorage
      Storage.set(STORAGE_KEYS.PRODUCTS, nextProducts);
      return nextProducts;
    });
  };

  const deleteProduct = (id: string) => {
    setProductsState((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      let nextActiveId = activeProductId;

      if (activeProductId === id) {
        nextActiveId = remaining[0]?.id || null;
        setActiveProductIdState(nextActiveId);
        if (remaining.length === 0) {
          setViewState('dashboard');
          Storage.set(STORAGE_KEYS.VIEW, 'dashboard');
        }
      }

      Storage.set(STORAGE_KEYS.PRODUCTS, remaining);
      Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, nextActiveId);
      return remaining;
    });
  };

  const duplicateProduct = (id: string): Product => {
    const target = products.find((p) => p.id === id);
    if (!target) throw new Error('Product not found');

    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicate: Product = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      sku: target.sku ? `${target.sku}-COPY` : undefined,
      fixedCosts: target.fixedCosts.map((fc) => ({
        ...fc,
        id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextProducts = [duplicate, ...products];
    setProductsState(nextProducts);
    setActiveProductIdState(newId);

    Storage.set(STORAGE_KEYS.PRODUCTS, nextProducts);
    Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, newId);

    return duplicate;
  };

  const importProducts = (newProducts: Product[], replace = false) => {
    const nextProducts = replace ? newProducts : [...newProducts, ...products];
    const nextActiveId = newProducts[0]?.id || null;

    setProductsState(nextProducts);
    setActiveProductIdState(nextActiveId);

    Storage.set(STORAGE_KEYS.PRODUCTS, nextProducts);
    Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, nextActiveId);
  };

  const resetToDemoData = () => {
    setProductsState(INITIAL_PRODUCTS);
    setActiveProductIdState(INITIAL_PRODUCTS[0]?.id || null);
    setProjectNameState('Q3 E-Commerce Performance Unit Economics');
    setCurrencyState('USD');

    Storage.set(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    Storage.set(STORAGE_KEYS.ACTIVE_PRODUCT_ID, INITIAL_PRODUCTS[0]?.id || null);
    Storage.set(STORAGE_KEYS.PROJECT_NAME, 'Q3 E-Commerce Performance Unit Economics');
    Storage.set(STORAGE_KEYS.CURRENCY, 'USD');
  };

  return (
    <AppContext.Provider
      value={{
        projectName,
        currency,
        products,
        activeProductId,
        view,
        searchQuery,
        activeProduct,
        portfolioMetrics,
        activeProductMetrics,
        setProjectName,
        setCurrency,
        setActiveProductId,
        setView,
        setSearchQuery,
        addProduct,
        updateProduct,
        deleteProduct,
        duplicateProduct,
        importProducts,
        resetToDemoData,
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
