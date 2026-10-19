'use client';

/**
 * ============================================================================
 * واحة الإسترخاء للمساج (Relaxation Oasis Massage)
 * UNIFIED MASTER SEED & DATA STORE — `src/data/seedData.ts`
 * ============================================================================
 *
 * This file is the SINGLE SOURCE OF TRUTH for:
 *  1. Initial Database Seed Data (Company, Branch, Staff, Official Services,
 *     Official Packages, Rooms, Therapists, Payment Methods, ZATCA/Hardware).
 *  2. Public Landing Page Content (Services, Packages, Gallery, FAQs, Reviews).
 *  3. Reactive Client Stores & Helpers (`usePhase1Store`, `usePhase34Store`,
 *     `useSettingsStore`, `useBookingsStore`, `getSalonData`).
 *
 * Legend for Part 1 (Editable Seed Data):
 *  - [REQUIRED] : Must be filled/verified before live POS / Supabase seeding.
 *  - [OPTIONAL] : Can be left empty `[]` or `''` now and added later via `/dashboard`.
 */

import { useSyncExternalStore } from 'react';
import type { Lang } from '@/i18n/config';
import type { Role } from '@/components/dashboard/nav';
import { SITE_IMAGES } from '@/data/siteImages';

/* ============================================================================
 * PART 1 — EDITABLE MASTER SEED DATA (EDIT BELOW BEFORE PHASE B)
 * ========================================================================== */

/**
 * 1. COMPANY & PRIMARY BRANCH — [REQUIRED]
 * Maps to `company` and `branches` tables in `plan/schema/schema.ts`,
 * and also powers the public landing page contact/footer section.
 */
export const SEED_COMPANY_AND_BRANCH = {
  // [REQUIRED] Legal entity name in Arabic & English (printed on 80mm & ZATCA receipts)
  companyNameAr: 'واحة الإسترخاء للمساج',
  companyNameEn: 'Relaxation Oasis Massage',

  // [REQUIRED for ZATCA] 15-digit VAT Registration Number (starts and ends with 3)
  // Leave '' if not VAT-registered yet.
  vatNumber: '',

  // [OPTIONAL] 10-digit Commercial Registration (السجل التجاري)
  crNumber: '',

  // [REQUIRED] ISO Currency code & VAT percentage
  currency: 'SAR',
  vatRatePercent: 0,

  // [REQUIRED] Short branch & POS terminal codes used in receipt numbers (e.g. JED01-T1-000001)
  branchCode: 'JED01',
  terminalId: 'T1',

  // [REQUIRED] Default opening cash float in SAR for new shifts (e.g. 500 SAR)
  defaultOpeningFloatSar: 0,

  // [REQUIRED] Primary Branch name in Arabic & English
  branchNameAr: 'فرع النزهة, شارع حراء · جدة',
  branchNameEn: 'Al Nuzha · Jeddah',

  // [REQUIRED] Branch contact phone / WhatsApp & public email
  phone: '+966579590090', // e.g. '+966579590090'
  email: 'ooasisrelax@gmail.com', // e.g. 'info@relaxation-oasis.sa'

  // [OPTIONAL] Physical branch address in Arabic & English
  addressAr: 'شارع حراء، حي النزهة، جدة، المملكة العربية السعودية',
  addressEn: 'Heraa st, Al Nuzha District, Jeddah, Saudi Arabia',

  // [OPTIONAL] Google Maps embed URL for the public landing page Contact section
  mapCoordinates:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1252.703885982852!2d39.16198415110974!3d21.615436879324385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c3d114824c145f%3A0x2cfb0b4d96280475!2z2YXYsdmD2LIg2YjYp9it2Kkg2KfZhNin2LPYqtix2K7Yp9ih!5e1!3m2!1sen!2ssa!4v1792404036019!5m2!1sen!2ssa',

  isActive: true,
};

/**
 * 2. WORKING HOURS & SCHEDULE — [REQUIRED]
 * Unified single source of truth for the public website, POS, and Dashboard.
 * Maps to `settings` table (`key = 'working_hours'`).
 * Schedule: Open daily 3:00 PM (15:00) to 5:00 AM (05:00), except Friday 4:00 PM (16:00) to 5:00 AM (05:00).
 */
export const SEED_WORKING_HOURS: {
  dayStartHour: number; // Calendar timeline start hour (15 = 3:00 PM)
  dayEndHour: number; // Calendar timeline end hour (29 = 24 + 5 = 5:00 AM next day)
  bufferMinutes: number; // Room sanitizing / linen reset buffer between bookings
  maxAdvanceDays: number;
  fridayPrayerPause: {
    enabled: boolean;
    start: string;
    end: string;
  };
  publicDisplay: {
    satToThu: { en: string; ar: string };
    friday: { en: string; ar: string };
  };
  days: WorkingDayConfig[];
} = {
  dayStartHour: 15,
  dayEndHour: 29,
  bufferMinutes: 15,
  maxAdvanceDays: 30,
  fridayPrayerPause: {
    enabled: false,
    start: '11:45',
    end: '13:15',
  },
  publicDisplay: {
    satToThu: { en: '03:00 PM - 05:00 AM', ar: '03:00 م - 05:00 ص' },
    friday: { en: '04:00 PM - 05:00 AM', ar: '04:00 م - 05:00 ص' },
  },
  days: [
    { key: 'saturday', open: '15:00', close: '05:00', enabled: true },
    { key: 'sunday', open: '15:00', close: '05:00', enabled: true },
    { key: 'monday', open: '15:00', close: '05:00', enabled: true },
    { key: 'tuesday', open: '15:00', close: '05:00', enabled: true },
    { key: 'wednesday', open: '15:00', close: '05:00', enabled: true },
    { key: 'thursday', open: '15:00', close: '05:00', enabled: true },
    { key: 'friday', open: '16:00', close: '05:00', enabled: true },
  ],
};

/**
 * 3. STAFF ACCOUNTS (ADMIN & CASHIERS) — [REQUIRED: At least 1 Admin]
 * Maps to `roles` ('admin' | 'cashier') and `users` tables in `plan/schema/schema.ts`.
 * `pinCode` is hashed into `users.pin_hash` when pushed to Supabase.
 */
export const SEED_STAFF: StaffMemberConfig[] = [
  {
    id: 'usr-admin-1',
    fullNameAr: 'هدى', // [REQUIRED] Arabic full name
    fullNameEn: 'Huda', // [REQUIRED] English full name
    email: 'osama.aalam@gmail.com', // [REQUIRED] Supabase Auth login email
    role: 'admin', // [REQUIRED] 'admin' | 'cashier'
    pinCode: '1234', // [REQUIRED] 4-digit POS fast-unlock PIN
    pinHashPreview: 'bcrypt_sha256', // Auto-computed on save
    isActive: true,
  },
  {
    id: 'usr-cashier-1',
    fullNameAr: 'كاشير', // [REQUIRED] Arabic full name
    fullNameEn: 'casher', // [REQUIRED] English full name
    email: 'cashier@oasis.sa', // [REQUIRED] Supabase Auth login email
    role: 'cashier', // [REQUIRED] 'admin' | 'cashier'
    pinCode: '1234', // [REQUIRED] 4-digit POS fast-unlock PIN
    pinHashPreview: 'bcrypt_sha256', // Auto-computed on save
    isActive: true,
  },
];

