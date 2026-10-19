# واحة الإسترخاء للمساج — Current State

Evidence-based snapshot of what is actually built, audited against the code on
2026-10-19. Design intent is in [`blueprint.md`](./blueprint.md); what's left is in
[`plan.md`](./plan.md).

> **One-line summary:** the UI is far ahead of the backend. The marketing site and
> the full back-office (dashboard + POS) are **built but run entirely on client-side
> mock data**. Supabase, PowerSync, `@oasis/db`, and real auth are **scaffolds not
> yet wired**. No database connection or migration exists yet.

> **Recent change:** the dashboard + POS were relocated out of `apps/web` into the
> Electron app (`apps/desktop/src/renderer/`) and committed in `9dcef79`
> ("complete decoupling of web SEO marketing site and desktop POS application").
> `apps/web` is now the marketing site only.

---

## 1. Repo layout — pnpm monorepo

```
massage/
├── apps/
│   ├── web/        # Next.js 16 — MARKETING SITE ONLY (static export → Pages)
│   └── desktop/    # Electron + Vite — back-office (dashboard + POS) + sync/ZATCA scaffold
├── packages/
│   ├── db/         # Drizzle schema (@oasis/db) + rls-policies.sql  (schema only, no tooling)
│   └── shared/     # @oasis/shared — money (halalas), shared types
├── plan/           # these docs
├── .github/workflows/deploy.yml   # GitHub Pages: builds apps/web static export
├── pnpm-workspace.yaml · turbo.json
```

Tooling: **pnpm workspaces + turbo**.

## 2. `apps/web` — marketing site (built, shipping)

- Bilingual (Arabic-RTL default / English), the real services (massage 250/200,
  Moroccan bath 180, pedicure 200 SAR) and 4 packages, booking form, logo/favicon,
  plus `robots.ts` + `sitemap.ts`.
- **Static export** (`output: "export"`), deploys to GitHub Pages.
- Dashboard/POS routes have been **removed** from here (moved to desktop, see §3).
- `apps/web/src/lib/` still holds Supabase helpers (`client.ts`, `server.ts`,
  `middleware.ts`) — but under static export `server.ts`/`middleware.ts` **cannot
  run** (no server runtime); only the browser `client.ts` could ever work here.
  None are imported by anything today.

## 3. `apps/desktop` — back-office (built on mock data)

- Electron + Vite. The **renderer** (`src/renderer/src/`) is a hash-routed React SPA
  (`router.tsx`, default route `/pos`) bundling the whole back-office:
  - **Dashboard** — 13 pages under `features/dashboard/` (overview, bookings, clients,
    services, packages, promotions, therapists, rooms, sales, shifts, reports,
    inventory, settings) + `nav.ts`, `useDashboard.ts`.
  - **POS** — `features/pos/` (`PinLock`, `AppointmentsDialog`, `PayDialog`,
    `ShiftDialog`, `PosApp`, `usePos.ts`).
  - Next-free shims: `components/Image.tsx`, `Link.tsx` (replace `next/image`/`next/link`).
- **Still mock data** — the renderer copied `data/seedData.ts` + the mock stores; no
  DB reads. **PIN is a demo** (unlocks on any 4 digits; no `pin_hash` check).
- The **main** process (`src/main/`) has scaffolds only: `db/connector.ts`,
  `db/powersync.worker.ts`, a PowerSync `db/schema.ts`, `services/zatca.worker.ts`.
  Not wired to the renderer or to Supabase yet.

## 4. Scaffolded but NOT wired

- **`packages/db`** — Drizzle schema (21 tables, single-branch halalas, blueprint §4)
  + `rls-policies.sql`. **No migration tooling at all** (see `plan.md` Phase 0): no
  `drizzle.config.ts`, no migrations, no Postgres driver, no DB client, no scripts.
  `@oasis/db` is imported by nothing.
- **`packages/shared`** — money/types; effectively unused (`seedData.ts` even
  redefines its own `toHalalas`).
- **Supabase** — deps installed; `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` +
  publishable key but **no `DATABASE_URL`**. No live connection anywhere.
- **Two schema definitions to keep in sync:** `packages/db` (Drizzle/Postgres, cloud)
  vs `apps/desktop/src/main/db/schema.ts` (PowerSync/SQLite, local).

## 5. Schema divergence (resolved earlier in this audit)

| Old `plan/schema` draft | Live `packages/db` | Status |
|---|---|---|
| `products` (retail) | `supplies` ("NO Retail Sales") | deliberately replaced |
| `commission_rules` | `therapists.commission_percent` | deliberately replaced |
| `payment_methods` | `payment_kind`/`card_scheme` enums + HALA fields | deliberately replaced |
| `rls-policies.sql` | ported → `packages/db/rls-policies.sql` | fixed |

`plan/schema/` was deleted; `packages/db` is the single source of truth. **But the
seed data has not caught up:** `seedData.ts` still exports `SEED_COMMISSION_RULES`,
`SEED_PAYMENT_METHODS`, `SEED_PRODUCTS` and uses `priceSar` (not halalas) — it still
models the old schema (see `plan.md` Phase 0, items C).

## 6. Unresolved contradiction — VAT ⚠️

`seedData.ts` says the center is **not VAT-registered**: `vatNumber: ''`,
`vatRatePercent: 0`, services `taxRate: 0 / taxable: false`. But `packages/db`
defaults `tax_rate = 15 / taxable = true`, and `blueprint.md` assumes ZATCA Phase 2 /
VAT 15%. This must be decided before seeding, and it determines whether the whole
ZATCA layer is even in scope.

## 7. Deployment

`.github/workflows/deploy.yml` → GitHub Pages: pnpm install, builds `@oasis/web`
static export (`NEXT_PUBLIC_BASE_PATH` from Pages), publishes `apps/web/out`. Only the
marketing site ships this way; the back-office is the desktop app and is not deployed.
