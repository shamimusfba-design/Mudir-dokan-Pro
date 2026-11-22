import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  MapPin,
  Store,
  Phone,
  MessageCircle,
  Plus,
  Minus,
  Trash2,
  Check,
  X,
  CreditCard,
  Truck,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { formatBDT } from '../lib/decimal';
import { tx } from '../lib/i18n';
import { ProductImage } from '../components/ProductMedia';

interface CartItem {
  id: number;
  name: string;
  nameBn?: string;
  sku: string;
  category: string;
  brand: string;
  unit: string;
  price: number;
  qty: number;
  image?: string;
}

interface OnlineStorePageProps {
  onBackToApp?: () => void;
}

export const OnlineStorePage: React.FC<OnlineStorePageProps> = ({ onBackToApp }) => {
  const { products, categories, brands, store, lang } = useApp();

  // Nationwide Stores Directory
  const ALL_DISTRICTS = [
    'ঢাকা',
    'চট্টগ্রাম',
    'রাজশাহী',
    'সিলেট',
    'খুলনা',
    'বরিশাল',
    'রংপুর',
    'ময়মনসিংহ',
    'কুমিল্লা',
    'গাজীপুর',
    'নারায়ণগঞ্জ',
    'বগুড়া',
  ];

  const REGISTERED_STORES = useMemo(() => {
    let localStores: any[] = [];
    try {
      localStores = JSON.parse(localStorage.getItem('mudirdokan_registered_stores') || '[]');
    } catch {}

    const defaultStores = [
      { id: 1, name: store?.name || 'শামীম গ্রোসারি & সুপারশপ', phone: '01884700631', district: 'ঢাকা', address: 'মিরপুর ১০, ঢাকা' },
      { id: 2, name: 'আল-মদিনা জেনারেল স্টোর', phone: '01711223344', district: 'ঢাকা', address: 'উত্তরা সেক্টর ৭, ঢাকা' },
      { id: 3, name: 'বিসমিল্লাহ ট্রেডার্স & মুদি স্টোর', phone: '01822334455', district: 'চট্টগ্রাম', address: 'জিইসি মোড়, চট্টগ্রাম' },
      { id: 4, name: 'নিউ ঢাকা গ্রোসারি মার্ট', phone: '01933445566', district: 'সিলেট', address: 'জিন্দাবাজার, সিলেট' },
      { id: 5, name: 'জনপ্রিয় ডিপার্টমেন্টাল স্টোর', phone: '01544556677', district: 'রাজশাহী', address: 'সাহেব বাজার, রাজশাহী' },
    ];

    const mappedLocal = localStores.map((s: any, idx: number) => ({
      id: 100 + idx,
      name: s.storeName || s.name,
      phone: s.phone,
      district: 'ঢাকা',
      address: s.address || 'ঢাকা, বাংলাদেশ',
    }));

    return [...mappedLocal, ...defaultStores];
  }, [store]);

  // Selected Store State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('সব জেলা');
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1);
  const [storeSearchQuery, setStoreSearchQuery] = useState<string>('');

  const activeStore = useMemo(() => {
    return REGISTERED_STORES.find((s) => s.id === selectedStoreId) || REGISTERED_STORES[0];
  }, [REGISTERED_STORES, selectedStoreId]);

  // Filtered Stores for dropdown
  const filteredStoresList = useMemo(() => {
    return REGISTERED_STORES.filter((s) => {
      const matchDistrict = selectedDistrict === 'সব জেলা' || s.district === selectedDistrict;
      const matchQuery =
        !storeSearchQuery.trim() ||
        s.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        s.phone.includes(storeSearchQuery);
      return matchDistrict && matchQuery;
    });
  }, [REGISTERED_STORES, selectedDistrict, storeSearchQuery]);

  // Product Catalog Search & Category Filter
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        !productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.nameBn && p.nameBn.includes(productSearch)) ||
        p.brand.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, productSearch]);

  // Cart & Checkout States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash'>('cod');
  const [advanceTrxId, setAdvanceTrxId] = useState('');
  const [orderSuccessModal, setOrderSuccessModal] = useState<{ open: boolean; orderId: string } | null>(null);

  // Add item to cart
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          nameBn: product.nameBn,
          sku: product.sku,
          category: product.category,
          brand: product.brand,
          unit: product.unit || '১ পিস',
          price: Number(product.sellingPrice) || 100,
          qty: 1,
          image: product.image,
        },
      ];
    });
    toast.success(`${product.nameBn || product.name} কার্টে যোগ হয়েছে`);
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const deliveryCharge = cartSubtotal > 1500 || cart.length === 0 ? 0 : 50;
  const cartTotal = cartSubtotal + deliveryCharge;
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Submit Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      toast.error('নাম, মোবাইল নম্বর ও ঠিকানা পূরণ করুন');
      return;
    }
    if (cart.length === 0) {
      toast.error('আপনার কার্ট খালি');
      return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      orderId,
      storeId: activeStore.id,
      storeName: activeStore.name,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: cart,
      subtotal: cartSubtotal,
      deliveryCharge,
      total: cartTotal,
      paymentMethod,
      advanceTrxId: paymentMethod === 'bkash' ? advanceTrxId.trim() : null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    // Save order
    try {
      const existing = JSON.parse(localStorage.getItem('mudirdokan_online_orders') || '[]');
      existing.unshift(newOrder);
      localStorage.setItem('mudirdokan_online_orders', JSON.stringify(existing));

      const leads = JSON.parse(localStorage.getItem('mudirdokan_all_leads') || '[]');
      leads.unshift({
        type: 'ECOMMERCE_ORDER',
        name: customerName.trim(),
        phone: customerPhone.trim(),
        storeName: activeStore.name,
        total: cartTotal,
        orderId,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('mudirdokan_all_leads', JSON.stringify(leads));
    } catch {}

    // Send WhatsApp notification to shopkeeper
    const waText = encodeURIComponent(
      `🛒 নতুন অনলাইন অর্ডার #${orderId}\n` +
      `দোকান: ${activeStore.name}\n` +
      `গ্রাহক: ${customerName} (${customerPhone})\n` +
      `ঠিকানা: ${customerAddress}\n` +
      `আইটেম (${totalItemCount}টি):\n` +
      cart.map((i) => `• ${i.nameBn || i.name} (${i.qty} x ৳${i.price})`).join('\n') +
      `\nমোট বিল: ৳${cartTotal} (${paymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি' : `বিকাশ TrxID: ${advanceTrxId}`})`
    );

    setOrderSuccessModal({ open: true, orderId });
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);

    // Optional WhatsApp trigger for customer
    setTimeout(() => {
      window.open(`https://wa.me/88${activeStore.phone}?text=${waText}`, '_blank', 'noopener,noreferrer');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-[#0B1120] dark:text-slate-100 font-sans pb-16">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/95 px-3 sm:px-6 py-2.5 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          
          {/* Logo & Back button */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                title="অ্যাপে ফিরুন"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">অ্যাপে ফিরুন</span>
              </button>
            )}
            <img
              src="/mudi-dokan-pro-logo.png"
              alt="Mudir Dokan Pro"
              className="h-8 sm:h-10 w-auto object-contain"
            />
          </div>

          {/* NATIONWIDE STORE & DISTRICT SELECTOR */}
          <div className="flex-1 max-w-md hidden md:flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-1 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            {/* District dropdown */}
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="rounded-xl border-none bg-white py-1 px-2.5 text-xs font-bold text-emerald-950 focus:outline-hidden dark:bg-slate-900 dark:text-emerald-200 cursor-pointer shadow-xs"
              >
                <option value="সব জেলা">সব জেলা</option>
                {ALL_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Store autocomplete / dropdown */}
            <div className="flex-1 relative">
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                className="w-full rounded-xl border-none bg-white py-1 px-2.5 text-xs font-black text-slate-900 focus:outline-hidden dark:bg-slate-900 dark:text-white cursor-pointer shadow-xs truncate"
              >
                {filteredStoresList.map((s) => (
                  <option key={s.id} value={s.id}>
                    🏪 {s.name} ({s.address})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart & WhatsApp CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={`https://wa.me/88${activeStore.phone}?text=${encodeURIComponent(`হ্যালো ${activeStore.name}, আমি পণ্য অর্ডার করতে চাই।`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>দোকানে চ্যাট</span>
            </a>

            {/* Floating Cart Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-2 text-xs sm:text-sm font-black shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>কার্ট ({totalItemCount})</span>
              {totalItemCount > 0 && (
                <span className="font-mono bg-white text-emerald-900 px-1.5 py-0.2 rounded-full text-xs font-black">
                  ৳{cartSubtotal}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE STORE SELECTOR BAR */}
      <div className="md:hidden border-b border-emerald-100 bg-emerald-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <Store className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold truncate text-slate-900 dark:text-white">{activeStore.name}</span>
        </div>
        <div className="text-[11px] text-slate-500 shrink-0">
          📍 {activeStore.address}
        </div>
      </div>

      {/* HERO BANNER (GHORERBAZAR STYLE) */}
      <div className="relative mx-auto max-w-7xl px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>১০০% খাঁটি ও সেরা মানের মুদি বাজার</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black leading-tight">
              {activeStore.name} — অনলাইন বাজার
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              ঘি, তেল, চাল, ডাল, মসলা ও নিত্যপ্রয়োজনীয় ১,৩৫৯টি আসল গ্রোসারি আইটেম। ঘরে বসেই অর্ডার করুন, দ্রুততম সময়ে ক্যাশ অন ডেলিভারি পান।
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-emerald-200">
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4 text-amber-400" />
                <span>১৫০০৳ অর্ডারে ফ্রি ডেলিভারি</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                <span>ক্যাশ অন ডেলিভারি সুবিধা</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT CATALOG & SEARCH SECTION */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-6">
        
        {/* Search & Categories Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="পণ্যের নাম, ব্র্যান্ড বা সাইজ লিখে খুঁজুন..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-xs sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-xs"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>

          {/* Quick stats */}
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            মোট <span className="font-bold text-emerald-700 dark:text-emerald-400">{filteredProducts.length}</span>টি পণ্য পাওয়া গেছে
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-black transition cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            সব ক্যাটাগরি
          </button>
          {categories.slice(0, 15).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.name)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCategory === c.name
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {c.nameBn || c.name}
            </button>
          ))}
        </div>

        {/* PRODUCT GRID (GHORER BAZAR / SHOUKHIN STYLE CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.slice(0, 50).map((product) => {
            const inCart = cart.find((i) => i.id === product.id);
            const price = Number(product.sellingPrice) || 100;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-xs hover:shadow-lg hover:border-emerald-400 transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Brand Pill */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 truncate max-w-[100px]">
                    {product.brand}
                  </span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {product.unit || '১ পিস'}
                  </span>
                </div>

                {/* Product Photo */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/40 my-1 flex items-center justify-center">
                  <ProductImage
                    src={product.imageUrl}
                    sku={product.sku}
                    alt={product.nameBn || product.name}
                    size="card"
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Product Title */}
                <div className="mt-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                    {product.nameBn || product.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{product.category}</p>
                </div>

                {/* Price & Add to Cart */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                  <div>
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-400">
                      ৳{price}
                    </span>
                  </div>

                  {inCart ? (
                    <div className="inline-flex items-center rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950 p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, -1)}
                        className="p-1 text-emerald-800 hover:bg-emerald-200 rounded-lg dark:text-emerald-200"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-1.5 text-xs font-black">{inCart.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, 1)}
                        className="p-1 text-emerald-800 hover:bg-emerald-200 rounded-lg dark:text-emerald-200"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-xs transition cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>অর্ডার</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-slide-left">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  আপনার শপিং ব্যাগ ({totalItemCount} আইটেম)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <ShoppingBag className="h-12 w-12 mx-auto stroke-1 opacity-50" />
                  <p className="text-sm font-semibold">আপনার কার্ট বর্তমানে খালি আছে</p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold"
                  >
                    পণ্য ব্রাউজ করুন
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.nameBn || item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{item.brand} · {item.unit}</p>
                      <div className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 mt-1">
                        ৳{item.price * item.qty} ({item.qty} x ৳{item.price})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="p-1 text-slate-600 hover:text-rose-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-black">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="p-1 text-slate-600 hover:text-emerald-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer & Checkout Trigger */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 p-4 space-y-3 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>পণ্যের মোট মূল্য:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">৳{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>হোম ডেলিভারি চার্জ:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {deliveryCharge === 0 ? 'ফ্রি' : `৳${deliveryCharge}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200/80">
                    <span>সর্বমোট প্রদেয়:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">৳{cartTotal}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <span>অর্ডার সম্পন্ন করতে এগিয়ে যান (৳{cartTotal})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 1-PAGE EXPRESS CHECKOUT MODAL (GHORER BAZAR / SHOUKHIN STYLE) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 my-auto">
            
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {activeStore.name}
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                ডেলিভারি ঠিকানা ও অর্ডার নিশ্চিতকরণ
              </h3>
            </div>

            <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3.5">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  আপনার নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: মো: কামরুল ইসলাম"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পূর্ণ ঠিকানা (বাড়ি/রোড, এলাকা) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="যেমন: বাসা নং ১২, রোড নং ৩, ব্লক-সি, মিরপুর ১০, ঢাকা"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  পেমেন্ট পদ্ধতি:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`rounded-xl border p-2.5 text-xs font-bold text-left transition ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    💵 ক্যাশ অন ডেলিভারি
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`rounded-xl border p-2.5 text-xs font-bold text-left transition ${
                      paymentMethod === 'bkash'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    💳 বিকাশ / নগদ অগ্রিম
                  </button>
                </div>

                {paymentMethod === 'bkash' && (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 text-xs space-y-1">
                    <p className="font-bold text-rose-900">
                      দোকানের বিকাশ নম্বরে (<b>01884700631</b>) ৳{cartTotal} সেন্ড মানি করে TrxID দিন:
                    </p>
                    <input
                      type="text"
                      required
                      value={advanceTrxId}
                      onChange={(e) => setAdvanceTrxId(e.target.value.toUpperCase())}
                      placeholder="বিকাশ TrxID"
                      className="w-full rounded-lg border border-rose-300 bg-white px-2.5 py-1.5 font-mono text-xs font-black"
                    />
                  </div>
                )}
              </div>

              {/* Order Summary Line */}
              <div className="flex justify-between items-center rounded-xl bg-slate-100 p-2.5 text-xs font-bold dark:bg-slate-800">
                <span>সর্বমোট প্রদেয় বিল:</span>
                <span className="font-mono text-base font-black text-emerald-700 dark:text-emerald-400">
                  ৳{cartTotal}
                </span>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 py-3 text-sm font-black text-white shadow-lg transition cursor-pointer"
              >
                অর্ডার নিশ্চিত করুন (৳{cartTotal}) 🚀
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ORDER SUCCESS MODAL */}
      {orderSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center space-y-4 shadow-2xl dark:bg-slate-900">
            <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                অর্ডার সফলভাবে গ্রহণ করা হয়েছে!
              </h3>
              <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                অর্ডার আইডি: #{orderSuccessModal.orderId}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                দোকানদার দ্রুত আপনার সাথে যোগাযোগ করে পণ্য ডেলিভারি সম্পন্ন করবেন।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOrderSuccessModal(null)}
              className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-xs font-bold"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
