import React, { useEffect, useState } from 'react';
import { Download, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch, exportRowsToCsv } from '../lib/api';
import { formatBDT, formatQty, dhakaTodayISO } from '../lib/decimal';
import { tr, tx } from '../lib/i18n';

export const ReportsPage: React.FC = () => {
  const { lang, staff, settings } = useApp();
  const today = dhakaTodayISO();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [tab, setTab] = useState<'pnl' | 'product' | 'category' | 'brand' | 'slow'>('pnl');
  const [report, setReport] = useState<any>(null);
  const [denied, setDenied] = useState(false);

  const loadReports = async () => {
    setDenied(false);
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
    }
  };

  useEffect(() => {
    loadReports();
  }, [from, to, staff?.role, settings?.allowCashierReports]);

  if (denied) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <Lock className="mx-auto h-8 w-8 text-amber-600" />
        <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
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

  const p = report?.profitSummary;

  const handleExport = () => {
    if (!report) return;
    if (tab === 'product') {
      exportRowsToCsv(
        `product-profit-${from}-to-${to}.csv`,
        ['SKU', 'Product', 'Variant', 'Qty Sold', 'Revenue (BDT)', 'COGS (BDT)', 'Gross Profit (BDT)'],
        report.productProfit.map((r: any) => [
          r.sku,
          r.name,
          r.variant,
          r.qtySold,
          r.revenue.toFixed(2),
          r.cogs.toFixed(2),
          r.grossProfit.toFixed(2),
        ])
      );
    } else if (tab === 'category') {
      exportRowsToCsv(
        `category-profit-${from}-to-${to}.csv`,
        ['Category', 'Revenue (BDT)', 'COGS (BDT)', 'Gross Profit (BDT)'],
        report.categoryProfit.map((r: any) => [
          r.category,
          r.revenue.toFixed(2),
          r.cogs.toFixed(2),
          r.grossProfit.toFixed(2),
        ])
      );
    } else if (tab === 'brand') {
      exportRowsToCsv(
        `brand-sales-${from}-to-${to}.csv`,
        ['Brand', 'Units Sold', 'Revenue (BDT)'],
        report.brandSales.map((r: any) => [r.brand, r.qtySold, r.revenue.toFixed(2)])
      );
    } else if (tab === 'slow') {
      exportRowsToCsv(
        `slow-moving-stock-${to}.csv`,
        ['SKU', 'Product', 'Variant', 'Current Stock', 'Stock Value (BDT)'],
        report.slowMovingProducts.map((r: any) => [r.sku, r.name, r.variant, r.currentStock, r.stockValue])
      );
    } else {
      exportRowsToCsv(
        `profit-loss-${from}-to-${to}.csv`,
        ['Metric', 'Amount (BDT)'],
        [
          ['Sales Revenue', p.salesRevenue],
          ['Cost of Goods Sold (WAC)', p.cogs],
          ['Gross Profit', p.grossProfit],
          ['Operating Expenses', p.operatingExpenses],
          ['Operating Net Profit', p.netProfit],
          ['Inventory Purchases (Asset)', p.totalPurchases],
          ['Inventory Valuation (Cost)', report.inventoryValuation.totalCostValue],
          ['Customer Dues Receivable', report.dues.customerDueTotal],
          ['Supplier Dues Payable', report.dues.supplierDueTotal],
        ]
      );
    }
    toast.success(tx(lang, 'CSV exported (Excel compatible)', 'সিএসভি ফাইল ডাউনলোড হয়েছে'));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('reports', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Weighted-Average Costing P&L · Inventory Assets separated from Operating Expenses',
              'গড় ক্রয়মূল্য ভিত্তিক লাভ-ক্ষতি · স্টক সম্পদ ও পরিচালনা খরচের আলাদা হিসাব'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
          />
          <span className="text-xs text-slate-400">{tx(lang, 'to', 'থেকে')}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-800 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            {tr('exportCsv', lang)}
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 w-fit dark:border-slate-800 dark:bg-slate-900">
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
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              tab === k ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {report && tab === 'pnl' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {tx(lang, 'Income Statement (Weighted Average Costing)', 'আয়-ব্যয় বিবরণী (গড় ক্রয়মূল্য ভিত্তিক)')}
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>
                  {tx(lang, `Sales Revenue (${p.salesCount} completed invoices)`, `মোট বিক্রয় আয় (${p.salesCount}টি বিল)`)}
                </span>
                <span className="font-mono font-semibold">{formatBDT(p.salesRevenue)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span>{tx(lang, 'Less: Cost of Goods Sold (COGS)', 'বাদ: বিক্রিত পণ্যের ক্রয়মূল্য')}</span>
                <span className="font-mono">-{formatBDT(p.cogs)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700 font-semibold text-emerald-700 dark:text-emerald-400">
                <span>
                  {tx(lang, `Gross Profit (${p.grossMarginPct}% Margin)`, `মোট লাভ / গ্রস (${p.grossMarginPct}% মার্জিন)`)}
                </span>
                <span className="font-mono">{formatBDT(p.grossProfit)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-amber-700">
                <span>{tx(lang, 'Less: Operating Expenses', 'বাদ: পরিচালনা খরচ')}</span>
                <span className="font-mono">-{formatBDT(p.operatingExpenses)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-bold text-slate-900 dark:text-white">
                <span>{tx(lang, 'Operating Net Profit', 'নিট লাভ')}</span>
                <span className={`font-mono ${Number(p.netProfit) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {formatBDT(p.netProfit)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {tx(lang, 'Balance Sheet & Cash Flow Snapshot', 'ব্যালেন্স শিট ও ক্যাশ ফ্লো সংক্ষিপ্তসার')}
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>{tx(lang, 'Inventory Asset Purchases (Period)', 'এই সময়ে পণ্য ক্রয় (সম্পদ)')}</span>
                <span className="font-mono font-semibold">{formatBDT(p.totalPurchases)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>{tx(lang, 'Current Inventory Valuation (Cost)', 'বর্তমান মজুদ পণ্যের মূল্য')}</span>
                <span className="font-mono font-semibold">{formatBDT(report.inventoryValuation.totalCostValue)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>{tx(lang, 'Customer Dues Receivable', 'ক্রেতার কাছে মোট পাওনা')}</span>
                <span className="font-mono font-semibold text-red-600">{formatBDT(report.dues.customerDueTotal)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>{tx(lang, 'Supplier Dues Payable', 'সরবরাহকারীর মোট পাওনা')}</span>
                <span className="font-mono font-semibold text-amber-700">{formatBDT(report.dues.supplierDueTotal)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span>{tx(lang, 'Cash Flow In / Out (Period)', 'নগদ জমা / খরচ (এই সময়ে)')}</span>
                <span className="font-mono">
                  +{formatBDT(report.cashFlow.totalIn)} / -{formatBDT(report.cashFlow.totalOut)}
                </span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>{tx(lang, 'Net Cash Flow', 'নিট ক্যাশ ফ্লো')}</span>
                <span className="font-mono text-emerald-700">{formatBDT(report.cashFlow.netCashFlow)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {report && tab === 'product' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-2.5">{tx(lang, 'SKU', 'কোড')}</th>
                <th className="px-4 py-2.5">{tx(lang, 'Product', 'পণ্য')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Qty Sold', 'বিক্রিত পরিমাণ')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Revenue', 'বিক্রয় আয়')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'COGS', 'ক্রয়মূল্য')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Gross Profit', 'মোট লাভ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.productProfit.map((r: any) => (
                <tr key={r.productId}>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{r.sku}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {r.name} ({r.variant})
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatQty(r.qtySold)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBDT(r.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatBDT(r.cogs)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">{formatBDT(r.grossProfit)}</td>
                </tr>
              ))}
              {report.productProfit.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {tx(lang, 'No product sales in selected range.', 'নির্বাচিত সময়ে কোনো পণ্য বিক্রি হয়নি।')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {report && tab === 'category' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-2.5">{tx(lang, 'Category', 'ক্যাটাগরি')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Revenue', 'বিক্রয় আয়')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'COGS', 'ক্রয়মূল্য')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Gross Profit', 'মোট লাভ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.categoryProfit.map((r: any) => (
                <tr key={r.category}>
                  <td className="px-4 py-2.5 font-semibold">{r.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBDT(r.revenue)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{formatBDT(r.cogs)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-emerald-700">{formatBDT(r.grossProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report && tab === 'brand' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-2.5">{tx(lang, 'Brand', 'ব্র্যান্ড')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Units Sold', 'বিক্রিত একক')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Sales Revenue', 'বিক্রয় আয়')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.brandSales.map((r: any) => (
                <tr key={r.brand}>
                  <td className="px-4 py-2.5 font-semibold">{r.brand}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatQty(r.qtySold)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{formatBDT(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {report && tab === 'slow' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-2.5">{tx(lang, 'SKU', 'কোড')}</th>
                <th className="px-4 py-2.5">
                  {tx(lang, 'Unsold Product (Zero Sales in Period)', 'অবিক্রিত পণ্য (এই সময়ে বিক্রি হয়নি)')}
                </th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Current Stock', 'বর্তমান মজুদ')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Tied-Up Cost Value', 'আটকে থাকা পুঁজি')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.slowMovingProducts.map((r: any) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{r.sku}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {r.name} ({r.variant})
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatQty(r.currentStock)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-amber-700">{formatBDT(r.stockValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
