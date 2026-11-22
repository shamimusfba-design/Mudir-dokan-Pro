import React, { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  RotateCcw,
  TrendingUp,
  Wallet,
  Package,
  Users,
  Truck,
  Warehouse,
  CalendarRange,
  ShoppingBag,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateDDMMYYYY, dhakaTodayISO, formatQty } from '../lib/decimal';
import { tr, trCompact, tx, formatMethodLabel, formatStatusLabel, formatUnitLabel } from '../lib/i18n';
import { useApp } from '../context/AppContext';
import { ProductImage } from '../components/ProductMedia';

type RangePreset = 'today' | 'yesterday' | 'week' | 'month' | '6m' | 'custom';

const BAR_COLORS = ['#4F46E5', '#10B981', '#F97316', '#EC4899', '#8B5CF6', '#06B6D4', '#F59E0B', '#14B8A6'];

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function defaultSixMonthWindow(todayISO: string): { start: string; end: string } {
  const [yStr, mStr] = todayISO.split('-');
  const curYear = Number(yStr);
  const curMonth = Number(mStr);
  let sm = curMonth - 6;
  let sy = curYear;
  while (sm <= 0) {
    sm += 12;
    sy -= 1;
  }
  let em = curMonth - 1;
  let ey = curYear;
  if (em <= 0) {
    em += 12;
    ey -= 1;
  }
  const endDim = new Date(Date.UTC(ey, em, 0)).getUTCDate();
  return {
    start: `${sy}-${String(sm).padStart(2, '0')}-01`,
    end: `${ey}-${String(em).padStart(2, '0')}-${String(endDim).padStart(2, '0')}`,
  };
}

