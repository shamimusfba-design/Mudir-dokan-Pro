import React, { useEffect, useMemo, useState } from 'react';
import { Sliders, X, Search, Check, Save, RotateCcw, AlertTriangle, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { D, money, formatBDT, formatDateTimeDhaka, formatQty } from '../lib/decimal';
import { tr, trCompact, tx, formatStatusLabel, formatUnitLabel, formatVariant } from '../lib/i18n';
import { BrandLogo, ProductImage } from '../components/ProductMedia';
import { matchesBanglishQuery } from '../lib/search-banglish';

interface RowEditState {
  isAdd: boolean;
  qty: string;
  rate: string;
}

export const InventoryPage: React.FC = () => {
  const { products, categories, brands, lang, staff, refreshCatalog } = useApp();
  const [tab, setTab] = useState<'stock' | 'low' | 'movements'>('stock');
  const [movements, setMovements] = useState<any[]>([]);
  const [valuation, setValuation] = useState<{ totalCostValue: string; totalRetailValue: string; totalSkus: number } | null>(
    null
  );

  // Single unified Bulk Stock Adjustment / Quick Receiving Mode
  const [quickAdjustMode, setQuickAdjustMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<number | 'ALL'>('ALL');
  const [savingRows, setSavingRows] = useState<Record<number, boolean>>({});
  const [batchSaving, setBatchSaving] = useState(false);

  // Pending edits per product: productId -> { isAdd: boolean, qty: string, rate: string }
  const [pendingEdits, setPendingEdits] = useState<Record<number, RowEditState>>({});

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const loadMovements = async () => {
    try {
      const res = await apiFetch('/api/catalog/inventory/movements');
      setMovements(res.movements || []);
      setValuation(res.valuation || null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : tx(lang, 'Failed to load inventory movements', 'স্টক মুভমেন্ট লোড ব্যর্থ হয়েছে')
      );
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const lowProducts = useMemo(() => {
    return products.filter((p) => Number(p.currentStock) <= Number(p.minStock));
  }, [products]);

  // Filtered products list based on search (supports Banglish chal/dal/tel) & category
  const filteredProducts = useMemo(() => {
    const list = tab === 'low' ? lowProducts : products;
    const q = searchQuery.trim().toLowerCase();

    return list.filter((p) => {
      if (selectedCatFilter !== 'ALL' && p.categoryId !== selectedCatFilter) {
        return false;
      }
      if (q) {
        const b = p.brandId ? brandMap.get(p.brandId) : null;
        const c = catMap.get(p.categoryId);
        const corpus = `${p.name} ${p.nameBn} ${p.sku} ${p.barcode || ''} ${p.variant || ''} ${b?.name || ''} ${b?.nameBn || ''} ${c?.name || ''} ${c?.nameBn || ''}`.toLowerCase();
        if (!matchesBanglishQuery(corpus, q)) return false;
      }
      return true;
    });
  }, [tab, lowProducts, products, searchQuery, selectedCatFilter, brandMap, catMap]);

  // Row edit handler
  const handleEditChange = (productId: number, field: keyof RowEditState, value: any, defaultRate: string) => {
    setPendingEdits((prev) => {
      const current = prev[productId] || { isAdd: true, qty: '', rate: defaultRate };
      return {
        ...prev,
        [productId]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  // Single row save
  const handleSaveRow = async (p: (typeof products)[0]) => {
    const edit = pendingEdits[p.id];
    if (!edit || !edit.qty || Number(edit.qty) <= 0) {
      toast.error(tx(lang, 'Please enter a valid quantity', 'সঠিক পরিমাণ লিখুন'));
      return;
    }

    setSavingRows((prev) => ({ ...prev, [p.id]: true }));
    try {
      const qtyNum = Number(edit.qty);
      const isAdd = edit.isAdd;
      const rateStr = edit.rate && Number(edit.rate) > 0 ? money(edit.rate) : p.avgCostPrice;

      await apiFetch('/api/catalog/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: p.id,
          adjustmentType: isAdd ? 'INCREASE' : 'DECREASE',
          quantity: String(qtyNum),
          costPrice: rateStr,
          reason: isAdd ? 'সরাসরি ইনভেন্টরি স্টক ইন' : 'সরাসরি ইনভেন্টরি স্টক আউট / ক্ষতি',
        }),
      });

      const nextStock = isAdd ? Number(p.currentStock) + qtyNum : Math.max(0, Number(p.currentStock) - qtyNum);

      toast.success(
        tx(
          lang,
          `Updated ${p.name}: ${isAdd ? '+' : '-'}${qtyNum} ${p.baseUnit} (New Stock: ${nextStock})`,
          `${trCompact(p.name, p.nameBn, lang)}: ${isAdd ? '+' : '-'}${qtyNum} ${formatUnitLabel(p.baseUnit, lang)} সংরক্ষিত (নতুন মজুদ: ${nextStock})`
        )
      );

      // Clear this product's pending edit
      setPendingEdits((prev) => {
        const copy = { ...prev };
        delete copy[p.id];
        return copy;
      });

      await Promise.all([refreshCatalog(), loadMovements()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to save', 'সংরক্ষণ ব্যর্থ হয়েছে'));
    } finally {
      setSavingRows((prev) => ({ ...prev, [p.id]: false }));
    }
  };

  // Active modifications summary for the bottom batch action bar
  const activeEditsList = useMemo(() => {
    return Object.entries(pendingEdits)
      .map(([idStr, edit]) => {
        const id = Number(idStr);
        const prod = products.find((pr) => pr.id === id);
        const qtyNum = Number(edit.qty || 0);
        if (!prod || qtyNum <= 0) return null;
        const rateNum = Number(edit.rate || prod.avgCostPrice || 0);
        const val = qtyNum * rateNum;
        return {
          productId: id,
          product: prod,
          isAdd: edit.isAdd,
          qty: qtyNum,
          rate: rateNum,
          val: edit.isAdd ? val : -val,
        };
      })
      .filter(Boolean) as Array<{
      productId: number;
      product: (typeof products)[0];
      isAdd: boolean;
      qty: number;
      rate: number;
      val: number;
    }>;
  }, [pendingEdits, products]);

  const batchTotalAddedValue = useMemo(() => {
    return activeEditsList.reduce((sum, item) => sum + item.val, 0);
  }, [activeEditsList]);

  // Save All pending modifications
  const handleSaveAll = async () => {
    if (activeEditsList.length === 0) return;
    setBatchSaving(true);
    try {
      const payload = {
        adjustments: activeEditsList.map((item) => ({
          productId: item.productId,
          adjustmentType: item.isAdd ? 'INCREASE' : 'DECREASE',
          quantity: String(item.qty),
          costPrice: String(item.rate),
          reason: item.isAdd ? 'বাল্ক স্টক ইন' : 'বাল্ক স্টক আউট',
        })),
      };

      await apiFetch('/api/catalog/inventory/batch-adjust', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(
        tx(
          lang,
          `Successfully saved all ${activeEditsList.length} stock updates!`,
          `একসাথে ${activeEditsList.length}টি পণ্যের স্টক সফলভাবে আপডেট হয়েছে!`
        )
      );

      setPendingEdits({});
      await Promise.all([refreshCatalog(), loadMovements()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Batch save failed', 'বাল্ক সেভ ব্যর্থ হয়েছে'));
    } finally {
      setBatchSaving(false);
    }
  };

  const handleDiscardAll = () => {
    setPendingEdits({});
    toast.info(tx(lang, 'All pending changes discarded', 'সকল পরিবর্তন বাতিল করা হয়েছে'));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Page Title & Top Mode Toggle Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{tr('inventory', lang)}</span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {products.length} {tx(lang, 'SKUs', 'টি পণ্য')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Direct stock update, purchase cost rate & audit trail (No purchase order needed)',
              'সরাসরি ইনভেন্টরি থেকে স্টক যোগ/বিয়োগ, রেট ও মোট মূল্য আপডেট (পারচেজ অর্ডারের ঝামেলা ছাড়া)'
            )}
          </p>
        </div>

        {/* Primary Toggle: Bulk Stock Adjustment & Update Mode */}
        {staff?.role !== 'CASHIER' && (
          <button
            type="button"
            onClick={() => setQuickAdjustMode(!quickAdjustMode)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow-sm transition cursor-pointer ${
              quickAdjustMode
                ? 'bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/40 hover:bg-emerald-700'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>
              {quickAdjustMode
                ? tx(lang, '✓ Stock Adjustment Mode (Active)', '✓ সরাসরি স্টক অ্যাডজাস্টমেন্ট (সক্রিয়)')
                : tx(lang, '⚡ Direct Stock Adjustment Mode', '⚡ সরাসরি স্টক অ্যাডজাস্টমেন্ট চালু করুন')}
            </span>
          </button>
        )}
      </div>

      {/* Colorful Valuation Summary Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-4 text-white shadow-md shadow-indigo-500/20">
          <div className="text-xs font-semibold text-indigo-100">
            {tx(lang, 'Inventory Asset Value (Cost Rate)', 'মজুদ পণ্যের মোট ক্রয়মূল্য (খরচ)')}
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold">
            {staff?.role === 'CASHIER' ? tx(lang, 'Restricted', 'সীমাবদ্ধ') : formatBDT(valuation?.totalCostValue || 0)}
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow-md shadow-emerald-500/20">
          <div className="text-xs font-semibold text-emerald-100">
            {tx(lang, 'Estimated Retail Value', 'আনুমানিক বিক্রয় মূল্য')}
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold">
            {formatBDT(valuation?.totalRetailValue || 0)}
          </div>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-xs dark:border-orange-900/50 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {tx(lang, 'Low / Out-of-Stock SKUs', 'কম বা শূন্য স্টক পণ্য')}
          </div>
          <div className="mt-1 font-mono text-2xl font-extrabold text-orange-600">{lowProducts.length}</div>
        </div>
      </div>

      {/* Filter Strip & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              ['stock', tx(lang, `All Stock (${products.length})`, `সব পণ্য (${products.length})`)],
              ['low', tx(lang, `Low / Out (${lowProducts.length})`, `কম / শূন্য স্টক (${lowProducts.length})`)],
              ['movements', tx(lang, `Movement Ledger (${movements.length})`, `স্টক খাতা (${movements.length})`)],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tab === k ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Real-time Banglish & SKU Search Bar + Category Dropdown */}
        {tab !== 'movements' && (
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tx(
                  lang,
                  'Search (Banglish: chal, dal, tel, dudh, brand, SKU)...',
                  'পণ্য খুঁজুন (বাংলিশ: chal, dal, tel, dudh, ব্র্যান্ড, কোড)...'
                )}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="ALL">{tx(lang, 'All Categories', 'সকল ক্যাটাগরি')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {trCompact(c.name, c.nameBn, lang)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Stock Table */}
      {tab !== 'movements' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Product Details', '১. পণ্য ও বিবরণ')}</th>
                  <th className="px-3 py-3 text-right font-bold whitespace-nowrap">
                    {tx(lang, 'Present Stock', '২. বর্তমান মজুদ')}
                  </th>

                  {/* Dynamic Columns in Stock Adjustment Mode */}
                  {quickAdjustMode ? (
                    <>
                      <th className="px-3 py-3 font-bold min-w-[170px]">
                        {tx(lang, 'Add / Subtract Qty', '৩. যোগ / বিয়োগ পরিমাণ')}
                      </th>
                      <th className="px-3 py-3 font-bold min-w-[120px]">
                        {tx(lang, 'Cost Rate (৳)', '৪. ক্রয়মূল্য / রেট (৳)')}
                      </th>
                      <th className="px-3 py-3 text-right font-bold min-w-[120px]">
                        {tx(lang, 'Added Value (৳)', '৫. অতিরিক্ত মোট মূল্য')}
                      </th>
                      <th className="px-3 py-3 text-right font-bold min-w-[110px]">
                        {tx(lang, 'New Stock', '৬. নতুন মজুদ')}
                      </th>
                      <th className="px-4 py-3 text-center font-bold min-w-[80px]">
                        {tx(lang, 'Action', '৭. সেভ')}
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 font-bold">{tx(lang, 'SKU Code', 'কোড')}</th>
                      <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Min Stock', 'সর্বনিম্ন স্টক')}</th>
                      {staff?.role !== 'CASHIER' && (
                        <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Avg Cost Rate', 'গড় খরচ')}</th>
                      )}
                      {staff?.role !== 'CASHIER' && (
                        <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Asset Value', 'মোট মূল্য')}</th>
                      )}
                      <th className="px-4 py-3 font-bold">{tx(lang, 'Status', 'অবস্থা')}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={quickAdjustMode ? 7 : 7} className="px-4 py-12 text-center text-xs text-slate-400">
                      {tx(lang, 'No products found matching your search.', 'আপনার অনুসন্ধানে কোনো পণ্য পাওয়া যায়নি।')}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const currentQty = Number(p.currentStock);
                    const min = Number(p.minStock);
                    const cat = catMap.get(p.categoryId);
                    const br = p.brandId ? brandMap.get(p.brandId) : null;

                    const edit = pendingEdits[p.id] || { isAdd: true, qty: '', rate: p.avgCostPrice };
                    const enteredQtyNum = Number(edit.qty || 0);
                    const isRowEdited = enteredQtyNum > 0;
                    const effectiveRate = Number(edit.rate || p.avgCostPrice || 0);
                    const lineAddedValue = enteredQtyNum * effectiveRate;
                    const newCalculatedStock = edit.isAdd
                      ? currentQty + enteredQtyNum
                      : Math.max(0, currentQty - enteredQtyNum);

                    const isSaving = savingRows[p.id];

                    return (
                      <tr
                        key={p.id}
                        className={`transition ${
                          isRowEdited
                            ? 'bg-amber-50/50 dark:bg-amber-950/20'
                            : 'hover:bg-indigo-50/30 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Col 1: Product info */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <ProductImage
                              src={p.imageUrl}
                              sku={p.sku}
                              alt={p.name}
                              iconName={cat?.iconName}
                              accentColor={cat?.accentColor}
                              fallbackIndex={p.categoryId}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 dark:text-white truncate">
                                {trCompact(p.name, p.nameBn, lang)}{' '}
                                <span className="font-normal text-slate-500">({formatVariant(p.variant, lang)})</span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                                {br && <span className="font-semibold text-indigo-600 dark:text-indigo-400">{br.name}</span>}
                                {br && <span>·</span>}
                                <span className="font-mono">{p.sku}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Col 2: Present Stock */}
                        <td className="px-3 py-2.5 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              currentQty <= 0
                                ? 'text-rose-600'
                                : currentQty <= min
                                  ? 'text-orange-600'
                                  : 'text-slate-900 dark:text-white'
                            }
                          >
                            {formatQty(p.currentStock, lang)} {formatUnitLabel(p.baseUnit, lang)}
                          </span>
                        </td>

                        {/* Quick Adjustment Mode Columns */}
                        {quickAdjustMode ? (
                          <>
                            {/* Col 3: Add/Subtract Quantity */}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                {/* Left Side Minus Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentVal = Number(edit.qty) || 0;
                                    if (!edit.isAdd) {
                                      handleEditChange(p.id, 'qty', String(currentVal + 1), p.avgCostPrice);
                                    } else {
                                      handleEditChange(p.id, 'isAdd', false, p.avgCostPrice);
                                      handleEditChange(p.id, 'qty', String(currentVal > 0 ? currentVal : 1), p.avgCostPrice);
                                    }
                                  }}
                                  title="মজুদ কমান (বিয়োগ করুন)"
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-sm transition cursor-pointer ${
                                    !edit.isAdd
                                      ? 'bg-rose-600 text-white shadow-2xs hover:bg-rose-700'
                                      : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  −
                                </button>

                                {/* Number Input with Mode Indicator */}
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    placeholder="0"
                                    value={edit.qty}
                                    onChange={(e) => handleEditChange(p.id, 'qty', e.target.value, p.avgCostPrice)}
                                    className={`w-16 rounded-lg border px-2 py-1 text-center font-mono text-xs font-black shadow-2xs focus:outline-hidden transition ${
                                      edit.isAdd
                                        ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 focus:border-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                                        : 'border-rose-300 bg-rose-50/50 text-rose-950 focus:border-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                                    }`}
                                  />
                                </div>

                                {/* Right Side Plus Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentVal = Number(edit.qty) || 0;
                                    if (edit.isAdd) {
                                      handleEditChange(p.id, 'qty', String(currentVal + 1), p.avgCostPrice);
                                    } else {
                                      handleEditChange(p.id, 'isAdd', true, p.avgCostPrice);
                                      handleEditChange(p.id, 'qty', String(currentVal > 0 ? currentVal : 1), p.avgCostPrice);
                                    }
                                  }}
                                  title="মজুদ বাড়ান (যোগ করুন)"
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-sm transition cursor-pointer ${
                                    edit.isAdd
                                      ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                      : 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  +
                                </button>

                                <span className="text-[10px] text-slate-400 font-medium">
                                  {formatUnitLabel(p.baseUnit, lang)}
                                </span>
                              </div>
                            </td>

                            {/* Col 4: Purchase Cost Rate */}
                            <td className="px-3 py-2.5">
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-[10px]">
                                  ৳
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={edit.rate}
                                  onChange={(e) => handleEditChange(p.id, 'rate', e.target.value, p.avgCostPrice)}
                                  className="w-24 rounded-lg border border-slate-200 bg-white py-1 pl-5 pr-2 text-right font-mono text-xs font-semibold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                              </div>
                            </td>

                            {/* Col 5: Total Added Value */}
                            <td className="px-3 py-2.5 text-right font-mono font-bold whitespace-nowrap">
                              {isRowEdited ? (
                                <span className={edit.isAdd ? 'text-emerald-600' : 'text-rose-600'}>
                                  {edit.isAdd ? '+' : '−'}
                                  {formatBDT(lineAddedValue)}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600">—</span>
                              )}
                            </td>

                            {/* Col 6: New Stock Balance */}
                            <td className="px-3 py-2.5 text-right font-mono font-black whitespace-nowrap">
                              {isRowEdited ? (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-xs ${
                                    edit.isAdd
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  }`}
                                >
                                  {formatQty(newCalculatedStock, lang)} {formatUnitLabel(p.baseUnit, lang)}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">
                                  {formatQty(p.currentStock, lang)} {formatUnitLabel(p.baseUnit, lang)}
                                </span>
                              )}
                            </td>

                            {/* Col 7: Save Button */}
                            <td className="px-4 py-2.5 text-center">
                              <button
                                type="button"
                                disabled={!isRowEdited || isSaving}
                                onClick={() => handleSaveRow(p)}
                                title={tx(lang, 'Save Stock Update', 'স্টক সংরক্ষণ করুন')}
                                className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs cursor-pointer ${
                                  isRowEdited
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse'
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                                }`}
                              >
                                <Save className="h-3.5 w-3.5 mr-1" />
                                <span>{tx(lang, 'Save', 'সেভ')}</span>
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{p.sku}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatQty(p.minStock)}</td>
                            {staff?.role !== 'CASHIER' && (
                              <td className="px-4 py-2.5 text-right font-mono">{formatBDT(p.avgCostPrice)}</td>
                            )}
                            {staff?.role !== 'CASHIER' && (
                              <td className="px-4 py-2.5 text-right font-mono font-bold">
                                {formatBDT(Math.max(0, currentQty) * Number(p.avgCostPrice))}
                              </td>
                            )}
                            <td
                              className={`px-4 py-2.5 font-bold ${
                                currentQty <= 0 ? 'text-rose-600' : currentQty <= min ? 'text-orange-600' : 'text-emerald-600'
                              }`}
                            >
                              {currentQty <= 0
                                ? tx(lang, 'Out of Stock', 'স্টক শেষ')
                                : currentQty <= min
                                  ? tx(lang, 'Low Stock', 'কম স্টক')
                                  : tx(lang, 'In Stock', 'মজুদ আছে')}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Movement Audit Trail Ledger */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Date & Time', 'তারিখ ও সময়')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Product', 'পণ্য')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Type', 'ধরন')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Qty Change', 'পরিবর্তন')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Balance After', 'পরবর্তী মজুদ')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Notes', 'মন্তব্য')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-xs text-slate-400">
                      {tx(lang, 'No stock movements recorded yet.', 'এখনো কোনো স্টক মুভমেন্ট রেকর্ড হয়নি।')}
                    </td>
                  </tr>
                ) : (
                  movements.map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateTimeDhaka(m.createdAt)}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {trCompact(m.productName, m.productNameBn, lang)} ({m.variant})
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                        {formatStatusLabel(m.type, lang)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono font-bold ${
                          String(m.quantityChange).startsWith('-') ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {m.quantityChange}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">
                        {formatQty(m.balanceAfter)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.reason || m.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Bottom Sticky Batch Action Bar (নিচে সেভ বাটন) */}
      {quickAdjustMode && activeEditsList.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl rounded-2xl border-2 border-emerald-500 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md dark:bg-slate-900/95 dark:border-emerald-600 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-sm">
              {activeEditsList.length}
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {tx(
                  lang,
                  `${activeEditsList.length} products ready for stock adjustment`,
                  `${activeEditsList.length}টি পণ্যের স্টক পরিবর্তন প্রস্তুত`
                )}
              </div>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {tx(lang, 'Total Value Impact:', 'মোট ক্রয়মূল্য যোগ:')} {batchTotalAddedValue >= 0 ? '+' : ''}
                {formatBDT(batchTotalAddedValue)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardAll}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{tx(lang, 'Discard', 'বাতিল')}</span>
            </button>
            <button
              type="button"
              disabled={batchSaving}
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-extrabold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{batchSaving ? tx(lang, 'Saving...', 'সংরক্ষণ হচ্ছে...') : tx(lang, 'Save All Changes (একসাথে সেভ)', 'সবগুলো একসাথে সেভ করুন')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
