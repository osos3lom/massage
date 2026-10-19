-- Aura Spa — Row-Level Security (Supabase)
-- Run AFTER the Drizzle migration has created the tables.
-- Model: every staff row lives in public.users and is linked to auth.users via
-- auth_user_id. A user belongs to one branch (NULL branch = org-wide/owner).
-- These policies keep each branch's operational data isolated while letting
-- owners/admins see everything.
--
-- NOTE: This is a starting baseline. Tighten per-table as features land, and
-- test every policy with the Supabase SQL editor "impersonate role" feature.

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so they can read public.users safely)
-- ---------------------------------------------------------------------------
create or replace function public.current_app_user()
returns public.users
language sql stable security definer set search_path = public as $$
  select * from public.users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_branch_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select branch_id from public.users where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.current_role_name()
returns text
language sql stable security definer set search_path = public as $$
  select r.name from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('owner','admin'), false);
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS + branch-scoped policies on operational tables
-- ---------------------------------------------------------------------------
do $$
declare t text;
  branch_tables text[] := array[
    'parties','therapists','products','rooms','appointments',
    'package_sessions','shifts','sales','settings'
  ];
begin
  foreach t in array branch_tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- READ: admins see all; others see only their branch (or org-wide NULL rows)
    execute format($f$
      create policy %1$I_select on public.%1$I for select
      using (
        public.is_admin()
        or branch_id = public.current_branch_id()
        or branch_id is null
      );
    $f$, t);

    -- WRITE: admins anywhere; staff only within their own branch
    execute format($f$
      create policy %1$I_insert on public.%1$I for insert
      with check (public.is_admin() or branch_id = public.current_branch_id());
    $f$, t);

    execute format($f$
      create policy %1$I_update on public.%1$I for update
      using (public.is_admin() or branch_id = public.current_branch_id())
      with check (public.is_admin() or branch_id = public.current_branch_id());
    $f$, t);
  end loop;
end $$;

-- Child tables (sale_items, payments) inherit access via their parent sale.
alter table public.sale_items enable row level security;
create policy sale_items_rw on public.sale_items for all
  using (exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ))
  with check (exists (
    select 1 from public.sales s
    where s.id = sale_items.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ));

alter table public.payments enable row level security;
create policy payments_rw on public.payments for all
  using (exists (
    select 1 from public.sales s
    where s.id = payments.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ))
  with check (exists (
    select 1 from public.sales s
    where s.id = payments.sale_id
      and (public.is_admin() or s.branch_id = public.current_branch_id())
  ));

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
      using (auth.uid() is not null);
    $f$, t);
    execute format($f$
      create policy %1$I_admin_write on public.%1$I for all
      using (public.is_admin()) with check (public.is_admin());
    $f$, t);
  end loop;
end $$;

-- public.users: a user can read themselves; admins manage all.
alter table public.users enable row level security;
create policy users_self_read on public.users for select
  using (auth_user_id = auth.uid() or public.is_admin());
create policy users_admin_write on public.users for all
  using (public.is_admin()) with check (public.is_admin());
