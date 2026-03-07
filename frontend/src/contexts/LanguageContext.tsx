import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, messages, Messages } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Messages;
  languages: { label: string; value: Language }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'aidp-language';

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // 从 localStorage 读取语言设置，默认为中文
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (stored as Language) || 'zh-CN';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = messages[language];

  const languages = [
    { label: '简体中文', value: 'zh-CN' as Language },
    { label: 'English', value: 'en-US' as Language },
  ];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
