import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../lib/calculations';
import type { FixedCostItem } from '../../types';
import { Button } from '../ui/button';
import { tokens } from '../../theme/tokens';
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
    <div className={`${tokens.card.base} p-5 sm:p-6 space-y-5`}>
      <div className={`flex items-center justify-between border-b ${tokens.border.default} pb-3`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${tokens.status.accent.bg} ${tokens.status.accent.text} ${tokens.status.accent.border} border`}>
            <Building2 className="w-4 h-4" />
          </div>
          <h3 className={`text-sm font-semibold ${tokens.text.primary} tracking-tight`}>
            {t('calculator.fixedCostsTitle')}
          </h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${tokens.bg.toggleTrack} border ${tokens.border.default} text-[11px] ${tokens.text.secondary} font-mono-nums`}>
          <span>{formatCurrency(activeProductMetrics.fixedCostPerUnit, currency)}</span>
          <span className={tokens.text.muted}>{t('calculator.fixedCostPerUnit')}</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {activeProduct.fixedCosts.map((cost) => (
          <div
            key={cost.id}
            className={`flex items-center gap-2 ${tokens.bg.input} border ${tokens.border.default} rounded-xl p-2 sm:p-2.5 transition focus-within:border-emerald-500/50`}
          >
            <input
              type="text"
              value={cost.name}
              onChange={(e) => handleUpdateCost(cost.id, { name: e.target.value })}
              className={`flex-1 bg-transparent text-xs font-medium ${tokens.text.primary} outline-none px-2`}
              placeholder="Overhead name"
            />
            <div className="flex items-center gap-1">
              <span className={`text-xs font-semibold ${tokens.text.muted}`}>
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
                className={`w-24 ${tokens.bg.inputInner} border ${tokens.border.default} focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs font-bold font-mono-nums text-right rtl:text-left ${tokens.text.primary} outline-none shadow-xs`}
                placeholder="0"
              />
            </div>
            <button
              onClick={() => handleDeleteCost(cost.id)}
              className={`p-1 rounded-lg ${tokens.buttons.ghost} hover:text-rose-600 dark:hover:text-rose-400`}
              title={t('common.delete')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className={`flex items-center justify-between pt-2 border-t ${tokens.border.subtle}`}>
        <Button
          variant="link"
          size="xs"
          onClick={handleAddCost}
          className="flex items-center gap-1 text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('calculator.addLineItem')}</span>
        </Button>

        <div className="text-xs font-mono-nums">
          <span className={tokens.text.secondary}>{t('calculator.totalOverheads')} </span>
          <span className={`font-bold ${tokens.text.primary}`}>
            {formatCurrency(activeProductMetrics.totalFixedCosts, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
