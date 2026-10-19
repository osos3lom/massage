# واحة الإسترخاء للمساج — Plan (Remaining Work)

What's left, in order. Reflects the audit in [`state.md`](./state.md): the UI is
built on mock data; the backend is scaffolded but not wired. Design in
[`blueprint.md`](./blueprint.md).

---

## The critical path

The single biggest gap is that **nothing reads from the database**. Every phase
below is really one theme: turn the mock-driven UI into a real system.

### Phase 0 — Supabase foundation (schema exists, not deployed)
- [x] Drizzle schema drafted (`packages/db`, 21 tables, single-branch halalas).
- [x] RLS written (`packages/db/rls-policies.sql`).
- [ ] Add a Drizzle config + `drizzle-kit` scripts to `packages/db`; generate the
      first migration (none exist yet).
- [ ] Stand up the Supabase project, push the migration, run `rls-policies.sql`.
- [ ] Seed from the app's existing catalog (`apps/web/src/data/seedData.ts`) — the
      real services/packages/prices already live there.
- [ ] Enable Supabase Auth; create the owner (`admin`) user + matching `public.users`
      row; create a cashier with a hashed PIN.

### Phase 1 — Wire the web app to the DB (replace the mock stores)
- [ ] Use the existing `apps/web/src/lib/` Supabase helpers (currently imported
      nowhere) + TanStack Query.
- [ ] Replace `seedData.ts` / `dashboardData.ts` / `bookingsStore.ts` / `phase1Store.ts`
      reads with real queries, page by page (Services, Clients, Sales, Shifts first).
- [ ] Make POS checkout write real `sales` / `sale_items` / `payments` (append-only).
- [ ] Real PIN check against `users.pin_hash` (today it's a demo).
- [ ] Consume `@oasis/db` and `@oasis/shared` from `apps/web` (both currently unused).
- [ ] Update the stale `nav.ts` `tables` labels (`commission_rules`/`products`/
      `payment_methods`) to the live tables.

### Phase 2 — Offline + sync (the desktop app)
- [ ] Flesh out `apps/desktop`: wire PowerSync (`connector.ts`, `powersync.worker.ts`)
      to Supabase + local SQLite; share the UI with `apps/web`.
- [ ] Verify UUID-on-device + append-only ledger behave under two offline terminals.

### Phase 3 — Scheduling depth
- [ ] Drag-to-reschedule on the bookings timeline, room-lane toggle, turnover buffers.
- [ ] Package redemption at checkout against `package_sessions`.

### Phase 4 — Reports
- [ ] Replace mock aggregates with real queries: commissions (from
      `therapists.commission_percent` × `sale_items`), Z-report, occupancy.

### Phase 5 — ZATCA Phase 2 e-invoicing
- [ ] Implement the cryptographic stamp / CSID onboarding (fields exist on `sales`;
      `apps/desktop/src/main/services/zatca.worker.ts` is a stub).

### Phase 6 — Hardware
- [ ] ESC/POS 80mm printing from the Electron Node layer.
- [ ] HALA payment terminal: standalone first, then semi-integrated via SDK.

### Phase 7 — Online booking
- [ ] Public booking page on the marketing site → writes `appointments`.

## Open decisions (confirm with client)

Resolved in the live schema: **KSA/ZATCA = yes**, **single branch = yes**,
**retail = no (services only)**, **payments = HALA**. Still open:

1. Supabase plan/region, and who owns the project.
2. HALA onboarding (merchant/terminal IDs) — needed before Phase 6.
3. When to introduce the Electron desktop POS vs. staying web-only on mock data for a
   demo — i.e. how soon Phase 1 wiring is actually needed.
