'use client';

import { useMemo, useState } from 'react';
import {
  Building2, CheckCircle2, Clock, Cloud, Copy, CreditCard, Database, KeyRound,
  Layers, Lock, Plus, Printer, QrCode, RefreshCw, RotateCcw, ShieldCheck,
  Sparkles, Terminal, Users, Wifi, type LucideIcon,
} from 'lucide-react';
import {
  encodeZatcaTlvPreview,
  useSettingsStore,
  type DayKey,
  type StaffMemberConfig,
} from '@/data/settingsStore';
import type { Role } from './nav';
import { useDashboard } from './useDashboard';

type TabKey = 'general' | 'zatca' | 'hours' | 'payments' | 'printers' | 'staff';

function Card({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl bg-aura-surface border border-aura-border p-5 sm:p-6 ${className}`}>
      {(title || subtitle || action || badge) && (
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && <h2 className="font-serif text-lg sm:text-xl text-aura-text">{title}</h2>}
              {badge}
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-aura-muted max-w-2xl">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-aura-muted">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-aura-muted/80">{hint}</span>}
    </label>
  );
}

const inputCls =
  'w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3.5 text-sm text-aura-text placeholder:text-aura-muted/60 focus:outline-none focus:ring-2 focus:ring-aura-accent/30 transition';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-aura-text">{label}</p>
        {description && <p className="text-xs text-aura-muted mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-aura-accent' : 'bg-aura-border'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
            checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/** Deterministic SVG QR representation for the ZATCA TLV Base64 payload */
function ZatcaQrSvg({ payload, size = 136 }: { payload: string; size?: number }) {
  const cells = 21;
  const grid = useMemo(() => {
    const matrix: boolean[][] = Array.from({ length: cells }, () => Array(cells).fill(false));
    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          matrix[r0 + r][c0 + c] = border || inner;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, cells - 7);
    drawFinder(cells - 7, 0);

    let hash = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      hash ^= payload.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const inFinder =
          (r < 8 && c < 8) || (r < 8 && c >= cells - 8) || (r >= cells - 8 && c < 8);
        if (inFinder) continue;
        const idx = r * cells + c;
        const charCode = payload.charCodeAt(idx % Math.max(1, payload.length)) || 7;
        matrix[r][c] = ((charCode + idx * 17 + (hash & 0xff)) % 3) !== 0;
      }
    }
    return matrix;
  }, [payload]);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells} ${cells}`}
      className="rounded-lg bg-white p-2 border border-aura-border mx-auto"
      aria-label="ZATCA Phase 2 QR Code"
    >
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#1b1815" /> : null
        )
      )}
    </svg>
  );
}

