import {
  LayoutDashboard, CalendarDays, CreditCard, Users, Sparkles, PackageOpen, BadgePercent,
  UserRound, DoorOpen, ReceiptText, Wallet, ChartColumn, Boxes, Settings, type LucideIcon,
} from 'lucide-react';
import type { DashboardDictionary } from '@/i18n/dashboardDictionary';

/*
 * Sidebar information architecture — see plan/DASHBOARD.md §2–3.
 * `ready` pages have their own route; the rest render the planned-page placeholder
 * from src/app/dashboard/[section]. `roles` is enforced once Supabase Auth lands.
 */

export type Role = 'admin' | 'cashier';
type GroupKey = keyof DashboardDictionary['nav']['groups'];
export type NavKey = keyof DashboardDictionary['nav']['items'];

export interface NavItem {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  phase: number;
  ready?: boolean;
  roles: Role[];
  tables: string[];
}

const ALL: Role[] = ['admin', 'cashier'];
const MGMT: Role[] = ['admin'];

export const NAV: { group: GroupKey; items: NavItem[] }[] = [
  {
    group: 'overview',
    items: [
      { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, phase: 4, ready: true, roles: ALL, tables: ['sales', 'appointments', 'therapists'] },
    ],
  },
  {
    group: 'frontDesk',
    items: [
      { key: 'bookings', href: '/dashboard/bookings', icon: CalendarDays, phase: 3, ready: true, roles: ALL, tables: ['appointments', 'therapists', 'rooms', 'services', 'parties'] },
      { key: 'pos', href: '/pos', icon: CreditCard, phase: 1, ready: true, roles: ALL, tables: ['sales', 'sale_items', 'payments', 'package_sessions'] },
      { key: 'clients', href: '/dashboard/clients', icon: Users, phase: 1, ready: true, roles: ALL, tables: ['parties'] },
    ],
  },
  {
    group: 'menu',
    items: [
      { key: 'services', href: '/dashboard/services', icon: Sparkles, phase: 1, ready: true, roles: ALL, tables: ['services', 'service_categories'] },
      { key: 'packages', href: '/dashboard/packages', icon: PackageOpen, phase: 3, ready: true, roles: ALL, tables: ['packages', 'package_sessions'] },
      { key: 'promotions', href: '/dashboard/promotions', icon: BadgePercent, phase: 1, ready: true, roles: ALL, tables: ['discounts'] },
    ],
  },
  {
    group: 'team',
    items: [
      { key: 'therapists', href: '/dashboard/therapists', icon: UserRound, phase: 3, ready: true, roles: ALL, tables: ['therapists', 'therapist_availability', 'commission_rules'] },
      { key: 'rooms', href: '/dashboard/rooms', icon: DoorOpen, phase: 3, ready: true, roles: ALL, tables: ['rooms'] },
    ],
  },
  {
    group: 'money',
    items: [
      { key: 'sales', href: '/dashboard/sales', icon: ReceiptText, phase: 1, ready: true, roles: ALL, tables: ['sales', 'sale_items', 'payments'] },
      { key: 'shifts', href: '/dashboard/shifts', icon: Wallet, phase: 1, ready: true, roles: ALL, tables: ['shifts'] },
      { key: 'reports', href: '/dashboard/reports', icon: ChartColumn, phase: 4, ready: true, roles: MGMT, tables: ['sales', 'sale_items', 'appointments', 'commission_rules'] },
      { key: 'inventory', href: '/dashboard/inventory', icon: Boxes, phase: 4, ready: true, roles: MGMT, tables: ['products'] },
    ],
  },
  {
    group: 'system',
    items: [
      { key: 'settings', href: '/dashboard/settings', icon: Settings, phase: 0, ready: true, roles: MGMT, tables: ['company', 'branches', 'users', 'roles', 'payment_methods', 'settings'] },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items);

// Routes served by the generic placeholder page
export const PLANNED_SECTIONS = NAV_ITEMS.filter((i) => !i.ready).map((i) => i.href.split('/').pop()!);
