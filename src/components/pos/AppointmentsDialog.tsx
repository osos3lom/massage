'use client';

import { useMemo, useRef, useState } from 'react';
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, ListChecks, LogIn, Plus, Search } from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import {
  BOOKABLE_IDS, BOOKABLES, DAY_END, DAY_START, ROOMS, THERAPISTS, addDays, bookableInfo, displayStatus,
  minutesToHHMM, startOfDay, toDateKey, type Booking, type BookableId,
} from '@/data/dashboardData';
import { addBooking, mergeBookings, useBookingsStore } from '@/data/bookingsStore';
import { toHalalas } from '@/data/posData';
import { dashboardDictionaries } from '@/i18n/dashboardDictionary';
import { fmtDate, fmtMinutes, fmtRange } from '@/components/dashboard/format';
import { STATUS_STYLE } from '@/components/dashboard/status';
import Modal from './Modal';
import { usePos } from './usePos';

type Tab = 'schedule' | 'book';

export default function AppointmentsDialog({
  now, ticketBookingIds, onClose, onLoad,
}: {
  now: Date;
  ticketBookingIds: Set<string>;
  onClose: () => void;
  onLoad: (b: Booking) => void;
}) {
  const { lang, p } = usePos();
  const { added, patches, patchBooking } = useBookingsStore();
  const status = dashboardDictionaries[lang].status;
  const [tab, setTab] = useState<Tab>('schedule');

  return (
    <Modal title={p.appt.title} onClose={onClose} wide>
      <div className="flex p-1 rounded-full bg-aura-bg border border-aura-border w-fit mb-5">
        {(['schedule', 'book'] as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 h-10 px-5 rounded-full text-sm transition-colors ${
              tab === key ? 'bg-aura-surface shadow-sm font-medium' : 'text-aura-muted hover:text-aura-text'
            }`}
          >
            {key === 'schedule' ? <ListChecks className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />}
            {key === 'schedule' ? p.appt.schedule : p.appt.book}
          </button>
        ))}
      </div>

      {tab === 'schedule' ? (
        <Schedule
          now={now}
          store={{ added, patches }}
          statusText={status}
          ticketBookingIds={ticketBookingIds}
          onLoad={(b) => {
            onLoad(b);
            onClose();
          }}
          onCheckIn={(id) => patchBooking(id, { status: 'checked_in' })}
        />
      ) : (
        <BookForm now={now} onLoad={onLoad} onClose={onClose} />
      )}
    </Modal>
  );
}

function Schedule({
  now, store, statusText, ticketBookingIds, onLoad, onCheckIn,
}: {
  now: Date;
  store: { added: Record<string, Booking[]>; patches: Record<string, Partial<Booking>> };
  statusText: Record<string, string>;
  ticketBookingIds: Set<string>;
  onLoad: (b: Booking) => void;
  onCheckIn: (id: string) => void;
}) {
  const { lang, p, data, money } = usePos();
  const [day, setDay] = useState(() => startOfDay(now));
  const [q, setQ] = useState('');

  const bookings = useMemo(() => {
    const list = mergeBookings(day, now, lang, store).filter((b) => b.status !== 'cancelled');
    const needle = q.trim().toLowerCase();
    return list
      .filter((b) => !needle || b.client.toLowerCase().includes(needle) || bookableInfo(data, b.itemId).name.toLowerCase().includes(needle))
      .sort((a, b) => a.start - b.start);
  }, [day, now, lang, store, q, data]);

  const isToday = toDateKey(day) === toDateKey(now);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <button type="button" aria-label="−1" onClick={() => setDay((d) => addDays(d, -1))} className="p-2 rounded-full hover:bg-aura-bg">
            <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
          </button>
          <span className="min-w-36 text-center text-sm font-medium">
            {isToday ? p.appt.schedule : fmtDate(day, lang, { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
          <button type="button" aria-label="+1" onClick={() => setDay((d) => addDays(d, 1))} className="p-2 rounded-full hover:bg-aura-bg">
            <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
          </button>
        </div>
        <label className="relative flex-1 min-w-48">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-aura-muted pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={p.appt.search}
            className="w-full h-11 rounded-full bg-aura-bg border border-aura-border ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
          />
        </label>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-aura-muted text-center py-10">{q ? p.appt.empty : p.appt.none}</p>
      ) : (
        <ul className="divide-y divide-aura-border max-h-[50vh] overflow-y-auto">
          {bookings.map((b) => {
            const info = bookableInfo(data, b.itemId);
            const therapist = THERAPISTS.find((x) => x.id === b.therapistId);
            const ds = displayStatus(b)!;
            const style = STATUS_STYLE[ds];
            const onTicket = ticketBookingIds.has(b.id);
            const canCheckIn = b.status === 'booked' || b.status === 'confirmed';
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="flex items-center gap-1.5 w-32 shrink-0 text-xs text-aura-muted tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  {fmtRange(b.start, b.duration, lang)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{b.client}</span>
                  <span className="block text-xs text-aura-muted truncate">
                    {info.name} · {therapist?.name[lang] ?? statusText.unassigned}
                  </span>
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${style.chip}`}>
                  <style.icon className="w-3.5 h-3.5" />
                  {statusText[ds]}
                </span>
                <span className="text-sm font-semibold tabular-nums w-20 text-end">{money(toHalalas(info.price))}</span>
                <span className="flex items-center gap-2">
                  {canCheckIn && (
                    <button
                      type="button"
                      onClick={() => onCheckIn(b.id)}
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-aura-border text-xs hover:bg-aura-bg"
                    >
                      <LogIn className="w-3.5 h-3.5 rtl:-scale-x-100" />
                      {p.appt.checkIn}
                    </button>
                  )}
                  {onTicket ? (
                    <span className="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-aura-bg text-xs text-aura-muted">
                      <Check className="w-3.5 h-3.5" />
                      {p.appt.onTicket}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onLoad(b)}
                      className="inline-flex items-center gap-1 h-9 px-3 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {p.appt.loadToTicket}
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BookForm({ now, onLoad, onClose }: { now: Date; onLoad: (b: Booking) => void; onClose: () => void }) {
  const { lang, p, data } = usePos();
  const [itemId, setItemId] = useState<BookableId>('msg-60');
  const [therapistId, setTherapistId] = useState('');
  const [dateKey, setDateKey] = useState(toDateKey(now));
  const [time, setTime] = useState('12:00');
  const [saved, setSaved] = useState<{ booking: Booking; dateKey: string } | null>(null);
  // Which button submitted: book only, or book and drop onto the current ticket
  const intent = useRef<'save' | 'ticket'>('save');

  const capable = THERAPISTS.filter((t) => BOOKABLES[itemId].needs.every((k) => t.skills.includes(k)));
  const services = BOOKABLE_IDS.filter((id) => !id.startsWith('pkg'));
  const packages = BOOKABLE_IDS.filter((id) => id.startsWith('pkg'));
  const field = 'w-full h-11 rounded-2xl border border-aura-border bg-aura-bg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-aura-accent/30';
  const label = 'block text-xs font-medium text-aura-muted mb-1.5';

  const build = (form: HTMLFormElement): { booking: Booking; dateKey: string } => {
    const fd = new FormData(form);
    const [h, m] = time.split(':').map(Number);
    const kind = BOOKABLES[itemId].category === 'package' ? 'massage' : BOOKABLES[itemId].category;
    return {
      dateKey,
      booking: {
        id: `pos-${Date.now()}`,
        client: String(fd.get('client') || '—'),
        phone: String(fd.get('phone') || ''),
        itemId,
        therapistId: therapistId || null,
        roomId: ROOMS.find((r) => r.forKind === kind)!.id,
        start: h * 60 + m,
        duration: BOOKABLES[itemId].duration,
        status: 'booked',
        paid: false,
        source: 'phone',
        notes: String(fd.get('notes') || '') || undefined,
      },
    };
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const built = build(e.currentTarget);
    addBooking(built.dateKey, built.booking);
    if (intent.current === 'ticket') {
      onLoad(built.booking);
      onClose();
      return;
    }
    setSaved(built);
  };

  if (saved) {
    return (
      <div className="text-center py-8">
        <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-aura-success-bg text-aura-success">
          <Check className="w-7 h-7" />
        </span>
        <p className="mt-4 text-sm">{p.appt.form.saved}</p>
        <p className="mt-1 text-sm font-medium">
          {saved.booking.client} · {bookableInfo(data, saved.booking.itemId).name}
        </p>
        <p className="text-xs text-aura-muted">
          {fmtDate(new Date(`${saved.dateKey}T00:00`), lang, { weekday: 'long', day: 'numeric', month: 'long' })} · {fmtMinutes(saved.booking.start, lang)}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <a
            href={`/dashboard/bookings`}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-aura-border text-sm hover:bg-aura-bg"
          >
            {p.appt.form.viewDay}
          </a>
          <button type="button" onClick={onClose} className="h-11 px-6 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-semibold">
            {p.appt.form.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
      <div>
        <label className={label} htmlFor="ap-client">{p.appt.form.client}</label>
        <input id="ap-client" name="client" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="ap-phone">{p.appt.form.phone}</label>
        <input id="ap-phone" name="phone" type="tel" dir="ltr" placeholder="05XXXXXXXX" className={field} />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="ap-service">{p.appt.form.service}</label>
        <select
          id="ap-service"
          value={itemId}
          onChange={(e) => { setItemId(e.target.value as BookableId); setTherapistId(''); }}
          className={field}
        >
          <optgroup label={p.appt.form.services}>
            {services.map((id) => {
              const info = bookableInfo(data, id);
              return <option key={id} value={id}>{info.name} · {info.duration}′ · {info.price} {currencyLabel(lang)}</option>;
            })}
          </optgroup>
          <optgroup label={p.appt.form.packages}>
            {packages.map((id) => {
              const info = bookableInfo(data, id);
              return <option key={id} value={id}>{info.name} · {info.duration}′ · {info.price} {currencyLabel(lang)}</option>;
            })}
          </optgroup>
        </select>
      </div>
      <div>
        <label className={label} htmlFor="ap-therapist">{p.appt.form.therapist}</label>
        <select id="ap-therapist" value={therapistId} onChange={(e) => setTherapistId(e.target.value)} className={field}>
          <option value="">{p.appt.form.anyTherapist}</option>
          {capable.map((x) => (
            <option key={x.id} value={x.id}>{x.name[lang]}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label} htmlFor="ap-date">{p.appt.form.date}</label>
          <input id="ap-date" type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="ap-time">{p.appt.form.time}</label>
          <input
            id="ap-time"
            type="time"
            step={900}
            min={minutesToHHMM(DAY_START)}
            max={minutesToHHMM(DAY_END - BOOKABLES[itemId].duration)}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={field}
          />
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="ap-notes">{p.appt.form.notes}</label>
        <textarea id="ap-notes" name="notes" rows={2} className={`${field} h-auto py-3`} />
      </div>
      <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
        <button
          type="submit"
          onClick={() => { intent.current = 'save'; }}
          className="flex-1 min-w-40 h-12 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-semibold"
        >
          {p.appt.form.save}
        </button>
        <button
          type="submit"
          onClick={() => { intent.current = 'ticket'; }}
          className="flex-1 min-w-40 h-12 rounded-full border border-aura-accent/40 text-aura-accent text-sm font-semibold hover:bg-aura-primary/40"
        >
          {p.appt.form.saveAddTicket}
        </button>
      </div>
    </form>
  );
}
