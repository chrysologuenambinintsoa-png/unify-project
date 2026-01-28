'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translation, getTranslation } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  translation: Translation;
  setLanguage: (lang: Language) => void;
}

const defaultContext: LanguageContextType = {
  language: 'fr',
  translation: getTranslation('fr'),
  setLanguage: () => {
    console.warn('Language context not available');
  },
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [translation, setTranslation] = useState<Translation>(getTranslation('fr'));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load language from localStorage
    const savedLang = localStorage.getItem('unify-language') as Language;
    if (savedLang && savedLang !== language) {
      setLanguageState(savedLang);
      setTranslation(getTranslation(savedLang));
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setTranslation(getTranslation(lang));
    if (isClient) {
      localStorage.setItem('unify-language', lang);
    }
  };

  const contextValue = {
    language,
    translation,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}