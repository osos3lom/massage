# واحة الإسترخاء للمساج — Plan & Phase 0 Schema

This folder holds the architecture plan and the Phase 0 database foundation.

## Contents

| File | What it is |
|---|---|
| `ARCHITECTURE.md` | Full-stack plan: local-first POS, Supabase sync, dashboard, roadmap |
| `schema/schema.ts` | Phase 0 database schema (Drizzle ORM / Postgres) |
| `schema/rls-policies.sql` | Supabase Row-Level Security baseline (run after migration) |
| `schema/seed.ts` | Seed data mirroring `src/data/salonData.ts` |

## Quick start (Phase 0)

1. **Create a Supabase project** → copy the Postgres connection string.

2. **Add the DB toolchain** (suggested — a `packages/db` workspace later):
   ```bash
   npm i drizzle-orm postgres
   npm i -D drizzle-kit tsx
   ```

3. **Point Drizzle at the schema.** Create `drizzle.config.ts`:
   ```ts
   import { defineConfig } from "drizzle-kit";
   export default defineConfig({
     schema: "./plan/schema/schema.ts",
     out: "./plan/schema/migrations",
     dialect: "postgresql",
     dbCredentials: { url: process.env.DATABASE_URL! },
   });
   ```

4. **Generate & push the migration:**
   ```bash
   npx drizzle-kit generate
   npx drizzle-kit push
   ```

5. **Apply RLS** — run `schema/rls-policies.sql` in the Supabase SQL editor.

6. **Seed** — wire `schema/seed.ts` to your Drizzle client and run `tsx plan/schema/seed.ts`.

7. **Enable Supabase Auth**, create an owner user, and insert a matching
   `public.users` row (link `auth_user_id`, set role = owner).

## Design guarantees baked in

- **UUID primary keys** generated on-device → safe for multiple offline terminals.
- **Append-only sales/payments** with `voided_at` soft-delete → conflict-free sync.
- **`numeric(12,2)` money** everywhere → no float rounding bugs.
- **KSA VAT 15%** default on `sale_items.tax_rate`; ZATCA fields on `sales`.
- **Hashed PINs only** (`users.pin_hash`) — never store plain text (unlike APEX).
- **Branch-scoped RLS** → each branch isolated; owners/admins see all.

## Next phases (see ARCHITECTURE.md §8)

- **Phase 1:** core online POS (checkout, payments, receipt print, shifts).
- **Phase 2:** Electron + local SQLite + PowerSync (the offline layer).
- **Phase 3:** scheduling (appointments calendar, therapists, rooms, packages).
- **Phase 4+:** dashboard & reports, ZATCA e-invoicing, hardware, online booking.

## Decisions still needed from the client

1. Country = **KSA**? (ZATCA) and the **payment provider/bank**?
2. **One branch or multi-branch?**
3. Retail products at launch, or services only?
