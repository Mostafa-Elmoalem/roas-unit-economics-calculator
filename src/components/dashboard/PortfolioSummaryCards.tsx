import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatROAS } from '../../lib/calculations';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  PackageCheck,
  Wallet,
} from 'lucide-react';

export const PortfolioSummaryCards: React.FC = () => {
  const { t } = useTranslation();
  const { portfolioMetrics, currency } = useApp();

  const isBlendedProfitable =
    portfolioMetrics.blendedBreakEvenROAS !== null &&
    portfolioMetrics.blendedCurrentROAS >= portfolioMetrics.blendedBreakEvenROAS;

  const profitDifference =
    portfolioMetrics.totalRawProfit - portfolioMetrics.totalAdjustedProfit;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Blended Break-Even ROAS */}
      <div className="relative overflow-hidden bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] rounded-2xl p-5 transition-all shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider">
            {t('dashboard.blendedBEROAS')}
          </span>
          <div
            className={`p-2 rounded-xl ${
              isBlendedProfitable
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold font-mono-nums tracking-tight text-zinc-900 dark:text-[#f4f4f5]">
            {formatROAS(portfolioMetrics.blendedBreakEvenROAS)}
          </span>
          <span className="text-xs text-zinc-400 dark:text-[#71717a]">{t('dashboard.targetBE')}</span>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100 dark:border-[#27272a]/60">
          <span className="text-zinc-500 dark:text-[#a1a1aa]">{t('dashboard.currentPortfolioROAS')}</span>
          <span
            className={`font-semibold font-mono-nums ${
              isBlendedProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatROAS(portfolioMetrics.blendedCurrentROAS)}
          </span>
        </div>
      </div>

      {/* 2. Total Profit (Raw - 100% Fulfillment) */}
      <div className="relative overflow-hidden bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] rounded-2xl p-5 transition-all shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider">
            {t('dashboard.rawProfit')}
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span
            className={`text-3xl font-bold font-mono-nums tracking-tight ${
              portfolioMetrics.totalRawProfit >= 0 ? 'text-zinc-900 dark:text-[#f4f4f5]' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(portfolioMetrics.totalRawProfit, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100 dark:border-[#27272a]/60">
          <span className="text-zinc-500 dark:text-[#a1a1aa]">{t('dashboard.rawMargin')}</span>
          <span className="font-semibold font-mono-nums text-zinc-900 dark:text-[#f4f4f5]">
            {portfolioMetrics.rawBlendedMarginPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 3. Total Profit (Fulfillment Adjusted) */}
      <div className="relative overflow-hidden bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] rounded-2xl p-5 transition-all shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider">
            {t('dashboard.adjustedProfit')}
          </span>
          <div
            className={`p-2 rounded-xl ${
              portfolioMetrics.totalAdjustedProfit >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span
            className={`text-3xl font-bold font-mono-nums tracking-tight ${
              portfolioMetrics.totalAdjustedProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(portfolioMetrics.totalAdjustedProfit, currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100 dark:border-[#27272a]/60">
          <span className="text-zinc-500 dark:text-[#a1a1aa]">{t('dashboard.deliveryDrag')}</span>
          <span className="font-semibold font-mono-nums text-rose-600 dark:text-rose-400">
            -{formatCurrency(profitDifference, currency)}
          </span>
        </div>
      </div>

      {/* 4. Portfolio Health Status Badge */}
      <div className="relative overflow-hidden bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] rounded-2xl p-5 transition-all shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider">
            {t('dashboard.portfolioHealth')}
          </span>
          <div
            className={`p-2 rounded-xl ${
              portfolioMetrics.healthStatus === 'all-healthy'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : portfolioMetrics.healthStatus === 'warning'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {portfolioMetrics.healthStatus === 'all-healthy' ? (
              <ShieldCheck className="w-4 h-4" />
            ) : portfolioMetrics.healthStatus === 'warning' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </div>
        </div>

        <div>
          {portfolioMetrics.healthStatus === 'all-healthy' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              {t('dashboard.allHealthy', { count: portfolioMetrics.totalProducts })}
            </div>
          ) : portfolioMetrics.healthStatus === 'warning' ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              {t('dashboard.someWarning', {
                count: portfolioMetrics.unhealthyCount,
                total: portfolioMetrics.totalProducts,
              })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
              {t('dashboard.criticalWarning', { count: portfolioMetrics.unhealthyCount })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100 dark:border-[#27272a]/60 mt-3">
          <span className="text-zinc-500 dark:text-[#a1a1aa]">{t('dashboard.realizedNetMargin')}</span>
          <span
            className={`font-semibold font-mono-nums ${
              portfolioMetrics.adjustedBlendedMarginPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {portfolioMetrics.adjustedBlendedMarginPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
