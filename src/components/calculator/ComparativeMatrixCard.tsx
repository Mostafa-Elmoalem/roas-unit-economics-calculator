import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatROAS } from '../../lib/calculations';
import { Layers } from 'lucide-react';

export const ComparativeMatrixCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, activeProductMetrics, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const fulfillmentRate = activeProduct.fulfillmentRate;
  const m = activeProductMetrics;

  const comparisonRows = [
    {
      metric: t('calculator.metricBEROAS'),
      raw: formatROAS(m.breakEvenROAS),
      adjusted: formatROAS(m.adjustedBreakEvenROAS),
      variance:
        m.breakEvenROAS && m.adjustedBreakEvenROAS
          ? t('calculator.harder', {
              diff: (m.adjustedBreakEvenROAS - m.breakEvenROAS).toFixed(2),
            })
          : '—',
      isBad: true,
    },
    {
      metric: t('calculator.metricCurrentROAS'),
      raw: formatROAS(m.currentROAS),
      adjusted: formatROAS(m.currentROAS),
      variance: t('calculator.sameSpend'),
      isBad: false,
    },
    {
      metric: t('calculator.metricRevenue'),
      raw: formatCurrency(m.rawTotalRevenue, currency),
      adjusted: formatCurrency(m.adjustedRealizedRevenue, currency),
      variance: `-${formatCurrency(m.rawTotalRevenue - m.adjustedRealizedRevenue, currency)}`,
      isBad: true,
    },
    {
      metric: t('calculator.metricProfitUnit'),
      raw: formatCurrency(m.rawNetProfitPerUnit, currency),
      adjusted: formatCurrency(m.adjustedProfitPerOrderedUnit, currency),
      variance: `${(
        m.adjustedProfitPerOrderedUnit - m.rawNetProfitPerUnit >= 0 ? '+' : ''
      )}${formatCurrency(m.adjustedProfitPerOrderedUnit - m.rawNetProfitPerUnit, currency)}`,
      isBad: m.adjustedProfitPerOrderedUnit < m.rawNetProfitPerUnit,
    },
    {
      metric: t('calculator.metricTotalProfit'),
      raw: formatCurrency(m.rawTotalProfit, currency),
      adjusted: formatCurrency(m.adjustedTotalProfit, currency),
      variance: `-${formatCurrency(m.rawTotalProfit - m.adjustedTotalProfit, currency)}`,
      isBad: true,
    },
    {
      metric: t('calculator.metricNetMargin'),
      raw: `${m.rawNetMarginPercent.toFixed(1)}%`,
      adjusted: `${m.adjustedNetMarginPercent.toFixed(1)}%`,
      variance: `${(m.adjustedNetMarginPercent - m.rawNetMarginPercent).toFixed(1)}%`,
      isBad: m.adjustedNetMarginPercent < m.rawNetMarginPercent,
    },
    {
      metric: t('calculator.metricShippingLoss'),
      raw: formatCurrency(0, currency),
      adjusted: `-${formatCurrency(m.adjustedFailedShippingLoss, currency)}`,
      variance: t('calculator.failedParcels', {
        count: Math.round(m.adjustedFailedUnits),
      }),
      isBad: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl overflow-hidden shadow-xs transition-colors duration-200">
      <div className="p-5 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#f4f4f5] tracking-tight">
              {t('calculator.comparativeTitle')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-[#71717a]">
              {t('calculator.comparativeDesc', { rate: fulfillmentRate })}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left rtl:text-right">
          <thead className="bg-zinc-50 dark:bg-[#0f0f11] text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-[#27272a]">
            <tr>
              <th className="py-3 px-4">{t('calculator.metric')}</th>
              <th className="py-3 px-4">{t('calculator.rawCol')}</th>
              <th className="py-3 px-4 text-emerald-600 dark:text-emerald-400">
                {t('calculator.adjCol', { rate: fulfillmentRate })}
              </th>
              <th className="py-3 px-4 text-right rtl:text-left">{t('calculator.varianceCol')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-[#27272a]/60 font-mono-nums">
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-[#202024] transition-colors">
                <td className="py-3 px-4 font-sans font-medium text-zinc-900 dark:text-[#f4f4f5]">
                  {row.metric}
                </td>
                <td className="py-3 px-4 text-zinc-600 dark:text-[#a1a1aa]">{row.raw}</td>
                <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-[#f4f4f5]">
                  {row.adjusted}
                </td>
                <td
                  className={`py-3 px-4 text-right rtl:text-left font-semibold ${
                    row.isBad ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {row.variance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
