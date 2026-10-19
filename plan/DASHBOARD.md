# واحة الإسترخاء للمساج — Dashboard IA & Sidebar Plan

> Companion to `ARCHITECTURE.md` §7 (role-aware dashboard) and §8 (roadmap).
> Defines which pages a massage center's back office needs, how the sidebar groups
> them, which role sees what, and which schema tables / roadmap phase back each page.
> The first two pages — `/dashboard` and `/dashboard/bookings` — are scaffolded in
> `src/app/dashboard/` on mock data; the rest render a "planned" placeholder.

---

## 1. What a massage center actually runs on (research summary)

Day-to-day work at a massage / hammam / pedicure center splits into four loops.
Every page below exists to serve one of them.

| Loop | Who | What they need on screen |
|---|---|---|
| **Front desk** | Reception | Who's coming, who's free, which room is open, check-in, walk-ins, rebook, collect payment |
| **Floor** | Therapists | Their own day, client notes (pressure, allergies, pregnancy, injuries), gaps between sessions |
| **Money** | Cashier / owner | Tickets, split payments, packages redeemed, cash drawer, VAT / ZATCA invoices, commissions |
| **Business** | Owner / admin | Revenue, occupancy (therapist + room utilisation), no-shows, best-selling services, retention |

Patterns borrowed from the leading spa systems (Fresha, Mindbody/Booker, Zenoti,
Vagaro, Mangomint) that matter most for a massage center:

1. **Resource timeline is the home of reception** — rows = therapists, columns = time,
   a "now" line, an *Unassigned* lane for online bookings with "any therapist".
2. **Turnover/buffer time** between sessions (room reset, linen) — 10–15 min.
3. **Status lifecycle** visible at a glance: booked → confirmed → checked-in → completed,
   with *no-show* and *awaiting payment* flagged as "needs attention".
4. **Client intake/health notes** surfaced on the booking (contra-indications).
5. **Packages & memberships** with remaining sessions — redeemed at checkout.
6. **Commission per therapist** computed from sale lines (`sale_items.therapist_id`).
7. **Occupancy** is the #1 owner KPI (booked minutes ÷ available minutes), next to
   revenue, average ticket and no-show rate.
8. **Gender / room constraints** (KSA): rooms tied to a service kind (`rooms.for_kind`).

## 2. Sidebar

Grouped by loop, ordered by daily frequency of use. ✅ = scaffolded now.