/**
 * 4. OFFICIAL SERVICES CATALOG — [REQUIRED]
 * Maps to `services` table in `plan/schema/schema.ts` AND renders on the public landing page.
 */
export const SEED_SERVICES: CatalogService[] = [
  {
    id: 'msg-60',
    code: 'SRV-MSG-60',
    category: 'massage',
    nameAr: 'ساعة مساج',
    nameEn: 'One-Hour Massage',
    descriptionAr:
      'ساعة كاملة من المساج المريح لتخفيف التوتر وإراحة العضلات المتعبة واستعادة هدوئك.',
    descriptionEn:
      'A full hour of relaxing massage to release tension, ease tired muscles, and restore your calm.',
    durationMin: 60,
    priceSar: 250, // [REQUIRED] Price in SAR (0% VAT - not VAT-registered)
    taxRate: 0,
    taxable: false,
    roomKind: 'massage',
    isActive: true,
  },
  {
    id: 'msg-45',
    code: 'SRV-MSG-45',
    category: 'massage',
    nameAr: '45 دقيقة مساج',
    nameEn: '45-Minute Massage',
    descriptionAr: 'جلسة مساج مركّزة تخفف الضغوط وتجدد نشاط الجسد والذهن.',
    descriptionEn: 'A focused massage session that relieves stress and refreshes body and mind.',
    durationMin: 45,
    priceSar: 200, // [REQUIRED] Price in SAR (0% VAT - not VAT-registered)
    taxRate: 0,
    taxable: false,
    roomKind: 'massage',
    isActive: true,
  },
  {
    id: 'bath',
    code: 'SRV-HAM-30',
    category: 'moroccan-bath',
    nameAr: 'حمام مغربي',
    nameEn: 'Moroccan Bath',
    descriptionAr: 'حمام مغربي تقليدي بالبخار والصابون البلدي وتقشير عميق لبشرة ناعمة ومشرقة.',
    descriptionEn:
      'A traditional Moroccan bath with steam, black soap, and a deep exfoliating scrub for soft, glowing skin.',
    durationMin: 30,
    priceSar: 180, // [REQUIRED] Price in SAR (0% VAT - not VAT-registered)
    taxRate: 0,
    taxable: false,
    roomKind: 'moroccan-bath',
    isActive: true,
  },
  {
    id: 'pedicure',
    code: 'SRV-PED-45',
    category: 'pedicure',
    nameAr: 'بديكير',
    nameEn: 'Pedicure',
    descriptionAr:
      'نقع مريح للقدمين وتقشير لطيف وتشكيل الأظافر والعناية بالجلد المحيط لقدمين منتعشتين.',
    descriptionEn:
      'A soothing foot soak, gentle exfoliation, nail shaping, and cuticle care for refreshed feet.',
    durationMin: 45,
    priceSar: 200, // [REQUIRED] Price in SAR (0% VAT - not VAT-registered)
    taxRate: 0,
    taxable: false,
    roomKind: 'pedicure',
    isActive: true,
  },
];

/**
 * 5. OFFICIAL PACKAGES CATALOG — [REQUIRED]
 * Maps to `packages` table in `plan/schema/schema.ts` AND renders on the public landing page.
 */
export const SEED_PACKAGES: PackageCatalogItem[] = [
  {
    id: 'pkg-1',
    code: 'PKG-RESET-30',
    nameAr: 'باكيج نصف ساعة مساج',
    nameEn: 'Half-Hour Massage Package',
    descriptionAr: 'جلسة سريعة تعيد لك النشاط والحيوية.',
    descriptionEn: 'A quick reset for body and mind.',
    priceSar: 250,
    totalSessions: 2,
    validDays: 365,
    includedServicesAr: ['نصف ساعة مساج', 'نصف ساعة حمام مغربي'],
    includedServicesEn: ['30-minute massage', '30-minute Moroccan bath'],
    isActive: true,
  },
  {
    id: 'pkg-2',
    code: 'PKG-BAL-45',
    nameAr: 'باكيج 45 دقيقة مساج',
    nameEn: '45-Minute Massage Package',
    descriptionAr: 'توازن مثالي بين المساج والحمام المغربي.',
    descriptionEn: 'The perfect balance of massage and bath.',
    priceSar: 300,
    totalSessions: 2,
    validDays: 365,
    includedServicesAr: ['45 دقيقة مساج', 'نصف ساعة حمام مغربي'],
    includedServicesEn: ['45-minute massage', '30-minute Moroccan bath'],
    isActive: true,
  },
  {
    id: 'pkg-3',
    code: 'PKG-DEEP-60',
    nameAr: 'باكيج ساعة مساج',
    nameEn: 'One-Hour Massage Package',
    descriptionAr: 'ساعة كاملة من الاسترخاء العميق.',
    descriptionEn: 'A full hour of deep relaxation.',
    priceSar: 350,
    totalSessions: 2,
    validDays: 365,
    includedServicesAr: ['ساعة مساج', 'نصف ساعة حمام مغربي'],
    includedServicesEn: ['60-minute massage', '30-minute Moroccan bath'],
    isActive: true,
  },
  {
    id: 'pkg-4',
    code: 'PKG-ROYAL-VIP',
    nameAr: 'الباكيج الملكي',
    nameEn: 'The Royal Package',
    descriptionAr: 'تجربة الاسترخاء المتكاملة.',
    descriptionEn: 'The complete relaxation experience.',
    priceSar: 500,
    totalSessions: 3,
    validDays: 365,
    includedServicesAr: ['ساعة مساج', 'نصف ساعة حمام مغربي', 'بديكير'],
    includedServicesEn: ['60-minute massage', '30-minute Moroccan bath', 'Pedicure'],
    isHighlighted: true,
    isActive: true,
  },
];

/**
 * 6. TREATMENT ROOMS & HAMMAM SUITES — [OPTIONAL now, or fill to seed rooms]
 * Maps to `rooms` table in `plan/schema/schema.ts`.
 * `forKind` must be: 'massage' | 'moroccan-bath' | 'pedicure'
 */
