import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateDDMMYYYY, dhakaTodayISO } from '../lib/decimal';
import { tr, trCompact, tx, formatMethodLabel } from '../lib/i18n';

export const ExpensesPage: React.FC = () => {
  const { lang } = useApp();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    categoryId: 0,
    amount: '',
    expenseDate: dhakaTodayISO(),
    paymentMethod: 'CASH' as 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK',
    description: '',
    attachmentRef: '',
  });

  const loadData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        apiFetch('/api/finance/expenses'),
        apiFetch('/api/finance/expense-categories'),
      ]);
      setExpenses(expRes);
      setCategories(catRes);
      if (catRes.length > 0 && form.categoryId === 0) {
        setForm((prev) => ({ ...prev, categoryId: catRes[0].id }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load expenses', 'খরচের তালিকা লোড ব্যর্থ হয়েছে'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/finance/expenses', {
        method: 'POST',
        body: JSON.stringify({ ...form, categoryId: Number(form.categoryId) }),
      });
      toast.success(tx(lang, 'Operating expense recorded', 'দোকানের খরচ সংরক্ষিত হয়েছে'));
      setShowModal(false);
      setForm((prev) => ({ ...prev, amount: '', description: '', attachmentRef: '' }));
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to save expense', 'খরচ সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('expenses', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(lang, 'Total Recorded Operating Expenses:', 'মোট লিপিবদ্ধ পরিচালনা খরচ:')}{' '}
            <strong className="font-mono text-amber-700">{formatBDT(totalExpenses)}</strong>
            {' · '}
            {tx(lang, 'Deducted from Gross Profit to compute Operating Net Profit', 'নিট লাভ হিসাব করতে মোট লাভ থেকে বাদ যায়')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {tx(lang, 'Record Operating Expense', 'নতুন খরচ যোগ করুন')}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Date', 'তারিখ')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Category', 'খরচের খাত')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Description', 'বিবরণ')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Method', 'মাধ্যম')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Receipt / Ref', 'ভাউচার / রেফারেন্স')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Amount', 'টাকা')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateDDMMYYYY(e.expenseDate)}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                    {trCompact(e.categoryName, e.categoryNameBn, lang)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{e.description || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{formatMethodLabel(e.paymentMethod, lang)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{e.attachmentRef || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                    {formatBDT(e.amount)}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {tx(
                      lang,
                      'No operating expenses recorded yet (Shop rent, Electricity, Salary, Transport, Tea, etc.).',
                      'এখনো কোনো খরচ রেকর্ড হয়নি (দোকান ভাড়া, বিদ্যুৎ বিল, বেতন, যাতায়াত, চা-নাস্তা ইত্যাদি)।'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">{tx(lang, 'Record Store Operating Expense', 'দোকানের খরচ এন্ট্রি')}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">{tx(lang, 'Expense Category *', 'খরচের খাত *')}</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {trCompact(c.name, c.nameBn, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Amount (৳) *', 'টাকার পরিমাণ (৳) *')}</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs font-bold dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">{tx(lang, 'Date', 'তারিখ')}</label>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">{tx(lang, 'Payment Method', 'পেমেন্ট মাধ্যম')}</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="CASH">
                  {tx(lang, 'Cash (Deducts from Cash Register)', 'নগদ (ক্যাশ ড্রয়ার থেকে বাদ যাবে)')}
                </option>
                <option value="BKASH">{formatMethodLabel('BKASH', lang)}</option>
                <option value="NAGAD">{formatMethodLabel('NAGAD', lang)}</option>
                <option value="ROCKET">{formatMethodLabel('ROCKET', lang)}</option>
                <option value="BANK">{formatMethodLabel('BANK', lang)}</option>
              </select>
            </div>
            <input
              placeholder={tx(lang, 'Description (e.g., Electricity Bill)', 'বিবরণ (যেমন: বিদ্যুৎ বিল)')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              placeholder={tx(lang, 'Voucher / Receipt Reference (Optional)', 'ভাউচার / রসিদ নম্বর (ঐচ্ছিক)')}
              value={form.attachmentRef}
              onChange={(e) => setForm({ ...form, attachmentRef: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2 text-xs">
                {tr('cancel', lang)}
              </button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">
                {tx(lang, 'Save Expense', 'খরচ সংরক্ষণ করুন')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
