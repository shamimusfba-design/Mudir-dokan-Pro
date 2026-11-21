import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { D, formatBDT, formatDateDDMMYYYY, dhakaTodayISO } from '../lib/decimal';
import { tr, tx, formatMethodLabel, formatStatusLabel } from '../lib/i18n';
import { ReceiptModal, type PrintableReceipt } from '../components/ReceiptModal';

const AGING_LABELS_BN: Record<string, string> = {
  '0-7': '০–৭ দিন',
  '8-15': '৮–১৫ দিন',
  '16-30': '১৬–৩০ দিন',
  '31-60': '৩১–৬০ দিন',
  '60+': '৬০+ দিন',
};

export const CustomerDuePage: React.FC = () => {
  const { store, settings, lang, refreshCatalog } = useApp();
  const [dashboard, setDashboard] = useState<any>(null);
  const [agingFilter, setAgingFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const [collectingCustomer, setCollectingCustomer] = useState<any>(null);
  const [customerUnpaidInvoices, setCustomerUnpaidInvoices] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK'>('CASH');
  const [payDate, setPayDate] = useState(dhakaTodayISO());
  const [remarks, setRemarks] = useState('');
  const [allocationMode, setAllocationMode] = useState<'FIFO' | 'MANUAL'>('FIFO');
  const [manualAlloc, setManualAlloc] = useState<Record<number, string>>({});
  const [receipt, setReceipt] = useState<PrintableReceipt | null>(null);

  const loadDashboard = async () => {
    try {
      const data = await apiFetch('/api/customers/due/dashboard');
      setDashboard(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load customer due dashboard', 'ক্রেতার বাকি তথ্য লোড ব্যর্থ হয়েছে'));
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const openCollectModal = async (cust: { id: number; name: string; phone: string; customerCode: string; currentDue: string }) => {
    setCollectingCustomer(cust);
    setPayAmount(cust.currentDue);
    setAllocationMode('FIFO');
    setManualAlloc({});
    try {
      const khata = await apiFetch(`/api/customers/${cust.id}/khata`);
      setCustomerUnpaidInvoices(khata.unpaidInvoices || []);
    } catch {
      setCustomerUnpaidInvoices([]);
    }
  };

  const handleCollectDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingCustomer) return;
    try {
      const allocations =
        allocationMode === 'MANUAL'
          ? Object.entries(manualAlloc)
              .filter(([, v]) => D(v).gt(0))
              .map(([saleId, allocatedAmount]) => ({ saleId: Number(saleId), allocatedAmount }))
          : undefined;

      const res = await apiFetch(`/api/customers/${collectingCustomer.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: payAmount,
          paymentMethod: payMethod,
          paymentDate: payDate,
          remarks,
          allocations,
        }),
      });

      toast.success(
        tx(
          lang,
          `Collected ${formatBDT(res.payment.amount)} (${res.payment.receiptNumber})`,
          `${formatBDT(res.payment.amount)} আদায় সম্পন্ন হয়েছে (${res.payment.receiptNumber})`
        )
      );
      setCollectingCustomer(null);
      setRemarks('');
      setReceipt({
        type: 'PAYMENT',
        receiptNumber: res.payment.receiptNumber,
        paymentDate: res.payment.paymentDate,
        customerName: res.customer.name,
        customerCode: res.customer.customerCode,
        customerPhone: res.customer.phone,
        amount: res.payment.amount,
        paymentMethod: res.payment.paymentMethod,
        remainingDue: res.customer.currentDue,
        remarks: res.payment.remarks,
        allocations: res.allocations,
      });
      await Promise.all([loadDashboard(), refreshCatalog()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Due collection failed', 'বাকি আদায় ব্যর্থ হয়েছে'));
    }
  };

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (dashboard?.openInvoices || []).filter((inv: any) => {
      if (agingFilter !== 'ALL' && inv.agingBucket !== agingFilter) return false;
      if (!q) return true;
      return (
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q)
      );
    });
  }, [dashboard, agingFilter, search]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (dashboard?.customersWithDue || []).filter((c: any) => {
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.customerCode.toLowerCase().includes(q);
    });
  }, [dashboard, search]);

  const summary = dashboard?.summary;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('customerDue', lang)}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {tx(
            lang,
            'Due Tracking Dashboard · 5-Bucket Aging Reports · Multi-Invoice Payment Allocation',
            'বাকি ট্র্যাকিং ড্যাশবোর্ড · মেয়াদ অনুযায়ী বিশ্লেষণ · একাধিক বিলে বাকি আদায়'
          )}
        </p>
      </div>

      {/* 7 Due Tracking KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          [tx(lang, 'Total Outstanding', 'মোট বাকি'), formatBDT(summary?.totalOutstanding || 0), 'text-red-600 dark:text-red-400'],
          [tx(lang, 'Due Today', 'আজকের বাকি'), formatBDT(summary?.dueToday || 0), 'text-amber-600'],
          [tx(lang, 'Upcoming Due', 'আসন্ন বাকি'), formatBDT(summary?.upcomingDue || 0), 'text-slate-900 dark:text-white'],
          [tx(lang, 'Overdue Customers', 'মেয়াদোত্তীর্ণ ক্রেতা'), String(summary?.overdueCustomers || 0), 'text-red-600'],
          [tx(lang, 'Overdue Amount', 'মেয়াদোত্তীর্ণ টাকা'), formatBDT(summary?.overdueAmount || 0), 'text-red-600'],
          [tx(lang, 'Partially Paid Inv.', 'আংশিক পরিশোধিত'), String(summary?.partiallyPaidInvoices || 0), 'text-amber-600'],
          [tx(lang, 'Fully Paid Inv.', 'পূর্ণ পরিশোধিত'), String(summary?.fullyPaidInvoices || 0), 'text-emerald-700'],
        ].map(([label, val, tone]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[11px] font-medium text-slate-500 truncate">{label}</div>
            <div className={`mt-1.5 font-mono text-base font-bold ${tone}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* 5-Bucket Aging Report Strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {tx(
              lang,
              'Receivable Aging Analysis (Click bucket to filter open invoices)',
              'বাকির মেয়াদ বিশ্লেষণ (ফিল্টার করতে ক্লিক করুন)'
            )}
          </h2>
          {agingFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setAgingFilter('ALL')}
              className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
            >
              {tx(lang, 'Reset Filter', 'ফিল্টার রিসেট')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {(dashboard?.aging || []).map((b: any) => (
            <button
              key={b.bucket}
              type="button"
              onClick={() => setAgingFilter(agingFilter === b.bucket ? 'ALL' : b.bucket)}
              className={`rounded-lg border p-3 text-left transition cursor-pointer ${
                agingFilter === b.bucket
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
              }`}
            >
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'BN' ? AGING_LABELS_BN[b.bucket] || b.label : b.label}
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                {formatBDT(b.amount)}
              </div>
              <div className="text-[11px] text-slate-500">
                {tx(lang, `${b.count} invoice(s)`, `${b.count}টি বিল`)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tx(lang, 'Search customer name, phone, or invoice #...', 'ক্রেতার নাম, মোবাইল বা বিল নম্বর খুঁজুন...')}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs dark:border-slate-800 dark:bg-slate-900"
        />
      </div>

      {/* Customers With Outstanding Due */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-slate-800">
          {tx(
            lang,
            `Customers with Outstanding Due (${filteredCustomers.length})`,
            `বকেয়া থাকা ক্রেতা (${filteredCustomers.length})`
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Customer', 'ক্রেতা')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Phone', 'মোবাইল')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Total Purchases', 'মোট ক্রয়')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Total Paid', 'মোট পরিশোধ')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Outstanding Due', 'বর্তমান বাকি')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Action', 'কার্যক্রম')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                    {c.name} <span className="font-mono text-[11px] font-normal text-slate-500">({c.customerCode})</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{c.phone}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBDT(c.totalPurchases)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{formatBDT(c.totalPaid)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600">{formatBDT(c.currentDue)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => openCollectModal(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      {tr('collectDue', lang)}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {tx(lang, 'No customers currently have an outstanding balance.', 'বর্তমানে কোনো ক্রেতার বাকি নেই।')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Credit Invoices */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-slate-800">
          {tx(lang, `Open Credit Invoices (${filteredInvoices.length})`, `বাকি থাকা রসিদসমূহ (${filteredInvoices.length})`)}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Invoice', 'রসিদ নং')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Customer', 'ক্রেতা')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Sale Date', 'বিক্রয় তারিখ')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Expected Pay', 'পরিশোধের তারিখ')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Age', 'বয়স')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Total', 'মোট')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Due', 'বাকি')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Status', 'অবস্থা')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.map((inv: any) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.customerName} <span className="font-mono text-[11px] text-slate-500">{inv.customerPhone}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateDDMMYYYY(inv.saleDate)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                    {formatDateDDMMYYYY(inv.expectedPaymentDate)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {inv.ageDays}
                    {tx(lang, 'd', ' দিন')}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBDT(inv.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-red-600">{formatBDT(inv.dueAmount)}</td>
                  <td
                    className={`px-4 py-2.5 font-semibold ${
                      inv.dueState === 'OVERDUE'
                        ? 'text-red-600'
                        : inv.dueState === 'DUE_TODAY'
                          ? 'text-amber-600'
                          : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {inv.dueState === 'OVERDUE'
                      ? formatStatusLabel('OVERDUE', lang)
                      : inv.dueState === 'DUE_TODAY'
                        ? formatStatusLabel('DUE_TODAY', lang)
                        : formatStatusLabel(inv.paymentStatus, lang)}
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    {tx(lang, 'No open credit invoices in this filter.', 'এই ফিল্টারে কোনো বাকি রসিদ নেই।')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Due Modal */}
      {collectingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <form
            onSubmit={handleCollectDue}
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{tx(lang, 'Collect Customer Due', 'ক্রেতার বাকি আদায়')}</h3>
                <p className="text-xs text-slate-500">
                  {collectingCustomer.name} ({collectingCustomer.customerCode}) · {tx(lang, 'Outstanding:', 'বর্তমান বাকি:')}{' '}
                  <strong className="font-mono text-red-600">{formatBDT(collectingCustomer.currentDue)}</strong>
                </p>
              </div>
              <button type="button" onClick={() => setCollectingCustomer(null)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-500">
                  {tx(lang, 'Received Amount (৳) *', 'প্রাপ্ত টাকা (৳) *')}
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm font-bold dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Payment Method', 'পেমেন্ট মাধ্যম')}</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK'] as const).map((m) => (
                    <option key={m} value={m}>
                      {formatMethodLabel(m, lang)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Payment Date', 'তারিখ')}</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            {customerUnpaidInvoices.length > 0 && (
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">{tx(lang, 'Invoice Payment Allocation', 'বিল অনুযায়ী সমন্বয়')}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAllocationMode('FIFO')}
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold cursor-pointer ${
                        allocationMode === 'FIFO' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {tx(lang, 'Auto Oldest First (FIFO)', 'স্বয়ংক্রিয় পুরোনো বিল আগে')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationMode('MANUAL')}
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold cursor-pointer ${
                        allocationMode === 'MANUAL' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {tx(lang, 'Manual Split', 'ম্যানুয়াল ভাগ')}
                    </button>
                  </div>
                </div>
                {allocationMode === 'MANUAL' && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                    {customerUnpaidInvoices.map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-mono font-medium">{inv.invoiceNumber}</span> · {tx(lang, 'Due', 'বাকি')}{' '}
                          <span className="font-mono text-red-600">{formatBDT(inv.dueAmount)}</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={inv.dueAmount}
                          placeholder="0.00"
                          value={manualAlloc[inv.id] || ''}
                          onChange={(e) => setManualAlloc((prev) => ({ ...prev, [inv.id]: e.target.value }))}
                          className="w-24 rounded border border-slate-200 px-2 py-1 text-right font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <input
              placeholder={tx(lang, 'Remarks / bKash TrxID (optional)', 'মন্তব্য / বিকাশ ট্রানজেকশন আইডি (ঐচ্ছিক)')}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCollectingCustomer(null)}
                className="rounded-lg border px-4 py-2 text-xs"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                {tx(lang, 'Collect & Print Receipt', 'আদায় ও রসিদ প্রিন্ট')}
              </button>
            </div>
          </form>
        </div>
      )}

      {receipt && <ReceiptModal receipt={receipt} store={store} settings={settings} onClose={() => setReceipt(null)} />}
    </div>
  );
};
