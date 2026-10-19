/**
 * Phase 0 seed — mirrors the existing marketing data in src/data/salonData.ts
 * so the POS/dashboard starts with the real Aura Spa services & packages.
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
  nameEn: "Aura Spa & Salon",
  nameAr: "أورا سبا",
  currency: "SAR",
  vatNumber: null, // fill from client's ZATCA registration
};

export const seedBranch = {
  id: randomUUID(),
  companyId: seedCompany.id,
  nameEn: "Main Branch",
  nameAr: "الفرع الرئيسي",
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

export const seedRoles = [
  { id: randomUUID(), name: "owner", permissions: ["*"] },
  { id: randomUUID(), name: "admin", permissions: ["*"] },
  { id: randomUUID(), name: "reception", permissions: ["appointments", "customers", "sales"] },
  { id: randomUUID(), name: "cashier", permissions: ["sales", "payments", "shifts"] },
  { id: randomUUID(), name: "therapist", permissions: ["appointments:self"] },
];

export const seedPaymentMethods = [
  { id: randomUUID(), kind: "cash", nameEn: "Cash", nameAr: "نقدي" },
  { id: randomUUID(), kind: "card", nameEn: "Card (mada/Visa)", nameAr: "شبكة" },
  { id: randomUUID(), kind: "transfer", nameEn: "Bank Transfer", nameAr: "تحويل بنكي" },
];

// TODO: insert all of the above with your Drizzle client inside a transaction,
// in dependency order: company -> branches -> roles -> payment_methods ->
// service_categories -> services -> packages.
