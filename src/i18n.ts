import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';

const savedLang =
  (typeof window !== 'undefined' &&
    (localStorage.getItem('agriguard_language') || localStorage.getItem('i18nextLng'))) ||
  'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ta: { translation: ta },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agriguard_language', lng);
    localStorage.setItem('i18nextLng', lng);
  }
});

import { useTranslation as useBaseTranslation } from 'react-i18next';

export function useAppTranslation() {
  const { t: baseT, i18n: i18nInst } = useBaseTranslation();
  const t = new Proxy(baseT, {
    get(target: any, prop: string) {
      if (prop === 'bind' || prop === 'apply' || prop === 'call') {
        return target[prop].bind(target);
      }
      return target(prop);
    },
    apply(target, thisArg, args: [string, ...any[]]) {
      return Reflect.apply(target, thisArg, args);
    },
  }) as ((key: string, defaultVal?: string) => string) & Record<string, string>;

  return { t, i18n: i18nInst };
}

export default i18n;

