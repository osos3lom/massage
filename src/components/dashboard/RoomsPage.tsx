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
  Sparkles,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ServiceKind } from '@/data/dashboardData';
import {
  usePhase34Store,
  type RoomConfig,
  type RoomLiveState,
} from '@/data/phase34Store';
import { useDashboard } from './useDashboard';

const KIND_META: Record<ServiceKind, { icon: LucideIcon; ar: string; en: string }> = {
  massage: { icon: Hand, ar: 'غرفة مساج', en: 'Massage Suite' },
  'moroccan-bath': { icon: Droplets, ar: 'جناح حمام مغربي', en: 'Moroccan Hammam' },
  pedicure: { icon: Footprints, ar: 'صالة بديكير', en: 'Pedicure Lounge' },
};

const STATE_META: Record<
  RoomLiveState,
  { ar: string; en: string; badgeCls: string; dotCls: string }
> = {
  available: {
    ar: 'متاحة وجاهزة',
    en: 'Available & Ready',
    badgeCls: 'bg-aura-success-bg text-aura-success',
    dotCls: 'bg-aura-success',
  },
  occupied: {
    ar: 'في جلسة الآن',
    en: 'In Treatment',
    badgeCls: 'bg-aura-primary text-aura-accent',
    dotCls: 'bg-aura-accent animate-pulse',
  },
  sanitizing: {
    ar: 'تعقيم وتجهيز المناشف (15 د)',
    en: 'Sanitizing & Linen Reset (15m)',
    badgeCls: 'bg-aura-warning-bg text-aura-warning',
    dotCls: 'bg-aura-warning',
  },
  maintenance: {
    ar: 'صيانة / خارج الخدمة',
    en: 'Maintenance',
    badgeCls: 'bg-aura-danger-bg text-aura-danger',
    dotCls: 'bg-aura-danger',
  },
};

