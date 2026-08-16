import React from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../theme/tokens';
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
      <div className={`flex items-center gap-1 ${tokens.bg.surface} border ${tokens.border.default} ${tokens.border.hover} rounded-xl px-2.5 py-1.5 transition-colors shadow-2xs`}>
        <DollarSign className={`w-3.5 h-3.5 ${tokens.status.profit.text} shrink-0`} />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          className={`bg-transparent text-xs font-semibold ${tokens.text.primary} outline-none cursor-pointer appearance-none pr-4 rtl:pl-4 rtl:pr-0`}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code} className={`${tokens.bg.surface} ${tokens.text.primary}`}>
              {c.label}
            </option>
          ))}
        </select>
        <ChevronDown className={`w-3 h-3 ${tokens.text.muted} absolute right-2 rtl:left-2 rtl:right-auto pointer-events-none`} />
      </div>
    </div>
  );
};
