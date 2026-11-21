import React, { useEffect, useState } from 'react';
import { Plus, Wallet, BookOpen, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateDDMMYYYY, dhakaTodayISO } from '../lib/decimal';
import { tr, tx, formatMethodLabel, formatStatusLabel } from '../lib/i18n';

export const SuppliersPage: React.FC<{ mode: 'directory' | 'due' }> = ({ mode }) => {
  const { lang } = useApp();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<any>(null);
  const [ledgerData, setLedgerData] = useState<any>(null);

  const [form, setForm] = useState({ name: '', company: '', phone: '', address: '', openingBalance: '0', notes: '' });
  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'CASH' as 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK',
    paymentDate: dhakaTodayISO(),
    remarks: '',
  });

  const loadSuppliers = async () => {
    try {
      const rows = await apiFetch('/api/purchases/suppliers');
      setSuppliers(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load suppliers', 'সরবরাহকারী তালিকা লোড ব্যর্থ হয়েছে'));
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openLedger = async (id: number) => {
    try {
      const data = await apiFetch(`/api/purchases/suppliers/${id}/ledger`);
      setLedgerData(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load supplier ledger', 'সরবরাহকারীর লেজার লোড ব্যর্থ হয়েছে'));
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/purchases/suppliers', { method: 'POST', body: JSON.stringify(form) });
      toast.success(tx(lang, 'Supplier created', 'সরবরাহকারী যোগ হয়েছে'));
      setShowAdd(false);
      setForm({ name: '', company: '', phone: '', address: '', openingBalance: '0', notes: '' });
      loadSuppliers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to create supplier', 'সরবরাহকারী তৈরি ব্যর্থ হয়েছে'));
    }
  };

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier) return;
    try {
      await apiFetch(`/api/purchases/suppliers/${payingSupplier.id}/payments`, {
        method: 'POST',
        body: JSON.stringify(payForm),
      });
      toast.success(
        tx(
          lang,
          `Payment of ${formatBDT(payForm.amount)} recorded for ${payingSupplier.name}`,
          `${payingSupplier.name}-কে ${formatBDT(payForm.amount)} পরিশোধ রেকর্ড হয়েছে`
        )
      );
      setPayingSupplier(null);
      setPayForm({ amount: '', paymentMethod: 'CASH', paymentDate: dhakaTodayISO(), remarks: '' });
      loadSuppliers();
      if (ledgerData?.supplier?.id === payingSupplier.id) openLedger(payingSupplier.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Payment failed', 'পরিশোধ ব্যর্থ হয়েছে'));
    }
  };

  const displayed = mode === 'due' ? suppliers.filter((s) => Number(s.currentDue) > 0) : suppliers;
  const totalDue = suppliers.reduce((sum, s) => sum + Number(s.currentDue || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'due' ? tr('supplierDue', lang) : tr('suppliers', lang)}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(lang, 'Total Supplier Outstanding Payable:', 'সরবরাহকারীদের মোট পাওনা:')}{' '}
            <strong className="font-mono text-amber-700">{formatBDT(totalDue)}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {tx(lang, 'Add Distributor / Supplier', 'নতুন সরবরাহকারী যোগ')}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Code', 'কোড')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Supplier & Company', 'সরবরাহকারী ও কোম্পানি')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Phone', 'মোবাইল')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Total Purchases', 'মোট ক্রয়')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Total Paid', 'মোট পরিশোধ')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Current Due', 'বর্তমান বাকি')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Actions', 'কার্যক্রম')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayed.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono text-slate-500">{s.supplierCode}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {s.company} {s.address ? `· ${s.address}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{s.phone}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatBDT(s.totalPurchases)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{formatBDT(s.totalPaid)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                    {formatBDT(s.currentDue)}
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => openLedger(s.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <BookOpen className="h-3 w-3" />
                      {tx(lang, 'Ledger', 'খাতা')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPayingSupplier(s);
                        setPayForm((prev) => ({ ...prev, amount: Number(s.currentDue) > 0 ? s.currentDue : '' }));
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <Wallet className="h-3 w-3" />
                      {tx(lang, 'Pay Due', 'পরিশোধ')}
                    </button>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    {mode === 'due'
                      ? tx(lang, 'No outstanding supplier dues.', 'কোনো সরবরাহকারীর পাওনা বাকি নেই।')
                      : tx(lang, 'No suppliers registered yet.', 'এখনো কোনো সরবরাহকারী নিবন্ধিত নেই।')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Ledger Drawer */}
      {ledgerData && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {tx(lang, 'Supplier Ledger:', 'সরবরাহকারীর খাতা:')} {ledgerData.supplier.name} ({ledgerData.supplier.supplierCode})
              </h2>
              <p className="text-xs text-slate-500">
                {tx(lang, 'Current Payable Balance:', 'বর্তমান বকেয়া:')}{' '}
                <strong className="font-mono text-amber-700">{formatBDT(ledgerData.supplier.currentDue)}</strong>
              </p>
            </div>
            <button type="button" onClick={() => setLedgerData(null)} className="text-slate-400">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-2 pr-3">{tx(lang, 'Date', 'তারিখ')}</th>
                  <th className="py-2 pr-3">{tx(lang, 'Type', 'ধরন')}</th>
                  <th className="py-2 pr-3">{tx(lang, 'Reference', 'রেফারেন্স')}</th>
                  <th className="py-2 pr-3">{tx(lang, 'Description', 'বিবরণ')}</th>
                  <th className="py-2 pr-3 text-right">{tx(lang, 'Paid (Dr)', 'পরিশোধ')}</th>
                  <th className="py-2 pr-3 text-right">{tx(lang, 'Billed (Cr)', 'বিল')}</th>
                  <th className="py-2 text-right">{tx(lang, 'Balance', 'জের')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledgerData.ledger.map((row: any) => (
                  <tr key={row.id}>
                    <td className="py-2 pr-3 font-mono">{formatDateDDMMYYYY(row.entryDate)}</td>
                    <td className="py-2 pr-3 text-[11px]">{formatStatusLabel(row.transactionType, lang)}</td>
                    <td className="py-2 pr-3 font-mono">{row.invoiceNumber || '—'}</td>
                    <td className="py-2 pr-3 text-slate-600 dark:text-slate-400">{row.description}</td>
                    <td className="py-2 pr-3 text-right font-mono text-emerald-700">{formatBDT(row.debitAmount)}</td>
                    <td className="py-2 pr-3 text-right font-mono text-amber-700">{formatBDT(row.creditAmount)}</td>
                    <td className="py-2 text-right font-mono font-semibold">{formatBDT(row.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Supplier Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleCreateSupplier}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <h3 className="text-base font-bold">{tx(lang, 'Add Supplier / Distributor', 'নতুন সরবরাহকারী যোগ করুন')}</h3>
            <input
              required
              placeholder={tx(lang, 'Supplier / Distributor Name *', 'সরবরাহকারী / ডিস্ট্রিবিউটরের নাম *')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder={tx(lang, 'Company (e.g., PRAN-RFL, ACI)', 'কোম্পানি (যেমন: প্রাণ-আরএফএল, এসিআই)')}
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              required
              placeholder={tx(lang, 'Mobile Number *', 'মোবাইল নম্বর *')}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder={tx(lang, 'Address', 'ঠিকানা')}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <div>
              <label className="text-[11px] text-slate-500">
                {tx(lang, 'Previous Opening Payable Balance (৳)', 'পূর্বের বকেয়া ব্যালেন্স (৳)')}
              </label>
              <input
                type="number"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 text-xs">
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                {tx(lang, 'Save Supplier', 'সরবরাহকারী সংরক্ষণ')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handlePaySupplier}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <h3 className="text-base font-bold">
              {tx(lang, 'Pay Supplier:', 'সরবরাহকারী পরিশোধ:')} {payingSupplier.name}
            </h3>
            <p className="text-xs text-slate-500">
              {tx(lang, 'Current Due:', 'বর্তমান বাকি:')}{' '}
              <strong className="font-mono text-amber-700">{formatBDT(payingSupplier.currentDue)}</strong>
            </p>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder={tx(lang, 'Payment Amount (৳)', 'পরিশোধের পরিমাণ (৳)')}
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as any })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              >
                {(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK'] as const).map((m) => (
                  <option key={m} value={m}>
                    {formatMethodLabel(m, lang)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={payForm.paymentDate}
                onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <input
              placeholder={tx(lang, 'Remarks / Transaction Ref', 'মন্তব্য / ট্রানজেকশন নম্বর')}
              value={payForm.remarks}
              onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayingSupplier(null)}
                className="rounded-lg border px-4 py-2 text-xs"
              >
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                {tx(lang, 'Confirm Payment', 'পরিশোধ নিশ্চিত করুন')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