export default function RoomsPage() {
  const { lang } = useDashboard();
  const isAr = lang === 'ar';
  const { rooms, therapists, updateRoomConfig, addRoomConfig } = usePhase34Store();

  const [kindFilter, setKindFilter] = useState<ServiceKind | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add Room form state
  const [code, setCode] = useState('SUITE-M4');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [forKind, setForKind] = useState<ServiceKind>('massage');
  const [floorAr, setFloorAr] = useState('الدور الأول · الجناح الهادئ');
  const [bufferMin, setBufferMin] = useState(15);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(
    () => rooms.filter((r) => kindFilter === 'all' || r.forKind === kindFilter),
    [rooms, kindFilter]
  );

  const stats = useMemo(() => {
    const available = rooms.filter((r) => r.liveState === 'available').length;
    const occupied = rooms.filter((r) => r.liveState === 'occupied').length;
    const sanitizing = rooms.filter((r) => r.liveState === 'sanitizing').length;
    const maintenance = rooms.filter((r) => r.liveState === 'maintenance').length;
    return { available, occupied, sanitizing, maintenance };
  }, [rooms]);

  const setStateForRoom = (room: RoomConfig, next: RoomLiveState) => {
    updateRoomConfig(room.id, {
      liveState: next,
      currentClientAr: next === 'occupied' ? room.currentClientAr ?? 'عميلة مباشرة' : undefined,
      currentClientEn: next === 'occupied' ? room.currentClientEn ?? 'Walk-in Client' : undefined,
    });
    notify(
      isAr
        ? `تم تحديث حالة ${room.nameAr} إلى (${STATE_META[next].ar})`
        : `Updated ${room.nameEn} status to ${STATE_META[next].en}`
    );
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) return;
    addRoomConfig({
      code: code.trim() || 'ROOM-NEW',
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      forKind,
      floorAr,
      floorEn: floorAr,
      equipmentAr: ['سرير مساج حديث', 'إضاءة خافتة', 'معقم هواء'],
      equipmentEn: ['Modern spa bed', 'Dimmer lighting', 'Air purifier'],
      liveState: 'available',
      bufferMinutes: Number(bufferMin) || 15,
      isActive: true,
    });
    setNameAr('');
    setNameEn('');
    setShowAdd(false);
    notify(isAr ? 'تمت إضافة الغرفة إلى جدول الموارد' : 'Room added to resource schedule');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <DoorOpen className="w-3.5 h-3.5" />
            {isAr ? 'إدارة الغرف والأجنحة والتعقيم · المرحلة 3' : 'Rooms, Suites & Turnover Buffers · Phase 3'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'الغرف وأجنحة الخدمة' : 'Treatment Rooms & Suites'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'متابعة الإشغال الفوري لغرف المساج وأجنحة الحمام المغربي وصالة البديكير، وفاصل التعقيم بين الجلسات.'
              : 'Monitor live room occupancy, Moroccan hammam steam suites, and 15-minute sanitization turnover buffers.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة غرفة / جناح' : 'Add Room'}
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
          <p className="text-xs text-aura-muted">{isAr ? 'غرف متاحة فوراً' : 'Available Now'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-success">
            {stats.available}
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'معقمة وجاهزة للاستقبال' : 'Sanitized & ready'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'غرف مشغولة بجلسة' : 'In Treatment Now'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-accent">
            {stats.occupied}
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'مرتبطة بحجوزات جارية' : 'Active checked-in sessions'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'قيد التعقيم وتبديل المناشف' : 'Sanitizing / Linen Reset'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-warning">
            {stats.sanitizing}
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'فاصل 15 دقيقة قياسي' : '15-min turnover buffer'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'إجمالي الغرف والأجنحة' : 'Total Active Suites'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">{rooms.length}</p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'جدول rooms (for_kind)' : 'rooms.for_kind constraint'}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setKindFilter('all')}
          className={`h-10 px-4 rounded-full text-sm font-medium transition-colors ${
            kindFilter === 'all'
              ? 'bg-aura-text text-white'
              : 'bg-aura-surface border border-aura-border text-aura-text hover:border-aura-accent/40'
          }`}
        >
          {isAr ? `جميع الغرف (${rooms.length})` : `All Rooms (${rooms.length})`}
        </button>
        {(['massage', 'moroccan-bath', 'pedicure'] as ServiceKind[]).map((k) => {
          const meta = KIND_META[k];
          const Icon = meta.icon;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setKindFilter(k)}
              className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-colors ${
                kindFilter === k
                  ? 'bg-aura-text text-white'
                  : 'bg-aura-surface border border-aura-border text-aura-text hover:border-aura-accent/40'
              }`}
            >
              <Icon className="w-4 h-4 text-aura-accent" />
              <span>{isAr ? meta.ar : meta.en}</span>
            </button>
          );
        })}
      </div>

      {/* Rooms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((room) => {
          const kind = KIND_META[room.forKind];
          const Icon = kind.icon;
          const st = STATE_META[room.liveState];
          const th = therapists.find((t) => t.id === room.currentTherapistId);
          const equip = isAr ? room.equipmentAr : room.equipmentEn;

          return (
            <article
              key={room.id}
              className="rounded-3xl bg-aura-surface border border-aura-border p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-aura-primary text-aura-accent grid place-items-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[11px] font-mono text-aura-muted" dir="ltr">
                        {room.code}
                      </span>
                      <h2 className="font-serif text-lg text-aura-text leading-snug">
                        {isAr ? room.nameAr : room.nameEn}
                      </h2>
                      <p className="text-xs text-aura-muted">
                        {isAr ? room.floorAr : room.floorEn}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 ${st.badgeCls}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${st.dotCls}`} />
                    {isAr ? st.ar : st.en}
                  </span>
                </div>

                {/* Live Occupant Box */}
                {room.liveState === 'occupied' && (
                  <div className="mt-4 rounded-2xl bg-aura-primary/40 border border-aura-accent/25 p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-aura-muted">{isAr ? 'العميلة الحالية:' : 'Current Client:'}</span>
                      <span className="font-semibold text-aura-text">
                        {isAr ? room.currentClientAr : room.currentClientEn}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-aura-muted">{isAr ? 'المعالجة:' : 'Therapist:'}</span>
                      <span className="font-medium text-aura-accent">
                        {th ? (isAr ? th.nameAr : th.nameEn) : '—'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Equipment & Turnover Buffer */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-aura-bg border border-aura-border px-2.5 py-0.5 text-[11px] text-aura-text">
                    <Clock className="w-3 h-3 text-aura-accent" />
                    {isAr ? `تجهيز وتعقيم ${room.bufferMinutes} د` : `${room.bufferMinutes}m turnover`}
                  </span>
                  {equip.map((eq, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-aura-bg border border-aura-border px-2.5 py-0.5 text-[11px] text-aura-muted"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick State Controls */}
              <div className="pt-3 border-t border-aura-border flex flex-wrap items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setStateForRoom(room, 'available')}
                  className={`flex-1 h-8 rounded-xl text-xs font-medium transition ${
                    room.liveState === 'available'
                      ? 'bg-aura-success text-white'
                      : 'bg-aura-bg border border-aura-border text-aura-muted hover:text-aura-text'
                  }`}
                >
                  {isAr ? 'متاحة' : 'Ready'}
                </button>
                <button
                  type="button"
                  onClick={() => setStateForRoom(room, 'sanitizing')}
                  className={`flex-1 h-8 rounded-xl text-xs font-medium transition ${
                    room.liveState === 'sanitizing'
                      ? 'bg-aura-warning text-white'
                      : 'bg-aura-bg border border-aura-border text-aura-muted hover:text-aura-text'
                  }`}
                >
                  <Sparkles className="inline w-3 h-3 me-1" />
                  {isAr ? 'تعقيم' : 'Sanitize'}
                </button>
                <button
                  type="button"
                  onClick={() => setStateForRoom(room, 'maintenance')}
                  className={`h-8 px-2.5 rounded-xl text-xs font-medium transition ${
                    room.liveState === 'maintenance'
                      ? 'bg-aura-danger text-white'
                      : 'bg-aura-bg border border-aura-border text-aura-muted hover:text-aura-text'
                  }`}
                  title={isAr ? 'تحويل للصيانة' : 'Maintenance'}
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Add Room Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{isAr ? 'إضافة غرفة أو جناح جديد' : 'Add New Room / Suite'}</h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRoom} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'رمز الغرفة' : 'Room Code'}</span>
                  <input
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm font-mono"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'نوع الخدمة (for_kind)' : 'Service Type'}</span>
                  <select
                    value={forKind}
                    onChange={(e) => setForKind(e.target.value as ServiceKind)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  >
                    <option value="massage">{isAr ? 'المساج' : 'Massage'}</option>
                    <option value="moroccan-bath">{isAr ? 'الحمام المغربي' : 'Moroccan Bath'}</option>
                    <option value="pedicure">{isAr ? 'البديكير' : 'Pedicure'}</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اسم الغرفة (عربي)' : 'Room Name (Arabic)'}</span>
                <input
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: غرفة المساج 4 (جناح الياسمين)"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اسم الغرفة (إنجليزي)' : 'Room Name (English)'}</span>
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Massage Room 4 (Jasmine Suite)"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'الموقع / الدور' : 'Floor / Wing'}</span>
                  <input
                    value={floorAr}
                    onChange={(e) => setFloorAr(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'وقت التعقيم (دقيقة)' : 'Turnover Buffer (min)'}</span>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={bufferMin}
                    onChange={(e) => setBufferMin(Number(e.target.value))}
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
                  {isAr ? 'حفظ الغرفة' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