export const SEED_ROOMS: RoomConfig[] = [
  {
    id: 'rm-1',
    code: 'R-101',
    nameAr: 'غرفة المساج 1 (مع كرسي بديكير)',
    nameEn: 'Massage Room 1 (with Pedicure Chair)',
    forKind: 'massage',
    floorAr: 'الدور الأرضي',
    floorEn: 'Ground Floor',
    equipmentAr: ['سرير مساج فاخر', 'كرسي بديكير مريح', 'خزانة مناشف'],
    equipmentEn: ['Premium Massage Table', 'Comfort Pedicure Chair', 'Towel Warmer'],
    liveState: 'available',
    bufferMinutes: 15,
    isActive: true,
  },
  {
    id: 'rm-2',
    code: 'R-102',
    nameAr: 'غرفة المساج 2 (مع كرسي بديكير)',
    nameEn: 'Massage Room 2 (with Pedicure Chair)',
    forKind: 'massage',
    floorAr: 'الدور الأرضي',
    floorEn: 'Ground Floor',
    equipmentAr: ['سرير مساج فاخر', 'كرسي بديكير مريح', 'خزانة مناشف'],
    equipmentEn: ['Premium Massage Table', 'Comfort Pedicure Chair', 'Towel Warmer'],
    liveState: 'available',
    bufferMinutes: 15,
    isActive: true,
  },
  {
    id: 'rm-bath',
    code: 'H-01',
    nameAr: 'جناح الحمام المغربي',
    nameEn: 'Moroccan Bath Suite',
    forKind: 'moroccan-bath',
    floorAr: 'الدور الأرضي',
    floorEn: 'Ground Floor',
    equipmentAr: ['مغسلة رخامية دافئة', 'مولد بخار تركي', 'دش استحمام'],
    equipmentEn: ['Heated Marble Slab', 'Steam Unit', 'Rain Shower'],
    liveState: 'available',
    bufferMinutes: 15,
    isActive: true,
  },
];

/**
 * 7. COMMISSION RULES & THERAPISTS — [OPTIONAL now, or fill to seed staff]
 * Maps to `commission_rules` and `therapists` tables in `plan/schema/schema.ts`.
 */
export const SEED_COMMISSION_RULES: CommissionRuleItem[] = [
  {
    id: 'cr-0',
    nameAr: 'نسبة 0%',
    nameEn: '0% Commission',
    kind: 'percent',
    value: 0,
  },
];

export const SEED_THERAPISTS: TherapistProfile[] = [
  {
    id: 'th-1',
    nameAr: 'معالجة 1',
    nameEn: 'Therapist 1',
    initials: 'T1',
    phone: '',
    specialtyAr: 'أخصائية مساج وعناية شاملة',
    specialtyEn: 'Massage & Wellness Specialist',
    skills: ['massage', 'moroccan-bath', 'pedicure'],
    commissionRuleId: 'cr-0',
    shiftStart: '15:00',
    shiftEnd: '05:00',
    daysOff: [],
    completedSessionsMonth: 0,
    revenueMonthSar: 0,
    rating: 5.0,
    isActive: true,
  },
  {
    id: 'th-2',
    nameAr: 'معالجة 2',
    nameEn: 'Therapist 2',
    initials: 'T2',
    phone: '',
    specialtyAr: 'أخصائية مساج وعناية شاملة',
    specialtyEn: 'Massage & Wellness Specialist',
    skills: ['massage', 'moroccan-bath', 'pedicure'],
    commissionRuleId: 'cr-0',
    shiftStart: '15:00',
    shiftEnd: '05:00',
    daysOff: [],
    completedSessionsMonth: 0,
    revenueMonthSar: 0,
    rating: 5.0,
    isActive: true,
  },
  {
    id: 'th-3',
    nameAr: 'معالجة 3',
    nameEn: 'Therapist 3',
    initials: 'T3',
    phone: '',
    specialtyAr: 'أخصائية مساج وعناية شاملة',
    specialtyEn: 'Massage & Wellness Specialist',
    skills: ['massage', 'moroccan-bath', 'pedicure'],
    commissionRuleId: 'cr-0',
    shiftStart: '15:00',
    shiftEnd: '05:00',
    daysOff: [],
    completedSessionsMonth: 0,
    revenueMonthSar: 0,
    rating: 5.0,
    isActive: true,
  },
];

/**
 * 8. PAYMENT METHODS — [REQUIRED]
 * Maps to `payment_methods` table in `plan/schema/schema.ts`.
 */
export const SEED_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-cash',
    kind: 'cash',
    nameAr: 'نقدي (درج النقدية)',
    nameEn: 'Cash (Cash Drawer)',
    schemes: ['SAR'],
    contactless: false,
    enabled: true,
  },
  {
    id: 'pm-mada',
    kind: 'card',
    nameAr: 'بطاقة مدى / فيزا (أثير اللاتلامسية)',
    nameEn: 'mada / Visa Contactless (NFC Tap)',
    schemes: ['mada', 'Visa', 'Mastercard'],
    contactless: true,
    enabled: true,
  },
  {
    id: 'pm-wallet',
    kind: 'wallet',
    nameAr: 'محفظة رقمية (Apple Pay / STC Pay)',
    nameEn: 'Digital Wallet (Apple Pay / STC Pay)',
    schemes: ['Apple Pay', 'STC Pay'],
    contactless: true,
    enabled: true,
  },
  {
    id: 'pm-transfer',
    kind: 'transfer',
    nameAr: 'تحويل بنكي فوري (سريع)',
    nameEn: 'Instant Bank Transfer (SARIE)',
    schemes: ['IBAN'],
    contactless: false,
    enabled: true,
  },
];

/**
 * 9. HARDWARE, ZATCA & SUPABASE CONNECTION SETTINGS — [OPTIONAL]
 * Maps to `settings` table (`zatca_config`, `payment_terminals`, `printer_config`).
 */
export const SEED_INTEGRATIONS = {
  supabase: {
    projectUrl: 'https://tqxkmpemznxydkyrdxrx.supabase.co',
    publishableKeyMasked: 'sb_publishable_q60QfI2a7c1u3y_2uF2H7l',
    syncEngine: 'powersync' as const,
    storageBucket: 'receipt-assets',
    rlsActive: true,
    zatcaEdgeFunction: 'report-zatca-invoice',
    paymentWebhookFunction: 'terminal-payment-webhook',
  },
  zatca: {
    environment: 'simulation' as const,
    egsSerialNumber: '1-OASIS|2-POS01|3-00000000-0000',
    csidStatus: 'unregistered' as const,
    otpCode: '',
    binarySecurityToken: '',
    ecdsaCurve: 'secp256k1' as const,
    invoiceCounter: 1,
    // ZATCA Phase 2 Genesis PIH (Base64 of SHA-256("0"))
    prevInvoiceHash:
      'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjZjljMmI5N2I3M2I2Yjg2Y2I0ZjA0M2M4Y2I1YzQ3NTI4ZA==',
    autoReport24h: true,
    lastReportedAt: '',
  },
  paymentTerminal: {
    mode: 'semi_integrated' as const,
    provider: 'geidea' as const,
    connection: 'tcp_ip' as const,
    terminalIp: '', // e.g. '192.168.1.45'
    terminalPort: 8080,
    terminalId: '', // Bank TID
    timeoutSec: 60,
    nfcTapEnabled: true,
    autoPrintBankSlip: false,
  },
  printers: {
    thermal: {
      enabled: true,
      model: 'Epson TM-T88VI (80mm ESC/POS)',
      connection: 'tcp_ip' as const,
      ip: '', // e.g. '192.168.1.50'
      port: 9100,
      paperWidth: '80mm' as const,
      rasterArabic: true,
      autoCut: true,
      kickCashDrawer: true,
    },
    carbon: {
      enabled: true,
      model: 'Epson TM-U220B / LX-350 Impact Carbon',
      connection: 'usb' as const,
      portName: 'USB001 (Impact Dot-Matrix)',
      plyCount: 2 as const,
      autoDuplicateCopy: true,
      impactDensity: 'high' as const,
    },
    receiptHeaderAr: 'أهلاً بكم في واحة الإسترخاء للمساج — راحتكم غايتنا',
    receiptHeaderEn: 'Welcome to Relaxation Oasis Massage — Your Comfort Comes First',
    receiptFooterAr: 'شكراً لزيارتكم · الفاتورة شاملة ضريبة القيمة المضافة ١٥٪',
    receiptFooterEn: 'Thank you for visiting · Prices include 15% KSA VAT',
  },
};

