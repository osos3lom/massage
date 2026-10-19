# واحة الإسترخاء للمساج — Blueprint

The enduring design for growing the marketing site into an **offline-capable,
ZATCA-ready POS + management system** for a single massage/hammam/pedicure center
in Al Nuzha, Jeddah. This is the "what we're building and why." Current build
status lives in [`state.md`](./state.md); remaining work in [`plan.md`](./plan.md).

> Supersedes the earlier `ARCHITECTURE.md`, `DASHBOARD.md`, `SETTINGS.md` and
> `README.md`. Where those described a multi-branch / retail / `payment_methods`
> model, the live schema (`packages/db`) has since narrowed to the decisions
> recorded in §2 below — this doc reflects the live decisions, not the drafts.

---

## 1. Core decision: local-first

The hard requirement — *works offline in the store, syncs to the cloud when
online* — is a **local-first** problem. Do not hand-roll sync.

> Local SQLite on each POS terminal is the source of truth during operation.
> A sync engine (**PowerSync**) replicates to/from **Supabase** (cloud Postgres)
> in the background, with conflict handling. Supabase is the backend
> (Postgres + Auth + Storage + RLS) — no separate Express server.

```
┌─────────────── IN THE STORE (works offline) ───────────────┐
│  Electron desktop POS (apps/desktop)                        │
│   • Next.js UI (shared components)                          │
│   • Local SQLite  ← instant read/write                      │
│   • Node hardware layer: ESC/POS printer + payment terminal │
└───────────────┬─────────────────────────────────────────────┘
                │  PowerSync (when online)
                ▼
┌───────────────────────── CLOUD ─────────────────────────────┐
│  Supabase: Postgres · Auth · Storage · RLS                   │
│  Dashboard & online booking — Next.js (apps/web) on Pages    │
└──────────────────────────────────────────────────────────────┘
```

## 2. Locked decisions (reflected in `packages/db`)

| Decision | Choice | Where in code |
|---|---|---|
| Country / tax | **KSA**, VAT 15%, **ZATCA Phase 2** e-invoicing | `sales.zatca_*` fields, `tax_rate` |
| Branches | **Single branch (JED01)** — branch-scoped columns kept for future-proofing | `branches`, `branch_id` on tables |
| Money | **Integer halalas** everywhere (no floats) | `*_halalas` columns, `@oasis/shared/money` |
| Retail | **No retail sales.** Internal consumables only | `supplies` table ("NO Retail Sales") — replaces the old `products` |
| Commission | **Inline per therapist** | `therapists.commission_percent` — replaces a `commission_rules` table |
| Payments | **Payment kind as enum + HALA provider fields** | `payment_kind`, `card_scheme`, `payments.approval_code/rrn/terminal_tid` — replaces a `payment_methods` table |
| Roles | **Two only: `admin` and `cashier`** | `roles`, `nav.ts` `roles`, RLS `is_admin()` |
| Auth | Supabase Auth (admin, email+password) + **4-digit PIN** fast-login (cashier) | `users.pin_hash` |

## 3. Tech stack

| Layer | Choice |
|---|---|
| UI (shared) | Next.js 16 + React 19 + Tailwind 4 |
| Web (site + dashboard + POS) | `apps/web`, static export |
| In-store POS | **Electron** + local **SQLite** (`apps/desktop`) |
| Sync | **PowerSync** (SQLite ↔ Supabase) |
| Cloud backend | **Supabase** (Postgres + Auth + RLS) |
| Schema / migrations | **Drizzle ORM** (`packages/db`) |
| Shared domain (money, types) | `packages/shared` |
| i18n | Arabic-RTL default + English |
| Hardware | ESC/POS thermal printer + payment terminal (HALA) |

## 4. Data model (`packages/db/src/schema.ts`)

21 tables, UUID PKs generated on-device (offline-safe), append-only sales/payments.

- **Org:** `company`, `branches`, `settings`
- **People:** `users`, `roles`, `parties` (customers/suppliers), `therapists`, `therapist_availability`
- **Catalog:** `service_categories`, `services`, `packages`, `supplies`
- **Scheduling:** `appointments`, `package_sessions`, `rooms`
- **Money (append-only):** `shifts`, `sales`, `sale_items`, `payments`, `discounts`
- **Sync:** `sync_quarantine` (failed-sync payloads)

