import React from 'react';
import type { Currency } from '../../types';
import { useApp } from '../../context/AppContext';
import { DollarSign } from 'lucide-react';

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'USD', label: 'USD ($)', symbol: '$' },
  { code: 'EGP', label: 'EGP (ج.م)', symbol: 'EGP' },
  { code: 'SAR', label: 'SAR (ر.س)', symbol: 'SAR' },
  { code: 'AED', label: 'AED (د.إ)', symbol: 'AED' },
  { code: 'EUR', label: 'EUR (€)', symbol: '€' },
  { code: 'GBP', label: 'GBP (£)', symbol: '£' },
  { code: 'CAD', label: 'CAD (CA$)', symbol: 'CA$' },
  { code: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
];

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useApp();

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] rounded-lg px-2.5 py-1.5 text-xs text-[#a1a1aa] transition-colors">
        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className="bg-transparent text-[#f4f4f5] font-medium outline-none cursor-pointer pr-1 appearance-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-[#18181b] text-[#f4f4f5]">
              {c.label}
            </option>
          ))}
        </select>
        <span className="text-[10px] text-[#71717a] pointer-events-none">▼</span>
      </div>
    </div>
  );
};
