'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  DAY_END, DAY_START, THERAPISTS, addDays, bookableInfo, displayStatus, needsAttention,
  startOfDay, therapistMinutes, toDateKey, type Booking, type MixCategory,
} from '@/data/dashboardData';
import { mergeBookings, useBookingsStore } from '@/data/bookingsStore';
import { useDashboard, useNow } from './useDashboard';
import { fmtDate, fmtMinutes, fmtRange } from './format';
import { LEGEND_ORDER, STATUS_STYLE } from './status';
import { BookingDetails, NewBookingForm } from './BookingPanels';

type View = 'day' | 'week';

// Name column: avatars only on phones, avatar + name from sm up (set as --name-col on the grid)
const NAME_COL = 'var(--name-col)';
const HOUR_PX = 112;
const SPAN = DAY_END - DAY_START;
const HOURS = Array.from({ length: SPAN / 60 }, (_, i) => DAY_START + i * 60);
const frac = (min: number) => Math.min(Math.max((min - DAY_START) / SPAN, 0), 1);
// Position inside the timeline column, which starts after the name column
const timelinePos = (f: number) => `calc(${NAME_COL} + (100% - ${NAME_COL}) * ${f})`;

function Avatar({ initials, muted }: { initials: string; muted?: boolean }) {
  return (
    <span className={`grid place-items-center w-9 h-9 rounded-full text-xs font-semibold shrink-0 ${muted ? 'aura-hatch border border-dashed border-aura-accent/40 text-aura-muted' : 'bg-aura-primary text-aura-accent'}`}>
      {initials}
    </span>
  );
}

