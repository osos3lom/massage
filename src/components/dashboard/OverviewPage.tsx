'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight, Banknote, CalendarDays, CircleAlert, Cloud, Clock, PackageOpen, Percent,
  Plus, ReceiptText, Table2, TrendingUp, UserX, type LucideIcon,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import {
  THERAPISTS, DAY_END, DAY_START, PACKAGES_EXPIRING_THIS_WEEK, addDays, bookableInfo, dayStats,
  displayStatus, therapistMinutes, type MixCategory,
} from '@/data/dashboardData';
import { mergeBookings, useBookingsStore } from '@/data/bookingsStore';
import { useDashboard, useNow } from './useDashboard';
import { fmtDate, fmtNumber, fmtRange } from './format';
import { STATUS_STYLE } from './status';

function Card({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl bg-aura-surface border border-aura-border p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-serif text-lg text-aura-text">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl bg-aura-surface border border-aura-border p-5">
      <div className="flex items-center gap-2 text-sm text-aura-muted">
        <span className="grid place-items-center w-8 h-8 rounded-full bg-aura-primary text-aura-accent">
          <Icon className="w-4 h-4" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-aura-text tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-aura-muted">{hint}</p>
    </div>
  );
}

// Horizontal single-series bar with a direct label — used for mix & utilisation
function BarRow({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <li className="grid grid-cols-[minmax(0,8.5rem)_1fr_auto] items-center gap-3 text-sm">
      <span className="truncate text-aura-text/85">{label}</span>
      <span className="h-2.5 rounded-full bg-aura-bg overflow-hidden">
        <span className="block h-full rounded-full bg-aura-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums text-aura-muted text-xs min-w-12 text-end">{display}</span>
    </li>
  );
}

