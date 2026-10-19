'use client';

import { Languages } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t.langSwitch.aria}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-aura-text hover:text-aura-accent rounded-full hover:bg-aura-primary/30 transition-colors cursor-pointer ${className}`}
    >
      <Languages className="w-4 h-4" />
      <span>{t.langSwitch.label}</span>
    </button>
  );
}
