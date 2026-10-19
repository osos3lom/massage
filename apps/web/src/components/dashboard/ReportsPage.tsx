'use client';

import { useMemo, useState } from 'react';
import {
  Award,
  ChartColumn,
  CheckCircle2,
  Download,
  Printer,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import {
  computeShiftSummary, fmtMoney, usePhase1Store, usePhase34Store, type PaymentKind,
} from '@/data/seedData';
import { fmtNumber } from './format';
import { useDashboard } from './useDashboard';

type ReportTab = 'vat' | 'commissions' | 'mix' | 'shifts';

export default function ReportsPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { sales, shifts } = usePhase1Store();
  const { therapists, commissionRules, packages } = usePhase34Store();

  const [tab, setTab] = useState<ReportTab>('vat');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const financialSummary = useMemo(() => {
    const completed = sales.filter((s) => s.status === 'completed');
    const voided = sales.filter((s) => s.status === 'voided');

    let grossSubtotal = 0;
    let totalDiscounts = 0;
    let totalVat = 0;
    let grandTotal = 0;

    const tenders: Record<PaymentKind, number> = {
      cash: 0,
      card: 0,
      wallet: 0,
      transfer: 0,
      package: 0,
    };

    for (const s of completed) {
      grossSubtotal += s.subtotalHalalas;
      totalDiscounts += s.discountHalalas;
      totalVat += s.vatHalalas;
      grandTotal += s.grandTotalHalalas;
      let changeLeft = s.changeHalalas;
      for (const p of s.payments) {
        if (p.kind === 'cash' && changeLeft > 0) {
          tenders.cash += Math.max(0, p.amountHalalas - changeLeft);
          changeLeft = 0;
        } else {
          tenders[p.kind] += p.amountHalalas;
        }
      }
    }

    const netBeforeVat = grandTotal - totalVat;
    return {
      invoiceCount: completed.length,
      voidedCount: voided.length,
      grossSubtotal,
      totalDiscounts,
      netBeforeVat,
      totalVat,
      grandTotal,
      tenders,
    };
  }, [sales]);

  const therapistPayroll = useMemo(() => {
    return therapists.map((th) => {
      const rule = commissionRules.find((r) => r.id === th.commissionRuleId);
      const commissionSar =
        rule?.kind === 'percent'
          ? Math.round((th.revenueMonthSar * rule.value) / 100)
          : th.completedSessionsMonth * (rule?.value ?? 40);
      const netMarginSar = th.revenueMonthSar - commissionSar;
      return {
        ...th,
        ruleName: rule ? (isAr ? rule.nameAr : rule.nameEn) : '20%',
        commissionSar,
        netMarginSar,
      };
    });
  }, [therapists, commissionRules, isAr]);

  const handleExportCsv = () => {
    const rows = [
      ['Receipt No', 'Date ISO', 'Client', 'Status', 'ZATCA Status', 'Net Before VAT (SAR)', 'VAT 15% (SAR)', 'Grand Total (SAR)'],
      ...sales.map((s) => [
        s.receiptNo,
        s.createdAtIso,
        s.clientName,
        s.status,
        s.zatcaStatus,
        fmtMoney(s.grandTotalHalalas - s.vatHalalas),
        fmtMoney(s.vatHalalas),
        fmtMoney(s.grandTotalHalalas),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis-zatca-tax-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(isAr ? 'تم تصدير التقرير الضريبي بصيغة CSV' : 'Exported ZATCA tax report as CSV');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <ChartColumn className="w-3.5 h-3.5" />
            {isAr ? 'التقارير المالية والضريبية والعمولات · المرحلة 4' : 'Financial, VAT & Commission Reports · Phase 4'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'التقارير ومؤشرات الأداء' : 'Executive Reports & Analytics'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'إقرارات ضريبة القيمة المضافة 15% (ZATCA)، مسير عمولات المعالجات، تحليل أداء الخدمات، ومراجعة تقارير Z.'
              : 'KSA 15% VAT tax return summaries, therapist commission payroll runs, service mix analysis, and Z-report audits.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-aura-surface border border-aura-border text-xs font-semibold hover:border-aura-accent/50 transition-colors"
          >
            <Download className="w-4 h-4 text-aura-accent" />
            {isAr ? 'تصدير CSV للمحاسب' : 'Export Accountant CSV'}
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
              notify(isAr ? 'تم تجهيز التقرير للطباعة' : 'Report sent to print dialog');
            }}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            {isAr ? 'طباعة التقرير' : 'Print Report'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl bg-aura-success-bg border border-aura-success/30 px-4 py-3 text-sm text-aura-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'صافي المبيعات قبل الضريبة' : 'Taxable Sales (Excl. VAT)'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtMoney(financialSummary.netBeforeVat)}{' '}
            <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">
            {financialSummary.invoiceCount} {isAr ? 'فاتورة ضريبية' : 'tax invoices'}
          </p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'ضريبة القيمة المضافة المستحقة 15%' : 'Output VAT 15% Payable'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-accent">
            {fmtMoney(financialSummary.totalVat)}{' '}
            <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'إقرار هيئة الزكاة والضريبة ZATCA' : 'ZATCA VAT return box'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'الإجمالي الشامل المحصل' : 'Gross Collected (Incl. VAT)'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-success">
            {fmtMoney(financialSummary.grandTotal)}{' '}
            <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">
            {isAr ? `بعد خصم ${fmtMoney(financialSummary.totalDiscounts)} ${cur}` : `After ${fmtMoney(financialSummary.totalDiscounts)} ${cur} discounts`}
          </p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'مسير عمولات المعالجات (الشهر)' : 'Monthly Commission Payroll'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtNumber(
              therapistPayroll.reduce((s, r) => s + r.commissionSar, 0),
              lang
            )}{' '}
            <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">
            {therapistPayroll.length} {isAr ? 'معالجات نشطات' : 'active therapists'}
          </p>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'vat', ar: 'الإقرار الضريبي والمقبوضات (ZATCA)', en: 'VAT Return & Tenders (ZATCA)' },
            { key: 'commissions', ar: 'مسير عمولات المعالجات', en: 'Therapist Commissions Payroll' },
            { key: 'mix', ar: 'تحليل أداء الخدمات والباقات', en: 'Service & Package Mix' },
            { key: 'shifts', ar: 'سجل مطابقة تقارير Z', en: 'Shift Z-Report Audit' },
          ] as const
        ).map((tItem) => (
          <button
            key={tItem.key}
            type="button"
            onClick={() => setTab(tItem.key)}
            className={`h-10 px-4 rounded-full text-sm font-medium transition-colors ${
              tab === tItem.key
                ? 'bg-aura-text text-white'
                : 'bg-aura-surface border border-aura-border text-aura-text hover:border-aura-accent/40'
            }`}
          >
            {isAr ? tItem.ar : tItem.en}
          </button>
        ))}
      </div>

      {/* Tab 1: VAT & Tenders */}
      {tab === 'vat' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="rounded-3xl bg-aura-surface border border-aura-border p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">
                {isAr ? 'ملخص الإقرار الضريبي — ضريبة القيمة المضافة 15%' : 'KSA 15% VAT Tax Return Summary'}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-aura-success-bg text-aura-success px-2.5 py-0.5 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                ZATCA Phase 2
              </span>
            </div>

            <div className="divide-y divide-aura-border text-sm">
              <div className="py-3 flex justify-between">
                <span className="text-aura-muted">{isAr ? 'إجمالي المبيعات قبل الخصم' : 'Gross Sales (Before Discount)'}</span>
                <span className="font-mono font-semibold">{fmtMoney(financialSummary.grossSubtotal)} {cur}</span>
              </div>
              <div className="py-3 flex justify-between text-aura-success">
                <span>{isAr ? 'إجمالي الخصومات والعروض الممنوحة' : 'Less: Promotional Discounts'}</span>
                <span className="font-mono font-semibold">-{fmtMoney(financialSummary.totalDiscounts)} {cur}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-aura-muted">{isAr ? 'الوعاء الضريبي الخاضع للنسبة الأساسية (15%)' : 'Net Taxable Amount (Excl. 15% VAT)'}</span>
                <span className="font-mono font-semibold">{fmtMoney(financialSummary.netBeforeVat)} {cur}</span>
              </div>
              <div className="py-3 flex justify-between text-aura-accent font-semibold">
                <span>{isAr ? 'ضريبة المخرجات المستحقة (15%)' : 'Output VAT Collected (15%)'}</span>
                <span className="font-mono">{fmtMoney(financialSummary.totalVat)} {cur}</span>
              </div>
              <div className="py-3 flex justify-between text-base font-bold">
                <span>{isAr ? 'صافي المبيعات الشاملة للضريبة' : 'Total Sales Including VAT'}</span>
                <span className="font-mono">{fmtMoney(financialSummary.grandTotal)} {cur}</span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-aura-surface border border-aura-border p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-lg">
              {isAr ? 'توزيع المقبوضات حسب وسيلة الدفع' : 'Collections by Payment Tender'}
            </h2>

            <div className="space-y-3.5">
              {(
                [
                  { kind: 'card' as const, ar: 'الشبكة اللاتلامسية (مدى أثير / فيزا)', en: 'Contactless Card (mada / Visa)' },
                  { kind: 'cash' as const, ar: 'النقدية بالصندوق (Cash)', en: 'Cash Drawer' },
                  { kind: 'wallet' as const, ar: 'المحافظ الرقمية (Apple Pay / STC Pay)', en: 'Digital Wallets (Apple Pay / STC Pay)' },
                  { kind: 'transfer' as const, ar: 'التحويلات البنكية (سريع)', en: 'Bank Transfers' },
                ]
              ).map((row) => {
                const amt = financialSummary.tenders[row.kind];
                const pct =
                  financialSummary.grandTotal > 0
                    ? Math.round((amt / financialSummary.grandTotal) * 100)
                    : 0;
                return (
                  <div key={row.kind} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-aura-text">{isAr ? row.ar : row.en}</span>
                      <span className="tabular-nums font-semibold">
                        {fmtMoney(amt)} {cur} <span className="text-xs text-aura-muted">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-aura-bg overflow-hidden">
                      <div
                        className="h-full rounded-full bg-aura-accent transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Therapist Commissions Payroll */}
      {tab === 'commissions' && (
        <section className="rounded-3xl bg-aura-surface border border-aura-border overflow-hidden">
          <div className="px-5 py-4 border-b border-aura-border flex items-center justify-between">
            <h2 className="font-serif text-lg">
              {isAr ? 'مسير عمولات المعالجات الشهري' : 'Monthly Therapist Commission Payroll'}
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-aura-muted">
              <Award className="w-4 h-4 text-aura-accent" />
              {isAr ? 'يُحتسب تلقائياً من بنود الفواتير المكتملة' : 'Computed from completed sale_items'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border bg-aura-bg/60 text-xs text-aura-muted">
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'المعالجة' : 'Therapist'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'قاعدة العمولة' : 'Commission Rule'}</th>
                  <th className="text-center font-medium py-3.5 px-4">{isAr ? 'الجلسات المنفذة' : 'Completed Sessions'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'إيراد الجلسات' : 'Gross Revenue'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'العمولة المستحقة' : 'Commission Payable'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'صافي مساهمة المركز' : 'Net Center Margin'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border">
                {therapistPayroll.map((row) => (
                  <tr key={row.id} className="hover:bg-aura-bg/50">
                    <td className="py-3.5 px-4 font-medium text-aura-text">
                      {isAr ? row.nameAr : row.nameEn}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-aura-muted">{row.ruleName}</td>
                    <td className="py-3.5 px-4 text-center tabular-nums font-medium">
                      {row.completedSessionsMonth}
                    </td>
                    <td className="py-3.5 px-4 text-end tabular-nums">
                      {fmtNumber(row.revenueMonthSar, lang)} {cur}
                    </td>
                    <td className="py-3.5 px-4 text-end tabular-nums font-semibold text-aura-accent">
                      {fmtNumber(row.commissionSar, lang)} {cur}
                    </td>
                    <td className="py-3.5 px-4 text-end tabular-nums font-semibold text-aura-success">
                      {fmtNumber(row.netMarginSar, lang)} {cur}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: Service & Package Mix */}
      {tab === 'mix' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section className="rounded-3xl bg-aura-surface border border-aura-border p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-lg">
              {isAr ? 'الإيرادات حسب القسم العلاجي' : 'Revenue by Service Category'}
            </h2>
            <div className="space-y-4">
              {[
                { ar: 'جلسات المساج الاسترخائي والعلاجي', en: 'Relaxing & Therapeutic Massage', rev: 58400, pct: 46 },
                { ar: 'الحمام المغربي الملكي والتقليدي', en: 'Traditional & Royal Moroccan Hammam', rev: 34200, pct: 27 },
                { ar: 'الباقات المشتركة وبطاقات العضوية', en: 'Packages & VIP Memberships', rev: 21500, pct: 17 },
                { ar: 'البديكير والعناية بالقدمين', en: 'Spa Pedicure & Foot Reflexology', rev: 13100, pct: 10 },
              ].map((c, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-aura-text">{isAr ? c.ar : c.en}</span>
                    <span className="tabular-nums font-semibold">
                      {fmtNumber(c.rev, lang)} {cur} ({c.pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-aura-bg overflow-hidden">
                    <div className="h-full rounded-full bg-aura-accent" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-aura-surface border border-aura-border p-5 sm:p-6 space-y-4">
            <h2 className="font-serif text-lg">
              {isAr ? 'أعلى الباقات مبيعاً' : 'Top-Selling Packages'}
            </h2>
            <div className="space-y-3">
              {packages.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl bg-aura-bg border border-aura-border p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-aura-primary text-aura-accent font-bold text-xs grid place-items-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-aura-text">{isAr ? p.nameAr : p.nameEn}</p>
                      <p className="text-xs text-aura-muted">
                        {p.totalSessions} {isAr ? 'جلسات' : 'sessions'} · {p.priceSar} {cur}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-aura-success" />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Tab 4: Shift Z-Reports Audit */}
      {tab === 'shifts' && (
        <section className="rounded-3xl bg-aura-surface border border-aura-border overflow-hidden">
          <div className="px-5 py-4 border-b border-aura-border flex items-center justify-between">
            <h2 className="font-serif text-lg">
              {isAr ? 'سجل المراجعة المحاسبية لتقارير Z' : 'Accountant Z-Report Reconciliation Log'}
            </h2>
            <ReceiptText className="w-4 h-4 text-aura-accent" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border bg-aura-bg/60 text-xs text-aura-muted">
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'رقم الوردية' : 'Shift ID'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'ملاحظات المطابقة' : 'Audit Notes'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'إجمالي المبيعات' : 'Total Sales'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'النقد المتوقع' : 'Expected Cash'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'الفرق' : 'Variance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border">
                {shifts.map((sh) => {
                  const sum = computeShiftSummary(sh, sales);
                  return (
                    <tr key={sh.id} className="hover:bg-aura-bg/50">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold" dir="ltr">
                        {sh.id}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-aura-muted">{sh.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-end tabular-nums font-medium">
                        {fmtMoney(sum.totalNet)} {cur}
                      </td>
                      <td className="py-3.5 px-4 text-end tabular-nums">
                        {fmtMoney(sum.expectedCashHalalas)} {cur}
                      </td>
                      <td className="py-3.5 px-4 text-end tabular-nums font-semibold">
                        <span className={sum.varianceHalalas === 0 ? 'text-aura-success' : 'text-aura-warning'}>
                          {sum.varianceHalalas > 0 ? '+' : ''}
                          {fmtMoney(sum.varianceHalalas)} {cur}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
