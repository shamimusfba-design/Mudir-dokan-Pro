import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Layers,
  Tag,
  LayoutGrid,
  List,
  CheckCircle2,
  ImageOff,
  Camera,
  Package,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { BD_UNITS, formatBDT, formatQty } from '../lib/decimal';
import { tr, trCompact, tx, formatUnitLabel } from '../lib/i18n';
import type { CachedBrand, CachedCategory, CachedProduct } from '../lib/offline-db';
import {
  ProductImage,
  BrandLogo,
  CategoryIcon,
  ImageAssetUploader,
  getCategoryTheme,
  CATEGORY_ACCENT_KEYS,
  CATEGORY_ICON_KEYS,
} from '../components/ProductMedia';
import { getCategoryVisualImage } from '../lib/category-images';

export const ProductsPage: React.FC = () => {
  const { products, categories, brands, lang, staff, refreshCatalog, enterDemoMode } = useApp();
  const [activeTab, setActiveTab] = useState<'products' | 'brands' | 'categories'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [photoFilter, setPhotoFilter] = useState<'ALL' | 'HAS_PHOTO' | 'NO_PHOTO'>('ALL');

  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProd, setEditingProd] = useState<CachedProduct | null>(null);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<CachedCategory | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    nameBn: '',
    iconName: 'ShoppingBasket',
    accentColor: 'indigo',
  });

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<CachedBrand | null>(null);
  const [brandForm, setBrandForm] = useState({
    name: '',
    nameBn: '',
    company: '',
    logoUrl: '',
    logoSource: '',
    logoStatus: 'UNAVAILABLE' as 'VERIFIED' | 'PENDING' | 'UNAVAILABLE',
    brandColor: '#4F46E5',
  });

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
    imageUrl: '',
    gallery: [] as string[],
    imageSource: '',
    imageStatus: 'UNAVAILABLE' as 'VERIFIED' | 'PENDING' | 'UNAVAILABLE',
  };
  const [form, setForm] = useState(emptyForm);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const productCountByBrand = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of products) {
      if (p.brandId) map.set(p.brandId, (map.get(p.brandId) || 0) + 1);
    }
    return map;
  }, [products]);

  const productCountByCat = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of products) {
      map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    }
    return map;
  }, [products]);

  const verifiedPhotoCount = useMemo(
    () => products.filter((p) => Boolean(p.imageUrl && p.imageUrl.trim())).length,
    [products]
  );

  const verifiedLogoCount = useMemo(
    () => brands.filter((b) => Boolean(b.logoUrl && b.logoUrl.trim())).length,
    [brands]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'ALL' && String(p.categoryId) !== catFilter) return false;
      if (brandFilter !== 'ALL' && String(p.brandId || '') !== brandFilter) return false;
      if (photoFilter === 'HAS_PHOTO' && !p.imageUrl) return false;
      if (photoFilter === 'NO_PHOTO' && p.imageUrl) return false;
      if (!q) return true;
      const br = p.brandId ? brandMap.get(p.brandId) : null;
      return (
        p.name.toLowerCase().includes(q) ||
        p.nameBn.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (br?.name || '').toLowerCase().includes(q)
      );
    });
  }, [products, search, catFilter, brandFilter, photoFilter, brandMap]);

  const [displayLimit, setDisplayLimit] = useState(60);

  useEffect(() => {
    setDisplayLimit(60);
  }, [search, catFilter, brandFilter, photoFilter]);

  const visibleProducts = useMemo(() => {
    return filtered.slice(0, displayLimit);
  }, [filtered, displayLimit]);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brands.filter(
      (b) =>
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.nameBn || '').toLowerCase().includes(q) ||
        (b.company || '').toLowerCase().includes(q)
    );
  }, [brands, search]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || (c.nameBn || '').toLowerCase().includes(q)
    );
  }, [categories, search]);

  const openCreateProduct = () => {
    setEditingProd(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || 1 });
    setShowProdModal(true);
  };

  const openEditProduct = (p: CachedProduct) => {
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
      imageUrl: p.imageUrl || '',
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
      imageSource: p.imageSource || '',
      imageStatus: (p.imageStatus as 'VERIFIED' | 'PENDING' | 'UNAVAILABLE') || (p.imageUrl ? 'VERIFIED' : 'UNAVAILABLE'),
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
      imageUrl: form.imageUrl.trim() || null,
      gallery: form.gallery,
      imageSource: form.imageSource.trim(),
      imageStatus: form.imageUrl.trim() ? form.imageStatus || 'VERIFIED' : 'UNAVAILABLE',
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

  const handleArchiveProduct = async (p: CachedProduct) => {
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

  const openCreateCategory = () => {
    setEditingCat(null);
    setCatForm({ name: '', nameBn: '', iconName: 'ShoppingBasket', accentColor: 'indigo' });
    setShowCatModal(true);
  };

  const openEditCategory = (cat: CachedCategory) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      nameBn: cat.nameBn || '',
      iconName: cat.iconName || 'ShoppingBasket',
      accentColor: cat.accentColor || 'indigo',
    });
    setShowCatModal(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await apiFetch(`/api/catalog/categories/${editingCat.id}`, {
          method: 'PUT',
          body: JSON.stringify(catForm),
        });
        toast.success(tx(lang, 'Category updated', 'ক্যাটাগরি আপডেট হয়েছে'));
      } else {
        await apiFetch('/api/catalog/categories', { method: 'POST', body: JSON.stringify(catForm) });
        toast.success(tx(lang, 'Custom category added', 'নতুন ক্যাটাগরি যোগ হয়েছে'));
      }
      setShowCatModal(false);
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to save category', 'ক্যাটাগরি সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  };

  const openCreateBrand = () => {
    setEditingBrand(null);
    setBrandForm({
      name: '',
      nameBn: '',
      company: '',
      logoUrl: '',
      logoSource: '',
      logoStatus: 'UNAVAILABLE',
      brandColor: '#4F46E5',
    });
    setShowBrandModal(true);
  };

  const openEditBrand = (b: CachedBrand) => {
    setEditingBrand(b);
    setBrandForm({
      name: b.name,
      nameBn: b.nameBn || '',
      company: b.company || '',
      logoUrl: b.logoUrl || '',
      logoSource: b.logoSource || '',
      logoStatus: (b.logoStatus as 'VERIFIED' | 'PENDING' | 'UNAVAILABLE') || (b.logoUrl ? 'VERIFIED' : 'UNAVAILABLE'),
      brandColor: b.brandColor || '#4F46E5',
    });
    setShowBrandModal(true);
  };

  const saveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...brandForm,
      logoUrl: brandForm.logoUrl.trim() || null,
      logoStatus: brandForm.logoUrl.trim() ? brandForm.logoStatus || 'VERIFIED' : 'UNAVAILABLE',
    };
    try {
      if (editingBrand) {
        await apiFetch(`/api/catalog/brands/${editingBrand.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success(tx(lang, 'Brand updated', 'ব্র্যান্ড আপডেট হয়েছে'));
      } else {
        await apiFetch('/api/catalog/brands', { method: 'POST', body: JSON.stringify(payload) });
        toast.success(tx(lang, 'Brand created', 'নতুন ব্র্যান্ড যোগ হয়েছে'));
      }
      setShowBrandModal(false);
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to save brand', 'ব্র্যান্ড সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  };

  const handleDeleteBrand = async (b: CachedBrand) => {
    if (
      !window.confirm(
        tx(
          lang,
          `Delete brand "${b.name}"? Linked products will remain active without a brand.`,
          `"${trCompact(b.name, b.nameBn, lang)}" ব্র্যান্ড মুছবেন? পণ্যগুলো সক্রিয় থাকবে।`
        )
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/api/catalog/brands/${b.id}`, { method: 'DELETE' });
      toast.success(tx(lang, 'Brand deleted', 'ব্র্যান্ড মুছে ফেলা হয়েছে'));
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to delete brand', 'ব্র্যান্ড মোছা ব্যর্থ হয়েছে'));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {tx(lang, 'Products, Brands & Visual Catalog', 'পণ্য, ব্র্যান্ড ও ভিজ্যুয়াল ক্যাটালগ')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              `${products.length} SKUs (${verifiedPhotoCount} verified photos) · ${brands.length} Brands (${verifiedLogoCount} official logos) · ${categories.length} Categories`,
              `${products.length}টি পণ্য (${verifiedPhotoCount}টি আসল ছবি) · ${brands.length}টি ব্র্যান্ড (${verifiedLogoCount}টি অফিসিয়াল লোগো) · ${categories.length}টি ক্যাটাগরি`
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateCategory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300 cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" />+ {tx(lang, 'Category', 'ক্যাটাগরি')}
          </button>
          <button
            type="button"
            onClick={openCreateBrand}
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 dark:border-slate-700 dark:bg-slate-900 dark:text-purple-300 cursor-pointer"
          >
            <Tag className="h-3.5 w-3.5" />+ {tx(lang, 'Brand', 'ব্র্যান্ড')}
          </button>
          <button
            type="button"
            onClick={openCreateProduct}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 hover:from-indigo-700 hover:to-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {trCompact('Add Product SKU', 'নতুন পণ্য যোগ', lang)}
          </button>
        </div>
      </div>

      {/* 3-Tab Catalog Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              ['products', tx(lang, 'Products', 'পণ্য তালিকা'), Package, products.length],
              ['brands', tx(lang, 'Brands & Logos', 'ব্র্যান্ড ও লোগো'), Tag, brands.length],
              ['categories', tx(lang, 'Categories', 'ক্যাটাগরি'), Layers, categories.length],
            ] as const
          ).map(([id, label, Icon, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              <span
                className={`font-mono text-[11px] ${activeTab === id ? 'text-indigo-100' : 'text-slate-400'}`}
              >
                ({count})
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {tx(lang, 'Visual Grid', 'গ্রিড')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              {tx(lang, 'Table', 'টেবিল')}
            </button>
          </div>
        )}
      </div>

      {/* Shared Search + Tab-specific Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'brands'
                ? tx(lang, 'Search brands or manufacturer...', 'ব্র্যান্ড বা কোম্পানি খুঁজুন...')
                : activeTab === 'categories'
                  ? tx(lang, 'Search categories...', 'ক্যাটাগরি খুঁজুন...')
                  : tx(lang, 'Search SKU, barcode, brand, or product name...', 'কোড, বারকোড, ব্র্যান্ড বা পণ্যের নাম খুঁজুন...')
            }
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900"
          />
        </div>

        {activeTab === 'products' && (
          <>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
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
            <select
              value={photoFilter}
              onChange={(e) => setPhotoFilter(e.target.value as any)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="ALL">{tx(lang, 'Images: All', 'ছবি: সব')}</option>
              <option value="HAS_PHOTO">{tx(lang, 'With Real Photo', 'আসল ছবি আছে')}</option>
              <option value="NO_PHOTO">{tx(lang, 'Needs Photo Upload', 'ছবি আপলোড বাকি')}</option>
            </select>
          </>
        )}
      </div>

      {/* EMPTY CATALOG / OFFLINE HELPER */}
      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            {tx(lang, 'Catalog Empty or Offline', 'ক্যাটালগ খালি বা অফলাইনে আছে')}
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {tx(
              lang,
              'Click below to instantly load all 1,359 Bangladeshi FMCG products, 28 categories, and 75 official brand logos with genuine packaging photos.',
              'নিচের বাটনে ক্লিক করে তাৎক্ষণিক ১,৩৫৯টি বাংলাদেশি মুদি পণ্য, ২৮টি ক্যাটাগরি ও ৭৫টি অফিসিয়াল ব্র্যান্ড লোগো লোড করুন।'
            )}
          </p>
          <button
            type="button"
            onClick={enterDemoMode}
            className="mt-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-700 hover:to-blue-700 transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>{tx(lang, 'Load All 1,359 Demo Products with Photos', '১,৩৫৯টি ডেমো পণ্য ও ছবি লোড করুন')}</span>
          </button>
        </div>
      )}

      {/* TAB 1: PRODUCTS (VISUAL GRID OR DATA TABLE) */}
      {products.length > 0 && activeTab === 'products' && viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleProducts.map((p) => {
            const cat = catMap.get(p.categoryId);
            const br = p.brandId ? brandMap.get(p.brandId) : null;
            const stock = Number(p.currentStock);
            const isOut = stock <= 0;
            const isLow = stock > 0 && stock <= Number(p.minStock);

            return (
              <div
                key={p.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/80 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Large Product Image Canvas (Chaldal / GhorerBazar standard) */}
                <div className="relative overflow-hidden rounded-xl bg-white p-1.5 flex items-center justify-center">
                  <ProductImage
                    src={p.imageUrl}
                    sku={p.sku}
                    alt={trCompact(p.name, p.nameBn, lang)}
                    iconName={cat?.iconName}
                    accentColor={cat?.accentColor}
                    fallbackIndex={p.categoryId}
                    size="card"
                    showUnavailableLabel
                    lang={lang}
                  />
                  {br && (
                    <div className="absolute left-2.5 top-2.5 z-10">
                      <BrandLogo logoUrl={br.logoUrl} name={br.name} brandColor={br.brandColor} size="xs" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditProduct(p)}
                    title={tx(lang, 'Upload / Manage Photo', 'ছবি আপলোড / পরিবর্তন')}
                    className="absolute right-2.5 top-2.5 z-10 rounded-lg bg-white/95 p-1.5 text-slate-500 shadow-sm transition hover:bg-emerald-600 hover:text-white dark:bg-slate-900/90 dark:text-slate-400 cursor-pointer"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Product Metadata & Poriman */}
                <div className="mt-3 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {br ? <span>{trCompact(br.name, br.nameBn, lang)}</span> : null}
                    {br && cat ? <span>·</span> : null}
                    {cat ? <span className="text-slate-500 dark:text-slate-400">{trCompact(cat.name, cat.nameBn, lang)}</span> : null}
                  </div>
                  <h3 className="mt-1 text-base sm:text-[17px] font-extrabold leading-tight text-slate-900 line-clamp-2 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {trCompact(p.name, p.nameBn, lang)}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {p.variant}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        isOut ? 'text-rose-600 font-bold' : isLow ? 'text-orange-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {isOut
                        ? tx(lang, 'Stock Out', 'স্টক শেষ')
                        : isLow
                          ? tx(lang, `Low: ${p.currentStock}`, `কম স্টক: ${p.currentStock}`)
                          : `${p.currentStock} ${formatUnitLabel(p.baseUnit, lang)}`}
                    </span>
                  </div>
                </div>

                {/* Eye-catching Price & Edit Actions */}
                <div className="mt-3.5 flex items-baseline justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  <div>
                    <span className="font-mono text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                      {formatBDT(p.sellingPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditProduct(p)}
                      title={tr('edit', lang)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300 cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {staff?.role !== 'CASHIER' && (
                      <button
                        type="button"
                        onClick={() => handleArchiveProduct(p)}
                        title={tr('delete', lang)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {displayLimit < filtered.length && (
            <div className="col-span-full mt-6 flex flex-col items-center justify-center gap-2 py-4">
              <p className="text-xs font-semibold text-slate-500">
                {tx(
                  lang,
                  `Showing ${visibleProducts.length} of ${filtered.length} products`,
                  `${filtered.length}টি পণ্যের মধ্যে ${visibleProducts.length}টি প্রদর্শিত`
                )}
              </p>
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 60)}
                className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-800 shadow-xs hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {tx(
                  lang,
                  `Load More Products (${filtered.length - visibleProducts.length} remaining)`,
                  `আরও পণ্য দেখুন (বাকি ${filtered.length - visibleProducts.length}টি)`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Product', 'পণ্য')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'SKU / Barcode', 'কোড / বারকোড')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Brand · Category', 'ব্র্যান্ড · ক্যাটাগরি')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Unit / Pack', 'একক / প্যাক')}</th>
                  {staff?.role !== 'CASHIER' && (
                    <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Avg Cost', 'গড় ক্রয়মূল্য')}</th>
                  )}
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Selling Price', 'বিক্রয় মূল্য')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Stock', 'মজুদ')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Actions', 'কার্যক্রম')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleProducts.map((p) => {
                  const cat = catMap.get(p.categoryId);
                  const br = p.brandId ? brandMap.get(p.brandId) : null;
                  return (
                    <tr key={p.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={p.imageUrl}
                            sku={p.sku}
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
                            <div className="text-[10px] text-slate-400">
                              {p.imageUrl ? (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {tx(lang, 'Verified Photo', 'আসল ছবি')}
                                </span>
                              ) : (
                                <span>{tx(lang, 'No photo uploaded', 'ছবি নেই')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="font-semibold text-slate-900 dark:text-white">{p.sku}</div>
                        {p.barcode && <div>{p.barcode}</div>}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {br && <BrandLogo logoUrl={br.logoUrl} name={br.name} brandColor={br.brandColor} size="xs" />}
                          <span className="text-slate-700 dark:text-slate-300">
                            {br ? trCompact(br.name, br.nameBn, lang) : '—'}
                            {' · '}
                            {cat ? trCompact(cat.name, cat.nameBn, lang) : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                        {formatUnitLabel(p.baseUnit, lang)}
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
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                        {formatBDT(p.sellingPrice)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono font-bold ${
                          Number(p.currentStock) <= 0
                            ? 'text-rose-600'
                            : Number(p.currentStock) <= Number(p.minStock)
                              ? 'text-orange-600'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatQty(p.currentStock)} {formatUnitLabel(p.baseUnit, lang)}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="mr-2 inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 dark:text-slate-400 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {staff?.role !== 'CASHIER' && (
                          <button
                            type="button"
                            onClick={() => handleArchiveProduct(p)}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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
          {displayLimit < filtered.length && (
            <div className="flex flex-col items-center justify-center gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 60)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {tx(
                  lang,
                  `Load More (${filtered.length - visibleProducts.length} remaining)`,
                  `আরও পণ্য দেখুন (বাকি ${filtered.length - visibleProducts.length}টি)`
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BRAND MANAGEMENT WITH AUTHENTIC LOGOS */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBrands.map((b) => {
            const skuCount = productCountByBrand.get(b.id) || 0;
            return (
              <div
                key={b.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <BrandLogo logoUrl={b.logoUrl} name={b.name} brandColor={b.brandColor} size="lg" />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditBrand(b)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {staff?.role !== 'CASHIER' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBrand(b)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {trCompact(b.name, b.nameBn, lang)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {b.company || tx(lang, 'FMCG Brand', 'এফএমসিজি ব্র্যান্ড')}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] dark:border-slate-800">
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">
                    {skuCount} {tx(lang, 'SKUs', 'পণ্য')}
                  </span>
                  {b.logoUrl ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {tx(lang, 'Official Logo', 'অফিসিয়াল লোগো')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openEditBrand(b)}
                      className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:underline cursor-pointer"
                    >
                      <ImageOff className="h-3 w-3" />
                      {tx(lang, 'Upload Logo', 'লোগো যোগ করুন')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: PROFESSIONAL REAL PHOTOGRAPHIC CATEGORY SHOWCASE CARDS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {filteredCategories.map((cat, idx) => {
            const theme = getCategoryTheme(cat.accentColor, idx);
            const skuCount = productCountByCat.get(cat.id) || 0;
            return (
              <div
                key={cat.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Genuine Photographic Studio Category Packshot Canvas (Pure #FFFFFF White Background) */}
                <div className="relative h-40 sm:h-44 w-full overflow-hidden rounded-xl border border-slate-100 bg-white p-2 flex items-center justify-center dark:border-slate-800 dark:bg-white">
                  <img
                    src={getCategoryVisualImage(cat.name)}
                    alt={cat.name}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.opacity = '0.5';
                    }}
                  />
                  <div className={`absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-lg border shadow-xs ${theme.bgSoft} ${theme.border} ${theme.text}`}>
                    <CategoryIcon iconName={cat.iconName} className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditCategory(cat)}
                    className="absolute top-2 right-2 rounded-lg bg-white/90 p-1.5 text-slate-400 shadow-xs hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-900/90 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate text-base font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {trCompact(cat.name, cat.nameBn, lang)}
                    </h4>
                    <p className="mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {skuCount} {tx(lang, 'products', 'পণ্য')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Product Modal with Full Image & Gallery Asset Manager */}
      {showProdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto backdrop-blur-xs">
          <form
            onSubmit={saveProduct}
            className="my-auto w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingProd
                  ? tx(lang, `Edit SKU: ${editingProd.sku}`, `পণ্য সম্পাদনা: ${editingProd.sku}`)
                  : tx(lang, 'Add New Product SKU', 'নতুন পণ্য যোগ করুন')}
              </h3>
              <button type="button" onClick={() => setShowProdModal(false)} className="text-slate-400 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Product Image & Multi-Angle Gallery Asset Uploader */}
            <ImageAssetUploader
              kind="product"
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              gallery={form.gallery}
              onGalleryChange={(g) => setForm((f) => ({ ...f, gallery: g }))}
              source={form.imageSource}
              onSourceChange={(s) => setForm((f) => ({ ...f, imageSource: s }))}
              status={form.imageStatus}
              onStatusChange={(st) => setForm((f) => ({ ...f, imageStatus: st }))}
              lang={lang}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Product Name (English) *', 'পণ্যের নাম (ইংরেজি) *')}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Product Name (Bangla)', 'পণ্যের নাম (বাংলা)')}
                </label>
                <input
                  value={form.nameBn}
                  onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'SKU Code *', 'কোড (SKU) *')}
                </label>
                <input
                  required
                  placeholder="PR-FRT-250M"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Barcode', 'বারকোড')}
                </label>
                <input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Category *', 'ক্যাটাগরি *')}
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {trCompact(c.name, c.nameBn, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Brand', 'ব্র্যান্ড')}
                </label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
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
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Variant / Size', 'সাইজ / ধরন')}
                </label>
                <input
                  placeholder={tx(lang, 'e.g., 250ml, 1kg, 5L', 'যেমন: ২৫০মিলি, ১কেজি, ৫লিটার')}
                  value={form.variant}
                  onChange={(e) => setForm({ ...form, variant: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Base Selling Unit', 'মূল বিক্রয় একক')}
                </label>
                <select
                  value={form.baseUnit}
                  onChange={(e) => setForm({ ...form, baseUnit: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {BD_UNITS.map((u) => (
                    <option key={u.code} value={u.code}>
                      {trCompact(u.code, u.bn, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Purchase Cost (৳)', 'ক্রয় মূল্য (৳)')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.avgCostPrice}
                  onChange={(e) => setForm({ ...form, avgCostPrice: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Selling Price (৳) *', 'বিক্রয় মূল্য (৳) *')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              {!editingProd && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {tx(lang, 'Opening Stock', 'প্রারম্ভিক মজুদ')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Minimum Stock Alert', 'সর্বনিম্ন স্টক সতর্কতা')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Pack / Carton Unit (Optional)', 'কার্টন / বস্তা একক (ঐচ্ছিক)')}
                </label>
                <input
                  placeholder={tx(lang, 'e.g., Carton, Dozen, Sack', 'যেমন: কার্টন, ডজন, বস্তা')}
                  value={form.packUnitName}
                  onChange={(e) => setForm({ ...form, packUnitName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Base Units per Pack (e.g. 24)', 'প্রতি প্যাকে মূল একক (যেমন: ২৪)')}
                </label>
                <input
                  type="number"
                  placeholder="24"
                  value={form.packFactor}
                  onChange={(e) => setForm({ ...form, packFactor: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Expiry Date (Optional)', 'মেয়াদ উত্তীর্ণের তারিখ (ঐচ্ছিক)')}
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
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
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700 cursor-pointer"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-blue-700 cursor-pointer"
              >
                {tx(lang, 'Save Product', 'পণ্য সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={saveCategory}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">
                {editingCat
                  ? tx(lang, 'Edit Category', 'ক্যাটাগরি সম্পাদনা')
                  : tx(lang, 'Add Custom Category', 'নতুন ক্যাটাগরি যোগ করুন')}
              </h3>
              <button type="button" onClick={() => setShowCatModal(false)} className="text-slate-400 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              required
              placeholder={tx(lang, 'Category Name (English)', 'ক্যাটাগরির নাম (ইংরেজি)')}
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder={tx(lang, 'Category Name (Bangla)', 'ক্যাটাগরির নাম (বাংলা)')}
              value={catForm.nameBn}
              onChange={(e) => setCatForm({ ...catForm, nameBn: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">{tx(lang, 'Icon', 'আইকন')}</label>
                <select
                  value={catForm.iconName}
                  onChange={(e) => setCatForm({ ...catForm, iconName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {CATEGORY_ICON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">{tx(lang, 'Accent Color', 'রঙ')}</label>
                <select
                  value={catForm.accentColor}
                  onChange={(e) => setCatForm({ ...catForm, accentColor: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {CATEGORY_ACCENT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-700 cursor-pointer"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 cursor-pointer"
              >
                {tr('save', lang)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create / Edit Brand Modal with Official Logo Upload */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto backdrop-blur-xs">
          <form
            onSubmit={saveBrand}
            className="my-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingBrand
                  ? tx(lang, `Edit Brand: ${editingBrand.name}`, `ব্র্যান্ড সম্পাদনা: ${editingBrand.name}`)
                  : tx(lang, 'Add Brand & Official Logo', 'নতুন ব্র্যান্ড ও লোগো যোগ করুন')}
              </h3>
              <button type="button" onClick={() => setShowBrandModal(false)} className="text-slate-400 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <ImageAssetUploader
              kind="brand"
              value={brandForm.logoUrl}
              onChange={(url) => setBrandForm((b) => ({ ...b, logoUrl: url }))}
              source={brandForm.logoSource}
              onSourceChange={(s) => setBrandForm((b) => ({ ...b, logoSource: s }))}
              status={brandForm.logoStatus}
              onStatusChange={(st) => setBrandForm((b) => ({ ...b, logoStatus: st }))}
              lang={lang}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Brand Name (English) *', 'ব্র্যান্ডের নাম (ইংরেজি) *')}
                </label>
                <input
                  required
                  value={brandForm.name}
                  onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Brand Name (Bangla)', 'ব্র্যান্ডের নাম (বাংলা)')}
                </label>
                <input
                  value={brandForm.nameBn}
                  onChange={(e) => setBrandForm({ ...brandForm, nameBn: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Manufacturer / Company', 'প্রস্তুতকারক / কোম্পানি')}
                </label>
                <input
                  value={brandForm.company}
                  onChange={(e) => setBrandForm({ ...brandForm, company: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Brand Accent Color', 'ব্র্যান্ডের রঙ')}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={brandForm.brandColor}
                    onChange={(e) => setBrandForm({ ...brandForm, brandColor: e.target.value })}
                    className="h-9 w-12 rounded-lg border border-slate-200 p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={brandForm.brandColor}
                    onChange={(e) => setBrandForm({ ...brandForm, brandColor: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700 cursor-pointer"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-purple-700 cursor-pointer"
              >
                {tr('save', lang)}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
