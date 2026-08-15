import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateProductMetrics, formatCurrency, formatROAS } from '../../lib/calculations';
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
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-sm">
      {/* Table Top Controls: Search & Filter Tabs */}
      <div className="p-4 sm:p-5 border-b border-[#27272a] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#09090b] border border-[#27272a] rounded-xl pl-9 pr-4 py-2 text-xs text-[#f4f4f5] placeholder-[#71717a] focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Status filter pills */}
          <div className="flex items-center bg-[#09090b] border border-[#27272a] rounded-xl p-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-[#27272a] text-[#f4f4f5]'
                  : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('profitable')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'profitable'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
              }`}
            >
              Profitable
            </button>
            <button
              onClick={() => setStatusFilter('underperforming')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                statusFilter === 'underperforming'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
              }`}
            >
              Below BE
            </button>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0f0f11] text-[#a1a1aa] uppercase tracking-wider font-semibold border-b border-[#27272a]">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#f4f4f5] transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product Name</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('price')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#f4f4f5] transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Selling Price</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th className="py-3.5 px-4">
                <span>Break-Even ROAS</span>
              </th>
              <th
                onClick={() => handleSort('roas')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#f4f4f5] transition select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Current ROAS</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th className="py-3.5 px-4">
                <span>Profit / Unit</span>
              </th>
              <th
                onClick={() => handleSort('profit')}
                className="py-3.5 px-4 cursor-pointer hover:text-[#f4f4f5] transition select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Profit (Adj)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#71717a]" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Fulfillment</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#27272a]/60">
            {processedProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-[#71717a]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-6 h-6 text-[#3f3f46]" />
                    <p className="text-sm text-[#a1a1aa]">No products match the filter or search criteria.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                      className="text-xs text-emerald-400 hover:underline mt-1"
                    >
                      Clear filters
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
                    className="group hover:bg-[#202024] cursor-pointer transition-colors"
                  >
                    {/* 1. Name & SKU */}
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isProfitable ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                          }`}
                        />
                        <div className="truncate">
                          <p className="font-semibold text-[#f4f4f5] group-hover:text-emerald-400 transition-colors truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#71717a] mt-0.5">
                            {product.sku && <span>{product.sku}</span>}
                            <span>•</span>
                            <span>{product.units.toLocaleString()} units</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Selling Price */}
                    <td className="py-3.5 px-4 font-mono-nums text-[#f4f4f5]">
                      <div>{formatCurrency(product.sellingPrice, currency)}</div>
                      <div className="text-[10px] text-[#71717a]">
                        COGS: {formatCurrency(product.cogs, currency)}
                      </div>
                    </td>

                    {/* 3. Break-Even ROAS */}
                    <td className="py-3.5 px-4 font-mono-nums">
                      <div className="font-medium text-[#a1a1aa]">
                        {formatROAS(metrics.breakEvenROAS)}
                      </div>
                      <div className="text-[10px] text-[#71717a]">
                        Adj: {formatROAS(metrics.adjustedBreakEvenROAS)}
                      </div>
                    </td>

                    {/* 4. Current ROAS */}
                    <td className="py-3.5 px-4 font-mono-nums">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs ${
                            isAboveBE
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
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
                      <div className="text-[10px] text-[#71717a] mt-0.5">
                        CPA: {formatCurrency(product.adSpendPerUnit, currency)}
                      </div>
                    </td>

                    {/* 5. Profit / Unit */}
                    <td className="py-3.5 px-4 font-mono-nums">
                      <div
                        className={`font-semibold ${
                          metrics.adjustedProfitPerOrderedUnit >= 0
                            ? 'text-[#f4f4f5]'
                            : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(metrics.adjustedProfitPerOrderedUnit, currency)}
                      </div>
                      <div className="text-[10px] text-[#71717a]">
                        Raw: {formatCurrency(metrics.rawNetProfitPerUnit, currency)}
                      </div>
                    </td>

                    {/* 6. Total Profit */}
                    <td className="py-3.5 px-4 font-mono-nums text-right">
                      <div
                        className={`text-sm font-bold ${
                          metrics.adjustedTotalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(metrics.adjustedTotalProfit, currency)}
                      </div>
                      <div className="text-[10px] text-[#71717a]">
                        Margin: {metrics.adjustedNetMarginPercent.toFixed(1)}%
                      </div>
                    </td>

                    {/* 7. Fulfillment Rate */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#27272a] text-[#f4f4f5]">
                        {product.fulfillmentRate}%
                      </span>
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleSelectProduct(product.id)}
                          className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-emerald-400 hover:bg-[#27272a] transition"
                          title="Open Calculator"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateProduct(product.id)}
                          className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition"
                          title="Duplicate Product"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${product.name}"?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-rose-400 hover:bg-[#27272a] transition"
                          title="Delete Product"
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
  );
};
