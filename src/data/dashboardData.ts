import type { Lang } from '@/i18n/config';
import type { SalonData } from '@/data/salonData';

/*
 * Mock back-office data for the dashboard scaffold.
 * Mirrors plan/schema/schema.ts (appointments, therapists, rooms, appt_status) so the
 * pages can be switched to Supabase queries later without changing their shape.
 * Bookings are generated deterministically per date, so every page agrees on "today".
 */

type L = Record<Lang, string>;

export type ApptStatus = 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
export type BookingSource = 'walk_in' | 'phone' | 'online' | 'whatsapp';
export type ServiceKind = 'massage' | 'moroccan-bath' | 'pedicure';
export type MixCategory = ServiceKind | 'package';

// Opening hours shown on the timeline (minutes from midnight)
export const DAY_START = 9 * 60;
export const DAY_END = 21 * 60;
// Room reset / linen change between sessions
export const BUFFER_MIN = 15;

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

export const THERAPISTS: Therapist[] = [
  { id: 'th-1', name: { en: 'Elena Rostova', ar: 'إيلينا روستوفا' }, initials: 'ER', skills: ['massage', 'moroccan-bath'] },
  { id: 'th-2', name: { en: 'Sophia Al-Jamil', ar: 'صوفيا الجميل' }, initials: 'SJ', skills: ['massage', 'moroccan-bath', 'pedicure'] },
  { id: 'th-3', name: { en: 'Maricel Cruz', ar: 'ماريسيل كروز' }, initials: 'MC', skills: ['massage'] },
  { id: 'th-4', name: { en: 'Ploy Suwan', ar: 'بلوي سوان' }, initials: 'PS', skills: ['massage', 'moroccan-bath'] },
  { id: 'th-5', name: { en: 'Fatima Zahra', ar: 'فاطمة الزهراء' }, initials: 'FZ', skills: ['moroccan-bath', 'massage'] },
  { id: 'th-6', name: { en: 'Siti Rahma', ar: 'سيتي رحمة' }, initials: 'SR', skills: ['pedicure', 'massage'] },
  { id: 'th-7', name: { en: 'Nadia Haddad', ar: 'نادية حداد' }, initials: 'NH', skills: ['pedicure'] },
];

export interface Room {
  id: string;
  name: L;
  forKind: ServiceKind;
}

export const ROOMS: Room[] = [
  { id: 'rm-1', name: { en: 'Massage Room 1', ar: 'غرفة المساج 1' }, forKind: 'massage' },
  { id: 'rm-2', name: { en: 'Massage Room 2', ar: 'غرفة المساج 2' }, forKind: 'massage' },
  { id: 'rm-3', name: { en: 'Massage Room 3', ar: 'غرفة المساج 3' }, forKind: 'massage' },
  { id: 'rm-4', name: { en: 'Hammam 1', ar: 'الحمام 1' }, forKind: 'moroccan-bath' },
  { id: 'rm-5', name: { en: 'Hammam 2', ar: 'الحمام 2' }, forKind: 'moroccan-bath' },
  { id: 'rm-6', name: { en: 'Pedicure Lounge', ar: 'صالة البديكير' }, forKind: 'pedicure' },
];

// Client names are built from first × family name so a day never repeats a client
const FIRST_NAMES: L[] = [
  { en: 'Noura', ar: 'نورة' }, { en: 'Reem', ar: 'ريم' }, { en: 'Sara', ar: 'سارة' },
  { en: 'Lama', ar: 'لمى' }, { en: 'Hind', ar: 'هند' }, { en: 'Abeer', ar: 'عبير' },
  { en: 'Maha', ar: 'مها' }, { en: 'Dana', ar: 'دانة' }, { en: 'Joud', ar: 'جود' },
  { en: 'Amal', ar: 'أمل' }, { en: 'Hessa', ar: 'حصة' }, { en: 'Lulwa', ar: 'لولوة' },
  { en: 'Shahad', ar: 'شهد' }, { en: 'Rana', ar: 'رنا' }, { en: 'Wafa', ar: 'وفاء' },
  { en: 'Ghada', ar: 'غادة' }, { en: 'Mashael', ar: 'مشاعل' }, { en: 'Areej', ar: 'أريج' },
  { en: 'Razan', ar: 'رزان' }, { en: 'Haya', ar: 'هيا' }, { en: 'Nouf', ar: 'نوف' },
  { en: 'Bayan', ar: 'بيان' }, { en: 'Asma', ar: 'أسماء' }, { en: 'Layan', ar: 'ليان' },
];

