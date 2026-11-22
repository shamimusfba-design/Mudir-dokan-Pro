import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User as FirebaseUser } from 'firebase/auth';
import { toast } from 'sonner';
import { auth, googleAuthProvider } from '../lib/firebase';
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
import { getSavedLang, normalizeLang, saveLang, type LanguageMode } from '../lib/i18n';
import { useOnlineStatus } from '../hooks/usePWAInstall';

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
  firebaseUser: FirebaseUser | null;
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
  logout: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  switchRole: (role: 'OWNER' | 'MANAGER' | 'CASHIER') => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);

  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [settings, setSettings] = useState<StoreSettingsInfo | null>(null);
  const [categories, setCategories] = useState<CachedCategory[]>([]);
  const [brands, setBrands] = useState<CachedBrand[]>([]);
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [customers, setCustomers] = useState<CachedCustomer[]>([]);
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
    if (!auth.currentUser) return;
    setBootstrapLoading(true);
    try {
      if (navigator.onLine) {
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
        setCategories(boot.categories);
        setBrands(boot.brands);
        setProducts(boot.products);
        setCustomers(custList);
        await cacheStoreCatalog({
          categories: boot.categories,
          brands: boot.brands,
          products: boot.products,
          customers: custList,
        });
      } else {
        const [p, c, b, cust] = await Promise.all([
          offlineDb.products.toArray(),
          offlineDb.categories.toArray(),
          offlineDb.brands.toArray(),
          offlineDb.customers.toArray(),
        ]);
        setProducts(p);
        setCategories(c);
        setBrands(b);
        setCustomers(cust);
      }
    } catch (err) {
      // Fallback to IndexedDB cache if server unreachable
      const [p, c, b, cust] = await Promise.all([
        offlineDb.products.toArray(),
        offlineDb.categories.toArray(),
        offlineDb.brands.toArray(),
        offlineDb.customers.toArray(),
      ]);
      if (p.length > 0) {
        setProducts(p);
        setCategories(c);
        setBrands(b);
        setCustomers(cust);
        toast.warning('Loaded cached offline catalog');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to load catalog');
      }
    } finally {
      await loadOfflineQueue();
      setBootstrapLoading(false);
    }
  }, [loadOfflineQueue]);

  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || !auth.currentUser || isSyncing) return;
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
          invoiceNumber?: string;
          message?: string;
        }>;
      }>('/api/sales/sync', {
        method: 'POST',
        body: JSON.stringify({
          sales: pending.map((q) => ({
            clientTransactionUuid: q.clientTransactionUuid,
            saleDate: q.payload.saleDate,
            customerId: q.payload.customerId,
            billDiscount: q.payload.billDiscount,
            expectedPaymentDate: q.payload.expectedPaymentDate,
            notes: q.payload.notes,
            isOfflineOrigin: true,
            items: q.payload.items.map((i) => ({
              productId: i.productId,
              unitName: i.unitName,
              conversionFactor: i.conversionFactor,
              enteredQty: i.enteredQty,
              unitSellingPrice: i.unitSellingPrice,
              itemDiscount: i.itemDiscount,
            })),
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (firebaseUser) {
      refreshCatalog();
    } else {
      setStaff(null);
      setStore(null);
    }
  }, [firebaseUser, refreshCatalog]);

  // Automatically flush offline queue when internet reconnects
  useEffect(() => {
    if (isOnline && firebaseUser) {
      syncOfflineQueue();
    }
  }, [isOnline, firebaseUser, syncOfflineQueue]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const logout = async () => {
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
        firebaseUser,
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

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
