import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatROAS } from '../../lib/calculations';
import { tokens } from '../../theme/tokens';
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
      <div className={`relative overflow-hidden ${tokens.card.base} ${tokens.border.hover} p-5 transition-all`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium ${tokens.text.secondary} uppercase tracking-wider`}>
            {t('dashboard.blendedBEROAS')}
          </span>
          <div
            className={`p-2 rounded-xl ${
              isBlendedProfitable
                ? `${tokens.status.profit.bg} ${tokens.status.profit.text} ${tokens.status.profit.border} border`
                : `${tokens.status.loss.bg} ${tokens.status.loss.text} ${tokens.status.loss.border} border`
            }`}
          >
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className={`text-3xl font-bold font-mono-nums tracking-tight ${tokens.text.primary}`}>
            {formatROAS(portfolioMetrics.blendedBreakEvenROAS)}
          </span>
          <span className={`text-xs ${tokens.text.muted}`}>{t('dashboard.targetBE')}</span>
        </div>

        <div className={`flex items-center justify-between text-xs pt-3 border-t ${tokens.border.subtle}`}>
          <span className={tokens.text.secondary}>{t('dashboard.currentPortfolioROAS')}</span>
          <span
            className={`font-semibold font-mono-nums ${
              isBlendedProfitable ? tokens.status.profit.text : tokens.status.loss.text
            }`}
          >
            {formatROAS(portfolioMetrics.blendedCurrentROAS)}
          </span>
        </div>
      </div>

      {/* 2. Total Profit (Raw - 100% Fulfillment) */}
      <div className={`relative overflow-hidden ${tokens.card.base} ${tokens.border.hover} p-5 transition-all`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium ${tokens.text.secondary} uppercase tracking-wider`}>
            {t('dashboard.rawProfit')}
          </span>
          <div className={`p-2 rounded-xl ${tokens.status.accent.bg} ${tokens.status.accent.text} ${tokens.status.accent.border} border`}>
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span
            className={`text-3xl font-bold font-mono-nums tracking-tight ${
              portfolioMetrics.totalRawProfit >= 0 ? tokens.text.primary : tokens.status.loss.text
            }`}
          >
            {formatCurrency(portfolioMetrics.totalRawProfit, currency)}
          </span>
        </div>

        <div className={`flex items-center justify-between text-xs pt-3 border-t ${tokens.border.subtle}`}>
          <span className={tokens.text.secondary}>{t('dashboard.rawMargin')}</span>
          <span className={`font-semibold font-mono-nums ${tokens.text.primary}`}>
            {portfolioMetrics.rawBlendedMarginPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 3. Total Profit (Fulfillment Adjusted) */}
      <div className={`relative overflow-hidden ${tokens.card.base} ${tokens.border.hover} p-5 transition-all`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium ${tokens.text.secondary} uppercase tracking-wider`}>
            {t('dashboard.adjustedProfit')}
          </span>
          <div
            className={`p-2 rounded-xl ${
              portfolioMetrics.totalAdjustedProfit >= 0
                ? `${tokens.status.profit.bg} ${tokens.status.profit.text} ${tokens.status.profit.border} border`
                : `${tokens.status.loss.bg} ${tokens.status.loss.text} ${tokens.status.loss.border} border`
            }`}
          >
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span
            className={`text-3xl font-bold font-mono-nums tracking-tight ${
              portfolioMetrics.totalAdjustedProfit >= 0 ? tokens.status.profit.text : tokens.status.loss.text
            }`}
          >
            {formatCurrency(portfolioMetrics.totalAdjustedProfit, currency)}
          </span>
        </div>

        <div className={`flex items-center justify-between text-xs pt-3 border-t ${tokens.border.subtle}`}>
          <span className={tokens.text.secondary}>{t('dashboard.deliveryDrag')}</span>
          <span className={`font-semibold font-mono-nums ${tokens.status.loss.text}`}>
            -{formatCurrency(profitDifference, currency)}
          </span>
        </div>
      </div>

      {/* 4. Portfolio Health Status Badge */}
      <div className={`relative overflow-hidden ${tokens.card.base} ${tokens.border.hover} p-5 transition-all flex flex-col justify-between`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium ${tokens.text.secondary} uppercase tracking-wider`}>
            {t('dashboard.portfolioHealth')}
          </span>
          <div
            className={`p-2 rounded-xl ${
              portfolioMetrics.healthStatus === 'all-healthy'
                ? `${tokens.status.profit.bg} ${tokens.status.profit.text} ${tokens.status.profit.border} border`
                : portfolioMetrics.healthStatus === 'warning'
                ? `${tokens.status.warning.bg} ${tokens.status.warning.text} ${tokens.status.warning.border} border`
                : `${tokens.status.loss.bg} ${tokens.status.loss.text} ${tokens.status.loss.border} border`
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
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${tokens.status.profit.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              {t('dashboard.allHealthy', { count: portfolioMetrics.totalProducts })}
            </div>
          ) : portfolioMetrics.healthStatus === 'warning' ? (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${tokens.status.warning.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
              {t('dashboard.someWarning', {
                count: portfolioMetrics.unhealthyCount,
                total: portfolioMetrics.totalProducts,
              })}
            </div>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg ${tokens.status.loss.badge}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
              {t('dashboard.criticalWarning', { count: portfolioMetrics.unhealthyCount })}
            </div>
          )}
        </div>

        <div className={`flex items-center justify-between text-xs pt-3 border-t ${tokens.border.subtle} mt-3`}>
          <span className={tokens.text.secondary}>{t('dashboard.realizedNetMargin')}</span>
          <span
            className={`font-semibold font-mono-nums ${
              portfolioMetrics.adjustedBlendedMarginPercent >= 0 ? tokens.status.profit.text : tokens.status.loss.text
            }`}
          >
            {portfolioMetrics.adjustedBlendedMarginPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