const FAMILY_NAMES: L[] = [
  { en: 'Al-Qahtani', ar: 'القحطاني' }, { en: 'Al-Harbi', ar: 'الحربي' }, { en: 'Al-Otaibi', ar: 'العتيبي' },
  { en: 'Al-Zahrani', ar: 'الزهراني' }, { en: 'Al-Ghamdi', ar: 'الغامدي' }, { en: 'Al-Shehri', ar: 'الشهري' },
  { en: 'Al-Dossary', ar: 'الدوسري' }, { en: 'Al-Mutairi', ar: 'المطيري' }, { en: 'Al-Subaie', ar: 'السبيعي' },
  { en: 'Al-Shamrani', ar: 'الشمراني' }, { en: 'Al-Rashid', ar: 'الراشد' }, { en: 'Al-Anazi', ar: 'العنزي' },
  { en: 'Bakr', ar: 'بكر' }, { en: 'Khoja', ar: 'خوجة' }, { en: 'Al-Malki', ar: 'المالكي' },
  { en: 'Fallatah', ar: 'فلاتة' }, { en: 'Al-Juhani', ar: 'الجهني' }, { en: 'Saber', ar: 'صابر' },
];

const NOTES: L[] = [
  { en: 'Prefers firm pressure.', ar: 'تفضّل الضغط القوي.' },
  { en: 'Pregnant (2nd trimester) — side-lying, safe oils only.', ar: 'حامل (الثلث الثاني) — وضعية جانبية وزيوت آمنة فقط.' },
  { en: 'Allergic to nut-based oils.', ar: 'لديها حساسية من زيوت المكسرات.' },
  { en: 'Lower-back pain — avoid deep pressure on spine.', ar: 'ألم أسفل الظهر — تجنّب الضغط العميق على العمود الفقري.' },
  { en: 'First visit — complete intake form.', ar: 'الزيارة الأولى — تعبئة استمارة الحالة الصحية.' },
];

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

/* ----------------------------------------------------------------------------
 * Deterministic generator
 * ------------------------------------------------------------------------- */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

// mulberry32: tiny seeded PRNG so a given date always yields the same schedule
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];

const canPerform = (t: Therapist, id: BookableId) =>
  BOOKABLES[id].needs.every((k) => t.skills.includes(k));

const roomFor = (id: BookableId, salt: number) => {
  const { category } = BOOKABLES[id];
  const kind: ServiceKind = category === 'package' ? 'massage' : category;
  const options = ROOMS.filter((r) => r.forKind === kind);
  return options[salt % options.length].id;
};

const roundUp15 = (m: number) => Math.ceil(m / 15) * 15;

/**
 * Bookings for one calendar day.
 * @param day   the calendar day
 * @param now   the current time (decides completed / in treatment / upcoming)
 */
