import type { Lang } from '@/i18n/config';
import type { BookableId } from '@/data/dashboardData';
import {
  SEED_COMPANY_AND_BRANCH,
  SEED_PROMOTIONS,
  SEED_STAFF,
} from './seedData';

/*
 * POS constants & initial state derived from the unified `src/data/seedData.ts`.
 * Money is kept in halalas (integer) so VAT and discounts never hit float rounding.
 */

type L = Record<Lang, string>;

export const VAT_RATE = SEED_COMPANY_AND_BRANCH.vatRatePercent;
export const BRANCH_CODE = SEED_COMPANY_AND_BRANCH.branchCode;
export const TERMINAL_ID = SEED_COMPANY_AND_BRANCH.terminalId;
export const VAT_NUMBER = SEED_COMPANY_AND_BRANCH.vatNumber;
export const OPENING_FLOAT = Math.round(SEED_COMPANY_AND_BRANCH.defaultOpeningFloatSar * 100);

// Menu prices are shown to consumers VAT-inclusive (KSA rule), so VAT is extracted, not added
export const vatOf = (inclusive: number) => Math.round((inclusive * VAT_RATE) / (100 + VAT_RATE));

export const toHalalas = (sar: number) => Math.round(sar * 100);

export const fmtMoney = (halalas: number) => (halalas / 100).toFixed(2);

export type PaymentKind = 'cash' | 'card' | 'wallet' | 'transfer' | 'package';
export const PAYMENT_KINDS: PaymentKind[] = ['cash', 'card', 'wallet', 'transfer', 'package'];

export interface Discount {
  id: string;
  name: L;
  kind: 'percent' | 'amount';
  value: number; // percent, or halalas
}

export const DISCOUNTS: Discount[] = SEED_PROMOTIONS.filter((p) => p.isActive).map((p) => ({
  id: p.id,
  name: { en: p.nameEn, ar: p.nameAr },
  kind: p.kind,
  value: p.value,
}));

export const discountAmount = (d: Discount | undefined, subtotal: number) => {
  if (!d) return 0;
  return Math.min(subtotal, d.kind === 'percent' ? Math.round((subtotal * d.value) / 100) : d.value);
};

export interface Cashier {
  id: string;
  name: L;
  initials: string;
  pinCode?: string;
  role?: 'admin' | 'cashier';
}

export const CASHIERS: Cashier[] = SEED_STAFF.filter((s) => s.isActive).map((s) => {
  const parts = s.fullNameEn.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
      : s.fullNameEn.slice(0, 2).toUpperCase() || 'ST';
  return {
    id: s.id,
    name: { en: s.fullNameEn, ar: s.fullNameAr },
    initials,
    pinCode: s.pinCode,
    role: s.role,
  };
});

export interface TicketLine {
  uid: string;
  itemId: BookableId | string;
  itemName?: L;
  productId?: string;
  isProduct?: boolean;
  therapistId: string | null;
  price: number; // halalas, VAT-inclusive
  bookingId?: string;
}

export interface Payment {
  kind: PaymentKind;
  amount: number; // halalas
  packageSessionId?: string;
}

export interface CompletedSale {
  receiptNo: string;
  at: Date;
  cashierId: string;
  cashierName?: L;
  client: string;
  lines: TicketLine[];
  subtotal: number;
  discount: number;
  total: number;
  vat: number;
  payments: Payment[];
  change: number;
}

export const receiptNo = (seq: number) => `${BRANCH_CODE}-${TERMINAL_ID}-${String(seq).padStart(6, '0')}`;