/**
 * 10. PROMOTIONS, INVENTORY & OPERATIONAL LEDGERS — [OPTIONAL]
 * Leave empty `[]` so zero mock transactions are pushed to Supabase.
 */
export const SEED_PROMOTIONS: PromotionDiscount[] = [];
export const SEED_PRODUCTS: InventoryProduct[] = [];
export const SEED_CLIENTS: ClientParty[] = [];
export const SEED_PACKAGE_SESSIONS: ClientPackageSession[] = [];
export const SEED_SHIFTS: ShiftRecord[] = [];
export const SEED_SALES: LedgerSale[] = [];

/**
 * 11. PUBLIC WEBSITE CONTENT (GALLERY, FAQS, TESTIMONIALS) — [OPTIONAL]
 * Used on the public landing page (`/`). Images come from `src/data/siteImages.ts`.
 */
export const SEED_GALLERY_RAW = [
  {
    id: 'gal-rooms',
    title: { en: 'Private Massage Room', ar: 'غرفة المساج الخاصة' },
    category: 'rooms' as const,
    image: SITE_IMAGES.gallery['gal-rooms'],
  },
  {
    id: 'gal-bath',
    title: { en: 'Moroccan Bath Room', ar: 'غرفة الحمام المغربي' },
    category: 'bath' as const,
    image: SITE_IMAGES.gallery['gal-bath'],
  },
  {
    id: 'gal-bath-essentials',
    title: { en: 'Moroccan Bath Essentials', ar: 'مستلزمات الحمام المغربي' },
    category: 'bath' as const,
    image: SITE_IMAGES.gallery['gal-bath-essentials'],
  },
  {
    id: 'gal-pedicure',
    title: { en: 'Pedicure Corner', ar: 'ركن البديكير' },
    category: 'pedicure' as const,
    image: SITE_IMAGES.gallery['gal-pedicure'],
  },
  {
    id: 'gal-lounge',
    title: { en: 'Relaxation Lounge', ar: 'صالة الاسترخاء' },
    category: 'lounge' as const,
    image: SITE_IMAGES.gallery['gal-lounge'],
  },
  {
    id: 'gal-reception',
    title: { en: 'Reception', ar: 'الاستقبال' },
    category: 'lounge' as const,
    image: SITE_IMAGES.gallery['gal-reception'],
  },
];

export const SEED_TESTIMONIALS_RAW = [
  {
    id: 'tst-1',
    name: { en: 'A. M.', ar: 'أ. م.' },
    review: {
      en: 'The one-hour massage was wonderful and focused exactly on where I carry tension. The place is calm and very clean.',
      ar: 'جلسة المساج لمدة ساعة كانت رائعة، وركّزت تماماً على مناطق التوتر. المكان هادئ ونظيف جداً.',
    },
    rating: 5,
    date: { en: '1 week ago', ar: 'منذ أسبوع' },
  },
  {
    id: 'tst-2',
    name: { en: 'S. F.', ar: 'س. ف.' },
    review: {
      en: 'I tried the Moroccan bath for the first time and it was a special experience. My skin felt so soft, and the service was excellent.',
      ar: 'جربت الحمام المغربي لأول مرة وكانت تجربة مميزة. صارت بشرتي ناعمة جداً والخدمة ممتازة.',
    },
    rating: 5,
    date: { en: '2 weeks ago', ar: 'منذ أسبوعين' },
  },
  {
    id: 'tst-3',
    name: { en: 'R. K.', ar: 'ر. ك.' },
    review: {
      en: 'The Royal Package is worth every riyal: massage, Moroccan bath, and pedicure in one visit. I will definitely be back.',
      ar: 'الباكيج الملكي يستحق كل ريال: مساج وحمام مغربي وبديكير في زيارة واحدة. سأعود بالتأكيد.',
    },
    rating: 5,
    date: { en: '1 month ago', ar: 'منذ شهر' },
  },
];

export const SEED_FAQ_RAW = [
  {
    id: 'faq-1',
    question: {
      en: 'How early should I arrive before my appointment?',
      ar: 'كم من الوقت يجب أن أصل قبل موعدي؟',
    },
    answer: {
      en: 'We recommend arriving 10 to 15 minutes early so you can check in and settle in calmly before your session.',
      ar: 'ننصح بالوصول قبل موعدك بـ 10 إلى 15 دقيقة لتسجيل الوصول والاستعداد للجلسة بهدوء.',
    },
  },
  {
    id: 'faq-2',
    question: {
      en: 'Can I book the Moroccan bath on its own?',
      ar: 'هل يمكنني حجز الحمام المغربي وحده؟',
    },
    answer: {
      en: 'Yes. The Moroccan bath (180 SAR) can be booked as a single service, or as part of a package with a massage at a better price.',
      ar: 'نعم، يمكنك حجز الحمام المغربي (180 ر.س) كخدمة مستقلة، أو ضمن أحد الباكيجات مع المساج بسعر أفضل.',
    },
  },
  {
    id: 'faq-3',
    question: {
      en: 'What is the difference between the packages?',
      ar: 'ما الفرق بين الباكيجات؟',
    },
    answer: {
      en: 'Every package includes a 30-minute Moroccan bath; the massage length changes: 30 minutes (250 SAR), 45 minutes (300 SAR), or one hour (350 SAR). The Royal Package (500 SAR) adds a pedicure to a one-hour massage and a 30-minute Moroccan bath.',
      ar: 'جميع الباكيجات تشمل نصف ساعة حمام مغربي، ويختلف وقت المساج: نصف ساعة (250 ر.س)، أو 45 دقيقة (300 ر.س)، أو ساعة (350 ر.س). أما الباكيج الملكي (500 ر.س) فيشمل ساعة مساج ونصف ساعة حمام مغربي وبديكير.',
    },
  },
  {
    id: 'faq-4',
    question: {
      en: 'How do I cancel or reschedule my appointment?',
      ar: 'كيف ألغي موعدي أو أغيّره؟',
    },
    answer: {
      en: 'Please let us know at least 24 hours in advance so we can offer the slot to another guest.',
      ar: 'نرجو إبلاغنا قبل 24 ساعة على الأقل حتى نتمكن من إتاحة الموعد لضيف آخر.',
    },
  },
  {
    id: 'faq-5',
    question: {
      en: 'Are the services suitable during pregnancy or with health conditions?',
      ar: 'هل الخدمات مناسبة أثناء الحمل أو مع وجود حالات صحية؟',
    },
    answer: {
      en: 'If you are pregnant or have a health condition, please tell us when booking and check with your doctor first, especially before the Moroccan bath because of the heat and steam.',
      ar: 'إذا كنتِ حاملاً أو لديك حالة صحية، يرجى إبلاغنا عند الحجز واستشارة طبيبك أولاً، خاصة قبل الحمام المغربي بسبب الحرارة والبخار.',
    },
  },
];

