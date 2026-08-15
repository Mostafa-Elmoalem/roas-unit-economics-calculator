import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';

const LANGUAGE_STORAGE_KEY = 'roas_calc_language';

// Helper to get initial language from storage or navigator
export const getInitialLanguage = (): 'en' | 'ar' => {
  if (typeof window !== 'undefined') {
    try {
      const sessionLang = window.sessionStorage?.getItem(LANGUAGE_STORAGE_KEY);
      if (sessionLang === 'en' || sessionLang === 'ar') return sessionLang;

      const localLang = window.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
      if (localLang === 'en' || localLang === 'ar') return localLang;
    } catch {}
  }
  return 'en';
};

const initialLang = getInitialLanguage();

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

export const setAppLanguage = (lang: 'en' | 'ar') => {
  i18n.changeLanguage(lang);
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, lang);
      window.sessionStorage?.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  }
};

export default i18n;
