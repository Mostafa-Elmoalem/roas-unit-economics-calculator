import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { generateSensitivityMatrix, formatCurrency } from '../../lib/calculations';
import { tokens } from '../../theme/tokens';
import { Activity } from 'lucide-react';

export const SensitivityMatrixCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, currency } = useApp();
  const [metricView, setMetricView] = useState<'profit' | 'unit-profit' | 'margin'>('profit');

  if (!activeProduct) return null;

  const matrix = generateSensitivityMatrix(activeProduct);

  const getCellBg = (val: number, isProfitable: boolean) => {
    if (!isProfitable || val < 0) {
      if (val < -5000) return tokens.matrix.severeLoss;
      return tokens.matrix.loss;
    }
    if (val > 10000) return tokens.matrix.highProfit;
    if (val > 0) return tokens.matrix.profit;
    return tokens.matrix.neutral;
  };

  return (
    <div className={`${tokens.card.base} overflow-hidden`}>
      <div className={`p-4 sm:p-5 border-b ${tokens.border.default} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${tokens.status.profit.bg} ${tokens.status.profit.text} ${tokens.status.profit.border} border`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${tokens.text.primary} tracking-tight`}>
              {t('calculator.sensitivityTitle')}
            </h3>
            <p className={`text-[11px] ${tokens.text.muted} mt-0.5`}>
              {t('calculator.sensitivityDesc')}
            </p>
          </div>
        </div>

        {/* Metric Toggle */}
        <div className={`flex items-center ${tokens.bg.toggleTrack} border ${tokens.border.default} rounded-xl p-0.5 text-[11px]`}>
          <button
            onClick={() => setMetricView('profit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              metricView === 'profit'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : `${tokens.text.muted} hover:${tokens.text.primary}`
            }`}
          >
            {t('calculator.totalProfitToggle')}
          </button>
          <button
            onClick={() => setMetricView('unit-profit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              metricView === 'unit-profit'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : `${tokens.text.muted} hover:${tokens.text.primary}`
            }`}
          >
            {t('calculator.profitUnitToggle')}
          </button>
          <button
            onClick={() => setMetricView('margin')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              metricView === 'margin'
                ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                : `${tokens.text.muted} hover:${tokens.text.primary}`
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
              <th className={`p-2 text-left rtl:text-right text-[11px] font-semibold ${tokens.text.muted} uppercase tracking-wider`}>
                {t('calculator.fulfillmentCol')}
              </th>
              {matrix.adSpendMultipliers.map((col, idx) => (
                <th
                  key={idx}
                  className={`p-2 text-[11px] font-semibold tracking-tight ${
                    col.multiplier === 1.0
                      ? `${tokens.status.profit.text} ${tokens.status.profit.bg} rounded-t-lg font-bold`
                      : tokens.text.secondary
                  }`}
                >
                  <div>{col.label}</div>
                  <div className={`text-[10px] ${tokens.text.muted} font-mono-nums font-normal`}>
                    {formatCurrency(
                      (activeProduct.adSpendPerUnit || 0) * col.multiplier,
                      currency
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className={`divide-y ${tokens.border.subtle}`}>
            {matrix.scenarios.map((rowScenarios, rowIdx) => {
              const fRate = matrix.fulfillmentRates[rowIdx];
              const isCurrentFulfillment = activeProduct.fulfillmentRate === fRate;

              return (
                <tr key={rowIdx} className={`hover:${tokens.bg.hover} transition`}>
                  <td className={`py-2.5 px-3 text-left rtl:text-right font-bold font-mono-nums ${tokens.text.primary}`}>
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
                            isBaseScenario ? tokens.matrix.anchor : ''
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
