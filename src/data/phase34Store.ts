'use client';

import { useSyncExternalStore } from 'react';
import type { ServiceKind } from './dashboardData';

/*
 * Shared client-side store for Phase 3 & Phase 4 tables:
 *  - packages & package_sessions (Phase 3)
 *  - therapists, therapist_availability & commission_rules (Phase 3)
 *  - rooms (Phase 3)
 *  - products / inventory (Phase 4)
 *
 * Persisted in localStorage via useSyncExternalStore for instant cross-tab reactivity.
 */

export interface PackageCatalogItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  priceSar: number;
  totalSessions: number;
  validDays: number;
  includedServicesAr: string[];
  includedServicesEn: string[];
  isHighlighted?: boolean;
  isActive: boolean;
}

export interface ClientPackageSession {
  id: string;
  packageId: string;
  packageNameAr: string;
  packageNameEn: string;
  customerId: string;
  clientNameAr: string;
  clientNameEn: string;
  clientPhone: string;
  totalQty: number;
  usedQty: number;
  soldDate: string;
  expiresAt: string;
  soldReceiptNo: string;
}

export interface CommissionRuleItem {
  id: string;
  nameAr: string;
  nameEn: string;
  kind: 'percent' | 'amount';
  value: number; // percent (e.g. 25) or flat SAR per session (e.g. 40)
}

export interface TherapistProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  initials: string;
  phone: string;
  specialtyAr: string;
  specialtyEn: string;
  skills: ServiceKind[];
  commissionRuleId: string;
  shiftStart: string;
  shiftEnd: string;
  daysOff: string[]; // e.g. ['friday']
  completedSessionsMonth: number;
  revenueMonthSar: number;
  rating: number;
  isActive: boolean;
}

export type RoomLiveState = 'available' | 'occupied' | 'sanitizing' | 'maintenance';

export interface RoomConfig {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  forKind: ServiceKind;
  floorAr: string;
  floorEn: string;
  equipmentAr: string[];
  equipmentEn: string[];
  liveState: RoomLiveState;
  currentClientAr?: string;
  currentClientEn?: string;
  currentTherapistId?: string;
  bufferMinutes: number;
  isActive: boolean;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  barcode: string;
  nameAr: string;
  nameEn: string;
  category: 'oils' | 'hammam' | 'pedicure' | 'retail';
  unitAr: string;
  unitEn: string;
  costSar: number;
  priceSar: number;
  stockQty: number;
  reorderLevel: number;
  supplierAr: string;
  supplierEn: string;
  isActive: boolean;
}

export interface Phase34State {
  packages: PackageCatalogItem[];
  packageSessions: ClientPackageSession[];
  commissionRules: CommissionRuleItem[];
  therapists: TherapistProfile[];
  rooms: RoomConfig[];
  products: InventoryProduct[];
}

import {
  SEED_COMMISSION_RULES,
  SEED_PACKAGES,
  SEED_PACKAGE_SESSIONS,
  SEED_PRODUCTS,
  SEED_ROOMS,
  SEED_THERAPISTS,
} from './seedData';

const STORAGE_KEY = 'oasis-phase34-store-v3';

const DEFAULT_STATE: Phase34State = {
  packages: SEED_PACKAGES,
  packageSessions: SEED_PACKAGE_SESSIONS,
  commissionRules: SEED_COMMISSION_RULES,
  therapists: SEED_THERAPISTS,
  rooms: SEED_ROOMS,
  products: SEED_PRODUCTS,
};

const readState = (): Phase34State => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<Phase34State>;
    return {
      packages: parsed.packages ?? DEFAULT_STATE.packages,
      packageSessions: parsed.packageSessions ?? DEFAULT_STATE.packageSessions,
      commissionRules: parsed.commissionRules ?? DEFAULT_STATE.commissionRules,
      therapists: parsed.therapists ?? DEFAULT_STATE.therapists,
      rooms: parsed.rooms ?? DEFAULT_STATE.rooms,
      products: parsed.products ?? DEFAULT_STATE.products,
    };
  } catch {
    return DEFAULT_STATE;
  }
};

let currentState: Phase34State = typeof window === 'undefined' ? DEFAULT_STATE : readState();
const listeners = new Set<() => void>();

const commit = (next: Phase34State) => {
  currentState = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch {}
  listeners.forEach((l) => l());
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      currentState = readState();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

/* ----------------------------------------------------------------------------
 * Mutations
 * ------------------------------------------------------------------------- */
export const addPackageCatalog = (pkg: Omit<PackageCatalogItem, 'id'>) => {
  commit({
    ...currentState,
    packages: [...currentState.packages, { ...pkg, id: `pkg-${Date.now()}` }],
  });
};

export const updatePackageCatalog = (id: string, patch: Partial<PackageCatalogItem>) => {
  commit({
    ...currentState,
    packages: currentState.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  });
};

export const redeemPackageSession = (sessionId: string) => {
  commit({
    ...currentState,
    packageSessions: currentState.packageSessions.map((ps) =>
      ps.id === sessionId && ps.usedQty < ps.totalQty
        ? { ...ps, usedQty: ps.usedQty + 1 }
        : ps
    ),
  });
};

export const issueClientPackageSession = (entry: Omit<ClientPackageSession, 'id'>) => {
  commit({
    ...currentState,
    packageSessions: [{ ...entry, id: `ps-${Date.now()}` }, ...currentState.packageSessions],
  });
};

export const addTherapistProfile = (th: Omit<TherapistProfile, 'id'>) => {
  commit({
    ...currentState,
    therapists: [...currentState.therapists, { ...th, id: `th-${Date.now()}` }],
  });
};

export const updateTherapistProfile = (id: string, patch: Partial<TherapistProfile>) => {
  commit({
    ...currentState,
    therapists: currentState.therapists.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  });
};

export const updateRoomConfig = (id: string, patch: Partial<RoomConfig>) => {
  commit({
    ...currentState,
    rooms: currentState.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  });
};

export const addRoomConfig = (room: Omit<RoomConfig, 'id'>) => {
  commit({
    ...currentState,
    rooms: [...currentState.rooms, { ...room, id: `rm-${Date.now()}` }],
  });
};

export const adjustProductStock = (id: string, delta: number) => {
  commit({
    ...currentState,
    products: currentState.products.map((p) =>
      p.id === id ? { ...p, stockQty: Math.max(0, p.stockQty + delta) } : p
    ),
  });
};

export const addInventoryProduct = (prod: Omit<InventoryProduct, 'id'>) => {
  commit({
    ...currentState,
    products: [{ ...prod, id: `prd-${Date.now()}` }, ...currentState.products],
  });
};

export function usePhase34Store() {
  const state = useSyncExternalStore(subscribe, () => currentState, () => DEFAULT_STATE);
  return {
    ...state,
    addPackageCatalog,
    updatePackageCatalog,
    redeemPackageSession,
    issueClientPackageSession,
    addTherapistProfile,
    updateTherapistProfile,
    updateRoomConfig,
    addRoomConfig,
    adjustProductStock,
    addInventoryProduct,
  };
}
