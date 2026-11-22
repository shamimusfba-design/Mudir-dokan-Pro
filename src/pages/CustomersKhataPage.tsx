import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  UserPlus,
  Search,
  BookOpen,
  BarChart3,
  QrCode,
  Send,
  Scale,
  Copy,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateDDMMYYYY, formatDateTimeDhaka, formatQty, dhakaTodayISO } from '../lib/decimal';
import { tr, trCompact, tx, formatMethodLabel, formatStatusLabel, formatUnitLabel } from '../lib/i18n';
import { ReceiptModal, type PrintableReceipt } from '../components/ReceiptModal';

export const CustomersKhataPage: React.FC = () => {
  const { store, settings, staff, lang, refreshCatalog } = useApp();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'REGULAR' | 'VIP' | 'WHOLESALE' | 'OCCASIONAL'>('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [khata, setKhata] = useState<any>(null);
  const [khataTab, setKhataTab] = useState<'ledger' | 'invoices' | 'analytics' | 'portal'>('ledger');
  const [receipt, setReceipt] = useState<PrintableReceipt | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [custForm, setCustForm] = useState({
    name: '',
    phone: '',
    altPhone: '',
    village: '',
    area: '',
    road: '',
    house: '',
    customerType: 'REGULAR' as 'REGULAR' | 'VIP' | 'WHOLESALE' | 'OCCASIONAL',
    creditLimit: '5000',
    openingBalance: '0',
    registrationDate: dhakaTodayISO(),
    notes: '',
  });

  const [showAdj, setShowAdj] = useState(false);
  const [adjForm, setAdjForm] = useState({ direction: 'CREDIT' as 'DEBIT' | 'CREDIT', amount: '', reason: '' });

  const [reminderMsg, setReminderMsg] = useState('');
  const [reminderType, setReminderType] = useState<
    'DUE_REMINDER' | 'OVERDUE_REMINDER' | 'PAYMENT_CONFIRMATION' | 'MONTHLY_STATEMENT'
  >('DUE_REMINDER');

  const loadCustomers = async () => {
    try {
      const rows = await apiFetch('/api/customers');
      setCustomers(rows);
      if (rows.length > 0 && selectedId === null) {
        setSelectedId(rows[0].id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load customers', 'ক্রেতা তালিকা লোড ব্যর্থ হয়েছে'));
    }
  };

  const buildDefaultReminder = (customerName: string, currentDue: string | number) => {
    const shopLabel = store ? trCompact(store.name, store.nameBn, lang) : tr('appName', lang);
    return lang === 'BN'
      ? `আসসালামু আলাইকুম ${customerName}, ${shopLabel}-এ আপনার বর্তমান বাকি ${formatBDT(currentDue)}। অনুগ্রহ করে সুবিধামতো পরিশোধ করবেন। ধন্যবাদ।`
      : `Hello ${customerName}, your current outstanding balance at ${shopLabel} is ${formatBDT(currentDue)}. Please settle at your convenience. Thank you.`;
  };

  const loadKhata = async (id: number) => {
    try {
      const data = await apiFetch(`/api/customers/${id}/khata`);
      setKhata(data);
      setReminderMsg(buildDefaultReminder(data.customer.name, data.customer.currentDue));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load Digital Khata', 'ডিজিটাল খাতা লোড ব্যর্থ হয়েছে'));
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedId) loadKhata(selectedId);
  }, [selectedId, lang]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (typeFilter !== 'ALL' && c.customerType !== typeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q)
      );
    });
  }, [customers, search, typeFilter]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(custForm) });
      toast.success(
        tx(lang, `Customer ${created.customerCode} created with Digital Khata`, `ক্রেতা ${created.customerCode}-এর ডিজিটাল খাতা তৈরি হয়েছে`)
      );
      setShowCreate(false);
      setCustForm({
        name: '',
        phone: '',
        altPhone: '',
        village: '',
        area: '',
        road: '',
        house: '',
        customerType: 'REGULAR',
        creditLimit: '5000',
        openingBalance: '0',
        registrationDate: dhakaTodayISO(),
        notes: '',
      });
      await Promise.all([loadCustomers(), refreshCatalog()]);
      setSelectedId(created.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to create customer', 'ক্রেতা তৈরি ব্যর্থ হয়েছে'));
    }
  };

  const handleLedgerAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await apiFetch(`/api/customers/${selectedId}/adjustments`, {
        method: 'POST',
        body: JSON.stringify(adjForm),
      });
      toast.success(tx(lang, 'Audited balance adjustment posted to Digital Khata', 'খাতায় ব্যালেন্স সমন্বয় সংরক্ষিত হয়েছে'));
      setShowAdj(false);
      setAdjForm({ direction: 'CREDIT', amount: '', reason: '' });
      await Promise.all([loadKhata(selectedId), loadCustomers(), refreshCatalog()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Adjustment failed', 'সমন্বয় ব্যর্থ হয়েছে'));
    }
  };

  const handleGenerateInvite = async () => {
    if (!selectedId) return;
    try {
      await apiFetch(`/api/customers/${selectedId}/invitations`, { method: 'POST' });
      toast.success(tx(lang, 'Fresh 30-day Customer Portal QR & Invitation link generated', 'নতুন ৩০ দিনের পোর্টাল কিউআর ও লিংক তৈরি হয়েছে'));
      loadKhata(selectedId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to generate invite', 'লিংক তৈরি ব্যর্থ হয়েছে'));
    }
  };

  const handleSendReminder = async (channel: 'WHATSAPP' | 'SMS') => {
    if (!selectedId || !reminderMsg.trim()) return;
    try {
      const res = await apiFetch(`/api/customers/${selectedId}/reminders`, {
        method: 'POST',
        body: JSON.stringify({ reminderType, channel, message: reminderMsg }),
      });
      toast.success(tx(lang, `${channel} notification logged`, `${channel} রিমাইন্ডার লগ সংরক্ষিত হয়েছে`));
      if (channel === 'WHATSAPP' && res.whatsappUrl) {
        const a = document.createElement('a');
        a.href = res.whatsappUrl;
        a.target = '_blank';
        a.rel = 'noreferrer';
        a.click();
      }
      loadKhata(selectedId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to send reminder', 'রিমাইন্ডার পাঠানো ব্যর্থ হয়েছে'));
    }
  };

  const handleResolveDispute = async (disputeId: number, status: 'RESOLVED' | 'REJECTED') => {
    const resolutionNote = window.prompt(
      tx(lang, 'Resolution note:', 'সমাধানের নোট:'),
      tx(lang, 'Verified against invoice and resolved', 'রসিদ যাচাই করে সমাধান করা হয়েছে')
    );
    if (resolutionNote === null) return;
    try {
      await apiFetch(`/api/customers/disputes/${disputeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resolutionNote }),
      });
      toast.success(tx(lang, `Dispute marked ${status}`, `অভিযোগ ${formatStatusLabel(status, lang)} হিসেবে চিহ্নিত হয়েছে`));
      if (selectedId) loadKhata(selectedId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to update dispute', 'আপডেট ব্যর্থ হয়েছে'));
    }
  };

  const portalInviteUrl = khata?.latestInvitation
    ? `${window.location.origin}/portal?invite=${khata.latestInvitation.token}`
    : `${window.location.origin}/portal`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('customers', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Customer Profiles · Digital Khata Ledger · Analytics · Self-Service Portal QR & OTP',
              'ক্রেতার প্রোফাইল · ডিজিটাল খাতা · বিশ্লেষণ · ক্রেতা পোর্টাল কিউআর ও ওটিপি'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          {trCompact('Add Customer Profile', 'নতুন ক্রেতা যোগ', lang)}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Customer Directory List */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[760px]">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tx(lang, 'Search name, phone, CUST ID...', 'নাম, মোবাইল বা আইডি খুঁজুন...')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div className="flex items-center gap-1">
              {(
                [
                  ['ALL', tx(lang, 'All', 'সব')],
                  ['REGULAR', formatStatusLabel('REGULAR', lang)],
                  ['VIP', formatStatusLabel('VIP', lang)],
                  ['WHOLESALE', formatStatusLabel('WHOLESALE', lang)],
                  ['OCCASIONAL', formatStatusLabel('OCCASIONAL', lang)],
                ] as const
              ).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`flex-1 rounded-md py-1 text-[11px] font-semibold transition cursor-pointer ${
                    typeFilter === t
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((c) => {
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full p-3.5 text-left transition cursor-pointer ${
                    active
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-500">
                        <span className="font-mono">{c.customerCode}</span> · {c.phone} ·{' '}
                        {formatStatusLabel(c.customerType, lang)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={`font-mono text-sm font-bold ${
                          Number(c.currentDue) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-700'
                        }`}
                      >
                        {formatBDT(c.currentDue)}
                      </div>
                      <div className="text-[10px] text-slate-400">{tx(lang, 'Due', 'বাকি')}</div>
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                {tx(lang, 'No customers match this filter.', 'এই ফিল্টারে কোনো ক্রেতা পাওয়া যায়নি।')}
              </div>
            )}
          </div>
        </div>

        {/* Right Digital Khata Workspace */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {khata ? (
            <div className="flex flex-col">
              {/* Customer Header Summary */}
              <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        {khata.customer.customerCode}
                      </span>
                      <span>·</span>
                      <span>{formatStatusLabel(khata.customer.customerType, lang)}</span>
                      <span>·</span>
                      <span>
                        {tx(lang, 'Registered', 'নিবন্ধিত')} {formatDateDDMMYYYY(khata.customer.registrationDate)}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{khata.customer.name}</h2>
                    <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      <span className="font-mono">{khata.customer.phone}</span>
                      {khata.customer.altPhone ? ` / ${khata.customer.altPhone}` : ''}
                      {[khata.customer.house, khata.customer.road, khata.customer.area, khata.customer.village]
                        .filter(Boolean)
                        .join(', ') && (
                        <>
                          {' · '}
                          {[khata.customer.house, khata.customer.road, khata.customer.area, khata.customer.village]
                            .filter(Boolean)
                            .join(', ')}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {staff?.role !== 'CASHIER' && (
                      <button
                        type="button"
                        onClick={() => setShowAdj(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Scale className="h-3.5 w-3.5" />
                        {tx(lang, 'Adjust Balance', 'ব্যালেন্স সমন্বয়')}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      {tx(lang, 'Print Khata', 'খাতা প্রিন্ট')}
                    </button>
                  </div>
                </div>

                {/* Quick Financial Strip */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                    <div className="text-[11px] text-slate-500">{tx(lang, 'Current Outstanding', 'বর্তমান বাকি')}</div>
                    <div className="mt-0.5 font-mono text-base font-bold text-red-600 dark:text-red-400">
                      {formatBDT(khata.customer.currentDue)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                    <div className="text-[11px] text-slate-500">{tx(lang, 'Lifetime Purchases', 'মোট ক্রয়')}</div>
                    <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                      {formatBDT(khata.analytics.lifetimePurchaseValue)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                    <div className="text-[11px] text-slate-500">{tx(lang, 'Total Paid', 'মোট পরিশোধ')}</div>
                    <div className="mt-0.5 font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                      {formatBDT(khata.customer.totalPaid)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                    <div className="text-[11px] text-slate-500">
                      {tx(
                        lang,
                        `Credit Limit (${khata.analytics.creditLimitUtilizationPct}% used)`,
                        `ক্রেডিট লিমিট (${khata.analytics.creditLimitUtilizationPct}% ব্যবহৃত)`
                      )}
                    </div>
                    <div className="mt-0.5 font-mono text-base font-bold text-slate-900 dark:text-white">
                      {formatBDT(khata.customer.creditLimit)}
                    </div>
                  </div>
                </div>

                {/* Inner Tabs */}
                <div className="mt-4 flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit dark:bg-slate-950">
                  {(
                    [
                      ['ledger', tx(lang, 'Digital Khata Ledger', 'ডিজিটাল খাতা'), BookOpen],
                      [
                        'invoices',
                        tx(lang, `Invoices & Receipts (${khata.sales.length})`, `রসিদ ও বিল (${khata.sales.length})`),
                        Printer,
                      ],
                      ['analytics', tx(lang, 'Customer Analytics', 'ক্রেতা বিশ্লেষণ'), BarChart3],
                      ['portal', tx(lang, 'Portal QR, OTP & Reminders', 'পোর্টাল কিউআর ও রিমাইন্ডার'), QrCode],
                    ] as const
                  ).map(([k, label, Icon]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKhataTab(k)}
                      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        khataTab === k
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-5">
                {khataTab === 'ledger' && (
                  <div className="printable-area overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                        <tr>
                          <th className="py-2 pr-3 font-semibold">{tx(lang, 'Date & Time', 'তারিখ ও সময়')}</th>
                          <th className="py-2 pr-3 font-semibold">{tx(lang, 'Ref / Type', 'রসিদ / ধরন')}</th>
                          <th className="py-2 pr-3 font-semibold">{tx(lang, 'Products / Details', 'পণ্য ও বিবরণ')}</th>
                          <th className="py-2 pr-3 text-right font-semibold">{tx(lang, 'Debit (+)', 'বাকি (+)')}</th>
                          <th className="py-2 pr-3 text-right font-semibold">{tx(lang, 'Credit (-)', 'জমা (-)')}</th>
                          <th className="py-2 text-right font-semibold">{tx(lang, 'Running Balance', 'চলমান জের')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {khata.ledger.map((row: any) => (
                          <tr key={row.id}>
                            <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {formatDateTimeDhaka(row.createdAt)}
                            </td>
                            <td className="py-2.5 pr-3 whitespace-nowrap">
                              <div className="font-mono font-semibold text-slate-900 dark:text-white">
                                {row.invoiceNumber || '—'}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {formatStatusLabel(row.transactionType, lang)}
                                {row.paymentMethod ? ` · ${formatMethodLabel(row.paymentMethod, lang)}` : ''}
                              </div>
                            </td>
                            <td className="py-2.5 pr-3 max-w-xs">
                              <div className="text-slate-700 dark:text-slate-300">{row.description}</div>
                              {row.productSummary && (
                                <div className="mt-0.5 text-[11px] text-slate-500">{row.productSummary}</div>
                              )}
                              {row.expectedPaymentDate && (
                                <div className="mt-0.5 text-[11px] font-medium text-amber-700">
                                  {tx(lang, 'Expected Pay:', 'সম্ভাব্য পরিশোধ:')} {formatDateDDMMYYYY(row.expectedPaymentDate)}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 pr-3 text-right font-mono text-red-600">
                              {Number(row.debitAmount) > 0 ? formatBDT(row.debitAmount) : '—'}
                            </td>
                            <td className="py-2.5 pr-3 text-right font-mono text-emerald-700">
                              {Number(row.creditAmount) > 0 ? formatBDT(row.creditAmount) : '—'}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatBDT(row.runningBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {khataTab === 'invoices' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {tx(lang, 'Purchase Invoices', 'ক্রয় রসিদসমূহ')}
                    </h3>
                    <div className="space-y-2.5">
                      {khata.sales.map((s: any) => (
                        <div
                          key={s.id}
                          className="rounded-lg border border-slate-200 p-3.5 text-xs dark:border-slate-800 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {s.invoiceNumber}
                              </span>{' '}
                              · {formatDateDDMMYYYY(s.saleDate)} ·{' '}
                              <span
                                className={`font-semibold ${
                                  s.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-red-600'
                                }`}
                              >
                                {formatStatusLabel(s.paymentStatus, lang)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span>
                                {tx(lang, 'Total:', 'মোট:')} {formatBDT(s.totalAmount)}
                              </span>
                              <span className="text-red-600">
                                {tx(lang, 'Due:', 'বাকি:')} {formatBDT(s.dueAmount)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setReceipt({
                                    type: 'SALE',
                                    invoiceNumber: s.invoiceNumber,
                                    saleDate: s.saleDate,
                                    customerName: khata.customer.name,
                                    customerPhone: khata.customer.phone,
                                    expectedPaymentDate: s.expectedPaymentDate,
                                    items: s.items,
                                    subtotal: s.subtotal,
                                    discount: Number(s.itemDiscountTotal) + Number(s.billDiscount),
                                    totalAmount: s.totalAmount,
                                    paidAmount: s.paidAmount,
                                    dueAmount: s.dueAmount,
                                    payments: [],
                                  })
                                }
                                className="text-emerald-600 hover:underline font-sans font-semibold cursor-pointer"
                              >
                                {tr('print', lang)}
                              </button>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {(s.items || [])
                              .map(
                                (i: any) =>
                                  `${i.productName} (${formatQty(i.enteredQty)} ${formatUnitLabel(
                                    i.unitName,
                                    lang
                                  )} × ${formatBDT(i.unitSellingPrice)})`
                              )
                              .join(' · ')}
                          </div>
                        </div>
                      ))}
                      {khata.sales.length === 0 && (
                        <p className="text-xs text-slate-500">{tx(lang, 'No invoices yet.', 'এখনো কোনো রসিদ নেই।')}</p>
                      )}
                    </div>

                    <h3 className="pt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      {tx(lang, 'Due Payment Receipts', 'বাকি পরিশোধের রসিদ')}
                    </h3>
                    <div className="space-y-2">
                      {khata.payments.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800"
                        >
                          <div>
                            <div className="font-mono font-bold text-slate-900 dark:text-white">
                              {p.receiptNumber} · {formatDateDDMMYYYY(p.paymentDate)} ·{' '}
                              {formatMethodLabel(p.paymentMethod, lang)}
                            </div>
                            {p.allocations?.length > 0 && (
                              <div className="text-[11px] text-slate-500">
                                {tx(lang, 'Allocated:', 'সমন্বিত বিল:')}{' '}
                                {p.allocations
                                  .map((a: any) => `${a.invoiceNumber} (${formatBDT(a.allocatedAmount)})`)
                                  .join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-emerald-700">{formatBDT(p.amount)}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setReceipt({
                                  type: 'PAYMENT',
                                  receiptNumber: p.receiptNumber,
                                  paymentDate: p.paymentDate,
                                  customerName: khata.customer.name,
                                  customerCode: khata.customer.customerCode,
                                  customerPhone: khata.customer.phone,
                                  amount: p.amount,
                                  paymentMethod: p.paymentMethod,
                                  remainingDue: khata.customer.currentDue,
                                  remarks: p.remarks,
                                  allocations: p.allocations,
                                })
                              }
                              className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                            >
                              {tx(lang, 'Receipt', 'রসিদ')}
                            </button>
                          </div>
                        </div>
                      ))}
                      {khata.payments.length === 0 && (
                        <p className="text-xs text-slate-500">
                          {tx(lang, 'No due payments yet.', 'এখনো কোনো বাকি পরিশোধ রেকর্ড হয়নি।')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {khataTab === 'analytics' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[
                        [tx(lang, 'Lifetime Value', 'সর্বমোট ক্রয়মূল্য'), formatBDT(khata.analytics.lifetimePurchaseValue)],
                        [tx(lang, 'Total Paid', 'মোট পরিশোধ'), formatBDT(khata.analytics.totalPaid)],
                        [tx(lang, 'Current Outstanding', 'বর্তমান বাকি'), formatBDT(khata.analytics.currentOutstanding)],
                        [
                          tx(lang, 'Purchase Frequency', 'ক্রয়ের সংখ্যা'),
                          tx(lang, `${khata.analytics.purchaseFrequency} orders`, `${khata.analytics.purchaseFrequency} বার`),
                        ],
                        [tx(lang, 'Avg Purchase Value', 'গড় ক্রয়মূল্য'), formatBDT(khata.analytics.averagePurchaseValue)],
                        [tx(lang, 'Last Purchase Date', 'শেষ ক্রয়ের তারিখ'), formatDateDDMMYYYY(khata.analytics.lastPurchaseDate)],
                        [
                          tx(lang, 'Avg Payment Delay', 'গড় বিলম্ব'),
                          tx(lang, `${khata.analytics.averagePaymentDelayDays} days`, `${khata.analytics.averagePaymentDelayDays} দিন`),
                        ],
                        [tx(lang, 'Credit Utilization', 'লিমিট ব্যবহার'), `${khata.analytics.creditLimitUtilizationPct}%`],
                      ].map(([label, val]) => (
                        <div key={label} className="rounded-lg border border-slate-200 p-3.5 dark:border-slate-800">
                          <div className="text-[11px] text-slate-500">{label}</div>
                          <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white">{val}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{tx(lang, 'Credit Limit Utilization', 'ক্রেডিট লিমিট ব্যবহারের হার')}</span>
                        <span className="font-mono">
                          {formatBDT(khata.customer.currentDue)} / {formatBDT(khata.customer.creditLimit)} (
                          {khata.analytics.creditLimitUtilizationPct}%)
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full transition-all ${
                            khata.analytics.creditLimitUtilizationPct >= 90
                              ? 'bg-red-600'
                              : khata.analytics.creditLimitUtilizationPct >= 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, khata.analytics.creditLimitUtilizationPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {khataTab === 'portal' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold">
                            {tx(lang, 'Customer Self-Service Portal QR', 'ক্রেতা সেলফ-সার্ভিস পোর্টাল কিউআর')}
                          </h3>
                          <button
                            type="button"
                            onClick={handleGenerateInvite}
                            className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                          >
                            {tx(lang, 'Generate Fresh Link', 'নতুন লিংক তৈরি')}
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shrink-0">
                            <QRCodeSVG value={portalInviteUrl} size={112} />
                          </div>
                          <div className="min-w-0 space-y-2 text-xs">
                            <p className="text-slate-600 dark:text-slate-400">
                              {tx(
                                lang,
                                'Customer scans this QR or opens the link to view ONLY their own Digital Khata, invoices & PDF statements via Mobile OTP.',
                                'ক্রেতা এই কিউআর স্ক্যান করে বা লিংকে গিয়ে মোবাইল ওটিপি দিয়ে শুধু নিজের ডিজিটাল খাতা, বিল ও স্টেটমেন্ট দেখতে পারবেন।'
                              )}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(portalInviteUrl);
                                  toast.success(tx(lang, 'Portal invitation link copied', 'পোর্টাল লিংক কপি হয়েছে'));
                                }}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 cursor-pointer"
                              >
                                <Copy className="h-3 w-3" /> {tx(lang, 'Copy Link', 'লিংক কপি')}
                              </button>
                              <a
                                href={portalInviteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                {tx(lang, 'Open Portal', 'পোর্টাল খুলুন')}
                              </a>
                            </div>
                          </div>
                        </div>

                        {khata.activeOtp && (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs dark:border-emerald-800 dark:bg-emerald-950/40">
                            <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                              {tx(lang, 'Active Customer Login OTP (Relay to Customer):', 'সক্রিয় ক্রেতা লগইন ওটিপি (ক্রেতাকে দিন):')}
                            </div>
                            <div className="mt-1 font-mono text-lg font-bold tracking-widest text-emerald-700 dark:text-emerald-200">
                              {khata.activeOtp.code}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                        <h3 className="text-sm font-bold">
                          {tx(lang, 'Send SMS / WhatsApp Reminder', 'এসএমএস / হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান')}
                        </h3>
                        <select
                          value={reminderType}
                          onChange={(e) => setReminderType(e.target.value as any)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                        >
                          <option value="DUE_REMINDER">{tx(lang, 'Due Reminder', 'বাকি পরিশোধের রিমাইন্ডার')}</option>
                          <option value="OVERDUE_REMINDER">{tx(lang, 'Overdue Reminder', 'মেয়াদোত্তীর্ণ বাকি রিমাইন্ডার')}</option>
                          <option value="PAYMENT_CONFIRMATION">{tx(lang, 'Payment Confirmation', 'পেমেন্ট নিশ্চিতকরণ')}</option>
                          <option value="MONTHLY_STATEMENT">{tx(lang, 'Monthly Account Statement', 'মাসিক হিসাব বিবরণী')}</option>
                        </select>
                        <textarea
                          rows={3}
                          value={reminderMsg}
                          onChange={(e) => setReminderMsg(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendReminder('WHATSAPP')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" /> {tx(lang, 'WhatsApp', 'হোয়াটসঅ্যাপ')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReminder('SMS')}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" /> {tx(lang, 'SMS Gateway', 'এসএমএস গেটওয়ে')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {khata.disputes?.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {tx(lang, 'Customer Portal Disputes / Inquiries', 'ক্রেতা পোর্টালের অভিযোগ ও জিজ্ঞাসা')}
                        </h3>
                        {khata.disputes.map((d: any) => (
                          <div
                            key={d.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-800"
                          >
                            <div className="flex items-start gap-2">
                              {d.status === 'OPEN' ? (
                                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="font-medium text-slate-900 dark:text-white">{d.reason}</div>
                                <div className="text-[11px] text-slate-500">
                                  {formatStatusLabel(d.status, lang)} · {formatDateTimeDhaka(d.createdAt)}
                                  {d.resolutionNote ? ` · ${d.resolutionNote}` : ''}
                                </div>
                              </div>
                            </div>
                            {d.status === 'OPEN' && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResolveDispute(d.id, 'RESOLVED')}
                                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
                                >
                                  {tx(lang, 'Resolve', 'সমাধান')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolveDispute(d.id, 'REJECTED')}
                                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium cursor-pointer"
                                >
                                  {tx(lang, 'Reject', 'প্রত্যাখ্যান')}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-sm text-slate-500">
              {tx(lang, 'Select a customer from the left directory to view their Digital Khata.', 'ডিজিটাল খাতা দেখতে বাম তালিকা থেকে একজন ক্রেতা নির্বাচন করুন।')}
            </div>
          )}
        </div>
      </div>

      {/* Create Full Customer Profile Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateCustomer}
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">
                {tx(lang, 'New Customer Profile & Digital Khata', 'নতুন ক্রেতার প্রোফাইল ও ডিজিটাল খাতা')}
              </h3>
              <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Full Name *', 'পূর্ণ নাম *')}</label>
                <input
                  required
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Customer Type', 'ক্রেতার ধরন')}</label>
                <select
                  value={custForm.customerType}
                  onChange={(e) => setCustForm({ ...custForm, customerType: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="REGULAR">{formatStatusLabel('REGULAR', lang)}</option>
                  <option value="VIP">{formatStatusLabel('VIP', lang)}</option>
                  <option value="WHOLESALE">{formatStatusLabel('WHOLESALE', lang)}</option>
                  <option value="OCCASIONAL">{formatStatusLabel('OCCASIONAL', lang)}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Mobile Number *', 'মোবাইল নম্বর *')}</label>
                <input
                  required
                  placeholder="017XXXXXXXX"
                  value={custForm.phone}
                  onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Alternative Phone', 'বিকল্প মোবাইল')}</label>
                <input
                  value={custForm.altPhone}
                  onChange={(e) => setCustForm({ ...custForm, altPhone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <input
                placeholder={tx(lang, 'Village / Ward', 'গ্রাম / ওয়ার্ড')}
                value={custForm.village}
                onChange={(e) => setCustForm({ ...custForm, village: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              />
              <input
                placeholder={tx(lang, 'Area / Bazar', 'এলাকা / বাজার')}
                value={custForm.area}
                onChange={(e) => setCustForm({ ...custForm, area: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              />
              <input
                placeholder={tx(lang, 'Road', 'রোড / রাস্তা')}
                value={custForm.road}
                onChange={(e) => setCustForm({ ...custForm, road: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              />
              <input
                placeholder={tx(lang, 'House / Shop No', 'বাড়ি / দোকান নম্বর')}
                value={custForm.house}
                onChange={(e) => setCustForm({ ...custForm, house: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              />
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Credit Limit (৳)', 'ক্রেডিট লিমিট (৳)')}</label>
                <input
                  type="number"
                  value={custForm.creditLimit}
                  onChange={(e) => setCustForm({ ...custForm, creditLimit: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">
                  {tx(lang, 'Opening Balance / Previous Due (৳)', 'পূর্বের বাকি (৳)')}
                </label>
                <input
                  type="number"
                  value={custForm.openingBalance}
                  onChange={(e) => setCustForm({ ...custForm, openingBalance: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Registration Date', 'নিবন্ধন তারিখ')}</label>
                <input
                  type="date"
                  value={custForm.registrationDate}
                  onChange={(e) => setCustForm({ ...custForm, registrationDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Notes', 'মন্তব্য')}</label>
                <input
                  value={custForm.notes}
                  onChange={(e) => setCustForm({ ...custForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-xs">
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white">
                {tx(lang, 'Create Digital Khata', 'ডিজিটাল খাতা তৈরি করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audited Balance Adjustment Modal */}
      {showAdj && khata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleLedgerAdjustment}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <h3 className="text-base font-bold">
              {tx(lang, 'Audited Khata Adjustment:', 'খাতা ব্যালেন্স সমন্বয়:')} {khata.customer.name}
            </h3>
            <p className="text-xs text-slate-500">
              {tx(
                lang,
                'Historical ledger entries are never silently deleted. Adjustments append an immutable audit record.',
                'পুরোনো হিসাব কখনো মুছে ফেলা হয় না। যেকোনো সংশোধন নতুন অডিট এন্ট্রি হিসেবে যুক্ত হয়।'
              )}
            </p>
            <select
              value={adjForm.direction}
              onChange={(e) => setAdjForm({ ...adjForm, direction: e.target.value as 'DEBIT' | 'CREDIT' })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="CREDIT">{tx(lang, 'Credit (- Reduce Customer Due)', 'জমা (- ক্রেতার বাকি কমান)')}</option>
              <option value="DEBIT">{tx(lang, 'Debit (+ Increase Customer Due)', 'বাকি (+ ক্রেতার বাকি বাড়ান)')}</option>
            </select>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder={tx(lang, 'Amount (৳)', 'পরিমাণ (৳)')}
              value={adjForm.amount}
              onChange={(e) => setAdjForm({ ...adjForm, amount: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              required
              placeholder={tx(lang, 'Mandatory Audit Reason *', 'সমন্বয়ের কারণ (আবশ্যক) *')}
              value={adjForm.reason}
              onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdj(false)} className="rounded-lg border px-4 py-2 text-xs">
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                {tx(lang, 'Post Audited Adjustment', 'সমন্বয় সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {receipt && <ReceiptModal receipt={receipt} store={store} settings={settings} onClose={() => setReceipt(null)} />}
    </div>
  );
};
