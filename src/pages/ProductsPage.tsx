import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Layers, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { BD_UNITS, formatBDT, formatQty } from '../lib/decimal';
import { tr, trCompact, tx, formatUnitLabel } from '../lib/i18n';
import type { CachedProduct } from '../lib/offline-db';

export const ProductsPage: React.FC = () => {
  const { products, categories, brands, lang, staff, refreshCatalog } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');

  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProd, setEditingProd] = useState<CachedProduct | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  const [catForm, setCatForm] = useState({ name: '', nameBn: '' });
  const [brandForm, setBrandForm] = useState({ name: '', nameBn: '', company: '' });

  const emptyForm = {
    categoryId: categories[0]?.id || 1,
    brandId: '' as string | number,
    sku: '',
    barcode: '',
    name: '',
    nameBn: '',
    variant: 'Standard',
    baseUnit: 'Piece',
    allowDecimalQty: false,
    avgCostPrice: '0',
    sellingPrice: '0',
    currentStock: '0',
    minStock: '5',
    expiryDate: '',
    isFrequent: false,
    packUnitName: '',
    packFactor: '',
  };
  const [form, setForm] = useState(emptyForm);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'ALL' && String(p.categoryId) !== catFilter) return false;
      if (brandFilter !== 'ALL' && String(p.brandId || '') !== brandFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameBn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q)
      );
    });
  }, [products, search, catFilter, brandFilter]);

  const openCreate = () => {
    setEditingProd(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || 1 });
    setShowProdModal(true);
  };

  const openEdit = (p: CachedProduct) => {
    setEditingProd(p);
    const firstPack = p.units?.[0];
    setForm({
      categoryId: p.categoryId,
      brandId: p.brandId ?? '',
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      nameBn: p.nameBn || '',
      variant: p.variant,
      baseUnit: p.baseUnit,
      allowDecimalQty: p.allowDecimalQty,
      avgCostPrice: p.avgCostPrice,
      sellingPrice: p.sellingPrice,
      currentStock: p.currentStock,
      minStock: p.minStock,
      expiryDate: p.expiryDate || '',
      isFrequent: p.isFrequent,
      packUnitName: firstPack?.unitName || '',
      packFactor: firstPack ? formatQty(firstPack.conversionFactor) : '',
    });
    setShowProdModal(true);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const units =
      form.packUnitName && Number(form.packFactor) > 1
        ? [{ unitName: form.packUnitName, conversionFactor: form.packFactor, isPurchaseDefault: true }]
        : [];
    const payload = {
      categoryId: Number(form.categoryId),
      brandId: form.brandId ? Number(form.brandId) : null,
      sku: form.sku,
      barcode: form.barcode,
      name: form.name,
      nameBn: form.nameBn,
      variant: form.variant,
      baseUnit: form.baseUnit,
      allowDecimalQty: form.allowDecimalQty,
      avgCostPrice: form.avgCostPrice,
      sellingPrice: form.sellingPrice,
      currentStock: form.currentStock,
      minStock: form.minStock,
      expiryDate: form.expiryDate || null,
      isFrequent: form.isFrequent,
      units,
    };

    try {
      if (editingProd) {
        await apiFetch(`/api/catalog/products/${editingProd.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success(tx(lang, 'Product updated', 'পণ্য আপডেট হয়েছে'));
      } else {
        await apiFetch('/api/catalog/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success(tx(lang, 'Product created', 'নতুন পণ্য যোগ হয়েছে'));
      }
      setShowProdModal(false);
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to save product', 'পণ্য সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  };

  const handleArchive = async (p: CachedProduct) => {
    const label = trCompact(p.name, p.nameBn, lang);
    if (!window.confirm(tx(lang, `Archive product "${label} (${p.variant})"?`, `"${label} (${p.variant})" আর্কাইভ করতে চান?`))) {
      return;
    }
    try {
      await apiFetch(`/api/catalog/products/${p.id}`, { method: 'DELETE' });
      toast.success(tx(lang, 'Product archived', 'পণ্য আর্কাইভ করা হয়েছে'));
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to archive product', 'পণ্য আর্কাইভ ব্যর্থ হয়েছে'));
    }
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/catalog/categories', { method: 'POST', body: JSON.stringify(catForm) });
      setCatForm({ name: '', nameBn: '' });
      setShowCatModal(false);
      toast.success(tx(lang, 'Custom category added', 'নতুন ক্যাটাগরি যোগ হয়েছে'));
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to create category', 'ক্যাটাগরি তৈরি ব্যর্থ হয়েছে'));
    }
  };

  const saveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/catalog/brands', { method: 'POST', body: JSON.stringify(brandForm) });
      setBrandForm({ name: '', nameBn: '', company: '' });
      setShowBrandModal(false);
      toast.success(tx(lang, 'Custom brand added', 'নতুন ব্র্যান্ড যোগ হয়েছে'));
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to create brand', 'ব্র্যান্ড তৈরি ব্যর্থ হয়েছে'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('products', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              `${products.length} SKUs · ${categories.length} Categories · ${brands.length} Brands`,
              `${products.length}টি পণ্য · ${categories.length}টি ক্যাটাগরি · ${brands.length}টি ব্র্যান্ড`
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCatModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />+ {tx(lang, 'Category', 'ক্যাটাগরি')}
          </button>
          <button
            type="button"
            onClick={() => setShowBrandModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
          >
            <Tag className="h-3.5 w-3.5" />+ {tx(lang, 'Brand', 'ব্র্যান্ড')}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {trCompact('Add Product SKU', 'নতুন পণ্য যোগ', lang)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx(lang, 'Search SKU, barcode, or product name...', 'কোড, বারকোড বা পণ্যের নাম খুঁজুন...')}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <option value="ALL">
            {tx(lang, `All Categories (${categories.length})`, `সব ক্যাটাগরি (${categories.length})`)}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {trCompact(c.name, c.nameBn, lang)}
            </option>
          ))}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
        >
          <option value="ALL">
            {tx(lang, `All Brands (${brands.length})`, `সব ব্র্যান্ড (${brands.length})`)}
          </option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {trCompact(b.name, b.nameBn, lang)}
            </option>
          ))}
        </select>
      </div>

      {/* Products Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'SKU / Barcode', 'কোড / বারকোড')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Product & Variant', 'পণ্য ও ধরন')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Category · Brand', 'ক্যাটাগরি · ব্র্যান্ড')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Unit / Pack', 'একক / প্যাক')}</th>
                {staff?.role !== 'CASHIER' && (
                  <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Avg Cost', 'গড় ক্রয়মূল্য')}</th>
                )}
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Selling Price', 'বিক্রয় মূল্য')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Stock', 'মজুদ')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Actions', 'কার্যক্রম')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => {
                const cat = catMap.get(p.categoryId);
                const br = p.brandId ? brandMap.get(p.brandId) : null;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="font-semibold text-slate-900 dark:text-white">{p.sku}</div>
                      {p.barcode && <div>{p.barcode}</div>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {trCompact(p.name, p.nameBn, lang)}{' '}
                        <span className="font-normal text-slate-500">({p.variant})</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      {cat ? trCompact(cat.name, cat.nameBn, lang) : '—'}
                      {br ? ` · ${trCompact(br.name, br.nameBn, lang)}` : ''}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      {formatUnitLabel(p.baseUnit, lang)}
                      {p.allowDecimalQty ? ` (${tx(lang, 'Dec', 'দশমিক')})` : ''}
                      {p.units?.[0] && (
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          1 {formatUnitLabel(p.units[0].unitName, lang)} = {formatQty(p.units[0].conversionFactor)}{' '}
                          {formatUnitLabel(p.baseUnit, lang)}
                        </div>
                      )}
                    </td>
                    {staff?.role !== 'CASHIER' && (
                      <td className="px-4 py-2.5 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatBDT(p.avgCostPrice)}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {formatBDT(p.sellingPrice)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right font-mono font-semibold ${
                        Number(p.currentStock) <= 0
                          ? 'text-red-600'
                          : Number(p.currentStock) <= Number(p.minStock)
                            ? 'text-amber-600'
                            : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {formatQty(p.currentStock)} {formatUnitLabel(p.baseUnit, lang)}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="mr-2 inline-flex items-center gap-1 text-slate-600 hover:text-emerald-600 dark:text-slate-400 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {staff?.role !== 'CASHIER' && (
                        <button
                          type="button"
                          onClick={() => handleArchive(p)}
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showProdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <form
            onSubmit={saveProduct}
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProd
                  ? tx(lang, `Edit SKU: ${editingProd.sku}`, `পণ্য সম্পাদনা: ${editingProd.sku}`)
                  : tx(lang, 'Add New Product SKU', 'নতুন পণ্য যোগ করুন')}
              </h3>
              <button type="button" onClick={() => setShowProdModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Product Name (English) *', 'পণ্যের নাম (ইংরেজি) *')}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Product Name (Bangla)', 'পণ্যের নাম (বাংলা)')}
                </label>
                <input
                  value={form.nameBn}
                  onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'SKU Code *', 'কোড (SKU) *')}
                </label>
                <input
                  required
                  placeholder="PR-FRT-250M"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Barcode', 'বারকোড')}
                </label>
                <input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Category *', 'ক্যাটাগরি *')}
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {trCompact(c.name, c.nameBn, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Brand', 'ব্র্যান্ড')}
                </label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">{tx(lang, '— No Brand —', '— ব্র্যান্ড নেই —')}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {trCompact(b.name, b.nameBn, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Variant / Size', 'সাইজ / ধরন')}
                </label>
                <input
                  placeholder={tx(lang, 'e.g., 250ml, 1kg, 5L', 'যেমন: ২৫০মিলি, ১কেজি, ৫লিটার')}
                  value={form.variant}
                  onChange={(e) => setForm({ ...form, variant: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Base Selling Unit', 'মূল বিক্রয় একক')}
                </label>
                <select
                  value={form.baseUnit}
                  onChange={(e) => setForm({ ...form, baseUnit: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {BD_UNITS.map((u) => (
                    <option key={u.code} value={u.code}>
                      {trCompact(u.code, u.bn, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Purchase Cost (৳)', 'ক্রয় মূল্য (৳)')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.avgCostPrice}
                  onChange={(e) => setForm({ ...form, avgCostPrice: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Selling Price (৳) *', 'বিক্রয় মূল্য (৳) *')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              {!editingProd && (
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {tx(lang, 'Opening Stock', 'প্রারম্ভিক মজুদ')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Minimum Stock Alert', 'সর্বনিম্ন স্টক সতর্কতা')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Pack / Carton Unit (Optional)', 'কার্টন / বস্তা একক (ঐচ্ছিক)')}
                </label>
                <input
                  placeholder={tx(lang, 'e.g., Carton, Dozen, Sack', 'যেমন: কার্টন, ডজন, বস্তা')}
                  value={form.packUnitName}
                  onChange={(e) => setForm({ ...form, packUnitName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Base Units per Pack (e.g. 24)', 'প্রতি প্যাকে মূল একক (যেমন: ২৪)')}
                </label>
                <input
                  type="number"
                  placeholder="24"
                  value={form.packFactor}
                  onChange={(e) => setForm({ ...form, packFactor: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Expiry Date (Optional)', 'মেয়াদ উত্তীর্ণের তারিখ (ঐচ্ছিক)')}
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div className="flex items-center gap-5 pt-5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowDecimalQty}
                    onChange={(e) => setForm({ ...form, allowDecimalQty: e.target.checked })}
                  />
                  <span>{tx(lang, 'Decimal Qty (1.5 kg)', 'দশমিক পরিমাণ (১.৫ কেজি)')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFrequent}
                    onChange={(e) => setForm({ ...form, isFrequent: e.target.checked })}
                  />
                  <span>{tx(lang, 'Frequent POS Item', 'জনপ্রিয় পস পণ্য')}</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProdModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium dark:border-slate-700"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                {tx(lang, 'Save Product', 'পণ্য সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={saveCategory}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <h3 className="text-sm font-bold">{tx(lang, 'Add Custom Category', 'নতুন ক্যাটাগরি যোগ করুন')}</h3>
            <input
              required
              placeholder={tx(lang, 'Category Name (English)', 'ক্যাটাগরির নাম (ইংরেজি)')}
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder={tx(lang, 'Category Name (Bangla)', 'ক্যাটাগরির নাম (বাংলা)')}
              value={catForm.nameBn}
              onChange={(e) => setCatForm({ ...catForm, nameBn: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowCatModal(false)} className="rounded-lg border px-3 py-1.5 text-xs">
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white">
                {tr('save', lang)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Custom Brand Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={saveBrand}
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <h3 className="text-sm font-bold">{tx(lang, 'Add Custom Brand', 'নতুন ব্র্যান্ড যোগ করুন')}</h3>
            <input
              required
              placeholder={tx(lang, 'Brand Name (English)', 'ব্র্যান্ডের নাম (ইংরেজি)')}
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder={tx(lang, 'Brand Name (Bangla)', 'ব্র্যান্ডের নাম (বাংলা)')}
              value={brandForm.nameBn}
              onChange={(e) => setBrandForm({ ...brandForm, nameBn: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder={tx(lang, 'Manufacturer / Company', 'প্রস্তুতকারক / কোম্পানি')}
              value={brandForm.company}
              onChange={(e) => setBrandForm({ ...brandForm, company: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowBrandModal(false)} className="rounded-lg border px-3 py-1.5 text-xs">
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white">
                {tr('save', lang)}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
