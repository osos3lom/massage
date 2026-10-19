# واحة الإسترخاء للمساج — Dashboard Settings Specification

> Comprehensive architecture and implementation plan for `/dashboard/settings`.
> Covers Supabase backend integration, ZATCA Phase 2 e-invoicing compliance,
> weekly working hours, contactless POS payment terminals (mada / Apple Pay),
> carbon & thermal receipt printing, and a simplified dual-role model (`admin` & `cashier`).

---

## 1. Role Model: Two Roles Only (`admin` & `cashier`)

Per business requirements, system access is simplified to two user roles:

| Role | Access Scope | Login Mechanism |
|---|---|---|
| **Admin (`admin`)** | Full control: Company profile, ZATCA e-invoicing keys, working hours, services/catalog, financial reports, payment terminals, printers, staff management, and all settings. | Supabase Auth (Email + Password / MFA) for back-office web dashboard. |
| **Cashier (`cashier`)** | Operational only: Front desk POS checkout, appointment lookup & scheduling, client check-in, shift opening/closing (cash custody & Z-reports). Settings is locked/hidden. | Fast 4-digit PIN (`users.pin_hash`) on POS terminal for instant switching; linked to Supabase Auth operator ID. |

### Supabase RLS Matrix for Settings
* Tables: `company`, `branches`, `settings`, `payment_methods`, `roles`, `users`.
* **Read:** All authenticated users (`admin` and `cashier`) can read configuration needed for POS operation (working hours, active payment methods, receipt headers, company VAT).
* **Write:** Strictly restricted to `admin` via `public.is_admin()` (`auth.jwt() -> app_metadata.role = 'admin'`).

---

## 2. Settings Route Architecture (`/dashboard/settings`)

The settings screen is organized into 6 dedicated tabs:

```
/dashboard/settings
 ├── [1] General & Branch (Company identity, CR, contact, multi-branch toggle)
 ├── [2] ZATCA Phase 2 (CSID onboarding, cryptographic stamp, device compliance)
 ├── [3] Working Hours & Timing (Center schedule, prayer breaks, session buffer)
 ├── [4] Contactless Payments (mada, Apple Pay, semi-integrated terminal SDKs)
 ├── [5] Carbon & Thermal Printers (ESC/POS, 80mm, dot-matrix 2-ply, Arabic RTL)
 └── [6] Staff & PINs (Admin accounts, cashier profiles, 4-digit POS PINs)
```

---

## 3. Tab-by-Tab Technical Specification

### Tab 1: General & Branch Profile
* **Backing Tables:** `company`, `branches`
* **Fields:**
  - Company Legal Name (Arabic: `واحة الإسترخاء للمساج` / English: `Relaxation Oasis Massage`).
  - Commercial Registration Number (`cr_number` - 10 digits).
  - Main Branch Address, Phone, Google Maps pin.
  - Receipt Logo Upload: Uploads directly to Supabase Storage bucket (`receipt-assets`).

### Tab 2: ZATCA Phase 2 E-Invoicing Integration
Compliance with the Saudi Zakat, Tax and Customs Authority (ZATCA) Fatoora Phase 2 requirements for **Simplified Tax Invoices (B2C)** and Standard Tax Invoices:

* **Key Requirements & Architecture:**
  1. **Cryptographic Stamp & Key Generation:**
     - Generate ECDSA secp256k1 keypair per POS device.
     - Onboarding wizard: Generate CSR (Certificate Signing Request) with OTP obtained from ZATCA Fatoora Portal.
     - Receive and store the **Compliance CSID** and **Production CSID** (`zatca_csid`, `zatca_binary_token`, `zatca_secret`).
  2. **Invoice Hashing & Cryptographic Chaining:**
     - Sequential Invoice Counter (`ICV`): device-level integer incremented with every sale.
     - Previous Invoice Hash (`PIH`): SHA-256 hash of the preceding invoice XML, guaranteeing anti-tamper ledger chaining.
  3. **ZATCA QR Code Generator (TLV Format):**
     - Base64 encoded TLV (Tag-Length-Value) containing 9 mandatory tags:
       - Tag 1: Seller Name
       - Tag 2: VAT Registration Number (15 digits ending in 3)
       - Tag 3: Timestamp (ISO 8601 with KSA timezone)
       - Tag 4: Invoice Total (with VAT)
       - Tag 5: VAT Total
       - Tag 6: SHA-256 Hash of XML invoice
       - Tag 7: ECDSA Cryptographic Stamp (digital signature)
       - Tag 8: ECDSA Public Key
       - Tag 9: ZATCA Certificate Signature
  4. **Offline Resilience & 24h Reporting Window:**
     - POS terminals stamp and print simplified tax invoices offline immediately with the generated ZATCA QR code.
     - Once internet is available, invoices sync to Supabase and a Supabase Edge Function (`report-zatca-invoice`) submits them to the ZATCA Reporting API within the statutory 24-hour window.