/* ============================================================================
 * PART 2 — TYPES, PUBLIC WEBSITE SELECTORS, POS & DASHBOARD STORES
 * (Do not need to edit below unless changing application logic)
 * ========================================================================== */

type L<T = string> = Record<Lang, T>;

export interface ServiceItem {
  id: string;
  name: string;
  category: 'massage' | 'moroccan-bath' | 'pedicure';
  description: string;
  duration: string;
  price: number;
  image: string;
}

export interface PackageItem {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isHighlighted?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'rooms' | 'bath' | 'pedicure' | 'lounge';
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  date: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const SERVICES_CATEGORIES_RAW = [
  { id: 'massage', name: { en: 'Massage', ar: 'المساج' } },
  { id: 'moroccan-bath', name: { en: 'Moroccan Bath', ar: 'الحمام المغربي' } },
  { id: 'pedicure', name: { en: 'Pedicure', ar: 'البديكير' } },
] as const;

const serviceImageFor = (id: string): string => {
  if (id in SITE_IMAGES.services) {
    return SITE_IMAGES.services[id as keyof typeof SITE_IMAGES.services];
  }
  return SITE_IMAGES.services['msg-60'];
};

export function getSalonData(lang: Lang) {
  return {
    SERVICES_CATEGORIES: SERVICES_CATEGORIES_RAW.map((c) => ({ id: c.id, name: c.name[lang] })),
    SERVICES_DATA: SEED_SERVICES.filter((s) => s.isActive).map(
      (s): ServiceItem => ({
        id: s.id,
        name: lang === 'ar' ? s.nameAr : s.nameEn,
        category: s.category,
        description: lang === 'ar' ? s.descriptionAr : s.descriptionEn,
        duration: lang === 'ar' ? `${s.durationMin} دقيقة` : `${s.durationMin} Mins`,
        price: s.priceSar,
        image: serviceImageFor(s.id),
      })
    ),
    PACKAGES_DATA: SEED_PACKAGES.filter((p) => p.isActive).map(
      (p): PackageItem => ({
        id: p.id,
        name: lang === 'ar' ? p.nameAr : p.nameEn,
        price: p.priceSar,
        description: lang === 'ar' ? p.descriptionAr : p.descriptionEn,
        features: lang === 'ar' ? p.includedServicesAr : p.includedServicesEn,
        isHighlighted: p.isHighlighted,
      })
    ),
    GALLERY_DATA: SEED_GALLERY_RAW.map(
      (g): GalleryItem => ({
        id: g.id,
        title: g.title[lang],
        category: g.category,
        image: g.image,
      })
    ),
    TESTIMONIALS_DATA: SEED_TESTIMONIALS_RAW.map(
      (t): Testimonial => ({
        id: t.id,
        name: t.name[lang],
        review: t.review[lang],
        rating: t.rating,
        date: t.date[lang],
      })
    ),
    FAQ_DATA: SEED_FAQ_RAW.map(
      (f): FAQItem => ({
        id: f.id,
        question: f.question[lang],
        answer: f.answer[lang],
      })
    ),
    BUSINESS_INFO: {
      phone: SEED_COMPANY_AND_BRANCH.phone,
      email: SEED_COMPANY_AND_BRANCH.email,
      address:
        lang === 'ar' ? SEED_COMPANY_AND_BRANCH.addressAr : SEED_COMPANY_AND_BRANCH.addressEn,
      mapCoordinates: SEED_COMPANY_AND_BRANCH.mapCoordinates,
      hours: {
        satToThu: SEED_WORKING_HOURS.publicDisplay.satToThu[lang],
        friday: SEED_WORKING_HOURS.publicDisplay.friday[lang],
      },
    },
  };
}

export type SalonData = ReturnType<typeof getSalonData>;

/* ----------------------------------------------------------------------------
 * Calendar & Dashboard Types / Helpers
 * ------------------------------------------------------------------------- */
export type ApptStatus =
  | 'booked'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'no_show'
  | 'cancelled';
export type BookingSource = 'walk_in' | 'phone' | 'online' | 'whatsapp';
export type ServiceKind = 'massage' | 'moroccan-bath' | 'pedicure';
export type MixCategory = ServiceKind | 'package';

export const DAY_START = SEED_WORKING_HOURS.dayStartHour * 60;
export const DAY_END = SEED_WORKING_HOURS.dayEndHour * 60;
export const BUFFER_MIN = SEED_WORKING_HOURS.bufferMinutes;

export const BOOKABLES = {
  'msg-60': { category: 'massage', duration: 60, needs: ['massage'] },
  'msg-45': { category: 'massage', duration: 45, needs: ['massage'] },
  bath: { category: 'moroccan-bath', duration: 30, needs: ['moroccan-bath'] },
  pedicure: { category: 'pedicure', duration: 45, needs: ['pedicure'] },
  'pkg-1': { category: 'package', duration: 60, needs: ['massage', 'moroccan-bath'] },
  'pkg-2': { category: 'package', duration: 75, needs: ['massage', 'moroccan-bath'] },
  'pkg-3': { category: 'package', duration: 90, needs: ['massage', 'moroccan-bath'] },
  'pkg-4': { category: 'package', duration: 135, needs: ['massage', 'moroccan-bath', 'pedicure'] },
} as const satisfies Record<
  string,
  { category: MixCategory; duration: number; needs: readonly ServiceKind[] }
>;

export type BookableId = keyof typeof BOOKABLES;
export const BOOKABLE_IDS = Object.keys(BOOKABLES) as BookableId[];

export interface Therapist {
  id: string;
  name: L;
  initials: string;
  skills: ServiceKind[];
}

export const THERAPISTS: Therapist[] = SEED_THERAPISTS.filter((t) => t.isActive).map((t) => ({
  id: t.id,
  name: { en: t.nameEn, ar: t.nameAr },
  initials: t.initials,
  skills: t.skills,
}));

export interface Room {
  id: string;
  name: L;
  forKind: ServiceKind;
}

export const ROOMS: Room[] = SEED_ROOMS.filter((r) => r.isActive).map((r) => ({
  id: r.id,
  name: { en: r.nameEn, ar: r.nameAr },
  forKind: r.forKind,
}));

export interface Booking {
  id: string;
  client: string;
  phone: string;
  itemId: BookableId;
  therapistId: string | null;
  roomId: string;
  start: number; // minutes from midnight (or +1440 for post-midnight hours up to 05:00 AM)
  duration: number;
  status: ApptStatus;
  paid: boolean;
  source: BookingSource;
  notes?: string;
}

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const addDays = (d: Date, n: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const minutesOfDay = (d: Date) => {
  const raw = d.getHours() * 60 + d.getMinutes();
  return raw < DAY_START && DAY_END > 1440 && raw <= DAY_END - 1440 ? raw + 1440 : raw;
};

export const hhmmToBusinessMinutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  const raw = h * 60 + m;
  return raw < DAY_START && DAY_END > 1440 && raw <= DAY_END - 1440 ? raw + 1440 : raw;
};

export const minutesToHHMM = (m: number) => {
  const wrapped = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};

export function generateBookings(_day: Date, _now: Date, _lang: Lang): Booking[] {
  void _day;
  void _now;
  void _lang;
  return [];
}

export function bookableInfo(data: SalonData, id: BookableId) {
  const service = data.SERVICES_DATA.find((s) => s.id === id);
  const pkg = data.PACKAGES_DATA.find((p) => p.id === id);
  return {
    name: service?.name ?? pkg?.name ?? id,
    price: service?.price ?? pkg?.price ?? 0,
    ...BOOKABLES[id],
  };
}

export type DisplayStatus = Exclude<ApptStatus, 'cancelled'> | 'awaiting_payment';

export const displayStatus = (b: Booking): DisplayStatus | null => {
  if (b.status === 'cancelled') return null;
  if (b.status === 'completed' && !b.paid) return 'awaiting_payment';
  return b.status;
};

export const needsAttention = (s: DisplayStatus | null) =>
  s === 'no_show' || s === 'awaiting_payment';

export function dayStats(
  data: SalonData,
  bookings: Booking[],
  therapistCount: number = THERAPISTS.length
) {
  const live = bookings.filter((b) => b.status !== 'cancelled');
  const completedPaid = live.filter((b) => b.status === 'completed' && b.paid);
  const revenue = completedPaid.reduce((sum, b) => sum + bookableInfo(data, b.itemId).price, 0);
  const assignedMinutes = live
    .filter((b) => b.therapistId && b.status !== 'no_show')
    .reduce((sum, b) => sum + b.duration, 0);
  const capacity = therapistCount * (DAY_END - DAY_START);
  return {
    count: live.length,
    inTreatment: live.filter((b) => b.status === 'checked_in').length,
    revenue,
    avgTicket: completedPaid.length ? Math.round(revenue / completedPaid.length) : 0,
    occupancy: capacity > 0 ? Math.round((assignedMinutes / capacity) * 100) : 0,
    noShows: live.filter((b) => b.status === 'no_show').length,
    unpaid: live.filter((b) => b.status === 'completed' && !b.paid).length,
    unassigned: live.filter((b) => !b.therapistId).length,
  };
}

export function therapistMinutes(bookings: Booking[], therapistId: string) {
  return bookings
    .filter((b) => b.therapistId === therapistId && b.status !== 'cancelled' && b.status !== 'no_show')
    .reduce((sum, b) => sum + b.duration, 0);
}

export const PACKAGES_EXPIRING_THIS_WEEK = 0;

/* ----------------------------------------------------------------------------
 * POS Constants & Helpers
 * ------------------------------------------------------------------------- */
export const VAT_RATE = SEED_COMPANY_AND_BRANCH.vatRatePercent;
export const BRANCH_CODE = SEED_COMPANY_AND_BRANCH.branchCode;
export const TERMINAL_ID = SEED_COMPANY_AND_BRANCH.terminalId;
export const VAT_NUMBER = SEED_COMPANY_AND_BRANCH.vatNumber;
export const OPENING_FLOAT = Math.round(SEED_COMPANY_AND_BRANCH.defaultOpeningFloatSar * 100);

export const vatOf = (inclusive: number) => Math.round((inclusive * VAT_RATE) / (100 + VAT_RATE));
export const toHalalas = (sar: number) => Math.round(sar * 100);
export const fmtMoney = (halalas: number) => (halalas / 100).toFixed(2);

export type PaymentKind = 'cash' | 'card' | 'wallet' | 'transfer' | 'package';
export const PAYMENT_KINDS: PaymentKind[] = ['cash', 'card', 'wallet', 'transfer', 'package'];

export interface Discount {
  id: string;
  name: L;
  kind: 'percent' | 'amount';
  value: number;
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

export const receiptNo = (seq: number) =>
  `${BRANCH_CODE}-${TERMINAL_ID}-${String(seq).padStart(6, '0')}`;

/* ----------------------------------------------------------------------------
 * Bookings Store (`useBookingsStore`)
 * ------------------------------------------------------------------------- */
interface BookingsStoreState {
  added: Record<string, Booking[]>;
  patches: Record<string, Partial<Booking>>;
}

const BOOKINGS_KEY = 'aura-bookings-v2';
const EMPTY_BOOKINGS: BookingsStoreState = { added: {}, patches: {} };

const readBookings = (): BookingsStoreState => {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (raw) return { ...EMPTY_BOOKINGS, ...(JSON.parse(raw) as BookingsStoreState) };
  } catch {}
  return EMPTY_BOOKINGS;
};

let bookingsState: BookingsStoreState =
  typeof window === 'undefined' ? EMPTY_BOOKINGS : readBookings();
const bookingsListeners = new Set<() => void>();

const commitBookings = (next: BookingsStoreState) => {
  bookingsState = next;
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookingsState));
  } catch {}
  bookingsListeners.forEach((l) => l());
};

