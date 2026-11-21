import React, { useEffect, useState } from 'react';
import { Sliders, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateTimeDhaka, formatQty } from '../lib/decimal';
import { tr, trCompact, tx, formatStatusLabel, formatUnitLabel } from '../lib/i18n';

export const InventoryPage: React.FC = () => {
  const { products, lang, staff, refreshCatalog } = useApp();
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('inventory', lang)}</h1>
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5" />
            {trCompact('Stock Adjustment / Damage', 'স্টক সমন্বয় / ক্ষতি', lang)}
          </button>
        )}
      </div>

      {/* Valuation Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">
            {tx(lang, 'Inventory Asset Value (Weighted Avg Cost)', 'মজুদ পণ্যের ক্রয়মূল্য (গড় খরচ)')}
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white">
            {staff?.role === 'CASHIER' ? tx(lang, 'Restricted', 'সীমাবদ্ধ') : formatBDT(valuation?.totalCostValue || 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">{tx(lang, 'Estimated Retail Value', 'আনুমানিক বিক্রয় মূল্য')}</div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatBDT(valuation?.totalRetailValue || 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">{tx(lang, 'Low / Out-of-Stock SKUs', 'কম বা শূন্য স্টক পণ্য')}</div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-600">{lowProducts.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit dark:border-slate-800 dark:bg-slate-900">
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
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              tab === k ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== 'movements' ? (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'SKU', 'কোড')}</th>
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Product', 'পণ্য')}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'On Hand', 'বর্তমান মজুদ')}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Min Stock', 'সর্বনিম্ন স্টক')}</th>
                  {staff?.role !== 'CASHIER' && (
                    <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Avg Cost', 'গড় খরচ')}</th>
                  )}
                  {staff?.role !== 'CASHIER' && (
                    <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Asset Value', 'মোট মূল্য')}</th>
                  )}
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Expiry', 'মেয়াদ')}</th>
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Status', 'অবস্থা')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(tab === 'low' ? lowProducts : products).map((p) => {
                  const qty = Number(p.currentStock);
                  const min = Number(p.minStock);
                  const status =
                    qty <= 0
                      ? tx(lang, 'Out of Stock', 'স্টক শেষ')
                      : qty <= min
                        ? tx(lang, 'Low Stock', 'কম স্টক')
                        : tx(lang, 'In Stock', 'মজুদ আছে');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{p.sku}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                        {trCompact(p.name, p.nameBn, lang)} <span className="text-slate-500">({p.variant})</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        {formatQty(p.currentStock)} {formatUnitLabel(p.baseUnit, lang)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatQty(p.minStock)}</td>
                      {staff?.role !== 'CASHIER' && (
                        <td className="px-4 py-2.5 text-right font-mono">{formatBDT(p.avgCostPrice)}</td>
                      )}
                      {staff?.role !== 'CASHIER' && (
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">
                          {formatBDT(Math.max(0, qty) * Number(p.avgCostPrice))}
                        </td>
                      )}
                      <td className="px-4 py-2.5 font-mono text-slate-500">{p.expiryDate || '—'}</td>
                      <td
                        className={`px-4 py-2.5 font-semibold ${
                          qty <= 0 ? 'text-red-600' : qty <= min ? 'text-amber-600' : 'text-emerald-700'
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
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Date & Time', 'তারিখ ও সময়')}</th>
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Product', 'পণ্য')}</th>
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Type', 'ধরন')}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Qty Change', 'পরিবর্তন')}</th>
                  <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Balance After', 'পরবর্তী মজুদ')}</th>
                  <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Notes', 'মন্তব্য')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateTimeDhaka(m.createdAt)}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {m.productName} ({m.variant})
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {formatStatusLabel(m.movementType, lang)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-semibold ${
                        Number(m.quantityDelta) >= 0 ? 'text-emerald-700' : 'text-red-600'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAdjust}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{tx(lang, 'Record Stock Adjustment', 'স্টক সমন্বয় রেকর্ড করুন')}</h3>
              <button type="button" onClick={() => setShowAdj(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Product', 'পণ্য')}
                </label>
                <select
                  value={adjForm.productId}
                  onChange={(e) => setAdjForm({ ...adjForm, productId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
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
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
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
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="INCREASE">{tx(lang, 'Stock-In / Increase', 'স্টক বৃদ্ধি')}</option>
                    <option value="DECREASE">{tx(lang, 'Audit Decrease', 'স্টক হ্রাস')}</option>
                    <option value="DAMAGE">{tx(lang, 'Damaged / Broken', 'নষ্ট / ভাঙা')}</option>
                    <option value="EXPIRED">{tx(lang, 'Expired Write-Off', 'মেয়াদোত্তীর্ণ বাদ')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {tx(lang, 'Quantity (Base Unit)', 'পরিমাণ (মূল একক)')}
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={adjForm.quantity}
                    onChange={(e) => setAdjForm({ ...adjForm, quantity: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Reason / Audit Note *', 'কারণ / নোট *')}
                </label>
                <input
                  required
                  placeholder={tx(lang, 'e.g., 2 bottles leaked during unloading', 'যেমন: আনলোড করার সময় ২ বোতল ভেঙে গেছে')}
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdj(false)} className="rounded-lg border px-4 py-2 text-xs">
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                {tx(lang, 'Commit Adjustment', 'সমন্বয় সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
