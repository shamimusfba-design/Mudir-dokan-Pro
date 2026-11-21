import React, { useEffect, useState } from 'react';
import { Printer, LogOut, ShieldCheck, FileText, Receipt, AlertCircle, Store } from 'lucide-react';
import { toast } from 'sonner';
import { portalFetch } from '../lib/api';
import { formatBDT, formatDateDDMMYYYY, formatDateTimeDhaka, formatQty } from '../lib/decimal';
import {
  getSavedLang,
  saveLang,
  tx,
  trCompact,
  formatMethodLabel,
  formatStatusLabel,
  formatUnitLabel,
  type LanguageMode,
} from '../lib/i18n';

const PORTAL_TOKEN_KEY = 'mudirdokan_portal_session';

export const CustomerPortalPage: React.FC = () => {
  const [lang, setLangState] = useState<LanguageMode>(() => getSavedLang());
  const setLang = (mode: LanguageMode) => {
    setLangState(mode);
    saveLang(mode);
  };

  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(PORTAL_TOKEN_KEY));
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [inviteToken, setInviteToken] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const [account, setAccount] = useState<any>(null);
  const [tab, setTab] = useState<'statement' | 'purchases' | 'payments' | 'dispute'>('statement');
  const [disputeReason, setDisputeReason] = useState('');
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inv = params.get('invite');
    if (inv) {
      setInviteToken(inv);
      portalFetch(`/api/portal/invite/${encodeURIComponent(inv)}`, null)
        .then((info) => {
          setInviteInfo(info);
          setPhone(info.phone || '');
        })
        .catch(() => {
          toast.error(tx(lang, 'Invitation link expired or invalid', 'আমন্ত্রণ লিংকটির মেয়াদ শেষ বা সঠিক নয়'));
        });
    }
  }, []);

  const loadAccount = async (sessionTok: string) => {
    setLoading(true);
    try {
      const data = await portalFetch('/api/portal/me', sessionTok);
      setAccount(data);
    } catch (err) {
      sessionStorage.removeItem(PORTAL_TOKEN_KEY);
      setToken(null);
      toast.error(err instanceof Error ? err.message : tx(lang, 'Session expired, please log in again', 'সেশন শেষ হয়েছে, অনুগ্রহ করে পুনরায় লগইন করুন'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAccount(token);
    }
  }, [token]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await portalFetch('/api/portal/auth/request-otp', null, {
        method: 'POST',
        body: JSON.stringify({ phone, inviteToken: inviteToken || undefined }),
      });
      setOtpSent(true);
      toast.success(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Could not send OTP', 'ওটিপি পাঠানো যায়নি'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await portalFetch<{ token: string }>('/api/portal/auth/verify-otp', null, {
        method: 'POST',
        body: JSON.stringify({ phone, otp, inviteToken: inviteToken || undefined }),
      });
      sessionStorage.setItem(PORTAL_TOKEN_KEY, res.token);
      setToken(res.token);
      toast.success(tx(lang, 'Welcome to your Digital Khata', 'আপনার ডিজিটাল খাতায় স্বাগতম'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Invalid OTP', 'সঠিক ওটিপি নয়'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !disputeReason.trim()) return;
    try {
      await portalFetch('/api/portal/disputes', token, {
        method: 'POST',
        body: JSON.stringify({ reason: disputeReason }),
      });
      toast.success(tx(lang, 'Your inquiry has been sent to the shopkeeper', 'আপনার বার্তাটি দোকানদারের কাছে পাঠানো হয়েছে'));
      setDisputeReason('');
      loadAccount(token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to submit inquiry', 'বার্তা পাঠানো ব্যর্থ হয়েছে'));
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(PORTAL_TOKEN_KEY);
    setToken(null);
    setAccount(null);
    setOtpSent(false);
    setOtp('');
  };

  const langToggle = (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800 shrink-0">
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
          className={`rounded-md px-2 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
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

  // Unauthenticated Mobile OTP Login Screen
  if (!token || !account) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 flex flex-col items-center justify-center dark:bg-slate-950">
        <div className="mb-4 flex w-full max-w-md justify-end">{langToggle}</div>
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="text-center space-y-1.5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Store className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {inviteInfo
                ? trCompact(inviteInfo.storeName, inviteInfo.storeNameBn, lang)
                : tx(lang, 'MudirDokan Pro', 'মুদির দোকান প্রো')}
            </h1>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              {tx(lang, 'Customer Digital Khata Portal', 'ক্রেতা ডিজিটাল খাতা পোর্টাল')}
            </p>
            {inviteInfo && (
              <p className="text-xs text-slate-500">
                {tx(lang, 'Welcome,', 'স্বাগতম,')} <strong>{inviteInfo.customerName}</strong> ({inviteInfo.customerCode})
              </p>
            )}
          </div>

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tx(lang, 'Registered Mobile Number', 'নিবন্ধিত মোবাইল নম্বর')}
                </label>
                <input
                  required
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-base dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? tx(lang, 'Sending OTP...', 'ওটিপি পাঠানো হচ্ছে...')
                  : tx(lang, 'Request 6-Digit Login OTP', '৬ ডিজিটের লগইন ওটিপি পাঠান')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tx(lang, 'Enter 6-Digit OTP for', '৬ ডিজিটের ওটিপি দিন —')} <span className="font-mono">{phone}</span>
                </label>
                <input
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? tx(lang, 'Verifying...', 'যাচাই করা হচ্ছে...')
                  : tx(lang, 'Verify & Open My Digital Khata', 'যাচাই করে আমার খাতা খুলুন')}
              </button>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs font-medium text-slate-500 hover:underline cursor-pointer"
              >
                {tx(lang, 'Change mobile number or resend OTP', 'মোবাইল নম্বর পরিবর্তন বা পুনরায় ওটিপি পাঠান')}
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[11px] text-slate-500 dark:border-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {tx(
                lang,
                'Private account view · Only your own purchases and payments',
                'ব্যক্তিগত হিসাব · শুধুমাত্র আপনার নিজের ক্রয় ও পরিশোধের তথ্য'
              )}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const { store, customer, ledger, purchases, payments, disputes } = account;
  const displayStoreName = trCompact(store?.name || 'MudirDokan Pro', store?.nameBn, lang);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950">
      {/* Top Customer Portal Header */}
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{displayStoreName}</div>
            <div className="truncate text-[11px] text-slate-500">
              {customer.name} · <span className="font-mono">{customer.customerCode}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {langToggle}
            <button
              type="button"
              onClick={() => {
                setSelectedPrintInvoice(null);
                setTimeout(() => window.print(), 60);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tx(lang, 'PDF Statement', 'পিডিএফ বিবরণী')}</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
              title={tx(lang, 'Log out', 'লগ আউট')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-5 space-y-5">
        {/* Account Balance Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-500">{tx(lang, 'Current Outstanding Balance', 'বর্তমান বাকি')}</div>
              <div className="mt-1 font-mono text-3xl font-bold text-red-600 dark:text-red-400">
                {formatBDT(customer.currentDue)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div className="font-mono">{customer.phone}</div>
              <div>
                {formatStatusLabel(customer.customerType, lang)} {tx(lang, 'Member', 'সদস্য')}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div>
              <div className="text-slate-500">{tx(lang, 'Total Purchases', 'মোট ক্রয়')}</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">
                {formatBDT(customer.totalPurchases)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">{tx(lang, 'Total Paid', 'মোট পরিশোধ')}</div>
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatBDT(customer.totalPaid)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">{tx(lang, 'Credit Limit', 'ক্রেডিট লিমিট')}</div>
              <div className="font-mono font-bold text-slate-900 dark:text-white">{formatBDT(customer.creditLimit)}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="no-print grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              ['statement', tx(lang, 'Khata', 'খাতা'), FileText],
              ['purchases', tx(lang, 'Purchases', 'ক্রয়'), Receipt],
              ['payments', tx(lang, 'Payments', 'পরিশোধ'), ShieldCheck],
              ['dispute', tx(lang, 'Support', 'সহায়তা'), AlertCircle],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition cursor-pointer ${
                tab === k ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Full Account Statement */}
        {tab === 'statement' && (
          <div className="printable-area rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {displayStoreName} — {tx(lang, 'Account Statement', 'হিসাব বিবরণী')}
              </div>
              <div className="text-xs text-slate-500">
                {customer.name} ({customer.customerCode}) · {customer.phone} · {tx(lang, 'Outstanding:', 'বাকি:')}{' '}
                <strong className="font-mono">{formatBDT(customer.currentDue)}</strong>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="py-2 pr-2">{tx(lang, 'Date', 'তারিখ')}</th>
                    <th className="py-2 pr-2">{tx(lang, 'Details', 'বিবরণ')}</th>
                    <th className="py-2 pr-2 text-right">{tx(lang, 'Debit', 'বাকি')}</th>
                    <th className="py-2 pr-2 text-right">{tx(lang, 'Credit', 'জমা')}</th>
                    <th className="py-2 text-right">{tx(lang, 'Balance', 'জের')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledger.map((row: any) => (
                    <tr key={row.id}>
                      <td className="py-2.5 pr-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {formatDateDDMMYYYY(row.entryDate)}
                      </td>
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {row.invoiceNumber || formatStatusLabel(row.transactionType, lang)}
                        </div>
                        <div className="text-[11px] text-slate-500">{row.productSummary || row.description}</div>
                        {row.expectedPaymentDate && (
                          <div className="text-[10px] text-amber-700">
                            {tx(lang, 'Expected Pay:', 'সম্ভাব্য পরিশোধ:')} {formatDateDDMMYYYY(row.expectedPaymentDate)}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-right font-mono text-red-600">
                        {Number(row.debitAmount) > 0 ? formatBDT(row.debitAmount) : '—'}
                      </td>
                      <td className="py-2.5 pr-2 text-right font-mono text-emerald-700">
                        {Number(row.creditAmount) > 0 ? formatBDT(row.creditAmount) : '—'}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold">{formatBDT(row.runningBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Purchase History */}
        {tab === 'purchases' && (
          <div className="space-y-3">
            {purchases.map((inv: any) => (
              <div
                key={inv.id}
                className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2.5 ${
                  selectedPrintInvoice === inv.id ? 'printable-area' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</div>
                    <div className="text-[11px] text-slate-500">
                      {formatDateDDMMYYYY(inv.saleDate)} · {formatStatusLabel(inv.paymentStatus, lang)}
                      {inv.expectedPaymentDate
                        ? ` · ${tx(lang, 'Due by', 'পরিশোধের তারিখ')} ${formatDateDDMMYYYY(inv.expectedPaymentDate)}`
                        : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPrintInvoice(inv.id);
                      setTimeout(() => window.print(), 60);
                    }}
                    className="no-print inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-slate-700 cursor-pointer"
                  >
                    <Printer className="h-3 w-3" /> {tx(lang, 'Invoice', 'রসিদ')}
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 text-xs dark:divide-slate-800 dark:border-slate-800">
                  {(inv.items || []).map((item: any) => (
                    <div key={item.id} className="flex justify-between py-1">
                      <span>
                        {item.productName} <span className="text-slate-500">({item.variant})</span> ×{' '}
                        <span className="font-mono">
                          {formatQty(item.enteredQty)} {formatUnitLabel(item.unitName, lang)}
                        </span>
                      </span>
                      <span className="font-mono font-semibold">{formatBDT(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-2 text-xs font-mono dark:border-slate-800">
                  <span>
                    {tx(lang, 'Total:', 'মোট:')} {formatBDT(inv.totalAmount)}
                  </span>
                  <span className="text-emerald-700">
                    {tx(lang, 'Paid:', 'পরিশোধ:')} {formatBDT(inv.paidAmount)}
                  </span>
                  <span className="font-bold text-red-600">
                    {tx(lang, 'Due:', 'বাকি:')} {formatBDT(inv.dueAmount)}
                  </span>
                </div>
              </div>
            ))}
            {purchases.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                {tx(lang, 'No purchase invoices yet.', 'এখনো কোনো ক্রয় রসিদ নেই।')}
              </div>
            )}
          </div>
        )}

        {/* Payment Receipts */}
        {tab === 'payments' && (
          <div className="space-y-3">
            {payments.map((p: any) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">{p.receiptNumber}</div>
                    <div className="text-[11px] text-slate-500">
                      {formatDateDDMMYYYY(p.paymentDate)} · {formatMethodLabel(p.paymentMethod, lang)}
                    </div>
                  </div>
                  <div className="font-mono text-base font-bold text-emerald-700">{formatBDT(p.amount)}</div>
                </div>
                {p.allocations?.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    {tx(lang, 'Applied to:', 'সমন্বয়কৃত বিল:')}{' '}
                    {p.allocations.map((a: any) => `${a.invoiceNumber} (${formatBDT(a.allocatedAmount)})`).join(', ')}
                  </div>
                )}
              </div>
            ))}
            {payments.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                {tx(lang, 'No payment receipts recorded yet.', 'এখনো কোনো পেমেন্ট রসিদ নেই।')}
              </div>
            )}
          </div>
        )}

        {/* Dispute / Inquiry Form */}
        {tab === 'dispute' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold">
              {tx(lang, 'Report a Balance Question or Discrepancy', 'হিসাব সংক্রান্ত কোনো প্রশ্ন বা অসঙ্গতি জানান')}
            </h2>
            <form onSubmit={handleSubmitDispute} className="space-y-3">
              <textarea
                required
                rows={3}
                placeholder={tx(
                  lang,
                  'Describe any invoice or payment question for the shopkeeper...',
                  'কোনো রসিদ বা পেমেন্ট নিয়ে প্রশ্ন থাকলে এখানে লিখুন...'
                )}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                {tx(lang, 'Submit Inquiry to Shopkeeper', 'দোকানদারের কাছে বার্তা পাঠান')}
              </button>
            </form>
            {disputes?.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {disputes.map((d: any) => (
                  <div key={d.id} className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">
                    <div className="font-medium">{d.reason}</div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {tx(lang, 'Status:', 'অবস্থা:')} <strong>{formatStatusLabel(d.status, lang)}</strong> ·{' '}
                      {formatDateTimeDhaka(d.createdAt)}
                      {d.resolutionNote ? ` · ${tx(lang, 'Shop Note:', 'দোকানের উত্তর:')} ${d.resolutionNote}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
