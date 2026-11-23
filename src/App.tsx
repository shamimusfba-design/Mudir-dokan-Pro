import React, { useEffect, useMemo, useState } from 'react';
import { Toaster } from 'sonner';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Users,
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
  ShieldCheck,
  Loader2,
  ArrowRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { tr, trCompact, tx, formatStatusLabel, type LanguageMode } from './lib/i18n';
import { PWAInstallButton } from './hooks/usePWAInstall';
import { StoreLogoBadge } from './components/ProductMedia';
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
import { LoginPage } from './pages/LoginPage';
import { ShowcaseLandingPage } from './pages/ShowcaseLandingPage';
import { BuyProModal } from './components/BuyProModal';
import { DemoAccessModal } from './components/DemoAccessModal';
import { OnlineStorePage } from './pages/OnlineStorePage';
import { AdLandingPageBuilder } from './pages/AdLandingPageBuilder';
import { ClientManagementPage } from './pages/ClientManagementPage';
import { detectTenant } from './lib/tenant';
import { ErrorBoundary } from './components/ErrorBoundary';

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
  | 'store'
  | 'client-management'
  | 'campaign-builder'
  | 'settings';

interface NavItem {
  id: TabId;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'operations' | 'credit' | 'finance';
  activeBg: string;
  iconColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    labelKey: 'dashboard',
    icon: LayoutDashboard,
    group: 'operations',
    activeBg: 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-500/20',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
  },
  {
    id: 'pos',
    labelKey: 'pos',
    icon: ShoppingCart,
    group: 'operations',
    activeBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/20',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  {
    id: 'products',
    labelKey: 'products',
    icon: Package,
    group: 'operations',
    activeBg: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-500/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  {
    id: 'inventory',
    labelKey: 'inventory',
    icon: Warehouse,
    group: 'operations',
    activeBg: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm shadow-cyan-500/20',
    iconColor: 'text-cyan-500 dark:text-cyan-400',
  },
  {
    id: 'purchases',
    labelKey: 'purchases',
    icon: Truck,
    group: 'operations',
    activeBg: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20',
    iconColor: 'text-orange-500 dark:text-orange-400',
  },
  {
    id: 'suppliers',
    labelKey: 'suppliers',
    icon: Building2,
    group: 'operations',
    activeBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  {
    id: 'customers',
    labelKey: 'customers',
    icon: BookOpen,
    group: 'credit',
    activeBg: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/20',
    iconColor: 'text-rose-500 dark:text-rose-400',
  },
  {
    id: 'customer-due',
    labelKey: 'customerDue',
    icon: Clock,
    group: 'credit',
    activeBg: 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm shadow-orange-500/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'supplier-due',
    labelKey: 'supplierDue',
    icon: HandCoins,
    group: 'credit',
    activeBg: 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-sm shadow-purple-500/20',
    iconColor: 'text-pink-500 dark:text-pink-400',
  },
  {
    id: 'expenses',
    labelKey: 'expenses',
    icon: Receipt,
    group: 'finance',
    activeBg: 'bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-sm shadow-rose-500/20',
    iconColor: 'text-rose-500 dark:text-rose-400',
  },
  {
    id: 'reports',
    labelKey: 'reports',
    icon: BarChart3,
    group: 'finance',
    activeBg: 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-sm shadow-indigo-500/20',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
  },
  {
    id: 'cash',
    labelKey: 'cashManagement',
    icon: Vault,
    group: 'finance',
    activeBg: 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm shadow-emerald-500/20',
    iconColor: 'text-teal-500 dark:text-teal-400',
  },
  {
    id: 'store',
    labelKey: 'onlineStore',
    icon: ShoppingBag,
    group: 'operations',
    activeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm shadow-amber-500/20',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  {
    id: 'client-management',
    labelKey: 'clientManagement',
    icon: Users,
    group: 'finance',
    activeBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm shadow-teal-500/20',
    iconColor: 'text-teal-500 dark:text-teal-400',
  },
  {
    id: 'campaign-builder',
    labelKey: 'adCampaigns',
    icon: Sparkles,
    group: 'finance',
    activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20',
    iconColor: 'text-purple-500 dark:text-purple-400',
  },
  {
    id: 'settings',
    labelKey: 'settings',
    icon: Settings,
    group: 'finance',
    activeBg: 'bg-gradient-to-r from-slate-700 to-indigo-700 text-white shadow-sm',
    iconColor: 'text-slate-500 dark:text-slate-400',
  },
];

const LanguageSwitcher: React.FC<{ lang: LanguageMode; setLang: (m: LanguageMode) => void }> = ({
  lang,
  setLang,
}) => (
  <div
    className="inline-flex items-center rounded-lg border border-indigo-200/80 bg-indigo-50/70 p-0.5 dark:border-slate-700 dark:bg-slate-800/90 shrink-0"
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
            ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500 dark:text-white'
            : 'text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);

const ShopkeeperShell: React.FC<{
  onOpenPortal: () => void;
  onOpenStore?: () => void;
  forceDemoMode?: boolean;
  initialTab?: TabId;
}> = ({ onOpenPortal, onOpenStore, forceDemoMode, initialTab = 'dashboard' }) => {
  const {
    firebaseUser,
    authLoading,
    bootstrapLoading,
    staff,
    store,
    settings,
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
    syncOfflineQueue,
  } = useApp();

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(() => {
    return Boolean(forceDemoMode && !sessionStorage.getItem('mudidokan_demo_active'));
  });

  useEffect(() => {
    if (forceDemoMode && !firebaseUser && !authLoading) {
      if (sessionStorage.getItem('mudidokan_demo_active') === 'true') {
        enterDemoMode();
      } else {
        setIsDemoModalOpen(true);
      }
    }
  }, [forceDemoMode, firebaseUser, authLoading]);

  const [activeTab, setActiveTab] = useState<TabId>(() => (forceDemoMode ? 'pos' : initialTab));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarFolded, setSidebarFolded] = useState<boolean>(() => {
    return localStorage.getItem('mudirdokan_sidebar_folded') === 'true';
  });
  const [unauthView, setUnauthView] = useState<'login' | 'showcase' | 'store'>('login');
  const [isBuyProModalOpen, setIsBuyProModalOpen] = useState(false);

  const toggleSidebarFold = () => {
    setSidebarFolded((prev) => {
      const next = !prev;
      localStorage.setItem('mudirdokan_sidebar_folded', String(next));
      return next;
    });
  };

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {tx(lang, 'Loading MudirDokan Pro...', 'মুদি দোকান প্রো লোড হচ্ছে...')}
          </p>
        </div>
      </div>
    );
  }

  if (forceDemoMode && !firebaseUser) {
    if (isDemoModalOpen) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <DemoAccessModal
            isOpen={true}
            onClose={() => {
              setIsDemoModalOpen(false);
              window.location.href = '/';
            }}
            onSuccess={() => {
              setIsDemoModalOpen(false);
            }}
          />
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {tx(lang, 'Loading Live POS Demo...', 'লাইভ পিওএস ডেমো লোড হচ্ছে...')}
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    if (unauthView === 'store') {
      return <OnlineStorePage onBackToApp={() => setUnauthView('login')} />;
    }
    if (unauthView === 'showcase') {
      return (
        <ShowcaseLandingPage
          onBackToLogin={() => setUnauthView('login')}
          onOpenPortal={onOpenPortal}
          onOpenOnlineStore={() => setUnauthView('store')}
          onOpenAdBuilder={() => {
            setUnauthView('login');
            toast.info(tx(lang, 'Please login as shop owner to build Ad Landing Pages', 'দোকানদার হিসেবে লগইন করে অ্যাড ল্যান্ডিং পেজ বিল্ডার ব্যবহার করুন'));
          }}
        />
      );
    }
    return (
      <LoginPage
        onOpenPortal={onOpenPortal}
        onOpenShowcase={() => setUnauthView('showcase')}
        onOpenOnlineStore={onOpenStore || (() => setUnauthView('store'))}
      />
    );
  }

  const renderGroup = (title: string, group: NavItem['group']) => {
    const items = NAV_ITEMS.filter((i) => i.group === group);
    return (
      <div className="space-y-1">
        {!sidebarFolded && (
          <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {title}
          </p>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={tr(item.labelKey, lang)}
              onClick={() => handleNavigate(item.id)}
              className={`flex w-full items-center rounded-xl text-sm font-medium transition cursor-pointer ${
                sidebarFolded ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2 text-left'
              } ${
                active
                  ? item.activeBg
                  : 'text-slate-600 hover:bg-indigo-50/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : item.iconColor}`} />
              {!sidebarFolded && <span className="truncate">{tr(item.labelKey, lang)}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  const displayStoreName = store
    ? trCompact(store.name, store.nameBn, lang)
    : staff?.name || firebaseUser?.displayName || tr('appName', lang);

  return (
    <div className="flex min-h-screen bg-[#F6F8FC] text-slate-900 dark:bg-[#0B1120] dark:text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Foldable Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-200 dark:border-slate-800 dark:bg-[#0F172A] lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarFolded ? 'lg:w-16' : 'lg:w-64'}`}
      >
        <div className={`flex h-15 shrink-0 items-center border-b border-slate-200/80 dark:border-slate-800 ${
          sidebarFolded ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          <button
            type="button"
            onClick={() => handleNavigate('dashboard')}
            className={`flex min-w-0 items-center text-left cursor-pointer ${sidebarFolded ? 'justify-center' : 'gap-2.5'}`}
            title={tr('appName', lang)}
          >
            <StoreLogoBadge logoUrl={store?.logoUrl} storeName={displayStoreName} size="sm" />
            {!sidebarFolded && (
              <div className="min-w-0">
                <span className="block truncate text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {tr('appName', lang)}
                </span>
                <span className="block truncate text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                  {displayStoreName}
                </span>
              </div>
            )}
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

        <nav className={`flex-1 space-y-4 overflow-y-auto ${sidebarFolded ? 'px-2 py-4' : 'px-3 py-4'}`}>
          {renderGroup(tx(lang, 'Counter & Stock', 'কাউন্টার ও স্টক'), 'operations')}
          {renderGroup(tx(lang, 'Khata & Dues', 'খাতা ও বাকি'), 'credit')}
          {renderGroup(tx(lang, 'Finance & Admin', 'হিসাব ও সেটিংস'), 'finance')}
        </nav>

        <div className={`shrink-0 space-y-2 border-t border-slate-200/80 dark:border-slate-800 ${sidebarFolded ? 'p-2 text-center' : 'p-3'}`}>
          <button
            type="button"
            onClick={onOpenPortal}
            title={tr('customerPortal', lang)}
            className={`flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 cursor-pointer ${
              sidebarFolded ? 'p-2' : 'gap-2 px-3 py-2'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 shrink-0" />
            {!sidebarFolded && <span className="truncate">{tr('customerPortal', lang)}</span>}
          </button>

          <div className={`flex items-center gap-2 pt-1 ${sidebarFolded ? 'justify-center' : 'justify-between px-1'}`}>
            {!sidebarFolded && (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {displayStoreName}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {formatStatusLabel(staff?.role || 'OWNER', lang)}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              title={tr('signOut', lang)}
              aria-label={tr('signOut', lang)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 cursor-pointer shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-slate-200/80 bg-white/95 px-3 sm:px-4 backdrop-blur dark:border-slate-800 dark:bg-[#0F172A]/95 w-full">
          {/* Left Side: Hamburger Menu on far left, then Brand Logo & Name */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label={tx(lang, 'Open navigation menu', 'মেনু খুলুন')}
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Fold/Unfold Sidebar Toggle */}
            <button
              type="button"
              onClick={toggleSidebarFold}
              title={sidebarFolded ? tx(lang, 'Expand Sidebar', 'মেনু খুলুন') : tx(lang, 'Fold Sidebar (Full Width Workspace)', 'মেনু বন্ধ করুন (ফুল স্ক্রিন মোড)')}
              className="hidden lg:inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              {sidebarFolded ? <PanelLeftOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>

            {/* Brand Logo & Store Name (Always visible on mobile & desktop) */}
            <div className="flex items-center gap-2 min-w-0">
              <StoreLogoBadge logoUrl={store?.logoUrl} storeName={displayStoreName} size="sm" />
              <div className="min-w-0">
                <span className="block truncate text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {displayStoreName}
                </span>
                <span className="hidden sm:block truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {tr(activeNav.labelKey, lang)}
                </span>
              </div>
            </div>

            {bootstrapLoading && (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-600" />
            )}
          </div>

          {/* Right Side: Clearly separated Language (EN/BN), Dark Mode, Demo Mode & Action */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {(!isOnline || pendingOfflineSales.length > 0) && (
              <button
                type="button"
                onClick={syncOfflineQueue}
                disabled={!isOnline || isSyncing}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  !isOnline
                    ? 'border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-700/60 dark:bg-orange-950/60 dark:text-orange-300'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {!isOnline ? (
                  <WifiOff className="h-3.5 w-3.5" />
                ) : (
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                )}
                <span className="hidden sm:inline">
                  {!isOnline
                    ? tx(lang, `Offline (${pendingOfflineSales.length})`, `অফলাইন (${pendingOfflineSales.length})`)
                    : isSyncing
                      ? tx(lang, 'Syncing...', 'সিঙ্ক হচ্ছে...')
                      : tx(lang, `Sync ${pendingOfflineSales.length}`, `সিঙ্ক ${pendingOfflineSales.length}`)}
                </span>
              </button>
            )}

            {/* Language Switcher: Explicit EN and BN buttons on mobile & desktop */}
            <LanguageSwitcher lang={lang} setLang={setLang} />

            {/* Day / Night Mode Button */}
            <button
              type="button"
              onClick={toggleDarkMode}
              title={tx(lang, 'Toggle dark / light mode', 'দিন / রাত (ডার্ক) মোড পরিবর্তন')}
              aria-label={tx(lang, 'Toggle dark mode', 'ডার্ক মোড পরিবর্তন করুন')}
              className="rounded-lg border border-slate-200 p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-600" />}
            </button>

            {settings?.demoModeActive && (
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/90 py-1 px-3 text-xs shadow-xs dark:border-emerald-800 dark:bg-emerald-950/60">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                  {tx(lang, '⚡ Demo Mode', '⚡ ডেমো মোড')}
                </span>
                <span className="text-emerald-300 dark:text-emerald-700">|</span>
                <button
                  type="button"
                  onClick={() => setIsBuyProModalOpen(true)}
                  className="inline-flex items-center gap-1 font-extrabold text-emerald-700 hover:text-emerald-900 hover:underline dark:text-emerald-400 dark:hover:text-emerald-200 cursor-pointer"
                >
                  <span>{tx(lang, 'Buy Pro 🛒', 'প্রো কিনুন 🛒')}</span>
                </button>
              </div>
            )}

            {activeTab !== 'pos' && (
              <button
                type="button"
                onClick={() => handleNavigate('pos')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tr('newSale', lang)}</span>
              </button>
            )}
          </div>
        </header>

        {!isOnline && (
          <div className="no-print border-b border-orange-200 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
            {tr('offlineModeBanner', lang)}
          </div>
        )}

        {/* FULL WIDTH WORKSPACE: NO WASTED 30-40% MARGINS */}
        <main className={`w-full flex-1 transition-all ${
          activeTab === 'pos'
            ? 'max-w-none px-2 sm:px-3 lg:px-4 py-2 sm:py-3'
            : 'w-full max-w-none px-3 sm:px-5 lg:px-6 py-3 sm:py-5'
        }`}>
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
          {activeTab === 'store' && <OnlineStorePage />}
          {activeTab === 'client-management' && <ClientManagementPage />}
          {activeTab === 'campaign-builder' && <AdLandingPageBuilder />}
        </main>
        <BuyProModal isOpen={isBuyProModalOpen} onClose={() => setIsBuyProModalOpen(false)} />
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

  const tenant = useMemo(() => detectTenant(), [pathname]);

  const openPortal = () => {
    window.history.pushState({}, '', '/portal');
    setPathname('/portal');
  };

  const openStore = () => {
    window.history.pushState({}, '', '/store');
    setPathname('/store');
  };

  const goToApp = () => {
    window.history.pushState({}, '', '/app');
    setPathname('/app');
  };

  const goToDemo = () => {
    window.history.pushState({}, '', '/demo');
    setPathname('/demo');
  };

  const goToLanding = () => {
    window.history.pushState({}, '', '/');
    setPathname('/');
  };

  const isPortalRoute = pathname.startsWith('/portal');

  // 1. Customer Khata Portal: /portal
  if (isPortalRoute) {
    return (
      <ErrorBoundary>
        <Toaster richColors position="top-right" closeButton />
        <CustomerPortalPage />
      </ErrorBoundary>
    );
  }

  // 2. Individual Grocery Shop Subdomain Customer Storefront:
  // e.g. shamim.mudidokanpro.com or ?shop=shamim on root '/'
  if (tenant.mode === 'SHOP_STOREFRONT') {
    return (
      <ErrorBoundary>
        <Toaster richColors position="top-right" closeButton />
        <AppProvider>
          <OnlineStorePage
            subdomainShopSlug={tenant.shopSlug}
            onGoToShopkeeperApp={goToApp}
          />
        </AppProvider>
      </ErrorBoundary>
    );
  }

  // 3. Online Store Multi-Shop Marketplace: /store
  if (tenant.mode === 'STORE_PORTAL') {
    return (
      <ErrorBoundary>
        <Toaster richColors position="top-right" closeButton />
        <AppProvider>
          <OnlineStorePage
            onBackToApp={goToLanding}
            onGoToShopkeeperApp={goToApp}
          />
        </AppProvider>
      </ErrorBoundary>
    );
  }

  // 4. Interactive Live Demo: demo.mudidokanpro.web.app or /demo or ?demo=true
  if (tenant.mode === 'DEMO') {
    return (
      <ErrorBoundary>
        <Toaster richColors position="top-right" closeButton />
        <AppProvider>
          <ShopkeeperShell
            onOpenPortal={openPortal}
            onOpenStore={openStore}
            forceDemoMode={true}
          />
        </AppProvider>
      </ErrorBoundary>
    );
  }

  // 5. Main SaaS Marketing Landing Page: mudidokanpro.web.app or mudidokanpro.com (High-converting Ads Page)
  if (tenant.mode === 'LANDING') {
    return (
      <ErrorBoundary>
        <Toaster richColors position="top-right" closeButton />
        <AppProvider>
          <ShowcaseLandingPage
            onBackToLogin={goToApp}
            onOpenPortal={openPortal}
            onOpenOnlineStore={openStore}
            onOpenDemo={goToDemo}
          />
        </AppProvider>
      </ErrorBoundary>
    );
  }

  // 6. SaaS Application & Client Tracking Portal: app.mudidokanpro.com, app.mudidokanpro.web.app, /app, or ?app=true
  return (
    <ErrorBoundary>
      <Toaster richColors position="top-right" closeButton />
      <AppProvider>
        <ShopkeeperShell
          onOpenPortal={openPortal}
          onOpenStore={openStore}
          initialTab={pathname.includes('clients') ? 'client-management' : 'dashboard'}
        />
      </AppProvider>
    </ErrorBoundary>
  );
}
