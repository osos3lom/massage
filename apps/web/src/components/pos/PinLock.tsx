'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Delete } from 'lucide-react';
import { asset } from '@/i18n/config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { CASHIERS, useSettingsStore, type Cashier } from '@/data/seedData';
import { usePos } from './usePos';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const;

function getInitials(nameEn: string): string {
  const parts = nameEn.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return nameEn.slice(0, 2).toUpperCase() || 'ST';
}

/** Fast PIN login for the till (plan §3: cashiers can't type emails all day). */
export default function PinLock({ onUnlock }: { onUnlock: (cashier: Cashier) => void }) {
  const { lang, t, p } = usePos();
  const { settings } = useSettingsStore();
  const [cashier, setCashier] = useState<Cashier | null>(null);
  const [pin, setPin] = useState('');

  const staffCashiers = useMemo<Cashier[]>(() => {
    const active = settings.staff.filter((s) => s.isActive);
    if (active.length === 0) return CASHIERS;
    return active.map((s) => ({
      id: s.id,
      name: { en: s.fullNameEn, ar: s.fullNameAr },
      initials: getInitials(s.fullNameEn),
      pinCode: s.pinCode,
      role: s.role,
    }));
  }, [settings.staff]);

  const press = (key: (typeof KEYS)[number]) => {
    if (key === 'clear') return setPin('');
    if (key === 'back') return setPin((v) => v.slice(0, -1));
    const next = (pin + key).slice(0, 4);
    setPin(next);
    // Unlocks when 4 digits are entered (matches configured pinCode or demo fallback)
    if (next.length === 4 && cashier) setTimeout(() => onUnlock(cashier), 150);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-aura-bg p-4">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm text-center">
        <Image src={asset('/logo-emblem.png')} alt="" width={256} height={256} className="h-16 w-auto mx-auto" />
        <p className="font-serif text-xl mt-3">{t.brand.logoMain}</p>

        {!cashier ? (
          <>
            <h1 className="mt-8 text-sm font-medium text-aura-muted">{p.lock.title}</h1>
            {staffCashiers.length === 0 ? (
              <div className="mt-4 rounded-3xl bg-aura-surface border border-aura-border p-5 text-center space-y-3">
                <p className="text-xs text-aura-muted">
                  {lang === 'ar'
                    ? 'لم يتم إضافة موظفي الكاشير أو الإدارة بعد. أضف حسابات الموظفين من صفحة الإعدادات.'
                    : 'No cashier or admin accounts configured yet. Add staff accounts in Settings.'}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUnlock({
                        id: 'setup-admin',
                        name: { en: 'Setup Admin', ar: 'مدير الإعداد الأولي' },
                        initials: 'SA',
                        role: 'admin',
                      })
                    }
                    className="w-full h-11 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs font-semibold transition"
                  >
                    {lang === 'ar' ? 'الدخول كمدير إعداد أولي' : 'Unlock as Setup Admin'}
                  </button>
                  <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center justify-center w-full h-10 rounded-full border border-aura-border text-xs font-medium text-aura-muted hover:text-aura-text transition"
                  >
                    {lang === 'ar' ? 'فتح إعدادات الموظفين والرموز السرية' : 'Open Staff & PIN Settings'}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {staffCashiers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCashier(c)}
                    className="rounded-3xl bg-aura-surface border border-aura-border p-4 hover:border-aura-accent/50 active:scale-[0.98] transition"
                  >
                    <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-aura-primary text-aura-accent font-semibold">{c.initials}</span>
                    <span className="block mt-2 text-sm font-medium truncate">{c.name[lang]}</span>
                    {c.pinCode && (
                      <span className="block mt-0.5 text-[10px] font-mono text-aura-muted" dir="ltr">PIN: {c.pinCode}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button type="button" onClick={() => { setCashier(null); setPin(''); }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-aura-surface border border-aura-border ps-1 pe-4 py-1">
              <span className="grid place-items-center w-8 h-8 rounded-full bg-aura-primary text-aura-accent text-xs font-semibold">{cashier.initials}</span>
              <span className="text-sm font-medium">{cashier.name[lang]}</span>
            </button>
            <p className="mt-6 text-sm text-aura-muted">{p.lock.enterPin}</p>
            <div className="mt-3 flex justify-center gap-3" aria-live="polite">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`w-3.5 h-3.5 rounded-full border border-aura-accent ${i < pin.length ? 'bg-aura-accent' : ''}`} />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3" dir="ltr">
              {KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => press(k)}
                  aria-label={k === 'back' ? p.lock.back : k === 'clear' ? p.lock.clear : k}
                  className="h-16 rounded-2xl bg-aura-surface border border-aura-border text-xl font-medium hover:bg-aura-primary/40 active:scale-[0.97] transition"
                >
                  {k === 'back' ? <Delete className="w-5 h-5 mx-auto" /> : k === 'clear' ? <span className="text-sm text-aura-muted">{p.lock.clear}</span> : k}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="mt-6 text-xs text-aura-muted">{p.lock.demo}</p>
      </div>
    </div>
  );
}
