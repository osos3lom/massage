'use client';

import { useLanguage } from '@/i18n/LanguageProvider';
import { posDictionaries } from '@/i18n/posDictionary';
import { currencyLabel } from '@/i18n/config';
import { fmtMoney } from '@/data/seedData';

export function usePos() {
  const lang = useLanguage();
  const sar = currencyLabel(lang.lang);
  return {
    ...lang,
    p: posDictionaries[lang.lang],
    money: (halalas: number) => `${fmtMoney(halalas)} ${sar}`,
  };
}
