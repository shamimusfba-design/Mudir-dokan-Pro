import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RefreshCw, AlertTriangle, ArrowUpRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateDDMMYYYY, dhakaTodayISO, formatQty } from '../lib/decimal';
import { tr, trCompact, tx, formatMethodLabel, formatStatusLabel, formatUnitLabel } from '../lib/i18n';
import { useApp } from '../context/AppContext';

type RangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

function shiftDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export const DashboardPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { lang, staff } = useApp();
  const today = dhakaTodayISO();
  const [preset, setPreset] = useState<RangePreset>('month');
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

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

  const kpis = data?.kpis;
  const restrictedText = tx(lang, 'Restricted', 'সীমাবদ্ধ');

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {tr('dashboard', lang)}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {formatDateDDMMYYYY(from)} — {formatDateDDMMYYYY(to)} ·{' '}
            {tx(lang, 'Asia/Dhaka · BDT (৳)', 'ঢাকা সময় · টাকা (৳)')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {(
              [
                ['today', 'Today', 'আজ'],
                ['yesterday', 'Yesterday', 'গতকাল'],
                ['week', '7 Days', '৭ দিন'],
                ['month', 'This Month', 'এই মাস'],
                ['custom', 'Custom', 'কাস্টম'],
              ] as const
            ).map(([key, en, bn]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  preset === key
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
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
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-slate-800 dark:bg-slate-900"
              />
              <span className="text-xs text-slate-400">{tx(lang, 'to', 'থেকে')}</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono dark:border-slate-800 dark:bg-slate-900"
              />
            </div>
          )}

          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {tx(lang, 'Refresh', 'রিফ্রেশ')}
          </button>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: tr('todaySales', lang), value: kpis ? formatBDT(kpis.sales) : '—', tone: 'text-slate-900 dark:text-white' },
          {
            label: tr('grossProfit', lang),
            value: kpis ? (kpis.grossProfit !== null ? formatBDT(kpis.grossProfit) : restrictedText) : '—',
            tone: 'text-emerald-700 dark:text-emerald-400',
          },
          {
            label: tr('netProfit', lang),
            value: kpis ? (kpis.netProfit !== null ? formatBDT(kpis.netProfit) : restrictedText) : '—',
            tone:
              kpis?.netProfit !== null && Number(kpis?.netProfit) < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-700 dark:text-emerald-400',
          },
          { label: tr('operatingExpenses', lang), value: kpis ? formatBDT(kpis.expenses) : '—', tone: 'text-amber-700 dark:text-amber-400' },
          { label: tr('cashReceived', lang), value: kpis ? formatBDT(kpis.cashReceived) : '—', tone: 'text-slate-900 dark:text-white' },
          {
            label: tr('customerOutstanding', lang),
            value: kpis ? formatBDT(kpis.customerOutstanding) : '—',
            tone: 'text-red-600 dark:text-red-400',
            onClick: () => onNavigate('customer-due'),
          },
          {
            label: tr('supplierOutstanding', lang),
            value: kpis ? formatBDT(kpis.supplierOutstanding) : '—',
            tone: 'text-amber-700 dark:text-amber-400',
            onClick: () => onNavigate('supplier-due'),
          },
          {
            label: tr('inventoryValue', lang),
            value: kpis ? (kpis.inventoryValue !== null ? formatBDT(kpis.inventoryValue) : restrictedText) : '—',
            tone: 'text-slate-900 dark:text-white',
            onClick: () => onNavigate('inventory'),
          },
        ].map((kpi, i) => (
          <div
            key={i}
            onClick={kpi.onClick}
            className={`rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${
              kpi.onClick ? 'cursor-pointer hover:border-emerald-500/50 transition' : ''
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="truncate">{kpi.label}</span>
              {kpi.onClick && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
            </div>
            <div className={`mt-2 font-mono text-xl font-bold tabular-nums ${kpi.tone}`}>
              {loading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {trCompact('Daily Sales & Gross Profit Trend', 'দৈনিক বিক্রয় ও লাভের ধারা', lang)}
          </h2>
          <div className="mt-4 h-64">
            {data?.dailyTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val: any) => formatBDT(val)} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name={tx(lang, 'Sales', 'বিক্রয়')}
                    stroke="#059669"
                    fill="#10b981"
                    fillOpacity={0.18}
                  />
                  {data.canViewProfit && (
                    <Area
                      type="monotone"
                      dataKey="grossProfit"
                      name={tx(lang, 'Gross Profit', 'মোট লাভ')}
                      stroke="#0284c7"
                      fill="#0ea5e9"
                      fillOpacity={0.12}
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
                  className="mt-3 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  {tx(lang, 'Open POS Counter', 'বিক্রয় কাউন্টার খুলুন')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {trCompact('Sales by Category', 'ক্যাটাগরি অনুযায়ী বিক্রয়', lang)}
          </h2>
          <div className="mt-4 h-64">
            {data?.salesByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesByCategory} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="category" type="category" width={95} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: any) => formatBDT(val)} />
                  <Bar dataKey="amount" name={tx(lang, 'Revenue', 'আয়')} fill="#059669" radius={[0, 4, 4, 0]} />
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

      {/* Payment Breakdown + Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Payment Method Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {trCompact('Payment Method Breakdown', 'পেমেন্ট মাধ্যম বিশ্লেষণ', lang)}
          </h2>
          <div className="mt-4 space-y-2.5">
            {data?.paymentBreakdown?.length > 0 ? (
              data.paymentBreakdown.map((p: any) => (
                <div
                  key={p.method}
                  className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs last:border-0 dark:border-slate-800"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {formatMethodLabel(p.method, lang)}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatBDT(p.amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">
                {tx(lang, 'No payments recorded in selected period.', 'নির্বাচিত সময়ে কোনো পেমেন্ট রেকর্ড হয়নি।')}
              </p>
            )}
          </div>
        </div>

        {/* Low Stock & Out of Stock */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {trCompact('Low & Out-of-Stock Alerts', 'কম স্টক সতর্কতা', lang)}
            </h2>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {[...(data?.outOfStockProducts || []), ...(data?.lowStockProducts || [])].length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                {tx(lang, 'All SKUs are above minimum stock levels.', 'সব পণ্যের পর্যাপ্ত স্টক রয়েছে।')}
              </p>
            ) : (
              [...(data?.outOfStockProducts || []), ...(data?.lowStockProducts || [])].map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-medium text-slate-900 dark:text-white">
                      {trCompact(p.name, p.nameBn, lang)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {p.variant} · {tx(lang, 'Min', 'সর্বনিম্ন')} {formatQty(p.minStock)} {formatUnitLabel(p.baseUnit, lang)}
                    </div>
                  </div>
                  <div
                    className={`font-mono font-semibold whitespace-nowrap ${
                      Number(p.currentStock) <= 0 ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {formatQty(p.currentStock)} {formatUnitLabel(p.baseUnit, lang)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Customer Dues */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {trCompact('Pending Customer Dues', 'ক্রেতাদের বকেয়া', lang)}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('customer-due')}
              className="text-xs font-medium text-emerald-600 hover:underline cursor-pointer"
            >
              {tx(lang, 'View all', 'সব দেখুন')}
            </button>
          </div>
          <div className="mt-3 max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {data?.pendingCustomerDues?.length > 0 ? (
              data.pendingCustomerDues.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-medium text-slate-900 dark:text-white">{c.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">{c.phone}</div>
                  </div>
                  <div className="font-mono font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {formatBDT(c.currentDue)}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">
                {tx(lang, 'No pending customer dues.', 'কোনো ক্রেতার বাকি নেই।')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            {trCompact('Recent Sales Transactions', 'সাম্প্রতিক বিক্রয় তালিকা', lang)}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
          >
            + {tr('newSale', lang)}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Invoice', 'রসিদ নং')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Date', 'তারিখ')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Customer', 'ক্রেতা')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Total', 'মোট')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Paid', 'পরিশোধ')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Due', 'বাকি')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Status', 'অবস্থা')}</th>
                {staff?.role !== 'CASHIER' && (
                  <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Action', 'কার্যক্রম')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.recentTransactions?.length > 0 ? (
                data.recentTransactions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-900 dark:text-white">
                      {s.invoiceNumber}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                      {formatDateDDMMYYYY(s.saleDate)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                      {s.customerName || tx(lang, 'Walk-in Cash', 'সাধারণ নগদ ক্রেতা')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {formatBDT(s.totalAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      {formatBDT(s.paidAmount)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-red-600 dark:text-red-400">
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
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline cursor-pointer"
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
