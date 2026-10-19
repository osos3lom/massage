'use client';

import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { OPENING_FLOAT, PAYMENT_KINDS, fmtMoney, toHalalas, type CompletedSale } from '@/data/posData';
import Modal from './Modal';
import { METHOD_ICON } from './PayDialog';
import { usePos } from './usePos';

/** Z-report: takings by method and a blind cash count against the expected drawer. */
export default function ShiftDialog({
  sales, onCancel, onClosed,
}: {
  sales: CompletedSale[];
  onCancel: () => void;
  onClosed: () => void;
}) {
  const { p, money } = usePos();
  const [counted, setCounted] = useState('');
  const [closed, setClosed] = useState(false);

  const total = sales.reduce((s, x) => s + x.total, 0);
  const change = sales.reduce((s, x) => s + x.change, 0);
  // Cash is reported net of change given, so the methods add up to total sales
  const byMethod = PAYMENT_KINDS.map((k) => ({
    kind: k,
    amount:
      sales.reduce((s, x) => s + x.payments.filter((y) => y.kind === k).reduce((a, y) => a + y.amount, 0), 0) -
      (k === 'cash' ? change : 0),
  }));
  const expectedCash = OPENING_FLOAT + byMethod.find((m) => m.kind === 'cash')!.amount;
  const variance = counted === '' ? null : toHalalas(Number(counted) || 0) - expectedCash;

  if (closed) {
    return (
      <Modal title={p.shift.title}>
        <div className="text-center py-6">
          <CircleCheck className="w-12 h-12 mx-auto text-aura-success" />
          <p className="mt-4 text-sm">{p.shift.closed}</p>
          <button type="button" onClick={onClosed} className="mt-6 h-12 px-6 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-semibold">
            {p.shift.reopen}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={p.shift.title} onClose={onCancel}>
      <div className="pos-receipt space-y-5">
        <div className="rounded-2xl bg-aura-bg p-4 flex items-end justify-between">
          <div>
            <p className="text-xs text-aura-muted">{p.shift.sales}</p>
            <p className="text-2xl font-semibold tabular-nums">{money(total)}</p>
          </div>
          <p className="text-sm text-aura-muted">{p.shift.tickets}: {sales.length}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-aura-muted mb-2">{p.shift.byMethod}</p>
          <ul className="divide-y divide-aura-border rounded-2xl border border-aura-border">
            {byMethod.map(({ kind, amount }) => {
              const Icon = METHOD_ICON[kind];
              return (
                <li key={kind} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <Icon className="w-4 h-4 text-aura-accent" />
                  <span className="flex-1">{p.pay.methods[kind]}</span>
                  <span className="tabular-nums">{money(amount)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-aura-muted">{p.shift.openingFloat}</dt>
          <dd className="text-end tabular-nums">{money(OPENING_FLOAT)}</dd>
          <dt className="font-medium">{p.shift.expectedCash}</dt>
          <dd className="text-end font-semibold tabular-nums">{money(expectedCash)}</dd>
        </dl>

        <div>
          <label htmlFor="counted" className="block text-xs font-medium text-aura-muted mb-1.5">{p.shift.counted}</label>
          <input
            id="counted"
            inputMode="decimal"
            dir="ltr"
            value={counted}
            onChange={(e) => setCounted(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder={fmtMoney(0)}
            className="w-full h-12 rounded-2xl border border-aura-border bg-aura-bg px-4 text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
          />
          {variance !== null && (
            <p className={`mt-2 text-sm font-medium tabular-nums ${variance === 0 ? 'text-aura-success' : 'text-aura-danger'}`}>
              {p.shift.variance}: {variance > 0 ? '+' : ''}{money(variance)}
            </p>
          )}
        </div>
        <p className="text-xs text-aura-muted">{p.shift.note}</p>
      </div>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          disabled={counted === ''}
          onClick={() => {
            // Print while the Z-report is still on screen; print() blocks until the dialog closes
            window.print();
            setClosed(true);
          }}
          className="flex-1 h-12 rounded-full bg-aura-accent hover:bg-aura-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold"
        >
          {p.shift.confirm}
        </button>
        <button type="button" onClick={onCancel} className="h-12 px-5 rounded-full border border-aura-border text-sm hover:bg-aura-bg">
          {p.shift.cancel}
        </button>
      </div>
    </Modal>
  );
}
