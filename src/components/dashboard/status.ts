import { Banknote, CalendarCheck, CalendarClock, CircleAlert, CircleCheck, Sparkles, type LucideIcon } from 'lucide-react';
import type { DisplayStatus } from '@/data/dashboardData';

/*
 * One style per appt_status (plus "awaiting payment"). Colors are always shown with
 * the status label or icon, so state never relies on color alone.
 */
export const STATUS_STYLE: Record<DisplayStatus, { chip: string; dot: string; icon: LucideIcon }> = {
  completed: {
    chip: 'bg-aura-success-bg text-aura-success border-aura-success/25',
    dot: 'bg-aura-success',
    icon: CircleCheck,
  },
  checked_in: {
    chip: 'bg-aura-accent text-white border-aura-accent shadow-sm',
    dot: 'bg-aura-accent',
    icon: Sparkles,
  },
  confirmed: {
    chip: 'bg-aura-primary text-aura-text border-aura-accent/25',
    dot: 'bg-aura-primary ring-1 ring-aura-accent/40',
    icon: CalendarCheck,
  },
  booked: {
    chip: 'bg-aura-surface text-aura-text border-dashed border-aura-accent/50',
    dot: 'bg-aura-surface border border-dashed border-aura-accent',
    icon: CalendarClock,
  },
  awaiting_payment: {
    chip: 'bg-aura-warning-bg text-aura-warning border-aura-warning/40',
    dot: 'bg-aura-warning',
    icon: Banknote,
  },
  no_show: {
    chip: 'bg-aura-danger-bg text-aura-danger border-aura-danger/40',
    dot: 'bg-aura-danger',
    icon: CircleAlert,
  },
};

export const LEGEND_ORDER: DisplayStatus[] = ['completed', 'checked_in', 'confirmed', 'booked', 'awaiting_payment', 'no_show'];
