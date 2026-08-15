import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import type { FixedCostItem } from '../../types';
import { Landmark, Plus, Trash2 } from 'lucide-react';

export const FixedCostsCard: React.FC = () => {
  const { activeProduct, activeProductMetrics, updateProduct, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const handleUpdateCost = (costId: string, updates: Partial<FixedCostItem>) => {
    const updatedCosts = activeProduct.fixedCosts.map((fc) =>
      fc.id === costId ? { ...fc, ...updates } : fc
    );
    updateProduct(activeProduct.id, { fixedCosts: updatedCosts });
  };

  const handleAddCost = () => {
    const newCost: FixedCostItem = {
      id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: 'Custom Overhead Expense',
      amount: 500,
    };
    updateProduct(activeProduct.id, {
      fixedCosts: [...activeProduct.fixedCosts, newCost],
    });
  };

  const handleDeleteCost = (costId: string) => {
    const remaining = activeProduct.fixedCosts.filter((fc) => fc.id !== costId);
    updateProduct(activeProduct.id, { fixedCosts: remaining });
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Landmark className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-[#f4f4f5] tracking-tight">
            2. Fixed Overheads & Campaign Costs
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a1a1aa] font-mono-nums">
            {formatCurrency(activeProductMetrics.fixedCostPerUnit, currency)}/unit
          </span>
        </div>
      </div>

      {/* Dynamic line items */}
      <div className="space-y-2.5">
        {activeProduct.fixedCosts.map((cost) => (
          <div
            key={cost.id}
            className="flex items-center gap-2 bg-[#09090b] border border-[#27272a] hover:border-[#3f3f46] rounded-xl p-2 transition-colors"
          >
            <input
              type="text"
              value={cost.name}
              onChange={(e) => handleUpdateCost(cost.id, { name: e.target.value })}
              className="flex-1 bg-transparent text-xs font-medium text-[#f4f4f5] outline-none px-2"
              placeholder="Expense name"
            />

            <div className="relative w-28 shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71717a] font-semibold">
                {currency === 'EGP' ? 'EGP' : '$'}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                value={cost.amount || ''}
                onChange={(e) =>
                  handleUpdateCost(cost.id, {
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-7 pr-2.5 py-1 text-xs font-semibold font-mono-nums text-[#f4f4f5] text-right outline-none focus:border-indigo-500/50"
                placeholder="0"
              />
            </div>

            <button
              onClick={() => handleDeleteCost(cost.id)}
              className="p-1 rounded-lg text-[#71717a] hover:text-rose-400 hover:bg-[#27272a] transition"
              title="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Line Item & Total bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleAddCost}
          className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2.5 py-1.5 rounded-lg hover:bg-indigo-500/10 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add line item</span>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#a1a1aa]">Total Overheads:</span>
          <span className="font-bold font-mono-nums text-[#f4f4f5]">
            {formatCurrency(activeProductMetrics.totalFixedCosts, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
