import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatROAS } from '../../lib/calculations';
import { Badge } from '../ui/badge';
import { tokens } from '../../theme/tokens';
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
      <div className={`relative overflow-hidden ${tokens.card.base} ${tokens.border.hover} p-6 transition-all`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${tokens.status.accent.bg} ${tokens.status.accent.text} ${tokens.status.accent.border} border`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-xs font-semibold ${tokens.text.secondary} uppercase tracking-wider`}>
                {t('calculator.heroBEROAS')}
              </h4>
              <p className={`text-[11px] ${tokens.text.muted}`}>{t('calculator.zeroProfitBaseline')}</p>
            </div>
          </div>
        </div>

        <div className="my-2">
          <div className={`text-4xl sm:text-5xl font-black font-mono-nums tracking-tight ${tokens.text.primary}`}>
            {formatROAS(beROAS)}
          </div>
        </div>

        <p className={`text-xs ${tokens.text.secondary} leading-relaxed mb-4`}>
          {t('calculator.heroBEROASDesc')}
        </p>

        <div className={`flex items-center justify-between text-xs pt-3 border-t ${tokens.border.subtle}`}>
          <span className={tokens.text.secondary}>{t('calculator.heroAdjBEROAS')}</span>
          <span className={`font-bold font-mono-nums ${tokens.status.warning.text}`}>
            {formatROAS(activeProductMetrics.adjustedBreakEvenROAS)}
          </span>
        </div>
      </div>

      {/* 2. Current Campaign ROAS Hero Card */}
      <div
        className={`relative overflow-hidden transition-all ${
          isProfitable ? tokens.card.profitHero : tokens.card.lossHero
        } p-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isProfitable
                  ? `${tokens.status.profit.bg} ${tokens.status.profit.text} ${tokens.status.profit.border}`
                  : `${tokens.status.loss.bg} ${tokens.status.loss.text} ${tokens.status.loss.border}`
              }`}
            >
              {isProfitable ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className={`text-xs font-semibold ${tokens.text.secondary} uppercase tracking-wider`}>
                {t('calculator.heroCurrentROAS')}
              </h4>
              <p className={`text-[11px] ${tokens.text.muted}`}>{t('calculator.basedOnCurrentCPA')}</p>
            </div>
          </div>

          {safetyPercent !== null && (
            <Badge variant={safetyPercent >= 0 ? 'success' : 'destructive'} className="font-mono-nums">
              {safetyPercent >= 0
                ? t('calculator.aboveBE', { percent: safetyPercent.toFixed(0) })
                : t('calculator.belowBE', { percent: safetyPercent.toFixed(0) })}
            </Badge>
          )}
        </div>

        <div className="my-2">
          <div
            className={`text-4xl sm:text-5xl font-black font-mono-nums tracking-tight ${
              isProfitable ? tokens.status.profit.text : tokens.status.loss.text
            }`}
          >
            {formatROAS(currentROAS)}
          </div>
        </div>

        <p className={`text-xs ${tokens.text.secondary} leading-relaxed mb-4`}>
          {beROAS === null ? (
            <span className={tokens.status.loss.text}>{t('calculator.negativeBaseMargin')}</span>
          ) : isProfitable ? (
            <span className={tokens.status.profit.text}>{t('calculator.profitableCampaign')}</span>
          ) : (
            <span className={tokens.status.loss.text}>{t('calculator.losingCampaign')}</span>
          )}
        </p>

        <div className={`flex items-center justify-between text-xs pt-3 border-t ${tokens.border.subtle}`}>
          <span className={tokens.text.secondary}>{t('calculator.status')}</span>
          <span
            className={`font-bold ${
              isProfitable ? tokens.status.profit.text : tokens.status.loss.text
            }`}
          >
            {isProfitable ? t('calculator.profitableCampaign') : t('calculator.losingCampaign')}
          </span>
        </div>
      </div>
    </div>
  );
};
