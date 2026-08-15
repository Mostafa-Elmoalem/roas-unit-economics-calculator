import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';

export const UnitBreakdownCard: React.FC = () => {
  const { activeProduct, activeProductMetrics, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* 1. Max Break-Even CPA */}
      <div className="bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl p-4 transition-all">
        <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block mb-1">
          Max BE CPA
        </span>
        <div className="text-xl sm:text-2xl font-bold font-mono-nums text-[#f4f4f5] truncate">
          {formatCurrency(activeProductMetrics.breakEvenCPA, currency)}
        </div>
        <div className="text-[10px] text-[#71717a] mt-1 truncate">
          Current: {formatCurrency(activeProduct.adSpendPerUnit, currency)}
        </div>
      </div>

      {/* 2. Profit / Unit (Adjusted) */}
      <div className="bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl p-4 transition-all">
        <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block mb-1">
          Profit / Unit (Adj)
        </span>
        <div
          className={`text-xl sm:text-2xl font-bold font-mono-nums truncate ${
            activeProductMetrics.adjustedProfitPerOrderedUnit >= 0
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        >
          {formatCurrency(activeProductMetrics.adjustedProfitPerOrderedUnit, currency)}
        </div>
        <div className="text-[10px] text-[#71717a] mt-1 truncate">
          Raw: {formatCurrency(activeProductMetrics.rawNetProfitPerUnit, currency)}
        </div>
      </div>

      {/* 3. Total Profit (Adjusted) */}
      <div className="bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl p-4 transition-all">
        <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block mb-1">
          Total Profit (Adj)
        </span>
        <div
          className={`text-xl sm:text-2xl font-bold font-mono-nums truncate ${
            activeProductMetrics.adjustedTotalProfit >= 0
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        >
          {formatCurrency(activeProductMetrics.adjustedTotalProfit, currency)}
        </div>
        <div className="text-[10px] text-[#71717a] mt-1 truncate">
          Raw: {formatCurrency(activeProductMetrics.rawTotalProfit, currency)}
        </div>
      </div>

      {/* 4. Net Margin (%) */}
      <div className="bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded-2xl p-4 transition-all">
        <span className="text-[11px] font-medium text-[#a1a1aa] uppercase tracking-wider block mb-1">
          Net Margin (%)
        </span>
        <div
          className={`text-xl sm:text-2xl font-bold font-mono-nums truncate ${
            activeProductMetrics.adjustedNetMarginPercent >= 0
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}
        >
          {activeProductMetrics.adjustedNetMarginPercent.toFixed(1)}%
        </div>
        <div className="text-[10px] text-[#71717a] mt-1 truncate">
          Raw: {activeProductMetrics.rawNetMarginPercent.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};
