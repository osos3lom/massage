'use client';

import { useSyncExternalStore } from 'react';
import type { Role } from '@/components/dashboard/nav';

export type DayKey =
  | 'saturday'
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday';

export interface WorkingDayConfig {
  key: DayKey;
  open: string;
  close: string;
  enabled: boolean;
}

export interface PaymentMethodConfig {
  id: string;
  kind: 'cash' | 'card' | 'wallet' | 'transfer';
  nameAr: string;
  nameEn: string;
  schemes: string[];
  contactless: boolean;
  enabled: boolean;
}

export interface StaffMemberConfig {
  id: string;
  fullNameAr: string;
  fullNameEn: string;
  email: string;
  role: Role; // strictly 'admin' | 'cashier'
  pinCode: string; // 4-digit PIN (hashed into users.pin_hash on save)
  pinHashPreview: string;
  isActive: boolean;
}

export interface SettingsState {
  company: {
    nameAr: string;
    nameEn: string;
    vatNumber: string;
    crNumber: string;
    currency: string;
    branchNameAr: string;
    branchNameEn: string;
    phone: string;
    addressAr: string;
    addressEn: string;
    isActive: boolean;
  };
  supabase: {
    projectUrl: string;
    publishableKeyMasked: string;
    syncEngine: 'powersync' | 'realtime';
    storageBucket: string;
    rlsActive: boolean;
    zatcaEdgeFunction: string;
    paymentWebhookFunction: string;
  };
  zatca: {
    environment: 'sandbox' | 'simulation' | 'production';
    egsSerialNumber: string;
    csidStatus: 'unregistered' | 'compliance' | 'production';
    otpCode: string;
    binarySecurityToken: string;
    ecdsaCurve: 'secp256k1';
    invoiceCounter: number;
    prevInvoiceHash: string;
    autoReport24h: boolean;
    lastReportedAt: string;
  };
  workingHours: {
    bufferMinutes: number;
    maxAdvanceDays: number;
    fridayPrayerPause: {
      enabled: boolean;
      start: string;
      end: string;
    };
    days: WorkingDayConfig[];
  };
  payments: {
    mode: 'semi_integrated' | 'standalone';
    provider: 'geidea' | 'moyasar' | 'hyperpay' | 'neoleap';
    connection: 'tcp_ip' | 'usb' | 'bluetooth';
    terminalIp: string;
    terminalPort: number;
    terminalId: string;
    timeoutSec: number;
    nfcTapEnabled: boolean;
    autoPrintBankSlip: boolean;
    methods: PaymentMethodConfig[];
  };
  printers: {
    thermal: {
      enabled: boolean;
      model: string;
      connection: 'tcp_ip' | 'usb' | 'bluetooth';
      ip: string;
      port: number;
      paperWidth: '80mm' | '58mm';
      rasterArabic: boolean;
      autoCut: boolean;
      kickCashDrawer: boolean;
    };
    carbon: {
      enabled: boolean;
      model: string;
      connection: 'usb' | 'serial' | 'tcp_ip';
      portName: string;
      plyCount: 2 | 3;
      autoDuplicateCopy: boolean;
      impactDensity: 'standard' | 'high';
    };
    receiptHeaderAr: string;
    receiptHeaderEn: string;
    receiptFooterAr: string;
    receiptFooterEn: string;
  };
  staff: StaffMemberConfig[];
}

import {
  SEED_COMPANY_AND_BRANCH,
  SEED_INTEGRATIONS,
  SEED_PAYMENT_METHODS,
  SEED_STAFF,
  SEED_WORKING_HOURS,
} from './seedData';

export const DEFAULT_SETTINGS: SettingsState = {
  company: {
    nameAr: SEED_COMPANY_AND_BRANCH.companyNameAr,
    nameEn: SEED_COMPANY_AND_BRANCH.companyNameEn,
    vatNumber: SEED_COMPANY_AND_BRANCH.vatNumber,
    crNumber: SEED_COMPANY_AND_BRANCH.crNumber,
    currency: SEED_COMPANY_AND_BRANCH.currency,
    branchNameAr: SEED_COMPANY_AND_BRANCH.branchNameAr,
    branchNameEn: SEED_COMPANY_AND_BRANCH.branchNameEn,
    phone: SEED_COMPANY_AND_BRANCH.phone,
    addressAr: SEED_COMPANY_AND_BRANCH.addressAr,
    addressEn: SEED_COMPANY_AND_BRANCH.addressEn,
    isActive: SEED_COMPANY_AND_BRANCH.isActive,
  },
  supabase: { ...SEED_INTEGRATIONS.supabase },
  zatca: { ...SEED_INTEGRATIONS.zatca },
  workingHours: {
    bufferMinutes: SEED_WORKING_HOURS.bufferMinutes,
    maxAdvanceDays: SEED_WORKING_HOURS.maxAdvanceDays,
    fridayPrayerPause: { ...SEED_WORKING_HOURS.fridayPrayerPause },
    days: SEED_WORKING_HOURS.days,
  },
  payments: {
    ...SEED_INTEGRATIONS.paymentTerminal,
    methods: SEED_PAYMENT_METHODS,
  },
  printers: {
    thermal: { ...SEED_INTEGRATIONS.printers.thermal },
    carbon: { ...SEED_INTEGRATIONS.printers.carbon },
    receiptHeaderAr: SEED_INTEGRATIONS.printers.receiptHeaderAr,
    receiptHeaderEn: SEED_INTEGRATIONS.printers.receiptHeaderEn,
    receiptFooterAr: SEED_INTEGRATIONS.printers.receiptFooterAr,
    receiptFooterEn: SEED_INTEGRATIONS.printers.receiptFooterEn,
  },
  staff: SEED_STAFF,
};

