import React, { useEffect, useMemo, useState } from 'react';
import { Download, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch, exportRowsToCsv } from '../lib/api';
import { formatBDT, formatQty, dhakaTodayISO } from '../lib/decimal';
import { tr, tx, formatMethodLabel, formatStatusLabel, formatVariant, trCompact } from '../lib/i18n';
import { BrandLogo, ProductImage } from '../components/ProductMedia';

function getCompletedSixMonthRange(todayISO: string): { start: string; end: string } {
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

export const ReportsPage: React.FC = () => {
  const { lang, staff, settings, categories } = useApp();
  const today = dhakaTodayISO();
  const fallback6m = useMemo(() => getCompletedSixMonthRange(today), [today]);
  const sixMonthStart = settings?.demoPeriodStart || fallback6m.start;
  const sixMonthEnd = settings?.demoPeriodEnd || fallback6m.end;

  const [from, setFrom] = useState(() => (settings?.demoModeActive ? sixMonthStart : `${today.slice(0, 7)}-01`));
  const [to, setTo] = useState(() => (settings?.demoModeActive ? sixMonthEnd : today));
  const [tab, setTab] = useState<'pnl' | 'product' | 'category' | 'brand' | 'slow'>('pnl');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const loadReports = async () => {
    setDenied(false);
    setLoading(true);
    try {
      const res = await apiFetch(`/api/finance/reports?from=${from}&to=${to}`);
      setReport(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : tx(lang, 'Failed to load reports', 'রিপোর্ট লোড ব্যর্থ হয়েছে');
      if (msg.toLowerCase().includes('authorization')) {
        setDenied(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [from, to, staff?.role, settings?.allowCashierReports]);

  if (denied) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Lock className="mx-auto h-8 w-8 text-orange-500" />
        <h2 className="mt-3 text-base font-extrabold text-slate-900 dark:text-white">
          {tx(lang, 'Owner / Manager Access Required', 'মালিক বা ম্যানেজারের অনুমতি প্রয়োজন')}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {tx(
            lang,
            'Cashier role cannot view sensitive COGS, profit margins, and financial reports unless enabled in Settings.',
            'সেটিংস থেকে অনুমতি না দিলে ক্যাশিয়ার ক্রয়মূল্য, লাভ ও আর্থিক রিপোর্ট দেখতে পারবেন না।'
          )}
        </p>
      </div>
    );
  }

  const p = report?.profitSummary || report?.pnl || {};

  const handleExport = () => {
    if (!report) return;
    if (tab === 'product') {
      exportRowsToCsv(
        `product-profit-${from}-to-${to}.csv`,
        ['SKU', 'Product', 'Variant', 'Qty Sold', 'Revenue (BDT)', 'COGS (BDT)', 'Gross Profit (BDT)'],
        (report.productProfit || []).map((r: any) => [
          r.sku,
          r.name,
          r.variant,
          r.qtySold,
          Number(r.revenue || 0).toFixed(2),
          Number(r.cogs || 0).toFixed(2),
          Number(r.grossProfit || 0).toFixed(2),
        ])
      );
    } else if (tab === 'category') {
      exportRowsToCsv(
        `category-profit-${from}-to-${to}.csv`,
        ['Category', 'Revenue (BDT)', 'COGS (BDT)', 'Gross Profit (BDT)'],
        (report.categoryProfit || []).map((r: any) => [
          r.category,
          Number(r.revenue || 0).toFixed(2),
          Number(r.cogs || 0).toFixed(2),
          Number(r.grossProfit || 0).toFixed(2),
        ])
      );
    } else if (tab === 'brand') {
      exportRowsToCsv(
        `brand-sales-${from}-to-${to}.csv`,
        ['Brand', 'Units Sold', 'Revenue (BDT)'],
        (report.brandSales || []).map((r: any) => [r.brand, r.qtySold, Number(r.revenue || 0).toFixed(2)])
      );
    } else if (tab === 'slow') {
      exportRowsToCsv(
        `slow-moving-stock-${to}.csv`,
        ['SKU', 'Product', 'Variant', 'Current Stock', 'Stock Value (BDT)'],
        (report.slowMovingProducts || []).map((r: any) => [r.sku, r.name, r.variant, r.currentStock, r.stockValue])
      );
    } else {
      exportRowsToCsv(
        `profit-loss-${from}-to-${to}.csv`,
        ['Metric', 'Amount (BDT)'],
        [
          ['Sales Revenue', p.salesRevenue || 0],
          ['Cost of Goods Sold (WAC)', p.cogs || 0],
          ['Gross Profit', p.grossProfit || 0],
          ['Operating Expenses', p.operatingExpenses || 0],
          ['Operating Net Profit', p.netProfit || 0],
          ['Inventory Purchases (Asset)', p.totalPurchases || 0],
          ['Inventory Valuation (Cost)', report.inventoryValuation?.totalCostValue || '0'],
          ['Customer Dues Receivable', report.dues?.customerDueTotal || '0'],
          ['Supplier Dues Payable', report.dues?.supplierDueTotal || '0'],
        ]
      );
    }
    toast.success(tx(lang, 'CSV exported (Excel compatible)', 'সিএসভি ফাইল ডাউনলোড হয়েছে'));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{tr('reports', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Weighted-Average Costing P&L · Inventory Assets separated from Operating Expenses',
              'গড় ক্রয়মূল্য ভিত্তিক লাভ-ক্ষতি · স্টক সম্পদ ও পরিচালনা খরচের আলাদা হিসাব'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => {
                setFrom(`${today.slice(0, 7)}-01`);
                setTo(today);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                from === `${today.slice(0, 7)}-01` && to === today
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-indigo-700 dark:text-slate-400'
              }`}
            >
              {tx(lang, 'This Month', 'এই মাস')}
            </button>
            <button
              type="button"
              onClick={() => {
                setFrom(sixMonthStart);
                setTo(sixMonthEnd);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold cursor-pointer ${
                from === sixMonthStart && to === sixMonthEnd
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-indigo-700 dark:text-slate-400'
              }`}
            >
              {tx(lang, '6 Months', '৬ মাস')}
            </button>
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
          />
          <span className="text-xs text-slate-400">{tx(lang, 'to', 'থেকে')}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:from-indigo-700 hover:to-blue-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            {tr('exportCsv', lang)}
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        {(
          [
            ['pnl', tx(lang, 'Profit & Loss / Cash Flow', 'লাভ-ক্ষতি ও ক্যাশ ফ্লো')],
            ['product', tx(lang, 'Product-Wise Profit', 'পণ্য অনুযায়ী লাভ')],
            ['category', tx(lang, 'Category-Wise Profit', 'ক্যাটাগরি অনুযায়ী লাভ')],
            ['brand', tx(lang, 'Brand-Wise Sales', 'ব্র্যান্ড অনুযায়ী বিক্রয়')],
            ['slow', tx(lang, 'Slow-Moving Stock', 'অবিক্রিত / ধীর স্টক')],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              tab === k ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-indigo-700 dark:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && !report && (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium text-slate-500">
            {tx(lang, 'Calculating Profit & Financial Reports...', 'লাভ ও আর্থিক হিসাব গণনা করা হচ্ছে...')}
          </p>
        </div>
      )}

      {report && tab === 'pnl' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h2 className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400">
                {tx(lang, 'Income Statement (Weighted Average Costing)', 'আয়-ব্যয় বিবরণী (গড় ক্রয়মূল্য ভিত্তিক)')}
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>
                    {tx(lang, `Sales Revenue (${p.salesCount} completed invoices)`, `মোট বিক্রয় আয় (${p.salesCount}টি বিল)`)}
                  </span>
                  <span className="font-mono font-bold">{formatBDT(p.salesRevenue)}</span>
                </div>
                <div className="flex justify-between pl-3 py-1 text-[11px] text-slate-500">
                  <span>{tx(lang, '↳ Instant Paid at Sale (Cash + MFS + Card/Bank)', '↳ তাৎক্ষণিক পরিশোধ (নগদ + ডিজিটাল)')}</span>
                  <span className="font-mono font-semibold text-emerald-600">{formatBDT(p.paidAtSale ?? 0)}</span>
                </div>
                <div className="flex justify-between pl-3 pb-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>{tx(lang, '↳ Credit Sales Issued (Baki)', '↳ বাকিতে বিক্রয়')}</span>
                  <span className="font-mono font-semibold text-rose-600">{formatBDT(p.creditIssued ?? 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  <span>{tx(lang, 'Less: Cost of Goods Sold (COGS)', 'বাদ: বিক্রিত পণ্যের ক্রয়মূল্য')}</span>
                  <span className="font-mono">-{formatBDT(p.cogs)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700 font-bold text-emerald-700 dark:text-emerald-400">
                  <span>
                    {tx(lang, `Gross Profit (${p.grossMarginPct}% Margin)`, `মোট লাভ / গ্রস (${p.grossMarginPct}% মার্জিন)`)}
                  </span>
                  <span className="font-mono">{formatBDT(p.grossProfit)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-orange-600">
                  <span>{tx(lang, 'Less: Operating Expenses', 'বাদ: পরিচালনা খরচ')}</span>
                  <span className="font-mono">-{formatBDT(p.operatingExpenses)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-extrabold text-slate-900 dark:text-white">
                  <span>{tx(lang, 'Operating Net Profit', 'নিট লাভ')}</span>
                  <span className={`font-mono ${Number(p.netProfit) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatBDT(p.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h2 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                {tx(lang, 'Balance Sheet & Cash Flow Snapshot', 'ব্যালেন্স শিট ও ক্যাশ ফ্লো সংক্ষিপ্তসার')}
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>{tx(lang, 'Customer Due Collections (Non-Revenue)', 'ক্রেতার বাকি আদায় (নতুন আয় নয়)')}</span>
                  <span className="font-mono font-bold text-indigo-600">{formatBDT(p.dueCollections ?? 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>{tx(lang, 'Inventory Asset Purchases (Period)', 'এই সময়ে পণ্য ক্রয় (সম্পদ)')}</span>
                  <span className="font-mono font-bold">{formatBDT(p.totalPurchases)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>{tx(lang, 'Current Inventory Valuation (Cost)', 'বর্তমান মজুদ পণ্যের মূল্য')}</span>
                  <span className="font-mono font-bold">{formatBDT(report?.inventoryValuation?.totalCostValue || 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>{tx(lang, 'Customer Dues Receivable', 'ক্রেতার কাছে মোট পাওনা')}</span>
                  <span className="font-mono font-bold text-rose-600">{formatBDT(report?.dues?.customerDueTotal || 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>{tx(lang, 'Supplier Dues Payable', 'সরবরাহকারীর মোট পাওনা')}</span>
                  <span className="font-mono font-bold text-orange-600">{formatBDT(report?.dues?.supplierDueTotal || 0)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span>{tx(lang, 'Physical Cash In / Out (Period)', 'নগদ জমা / খরচ (এই সময়ে)')}</span>
                  <span className="font-mono">
                    +{formatBDT(report?.cashFlow?.totalIn || 0)} / -{formatBDT(report?.cashFlow?.totalOut || 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-extrabold">
                  <span>{tx(lang, 'Net Physical Cash Flow', 'নিট নগদ প্রবাহ')}</span>
                  <span className="font-mono text-emerald-600">{formatBDT(report?.cashFlow?.netCashFlow || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly P&L Breakdown Table */}
          {report.monthlyBreakdown && report.monthlyBreakdown.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {tx(lang, 'Monthly Sales, Credit & Profit Reconciliation', 'মাসিক বিক্রয়, বাকি ও লাভের হিসাব')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">{tx(lang, 'Month', 'মাস')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'Invoices', 'বিল')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'Total Sales', 'মোট বিক্রয়')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'Paid at Sale', 'নগদ/ডিজিটাল')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'Credit Sales', 'বাকি বিক্রয়')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'COGS', 'ক্রয়মূল্য')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'Gross Profit', 'মোট লাভ')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'Margin', 'মার্জিন')}</th>
                      <th className="px-3 py-2.5 text-right font-bold">{tx(lang, 'Expenses', 'খরচ')}</th>
                      <th className="px-4 py-2.5 text-right font-bold">{tx(lang, 'Net Profit', 'নিট লাভ')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.monthlyBreakdown.map((m: any) => (
                      <tr key={m.ym} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-400">{m.ym}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-500">{m.salesCount}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold">{formatBDT(m.revenue)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">{formatBDT(m.paidAtSale)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400">{formatBDT(m.creditIssued)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-500">{formatBDT(m.cogs)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600">{formatBDT(m.grossProfit)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-indigo-600">{m.grossMarginPct}%</td>
                        <td className="px-3 py-2.5 text-right font-mono text-orange-600">{formatBDT(m.expenses)}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-extrabold text-slate-900 dark:text-white">{formatBDT(m.netProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Channels & Cash Flow Breakdown */}
          {report.paymentChannels && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {tx(lang, 'Payment Channels (Sales vs Due Collections)', 'পেমেন্ট মাধ্যম (বিক্রয় বনাম বাকি আদায়)')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <p className="font-bold text-indigo-700 dark:text-indigo-400">
                      {tx(lang, 'Paid at Counter', 'কাউন্টারে পরিশোধ')}
                    </p>
                    {report.paymentChannels.salesAtCounter.map((ch: any) => (
                      <div key={ch.method} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                        <span>{formatMethodLabel(ch.method, lang)}</span>
                        <span className="font-mono font-bold">{formatBDT(ch.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">
                      {tx(lang, 'Khata Due Collections', 'খাতা বাকি আদায়')}
                    </p>
                    {report.paymentChannels.dueCollections.map((ch: any) => (
                      <div key={ch.method} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                        <span>{formatMethodLabel(ch.method, lang)}</span>
                        <span className="font-mono font-bold">{formatBDT(ch.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {tx(lang, 'Physical Cash Register Flows by Category', 'ক্যাশ রেজিস্টার লেনদেনের শ্রেণিবিভাগ')}
                </h3>
                <div className="space-y-1.5 text-xs">
                  {(report.cashFlow?.byType || []).map((t: any) => (
                    <div key={`${t.txType}-${t.direction}`} className="flex justify-between border-b border-slate-100 py-1 dark:border-slate-800">
                      <span>{formatStatusLabel(t.txType, lang)}</span>
                      <span className={`font-mono font-bold ${t.direction === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.direction === 'IN' ? '+' : '-'}{formatBDT(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {report && tab === 'product' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'Product', 'পণ্য')}</th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'SKU', 'কোড')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Qty Sold', 'বিক্রিত পরিমাণ')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Revenue', 'বিক্রয় আয়')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'COGS', 'ক্রয়মূল্য')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Gross Profit', 'মোট লাভ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(report?.productProfit || []).map((r: any) => {
                  const cat = catMap.get(r.categoryId);
                  return (
                    <tr key={r.productId} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={r.imageUrl}
                            alt={r.name}
                            iconName={cat?.iconName}
                            accentColor={cat?.accentColor}
                            fallbackIndex={r.categoryId || 0}
                            size="sm"
                          />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {trCompact(r.name, r.nameBn, lang)}{' '}
                            <span className="font-normal text-slate-500">({formatVariant(r.variant, lang)})</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{r.sku}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatQty(r.qtySold)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatBDT(r.revenue)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatBDT(r.cogs)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-extrabold text-emerald-600">
                        {formatBDT(r.grossProfit)}
                      </td>
                    </tr>
                  );
                })}
                {(!report?.productProfit || report.productProfit.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      {tx(lang, 'No product sales in selected range.', 'নির্বাচিত সময়ে কোনো পণ্য বিক্রি হয়নি।')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {report && tab === 'category' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-3 font-bold">{tx(lang, 'Category', 'ক্যাটাগরি')}</th>
                <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Revenue', 'বিক্রয় আয়')}</th>
                <th className="px-4 py-3 text-right font-bold">{tx(lang, 'COGS', 'ক্রয়মূল্য')}</th>
                <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Gross Profit', 'মোট লাভ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(report?.categoryProfit || []).map((r: any) => (
                <tr key={r.category}>
                  <td className="px-4 py-2.5 font-bold">{r.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBDT(r.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatBDT(r.cogs)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-extrabold text-emerald-600">
                    {formatBDT(r.grossProfit)}
                  </td>
                </tr>
              ))}
              {(!report?.categoryProfit || report.categoryProfit.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    {tx(lang, 'No category data recorded.', 'কোনো ক্যাটাগরি তথ্য পাওয়া যায়নি।')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Brand-Wise Sales with Authentic Official Brand Logos */}
      {report && tab === 'brand' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-3 font-bold">{tx(lang, 'Brand', 'ব্র্যান্ড')}</th>
                <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Units Sold', 'বিক্রিত একক')}</th>
                <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Sales Revenue', 'বিক্রয় আয়')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(report?.brandSales || []).map((r: any) => (
                <tr key={r.brand} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <BrandLogo logoUrl={r.logoUrl} name={r.brand} brandColor={r.brandColor} size="sm" />
                      <span className="font-bold text-slate-900 dark:text-white">{r.brand}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatQty(r.qtySold)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-extrabold text-indigo-700 dark:text-indigo-400">
                    {formatBDT(r.revenue)}
                  </td>
                </tr>
              ))}
              {(!report?.brandSales || report.brandSales.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    {tx(lang, 'No brand sales recorded in selected range.', 'নির্বাচিত সময়ে কোনো ব্র্যান্ড বিক্রয় হয়নি।')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {report && tab === 'slow' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3 font-bold">
                    {tx(lang, 'Unsold Product (Zero Sales in Period)', 'অবিক্রিত পণ্য (এই সময়ে বিক্রি হয়নি)')}
                  </th>
                  <th className="px-4 py-3 font-bold">{tx(lang, 'SKU', 'কোড')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Current Stock', 'বর্তমান মজুদ')}</th>
                  <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Tied-Up Cost Value', 'আটকে থাকা পুঁজি')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(report?.slowMovingProducts || []).map((r: any) => {
                  const cat = catMap.get(r.categoryId);
                  return (
                    <tr key={r.id} className="hover:bg-orange-50/30 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={r.imageUrl}
                            alt={r.name}
                            iconName={cat?.iconName}
                            accentColor={cat?.accentColor}
                            fallbackIndex={r.categoryId || 0}
                            size="sm"
                          />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {trCompact(r.name, r.nameBn, lang)}{' '}
                            <span className="font-normal text-slate-500">({formatVariant(r.variant, lang)})</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-500">{r.sku}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{formatQty(r.currentStock)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-orange-600">
                        {formatBDT(r.stockValue)}
                      </td>
                    </tr>
                  );
                })}
                {(!report?.slowMovingProducts || report.slowMovingProducts.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      {tx(lang, 'No slow-moving products found.', 'কোনো অবিক্রিত বা ধীর পণ্য পাওয়া যায়নি।')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
