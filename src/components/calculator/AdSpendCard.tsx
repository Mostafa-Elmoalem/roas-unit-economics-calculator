import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { Badge } from '../ui/badge';
import { tokens } from '../../theme/tokens';
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
    <div className={`${tokens.card.base} p-5 sm:p-6 space-y-5`}>
      <div className={`flex items-center justify-between border-b ${tokens.border.default} pb-3`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${tokens.status.loss.bg} ${tokens.status.loss.text} ${tokens.status.loss.border} border`}>
            <Megaphone className="w-4 h-4" />
          </div>
          <h3 className={`text-sm font-semibold ${tokens.text.primary} tracking-tight`}>
            {t('calculator.adSpendTitle')}
          </h3>
        </div>

        {/* Mode Toggle Switch */}
        <div className={`flex items-center ${tokens.bg.toggleTrack} border ${tokens.border.default} rounded-xl p-0.5 text-xs`}>
          <button
            onClick={() => handleModeChange('per-unit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              isPerUnitMode
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : `${tokens.text.secondary} hover:${tokens.text.primary}`
            }`}
          >
            {t('calculator.cpaMode')}
          </button>
          <button
            onClick={() => handleModeChange('total')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              !isPerUnitMode
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : `${tokens.text.secondary} hover:${tokens.text.primary}`
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
              ? `${tokens.bg.input} ${tokens.border.active}`
              : `${tokens.bg.surfaceSubtle} ${tokens.border.default} opacity-80`
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-semibold ${tokens.text.primary} flex items-center gap-1.5`}>
              <Target className={`w-3.5 h-3.5 ${tokens.status.profit.text}`} />
              <span>{t('calculator.cpaPerUnit')}</span>
            </label>
            {isPerUnitMode && (
              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                {t('calculator.activeInput')}
              </Badge>
            )}
          </div>

          <div className="relative">
            <span className={`absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold ${tokens.text.muted}`}>
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
              className={`w-full ${tokens.bg.inputInner} border ${tokens.border.default} focus:border-emerald-500 rounded-lg pl-8 rtl:pr-8 rtl:pl-3 pr-3 py-2 text-xs font-bold font-mono-nums ${tokens.text.primary} outline-none transition shadow-xs`}
              placeholder="0.00"
            />
          </div>
          <p className={`text-[11px] ${tokens.text.muted} mt-1.5`}>
            {t('calculator.targetActualCPA')}
          </p>
        </div>

        {/* Total Ad Spend */}
        <div
          className={`p-4 rounded-xl border transition ${
            !isPerUnitMode
              ? `${tokens.bg.input} ${tokens.border.active}`
              : `${tokens.bg.surfaceSubtle} ${tokens.border.default} opacity-80`
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <label className={`text-xs font-semibold ${tokens.text.primary} flex items-center gap-1.5`}>
              <DollarSign className={`w-3.5 h-3.5 ${tokens.status.accent.text}`} />
              <span>{t('calculator.totalAdSpend')}</span>
            </label>
            {!isPerUnitMode && (
              <Badge variant="success" className="text-[10px] py-0 px-1.5">
                {t('calculator.activeInput')}
              </Badge>
            )}
          </div>

          <div className="relative">
            <span className={`absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold ${tokens.text.muted}`}>
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
              className={`w-full ${tokens.bg.inputInner} border ${tokens.border.default} focus:border-emerald-500 rounded-lg pl-8 rtl:pr-8 rtl:pl-3 pr-3 py-2 text-xs font-bold font-mono-nums ${tokens.text.primary} outline-none transition shadow-xs`}
              placeholder="0.00"
            />
          </div>
          <p className={`text-[11px] ${tokens.text.muted} mt-1.5`}>
            {t('calculator.acrossTotalUnits', { count: activeProduct.units.toLocaleString() })}
          </p>
        </div>
      </div>

      {/* Break-Even CPA Indicator Helper */}
      <div className={`p-3.5 rounded-xl ${tokens.bg.input} border ${tokens.border.default} flex items-center justify-between text-xs`}>
        <span className={`${tokens.text.secondary} font-medium`}>
          {t('calculator.maxAllowableCPA')}
        </span>
        <div className="flex items-center gap-2 font-mono-nums">
          <span className={`font-bold ${tokens.text.primary}`}>
            {formatCurrency(activeProductMetrics.breakEvenCPA, currency)}
          </span>
          <span className={`text-[10px] ${tokens.text.muted}`}>
            (Adj: {formatCurrency(activeProductMetrics.adjustedBreakEvenCPA, currency)})
          </span>
        </div>
      </div>
    </div>
  );
};
