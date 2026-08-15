import React from 'react';
import { useApp } from '../../context/AppContext';
import { ProductHeader } from './ProductHeader';
import { UnitEconomicsCard } from './UnitEconomicsCard';
import { FixedCostsCard } from './FixedCostsCard';
import { AdSpendCard } from './AdSpendCard';
import { HeroROASCards } from './HeroROASCards';
import { UnitBreakdownCard } from './UnitBreakdownCard';
import { ComparativeMatrixCard } from './ComparativeMatrixCard';
import { SensitivityMatrixCard } from './SensitivityMatrixCard';
import { CostBreakdownVisual } from './CostBreakdownVisual';

interface ProductCalculatorProps {
  onOpenAddModal: () => void;
}

export const ProductCalculator: React.FC<ProductCalculatorProps> = ({ onOpenAddModal }) => {
  const { activeProduct, products, setView } = useApp();

  if (!activeProduct || products.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <h3 className="text-lg font-semibold text-[#f4f4f5]">No product selected</h3>
        <p className="text-xs text-[#a1a1aa]">Create a product or select one from the dashboard.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setView('dashboard')}
            className="px-4 py-2 rounded-xl bg-[#18181b] border border-[#27272a] text-xs font-medium text-[#f4f4f5]"
          >
            Back to Dashboard
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold"
          >
            Add Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="main-content-view" className="space-y-6">
      {/* Product Top Header Bar */}
      <ProductHeader />

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inputs & Controls (5 Cols on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          <UnitEconomicsCard />
          <FixedCostsCard />
          <AdSpendCard />
        </div>

        {/* Right Column: Dynamic KPIs & Sensitivity Analysis (7 Cols on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          <HeroROASCards />
          <UnitBreakdownCard />
          <ComparativeMatrixCard />
          <CostBreakdownVisual />
          <SensitivityMatrixCard />
        </div>
      </div>
    </div>
  );
};
