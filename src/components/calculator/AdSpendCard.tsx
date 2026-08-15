import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { Target, ArrowLeftRight } from 'lucide-react';

export const AdSpendCard: React.FC = () => {
  const { activeProduct, activeProductMetrics, updateProduct, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const isPerUnit = activeProduct.adSpendMode === 'per-unit';

  const handleToggleMode = (mode: 'per-unit' | 'total') => {
    updateProduct(activeProduct.id, { adSpendMode: mode });
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#f4f4f5] tracking-tight">
            3. Ad Spend & Paid Acquisition
          </h3>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex items-center bg-[#09090b] border border-[#27272a] rounded-xl p-0.5 text-[11px]">
          <button
            onClick={() => handleToggleMode('per-unit')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              isPerUnit
                ? 'bg-[#27272a] text-[#f4f4f5] shadow-xs'
                : 'text-[#71717a] hover:text-[#a1a1aa]'
            }`}
          >
            CPA / Unit
          </button>
          <button
            onClick={() => handleToggleMode('total')}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              !isPerUnit
                ? 'bg-[#27272a] text-[#f4f4f5] shadow-xs'
                : 'text-[#71717a] hover:text-[#a1a1aa]'
            }`}
          >
            Total Budget
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Ad Spend Per Unit (CPA) */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            isPerUnit
              ? 'bg-[#09090b] border-emerald-500/50 shadow-xs'
              : 'bg-[#0f0f11] border-[#27272a] opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#a1a1aa]">
              Cost Per Acquisition (CPA)
            </label>
            {isPerUnit && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-1.5 py-0.2 rounded">
                Active Input
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71717a]">
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              disabled={!isPerUnit}
              value={activeProduct.adSpendPerUnit || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  adSpendPerUnit: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-transparent pl-8 pr-2 py-1 text-sm font-bold font-mono-nums text-[#f4f4f5] outline-none disabled:cursor-not-allowed"
              placeholder="0.00"
            />
          </div>
          <div className="text-[10px] text-[#71717a] mt-1">
            Target / Actual Ad Cost per order
          </div>
        </div>

        {/* 2. Total Campaign Ad Spend */}
        <div
          className={`p-3.5 rounded-xl border transition-all ${
            !isPerUnit
              ? 'bg-[#09090b] border-emerald-500/50 shadow-xs'
              : 'bg-[#0f0f11] border-[#27272a] opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#a1a1aa]">
              Total Campaign Ad Spend
            </label>
            {!isPerUnit && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-1.5 py-0.2 rounded">
                Active Input
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71717a]">
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              disabled={isPerUnit}
              value={activeProduct.totalAdSpend || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  totalAdSpend: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-transparent pl-8 pr-2 py-1 text-sm font-bold font-mono-nums text-[#f4f4f5] outline-none disabled:cursor-not-allowed"
              placeholder="0.00"
            />
          </div>
          <div className="text-[10px] text-[#71717a] mt-1">
            Across {activeProduct.units.toLocaleString()} total units
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-xl text-[#a1a1aa]">
        <div className="flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
          <span>Break-Even Max Allowable CPA:</span>
        </div>
        <span
          className={`font-bold font-mono-nums ${
            activeProductMetrics.breakEvenCPA > 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {formatCurrency(activeProductMetrics.breakEvenCPA, currency)}
        </span>
      </div>
    </div>
  );
};
