'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { dashboardDictionaries } from '@/i18n/dashboardDictionary';

export function useDashboard() {
  const lang = useLanguage();
  return { ...lang, d: dashboardDictionaries[lang.lang] };
}

/**
 * The current time, ticking every minute. Null until mounted so the static export
 * never bakes a build-time clock into the HTML.
 */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock only exists in the browser
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** navigator.onLine, kept live — local-first terminals must show when they are offline. */
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}
