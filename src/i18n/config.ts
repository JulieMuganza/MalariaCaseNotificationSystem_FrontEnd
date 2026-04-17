import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enPages from '../locales/en/pages.json';
import rwCommon from '../locales/rw/common.json';
import rwAuth from '../locales/rw/auth.json';
import rwPages from '../locales/rw/pages.json';

const enTranslation = {
  ...enCommon,
  ...enAuth,
  ...enPages,
} as Record<string, string>;
const rwTranslation = {
  ...rwCommon,
  ...rwAuth,
  ...rwPages,
} as Record<string, string>;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      rw: { translation: rwTranslation },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'rw'],
    nonExplicitSupportedLngs: true,
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng.startsWith('rw') ? 'rw' : 'en';
});
document.documentElement.lang = i18n.language?.startsWith('rw') ? 'rw' : 'en';

export default i18n;