| Group | Item | Route | Phase | Backing tables |
|---|---|---|---|---|
| **Overview** | Dashboard ✅ | `/dashboard` | 4 | `sales`, `appointments`, `therapists` (aggregates) |
| **Front desk** | Bookings ✅ | `/dashboard/bookings` | 3 | `appointments`, `therapists`, `rooms`, `services`, `parties` |
| | Checkout (POS) ✅ | `/pos` (full-screen, no sidebar) | 1 | `sales`, `sale_items`, `payments`, `package_sessions` |
| | Clients ✅ | `/dashboard/clients` | 1 | `parties` (kind = customer) |
| **Menu** | Services ✅ | `/dashboard/services` | 1 | `services`, `service_categories` |
| | Packages & memberships ✅ | `/dashboard/packages` | 3 | `packages`, `package_sessions` |
| | Promotions ✅ | `/dashboard/promotions` | 1 | `discounts` |
| **Team** | Therapists ✅ | `/dashboard/therapists` | 3 | `therapists`, `therapist_availability`, `commission_rules` |
| | Rooms ✅ | `/dashboard/rooms` | 3 | `rooms` |
| **Money** | Sales & invoices ✅ | `/dashboard/sales` | 1 → 5 | `sales`, `payments`, ZATCA fields |
| | Shifts & cash ✅ | `/dashboard/shifts` | 1 | `shifts` |
| | Reports ✅ | `/dashboard/reports` | 4 | all (commissions, Z-report, occupancy) |
| | Inventory ✅ | `/dashboard/inventory` | 4 | `products` — **only if retail is in scope** (open decision #3) |
| **System** | Settings ✅ | `/dashboard/settings` | 0 → 7 | `company`, `branches`, `users`, `roles`, `payment_methods`, `settings` |

Sidebar footer shows the **sync state** (online / offline · pending uploads) — the
local-first rule from `ARCHITECTURE.md` §2 should be visible to staff, not hidden.

## 3. Role visibility (`roles.name`) — Simplified to `admin` and `cashier`

| Item | admin | cashier |
|---|:-:|:-:|
| Dashboard | Full KPIs, all periods | Today's overview & arrivals |
| Bookings | ✓ (Full schedule, assignments) | ✓ (View, check-in, book) |
| Checkout (POS) | ✓ | ✓ |
| Clients | ✓ | ✓ (Lookup, create, notes) |
| Services, Packages, Promotions | ✓ | View-only |
| Therapists, Rooms | ✓ | View schedule |
| Shifts & Cash | ✓ (All shifts, reconciliation) | Own shift & cash drawer |
| Sales & Invoices | ✓ (All sales, tax invoices) | Own sales & receipt reprint |
| Reports, Inventory | ✓ | — |
| Settings | ✓ (Company, ZATCA, Hardware, Timing) | — |

> Detailed settings breakdown: see [`plan/SETTINGS.md`](./SETTINGS.md).
Encoded as `roles` on each nav item in `src/components/dashboard/nav.ts`; enforced
once Supabase Auth lands (Phase 0) — UI hiding is convenience, RLS is the guard.

## 4. `/dashboard` (overview)

- KPI row: revenue today, bookings today, occupancy, average ticket, no-shows.
- Revenue — last 7 days (single-series bar, hover tooltip).
- Today's next arrivals (check-in shortcut).
- Service mix (massage / Moroccan bath / pedicure / packages).
- Therapist utilisation today.
- Needs attention: unassigned online bookings, awaiting payment, no-shows, sync status.

## 5. `/dashboard/bookings` (resource timeline)

- Day view: therapist rows × hours (09:00–21:00), *Unassigned* lane, live now-line.
- Week view: therapist × day grid with booked hours and utilisation.
- Filters: service kind; date navigation (prev / today / next).
- Click a booking → side panel (client, service, therapist, room, status, price, actions:
  check in, checkout → POS, reschedule, mark no-show).
- "New booking" panel: client, service or package, therapist (filtered by skill), time.
- Status legend maps 1:1 to `appt_status`: booked · confirmed · checked_in · completed ·
  no_show (+ cancelled hidden from the grid).

## 6. `/pos` — cashier till (touch-first)

A separate full-screen route, not inside the back-office shell: cashiers never see
owner pages, and this screen is what becomes the Electron app in Phase 2.

- **PIN unlock**: pick your avatar, enter a 4-digit PIN (demo accepts any; real check
  against `users.pin_hash`). *Lock* returns to this screen without closing the shift.
- **Ready-to-pay queue** (from `appointments`): finished-but-unpaid first, then in
  treatment, then arriving within the hour. Tapping one loads client + service +
  therapist onto the ticket. *Walk-in ticket* starts an empty one.
- **Appointments** (lookup + booking): the queue only shows what's due now, so an
  *Appointments* button opens the full day's schedule — searchable by client or service,
  any day via a stepper — where the cashier can *check in* a client or *add to ticket* any
  existing booking. A second tab **books a new appointment** (client, service/package,
  therapist by skill, date, time, notes) with *book* or *book & add to ticket*.
- **Menu tiles**: services and packages from the catalog, 44px+ touch targets.
- **Ticket**: one line per service with a required therapist (`sale_items.therapist_id`
  drives commission), discount from `discounts`, totals with VAT 15% **extracted** from
  VAT-inclusive prices (KSA consumer pricing).
- **Payment**: split tender across cash / card (mada, Visa) / wallet (Apple Pay, STC Pay) /
  transfer; only cash can be over-tendered and returns change. Card is standalone
  (keyed on the terminal) until the semi-integrated SDK in Phase 6.
- **Receipt**: simplified tax invoice, 80mm print layout, `BRANCH-TERMINAL-SEQ` number
  that never resets, ZATCA QR placeholder (Phase 5).
- **Close shift (Z-report)**: takings by method, opening float, expected cash vs. blind
  count → variance, prints, then locks the till.

Money is held in halalas (integers) end-to-end, matching `numeric(12,2)` in the schema.

### Shared appointments store

`/pos` and `/dashboard/bookings` read and write one client-side store
(`src/data/bookingsStore.ts`): the deterministic generator provides the base day, and the
store layers on staff-booked appointments and status edits (localStorage-backed,
cross-tab). So a booking taken at the till appears on the owner's calendar, and paying or
checking a client in at the till updates the same appointment everywhere. It stands in for
the `appointments` table until Supabase + PowerSync replace it (ARCHITECTURE.md §2).

## 7. Next steps

1. Wire pages to Supabase via TanStack Query once Phase 0 is live; replace
   `src/data/dashboardData.ts` (mock generator) with queries.
2. Phase 1: POS, Clients, Services, Sales, Shifts pages.
3. Phase 3: drag-to-reschedule on the timeline, rooms lane toggle, buffers.
