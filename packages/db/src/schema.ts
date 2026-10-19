import {
  pgTable, pgEnum, uuid, text, integer, bigint, boolean,
  timestamp, date, time, jsonb, uniqueIndex, index,
} from "drizzle-orm/pg-core";

/* ----------------------------------------------------------------------------
 * Enums
 * ------------------------------------------------------------------------- */
export const serviceKind = pgEnum("service_kind", ["massage", "moroccan_bath", "pedicure", "other"]);
export const partyKind = pgEnum("party_kind", ["customer", "supplier"]);
export const saleStatus = pgEnum("sale_status", ["completed", "voided"]);
export const documentType = pgEnum("document_type", ["388", "381"]); // 388 = Tax Invoice, 381 = Credit Note
export const apptStatus = pgEnum("appt_status", ["booked", "confirmed", "checked_in", "completed", "no_show", "cancelled"]);
export const paymentKind = pgEnum("payment_kind", ["cash", "card", "wallet", "transfer", "package"]);
export const paymentProvider = pgEnum("payment_provider", ["hala", "cash", "bank"]);
export const cardScheme = pgEnum("card_scheme", ["mada", "visa", "mastercard", "apple_pay", "stc_pay"]);
export const discountKind = pgEnum("discount_kind", ["percent", "amount"]);
export const zatcaStatus = pgEnum("zatca_status", ["pending", "reported", "cleared", "rejected"]);
export const supplyCategory = pgEnum("supply_category", ["oils", "scrubs", "towels", "hygiene", "other"]);

/* ----------------------------------------------------------------------------
 * Organization & Branches (Single Branch: JED01)
 * ------------------------------------------------------------------------- */
export const company = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  vatNumber: text("vat_number"),
  crNumber: text("cr_number"),
  currency: text("currency").notNull().default("SAR"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const branches = pgTable("branches", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").notNull().references(() => company.id),
  code: text("code").notNull().unique().default("JED01"),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  key: text("key").notNull(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uq: uniqueIndex("settings_branch_key_uq").on(t.branchId, t.key)
}));

/* ----------------------------------------------------------------------------
 * Users & Roles
 * ------------------------------------------------------------------------- */
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(), // 'admin' | 'cashier'
  permissions: jsonb("permissions").notNull().default("[]"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id"),
  branchId: uuid("branch_id").references(() => branches.id),
  roleId: uuid("role_id").references(() => roles.id),
  fullNameAr: text("full_name_ar").notNull(),
  fullNameEn: text("full_name_en").notNull(),
  pinHash: text("pin_hash"), // scrypt/argon2 hash only
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  authUserUq: uniqueIndex("users_auth_user_uq").on(t.authUserId),
  branchIdx: index("users_branch_idx").on(t.branchId),
}));

/* ----------------------------------------------------------------------------
 * Customers & Parties
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
  balanceHalalas: bigint("balance_halalas", { mode: "number" }).notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  phoneIdx: index("parties_phone_idx").on(t.phone)
}));

/* ----------------------------------------------------------------------------
 * Therapists & Rooms
 * ------------------------------------------------------------------------- */
export const therapists = pgTable("therapists", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  userId: uuid("user_id").references(() => users.id),
  nameEn: text("name_en"),
  nameAr: text("name_ar").notNull(),
  phone: text("phone"),
  skills: jsonb("skills").notNull().default("[]"),
  commissionPercent: integer("commission_percent").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const therapistAvailability = pgTable("therapist_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  therapistId: uuid("therapist_id").notNull().references(() => therapists.id),
  weekday: integer("weekday").notNull(), // 0=Sun .. 6=Sat
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
}, (t) => ({
  therapistIdx: index("therapist_avail_therapist_idx").on(t.therapistId),
  branchIdx: index("therapist_avail_branch_idx").on(t.branchId)
}));

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  code: text("code"),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  floorEn: text("floor_en"),
  floorAr: text("floor_ar"),
  forKind: serviceKind("for_kind"),
  bufferMinutes: integer("buffer_minutes").notNull().default(15),
  liveState: text("live_state").notNull().default("available"),
  isActive: boolean("is_active").notNull().default(true),
});

/* ----------------------------------------------------------------------------
 * Catalog & Internal Consumable Supplies (NO Retail Sales)
 * ------------------------------------------------------------------------- */
export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique(),
  categoryId: uuid("category_id").references(() => serviceCategories.id),
  kind: serviceKind("kind").notNull().default("massage"),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  durationMin: integer("duration_min").notNull().default(60),
  priceHalalas: bigint("price_halalas", { mode: "number" }).notNull(),
  taxRate: integer("tax_rate").notNull().default(15),
  taxable: boolean("taxable").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const packages = pgTable("packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  priceHalalas: bigint("price_halalas", { mode: "number" }).notNull(),
  durationMin: integer("duration_min").notNull().default(60),
  contents: jsonb("contents").notNull().default("[]"),
  validDays: integer("valid_days").notNull().default(365),
  isActive: boolean("is_active").notNull().default(true),
});

