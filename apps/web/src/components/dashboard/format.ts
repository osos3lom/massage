import type { Lang } from '@/i18n/config';
import { formatTime } from '@/i18n/config';
import { minutesToHHMM } from '@/data/seedData';

// Gregorian calendar + Latin digits in both languages, matching the public site's prices
export const locale = (lang: Lang) => (lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US');

export const fmtDate = (d: Date, lang: Lang, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale(lang), opts).format(d);

export const fmtMinutes = (m: number, lang: Lang) => formatTime(minutesToHHMM(m), lang);

export const fmtNumber = (n: number, lang: Lang) => new Intl.NumberFormat(locale(lang)).format(n);

export const fmtRange = (start: number, duration: number, lang: Lang) =>
  `${fmtMinutes(start, lang)} – ${fmtMinutes(start + duration, lang)}`;
