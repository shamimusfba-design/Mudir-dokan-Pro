import React, { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'sonner';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Building2,
  BookOpen,
  Clock,
  HandCoins,
  Receipt,
  BarChart3,
  Vault,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  WifiOff,
  Smartphone,
  Plus,
  Store,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { tr, trCompact, tx, formatStatusLabel, type LanguageMode } from './lib/i18n';
import { PWAInstallButton } from './hooks/usePWAInstall';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CustomersKhataPage } from './pages/CustomersKhataPage';
import { CustomerDuePage } from './pages/CustomerDuePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { CashManagementPage } from './pages/CashManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';

type TabId =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'customer-due'
  | 'supplier-due'
  | 'expenses'
  | 'reports'
  | 'cash'
  | 'settings';

interface NavItem {
  id: TabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'operations' | 'credit' | 'finance';
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard, group: 'operations' },
  { id: 'pos', labelKey: 'pos', icon: ShoppingCart, group: 'operations' },
  { id: 'products', labelKey: 'products', icon: Package, group: 'operations' },
  { id: 'inventory', labelKey: 'inventory', icon: Warehouse, group: 'operations' },
  { id: 'purchases', labelKey: 'purchases', icon: Truck, group: 'operations' },
  { id: 'suppliers', labelKey: 'suppliers', icon: Building2, group: 'operations' },
  { id: 'customers', labelKey: 'customers', icon: BookOpen, group: 'credit' },
  { id: 'customer-due', labelKey: 'customerDue', icon: Clock, group: 'credit' },
  { id: 'supplier-due', labelKey: 'supplierDue', icon: HandCoins, group: 'credit' },
  { id: 'expenses', labelKey: 'expenses', icon: Receipt, group: 'finance' },
  { id: 'reports', labelKey: 'reports', icon: BarChart3, group: 'finance' },
  { id: 'cash', labelKey: 'cashManagement', icon: Vault, group: 'finance' },
  { id: 'settings', labelKey: 'settings', icon: Settings, group: 'finance' },
];

