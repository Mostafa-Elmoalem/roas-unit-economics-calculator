import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

const STORAGE_KEYS = {
  PROJECT_NAME: 'roas_calc_project_name',
  CURRENCY: 'roas_calc_currency',
  PRODUCTS: 'roas_calc_products',
  ACTIVE_PRODUCT_ID: 'roas_calc_active_id',
  VIEW: 'roas_calc_view',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage
  const [projectName, setProjectNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PROJECT_NAME) || 'Q3 E-Commerce Performance Unit Economics';
    } catch {
      return 'Q3 E-Commerce Performance Unit Economics';
    }
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.CURRENCY) as Currency) || 'USD';
    } catch {
      return 'USD';
    }
  });

  const [products, setProductsState] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [activeProductId, setActiveProductIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_PRODUCT_ID) || (INITIAL_PRODUCTS[0]?.id ?? null);
    } catch {
      return INITIAL_PRODUCTS[0]?.id ?? null;
    }
  });

  const [view, setViewState] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEYS.VIEW) as ViewMode) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // 2. Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, projectName);
    } catch (e) {
      console.error(e);
    }
  }, [projectName]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, currency);
    } catch (e) {
      console.error(e);
    }
  }, [currency]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      if (activeProductId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PRODUCT_ID, activeProductId);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PRODUCT_ID);
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeProductId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW, view);
    } catch (e) {
      console.error(e);
    }
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

  // Setters with state update
  const setProjectName = (name: string) => setProjectNameState(name);
  const setCurrency = (c: Currency) => setCurrencyState(c);
  const setActiveProductId = (id: string | null) => setActiveProductIdState(id);
  const setView = (v: ViewMode) => setViewState(v);

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

    setProductsState((prev) => [newProduct, ...prev]);
    setActiveProductIdState(newId);
    setViewState('calculator');
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProductsState((prev) =>
      prev.map((p) => {
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
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProductsState((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      if (activeProductId === id) {
        setActiveProductIdState(remaining[0]?.id || null);
        if (remaining.length === 0) {
          setViewState('dashboard');
        }
      }
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

    setProductsState((prev) => [duplicate, ...prev]);
    setActiveProductIdState(newId);
    return duplicate;
  };

  const importProducts = (newProducts: Product[], replace = false) => {
    if (replace) {
      setProductsState(newProducts);
      setActiveProductIdState(newProducts[0]?.id || null);
    } else {
      setProductsState((prev) => [...newProducts, ...prev]);
      setActiveProductIdState(newProducts[0]?.id || null);
    }
  };

  const resetToDemoData = () => {
    setProductsState(INITIAL_PRODUCTS);
    setActiveProductIdState(INITIAL_PRODUCTS[0]?.id || null);
    setProjectNameState('Q3 E-Commerce Performance Unit Economics');
    setCurrencyState('USD');
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
