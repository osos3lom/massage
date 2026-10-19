'use client';

import { useMemo, useState } from 'react';
import { Banknote, CreditCard, Landmark, PackageCheck, Printer, Smartphone, Trash2, type LucideIcon } from 'lucide-react';
import {
  BOOKABLE_IDS, CASHIERS, PAYMENT_KINDS, bookableInfo, encodeZatcaTlvPreview, fmtMoney, toHalalas,
  usePhase34Store, useSettingsStore,
  type BookableId, type CompletedSale, type Payment, type PaymentKind,
} from '@/data/seedData';
import { fmtDate } from '@/components/dashboard/format';
import Modal from './Modal';
import { usePos } from './usePos';

export const METHOD_ICON: Record<PaymentKind, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  wallet: Smartphone,
  transfer: Landmark,
  package: PackageCheck,
};

const CASH_NOTES = [50_00, 100_00, 200_00, 500_00];

function ZatcaReceiptQrSvg({ seed }: { seed: string }) {
  const cells = useMemo(() => {
    const size = 21;
    const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = border || inner;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder =
          (r < 8 && c < 8) ||
          (r < 8 && c >= size - 8) ||
          (r >= size - 8 && c < 8);
        if (inFinder) continue;
        h ^= (r * 31 + c * 17) & 0xff;
        h = Math.imul(h, 16777619);
        grid[r][c] = (h >>> 3) % 2 === 0;
      }
    }
    return grid;
  }, [seed]);

  return (
    <svg viewBox="0 0 21 21" className="w-24 h-24 rounded-xl bg-white p-1.5 border border-aura-border" aria-label="ZATCA TLV QR">
      {cells.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1f1b18" /> : null
        )
      )}
    </svg>
  );
}

