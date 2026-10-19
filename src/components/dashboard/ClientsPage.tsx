'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  HeartPulse,
  PackageCheck,
  Phone,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import { THERAPISTS, usePhase1Store } from '@/data/seedData';
import { fmtNumber } from './format';
import { useDashboard } from './useDashboard';

type ClientFilter = 'all' | 'notes' | 'packages' | 'balance';

export default function ClientsPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { clients, addClientParty, updateClientParty } = usePhase1Store();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(clients[0]?.id ?? null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New client form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('05');
  const [email, setEmail] = useState('');
  const [notesAr, setNotesAr] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [preferredTherapistId, setPreferredTherapistId] = useState<string>('th-1');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter === 'notes' && !c.notesAr && !c.notesEn) return false;
      if (filter === 'packages' && c.packageSessionsRemaining <= 0) return false;
      if (filter === 'balance' && c.balanceSar === 0) return false;
      if (!q) return true;
      return (
        c.nameAr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.notesAr.toLowerCase().includes(q) ||
        c.notesEn.toLowerCase().includes(q)
      );
    });
  }, [clients, query, filter]);

  const selected = useMemo(
    () => clients.find((c) => c.id === selectedId) ?? filtered[0] ?? null,
    [clients, selectedId, filtered]
  );

  const stats = useMemo(() => {
    const activeCount = clients.filter((c) => c.isActive).length;
    const withPackages = clients.filter((c) => c.packageSessionsRemaining > 0).length;
    const totalCredit = clients.reduce((sum, c) => sum + (c.balanceSar > 0 ? c.balanceSar : 0), 0);
    const withHealthNotes = clients.filter((c) => Boolean(c.notesAr || c.notesEn)).length;
    return { activeCount, withPackages, totalCredit, withHealthNotes };
  }, [clients]);

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) return;
    addClientParty({
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      phone: phone.trim() || '0500000000',
      email: email.trim(),
      notesAr: notesAr.trim(),
      notesEn: notesEn.trim() || notesAr.trim(),
      balanceSar: 0,
      totalVisits: 0,
      totalSpentSar: 0,
      lastVisitDate: new Date().toISOString().slice(0, 10),
      packageSessionsRemaining: 0,
      preferredTherapistId: preferredTherapistId || null,
      isActive: true,
    });
    setNameAr('');
    setNameEn('');
    setPhone('05');
    setEmail('');
    setNotesAr('');
    setNotesEn('');
    setShowAddModal(false);
    notify(isAr ? 'تمت إضافة ملف العميلة بنجاح' : 'Client profile created');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <Users className="w-3.5 h-3.5" />
            {isAr ? 'سجل العملاء والاستبيان الصحي · المرحلة 1' : 'Client Directory & Health Intake · Phase 1'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'العملاء وملفات العناية' : 'Clients & Intake Profiles'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'إدارة ملفات العملاء، الملاحظات الصحية (الحساسية، الحمل، درجة الضغط)، أرصدة الباقات، والائتمان.'
              : 'Manage client profiles, health contraindications (allergies, pregnancy, pressure), package balances, and credit.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-aura-surface border border-aura-border text-sm font-medium hover:border-aura-accent/40 transition-colors"
          >
            <CalendarPlus className="w-4 h-4 text-aura-accent" />
            {isAr ? 'تقويم الحجوزات' : 'Bookings Calendar'}
          </Link>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'عميل جديد' : 'New Client'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl bg-aura-success-bg border border-aura-success/30 px-4 py-3 text-sm text-aura-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-aura-muted">
            <span>{isAr ? 'إجمالي العملاء النشطين' : 'Active Clients'}</span>
            <Users className="w-4 h-4 text-aura-accent" />
          </div>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{fmtNumber(stats.activeCount, lang)}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جدول parties (kind = customer)' : 'parties table (kind = customer)'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-aura-muted">
            <span>{isAr ? 'حاملو الباقات الفعالة' : 'Active Package Holders'}</span>
            <PackageCheck className="w-4 h-4 text-aura-accent" />
          </div>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{fmtNumber(stats.withPackages, lang)}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جلسات قابلة للاسترداد في POS' : 'Redeemable at POS checkout'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-aura-muted">
            <span>{isAr ? 'أرصدة العملاء الدائنة' : 'Client Prepaid Credit'}</span>
            <Wallet className="w-4 h-4 text-aura-success" />
          </div>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtNumber(stats.totalCredit, lang)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'رصيد محفظة مقدم' : 'Available wallet credit'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-aura-muted">
            <span>{isAr ? 'تنبيهات صحية مسجلة' : 'Health Intake Alerts'}</span>
            <HeartPulse className="w-4 h-4 text-aura-warning" />
          </div>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{fmtNumber(stats.withHealthNotes, lang)}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'تظهر للمعالجة والاستقبال' : 'Surfaced on booking & POS'}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-aura-surface border border-aura-border p-3 sm:p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-aura-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث بالاسم، رقم الجوال (05...)، أو الملاحظات الصحية...'
                : 'Search by name, mobile (05...), or health notes...'
            }
            className="w-full h-10 rounded-full bg-aura-bg border border-aura-border ps-10 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'all', labelAr: 'الكل', labelEn: 'All Clients' },
              { key: 'notes', labelAr: 'ملاحظات صحية', labelEn: 'Health Notes' },
              { key: 'packages', labelAr: 'لديهم باقات', labelEn: 'Active Packages' },
              { key: 'balance', labelAr: 'رصيد / ذمم', labelEn: 'Credit / Balance' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`h-9 px-3.5 rounded-full text-xs font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-aura-text text-white'
                  : 'bg-aura-bg text-aura-muted hover:text-aura-text border border-aura-border'
              }`}
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-5 items-start">
        {/* Clients Table / List */}
        <div className="rounded-3xl bg-aura-surface border border-aura-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border bg-aura-bg/60 text-xs text-aura-muted">
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'العميل' : 'Client'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'الجوال' : 'Mobile'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'الاستبيان الصحي / الملاحظات' : 'Health & Intake Notes'}</th>
                  <th className="text-center font-medium py-3.5 px-3">{isAr ? 'الزيارات' : 'Visits'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'الرصيد' : 'Balance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border">
                {filtered.map((c) => {
                  const isSelected = selected?.id === c.id;
                  const noteText = isAr ? c.notesAr : c.notesEn;
                  const hasAlert =
                    c.notesAr.includes('حامل') ||
                    c.notesAr.includes('حساسية') ||
                    c.notesAr.includes('ألم') ||
                    c.notesEn.toLowerCase().includes('pregnant') ||
                    c.notesEn.toLowerCase().includes('allerg');
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-aura-primary/45' : 'hover:bg-aura-bg/60'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-aura-primary text-aura-accent font-semibold text-xs grid place-items-center shrink-0">
                            {(isAr ? c.nameAr : c.nameEn).slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-aura-text truncate">{isAr ? c.nameAr : c.nameEn}</p>
                            <p className="text-xs text-aura-muted truncate">{isAr ? c.nameEn : c.nameAr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-aura-muted" dir="ltr">
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        {noteText ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs ${
                              hasAlert
                                ? 'bg-aura-warning-bg text-aura-warning font-medium'
                                : 'bg-aura-bg text-aura-text/80'
                            }`}
                          >
                            {hasAlert && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                            <span className="truncate max-w-[220px]">{noteText}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-aura-muted">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center tabular-nums">
                        <span className="font-medium">{c.totalVisits}</span>
                        {c.packageSessionsRemaining > 0 && (
                          <span className="ms-1.5 inline-flex items-center rounded-full bg-aura-primary px-2 py-0.5 text-[11px] font-medium text-aura-accent">
                            {c.packageSessionsRemaining} {isAr ? 'باقة' : 'pkg'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-end tabular-nums">
                        <span
                          className={`font-semibold ${
                            c.balanceSar > 0
                              ? 'text-aura-success'
                              : c.balanceSar < 0
                              ? 'text-aura-danger'
                              : 'text-aura-muted'
                          }`}
                        >
                          {c.balanceSar > 0 ? `+${c.balanceSar}` : c.balanceSar} {cur}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Profile & Intake Inspector */}
        {selected && (
          <aside className="rounded-3xl bg-aura-surface border border-aura-border p-5 space-y-5 sticky top-20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-aura-primary text-aura-accent font-serif text-lg font-semibold grid place-items-center">
                  {(isAr ? selected.nameAr : selected.nameEn).slice(0, 2)}
                </span>
                <div>
                  <h2 className="font-serif text-xl text-aura-text">
                    {isAr ? selected.nameAr : selected.nameEn}
                  </h2>
                  <p className="text-xs text-aura-muted" dir="ltr">
                    {selected.phone} · {selected.email || '—'}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-aura-success-bg text-aura-success px-2.5 py-0.5 text-xs font-medium">
                {isAr ? 'نشط' : 'Active'}
              </span>
            </div>

            {/* Stats mini grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-aura-bg p-3 border border-aura-border">
                <p className="text-[11px] text-aura-muted">{isAr ? 'الزيارات' : 'Visits'}</p>
                <p className="font-serif text-lg font-semibold mt-0.5 tabular-nums">{selected.totalVisits}</p>
              </div>
              <div className="rounded-2xl bg-aura-bg p-3 border border-aura-border">
                <p className="text-[11px] text-aura-muted">{isAr ? 'إجمالي الإنفاق' : 'Total Spent'}</p>
                <p className="font-serif text-lg font-semibold mt-0.5 tabular-nums">
                  {fmtNumber(selected.totalSpentSar, lang)}
                </p>
              </div>
              <div className="rounded-2xl bg-aura-bg p-3 border border-aura-border">
                <p className="text-[11px] text-aura-muted">{isAr ? 'جلسات باقة' : 'Pkg Sessions'}</p>
                <p className="font-serif text-lg font-semibold mt-0.5 tabular-nums text-aura-accent">
                  {selected.packageSessionsRemaining}
                </p>
              </div>
            </div>

            {/* Health & Contraindications Editor */}
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-aura-muted">
                <span className="inline-flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-aura-warning" />
                  {isAr ? 'الملاحظات الصحية وموانع الاستعمال' : 'Health Intake & Contraindications'}
                </span>
              </label>
              <textarea
                rows={3}
                value={isAr ? selected.notesAr : selected.notesEn}
                onChange={(e) =>
                  updateClientParty(
                    selected.id,
                    isAr ? { notesAr: e.target.value } : { notesEn: e.target.value }
                  )
                }
                placeholder={
                  isAr
                    ? 'سجّل درجة الضغط المفضلة، الحساسية، الحمل، أو الإصابات...'
                    : 'Record pressure preference, allergies, pregnancy, or injuries...'
                }
                className="w-full rounded-2xl bg-aura-bg border border-aura-border p-3 text-xs text-aura-text focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
              />
            </div>

            {/* Preferred Therapist */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-aura-muted">
                <UserCheck className="w-3.5 h-3.5 text-aura-accent" />
                {isAr ? 'المعالجة المفضلة' : 'Preferred Therapist'}
              </label>
              <select
                value={selected.preferredTherapistId ?? ''}
                onChange={(e) =>
                  updateClientParty(selected.id, { preferredTherapistId: e.target.value || null })
                }
                className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-xs text-aura-text"
              >
                <option value="">{isAr ? 'أي معالجة متاحة' : 'Any available therapist'}</option>
                {THERAPISTS.map((th) => (
                  <option key={th.id} value={th.id}>
                    {th.name[lang]}
                  </option>
                ))}
              </select>
            </div>

            {/* Balance & Package controls */}
            <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'رصيد المحفظة / الحساب' : 'Account Credit Balance'}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {selected.balanceSar} {cur}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    updateClientParty(selected.id, { balanceSar: selected.balanceSar + 100 });
                    notify(isAr ? 'تم شحن رصيد العميل بـ 100 ر.س' : 'Added +100 SAR client credit');
                  }}
                  className="h-9 rounded-xl bg-aura-surface border border-aura-border text-xs font-medium hover:border-aura-accent/50"
                >
                  +100 {cur} {isAr ? 'شحن رصيد' : 'Top-up'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateClientParty(selected.id, {
                      packageSessionsRemaining: selected.packageSessionsRemaining + 1,
                    });
                    notify(isAr ? 'تمت إضافة جلسة باقة لرصيد العميلة' : 'Added 1 package session');
                  }}
                  className="h-9 rounded-xl bg-aura-surface border border-aura-border text-xs font-medium hover:border-aura-accent/50"
                >
                  +1 {isAr ? 'جلسة باقة' : 'Pkg Session'}
                </button>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/dashboard/bookings"
                className="inline-flex items-center justify-center gap-1.5 h-10 rounded-full border border-aura-border text-xs font-semibold hover:bg-aura-bg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-aura-accent" />
                {isAr ? 'حجز موعد' : 'Book Session'}
              </Link>
              <Link
                href="/pos"
                className="inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs font-semibold transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {isAr ? 'فتح في الكاشير' : 'Open in POS'}
              </Link>
            </div>
          </aside>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{isAr ? 'إضافة عميل جديد' : 'Add New Client'}</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  </span>
                  <input
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: سارة القحطاني"
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  </span>
                  <input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Sara Al-Qahtani"
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'رقم الجوال' : 'Mobile Phone'}
                  </span>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-aura-muted absolute top-1/2 -translate-y-1/2 start-3" />
                    <input
                      required
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0551234567"
                      className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border ps-8 pe-3 text-sm"
                    />
                  </div>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'المعالجة المفضلة' : 'Preferred Therapist'}
                  </span>
                  <select
                    value={preferredTherapistId}
                    onChange={(e) => setPreferredTherapistId(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  >
                    {THERAPISTS.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.name[lang]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'الملاحظات الصحية (الحمل، الحساسية، الضغط المفضل)' : 'Health Intake Notes (Pregnancy, Allergies, Pressure)'}
                </span>
                <textarea
                  rows={3}
                  value={notesAr}
                  onChange={(e) => {
                    setNotesAr(e.target.value);
                    if (!notesEn) setNotesEn(e.target.value);
                  }}
                  placeholder={
                    isAr
                      ? 'تفضّل الضغط المتوسط · لا توجد حساسية من الزيوت العطرية...'
                      : 'Prefers medium pressure · no essential oil allergies...'
                  }
                  className="w-full rounded-xl bg-aura-bg border border-aura-border p-3 text-sm"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 px-4 rounded-full border border-aura-border text-sm"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium"
                >
                  {isAr ? 'حفظ ملف العميل' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