/**
 * Generates a realistic ZATCA Phase 2 TLV Base64 string for Tags 1–9
 * so the Settings UI & Receipt preview can display and verify real TLV encoding.
 */
export function encodeZatcaTlvPreview(params: {
  sellerName: string;
  vatNumber: string;
  timestampIso: string;
  totalWithVat: string;
  vatTotal: string;
  xmlHash: string;
  ecdsaSignature: string;
  publicKey: string;
  csidStamp: string;
}): { base64: string; tags: { tag: number; label: string; value: string }[] } {
  const tags = [
    { tag: 1, label: 'Seller Name', value: params.sellerName },
    { tag: 2, label: 'VAT Registration', value: params.vatNumber },
    { tag: 3, label: 'Timestamp (ISO 8601)', value: params.timestampIso },
    { tag: 4, label: 'Invoice Total (incl. VAT)', value: params.totalWithVat },
    { tag: 5, label: 'VAT Total (15%)', value: params.vatTotal },
    { tag: 6, label: 'XML Invoice Hash (SHA-256)', value: params.xmlHash },
    { tag: 7, label: 'ECDSA Digital Signature', value: params.ecdsaSignature },
    { tag: 8, label: 'ECDSA Public Key (secp256k1)', value: params.publicKey },
    { tag: 9, label: 'CSID Cryptographic Stamp', value: params.csidStamp },
  ];

  const encoder = new TextEncoder();
  const chunks: number[] = [];
  for (const item of tags) {
    const bytes = encoder.encode(item.value);
    const len = Math.min(bytes.length, 255);
    chunks.push(item.tag, len, ...bytes.slice(0, len));
  }

  let binary = '';
  for (const b of chunks) {
    binary += String.fromCharCode(b);
  }
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : '';
  return { base64, tags };
}

const STORAGE_KEY = 'aura-settings-v2';

const readStorage = (): SettingsState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      return {
        company: { ...DEFAULT_SETTINGS.company, ...parsed.company },
        supabase: { ...DEFAULT_SETTINGS.supabase, ...parsed.supabase },
        zatca: { ...DEFAULT_SETTINGS.zatca, ...parsed.zatca },
        workingHours: {
          ...DEFAULT_SETTINGS.workingHours,
          ...parsed.workingHours,
          days: parsed.workingHours?.days ?? DEFAULT_SETTINGS.workingHours.days,
        },
        payments: {
          ...DEFAULT_SETTINGS.payments,
          ...parsed.payments,
          methods: parsed.payments?.methods ?? DEFAULT_SETTINGS.payments.methods,
        },
        printers: {
          ...DEFAULT_SETTINGS.printers,
          ...parsed.printers,
          thermal: { ...DEFAULT_SETTINGS.printers.thermal, ...parsed.printers?.thermal },
          carbon: { ...DEFAULT_SETTINGS.printers.carbon, ...parsed.printers?.carbon },
        },
        staff: parsed.staff ?? DEFAULT_SETTINGS.staff,
      };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

let state: SettingsState = typeof window === 'undefined' ? DEFAULT_SETTINGS : readStorage();
const listeners = new Set<() => void>();

const commit = (next: SettingsState) => {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
};

export const updateSettings = (updater: (prev: SettingsState) => SettingsState) => {
  commit(updater(state));
};

export const resetSettingsToDefault = () => {
  commit(DEFAULT_SETTINGS);
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      state = readStorage();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

export function useSettingsStore() {
  const snap = useSyncExternalStore(subscribe, () => state, () => DEFAULT_SETTINGS);
  return {
    settings: snap,
    updateSettings,
    resetSettingsToDefault,
  };
}
