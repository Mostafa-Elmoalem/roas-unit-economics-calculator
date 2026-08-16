import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { tokens } from '../../theme/tokens';
import { Boxes, Truck, Percent, Package } from 'lucide-react';

export const UnitEconomicsCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, activeProductMetrics, updateProduct, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const getFulfillmentColor = (rate: number) => {
    if (rate >= 85) return tokens.status.profit.text;
    if (rate >= 70) return tokens.status.warning.text;
    return tokens.status.loss.text;
  };

  return (
    <div className={`${tokens.card.base} p-4 sm:p-6 space-y-4 sm:space-y-5`}>
      <div className={`flex flex-wrap items-center justify-between border-b ${tokens.border.default} pb-3 gap-2`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${tokens.status.profit.bg} ${tokens.status.profit.text} ${tokens.status.profit.border} border`}>
            <Package className="w-4 h-4" />
          </div>
          <h3 className={`text-sm font-semibold ${tokens.text.primary} tracking-tight`}>
            {t('calculator.unitEconomicsTitle')}
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${tokens.bg.toggleTrack} border ${tokens.border.default} text-[11px] ${tokens.text.secondary} font-mono-nums`}>
          <span>{t('calculator.grossMargin')}</span>
          <span className={`font-semibold ${tokens.status.profit.text}`}>
            {formatCurrency(activeProductMetrics.grossMargin, currency)} (
            {activeProductMetrics.grossMarginPercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Product Name */}
        <div className="sm:col-span-2">
          <label className={`block text-xs font-medium ${tokens.text.secondary} mb-1.5`}>
            {t('calculator.productTitle')}
          </label>
          <input
            type="text"
            value={activeProduct.name}
            onChange={(e) => updateProduct(activeProduct.id, { name: e.target.value })}
            className={`w-full ${tokens.bg.input} border ${tokens.border.default} ${tokens.border.focus} rounded-xl px-3.5 py-2.5 sm:py-2 text-sm sm:text-xs font-medium ${tokens.text.primary} transition`}
            placeholder={t('calculator.productTitlePlaceholder')}
          />
        </div>

        {/* Selling Price */}
        <div>
          <label className={`block text-xs font-medium ${tokens.text.secondary} mb-1.5`}>
            {t('calculator.sellingPrice')} ({currency})
          </label>
          <div className="relative">
            <span className={`absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold ${tokens.text.muted}`}>
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={activeProduct.sellingPrice || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  sellingPrice: parseFloat(e.target.value) || 0,
                })
              }
              className={`w-full ${tokens.bg.input} border ${tokens.border.default} ${tokens.border.focus} rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 sm:py-2 text-sm sm:text-xs font-bold font-mono-nums ${tokens.text.primary} transition`}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* COGS (Cost Per Unit) */}
        <div>
          <label className={`block text-xs font-medium ${tokens.text.secondary} mb-1.5`}>
            {t('calculator.cogs')} ({currency})
          </label>
          <div className="relative">
            <span className={`absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold ${tokens.text.muted}`}>
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={activeProduct.cogs || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  cogs: parseFloat(e.target.value) || 0,
                })
              }
              className={`w-full ${tokens.bg.input} border ${tokens.border.default} ${tokens.border.focus} rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 sm:py-2 text-sm sm:text-xs font-bold font-mono-nums ${tokens.text.primary} transition`}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Number of Units */}
        <div>
          <label className={`block text-xs font-medium ${tokens.text.secondary} mb-1.5`}>
            {t('calculator.batchUnits')}
          </label>
          <div className="relative">
            <Boxes className={`w-3.5 h-3.5 ${tokens.text.muted} absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2`} />
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={activeProduct.units || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  units: parseInt(e.target.value, 10) || 1,
                })
              }
              className={`w-full ${tokens.bg.input} border ${tokens.border.default} ${tokens.border.focus} rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 sm:py-2 text-sm sm:text-xs font-semibold font-mono-nums ${tokens.text.primary} transition`}
              placeholder="500"
            />
          </div>
        </div>

        {/* Shipping Per Unit */}
        <div>
          <label className={`block text-xs font-medium ${tokens.text.secondary} mb-1.5`}>
            {t('calculator.shippingPerUnit')} ({currency})
          </label>
          <div className="relative">
            <Truck className={`w-3.5 h-3.5 ${tokens.text.muted} absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2`} />
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={activeProduct.shippingPerUnit || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  shippingPerUnit: parseFloat(e.target.value) || 0,
                })
              }
              className={`w-full ${tokens.bg.input} border ${tokens.border.default} ${tokens.border.focus} rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2.5 sm:py-2 text-sm sm:text-xs font-semibold font-mono-nums ${tokens.text.primary} transition`}
              placeholder="5.00"
            />
          </div>
        </div>
      </div>

      {/* Fulfillment Rate Slider */}
      <div className={`pt-3 border-t ${tokens.border.subtle}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Percent className={`w-3.5 h-3.5 ${tokens.text.secondary}`} />
            <label className={`text-xs font-medium ${tokens.text.primary}`}>
              {t('calculator.fulfillmentRate')}
            </label>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              max="100"
              step="1"
              value={activeProduct.fulfillmentRate ?? 80}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  fulfillmentRate: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                })
              }
              className={`w-14 ${tokens.bg.input} border ${tokens.border.default} rounded-lg px-2 py-1 text-xs font-bold font-mono-nums text-right rtl:text-left outline-none ${getFulfillmentColor(
                activeProduct.fulfillmentRate ?? 80
              )}`}
            />
            <span className={`text-xs ${tokens.text.muted}`}>%</span>
          </div>
        </div>

        <input
          type="range"
          min="20"
          max="100"
          step="1"
          value={activeProduct.fulfillmentRate ?? 80}
          onChange={(e) =>
            updateProduct(activeProduct.id, {
              fulfillmentRate: parseInt(e.target.value, 10),
            })
          }
          className="w-full accent-emerald-500 py-2 cursor-pointer touch-manipulation"
        />

        <div className={`flex items-center justify-between text-[11px] ${tokens.text.muted} mt-1`}>
          <span>{t('calculator.highReturnRisk')}</span>
          <span className={`font-mono-nums font-medium ${tokens.text.primary}`}>
            {t('calculator.deliveredOfTotal', {
              delivered: Math.round(activeProductMetrics.adjustedDeliveredUnits),
              total: activeProduct.units.toLocaleString(),
            })}
          </span>
          <span>{t('calculator.zeroReturns')}</span>
        </div>
      </div>
    </div>
  );
};