export default function SettingsPage() {
  const { lang, d } = useDashboard();
  const s = d.settings;
  const { settings, updateSettings, resetSettingsToDefault } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [testingTerminal, setTestingTerminal] = useState(false);
  const [terminalApprovedMsg, setTerminalApprovedMsg] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'thermal' | 'carbon'>('thermal');
  const [newStaffOpen, setNewStaffOpen] = useState(false);
  const [newStaffNameAr, setNewStaffNameAr] = useState('');
  const [newStaffNameEn, setNewStaffNameEn] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<Role>('cashier');
  const [newStaffPin, setNewStaffPin] = useState('5566');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 3500);
  };

  const tlvPreview = useMemo(
    () =>
      encodeZatcaTlvPreview({
        sellerName: lang === 'ar' ? settings.company.nameAr : settings.company.nameEn,
        vatNumber: settings.company.vatNumber,
        timestampIso: '2026-10-19T10:15:00+03:00',
        totalWithVat: '250.00',
        vatTotal: '32.61',
        xmlHash: settings.zatca.prevInvoiceHash.slice(0, 44),
        ecdsaSignature: 'MEYCIQDr8x9kL2pV5nW1qZ...7aB3cE9gH0jM==',
        publicKey: 'MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE8x...',
        csidStamp: settings.zatca.binarySecurityToken.slice(0, 36),
      }),
    [lang, settings.company.nameAr, settings.company.nameEn, settings.company.vatNumber, settings.zatca]
  );

  const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
    { key: 'general', label: s.tabs.general, icon: Building2 },
    { key: 'zatca', label: s.tabs.zatca, icon: QrCode },
    { key: 'hours', label: s.tabs.hours, icon: Clock },
    { key: 'payments', label: s.tabs.payments, icon: Wifi },
    { key: 'printers', label: s.tabs.printers, icon: Printer },
    { key: 'staff', label: s.tabs.staff, icon: Users },
  ];

  const handleTriggerSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      notify(s.general.syncSuccess);
    }, 650);
  };

  const handleOnboardZatca = () => {
    updateSettings((prev) => ({
      ...prev,
      zatca: {
        ...prev.zatca,
        csidStatus: 'production',
        binarySecurityToken: 'MIID5TCCAs2gAwIBAgIJAProdZATCA2026CSID99887766==',
      },
    }));
    notify(s.zatca.onboardingSuccess);
  };

  const handleTestTerminal = () => {
    setTestingTerminal(true);
    setTerminalApprovedMsg(null);
    setTimeout(() => {
      setTestingTerminal(false);
      setTerminalApprovedMsg(s.payments.testApproved);
      notify(s.payments.testApproved);
    }, 900);
  };

  const handleRotatePin = (staffId: string) => {
    updateSettings((prev) => ({
      ...prev,
      staff: prev.staff.map((member) => {
        if (member.id !== staffId) return member;
        const currentNum = Number.parseInt(member.pinCode, 10) || 1000;
        const rotatedPin = String(((currentNum + 1379) % 9000) + 1000);
        const suffix = rotatedPin.split('').reverse().join('');
        return {
          ...member,
          pinCode: rotatedPin,
          pinHashPreview: `$2b$10$${suffix}9f8e7d6c5b4a...${rotatedPin.slice(0, 2)}x`,
        };
      }),
    }));
    notify(s.savedToast);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffNameAr.trim() && !newStaffNameEn.trim()) return;
    const pin = newStaffPin.replace(/\D/g, '').slice(0, 4).padEnd(4, '0');
    const newMember: StaffMemberConfig = {
      id: `usr-${Date.now()}`,
      fullNameAr: newStaffNameAr.trim() || newStaffNameEn.trim(),
      fullNameEn: newStaffNameEn.trim() || newStaffNameAr.trim(),
      email: newStaffEmail.trim() || `staff.${Date.now().toString().slice(-4)}@relaxation-oasis.sa`,
      role: newStaffRole,
      pinCode: pin,
      pinHashPreview: `$2b$10$8f7e6d5c4b3a...${pin.slice(0, 2)}h`,
      isActive: true,
    };
    updateSettings((prev) => ({
      ...prev,
      staff: [...prev.staff, newMember],
    }));
    setNewStaffNameAr('');
    setNewStaffNameEn('');
    setNewStaffEmail('');
    setNewStaffOpen(false);
    notify(s.savedToast);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-aura-text">{s.title}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-semibold text-aura-accent-hover border border-aura-border">
              <Lock className="w-3.5 h-3.5 text-aura-accent" />
              {s.roleBadge}
            </span>
          </div>
          <p className="text-sm text-aura-muted mt-1 max-w-3xl">{s.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              resetSettingsToDefault();
              notify(s.savedToast);
            }}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-aura-surface hover:bg-aura-primary/60 text-aura-text border border-aura-border text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-aura-muted" />
            {s.resetDefaults}
          </button>
        </div>
      </div>

      {/* Live Notification Toast */}
      {toast && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl bg-aura-success/10 border border-aura-success/30 px-4 py-3 text-xs sm:text-sm font-medium text-aura-success"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Horizontal Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-aura-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                active
                  ? 'bg-aura-surface text-aura-accent-hover border-aura-accent font-semibold'
                  : 'text-aura-muted hover:text-aura-text hover:bg-aura-surface/50 border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-aura-accent' : 'text-aura-muted'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL & SUPABASE */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card title={s.general.companyTitle} subtitle={s.general.companySubtitle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={s.general.nameAr}>
                  <input
                    type="text"
                    value={settings.company.nameAr}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        company: { ...p.company, nameAr: e.target.value },
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label={s.general.nameEn}>
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.company.nameEn}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        company: { ...p.company, nameEn: e.target.value },
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label={s.general.vatNumber}>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={15}
                    value={settings.company.vatNumber}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        company: { ...p.company, vatNumber: e.target.value },
                      }))
                    }
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label={s.general.crNumber}>
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={10}
                    value={settings.company.crNumber}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        company: { ...p.company, crNumber: e.target.value },
                      }))
                    }
                    className={`${inputCls} font-mono`}
                  />
                </Field>
              </div>
            </Card>

            <Card title={s.general.branchTitle}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={s.general.branchNameAr}>
                  <input
                    type="text"
                    value={settings.company.branchNameAr}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        company: { ...p.company, branchNameAr: e.target.value },
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label={s.general.branchNameEn}>
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.company.branchNameEn}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        company: { ...p.company, branchNameEn: e.target.value },
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label={s.general.phone}>
                  <input
                    type="text"
                    dir="ltr"
                    value={settings.company.phone}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        company: { ...p.company, phone: e.target.value },
                      }))
                    }
                    className={`${inputCls} font-mono`}
                  />
                </Field>
                <Field label={s.general.currency}>
                  <input
                    type="text"
                    dir="ltr"
                    disabled
                    value={settings.company.currency}
                    className={`${inputCls} font-mono opacity-75`}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={s.general.addressAr}>
                    <input
                      type="text"
                      value={settings.company.addressAr}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          company: { ...p.company, addressAr: e.target.value },
                        }))
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card
              title={s.general.supabaseTitle}
              subtitle={s.general.supabaseSubtitle}
              badge={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-success/10 px-2.5 py-0.5 text-xs font-medium text-aura-success">
                  <Cloud className="w-3.5 h-3.5" />
                  PowerSync + RLS
                </span>
              }
            >
              <div className="space-y-4">
                <Field label={s.general.projectUrl}>
                  <input
                    type="url"
                    dir="ltr"
                    value={settings.supabase.projectUrl}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        supabase: { ...p.supabase, projectUrl: e.target.value },
                      }))
                    }
                    className={`${inputCls} font-mono text-xs`}
                  />
                </Field>

                <Field label={s.general.publishableKey}>
                  <input
                    type="text"
                    dir="ltr"
                    readOnly
                    value={settings.supabase.publishableKeyMasked}
                    className={`${inputCls} font-mono text-xs text-aura-muted`}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={s.general.syncEngine}>
                    <select
                      value={settings.supabase.syncEngine}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          supabase: {
                            ...p.supabase,
                            syncEngine: e.target.value as 'powersync' | 'realtime',
                          },
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="powersync">PowerSync (SQLite ↔ PG)</option>
                      <option value="realtime">Supabase Realtime</option>
                    </select>
                  </Field>

                  <Field label={s.general.storageBucket}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.supabase.storageBucket}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          supabase: { ...p.supabase, storageBucket: e.target.value },
                        }))
                      }
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </Field>
                </div>

                <div className="rounded-2xl bg-aura-bg border border-aura-border p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-aura-muted">{s.general.rlsStatus}</span>
                    <span className="inline-flex items-center gap-1 text-aura-success font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {s.general.rlsActive}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-aura-border">
                    <p className="text-[11px] font-medium text-aura-muted mb-1.5">
                      {s.general.edgeFunctions}
                    </p>
                    <div className="flex flex-wrap gap-1.5" dir="ltr">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-aura-surface border border-aura-border px-2.5 py-1 text-[11px] font-mono text-aura-text">
                        <Database className="w-3 h-3 text-aura-accent" />
                        {settings.supabase.zatcaEdgeFunction}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-aura-surface border border-aura-border px-2.5 py-1 text-[11px] font-mono text-aura-text">
                        <Database className="w-3 h-3 text-aura-accent" />
                        {settings.supabase.paymentWebhookFunction}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerSync}
                  disabled={syncing}
                  className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {s.general.testSync}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: ZATCA PHASE 2 */}
      {activeTab === 'zatca' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-6">
            <Card
              title={s.zatca.title}
              subtitle={s.zatca.subtitle}
              badge={
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold ${
                    settings.zatca.csidStatus === 'production'
                      ? 'bg-aura-success/15 text-aura-success'
                      : 'bg-aura-warning/15 text-aura-warning'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {settings.zatca.csidStatus === 'production'
                    ? s.zatca.statusProduction
                    : s.zatca.statusCompliance}
                </span>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={s.zatca.environment}>
                    <select
                      value={settings.zatca.environment}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          zatca: {
                            ...p.zatca,
                            environment: e.target.value as 'sandbox' | 'simulation' | 'production',
                          },
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="sandbox">{s.zatca.envSandbox}</option>
                      <option value="simulation">{s.zatca.envSimulation}</option>
                      <option value="production">{s.zatca.envProduction}</option>
                    </select>
                  </Field>

                  <Field label={s.zatca.egsSerial}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.zatca.egsSerialNumber}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          zatca: { ...p.zatca, egsSerialNumber: e.target.value },
                        }))
                      }
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </Field>
                </div>

                <div className="rounded-2xl bg-aura-bg border border-aura-border p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                    <Field label={s.zatca.otpLabel}>
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={6}
                        value={settings.zatca.otpCode}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            zatca: { ...p.zatca, otpCode: e.target.value },
                          }))
                        }
                        className={`${inputCls} font-mono tracking-widest`}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={handleOnboardZatca}
                      className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs sm:text-sm font-medium transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      {s.zatca.onboardBtn}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label={s.zatca.icvLabel}>
                    <input
                      type="number"
                      dir="ltr"
                      value={settings.zatca.invoiceCounter}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          zatca: {
                            ...p.zatca,
                            invoiceCounter: Number(e.target.value) || 1,
                          },
                        }))
                      }
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={s.zatca.pihLabel}>
                      <input
                        type="text"
                        dir="ltr"
                        readOnly
                        value={settings.zatca.prevInvoiceHash}
                        className={`${inputCls} font-mono text-xs text-aura-muted`}
                      />
                    </Field>
                  </div>
                </div>

                <Toggle
                  checked={settings.zatca.autoReport24h}
                  onChange={(next) =>
                    updateSettings((p) => ({
                      ...p,
                      zatca: { ...p.zatca, autoReport24h: next },
                    }))
                  }
                  label={s.zatca.autoReport}
                />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <Card title={s.zatca.tlvTitle} subtitle={s.zatca.tlvSubtitle}>
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5 items-start">
                <div className="text-center space-y-2">
                  <ZatcaQrSvg payload={tlvPreview.base64} size={140} />
                  <span className="inline-block text-[11px] font-mono text-aura-muted">
                    ECDSA secp256k1 · TLV
                  </span>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pe-1" dir="ltr">
                  {tlvPreview.tags.map((item) => (
                    <div
                      key={item.tag}
                      className="flex items-center justify-between gap-2 rounded-xl bg-aura-bg border border-aura-border px-3 py-1.5 text-xs"
                    >
                      <span className="font-mono font-semibold text-aura-accent shrink-0">
                        Tag {item.tag}
                      </span>
                      <span className="text-aura-muted truncate">{item.label}</span>
                      <span className="font-mono text-aura-text truncate max-w-[11rem]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-aura-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-aura-muted">
                    {s.zatca.base64Payload}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(tlvPreview.base64);
                      notify(s.savedToast);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-aura-accent hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <p
                  dir="ltr"
                  className="rounded-xl bg-aura-bg border border-aura-border p-2.5 text-[11px] font-mono text-aura-text/80 break-all"
                >
                  {tlvPreview.base64}
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: WORKING HOURS */}
      {activeTab === 'hours' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <Card title={s.hours.title} subtitle={s.hours.subtitle}>
              <div className="space-y-5">
                <div>
                  <span className="block text-xs font-medium text-aura-muted mb-2">
                    {s.hours.bufferLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[5, 10, 15, 20, 30].map((min) => {
                      const active = settings.workingHours.bufferMinutes === min;
                      return (
                        <button
                          key={min}
                          type="button"
                          onClick={() =>
                            updateSettings((p) => ({
                              ...p,
                              workingHours: { ...p.workingHours, bufferMinutes: min },
                            }))
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                            active
                              ? 'bg-aura-accent text-white border-aura-accent'
                              : 'bg-aura-bg text-aura-text border-aura-border hover:bg-aura-primary/50'
                          }`}
                        >
                          {min} {s.hours.minutes}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-aura-muted mt-1.5">{s.hours.bufferHint}</p>
                </div>

                <Field label={s.hours.advanceLabel}>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={settings.workingHours.maxAdvanceDays}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          workingHours: {
                            ...p.workingHours,
                            maxAdvanceDays: Number(e.target.value) || 30,
                          },
                        }))
                      }
                      className={`${inputCls} max-w-28 font-mono`}
                    />
                    <span className="text-xs text-aura-muted">{s.hours.daysUnit}</span>
                  </div>
                </Field>
              </div>
            </Card>

            <Card title={s.hours.fridayPauseTitle} subtitle={s.hours.fridayPauseSubtitle}>
              <div className="space-y-4">
                <Toggle
                  checked={settings.workingHours.fridayPrayerPause.enabled}
                  onChange={(next) =>
                    updateSettings((p) => ({
                      ...p,
                      workingHours: {
                        ...p.workingHours,
                        fridayPrayerPause: { ...p.workingHours.fridayPrayerPause, enabled: next },
                      },
                    }))
                  }
                  label={s.hours.fridayPauseTitle}
                />

                {settings.workingHours.fridayPrayerPause.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={s.hours.pauseStart}>
                      <input
                        type="time"
                        dir="ltr"
                        value={settings.workingHours.fridayPrayerPause.start}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            workingHours: {
                              ...p.workingHours,
                              fridayPrayerPause: {
                                ...p.workingHours.fridayPrayerPause,
                                start: e.target.value,
                              },
                            },
                          }))
                        }
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                    <Field label={s.hours.pauseEnd}>
                      <input
                        type="time"
                        dir="ltr"
                        value={settings.workingHours.fridayPrayerPause.end}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            workingHours: {
                              ...p.workingHours,
                              fridayPrayerPause: {
                                ...p.workingHours.fridayPrayerPause,
                                end: e.target.value,
                              },
                            },
                          }))
                        }
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card title={s.hours.weeklyTitle}>
              <div className="space-y-2.5">
                {settings.workingHours.days.map((dayObj) => {
                  const updateDay = (patch: Partial<typeof dayObj>) =>
                    updateSettings((p) => ({
                      ...p,
                      workingHours: {
                        ...p.workingHours,
                        days: p.workingHours.days.map((dItem) =>
                          dItem.key === dayObj.key ? { ...dItem, ...patch } : dItem
                        ),
                      },
                    }));

                  return (
                    <div
                      key={dayObj.key}
                      className={`grid grid-cols-1 sm:grid-cols-[9rem_1fr_auto] items-center gap-3 rounded-2xl border p-3 transition-colors ${
                        dayObj.enabled
                          ? 'bg-aura-bg border-aura-border'
                          : 'bg-aura-bg/40 border-aura-border/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <span className="font-medium text-sm text-aura-text">
                          {s.hours.days[dayObj.key as DayKey]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2" dir="ltr">
                        <input
                          type="time"
                          disabled={!dayObj.enabled}
                          value={dayObj.open}
                          onChange={(e) => updateDay({ open: e.target.value })}
                          className={`${inputCls} h-9 font-mono text-xs`}
                        />
                        <span className="text-aura-muted text-xs">→</span>
                        <input
                          type="time"
                          disabled={!dayObj.enabled}
                          value={dayObj.close}
                          onChange={(e) => updateDay({ close: e.target.value })}
                          className={`${inputCls} h-9 font-mono text-xs`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => updateDay({ enabled: !dayObj.enabled })}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          dayObj.enabled
                            ? 'bg-aura-success/15 text-aura-success'
                            : 'bg-aura-border text-aura-muted'
                        }`}
                      >
                        {dayObj.enabled ? s.hours.openStatus : s.hours.closedStatus}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: CONTACTLESS PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <Card title={s.payments.title} subtitle={s.payments.subtitle}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      { id: 'semi_integrated', label: s.payments.modeSemi },
                      { id: 'standalone', label: s.payments.modeStandalone },
                    ] as const
                  ).map((opt) => {
                    const active = settings.payments.mode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          updateSettings((p) => ({
                            ...p,
                            payments: { ...p.payments, mode: opt.id },
                          }))
                        }
                        className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-start text-xs sm:text-sm font-medium transition-colors ${
                          active
                            ? 'bg-aura-primary/70 border-aura-accent text-aura-text font-semibold'
                            : 'bg-aura-bg border-aura-border text-aura-muted hover:text-aura-text'
                        }`}
                      >
                        <Terminal
                          className={`w-4 h-4 shrink-0 ${
                            active ? 'text-aura-accent' : 'text-aura-muted'
                          }`}
                        />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={s.payments.providerLabel}>
                    <select
                      value={settings.payments.provider}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          payments: {
                            ...p.payments,
                            provider: e.target.value as
                              | 'geidea'
                              | 'moyasar'
                              | 'hyperpay'
                              | 'neoleap',
                          },
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="geidea">Geidea Smart POS (جيديا — مدى أثير)</option>
                      <option value="moyasar">Moyasar Terminal SDK (مُيسر)</option>
                      <option value="hyperpay">HyperPay Smart ECR (هايبر باي)</option>
                      <option value="neoleap">neoleap POS (نيوليب)</option>
                    </select>
                  </Field>

                  <Field label={s.payments.connectionLabel}>
                    <select
                      value={settings.payments.connection}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          payments: {
                            ...p.payments,
                            connection: e.target.value as 'tcp_ip' | 'usb' | 'bluetooth',
                          },
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="tcp_ip">Local Network (TCP/IP Socket)</option>
                      <option value="usb">USB Serial (COM / WebUSB)</option>
                      <option value="bluetooth">Bluetooth Low Energy (BLE)</option>
                    </select>
                  </Field>

                  <Field label={s.payments.terminalIp}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.payments.terminalIp}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          payments: { ...p.payments, terminalIp: e.target.value },
                        }))
                      }
                      className={`${inputCls} font-mono`}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={s.payments.terminalPort}>
                      <input
                        type="number"
                        dir="ltr"
                        value={settings.payments.terminalPort}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            payments: {
                              ...p.payments,
                              terminalPort: Number(e.target.value) || 8080,
                            },
                          }))
                        }
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                    <Field label={s.payments.timeoutLabel}>
                      <input
                        type="number"
                        dir="ltr"
                        value={settings.payments.timeoutSec}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            payments: {
                              ...p.payments,
                              timeoutSec: Number(e.target.value) || 60,
                            },
                          }))
                        }
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label={s.payments.terminalId}>
                      <input
                        type="text"
                        dir="ltr"
                        value={settings.payments.terminalId}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            payments: { ...p.payments, terminalId: e.target.value },
                          }))
                        }
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                  </div>
                </div>

                <div className="pt-2 border-t border-aura-border space-y-1">
                  <Toggle
                    checked={settings.payments.nfcTapEnabled}
                    onChange={(next) =>
                      updateSettings((p) => ({
                        ...p,
                        payments: { ...p.payments, nfcTapEnabled: next },
                      }))
                    }
                    label={s.payments.nfcTap}
                  />
                  <Toggle
                    checked={settings.payments.autoPrintBankSlip}
                    onChange={(next) =>
                      updateSettings((p) => ({
                        ...p,
                        payments: { ...p.payments, autoPrintBankSlip: next },
                      }))
                    }
                    label={s.payments.autoBankSlip}
                  />
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleTestTerminal}
                    disabled={testingTerminal}
                    className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
                  >
                    <Wifi className={`w-4 h-4 ${testingTerminal ? 'animate-pulse' : ''}`} />
                    {testingTerminal ? s.payments.testingTerminal : s.payments.testTerminalBtn}
                  </button>

                  {terminalApprovedMsg && (
                    <div
                      dir="ltr"
                      className="rounded-2xl bg-aura-success/10 border border-aura-success/30 px-4 py-2.5 text-xs font-mono text-aura-success flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{terminalApprovedMsg}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card title={s.payments.methodsTitle}>
              <div className="space-y-3">
                {settings.payments.methods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-aura-bg border border-aura-border p-3.5"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CreditCard className="w-4 h-4 text-aura-accent shrink-0" />
                        <span className="text-sm font-medium text-aura-text">
                          {lang === 'ar' ? method.nameAr : method.nameEn}
                        </span>
                        {method.contactless && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-aura-primary px-2 py-0.5 text-[10px] font-semibold text-aura-accent-hover">
                            <Wifi className="w-2.5 h-2.5" />
                            {s.payments.contactlessBadge}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1" dir="ltr">
                        {method.schemes.map((sc) => (
                          <span
                            key={sc}
                            className="rounded-md bg-aura-surface border border-aura-border px-2 py-0.5 text-[10px] font-mono text-aura-muted"
                          >
                            {sc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={method.enabled}
                      onClick={() =>
                        updateSettings((p) => ({
                          ...p,
                          payments: {
                            ...p.payments,
                            methods: p.payments.methods.map((m) =>
                              m.id === method.id ? { ...m, enabled: !m.enabled } : m
                            ),
                          },
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        method.enabled ? 'bg-aura-accent' : 'bg-aura-border'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                          method.enabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: CARBON & THERMAL PRINTERS */}
      {activeTab === 'printers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {/* Primary 80mm Thermal Printer */}
            <Card
              title={s.printers.thermalTitle}
              subtitle={s.printers.thermalSubtitle}
              badge={
                <span className="inline-flex items-center gap-1 rounded-full bg-aura-success/15 px-2.5 py-0.5 text-xs font-semibold text-aura-success">
                  80mm ESC/POS
                </span>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={s.printers.model}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.printers.thermal.model}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          printers: {
                            ...p.printers,
                            thermal: { ...p.printers.thermal, model: e.target.value },
                          },
                        }))
                      }
                      className={`${inputCls} text-xs`}
                    />
                  </Field>
                  <Field label={s.printers.connection}>
                    <select
                      value={settings.printers.thermal.connection}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          printers: {
                            ...p.printers,
                            thermal: {
                              ...p.printers.thermal,
                              connection: e.target.value as 'tcp_ip' | 'usb' | 'bluetooth',
                            },
                          },
                        }))
                      }
                      className={inputCls}
                    >
                      <option value="tcp_ip">Ethernet LAN (RAW 9100)</option>
                      <option value="usb">Direct USB ESC/POS</option>
                      <option value="bluetooth">Bluetooth Thermal</option>
                    </select>
                  </Field>
                  <Field label={s.printers.ipAddress}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.printers.thermal.ip}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          printers: {
                            ...p.printers,
                            thermal: { ...p.printers.thermal, ip: e.target.value },
                          },
                        }))
                      }
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={s.printers.port}>
                      <input
                        type="number"
                        dir="ltr"
                        value={settings.printers.thermal.port}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            printers: {
                              ...p.printers,
                              thermal: {
                                ...p.printers.thermal,
                                port: Number(e.target.value) || 9100,
                              },
                            },
                          }))
                        }
                        className={`${inputCls} font-mono`}
                      />
                    </Field>
                    <Field label={s.printers.paperWidth}>
                      <select
                        value={settings.printers.thermal.paperWidth}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            printers: {
                              ...p.printers,
                              thermal: {
                                ...p.printers.thermal,
                                paperWidth: e.target.value as '80mm' | '58mm',
                              },
                            },
                          }))
                        }
                        className={inputCls}
                      >
                        <option value="80mm">80mm</option>
                        <option value="58mm">58mm</option>
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="pt-2 border-t border-aura-border space-y-1">
                  <Toggle
                    checked={settings.printers.thermal.rasterArabic}
                    onChange={(next) =>
                      updateSettings((p) => ({
                        ...p,
                        printers: {
                          ...p.printers,
                          thermal: { ...p.printers.thermal, rasterArabic: next },
                        },
                      }))
                    }
                    label={s.printers.rasterArabic}
                  />
                  <Toggle
                    checked={settings.printers.thermal.autoCut}
                    onChange={(next) =>
                      updateSettings((p) => ({
                        ...p,
                        printers: {
                          ...p.printers,
                          thermal: { ...p.printers.thermal, autoCut: next },
                        },
                      }))
                    }
                    label={s.printers.autoCut}
                  />
                  <Toggle
                    checked={settings.printers.thermal.kickCashDrawer}
                    onChange={(next) =>
                      updateSettings((p) => ({
                        ...p,
                        printers: {
                          ...p.printers,
                          thermal: { ...p.printers.thermal, kickCashDrawer: next },
                        },
                      }))
                    }
                    label={s.printers.kickDrawer}
                  />
                </div>
              </div>
            </Card>

            {/* Secondary Carbon Impact Printer */}
            <Card
              title={s.printers.carbonTitle}
              subtitle={s.printers.carbonSubtitle}
              badge={
                <span className="inline-flex items-center gap-1 rounded-full bg-aura-primary px-2.5 py-0.5 text-xs font-semibold text-aura-accent-hover border border-aura-border">
                  <Layers className="w-3 h-3 text-aura-accent" />
                  {settings.printers.carbon.plyCount}-Ply Carbon
                </span>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={s.printers.model}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.printers.carbon.model}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          printers: {
                            ...p.printers,
                            carbon: { ...p.printers.carbon, model: e.target.value },
                          },
                        }))
                      }
                      className={`${inputCls} text-xs`}
                    />
                  </Field>
                  <Field label={s.printers.portName}>
                    <input
                      type="text"
                      dir="ltr"
                      value={settings.printers.carbon.portName}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          printers: {
                            ...p.printers,
                            carbon: { ...p.printers.carbon, portName: e.target.value },
                          },
                        }))
                      }
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label={s.printers.plyCount}>
                      <select
                        value={settings.printers.carbon.plyCount}
                        onChange={(e) =>
                          updateSettings((p) => ({
                            ...p,
                            printers: {
                              ...p.printers,
                              carbon: {
                                ...p.printers.carbon,
                                plyCount: Number(e.target.value) as 2 | 3,
                              },
                            },
                          }))
                        }
                        className={inputCls}
                      >
                        <option value={2}>{s.printers.ply2}</option>
                        <option value={3}>{s.printers.ply3}</option>
                      </select>
                    </Field>
                  </div>
                </div>

                <Toggle
                  checked={settings.printers.carbon.autoDuplicateCopy}
                  onChange={(next) =>
                    updateSettings((p) => ({
                      ...p,
                      printers: {
                        ...p.printers,
                        carbon: { ...p.printers.carbon, autoDuplicateCopy: next },
                      },
                    }))
                  }
                  label={s.printers.autoDuplicate}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-aura-border">
                  <Field label={s.printers.headerAr}>
                    <input
                      type="text"
                      value={settings.printers.receiptHeaderAr}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          printers: { ...p.printers, receiptHeaderAr: e.target.value },
                        }))
                      }
                      className={inputCls}
                    />
                  </Field>
                  <Field label={s.printers.footerAr}>
                    <input
                      type="text"
                      value={settings.printers.receiptFooterAr}
                      onChange={(e) =>
                        updateSettings((p) => ({
                          ...p,
                          printers: { ...p.printers, receiptFooterAr: e.target.value },
                        }))
                      }
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Print Preview (Thermal 80mm vs 2-Ply Carbon Copy) */}
          <div className="lg:col-span-5 space-y-6">
            <Card title={s.printers.previewTitle}>
              <div className="flex rounded-full bg-aura-bg p-1 border border-aura-border mb-4">
                <button
                  type="button"
                  onClick={() => setPreviewMode('thermal')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    previewMode === 'thermal'
                      ? 'bg-aura-surface text-aura-accent-hover shadow-sm'
                      : 'text-aura-muted hover:text-aura-text'
                  }`}
                >
                  {s.printers.previewThermalTab}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('carbon')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    previewMode === 'carbon'
                      ? 'bg-aura-surface text-aura-accent-hover shadow-sm'
                      : 'text-aura-muted hover:text-aura-text'
                  }`}
                >
                  {s.printers.previewCarbonTab}
                </button>
              </div>

              {previewMode === 'thermal' ? (
                /* 80mm Thermal Receipt Preview */
                <div className="mx-auto max-w-xs rounded-2xl bg-white border border-aura-border p-5 text-[#1b1815] shadow-sm font-mono text-xs space-y-3">
                  <div className="text-center space-y-1 border-b border-dashed border-neutral-300 pb-3">
                    <p className="font-sans font-bold text-sm">{settings.company.nameAr}</p>
                    <p className="text-[11px] text-neutral-600">{settings.company.branchNameAr}</p>
                    <p className="text-[11px] text-neutral-600">
                      الرقم الضريبي: {settings.company.vatNumber}
                    </p>
                    <p className="text-[10px] font-semibold bg-neutral-100 rounded py-0.5 mt-1">
                      فاتورة ضريبية مبسطة · Simplified Tax Invoice
                    </p>
                  </div>

                  <div className="flex justify-between text-[11px] text-neutral-600">
                    <span>#JED-POS1-00142</span>
                    <span dir="ltr">2026-10-19 10:15</span>
                  </div>

                  <div className="border-y border-dashed border-neutral-300 py-2.5 space-y-1.5">
                    <div className="flex justify-between font-sans font-semibold">
                      <span>ساعة مساج استرخائي (60 د)</span>
                      <span dir="ltr">250.00 SAR</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>الضريبة (15% مستخرجة)</span>
                      <span dir="ltr">32.61 SAR</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200">
                      <span>الإجمالي الشامل</span>
                      <span dir="ltr">250.00 SAR</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-600 space-y-0.5" dir="ltr">
                    <p>TENDER: mada Contactless (NFC Tap)</p>
                    <p>AUTH: #849201 · TID: {settings.payments.terminalId}</p>
                  </div>

                  <div className="pt-1 text-center space-y-2">
                    <ZatcaQrSvg payload={tlvPreview.base64} size={112} />
                    <p className="font-sans text-[11px] text-neutral-600">
                      {settings.printers.receiptFooterAr}
                    </p>
                  </div>
                </div>
              ) : (
                /* 2-Ply Carbon Impact Voucher Preview */
                <div className="space-y-3">
                  {/* White Original Copy + Yellow Carbon Copy */}
                  {[
                    {
                      copyTitle: 'النسخة الأولى (بيضاء) — أصل العميل · CUSTOMER ORIGINAL',
                      bg: 'bg-[#fdfcf9] border-neutral-300',
                    },
                    {
                      copyTitle: 'النسخة الثانية (صفراء كربونية) — نسخة المحاسبة والأرشيف · AUDIT CARBON COPY',
                      bg: 'bg-[#fef9c3]/85 border-amber-300',
                    },
                  ].map((sheet, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-xl border ${sheet.bg} px-6 py-4 text-[#1b1815] font-mono text-[11px] shadow-xs`}
                    >
                      {/* Tractor-feed sprocket holes */}
                      <div className="absolute inset-y-2 start-1.5 flex flex-col justify-between">
                        {[0, 1, 2, 3, 4].map((h) => (
                          <span
                            key={h}
                            className="w-2 h-2 rounded-full bg-aura-surface border border-neutral-300"
                          />
                        ))}
                      </div>
                      <div className="absolute inset-y-2 end-1.5 flex flex-col justify-between">
                        {[0, 1, 2, 3, 4].map((h) => (
                          <span
                            key={h}
                            className="w-2 h-2 rounded-full bg-aura-surface border border-neutral-300"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-b border-dashed border-neutral-400 pb-1.5 mb-2">
                        <span className="font-bold">{settings.company.nameAr}</span>
                        <span className="text-[10px]">CR: {settings.company.crNumber}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-amber-900 mb-2">
                        {sheet.copyTitle}
                      </p>
                      <div className="flex justify-between py-1 border-y border-neutral-400/60">
                        <span>سند قبض #JED-POS1-00142</span>
                        <span dir="ltr">250.00 SAR (Incl. 15% VAT)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-2 text-[10px] text-neutral-600">
                        <span>توقيع الكاشير: _______________</span>
                        <span>ختم المركز: [ ZATCA STAMPED ]</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => notify(s.printers.printSent)}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {s.printers.testThermalBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewMode('carbon');
                    notify(s.printers.printSent);
                  }}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full bg-aura-primary hover:bg-aura-primary/70 text-aura-accent-hover border border-aura-border text-xs font-semibold transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  {s.printers.testCarbonBtn}
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 6: STAFF & ROLES (ADMIN & CASHIER ONLY) */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Two-Role RBAC Matrix */}
          <Card title={s.staff.roleMatrixTitle} subtitle={s.staff.subtitle}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-aura-bg border border-aura-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-bold text-aura-accent-hover">
                    <ShieldCheck className="w-3.5 h-3.5 text-aura-accent" />
                    {s.staff.adminRoleName}
                  </span>
                  <span className="text-[11px] font-mono text-aura-muted" dir="ltr">
                    permissions: [&quot;*&quot;]
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-aura-muted leading-relaxed">
                  {s.staff.adminRoleDesc}
                </p>
              </div>

              <div className="rounded-2xl bg-aura-bg border border-aura-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-surface border border-aura-border px-3 py-1 text-xs font-bold text-aura-text">
                    <KeyRound className="w-3.5 h-3.5 text-aura-accent" />
                    {s.staff.cashierRoleName}
                  </span>
                  <span className="text-[11px] font-mono text-aura-muted" dir="ltr">
                    permissions: [&quot;pos&quot;, &quot;bookings&quot;, &quot;shifts&quot;]
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-aura-muted leading-relaxed">
                  {s.staff.cashierRoleDesc}
                </p>
              </div>
            </div>
          </Card>

          {/* Authorized Staff List */}
          <Card
            title={s.staff.staffListTitle}
            action={
              <button
                type="button"
                onClick={() => setNewStaffOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {s.staff.addStaffBtn}
              </button>
            }
          >
            {newStaffOpen && (
              <form
                onSubmit={handleAddStaff}
                className="mb-5 rounded-2xl bg-aura-bg border border-aura-border p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
              >
                <Field label={s.staff.nameAr}>
                  <input
                    type="text"
                    required
                    value={newStaffNameAr}
                    onChange={(e) => setNewStaffNameAr(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label={s.staff.nameEn}>
                  <input
                    type="text"
                    dir="ltr"
                    value={newStaffNameEn}
                    onChange={(e) => setNewStaffNameEn(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label={s.staff.email}>
                  <input
                    type="email"
                    dir="ltr"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label={s.staff.role}>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as Role)}
                    className={inputCls}
                  >
                    <option value="cashier">cashier</option>
                    <option value="admin">admin</option>
                  </select>
                </Field>
                <div className="flex items-center gap-2">
                  <Field label={s.staff.pinCode}>
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={4}
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value)}
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-aura-accent text-white text-xs font-semibold shrink-0"
                  >
                    +
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {settings.staff.map((member) => (
                <div
                  key={member.id}
                  className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_auto_auto_auto] items-center gap-3 rounded-2xl bg-aura-bg border border-aura-border p-4"
                >
                  <div>
                    <p className="font-medium text-sm text-aura-text">
                      {lang === 'ar' ? member.fullNameAr : member.fullNameEn}
                    </p>
                    <p className="text-xs font-mono text-aura-muted" dir="ltr">
                      {member.email}
                    </p>
                  </div>

                  <div className="text-xs space-y-0.5" dir="ltr">
                    <div className="flex items-center gap-2">
                      <span className="text-aura-muted">PIN:</span>
                      <span className="font-mono font-bold text-aura-text tracking-widest">
                        {member.pinCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRotatePin(member.id)}
                        className="text-[11px] text-aura-accent hover:underline"
                      >
                        ({s.staff.rotatePin})
                      </button>
                    </div>
                    <p className="font-mono text-[10px] text-aura-muted truncate max-w-56">
                      {member.pinHashPreview}
                    </p>
                  </div>

                  {/* Role selector strictly restricted to admin & cashier */}
                  <select
                    value={member.role}
                    onChange={(e) =>
                      updateSettings((p) => ({
                        ...p,
                        staff: p.staff.map((m) =>
                          m.id === member.id ? { ...m, role: e.target.value as Role } : m
                        ),
                      }))
                    }
                    className="h-9 rounded-xl bg-aura-surface border border-aura-border px-3 text-xs font-semibold text-aura-text"
                  >
                    <option value="admin">{s.staff.adminRoleName}</option>
                    <option value="cashier">{s.staff.cashierRoleName}</option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      updateSettings((p) => ({
                        ...p,
                        staff: p.staff.map((m) =>
                          m.id === member.id ? { ...m, isActive: !m.isActive } : m
                        ),
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      member.isActive
                        ? 'bg-aura-success/15 text-aura-success'
                        : 'bg-aura-border text-aura-muted'
                    }`}
                  >
                    {member.isActive ? s.staff.active : s.staff.suspended}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
