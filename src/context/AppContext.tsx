import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { auth, googleAuthProvider } from '../lib/firebase';
import { supabase, isSupabaseAuthEnabled } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import {
  offlineDb,
  cacheStoreCatalog,
  type CachedProduct,
  type CachedCategory,
  type CachedBrand,
  type CachedCustomer,
  type QueuedOfflineSale,
} from '../lib/offline-db';
import { getClientDemoCatalog } from '../lib/client-catalog.ts';
import { getSavedLang, normalizeLang, saveLang, type LanguageMode } from '../lib/i18n';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export interface AuthSessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  provider: 'supabase' | 'firebase';
}

export interface StoreInfo {
  id: number;
  name: string;
  nameBn: string;
  phone: string;
  address: string;
  addressBn: string;
  binNumber?: string | null;
  logoUrl?: string | null;
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
}

export interface StoreSettingsInfo {
  languageMode: 'EN' | 'BN' | 'BOTH';
  receiptFormat: '58MM' | '80MM' | 'A4';
  receiptHeader: string;
  receiptFooter: string;
  allowNegativeStock: boolean;
  allowCashierPriceEdit: boolean;
  allowCashierDiscount: boolean;
  allowCashierReports: boolean;
  invoicePrefix: string;
  purchasePrefix: string;
  customerPrefix: string;
  smsProvider: 'NONE' | 'WEBHOOK' | 'WHATSAPP_LINK';
  smsWebhookUrl: string;
  smsSenderId: string;
  demoModeActive?: boolean;
  demoPeriodStart?: string | null;
  demoPeriodEnd?: string | null;
  demoLoadedAt?: string | null;
}

export interface StaffProfile {
  uid: string;
  email: string;
  name: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER';
}