export const addBooking = (dateKey: string, booking: Booking) =>
  commitBookings({
    ...bookingsState,
    added: { ...bookingsState.added, [dateKey]: [...(bookingsState.added[dateKey] ?? []), booking] },
  });

export const patchBooking = (id: string, patch: Partial<Booking>) =>
  commitBookings({
    ...bookingsState,
    patches: { ...bookingsState.patches, [id]: { ...bookingsState.patches[id], ...patch } },
  });

const subscribeBookings = (cb: () => void) => {
  bookingsListeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === BOOKINGS_KEY) {
      bookingsState = readBookings();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    bookingsListeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

export function useBookingsStore() {
  const snap = useSyncExternalStore(
    subscribeBookings,
    () => bookingsState,
    () => EMPTY_BOOKINGS
  );
  return { added: snap.added, patches: snap.patches, addBooking, patchBooking };
}

export function mergeBookings(
  day: Date,
  now: Date,
  lang: Lang,
  store: Pick<BookingsStoreState, 'added' | 'patches'>
): Booking[] {
  const key = toDateKey(day);
  return [...generateBookings(day, now, lang), ...(store.added[key] ?? [])].map((b) => ({
    ...b,
    ...store.patches[b.id],
  }));
}

/* ----------------------------------------------------------------------------
 * Phase 1 Store (`usePhase1Store` — Clients, Services, Promotions, Sales, Shifts)
 * ------------------------------------------------------------------------- */
export interface ClientParty {
  id: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  email: string;
  notesAr: string;
  notesEn: string;
  balanceSar: number;
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
  priceSar: number;
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
  value: number;
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
  zatcaUuid: string;
  zatcaCounter: number;
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
  openedBy: string;
  openedAtIso: string;
  openingFloatHalalas: number;
  status: 'open' | 'closed';
  closedBy?: string;
  closedAtIso?: string;
  closingCountHalalas?: number;
  cashDropsHalalas: number;
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

const PHASE1_STORAGE_KEY = 'oasis-phase1-store-v3';

const DEFAULT_PHASE1_STATE: Phase1State = {
  clients: SEED_CLIENTS,
  services: SEED_SERVICES,
  promotions: SEED_PROMOTIONS,
  sales: SEED_SALES,
  shifts: SEED_SHIFTS,
  nextReceiptSeq: 1,
  nextIcv: 1,
};

const readPhase1State = (): Phase1State => {
  if (typeof window === 'undefined') return DEFAULT_PHASE1_STATE;
  try {
    const raw = localStorage.getItem(PHASE1_STORAGE_KEY);
    if (!raw) return DEFAULT_PHASE1_STATE;
    const parsed = JSON.parse(raw) as Partial<Phase1State>;
    return {
      clients: parsed.clients ?? DEFAULT_PHASE1_STATE.clients,
      services: parsed.services ?? DEFAULT_PHASE1_STATE.services,
      promotions: parsed.promotions ?? DEFAULT_PHASE1_STATE.promotions,
      sales: parsed.sales ?? DEFAULT_PHASE1_STATE.sales,
      shifts: parsed.shifts ?? DEFAULT_PHASE1_STATE.shifts,
      nextReceiptSeq: parsed.nextReceiptSeq ?? DEFAULT_PHASE1_STATE.nextReceiptSeq,
      nextIcv: parsed.nextIcv ?? DEFAULT_PHASE1_STATE.nextIcv,
    };
  } catch {
    return DEFAULT_PHASE1_STATE;
  }
};

let phase1State: Phase1State =
  typeof window === 'undefined' ? DEFAULT_PHASE1_STATE : readPhase1State();
const phase1Listeners = new Set<() => void>();

const commitPhase1State = (next: Phase1State) => {
  phase1State = next;
  try {
    localStorage.setItem(PHASE1_STORAGE_KEY, JSON.stringify(phase1State));
  } catch {}
  phase1Listeners.forEach((l) => l());
};

const subscribePhase1 = (cb: () => void) => {
  phase1Listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PHASE1_STORAGE_KEY) {
      phase1State = readPhase1State();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    phase1Listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

export const addClientParty = (client: Omit<ClientParty, 'id'>) => {
  const newClient: ClientParty = { ...client, id: `cli-${Date.now()}` };
  commitPhase1State({ ...phase1State, clients: [newClient, ...phase1State.clients] });
};

export const updateClientParty = (id: string, patch: Partial<ClientParty>) => {
  commitPhase1State({
    ...phase1State,
    clients: phase1State.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  });
};

export const addCatalogService = (service: Omit<CatalogService, 'id'>) => {
  const newService: CatalogService = { ...service, id: `srv-${Date.now()}` };
  commitPhase1State({ ...phase1State, services: [...phase1State.services, newService] });
};

export const updateCatalogService = (id: string, patch: Partial<CatalogService>) => {
  commitPhase1State({
    ...phase1State,
    services: phase1State.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  });
};

export const addPromotionDiscount = (promo: Omit<PromotionDiscount, 'id' | 'usageCount'>) => {
  const newPromo: PromotionDiscount = { ...promo, id: `dc-${Date.now()}`, usageCount: 0 };
  commitPhase1State({ ...phase1State, promotions: [newPromo, ...phase1State.promotions] });
};

export const updatePromotionDiscount = (id: string, patch: Partial<PromotionDiscount>) => {
  commitPhase1State({
    ...phase1State,
    promotions: phase1State.promotions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  });
};

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
  const openShift =
    phase1State.shifts.find((s) => s.status === 'open') ?? phase1State.shifts[0];
  const icv = phase1State.nextIcv;
  const seq = phase1State.nextReceiptSeq;
  const formattedReceipt = `${BRANCH_CODE}-${TERMINAL_ID}-${String(seq).padStart(6, '0')}`;

  const matchedClient = phase1State.clients.find(
    (c) =>
      sale.client &&
      (c.nameAr === sale.client.trim() ||
        c.nameEn.toLowerCase() === sale.client.trim().toLowerCase())
  );

  const ledgerSale: LedgerSale = {
    id: `sal-${icv}-${Date.now()}`,
    receiptNo: sale.receiptNo || formattedReceipt,
    createdAtIso: sale.at.toISOString(),
    shiftId: openShift?.id ?? 'shf-open',
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
      cardScheme:
        p.kind === 'card' ? 'mada Atheer' : p.kind === 'wallet' ? 'Apple Pay' : undefined,
      approvalCode:
        p.kind === 'card' || p.kind === 'wallet'
          ? String(100000 + ((icv * 7919) % 899999))
          : undefined,
      rrn:
        p.kind === 'card' || p.kind === 'wallet' ? `629104${String(100000 + icv)}` : undefined,
    })),
    zatcaUuid: `${icv.toString(16).padStart(8, '0')}-4f2a-4b1c-9d3e-${Date.now().toString(16).slice(-12).padStart(12, '0')}`,
    zatcaCounter: icv,
    zatcaHash: makePseudoHash(`${formattedReceipt}-${sale.total}-${icv}`),
    zatcaStatus: 'reported',
  };

  const updatedClients = matchedClient
    ? phase1State.clients.map((c) =>
        c.id === matchedClient.id
          ? {
              ...c,
              totalVisits: c.totalVisits + 1,
              totalSpentSar: c.totalSpentSar + Math.round(sale.total / 100),
              lastVisitDate: sale.at.toISOString().slice(0, 10),
            }
          : c
      )
    : phase1State.clients;

  commitPhase1State({
    ...phase1State,
    sales: [ledgerSale, ...phase1State.sales],
    clients: updatedClients,
    nextReceiptSeq: seq + 1,
    nextIcv: icv + 1,
  });
};

