import { column, Schema, Table } from '@powersync/node';

export const AppSchema = new Schema({
  settings: new Table({
    branch_id: column.text,
    key: column.text,
    value: column.text, // JSON string
    updated_at: column.text
  }),

  users: new Table({
    auth_user_id: column.text,
    branch_id: column.text,
    role_name: column.text, // 'admin' | 'cashier'
    full_name_ar: column.text,
    full_name_en: column.text,
    pin_hash: column.text, // scrypt hash for offline cashier PIN unlock
    is_active: column.integer
  }),

  services: new Table({
    code: column.text,
    kind: column.text, // 'massage' | 'moroccan_bath' | 'pedicure'
    name_ar: column.text,
    name_en: column.text,
    description_ar: column.text,
    description_en: column.text,
    duration_min: column.integer,
    price_halalas: column.integer, // e.g. 25000 = 250.00 SAR (VAT-inclusive)
    tax_rate: column.integer, // 15
    is_active: column.integer
  }),

  packages: new Table({
    code: column.text,
    name_ar: column.text,
    name_en: column.text,
    price_halalas: column.integer,
    duration_min: column.integer,
    contents_json: column.text,
    valid_days: column.integer,
    is_active: column.integer
  }),

  discounts: new Table({
    code: column.text,
    name_ar: column.text,
    name_en: column.text,
    kind: column.text, // 'percent' | 'amount'
    value: column.integer,
    starts_at: column.text,
    ends_at: column.text,
    is_active: column.integer
  }),

  parties: new Table(
    {
      branch_id: column.text,
      kind: column.text, // 'customer' | 'supplier'
      name_ar: column.text,
      name_en: column.text,
      phone: column.text,
      email: column.text,
      notes_ar: column.text,
      notes_en: column.text,
      balance_halalas: column.integer,
      is_active: column.integer,
      updated_at: column.text
    },
    { indexes: { phone_idx: ['phone'] } }
  ),

  therapists: new Table({
    branch_id: column.text,
    name_ar: column.text,
    name_en: column.text,
    phone: column.text,
    skills_json: column.text,
    commission_percent: column.integer,
    is_active: column.integer
  }),

  rooms: new Table({
    branch_id: column.text,
    code: column.text,
    name_ar: column.text,
    name_en: column.text,
    floor_ar: column.text,
    floor_en: column.text,
    for_kind: column.text,
    buffer_minutes: column.integer,
    live_state: column.text, // 'available' | 'occupied' | 'sanitizing' | 'maintenance'
    is_active: column.integer
  }),

  // Internal shop supplies ONLY (massage oils, Moroccan soap, loofahs, towels — NOT for retail sale)
  supplies: new Table({
    branch_id: column.text,
    sku: column.text,
    category: column.text, // 'oils' | 'scrubs' | 'towels' | 'hygiene'
    name_ar: column.text,
    name_en: column.text,
    unit_ar: column.text,
    unit_en: column.text,
    cost_halalas: column.integer,
    stock_qty: column.integer,
    reorder_level: column.integer,
    is_active: column.integer
  }),

  appointments: new Table(
    {
      branch_id: column.text,
      customer_id: column.text,
      service_id: column.text,
      package_id: column.text,
      therapist_id: column.text,
      room_id: column.text,
      starts_at: column.text,
      ends_at: column.text,
      status: column.text, // 'booked' | 'confirmed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled'
      source: column.text, // 'walk_in' | 'phone' | 'whatsapp' | 'web'
      paid: column.integer,
      notes: column.text,
      sale_id: column.text,
      updated_at: column.text
    },
    { indexes: { appt_start: ['starts_at'], appt_therapist: ['therapist_id', 'starts_at'] } }
  ),

  package_sessions: new Table({
    branch_id: column.text,
    package_id: column.text,
    customer_id: column.text,
    service_id: column.text,
    total_qty: column.integer,
    used_qty: column.integer,
    expires_at: column.text,
    sold_sale_id: column.text
  }),

  shifts: new Table({
    branch_id: column.text,
    terminal_id: column.text,
    status: column.text, // 'open' | 'closed'
    opened_by: column.text,
    opened_at: column.text,
    opening_float_halalas: column.integer,
    cash_drops_halalas: column.integer,
    closed_by: column.text,
    closed_at: column.text,
    closing_count_halalas: column.integer,
    notes: column.text
  }),

  // APPEND-ONLY FISCAL LEDGER
  sales: new Table(
    {
      branch_id: column.text,
      terminal_id: column.text,
      shift_id: column.text,
      document_type: column.text, // '388' (Simplified Tax Invoice) | '381' (Credit Note / Void)
      receipt_no: column.text, // JED01-T1-000001
      customer_id: column.text,
      cashier_id: column.text,
      status: column.text, // 'completed'
      subtotal_halalas: column.integer,
      discount_halalas: column.integer,
      tax_halalas: column.integer,
      grand_total_halalas: column.integer,
      change_halalas: column.integer,
      zatca_uuid: column.text,
      zatca_icv: column.integer,
      zatca_prev_hash: column.text,
      zatca_hash: column.text,
      zatca_signature: column.text,
      zatca_qr: column.text,
      zatca_status: column.text, // 'pending' | 'reported' | 'cleared' | 'rejected'
      corrects_sale_id: column.text,
      void_reason: column.text,
      created_at: column.text
    },
    { indexes: { sales_created: ['created_at'], sales_shift: ['shift_id'] } }
  ),

  sale_items: new Table(
    {
      branch_id: column.text,
      sale_id: column.text,
      service_id: column.text,
      package_session_id: column.text,
      therapist_id: column.text,
      description_ar: column.text,
      description_en: column.text,
      qty: column.integer,
      unit_price_halalas: column.integer,
      discount_halalas: column.integer,
      tax_rate: column.integer,
      line_total_halalas: column.integer
    },
    { indexes: { item_sale: ['sale_id'] } }
  ),

  payments: new Table(
    {
      branch_id: column.text,
      sale_id: column.text,
      kind: column.text, // 'cash' | 'card' | 'wallet' | 'transfer' | 'package'
      provider: column.text, // 'hala' | 'cash' | 'bank'
      amount_halalas: column.integer,
      card_scheme: column.text, // 'mada' | 'visa' | 'mastercard' | 'apple_pay' | 'stc_pay'
      approval_code: column.text, // HALA 6-digit approval code
      rrn: column.text, // HALA 12-digit Retrieval Reference Number
      terminal_tid: column.text, // HALA Terminal ID
      created_at: column.text
    },
    { indexes: { pay_sale: ['sale_id'] } }
  )
});
