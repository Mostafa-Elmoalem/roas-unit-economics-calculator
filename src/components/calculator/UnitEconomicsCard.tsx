import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import { Boxes, Truck, Percent, Package } from 'lucide-react';

export const UnitEconomicsCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, activeProductMetrics, updateProduct, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const getFulfillmentColor = (rate: number) => {
    if (rate >= 85) return 'text-emerald-400';
    if (rate >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Package className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#f4f4f5] tracking-tight">
            {t('calculator.unitEconomicsTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#09090b] border border-[#27272a] text-[11px] text-[#a1a1aa] font-mono-nums">
          <span>{t('calculator.grossMargin')}</span>
          <span className="font-semibold text-emerald-400">
            {formatCurrency(activeProductMetrics.grossMargin, currency)} (
            {activeProductMetrics.grossMarginPercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Product Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            {t('calculator.productTitle')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={activeProduct.name}
              onChange={(e) => updateProduct(activeProduct.id, { name: e.target.value })}
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-medium text-[#f4f4f5] outline-none transition"
              placeholder={t('calculator.productTitlePlaceholder')}
            />
          </div>
        </div>

        {/* Selling Price */}
        <div>
          <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            {t('calculator.sellingPrice')} ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71717a]">
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              value={activeProduct.sellingPrice || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  sellingPrice: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2 text-xs font-bold font-mono-nums text-[#f4f4f5] outline-none transition"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* COGS (Cost Per Unit) */}
        <div>
          <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            {t('calculator.cogs')} ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2 text-xs font-semibold text-[#71717a]">
              {currency === 'EGP' ? 'EGP' : '$'}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              value={activeProduct.cogs || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  cogs: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2 text-xs font-bold font-mono-nums text-[#f4f4f5] outline-none transition"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Number of Units */}
        <div>
          <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            {t('calculator.batchUnits')}
          </label>
          <div className="relative">
            <Boxes className="w-3.5 h-3.5 text-[#71717a] absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="1"
              step="1"
              value={activeProduct.units || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  units: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2 text-xs font-semibold font-mono-nums text-[#f4f4f5] outline-none transition"
              placeholder="500"
            />
          </div>
        </div>

        {/* Shipping Per Unit */}
        <div>
          <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
            {t('calculator.shippingPerUnit')} ({currency})
          </label>
          <div className="relative">
            <Truck className="w-3.5 h-3.5 text-[#71717a] absolute left-3.5 rtl:right-3.5 rtl:left-auto top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="any"
              min="0"
              value={activeProduct.shippingPerUnit || ''}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  shippingPerUnit: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-[#09090b] border border-[#27272a] focus:border-emerald-500 rounded-xl pl-9 rtl:pr-9 rtl:pl-3.5 pr-3.5 py-2 text-xs font-semibold font-mono-nums text-[#f4f4f5] outline-none transition"
              placeholder="5.00"
            />
          </div>
        </div>
      </div>

      {/* Fulfillment Rate Slider & Percentage Input */}
      <div className="pt-3 border-t border-[#27272a]/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-[#a1a1aa]" />
            <label className="text-xs font-medium text-[#f4f4f5]">
              {t('calculator.fulfillmentRate')}
            </label>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={activeProduct.fulfillmentRate ?? 80}
              onChange={(e) =>
                updateProduct(activeProduct.id, {
                  fulfillmentRate: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                })
              }
              className={`w-14 bg-[#09090b] border border-[#27272a] rounded-lg px-2 py-0.5 text-xs font-bold font-mono-nums text-right rtl:text-left outline-none ${getFulfillmentColor(
                activeProduct.fulfillmentRate ?? 80
              )}`}
            />
            <span className="text-xs text-[#71717a]">%</span>
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
          className="w-full accent-emerald-400"
        />

        <div className="flex items-center justify-between text-[11px] text-[#71717a] mt-1">
          <span>{t('calculator.highReturnRisk')}</span>
          <span className="font-mono-nums">
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
