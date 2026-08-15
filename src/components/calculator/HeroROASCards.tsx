import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatROAS } from '../../lib/calculations';
import { Target, TrendingUp, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export const HeroROASCards: React.FC = () => {
  const { activeProduct, activeProductMetrics } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const isProfitable =
    activeProductMetrics.breakEvenROAS !== null &&
    activeProductMetrics.currentROAS >= activeProductMetrics.breakEvenROAS;

  const roasDiff =
    activeProductMetrics.breakEvenROAS !== null
      ? activeProductMetrics.currentROAS - activeProductMetrics.breakEvenROAS
      : 0;

  const roasPercentageDiff =
    activeProductMetrics.breakEvenROAS !== null && activeProductMetrics.breakEvenROAS > 0
      ? (roasDiff / activeProductMetrics.breakEvenROAS) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 1. Break-Even ROAS Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#18181b] to-[#141417] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Break-Even ROAS
          </span>
          <div className="p-2 rounded-xl bg-[#27272a] text-[#a1a1aa]">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl sm:text-5xl font-extrabold font-mono-nums tracking-tight text-[#f4f4f5]">
            {formatROAS(activeProductMetrics.breakEvenROAS)}
          </span>
        </div>

        <p className="text-xs text-[#71717a] mt-1">
          Minimum return on ad spend required to cover COGS, shipping & fixed costs at 100% fulfillment.
        </p>

        {activeProductMetrics.adjustedBreakEvenROAS && (
          <div className="mt-4 pt-3 border-t border-[#27272a]/60 flex items-center justify-between text-xs">
            <span className="text-[#a1a1aa]">Fulfillment Adjusted BE:</span>
            <span className="font-bold font-mono-nums text-amber-400">
              {formatROAS(activeProductMetrics.adjustedBreakEvenROAS)}
            </span>
          </div>
        )}
      </div>

      {/* 2. Current ROAS Hero */}
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#18181b] to-[#141417] border rounded-2xl p-5 sm:p-6 shadow-sm transition-all ${
          isProfitable
            ? 'border-emerald-500/40 glow-emerald'
            : 'border-rose-500/40 glow-rose'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Current ROAS
          </span>
          <div
            className={`p-2 rounded-xl ${
              isProfitable
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isProfitable ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span
            className={`text-4xl sm:text-5xl font-extrabold font-mono-nums tracking-tight ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatROAS(activeProductMetrics.currentROAS)}
          </span>
        </div>

        {/* Dynamic Margin of Safety Badge */}
        <div className="mt-2">
          {activeProductMetrics.breakEvenROAS === null ? (
            <div className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
              Negative base unit margin before ads
            </div>
          ) : isProfitable ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{roasPercentageDiff.toFixed(1)}% above break-even</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{roasPercentageDiff.toFixed(1)}% below break-even</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#27272a]/60 flex items-center justify-between text-xs">
          <span className="text-[#a1a1aa]">Status:</span>
          <span
            className={`font-semibold ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isProfitable ? 'Profitable Campaign' : 'Losing Campaign'}
          </span>
        </div>
      </div>
    </div>
  );
};
