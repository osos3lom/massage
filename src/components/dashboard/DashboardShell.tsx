'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Cloud, CloudOff, ExternalLink, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { asset } from '@/i18n/config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { NAV } from './nav';
import { useDashboard, useOnline } from './useDashboard';

// next/navigation reports "/dashboard/bookings/" because the export uses trailing slashes
const normalize = (path: string) => (path.length > 1 ? path.replace(/\/$/, '') : path);

function Sidebar({ role, onNavigate }: { role: 'admin' | 'cashier'; onNavigate?: () => void }) {
  const { t, d } = useDashboard();
  const pathname = normalize(usePathname());
  const online = useOnline();

  return (
    <div className="flex h-full flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-aura-border">
        <Image src={asset('/logo-emblem.png')} alt="" width={256} height={256} className="h-9 w-auto" />
        <span className="flex flex-col leading-tight min-w-0">
          <span className="font-serif text-base text-aura-text truncate">{t.brand.logoMain}</span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-aura-muted">{d.shell.title}</span>
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map(({ group, items }) => {
          const visibleItems = items.filter((item) => item.roles.includes(role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-aura-muted/80">
                {d.nav.groups[group]}
              </p>
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                          active
                            ? 'bg-aura-primary text-aura-accent-hover font-semibold'
                            : 'text-aura-text/80 hover:bg-aura-primary/50 hover:text-aura-text'
                        }`}
                      >
                        <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-aura-accent' : 'text-aura-muted group-hover:text-aura-accent'}`} />
                        <span className="flex-1 truncate">{d.nav.items[item.key]}</span>
                        {!item.ready && (
                          <span
                            title={`${d.nav.phase} ${item.phase}`}
                            className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-aura-bg text-aura-muted border border-aura-border"
                          >
                            P{item.phase}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Local-first: staff should always see whether this terminal is synced */}
      <div className="m-3 rounded-2xl border border-aura-border bg-aura-bg p-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          {online ? (
            <Cloud className="w-4 h-4 text-aura-success" />
          ) : (
            <CloudOff className="w-4 h-4 text-aura-warning" />
          )}
          <span className={online ? 'text-aura-success' : 'text-aura-warning'}>
            {online ? d.shell.online : d.shell.offline}
          </span>
        </div>
        <a
          href={asset('/')}
          className="mt-2 inline-flex items-center gap-1.5 text-xs text-aura-muted hover:text-aura-accent transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {d.shell.viewSite}
        </a>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { lang, d } = useDashboard();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'cashier'>('admin');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-aura-bg">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 start-0 w-64 bg-aura-surface border-e border-aura-border z-30">
        <Sidebar role={role} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label={d.shell.closeMenu}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-aura-text/30 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85vw] bg-aura-surface shadow-premium">
            <button
              type="button"
              aria-label={d.shell.closeMenu}
              onClick={() => setOpen(false)}
              className="absolute top-4 end-3 p-2 rounded-full text-aura-muted hover:bg-aura-primary/50"
            >
              <X className="w-4 h-4" />
            </button>
            <Sidebar role={role} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 h-16 flex items-center gap-3 px-4 sm:px-6 bg-aura-bg/85 backdrop-blur border-b border-aura-border">
          <button
            type="button"
            aria-label={d.shell.toggleMenu}
            onClick={() => setOpen(true)}
            className="lg:hidden p-2 -ms-2 rounded-full text-aura-text hover:bg-aura-primary/50"
          >
            <Menu className="w-5 h-5" />
          </button>

          <label className="relative flex-1 max-w-md">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-aura-muted pointer-events-none" />
            <input
              type="search"
              placeholder={d.shell.search}
              className="w-full h-10 rounded-full bg-aura-surface border border-aura-border ps-9 pe-4 text-sm placeholder:text-aura-muted/70 focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
            />
          </label>

          <div className="ms-auto flex items-center gap-1 sm:gap-2">
            <span className="hidden md:inline text-xs text-aura-muted">{d.shell.branch}</span>
            <button
              type="button"
              onClick={() => setRole((r) => (r === 'admin' ? 'cashier' : 'admin'))}
              title={lang === 'ar' ? 'تبديل صلاحية العرض (مدير / كاشير)' : 'Toggle RBAC role preview (Admin / Cashier)'}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium transition-colors ${
                role === 'admin'
                  ? 'border-aura-accent/40 bg-aura-primary text-aura-accent'
                  : 'border-aura-border bg-aura-surface text-aura-muted'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{role === 'admin' ? (lang === 'ar' ? 'مدير' : 'Admin') : (lang === 'ar' ? 'كاشير' : 'Cashier')}</span>
            </button>
            <LanguageSwitcher />
            <button
              type="button"
              aria-label={d.shell.notifications}
              className="relative p-2 rounded-full text-aura-text hover:bg-aura-primary/50"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-aura-accent ring-2 ring-aura-bg" />
            </button>
            <div
              title={d.shell.roleOwner}
              className="w-9 h-9 rounded-full bg-aura-accent text-white grid place-items-center text-xs font-semibold"
            >
              {role === 'admin' ? 'OA' : 'HS'}
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
