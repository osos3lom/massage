'use client';

import { useSyncExternalStore } from 'react';
import { generateBookings, toDateKey, type Booking } from './dashboardData';
import type { Lang } from '@/i18n/config';

/*
 * Shared client-side store for the manual changes layered on top of the deterministic
 * generator: appointments booked by staff (`added`) and status edits (`patches`).
 *
 * Both the back-office calendar (/dashboard/bookings) and the till (/pos) read and write
 * it, so a booking taken at the front desk shows on the owner's calendar, and a check-in
 * or payment at the till updates the same appointment. It stands in for the `appointments`
 * table until Supabase + PowerSync land (ARCHITECTURE.md §2); localStorage keeps it across
 * reloads on one device the way local SQLite will.
 */

interface StoreState {
  added: Record<string, Booking[]>; // dateKey -> staff-booked appointments
  patches: Record<string, Partial<Booking>>; // bookingId -> status / payment edits
}

const KEY = 'aura-bookings-v2';
const EMPTY: StoreState = { added: {}, patches: {} };

const read = (): StoreState => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as StoreState) };
  } catch {}
  return EMPTY;
};

let state: StoreState = typeof window === 'undefined' ? EMPTY : read();
const listeners = new Set<() => void>();

const commit = (next: StoreState) => {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
};

export const addBooking = (dateKey: string, booking: Booking) =>
  commit({ ...state, added: { ...state.added, [dateKey]: [...(state.added[dateKey] ?? []), booking] } });

export const patchBooking = (id: string, patch: Partial<Booking>) =>
  commit({ ...state, patches: { ...state.patches, [id]: { ...state.patches[id], ...patch } } });

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  // Mirror changes made in another tab (e.g. calendar open beside the till)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = read();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

/** The manual layer. Pair with `mergeBookings` to get a day's full list. */
export function useBookingsStore() {
  const snap = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  return { added: snap.added, patches: snap.patches, addBooking, patchBooking };
}

/** Generated bookings for one day, with staff additions appended and status patches applied. */
export function mergeBookings(day: Date, now: Date, lang: Lang, store: Pick<StoreState, 'added' | 'patches'>): Booking[] {
  const key = toDateKey(day);
  return [...generateBookings(day, now, lang), ...(store.added[key] ?? [])].map((b) => ({ ...b, ...store.patches[b.id] }));
}