export const DashboardPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { lang, staff, settings, categories, products, refreshCatalog } = useApp();
  const today = dhakaTodayISO();
  const fallback6m = useMemo(() => defaultSixMonthWindow(today), [today]);
  const sixMonthStart = settings?.demoPeriodStart || fallback6m.start;
  const sixMonthEnd = settings?.demoPeriodEnd || fallback6m.end;

  const [preset, setPreset] = useState<RangePreset>(() => (settings?.demoModeActive ? '6m' : 'month'));
  const [from, setFrom] = useState(() => (settings?.demoModeActive ? sixMonthStart : `${today.slice(0, 7)}-01`));
  const [to, setTo] = useState(() => (settings?.demoModeActive ? sixMonthEnd : today));
  const [demoAutoApplied, setDemoAutoApplied] = useState(Boolean(settings?.demoModeActive));
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [data, setData] = useState<any>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    if (settings?.demoModeActive && !demoAutoApplied && settings.demoPeriodStart && settings.demoPeriodEnd) {
      setPreset('6m');
      setFrom(settings.demoPeriodStart);
      setTo(settings.demoPeriodEnd);
      setDemoAutoApplied(true);
    }
  }, [settings?.demoModeActive, settings?.demoPeriodStart, settings?.demoPeriodEnd, demoAutoApplied]);

  const applyPreset = (p: RangePreset) => {
    setPreset(p);
    if (p === 'today') {
      setFrom(today);
      setTo(today);
    } else if (p === 'yesterday') {
      const y = shiftDays(today, -1);
      setFrom(y);
      setTo(y);
    } else if (p === 'week') {
      setFrom(shiftDays(today, -6));
      setTo(today);
    } else if (p === 'month') {
      setFrom(`${today.slice(0, 7)}-01`);
      setTo(today);
    } else if (p === '6m') {
      setFrom(sixMonthStart);
      setTo(sixMonthEnd);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/finance/dashboard?from=${from}&to=${to}`);
      setData(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load dashboard', 'ড্যাশবোর্ড লোড ব্যর্থ হয়েছে'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [from, to, staff?.role]);

  const handleReturnSale = async (saleId: number, invoiceNumber: string) => {
    const reason = window.prompt(
      tx(lang, `Reason for returning invoice ${invoiceNumber}:`, `ইনভয়েস ${invoiceNumber} ফেরত নেওয়ার কারণ:`),
      tx(lang, 'Customer returned items', 'ক্রেতা পণ্য ফেরত দিয়েছেন')
    );
    if (!reason) return;
    try {
      await apiFetch(`/api/sales/${saleId}/return`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      toast.success(
        tx(
          lang,
          `Invoice ${invoiceNumber} returned and stock/ledger reversed`,
          `ইনভয়েস ${invoiceNumber} ফেরত নেওয়া হয়েছে এবং স্টক ও খাতা সমন্বয় হয়েছে`
        )
      );
      loadDashboard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to return sale', 'বিক্রয় ফেরত ব্যর্থ হয়েছে'));
    }
  };

  const handleQuickLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await apiFetch('/api/finance/demo/load', { method: 'POST' });
      await refreshCatalog();
      if (res?.periodStart && res?.periodEnd) {
        setPreset('6m');
        setFrom(res.periodStart);
        setTo(res.periodEnd);
        setDemoAutoApplied(true);
      }
      toast.success(
        tx(
          lang,
          '6-month Bangladesh grocery demo dataset loaded!',
          '৬ মাসের বাংলাদেশী মুদির দোকানের ডেমো ডেটা লোড হয়েছে!'
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load demo dataset', 'ডেমো ডেটা লোড ব্যর্থ হয়েছে'));
    } finally {
      setLoadingDemo(false);
    }
  };

  const kpis = data?.kpis;
  const restrictedText = tx(lang, 'Restricted', 'সীমাবদ্ধ');
  const canLoadQuickDemo =
    !loading &&
    !settings?.demoModeActive &&
    kpis &&
    Number(kpis.totalSales || 0) === 0 &&
    (staff?.role === 'OWNER' || staff?.role === 'MANAGER');

  return (
    <div className="space-y-6">
      {canLoadQuickDemo && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 px-5 py-4 shadow-sm dark:border-amber-800/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-emerald-950/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {tx(lang, 'Explore with 6 Months of Realistic Grocery Store Data', '৬ মাসের বাস্তবসম্মত মুদির দোকানের ডেমো ডেটা দেখুন')}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                {tx(
                  lang,
                  'Load 270 BD grocery products, 110+ customers, ৳60 lakh sales, credit khata, expenses, and reconciled daily cash registers in one click.',
                  'এক ক্লিকেই ২৭০টি পণ্য, ১১০+ ক্রেতা, ৬০ লাখ টাকার বিক্রয়, বাকি খাতা, খরচ এবং দৈনিক ক্যাশ রেজিস্টার লোড করুন।'
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loadingDemo}
            onClick={handleQuickLoadDemo}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
          >
            {loadingDemo ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            {loadingDemo
              ? tx(lang, 'Loading 6-Month Data (~35s)...', '৬ মাসের ডেটা লোড হচ্ছে (~৩৫ সেকেন্ড)...')
              : tx(lang, 'Load 6-Month Demo Data', '৬ মাসের ডেমো ডেটা লোড করুন')}
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {tr('dashboard', lang)}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatDateDDMMYYYY(from)} — {formatDateDDMMYYYY(to)} ·{' '}
            {tx(lang, 'Asia/Dhaka · BDT (৳)', 'ঢাকা সময় · টাকা (৳)')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            {(
              [
                ['today', 'Today', 'আজ'],
                ['yesterday', 'Yesterday', 'গতকাল'],
                ['week', '7 Days', '৭ দিন'],
                ['month', 'This Month', 'এই মাস'],
                ['6m', '6 Months', '৬ মাস'],
                ['custom', 'Custom', 'কাস্টম'],
              ] as const
            ).map(([key, en, bn]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  preset === key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {trCompact(en, bn, lang)}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-slate-800 dark:bg-slate-900"
              />
              <span className="text-xs text-slate-400">{tx(lang, 'to', 'থেকে')}</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          )}

          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {tx(lang, 'Refresh', 'রিফ্রেশ')}
          </button>
        </div>
      </div>

      {/* 8 Colorful KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* 1. Period / Today Sales (Gradient Hero) */}
        <div
          onClick={() => onNavigate('pos')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-4 text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-100">
            <span className="truncate">
              {preset === 'today' ? tx(lang, "Today's Sales", 'আজকের বিক্রয়') : tx(lang, 'Period Sales', 'সময়ের মোট বিক্রয়')}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <ShoppingBag className="h-4 w-4 text-white" />
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tabular-nums">
            {loading ? (
              <span className="inline-block h-7 w-24 animate-pulse rounded bg-white/25" />
            ) : (
              formatBDT(preset === 'today' ? kpis?.todaySales ?? 0 : kpis?.sales ?? 0)
            )}
          </div>
          <div className="mt-1 text-[11px] text-indigo-100/90">
            {tx(lang, 'Paid:', 'নগদ/ডিজিটাল:')}{' '}
            <span className="font-mono font-bold">{kpis ? formatBDT(kpis.paidAtSale ?? 0) : '—'}</span> ·{' '}
            {tx(lang, 'Credit:', 'বাকি:')}{' '}
            <span className="font-mono font-bold">{kpis ? formatBDT(kpis.creditSalesIssued ?? 0) : '—'}</span>
          </div>
        </div>

        {/* 2. Gross & Net Profit (Gradient Emerald) */}
        <div
          onClick={() => onNavigate('reports')}
          className="cursor-pointer rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-4 text-white shadow-md shadow-emerald-500/20 transition hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-100">
            <span className="truncate">
              {tx(lang, 'Gross Profit', 'মোট লাভ (গ্রস)')}{' '}
              {kpis?.grossMarginPct ? `(${kpis.grossMarginPct}%)` : ''}
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
              <TrendingUp className="h-4 w-4 text-white" />
            </span>
          </div>
          <div className="mt-2 font-mono text-2xl font-extrabold tabular-nums">
            {loading ? (
              <span className="inline-block h-7 w-24 animate-pulse rounded bg-white/25" />
            ) : kpis?.grossProfit !== null && kpis?.grossProfit !== undefined ? (
              formatBDT(kpis.grossProfit)
            ) : (
              restrictedText
            )}
          </div>
          <div className="mt-1 text-[11px] text-emerald-100/90">
            {tx(lang, 'Net Profit:', 'নিট লাভ:')}{' '}
            <span className="font-mono font-bold">
              {kpis ? (kpis.netProfit !== null ? formatBDT(kpis.netProfit) : restrictedText) : '—'}
            </span>
          </div>
        </div>

        {/* 3. Due Collections & Cash In */}
        <div className="rounded-2xl border border-purple-200/80 bg-white p-4 shadow-xs dark:border-purple-900/50 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="truncate">{tx(lang, 'Cash Received (Till)', 'ক্যাশ ড্রয়ারে নগদ গ্রহণ')}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <CalendarRange className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold tabular-nums text-purple-700 dark:text-purple-400">
            {loading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : formatBDT(kpis?.cashReceived ?? 0)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {tx(lang, 'Due Collected:', 'বাকি আদায়:')}{' '}
            <span className="font-mono font-semibold">{kpis ? formatBDT(kpis.dueCollections ?? 0) : '—'}</span>
          </div>
        </div>

        {/* 4. Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className="cursor-pointer rounded-2xl border border-cyan-200/80 bg-white p-4 shadow-xs transition hover:border-cyan-400 dark:border-cyan-900/50 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="truncate">{tx(lang, 'Total Products', 'মোট পণ্য (SKU)')}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold tabular-nums text-cyan-700 dark:text-cyan-400">
            {loading ? <span className="inline-block h-6 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : (kpis?.totalProducts || products.length)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{tx(lang, 'Active SKUs', 'সক্রিয় পণ্য')}</span>
            <ArrowUpRight className="h-3 w-3 text-cyan-500" />
          </div>
        </div>

        {/* 5. Low Stock Alerts */}
        <div
          onClick={() => onNavigate('inventory')}
          className="cursor-pointer rounded-2xl border border-orange-200/80 bg-white p-4 shadow-xs transition hover:border-orange-400 dark:border-orange-900/50 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="truncate">{tx(lang, 'Low Stock Alerts', 'কম স্টক সতর্কতা')}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold tabular-nums text-orange-600 dark:text-orange-400">
            {loading ? (
              <span className="inline-block h-6 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ) : (
              (kpis?.lowStockCount ?? 0) + (kpis?.outOfStockCount ?? 0)
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {tx(lang, `${kpis?.outOfStockCount ?? 0} out of stock`, `${kpis?.outOfStockCount ?? 0}টি স্টক শেষ`)}
          </div>
        </div>

        {/* 6. Customer Due */}
        <div
          onClick={() => onNavigate('customer-due')}
          className="cursor-pointer rounded-2xl border border-rose-200/80 bg-white p-4 shadow-xs transition hover:border-rose-400 dark:border-rose-900/50 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="truncate">{tr('customerOutstanding', lang)}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold tabular-nums text-rose-600 dark:text-rose-400">
            {loading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : formatBDT(kpis?.customerOutstanding ?? 0)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{tx(lang, 'Digital Khata', 'ডিজিটাল খাতা')}</span>
            <ArrowUpRight className="h-3 w-3 text-rose-500" />
          </div>
        </div>

        {/* 7. Supplier Due */}
        <div
          onClick={() => onNavigate('supplier-due')}
          className="cursor-pointer rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs transition hover:border-amber-400 dark:border-amber-900/50 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="truncate">{tr('supplierOutstanding', lang)}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold tabular-nums text-amber-700 dark:text-amber-400">
            {loading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : formatBDT(kpis?.supplierOutstanding ?? 0)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {tx(lang, 'Expenses:', 'খরচ:')} <span className="font-mono font-semibold">{kpis ? formatBDT(kpis.expenses) : '—'}</span>
          </div>
        </div>

        {/* 8. Inventory Value */}
        <div
          onClick={() => onNavigate('inventory')}
          className="cursor-pointer rounded-2xl border border-teal-200/80 bg-white p-4 shadow-xs transition hover:border-teal-400 dark:border-teal-900/50 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="truncate">{tr('inventoryValue', lang)}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <Warehouse className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 font-mono text-xl font-extrabold tabular-nums text-teal-700 dark:text-teal-400">
            {loading ? (
              <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ) : kpis?.inventoryValue !== null && kpis?.inventoryValue !== undefined ? (
              formatBDT(kpis.inventoryValue)
            ) : (
              restrictedText
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{tx(lang, 'Weighted Avg Cost', 'গড় ক্রয়মূল্য')}</span>
            <ArrowUpRight className="h-3 w-3 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {preset === '6m'
                ? trCompact('Monthly Sales & Gross Profit Trend (6 Months)', 'মাসিক বিক্রয় ও লাভের ধারা (৬ মাস)', lang)
                : trCompact('Daily Sales & Gross Profit Trend', 'দৈনিক বিক্রয় ও লাভের ধারা', lang)}
            </h2>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                {tx(lang, 'Sales', 'বিক্রয়')}
              </span>
              {data?.canViewProfit && (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {tx(lang, 'Gross Profit', 'মোট লাভ')}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 h-64">
            {data?.dailyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => formatBDT(val)}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name={tx(lang, 'Sales', 'বিক্রয়')}
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fill="url(#salesGrad)"
                  />
                  {data.canViewProfit && (
                    <Area
                      type="monotone"
                      dataKey="grossProfit"
                      name={tx(lang, 'Gross Profit', 'মোট লাভ')}
                      stroke="#10B981"
                      strokeWidth={2.5}
                      fill="url(#profitGrad)"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-500">
                <p>{tx(lang, 'No sales recorded in this date range yet.', 'এই সময়ে এখনো কোনো বিক্রয় রেকর্ড হয়নি।')}</p>
                <button
                  type="button"
                  onClick={() => onNavigate('pos')}
                  className="mt-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-indigo-700 hover:to-blue-700 cursor-pointer"
                >
                  {tx(lang, 'Open POS Counter', 'বিক্রয় কাউন্টার খুলুন')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {trCompact('Sales by Category', 'ক্যাটাগরি অনুযায়ী বিক্রয়', lang)}
          </h2>
          <div className="mt-4 h-64">
            {data?.salesByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesByCategory} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.35} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" width={95} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
                    formatter={(val: any) => formatBDT(val)}
                  />
                  <Bar dataKey="amount" name={tx(lang, 'Revenue', 'আয়')} radius={[0, 6, 6, 0]}>
                    {data.salesByCategory.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                {tx(lang, 'Category chart populates after sales', 'বিক্রয়ের পর ক্যাটাগরি চার্ট দেখা যাবে')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Products + Low Stock Alerts (with Product Thumbnails) + Pending Dues / Payments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Selling Products with Real Thumbnails */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {tx(lang, 'Top Selling Products', 'সর্বাধিক বিক্রিত পণ্য')}
            </h2>
            <Wallet className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {data?.topSellingProducts?.length > 0 ? (
              data.topSellingProducts.map((p: any) => {
                const cat = catMap.get(p.categoryId);
                return (
                  <div key={p.productId} className="flex items-center justify-between gap-2.5 py-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProductImage
                        src={p.imageUrl}
                        sku={p.sku}
                        alt={p.name}
                        iconName={cat?.iconName}
                        accentColor={cat?.accentColor}
                        fallbackIndex={p.categoryId || 0}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {p.variant} · {formatQty(p.qty)} {tx(lang, 'sold', 'বিক্রি')}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono">
                      <div className="font-bold text-indigo-700 dark:text-indigo-400">{formatBDT(p.revenue)}</div>
                      {data.canViewProfit && (
                        <div className="text-[10px] font-semibold text-emerald-600">+{formatBDT(p.profit)}</div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 space-y-3">
                <p className="text-center text-xs text-slate-500">
                  {tx(lang, 'Payment breakdown for selected range:', 'নির্বাচিত সময়ের পেমেন্ট মাধ্যম:')}
                </p>
                {(data?.paymentBreakdown || []).map((p: any) => (
                  <div key={p.method} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatMethodLabel(p.method, lang)}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatBDT(p.amount)}</span>
                  </div>
                ))}
                {(!data?.paymentBreakdown || data.paymentBreakdown.length === 0) && (
                  <p className="text-center text-xs text-slate-400">
                    {tx(lang, 'No product sales recorded in this period yet.', 'এই সময়ে এখনো কোনো পণ্য বিক্রি হয়নি।')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock & Out of Stock with Product Thumbnails */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {trCompact('Low & Out-of-Stock Alerts', 'কম স্টক সতর্কতা', lang)}
            </h2>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {[...(data?.outOfStockProducts || []), ...(data?.lowStockProducts || [])].length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                {tx(lang, 'All SKUs are above minimum stock levels.', 'সব পণ্যের পর্যাপ্ত স্টক রয়েছে।')}
              </p>
            ) : (
              [...(data?.outOfStockProducts || []), ...(data?.lowStockProducts || [])].map((p: any) => {
                const cat = catMap.get(p.categoryId);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2.5 py-2 text-xs">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProductImage
                        src={p.imageUrl}
                        sku={p.sku}
                        alt={p.name}
                        iconName={cat?.iconName}
                        accentColor={cat?.accentColor}
                        fallbackIndex={p.categoryId || 0}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-bold text-slate-900 dark:text-white">
                          {trCompact(p.name, p.nameBn, lang)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.variant} · {tx(lang, 'Min', 'সর্বনিম্ন')} {formatQty(p.minStock)}{' '}
                          {formatUnitLabel(p.baseUnit, lang)}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-mono font-extrabold whitespace-nowrap ${
                        Number(p.currentStock) <= 0 ? 'text-rose-600' : 'text-orange-600'
                      }`}
                    >
                      {formatQty(p.currentStock)} {formatUnitLabel(p.baseUnit, lang)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Customer Dues & Payment Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {trCompact('Pending Customer Dues', 'ক্রেতাদের বকেয়া', lang)}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('customer-due')}
              className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
            >
              {tx(lang, 'View all', 'সব দেখুন')}
            </button>
          </div>
          <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {data?.pendingCustomerDues?.length > 0 ? (
              data.pendingCustomerDues.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-bold text-slate-900 dark:text-white">{c.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">{c.phone}</div>
                  </div>
                  <div className="font-mono font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {formatBDT(c.currentDue)}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-500">
                {tx(lang, 'No pending customer dues.', 'কোনো ক্রেতার বাকি নেই।')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {trCompact('Recent Sales Transactions', 'সাম্প্রতিক বিক্রয় তালিকা', lang)}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
          >
            + {tr('newSale', lang)}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-bold">{tx(lang, 'Invoice', 'রসিদ নং')}</th>
                <th className="px-4 py-2.5 font-bold">{tx(lang, 'Date', 'তারিখ')}</th>
                <th className="px-4 py-2.5 font-bold">{tx(lang, 'Customer', 'ক্রেতা')}</th>
                <th className="px-4 py-2.5 text-right font-bold">{tx(lang, 'Total', 'মোট')}</th>
                <th className="px-4 py-2.5 text-right font-bold">{tx(lang, 'Paid', 'পরিশোধ')}</th>
                <th className="px-4 py-2.5 text-right font-bold">{tx(lang, 'Due', 'বাকি')}</th>
                <th className="px-4 py-2.5 font-bold">{tx(lang, 'Status', 'অবস্থা')}</th>
                {staff?.role !== 'CASHIER' && (
                  <th className="px-4 py-2.5 text-right font-bold">{tx(lang, 'Action', 'কার্যক্রম')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.recentTransactions?.length > 0 ? (
                data.recentTransactions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      {s.invoiceNumber}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                      {formatDateDDMMYYYY(s.saleDate)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                      {s.customerName || tx(lang, 'Walk-in Cash', 'সাধারণ নগদ ক্রেতা')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatBDT(s.totalAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatBDT(s.paidAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                      {formatBDT(s.dueAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      {formatStatusLabel(s.paymentStatus, lang)}
                      {s.isOfflineOrigin ? ` · ${tx(lang, 'Offline Synced', 'অফলাইন সিঙ্ক')}` : ''}
                    </td>
                    {staff?.role !== 'CASHIER' && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleReturnSale(s.id, s.invoiceNumber)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {tx(lang, 'Return', 'ফেরত')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {tx(lang, 'No sales recorded yet for this range.', 'এই সময়ে কোনো বিক্রয় রেকর্ড হয়নি।')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
