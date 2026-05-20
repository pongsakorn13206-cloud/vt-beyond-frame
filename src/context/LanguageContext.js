'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations from '@/lib/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('th');

  useEffect(() => {
    const saved = localStorage.getItem('app-language');
    if (saved && (saved === 'th' || saved === 'en')) {
      setLang(saved);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'th' ? 'en' : 'th';
      localStorage.setItem('app-language', next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((newLang) => {
    if (newLang === 'th' || newLang === 'en') {
      setLang(newLang);
      localStorage.setItem('app-language', newLang);
    }
  }, []);

  const t = useCallback(
    (key) => {
      const keys = key.split('.');
      let value = translations[lang];
      for (const k of keys) {
        value = value?.[k];
      }
      return value ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