export default function BookingsPage() {
  const { lang, d, data } = useDashboard();
  const now = useNow();
  const [view, setView] = useState<View>('day');
  const [date, setDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<MixCategory | 'all'>('all');
  const { added, patches, addBooking, patchBooking } = useBookingsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const nowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (now && !date) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the first date comes from the browser clock
      setDate(startOfDay(now));
      // "New booking" on the overview links here with ?new=1
      if (new URLSearchParams(window.location.search).get('new')) setCreating(true);
    }
  }, [now, date]);

  // Bring the now-line into view when opening today
  const dateKey = date ? toDateKey(date) : '';
  useEffect(() => {
    nowRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [dateKey, view]);

  const bookingsFor = useCallback(
    (day: Date) => {
      if (!now) return [];
      return mergeBookings(day, now, lang, { added, patches });
    },
    [now, lang, added, patches]
  );

  const dayBookings = useMemo(() => (date ? bookingsFor(date) : []), [date, bookingsFor]);
  const weekDays = useMemo(() => {
    if (!date) return [];
    const sunday = addDays(date, -date.getDay()); // KSA week starts on Sunday
    return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
  }, [date]);
  const weekBookings = useMemo(() => (view === 'week' ? weekDays.map((day) => bookingsFor(day)) : []), [view, weekDays, bookingsFor]);

  if (!now || !date) {
    return <div className="h-[70vh] rounded-3xl bg-aura-surface/60 border border-aura-border animate-pulse" />;
  }

  const isToday = toDateKey(date) === toDateKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNow = view === 'day' && isToday && nowMin >= DAY_START && nowMin <= DAY_END;
  const visible = dayBookings.filter((b) => b.status !== 'cancelled');
  const visitCount = view === 'day' ? visible.length : weekBookings.flat().filter((b) => b.status !== 'cancelled').length;
  const selected = dayBookings.find((b) => b.id === selectedId) ?? null;
  const step = view === 'day' ? 1 : 7;

  const matches = (b: Booking) => filter === 'all' || bookableInfo(data, b.itemId).category === filter;
  const lanes = [
    { id: null as string | null, name: d.bookings.unassignedLane, initials: '?', muted: true },
    ...THERAPISTS.map((t) => ({ id: t.id as string | null, name: t.name[lang], initials: t.initials, muted: false })),
  ];

  const filterOptions: { key: MixCategory | 'all'; label: string }[] = [
    { key: 'all', label: d.bookings.allServices },
    ...data.SERVICES_CATEGORIES.map((c) => ({ key: c.id as MixCategory, label: c.name })),
    { key: 'package', label: d.bookings.form.packages },
  ];

  const pill = (active: boolean) =>
    `h-9 px-4 rounded-full text-sm transition-colors ${active ? 'bg-aura-surface shadow-sm text-aura-text font-medium' : 'text-aura-muted hover:text-aura-text'}`;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-aura-surface border border-aura-border">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 border-b border-aura-border">
          <span className="grid place-items-center w-10 h-10 rounded-full bg-aura-primary text-aura-accent">
            <CalendarDays className="w-5 h-5" />
          </span>
          <div className="me-auto">
            <h1 className="font-serif text-2xl leading-tight">{d.bookings.title}</h1>
            <p className="text-sm text-aura-muted">
              {view === 'day'
                ? fmtDate(date, lang, { weekday: 'long', day: 'numeric', month: 'short' })
                : `${fmtDate(weekDays[0], lang, { day: 'numeric', month: 'short' })} – ${fmtDate(weekDays[6], lang, { day: 'numeric', month: 'short' })}`}
              {' · '}
              {visitCount} {d.bookings.visits}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" aria-label={d.bookings.prev} onClick={() => setDate(addDays(date, -step))} className="p-2 rounded-full hover:bg-aura-bg">
              <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
            </button>
            <button type="button" onClick={() => setDate(startOfDay(now))} className="h-9 px-3 rounded-full text-sm border border-aura-border hover:bg-aura-bg">
              {d.bookings.today}
            </button>
            <button type="button" aria-label={d.bookings.next} onClick={() => setDate(addDays(date, step))} className="p-2 rounded-full hover:bg-aura-bg">
              <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
            </button>
          </div>

          <div className="flex p-1 rounded-full bg-aura-bg border border-aura-border">
            <button type="button" onClick={() => setView('day')} className={pill(view === 'day')}>{d.bookings.day}</button>
            <button type="button" onClick={() => setView('week')} className={pill(view === 'week')}>{d.bookings.week}</button>
          </div>

          <select
            aria-label={d.bookings.allServices}
            value={filter}
            onChange={(e) => setFilter(e.target.value as MixCategory | 'all')}
            className="h-10 rounded-full border border-aura-border bg-aura-surface px-4 text-sm"
          >
            {filterOptions.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {d.bookings.newBooking}
          </button>
        </div>

        {/* Timeline / week grid */}
        <div className="overflow-x-auto">
          {view === 'day' ? (
            <div
              className="relative p-4 sm:p-5 [--name-col:3.5rem] sm:[--name-col:13rem]"
              style={{ minWidth: `calc(${NAME_COL} + ${HOURS.length * HOUR_PX}px + 2.5rem)` }}
            >
              <div className="relative">
                {/* Hour header */}
                <div className="relative h-8 text-xs text-aura-muted">
                  {HOURS.map((h) => (
                    <span key={h} className="absolute top-1 -translate-x-1/2 rtl:translate-x-1/2" style={{ insetInlineStart: timelinePos(frac(h)) }}>
                      {fmtMinutes(h, lang).replace(':00', '')}
                    </span>
                  ))}
                </div>

                {/* Hour gridlines */}
                {HOURS.map((h) => (
                  <div key={h} aria-hidden className="absolute top-8 bottom-0 border-s border-aura-border/80" style={{ insetInlineStart: timelinePos(frac(h)) }} />
                ))}

                {/* Lanes */}
                {lanes.map((lane) => {
                  const items = visible.filter((b) => b.therapistId === lane.id);
                  return (
                    <div
                      key={lane.id ?? 'unassigned'}
                      className={`relative flex items-center h-14 ${lane.id === null ? 'rounded-2xl bg-aura-bg mb-2' : 'border-b border-aura-border/60 last:border-b-0'}`}
                    >
                      <div
                        className={`sticky start-0 z-[5] flex items-center gap-3 px-2 h-full shrink-0 ${lane.id === null ? 'bg-aura-bg rounded-s-2xl' : 'bg-aura-surface'}`}
                        style={{ width: NAME_COL }}
                      >
                        <span title={lane.name}>
                          <Avatar initials={lane.initials} muted={lane.muted} />
                        </span>
                        <span className="hidden sm:block text-sm font-medium truncate">{lane.name}</span>
                      </div>
                      <div className="relative flex-1 h-full">
                        {items.map((b) => {
                          const status = displayStatus(b)!;
                          const style = STATUS_STYLE[status];
                          const info = bookableInfo(data, b.itemId);
                          const width = frac(b.start + b.duration) - frac(b.start);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setSelectedId(b.id)}
                              title={`${b.client} · ${info.name} · ${fmtRange(b.start, b.duration, lang)} · ${d.status[status]}`}
                              className={`absolute top-2 bottom-2 rounded-full border px-3 text-start text-xs overflow-hidden transition-[opacity,transform] hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-aura-accent/50 ${
                                lane.id === null ? 'aura-hatch bg-aura-surface border-dashed border-aura-accent/50 text-aura-text' : style.chip
                              } ${matches(b) ? '' : 'opacity-25'}`}
                              style={{
                                insetInlineStart: `calc(${frac(b.start) * 100}% + 2px)`,
                                width: `calc(${width * 100}% - 4px)`,
                              }}
                            >
                              <span className="flex items-center gap-1.5 h-full">
                                {needsAttention(status) && <style.icon className="w-3.5 h-3.5 shrink-0" />}
                                <span className="font-medium truncate">{b.client.split(' ')[0]}</span>
                                {b.duration >= 90 && <span className="truncate opacity-70">· {info.name}</span>}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Now line */}
                {showNow && (
                  <div ref={nowRef} aria-hidden className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ insetInlineStart: timelinePos(frac(nowMin)) }}>
                    <div className="absolute top-8 bottom-0 w-0.5 -translate-x-1/2 rtl:translate-x-1/2 bg-aura-accent-hover" />
                    <span className="absolute top-0 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-aura-accent-hover text-white text-[11px] font-semibold px-2 py-1 whitespace-nowrap shadow-sm">
                      {fmtMinutes(nowMin, lang)}
                    </span>
                  </div>
                )}
              </div>
              {visible.length === 0 && <p className="text-center text-sm text-aura-muted py-6">{d.bookings.noBookings}</p>}
            </div>
          ) : (
            <div className="min-w-[860px] p-4 sm:p-5 [--name-col:13rem]">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr>
                    <th className="text-start font-medium text-xs text-aura-muted pb-3" style={{ width: NAME_COL }}>{d.bookings.therapist}</th>
                    {weekDays.map((day) => {
                      const today = toDateKey(day) === toDateKey(now);
                      return (
                        <th key={toDateKey(day)} className="pb-3 font-medium">
                          <button
                            type="button"
                            onClick={() => {
                              setDate(day);
                              setView('day');
                            }}
                            className={`w-full rounded-xl py-1.5 text-xs transition-colors ${today ? 'bg-aura-accent text-white' : 'text-aura-muted hover:bg-aura-bg'}`}
                          >
                            <span className="block">{fmtDate(day, lang, { weekday: 'short' })}</span>
                            <span className="block text-base font-semibold">{fmtDate(day, lang, { day: 'numeric' })}</span>
                          </button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {THERAPISTS.map((t) => (
                    <tr key={t.id} className="border-t border-aura-border/70">
                      <td className="py-2">
                        <span className="flex items-center gap-3 pe-2">
                          <Avatar initials={t.initials} />
                          <span className="font-medium truncate">{t.name[lang]}</span>
                        </span>
                      </td>
                      {weekDays.map((day, i) => {
                        const list = weekBookings[i] ?? [];
                        const minutes = therapistMinutes(list.filter(matches), t.id);
                        const pct = Math.round((minutes / SPAN) * 100);
                        return (
                          <td key={toDateKey(day)} className="p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDate(day);
                                setView('day');
                              }}
                              title={`${t.name[lang]} · ${(minutes / 60).toFixed(1)} ${d.bookings.weekHours} · ${pct}%`}
                              className="w-full rounded-xl border border-aura-border bg-aura-bg/60 hover:border-aura-accent/40 p-2 text-start transition-colors"
                            >
                              <span className="block text-xs tabular-nums">
                                <span className="font-semibold">{(minutes / 60).toFixed(1)}</span>{' '}
                                <span className="text-aura-muted">{d.bookings.weekHours}</span>
                              </span>
                              <span className="mt-1.5 block h-1.5 rounded-full bg-aura-border overflow-hidden">
                                <span className="block h-full rounded-full bg-aura-accent" style={{ width: `${pct}%` }} />
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend — maps 1:1 to appt_status */}
        {view === 'day' && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 border-t border-aura-border text-xs text-aura-muted">
            {LEGEND_ORDER.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${STATUS_STYLE[s].dot}`} />
                {d.status[s]}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full aura-hatch border border-dashed border-aura-accent/60" />
              {d.status.unassigned}
            </span>
          </div>
        )}
      </section>

      {selected && (
        <BookingDetails
          booking={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => patchBooking(selected.id, patch)}
        />
      )}
      {creating && (
        <NewBookingForm
          date={date}
          onClose={() => setCreating(false)}
          onCreate={(key, booking) => {
            addBooking(key, booking);
            setCreating(false);
            setDate(new Date(`${key}T00:00`));
            setView('day');
          }}
        />
      )}
    </div>
  );
}
