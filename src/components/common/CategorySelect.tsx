import React from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, type Category } from '@shared';
import { tokens } from '../../theme/tokens';

interface CategorySelectProps {
  value: Category;
  onChange: (category: Category) => void;
  className?: string;
}

/** Fixed-category picker (AD-4/CAP-6) — labels localized, values are enum keys. */
export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, className }) => {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Category)}
      className={`${tokens.bg.input} border ${tokens.border.default} ${tokens.border.focus} rounded-xl px-3 py-2.5 sm:py-2 text-sm sm:text-xs font-medium ${tokens.text.primary} transition cursor-pointer ${className ?? ''}`}
    >
      {CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {t(`categories.${category}`)}
        </option>
      ))}
    </select>
  );
};
