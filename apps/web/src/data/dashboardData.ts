import type { Lang } from '@/i18n/config';
import type { SalonData } from '@/data/salonData';
import {
  SEED_ROOMS,
  SEED_THERAPISTS,
  SEED_WORKING_HOURS,
} from './seedData';

/*
 * Back-office calendar & dashboard types derived from the unified `src/data/seedData.ts`.
 */

type L = Record<Lang, string>;

export type ApptStatus = 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
export type BookingSource = 'walk_in' | 'phone' | 'online' | 'whatsapp';
export type ServiceKind = 'massage' | 'moroccan-bath' | 'pedicure';
export type MixCategory = ServiceKind | 'package';

// Opening hours shown on the timeline (minutes from midnight)
export const DAY_START = SEED_WORKING_HOURS.dayStartHour * 60;
export const DAY_END = SEED_WORKING_HOURS.dayEndHour * 60;
// Room reset / linen change between sessions
export const BUFFER_MIN = SEED_WORKING_HOURS.bufferMinutes;

// Everything that can be booked: the services and packages in salonData, with their real length
export const BOOKABLES = {
  'msg-60': { category: 'massage', duration: 60, needs: ['massage'] },
  'msg-45': { category: 'massage', duration: 45, needs: ['massage'] },
  bath: { category: 'moroccan-bath', duration: 30, needs: ['moroccan-bath'] },
  pedicure: { category: 'pedicure', duration: 45, needs: ['pedicure'] },
  'pkg-1': { category: 'package', duration: 60, needs: ['massage', 'moroccan-bath'] },
  'pkg-2': { category: 'package', duration: 75, needs: ['massage', 'moroccan-bath'] },
  'pkg-3': { category: 'package', duration: 90, needs: ['massage', 'moroccan-bath'] },
  'pkg-4': { category: 'package', duration: 135, needs: ['massage', 'moroccan-bath', 'pedicure'] },
} as const satisfies Record<string, { category: MixCategory; duration: number; needs: readonly ServiceKind[] }>;

export type BookableId = keyof typeof BOOKABLES;
export const BOOKABLE_IDS = Object.keys(BOOKABLES) as BookableId[];

export interface Therapist {
  id: string;
  name: L;
  initials: string;
  skills: ServiceKind[];
}

export const THERAPISTS: Therapist[] = SEED_THERAPISTS.filter((t) => t.isActive).map((t) => ({
  id: t.id,
  name: { en: t.nameEn, ar: t.nameAr },
  initials: t.initials,
  skills: t.skills,
}));

export interface Room {
  id: string;
  name: L;
  forKind: ServiceKind;
}

export const ROOMS: Room[] = SEED_ROOMS.filter((r) => r.isActive).map((r) => ({
  id: r.id,
  name: { en: r.nameEn, ar: r.nameAr },
  forKind: r.forKind,
}));

export interface Booking {
  id: string;
  client: string;
  phone: string;
  itemId: BookableId;
  therapistId: string | null;
  roomId: string;
  start: number; // minutes from midnight
  duration: number;
  status: ApptStatus;
  paid: boolean;
  source: BookingSource;
  notes?: string;
}

/* ----------------------------------------------------------------------------
 * Date helpers
 * ------------------------------------------------------------------------- */
export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const minutesToHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/**
 * Initial bookings for one calendar day (clean slate — zero mock appointments).
 */
export function generateBookings(_day: Date, _now: Date, _lang: Lang): Booking[] {
  void _day;
  void _now;
  void _lang;
  return [];
}

/* ----------------------------------------------------------------------------
 * Derived values
 * ------------------------------------------------------------------------- */
export function bookableInfo(data: SalonData, id: BookableId) {
  const service = data.SERVICES_DATA.find((s) => s.id === id);
  const pkg = data.PACKAGES_DATA.find((p) => p.id === id);
  return {
    name: service?.name ?? pkg?.name ?? id,
    price: service?.price ?? pkg?.price ?? 0,
    ...BOOKABLES[id],
  };
}

/** Status shown on the calendar — a completed visit with no payment needs attention. */
export type DisplayStatus = Exclude<ApptStatus, 'cancelled'> | 'awaiting_payment';

export const displayStatus = (b: Booking): DisplayStatus | null => {
  if (b.status === 'cancelled') return null;
  if (b.status === 'completed' && !b.paid) return 'awaiting_payment';
  return b.status;
};

export const needsAttention = (s: DisplayStatus | null) => s === 'no_show' || s === 'awaiting_payment';

export function dayStats(data: SalonData, bookings: Booking[], therapistCount: number = THERAPISTS.length) {
  const live = bookings.filter((b) => b.status !== 'cancelled');
  const completedPaid = live.filter((b) => b.status === 'completed' && b.paid);
  const revenue = completedPaid.reduce((sum, b) => sum + bookableInfo(data, b.itemId).price, 0);
  const assignedMinutes = live
    .filter((b) => b.therapistId && b.status !== 'no_show')
    .reduce((sum, b) => sum + b.duration, 0);
  const capacity = therapistCount * (DAY_END - DAY_START);
  return {
    count: live.length,
    inTreatment: live.filter((b) => b.status === 'checked_in').length,
    revenue,
    avgTicket: completedPaid.length ? Math.round(revenue / completedPaid.length) : 0,
    occupancy: capacity > 0 ? Math.round((assignedMinutes / capacity) * 100) : 0,
    noShows: live.filter((b) => b.status === 'no_show').length,
    unpaid: live.filter((b) => b.status === 'completed' && !b.paid).length,
    unassigned: live.filter((b) => !b.therapistId).length,
  };
}

export function therapistMinutes(bookings: Booking[], therapistId: string) {
  return bookings
    .filter((b) => b.therapistId === therapistId && b.status !== 'cancelled' && b.status !== 'no_show')
    .reduce((sum, b) => sum + b.duration, 0);
}

export const PACKAGES_EXPIRING_THIS_WEEK = 0;
