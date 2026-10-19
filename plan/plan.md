# واحة الإسترخاء للمساج — Plan (Remaining Work)

What's left, in order. Reflects the audit in [`state.md`](./state.md): both the
marketing site and the back-office (dashboard + POS) are built on **mock data**; the
database is schema-only with **no tooling, connection, or seed**. Design in
[`blueprint.md`](./blueprint.md).

> **Architecture note:** the back-office now lives in the Electron app
> (`apps/desktop/src/renderer/`), not `apps/web` — committed in `9dcef79`. That's the
> right home: Electron has a Node runtime, so it can talk to local SQLite + PowerSync +
> Drizzle directly (a static-exported web app can't). `apps/web` is marketing-only and
> will only need Supabase JS later for online booking (Phase 7).

---

## Phase 0 — Supabase foundation + seeding

The tooling and the first migration now exist; what remains is a live Supabase
project, the connection secret, the Auth user, and actually running migrate/seed/rls.

**Done**
- [x] Drizzle schema (`packages/db`, 21 tables, single-branch halalas).
- [x] RLS (`packages/db/rls-policies.sql`).
- [x] **A. DB tooling** — `postgres` driver; `drizzle.config.ts`; DB client
  (`src/client.ts`, Node-only); scripts `db:generate` / `db:migrate` / `db:push` /
  `db:studio` / `db:seed` / `db:rls`; **first migration generated**
  (`migrations/0000_polite_white_queen.sql`, 11 enums + 21 tables). Typechecks.
- [x] **C (DB side). Seed script** — `packages/db/seed.ts`: halalas via
  `@oasis/shared`, 15% VAT-inclusive, no removed tables, run-once guard. Seeds
  company, branch (JED01), roles, 3 categories, 4 services, 4 packages, 2 rooms, 2 therapists.
- [x] **D. VAT decided** — **VAT-registered, 15%** (ZATCA registration number not yet
  available → `company.vat_number` seeded null, to fill later). Schema default (15%)
  already matched; prices are VAT-inclusive. ZATCA stays in scope (Phase 5).
- [x] `.env.example` added (`packages/db/.env.example`).

**Remaining**
- [ ] **B. Connection secret** — get the **direct Supabase Postgres `DATABASE_URL`**,
  put it in `packages/db/.env`, then run `pnpm --filter @oasis/db db:migrate`.
- [ ] **E. Auth + seed order** — run `db:seed` (direct connection bypasses RLS), create
  a Supabase **Auth** admin user + matching `public.users.auth_user_id` (role=admin),
  **then** `db:rls`. (A cashier + hashed PIN can follow.)
- [ ] **C (app side).** The UI mock `seedData.ts` (duplicated in `apps/web` **and**
  `apps/desktop/src/renderer`) still carries the old `SEED_COMMISSION_RULES` /
  `SEED_PAYMENT_METHODS` / `SEED_PRODUCTS` arrays and `priceSar` with stale
  "0% VAT / not registered" comments — clean these when the UI moves off mock data.

**Then:** `db:migrate` → `db:seed` → create Auth admin → `db:rls` against the live project.

## Phase 1 — Wire the desktop app to data

- [ ] Wire the `apps/desktop` main process: PowerSync (`connector.ts`, `powersync.worker.ts`) ↔ Supabase, local SQLite from `apps/desktop/src/main/db/schema.ts`.
- [ ] Replace the renderer's mock stores (`data/seedData.ts`, `bookingsStore`, `dashboardData`, `phase1Store`) with reads from local SQLite via PowerSync.
- [ ] POS checkout writes real `sales` / `sale_items` / `payments` (append-only).
- [ ] Real PIN check against `users.pin_hash` (today it's a demo).
- [ ] Keep `packages/db` (Postgres) and the desktop PowerSync schema in sync.

## Phase 2 — Offline + sync hardening
- [ ] Verify UUID-on-device + append-only ledger under two offline terminals; conflict handling.

## Phase 3 — Scheduling depth
- [ ] Drag-to-reschedule on the bookings timeline, room-lane toggle, turnover buffers; package redemption against `package_sessions`.

## Phase 4 — Reports
- [ ] Replace mock aggregates with real queries: commissions (`therapists.commission_percent` × `sale_items`), Z-report, occupancy.

## Phase 5 — ZATCA Phase 2 e-invoicing *(in scope — VAT-registered; needs the registration number)*
- [ ] Implement the cryptographic stamp / CSID onboarding (fields exist on `sales`; `apps/desktop/src/main/services/zatca.worker.ts` is a stub).

## Phase 6 — Hardware
- [ ] ESC/POS 80mm printing from the Electron Node layer.
- [ ] HALA payment terminal: standalone first, then semi-integrated via SDK.

## Phase 7 — Online booking (marketing site)
- [ ] Public booking page in `apps/web` → writes `appointments` via **Supabase JS** (browser client + anon key + RLS; not Drizzle — the site is a static export).

## Open decisions (confirm with client)

Resolved: single branch, services-only (no retail), HALA payments, **VAT-registered at
15%** (ZATCA in scope). Still open:
1. The **ZATCA VAT registration number** (15 digits) — pending; fill `company.vat_number` once available.
2. Supabase plan/region and who owns the project; the direct `DATABASE_URL`.
3. HALA onboarding (merchant/terminal IDs) — needed before Phase 6.
