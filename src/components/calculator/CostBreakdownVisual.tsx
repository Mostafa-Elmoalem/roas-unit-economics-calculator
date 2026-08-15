import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { PieChart } from 'lucide-react';

export const CostBreakdownVisual: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, activeProductMetrics, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const price = activeProduct.sellingPrice || 1;
  const cogs = activeProduct.cogs;
  const shipping = activeProduct.shippingPerUnit;
  const overhead = activeProductMetrics.fixedCostPerUnit;
  const adSpend = activeProduct.adSpendPerUnit;
  const profit = Math.max(0, activeProductMetrics.rawNetProfitPerUnit);

  const totalSegments = cogs + shipping + overhead + adSpend + profit;
  const denom = totalSegments > price ? totalSegments : price;

  const cogsPct = Math.max(0, (cogs / denom) * 100);
  const shippingPct = Math.max(0, (shipping / denom) * 100);
  const overheadPct = Math.max(0, (overhead / denom) * 100);
  const adSpendPct = Math.max(0, (adSpend / denom) * 100);
  const profitPct = Math.max(0, (profit / denom) * 100);

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PieChart className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-semibold text-[#f4f4f5] tracking-tight">
            {t('calculator.revenueBreakdownTitle', { currency })}
          </h4>
        </div>
        <span className="text-xs font-mono-nums text-[#a1a1aa]">
          {t('calculator.priceLabel')} <strong className="text-[#f4f4f5]">{formatCurrency(price, currency)}</strong>
        </span>
      </div>

      {/* Multi-segment stacked bar */}
      <div className="h-4 w-full bg-[#09090b] rounded-full overflow-hidden flex border border-[#27272a]">
        <div
          style={{ width: `${cogsPct}%` }}
          className="bg-blue-500 hover:opacity-90 transition-all"
          title={`COGS: ${cogsPct.toFixed(1)}%`}
        />
        <div
          style={{ width: `${shippingPct}%` }}
          className="bg-amber-500 hover:opacity-90 transition-all"
          title={`Shipping: ${shippingPct.toFixed(1)}%`}
        />
        <div
          style={{ width: `${overheadPct}%` }}
          className="bg-indigo-500 hover:opacity-90 transition-all"
          title={`Overheads: ${overheadPct.toFixed(1)}%`}
        />
        <div
          style={{ width: `${adSpendPct}%` }}
          className="bg-rose-500 hover:opacity-90 transition-all"
          title={`Ad Spend: ${adSpendPct.toFixed(1)}%`}
        />
        <div
          style={{ width: `${profitPct}%` }}
          className="bg-emerald-500 hover:opacity-90 transition-all"
          title={`Net Profit: ${profitPct.toFixed(1)}%`}
        />
      </div>

      {/* Legend with exact amounts & percentages */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <div>
            <span className="text-[#71717a] block text-[10px]">{t('calculator.cogsLegend')}</span>
            <span className="font-semibold font-mono-nums text-[#f4f4f5]">
              {formatCurrency(cogs, currency)} ({cogsPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div>
            <span className="text-[#71717a] block text-[10px]">{t('calculator.shippingLegend')}</span>
            <span className="font-semibold font-mono-nums text-[#f4f4f5]">
              {formatCurrency(shipping, currency)} ({shippingPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
          <div>
            <span className="text-[#71717a] block text-[10px]">{t('calculator.overheadLegend')}</span>
            <span className="font-semibold font-mono-nums text-[#f4f4f5]">
              {formatCurrency(overhead, currency)} ({overheadPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <div>
            <span className="text-[#71717a] block text-[10px]">{t('calculator.adCPALegend')}</span>
            <span className="font-semibold font-mono-nums text-[#f4f4f5]">
              {formatCurrency(adSpend, currency)} ({adSpendPct.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <span className="text-[#71717a] block text-[10px]">{t('calculator.netProfitLegend')}</span>
            <span className="font-semibold font-mono-nums text-emerald-400">
              {formatCurrency(profit, currency)} ({profitPct.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