export const supplies = pgTable("supplies", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  sku: text("sku").unique(),
  category: supplyCategory("category").notNull().default("oils"),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  unitEn: text("unit_en"),
  unitAr: text("unit_ar"),
  costHalalas: bigint("cost_halalas", { mode: "number" }).notNull().default(0),
  stockQty: integer("stock_qty").notNull().default(0),
  reorderLevel: integer("reorder_level").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

/* ----------------------------------------------------------------------------
 * Appointments & Package Redemptions
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
  source: text("source").notNull().default("walk_in"),
  paid: boolean("paid").notNull().default(false),
  notes: text("notes"),
  saleId: uuid("sale_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  startIdx: index("appt_start_idx").on(t.branchId, t.startsAt),
  therapistIdx: index("appt_therapist_idx").on(t.therapistId, t.startsAt)
}));

export const packageSessions = pgTable("package_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").references(() => branches.id),
  packageId: uuid("package_id").references(() => packages.id),
  customerId: uuid("customer_id").references(() => parties.id),
  serviceId: uuid("service_id").references(() => services.id),
  totalQty: integer("total_qty").notNull(),
  usedQty: integer("used_qty").notNull().default(0),
  expiresAt: date("expires_at"),
  soldSaleId: uuid("sold_sale_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  customerIdx: index("pkg_sess_customer_idx").on(t.customerId),
  branchIdx: index("pkg_sess_branch_idx").on(t.branchId)
}));

/* ----------------------------------------------------------------------------
 * Shifts, Sales, and HALA Payments (APPEND-ONLY)
 * ------------------------------------------------------------------------- */
export const shifts = pgTable("shifts", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  terminalId: text("terminal_id").notNull(),
  status: text("status").notNull().default("open"),
  openedBy: uuid("opened_by").references(() => users.id),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  openingFloatHalalas: bigint("opening_float_halalas", { mode: "number" }).notNull().default(0),
  cashDropsHalalas: bigint("cash_drops_halalas", { mode: "number" }).notNull().default(0),
  closedBy: uuid("closed_by").references(() => users.id),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closingCountHalalas: bigint("closing_count_halalas", { mode: "number" }),
  notes: text("notes"),
});

export const sales = pgTable("sales", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  terminalId: text("terminal_id").notNull().default("T1"),
  shiftId: uuid("shift_id").references(() => shifts.id),
  documentType: documentType("document_type").notNull().default("388"),
  receiptNo: text("receipt_no").notNull(),
  customerId: uuid("customer_id").references(() => parties.id),
  cashierId: uuid("cashier_id").references(() => users.id),
  status: saleStatus("status").notNull().default("completed"),
  subtotalHalalas: bigint("subtotal_halalas", { mode: "number" }).notNull().default(0),
  discountHalalas: bigint("discount_halalas", { mode: "number" }).notNull().default(0),
  taxHalalas: bigint("tax_halalas", { mode: "number" }).notNull().default(0),
  grandTotalHalalas: bigint("grand_total_halalas", { mode: "number" }).notNull().default(0),
  changeHalalas: bigint("change_halalas", { mode: "number" }).notNull().default(0),
  // ZATCA Phase 2 fields
  zatcaUuid: text("zatca_uuid"),
  zatcaIcv: integer("zatca_icv"),
  zatcaPrevHash: text("zatca_prev_hash"),
  zatcaHash: text("zatca_hash"),
  zatcaSignature: text("zatca_signature"),
  zatcaQr: text("zatca_qr"),
  zatcaStatus: zatcaStatus("zatca_status").notNull().default("pending"),
  correctsSaleId: uuid("corrects_sale_id"),
  voidReason: text("void_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  receiptUq: uniqueIndex("sales_receipt_uq").on(t.branchId, t.receiptNo),
  createdIdx: index("sales_created_idx").on(t.branchId, t.createdAt)
}));

export const saleItems = pgTable("sale_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  saleId: uuid("sale_id").notNull().references(() => sales.id),
  serviceId: uuid("service_id").references(() => services.id),
  packageSessionId: uuid("package_session_id").references(() => packageSessions.id),
  therapistId: uuid("therapist_id").references(() => therapists.id),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
  qty: integer("qty").notNull().default(1),
  unitPriceHalalas: bigint("unit_price_halalas", { mode: "number" }).notNull(),
  discountHalalas: bigint("discount_halalas", { mode: "number" }).notNull().default(0),
  taxRate: integer("tax_rate").notNull().default(15),
  lineTotalHalalas: bigint("line_total_halalas", { mode: "number" }).notNull(),
}, (t) => ({
  saleIdx: index("sale_items_sale_idx").on(t.saleId),
  branchIdx: index("sale_items_branch_idx").on(t.branchId)
}));

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  saleId: uuid("sale_id").notNull().references(() => sales.id),
  kind: paymentKind("kind").notNull(),
  provider: paymentProvider("provider").notNull().default("hala"),
  amountHalalas: bigint("amount_halalas", { mode: "number" }).notNull(),
  cardScheme: cardScheme("card_scheme"),
  approvalCode: text("approval_code"), // HALA Approval Code
  rrn: text("rrn"),                     // HALA RRN
  terminalTid: text("terminal_tid"),    // HALA TID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  saleIdx: index("payments_sale_idx").on(t.saleId),
  branchIdx: index("payments_branch_idx").on(t.branchId)
}));

export const discounts = pgTable("discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  kind: discountKind("kind").notNull(),
  value: integer("value").notNull(), // percent or halalas
  startsAt: date("starts_at"),
  endsAt: date("ends_at"),
  isActive: boolean("is_active").notNull().default(true),
});

export const syncQuarantine = pgTable("sync_quarantine", {
  id: uuid("id").primaryKey().defaultRandom(),
  payload: jsonb("payload").notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
