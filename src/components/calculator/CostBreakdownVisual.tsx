import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { PieChart } from 'lucide-react';

export const CostBreakdownVisual: React.FC = () => {
  const { activeProduct, activeProductMetrics, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const price = activeProduct.sellingPrice || 1;
  const cogs = activeProduct.cogs || 0;
  const shipping = activeProduct.shippingPerUnit || 0;
  const overhead = activeProductMetrics.fixedCostPerUnit || 0;
  const adSpend = activeProduct.adSpendPerUnit || 0;
  const profit = activeProductMetrics.adjustedProfitPerOrderedUnit;

  const cogsPercent = Math.max(0, (cogs / price) * 100);
  const shippingPercent = Math.max(0, (shipping / price) * 100);
  const overheadPercent = Math.max(0, (overhead / price) * 100);
  const adSpendPercent = Math.max(0, (adSpend / price) * 100);
  const profitPercent = Math.max(0, (profit / price) * 100);

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <PieChart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#f4f4f5] tracking-tight">
            Unit Revenue Breakdown (Where each {currency === 'EGP' ? 'EGP' : '$'} goes)
          </h3>
        </div>
        <span className="text-xs font-bold font-mono-nums text-[#f4f4f5]">
          Price: {formatCurrency(price, currency)}
        </span>
      </div>

      {/* Multi-segmented stacked progress bar */}
      <div className="w-full h-4 bg-[#09090b] rounded-full overflow-hidden flex border border-[#27272a]">
        <div
          style={{ width: `${Math.min(100, cogsPercent)}%` }}
          className="bg-indigo-500 h-full transition-all duration-300"
          title={`COGS: ${cogsPercent.toFixed(1)}%`}
        />
        <div
          style={{ width: `${Math.min(100, shippingPercent)}%` }}
          className="bg-amber-500 h-full transition-all duration-300"
          title={`Shipping: ${shippingPercent.toFixed(1)}%`}
        />
        <div
          style={{ width: `${Math.min(100, overheadPercent)}%` }}
          className="bg-purple-500 h-full transition-all duration-300"
          title={`Overheads: ${overheadPercent.toFixed(1)}%`}
        />
        <div
          style={{ width: `${Math.min(100, adSpendPercent)}%` }}
          className="bg-rose-500 h-full transition-all duration-300"
          title={`Ad Spend: ${adSpendPercent.toFixed(1)}%`}
        />
        {profit > 0 && (
          <div
            style={{ width: `${Math.min(100, profitPercent)}%` }}
            className="bg-emerald-500 h-full transition-all duration-300"
            title={`Net Profit: ${profitPercent.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Legend & values */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
        {/* 1. COGS */}
        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-[#a1a1aa] font-medium">COGS</span>
          </div>
          <div className="font-bold font-mono-nums text-[#f4f4f5]">
            {formatCurrency(cogs, currency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono-nums">
            {cogsPercent.toFixed(1)}%
          </div>
        </div>

        {/* 2. Shipping */}
        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[#a1a1aa] font-medium">Shipping</span>
          </div>
          <div className="font-bold font-mono-nums text-[#f4f4f5]">
            {formatCurrency(shipping, currency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono-nums">
            {shippingPercent.toFixed(1)}%
          </div>
        </div>

        {/* 3. Overheads */}
        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-[#a1a1aa] font-medium">Overhead</span>
          </div>
          <div className="font-bold font-mono-nums text-[#f4f4f5]">
            {formatCurrency(overhead, currency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono-nums">
            {overheadPercent.toFixed(1)}%
          </div>
        </div>

        {/* 4. Ad Spend */}
        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[#a1a1aa] font-medium">Ad CPA</span>
          </div>
          <div className="font-bold font-mono-nums text-[#f4f4f5]">
            {formatCurrency(adSpend, currency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono-nums">
            {adSpendPercent.toFixed(1)}%
          </div>
        </div>

        {/* 5. Net Profit */}
        <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="text-[#a1a1aa] font-medium">Net Profit</span>
          </div>
          <div
            className={`font-bold font-mono-nums ${
              profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(profit, currency)}
          </div>
          <div className="text-[10px] text-[#71717a] font-mono-nums">
            {profitPercent.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};
