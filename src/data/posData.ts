import type { Lang } from '@/i18n/config';
import type { BookableId } from '@/data/dashboardData';

/*
 * Mock POS data. Mirrors plan/schema/schema.ts: discounts, payment_methods (payment_kind),
 * shifts, sales (receipt_no = BRANCH-TERMINAL-SEQ) and sale_items (tax_rate 15, therapist_id).
 * Money is kept in halalas (integer) so VAT and discounts never hit float rounding.
 */

type L = Record<Lang, string>;

export const VAT_RATE = 15;
export const BRANCH_CODE = 'JED01';
export const TERMINAL_ID = 'T1';
export const VAT_NUMBER = '300000000000003';
export const OPENING_FLOAT = 500_00;

// Menu prices are shown to consumers VAT-inclusive (KSA rule), so VAT is extracted, not added
export const vatOf = (inclusive: number) => Math.round((inclusive * VAT_RATE) / (100 + VAT_RATE));

export const toHalalas = (sar: number) => Math.round(sar * 100);

export const fmtMoney = (halalas: number) => (halalas / 100).toFixed(2);

export type PaymentKind = 'cash' | 'card' | 'wallet' | 'transfer';
export const PAYMENT_KINDS: PaymentKind[] = ['cash', 'card', 'wallet', 'transfer'];

export interface Discount {
  id: string;
  name: L;
  kind: 'percent' | 'amount';
  value: number; // percent, or halalas
}

export const DISCOUNTS: Discount[] = [
  { id: 'dc-loyal', name: { en: 'Loyalty 10%', ar: 'ولاء 10%' }, kind: 'percent', value: 10 },
  { id: 'dc-weekday', name: { en: 'Weekday morning 15%', ar: 'صباح أيام الأسبوع 15%' }, kind: 'percent', value: 15 },
  { id: 'dc-50', name: { en: '50 SAR off', ar: 'خصم 50 ريال' }, kind: 'amount', value: 50_00 },
];

export const discountAmount = (d: Discount | undefined, subtotal: number) => {
  if (!d) return 0;
  return Math.min(subtotal, d.kind === 'percent' ? Math.round((subtotal * d.value) / 100) : d.value);
};

export interface Cashier {
  id: string;
  name: L;
  initials: string;
}

export const CASHIERS: Cashier[] = [
  { id: 'u-cash-1', name: { en: 'Huda Salem', ar: 'هدى سالم' }, initials: 'HS' },
  { id: 'u-cash-2', name: { en: 'Rawan Ali', ar: 'روان علي' }, initials: 'RA' },
  { id: 'u-rec-1', name: { en: 'Mona Fares', ar: 'منى فارس' }, initials: 'MF' },
];

export interface TicketLine {
  uid: string;
  itemId: BookableId;
  therapistId: string | null;
  price: number; // halalas, VAT-inclusive
  bookingId?: string;
}

export interface Payment {
  kind: PaymentKind;
  amount: number; // halalas
}

export interface CompletedSale {
  receiptNo: string;
  at: Date;
  cashierId: string;
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
