import React, { useEffect, useMemo, useState } from 'react';
import { Sliders, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateTimeDhaka, formatQty } from '../lib/decimal';
import { tr, trCompact, tx, formatStatusLabel, formatUnitLabel } from '../lib/i18n';
import { BrandLogo, ProductImage } from '../components/ProductMedia';

export const InventoryPage: React.FC = () => {
  const { products, categories, brands, lang, staff, refreshCatalog } = useApp();
  const [tab, setTab] = useState<'stock' | 'low' | 'movements'>('stock');
  const [movements, setMovements] = useState<any[]>([]);
  const [valuation, setValuation] = useState<{ totalCostValue: string; totalRetailValue: string; totalSkus: number } | null>(
    null
  );
  const [showAdj, setShowAdj] = useState(false);
  const [adjForm, setAdjForm] = useState({
    productId: products[0]?.id || 0,
    adjustmentType: 'INCREASE' as 'INCREASE' | 'DECREASE' | 'DAMAGE' | 'EXPIRED',
    quantity: '',
    reason: '',
  });

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

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/catalog/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: Number(adjForm.productId),
          adjustmentType: adjForm.adjustmentType,
          quantity: adjForm.quantity,
          reason: adjForm.reason,
        }),
      });
      toast.success(tx(lang, 'Stock adjustment recorded', 'স্টক সমন্বয় সংরক্ষিত হয়েছে'));
      setShowAdj(false);
      setAdjForm({ productId: products[0]?.id || 0, adjustmentType: 'INCREASE', quantity: '', reason: '' });
      await Promise.all([refreshCatalog(), loadMovements()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Adjustment failed', 'স্টক সমন্বয় ব্যর্থ হয়েছে'));
    }
  };

  const lowProducts = products.filter((p) => Number(p.currentStock) <= Number(p.minStock));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{tr('inventory', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Weighted-Average Inventory Valuation & Stock Movement Audit Trail',
              'গড় ক্রয়মূল্যে মজুদ মূল্যায়ন এবং স্টক লেনদেনের ইতিহাস'
            )}
          </p>
        </div>
        {staff?.role !== 'CASHIER' && (
          <button
            type="button"
            onClick={() => {
              setAdjForm((f) => ({ ...f, productId: products[0]?.id || 0 }));
              setShowAdj(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:from-indigo-700 hover:to-blue-700 cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5" />
            {trCompact('Stock Adjustment / Damage', 'স্টক সমন্বয় / ক্ষতি', lang)}
          </button>
        )}
      </div>

      {/* Colorful Valuation Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-4 text-white shadow-md shadow-indigo-500/20">
          <div className="text-xs font-semibold text-indigo-100">
            {tx(lang, 'Inventory Asset Value (Weighted Avg Cost)', 'মজুদ পণ্যের ক্রয়মূল্য (গড় খরচ)')}
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

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        {(
          [
            ['stock', tx(lang, `Current Stock (${products.length})`, `বর্তমান মজুদ (${products.length})`)],
            ['low', tx(lang, `Low / Out of Stock (${lowProducts.length})`, `কম / শূন্য স্টক (${lowProducts.length})`)],
            ['movements', tx(lang, `Stock Movement Ledger (${movements.length})`, `স্টক মুভমেন্ট লেজার (${movements.length})`)],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              tab === k ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== 'movements' ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Product', 'পণ্য')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'SKU', 'কোড')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'On Hand', 'বর্তমান মজুদ')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Min Stock', 'সর্বনিম্ন স্টক')}</th>
                  {staff?.role !== 'CASHIER' && (
                    <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Avg Cost', 'গড় খরচ')}</th>
                  )}
                  {staff?.role !== 'CASHIER' && (
                    <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Asset Value', 'মোট মূল্য')}</th>
                  )}
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Expiry', 'মেয়াদ')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Status', 'অবস্থা')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(tab === 'low' ? lowProducts : products).map((p) => {
                  const qty = Number(p.currentStock);
                  const min = Number(p.minStock);
                  const cat = catMap.get(p.categoryId);
                  const br = p.brandId ? brandMap.get(p.brandId) : null;
                  const status =
                    qty <= 0
                      ? tx(lang, 'Out of Stock', 'স্টক শেষ')
                      : qty <= min
                        ? tx(lang, 'Low Stock', 'কম স্টক')
                        : tx(lang, 'In Stock', 'মজুদ আছে');
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={p.imageUrl}
                            alt={p.name}
                            iconName={cat?.iconName}
                            accentColor={cat?.accentColor}
                            fallbackIndex={p.categoryId}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {trCompact(p.name, p.nameBn, lang)}{' '}
                              <span className="font-normal text-slate-500">({p.variant})</span>
                            </div>
                            {br && (
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <BrandLogo logoUrl={br.logoUrl} name={br.name} brandColor={br.brandColor} size="xs" />
                                <span className="text-[10px] text-slate-500">{trCompact(br.name, br.nameBn, lang)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{p.sku}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold">
                        {formatQty(p.currentStock)} {formatUnitLabel(p.baseUnit, lang)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatQty(p.minStock)}</td>
                      {staff?.role !== 'CASHIER' && (
                        <td className="px-4 py-2.5 text-right font-mono">{formatBDT(p.avgCostPrice)}</td>
                      )}
                      {staff?.role !== 'CASHIER' && (
                        <td className="px-4 py-2.5 text-right font-mono font-bold">
                          {formatBDT(Math.max(0, qty) * Number(p.avgCostPrice))}
                        </td>
                      )}
                      <td className="px-4 py-2.5 font-mono text-slate-500">{p.expiryDate || '—'}</td>
                      <td
                        className={`px-4 py-2.5 font-bold ${
                          qty <= 0 ? 'text-rose-600' : qty <= min ? 'text-orange-600' : 'text-emerald-600'
                        }`}
                      >
                        {status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
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
                {movements.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateTimeDhaka(m.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <ProductImage src={m.imageUrl} alt={m.productName} fallbackIndex={idx} size="xs" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          {m.productName} ({m.variant})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {formatStatusLabel(m.movementType, lang)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-bold ${
                        Number(m.quantityDelta) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {Number(m.quantityDelta) >= 0 ? '+' : ''}
                      {formatQty(m.quantityDelta)} {formatUnitLabel(m.baseUnit, lang)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatQty(m.balanceAfter)} {formatUnitLabel(m.baseUnit, lang)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleAdjust}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">{tx(lang, 'Record Stock Adjustment', 'স্টক সমন্বয় রেকর্ড করুন')}</h3>
              <button type="button" onClick={() => setShowAdj(false)} className="text-slate-400 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Product', 'পণ্য')}
                </label>
                <select
                  value={adjForm.productId}
                  onChange={(e) => setAdjForm({ ...adjForm, productId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {trCompact(p.name, p.nameBn, lang)} ({p.variant}) — {tx(lang, 'Stock:', 'মজুদ:')}{' '}
                      {formatQty(p.currentStock)} {formatUnitLabel(p.baseUnit, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {tx(lang, 'Adjustment Type', 'সমন্বয়ের ধরন')}
                  </label>
                  <select
                    value={adjForm.adjustmentType}
                    onChange={(e) =>
                      setAdjForm({
                        ...adjForm,
                        adjustmentType: e.target.value as 'INCREASE' | 'DECREASE' | 'DAMAGE' | 'EXPIRED',
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="INCREASE">{tx(lang, 'Stock-In / Increase', 'স্টক বৃদ্ধি')}</option>
                    <option value="DECREASE">{tx(lang, 'Audit Decrease', 'স্টক হ্রাস')}</option>
                    <option value="DAMAGE">{tx(lang, 'Damaged / Broken', 'নষ্ট / ভাঙা')}</option>
                    <option value="EXPIRED">{tx(lang, 'Expired Write-Off', 'মেয়াদোত্তীর্ণ বাদ')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {tx(lang, 'Quantity (Base Unit)', 'পরিমাণ (মূল একক)')}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Reason / Audit Note *', 'কারণ / নোট *')}
                </label>
                <input
                  required
                  placeholder={tx(lang, 'e.g., 2 bottles leaked during unloading', 'যেমন: আনলোড করার সময় ২ বোতল ভেঙে গেছে')}
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdj(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700 cursor-pointer"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                {tx(lang, 'Commit Adjustment', 'সমন্বয় সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
