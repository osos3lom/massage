'use client';

import { useMemo, useState } from 'react';
import {
  BadgePercent,
  Calendar,
  CheckCircle2,
  Plus,
  Tag,
  TicketPercent,
  X,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import { usePhase1Store } from '@/data/seedData';
import { fmtNumber } from './format';
import { useDashboard } from './useDashboard';

export default function PromotionsPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { promotions, addPromotionDiscount, updatePromotionDiscount } = usePhase1Store();

  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // New promotion form state
  const [code, setCode] = useState('NATIONAL96');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [kind, setKind] = useState<'percent' | 'amount'>('percent');
  const [valInput, setValInput] = useState(15);
  const [startsAt, setStartsAt] = useState('2026-10-01');
  const [endsAt, setEndsAt] = useState('2026-12-31');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const stats = useMemo(() => {
    const active = promotions.filter((p) => p.isActive).length;
    const totalRedemptions = promotions.reduce((sum, p) => sum + p.usageCount, 0);
    const percentCount = promotions.filter((p) => p.kind === 'percent').length;
    const amountCount = promotions.filter((p) => p.kind === 'amount').length;
    return { active, totalRedemptions, percentCount, amountCount };
  }, [promotions]);

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) return;
    addPromotionDiscount({
      code: code.trim().toUpperCase() || 'PROMO',
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      kind,
      value: kind === 'percent' ? Number(valInput) : Math.round(Number(valInput) * 100),
      startsAt,
      endsAt,
      isActive: true,
    });
    setNameAr('');
    setNameEn('');
    setShowAdd(false);
    notify(isAr ? 'تم إنشاء العرض الترويجي وتفعيله في نقطة البيع' : 'Promotion created & enabled in POS');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <BadgePercent className="w-3.5 h-3.5" />
            {isAr ? 'العروض والخصومات الترويجية · المرحلة 1' : 'Promotions & Discounts · Phase 1'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'العروض وأكواد الخصم' : 'Promotions & Discount Rules'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'إدارة خصومات الولاء، عروض الصباح، والخصومات المقطوعة المتاحة للكاشير في شاشة نقطة البيع (POS).'
              : 'Manage loyalty discounts, weekday morning offers, and flat SAR vouchers available on the POS checkout screen.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'عرض ترويجي جديد' : 'New Promotion'}
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
          <p className="text-xs text-aura-muted">{isAr ? 'العروض الفعالة حالياً' : 'Active Promotions'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {stats.active} <span className="text-sm font-sans text-aura-muted">/ {promotions.length}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جدول discounts' : 'discounts table'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'مرات الاستخدام في الفواتير' : 'Total Redemptions'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{fmtNumber(stats.totalRedemptions, lang)}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'فواتير مكتملة بخصم' : 'Discounted tickets'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'خصومات نسبة مئوية (%)' : 'Percentage Discounts'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{stats.percentCount}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'تُحسب من إجمالي الفاتورة' : 'Computed on ticket subtotal'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'خصومات مبلغ ثابت (ر.س)' : 'Fixed Amount Vouchers'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{stats.amountCount}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'تُخصم قبل احتساب ضريبة زاتكا' : 'Deducted before ZATCA VAT'}</p>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map((promo) => {
          const displayVal =
            promo.kind === 'percent'
              ? `${promo.value}%`
              : `${(promo.value / 100).toFixed(0)} ${cur}`;

          return (
            <article
              key={promo.id}
              className={`rounded-3xl bg-aura-surface border p-5 flex flex-col justify-between transition ${
                promo.isActive ? 'border-aura-border' : 'border-aura-border/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <span className="w-12 h-12 rounded-2xl bg-aura-primary text-aura-accent grid place-items-center shrink-0">
                    <TicketPercent className="w-6 h-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        dir="ltr"
                        className="inline-flex items-center gap-1 rounded-lg bg-aura-bg border border-aura-border px-2.5 py-0.5 text-xs font-mono font-semibold text-aura-accent"
                      >
                        <Tag className="w-3 h-3" />
                        {promo.code}
                      </span>
                      <span className="rounded-full bg-aura-primary/70 text-aura-accent px-2.5 py-0.5 text-xs font-bold tabular-nums">
                        {isAr ? `خصم ${displayVal}` : `${displayVal} OFF`}
                      </span>
                    </div>
                    <h2 className="font-serif text-xl text-aura-text mt-1.5">
                      {isAr ? promo.nameAr : promo.nameEn}
                    </h2>
                    <p className="text-xs text-aura-muted">{isAr ? promo.nameEn : promo.nameAr}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    updatePromotionDiscount(promo.id, { isActive: !promo.isActive });
                    notify(
                      promo.isActive
                        ? isAr
                          ? 'تم إيقاف العرض الترويجي'
                          : 'Promotion disabled'
                        : isAr
                        ? 'تم تفعيل العرض الترويجي'
                        : 'Promotion enabled'
                    );
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    promo.isActive
                      ? 'bg-aura-success-bg text-aura-success'
                      : 'bg-aura-bg text-aura-muted border border-aura-border'
                  }`}
                >
                  {promo.isActive ? (isAr ? 'مفعّل في POS' : 'Active on POS') : isAr ? 'معطّل' : 'Disabled'}
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-aura-border flex flex-wrap items-center justify-between gap-3 text-xs text-aura-muted">
                <span className="inline-flex items-center gap-1.5 tabular-nums" dir="ltr">
                  <Calendar className="w-3.5 h-3.5 text-aura-accent" />
                  {promo.startsAt} → {promo.endsAt}
                </span>
                <span className="font-medium text-aura-text">
                  {isAr
                    ? `استُخدم ${promo.usageCount} مرة`
                    : `Redeemed ${promo.usageCount} times`}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Add Promotion Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">
                {isAr ? 'إنشاء عرض ترويجي جديد' : 'Create New Promotion'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPromo} className="space-y-3.5">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'كود الخصم' : 'Promo Code'}
                </span>
                <input
                  required
                  dir="ltr"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm font-mono uppercase"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'اسم العرض (عربي)' : 'Offer Title (Arabic)'}
                </span>
                <input
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: عرض اليوم الوطني 20%"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'اسم العرض (إنجليزي)' : 'Offer Title (English)'}
                </span>
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. National Day 20% Off"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'نوع الخصم' : 'Discount Type'}
                  </span>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as 'percent' | 'amount')}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  >
                    <option value="percent">{isAr ? 'نسبة مئوية (%)' : 'Percentage (%)'}</option>
                    <option value="amount">{isAr ? 'مبلغ ثابت (ر.س)' : 'Fixed Amount (SAR)'}</option>
                  </select>
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {kind === 'percent'
                      ? isAr
                        ? 'النسبة (%)'
                        : 'Percentage (%)'
                      : isAr
                      ? 'المبلغ (ر.س)'
                      : 'Amount (SAR)'}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={kind === 'percent' ? 100 : 1000}
                    value={valInput}
                    onChange={(e) => setValInput(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'تاريخ البداية' : 'Starts At'}
                  </span>
                  <input
                    type="date"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'تاريخ الانتهاء' : 'Ends At'}
                  </span>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
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
                  {isAr ? 'حفظ وتفعيل العرض' : 'Save Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
