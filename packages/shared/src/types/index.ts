export type Lang = 'ar' | 'en';
export type AppRole = 'admin' | 'cashier';
export type AppMode = 'POS_TERMINAL' | 'CLOUD_OWNER';

export type ServiceKind = 'massage' | 'moroccan_bath' | 'pedicure' | 'other';
export type ApptStatus = 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
export type BookingSource = 'walk_in' | 'phone' | 'whatsapp' | 'web';
export type PaymentKind = 'cash' | 'card' | 'wallet' | 'transfer' | 'package';
export type CardScheme = 'mada' | 'visa' | 'mastercard' | 'apple_pay' | 'stc_pay';
export type PaymentProvider = 'hala' | 'cash' | 'bank';
export type SupplyCategory = 'oils' | 'scrubs' | 'towels' | 'hygiene' | 'other';

export interface ServiceItem {
  id: string;
  code: string;
  kind: ServiceKind;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  durationMin: number;
  priceHalalas: number; // VAT-inclusive
  taxRate: number; // 15
  isActive: boolean;
}

export interface PackageItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  priceHalalas: number;
  durationMin: number;
  contents: Array<{ serviceId: string; qty: number }>;
  validDays: number;
  isActive: boolean;
}

export interface SupplyItem {
  id: string;
  sku: string;
  category: SupplyCategory;
  nameAr: string;
  nameEn: string;
  unitAr: string;
  unitEn: string;
  costHalalas: number;
  stockQty: number;
  reorderLevel: number;
  isActive: boolean;
}

export interface TherapistItem {
  id: string;
  nameAr: string;
  nameEn: string;
  phone?: string;
  skills: ServiceKind[];
  commissionPercent: number;
  isActive: boolean;
}

export interface RoomItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  floorAr?: string;
  floorEn?: string;
  forKind?: ServiceKind;
  bufferMinutes: number;
  liveState: 'available' | 'occupied' | 'sanitizing' | 'maintenance';
  isActive: boolean;
}

export interface AppointmentItem {
  id: string;
  branchId: string;
  customerId?: string | null;
  serviceId?: string | null;
  packageId?: string | null;
  therapistId?: string | null;
  roomId?: string | null;
  startsAt: string; // ISO string
  endsAt: string; // ISO string
  status: ApptStatus;
  source: BookingSource;
  paid: boolean;
  notes?: string;
  saleId?: string | null;
}

export interface ClientItem {
  id: string;
  nameAr: string;
  nameEn?: string;
  phone?: string;
  email?: string;
  notesAr?: string;
  notesEn?: string;
  balanceHalalas: number;
  isActive: boolean;
}

export interface ShiftRecord {
  id: string;
  branchCode: string;
  terminalId: string;
  status: 'open' | 'closed';
  openedBy: string;
  openedAtIso: string;
  openingFloatHalalas: number;
  cashDropsHalalas: number;
  closedBy?: string;
  closedAtIso?: string;
  closingCountHalalas?: number;
  notes?: string;
}

export interface SaleItemLine {
  id: string;
  saleId: string;
  serviceId?: string | null;
  packageSessionId?: string | null;
  therapistId?: string | null;
  descriptionAr: string;
  descriptionEn: string;
  qty: number;
  unitPriceHalalas: number;
  discountHalalas: number;
  taxRate: number;
  lineTotalHalalas: number;
}

export interface PaymentLine {
  id: string;
  saleId: string;
  kind: PaymentKind;
  provider: PaymentProvider;
  amountHalalas: number;
  cardScheme?: CardScheme;
  approvalCode?: string; // HALA 6-digit approval code
  rrn?: string; // HALA 12-digit RRN
  terminalTid?: string;
  createdAtIso: string;
}

export interface SaleRecord {
  id: string;
  branchId: string;
  terminalId: string;
  shiftId: string;
  documentType: '388' | '381'; // 388 = Simplified Tax Invoice, 381 = Credit Note
  receiptNo: string;
  customerId?: string | null;
  cashierId: string;
  status: 'completed' | 'voided';
  subtotalHalalas: number;
  discountHalalas: number;
  taxHalalas: number;
  grandTotalHalalas: number;
  changeHalalas: number;
  zatcaUuid: string;
  zatcaIcv: number;
  zatcaPrevHash: string;
  zatcaHash: string;
  zatcaQr: string;
  zatcaStatus: 'pending' | 'reported' | 'cleared' | 'rejected';
  correctsSaleId?: string;
  voidReason?: string;
  createdAtIso: string;
}
