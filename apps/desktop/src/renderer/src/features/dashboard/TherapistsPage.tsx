'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Percent,
  Phone,
  Plus,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import { usePhase34Store, type ServiceKind, type TherapistProfile } from '@/data/seedData';
import { fmtNumber } from './format';
import { useDashboard } from './useDashboard';

const SKILL_LABEL: Record<ServiceKind, { ar: string; en: string }> = {
  massage: { ar: 'المساج', en: 'Massage' },
  'moroccan-bath': { ar: 'الحمام المغربي', en: 'Moroccan Bath' },
  pedicure: { ar: 'البديكير', en: 'Pedicure' },
};

export default function TherapistsPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { therapists, commissionRules, addTherapistProfile, updateTherapistProfile } =
    usePhase34Store();

  const [selectedId, setSelectedId] = useState<string | null>(therapists[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add Therapist form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('055');
  const [specialtyAr, setSpecialtyAr] = useState('');
  const [ruleId, setRuleId] = useState(commissionRules[1]?.id ?? 'cr-standard');
  const [skills, setSkills] = useState<ServiceKind[]>(['massage']);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const selected = useMemo(
    () => therapists.find((th) => th.id === selectedId) ?? therapists[0] ?? null,
    [therapists, selectedId]
  );

  const computeCommission = (th: TherapistProfile) => {
    const rule = commissionRules.find((r) => r.id === th.commissionRuleId);
    if (!rule) return 0;
    if (rule.kind === 'percent') return Math.round((th.revenueMonthSar * rule.value) / 100);
    return th.completedSessionsMonth * rule.value;
  };

  const stats = useMemo(() => {
    const active = therapists.filter((t) => t.isActive).length;
    const totalSessions = therapists.reduce((s, t) => s + t.completedSessionsMonth, 0);
    const totalRev = therapists.reduce((s, t) => s + t.revenueMonthSar, 0);
    const totalCommissions = therapists.reduce((s, t) => s + computeCommission(t), 0);
    return { active, totalSessions, totalRev, totalCommissions };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapists, commissionRules]);

  const toggleSkill = (th: TherapistProfile, skill: ServiceKind) => {
    const has = th.skills.includes(skill);
    if (has && th.skills.length === 1) return;
    const next = has ? th.skills.filter((s) => s !== skill) : [...th.skills, skill];
    updateTherapistProfile(th.id, { skills: next });
    notify(isAr ? 'تم تحديث مهارات المعالجة' : 'Therapist skills updated');
  };

  const handleAddTherapist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) return;
    const displayEn = nameEn.trim() || nameAr.trim();
    const initials = displayEn
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    addTherapistProfile({
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: displayEn,
      initials: initials || 'TH',
      phone: phone.trim(),
      specialtyAr: specialtyAr.trim() || 'أخصائية مساج وعناية',
      specialtyEn: specialtyAr.trim() || 'Spa & Wellness Specialist',
      skills: skills.length ? skills : ['massage'],
      commissionRuleId: ruleId,
      shiftStart: '15:00',
      shiftEnd: '05:00',
      daysOff: ['sunday'],
      completedSessionsMonth: 0,
      revenueMonthSar: 0,
      rating: 5.0,
      isActive: true,
    });
    setNameAr('');
    setNameEn('');
    setSpecialtyAr('');
    setShowAdd(false);
    notify(isAr ? 'تمت إضافة المعالجة إلى جدول المركز' : 'Therapist added to schedule');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <UserRound className="w-3.5 h-3.5" />
            {isAr ? 'المعالجات، أوقات الدوام والعمولات · المرحلة 3' : 'Therapists, Availability & Commissions · Phase 3'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'فريق المعالجات والعمولات' : 'Therapists & Commission Rules'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'إدارة مهارات المعالجات (المساج، الحمام المغربي، البديكير)، ساعات الدوام، واحتساب العمولات الشهرية.'
              : 'Manage therapist skills, shift availability, and automated monthly commission calculations.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة معالجة' : 'Add Therapist'}
        </button>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl bg-aura-success-bg border border-aura-success/30 px-4 py-3 text-sm text-aura-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'المعالجات على رأس العمل' : 'Active Therapists'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {stats.active} <span className="text-sm font-sans text-aura-muted">/ {therapists.length}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جدول therapists' : 'therapists table'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'الجلسات المنفذة (الشهر)' : 'Sessions Completed (Month)'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{fmtNumber(stats.totalSessions, lang)}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'مرتبطة ببنود الفواتير' : 'Linked via sale_items.therapist_id'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'إيرادات الجلسات (الشهر)' : 'Service Revenue (Month)'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtNumber(stats.totalRev, lang)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'إجمالي إنتاجية الفريق' : 'Total team production'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'إجمالي العمولات المستحقة' : 'Accrued Commissions'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-accent">
            {fmtNumber(stats.totalCommissions, lang)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'حسب قواعد commission_rules' : 'Per commission_rules'}</p>
        </div>
      </div>

      {/* Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-5 items-start">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {therapists.map((th) => {
            const isSelected = selected?.id === th.id;
            const rule = commissionRules.find((r) => r.id === th.commissionRuleId);
            const comm = computeCommission(th);
            return (
              <article
                key={th.id}
                onClick={() => setSelectedId(th.id)}
                className={`cursor-pointer rounded-3xl bg-aura-surface border p-5 transition ${
                  isSelected
                    ? 'border-2 border-aura-accent shadow-premium'
                    : 'border-aura-border hover:border-aura-accent/40'
                } ${!th.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-aura-primary text-aura-accent font-semibold text-sm grid place-items-center shrink-0">
                      {th.initials}
                    </span>
                    <div>
                      <h2 className="font-serif text-lg text-aura-text">
                        {isAr ? th.nameAr : th.nameEn}
                      </h2>
                      <p className="text-xs text-aura-muted">
                        {isAr ? th.specialtyAr : th.specialtyEn}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-aura-bg border border-aura-border px-2 py-0.5 text-xs font-semibold tabular-nums">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {th.rating}
                  </span>
                </div>

                {/* Skills Badges */}
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {th.skills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-full bg-aura-primary/70 text-aura-accent px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {SKILL_LABEL[sk][lang]}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 rounded-full bg-aura-bg border border-aura-border px-2.5 py-0.5 text-[11px] text-aura-muted" dir="ltr">
                    <Clock className="w-3 h-3 text-aura-accent" />
                    {th.shiftStart}–{th.shiftEnd}
                  </span>
                </div>

                {/* Commission & Production footer */}
                <div className="mt-4 pt-3.5 border-t border-aura-border grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-aura-muted">{isAr ? 'الجلسات' : 'Sessions'}</p>
                    <p className="font-semibold text-sm tabular-nums mt-0.5">{th.completedSessionsMonth}</p>
                  </div>
                  <div>
                    <p className="text-aura-muted">{isAr ? 'الإيراد' : 'Revenue'}</p>
                    <p className="font-semibold text-sm tabular-nums mt-0.5">
                      {fmtNumber(th.revenueMonthSar, lang)} {cur}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-aura-muted">
                      {isAr ? 'العمولة' : 'Commission'} ({rule?.kind === 'percent' ? `${rule.value}%` : `${rule?.value} ${cur}`})
                    </p>
                    <p className="font-semibold text-sm text-aura-accent tabular-nums mt-0.5">
                      {fmtNumber(comm, lang)} {cur}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Therapist Inspector & Schedule/Commission Config */}
        {selected && (
          <aside className="rounded-3xl bg-aura-surface border border-aura-border p-5 space-y-5 sticky top-20">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-aura-primary text-aura-accent font-serif text-lg font-semibold grid place-items-center">
                  {selected.initials}
                </span>
                <div>
                  <h3 className="font-serif text-xl text-aura-text">
                    {isAr ? selected.nameAr : selected.nameEn}
                  </h3>
                  <p className="text-xs text-aura-muted font-mono" dir="ltr">
                    {selected.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateTherapistProfile(selected.id, { isActive: !selected.isActive })
                }
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selected.isActive
                    ? 'bg-aura-success-bg text-aura-success'
                    : 'bg-aura-bg text-aura-muted border border-aura-border'
                }`}
              >
                {selected.isActive ? (isAr ? 'نشطة بالجدول' : 'On Schedule') : isAr ? 'إجازة' : 'Off Duty'}
              </button>
            </div>

            {/* Authorized Service Skills */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-aura-muted">
                {isAr ? 'الأقسام المصرح لها بتنفيذها (تظهر في التقويم و POS)' : 'Authorized Service Skills'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(['massage', 'moroccan-bath', 'pedicure'] as ServiceKind[]).map((sk) => {
                  const active = selected.skills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(selected, sk)}
                      className={`h-9 px-3.5 rounded-full text-xs font-medium transition ${
                        active
                          ? 'bg-aura-accent text-white'
                          : 'bg-aura-bg border border-aura-border text-aura-muted hover:text-aura-text'
                      }`}
                    >
                      {SKILL_LABEL[sk][lang]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shift Hours */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-aura-muted">
                {isAr ? 'ساعات الدوام اليومية (therapist_availability)' : 'Daily Shift Hours'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <label className="block space-y-1">
                  <span className="text-[11px] text-aura-muted">{isAr ? 'بداية الدوام' : 'Shift Start'}</span>
                  <input
                    type="time"
                    value={selected.shiftStart}
                    onChange={(e) =>
                      updateTherapistProfile(selected.id, { shiftStart: e.target.value })
                    }
                    className="w-full h-9 rounded-xl bg-aura-bg border border-aura-border px-2.5 text-xs"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[11px] text-aura-muted">{isAr ? 'نهاية الدوام' : 'Shift End'}</span>
                  <input
                    type="time"
                    value={selected.shiftEnd}
                    onChange={(e) =>
                      updateTherapistProfile(selected.id, { shiftEnd: e.target.value })
                    }
                    className="w-full h-9 rounded-xl bg-aura-bg border border-aura-border px-2.5 text-xs"
                  />
                </label>
              </div>
            </div>

            {/* Commission Rule */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-aura-muted">
                <Award className="w-3.5 h-3.5 text-aura-accent" />
                {isAr ? 'قاعدة احتساب العمولة (commission_rules)' : 'Assigned Commission Rule'}
              </label>
              <select
                value={selected.commissionRuleId}
                onChange={(e) => {
                  updateTherapistProfile(selected.id, { commissionRuleId: e.target.value });
                  notify(isAr ? 'تم تحديث قاعدة عمولة المعالجة' : 'Commission rule updated');
                }}
                className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-xs text-aura-text"
              >
                {commissionRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isAr ? r.nameAr : r.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Accrued Commission Box */}
            <div className="rounded-2xl bg-aura-bg border border-aura-border p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-aura-muted">{isAr ? 'إجمالي مبيعات المعالجة:' : 'Monthly Service Sales:'}</span>
                <span className="font-semibold tabular-nums">
                  {fmtNumber(selected.revenueMonthSar, lang)} {cur}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-aura-border">
                <span>{isAr ? 'صافي العمولة المستحقة:' : 'Net Accrued Commission:'}</span>
                <span className="text-aura-accent tabular-nums">
                  {fmtNumber(computeCommission(selected), lang)} {cur}
                </span>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Add Therapist Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{isAr ? 'إضافة معالجة جديدة' : 'Add New Therapist'}</h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTherapist} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</span>
                  <input
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: مريم التازي"
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</span>
                  <input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Mariam Al-Tazi"
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'التخصص المهني' : 'Specialty'}</span>
                <input
                  value={specialtyAr}
                  onChange={(e) => setSpecialtyAr(e.target.value)}
                  placeholder={isAr ? 'أخصائية حمام مغربي ومساج استرخائي' : 'Moroccan Bath & Massage Specialist'}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'رقم الجوال' : 'Phone'}</span>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-aura-muted absolute top-1/2 -translate-y-1/2 start-3" />
                    <input
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border ps-8 pe-3 text-sm"
                    />
                  </div>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'قاعدة العمولة' : 'Commission Rule'}</span>
                  <select
                    value={ruleId}
                    onChange={(e) => setRuleId(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-xs"
                  >
                    {commissionRules.map((r) => (
                      <option key={r.id} value={r.id}>
                        {isAr ? r.nameAr : r.nameEn}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'المهارات' : 'Skills'}</span>
                <div className="flex flex-wrap gap-2">
                  {(['massage', 'moroccan-bath', 'pedicure'] as ServiceKind[]).map((sk) => {
                    const checked = skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() =>
                          setSkills((prev) =>
                            prev.includes(sk) ? prev.filter((x) => x !== sk) : [...prev, sk]
                          )
                        }
                        className={`h-8 px-3 rounded-full text-xs font-medium ${
                          checked
                            ? 'bg-aura-accent text-white'
                            : 'bg-aura-bg border border-aura-border text-aura-muted'
                        }`}
                      >
                        <Percent className="inline w-3 h-3 me-1" />
                        {SKILL_LABEL[sk][lang]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="h-10 px-4 rounded-full border border-aura-border text-sm"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium"
                >
                  {isAr ? 'إضافة المعالجة' : 'Save Therapist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
