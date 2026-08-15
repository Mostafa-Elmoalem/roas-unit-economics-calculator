import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { calculateProductMetrics, formatCurrency, formatROAS } from '../../lib/calculations';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calculator,
  Copy,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ProductsTableProps {
  onOpenAddModal: () => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({ onOpenAddModal }) => {
  const { t } = useTranslation();
  const {
    products,
    currency,
    searchQuery,
    setSearchQuery,
    setActiveProductId,
    setView,
    duplicateProduct,
    deleteProduct,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'profitable' | 'underperforming'>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'roas' | 'price' | 'units' | 'name'>('profit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Delete modal state
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  const processedProducts = useMemo(() => {
    return products
      .map((product) => {
        const metrics = calculateProductMetrics(product);
        return { product, metrics };
      })
      .filter(({ product, metrics }) => {
        // Search query filter
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

        // Status filter
        if (!matchesSearch) return false;
        if (statusFilter === 'profitable') return metrics.isProfitableAdjusted;
        if (statusFilter === 'underperforming') return !metrics.isProfitableAdjusted;
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'profit') {
          diff = a.metrics.adjustedTotalProfit - b.metrics.adjustedTotalProfit;
        } else if (sortBy === 'roas') {
          diff = a.metrics.currentROAS - b.metrics.currentROAS;
        } else if (sortBy === 'price') {
          diff = a.product.sellingPrice - b.product.sellingPrice;
        } else if (sortBy === 'units') {
          diff = a.product.units - b.product.units;
        } else if (sortBy === 'name') {
          diff = a.product.name.localeCompare(b.product.name);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [products, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleSelectProduct = (productId: string) => {
    setActiveProductId(productId);
    setView('calculator');
  };

  const handleSort = (field: 'profit' | 'roas' | 'price' | 'units' | 'name') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl overflow-hidden shadow-xs transition-colors duration-200">
        {/* Table Top Controls: Search & Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-[#27272a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-zinc-400 dark:text-[#71717a] absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('common.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl pl-9 rtl:pr-9 rtl:pl-4 pr-4 py-2 text-xs text-zinc-900 dark:text-[#f4f4f5] placeholder-zinc-400 dark:placeholder-[#71717a] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            {/* Status filter pills */}
            <div className="flex items-center bg-zinc-100 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-1 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                    : 'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5]'
                }`}
              >
                {t('common.all')} ({products.length})
              </button>
              <button
                onClick={() => setStatusFilter('profitable')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'profitable'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                    : 'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5]'
                }`}
              >
                {t('common.profitable')}
              </button>
              <button
                onClick={() => setStatusFilter('underperforming')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'underperforming'
                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold shadow-xs'
                    : 'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5]'
                }`}
              >
                {t('common.belowBE')}
              </button>
            </div>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">{t('common.addProduct')}</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-zinc-50 dark:bg-[#0f0f11] text-zinc-500 dark:text-[#a1a1aa] uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-[#27272a]">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-[#f4f4f5] transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('dashboard.tableProductName')}</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3.5 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-[#f4f4f5] transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('dashboard.tablePrice')}</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <span>{t('dashboard.tableBEROAS')}</span>
                </th>
                <th
                  onClick={() => handleSort('roas')}
                  className="py-3.5 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-[#f4f4f5] transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t('dashboard.tableCurrentROAS')}</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                  </div>
                </th>
                <th className="py-3.5 px-4">
                  <span>{t('dashboard.tableProfitUnit')}</span>
                </th>
                <th
                  onClick={() => handleSort('profit')}
                  className="py-3.5 px-4 cursor-pointer hover:text-zinc-900 dark:hover:text-[#f4f4f5] transition select-none text-right rtl:text-left"
                >
                  <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                    <span>{t('dashboard.tableTotalProfit')}</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-400 dark:text-[#71717a]" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">{t('dashboard.tableFulfillment')}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">{t('common.actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-200 dark:divide-[#27272a]/60">
              {processedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 dark:text-[#71717a]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-6 h-6 text-zinc-300 dark:text-[#3f3f46]" />
                      <p className="text-sm text-zinc-600 dark:text-[#a1a1aa]">{t('dashboard.noProductsMatch')}</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('all');
                        }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1"
                      >
                        {t('dashboard.clearFilters')}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                processedProducts.map(({ product, metrics }) => {
                  const isProfitable = metrics.isProfitableAdjusted;
                  const isAboveBE =
                    metrics.breakEvenROAS !== null && metrics.currentROAS >= metrics.breakEvenROAS;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="group hover:bg-zinc-50 dark:hover:bg-[#202024] cursor-pointer transition-colors"
                    >
                      {/* 1. Name & SKU */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isProfitable ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400 animate-pulse'
                            }`}
                          />
                          <div className="truncate">
                            <p className="font-semibold text-zinc-900 dark:text-[#f4f4f5] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-[#71717a] mt-0.5">
                              {product.sku && <span>{product.sku}</span>}
                              <span>•</span>
                              <span>{product.units.toLocaleString()} {t('common.units')}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Selling Price */}
                      <td className="py-3.5 px-4 font-mono-nums text-zinc-900 dark:text-[#f4f4f5]">
                        <div>{formatCurrency(product.sellingPrice, currency)}</div>
                        <div className="text-[10px] text-zinc-400 dark:text-[#71717a]">
                          COGS: {formatCurrency(product.cogs, currency)}
                        </div>
                      </td>

                      {/* 3. Break-Even ROAS */}
                      <td className="py-3.5 px-4 font-mono-nums">
                        <div className="font-medium text-zinc-600 dark:text-[#a1a1aa]">
                          {formatROAS(metrics.breakEvenROAS)}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-[#71717a]">
                          {t('dashboard.adj')}: {formatROAS(metrics.adjustedBreakEvenROAS)}
                        </div>
                      </td>

                      {/* 4. Current ROAS */}
                      <td className="py-3.5 px-4 font-mono-nums">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs ${
                              isAboveBE
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isAboveBE ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {formatROAS(metrics.currentROAS)}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-[#71717a] mt-0.5">
                          {t('dashboard.cpa')}: {formatCurrency(product.adSpendPerUnit, currency)}
                        </div>
                      </td>

                      {/* 5. Profit / Unit */}
                      <td className="py-3.5 px-4 font-mono-nums">
                        <div
                          className={`font-semibold ${
                            metrics.adjustedProfitPerOrderedUnit >= 0
                              ? 'text-zinc-900 dark:text-[#f4f4f5]'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(metrics.adjustedProfitPerOrderedUnit, currency)}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-[#71717a]">
                          {t('dashboard.raw')}: {formatCurrency(metrics.rawNetProfitPerUnit, currency)}
                        </div>
                      </td>

                      {/* 6. Total Profit */}
                      <td className="py-3.5 px-4 font-mono-nums text-right rtl:text-left">
                        <div
                          className={`text-sm font-bold ${
                            metrics.adjustedTotalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatCurrency(metrics.adjustedTotalProfit, currency)}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-[#71717a]">
                          {t('dashboard.margin')}: {metrics.adjustedNetMarginPercent.toFixed(1)}%
                        </div>
                      </td>

                      {/* 7. Fulfillment Rate */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-[#27272a] text-zinc-800 dark:text-[#f4f4f5]">
                          {product.fulfillmentRate}%
                        </span>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-3.5 px-4 text-right rtl:text-left" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end rtl:justify-start gap-1">
                          <button
                            onClick={() => handleSelectProduct(product.id)}
                            className="p-1.5 rounded-lg text-zinc-400 dark:text-[#a1a1aa] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-[#27272a] transition"
                            title={t('common.calculator')}
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => duplicateProduct(product.id)}
                            className="p-1.5 rounded-lg text-zinc-400 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-100 dark:hover:bg-[#27272a] transition"
                            title={t('common.duplicate')}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete({ id: product.id, name: product.name });
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 dark:text-[#a1a1aa] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-[#27272a] transition"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={productToDelete !== null}
        itemName={productToDelete?.name}
        onClose={() => setProductToDelete(null)}
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
      />
    </>
  );
};
