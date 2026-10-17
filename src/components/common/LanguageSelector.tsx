import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import type { Language } from '@shared';
import { tokens } from '../../theme/tokens';
import { Languages } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const { setLanguage } = useApp();
  const currentLang = (i18n.language === 'ar' ? 'ar' : 'en') as Language;

  const toggleLanguage = () => {
    const nextLang: Language = currentLang === 'en' ? 'ar' : 'en';
    setLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 ${tokens.bg.surface} hover:${tokens.bg.hover} border ${tokens.border.default} ${tokens.border.hover} ${tokens.text.primary} px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer`}
      title={currentLang === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
    >
      <Languages className={`w-3.5 h-3.5 ${tokens.status.profit.text}`} />
      <span className="font-mono-nums">{currentLang === 'en' ? 'العربية' : 'EN'}</span>
    </button>
  );
};
