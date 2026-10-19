/**
 * واحة الإسترخاء للمساج — Phase 0 database schema (Drizzle ORM, Postgres / Supabase)
 * ---------------------------------------------------------------------
 * Design rules (offline-first):
 *  - Primary keys are UUIDs. Generate them ON THE DEVICE (app side) so two
 *    offline POS terminals never collide. `defaultRandom()` is only a fallback
 *    for rows created directly in the cloud.
 *  - Money is `numeric(12,2)`. Never use float for money.
 *  - Sales & payments are APPEND-ONLY. Corrections = new rows. Soft-delete via
 *    `voided_at` instead of hard deletes (mirrors APEX's `willDelete` pattern).
 *  - Every operational table carries `branch_id`, `created_at`, `updated_at`
 *    and a `synced_at` (null until PowerSync confirms upload) for diagnostics.
 *
 * This is the Phase 0 foundation: catalog, people, sales, payments, shifts,
 * scheduling, packages, and settings. Extend in later phases (einvoice_*,
 * stock movements, commissions runs, memberships billing).
 */

import {
  pgTable, pgEnum, uuid, text, numeric, integer, boolean,
  timestamp, date, time, jsonb, uniqueIndex, index,
} from "drizzle-orm/pg-core";

/* ----------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */
export const serviceKind = pgEnum("service_kind", ["massage", "moroccan_bath", "pedicure", "other"]);
export const partyKind = pgEnum("party_kind", ["customer", "supplier"]);
export const saleStatus = pgEnum("sale_status", ["open", "completed", "voided"]);
export const apptStatus = pgEnum("appt_status", ["booked", "confirmed", "checked_in", "completed", "no_show", "cancelled"]);
export const paymentKind = pgEnum("payment_kind", ["cash", "card", "transfer", "wallet", "package", "complimentary"]);
export const discountKind = pgEnum("discount_kind", ["percent", "amount"]);
export const zatcaStatus = pgEnum("zatca_status", ["pending", "reported", "cleared", "rejected"]);

/* ----------------------------------------------------------------------------
 * Org / config
 * ------------------------------------------------------------------------- */
export const company = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  vatNumber: text("vat_number"),          // ZATCA 15-digit VAT number
  crNumber: text("cr_number"),            // commercial registration (10 digits)
  currency: text("currency").notNull().default("SAR"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => company.id),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Key/value settings, scoped per branch (null = global).
 * Standard keys:
 *  - 'working_hours'         (weekly schedule, Friday prayer pause, session buffer)
 *  - 'zatca_config'          (Phase 2 CSID, binary security token, ICV, PIH)
 *  - 'payment_terminals'     (contactless terminal SDK config: Geidea/Moyasar/HyperPay)
 *  - 'printer_config'        (80mm ESC/POS thermal + 2-ply dot-matrix carbon printer)
 */
export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ uq: uniqueIndex("settings_branch_key_uq").on(t.branchId, t.key).nullsNotDistinct() }));

/* ----------------------------------------------------------------------------
 * Access control (links to Supabase auth.users via auth_user_id)
 * Simplified two-role model: 'admin' and 'cashier'
 * ------------------------------------------------------------------------- */
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),          // 'admin' | 'cashier'
  permissions: jsonb("permissions").notNull().default("[]"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id"),               // = auth.users.id (Supabase Auth)
  branchId: uuid("branch_id").references(() => branches.id),
  roleId: uuid("role_id").references(() => roles.id),
  fullName: text("full_name").notNull(),
  // 4-6 digit POS fast-login PIN — store a HASH only, never plain text.
  pinHash: text("pin_hash"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  authUserUq: uniqueIndex("users_auth_user_uq").on(t.authUserId),
  branchIdx: index("users_branch_idx").on(t.branchId),
}));

/* ----------------------------------------------------------------------------
 * People: customers & suppliers
 * ------------------------------------------------------------------------- */
export const parties = pgTable("parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  kind: partyKind("kind").notNull().default("customer"),
  nameEn: text("name_en"),
  nameAr: text("name_ar").notNull(),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0"), // credit/debt
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ phoneIdx: index("parties_phone_idx").on(t.phone) }));

