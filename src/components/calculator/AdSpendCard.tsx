import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { Megaphone, Target, DollarSign } from 'lucide-react';

export const AdSpendCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, activeProductMetrics, updateProduct, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const isPerUnitMode = activeProduct.adSpendMode === 'per-unit';

  const handleModeChange = (mode: 'per-unit' | 'total') => {
    updateProduct(activeProduct.id, { adSpendMode: mode });
  };

  return (
    <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Megaphone className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#f4f4f5] tracking-tight">
            {t('calculator.adSpendTitle')}
          </h3>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center bg-zinc-100 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-0.5 text-xs">
          <button
            onClick={() => handleModeChange('per-unit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              isPerUnitMode
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : 'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5]'
            }`}
          >
            {t('calculator.cpaMode')}
          </button>
          <button
            onClick={() => handleModeChange('total')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              !isPerUnitMode
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : 'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5]'
            }`}
          >
            {t('calculator.totalBudgetMode')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ad Spend Per Unit (CPA) */}
        <div
          className={`p-4 rounded-xl border transition ${
            isPerUnitMode
              ? 'bg-zinc-50 dark:bg-[#09090b] border-emerald-500/50 ring-1 ring-emerald-500/20'
              : 'bg-white dark:bg-[#121214] border-zinc-200 dark:border-[#27272a] opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-900 dark:text-[#f4f4f5] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('calculator.cpaPerUnit')}</span>
            </label>
            {isPerUnitMode && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-medium">
                {t('calculator.activeInput')}
              </span>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 dark:text-[#71717a]">
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              value={activeProduct.adSpendPerUnit || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  adSpendPerUnit: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-emerald-500 rounded-lg pl-8 rtl:pr-8 rtl:pl-3 pr-3 py-2 text-xs font-bold font-mono-nums text-zinc-900 dark:text-[#f4f4f5] outline-none transition shadow-xs"
              placeholder="0.00"
            />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-[#71717a] mt-1.5">
            {t('calculator.targetActualCPA')}
          </p>
        </div>

        {/* Total Ad Spend */}
        <div
          className={`p-4 rounded-xl border transition ${
            !isPerUnitMode
              ? 'bg-zinc-50 dark:bg-[#09090b] border-emerald-500/50 ring-1 ring-emerald-500/20'
              : 'bg-white dark:bg-[#121214] border-zinc-200 dark:border-[#27272a] opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-900 dark:text-[#f4f4f5] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{t('calculator.totalAdSpend')}</span>
            </label>
            {!isPerUnitMode && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20 font-medium">
                {t('calculator.activeInput')}
              </span>
            )}
          </div>

          <div className="relative">
            <span className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 dark:text-[#71717a]">
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              value={activeProduct.totalAdSpend || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  totalAdSpend: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-emerald-500 rounded-lg pl-8 rtl:pr-8 rtl:pl-3 pr-3 py-2 text-xs font-bold font-mono-nums text-zinc-900 dark:text-[#f4f4f5] outline-none transition shadow-xs"
              placeholder="0.00"
            />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-[#71717a] mt-1.5">
            {t('calculator.acrossTotalUnits', { count: activeProduct.units.toLocaleString() })}
          </p>
        </div>
      </div>

      {/* Break-Even CPA Indicator Helper */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-[#a1a1aa] font-medium">
          {t('calculator.maxAllowableCPA')}
        </span>
        <div className="flex items-center gap-2 font-mono-nums">
          <span className="font-bold text-zinc-900 dark:text-[#f4f4f5]">
            {formatCurrency(activeProductMetrics.breakEvenCPA, currency)}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-[#71717a]">
            (Adj: {formatCurrency(activeProductMetrics.adjustedBreakEvenCPA, currency)})
          </span>
        </div>
      </div>
    </div>
  );
};
