'use client';

import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  DoorOpen,
  Droplets,
  Footprints,
  Hand,
  Plus,
  ReceiptText,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import {
  usePhase1Store,
  type CatalogCategory,
  type CatalogService,
} from '@/data/seedData';
import { fmtNumber } from './format';
import { useDashboard } from './useDashboard';

const CATEGORY_META: Record<
  CatalogCategory,
  { icon: LucideIcon; labelAr: string; labelEn: string; roomAr: string; roomEn: string }
> = {
  massage: {
    icon: Hand,
    labelAr: 'المساج',
    labelEn: 'Massage',
    roomAr: 'غرف المساج (1–3)',
    roomEn: 'Massage Rooms (1–3)',
  },
  'moroccan-bath': {
    icon: Droplets,
    labelAr: 'الحمام المغربي',
    labelEn: 'Moroccan Bath',
    roomAr: 'الحمام المغربي (1–2)',
    roomEn: 'Hammam Suites (1–2)',
  },
  pedicure: {
    icon: Footprints,
    labelAr: 'البديكير',
    labelEn: 'Pedicure',
    roomAr: 'صالة البديكير',
    roomEn: 'Pedicure Lounge',
  },
};

export default function ServicesPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { services, addCatalogService, updateCatalogService } = usePhase1Store();

  const [categoryFilter, setCategoryFilter] = useState<CatalogCategory | 'all'>('all');
  const [editing, setEditing] = useState<CatalogService | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add service form
  const [code, setCode] = useState('SRV-MSG-90');
  const [category, setCategory] = useState<CatalogCategory>('massage');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descEn, setDescEn] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [priceSar, setPriceSar] = useState(250);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(
    () =>
      services.filter((s) => categoryFilter === 'all' || s.category === categoryFilter),
    [services, categoryFilter]
  );

  const stats = useMemo(() => {
    const active = services.filter((s) => s.isActive);
    const avgPrice = active.length
      ? Math.round(active.reduce((sum, s) => sum + s.priceSar, 0) / active.length)
      : 0;
    const avgDuration = active.length
      ? Math.round(active.reduce((sum, s) => sum + s.durationMin, 0) / active.length)
      : 0;
    return { total: services.length, active: active.length, avgPrice, avgDuration };
  }, [services]);

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) return;
    addCatalogService({
      code: code.trim() || `SRV-${Date.now().toString().slice(-3)}`,
      category,
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      descriptionAr: descAr.trim(),
      descriptionEn: descEn.trim() || descAr.trim(),
      durationMin: Number(durationMin) || 60,
      priceSar: Number(priceSar) || 200,
      taxRate: 15,
      taxable: true,
      roomKind: category,
      isActive: true,
    });
    setNameAr('');
    setNameEn('');
    setDescAr('');
    setDescEn('');
    setShowAdd(false);
    notify(isAr ? 'تمت إضافة الخدمة إلى كتالوج نقطة البيع' : 'Service added to POS catalog');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <Sparkles className="w-3.5 h-3.5" />
            {isAr ? 'كتالوج الخدمات والأسعار · المرحلة 1' : 'Services & Pricing Catalog · Phase 1'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'الخدمات وجلسات العناية' : 'Treatments & Services Menu'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'إدارة قائمة خدمات المساج والحمام المغربي والبديكير، مدد الجلسات، والأسعار شاملة ضريبة القيمة المضافة 15%.'
              : 'Manage massage, Moroccan bath, and pedicure treatments, session durations, and 15% VAT-inclusive SAR pricing.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة خدمة جديدة' : 'Add Service'}
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
          <p className="text-xs text-aura-muted">{isAr ? 'الخدمات النشطة' : 'Active Services'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {stats.active} <span className="text-sm font-sans text-aura-muted">/ {stats.total}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'متزامنة مع شاشة الكاشير' : 'Synced to POS tiles'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'متوسط سعر الجلسة' : 'Average Session Price'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtNumber(stats.avgPrice, lang)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'شامل ضريبة 15%' : 'VAT 15% inclusive'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'متوسط مدة الجلسة' : 'Average Duration'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {stats.avgDuration} <span className="text-sm font-sans text-aura-muted">{isAr ? 'دقيقة' : 'min'}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? '+ 15 د تجهيز الغرفة' : '+ 15m turnover buffer'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'نسبة ضريبة القيمة المضافة' : 'KSA VAT Compliance'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-accent">15%</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'تُستخرج آلياً في الفاتورة' : 'Extracted automatically on POS'}</p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`h-10 px-4 rounded-full text-sm font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-aura-text text-white'
              : 'bg-aura-surface border border-aura-border text-aura-text hover:border-aura-accent/40'
          }`}
        >
          {isAr ? 'جميع الأقسام' : 'All Categories'} ({services.length})
        </button>
        {(Object.keys(CATEGORY_META) as CatalogCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const count = services.filter((s) => s.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-aura-text text-white'
                  : 'bg-aura-surface border border-aura-border text-aura-text hover:border-aura-accent/40'
              }`}
            >
              <Icon className="w-4 h-4 text-aura-accent" />
              <span>{isAr ? meta.labelAr : meta.labelEn}</span>
              <span className="text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((srv) => {
          const meta = CATEGORY_META[srv.category];
          const Icon = meta.icon;
          const vatExtracted = ((srv.priceSar * 15) / 115).toFixed(2);
          const netBeforeVat = (srv.priceSar - Number(vatExtracted)).toFixed(2);

          return (
            <article
              key={srv.id}
              className={`rounded-3xl bg-aura-surface border p-5 flex flex-col justify-between transition ${
                srv.isActive ? 'border-aura-border' : 'border-aura-border/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-2xl bg-aura-primary text-aura-accent grid place-items-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[11px] font-mono text-aura-muted" dir="ltr">
                        {srv.code}
                      </span>
                      <h2 className="font-serif text-lg text-aura-text leading-snug">
                        {isAr ? srv.nameAr : srv.nameEn}
                      </h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateCatalogService(srv.id, { isActive: !srv.isActive });
                      notify(
                        srv.isActive
                          ? isAr
                            ? 'تم إيقاف الخدمة مؤقتاً'
                            : 'Service paused'
                          : isAr
                          ? 'تم تفعيل الخدمة'
                          : 'Service activated'
                      );
                    }}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      srv.isActive
                        ? 'bg-aura-success-bg text-aura-success'
                        : 'bg-aura-bg text-aura-muted border border-aura-border'
                    }`}
                  >
                    {srv.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'موقوف' : 'Hidden'}
                  </button>
                </div>

                <p className="text-xs text-aura-muted mt-3 line-clamp-2">
                  {isAr ? srv.descriptionAr : srv.descriptionEn}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-aura-muted">
                  <span className="inline-flex items-center gap-1 rounded-full bg-aura-bg border border-aura-border px-2.5 py-1">
                    <Clock className="w-3.5 h-3.5 text-aura-accent" />
                    {srv.durationMin} {isAr ? 'دقيقة' : 'min'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-aura-bg border border-aura-border px-2.5 py-1">
                    <DoorOpen className="w-3.5 h-3.5 text-aura-accent" />
                    {isAr ? meta.roomAr : meta.roomEn}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-aura-border flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-aura-muted">
                    {isAr ? 'السعر الشامل للضريبة' : 'VAT-Inclusive Price'}
                  </p>
                  <p className="font-serif text-2xl font-semibold text-aura-text tabular-nums">
                    {srv.priceSar} <span className="text-xs font-sans text-aura-muted">{cur}</span>
                  </p>
                  <p className="text-[11px] text-aura-muted tabular-nums">
                    <ReceiptText className="inline w-3 h-3 me-1 text-aura-accent" />
                    {isAr
                      ? `الصافي ${netBeforeVat} + ضريبة ${vatExtracted} ر.س`
                      : `Net ${netBeforeVat} + VAT ${vatExtracted} SAR`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(srv)}
                  className="h-9 px-3.5 rounded-full bg-aura-bg border border-aura-border text-xs font-medium hover:border-aura-accent/50"
                >
                  {isAr ? 'تعديل السعر / المدة' : 'Edit Price / Time'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">
                {isAr ? `تعديل: ${editing.nameAr}` : `Edit: ${editing.nameEn}`}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'الاسم بالعربية' : 'Arabic Name'}
                </span>
                <input
                  value={editing.nameAr}
                  onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'الاسم بالإنجليزية' : 'English Name'}
                </span>
                <input
                  value={editing.nameEn}
                  onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'المدة (بالدقائق)' : 'Duration (min)'}
                  </span>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={editing.durationMin}
                    onChange={(e) => setEditing({ ...editing, durationMin: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'السعر شامل الضريبة (ر.س)' : 'Price incl. VAT (SAR)'}
                  </span>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={editing.priceSar}
                    onChange={(e) => setEditing({ ...editing, priceSar: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-10 px-4 rounded-full border border-aura-border text-sm"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  updateCatalogService(editing.id, editing);
                  setEditing(null);
                  notify(isAr ? 'تم حفظ تعديلات الخدمة' : 'Service updated');
                }}
                className="h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium"
              >
                {isAr ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">
                {isAr ? 'إضافة خدمة علاجية جديدة' : 'Add New Treatment Service'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'قسم الخدمة' : 'Category'}
                  </span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CatalogCategory)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  >
                    <option value="massage">{isAr ? 'المساج' : 'Massage'}</option>
                    <option value="moroccan-bath">{isAr ? 'الحمام المغربي' : 'Moroccan Bath'}</option>
                    <option value="pedicure">{isAr ? 'البديكير' : 'Pedicure'}</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'رمز الخدمة (SKU)' : 'SKU Code'}
                  </span>
                  <input
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm font-mono"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'اسم الخدمة (عربي)' : 'Service Name (Arabic)'}
                  </span>
                  <input
                    required
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: مساج تايلندي بالأعشاب"
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'اسم الخدمة (إنجليزي)' : 'Service Name (English)'}
                  </span>
                  <input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Thai Herbal Massage"
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'المدة (دقيقة)' : 'Duration (Minutes)'}
                  </span>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {isAr ? 'السعر شامل ضريبة 15% (ر.س)' : 'Price incl. 15% VAT (SAR)'}
                  </span>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={priceSar}
                    onChange={(e) => setPriceSar(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'وصف الخدمة' : 'Description'}
                </span>
                <textarea
                  rows={2}
                  value={descAr}
                  onChange={(e) => {
                    setDescAr(e.target.value);
                    if (!descEn) setDescEn(e.target.value);
                  }}
                  placeholder={isAr ? 'وصف مختصر يظهر في الموقع والكتالوج...' : 'Short description...'}
                  className="w-full rounded-xl bg-aura-bg border border-aura-border p-3 text-sm"
                />
              </label>

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
                  {isAr ? 'إضافة للكتالوج' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
