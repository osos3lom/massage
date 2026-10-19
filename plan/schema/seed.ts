/**
 * Phase 0 seed — mirrors the existing marketing data in src/data/salonData.ts
 * so the POS/dashboard starts with the real واحة الإسترخاء للمساج services & packages.
 *
 * Run after migration, e.g.:
 *   tsx plan/schema/seed.ts
 * with DATABASE_URL pointing at your Supabase Postgres (or local dev db).
 *
 * This is illustrative — wire it to your Drizzle client. Prices in SAR.
 */

import { randomUUID } from "node:crypto";

export const seedCompany = {
  id: randomUUID(),
  nameEn: "Relaxation Oasis Massage",
  nameAr: "واحة الإسترخاء للمساج",
  currency: "SAR",
  vatNumber: "310485920100003", // 15-digit KSA ZATCA VAT registration
  crNumber: "4030291847",       // 10-digit Commercial Registration
};

export const seedBranch = {
  id: randomUUID(),
  companyId: seedCompany.id,
  nameEn: "Al Nuzha · Jeddah",
  nameAr: "فرع النزهة · جدة",
  phone: "+966 55 123 4567",
  address: "طريق الملك فهد الفرعي، حي النزهة، جدة",
};

export const seedServiceCategories = [
  { id: randomUUID(), nameEn: "Massage", nameAr: "المساج", sortOrder: 1 },
  { id: randomUUID(), nameEn: "Moroccan Bath", nameAr: "الحمام المغربي", sortOrder: 2 },
  { id: randomUUID(), nameEn: "Pedicure", nameAr: "البديكير", sortOrder: 3 },
];

// Mapped from src/data/salonData.ts (keep in sync, or generate from it)
export const seedServices = [
  { nameEn: "One-Hour Massage", nameAr: "ساعة مساج", kind: "massage", durationMin: 60, price: "250.00", cat: 0 },
  { nameEn: "45-Minute Massage", nameAr: "45 دقيقة مساج", kind: "massage", durationMin: 45, price: "200.00", cat: 0 },
  { nameEn: "Moroccan Bath", nameAr: "حمام مغربي", kind: "moroccan_bath", durationMin: 45, price: "180.00", cat: 1 },
  { nameEn: "Pedicure", nameAr: "بديكير", kind: "pedicure", durationMin: 45, price: "200.00", cat: 2 },
].map((s) => ({
  id: randomUUID(),
  categoryId: seedServiceCategories[s.cat].id,
  kind: s.kind,
  nameEn: s.nameEn,
  nameAr: s.nameAr,
  durationMin: s.durationMin,
  price: s.price,
}));

export const seedPackages = [
  {
    id: randomUUID(),
    nameEn: "Half-Hour Massage Package",
    nameAr: "باكيج نصف ساعة مساج",
    price: "250.00",
    contents: [], // fill with [{ serviceId, qty }] once service ids are known
    validDays: 365,
  },
];

// Simplified two-role model: admin & cashier
export const seedRoles = [
  {
    id: randomUUID(),
    name: "admin",
    permissions: ["*"],
  },
  {
    id: randomUUID(),
    name: "cashier",
    permissions: ["pos", "sales", "payments", "shifts", "appointments", "customers"],
  },
];

export const seedPaymentMethods = [
  { id: randomUUID(), kind: "cash", nameEn: "Cash", nameAr: "نقدي" },
  { id: randomUUID(), kind: "card", nameEn: "Contactless Card (mada / Visa)", nameAr: "شبكة اللاتلامسية (مدى / فيزا)" },
  { id: randomUUID(), kind: "wallet", nameEn: "Apple Pay / STC Pay", nameAr: "محفظة رقمية (Apple Pay / STC Pay)" },
  { id: randomUUID(), kind: "transfer", nameEn: "Bank Transfer", nameAr: "تحويل بنكي" },
];

export const seedSettings = [
  {
    id: randomUUID(),
    branchId: seedBranch.id,
    key: "working_hours",
    value: {
      bufferMinutes: 15,
      maxAdvanceDays: 30,
      fridayPrayerPause: { enabled: true, start: "11:45", end: "13:15" },
      days: [
        { day: "saturday", open: "10:00", close: "23:30", enabled: true },
        { day: "sunday", open: "10:00", close: "23:30", enabled: true },
        { day: "monday", open: "10:00", close: "23:30", enabled: true },
        { day: "tuesday", open: "10:00", close: "23:30", enabled: true },
        { day: "wednesday", open: "10:00", close: "23:30", enabled: true },
        { day: "thursday", open: "10:00", close: "00:30", enabled: true },
        { day: "friday", open: "13:30", close: "00:30", enabled: true },
      ],
    },
  },
  {
    id: randomUUID(),
    branchId: seedBranch.id,
    key: "zatca_config",
    value: {
      environment: "simulation",
      egsSerialNumber: "1-OASIS|2-POS01|3-9f8e7d6c-5b4a",
      csidStatus: "compliance",
      invoiceCounter: 142,
      lastInvoiceHash: "NWU4Y2I1YzQ3NTI4ZGY5YjkxYzA0ZDMxN2Q4MjI1YzE5NTQ3Y2I5YzA3YzA2NDFmZWEyNDU3ODkwMTIzNDU2Nw==",
      autoReport24h: true,
    },
  },
  {
    id: randomUUID(),
    branchId: seedBranch.id,
    key: "payment_terminals",
    value: {
      mode: "semi_integrated",
      provider: "geidea",
      connection: "tcp_ip",
      terminalIp: "192.168.1.45",
      terminalPort: 8080,
      terminalId: "GEID-JED-0041",
      timeoutSec: 60,
      nfcTapEnabled: true,
      autoPrintBankSlip: false,
    },
  },
  {
    id: randomUUID(),
    branchId: seedBranch.id,
    key: "printer_config",
    value: {
      thermal: {
        enabled: true,
        model: "Epson TM-T88VI (80mm ESC/POS)",
        connection: "tcp_ip",
        ip: "192.168.1.50",
        port: 9100,
        paperWidth: "80mm",
        rasterArabic: true,
        autoCut: true,
        kickCashDrawer: true,
      },
      carbon: {
        enabled: true,
        model: "Epson TM-U220B / LX-350 Impact Carbon",
        connection: "usb",
        portName: "USB001 (Virtual Printer Port)",
        plyCount: 2,
        autoDuplicateCopy: true,
      },
    },
  },
];

// TODO: insert all of the above with your Drizzle client inside a transaction,
// in dependency order: company -> branches -> roles -> payment_methods ->
// service_categories -> services -> packages -> settings.
