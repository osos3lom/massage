'use client';

import Link from '@/components/Link';
import { ArrowLeft, Construction, Database } from 'lucide-react';
import { NAV_ITEMS, type NavKey } from './nav';
import { useDashboard } from './useDashboard';

export default function PlannedPage({ navKey }: { navKey: NavKey }) {
  const { d } = useDashboard();
  const item = NAV_ITEMS.find((i) => i.key === navKey)!;
  const Icon = item.icon;

  return (
    <div className="max-w-2xl mx-auto mt-6 sm:mt-12 rounded-3xl bg-aura-surface border border-aura-border p-8 sm:p-10 text-center">
      <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-aura-primary text-aura-accent">
        <Icon className="w-6 h-6" />
      </span>
      <h1 className="font-serif text-3xl mt-5">{d.nav.items[navKey]}</h1>
      <p className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-aura-bg border border-aura-border px-3 py-1 text-xs text-aura-muted">
        <Construction className="w-3.5 h-3.5" />
        {d.placeholder.title} · {d.placeholder.phase} {item.phase}
      </p>
      <p className="text-sm text-aura-muted mt-6">{d.placeholder.body}</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2" dir="ltr">
        {item.tables.map((table) => (
          <li key={table} className="inline-flex items-center gap-1.5 rounded-full bg-aura-bg px-3 py-1 text-xs font-mono text-aura-text/80">
            <Database className="w-3 h-3 text-aura-accent" />
            {table}
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 mt-8 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
        {d.placeholder.back}
      </Link>
    </div>
  );
}
