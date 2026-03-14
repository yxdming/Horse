import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: en.common,
    sidebar: en.sidebar,
    database: en.database,
    settings: en.settings,
    knowledge: en.knowledge,
    taskQueue: en.taskQueue,
  },
  zh: {
    common: zh.common,
    sidebar: zh.sidebar,
    database: zh.database,
    settings: zh.settings,
    knowledge: zh.knowledge,
    taskQueue: zh.taskQueue,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: 'en',
    lng: localStorage.getItem('i18nextLng') || 'en',  // Default to 'en' if not set
    defaultNS,
    resources,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
    }
  });

export default i18n;