interface AppContextValue {
  firebaseUser: AuthSessionUser | null;
  authLoading: boolean;
  bootstrapLoading: boolean;
  staff: StaffProfile | null;
  store: StoreInfo | null;
  settings: StoreSettingsInfo | null;
  categories: CachedCategory[];
  brands: CachedBrand[];
  products: CachedProduct[];
  customers: CachedCustomer[];
  pendingOfflineSales: QueuedOfflineSale[];
  isOnline: boolean;
  isSyncing: boolean;
  lang: LanguageMode;
  setLang: (mode: LanguageMode) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  signInWithGoogle: () => Promise<void>;
  enterDemoMode: () => Promise<void>;
  logout: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  switchRole: (role: 'OWNER' | 'MANAGER' | 'CASHIER') => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);

  const authUserRef = useRef<AuthSessionUser | null>(null);
  authUserRef.current = authUser;

  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [settings, setSettings] = useState<StoreSettingsInfo | null>(null);
  const [categories, setCategories] = useState<CachedCategory[]>(() => getClientDemoCatalog().categories);
  const [brands, setBrands] = useState<CachedBrand[]>(() => getClientDemoCatalog().brands);
  const [products, setProducts] = useState<CachedProduct[]>(() => getClientDemoCatalog().products);
  const [customers, setCustomers] = useState<CachedCustomer[]>(() => getClientDemoCatalog().customers);
  const [pendingOfflineSales, setPendingOfflineSales] = useState<QueuedOfflineSale[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const isOnline = useOnlineStatus();

  const [lang, setLangState] = useState<LanguageMode>(() => getSavedLang());

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mudirdokan_theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('mudirdokan_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.lang = lang === 'BN' ? 'bn' : 'en';
  }, [lang]);

  const setLang = useCallback((mode: LanguageMode) => {
    const next = normalizeLang(mode);
    setLangState(next);
    saveLang(next);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const loadOfflineQueue = useCallback(async () => {
    try {
      const queue = await offlineDb.offlineSalesQueue.toArray();
      setPendingOfflineSales(queue.filter((q) => q.status !== 'SYNCED'));
    } catch (err) {
      console.error('Failed reading Dexie queue:', err);
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    setBootstrapLoading(true);
    try {
      if (navigator.onLine && authUserRef.current && authUserRef.current.uid !== 'demo-shopkeeper-uid') {
        const [boot, custList] = await Promise.all([
          apiFetch<{
            user: StaffProfile;
            store: StoreInfo;
            settings: StoreSettingsInfo;
            categories: CachedCategory[];
            brands: CachedBrand[];
            products: CachedProduct[];
          }>('/api/catalog/bootstrap'),
          apiFetch<CachedCustomer[]>('/api/customers'),
        ]);
        setStaff(boot.user);
        setStore(boot.store);
        setSettings(boot.settings);

        // Fallback to client master catalog (1,359 items) if remote store is empty
        const demoData = getClientDemoCatalog();
        const finalProds = boot.products && boot.products.length > 0 ? boot.products : demoData.products;
        const finalCats = boot.categories && boot.categories.length > 0 ? boot.categories : demoData.categories;
        const finalBrands = boot.brands && boot.brands.length > 0 ? boot.brands : demoData.brands;
        const finalCust = custList && custList.length > 0 ? custList : demoData.customers;

        setCategories(finalCats);
        setBrands(finalBrands);
        setProducts(finalProds);
        setCustomers(finalCust);
        await cacheStoreCatalog({
          categories: finalCats,
          brands: finalBrands,
          products: finalProds,
          customers: finalCust,
        });
      } else {
        let [p, c, b, cust] = await Promise.all([
          offlineDb.products.toArray(),
          offlineDb.categories.toArray(),
          offlineDb.brands.toArray(),
          offlineDb.customers.toArray(),
        ]);
        const demoData = getClientDemoCatalog();
        if (!p || p.length < demoData.products.length) {
          await cacheStoreCatalog(demoData);
          p = demoData.products;
          c = demoData.categories;
          b = demoData.brands;
          cust = demoData.customers;
        }
        setProducts(p);
        setCategories(c);
        setBrands(b);
        setCustomers(cust);
      }
    } catch (_err) {
      // Fallback to IndexedDB cache or instant Client Demo Catalog if server unreachable
      try {
        let [p, c, b, cust] = await Promise.all([
          offlineDb.products.toArray(),
          offlineDb.categories.toArray(),
          offlineDb.brands.toArray(),
          offlineDb.customers.toArray(),
        ]);
        const demoData = getClientDemoCatalog();
        if (!p || p.length < demoData.products.length) {
          await cacheStoreCatalog(demoData);
          p = demoData.products;
          c = demoData.categories;
          b = demoData.brands;
          cust = demoData.customers;
        }
        setProducts(p);
        setCategories(c);
        setBrands(b);
        setCustomers(cust);
      } catch {
        const demoData = getClientDemoCatalog();
        setProducts(demoData.products);
        setCategories(demoData.categories);
        setBrands(demoData.brands);
        setCustomers(demoData.customers);
      }
      setStaff((prev) => prev || {
        uid: 'demo-shopkeeper-uid',
        email: 'shopkeeper@mudirdokan.local',
        name: 'মুদির দোকান প্রো (শপকিপার)',
        role: 'OWNER',
      });
      setStore((prev) => prev || {
        id: 1,
        name: 'মুদির দোকান প্রো',
        nameBn: 'মুদির দোকান প্রো',
        phone: '01700000000',
        address: 'মিরপুর-১০, ঢাকা',
        addressBn: 'মিরপুর-১০, ঢাকা',
        currency: 'BDT',
        currencySymbol: '৳',
        timezone: 'Asia/Dhaka',
        dateFormat: 'YYYY-MM-DD',
        logoUrl: null,
      });
      setSettings((prev) => prev || {
        languageMode: 'BN',
        receiptFormat: '58MM',
        receiptHeader: 'মুদির দোকান প্রো',
        receiptFooter: 'ধন্যবাদ, আবার আসবেন',
        allowNegativeStock: false,
        allowCashierPriceEdit: false,
        allowCashierDiscount: true,
        allowCashierReports: false,
        invoicePrefix: 'INV',
        purchasePrefix: 'PUR',
        customerPrefix: 'CUST',
        smsWebhookUrl: '',
        smsSenderId: 'MudirDokan',
        demoModeActive: true,
        demoPeriodStart: '2026-05-01',
        demoPeriodEnd: '2026-10-31',
        smsProvider: 'WHATSAPP_LINK',
      });
    } finally {
      await loadOfflineQueue();
      setBootstrapLoading(false);
    }
  }, [loadOfflineQueue]);

  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || !authUserRef.current || isSyncing) return;
    const pending = await offlineDb.offlineSalesQueue
      .filter((q) => q.status === 'PENDING' || q.status === 'ERROR')
      .toArray();
    if (pending.length === 0) return;

    setIsSyncing(true);
    try {
      const resp = await apiFetch<{
        results: Array<{
          clientTransactionUuid: string;
          status: 'SYNCED' | 'DUPLICATE_SKIPPED' | 'CONFLICT' | 'ERROR';
          serverSaleId?: number;
          message?: string;
        }>;
      }>('/api/sales/batch-offline', {
        method: 'POST',
        body: JSON.stringify({
          sales: pending.map((q) => ({
            clientTransactionUuid: q.clientTransactionUuid,
            saleDate: q.payload.saleDate,
            customerId: q.payload.customerId,
            billDiscount: q.payload.billDiscount,
            notes: q.payload.notes,
            expectedPaymentDate: q.payload.expectedPaymentDate,
            items: q.payload.items,
            payments: q.payload.payments,
          })),
        }),
      });

      let syncedCount = 0;
      let conflictCount = 0;

      for (const r of resp.results) {
        if (r.status === 'SYNCED' || r.status === 'DUPLICATE_SKIPPED') {
          syncedCount += 1;
          await offlineDb.offlineSalesQueue.update(r.clientTransactionUuid, {
            status: 'SYNCED',
            syncedAt: new Date().toISOString(),
            errorMessage: undefined,
          });
        } else {
          conflictCount += 1;
          const existing = await offlineDb.offlineSalesQueue.get(r.clientTransactionUuid);
          await offlineDb.offlineSalesQueue.update(r.clientTransactionUuid, {
            status: r.status === 'CONFLICT' ? 'CONFLICT' : 'ERROR',
            errorMessage: r.message || 'Sync error',
            retryCount: (existing?.retryCount || 0) + 1,
          });
        }
      }

      if (syncedCount > 0) {
        toast.success(`Synchronized ${syncedCount} offline sale${syncedCount > 1 ? 's' : ''} to cloud database`);
        await refreshCatalog();
      }
      if (conflictCount > 0) {
        toast.error(`${conflictCount} offline sale(s) had sync conflicts. Check Settings -> Sync Queue.`);
      }
    } catch (err) {
      console.error('Offline sync failed:', err);
    } finally {
      await loadOfflineQueue();
      setIsSyncing(false);
    }
  }, [isSyncing, loadOfflineQueue, refreshCatalog]);

  const enterDemoMode = useCallback(async () => {
    const demoData = getClientDemoCatalog();
    await cacheStoreCatalog(demoData);
    setProducts(demoData.products);
    setCategories(demoData.categories);
    setBrands(demoData.brands);
    setCustomers(demoData.customers);
    const mockUser: AuthSessionUser = {
      uid: 'demo-shopkeeper-uid',
      email: 'demo@mudirdokan.local',
      displayName: 'মুদির দোকান প্রো (শপকিপার)',
      photoURL: null,
      provider: 'firebase',
    };
    setAuthUser(mockUser);
    setStaff({
      uid: 'demo-shopkeeper-uid',
      email: 'demo@mudirdokan.local',
      name: 'মুদির দোকান প্রো (শপকিপার)',
      role: 'OWNER',
    });
    setStore({
      id: 1,
      name: 'মুদির দোকান প্রো',
      nameBn: 'মুদির দোকান প্রো',
      phone: '01700000000',
      address: 'মিরপুর-১০, ঢাকা',
      addressBn: 'মিরপুর-১০, ঢাকা',
      currency: 'BDT',
      currencySymbol: '৳',
      timezone: 'Asia/Dhaka',
      dateFormat: 'YYYY-MM-DD',
      logoUrl: null,
    });
    setSettings({
      languageMode: 'BN',
      receiptFormat: '58MM',
      receiptHeader: 'মুদির দোকান প্রো',
      receiptFooter: 'ধন্যবাদ, আবার আসবেন',
      allowNegativeStock: false,
      allowCashierPriceEdit: false,
      allowCashierDiscount: true,
      allowCashierReports: false,
      invoicePrefix: 'INV',
      purchasePrefix: 'PUR',
      customerPrefix: 'CUST',
      smsWebhookUrl: '',
      smsSenderId: 'MudirDokan',
      demoModeActive: true,
      demoPeriodStart: '2026-05-01',
      demoPeriodEnd: '2026-10-31',
      smsProvider: 'WHATSAPP_LINK',
    });
    localStorage.setItem('mudirdokan_demo_session', 'true');
    toast.success('ডেমো স্টোর ও ১,৩৫৯টি পণ্য সফলভাবে লোড হয়েছে');
  }, []);

  // Subscribe to Firebase Auth (Primary Google Sign-In)
  useEffect(() => {
    // Process redirect result if browser redirected
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: 'firebase',
        });
      } else if (localStorage.getItem('mudirdokan_demo_session') === 'true') {
        enterDemoMode();
      } else {
        setAuthUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [enterDemoMode]);

  useEffect(() => {
    if (authUser) {
      refreshCatalog();
    } else {
      setStaff(null);
      setStore(null);
    }
  }, [authUser, refreshCatalog]);

  // Automatically flush offline queue when internet reconnects
  useEffect(() => {
    if (isOnline && authUser) {
      syncOfflineQueue();
    }
  }, [isOnline, authUser, syncOfflineQueue]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleAuthProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect sign-in error:', redirectErr);
        }
      }
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const logout = async () => {
    localStorage.removeItem('mudirdokan_demo_session');
    setAuthUser(null);
    setStaff(null);
    setStore(null);
    await signOut(auth);
  };

  const switchRole = async (role: 'OWNER' | 'MANAGER' | 'CASHIER') => {
    try {
      const res = await apiFetch<{ role: 'OWNER' | 'MANAGER' | 'CASHIER' }>('/api/finance/role', {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      setStaff((prev) => (prev ? { ...prev, role: res.role } : prev));
      toast.success(`Switched active shift role to ${res.role}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to switch role');
    }
  };

  return (
    <AppContext.Provider
      value={{
        firebaseUser: authUser,
        authLoading,
        bootstrapLoading,
        staff,
        store,
        settings,
        categories,
        brands,
        products,
        customers,
        pendingOfflineSales,
        isOnline,
        isSyncing,
        lang,
        setLang,
        darkMode,
        toggleDarkMode,
        signInWithGoogle,
        enterDemoMode,
        logout,
        refreshCatalog,
        syncOfflineQueue,
        switchRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
