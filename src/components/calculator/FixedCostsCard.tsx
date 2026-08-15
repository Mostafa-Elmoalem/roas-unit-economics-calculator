import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import type { FixedCostItem } from '../../types';
import { Building2, Plus, Trash2 } from 'lucide-react';

export const FixedCostsCard: React.FC = () => {
  const { t } = useTranslation();
  const { activeProduct, activeProductMetrics, updateProduct, currency } = useApp();

  if (!activeProduct || !activeProductMetrics) return null;

  const handleAddCost = () => {
    const newItem: FixedCostItem = {
      id: `fc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: 'Custom Overhead',
      amount: 500,
    };
    updateProduct(activeProduct.id, {
      fixedCosts: [...activeProduct.fixedCosts, newItem],
    });
  };

  const handleUpdateCost = (costId: string, updates: Partial<FixedCostItem>) => {
    const nextCosts = activeProduct.fixedCosts.map((item) =>
      item.id === costId ? { ...item, ...updates } : item
    );
    updateProduct(activeProduct.id, { fixedCosts: nextCosts });
  };

  const handleDeleteCost = (costId: string) => {
    const nextCosts = activeProduct.fixedCosts.filter((item) => item.id !== costId);
    updateProduct(activeProduct.id, { fixedCosts: nextCosts });
  };

  return (
    <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#27272a] pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#f4f4f5] tracking-tight">
            {t('calculator.fixedCostsTitle')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] text-[11px] text-zinc-600 dark:text-[#a1a1aa] font-mono-nums">
          <span>{formatCurrency(activeProductMetrics.fixedCostPerUnit, currency)}</span>
          <span className="text-zinc-400 dark:text-[#71717a]">{t('calculator.fixedCostPerUnit')}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {activeProduct.fixedCosts.map((cost) => (
          <div
            key={cost.id}
            className="flex items-center gap-2 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl p-2 sm:p-2.5 transition focus-within:border-emerald-500/50"
          >
            <input
              type="text"
              value={cost.name}
              onChange={(e) => handleUpdateCost(cost.id, { name: e.target.value })}
              className="flex-1 bg-transparent text-xs font-medium text-zinc-900 dark:text-[#f4f4f5] outline-none px-2"
              placeholder="Overhead name"
            />
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-zinc-400 dark:text-[#71717a]">
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
                className="w-24 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs font-bold font-mono-nums text-right rtl:text-left text-zinc-900 dark:text-[#f4f4f5] outline-none shadow-xs"
                placeholder="0"
              />
            </div>
            <button
              onClick={() => handleDeleteCost(cost.id)}
              className="p-1 rounded-lg text-zinc-400 dark:text-[#71717a] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-[#18181b] transition"
              title={t('common.delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-[#27272a]/60">
        <button
          onClick={handleAddCost}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('calculator.addLineItem')}</span>
        </button>

        <div className="text-xs font-mono-nums">
          <span className="text-zinc-500 dark:text-[#71717a]">{t('calculator.totalOverheads')} </span>
          <span className="font-bold text-zinc-900 dark:text-[#f4f4f5]">
            {formatCurrency(activeProductMetrics.totalFixedCosts, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
