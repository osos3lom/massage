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

Schema and RLS are drafted; **everything needed to actually connect and seed is
missing.** These are the prerequisites, grouped.

**Status so far**
- [x] Drizzle schema drafted (`packages/db`, 21 tables, single-branch halalas).
- [x] RLS written (`packages/db/rls-policies.sql`).

**A. DB tooling — none exists yet (`packages/db`)**
- [ ] Add a Postgres driver (`postgres`) to `packages/db` (only `drizzle-orm` + `drizzle-kit` today).
- [ ] Add `drizzle.config.ts` (schema path, out dir, `dialect: postgresql`, `dbCredentials` from `DATABASE_URL`).
- [ ] Add a DB client module (`drizzle(postgres(url))`) — `index.ts` currently exports schema only.
- [ ] Add scripts: `db:generate`, `db:migrate` (or push), `db:seed`.
- [ ] Generate the first migration (none exist).

**B. Connection secret — missing**
- [ ] Get Supabase's **direct Postgres `DATABASE_URL`** (the postgres role bypasses RLS for seeding) and add it to env; add a `.env.example` documenting `NEXT_PUBLIC_SUPABASE_URL`, publishable key, and `DATABASE_URL`.

**C. Reconcile seed data with the live schema (currently out of sync)**
- [ ] `seedData.ts` still exports `SEED_COMMISSION_RULES`, `SEED_PAYMENT_METHODS`, `SEED_PRODUCTS` (the removed tables) — remap: commission → `therapists.commission_percent`; payment methods → enums; products → `supplies` (or drop).
- [ ] Convert `priceSar` → `price_halalas` (×100; `@oasis/shared/money.toHalalas` exists — `seedData.ts` redundantly redefines its own).
- [ ] Write the actual Node **seed script** (the old `plan/schema/seed.ts` was deleted; `seedData.ts` is UI config, not a DB writer). Note the seed data is now duplicated in `apps/web` and `apps/desktop/src/renderer` — pick one source.

**D. Decide VAT — a business decision, blocks seeding ⚠️**
- [ ] `seedData.ts` says **not VAT-registered** (0% VAT) but the schema defaults 15% and the blueprint assumes ZATCA Phase 2. Decide: VAT-registered (15% + ZATCA) or not (0%, ZATCA out of scope). This sets the seeded tax values and whether ZATCA is in Phase 0 at all.

**E. Auth / RLS ordering (so you don't lock yourself out)**
- [ ] Seed `roles` ('admin','cashier'); create a Supabase **Auth** admin user + matching `public.users.auth_user_id`; seed via the direct Postgres connection (bypasses RLS), **then** apply `rls-policies.sql`.

**Then:** stand up the Supabase project, push the migration, run `rls-policies.sql`, run the seed.

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

## Phase 5 — ZATCA Phase 2 e-invoicing *(only if VAT-registered — see Phase 0.D)*
- [ ] Implement the cryptographic stamp / CSID onboarding (fields exist on `sales`; `apps/desktop/src/main/services/zatca.worker.ts` is a stub).

## Phase 6 — Hardware
- [ ] ESC/POS 80mm printing from the Electron Node layer.
- [ ] HALA payment terminal: standalone first, then semi-integrated via SDK.

## Phase 7 — Online booking (marketing site)
- [ ] Public booking page in `apps/web` → writes `appointments` via **Supabase JS** (browser client + anon key + RLS; not Drizzle — the site is a static export).

## Open decisions (confirm with client)

Resolved in the live schema: single branch, services-only (no retail), HALA payments.
Still open:
1. **VAT-registered or not?** (Phase 0.D — gates seeding and the whole ZATCA layer.)
2. Supabase plan/region and who owns the project; the direct `DATABASE_URL`.
3. HALA onboarding (merchant/terminal IDs) — needed before Phase 6.
