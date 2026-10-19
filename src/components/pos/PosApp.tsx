'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CalendarDays, Cloud, CloudOff, Droplets, Footprints, Hand, Lock, LogOut, PackageOpen, Plus, Trash2, UserPlus, X,
  LayoutDashboard, type LucideIcon,
} from 'lucide-react';
import { asset } from '@/i18n/config';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import {
  BOOKABLE_IDS, THERAPISTS, bookableInfo, minutesOfDay, type Booking, type BookableId, type MixCategory,
} from '@/data/dashboardData';
import { mergeBookings, useBookingsStore } from '@/data/bookingsStore';
import {
  DISCOUNTS, TERMINAL_ID, discountAmount, receiptNo, toHalalas, vatOf,
  type Cashier, type CompletedSale, type Payment, type TicketLine,
} from '@/data/posData';
import { useNow, useOnline } from '@/components/dashboard/useDashboard';
import { fmtMinutes } from '@/components/dashboard/format';
import PinLock from './PinLock';
import { PayDialog, ReceiptDialog } from './PayDialog';
import ShiftDialog from './ShiftDialog';
import AppointmentsDialog from './AppointmentsDialog';
import { usePos } from './usePos';

const CATEGORY_ICON: Record<MixCategory, LucideIcon> = {
  massage: Hand,
  'moroccan-bath': Droplets,
  pedicure: Footprints,
  package: PackageOpen,
};

type QueueKind = 'awaiting' | 'inTreatment' | 'arriving';

interface Ticket {
  client: string;
  lines: TicketLine[];
  discountId: string;
}

const EMPTY_TICKET: Ticket = { client: '', lines: [], discountId: '' };
let lineSeq = 0;