export function generateBookings(day: Date, now: Date, lang: Lang): Booking[] {
  const key = toDateKey(day);
  const dayDiff = Math.round((startOfDay(day).getTime() - startOfDay(now).getTime()) / 86400000);
  const nowMin = minutesOfDay(now);
  const r = rng(hash(key));
  const bookings: Booking[] = [];
  const usedClients = new Set<string>();

  const nextClient = () => {
    for (;;) {
      const first = Math.floor(r() * FIRST_NAMES.length);
      const family = Math.floor(r() * FAMILY_NAMES.length);
      if (usedClients.has(`${first}-${family}`)) continue;
      usedClients.add(`${first}-${family}`);
      return `${FIRST_NAMES[first][lang]} ${FAMILY_NAMES[family][lang]}`;
    }
  };

  const statusFor = (start: number, end: number): ApptStatus => {
    const roll = r();
    if (roll < 0.03) return 'cancelled';
    if (dayDiff < 0 || (dayDiff === 0 && end <= nowMin)) return roll < 0.08 ? 'no_show' : 'completed';
    if (dayDiff === 0 && start <= nowMin) return 'checked_in';
    return roll < 0.6 ? 'confirmed' : 'booked';
  };

  const make = (therapistId: string | null, itemId: BookableId, start: number, source?: BookingSource): Booking => {
    const duration = BOOKABLES[itemId].duration;
    const status = statusFor(start, start + duration);
    const client = nextClient();
    const hasNote = r() < 0.3;
    return {
      id: `${key}-${bookings.length}`,
      client,
      phone: `05${Math.floor(10000000 + r() * 89999999)}`,
      itemId,
      therapistId,
      roomId: roomFor(itemId, bookings.length),
      start,
      duration,
      status,
      // A few finished visits are left unpaid so "awaiting payment" shows up
      paid: status === 'completed' && r() > (dayDiff < 0 ? 0.02 : 0.1),
      source: source ?? pick(r, ['walk_in', 'phone', 'online', 'whatsapp'] as const),
      notes: hasNote ? pick(r, NOTES)[lang] : undefined,
    };
  };

  for (const t of THERAPISTS) {
    const menu = BOOKABLE_IDS.filter((id) => canPerform(t, id));
    const singles = menu.filter((id) => !id.startsWith('pkg'));
    let cursor = DAY_START + pick(r, [0, 0, 15, 30, 60]);
    while (cursor < DAY_END) {
      // Leave natural gaps in the day
      if (r() < 0.22) {
        cursor += pick(r, [30, 45, 60, 90]);
        continue;
      }
      // Single services are booked more often than packages
      const itemId = r() < 0.7 ? pick(r, singles) : pick(r, menu);
      const end = cursor + BOOKABLES[itemId].duration;
      if (end > DAY_END) break;
      bookings.push(make(t.id, itemId, cursor));
      cursor = roundUp15(end + BUFFER_MIN);
    }
  }

  // Online "any therapist" bookings that reception still has to assign
  const unassigned = dayDiff < 0 ? 0 : 1 + Math.floor(r() * 3);
  for (let i = 0; i < unassigned; i++) {
    const earliest = dayDiff === 0 ? Math.max(DAY_START, roundUp15(nowMin + 30)) : DAY_START;
    if (earliest >= DAY_END - 90) break;
    const start = roundUp15(earliest + r() * (DAY_END - 90 - earliest));
    const b = make(null, pick(r, ['msg-60', 'msg-45', 'pkg-2', 'bath'] as const), start, 'online');
    b.status = 'booked';
    bookings.push(b);
  }

  return bookings.sort((a, b) => a.start - b.start);
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

export function dayStats(data: SalonData, bookings: Booking[]) {
  const live = bookings.filter((b) => b.status !== 'cancelled');
  const completedPaid = live.filter((b) => b.status === 'completed' && b.paid);
  const revenue = completedPaid.reduce((sum, b) => sum + bookableInfo(data, b.itemId).price, 0);
  const assignedMinutes = live
    .filter((b) => b.therapistId && b.status !== 'no_show')
    .reduce((sum, b) => sum + b.duration, 0);
  const capacity = THERAPISTS.length * (DAY_END - DAY_START);
  return {
    count: live.length,
    inTreatment: live.filter((b) => b.status === 'checked_in').length,
    revenue,
    avgTicket: completedPaid.length ? Math.round(revenue / completedPaid.length) : 0,
    occupancy: Math.round((assignedMinutes / capacity) * 100),
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

// Mock count until package_sessions is queried for real
export const PACKAGES_EXPIRING_THIS_WEEK = 3;
