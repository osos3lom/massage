'use client';

import { useState } from 'react';
import { Banknote, CreditCard, Landmark, Printer, QrCode, Smartphone, Trash2, type LucideIcon } from 'lucide-react';
import { bookableInfo } from '@/data/dashboardData';
import {
  CASHIERS, PAYMENT_KINDS, VAT_NUMBER, fmtMoney, toHalalas, type CompletedSale, type Payment, type PaymentKind,
} from '@/data/posData';
import { fmtDate } from '@/components/dashboard/format';
import Modal from './Modal';
import { usePos } from './usePos';

export const METHOD_ICON: Record<PaymentKind, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  wallet: Smartphone,
  transfer: Landmark,
};

const CASH_NOTES = [50_00, 100_00, 200_00, 500_00];

export function PayDialog({
  due, onCancel, onComplete,
}: {
  due: number;
  onCancel: () => void;
  onComplete: (payments: Payment[], change: number) => void;
}) {
  const { p, money } = usePos();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kind, setKind] = useState<PaymentKind>('card');
  const paid = payments.reduce((s, x) => s + x.amount, 0);
  const remaining = Math.max(0, due - paid);
  const change = Math.max(0, paid - due);
  const [input, setInput] = useState(fmtMoney(due));

  const add = (amount: number, method: PaymentKind = kind) => {
    if (amount <= 0 || remaining <= 0) return;
    // Only cash can be over-tendered (and returns change); card/wallet/transfer are capped
    const value = method === 'cash' ? amount : Math.min(amount, remaining);
    const next = [...payments, { kind: method, amount: value }];
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

      <div className="mt-5 grid grid-cols-2 gap-2">
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
              {p.pay.methods[k]}
            </button>
          );
        })}
      </div>

      {remaining > 0 && (
        <div className="mt-4">
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
  const cashier = CASHIERS.find((c) => c.id === sale.cashierId);

  return (
    <Modal title={p.receipt.title} onClose={onDone}>
      {/* .pos-receipt is the only thing printed (see globals.css) — 80mm thermal layout */}
      <div className="pos-receipt mx-auto max-w-[320px] rounded-2xl border border-dashed border-aura-border p-5 text-[13px] leading-relaxed">
        <div className="text-center">
          <p className="font-serif text-lg">{t.brand.name}</p>
          <p className="text-xs text-aura-muted">{data.BUSINESS_INFO.address}</p>
          <p className="text-xs text-aura-muted">{p.receipt.vatNo}: <span dir="ltr">{VAT_NUMBER}</span></p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide">{p.receipt.taxInvoice}</p>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-2 text-xs">
          <dt className="text-aura-muted">{p.receipt.receiptNo}</dt>
          <dd className="text-end font-mono" dir="ltr">{sale.receiptNo}</dd>
          <dt className="text-aura-muted">{p.receipt.date}</dt>
          <dd className="text-end">{fmtDate(sale.at, lang, { dateStyle: 'short', timeStyle: 'short' })}</dd>
          <dt className="text-aura-muted">{p.receipt.cashier}</dt>
          <dd className="text-end">{cashier?.name[lang]}</dd>
        </dl>
        {sale.client && <p className="mt-2 text-xs">{sale.client}</p>}
        <ul className="mt-3 border-t border-dashed border-aura-border pt-2 space-y-1">
          {sale.lines.map((l) => (
            <li key={l.uid} className="flex justify-between gap-2">
              <span>{bookableInfo(data, l.itemId).name}</span>
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
        <div className="mt-4 flex flex-col items-center gap-1 text-aura-muted">
          <span className="grid place-items-center w-24 h-24 rounded-xl border border-aura-border">
            <QrCode className="w-12 h-12" />
          </span>
          <span className="text-[11px]">{p.receipt.zatca}</span>
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
