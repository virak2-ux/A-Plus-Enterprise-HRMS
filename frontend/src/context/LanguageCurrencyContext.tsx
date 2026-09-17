'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import km from '@/locales/km.json';

type Language = 'km' | 'en';
type Currency = 'KHR' | 'USD';

interface LanguageCurrencyContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  exchangeRate: number;
  t: (keyPath: string) => string;
  formatMoney: (amountKhr: number, overrideCurrency?: Currency) => string;
}

const translations: Record<Language, any> = { en, km };

const LanguageCurrencyContext = createContext<LanguageCurrencyContextType | undefined>(undefined);

export const LanguageCurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const exchangeRate = 4100; // NBC Official / Company standard exchange rate

  useEffect(() => {
    const savedLang = localStorage.getItem('hrms_lang') as Language;
    if (savedLang === 'km' || savedLang === 'en') setLanguageState(savedLang);

    const savedCurr = localStorage.getItem('hrms_curr') as Currency;
    if (savedCurr === 'KHR' || savedCurr === 'USD') setCurrencyState(savedCurr);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hrms_lang', lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('hrms_curr', curr);
  };

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current = translations[language];
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if missing in Khmer
        let fallback = translations['en'];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return keyPath;
          }
        }
        return typeof fallback === 'string' ? fallback : keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  };

  const formatMoney = (amountKhr: number, overrideCurrency?: Currency): string => {
    const activeCurr = overrideCurrency || currency;
    if (activeCurr === 'KHR') {
      return `៛${Math.round(amountKhr).toLocaleString()}`;
    } else {
      const usdAmount = amountKhr / exchangeRate;
      return `$${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <LanguageCurrencyContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        exchangeRate,
        t,
        formatMoney,
      }}
    >
      {children}
    </LanguageCurrencyContext.Provider>
  );
};

export const useLanguageCurrency = () => {
  const context = useContext(LanguageCurrencyContext);
  if (!context) {
    throw new Error('useLanguageCurrency must be used within a LanguageCurrencyProvider');
  }
  return context;
};
