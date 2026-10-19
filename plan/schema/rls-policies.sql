-- واحة الإسترخاء للمساج — Row-Level Security (Supabase)
-- Run AFTER the Drizzle migration has created the tables.
-- Model: every staff row lives in public.users and is linked to auth.users via
-- auth_user_id. Simplified two-role RBAC: 'admin' and 'cashier'.
-- A user belongs to one branch (NULL branch = org-wide/admin).
-- These policies keep each branch's operational data isolated while letting
-- admins see and manage everything.
--
-- NOTE: Follows Supabase RLS & Postgres performance best practices:
--  - Uses `to authenticated` target role on all policies.
--  - Wraps `(select auth.uid())` for Postgres initPlan caching.
--  - Restricts `SECURITY DEFINER` helper execution to `authenticated` only.

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read public.users safely)
-- ---------------------------------------------------------------------------
create or replace function public.current_app_user()
returns public.users
language sql stable security definer set search_path = public as $$
  select * from public.users where auth_user_id = (select auth.uid()) and is_active = true limit 1;
$$;

create or replace function public.current_branch_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select branch_id from public.users where auth_user_id = (select auth.uid()) and is_active = true limit 1;
$$;

create or replace function public.current_role_name()
returns text
language sql stable security definer set search_path = public as $$
  select r.name from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_user_id = (select auth.uid()) and u.is_active = true limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false);
$$;

-- Lock down SECURITY DEFINER functions from anon/public access
revoke execute on function public.current_app_user() from public, anon;
revoke execute on function public.current_branch_id() from public, anon;
revoke execute on function public.current_role_name() from public, anon;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.current_app_user() to authenticated;
grant execute on function public.current_branch_id() to authenticated;
grant execute on function public.current_role_name() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS + branch-scoped policies on operational tables
-- (Cashiers can read/write within their branch; Admins everywhere)
-- ---------------------------------------------------------------------------
do $$
declare t text;
  branch_tables text[] := array[
    'parties','therapists','products','rooms','appointments',
    'package_sessions','shifts','sales'
  ];
begin
  foreach t in array branch_tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- READ: admins see all; cashiers see only their branch (or org-wide NULL rows)
    execute format($f$
      create policy %1$I_select on public.%1$I for select
      to authenticated
      using (
        public.is_admin()
        or branch_id = public.current_branch_id()
        or branch_id is null
      );
    $f$, t);

    -- WRITE: admins anywhere; cashiers only within their own branch
    execute format($f$
      create policy %1$I_insert on public.%1$I for insert
      to authenticated
      with check (public.is_admin() or branch_id = public.current_branch_id());
    $f$, t);

    execute format($f$
      create policy %1$I_update on public.%1$I for update
      to authenticated
      using (public.is_admin() or branch_id = public.current_branch_id())
      with check (public.is_admin() or branch_id = public.current_branch_id());
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Settings table: readable by branch staff (POS needs working hours, ZATCA,
-- printer & terminal config), writable ONLY by 'admin'
-- ---------------------------------------------------------------------------
alter table public.settings enable row level security;

create policy settings_select on public.settings for select
  to authenticated
  using (
    public.is_admin()
    or branch_id = public.current_branch_id()
    or branch_id is null
  );

create policy settings_admin_write on public.settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Child tables (sale_items, payments) inherit access via their parent sale.
-- APPEND-ONLY: Only SELECT and INSERT are allowed (no UPDATE or DELETE) to
-- satisfy ZATCA Phase 2 anti-tampering rules.
-- ---------------------------------------------------------------------------
alter table public.sale_items enable row level security;
create policy sale_items_select on public.sale_items for select
  to authenticated
  using (exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ));
create policy sale_items_insert on public.sale_items for insert
  to authenticated
  with check (exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ));

alter table public.payments enable row level security;
create policy payments_select on public.payments for select
  to authenticated
  using (exists (
    select 1 from public.sales s
    where s.id = payments.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ));
create policy payments_insert on public.payments for insert
  to authenticated
  with check (exists (
    select 1 from public.sales s
    where s.id = payments.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ));

-- ---------------------------------------------------------------------------
-- therapist_availability: inherits branch scope from parent therapist;
-- readable by branch staff, writable by admins (and branch staff for rosters).
-- ---------------------------------------------------------------------------
alter table public.therapist_availability enable row level security;
create policy therapist_availability_select on public.therapist_availability for select
  to authenticated
  using (exists (
    select 1 from public.therapists th
    where th.id = therapist_availability.therapist_id
      and (public.is_admin() or th.branch_id = public.current_branch_id() or th.branch_id is null)
  ));
create policy therapist_availability_admin_write on public.therapist_availability for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Catalog / config: readable by any authenticated staff, writable by admins
-- ---------------------------------------------------------------------------
do $$
declare t text;
  shared_tables text[] := array[
    'company','branches','roles','service_categories','services',
    'packages','payment_methods','discounts','commission_rules'
  ];
begin
  foreach t in array shared_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$
      create policy %1$I_read on public.%1$I for select
      to authenticated
      using ((select auth.uid()) is not null);
    $f$, t);
    execute format($f$
      create policy %1$I_admin_write on public.%1$I for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
    $f$, t);
  end loop;
end $$;

-- public.users: a user can read themselves; admins manage all.
alter table public.users enable row level security;
create policy users_self_read on public.users for select
  to authenticated
  using (auth_user_id = (select auth.uid()) or public.is_admin());
create policy users_admin_write on public.users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
