'use client';

import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Crown,
  PackageCheck,
  PackageOpen,
  Plus,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import { usePhase1Store, usePhase34Store } from '@/data/seedData';
import { fmtNumber } from './format';
import { useDashboard } from './useDashboard';

export default function PackagesPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { clients, updateClientParty } = usePhase1Store();
  const {
    packages,
    packageSessions,
    addPackageCatalog,
    updatePackageCatalog,
    redeemPackageSession,
    issueClientPackageSession,
  } = usePhase34Store();

  const [tab, setTab] = useState<'catalog' | 'cards'>('catalog');
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [showIssueCard, setShowIssueCard] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add Package form state
  const [code, setCode] = useState('PKG-CUSTOM-4');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [priceSar, setPriceSar] = useState(650);
  const [totalSessions, setTotalSessions] = useState(4);
  const [validDays, setValidDays] = useState(180);

  // Issue Card form state
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '');
  const [selectedPkgId, setSelectedPkgId] = useState(packages[0]?.id ?? 'pkg-4');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const stats = useMemo(() => {
    const activeCatalog = packages.filter((p) => p.isActive).length;
    const activeCards = packageSessions.filter((ps) => ps.usedQty < ps.totalQty).length;
    const remainingSessions = packageSessions.reduce(
      (sum, ps) => sum + Math.max(0, ps.totalQty - ps.usedQty),
      0
    );
    const redeemedSessions = packageSessions.reduce((sum, ps) => sum + ps.usedQty, 0);
    return { activeCatalog, activeCards, remainingSessions, redeemedSessions };
  }, [packages, packageSessions]);

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) return;
    addPackageCatalog({
      code: code.trim() || 'PKG-NEW',
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      descriptionAr: descAr.trim(),
      descriptionEn: descAr.trim(),
      priceSar: Number(priceSar) || 400,
      totalSessions: Number(totalSessions) || 3,
      validDays: Number(validDays) || 180,
      includedServicesAr: [`${totalSessions} جلسات مساج وحمام مغربي`],
      includedServicesEn: [`${totalSessions} massage & hammam sessions`],
      isActive: true,
    });
    setNameAr('');
    setNameEn('');
    setDescAr('');
    setShowAddPkg(false);
    notify(isAr ? 'تمت إضافة الباقة إلى الكتالوج' : 'Package added to catalog');
  };

  const handleIssueCard = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === selectedClientId);
    const pkg = packages.find((p) => p.id === selectedPkgId);
    if (!client || !pkg) return;

    const today = new Date();
    const exp = new Date(today);
    exp.setDate(exp.getDate() + pkg.validDays);

    issueClientPackageSession({
      packageId: pkg.id,
      packageNameAr: pkg.nameAr,
      packageNameEn: pkg.nameEn,
      customerId: client.id,
      clientNameAr: client.nameAr,
      clientNameEn: client.nameEn,
      clientPhone: client.phone,
      totalQty: pkg.totalSessions,
      usedQty: 0,
      soldDate: today.toISOString().slice(0, 10),
      expiresAt: exp.toISOString().slice(0, 10),
      soldReceiptNo: `JED01-T1-${String(Math.floor(150 + (Date.now() % 800))).padStart(6, '0')}`,
    });
    updateClientParty(client.id, {
      packageSessionsRemaining: client.packageSessionsRemaining + pkg.totalSessions,
    });
    setShowIssueCard(false);
    setTab('cards');
    notify(
      isAr
        ? `تم إصدار بطاقة (${pkg.nameAr}) للعميلة ${client.nameAr}`
        : `Issued ${pkg.nameEn} card to ${client.nameEn}`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <PackageOpen className="w-3.5 h-3.5" />
            {isAr ? 'الباقات وبطاقات العضوية · المرحلة 3' : 'Packages & Membership Cards · Phase 3'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'الباقات ورصيد الجلسات' : 'Packages & Redeemable Session Cards'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'إدارة باقات المساج والحمام المغربي، بطاقات الجلسات مسبقة الدفع، واسترداد الجلسات للعملاء.'
              : 'Manage bundled spa packages, prepaid membership session cards, and session redemptions.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowIssueCard(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-aura-surface border border-aura-border text-sm font-medium hover:border-aura-accent/50 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-aura-accent" />
            {isAr ? 'إصدار بطاقة باقة لعميل' : 'Issue Card to Client'}
          </button>
          <button
            type="button"
            onClick={() => setShowAddPkg(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'باقة جديدة' : 'New Package'}
          </button>
        </div>
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
          <p className="text-xs text-aura-muted">{isAr ? 'الباقات المتاحة بالكتالوج' : 'Active Catalog Packages'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {stats.activeCatalog} <span className="text-sm font-sans text-aura-muted">/ {packages.length}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جدول packages' : 'packages table'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'بطاقات العملاء السارية' : 'Active Client Cards'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{stats.activeCards}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جدول package_sessions' : 'package_sessions table'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'جلسات متبقية قابلة للاسترداد' : 'Remaining Sessions Balance'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-accent">
            {fmtNumber(stats.remainingSessions, lang)}
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جاهزة للخصم عند الحضور' : 'Redeemable on check-in / POS'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'جلسات تم استردادها' : 'Sessions Redeemed'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-success">
            {fmtNumber(stats.redeemedSessions, lang)}
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'مكتملة من رصيد الباقات' : 'Completed from prepaid cards'}</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={`h-10 px-5 rounded-full text-sm font-medium transition-colors ${
            tab === 'catalog'
              ? 'bg-aura-text text-white'
              : 'bg-aura-surface border border-aura-border text-aura-text hover:border-aura-accent/40'
          }`}
        >
          {isAr ? `كتالوج الباقات والعضويات (${packages.length})` : `Package Catalog (${packages.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab('cards')}
          className={`h-10 px-5 rounded-full text-sm font-medium transition-colors ${
            tab === 'cards'
              ? 'bg-aura-text text-white'
              : 'bg-aura-surface border border-aura-border text-aura-text hover:border-aura-accent/40'
          }`}
        >
          {isAr
            ? `بطاقات العملاء ورصيد الجلسات (${packageSessions.length})`
            : `Client Session Cards (${packageSessions.length})`}
        </button>
      </div>

      {tab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const list = isAr ? pkg.includedServicesAr : pkg.includedServicesEn;
            return (
              <article
                key={pkg.id}
                className={`rounded-3xl bg-aura-surface border p-5 flex flex-col justify-between transition ${
                  pkg.isHighlighted ? 'border-2 border-aura-accent/50 shadow-premium' : 'border-aura-border'
                } ${!pkg.isActive ? 'opacity-60' : ''}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-aura-muted" dir="ltr">
                          {pkg.code}
                        </span>
                        {pkg.isHighlighted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-primary px-2.5 py-0.5 text-[11px] font-semibold text-aura-accent">
                            <Crown className="w-3 h-3" />
                            {isAr ? 'الأكثر طلباً' : 'Most Popular'}
                          </span>
                        )}
                      </div>
                      <h2 className="font-serif text-xl text-aura-text mt-1">
                        {isAr ? pkg.nameAr : pkg.nameEn}
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => updatePackageCatalog(pkg.id, { isActive: !pkg.isActive })}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        pkg.isActive
                          ? 'bg-aura-success-bg text-aura-success'
                          : 'bg-aura-bg text-aura-muted border border-aura-border'
                      }`}
                    >
                      {pkg.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'موقوف' : 'Paused'}
                    </button>
                  </div>

                  <p className="text-xs text-aura-muted mt-2">
                    {isAr ? pkg.descriptionAr : pkg.descriptionEn}
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    {list.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-aura-text">
                        <Sparkles className="w-3.5 h-3.5 text-aura-accent shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-aura-border flex items-end justify-between gap-2">
                  <div>
                    <p className="text-xs text-aura-muted">
                      {pkg.totalSessions} {isAr ? 'جلسات · صالحة لمدة' : 'sessions · valid'} {pkg.validDays}{' '}
                      {isAr ? 'يوماً' : 'days'}
                    </p>
                    <p className="font-serif text-2xl font-semibold text-aura-text tabular-nums mt-0.5">
                      {pkg.priceSar} <span className="text-xs font-sans text-aura-muted">{cur}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPkgId(pkg.id);
                      setShowIssueCard(true);
                    }}
                    className="h-9 px-3.5 rounded-full bg-aura-primary text-aura-accent hover:bg-aura-accent hover:text-white text-xs font-semibold transition-colors"
                  >
                    {isAr ? 'إصدار لعميل' : 'Issue to Client'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-aura-surface border border-aura-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border bg-aura-bg/60 text-xs text-aura-muted">
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'العميل' : 'Client'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'الباقة / البطاقة' : 'Package Card'}</th>
                  <th className="text-center font-medium py-3.5 px-4">{isAr ? 'رصيد الجلسات' : 'Session Progress'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'الصلاحية والفاتورة' : 'Expiry & Receipt'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'استرداد جلسة' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border">
                {packageSessions.map((ps) => {
                  const remaining = Math.max(0, ps.totalQty - ps.usedQty);
                  const pct = Math.round((ps.usedQty / ps.totalQty) * 100);
                  return (
                    <tr key={ps.id} className="hover:bg-aura-bg/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-aura-text">
                          {isAr ? ps.clientNameAr : ps.clientNameEn}
                        </p>
                        <p className="text-xs text-aura-muted font-mono" dir="ltr">
                          {ps.clientPhone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-aura-text">
                          {isAr ? ps.packageNameAr : ps.packageNameEn}
                        </p>
                        <p className="text-xs text-aura-muted font-mono" dir="ltr">
                          {ps.soldReceiptNo}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="max-w-[180px] mx-auto space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-aura-muted">
                              {isAr ? `استُخدم ${ps.usedQty} من ${ps.totalQty}` : `${ps.usedQty} / ${ps.totalQty} used`}
                            </span>
                            <span className="font-semibold text-aura-accent">
                              {remaining} {isAr ? 'متبقي' : 'left'}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-aura-bg overflow-hidden">
                            <div
                              className="h-full rounded-full bg-aura-accent transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-aura-muted tabular-nums">
                        <span className="inline-flex items-center gap-1" dir="ltr">
                          <Calendar className="w-3.5 h-3.5 text-aura-accent" />
                          {ps.expiresAt}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        {remaining > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              redeemPackageSession(ps.id);
                              notify(
                                isAr
                                  ? `تم خصم جلسة من باقة ${ps.clientNameAr} (المتبقي ${remaining - 1})`
                                  : `Redeemed 1 session for ${ps.clientNameEn} (${remaining - 1} left)`
                              );
                            }}
                            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs font-semibold transition-colors"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            {isAr ? 'استرداد جلسة (-1)' : 'Redeem Session (-1)'}
                          </button>
                        ) : (
                          <span className="rounded-full bg-aura-bg border border-aura-border px-3 py-1 text-xs text-aura-muted">
                            {isAr ? 'مكتملة بالكامل' : 'Fully Redeemed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Package Modal */}
      {showAddPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{isAr ? 'إنشاء باقة جديدة' : 'Create New Package'}</h2>
              <button
                type="button"
                onClick={() => setShowAddPkg(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3.5">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'رمز الباقة' : 'Package Code'}</span>
                <input
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm font-mono"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اسم الباقة (عربي)' : 'Name (Arabic)'}</span>
                <input
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: باقة العروس الملكية (4 جلسات)"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اسم الباقة (إنجليزي)' : 'Name (English)'}</span>
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Bridal Royal Package (4 Sessions)"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'السعر (ر.س)' : 'Price (SAR)'}</span>
                  <input
                    type="number"
                    value={priceSar}
                    onChange={(e) => setPriceSar(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'عدد الجلسات' : 'Sessions'}</span>
                  <input
                    type="number"
                    min={1}
                    value={totalSessions}
                    onChange={(e) => setTotalSessions(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'الصلاحية (يوم)' : 'Valid Days'}</span>
                  <input
                    type="number"
                    min={30}
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'الوصف' : 'Description'}</span>
                <textarea
                  rows={2}
                  value={descAr}
                  onChange={(e) => setDescAr(e.target.value)}
                  className="w-full rounded-xl bg-aura-bg border border-aura-border p-3 text-sm"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPkg(false)}
                  className="h-10 px-4 rounded-full border border-aura-border text-sm"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium"
                >
                  {isAr ? 'حفظ الباقة' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Package Card Modal */}
      {showIssueCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">
                {isAr ? 'إصدار بطاقة باقة لعميل' : 'Issue Package Card to Client'}
              </h2>
              <button
                type="button"
                onClick={() => setShowIssueCard(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اختر العميل' : 'Select Client'}</span>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.nameAr : c.nameEn} ({c.phone})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اختر الباقة' : 'Select Package'}</span>
                <select
                  value={selectedPkgId}
                  onChange={(e) => setSelectedPkgId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isAr ? p.nameAr : p.nameEn} — {p.priceSar} {cur} ({p.totalSessions} {isAr ? 'جلسات' : 'sessions'})
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueCard(false)}
                  className="h-10 px-4 rounded-full border border-aura-border text-sm"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium"
                >
                  {isAr ? 'تفعيل بطاقة الباقة' : 'Issue Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
