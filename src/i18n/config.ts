export const LANGS = ['ar', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = 'ar';
export const LANG_STORAGE_KEY = 'lang';

// Prefix for files in /public when the site is served from a sub-path (e.g. GitHub Pages project sites)
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const asset = (path: string) => `${BASE_PATH}${path}`;

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANGS as readonly string[]).includes(value);

export const getDir = (lang: Lang) => (lang === 'ar' ? 'rtl' : 'ltr');

// Formats a 24h "HH:MM" value as a 12h label in the given language
export const formatTime = (value: string, lang: Lang) => {
  const [h, m] = value.split(':').map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = lang === 'ar' ? (h < 12 ? 'ص' : 'م') : h < 12 ? 'AM' : 'PM';
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
};

// All prices are in Saudi riyals
export const currencyLabel = (lang: Lang) => (lang === 'ar' ? 'ر.س' : 'SAR');
export const formatPrice = (amount: number, lang: Lang) => `${amount} ${currencyLabel(lang)}`;
