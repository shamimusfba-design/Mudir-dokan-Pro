import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Menu,
  Home,
  Layers,
  ChevronLeft,
  ChevronRight,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { formatBDT } from '../lib/decimal';
import { tx, trCompact, formatVariant } from '../lib/i18n';
import { ProductImage } from '../components/ProductMedia';
import { getCategoryVisualImage } from '../lib/category-images';

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
  image?: string | null;
}

interface OnlineStorePageProps {
  onBackToApp?: () => void;
  subdomainShopSlug?: string | null;
  onGoToShopkeeperApp?: () => void;
}

export const OnlineStorePage: React.FC<OnlineStorePageProps> = ({
  onBackToApp,
  subdomainShopSlug,
  onGoToShopkeeperApp,
}) => {
  const {
    products,
    categories,
    brands,
    store,
    settings,
    lang,
    setLang,
    darkMode,
    toggleDarkMode,
  } = useApp();

  // Dynamic Delivery Fee from Settings (defaults to 80 inside Dhaka, 150 outside Dhaka)
  const deliveryFeeInside = Number(settings?.deliveryFeeInsideDhaka || 80);
  const deliveryFeeOutside = Number(settings?.deliveryFeeOutsideDhaka || 150);

  // Category & Brand Lookups
  const categoryMap = useMemo(() => {
    const map = new Map<number, { name: string; nameBn?: string }>();
    categories.forEach((c) => {
      map.set(c.id, { name: c.name, nameBn: c.nameBn });
    });
    return map;
  }, [categories]);

  const brandMap = useMemo(() => {
    const map = new Map<number, string>();
    brands.forEach((b) => {
      map.set(b.id, b.name);
    });
    return map;
  }, [brands]);

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
      { id: 1, name: 'মুদি দোকান প্রো (প্রধান আউটলেট)', slug: 'main', phone: '01884700631', district: 'ঢাকা', address: 'মিরপুর ১০, ঢাকা' },
      { id: 2, name: 'শামীম গ্রোসারি & সুপারশপ', slug: 'shamim', phone: '01884700631', district: 'ঢাকা', address: 'মিরপুর ১২, ঢাকা' },
      { id: 3, name: 'আল-মদিনা জেনারেল স্টোর', slug: 'madina', phone: '01711223344', district: 'ঢাকা', address: 'উত্তরা সেক্টর ৭, ঢাকা' },
      { id: 4, name: 'বিসমিল্লাহ ট্রেডার্স & মুদি মার্ট', slug: 'bismillah', phone: '01822334455', district: 'চট্টগ্রাম', address: 'জিইসি মোড়, চট্টগ্রাম' },
      { id: 5, name: 'নিউ ঢাকা গ্রোসারি মার্ট', slug: 'dhaka', phone: '01933445566', district: 'সিলেট', address: 'জিন্দাবাজার, সিলেট' },
      { id: 6, name: 'জনপ্রিয় ডিপার্টমেন্টাল স্টোর', slug: 'jonopriyo', phone: '01544556677', district: 'রাজশাহী', address: 'সাহেব বাজার, রাজশাহী' },
    ];

    const mappedLocal = localStores.map((s: any, idx: number) => ({
      id: 100 + idx,
      name: s.storeName || s.name,
      slug: (s.subdomain || s.name).toLowerCase().replace(/[^a-z0-9]/g, ''),
      phone: s.phone,
      district: s.district || 'ঢাকা',
      address: s.address || 'ঢাকা, বাংলাদেশ',
    }));

    return [...defaultStores, ...mappedLocal];
  }, []);

  // Selected Store State
  const [selectedDistrict, setSelectedDistrict] = useState<string>('সব জেলা');
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1);
  const [activeStoreId, setActiveStoreId] = useState<number>(1);
  const [storeSearchQuery, setStoreSearchQuery] = useState<string>('');
  const [isShopSelectorModalOpen, setIsShopSelectorModalOpen] = useState(false);

  const activeStore = useMemo(() => {
    if (subdomainShopSlug) {
      const slugLower = subdomainShopSlug.toLowerCase();
      const matched = REGISTERED_STORES.find(
        (s) => s.slug === slugLower || s.name.toLowerCase().includes(slugLower)
      );
      if (matched) return matched;
    }
    return REGISTERED_STORES.find((s) => s.id === activeStoreId) || REGISTERED_STORES[0];
  }, [REGISTERED_STORES, activeStoreId, subdomainShopSlug]);

  const handleSelectStore = (storeId: number) => {
    setActiveStoreId(storeId);
    setSelectedStoreId(storeId);
    const chosen = REGISTERED_STORES.find((s) => s.id === storeId);
    if (chosen) {
      toast.success(`"${chosen.name}" স্টোরে স্বাগতম! 🏪`);
    }
    setIsShopSelectorModalOpen(false);
  };

  const handleGoToSelectedStore = () => {
    setActiveStoreId(selectedStoreId);
    const chosen = REGISTERED_STORES.find((s) => s.id === selectedStoreId);
    if (chosen) {
      toast.success(`"${chosen.name}" স্টোরে আপনাকে স্বাগতম! 🏪`);
    }
  };

  // Rotating Client Banners (Shows different registered clients & promotions)
  const CLIENT_BANNERS = useMemo(
    () => [
      {
        id: 1,
        storeId: 1,
        storeName: 'মুদি দোকান প্রো',
        branch: 'প্রধান আউটলেট',
        badge: 'স্পেশাল অফার ও মেগা গ্রোসারি ডিসকাউন্ট',
        title: 'মুদি দোকান প্রো — খাঁটি ও ফ্রেশ বাজার',
        subtitle: 'মিনিকেট চাল, সরিষার তেল ও নিত্যপ্রয়োজনীয় মুদি সামগ্রীতে সেরা মূল্য!',
        offerTag: 'মেগা অফার',
        image: '/grocery-hero-banner.jpg',
      },
      {
        id: 2,
        storeId: 4,
        storeName: 'বিসমিল্লাহ ট্রেডার্স & মুদি মার্ট',
        branch: 'চট্টগ্রাম শাখা',
        badge: 'পাইকারি ও খুচরা মূল্যের সেরা ডিল',
        title: 'বিসমিল্লাহ ট্রেডার্স — নিত্যপণ্যের বাজার',
        subtitle: 'আটা, ময়দা, ডাল, চিনি ও লবণ সেরা পাইকারি মূল্যে ঘরে বসেই নিন!',
        offerTag: 'ফ্রি হোম ডেলিভারি',
        image: '/banner-spices-grains.jpg',
      },
      {
        id: 3,
        storeId: 3,
        storeName: 'আল-মদিনা জেনারেল স্টোর',
        branch: 'উত্তরা শাখা',
        badge: '১০০% খাঁটি ও প্রাকৃতিক খাদ্য',
        title: 'আল-মদিনা স্টোর — খাঁটি মধু ও গাওয়া ঘি',
        subtitle: 'সুন্দরবনের প্রাকৃতিক মধু ও খাঁটি মসলায় নিশ্চিত বিশুদ্ধতা!',
        offerTag: '১০০% খাঁটি পণ্য',
        image: '/banner-honey-pure.jpg',
      },
      {
        id: 4,
        storeId: 5,
        storeName: 'নিউ ঢাকা গ্রোসারি মার্ট',
        branch: 'সিলেট শাখা',
        badge: 'ফ্রেশ মুদি ও দ্রুত ডেলিভারি',
        title: 'নিউ ঢাকা মার্ট — টাটকা মুদি ও ডেইরি',
        subtitle: 'প্রতিদিনের প্রয়োজনীয় চাল, তেল, চা ও স্ন্যাকসে বিশেষ ছাড়!',
        offerTag: '২০% পর্যন্ত ছাড়',
        image: '/grocery-hero-banner.jpg',
      },
    ],
    []
  );

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Auto-rotate client banners every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % CLIENT_BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [CLIENT_BANNERS.length]);

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
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtered Products (Resolved by CategoryId & Active Status)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Exclude inactive items
      if (p.isActive === false) return false;

      const catInfo = categoryMap.get(p.categoryId);
      const matchCat =
        selectedCategory === 'all' ||
        p.categoryId === Number(selectedCategory) ||
        (catInfo && (catInfo.name === selectedCategory || catInfo.nameBn === selectedCategory));

      const matchSearch =
        !productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.nameBn && p.nameBn.includes(productSearch)) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.barcode.includes(productSearch);

      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, categoryMap, productSearch]);

  // Cart & Checkout States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Delivery Location Option (Inside Dhaka 80 BDT / Outside Dhaka 150 BDT)
  const [deliveryLocation, setDeliveryLocation] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash'>('cod');
  const [advanceTrxId, setAdvanceTrxId] = useState('');
  const [orderSuccessModal, setOrderSuccessModal] = useState<{ open: boolean; orderId: string } | null>(null);

  // Add item to cart with Green Success Toast
  const addToCart = (product: any) => {
    const brandName = brandMap.get(product.brandId) || product.brand || 'জনপ্রিয় ব্র্যান্ড';
    const catInfo = categoryMap.get(product.categoryId);
    const catName = catInfo?.nameBn || catInfo?.name || 'মুদি সামগ্রী';

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
          category: catName,
          brand: brandName,
          unit: product.variant || product.baseUnit || '১ পিস',
          price: Number(product.sellingPrice) || 100,
          qty: 1,
          image: product.imageUrl,
        },
      ];
    });

    const title = product.nameBn || product.name;
    toast.success(`🛒 "${title}" সফলভাবে কার্টে যোগ হয়েছে!`, {
      style: { background: '#059669', color: '#ffffff', fontWeight: 'bold' },
      position: 'top-center',
      duration: 750,
    });
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

  // Delivery charge calculation: dynamic from settings
  const deliveryCharge =
    cart.length === 0
      ? 0
      : deliveryLocation === 'inside_dhaka'
        ? deliveryFeeInside
        : deliveryFeeOutside;
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
      deliveryLocation: deliveryLocation === 'inside_dhaka' ? 'ঢাকার মধ্যে' : 'ঢাকার বাইরে',
      items: cart,
      subtotal: cartSubtotal,
      deliveryCharge,
      total: cartTotal,
      paymentMethod,
      advanceTrxId: paymentMethod === 'bkash' ? advanceTrxId.trim() : null,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    try {
      const existingOrders = JSON.parse(localStorage.getItem('mudirdokan_customer_orders') || '[]');
      existingOrders.unshift(newOrder);
      localStorage.setItem('mudirdokan_customer_orders', JSON.stringify(existingOrders));
    } catch {}

    setCart([]);
    setIsCheckoutOpen(false);
    setOrderSuccessModal({ open: true, orderId });
  };

  // Related products (Shoukhin / Chaldal style)
  const relatedProducts = useMemo(() => {
    return products.slice(15, 21);
  }, [products]);

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans pb-24 md:pb-12">
      
      {/* 1. TOP STICKY HEADER (FROZEN ROW 1) */}
      <header className="sticky top-0 z-40 border-b border-emerald-100/90 bg-white/95 px-3 sm:px-6 lg:px-8 py-2.5 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-900/95 w-full">
        <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Category Hamburger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCategoryDrawerOpen(true)}
              aria-label="Categories menu"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 md:hidden cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <img
                src="/mudi-dokan-pro-logo.png"
                alt="Mudi Dokan Pro"
                className="h-8 sm:h-10 w-auto object-contain cursor-pointer"
                onClick={() => {
                  if (onBackToApp) onBackToApp();
                  else window.location.href = '/';
                }}
              />
            </div>
          </div>

          {/* Center: Search Bar (Desktop) & Branch Location Selector (Styled like Cart Button) */}
          <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 min-w-0 px-1 sm:px-3">
            {/* Search Input on Desktop (Ghorer Bazar Style) */}
            <div className="hidden md:flex relative flex-1 max-w-md">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="পণ্যের নাম, ব্র্যান্ড বা সাইজ লিখে খুঁজুন..."
                className="w-full rounded-full border border-slate-200 bg-slate-50/90 hover:bg-white px-4 py-2 pl-9 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white transition shadow-2xs"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Branch Selector Button with Location Pin Logo (Styled matching Cart Button) */}
            <button
              type="button"
              onClick={() => setIsShopSelectorModalOpen(true)}
              className="relative flex items-center gap-1 sm:gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2 sm:px-3 py-1.5 text-xs font-black text-emerald-950 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition cursor-pointer max-w-[105px] xs:max-w-[125px] sm:max-w-xs truncate shadow-2xs group shrink-0"
              title="ব্রাঞ্চ / শপ নির্বাচন করুন"
            >
              <div className="flex h-4 sm:h-5 w-4 sm:w-5 items-center justify-center rounded-full bg-emerald-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="h-2.5 sm:h-3 w-2.5 sm:w-3 stroke-2" />
              </div>
              <span className="truncate text-[11px] sm:text-xs">{activeStore.name}</span>
              <ChevronDown className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </button>
          </div>

          {/* Right Header: Mobile Search, Language, Theme, Cart Button & Shopkeeper App */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchOpen((prev) => !prev);
                if (!isMobileSearchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }
              }}
              className={`md:hidden flex items-center justify-center h-8 w-8 rounded-full border transition cursor-pointer shadow-2xs shrink-0 ${
                isMobileSearchOpen
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
              title="পণ্য খুঁজুন"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Language Switcher (Desktop only; on mobile it is in the drawer) */}
            <button
              type="button"
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="hidden md:flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-2xs"
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            >
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-mono font-bold uppercase">{lang === 'bn' ? 'EN' : 'বাং'}</span>
            </button>

            {/* Dark / Light Mode Toggle (Desktop only; on mobile it is in the drawer) */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="hidden md:flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
              title={darkMode ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 sm:px-3 py-1.5 text-xs font-black text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 transition cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">কার্ট</span>
              {totalItemCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-2xs">
                  {totalItemCount}
                </span>
              )}
            </button>

            {onGoToShopkeeperApp && (
              <button
                type="button"
                onClick={onGoToShopkeeperApp}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-2.5 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
              >
                <Store className="h-3.5 w-3.5 text-indigo-600" />
                <span>দোকানদার অ্যাপ</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Expandable Search Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 px-3 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-xs animate-fade-in">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="পণ্যের নাম, ব্র্যান্ড বা সাইজ লিখে খুঁজুন..."
                className="w-full rounded-full border border-emerald-300 bg-slate-50 pl-9 pr-8 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden dark:border-emerald-800 dark:bg-slate-800 dark:text-white"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-3 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. FROZEN ROW 2: CATEGORY HORIZONTAL BAR (MINIMAL HEIGHT) */}
      <div className="sticky top-[52px] z-30 border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 lg:px-8 py-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-2xs w-full">
        <div className="mx-auto flex w-full max-w-[1700px] items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-3 py-1 text-xs font-black transition cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            সব পণ্য ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.name)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCategory === c.name || selectedCategory === c.nameBn
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {c.nameBn || c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. ROTATING CLIENT BANNER (SIMPLE ON PHONE, CLIENT CAROUSEL) */}
      <div className="mx-auto w-full max-w-[1700px] px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        {(() => {
          const curBanner = CLIENT_BANNERS[activeBannerIdx] || CLIENT_BANNERS[0];
          return (
            <div
              className="rounded-2xl sm:rounded-3xl border border-emerald-300/40 shadow-md relative overflow-hidden bg-cover bg-center min-h-[145px] sm:min-h-[220px] md:min-h-[260px] flex items-center transition-all duration-700"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(4, 30, 20, 0.94) 0%, rgba(4, 30, 20, 0.82) 55%, rgba(6, 44, 28, 0.35) 85%, rgba(0, 0, 0, 0.2) 100%), url('${curBanner.image}')`,
              }}
            >
              {/* Content Container */}
              <div className="relative z-10 w-full p-3.5 sm:p-6 md:p-8 text-white flex flex-col justify-between h-full">
                <div className="space-y-1 sm:space-y-2 max-w-2xl">
                  {/* Top Badge */}
                  <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-amber-400 text-slate-950 px-2 sm:px-3 py-0.5 text-[9px] sm:text-[11px] font-black shadow-xs">
                    <Sparkles className="h-3 w-3 text-slate-950" />
                    <span className="truncate">{curBanner.badge}</span>
                  </div>

                  {/* Client / Shop Title */}
                  <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                    {curBanner.title}
                  </h1>

                  {/* Subtitle - hidden on very small phones to keep it super simple, visible sm+ */}
                  <p className="hidden sm:block text-xs sm:text-sm text-emerald-100 font-semibold drop-shadow-xs max-w-xl">
                    {curBanner.subtitle}
                  </p>

                  {/* Client Switcher Pill & Offer Tag */}
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectStore(curBanner.storeId)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-white hover:text-slate-950 px-2.5 sm:px-3.5 py-1 text-[10px] sm:text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      <Store className="h-3 w-3" />
                      <span>{curBanner.storeName}</span>
                      <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md font-extrabold text-[9px]">
                        {curBanner.offerTag}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShopSelectorModalOpen(true)}
                      className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                    >
                      <MapPin className="h-3 w-3 text-amber-300" />
                      <span>সব শপ দেখুন</span>
                    </button>
                  </div>
                </div>

                {/* Carousel Navigation Dots & Arrows */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    {CLIENT_BANNERS.map((b, idx) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setActiveBannerIdx(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          activeBannerIdx === idx ? 'w-5 sm:w-6 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                        title={b.storeName}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveBannerIdx((prev) => (prev - 1 + CLIENT_BANNERS.length) % CLIENT_BANNERS.length)}
                      className="h-6 w-6 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center cursor-pointer text-xs"
                      title="পূর্ববর্তী ব্যানার"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBannerIdx((prev) => (prev + 1) % CLIENT_BANNERS.length)}
                      className="h-6 w-6 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center cursor-pointer text-xs"
                      title="পরবর্তী ব্যানার"
                    >
                      ›
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 2.5. FEATURED CATEGORIES (GHORER BAZAR STYLE WITH CATEGORY IMAGES) */}
      <div className="mx-auto w-full max-w-[1700px] px-3 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Featured Categories</span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                জনপ্রিয় ক্যাটাগরি
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              পছন্দের ক্যাটাগরি স্পর্শ করে সহজে পণ্য খুঁজুন
            </p>
          </div>

          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              সব পণ্য দেখুন ({products.length}) ➔
            </button>
          )}
        </div>

        {/* Category Cards Carousel */}
        <div className="relative group">
          <div
            id="featured-categories-container"
            className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x scroll-smooth"
          >
            {/* 'All Items' Card */}
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all duration-200 min-w-[105px] sm:min-w-[125px] max-w-[125px] text-center cursor-pointer shrink-0 snap-start select-none shadow-xs ${
                selectedCategory === 'all'
                  ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white mb-2 shadow-inner group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-7 h-7 text-amber-300 stroke-2" />
              </div>
              <span className={`text-xs font-black line-clamp-1 ${
                selectedCategory === 'all' ? 'text-emerald-800 dark:text-emerald-300 font-black' : 'text-slate-800 dark:text-slate-200'
              }`}>
                সব পণ্য
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
                {products.length} আইটেম
              </span>
            </button>

            {/* Category Cards with real category images */}
            {categories.map((c) => {
              const catImg = getCategoryVisualImage(c.name || c.nameBn);
              const isSelected = selectedCategory === c.name || selectedCategory === c.nameBn;
              const count = products.filter(
                (p) => p.categoryId === c.id || p.category === c.name || p.category === c.nameBn
              ).length;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(c.name);
                    const el = document.getElementById('product-catalog-grid');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all duration-200 min-w-[105px] sm:min-w-[125px] max-w-[125px] text-center cursor-pointer shrink-0 snap-start select-none shadow-xs group ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/50 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                      : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-1.5 flex items-center justify-center mb-2 overflow-hidden border border-slate-100 dark:border-slate-700/50 group-hover:scale-105 transition-transform">
                    <img
                      src={catImg}
                      alt={c.nameBn || c.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span className={`text-xs font-bold line-clamp-1 leading-tight ${
                    isSelected ? 'text-emerald-800 dark:text-emerald-300 font-black' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {c.nameBn || c.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {count} পণ্য
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. SEARCH BAR & ITEM COUNT */}
      <div id="product-catalog-grid" className="mx-auto w-full max-w-[1700px] px-3 sm:px-6 lg:px-8 pt-5 scroll-mt-28">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
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

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            এই ক্যাটাগরিতে পণ্য আছে: <span className="text-emerald-700 dark:text-emerald-400 font-black">{filteredProducts.length}</span> টি
          </div>
        </div>

        {/* 3. PRODUCT GRID (Full width responsive: 2 cols on phone, up to 6 on desktop) */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <ShoppingBag className="h-10 w-10 mx-auto stroke-1 opacity-50 mb-2" />
            <p className="text-sm font-bold">এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি</p>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="mt-3 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold cursor-pointer"
            >
              সব পণ্য দেখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 w-full">
            {filteredProducts.slice(0, 60).map((product) => {
              const inCart = cart.find((i) => i.id === product.id);
              const price = Number(product.sellingPrice) || 100;
              const brandName = brandMap.get(product.brandId) || product.brand || 'জনপ্রিয় ব্র্যান্ড';

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 truncate max-w-[90px]">
                      {brandName}
                    </span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                      {formatVariant(product.variant || product.baseUnit, lang)}
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/40 my-1 flex items-center justify-center">
                    <ProductImage
                      src={product.imageUrl}
                      sku={product.sku}
                      alt={trCompact(product.name, product.nameBn, lang)}
                      size="card"
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Title & Price on Right */}
                  <div className="mt-1 flex items-start justify-between gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight flex-1">
                      {trCompact(product.name, product.nameBn, lang)}
                    </h3>
                    <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                      {formatBDT(price, lang)}
                    </span>
                  </div>

                  {/* Centered Prominent Order Button */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {inCart ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-500 bg-emerald-50 dark:bg-emerald-950 p-1">
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-2xs hover:bg-emerald-100 dark:bg-slate-900 dark:text-emerald-300"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs font-black px-2">{inCart.qty} টি</span>
                        <button
                          type="button"
                          onClick={() => updateQty(product.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-2 px-3 text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ কার্টে যোগ করুন</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* 4. RELATED PRODUCTS SECTION (SHOUKHINHD STYLE) */}
        <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>সম্পর্কিত ও জনপ্রিয় নিয়মিত মুদি পণ্যসমূহ</span>
            </h2>
            <span className="text-xs text-slate-400">বেস্টসেলার আইটেম</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {relatedProducts.map((rp) => (
              <div
                key={rp.id}
                className="flex flex-col justify-between rounded-xl border border-slate-100 p-2 text-center hover:border-emerald-300 transition dark:border-slate-800"
              >
                <div className="aspect-square w-full rounded-lg bg-slate-50 dark:bg-slate-800/40 p-2 flex items-center justify-center">
                  <ProductImage
                    src={rp.imageUrl}
                    sku={rp.sku}
                    alt={rp.name}
                    size="sm"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-1 font-bold text-xs truncate">{trCompact(rp.name, rp.nameBn, lang)}</div>
                <div className="font-mono text-xs font-black text-emerald-600 mt-0.5">{formatBDT(Number(rp.sellingPrice) || 95)}</div>
                <button
                  type="button"
                  onClick={() => addToCart(rp)}
                  className="mt-2 w-full rounded-lg bg-emerald-50 border border-emerald-200 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                >
                  + অর্ডার
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. ALWAYS FLOATING CART BUTTON (GHORER BAZAR STYLE - RIGHT DOCKED TAB) */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-transform duration-200 hover:-translate-x-1 select-none">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center bg-gradient-to-b from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white px-2.5 sm:px-3 py-3 sm:py-4 rounded-l-2xl shadow-2xl border-l-2 border-y-2 border-emerald-300/60 ring-2 ring-emerald-500/20 cursor-pointer text-center min-w-[65px] sm:min-w-[72px]"
          aria-label="Open Shopping Cart"
        >
          <div className="relative mb-1">
            <ShoppingBag className="h-5 sm:h-6 w-5 sm:w-6 text-amber-300 stroke-2" />
            <span className="absolute -top-2 -right-2 flex h-4 sm:h-4.5 w-4 sm:w-4.5 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[9px] sm:text-[10px] font-black shadow-xs">
              {totalItemCount}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-extrabold tracking-tight leading-tight text-white whitespace-nowrap">
            {totalItemCount} Items
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono font-black text-amber-300 mt-1 whitespace-nowrap bg-black/25 px-1.5 py-0.5 rounded-md">
            {totalItemCount > 0 ? `৳${cartTotal}` : '৳০'}
          </span>
        </button>
      </div>

      {/* 6. SLIDE-OVER CART DRAWER (MOBILE-FIRST PROFESSIONAL DESIGN) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 h-[100dvh] flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-slide-left">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    আপনার শপিং ব্যাগ
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {totalItemCount > 0 ? `${totalItemCount}টি পণ্য নির্বাচিত` : 'কোনো পণ্য নেই'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 cursor-pointer"
                  >
                    সব মুছুন
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 overscroll-contain">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <ShoppingBag className="h-16 w-16 mx-auto stroke-1 opacity-40 text-emerald-600" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">আপনার কার্ট বর্তমানে খালি</p>
                  <p className="text-xs text-slate-400">পছন্দের পণ্য কার্টে যোগ করে অর্ডার করুন</p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-black shadow-md cursor-pointer transition"
                  >
                    পণ্য ব্রাউজ করুন 🛍️
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {item.nameBn || item.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">{item.brand} · {item.unit}</p>
                      <div className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 mt-1">
                        ৳{item.price * item.qty}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({item.qty} x ৳{item.price})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="h-7 w-7 flex items-center justify-center text-slate-600 hover:text-rose-600 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2 text-xs font-black min-w-[20px] text-center">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="h-7 w-7 flex items-center justify-center text-slate-600 hover:text-emerald-600 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Delivery Charge Selector & Sticky Footer Buttons */}
            {cart.length > 0 && (
              <div className="border-t border-slate-200 p-3.5 sm:p-4 space-y-3 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 shrink-0">
                {/* Delivery Location Selector */}
                <div className="space-y-1.5">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    ডেলিভারি এলাকা নির্বাচন করুন:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryLocation('inside_dhaka')}
                      className={`rounded-xl border p-2.5 text-xs font-bold text-center transition cursor-pointer ${
                        deliveryLocation === 'inside_dhaka'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      🚚 ঢাকার মধ্যে (৳{deliveryFeeInside})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryLocation('outside_dhaka')}
                      className={`rounded-xl border p-2.5 text-xs font-bold text-center transition cursor-pointer ${
                        deliveryLocation === 'outside_dhaka'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      🚛 ঢাকার বাইরে (৳{deliveryFeeOutside})
                    </button>
                  </div>
                </div>

                {/* Calculation */}
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>পণ্যের মোট মূল্য:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">৳{cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">৳{deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800">
                    <span>সর্বমোট প্রদেয় বিল:</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 text-base">৳{cartTotal}</span>
                  </div>
                </div>

                {/* Two Action Buttons */}
                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 py-3.5 text-xs sm:text-sm font-black text-white shadow-xl shadow-emerald-600/30 transition cursor-pointer"
                  >
                    <span>অর্ডার সম্পন্ন করুন (৳{cartTotal})</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="w-full rounded-2xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
                  >
                    আরও শপিং করুন (Continue Shopping)
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* 7. EXPRESS CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 my-auto">
            
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 cursor-pointer"
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
              <p className="text-xs text-slate-500 mt-0.5">
                মোট প্রদেয়: <strong className="font-mono text-emerald-600">৳{cartTotal}</strong> ({deliveryLocation === 'inside_dhaka' ? `ঢাকার মধ্যে চার্জ ৳${deliveryFeeInside} সহ` : `ঢাকার বাইরে চার্জ ৳${deliveryFeeOutside} সহ`})
              </p>
            </div>

            <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3.5">
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

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পূর্ণ ঠিকানা (বাড়ি/রোড, এলাকা) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="যেমন: বাসা ১২, রোড ৩, ব্লক-সি, মিরপুর ১০, ঢাকা"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  পেমেন্ট পদ্ধতি:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`rounded-xl border p-2.5 text-xs font-bold text-left transition cursor-pointer ${
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
                    className={`rounded-xl border p-2.5 text-xs font-bold text-left transition cursor-pointer ${
                      paymentMethod === 'bkash'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    💳 বিকাশ / নগদ অগ্রিম
                  </button>
                </div>
              </div>

              {paymentMethod === 'bkash' && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                  <p className="font-semibold">
                    বিকাশ সেন্ড মানি করুন: <strong className="font-mono">01884700631</strong>
                  </p>
                  <input
                    type="text"
                    value={advanceTrxId}
                    onChange={(e) => setAdvanceTrxId(e.target.value)}
                    placeholder="TrxID লিখুন (যেমন: 9J382XLM)"
                    className="mt-2 w-full rounded-lg border border-rose-300 bg-white p-2 font-mono text-xs"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 py-3.5 text-xs sm:text-sm font-black text-white shadow-xl shadow-emerald-600/30 transition cursor-pointer"
              >
                <span>অর্ডার নিশ্চিত করুন (৳{cartTotal})</span>
                <Check className="h-4 w-4" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* 7.5. SHOP & LOCATION SELECTOR MODAL */}
      {isShopSelectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    লোকেশন ও শপ নির্বাচন করুন
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    নিকটবর্তী এলাকা নির্বাচন করে আপনার পছন্দের মুদি দোকান বেছে নিন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShopSelectorModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  placeholder="দোকানের নাম বা মোবাইল নম্বর লিখে খুঁজুন..."
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* District pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedDistrict('সব জেলা')}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap cursor-pointer transition ${
                    selectedDistrict === 'সব জেলা'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  সব জেলা ({REGISTERED_STORES.length})
                </button>
                {ALL_DISTRICTS.map((dist) => {
                  const count = REGISTERED_STORES.filter((s) => s.district === dist).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setSelectedDistrict(dist)}
                      className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap cursor-pointer transition ${
                        selectedDistrict === dist
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {dist} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shop List Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
              {filteredStoresList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  কোনো দোকান পাওয়া যায়নি। অনুগ্রহ করে অন্য জেলা বা সার্চ টার্ম চেষ্টা করুন।
                </div>
              ) : (
                filteredStoresList.map((shop) => {
                  const isCurrent = activeStore.id === shop.id;
                  return (
                    <div
                      key={shop.id}
                      onClick={() => handleSelectStore(shop.id)}
                      className={`group flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Store className={`h-4 w-4 ${isCurrent ? 'text-emerald-600' : 'text-slate-500'}`} />
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                            {shop.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                              বর্তমান শপ
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-emerald-600" />
                            {shop.district} · {shop.address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-emerald-600" />
                            {shop.phone}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        <button
                          type="button"
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-800 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/70 dark:text-emerald-300'
                          }`}
                        >
                          {isCurrent ? 'নির্বাচিত' : 'বেছে নিন ➔'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 p-3 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsShopSelectorModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ORDER SUCCESS MODAL */}
      {orderSuccessModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <Check className="h-8 w-8 stroke-3" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-3">
              অর্ডারটি সফল হয়েছে!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              অর্ডার আইডি: <strong className="font-mono text-emerald-600">{orderSuccessModal.orderId}</strong>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {activeStore.name} কর্তৃপক্ষ খুব শীঘ্রই আপনার সাথে ফোনে যোগাযোগ করবে।
            </p>
            <button
              type="button"
              onClick={() => setOrderSuccessModal(null)}
              className="mt-5 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* 9. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 dark:bg-slate-900/95 dark:border-slate-800 py-1.5 px-4 flex items-center justify-around text-[10px] font-bold text-slate-600 dark:text-slate-400 shadow-lg">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-1 text-emerald-600 dark:text-emerald-400"
        >
          <Home className="h-4 w-4" />
          <span>হোম</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCategoryDrawerOpen(true)}
          className="flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white"
        >
          <Layers className="h-4 w-4" />
          <span>ক্যাটাগরি</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="relative flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white"
        >
          <div className="relative">
            <ShoppingBag className="h-4 w-4" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[9px] text-white">
                {totalItemCount}
              </span>
            )}
          </div>
          <span>কার্ট</span>
        </button>

        <a
          href={`tel:${activeStore.phone}`}
          className="flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white"
        >
          <Phone className="h-4 w-4 text-emerald-600" />
          <span>কল করুন</span>
        </a>
      </nav>

      {/* 10. MOBILE CATEGORY & CONTROLS DRAWER */}
      {isCategoryDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-slate-950/70 backdrop-blur-xs animate-fade-in md:hidden">
          <div className="w-[85%] max-w-xs bg-white dark:bg-slate-900 h-[100dvh] flex flex-col shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-slide-left">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800 shrink-0">
              <img
                src="/mudi-dokan-pro-logo.png"
                alt="Mudi Dokan Pro"
                className="h-8 w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setIsCategoryDrawerOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Language & Theme Controls Strip */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
                  <span>ভাষা (Language):</span>
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setLang('bn')}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                      lang === 'bn' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                      lang === 'en' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  {darkMode ? <Moon className="h-3.5 w-3.5 text-amber-400" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
                  <span>থিম (Mode):</span>
                </span>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {darkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-600" />}
                  <span>{darkMode ? 'লাইট মোড' : 'ডার্ক মোড'}</span>
                </button>
              </div>

              {onGoToShopkeeperApp && (
                <button
                  type="button"
                  onClick={onGoToShopkeeperApp}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/90 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
                >
                  <Store className="h-3.5 w-3.5 text-indigo-600" />
                  <span>দোকানদার ড্যাশবোর্ড</span>
                </button>
              )}
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-2 py-1">
                সকল ক্যাটাগরি
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setIsCategoryDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>সব পণ্য</span>
                </div>
                <span className="text-[10px] opacity-80">{products.length}</span>
              </button>

              {categories.map((c) => {
                const isSelected = selectedCategory === c.name || selectedCategory === c.nameBn;
                const catImg = getCategoryVisualImage(c.name || c.nameBn);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.name);
                      setIsCategoryDrawerOpen(false);
                      const el = document.getElementById('product-catalog-grid');
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={catImg} alt="" className="h-5 w-5 object-contain" />
                      <span className="truncate">{c.nameBn || c.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
