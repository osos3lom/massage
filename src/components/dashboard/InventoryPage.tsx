'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Barcode,
  Boxes,
  CheckCircle2,
  Minus,
  PackagePlus,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { currencyLabel } from '@/i18n/config';
import { usePhase34Store, type InventoryProduct } from '@/data/phase34Store';
import { fmtNumber } from './format';
import { useDashboard } from './useDashboard';

type StockFilter = 'all' | 'low' | 'oils' | 'hammam' | 'pedicure' | 'retail';

const CAT_LABEL: Record<InventoryProduct['category'], { ar: string; en: string }> = {
  oils: { ar: 'زيوت مساج وعطور', en: 'Massage Oils' },
  hammam: { ar: 'مستلزمات الحمام المغربي', en: 'Moroccan Hammam' },
  pedicure: { ar: 'مستلزمات البديكير', en: 'Pedicure Care' },
  retail: { ar: 'مبيعات التجزئة للعملاء', en: 'Client Retail' },
};

export default function InventoryPage() {
  const { lang } = useDashboard();
  const cur = currencyLabel(lang);
  const isAr = lang === 'ar';
  const { products, adjustProductStock, addInventoryProduct } = usePhase34Store();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add Product form state
  const [sku, setSku] = useState('OIL-EUC-1L');
  const [barcode, setBarcode] = useState('6281000491081');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<InventoryProduct['category']>('oils');
  const [costSar, setCostSar] = useState(60);
  const [priceSar, setPriceSar] = useState(130);
  const [stockQty, setStockQty] = useState(15);
  const [reorderLevel, setReorderLevel] = useState(5);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === 'low' && p.stockQty > p.reorderLevel) return false;
      if (filter !== 'all' && filter !== 'low' && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    });
  }, [products, query, filter]);

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.stockQty <= p.reorderLevel).length;
    const totalCostValue = products.reduce((s, p) => s + p.costSar * p.stockQty, 0);
    const totalRetailValue = products.reduce((s, p) => s + p.priceSar * p.stockQty, 0);
    const totalUnits = products.reduce((s, p) => s + p.stockQty, 0);
    return { lowStock, totalCostValue, totalRetailValue, totalUnits };
  }, [products]);

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() && !nameEn.trim()) return;
    addInventoryProduct({
      sku: sku.trim() || 'SKU-NEW',
      barcode: barcode.trim() || '6281000000000',
      nameAr: nameAr.trim() || nameEn.trim(),
      nameEn: nameEn.trim() || nameAr.trim(),
      category,
      unitAr: 'عبوة',
      unitEn: 'Unit',
      costSar: Number(costSar) || 50,
      priceSar: Number(priceSar) || 100,
      stockQty: Number(stockQty) || 10,
      reorderLevel: Number(reorderLevel) || 5,
      supplierAr: 'مؤسسة خيرات أطلس للمنتجات الطبيعية',
      supplierEn: 'Atlas Botanicals KSA',
      isActive: true,
    });
    setNameAr('');
    setNameEn('');
    setShowAdd(false);
    notify(isAr ? 'تمت إضافة الصنف إلى المخزون' : 'Product added to inventory');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-aura-primary px-3 py-1 text-xs font-medium text-aura-accent">
            <Boxes className="w-3.5 h-3.5" />
            {isAr ? 'المخزون ومستلزمات الجلسات والتجزئة · المرحلة 4' : 'Inventory, Back-Bar & Retail Stock · Phase 4'}
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-aura-text mt-2">
            {isAr ? 'إدارة المخزون والمنتجات' : 'Inventory & Spa Supplies'}
          </h1>
          <p className="text-sm text-aura-muted mt-0.5">
            {isAr
              ? 'متابعة أرصدة الزيوت العطرية، الصابون البلدي المغربي، الليف المغلفة، شمع البارافين، وتنبيهات إعادة الطلب.'
              : 'Track organic massage oils, Moroccan black soap, kessa gloves, paraffin wax, and low-stock reorder alerts.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-aura-accent hover:bg-aura-accent-hover text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة صنف جديد' : 'Add Product'}
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
          <p className="text-xs text-aura-muted">{isAr ? 'إجمالي الوحدات بالمخزن' : 'Total Stock Units'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtNumber(stats.totalUnits, lang)}
          </p>
          <p className="mt-1 text-xs text-aura-muted">
            {products.length} {isAr ? 'أصناف مسجلة (products)' : 'SKUs in products table'}
          </p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'أصناف تحت حد إعادة الطلب' : 'Low Stock Alerts'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-warning">
            {stats.lowStock}
          </p>
          <p className="mt-1 text-xs text-aura-muted">
            {isAr ? 'تحتاج أمر شراء للمورد' : 'Below reorder_level threshold'}
          </p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'تكلفة المخزون الحالية' : 'Inventory Cost Valuation'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums">
            {fmtNumber(stats.totalCostValue, lang)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'بسعر الشراء من المورد' : 'At unit purchase cost'}</p>
        </div>

        <div className="rounded-3xl bg-aura-surface border border-aura-border p-4 sm:p-5">
          <p className="text-xs text-aura-muted">{isAr ? 'القيمة البيعية التقديرية' : 'Retail Value'}</p>
          <p className="mt-2 font-serif text-2xl sm:text-3xl tabular-nums text-aura-success">
            {fmtNumber(stats.totalRetailValue, lang)} <span className="text-sm font-sans text-aura-muted">{cur}</span>
          </p>
          <p className="mt-1 text-xs text-aura-muted">{isAr ? 'شامل ضريبة 15%' : 'Including 15% VAT'}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-aura-surface border border-aura-border p-3 sm:p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-aura-muted pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث باسم الصنف، رقم الباركود (628...)، أو SKU...'
                : 'Search by product name, barcode (628...), or SKU...'
            }
            className="w-full h-10 rounded-full bg-aura-bg border border-aura-border ps-10 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-aura-accent/30"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { key: 'all', ar: 'كل الأصناف', en: 'All' },
              { key: 'low', ar: `نواقص المخزون (${stats.lowStock})`, en: `Low Stock (${stats.lowStock})` },
              { key: 'oils', ar: 'الزيوت العطرية', en: 'Oils' },
              { key: 'hammam', ar: 'الحمام المغربي', en: 'Hammam' },
              { key: 'pedicure', ar: 'البديكير', en: 'Pedicure' },
              { key: 'retail', ar: 'التجزئة', en: 'Retail' },
            ] as const
          ).map((tItem) => (
            <button
              key={tItem.key}
              type="button"
              onClick={() => setFilter(tItem.key)}
              className={`h-9 px-3.5 rounded-full text-xs font-medium transition-colors ${
                filter === tItem.key
                  ? 'bg-aura-text text-white'
                  : 'bg-aura-bg text-aura-muted hover:text-aura-text border border-aura-border'
              }`}
            >
              {isAr ? tItem.ar : tItem.en}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-3xl bg-aura-surface border border-aura-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-aura-border bg-aura-bg/60 text-xs text-aura-muted">
                <th className="text-start font-medium py-3.5 px-4">{isAr ? 'الصنف والباركود' : 'Product & Barcode'}</th>
                <th className="text-start font-medium py-3.5 px-4">{isAr ? 'القسم والمورد' : 'Category & Supplier'}</th>
                <th className="text-end font-medium py-3.5 px-4">{isAr ? 'التكلفة / البيع' : 'Cost / Price'}</th>
                <th className="text-center font-medium py-3.5 px-4">{isAr ? 'الرصيد الحالي' : 'Stock Qty'}</th>
                <th className="text-end font-medium py-3.5 px-4">{isAr ? 'حركة مخزنية سريعة' : 'Quick Adjust'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aura-border">
              {filtered.map((p) => {
                const isLow = p.stockQty <= p.reorderLevel;
                return (
                  <tr key={p.id} className="hover:bg-aura-bg/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-aura-text">{isAr ? p.nameAr : p.nameEn}</p>
                      <p className="text-xs text-aura-muted font-mono inline-flex items-center gap-1.5 mt-0.5" dir="ltr">
                        <Barcode className="w-3.5 h-3.5 text-aura-accent" />
                        {p.sku} · {p.barcode}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-full bg-aura-bg border border-aura-border px-2.5 py-0.5 text-[11px] font-medium">
                        {CAT_LABEL[p.category][lang]}
                      </span>
                      <p className="text-xs text-aura-muted mt-1">
                        {isAr ? p.supplierAr : p.supplierEn}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-end tabular-nums">
                      <p className="font-semibold text-aura-text">
                        {p.priceSar} {cur}
                      </p>
                      <p className="text-xs text-aura-muted">
                        {isAr ? `التكلفة ${p.costSar} ${cur}` : `Cost ${p.costSar} ${cur}`}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center tabular-nums">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold ${
                            isLow
                              ? 'bg-aura-warning-bg text-aura-warning'
                              : 'bg-aura-success-bg text-aura-success'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3" />}
                          {p.stockQty} {isAr ? p.unitAr : p.unitEn}
                        </span>
                        <span className="text-[10px] text-aura-muted mt-0.5">
                          {isAr ? `حد الطلب: ${p.reorderLevel}` : `Reorder: ${p.reorderLevel}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            adjustProductStock(p.id, -1);
                            notify(
                              isAr
                                ? `تم صرف 1 (${p.nameAr}) للاستهلاك الداخلي`
                                : `Consumed 1 unit of ${p.nameEn}`
                            );
                          }}
                          className="h-8 px-2.5 rounded-xl bg-aura-bg border border-aura-border text-xs font-medium hover:border-aura-danger/50"
                          title={isAr ? 'صرف استهلاك (-1)' : 'Consume (-1)'}
                        >
                          <Minus className="inline w-3 h-3 me-0.5" />1
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            adjustProductStock(p.id, 5);
                            notify(
                              isAr
                                ? `تمت إضافة +5 وحدات إلى رصيد (${p.nameAr})`
                                : `Received +5 units of ${p.nameEn}`
                            );
                          }}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-xl bg-aura-primary text-aura-accent hover:bg-aura-accent hover:text-white text-xs font-semibold transition-colors"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          +5 {isAr ? 'توريد' : 'Restock'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-aura-text/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-aura-surface border border-aura-border p-6 shadow-premium space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{isAr ? 'إضافة صنف مخزني جديد' : 'Add Inventory Product'}</h2>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="p-2 rounded-full text-aura-muted hover:bg-aura-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">SKU</span>
                  <input
                    dir="ltr"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm font-mono"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'الباركود' : 'Barcode'}</span>
                  <input
                    dir="ltr"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm font-mono"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اسم الصنف (عربي)' : 'Name (Arabic)'}</span>
                <input
                  required
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: زيت الأوكالبتوس العطري للبخار (1 لتر)"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'اسم الصنف (إنجليزي)' : 'Name (English)'}</span>
                <input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Eucalyptus Steam Essential Oil (1L)"
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-aura-muted">{isAr ? 'التصنيف' : 'Category'}</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InventoryProduct['category'])}
                  className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                >
                  <option value="oils">{CAT_LABEL.oils[lang]}</option>
                  <option value="hammam">{CAT_LABEL.hammam[lang]}</option>
                  <option value="pedicure">{CAT_LABEL.pedicure[lang]}</option>
                  <option value="retail">{CAT_LABEL.retail[lang]}</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'سعر التكلفة' : 'Unit Cost'}</span>
                  <input
                    type="number"
                    value={costSar}
                    onChange={(e) => setCostSar(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'سعر البيع' : 'Retail Price'}</span>
                  <input
                    type="number"
                    value={priceSar}
                    onChange={(e) => setPriceSar(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'الكمية الافتتاحية' : 'Initial Qty'}</span>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full h-10 rounded-xl bg-aura-bg border border-aura-border px-3 text-sm"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-aura-muted">{isAr ? 'حد إعادة الطلب' : 'Reorder Level'}</span>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
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
                  {isAr ? 'حفظ الصنف' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
