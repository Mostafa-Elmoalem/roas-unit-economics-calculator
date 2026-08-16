import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { tokens } from '../../theme/tokens';
import { Target, Coins, DollarSign, Percent } from 'lucide-react';

export const UnitBreakdownCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProductMetrics, currency } = useApp();

  if (!activeProductMetrics) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Max Break-Even CPA */}
      <div className={`${tokens.card.base} p-4`}>
        <div className={`flex items-center gap-2 ${tokens.text.muted} mb-2`}>
          <Target className={`w-3.5 h-3.5 ${tokens.status.accent.text}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('calculator.maxBECPA')}
          </span>
        </div>
        <div className={`text-xl sm:text-2xl font-bold font-mono-nums ${tokens.text.primary}`}>
          {formatCurrency(activeProductMetrics.breakEvenCPA, currency)}
        </div>
        <div className={`text-[10px] ${tokens.text.muted} mt-1`}>
          Adj: {formatCurrency(activeProductMetrics.adjustedBreakEvenCPA, currency)}
        </div>
      </div>

      {/* 2. Profit / Unit (Adjusted) */}
      <div className={`${tokens.card.base} p-4`}>
        <div className={`flex items-center gap-2 ${tokens.text.muted} mb-2`}>
          <Coins className={`w-3.5 h-3.5 ${tokens.status.profit.text}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('calculator.profitPerUnitAdj')}
          </span>
        </div>
        <div
          className={`text-xl sm:text-2xl font-bold font-mono-nums ${
            activeProductMetrics.adjustedProfitPerOrderedUnit >= 0
              ? tokens.status.profit.text
              : tokens.status.loss.text
          }`}
        >
          {formatCurrency(activeProductMetrics.adjustedProfitPerOrderedUnit, currency)}
        </div>
        <div className={`text-[10px] ${tokens.text.muted} mt-1`}>
          Raw: {formatCurrency(activeProductMetrics.rawNetProfitPerUnit, currency)}
        </div>
      </div>

      {/* 3. Total Profit (Adjusted) */}
      <div className={`${tokens.card.base} p-4`}>
        <div className={`flex items-center gap-2 ${tokens.text.muted} mb-2`}>
          <DollarSign className={`w-3.5 h-3.5 ${tokens.status.profit.text}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('calculator.totalProfitAdj')}
          </span>
        </div>
        <div
          className={`text-xl sm:text-2xl font-bold font-mono-nums ${
            activeProductMetrics.adjustedTotalProfit >= 0
              ? tokens.status.profit.text
              : tokens.status.loss.text
          }`}
        >
          {formatCurrency(activeProductMetrics.adjustedTotalProfit, currency)}
        </div>
        <div className={`text-[10px] ${tokens.text.muted} mt-1`}>
          Raw: {formatCurrency(activeProductMetrics.rawTotalProfit, currency)}
        </div>
      </div>

      {/* 4. Net Margin % */}
      <div className={`${tokens.card.base} p-4`}>
        <div className={`flex items-center gap-2 ${tokens.text.muted} mb-2`}>
          <Percent className={`w-3.5 h-3.5 ${tokens.status.warning.text}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('calculator.netMarginPercent')}
          </span>
        </div>
        <div
          className={`text-xl sm:text-2xl font-bold font-mono-nums ${
            activeProductMetrics.adjustedNetMarginPercent >= 0
              ? tokens.status.profit.text
              : tokens.status.loss.text
          }`}
        >
          {activeProductMetrics.adjustedNetMarginPercent.toFixed(1)}%
        </div>
        <div className={`text-[10px] ${tokens.text.muted} mt-1`}>
          Raw: {activeProductMetrics.rawNetMarginPercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
