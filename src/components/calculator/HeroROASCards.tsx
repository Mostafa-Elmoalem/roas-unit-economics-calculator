import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatROAS } from '../../lib/calculations';
import { TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

export const HeroROASCards: React.FC = () => {
  const { t } = useTranslation();
  const { activeProductMetrics } = useApp();

  if (!activeProductMetrics) return null;

  const isProfitable = activeProductMetrics.isProfitableAdjusted;
  const beROAS = activeProductMetrics.breakEvenROAS;
  const currentROAS = activeProductMetrics.currentROAS;

  // Margin of safety percentage
  const safetyPercent =
    beROAS && beROAS > 0 ? ((currentROAS - beROAS) / beROAS) * 100 : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Break-Even ROAS Hero Card */}
      <div className="relative overflow-hidden bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] rounded-2xl p-6 transition-all shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider">
                {t('calculator.heroBEROAS')}
              </h4>
              <p className="text-[11px] text-zinc-400 dark:text-[#71717a]">Zero-profit baseline threshold</p>
            </div>
          </div>
        </div>

        <div className="my-2">
          <div className="text-4xl sm:text-5xl font-black font-mono-nums tracking-tight text-zinc-900 dark:text-[#f4f4f5]">
            {formatROAS(beROAS)}
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-[#a1a1aa] leading-relaxed mb-4">
          {t('calculator.heroBEROASDesc')}
        </p>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100 dark:border-[#27272a]/60">
          <span className="text-zinc-500 dark:text-[#a1a1aa]">{t('calculator.heroAdjBEROAS')}</span>
          <span className="font-bold font-mono-nums text-amber-600 dark:text-amber-400">
            {formatROAS(activeProductMetrics.adjustedBreakEvenROAS)}
          </span>
        </div>
      </div>

      {/* 2. Current Campaign ROAS Hero Card */}
      <div
        className={`relative overflow-hidden bg-white dark:bg-[#18181b] border rounded-2xl p-6 transition-all shadow-xs ${
          isProfitable
            ? 'border-emerald-500/40 hover:border-emerald-500/60'
            : 'border-rose-500/40 hover:border-rose-500/60'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-xl ${
                isProfitable
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {isProfitable ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider">
                {t('calculator.heroCurrentROAS')}
              </h4>
              <p className="text-[11px] text-zinc-400 dark:text-[#71717a]">Based on current CPA</p>
            </div>
          </div>

          {safetyPercent !== null && (
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono-nums ${
                safetyPercent >= 0
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
              }`}
            >
              {safetyPercent >= 0
                ? t('calculator.aboveBE', { percent: safetyPercent.toFixed(0) })
                : t('calculator.belowBE', { percent: safetyPercent.toFixed(0) })}
            </div>
          )}
        </div>

        <div className="my-2">
          <div
            className={`text-4xl sm:text-5xl font-black font-mono-nums tracking-tight ${
              isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatROAS(currentROAS)}
          </div>
        </div>

        <p className="text-xs text-zinc-600 dark:text-[#a1a1aa] leading-relaxed mb-4">
          {beROAS === null ? (
            <span className="text-rose-600 dark:text-rose-400">{t('calculator.negativeBaseMargin')}</span>
          ) : isProfitable ? (
            <span className="text-emerald-600 dark:text-emerald-400">{t('calculator.profitableCampaign')}</span>
          ) : (
            <span className="text-rose-600 dark:text-rose-400">{t('calculator.losingCampaign')}</span>
          )}
        </p>

        <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-100 dark:border-[#27272a]/60">
          <span className="text-zinc-500 dark:text-[#a1a1aa]">{t('calculator.status')}</span>
          <span
            className={`font-bold ${
              isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isProfitable ? t('calculator.profitableCampaign') : t('calculator.losingCampaign')}
          </span>
        </div>
      </div>
    </div>
  );
};