export default function PosApp() {
  const { lang, t, p, data, money } = usePos();
  const now = useNow();
  const online = useOnline();
  const { added, patches, patchBooking } = useBookingsStore();
  const [cashier, setCashier] = useState<Cashier | null>(null);
  const [shiftOpenedAt, setShiftOpenedAt] = useState<Date | null>(null);
  const [category, setCategory] = useState<MixCategory | 'all'>('all');
  const [ticket, setTicket] = useState<Ticket>(EMPTY_TICKET);
  const [sales, setSales] = useState<CompletedSale[]>([]);
  // Receipt numbers never reset with the shift — BRANCH-TERMINAL-SEQ must stay unique
  const [receiptSeq, setReceiptSeq] = useState(1);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<CompletedSale | null>(null);
  const [closingShift, setClosingShift] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);

  const ticketBookingIds = useMemo(
    () => new Set(ticket.lines.flatMap((l) => (l.bookingId ? [l.bookingId] : []))),
    [ticket.lines]
  );

  // Clients the cashier will settle: finished-but-unpaid first, then in treatment, then arriving soon.
  // Reads the shared store, so a till-paid or checked-in appointment leaves the queue at once.
  const queue = useMemo(() => {
    if (!now) return [];
    const nowMin = minutesOfDay(now);
    const rank: Record<QueueKind, number> = { awaiting: 0, inTreatment: 1, arriving: 2 };
    return mergeBookings(now, now, lang, { added, patches })
      .filter((b) => !ticketBookingIds.has(b.id))
      .map((b): { b: Booking; kind: QueueKind } | null => {
        if (b.status === 'completed' && !b.paid) return { b, kind: 'awaiting' };
        if (b.status === 'checked_in') return { b, kind: 'inTreatment' };
        if ((b.status === 'booked' || b.status === 'confirmed') && b.start - nowMin <= 60 && b.start >= nowMin - 15)
          return { b, kind: 'arriving' };
        return null;
      })
      .filter((x): x is { b: Booking; kind: QueueKind } => x !== null)
      .sort((a, c) => rank[a.kind] - rank[c.kind] || a.b.start + a.b.duration - (c.b.start + c.b.duration));
  }, [now, lang, added, patches, ticketBookingIds]);

  if (!cashier) {
    return (
      <PinLock
        onUnlock={(c) => {
          setCashier(c);
          setShiftOpenedAt((s) => s ?? new Date());
        }}
      />
    );
  }

  const subtotal = ticket.lines.reduce((s, l) => s + l.price, 0);
  const discount = discountAmount(DISCOUNTS.find((x) => x.id === ticket.discountId), subtotal);
  const total = subtotal - discount;
  const vat = vatOf(total);
  const missingTherapist = ticket.lines.some((l) => !l.therapistId);

  const addItem = (itemId: BookableId, extra: Partial<TicketLine> = {}) =>
    setTicket((tk) => ({
      ...tk,
      lines: [...tk.lines, { uid: `ln-${++lineSeq}`, itemId, therapistId: null, price: toHalalas(bookableInfo(data, itemId).price), ...extra }],
    }));

  const loadBooking = (b: Booking) => {
    setTicket((tk) => ({ ...tk, client: tk.client || b.client }));
    addItem(b.itemId, { therapistId: b.therapistId, bookingId: b.id });
  };

  const completeSale = (payments: Payment[], change: number) => {
    const sale: CompletedSale = {
      receiptNo: receiptNo(receiptSeq),
      at: new Date(),
      cashierId: cashier.id,
      client: ticket.client,
      lines: ticket.lines,
      subtotal,
      discount,
      total,
      vat,
      payments,
      change,
    };
    setSales((s) => [...s, sale]);
    setReceiptSeq((n) => n + 1);
    // Settle the underlying appointments in the shared store → they drop off the queue and
    // show as paid on the calendar.
    ticket.lines.forEach((l) => l.bookingId && patchBooking(l.bookingId, { status: 'completed', paid: true }));
    setTicket(EMPTY_TICKET);
    setPaying(false);
    setReceipt(sale);
  };

  const categories: { key: MixCategory | 'all'; label: string }[] = [
    { key: 'all', label: p.catalog.all },
    ...data.SERVICES_CATEGORIES.map((c) => ({ key: c.id as MixCategory, label: c.name })),
    { key: 'package', label: p.catalog.packages },
  ];
  const items = BOOKABLE_IDS.filter((id) => category === 'all' || bookableInfo(data, id).category === category);
  const queueLabel: Record<QueueKind, { text: string; cls: string }> = {
    awaiting: { text: p.queue.awaiting, cls: 'bg-aura-warning-bg text-aura-warning' },
    inTreatment: { text: p.queue.inTreatment, cls: 'bg-aura-accent text-white' },
    arriving: { text: p.queue.arriving, cls: 'bg-aura-primary text-aura-text' },
  };

  return (
    <div className="h-screen flex flex-col bg-aura-bg">
      {/* Header */}
      <header className="h-16 shrink-0 flex items-center gap-3 px-4 bg-aura-surface border-b border-aura-border">
        <Image src={asset('/logo-emblem.png')} alt="" width={256} height={256} className="h-9 w-auto" />
        <div className="leading-tight me-auto min-w-0">
          <p className="font-serif text-base truncate">{t.brand.logoMain}</p>
          <p className="text-[11px] text-aura-muted">
            {p.header.title} · {p.header.terminal} {TERMINAL_ID}
            {shiftOpenedAt && (
              <span className="hidden sm:inline"> · {p.header.shiftSince} {fmtMinutes(minutesOfDay(shiftOpenedAt), lang)}</span>
            )}
          </p>
        </div>
        <span className={`hidden md:inline-flex items-center gap-1.5 text-xs ${online ? 'text-aura-success' : 'text-aura-warning'}`}>
          {online ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
          {online ? p.header.online : p.header.offline}
        </span>
        <LanguageSwitcher />
        <span className="hidden sm:inline-flex items-center gap-2 rounded-full bg-aura-bg border border-aura-border ps-1 pe-3 py-1">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-aura-primary text-aura-accent text-[11px] font-semibold">{cashier.initials}</span>
          <span className="text-sm">{cashier.name[lang]}</span>
        </span>
        <button type="button" onClick={() => setCashier(null)} title={p.header.lock} className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full border border-aura-border text-sm hover:bg-aura-bg">
          <Lock className="w-4 h-4" />
          <span className="hidden lg:inline">{p.header.lock}</span>
        </button>
        <button type="button" onClick={() => setClosingShift(true)} title={p.header.closeShift} className="inline-flex items-center gap-1.5 h-10 px-3 rounded-full border border-aura-border text-sm hover:bg-aura-bg">
          <LogOut className="w-4 h-4 rtl:-scale-x-100" />
          <span className="hidden lg:inline">{p.header.closeShift}</span>
        </button>
        <Link href="/dashboard" title={p.header.backOffice} className="hidden md:grid place-items-center w-10 h-10 rounded-full text-aura-muted hover:bg-aura-bg">
          <LayoutDashboard className="w-4 h-4" />
        </Link>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[17rem_minmax(0,1fr)_25rem] overflow-y-auto lg:overflow-hidden">
        {/* Queue */}
        <aside className="lg:overflow-y-auto border-b lg:border-b-0 lg:border-e border-aura-border bg-aura-surface/60 p-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTicket((tk) => ({ ...tk, client: tk.client || p.ticket.walkIn }))}
              className="inline-flex items-center justify-center gap-2 h-12 rounded-2xl border-2 border-dashed border-aura-accent/40 text-aura-accent text-sm font-semibold hover:bg-aura-primary/40"
            >
              <UserPlus className="w-4 h-4" />
              {p.queue.walkIn}
            </button>
            <button
              type="button"
              onClick={() => setShowAppointments(true)}
              className="inline-flex items-center justify-center gap-2 h-12 rounded-2xl border border-aura-border text-sm font-semibold hover:bg-aura-bg"
            >
              <CalendarDays className="w-4 h-4 text-aura-accent" />
              {p.queue.appointments}
            </button>
          </div>
          <h2 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-aura-muted">
            {p.queue.title} <span className="tabular-nums">({queue.length})</span>
          </h2>
          {queue.length === 0 ? (
            <p className="text-sm text-aura-muted">{p.queue.empty}</p>
          ) : (
            <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-1">
              {queue.map(({ b, kind }) => {
                const info = bookableInfo(data, b.itemId);
                const therapist = THERAPISTS.find((x) => x.id === b.therapistId);
                return (
                  <li key={b.id} className="shrink-0 w-60 lg:w-auto">
                    <button
                      type="button"
                      onClick={() => loadBooking(b)}
                      className="w-full text-start rounded-2xl bg-aura-surface border border-aura-border p-3 hover:border-aura-accent/50 active:scale-[0.99] transition"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{b.client}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${queueLabel[kind].cls}`}>{queueLabel[kind].text}</span>
                      </span>
                      <span className="block mt-1 text-xs text-aura-muted truncate">
                        {info.name} · {therapist?.name[lang] ?? '—'}
                      </span>
                      <span className="flex justify-between mt-1 text-xs">
                        <span className="text-aura-muted tabular-nums">
                          {kind === 'arriving' ? fmtMinutes(b.start, lang) : `${p.queue.ends} ${fmtMinutes(b.start + b.duration, lang)}`}
                        </span>
                        <span className="font-semibold tabular-nums">{money(toHalalas(info.price))}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Catalog */}
        <section className="lg:overflow-y-auto p-4 sm:p-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
                aria-pressed={category === c.key}
                className={`shrink-0 h-11 px-5 rounded-full text-sm transition-colors ${
                  category === c.key ? 'bg-aura-text text-white font-medium' : 'bg-aura-surface border border-aura-border hover:border-aura-accent/40'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((id) => {
              const info = bookableInfo(data, id);
              const Icon = CATEGORY_ICON[info.category];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => addItem(id)}
                  className="group relative flex flex-col items-start text-start min-h-32 rounded-3xl bg-aura-surface border border-aura-border p-4 hover:border-aura-accent/50 hover:shadow-premium-hover active:scale-[0.98] transition"
                >
                  <span className="grid place-items-center w-10 h-10 rounded-full bg-aura-primary text-aura-accent">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="mt-3 text-sm font-semibold leading-snug">{info.name}</span>
                  <span className="mt-auto pt-2 flex w-full items-end justify-between gap-2">
                    <span className="text-xs text-aura-muted">{info.duration} {p.catalog.min}</span>
                    <span className="text-base font-semibold tabular-nums">{money(toHalalas(info.price))}</span>
                  </span>
                  <Plus className="absolute top-4 end-4 w-5 h-5 text-aura-muted group-hover:text-aura-accent" />
                </button>
              );
            })}
          </div>
        </section>

        {/* Ticket */}
        <aside className="flex flex-col min-h-[28rem] lg:min-h-0 bg-aura-surface border-t lg:border-t-0 lg:border-s border-aura-border">
          <div className="p-4 border-b border-aura-border">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{p.ticket.title}</h2>
              {ticket.lines.length > 0 && (
                <button type="button" onClick={() => setTicket(EMPTY_TICKET)} className="inline-flex items-center gap-1 text-xs text-aura-muted hover:text-aura-danger">
                  <X className="w-3.5 h-3.5" /> {p.ticket.clear}
                </button>
              )}
            </div>
            <input
              aria-label={p.ticket.client}
              value={ticket.client}
              onChange={(e) => setTicket((tk) => ({ ...tk, client: e.target.value }))}
              placeholder={p.ticket.clientPlaceholder}
              className="mt-3 w-full h-11 rounded-2xl border border-aura-border bg-aura-bg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {ticket.lines.length === 0 ? (
              <p className="text-sm text-aura-muted text-center mt-8">{p.ticket.empty}</p>
            ) : (
              <ul className="space-y-3">
                {ticket.lines.map((l) => {
                  const info = bookableInfo(data, l.itemId);
                  const capable = THERAPISTS.filter((x) => info.needs.every((k) => x.skills.includes(k)));
                  return (
                    <li key={l.uid} className="rounded-2xl border border-aura-border p-3">
                      <div className="flex items-start gap-2">
                        <span className="flex-1 text-sm font-medium">{info.name}</span>
                        <span className="text-sm font-semibold tabular-nums">{money(l.price)}</span>
                        <button
                          type="button"
                          aria-label={p.ticket.remove}
                          onClick={() => setTicket((tk) => ({ ...tk, lines: tk.lines.filter((x) => x.uid !== l.uid) }))}
                          className="p-1 -m-1 rounded-full text-aura-muted hover:text-aura-danger hover:bg-aura-danger-bg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <select
                        aria-label={p.ticket.therapist}
                        value={l.therapistId ?? ''}
                        onChange={(e) =>
                          setTicket((tk) => ({
                            ...tk,
                            lines: tk.lines.map((x) => (x.uid === l.uid ? { ...x, therapistId: e.target.value || null } : x)),
                          }))
                        }
                        className={`mt-2 w-full h-10 rounded-xl border px-3 text-sm bg-aura-bg ${l.therapistId ? 'border-aura-border' : 'border-aura-warning/50 text-aura-warning'}`}
                      >
                        <option value="">{p.ticket.noTherapist}</option>
                        {capable.map((x) => (
                          <option key={x.id} value={x.id}>{x.name[lang]}</option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="p-4 border-t border-aura-border space-y-3">
            <select
              aria-label={p.ticket.discount}
              value={ticket.discountId}
              onChange={(e) => setTicket((tk) => ({ ...tk, discountId: e.target.value }))}
              className="w-full h-11 rounded-2xl border border-aura-border bg-aura-bg px-4 text-sm"
            >
              <option value="">{p.ticket.noDiscount}</option>
              {DISCOUNTS.map((x) => (
                <option key={x.id} value={x.id}>{x.name[lang]}</option>
              ))}
            </select>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-aura-muted">{p.ticket.subtotal}</dt>
              <dd className="text-end tabular-nums">{money(subtotal)}</dd>
              {discount > 0 && (
                <>
                  <dt className="text-aura-muted">{p.ticket.discount}</dt>
                  <dd className="text-end tabular-nums text-aura-success">-{money(discount)}</dd>
                </>
              )}
              <dt className="text-lg font-semibold">{p.ticket.total}</dt>
              <dd className="text-end text-lg font-semibold tabular-nums">{money(total)}</dd>
              <dt className="text-xs text-aura-muted col-span-2 text-end">{p.ticket.vat}: {money(vat)}</dt>
            </dl>
            {missingTherapist && <p className="text-xs text-aura-warning">{p.ticket.therapistRequired}</p>}
            <button
              type="button"
              disabled={ticket.lines.length === 0 || missingTherapist}
              onClick={() => setPaying(true)}
              className="w-full h-14 rounded-full bg-aura-accent hover:bg-aura-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-semibold transition-colors"
            >
              {p.ticket.charge} {total > 0 && money(total)}
            </button>
          </div>
        </aside>
      </div>

      {showAppointments && now && (
        <AppointmentsDialog
          now={now}
          ticketBookingIds={ticketBookingIds}
          onClose={() => setShowAppointments(false)}
          onLoad={loadBooking}
        />
      )}
      {paying && <PayDialog due={total} onCancel={() => setPaying(false)} onComplete={completeSale} />}
      {receipt && <ReceiptDialog sale={receipt} onDone={() => setReceipt(null)} />}
      {closingShift && (
        <ShiftDialog
          sales={sales}
          onCancel={() => setClosingShift(false)}
          onClosed={() => {
            setSales([]);
            setClosingShift(false);
            setShiftOpenedAt(null);
            setCashier(null);
          }}
        />
      )}
    </div>
  );
}
