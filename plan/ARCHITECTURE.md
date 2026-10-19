# Aura Spa — POS & Management System: Architecture Plan

> Full-stack plan to grow the current `aura-spa-salon` marketing site into an
> **offline-capable in-store POS**, a **Supabase cloud layer that syncs**, and an
> **easy end-to-end dashboard**. Borrows the mature sales/accounting schema from the
> APEX Store system; skips its legacy stack and its security flaws.

---

## 1. Current state

- `aura-spa-salon` is a **bilingual (Arabic-RTL default / English)** Next.js 16 + React 19 + Tailwind 4 **static marketing site**.
- Clean domain model already in `src/data/salonData.ts`: services (`massage` / `moroccan-bath` / `pedicure`), packages, specialists, gallery, FAQ. Prices in **SAR**.
- **No backend, database, Express, or Supabase yet.** This is a build-up, not a refactor.
- Context: Saudi/GCC → **ZATCA e-invoicing applies**.

## 2. Core architectural decision: local-first

The hard requirement — *works offline, syncs to Supabase when online* — is a **local-first** problem. Do **not** hand-roll sync.

> **Local SQLite on each POS is the source of truth during operation. A sync engine replicates to/from Supabase (cloud Postgres) in the background.**

**Sync engine: [PowerSync](https://powersync.com)** (purpose-built for Supabase ↔ local SQLite, with conflict handling). Alternative: ElectricSQL.

```
┌─────────────────── IN THE STORE (works offline) ───────────────────┐
│  Electron Desktop POS                                               │
│   • Next.js UI (reuse existing components)                          │
│   • Local SQLite  ← instant read/write (sales, tickets, receipts)  │
│   • Node hardware layer: ESC/POS printer + payment terminal         │
└───────────────┬────────────────────────────────────────────────────┘
               │  PowerSync (syncs when internet available)
               ▼
┌──────────────────────────── CLOUD ─────────────────────────────────┐
│  Supabase: Postgres · Auth · Storage · Realtime · RLS · Edge Fns    │
│               ▲ direct (online)                                     │
│  Dashboard & Online Booking — Next.js on Vercel                     │
└─────────────────────────────────────────────────────────────────────┘
```

**No separate Express server needed.** Supabase is the backend (Postgres + Auth + RLS + Edge Functions). Drop Express unless preserving existing logic.

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI (shared) | Next.js 16 + React 19 + Tailwind 4 + **shadcn/ui** + **TanStack Query/Table** | Reuse components across POS, dashboard, booking |
| In-store POS | **Electron** + local **SQLite** | Real offline, always-on, Node for hardware (Tauri if smaller/faster wanted) |
| Sync | **PowerSync** | SQLite ↔ Supabase, conflict resolution |
| Cloud backend | **Supabase** | Required cloud layer; replaces Express |
| Schema/migrations | **Drizzle ORM** | Type-safe, versioned |
| Validation | **Zod** | Shared front/back |
| Auth | Supabase Auth (staff/admin) + **PIN** fast-login (cashiers) | Cashiers can't type emails all day |
| Hardware | `node-thermal-printer` (ESC/POS) + payment provider SDK | Receipt + card terminal |
| i18n | Existing ar/en + RTL | Head start — keep |

## 4. Data model — reuse APEX, add spa scheduling

APEX solved **sales/accounting/inventory**. You add the **scheduling** half it lacks.

**Borrowed from APEX (proven core):**

| APEX | This system | Purpose |
|---|---|---|
| `items`, `categories`, `itemsunits` | `services`, `service_categories` | Treatments & durations |
| `persons`, `financialaccount` | `customers`, `suppliers` | Clients (+ credit balances) |
| `salesmans`, `commissions_list` | `therapists`, `commission_rules` | Staff + commission |
| `pos`, `salesbill`, `itemtransactions` | `sales`, `sale_items` | Tickets / checkout lines |
| `receipts`, `receiptspayments`, `paymentmethods` | `payments`, `payment_methods` | Split/partial payments |
| `shifts`, `cashier_custody` | `shifts`, `cash_drawer` | Open/close day, Z-reports |
| `discounts`, `discountonitems_*` | `discounts`, `promotions` | Offers & coupons |
| `stocking`, `balances`, `storeGoods` | `products`, `stock` | Retail (oils, cosmetics) |
| `EInvoice_*`, `eInvoiceSetting` | `einvoice_*` | **ZATCA e-invoicing** |
| `branches`, `accounts`, `accountpermissions` | `branches`, `users`, `roles`, `permissions` | Multi-branch + RBAC |
| `generalsettings`, `companydata`, `currencies` | `settings`, `company` | Config |

**New (spa-specific):** `appointments`, `rooms`, `therapist_availability`, `packages`, `package_sessions`, `memberships`, `service_resources`.

**Do not copy APEX's mistakes:** it stored passwords in plain text and the DB `sa` password in base64. Use **Supabase Auth (hashed)** + **Row-Level Security**.

## 5. Offline & sync rules

- **UUID PKs generated on-device** — never DB auto-increment (two offline terminals must never collide).
- **Receipt/invoice numbers:** offline-safe `BRANCH-TERMINAL-SEQ`, reconciled on sync. ZATCA hashing at sale time on-device.
- **Append-only ledger:** sales/payments immutable once created; edits = correcting records (APEX `willDelete` soft-delete pattern). Makes conflicts near-impossible.
- **Direction:** transactions sync up; catalog/prices/staff/settings sync down.
- **Backups:** nightly local SQLite snapshot + Supabase point-in-time recovery.

## 6. Hardware (retrofit later)

Build checkout to call a **local hardware endpoint** from day one.
- **Receipt printer (ESC/POS):** Electron Node process (`node-thermal-printer`) over USB/network. Epson TM / Xprinter / Rongta.
- **Payment terminal:** start **standalone** (cashier keys amount, app records "paid by card"). Upgrade to **semi-integrated** via acquirer SDK — KSA: **Geidea / HyperPay / PayTabs / Amazon Payment Services / Moyasar**. Pick provider before building.

## 7. Dashboard (role-aware, one Next.js app)

- **Owner/Admin:** revenue, top services, therapist performance/commissions, occupancy, stock alerts, ZATCA status.
- **Reception:** calendar (day/week), book/reschedule/check-in, customer lookup.
- **Cashier (POS):** touch-first, PIN login, open ticket → add services → discount → split payment → print → close shift.
- Libs: shadcn/ui + TanStack Table + FullCalendar / `react-big-calendar`. Touch-first, bilingual.

## 8. Roadmap

| Phase | Scope | Est. |
|---|---|---|
| **0 — Foundation** | Supabase project, schema (Drizzle), RLS, Auth, seed from `salonData.ts` | 1 wk |
| **1 — Core POS (online)** | Services, customers, checkout, payments, receipt print, shifts | 2–3 wks |
| **2 — Offline + sync** | Electron, local SQLite, PowerSync, UUIDs, append-only ledger | 2–3 wks |
| **3 — Scheduling** | Appointments calendar, therapists, rooms, packages/memberships | 2–3 wks |
| **4 — Dashboard & reports** | KPIs, commissions, Z-reports, stock | 1–2 wks |
| **5 — ZATCA e-invoicing** | Phase-2 invoices (study APEX `EInvoice_*`) | 1–2 wks |
| **6 — Hardware** | Semi-integrated payment terminal (provider SDK) | provider-dependent |
| **7 — Online booking** | Public booking page → `appointments` | 1 wk |

**Total:** ~3–4 months part-time for a solid, offline-capable, ZATCA-ready system. Online-only MVP (Phases 0–1) demoable in ~3–4 weeks.

## 9. Open decisions (confirm with client)

1. **Country = KSA?** (ZATCA) and **payment provider/bank?**
2. **One branch or multi-branch?** (sync topology)
3. Retail products in scope at launch, or services only?

## 10. Repo layout (target)

```
massage/
├── src/                      # existing Next.js site (becomes dashboard + booking)
├── apps/
│   ├── pos/                  # Electron POS (Phase 2)
│   └── dashboard/            # (or keep in src/app/dashboard)
├── packages/
│   ├── db/                   # Drizzle schema + migrations  ← see plan/schema
│   ├── core/                 # shared domain logic + Zod schemas
│   └── sync/                 # PowerSync config
└── plan/                     # this folder
```

See `plan/schema/` for the Phase 0 schema and `plan/README.md` for setup steps.
