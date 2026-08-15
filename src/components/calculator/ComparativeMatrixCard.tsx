import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatROAS } from '../../lib/calculations';
import { GitCompare } from 'lucide-react';

export const ComparativeMatrixCard: React.FC = () => {
  const { activeProduct, activeProductMetrics, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const profitDiff =
    activeProductMetrics.rawTotalProfit - activeProductMetrics.adjustedTotalProfit;

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 sm:p-5 border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#f4f4f5] tracking-tight">
              Scenario Analysis: Raw vs. Fulfillment Adjusted
            </h3>
            <p className="text-[11px] text-[#71717a] mt-0.5">
              Comparing theoretical 100% delivery against real-world {activeProduct.fulfillmentRate}% fulfillment
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0f0f11] text-[#a1a1aa] uppercase tracking-wider font-semibold border-b border-[#27272a]">
            <tr>
              <th className="py-3 px-4">Financial Metric</th>
              <th className="py-3 px-4">Raw (100% Delivery)</th>
              <th className="py-3 px-4">
                Adjusted ({activeProduct.fulfillmentRate}% Delivered)
              </th>
              <th className="py-3 px-4 text-right">Variance / Drag</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#27272a]/60">
            {/* Break-Even ROAS */}
            <tr className="hover:bg-[#202024]/50 transition">
              <td className="py-3 px-4 font-medium text-[#f4f4f5]">Break-Even ROAS</td>
              <td className="py-3 px-4 font-mono-nums text-[#a1a1aa]">
                {formatROAS(activeProductMetrics.breakEvenROAS)}
              </td>
              <td className="py-3 px-4 font-mono-nums font-bold text-amber-400">
                {formatROAS(activeProductMetrics.adjustedBreakEvenROAS)}
              </td>
              <td className="py-3 px-4 font-mono-nums text-right text-rose-400">
                {activeProductMetrics.adjustedBreakEvenROAS && activeProductMetrics.breakEvenROAS
                  ? `+${(
                      activeProductMetrics.adjustedBreakEvenROAS -
                      activeProductMetrics.breakEvenROAS
                    ).toFixed(2)}x harder`
                  : 'N/A'}
              </td>
            </tr>

            {/* Current ROAS */}
            <tr className="hover:bg-[#202024]/50 transition">
              <td className="py-3 px-4 font-medium text-[#f4f4f5]">Current ROAS</td>
              <td className="py-3 px-4 font-mono-nums text-[#a1a1aa]">
                {formatROAS(activeProductMetrics.currentROAS)}
              </td>
              <td className="py-3 px-4 font-mono-nums font-bold text-[#f4f4f5]">
                {formatROAS(activeProductMetrics.currentROAS)}
              </td>
              <td className="py-3 px-4 font-mono-nums text-right text-[#71717a]">
                Same Spend
              </td>
            </tr>

            {/* Total Revenue */}
            <tr className="hover:bg-[#202024]/50 transition">
              <td className="py-3 px-4 font-medium text-[#f4f4f5]">Gross / Realized Revenue</td>
              <td className="py-3 px-4 font-mono-nums text-[#a1a1aa]">
                {formatCurrency(activeProductMetrics.rawTotalRevenue, currency)}
              </td>
              <td className="py-3 px-4 font-mono-nums font-bold text-[#f4f4f5]">
                {formatCurrency(activeProductMetrics.adjustedRealizedRevenue, currency)}
              </td>
              <td className="py-3 px-4 font-mono-nums text-right text-rose-400">
                -
                {formatCurrency(
                  activeProductMetrics.rawTotalRevenue -
                    activeProductMetrics.adjustedRealizedRevenue,
                  currency
                )}
              </td>
            </tr>

            {/* Profit / Unit */}
            <tr className="hover:bg-[#202024]/50 transition">
              <td className="py-3 px-4 font-medium text-[#f4f4f5]">Net Profit / Unit</td>
              <td className="py-3 px-4 font-mono-nums text-[#a1a1aa]">
                {formatCurrency(activeProductMetrics.rawNetProfitPerUnit, currency)}
              </td>
              <td
                className={`py-3 px-4 font-mono-nums font-bold ${
                  activeProductMetrics.adjustedProfitPerOrderedUnit >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {formatCurrency(activeProductMetrics.adjustedProfitPerOrderedUnit, currency)}
              </td>
              <td className="py-3 px-4 font-mono-nums text-right text-rose-400">
                -
                {formatCurrency(
                  activeProductMetrics.rawNetProfitPerUnit -
                    activeProductMetrics.adjustedProfitPerOrderedUnit,
                  currency
                )}
                /unit
              </td>
            </tr>

            {/* Total Profit */}
            <tr className="hover:bg-[#202024]/50 transition">
              <td className="py-3 px-4 font-medium text-[#f4f4f5]">Total Net Profit</td>
              <td className="py-3 px-4 font-mono-nums text-[#a1a1aa]">
                {formatCurrency(activeProductMetrics.rawTotalProfit, currency)}
              </td>
              <td
                className={`py-3 px-4 font-mono-nums font-bold text-sm ${
                  activeProductMetrics.adjustedTotalProfit >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {formatCurrency(activeProductMetrics.adjustedTotalProfit, currency)}
              </td>
              <td className="py-3 px-4 font-mono-nums font-bold text-right text-rose-400">
                -{formatCurrency(profitDiff, currency)}
              </td>
            </tr>

            {/* Net Margin (%) */}
            <tr className="hover:bg-[#202024]/50 transition">
              <td className="py-3 px-4 font-medium text-[#f4f4f5]">Net Margin (%)</td>
              <td className="py-3 px-4 font-mono-nums text-[#a1a1aa]">
                {activeProductMetrics.rawNetMarginPercent.toFixed(1)}%
              </td>
              <td
                className={`py-3 px-4 font-mono-nums font-bold ${
                  activeProductMetrics.adjustedNetMarginPercent >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {activeProductMetrics.adjustedNetMarginPercent.toFixed(1)}%
              </td>
              <td className="py-3 px-4 font-mono-nums text-right text-rose-400">
                {(
                  activeProductMetrics.adjustedNetMarginPercent -
                  activeProductMetrics.rawNetMarginPercent
                ).toFixed(1)}
                %
              </td>
            </tr>

            {/* Return Shipping Loss */}
            <tr className="hover:bg-[#202024]/50 transition bg-[#09090b]/40">
              <td className="py-3 px-4 font-medium text-[#a1a1aa]">
                Delivery Return Shipping Loss
              </td>
              <td className="py-3 px-4 font-mono-nums text-[#71717a]">$0.00</td>
              <td className="py-3 px-4 font-mono-nums text-rose-400 font-semibold">
                -{formatCurrency(activeProductMetrics.adjustedFailedShippingLoss, currency)}
              </td>
              <td className="py-3 px-4 font-mono-nums text-right text-[#71717a]">
                {Math.round(activeProductMetrics.adjustedFailedUnits)} failed parcels
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
