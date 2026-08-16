import React from 'react';
import { useTranslation } from 'react-i18next';
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
import { Button } from '../ui/button';
import { tokens } from '../../theme/tokens';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';

interface ProductCalculatorProps {
  onOpenAddModal: () => void;
}

export const ProductCalculator: React.FC<ProductCalculatorProps> = ({ onOpenAddModal }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { activeProduct, products, setView } = useApp();

  if (!activeProduct || products.length === 0) {
    return (
      <div className={`py-16 text-center space-y-4 ${tokens.card.base} p-8 max-w-lg mx-auto`}>
        <h3 className={`text-lg font-semibold ${tokens.text.primary}`}>{t('calculator.noProductSelected')}</h3>
        <p className={`text-xs ${tokens.text.muted}`}>{t('calculator.noProductDesc')}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView('dashboard')}
            className="flex items-center gap-1.5"
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{t('calculator.backToDashboard')}</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('common.addProduct')}</span>
          </Button>
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