export const therapists = pgTable("therapists", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  userId: uuid("user_id").references(() => users.id),   // optional login
  nameEn: text("name_en"),
  nameAr: text("name_ar").notNull(),
  phone: text("phone"),
  skills: jsonb("skills").notNull().default("[]"),      // service_kind[] they can perform
  commissionRuleId: uuid("commission_rule_id"),         // -> commission_rules.id
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const therapistAvailability = pgTable("therapist_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  therapistId: uuid("therapist_id").notNull().references(() => therapists.id),
  weekday: integer("weekday").notNull(),               // 0=Sun .. 6=Sat
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
}, (t) => ({
  therapistIdx: index("therapist_avail_therapist_idx").on(t.therapistId),
}));

/* ----------------------------------------------------------------------------
 * Catalog: services, products, rooms
 * ------------------------------------------------------------------------- */
export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique(),                          // e.g. 'msg-60', 'msg-45', 'bath', 'pedicure'
  categoryId: uuid("category_id").references(() => serviceCategories.id),
  kind: serviceKind("kind").notNull().default("massage"),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  durationMin: integer("duration_min").notNull().default(60),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  taxable: boolean("taxable").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  sku: text("sku").unique(),
  category: text("category"),                           // 'oils' | 'scrubs' | 'towels' | 'retail'
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  barcode: text("barcode"),
  unitEn: text("unit_en"),
  unitAr: text("unit_ar"),
  supplierEn: text("supplier_en"),
  supplierAr: text("supplier_ar"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  stockQty: numeric("stock_qty", { precision: 12, scale: 3 }).notNull().default("0"),
  reorderLevel: numeric("reorder_level", { precision: 12, scale: 3 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
}, (t) => ({ barcodeIdx: index("products_barcode_idx").on(t.barcode) }));

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  code: text("code"),                                   // e.g. 'R-101', 'H-01'
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  floorEn: text("floor_en"),
  floorAr: text("floor_ar"),
  forKind: serviceKind("for_kind"),                    // null = any
  equipment: jsonb("equipment").notNull().default("[]"),
  bufferMinutes: integer("buffer_minutes").notNull().default(15),
  isActive: boolean("is_active").notNull().default(true),
});

/* ----------------------------------------------------------------------------
 * Packages / memberships (redeemable session cards)
 * ------------------------------------------------------------------------- */
export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique(),                          // e.g. 'pkg-1', 'pkg-2', 'pkg-3', 'pkg-4'
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  durationMin: integer("duration_min").notNull().default(60),
  // e.g. [{ serviceId, qty }] — defined sessions included
  contents: jsonb("contents").notNull().default("[]"),
  validDays: integer("valid_days").notNull().default(365),
  isHighlighted: boolean("is_highlighted").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

/* ----------------------------------------------------------------------------
 * Scheduling: appointments
 * ------------------------------------------------------------------------- */
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  customerId: uuid("customer_id").references(() => parties.id),
  serviceId: uuid("service_id").references(() => services.id),
  packageId: uuid("package_id").references(() => packages.id),
  therapistId: uuid("therapist_id").references(() => therapists.id),
  roomId: uuid("room_id").references(() => rooms.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: apptStatus("status").notNull().default("booked"),
  source: text("source").notNull().default("walk_in"), // 'walk_in' | 'phone' | 'whatsapp' | 'web'
  paid: boolean("paid").notNull().default(false),
  notes: text("notes"),
  saleId: uuid("sale_id"),                              // set when checked out -> sales.id
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  startIdx: index("appt_start_idx").on(t.branchId, t.startsAt),
  therapistIdx: index("appt_therapist_idx").on(t.therapistId, t.startsAt),
  roomIdx: index("appt_room_idx").on(t.roomId, t.startsAt),
}));

/** A package bought by a customer, with remaining redeemable sessions. */
export const packageSessions = pgTable("package_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  packageId: uuid("package_id").references(() => packages.id),
  customerId: uuid("customer_id").references(() => parties.id),
  serviceId: uuid("service_id").references(() => services.id),
  totalQty: integer("total_qty").notNull(),
  usedQty: integer("used_qty").notNull().default(0),
  expiresAt: date("expires_at"),
  soldSaleId: uuid("sold_sale_id"),                    // the sale that sold the package
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  customerIdx: index("pkg_sess_customer_idx").on(t.customerId),
  branchIdx: index("pkg_sess_branch_idx").on(t.branchId),
}));

/* ----------------------------------------------------------------------------
 * Sales (tickets) — APPEND-ONLY
 * ------------------------------------------------------------------------- */
