import React from 'react';
import { useApp } from '../../context/AppContext';
import type { Currency } from '../../types';
import { DollarSign, ChevronDown } from 'lucide-react';

const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EGP', symbol: 'EGP', label: 'EGP (ج.م)' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR (ر.س)' },
  { code: 'AED', symbol: 'AED', label: 'AED (د.إ)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD ($)' },
];

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useApp();

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] rounded-lg px-2.5 py-1.5 transition-colors shadow-xs">
        <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="bg-transparent text-xs font-semibold text-zinc-900 dark:text-[#f4f4f5] outline-none cursor-pointer appearance-none pr-4 rtl:pl-4 rtl:pr-0"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-[#f4f4f5]">
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-[#71717a] absolute right-2 rtl:left-2 rtl:right-auto pointer-events-none" />
      </div>
    </div>
  );
};
