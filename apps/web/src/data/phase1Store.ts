'use client';

import { useSyncExternalStore } from 'react';
import type { Lang } from '@/i18n/config';
import {
  BRANCH_CODE,
  TERMINAL_ID,
  type CompletedSale,
  type PaymentKind,
} from './posData';

/*
 * Shared client-side store for Phase 1 operational tables:
 *  - parties (clients: kind = 'customer')
 *  - services & service_categories
 *  - discounts (promotions)
 *  - sales, sale_items, payments (append-only ledger + ZATCA Phase 2 fields)
 *  - shifts (cash drawer custody & blind Z-report reconciliation)
 *
 * Syncs across tabs via localStorage (just like bookingsStore.ts and settingsStore.ts)
 * so actions in /pos immediately reflect in /dashboard/sales, /dashboard/shifts,
 * and /dashboard/clients.
 */

export interface ClientParty {
  id: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  notesAr: string;
  notesEn: string;
  balanceSar: number; // positive = client credit/prepaid, negative = amount owed
  totalVisits: number;
  totalSpentSar: number;
  lastVisitDate: string;
  packageSessionsRemaining: number;
  preferredTherapistId: string | null;
  isActive: boolean;
}

export type CatalogCategory = 'massage' | 'moroccan-bath' | 'pedicure';

export interface CatalogService {
  id: string;
  code: string;
  category: CatalogCategory;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationMin: number;
  priceSar: number; // VAT-inclusive (KSA 15%)
  taxRate: number;
  taxable: boolean;
  roomKind: CatalogCategory;
  isActive: boolean;
}

export interface PromotionDiscount {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  kind: 'percent' | 'amount';
  value: number; // percent (e.g. 15) or halalas (e.g. 5000 = 50.00 SAR)
  startsAt: string;
  endsAt: string;
  usageCount: number;
  isActive: boolean;
}

export type ZatcaSaleStatus = 'reported' | 'cleared' | 'pending' | 'rejected';

export interface LedgerSaleItem {
  id: string;
  itemId: string;
  nameAr: string;
  nameEn: string;
  therapistId: string | null;
  qty: number;
  unitPriceHalalas: number;
  lineTotalHalalas: number;
}

export interface LedgerPayment {
  id: string;
  kind: PaymentKind;
  amountHalalas: number;
  cardScheme?: string;
  approvalCode?: string;
  rrn?: string;
}

export interface LedgerSale {
  id: string;
  receiptNo: string;
  createdAtIso: string;
  shiftId: string;
  terminalId: string;
  cashierId: string;
  customerId: string | null;
  clientName: string;
  clientPhone?: string;
  status: 'completed' | 'voided';
  subtotalHalalas: number;
  discountHalalas: number;
  discountCode?: string;
  vatHalalas: number;
  grandTotalHalalas: number;
  changeHalalas: number;
  items: LedgerSaleItem[];
  payments: LedgerPayment[];
  // ZATCA Phase 2 fields
  zatcaUuid: string;
  zatcaCounter: number; // ICV
  zatcaHash: string;
  zatcaStatus: ZatcaSaleStatus;
  voidedAtIso?: string;
  voidReason?: string;
  correctsSaleId?: string;
}

export interface ShiftRecord {
  id: string;
  branchCode: string;
  terminalId: string;
  openedBy: string; // cashierId
  openedAtIso: string;
  openingFloatHalalas: number;
  status: 'open' | 'closed';
  closedBy?: string;
  closedAtIso?: string;
  closingCountHalalas?: number; // Blind cash count entered by cashier
  cashDropsHalalas: number; // Cash removed to safe during shift
  notes?: string;
}

export interface Phase1State {
  clients: ClientParty[];
  services: CatalogService[];
  promotions: PromotionDiscount[];
  sales: LedgerSale[];
  shifts: ShiftRecord[];
  nextReceiptSeq: number;
  nextIcv: number;
}

import {
  SEED_CLIENTS,
  SEED_PROMOTIONS,
  SEED_SALES,
  SEED_SERVICES,
  SEED_SHIFTS,
} from './seedData';

const STORAGE_KEY = 'oasis-phase1-store-v3';

const DEFAULT_STATE: Phase1State = {
  clients: SEED_CLIENTS,
  services: SEED_SERVICES,
  promotions: SEED_PROMOTIONS,
  sales: SEED_SALES,
  shifts: SEED_SHIFTS,
  nextReceiptSeq: 1,
  nextIcv: 1,
};

const readState = (): Phase1State => {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<Phase1State>;
    return {
      clients: parsed.clients ?? DEFAULT_STATE.clients,
      services: parsed.services ?? DEFAULT_STATE.services,
      promotions: parsed.promotions ?? DEFAULT_STATE.promotions,
      sales: parsed.sales ?? DEFAULT_STATE.sales,
      shifts: parsed.shifts ?? DEFAULT_STATE.shifts,
      nextReceiptSeq: parsed.nextReceiptSeq ?? DEFAULT_STATE.nextReceiptSeq,
      nextIcv: parsed.nextIcv ?? DEFAULT_STATE.nextIcv,
    };
  } catch {
    return DEFAULT_STATE;
  }
};

