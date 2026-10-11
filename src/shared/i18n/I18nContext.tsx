import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Language, TranslationSchema } from './types';
import { getTranslations, t as translateFn, formatDate as formatDateFn, formatNumber as formatNumberFn } from './index';
import { getStoredSettings, saveStoredSettings } from '../../core/storage';

interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  strings: TranslationSchema;
  formatDate: (date: string | Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'en');

  // Load language from stored settings on mount if not provided
  useEffect(() => {
    let isMounted = true;
    getStoredSettings().then((settings) => {
      if (isMounted && settings.language) {
        setLanguageState(settings.language);
      }
    });

    // Listen for storage changes across popup / options pages
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'sync' && changes.language && changes.language.newValue) {
        setLanguageState(changes.language.newValue as Language);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      isMounted = false;
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    await saveStoredSettings({ language: newLang });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang;
    }
  };

  const strings = useMemo(() => getTranslations(language), [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (path: string, params?: Record<string, string | number>) => translateFn(language, path, params),
    strings,
    formatDate: (date, options) => formatDateFn(date, language, options),
    formatNumber: (num, options) => formatNumberFn(num, language, options),
  }), [language, strings]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