export default function OverviewPage() {
  const { lang, d, data } = useDashboard();
  const now = useNow();
  const { added, patches } = useBookingsStore();
  const [tableView, setTableView] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const sar = currencyLabel(lang);

  const model = useMemo(() => {
    if (!now) return null;
    const store = { added, patches };
    const today = mergeBookings(now, now, lang, store);
    const stats = dayStats(data, today);
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(now, i - 6);
      return { day, revenue: dayStats(data, mergeBookings(day, now, lang, store)).revenue };
    });
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const upNext = today
      .filter((b) => b.status === 'checked_in' || ((b.status === 'booked' || b.status === 'confirmed') && b.start + b.duration > nowMin))
      .slice(0, 6);
    const mixKeys: MixCategory[] = ['massage', 'moroccan-bath', 'pedicure', 'package'];
    const mix = mixKeys.map((k) => {
      const items = today.filter((b) => b.status !== 'cancelled' && bookableInfo(data, b.itemId).category === k);
      return { key: k, count: items.length };
    });
    const utilisation = THERAPISTS.map((t) => ({
      t,
      pct: Math.round((therapistMinutes(today, t.id) / (DAY_END - DAY_START)) * 100),
    })).sort((a, b) => b.pct - a.pct);
    return { today, stats, week, upNext, mix, utilisation };
  }, [now, lang, data, added, patches]);

  const mixLabel: Record<MixCategory, string> = {
    massage: data.SERVICES_CATEGORIES.find((c) => c.id === 'massage')?.name ?? 'Massage',
    'moroccan-bath': data.SERVICES_CATEGORIES.find((c) => c.id === 'moroccan-bath')?.name ?? 'Moroccan Bath',
    pedicure: data.SERVICES_CATEGORIES.find((c) => c.id === 'pedicure')?.name ?? 'Pedicure',
    package: d.bookings.form.packages,
  };

  if (!now || !model) {
    return <div className="h-[60vh] rounded-3xl bg-aura-surface/60 border border-aura-border animate-pulse" />;
  }

  const { stats, week, upNext, mix, utilisation } = model;
  const maxRevenue = Math.max(...week.map((w) => w.revenue), 1);
  const weekTotal = week.reduce((s, w) => s + w.revenue, 0);
  const attention = [
    { icon: CalendarDays, count: stats.unassigned, label: d.overview.attentionUnassigned, tone: 'text-aura-accent bg-aura-primary' },
    { icon: Banknote, count: stats.unpaid, label: d.overview.attentionUnpaid, tone: 'text-aura-warning bg-aura-warning-bg' },
    { icon: UserX, count: stats.noShows, label: d.overview.attentionNoShow, tone: 'text-aura-danger bg-aura-danger-bg' },
    { icon: PackageOpen, count: PACKAGES_EXPIRING_THIS_WEEK, label: d.overview.attentionPackages, tone: 'text-aura-muted bg-aura-bg' },
  ].filter((a) => a.count > 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-aura-muted">
            {fmtDate(now, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="font-serif text-3xl text-aura-text mt-1">{d.overview.greeting}</h1>
          <p className="text-sm text-aura-muted mt-1">{d.overview.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-aura-border bg-aura-surface text-sm font-medium hover:border-aura-accent/40 transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-aura-accent" />
            {d.overview.openCalendar}
          </Link>
          <Link
            href="/dashboard/bookings?new=1"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium shadow-premium-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            {d.overview.newBooking}
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi icon={Banknote} label={d.overview.kpi.revenue} value={`${fmtNumber(stats.revenue, lang)} ${sar}`} hint={d.overview.kpi.revenueHint} />
        <Kpi icon={CalendarDays} label={d.overview.kpi.bookings} value={fmtNumber(stats.count, lang)} hint={`${stats.inTreatment} ${d.overview.kpi.bookingsHint}`} />
        <Kpi icon={Percent} label={d.overview.kpi.occupancy} value={`${stats.occupancy}%`} hint={d.overview.kpi.occupancyHint} />
        <Kpi icon={ReceiptText} label={d.overview.kpi.avgTicket} value={`${fmtNumber(stats.avgTicket, lang)} ${sar}`} hint={d.overview.kpi.avgTicketHint} />
        <Kpi icon={UserX} label={d.overview.kpi.noShows} value={fmtNumber(stats.noShows, lang)} hint={d.overview.kpi.noShowsHint} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <Card
          className="lg:col-span-2"
          title={d.overview.revenueChart}
          action={
            <button
              type="button"
              onClick={() => setTableView((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-aura-muted hover:text-aura-accent"
            >
              {tableView ? <TrendingUp className="w-4 h-4" /> : <Table2 className="w-4 h-4" />}
              {tableView ? d.overview.chartView : d.overview.tableView}
            </button>
          }
        >
          <p className="text-sm text-aura-muted -mt-2 mb-4">
            {d.overview.revenueTotal}:{' '}
            <span className="font-semibold text-aura-text tabular-nums">{fmtNumber(weekTotal, lang)} {sar}</span>
          </p>
          {tableView ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-aura-muted text-xs">
                  <th className="text-start font-medium pb-2">{d.overview.day}</th>
                  <th className="text-end font-medium pb-2">{d.overview.kpi.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {week.map((w) => (
                  <tr key={w.day.toISOString()} className="border-t border-aura-border">
                    <td className="py-2">{fmtDate(w.day, lang, { weekday: 'long', day: 'numeric', month: 'short' })}</td>
                    <td className="py-2 text-end tabular-nums">{fmtNumber(w.revenue, lang)} {sar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>
              <div className="relative h-48">
                {/* recessive gridlines */}
                {[0.25, 0.5, 0.75, 1].map((f) => (
                  <div key={f} className="absolute inset-x-0 border-t border-aura-border/70" style={{ bottom: `${f * 100}%` }} />
                ))}
                <div className="absolute inset-0 flex items-end gap-2 sm:gap-4 border-b border-aura-border">
                  {week.map((w, i) => {
                    const pct = (w.revenue / maxRevenue) * 100;
                    return (
                      <div
                        key={w.day.toISOString()}
                        className="relative flex-1 h-full flex items-end justify-center"
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {hovered === i && (
                          <div
                            className="absolute z-10 mb-2 rounded-xl bg-aura-text text-white text-xs px-3 py-2 whitespace-nowrap shadow-premium pointer-events-none"
                            style={{ bottom: `${pct}%` }}
                          >
                            <p className="opacity-75">{fmtDate(w.day, lang, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                            <p className="font-semibold tabular-nums">{fmtNumber(w.revenue, lang)} {sar}</p>
                          </div>
                        )}
                        <div
                          className={`w-full max-w-12 rounded-t-[4px] transition-colors ${hovered === i ? 'bg-aura-accent-hover' : 'bg-aura-accent'}`}
                          style={{ height: `${pct}%`, minHeight: 2 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 sm:gap-4 pt-2">
                {week.map((w, i) => (
                  <span
                    key={w.day.toISOString()}
                    className={`flex-1 text-center text-xs ${i === week.length - 1 ? 'text-aura-text font-semibold' : 'text-aura-muted'}`}
                  >
                    {fmtDate(w.day, lang, { weekday: 'short' })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Needs attention */}
        <Card title={d.overview.attention}>
          {attention.length === 0 ? (
            <p className="text-sm text-aura-muted">{d.overview.attentionClear}</p>
          ) : (
            <ul className="space-y-3">
              {attention.map((a) => (
                <li key={a.label}>
                  <Link href="/dashboard/bookings" className="flex items-center gap-3 rounded-2xl p-2 -m-2 hover:bg-aura-bg transition-colors">
                    <span className={`grid place-items-center w-9 h-9 rounded-full shrink-0 ${a.tone}`}>
                      <a.icon className="w-4 h-4" />
                    </span>
                    <span className="text-sm">
                      <span className="font-semibold tabular-nums">{a.count}</span>{' '}
                      <span className="text-aura-muted">{a.label}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 pt-4 border-t border-aura-border flex items-start gap-3">
            <span className="grid place-items-center w-9 h-9 rounded-full shrink-0 bg-aura-success-bg text-aura-success">
              <Cloud className="w-4 h-4" />
            </span>
            <div className="text-sm">
              <p className="font-medium">{d.overview.sync}</p>
              <p className="text-aura-muted text-xs mt-0.5">{d.overview.syncBody}</p>
            </div>
          </div>
        </Card>

        {/* Up next */}
        <Card
          className="lg:col-span-2"
          title={d.overview.upNext}
          action={
            <Link href="/dashboard/bookings" className="inline-flex items-center gap-1 text-xs text-aura-muted hover:text-aura-accent">
              {d.overview.openCalendar}
              <ArrowUpRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
            </Link>
          }
        >
          {upNext.length === 0 ? (
            <p className="text-sm text-aura-muted">{d.overview.upNextEmpty}</p>
          ) : (
            <ul className="divide-y divide-aura-border">
              {upNext.map((b) => {
                const info = bookableInfo(data, b.itemId);
                const therapist = THERAPISTS.find((t) => t.id === b.therapistId);
                const status = displayStatus(b)!;
                const style = STATUS_STYLE[status];
                const StatusIcon = style.icon;
                return (
                  <li key={b.id} className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 py-3">
                    <span className="flex items-center gap-1.5 w-40 shrink-0 text-xs text-aura-muted tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {fmtRange(b.start, b.duration, lang)}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{b.client}</span>
                      <span className="block text-xs text-aura-muted truncate">
                        {info.name} · {therapist ? therapist.name[lang] : d.status.unassigned}
                      </span>
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${style.chip}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {d.status[status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Mix + utilisation */}
        <div className="space-y-6">
          <Card title={d.overview.serviceMix}>
            <ul className="space-y-3">
              {mix.map((m) => (
                <BarRow
                  key={m.key}
                  label={mixLabel[m.key]}
                  value={m.count}
                  max={Math.max(...mix.map((x) => x.count), 1)}
                  display={`${m.count} ${d.overview.sessions}`}
                />
              ))}
            </ul>
          </Card>
          <Card title={d.overview.utilisation}>
            <ul className="space-y-3">
              {utilisation.map(({ t, pct }) => (
                <BarRow key={t.id} label={t.name[lang]} value={pct} max={100} display={`${pct}%`} />
              ))}
            </ul>
            {stats.unassigned > 0 && (
              <p className="mt-4 flex items-center gap-1.5 text-xs text-aura-muted">
                <CircleAlert className="w-3.5 h-3.5 text-aura-accent" />
                {stats.unassigned} {d.overview.attentionUnassigned}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
