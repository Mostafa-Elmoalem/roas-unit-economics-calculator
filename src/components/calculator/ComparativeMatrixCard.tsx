import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatROAS } from '../../lib/calculations';
import { tokens } from '../../theme/tokens';
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
    <div className={`${tokens.card.base} overflow-hidden`}>
      <div className={`p-4 sm:p-5 border-b ${tokens.border.default} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${tokens.status.profit.bg} ${tokens.status.profit.text} ${tokens.status.profit.border} border`}>
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${tokens.text.primary} tracking-tight`}>
              {t('calculator.comparativeTitle')}
            </h3>
            <p className={`text-xs ${tokens.text.secondary}`}>
              {t('calculator.comparativeDesc', { rate: fulfillmentRate })}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto touch-pan-x">
        <table className="w-full text-xs text-left rtl:text-right border-collapse">
          <thead className={`${tokens.bg.tableHead} ${tokens.text.secondary} uppercase tracking-wider font-semibold border-b ${tokens.border.default}`}>
            <tr>
              <th className={`py-3 px-3.5 sm:px-4 sticky left-0 rtl:right-0 bg-zinc-50 dark:bg-[#0f0f11] z-10 shadow-r min-w-[130px] sm:min-w-[160px]`}>
                {t('calculator.metric')}
              </th>
              <th className="py-3 px-3 sm:px-4 min-w-[100px]">{t('calculator.rawCol')}</th>
              <th className={`py-3 px-3 sm:px-4 ${tokens.status.profit.text} min-w-[100px]`}>
                {t('calculator.adjCol', { rate: fulfillmentRate })}
              </th>
              <th className="py-3 px-3 sm:px-4 text-right rtl:text-left min-w-[100px]">
                {t('calculator.varianceCol')}
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${tokens.border.divider} font-mono-nums`}>
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className={`hover:${tokens.bg.hover} transition-colors`}>
                <td className={`py-3 px-3.5 sm:px-4 font-sans font-medium ${tokens.text.primary} sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] z-10 shadow-r`}>
                  {row.metric}
                </td>
                <td className={`py-3 px-3 sm:px-4 ${tokens.text.secondary}`}>{row.raw}</td>
                <td className={`py-3 px-3 sm:px-4 font-semibold ${tokens.text.primary}`}>
                  {row.adjusted}
                </td>
                <td
                  className={`py-3 px-3 sm:px-4 text-right rtl:text-left font-semibold ${
                    row.isBad ? tokens.status.loss.text : tokens.status.profit.text
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
