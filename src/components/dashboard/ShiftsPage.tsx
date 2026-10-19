'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Lock,
  Play,
  Printer,
  Terminal,
  Wallet,
  X,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import { CASHIERS, fmtMoney, toHalalas } from '@/data/posData';
import { computeShiftSummary, usePhase1Store } from '@/data/phase1Store';
import { useSettingsStore } from '@/data/settingsStore';
import { fmtDate } from './format';
import { useDashboard } from './useDashboard';

export default function ShiftsPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { shifts, sales, openNewShift, closeActiveShift, addShiftCashDrop } = usePhase1Store();
  const { settings } = useSettingsStore();

  const cashierOptions = useMemo(() => {
    if (settings.staff.length > 0) {
      return settings.staff.map((s) => ({
        id: s.id,
        name: { en: s.fullNameEn, ar: s.fullNameAr },
      }));
    }
    return CASHIERS;
  }, [settings.staff]);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(shifts[0]?.id ?? null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [blindCountInput, setBlindCountInput] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [newCashierId, setNewCashierId] = useState(cashierOptions[0]?.id ?? 'setup-admin');
  const [newFloatSar, setNewFloatSar] = useState('500');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const openShift = useMemo(() => shifts.find((s) => s.status === 'open') ?? null, [shifts]);
  const selectedShift = useMemo(
    () => shifts.find((s) => s.id === selectedShiftId) ?? shifts[0] ?? null,
    [shifts, selectedShiftId]
  );

  const selectedSummary = useMemo(
    () => (selectedShift ? computeShiftSummary(selectedShift, sales) : null),
    [selectedShift, sales]
  );

  const openShiftSummary = useMemo(
    () => (openShift ? computeShiftSummary(openShift, sales) : null),
    [openShift, sales]
  );

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openShift || !openShiftSummary) return;
    const countedHalalas = blindCountInput.trim()
      ? toHalalas(Number(blindCountInput))
      : openShiftSummary.expectedCashHalalas;
    closeActiveShift(openShift.id, openShift.openedBy, countedHalalas, closeNotes.trim() || undefined);
    setShowCloseModal(false);
    setBlindCountInput('');
    setCloseNotes('');
    notify(isAr ? 'تم إغلاق الوردية وإصدار تقرير Z بنجاح' : 'Shift closed & Z-report generated');
  };

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openNewShift(newCashierId, toHalalas(Number(newFloatSar) || 500));
    setShowOpenModal(false);
    notify(isAr ? 'تم فتح وردية صندوق جديدة' : 'New cash drawer shift opened');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <Wallet className="w-3.5 h-3.5" />
            {isAr ? 'الورديات وعهدة الصندوق وتقارير Z · المرحلة 1' : 'Shifts, Cash Custody & Z-Reports · Phase 1'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'الورديات ومطابقة الصندوق' : 'Shifts & Cash Drawer Reconciliation'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'متابعة عهدة الصندوق النقدية، الجرد الأعمى (Blind Count) عند إغلاق اليوم، وتقارير Z الضريبية.'
              : 'Track cash drawer custody, opening floats, blind cash counts at shift close, and Z-reports.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {openShift ? (
            <>
              <button
                type="button"
                onClick={() => {
                  addShiftCashDrop(openShift.id, 200_00);
                  notify(isAr ? 'تم تسجيل إيداع خزنة (سحب 200 ر.س من الدرج)' : 'Recorded 200 SAR cash drop to safe');
                }}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-aura-surface border border-aura-border text-xs font-semibold hover:border-aura-accent/50 transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4 text-aura-accent" />
                {isAr ? 'توريد للخزنة (-200 ر.س)' : 'Safe Cash Drop (-200 SAR)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (openShiftSummary) {
                    setBlindCountInput((openShiftSummary.expectedCashHalalas / 100).toFixed(2));
                  }
                  setShowCloseModal(true);
                }}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
              >
                <Lock className="w-4 h-4" />
                {isAr ? 'إغلاق الوردية (تقرير Z)' : 'Close Shift (Z-Report)'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowOpenModal(true)}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              {isAr ? 'فتح وردية جديدة' : 'Open New Shift'}
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl bg-aura-success-bg border border-aura-success/30 px-4 py-3 text-sm text-aura-success">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Active Shift Custody Banner */}
      {openShift && openShiftSummary && (
        <section className="rounded-3xl bg-aura-surface border-2 border-aura-accent/35 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-aura-primary text-aura-accent grid place-items-center">
                <Terminal className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-success-bg text-aura-success px-2.5 py-0.5 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-aura-success animate-pulse" />
                    {isAr ? 'وردية مفتوحة الآن' : 'Active Shift Open'}
                  </span>
                  <span className="text-xs font-mono text-aura-muted" dir="ltr">
                    {openShift.branchCode} · {openShift.terminalId}
                  </span>
                </div>
                <h2 className="font-serif text-xl text-aura-text mt-1">
                  {isAr ? 'الكاشير المسؤول:' : 'Cashier on Duty:'}{' '}
                  {CASHIERS.find((c) => c.id === openShift.openedBy)?.name[lang] ?? openShift.openedBy}
                </h2>
              </div>
            </div>

            <div className="text-end">
              <p className="text-xs text-aura-muted">{isAr ? 'النقد المتوقع في الدرج الآن' : 'Expected Cash in Drawer'}</p>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-aura-accent tabular-nums">
                {fmtMoney(openShiftSummary.expectedCashHalalas)}{' '}
                <span className="text-sm font-sans text-aura-muted">{cur}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5">
              <p className="text-xs text-aura-muted">{isAr ? 'رصيد افتتاح الدرج' : 'Opening Float'}</p>
              <p className="font-serif text-lg font-semibold mt-1 tabular-nums">
                {fmtMoney(openShift.openingFloatHalalas)} {cur}
              </p>
            </div>
            <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5">
              <p className="text-xs text-aura-muted">{isAr ? 'مبيعات نقدية صافية' : 'Net Cash Sales'}</p>
              <p className="font-serif text-lg font-semibold mt-1 tabular-nums text-aura-success">
                +{fmtMoney(openShiftSummary.byMethod.cash)} {cur}
              </p>
            </div>
            <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5">
              <p className="text-xs text-aura-muted">{isAr ? 'مبيعات الشبكة والمحافظ' : 'Card & Wallets'}</p>
              <p className="font-serif text-lg font-semibold mt-1 tabular-nums">
                {fmtMoney(openShiftSummary.byMethod.card + openShiftSummary.byMethod.wallet)} {cur}
              </p>
            </div>
            <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5">
              <p className="text-xs text-aura-muted">{isAr ? 'توريد للخزنة' : 'Safe Cash Drops'}</p>
              <p className="font-serif text-lg font-semibold mt-1 tabular-nums">
                -{fmtMoney(openShift.cashDropsHalalas)} {cur}
              </p>
            </div>
            <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5">
              <p className="text-xs text-aura-muted">{isAr ? 'إجمالي مبيعات الوردية' : 'Total Shift Revenue'}</p>
              <p className="font-serif text-lg font-semibold mt-1 tabular-nums">
                {fmtMoney(openShiftSummary.totalNet)} {cur}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Shifts History & Z-Report Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_24rem] gap-5 items-start">
        <div className="rounded-3xl bg-aura-surface border border-aura-border overflow-hidden">
          <div className="px-5 py-4 border-b border-aura-border">
            <h2 className="font-serif text-lg">{isAr ? 'سجل الورديات وتقارير Z' : 'Shift History & Z-Reports'}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border bg-aura-bg/60 text-xs text-aura-muted">
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'الوردية والكاشير' : 'Shift & Cashier'}</th>
                  <th className="text-start font-medium py-3.5 px-4">{isAr ? 'التوقيت' : 'Opened / Closed'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'النقد المتوقع' : 'Expected Cash'}</th>
                  <th className="text-end font-medium py-3.5 px-4">{isAr ? 'الجرد الفعلي' : 'Counted Cash'}</th>
                  <th className="text-center font-medium py-3.5 px-4">{isAr ? 'الفرق (Variance)' : 'Variance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aura-border">
                {shifts.map((sh) => {
                  const summary = computeShiftSummary(sh, sales);
                  const cashierName = CASHIERS.find((c) => c.id === sh.openedBy)?.name[lang] ?? sh.openedBy;
                  const isSelected = selectedShift?.id === sh.id;
                  const openedDate = new Date(sh.openedAtIso);

                  return (
                    <tr
                      key={sh.id}
                      onClick={() => setSelectedShiftId(sh.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-aura-primary/45' : 'hover:bg-aura-bg/60'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-aura-text">{cashierName}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              sh.status === 'open'
                                ? 'bg-aura-success-bg text-aura-success'
                                : 'bg-aura-bg text-aura-muted border border-aura-border'
                            }`}
                          >
                            {sh.status === 'open' ? (isAr ? 'مفتوحة' : 'Open') : isAr ? 'مغلقة Z' : 'Closed Z'}
                          </span>
                        </div>
                        <p className="text-xs text-aura-muted mt-0.5">{sh.notes || '—'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-aura-muted tabular-nums">
                        <p>{fmtDate(openedDate, lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {sh.closedAtIso && (
                          <p>
                            → {fmtDate(new Date(sh.closedAtIso), lang, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-end tabular-nums font-medium">
                        {fmtMoney(summary.expectedCashHalalas)} {cur}
                      </td>
                      <td className="py-3.5 px-4 text-end tabular-nums font-semibold">
                        {sh.status === 'open'
                          ? '—'
                          : `${fmtMoney(summary.countedHalalas)} ${cur}`}
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums">
                        {sh.status === 'open' ? (
                          <span className="text-xs text-aura-muted">{isAr ? 'قيد العمل' : 'In progress'}</span>
                        ) : summary.varianceHalalas === 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-success-bg text-aura-success px-2.5 py-0.5 text-xs font-medium">
                            {isAr ? 'مطابق 0.00' : 'Exact 0.00'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-warning-bg text-aura-warning px-2.5 py-0.5 text-xs font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            {summary.varianceHalalas > 0 ? '+' : ''}
                            {fmtMoney(summary.varianceHalalas)} {cur}
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

        {/* Printable 80mm Z-Report Card */}
        {selectedShift && selectedSummary && (
          <aside className="rounded-3xl bg-aura-surface border border-aura-border p-5 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg">{isAr ? 'تقرير إغلاق الوردية (Z-Report)' : 'Shift Z-Report'}</h3>
                <p className="text-xs text-aura-muted font-mono" dir="ltr">
                  {selectedShift.branchCode} · {selectedShift.terminalId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  notify(isAr ? 'تم إرسال تقرير Z للطابعة الحرارية 80mm' : 'Z-Report sent to 80mm printer');
                }}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-aura-bg border border-aura-border text-xs font-semibold hover:border-aura-accent/50"
              >
                <Printer className="w-3.5 h-3.5 text-aura-accent" />
                {isAr ? 'طباعة Z' : 'Print Z'}
              </button>
            </div>

            <div className="rounded-2xl bg-aura-bg border border-aura-border p-4 text-xs space-y-3 font-mono">
              <div className="text-center border-b border-dashed border-aura-border pb-2.5">
                <p className="font-serif font-bold text-sm text-aura-text">
                  {isAr ? 'تقرير إغلاق الصندوق اليومي (Z)' : 'END-OF-SHIFT Z-REPORT'}
                </p>
                <p className="text-[11px] text-aura-muted mt-0.5">
                  {CASHIERS.find((c) => c.id === selectedShift.openedBy)?.name[lang]}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'عدد الفواتير المكتملة' : 'Completed Tickets'}</span>
                  <span>{selectedSummary.ticketCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'فواتير ملغاة (Void)' : 'Voided Tickets'}</span>
                  <span>{selectedSummary.voidedCount}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-aura-border py-2.5 space-y-1">
                <p className="font-sans font-semibold text-aura-text mb-1">
                  {isAr ? 'تفصيل المقبوضات حسب وسيلة الدفع' : 'Takings by Tender'}
                </p>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'نقدي صافي (Cash)' : 'Net Cash'}</span>
                  <span>{fmtMoney(selectedSummary.byMethod.cash)} {cur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'شبكة مدى / فيزا' : 'Card (mada/Visa)'}</span>
                  <span>{fmtMoney(selectedSummary.byMethod.card)} {cur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'محافظ (Apple/STC Pay)' : 'Digital Wallets'}</span>
                  <span>{fmtMoney(selectedSummary.byMethod.wallet)} {cur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                  <span>{fmtMoney(selectedSummary.byMethod.transfer)} {cur}</span>
                </div>
                <div className="flex justify-between font-bold text-aura-text pt-1 border-t border-aura-border">
                  <span>{isAr ? 'إجمالي المبيعات (شامل ضريبة 15%)' : 'Net Sales (incl. VAT)'}</span>
                  <span>{fmtMoney(selectedSummary.totalNet)} {cur}</span>
                </div>
                <div className="flex justify-between text-[11px] text-aura-muted">
                  <span>{isAr ? 'منها ضريبة القيمة المضافة 15%' : 'Included 15% VAT'}</span>
                  <span>{fmtMoney(selectedSummary.totalVat)} {cur}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-sans font-semibold text-aura-text mb-1">
                  {isAr ? 'مطابقة درج النقدية (Cash Custody)' : 'Cash Drawer Reconciliation'}
                </p>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'رصيد الافتتاح (Float)' : 'Opening Float'}</span>
                  <span>{fmtMoney(selectedShift.openingFloatHalalas)} {cur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? '+ صافي المبيعات النقدية' : '+ Net Cash Sales'}</span>
                  <span>{fmtMoney(selectedSummary.byMethod.cash)} {cur}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? '- توريد للخزنة' : '- Safe Cash Drops'}</span>
                  <span>{fmtMoney(selectedShift.cashDropsHalalas)} {cur}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-aura-border">
                  <span>{isAr ? 'النقد المتوقع بالدرج' : 'Expected in Drawer'}</span>
                  <span>{fmtMoney(selectedSummary.expectedCashHalalas)} {cur}</span>
                </div>
                {selectedShift.status === 'closed' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-aura-muted">{isAr ? 'الجرد الفعلي (Blind Count)' : 'Counted Cash'}</span>
                      <span>{fmtMoney(selectedSummary.countedHalalas)} {cur}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>{isAr ? 'الفرق (الزيادة / العجز)' : 'Variance'}</span>
                      <span
                        className={
                          selectedSummary.varianceHalalas === 0 ? 'text-aura-success' : 'text-aura-warning'
                        }
                      >
                        {selectedSummary.varianceHalalas > 0 ? '+' : ''}
                        {fmtMoney(selectedSummary.varianceHalalas)} {cur}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Blind Count Close Shift Modal */}
      {showCloseModal && openShift && openShiftSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">
                {isAr ? 'إغلاق الوردية والجرد الأعمى للنقدية' : 'Close Shift & Blind Cash Count'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'رصيد افتتاح الدرج:' : 'Opening Float:'}</span>
                  <span className="font-mono font-semibold">
                    {fmtMoney(openShift.openingFloatHalalas)} {cur}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aura-muted">{isAr ? 'النقد المتوقع في الدرج:' : 'Expected Cash:'}</span>
                  <span className="font-mono font-semibold text-aura-accent">
                    {fmtMoney(openShiftSummary.expectedCashHalalas)} {cur}
                  </span>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'المبلغ النقدي المعدود فعلياً في الدرج (ر.س)' : 'Actual Counted Cash in Drawer (SAR)'}
                </span>
                <input
                  required
                  type="number"
                  step="0.01"
                  dir="ltr"
                  value={blindCountInput}
                  onChange={(e) => setBlindCountInput(e.target.value)}
                  className="w-full h-11 rounded-xl bg-aura-bg border border-aura-border px-3 text-base font-mono font-semibold"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'ملاحظات إغلاق الوردية' : 'Closing Notes'}
                </span>
                <input
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder={isAr ? 'مثال: تمت المطابقة بنجاح...' : 'e.g. Reconciled with no discrepancy...'}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="h-10 px-4 rounded-full border border-aura-border text-sm"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium"
                >
                  {isAr ? 'اعتماد الإغلاق وطباعة Z' : 'Confirm Close & Print Z'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">
                {isAr ? 'فتح وردية صندوق جديدة' : 'Open New Cash Shift'}
              </h2>
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'الكاشير المستلم للعهدة' : 'Cashier Receiving Custody'}
                </span>
                <select
                  value={newCashierId}
                  onChange={(e) => setNewCashierId(e.target.value)}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                >
                  {cashierOptions.length === 0 ? (
                    <option value="setup-admin">
                      {isAr ? 'مدير الإعداد الأولي' : 'Setup Admin'}
                    </option>
                  ) : (
                    cashierOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name[lang]}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">
                  {isAr ? 'رصيد الفكة الافتتاحي (ر.س)' : 'Opening Cash Float (SAR)'}
                </span>
                <input
                  required
                  type="number"
                  min={0}
                  step={50}
                  value={newFloatSar}
                  onChange={(e) => setNewFloatSar(e.target.value)}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm font-mono"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="h-10 px-4 rounded-full border border-aura-border text-sm"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium"
                >
                  {isAr ? 'فتح الوردية الآن' : 'Open Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
