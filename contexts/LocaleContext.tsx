
import React, { createContext, useState, useContext, useEffect, useMemo, ReactNode, useCallback } from 'react';

type Locale = 'en' | 'de';
type Translations = { [key: string]: any };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Helper function to get nested keys
const getNestedTranslation = (obj: any, key: string): string | undefined => {
    return key.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
};

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const storedLocale = localStorage.getItem('omninote_locale') as Locale;
      if (storedLocale && ['en', 'de'].includes(storedLocale)) {
        return storedLocale;
      }
      // Detect browser language and default to 'en'
      const browserLang = navigator.language.split('-')[0];
      return browserLang === 'de' ? 'de' : 'en';
    } catch (e) {
      return 'en'; // Fallback to English
    }
  });

  const [translations, setTranslations] = useState<Translations>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchTranslations = async () => {
      setIsLoaded(false);
      try {
        const res = await fetch(`./locales/${locale}.json`);
        if (!res.ok) throw new Error('Translation file not found');
        const data = await res.json();
        setTranslations(data);
      } catch (error) {
        console.error(`Could not load locale: ${locale}`, error);
        // Fallback to english
        try {
            const res = await fetch('./locales/en.json');
            const data = await res.json();
            setTranslations(data);
        } catch (e) {
            console.error('Could not load fallback english locale', e);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    fetchTranslations();
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    try {
        localStorage.setItem('omninote_locale', newLocale);
    } catch (e) {
        console.error("Failed to save locale preference.");
    }
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string, params?: { [key: string]: string | number }): string => {
    let translation = getNestedTranslation(translations, key);

    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    if (params) {
        Object.keys(params).forEach(paramKey => {
            translation = translation!.replace(`{{${paramKey}}}`, String(params[paramKey]));
        });
    }

    return translation;
  }, [translations]);


  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  // Prevent rendering children until translations are loaded to avoid Flash of Untranslated Content
  if (!isLoaded) {
    return null;
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