let currentState: Phase1State = typeof window === 'undefined' ? DEFAULT_STATE : readState();
const listeners = new Set<() => void>();

const commitState = (next: Phase1State) => {
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
 * Client (parties) mutations
 * ------------------------------------------------------------------------- */
export const addClientParty = (client: Omit<ClientParty, 'id'>) => {
  const newClient: ClientParty = { ...client, id: `cli-${Date.now()}` };
  commitState({ ...currentState, clients: [newClient, ...currentState.clients] });
};

export const updateClientParty = (id: string, patch: Partial<ClientParty>) => {
  commitState({
    ...currentState,
    clients: currentState.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  });
};

/* ----------------------------------------------------------------------------
 * Catalog Service mutations
 * ------------------------------------------------------------------------- */
export const addCatalogService = (service: Omit<CatalogService, 'id'>) => {
  const newService: CatalogService = { ...service, id: `srv-${Date.now()}` };
  commitState({ ...currentState, services: [...currentState.services, newService] });
};

export const updateCatalogService = (id: string, patch: Partial<CatalogService>) => {
  commitState({
    ...currentState,
    services: currentState.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  });
};

/* ----------------------------------------------------------------------------
 * Promotions (Discounts) mutations
 * ------------------------------------------------------------------------- */
export const addPromotionDiscount = (promo: Omit<PromotionDiscount, 'id' | 'usageCount'>) => {
  const newPromo: PromotionDiscount = { ...promo, id: `dc-${Date.now()}`, usageCount: 0 };
  commitState({ ...currentState, promotions: [newPromo, ...currentState.promotions] });
};

export const updatePromotionDiscount = (id: string, patch: Partial<PromotionDiscount>) => {
  commitState({
    ...currentState,
    promotions: currentState.promotions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  });
};

/* ----------------------------------------------------------------------------
 * Sales & ZATCA mutations (append-only ledger)
 * ------------------------------------------------------------------------- */
const makePseudoHash = (seed: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  for (let i = 0; i < 64; i++) {
    h = Math.imul(h ^ (i + 17), 16777619);
    out += chars[(h >>> 0) % chars.length];
  }
  return `${out}==`;
};

export const recordCompletedPosSale = (
  sale: CompletedSale,
  itemNames: Record<string, { ar: string; en: string }>
) => {
  const openShift = currentState.shifts.find((s) => s.status === 'open') ?? currentState.shifts[0];
  const icv = currentState.nextIcv;
  const seq = currentState.nextReceiptSeq;
  const formattedReceipt = `${BRANCH_CODE}-${TERMINAL_ID}-${String(seq).padStart(6, '0')}`;

  const matchedClient = currentState.clients.find(
    (c) =>
      sale.client &&
      (c.nameAr === sale.client.trim() || c.nameEn.toLowerCase() === sale.client.trim().toLowerCase())
  );

  const ledgerSale: LedgerSale = {
    id: `sal-${icv}-${Date.now()}`,
    receiptNo: sale.receiptNo || formattedReceipt,
    createdAtIso: sale.at.toISOString(),
    shiftId: openShift?.id ?? 'shf-20261019-1',
    terminalId: TERMINAL_ID,
    cashierId: sale.cashierId,
    customerId: matchedClient?.id ?? null,
    clientName: sale.client || 'عميل نقدي مباشر',
    clientPhone: matchedClient?.phone,
    status: 'completed',
    subtotalHalalas: sale.subtotal,
    discountHalalas: sale.discount,
    vatHalalas: sale.vat,
    grandTotalHalalas: sale.total,
    changeHalalas: sale.change,
    items: sale.lines.map((l, idx) => ({
      id: `${l.uid}-${idx}`,
      itemId: l.itemId,
      nameAr: itemNames[l.itemId]?.ar ?? l.itemId,
      nameEn: itemNames[l.itemId]?.en ?? l.itemId,
      therapistId: l.therapistId,
      qty: 1,
      unitPriceHalalas: l.price,
      lineTotalHalalas: l.price,
    })),
    payments: sale.payments.map((p, idx) => ({
      id: `pay-${icv}-${idx}`,
      kind: p.kind,
      amountHalalas: p.amount,
      cardScheme: p.kind === 'card' ? 'mada Atheer' : p.kind === 'wallet' ? 'Apple Pay' : undefined,
      approvalCode: p.kind === 'card' || p.kind === 'wallet' ? String(100000 + ((icv * 7919) % 899999)) : undefined,
      rrn: p.kind === 'card' || p.kind === 'wallet' ? `629104${String(100000 + icv)}` : undefined,
    })),
    zatcaUuid: `${icv.toString(16).padStart(8, '0')}-4f2a-4b1c-9d3e-${Date.now().toString(16).slice(-12).padStart(12, '0')}`,
    zatcaCounter: icv,
    zatcaHash: makePseudoHash(`${formattedReceipt}-${sale.total}-${icv}`),
    zatcaStatus: 'reported',
  };

  const updatedClients = matchedClient
    ? currentState.clients.map((c) =>
        c.id === matchedClient.id
          ? {
              ...c,
              totalVisits: c.totalVisits + 1,
              totalSpentSar: c.totalSpentSar + Math.round(sale.total / 100),
              lastVisitDate: sale.at.toISOString().slice(0, 10),
            }
          : c
      )
    : currentState.clients;

  commitState({
    ...currentState,
    sales: [ledgerSale, ...currentState.sales],
    clients: updatedClients,
    nextReceiptSeq: seq + 1,
    nextIcv: icv + 1,
  });
};

export const voidLedgerSale = (saleId: string, reason: string) => {
  commitState({
    ...currentState,
    sales: currentState.sales.map((s) =>
      s.id === saleId
        ? {
            ...s,
            status: 'voided',
            voidedAtIso: new Date().toISOString(),
            voidReason: reason || 'إلغاء فاتورة (إشعار دائن ZATCA)',
          }
        : s
    ),
  });
};

export const reportPendingZatcaSales = () => {
  commitState({
    ...currentState,
    sales: currentState.sales.map((s) =>
      s.zatcaStatus === 'pending' ? { ...s, zatcaStatus: 'reported' } : s
    ),
  });
};

/* ----------------------------------------------------------------------------
 * Shifts & Cash Drawer mutations
 * ------------------------------------------------------------------------- */
export const openNewShift = (cashierId: string, openingFloatHalalas: number, notes?: string) => {
  const newShift: ShiftRecord = {
    id: `shf-${Date.now()}`,
    branchCode: BRANCH_CODE,
    terminalId: TERMINAL_ID,
    openedBy: cashierId,
    openedAtIso: new Date().toISOString(),
    openingFloatHalalas,
    status: 'open',
    cashDropsHalalas: 0,
    notes,
  };
  commitState({
    ...currentState,
    shifts: [newShift, ...currentState.shifts],
  });
};

export const closeActiveShift = (
  shiftId: string,
  closedBy: string,
  closingCountHalalas: number,
  notes?: string
) => {
  commitState({
    ...currentState,
    shifts: currentState.shifts.map((sh) =>
      sh.id === shiftId
        ? {
            ...sh,
            status: 'closed',
            closedBy,
            closedAtIso: new Date().toISOString(),
            closingCountHalalas,
            notes: notes ?? sh.notes,
          }
        : sh
    ),
  });
};

export const addShiftCashDrop = (shiftId: string, amountHalalas: number) => {
  commitState({
    ...currentState,
    shifts: currentState.shifts.map((sh) =>
      sh.id === shiftId
        ? { ...sh, cashDropsHalalas: sh.cashDropsHalalas + amountHalalas }
        : sh
    ),
  });
};

/** Helper to compute takings & drawer reconciliation for any shift */
export function computeShiftSummary(shift: ShiftRecord, allSales: LedgerSale[]) {
  const shiftSales = allSales.filter((s) => s.shiftId === shift.id && s.status === 'completed');
  const voidedCount = allSales.filter((s) => s.shiftId === shift.id && s.status === 'voided').length;

  const byMethod: Record<PaymentKind, number> = {
    cash: 0,
    card: 0,
    wallet: 0,
    transfer: 0,
    package: 0,
  };

  let changeGiven = 0;
  let totalGross = 0;
  let totalDiscount = 0;
  let totalVat = 0;
  let totalNet = 0;

  for (const s of shiftSales) {
    totalGross += s.subtotalHalalas;
    totalDiscount += s.discountHalalas;
    totalVat += s.vatHalalas;
    totalNet += s.grandTotalHalalas;
    changeGiven += s.changeHalalas;
    for (const p of s.payments) {
      byMethod[p.kind] += p.amountHalalas;
    }
  }

  const netCashSales = byMethod.cash - changeGiven;
  const expectedCashHalalas = shift.openingFloatHalalas + netCashSales - shift.cashDropsHalalas;
  const countedHalalas = shift.closingCountHalalas ?? expectedCashHalalas;
  const varianceHalalas = countedHalalas - expectedCashHalalas;

  return {
    ticketCount: shiftSales.length,
    voidedCount,
    byMethod: {
      ...byMethod,
      cash: netCashSales,
    },
    totalGross,
    totalDiscount,
    totalVat,
    totalNet,
    expectedCashHalalas,
    countedHalalas,
    varianceHalalas,
  };
}

export function localizeServiceName(s: CatalogService, lang: Lang) {
  return lang === 'ar' ? s.nameAr : s.nameEn;
}

export function usePhase1Store() {
  const state = useSyncExternalStore(subscribe, () => currentState, () => DEFAULT_STATE);
  return {
    ...state,
    addClientParty,
    updateClientParty,
    addCatalogService,
    updateCatalogService,
    addPromotionDiscount,
    updatePromotionDiscount,
    recordCompletedPosSale,
    voidLedgerSale,
    reportPendingZatcaSales,
    openNewShift,
    closeActiveShift,
    addShiftCashDrop,
  };
}
