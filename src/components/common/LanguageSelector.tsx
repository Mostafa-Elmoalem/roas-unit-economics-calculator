import React from 'react';
import { useTranslation } from 'react-i18next';
import { setAppLanguage } from '../../i18n/config';
import { Languages } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language === 'ar' ? 'ar' : 'en') as 'en' | 'ar';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ar' : 'en';
    setAppLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] text-zinc-900 dark:text-[#f4f4f5] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs"
      title={currentLang === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
    >
      <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span className="font-mono-nums">{currentLang === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
};
