import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { generateSensitivityMatrix, formatCurrency } from '../../lib/calculations';
import { Activity } from 'lucide-react';

export const SensitivityMatrixCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, currency } = useApp();
  const [metricView, setMetricView] = useState<'profit' | 'unit-profit' | 'margin'>('profit');

  if (!activeProduct) return null;

  const matrix = generateSensitivityMatrix(activeProduct);

  const getCellBg = (val: number, isProfitable: boolean) => {
    if (!isProfitable || val < 0) {
      if (val < -5000) return 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900/50';
      return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30';
    }
    if (val > 10000) return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900/50 font-bold';
    if (val > 0) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30';
    return 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';
  };

  return (
    <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl overflow-hidden shadow-xs transition-colors duration-200">
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#f4f4f5] tracking-tight">
              {t('calculator.sensitivityTitle')}
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-[#71717a] mt-0.5">
              {t('calculator.sensitivityDesc')}
            </p>
          </div>
        </div>

        {/* Metric Toggle */}
        <div className="flex items-center bg-zinc-100 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-0.5 text-[11px]">
          <button
            onClick={() => setMetricView('profit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              metricView === 'profit'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : 'text-zinc-500 dark:text-[#71717a] hover:text-zinc-900 dark:hover:text-[#a1a1aa]'
            }`}
          >
            {t('calculator.totalProfitToggle')}
          </button>
          <button
            onClick={() => setMetricView('unit-profit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              metricView === 'unit-profit'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : 'text-zinc-500 dark:text-[#71717a] hover:text-zinc-900 dark:hover:text-[#a1a1aa]'
            }`}
          >
            {t('calculator.profitUnitToggle')}
          </button>
          <button
            onClick={() => setMetricView('margin')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              metricView === 'margin'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : 'text-zinc-500 dark:text-[#71717a] hover:text-zinc-900 dark:hover:text-[#a1a1aa]'
            }`}
          >
            {t('calculator.marginToggle')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-4 sm:p-5">
        <table className="w-full text-center text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left rtl:text-right text-[11px] font-semibold text-zinc-500 dark:text-[#71717a] uppercase tracking-wider">
                {t('calculator.fulfillmentCol')}
              </th>
              {matrix.adSpendMultipliers.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-2 text-[11px] font-semibold tracking-tight ${
                    col.multiplier === 1.0
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/5 rounded-t-lg font-bold'
                      : 'text-zinc-600 dark:text-[#a1a1aa]'
                  }`}
                >
                  <div>{col.label}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-[#71717a] font-mono-nums font-normal">
                    {formatCurrency(
                      (activeProduct.adSpendPerUnit || 0) * col.multiplier,
                      currency
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-[#27272a]/40">
            {matrix.scenarios.map((rowScenarios, rowIdx) => {
              const fRate = matrix.fulfillmentRates[rowIdx];
              const isCurrentFulfillment = activeProduct.fulfillmentRate === fRate;

              return (
                <tr key={rowIdx} className="hover:bg-zinc-50/50 dark:hover:bg-[#202024]/30 transition">
                  <td className="py-2.5 px-3 text-left rtl:text-right font-bold font-mono-nums text-zinc-900 dark:text-[#f4f4f5]">
                    <div className="flex items-center gap-1.5">
                      {isCurrentFulfillment && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      )}
                      <span>{fRate}%</span>
                    </div>
                  </td>

                  {rowScenarios.map((cell, colIdx) => {
                    const isBaseScenario =
                      matrix.adSpendMultipliers[colIdx].multiplier === 1.0 &&
                      activeProduct.fulfillmentRate === fRate;

                    let displayValue = '';
                    if (metricView === 'profit') {
                      displayValue = formatCurrency(cell.totalProfit, currency);
                    } else if (metricView === 'unit-profit') {
                      displayValue = formatCurrency(cell.profitPerUnit, currency);
                    } else {
                      displayValue = `${cell.netMarginPercent.toFixed(1)}%`;
                    }

                    return (
                      <td key={colIdx} className="p-1.5">
                        <div
                          className={`py-2 px-2.5 rounded-xl border text-xs font-mono-nums font-semibold transition-all ${getCellBg(
                            cell.totalProfit,
                            cell.isProfitable
                          )} ${
                            isBaseScenario
                              ? 'ring-2 ring-emerald-500 shadow-sm scale-102 font-extrabold'
                              : ''
                          }`}
                        >
                          {displayValue}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
