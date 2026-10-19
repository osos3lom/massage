'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Ban,
  CheckCircle2,
  CloudUpload,
  CreditCard,
  Layers,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import {
  CASHIERS, THERAPISTS, encodeZatcaTlvPreview, fmtMoney, usePhase1Store, useSettingsStore,
  type PaymentKind,
} from '@/data/seedData';
import { fmtDate } from './format';
import { useDashboard } from './useDashboard';

type SaleFilter = 'all' | 'completed' | 'voided' | 'pending_zatca';

const PAYMENT_LABEL: Record<PaymentKind, { ar: string; en: string }> = {
  cash: { ar: 'نقدي', en: 'Cash' },
  card: { ar: 'شبكة لاتلامسية (مدى / فيزا)', en: 'Contactless Card (mada / Visa)' },
  wallet: { ar: 'محفظة رقمية (Apple Pay / STC Pay)', en: 'Digital Wallet (Apple Pay / STC Pay)' },
  transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
  package: { ar: 'استبدال جلسة باقة', en: 'Package Session Redemption' },
};

export default function SalesPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { sales, voidLedgerSale, reportPendingZatcaSales } = usePhase1Store();
  const { settings } = useSettingsStore();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SaleFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(sales[0]?.id ?? null);
  const [printMode, setPrintMode] = useState<'thermal' | 'carbon'>('thermal');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales.filter((s) => {
      if (filter === 'completed' && s.status !== 'completed') return false;
      if (filter === 'voided' && s.status !== 'voided') return false;
      if (filter === 'pending_zatca' && s.zatcaStatus !== 'pending') return false;
      if (!q) return true;
      return (
        s.receiptNo.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        (s.clientPhone && s.clientPhone.includes(q))
      );
    });
  }, [sales, query, filter]);

  const selected = useMemo(
    () => sales.find((s) => s.id === selectedId) ?? filtered[0] ?? null,
    [sales, selectedId, filtered]
  );

  const stats = useMemo(() => {
    const completed = sales.filter((s) => s.status === 'completed');
    const netHalalas = completed.reduce((sum, s) => sum + s.grandTotalHalalas, 0);
    const vatHalalas = completed.reduce((sum, s) => sum + s.vatHalalas, 0);
    const reportedCount = completed.filter((s) => s.zatcaStatus === 'reported' || s.zatcaStatus === 'cleared').length;
    const pendingZatca = completed.filter((s) => s.zatcaStatus === 'pending').length;
    return {
      completedCount: completed.length,
      netHalalas,
      vatHalalas,
      reportedCount,
      pendingZatca,
    };
  }, [sales]);

  const tlvPayload = useMemo(() => {
    if (!selected) return null;
    return encodeZatcaTlvPreview({
      sellerName: isAr ? settings.company.nameAr : settings.company.nameEn,
      vatNumber: settings.company.vatNumber,
      timestampIso: selected.createdAtIso,
      totalWithVat: fmtMoney(selected.grandTotalHalalas),
      vatTotal: fmtMoney(selected.vatHalalas),
      xmlHash: selected.zatcaHash,
      ecdsaSignature: `MEYCIQD${selected.zatcaHash.slice(0, 24)}==`,
      publicKey: `MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE${settings.zatca.egsSerialNumber.slice(0, 12)}`,
      csidStamp: settings.zatca.binarySecurityToken.slice(0, 24),
    });
  }, [selected, isAr, settings.company, settings.zatca]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <ReceiptText className="w-3.5 h-3.5" />
            {isAr
              ? 'سجل المبيعات والفواتير الضريبية ZATCA · المرحلة 1'
              : 'Sales Ledger & ZATCA Tax Invoices · Phase 1'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'المبيعات والفواتير الضريبية' : 'Sales & Tax Invoices'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'دفتر فواتير غير قابل للتعديل (Append-only) مع التوقيع التشفيري للمرحلة الثانية من زاتكا، وإعادة الطباعة الحرارية والكربونية.'
              : 'Append-only invoice ledger with ZATCA Phase 2 cryptographic stamps, contactless terminal refs, and thermal/carbon reprints.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {stats.pendingZatca > 0 && (
            <button
              type="button"
              onClick={() => {
                reportPendingZatcaSales();
                notify(
                  isAr
                    ? `تم إبلاغ زاتكا بـ ${stats.pendingZatca} فاتورة معلقة بنجاح`
                    : `Reported ${stats.pendingZatca} pending invoices to ZATCA`
                );
              }}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-aura-warning-bg border border-aura-warning/40 text-aura-warning text-xs font-semibold hover:bg-aura-warning/15 transition-colors"
            >
              <CloudUpload className="w-4 h-4" />
              {isAr
                ? `إبلاغ زاتكا (${stats.pendingZatca} معلقة)`
                : `Report to ZATCA (${stats.pendingZatca} pending)`}
            </button>
          )}
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {isAr ? 'نقطة البيع (فاتورة جديدة)' : 'Open POS Till'}
          </Link>
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
          <p className="text-xs text-aura-muted">{isAr ? 'إجمالي المبيعات المعتمدة' : 'Completed Sales Total'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtMoney(stats.netHalalas)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">
            {stats.completedCount} {isAr ? 'فاتورة ضريبية مبسطة' : 'simplified tax invoices'}
          </p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'ضريبة القيمة المضافة المحصلة (15%)' : 'Collected KSA VAT (15%)'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-accent">
            {fmtMoney(stats.vatHalalas)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'مستخرجة من السعر الشامل' : 'Extracted from inclusive prices'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'فواتير مُبلّغة لزاتكا (المرحلة 2)' : 'ZATCA Phase 2 Reported'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-success">
            {stats.reportedCount} <span className="text-sm font-sans text-aura-muted">/ {stats.completedCount}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'توقيع ECDSA secp256k1' : 'ECDSA secp256k1 signed'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'بانتظار الإبلاغ (نافذة 24 ساعة)' : 'Pending ZATCA Sync (24h window)'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {stats.pendingZatca}
          </p>
          <p className="mt-1 text-xs text-aura-muted">
            {stats.pendingZatca === 0
              ? isAr
                ? 'جميع الفواتير متزامنة'
                : 'All invoices synced'
              : isAr
              ? 'اضغط إبلاغ زاتكا أعلاه'
              : 'Click Report to ZATCA above'}
          </p>
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
                ? 'ابحث برقم الفاتورة (JED01-T1-...) أو اسم العميل...'
                : 'Search by receipt no (JED01-T1-...) or client name...'
            }
            className="w-full h-10 rounded-full bg-aura-bg border border-aura-border ps-10 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'all', labelAr: 'كل الفواتير', labelEn: 'All Invoices' },
              { key: 'completed', labelAr: 'مكتملة', labelEn: 'Completed' },
              { key: 'pending_zatca', labelAr: 'بانتظار زاتكا', labelEn: 'Pending ZATCA' },
              { key: 'voided', labelAr: 'ملغاة (إشعار دائن)', labelEn: 'Voided / Credit Note' },
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
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_25rem] gap-5 items-start">
        {/* Invoices Table */}
        <div className="rounded-3xl bg-aura-surface border border-aura-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border bg-aura-bg/60 text-xs text-aura-muted">
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'رقم الفاتورة' : 'Receipt No'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'العميل والوقت' : 'Client & Time'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'طريقة الدفع' : 'Payment Tender'}</th>
                  <th className="text-center font-medium py-3.5 px-3">{isAr ? 'حالة زاتكا' : 'ZATCA Status'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'الإجمالي' : 'Grand Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border">
                {filtered.map((s) => {
                  const isSelected = selected?.id === s.id;
                  const dt = new Date(s.createdAtIso);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-aura-primary/45' : 'hover:bg-aura-bg/60'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-mono text-xs font-semibold text-aura-text" dir="ltr">
                          {s.receiptNo}
                        </p>
                        <p className="text-[11px] text-aura-muted font-mono" dir="ltr">
                          ICV #{s.zatcaCounter}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-aura-text">{s.clientName}</p>
                        <p className="text-xs text-aura-muted tabular-nums">
                          {fmtDate(dt, lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {s.payments.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center rounded-full bg-aura-bg border border-aura-border px-2.5 py-0.5 text-[11px] font-medium"
                            >
                              {isAr ? PAYMENT_LABEL[p.kind].ar.split(' ')[0] : PAYMENT_LABEL[p.kind].en.split(' ')[0]}
                              {p.cardScheme ? ` · ${p.cardScheme}` : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {s.status === 'voided' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-danger-bg text-aura-danger px-2.5 py-0.5 text-[11px] font-medium">
                            {isAr ? 'إشعار دائن (ملغاة)' : 'Voided'}
                          </span>
                        ) : s.zatcaStatus === 'reported' || s.zatcaStatus === 'cleared' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-success-bg text-aura-success px-2.5 py-0.5 text-[11px] font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            {isAr ? 'مُبلّغة ZATCA' : 'Reported'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-warning-bg text-aura-warning px-2.5 py-0.5 text-[11px] font-medium">
                            {isAr ? 'بانتظار الرفع' : 'Pending Sync'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-end tabular-nums">
                        <p className={`font-semibold ${s.status === 'voided' ? 'line-through text-aura-muted' : 'text-aura-text'}`}>
                          {fmtMoney(s.grandTotalHalalas)} {cur}
                        </p>
                        <p className="text-[11px] text-aura-muted">
                          {isAr ? `ضريبة ${fmtMoney(s.vatHalalas)}` : `VAT ${fmtMoney(s.vatHalalas)}`}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Receipt & ZATCA Inspector */}
        {selected && (
          <aside className="rounded-3xl bg-aura-surface border border-aura-border p-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex rounded-full bg-aura-bg border border-aura-border p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPrintMode('thermal')}
                  className={`px-3 py-1 rounded-full font-medium transition ${
                    printMode === 'thermal' ? 'bg-aura-text text-white' : 'text-aura-muted'
                  }`}
                >
                  {isAr ? 'حرارية 80mm' : '80mm Thermal'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('carbon')}
                  className={`px-3 py-1 rounded-full font-medium transition ${
                    printMode === 'carbon' ? 'bg-aura-text text-white' : 'text-aura-muted'
                  }`}
                >
                  {isAr ? 'سند كربوني (نسختان)' : '2-Ply Carbon'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.print();
                  notify(
                    printMode === 'thermal'
                      ? isAr
                        ? 'تم إرسال الفاتورة للطابعة الحرارية 80mm'
                        : 'Dispatched to 80mm thermal printer'
                      : isAr
                      ? 'تم إرسال السند للطابعة الكربونية النقطية'
                      : 'Dispatched to 2-ply carbon impact printer'
                  );
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                {isAr ? 'إعادة طباعة' : 'Reprint'}
              </button>
            </div>

            {/* Paper Receipt Preview */}
            <div
              className={`rounded-2xl border p-4 text-xs space-y-3 ${
                printMode === 'carbon'
                  ? 'bg-amber-50/70 border-amber-300/80 font-mono'
                  : 'bg-aura-bg border-aura-border'
              }`}
            >
              {printMode === 'carbon' && (
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-800 border-b border-amber-300/70 pb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {isAr ? 'نسخة المحاسبة الكربونية (2-Ply)' : '2-Ply Carbon Audit Copy'}
                  </span>
                  <span>ORIGINAL + YELLOW COPY</span>
                </div>
              )}

              <div className="text-center space-y-0.5 border-b border-dashed border-aura-border pb-3">
                <p className="font-serif text-base font-bold text-aura-text">
                  {isAr ? settings.company.nameAr : settings.company.nameEn}
                </p>
                <p className="text-[11px] text-aura-muted">
                  {isAr ? settings.company.branchNameAr : settings.company.branchNameEn}
                </p>
                <p className="text-[11px] text-aura-muted font-mono" dir="ltr">
                  VAT: {settings.company.vatNumber} · CR: {settings.company.crNumber}
                </p>
                <p className="mt-1 inline-block rounded-full bg-aura-surface border border-aura-border px-2.5 py-0.5 text-[10px] font-semibold">
                  {selected.status === 'voided'
                    ? isAr
                      ? 'إشعار دائن لفرع فاتورة ضريبية مبسطة'
                      : 'SIMPLIFIED CREDIT NOTE'
                    : isAr
                    ? 'فاتورة ضريبية مبسطة (ZATCA Phase 2)'
                    : 'SIMPLIFIED TAX INVOICE'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                <span className="text-aura-muted">{isAr ? 'رقم الفاتورة:' : 'Receipt No:'}</span>
                <span className="text-end font-mono font-semibold" dir="ltr">
                  {selected.receiptNo}
                </span>
                <span className="text-aura-muted">{isAr ? 'العميل:' : 'Client:'}</span>
                <span className="text-end font-medium">{selected.clientName}</span>
                <span className="text-aura-muted">{isAr ? 'الكاشير:' : 'Cashier:'}</span>
                <span className="text-end">
                  {CASHIERS.find((c) => c.id === selected.cashierId)?.name[lang] ?? selected.cashierId}
                </span>
              </div>

              {/* Line Items with Therapist Commission Attribution */}
              <div className="border-t border-b border-dashed border-aura-border py-2.5 space-y-2">
                {selected.items.map((item) => {
                  const th = THERAPISTS.find((x) => x.id === item.therapistId);
                  return (
                    <div key={item.id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-aura-text">
                          {isAr ? item.nameAr : item.nameEn}
                        </p>
                        <p className="text-[11px] text-aura-muted">
                          {isAr ? 'المعالجة:' : 'Therapist:'} {th ? th.name[lang] : '—'}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums">
                        {fmtMoney(item.lineTotalHalalas)} {cur}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                  <span className="tabular-nums">{fmtMoney(selected.subtotalHalalas)} {cur}</span>
                </div>
                {selected.discountHalalas > 0 && (
                  <div className="flex justify-between text-aura-success">
                    <span>
                      {isAr ? 'الخصم' : 'Discount'} {selected.discountCode ? `(${selected.discountCode})` : ''}
                    </span>
                    <span className="tabular-nums">-{fmtMoney(selected.discountHalalas)} {cur}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'شامل ضريبة القيمة المضافة 15%' : 'Includes 15% VAT'}</span>
                  <span className="tabular-nums">{fmtMoney(selected.vatHalalas)} {cur}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-aura-border">
                  <span>{isAr ? 'الإجمالي المستحق' : 'Grand Total'}</span>
                  <span className="tabular-nums">{fmtMoney(selected.grandTotalHalalas)} {cur}</span>
                </div>
              </div>

              {/* Tenders & Terminal RRN */}
              <div className="rounded-xl bg-aura-surface border border-aura-border p-2.5 space-y-1 text-[11px]">
                {selected.payments.map((p) => (
                  <div key={p.id} className="space-y-0.5">
                    <div className="flex justify-between font-medium">
                      <span>{isAr ? PAYMENT_LABEL[p.kind].ar : PAYMENT_LABEL[p.kind].en}</span>
                      <span className="tabular-nums">{fmtMoney(p.amountHalalas)} {cur}</span>
                    </div>
                    {(p.approvalCode || p.rrn) && (
                      <p className="text-[10px] font-mono text-aura-muted" dir="ltr">
                        Auth #{p.approvalCode} · RRN {p.rrn}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* ZATCA Phase 2 Cryptographic Stamp & TLV */}
              {tlvPayload && (
                <div className="pt-2 flex items-center gap-3 border-t border-dashed border-aura-border">
                  <div className="w-14 h-14 rounded-xl bg-white border border-aura-border grid place-items-center shrink-0">
                    <QrCode className="w-10 h-10 text-aura-text" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-[10px] font-semibold text-aura-text">
                      {isAr ? 'الختم التشفيري ZATCA TLV (Tags 1–9)' : 'ZATCA TLV Cryptographic Stamp'}
                    </p>
                    <p className="text-[10px] font-mono text-aura-muted truncate" dir="ltr">
                      UUID: {selected.zatcaUuid}
                    </p>
                    <p className="text-[10px] font-mono text-aura-muted truncate" dir="ltr">
                      TLV: {tlvPayload.base64}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Append-only Void / Credit Note action */}
            {selected.status === 'completed' ? (
              <button
                type="button"
                onClick={() => {
                  voidLedgerSale(
                    selected.id,
                    isAr ? 'إشعار دائن واسترجاع بناءً على طلب العميل' : 'Customer credit note refund'
                  );
                  notify(
                    isAr
                      ? `تم إصدار إشعار دائن وإلغاء الفاتورة ${selected.receiptNo}`
                      : `Issued credit note & voided ${selected.receiptNo}`
                  );
                }}
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full border border-aura-danger/40 text-aura-danger hover:bg-aura-danger-bg text-xs font-semibold transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                {isAr ? 'إصدار إشعار دائن / إلغاء الفاتورة (Void)' : 'Issue Credit Note / Void Invoice'}
              </button>
            ) : (
              <div className="rounded-2xl bg-aura-danger-bg border border-aura-danger/30 p-3 text-xs text-aura-danger">
                <p className="font-semibold">{isAr ? 'فاتورة ملغاة بإشعار دائن' : 'Voided via Credit Note'}</p>
                <p className="mt-0.5 opacity-90">{selected.voidReason}</p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