export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  terminalId: text("terminal_id").notNull(),           // physical POS identifier
  status: text("status").notNull().default("open"),    // 'open' | 'closed'
  openedBy: uuid("opened_by").references(() => users.id),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  openingFloat: numeric("opening_float", { precision: 12, scale: 2 }).notNull().default("0"),
  cashDrops: numeric("cash_drops", { precision: 12, scale: 2 }).notNull().default("0"),
  closedBy: uuid("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closingCount: numeric("closing_count", { precision: 12, scale: 2 }),
  notes: text("notes"),
});

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  terminalId: text("terminal_id").notNull(),
  shiftId: uuid("shift_id").references(() => shifts.id),
  // Offline-safe human number: BRANCH-TERMINAL-SEQ (assigned on device)
  receiptNo: text("receipt_no").notNull(),
  customerId: uuid("customer_id").references(() => parties.id),
  cashierId: uuid("cashier_id").references(() => users.id),
  status: saleStatus("status").notNull().default("open"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discountTotal: numeric("discount_total", { precision: 12, scale: 2 }).notNull().default("0"),
  taxTotal: numeric("tax_total", { precision: 12, scale: 2 }).notNull().default("0"),
  grandTotal: numeric("grand_total", { precision: 12, scale: 2 }).notNull().default("0"),
  // ZATCA Phase 2 fields computed on device at completion time
  zatcaUuid: text("zatca_uuid"),
  zatcaCounter: integer("zatca_counter"),               // ICV (Sequential Invoice Counter)
  zatcaPrevHash: text("zatca_prev_hash"),               // PIH (Previous Invoice Hash SHA-256)
  zatcaHash: text("zatca_hash"),                        // Current XML SHA-256 hash
  zatcaSignature: text("zatca_signature"),              // ECDSA secp256k1 cryptographic stamp
  zatcaQr: text("zatca_qr"),                            // Base64 TLV QR (Tags 1–9)
  zatcaStatus: zatcaStatus("zatca_status").notNull().default("pending"),
  zatcaReportedAt: timestamp("zatca_reported_at", { withTimezone: true }),
  voidedAt: timestamp("voided_at", { withTimezone: true }),
  correctsSaleId: uuid("corrects_sale_id"),            // if this is a correcting sale
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
}, (t) => ({
  receiptUq: uniqueIndex("sales_receipt_uq").on(t.branchId, t.receiptNo),
  createdIdx: index("sales_created_idx").on(t.branchId, t.createdAt),
}));

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id").notNull().references(() => sales.id),
  serviceId: uuid("service_id").references(() => services.id),
  productId: uuid("product_id").references(() => products.id),
  therapistId: uuid("therapist_id").references(() => therapists.id),   // for commission
  packageSessionId: uuid("package_session_id").references(() => packageSessions.id), // redemption
  description: text("description").notNull(),
  qty: numeric("qty", { precision: 12, scale: 3 }).notNull().default("1"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  discountKind: discountKind("discount_kind"),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull().default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).notNull().default("15"), // KSA VAT 15%
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
}, (t) => ({
  saleIdx: index("sale_items_sale_idx").on(t.saleId),
  therapistIdx: index("sale_items_therapist_idx").on(t.therapistId),
}));

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: paymentKind("kind").notNull(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  saleId: uuid("sale_id").notNull().references(() => sales.id),
  methodId: uuid("method_id").references(() => paymentMethods.id),
  kind: paymentKind("kind").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reference: text("reference"),                         // card auth code / transfer ref
  cardScheme: text("card_scheme"),                      // mada, visa, mastercard, apple_pay, stc_pay
  approvalCode: text("approval_code"),                  // Semi-integrated terminal auth code
  rrn: text("rrn"),                                     // Retrieval Reference Number (12 digits)
  terminalId: text("terminal_id"),                      // Bank terminal TID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  saleIdx: index("payments_sale_idx").on(t.saleId),
}));

/* ----------------------------------------------------------------------------
 * Promotions & commissions
 * ------------------------------------------------------------------------- */
export const discounts = pgTable("discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique(),                          // e.g. 'OASIS10'
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  kind: discountKind("kind").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  startsAt: date("starts_at"),
  endsAt: date("ends_at"),
  isActive: boolean("is_active").notNull().default(true),
});

export const commissionRules = pgTable("commission_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  kind: discountKind("kind").notNull().default("percent"), // percent of service, or flat amount
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
});
