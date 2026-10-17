import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';
import type { Language } from '@shared';
import { repository } from '../repository';

// Language lives in the single repository-owned state blob (AD-5, CAP-8).
const initialLang: Language = repository.load().ui.language;

// Apply document direction immediately
if (typeof document !== 'undefined') {
  document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = initialLang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation },
    },
    lng: initialLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

export const setAppLanguage = (lang: Language) => {
  i18n.changeLanguage(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
  repository.setLanguage(lang);
};

export default i18n;
