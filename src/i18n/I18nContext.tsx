import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { format } from './format';
import { translations } from './translations';
import type { IStrings, Language } from './types';

const LANGUAGE_KEY = 'hexaAppLanguage';

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  strings: IStrings;
  format: typeof format;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (stored === 'ko' || stored === 'en') {
          setLanguageState(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    void AsyncStorage.setItem(LANGUAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      strings: translations[language],
      format,
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