**Offline & sync rules:**
- UUID PKs on-device — never DB auto-increment (two terminals must never collide).
- Receipt numbers `BRANCH-TERMINAL-SEQ`, reconciled on sync; ZATCA hashing at sale time.
- Append-only ledger: sales/payments immutable; corrections are new rows (`corrects_sale_id`, `void_reason`).
- Direction: transactions sync up; catalog/prices/staff/settings sync down.

**Security (`packages/db/rls-policies.sql`):** Supabase RLS, branch-scoped. Cashiers
read/write within their branch; admins everywhere. Catalog/config readable by all
staff, writable by admin only. `sale_items`/`payments` are SELECT+INSERT only
(ZATCA anti-tampering). Hashed PINs only — never plain text.

## 5. Dashboard IA (back-office — now `apps/desktop/src/renderer/src/features/`, sidebar in `nav.ts`)

> Routes below are the conceptual IA. In the Electron renderer they are hash routes
> (`router.tsx`); they were formerly Next routes under `apps/web/src/app/dashboard`
> before the back-office moved to the desktop app (see `state.md` §3).

Grouped by the four loops a center runs on: **front desk** (reception), **floor**
(therapists), **money** (cashier/owner), **business** (owner).

| Group | Page | Route | Roles | Primary tables |
|---|---|---|---|---|
| Overview | Dashboard | `/dashboard` | admin, cashier | sales, appointments, therapists |
| Front desk | Bookings | `/dashboard/bookings` | admin, cashier | appointments, therapists, rooms, services, parties |
| | Checkout (POS) | `/pos` (full-screen) | admin, cashier | sales, sale_items, payments, package_sessions |
| | Clients | `/dashboard/clients` | admin, cashier | parties |
| Menu | Services | `/dashboard/services` | admin, cashier | services, service_categories |
| | Packages | `/dashboard/packages` | admin, cashier | packages, package_sessions |
| | Promotions | `/dashboard/promotions` | admin, cashier | discounts |
| Team | Therapists | `/dashboard/therapists` | admin, cashier | therapists, therapist_availability |
| | Rooms | `/dashboard/rooms` | admin, cashier | rooms |
| Money | Sales & invoices | `/dashboard/sales` | admin, cashier | sales, sale_items, payments |
| | Shifts & cash | `/dashboard/shifts` | admin, cashier | shifts |
| | Reports | `/dashboard/reports` | admin | sales, sale_items, appointments |
| | Inventory | `/dashboard/inventory` | admin | supplies |
| System | Settings | `/dashboard/settings` | admin | company, branches, users, roles, settings |

> The `tables` metadata in `nav.ts` still names `commission_rules`, `products`,
> `payment_methods`; those are stale labels (see §2) and should be updated when
> pages are wired to the DB. UI role-hiding is convenience; **RLS is the guard.**

**Key screens:**
- **`/dashboard` (overview):** KPI row (revenue today, bookings, occupancy, average
  ticket, no-shows), 7-day revenue bar, next arrivals, service mix, therapist
  utilisation, "needs attention" (unassigned bookings, awaiting payment, no-shows).
- **`/dashboard/bookings` (resource timeline):** therapist rows × hours, *Unassigned*
  lane, now-line; day/week; click → side panel (check-in, checkout→POS, reschedule,
  no-show). Status lifecycle: booked → confirmed → checked_in → completed (+ no_show).
- **`/pos` (cashier till, touch-first):** PIN unlock; ready-to-pay queue from
  appointments; menu tiles; ticket lines each with a therapist (drives commission);
  split tender (cash/card/wallet/transfer); VAT 15% extracted from inclusive prices;
  80mm receipt with ZATCA QR placeholder; close-shift Z-report. This screen is what
  becomes the Electron app.

## 6. Settings (`/dashboard/settings`, admin-only)

Six tabs: **General & Branch** (company identity, CR, VAT, Supabase project config) ·
**ZATCA Phase 2** (CSID onboarding, cryptographic stamp, device compliance) ·
**Working Hours & Timing** (schedule, prayer breaks, session buffers) ·
**Contactless Payments** (mada / Apple Pay, HALA terminal) ·
**Printers** (80mm ESC/POS thermal, Arabic RTL) · **Staff & PINs** (admin accounts,
cashier 4-digit PINs). Write access restricted to `admin` via RLS `is_admin()`.

## 7. Hardware (retrofit later)

Checkout calls a **local hardware endpoint** from day one. Receipt printer (ESC/POS)
via the Electron Node process. Payment terminal starts **standalone** (cashier keys
the amount, app records "paid by card"), upgrading to **semi-integrated** via the
**HALA** SDK.