export function PayDialog({
  due, onCancel, onComplete,
}: {
  due: number;
  onCancel: () => void;
  onComplete: (payments: Payment[], change: number) => void;
}) {
  const { lang, p, money } = usePos();
  const { packageSessions } = usePhase34Store();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kind, setKind] = useState<PaymentKind>('card');
  const paid = payments.reduce((s, x) => s + x.amount, 0);
  const remaining = Math.max(0, due - paid);
  const change = Math.max(0, paid - due);
  const [input, setInput] = useState(fmtMoney(due));

  const redeemableSessions = useMemo(
    () => packageSessions.filter((ps) => ps.usedQty < ps.totalQty),
    [packageSessions]
  );
  const [selectedPkgSessionId, setSelectedPkgSessionId] = useState<string>(redeemableSessions[0]?.id ?? '');

  const add = (amount: number, method: PaymentKind = kind, packageSessionId?: string) => {
    if (amount <= 0 || remaining <= 0) return;
    // Only cash can be over-tendered (and returns change); card/wallet/transfer/package are capped
    const value = method === 'cash' ? amount : Math.min(amount, remaining);
    const next = [...payments, { kind: method, amount: value, packageSessionId }];
    setPayments(next);
    const left = Math.max(0, due - next.reduce((s, x) => s + x.amount, 0));
    setInput(fmtMoney(left));
  };

  return (
    <Modal title={p.pay.title} onClose={onCancel}>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-aura-bg p-3">
          <p className="text-xs text-aura-muted">{p.pay.due}</p>
          <p className="text-xl font-semibold tabular-nums">{money(due)}</p>
        </div>
        <div className={`rounded-2xl p-3 ${change > 0 ? 'bg-aura-success-bg text-aura-success' : 'bg-aura-primary'}`}>
          <p className="text-xs opacity-80">{change > 0 ? p.pay.change : p.pay.remaining}</p>
          <p className="text-xl font-semibold tabular-nums">{money(change > 0 ? change : remaining)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PAYMENT_KINDS.map((k) => {
          const Icon = METHOD_ICON[k];
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={`flex items-center gap-2 h-14 px-3 rounded-2xl border text-sm text-start transition-colors ${
                kind === k ? 'border-aura-accent bg-aura-primary font-semibold' : 'border-aura-border hover:bg-aura-bg'
              }`}
            >
              <Icon className="w-5 h-5 text-aura-accent shrink-0" />
              <span className="truncate">{p.pay.methods[k]}</span>
            </button>
          );
        })}
      </div>

      {remaining > 0 && (
        <div className="mt-4">
          {kind === 'package' ? (
            <div className="rounded-2xl border border-aura-border bg-aura-bg p-3 space-y-2.5">
              <label htmlFor="pkg-session-select" className="block text-xs font-medium text-aura-muted">
                {p.pay.selectPackageSession}
              </label>
              {redeemableSessions.length === 0 ? (
                <p className="text-xs text-aura-muted">{p.pay.noActivePackages}</p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    id="pkg-session-select"
                    value={selectedPkgSessionId}
                    onChange={(e) => setSelectedPkgSessionId(e.target.value)}
                    className="flex-1 h-11 rounded-xl border border-aura-border bg-aura-surface px-3 text-xs"
                  >
                    {redeemableSessions.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {(lang === 'ar' ? ps.clientNameAr : ps.clientNameEn)} — {(lang === 'ar' ? ps.packageNameAr : ps.packageNameEn)} ({ps.totalQty - ps.usedQty}/{ps.totalQty})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => add(toHalalas(Number(input) || 0) || remaining, 'package', selectedPkgSessionId)}
                    className="h-11 px-4 rounded-xl bg-aura-accent text-white text-xs font-semibold hover:bg-aura-accent-hover shrink-0"
                  >
                    {p.pay.redeemSession}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <label htmlFor="pay-amount" className="block text-xs font-medium text-aura-muted mb-1.5">{p.pay.amount}</label>
              <div className="flex gap-2">
                <input
                  id="pay-amount"
                  inputMode="decimal"
                  dir="ltr"
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/[^\d.]/g, ''))}
                  className="flex-1 h-12 rounded-2xl border border-aura-border bg-aura-bg px-4 text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
                />
                <button
                  type="button"
                  onClick={() => add(toHalalas(Number(input) || 0))}
                  className="h-12 px-5 rounded-2xl bg-aura-text text-white text-sm font-medium hover:opacity-90"
                >
                  {p.pay.add}
                </button>
              </div>
              {kind === 'cash' ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => add(remaining, 'cash')} className="h-10 px-3 rounded-full border border-aura-border text-sm hover:bg-aura-bg">
                    {p.pay.exact}
                  </button>
                  {CASH_NOTES.filter((n) => n >= remaining).slice(0, 3).map((n) => (
                    <button key={n} type="button" onClick={() => add(n, 'cash')} className="h-10 px-3 rounded-full border border-aura-border text-sm tabular-nums hover:bg-aura-bg">
                      {money(n)}
                    </button>
                  ))}
                </div>
              ) : kind === 'card' ? (
                <p className="mt-2 text-xs text-aura-muted">{p.pay.reference}</p>
              ) : null}
            </>
          )}
        </div>
      )}

      {payments.length > 0 && (
        <ul className="mt-5 divide-y divide-aura-border rounded-2xl border border-aura-border">
          {payments.map((x, i) => {
            const Icon = METHOD_ICON[x.kind];
            return (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Icon className="w-4 h-4 text-aura-accent" />
                <span className="flex-1">{p.pay.methods[x.kind]}</span>
                <span className="tabular-nums font-medium">{money(x.amount)}</span>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => {
                    const next = payments.filter((_, j) => j !== i);
                    setPayments(next);
                    setInput(fmtMoney(Math.max(0, due - next.reduce((s, y) => s + y.amount, 0))));
                  }}
                  className="p-1.5 rounded-full text-aura-muted hover:text-aura-danger hover:bg-aura-danger-bg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          disabled={remaining > 0}
          onClick={() => onComplete(payments, change)}
          className="flex-1 h-14 rounded-full bg-aura-accent hover:bg-aura-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
        >
          {p.pay.complete}
        </button>
        <button type="button" onClick={onCancel} className="h-14 px-5 rounded-full border border-aura-border text-sm hover:bg-aura-bg">
          {p.pay.cancel}
        </button>
      </div>
    </Modal>
  );
}

export function ReceiptDialog({ sale, onDone }: { sale: CompletedSale; onDone: () => void }) {
  const { lang, t, p, data, money } = usePos();
  const { settings } = useSettingsStore();
  const staffMember = settings.staff.find((s) => s.id === sale.cashierId);
  const fallbackCashier = CASHIERS.find((c) => c.id === sale.cashierId);
  const cashierDisplay =
    sale.cashierName?.[lang] ??
    (staffMember ? (lang === 'ar' ? staffMember.fullNameAr : staffMember.fullNameEn) : fallbackCashier?.name[lang] ?? sale.cashierId);

  const brandName = lang === 'ar' ? settings.company.nameAr : settings.company.nameEn || t.brand.name;
  const branchAddress = lang === 'ar' ? settings.company.addressAr : settings.company.addressEn || data.BUSINESS_INFO.address;
  const vatNumber = settings.company.vatNumber || '310123456700003';
  const tlvBase64 = encodeZatcaTlvPreview({
    sellerName: settings.company.nameAr,
    vatNumber,
    timestampIso: sale.at.toISOString(),
    totalWithVat: fmtMoney(sale.total),
    vatTotal: fmtMoney(sale.vat),
    xmlHash: settings.zatca.prevInvoiceHash,
    ecdsaSignature: 'MEQCIG9vZGF0YSAyMDI2...',
    publicKey: 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE...',
    csidStamp: settings.zatca.binarySecurityToken.slice(0, 32),
  }).base64;

  const resolveLineName = (l: CompletedSale['lines'][number]) => {
    if (l.itemName) return l.itemName[lang];
    if ((BOOKABLE_IDS as readonly string[]).includes(l.itemId)) {
      return bookableInfo(data, l.itemId as BookableId).name;
    }
    return l.itemId;
  };

  return (
    <Modal title={p.receipt.title} onClose={onDone}>
      {/* .pos-receipt is the only thing printed (see globals.css) — 80mm thermal layout */}
      <div className="pos-receipt mx-auto max-w-[320px] rounded-2xl border border-dashed border-aura-border p-5 text-[13px] leading-relaxed">
        <div className="text-center">
          <p className="font-serif text-lg">{brandName}</p>
          <p className="text-xs text-aura-muted">{branchAddress}</p>
          <p className="text-xs text-aura-muted">{p.receipt.vatNo}: <span dir="ltr" className="font-mono">{vatNumber}</span></p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide">{p.receipt.taxInvoice}</p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-2 text-xs">
          <dt className="text-aura-muted">{p.receipt.receiptNo}</dt>
          <dd className="text-end font-mono" dir="ltr">{sale.receiptNo}</dd>
          <dt className="text-aura-muted">{p.receipt.date}</dt>
          <dd className="text-end">{fmtDate(sale.at, lang, { dateStyle: 'short', timeStyle: 'short' })}</dd>
          <dt className="text-aura-muted">{p.receipt.cashier}</dt>
          <dd className="text-end">{cashierDisplay}</dd>
        </dl>
        {sale.client && <p className="mt-2 text-xs font-medium">{sale.client}</p>}
        <ul className="mt-3 border-t border-dashed border-aura-border pt-2 space-y-1">
          {sale.lines.map((l) => (
            <li key={l.uid} className="flex justify-between gap-2">
              <span>{resolveLineName(l)}</span>
              <span className="tabular-nums">{fmtMoney(l.price)}</span>
            </li>
          ))}
          {sale.discount > 0 && (
            <li className="flex justify-between gap-2 text-aura-muted">
              <span>{p.ticket.discount}</span>
              <span className="tabular-nums">-{fmtMoney(sale.discount)}</span>
            </li>
          )}
        </ul>
        <dl className="mt-2 border-t border-dashed border-aura-border pt-2 grid grid-cols-2 gap-x-2">
          <dt className="text-aura-muted">{p.receipt.exclVat}</dt>
          <dd className="text-end tabular-nums">{fmtMoney(sale.total - sale.vat)}</dd>
          <dt className="text-aura-muted">{p.receipt.vat}</dt>
          <dd className="text-end tabular-nums">{fmtMoney(sale.vat)}</dd>
          <dt className="font-semibold">{p.receipt.total}</dt>
          <dd className="text-end font-semibold tabular-nums">{money(sale.total)}</dd>
          {sale.payments.map((x, i) => (
            <div key={i} className="contents">
              <dt className="text-aura-muted">{p.pay.methods[x.kind]}</dt>
              <dd className="text-end tabular-nums">{fmtMoney(x.amount)}</dd>
            </div>
          ))}
          {sale.change > 0 && (
            <>
              <dt className="text-aura-muted">{p.receipt.change}</dt>
              <dd className="text-end tabular-nums">{fmtMoney(sale.change)}</dd>
            </>
          )}
        </dl>
        <div className="mt-4 flex flex-col items-center gap-1.5 text-aura-muted">
          <ZatcaReceiptQrSvg seed={tlvBase64} />
          <span className="text-[11px] font-medium">{p.receipt.zatca}</span>
          <span className="text-[9px] font-mono text-aura-muted/70 max-w-[240px] truncate" dir="ltr" title={tlvBase64}>
            {tlvBase64}
          </span>
          <span className="mt-1 text-xs text-center">{p.receipt.thanks}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full border border-aura-border text-sm font-medium hover:bg-aura-bg">
          <Printer className="w-4 h-4" /> {p.receipt.print}
        </button>
        <button type="button" onClick={onDone} className="flex-1 h-12 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-semibold">
          {p.receipt.newSale}
        </button>
      </div>
    </Modal>
  );
}