### Tab 3: Working Hours & Session Timing
* **Backing Table:** `settings` (key: `center_working_hours`)
* **Configuration:**
  - **Weekly Schedule:** Opening & closing time for each day (Saturday through Friday). Example: 10:00 AM – 11:30 PM.
  - **Friday Prayer Pause:** Configurable blackout window (e.g., 11:30 AM – 01:30 PM).
  - **Session Turnover Buffer:** Default 10–15 minutes between sessions for room sanitization and fresh linen setup.
  - **Max Advance Booking Window:** e.g., 14 days or 30 days.

### Tab 4: Contactless Payment Integration
* **Backing Table:** `payment_methods`, `settings` (key: `payment_gateway_config`)
* **Methods Supported:**
  - **Cash:** Integrated with cash drawer kick-out via printer RJ11 port.
  - **Contactless Card (mada, Visa, Mastercard):** Tap-to-pay via NFC terminal.
  - **Digital Wallets:** Apple Pay, STC Pay.
* **Terminal Integration Modes:**
  - **Semi-Integrated Mode (Recommended):** POS sends amount via local network (TCP/IP / Bluetooth / USB) to the bank terminal (Geidea, Moyasar, or HyperPay POS terminal). Cashier does not manually re-enter amounts. Terminal replies with transaction outcome, approval code, card scheme, and RRN.
  - **Standalone Mode (Manual Fallback):** Cashier enters transaction reference number manually if terminal network fails.

### Tab 5: Carbon & Thermal Receipt Printers
* **Backing Table:** `settings` (key: `printer_configuration`)
* **Hardware Supported:**
  1. **Thermal Receipt Printer (80mm ESC/POS):** Fast thermal receipt with high-contrast ZATCA QR code, auto-cutter, and RJ11 cash drawer trigger.
  2. **Carbon Copy / Dot-Matrix Printer (2-Ply / 3-Ply):** Continuous impact printer (e.g., Epson TM-U220 / LX-350) printing duplicate carbon-copy receipts (Customer Copy + Accountant Copy).
* **Settings & Print Rules:**
  - Printer Connection: Network (IP:Port), USB, or Bluetooth.
  - Printing Mode: ESC/POS Raster Graphics Mode (guarantees crisp Arabic typography without relying on legacy hardware codepages).
  - Dual Copy Setting: Automatically prints "Customer Copy" and "Audit Copy".
  - Custom Header/Footer: Arabic greeting, VAT/CR notice, Wi-Fi password, return/cancellation policy.

### Tab 6: Staff & POS Fast-Login PINs
* **Backing Tables:** `users`, `roles`
* **Configuration:**
  - Admin users: Managed with email & password for management web dashboard.
  - Cashier accounts: Fast setup with full name, active status, and 4-digit PIN.
  - Secure PIN Storage: Only bcrypt/argon2 salted hash stored in `users.pin_hash` — plain text PINs are never saved.

---

## 4. Implementation Steps & Milestones

1. **Schema Update (Drizzle):**
   - Streamline `roles` to `admin` and `cashier`.
   - Add structured settings keys for `zatca`, `working_hours`, `terminals`, and `printers`.
2. **Supabase Edge Functions:**
   - `zatca-onboard`: Handles CSR generation and CSID exchange with ZATCA sandbox/production.
   - `zatca-report`: Background cron/queue worker that pushes signed sales invoices to ZATCA within 24h.
3. **UI Development (`src/app/dashboard/settings/`):**
   - Replace placeholder with tabbed interface using Tailwind 4 & shadcn-style components.
   - Bilingual (Arabic RTL default, English toggle).
   - Instant live preview for receipt layout & working hour timeline.