const LanguageSwitcher: React.FC<{ lang: LanguageMode; setLang: (m: LanguageMode) => void }> = ({
  lang,
  setLang,
}) => (
  <div
    className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800 shrink-0"
    role="group"
    aria-label="Language mode"
  >
    {(
      [
        ['EN', 'English'],
        ['BN', 'বাংলা'],
      ] as const
    ).map(([mode, label]) => (
      <button
        key={mode}
        type="button"
        onClick={() => setLang(mode)}
        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
          lang === mode
            ? 'bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const ShopkeeperShell: React.FC<{ onOpenPortal: () => void }> = ({ onOpenPortal }) => {
  const {
    firebaseUser,
    authLoading,
    bootstrapLoading,
    staff,
    store,
    pendingOfflineSales,
    isOnline,
    isSyncing,
    lang,
    setLang,
    darkMode,
    toggleDarkMode,
    signInWithGoogle,
    logout,
    syncOfflineQueue,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeNav = useMemo(
    () => NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0],
    [activeTab]
  );

  const handleNavigate = (tab: string) => {
    if (NAV_ITEMS.some((n) => n.id === tab)) {
      setActiveTab(tab as TabId);
      setSidebarOpen(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {tx(lang, 'Loading MudirDokan Pro...', 'মুদির দোকান প্রো লোড হচ্ছে...')}
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen flex-col justify-between bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {tr('appName', lang)}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher lang={lang} setLang={setLang} />
            <PWAInstallButton compact />
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={tx(lang, 'Toggle color theme', 'থিম পরিবর্তন করুন')}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="mx-auto my-auto flex w-full max-w-4xl flex-col items-center py-10">
          <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
            <div className="md:col-span-7 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                {tx(lang, 'Bangladesh Grocery POS & Digital Khata', 'বাংলাদেশ মুদির দোকান পস ও ডিজিটাল খাতা')}
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                {tx(
                  lang,
                  'Fast Counter Billing, Stock & Customer Khata.',
                  'দ্রুত কাউন্টার বিলিং, স্টক ও ক্রেতার ডিজিটাল খাতা।'
                )}
              </h1>
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
                {tx(
                  lang,
                  'Built for Bangladeshi grocery stores and mini-supermarkets. Preloaded with 50 popular BD FMCG products, weighted-average profit tracking, offline-first POS, and customer due management.',
                  'বাংলাদেশের মুদির দোকান, জেনারেল স্টোর ও মিনি সুপারমার্কেটের জন্য তৈরি। ৫০টি জনপ্রিয় বাংলাদেশি পণ্য, প্রকৃত লাভের হিসাব, অফলাইন পস এবং ক্রেতার বাকি ব্যবস্থাপনা একসাথে।'
                )}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {tx(lang, 'Offline-First Counter', 'অফলাইন-প্রথম কাউন্টার')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tx(
                      lang,
                      'Keep billing if internet drops; auto-syncs to cloud database on reconnect.',
                      'ইন্টারনেট না থাকলেও বিক্রি চালু রাখুন; সংযোগ ফিরলেই স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।'
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {tx(lang, 'Digital Khata & Portal', 'ডিজিটাল খাতা ও পোর্টাল')}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {tx(
                      lang,
                      'Credit aging, multi-invoice collection, and mobile OTP customer portal.',
                      'বাকির মেয়াদ বিশ্লেষণ, একাধিক বিলে বাকি আদায় এবং ওটিপি ক্রেতা পোর্টাল।'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {tx(lang, 'Shopkeeper Access', 'দোকানদার লগইন')}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {tx(lang, 'Sign in to your store', 'আপনার দোকানে প্রবেশ করুন')}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {tx(
                    lang,
                    'First sign-in automatically sets up your shop with 50 Bangladeshi FMCG starter items.',
                    'প্রথমবার লগইনেই ৫০টি জনপ্রিয় বাংলাদেশি পণ্যসহ আপনার দোকান স্বয়ংক্রিয়ভাবে প্রস্তুত হয়ে যাবে।'
                  )}
                </p>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                >
                  <span>{tx(lang, 'Continue with Google', 'গুগল দিয়ে লগইন করুন')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-xs text-slate-400">{tx(lang, 'Customer?', 'ক্রেতা?')}</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{tx(lang, 'Open Customer Self-Service Portal', 'ক্রেতা সেলফ-সার্ভিস পোর্টাল খুলুন')}</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="mx-auto w-full max-w-5xl text-center text-xs text-slate-500 dark:text-slate-500">
          {tx(
            lang,
            'MudirDokan Pro · Currency BDT (৳) · Asia/Dhaka',
            'মুদির দোকান প্রো · মুদ্রা টাকা (৳) · ঢাকা সময়'
          )}
        </footer>
      </div>
    );
  }

  const renderGroup = (title: string, group: NavItem['group']) => {
    const items = NAV_ITEMS.filter((i) => i.group === group);
    return (
      <div className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {title}
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition cursor-pointer ${
                active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span className="truncate">{tr(item.labelKey, lang)}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const displayStoreName = store
    ? trCompact(store.name, store.nameBn, lang)
    : staff?.name || firebaseUser.displayName || tr('appName', lang);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {tr('appName', lang)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label={tx(lang, 'Close navigation menu', 'মেনু বন্ধ করুন')}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {renderGroup(tx(lang, 'Counter & Stock', 'কাউন্টার ও স্টক'), 'operations')}
          {renderGroup(tx(lang, 'Khata & Dues', 'খাতা ও বাকি'), 'credit')}
          {renderGroup(tx(lang, 'Finance & Admin', 'হিসাব ও সেটিংস'), 'finance')}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-slate-200 p-3 dark:border-slate-800">
          <button
            type="button"
            onClick={onOpenPortal}
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{tr('customerPortal', lang)}</span>
          </button>

          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                {displayStoreName}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {formatStatusLabel(staff?.role || 'OWNER', lang)} · {firebaseUser.email}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              title={tr('signOut', lang)}
              aria-label={tr('signOut', lang)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={tx(lang, 'Open navigation menu', 'মেনু খুলুন')}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                {tr(activeNav.labelKey, lang)}
              </h1>
              {bootstrapLoading && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-emerald-600" />
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {(!isOnline || pendingOfflineSales.length > 0) && (
              <button
                type="button"
                onClick={syncOfflineQueue}
                disabled={!isOnline || isSyncing}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  !isOnline
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {!isOnline ? (
                  <WifiOff className="h-3.5 w-3.5" />
                ) : (
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                )}
                <span>
                  {!isOnline
                    ? tx(lang, `Offline (${pendingOfflineSales.length})`, `অফলাইন (${pendingOfflineSales.length})`)
                    : isSyncing
                      ? tx(lang, 'Syncing...', 'সিঙ্ক হচ্ছে...')
                      : tx(lang, `Sync ${pendingOfflineSales.length}`, `সিঙ্ক ${pendingOfflineSales.length}`)}
                </span>
              </button>
            )}

            {/* Always-visible 2-way Language Selector */}
            <LanguageSwitcher lang={lang} setLang={setLang} />

            <div className="hidden md:block">
              <PWAInstallButton compact />
            </div>

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={tx(lang, 'Toggle dark mode', 'ডার্ক মোড পরিবর্তন করুন')}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {activeTab !== 'pos' && (
              <button
                type="button"
                onClick={() => handleNavigate('pos')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tr('newSale', lang)}</span>
              </button>
            )}
          </div>
        </header>

        {!isOnline && (
          <div className="no-print border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            {tr('offlineModeBanner', lang)}
          </div>
        )}

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6">
          {activeTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {activeTab === 'pos' && <PosPage />}
          {activeTab === 'products' && <ProductsPage />}
          {activeTab === 'inventory' && <InventoryPage />}
          {activeTab === 'purchases' && <PurchasesPage />}
          {activeTab === 'suppliers' && <SuppliersPage mode="directory" />}
          {activeTab === 'customers' && <CustomersKhataPage />}
          {activeTab === 'customer-due' && <CustomerDuePage />}
          {activeTab === 'supplier-due' && <SuppliersPage mode="due" />}
          {activeTab === 'expenses' && <ExpensesPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'cash' && <CashManagementPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openPortal = () => {
    window.history.pushState({}, '', '/portal');
    setPathname('/portal');
  };

  const isPortalRoute = pathname.startsWith('/portal');

  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      {isPortalRoute ? (
        <CustomerPortalPage />
      ) : (
        <AppProvider>
          <ShopkeeperShell onOpenPortal={openPortal} />
        </AppProvider>
      )}
    </>
  );
}
