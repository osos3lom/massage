'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CircleCheck, CreditCard, LogIn, Phone, UserX, X } from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import {
  BOOKABLE_IDS, BOOKABLES, bookableInfo, displayStatus,
  hhmmToBusinessMinutes, toDateKey, usePhase34Store, type Booking, type BookableId,
} from '@/data/seedData';
import { useDashboard } from './useDashboard';
import { fmtDate, fmtNumber, fmtRange } from './format';
import { STATUS_STYLE } from './status';

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { d } = useDashboard();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label={d.bookings.details.close} onClick={onClose} className="absolute inset-0 bg-aura-text/25 backdrop-blur-[2px]" />
      <aside className="absolute inset-y-0 end-0 w-full max-w-md bg-aura-surface shadow-premium flex flex-col">
        <div className="flex items-center justify-between h-16 px-6 border-b border-aura-border shrink-0">
          <h2 className="font-serif text-xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label={d.bookings.details.close} className="p-2 -me-2 rounded-full text-aura-muted hover:bg-aura-primary/50">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-3 border-b border-aura-border text-sm">
    <dt className="text-aura-muted">{label}</dt>
    <dd className="text-end font-medium">{children}</dd>
  </div>
);

export function BookingDetails({
  booking, onClose, onUpdate,
}: {
  booking: Booking;
  onClose: () => void;
  onUpdate: (patch: Partial<Booking>) => void;
}) {
  const { lang, d, data } = useDashboard();
  const { therapists: p34Therapists, rooms: p34Rooms } = usePhase34Store();
  const info = bookableInfo(data, booking.itemId);
  const therapist = p34Therapists.find((t) => t.id === booking.therapistId);
  const room = p34Rooms.find((r) => r.id === booking.roomId);
  const status = displayStatus(booking);
  const capable = p34Therapists.filter((t) => t.isActive && info.needs.every((k) => t.skills.includes(k)));
  const btn = 'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-colors';

  return (
    <Drawer title={d.bookings.details.title} onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <span className="grid place-items-center w-12 h-12 rounded-full bg-aura-primary text-aura-accent font-semibold">
          {booking.client.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </span>
        <div className="min-w-0">
          <p className="font-semibold truncate">{booking.client}</p>
          <p className="flex items-center gap-1 text-xs text-aura-muted" dir="ltr">
            <Phone className="w-3 h-3" /> {booking.phone}
          </p>
        </div>
        {status && (
          <span className={`ms-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${STATUS_STYLE[status].chip}`}>
            {d.status[status]}
          </span>
        )}
      </div>

      <dl>
        <Row label={d.bookings.details.service}>{info.name}</Row>
        <Row label={d.bookings.details.time}>{fmtRange(booking.start, booking.duration, lang)}</Row>
        <Row label={d.bookings.details.therapist}>
          {therapist ? (
            lang === 'ar' ? therapist.nameAr : therapist.nameEn
          ) : (
            <select
              aria-label={d.bookings.details.assign}
              defaultValue=""
              onChange={(e) => e.target.value && onUpdate({ therapistId: e.target.value })}
              className="h-8 rounded-full border border-aura-border bg-aura-bg px-3 text-xs"
            >
              <option value="" disabled>{d.bookings.details.assign}</option>
              {capable.map((t) => (
                <option key={t.id} value={t.id}>{lang === 'ar' ? t.nameAr : t.nameEn}</option>
              ))}
            </select>
          )}
        </Row>
        <Row label={d.bookings.details.room}>{room ? (lang === 'ar' ? room.nameAr : room.nameEn) : '—'}</Row>
        <Row label={d.bookings.details.price}>
          <span className="tabular-nums">{fmtNumber(info.price, lang)} {currencyLabel(lang)}</span>
        </Row>
        <Row label={d.bookings.details.source}>{d.source[booking.source]}</Row>
      </dl>

      {booking.notes && (
        <div className="mt-5 rounded-2xl bg-aura-warning-bg border border-aura-warning/25 p-4">
          <p className="text-xs font-semibold text-aura-warning mb-1">{d.bookings.details.notes}</p>
          <p className="text-sm">{booking.notes}</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-2">
        {(booking.status === 'booked' || booking.status === 'confirmed') && (
          <>
            <button type="button" onClick={() => onUpdate({ status: 'checked_in' })} className={`${btn} col-span-2 bg-aura-accent hover:bg-aura-accent-hover text-white`}>
              <LogIn className="w-4 h-4 rtl:-scale-x-100" /> {d.bookings.details.checkIn}
            </button>
            <button type="button" disabled title="Phase 3" className={`${btn} border border-aura-border text-aura-muted cursor-not-allowed`}>
              <CalendarClock className="w-4 h-4" /> {d.bookings.details.reschedule}
            </button>
            <button type="button" onClick={() => onUpdate({ status: 'no_show' })} className={`${btn} border border-aura-danger/30 text-aura-danger hover:bg-aura-danger-bg`}>
              <UserX className="w-4 h-4" /> {d.bookings.details.noShow}
            </button>
          </>
        )}
        {(booking.status === 'checked_in' || status === 'awaiting_payment') && (
          <button type="button" onClick={() => onUpdate({ status: 'completed', paid: true })} className={`${btn} col-span-2 bg-aura-accent hover:bg-aura-accent-hover text-white`}>
            <CreditCard className="w-4 h-4" /> {d.bookings.details.checkout}
          </button>
        )}
        {status === 'completed' && (
          <p className="col-span-2 flex items-center justify-center gap-2 text-sm text-aura-success">
            <CircleCheck className="w-4 h-4" /> {d.status.completed}
          </p>
        )}
      </div>
    </Drawer>
  );
}

export function NewBookingForm({
  date, onClose, onCreate,
}: {
  date: Date;
  onClose: () => void;
  onCreate: (dateKey: string, booking: Booking) => void;
}) {
  const { lang, d, data } = useDashboard();
  const { therapists: p34Therapists, rooms: p34Rooms } = usePhase34Store();
  const [itemId, setItemId] = useState<BookableId>('msg-60');
  const [therapistId, setTherapistId] = useState('');
  const [dateKey, setDateKey] = useState(toDateKey(date));
  const [time, setTime] = useState('16:00');
  const capable = p34Therapists.filter((t) => t.isActive && BOOKABLES[itemId].needs.every((k) => t.skills.includes(k)));
  const field = 'w-full h-11 rounded-2xl border border-aura-border bg-aura-bg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-aura-accent/30';
  const label = 'block text-xs font-medium text-aura-muted mb-1.5';

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const kind = BOOKABLES[itemId].category === 'package' ? 'massage' : BOOKABLES[itemId].category;
    onCreate(dateKey, {
      id: `local-${Date.now()}`,
      client: String(form.get('client') || '—'),
      phone: String(form.get('phone') || ''),
      itemId,
      therapistId: therapistId || null,
      roomId: p34Rooms.find((r) => r.forKind === kind)?.id ?? '',
      start: hhmmToBusinessMinutes(time),
      duration: BOOKABLES[itemId].duration,
      status: 'booked',
      paid: false,
      source: 'phone',
      notes: String(form.get('notes') || '') || undefined,
    });
  };

  const services = BOOKABLE_IDS.filter((id) => !id.startsWith('pkg'));
  const packages = BOOKABLE_IDS.filter((id) => id.startsWith('pkg'));

  return (
    <Drawer title={d.bookings.form.title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={label} htmlFor="nb-client">{d.bookings.form.client}</label>
          <input id="nb-client" name="client" required className={field} />
        </div>
        <div>
          <label className={label} htmlFor="nb-phone">{d.bookings.form.phone}</label>
          <input id="nb-phone" name="phone" type="tel" dir="ltr" placeholder="05XXXXXXXX" className={field} />
        </div>
        <div>
          <label className={label} htmlFor="nb-service">{d.bookings.form.service}</label>
          <select
            id="nb-service"
            value={itemId}
            onChange={(e) => {
              setItemId(e.target.value as BookableId);
              setTherapistId('');
            }}
            className={field}
          >
            <optgroup label={d.bookings.form.services}>
              {services.map((id) => {
                const info = bookableInfo(data, id);
                return <option key={id} value={id}>{info.name} · {info.duration}′ · {info.price} {currencyLabel(lang)}</option>;
              })}
            </optgroup>
            <optgroup label={d.bookings.form.packages}>
              {packages.map((id) => {
                const info = bookableInfo(data, id);
                return <option key={id} value={id}>{info.name} · {info.duration}′ · {info.price} {currencyLabel(lang)}</option>;
              })}
            </optgroup>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="nb-therapist">{d.bookings.form.therapist}</label>
          <select id="nb-therapist" value={therapistId} onChange={(e) => setTherapistId(e.target.value)} className={field}>
            <option value="">{d.bookings.form.anyTherapist}</option>
            {capable.map((t) => (
              <option key={t.id} value={t.id}>{lang === 'ar' ? t.nameAr : t.nameEn}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="nb-date">{d.bookings.form.date}</label>
            <input id="nb-date" type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="nb-time">{d.bookings.form.time}</label>
            <input
              id="nb-time"
              type="time"
              step={900}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={field}
            />
          </div>
        </div>
        <p className="text-xs text-aura-muted -mt-1">{fmtDate(new Date(`${dateKey}T00:00`), lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <div>
          <label className={label} htmlFor="nb-notes">{d.bookings.form.notes}</label>
          <textarea id="nb-notes" name="notes" rows={3} className={`${field} h-auto py-3`} />
        </div>
        <p className="text-xs text-aura-muted">{d.bookings.form.localOnly}</p>
        <div className="flex gap-2 pt-2">
          <button type="submit" className="flex-1 h-11 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors">
            {d.bookings.form.save}
          </button>
          <button type="button" onClick={onClose} className="h-11 px-5 rounded-full border border-aura-border text-sm hover:bg-aura-bg">
            {d.bookings.form.cancel}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
