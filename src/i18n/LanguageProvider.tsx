'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANG, LANG_STORAGE_KEY, getDir, isLang, type Lang } from './config';
import { dictionaries, type Dictionary } from './dictionaries';
import { getSalonData, type SalonData } from '@/data/salonData';

interface LanguageContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  t: Dictionary;
  data: SalonData;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const applyToDocument = (lang: Lang) => {
  document.documentElement.lang = lang;
  document.documentElement.dir = getDir(lang);
  document.title = dictionaries[lang].meta.title;
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // The static export is pre-rendered in the default language; a saved choice is applied after load
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(LANG_STORAGE_KEY);
    } catch {}
    if (isLang(saved) && saved !== DEFAULT_LANG) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from browser storage after hydration
      setLangState(saved);
      applyToDocument(saved);
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {}
    applyToDocument(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: getDir(lang),
      t: dictionaries[lang],
      data: getSalonData(lang),
      setLang,
      toggleLang: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