export const voidLedgerSale = (saleId: string, reason: string) => {
  commitPhase1State({
    ...phase1State,
    sales: phase1State.sales.map((s) =>
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
  commitPhase1State({
    ...phase1State,
    sales: phase1State.sales.map((s) =>
      s.zatcaStatus === 'pending' ? { ...s, zatcaStatus: 'reported' } : s
    ),
  });
};

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
  commitPhase1State({
    ...phase1State,
    shifts: [newShift, ...phase1State.shifts],
  });
};

export const closeActiveShift = (
  shiftId: string,
  closedBy: string,
  closingCountHalalas: number,
  notes?: string
) => {
  commitPhase1State({
    ...phase1State,
    shifts: phase1State.shifts.map((sh) =>
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
  commitPhase1State({
    ...phase1State,
    shifts: phase1State.shifts.map((sh) =>
      sh.id === shiftId
        ? { ...sh, cashDropsHalalas: sh.cashDropsHalalas + amountHalalas }
        : sh
    ),
  });
};

export function computeShiftSummary(shift: ShiftRecord, allSales: LedgerSale[]) {
  const shiftSales = allSales.filter((s) => s.shiftId === shift.id && s.status === 'completed');
  const voidedCount = allSales.filter(
    (s) => s.shiftId === shift.id && s.status === 'voided'
  ).length;

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
  const expectedCashHalalas =
    shift.openingFloatHalalas + netCashSales - shift.cashDropsHalalas;
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
  const state = useSyncExternalStore(
    subscribePhase1,
    () => phase1State,
    () => DEFAULT_PHASE1_STATE
  );
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

/* ----------------------------------------------------------------------------
 * Phase 3 & 4 Store (`usePhase34Store` — Packages, Therapists, Rooms, Products)
 * ------------------------------------------------------------------------- */
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
  value: number;
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
  daysOff: string[];
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

const PHASE34_STORAGE_KEY = 'oasis-phase34-store-v3';

const DEFAULT_PHASE34_STATE: Phase34State = {
  packages: SEED_PACKAGES,
  packageSessions: SEED_PACKAGE_SESSIONS,
  commissionRules: SEED_COMMISSION_RULES,
  therapists: SEED_THERAPISTS,
  rooms: SEED_ROOMS,
  products: SEED_PRODUCTS,
};

const readPhase34State = (): Phase34State => {
  if (typeof window === 'undefined') return DEFAULT_PHASE34_STATE;
  try {
    const raw = localStorage.getItem(PHASE34_STORAGE_KEY);
    if (!raw) return DEFAULT_PHASE34_STATE;
    const parsed = JSON.parse(raw) as Partial<Phase34State>;
    return {
      packages: parsed.packages ?? DEFAULT_PHASE34_STATE.packages,
      packageSessions: parsed.packageSessions ?? DEFAULT_PHASE34_STATE.packageSessions,
      commissionRules: parsed.commissionRules ?? DEFAULT_PHASE34_STATE.commissionRules,
      therapists: parsed.therapists ?? DEFAULT_PHASE34_STATE.therapists,
      rooms: parsed.rooms ?? DEFAULT_PHASE34_STATE.rooms,
      products: parsed.products ?? DEFAULT_PHASE34_STATE.products,
    };
  } catch {
    return DEFAULT_PHASE34_STATE;
  }
};

let phase34State: Phase34State =
  typeof window === 'undefined' ? DEFAULT_PHASE34_STATE : readPhase34State();
const phase34Listeners = new Set<() => void>();

const commitPhase34 = (next: Phase34State) => {
  phase34State = next;
  try {
    localStorage.setItem(PHASE34_STORAGE_KEY, JSON.stringify(phase34State));
  } catch {}
  phase34Listeners.forEach((l) => l());
};

const subscribePhase34 = (cb: () => void) => {
  phase34Listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PHASE34_STORAGE_KEY) {
      phase34State = readPhase34State();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    phase34Listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

export const addPackageCatalog = (pkg: Omit<PackageCatalogItem, 'id'>) => {
  commitPhase34({
    ...phase34State,
    packages: [...phase34State.packages, { ...pkg, id: `pkg-${Date.now()}` }],
  });
};

export const updatePackageCatalog = (id: string, patch: Partial<PackageCatalogItem>) => {
  commitPhase34({
    ...phase34State,
    packages: phase34State.packages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  });
};

export const redeemPackageSession = (sessionId: string) => {
  commitPhase34({
    ...phase34State,
    packageSessions: phase34State.packageSessions.map((ps) =>
      ps.id === sessionId && ps.usedQty < ps.totalQty ? { ...ps, usedQty: ps.usedQty + 1 } : ps
    ),
  });
};

export const issueClientPackageSession = (entry: Omit<ClientPackageSession, 'id'>) => {
  commitPhase34({
    ...phase34State,
    packageSessions: [{ ...entry, id: `ps-${Date.now()}` }, ...phase34State.packageSessions],
  });
};

export const addTherapistProfile = (th: Omit<TherapistProfile, 'id'>) => {
  commitPhase34({
    ...phase34State,
    therapists: [...phase34State.therapists, { ...th, id: `th-${Date.now()}` }],
  });
};

export const updateTherapistProfile = (id: string, patch: Partial<TherapistProfile>) => {
  commitPhase34({
    ...phase34State,
    therapists: phase34State.therapists.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  });
};

export const updateRoomConfig = (id: string, patch: Partial<RoomConfig>) => {
  commitPhase34({
    ...phase34State,
    rooms: phase34State.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  });
};

export const addRoomConfig = (room: Omit<RoomConfig, 'id'>) => {
  commitPhase34({
    ...phase34State,
    rooms: [...phase34State.rooms, { ...room, id: `rm-${Date.now()}` }],
  });
};

export const adjustProductStock = (id: string, delta: number) => {
  commitPhase34({
    ...phase34State,
    products: phase34State.products.map((p) =>
      p.id === id ? { ...p, stockQty: Math.max(0, p.stockQty + delta) } : p
    ),
  });
};

export const addInventoryProduct = (prod: Omit<InventoryProduct, 'id'>) => {
  commitPhase34({
    ...phase34State,
    products: [{ ...prod, id: `prd-${Date.now()}` }, ...phase34State.products],
  });
};

export function usePhase34Store() {
  const state = useSyncExternalStore(
    subscribePhase34,
    () => phase34State,
    () => DEFAULT_PHASE34_STATE
  );
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

/* ----------------------------------------------------------------------------
 * Settings Store (`useSettingsStore` & ZATCA TLV Encoder)
 * ------------------------------------------------------------------------- */
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
  role: Role;
  pinCode: string;
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

const SETTINGS_STORAGE_KEY = 'aura-settings-v4';

const readSettingsStorage = (): SettingsState => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
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

let settingsState: SettingsState =
  typeof window === 'undefined' ? DEFAULT_SETTINGS : readSettingsStorage();
const settingsListeners = new Set<() => void>();

const commitSettings = (next: SettingsState) => {
  settingsState = next;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsState));
  } catch {}
  settingsListeners.forEach((l) => l());
};

export const updateSettings = (updater: (prev: SettingsState) => SettingsState) => {
  commitSettings(updater(settingsState));
};

export const resetSettingsToDefault = () => {
  commitSettings(DEFAULT_SETTINGS);
};

const subscribeSettings = (cb: () => void) => {
  settingsListeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SETTINGS_STORAGE_KEY) {
      settingsState = readSettingsStorage();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    settingsListeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

export function useSettingsStore() {
  const snap = useSyncExternalStore(
    subscribeSettings,
    () => settingsState,
    () => DEFAULT_SETTINGS
  );
  return {
    settings: snap,
    updateSettings,
    resetSettingsToDefault,
  };
}
