import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { calculateProductMetrics, formatCurrency } from '@shared';
import { tokens } from '../../theme/tokens';
import { Button } from '../ui/button';

const formatPercent = (val: number): string => `${val.toFixed(1)}%`;
import {
  ArrowLeftRight,
  Trophy,
  TrendingUp,
  Percent,
  ShieldCheck,
  Calculator,
  X,
  Plus,
  Check,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ProductComparisonViewProps {
  onOpenAddModal: () => void;
}

export const ProductComparisonView: React.FC<ProductComparisonViewProps> = ({
  onOpenAddModal,
}) => {
  const { t } = useTranslation();
  const {
    products,
    currency,
    comparedProductIds,
    toggleComparedProduct,
    setComparedProductIds,
    clearComparedProducts,
    setActiveProductId,
    setView,
  } = useApp();

  // Filter products currently selected for comparison
  const comparedProducts = useMemo(() => {
    return products.filter((p) => comparedProductIds.includes(p.id));
  }, [products, comparedProductIds]);

  // Compute metrics for all compared products
  const computedList = useMemo(() => {
    return comparedProducts.map((product) => ({
      product,
      metrics: calculateProductMetrics(product),
    }));
  }, [comparedProducts]);

  // Identify Best Performers for Winner Badges
  const winners = useMemo(() => {
    if (computedList.length < 2) return null;

    // 1. Lowest Break-Even ROAS (Easiest to scale profitably)
    const validBEROAS = computedList.filter(
      (item) => item.metrics.adjustedBreakEvenROAS !== null && item.metrics.adjustedBreakEvenROAS > 0
    );
    const lowestBEROAS =
      validBEROAS.length > 0
        ? validBEROAS.reduce((min, curr) =>
            (curr.metrics.adjustedBreakEvenROAS || Infinity) <
            (min.metrics.adjustedBreakEvenROAS || Infinity)
              ? curr
              : min
          )
        : null;

    // 2. Highest Net Profit per Delivered Unit
    const highestProfit = computedList.reduce((max, curr) =>
      curr.metrics.adjustedProfitPerDeliveredUnit > max.metrics.adjustedProfitPerDeliveredUnit
        ? curr
        : max
    );

    // 3. Highest Net Margin Percent
    const highestMargin = computedList.reduce((max, curr) =>
      curr.metrics.adjustedNetMarginPercent > max.metrics.adjustedNetMarginPercent
        ? curr
        : max
    );

    // 4. Most COD Resilient (lowest failed shipping loss per unit relative to selling price)
    const mostResilient = computedList.reduce((best, curr) => {
      const bestRatio =
        best.metrics.adjustedFailedShippingLoss / (best.product.sellingPrice || 1);
      const currRatio =
        curr.metrics.adjustedFailedShippingLoss / (curr.product.sellingPrice || 1);
      return currRatio < bestRatio ? curr : best;
    });

    return {
      lowestBEROASId: lowestBEROAS?.product.id,
      highestProfitId: highestProfit.product.id,
      highestMarginId: highestMargin.product.id,
      mostResilientId: mostResilient.product.id,
    };
  }, [computedList]);

  const handleSelectAll = () => {
    setComparedProductIds(products.map((p) => p.id));
  };

  const handleSelectTop = () => {
    setComparedProductIds(products.slice(0, 3).map((p) => p.id));
  };

  const handleOpenInCalculator = (productId: string) => {
    setActiveProductId(productId);
    setView('calculator');
  };

  return (
    <div id="main-content-view" className="space-y-6">
      {/* 1. Header Banner & Context */}
      <div className={`relative overflow-hidden ${tokens.card.base} p-5 sm:p-7 shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{t('comparison.headerBadge')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-[#f4f4f5]">
              {t('comparison.headerTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#a1a1aa] mt-1 max-w-2xl leading-relaxed">
              {t('comparison.headerDesc')}
            </p>
          </div>

          {/* Quick Selection Actions */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <span className="text-xs font-medium text-zinc-500 dark:text-[#a1a1aa]">
              {t('comparison.comparingCount', {
                count: comparedProducts.length,
                total: products.length,
              })}
            </span>
            {comparedProducts.length < products.length && (
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
              >
                {t('comparison.selectAll')}
              </button>
            )}
            {comparedProducts.length > 0 && (
              <button
                onClick={clearComparedProducts}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-rose-100 dark:bg-[#27272a] dark:hover:bg-rose-950/40 text-zinc-600 hover:text-rose-600 dark:text-[#a1a1aa] dark:hover:text-rose-400 transition cursor-pointer"
              >
                {t('comparison.clearAll')}
              </button>
            )}
          </div>
        </div>

        {/* Product Chips Selector (Quick toggle pills) */}
        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-[#27272a] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-[#71717a] mr-1 rtl:ml-1 rtl:mr-0">
            {t('comparison.selectProducts')}:
          </span>
          {products.map((p) => {
            const isSelected = comparedProductIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleComparedProduct(p.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#202024] dark:hover:bg-[#27272a] text-zinc-600 dark:text-[#a1a1aa] border border-transparent'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-500 text-black font-bold'
                      : 'border-zinc-300 dark:border-zinc-600'
                  }`}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
                <span className="max-w-[140px] truncate">{p.name}</span>
                <span className="font-mono text-[10px] opacity-75">
                  ({formatCurrency(p.sellingPrice, currency)})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Empty State (Fewer than 2 products selected) */}
      {computedList.length < 2 ? (
        <div className={`${tokens.card.base} p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4`}>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#f4f4f5]">
              {t('comparison.emptyTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-[#a1a1aa] mt-1.5 leading-relaxed">
              {t('comparison.emptyDesc')}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {products.length >= 2 ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleSelectTop}
                className="gap-1.5 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('comparison.selectProductsBtn')}</span>
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={onOpenAddModal}
                className="gap-1.5 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('common.addProduct')}</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 3. Automated Winner Ribbons (Diagnosis Highlights) */}
          {winners && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Lowest BE ROAS */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>الأسهل إعلاناً وتوسعاً</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                    Lowest BE ROAS
                  </span>
                </div>
                {(() => {
                  const winner = computedList.find((i) => i.product.id === winners.lowestBEROASId);
                  return winner ? (
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {winner.product.name}
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {winner.metrics.adjustedBreakEvenROAS
                            ? `${winner.metrics.adjustedBreakEvenROAS.toFixed(2)}x`
                            : 'N/A'}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-[#a1a1aa]">
                          نقطة التعادل المطلوبة
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Card 2: Highest Net Profit */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>أعلى صافي ربح للطلب</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded font-mono">
                    Top Cash / Unit
                  </span>
                </div>
                {(() => {
                  const winner = computedList.find((i) => i.product.id === winners.highestProfitId);
                  return winner ? (
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {winner.product.name}
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(winner.metrics.adjustedProfitPerDeliveredUnit, currency)}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-[#a1a1aa]">
                          صافي ربح لكل طلب مستلم
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Card 3: Highest Margin */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5" />
                    <span>أعلى نسبة هامش ربح</span>
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 px-1.5 py-0.5 rounded font-mono">
                    Highest Margin %
                  </span>
                </div>
                {(() => {
                  const winner = computedList.find((i) => i.product.id === winners.highestMarginId);
                  return winner ? (
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {winner.product.name}
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                          {formatPercent(winner.metrics.adjustedNetMarginPercent)}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-[#a1a1aa]">
                          هامش الربح بعد المصاريف
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Card 4: Most COD Resilient */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>الأكثر أماناً ضد المرتجع</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                    COD Shield
                  </span>
                </div>
                {(() => {
                  const winner = computedList.find((i) => i.product.id === winners.mostResilientId);
                  return winner ? (
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {winner.product.name}
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                          {winner.product.fulfillmentRate}%
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-[#a1a1aa]">
                          نسبة تسليم مع أقل نزيف شحن
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* 4. The Master Comparison Table (Responsive with Sticky Metric Column) */}
          <div className={`${tokens.card.base} overflow-hidden shadow-xs`}>
            {/* Scrollable Container with Tablet/Mobile optimization */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-start border-collapse min-w-[640px] sm:min-w-[800px]">
                {/* Table Header: Product Cards */}
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-[#27272a] bg-zinc-50/80 dark:bg-[#121214]/80">
                    {/* Sticky Metric Column Header */}
                    <th className="sticky left-0 rtl:right-0 z-20 bg-zinc-50 dark:bg-[#121214] p-4 text-start font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-[#71717a] w-48 sm:w-64 min-w-[190px] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      <span>{t('calculator.metric')}</span>
                    </th>

                    {/* Product Column Headers */}
                    {computedList.map(({ product }) => {
                      const isLowestROAS = winners?.lowestBEROASId === product.id;
                      const isHighestProfit = winners?.highestProfitId === product.id;

                      return (
                        <th
                          key={product.id}
                          className="p-4 text-start font-normal align-top min-w-[200px] sm:min-w-[240px] border-r rtl:border-l border-zinc-200 dark:border-[#27272a] last:border-r-0 rtl:last:border-l-0"
                        >
                          <div className="space-y-2">
                            {/* Product Title & Remove Button */}
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug line-clamp-1">
                                  {product.name}
                                </h4>
                                {product.sku && (
                                  <span className="text-[10px] font-mono text-zinc-400 dark:text-[#71717a]">
                                    {product.sku}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => toggleComparedProduct(product.id)}
                                className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                                title={t('comparison.removeFromCompare')}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Winner Pill if applicable */}
                            {isLowestROAS && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                <span>🏆 أسهل للتوسع (Lowest BE)</span>
                              </div>
                            )}
                            {isHighestProfit && !isLowestROAS && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                <span>💰 أعلى ربح للقطعة</span>
                              </div>
                            )}

                            {/* Quick Open in Calculator button */}
                            <div>
                              <button
                                onClick={() => handleOpenInCalculator(product.id)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-zinc-200/70 hover:bg-emerald-500 hover:text-black dark:bg-[#27272a] dark:hover:bg-emerald-500 dark:hover:text-black text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-2xs"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>{t('comparison.openCalculator')}</span>
                                <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-200 dark:divide-[#27272a]/60 text-xs font-mono-nums">
                  {/* ======================================================== */}
                  {/* GROUP 1: PRICING & UNIT COSTS */}
                  {/* ======================================================== */}
                  <tr className="bg-zinc-100/70 dark:bg-[#18181b]/70">
                    <td
                      colSpan={computedList.length + 1}
                      className="p-2.5 px-4 font-bold text-xs font-sans text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
                    >
                      {t('comparison.groupPricing')}
                    </td>
                  </tr>

                  {/* Selling Price */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricSellingPrice')}
                    </td>
                    {computedList.map(({ product }) => (
                      <td key={product.id} className="p-3 px-4 font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(product.sellingPrice, currency)}
                      </td>
                    ))}
                  </tr>

                  {/* COGS */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricCOGS')}
                    </td>
                    {computedList.map(({ product }) => (
                      <td key={product.id} className="p-3 px-4 text-zinc-600 dark:text-[#a1a1aa]">
                        {formatCurrency(product.cogs, currency)}
                      </td>
                    ))}
                  </tr>

                  {/* Unit Gross Margin & % */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricGrossMargin')}
                    </td>
                    {computedList.map(({ product, metrics }) => (
                      <td key={product.id} className="p-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(metrics.grossMargin, currency)}{' '}
                        <span className="text-[11px] opacity-75 font-normal">
                          ({formatPercent(metrics.grossMarginPercent)})
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* ======================================================== */}
                  {/* GROUP 2: FULFILLMENT & RETURN LOSS DRAG */}
                  {/* ======================================================== */}
                  <tr className="bg-zinc-100/70 dark:bg-[#18181b]/70">
                    <td
                      colSpan={computedList.length + 1}
                      className="p-2.5 px-4 font-bold text-xs font-sans text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
                    >
                      {t('comparison.groupFulfillment')}
                    </td>
                  </tr>

                  {/* Delivery Fulfillment Rate */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricFulfillmentRate')}
                    </td>
                    {computedList.map(({ product }) => {
                      const rate = product.fulfillmentRate;
                      const badgeClass =
                        rate >= 75
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                          : rate >= 60
                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-rose-600 dark:text-rose-400 font-bold';

                      return (
                        <td key={product.id} className="p-3 px-4">
                          <span className={badgeClass}>{rate}%</span>
                          <span className="text-[10px] text-zinc-400 ml-1 font-sans">
                            ({100 - rate}% مرتجع)
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Shipping / Delivered Unit */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricEffectiveShipping')}
                    </td>
                    {computedList.map(({ product, metrics }) => (
                      <td key={product.id} className="p-3 px-4 text-zinc-600 dark:text-[#a1a1aa]">
                        {formatCurrency(metrics.effectiveDeliveredShippingCost, currency)}
                      </td>
                    ))}
                  </tr>

                  {/* Failed Parcel Loss */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricReturnShippingLoss')}
                    </td>
                    {computedList.map(({ product, metrics }) => (
                      <td key={product.id} className="p-3 px-4 text-rose-600 dark:text-rose-400 font-medium">
                        {metrics.adjustedFailedShippingLoss > 0
                          ? `-${formatCurrency(metrics.adjustedFailedShippingLoss, currency)}`
                          : '0.00'}
                      </td>
                    ))}
                  </tr>

                  {/* ======================================================== */}
                  {/* GROUP 3: AD TARGETS & BREAK-EVEN */}
                  {/* ======================================================== */}
                  <tr className="bg-zinc-100/70 dark:bg-[#18181b]/70">
                    <td
                      colSpan={computedList.length + 1}
                      className="p-2.5 px-4 font-bold text-xs font-sans text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
                    >
                      {t('comparison.groupAdTargets')}
                    </td>
                  </tr>

                  {/* Real-World Break-Even ROAS (Adjusted) - HIGHLIGHT ROW */}
                  <tr className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3.5 px-4 font-sans font-bold text-zinc-900 dark:text-white border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{t('comparison.metricAdjBEROAS')}</span>
                      </span>
                    </td>
                    {computedList.map(({ product, metrics }) => {
                      const isWinner = winners?.lowestBEROASId === product.id;
                      const roas = metrics.adjustedBreakEvenROAS;

                      return (
                        <td key={product.id} className="p-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-base font-bold font-mono ${
                                isWinner
                                  ? 'text-emerald-600 dark:text-emerald-400 text-lg'
                                  : roas === null || roas <= 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-zinc-900 dark:text-white'
                              }`}
                            >
                              {roas ? `${roas.toFixed(2)}x` : 'خسارة مؤكدة'}
                            </span>
                            {isWinner && (
                              <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-black">
                                الفائز
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Raw Break-Even ROAS (Theoretical 100% Delivery) */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50 text-zinc-500 dark:text-[#a1a1aa]">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricRawBEROAS')}
                    </td>
                    {computedList.map(({ product, metrics }) => (
                      <td key={product.id} className="p-3 px-4 font-mono">
                        {metrics.breakEvenROAS ? `${metrics.breakEvenROAS.toFixed(2)}x` : 'N/A'}
                      </td>
                    ))}
                  </tr>

                  {/* Max Allowable CPA */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricBreakEvenCPA')}
                    </td>
                    {computedList.map(({ product, metrics }) => (
                      <td key={product.id} className="p-3 px-4 font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                        {formatCurrency(metrics.adjustedBreakEvenCPA, currency)}
                      </td>
                    ))}
                  </tr>

                  {/* Current Campaign ROAS */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricCurrentROAS')}
                    </td>
                    {computedList.map(({ product, metrics }) => {
                      const isSafe =
                        metrics.adjustedBreakEvenROAS &&
                        metrics.currentROAS >= metrics.adjustedBreakEvenROAS;

                      return (
                        <td key={product.id} className="p-3 px-4 font-mono">
                          <span
                            className={
                              isSafe
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : 'text-amber-600 dark:text-amber-400 font-semibold'
                            }
                          >
                            {metrics.currentROAS.toFixed(2)}x
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* ======================================================== */}
                  {/* GROUP 4: REALIZED BOTTOM LINE */}
                  {/* ======================================================== */}
                  <tr className="bg-zinc-100/70 dark:bg-[#18181b]/70">
                    <td
                      colSpan={computedList.length + 1}
                      className="p-2.5 px-4 font-bold text-xs font-sans text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
                    >
                      {t('comparison.groupBottomLine')}
                    </td>
                  </tr>

                  {/* Profit per Delivered Order */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricProfitPerDelivered')}
                    </td>
                    {computedList.map(({ product, metrics }) => {
                      const profit = metrics.adjustedProfitPerDeliveredUnit;
                      const isWinner = winners?.highestProfitId === product.id;

                      return (
                        <td key={product.id} className="p-3 px-4 font-bold">
                          <span
                            className={
                              profit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {formatCurrency(profit, currency)}
                          </span>
                          {isWinner && (
                            <span className="text-[10px] font-sans font-bold px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 ml-1.5 rtl:mr-1.5 rtl:ml-0">
                              الأعلى 💰
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Total Realized Net Profit */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricTotalRealizedProfit')}
                    </td>
                    {computedList.map(({ product, metrics }) => {
                      const profit = metrics.adjustedTotalProfit;

                      return (
                        <td key={product.id} className="p-3 px-4 font-bold text-sm">
                          <span
                            className={
                              profit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {formatCurrency(profit, currency)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Realized Net Margin % */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricNetMarginPct')}
                    </td>
                    {computedList.map(({ product, metrics }) => {
                      const margin = metrics.adjustedNetMarginPercent;

                      return (
                        <td key={product.id} className="p-3 px-4 font-bold">
                          <span
                            className={
                              margin >= 15
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : margin > 0
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {formatPercent(margin)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Profitability Status Badge */}
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-[#1e1e22]/50">
                    <td className="sticky left-0 rtl:right-0 bg-white dark:bg-[#18181b] p-3.5 px-4 font-sans font-medium text-zinc-700 dark:text-[#d4d4d8] border-r rtl:border-l border-zinc-200 dark:border-[#27272a]">
                      {t('comparison.metricStatus')}
                    </td>
                    {computedList.map(({ product, metrics }) => (
                      <td key={product.id} className="p-3.5 px-4 font-sans">
                        {metrics.isProfitableAdjusted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>رابح وآمن</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            <span>يحقق خسائر</span>
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Table Advice Bar */}
            <div className="p-3.5 bg-zinc-50 dark:bg-[#121214] border-t border-zinc-200 dark:border-[#27272a] flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-[#71717a] gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                <span>
                  💡 <strong>نصيحة القرار:</strong> ركّز ميزانيتك الإعلانية أولاً على المنتج الحاصل على أقل Break-Even ROAS، فهو الأكثر أماناً ضد تقلبات تكلفة إعلانات فيسبوك وتيك توك.
                </span>
              </div>
              <span className="font-mono text-[11px] shrink-0">
                {computedList.length} منتجات في المقارنة
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
