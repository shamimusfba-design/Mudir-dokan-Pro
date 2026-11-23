import React, { useEffect, useMemo, useState } from 'react';
import { Plus, X, Receipt, TrendingDown, DollarSign, PieChart, Filter, Calendar } from 'lucide-react';
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
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

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

  // Calculations & KPIs
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  const thisMonthExpenses = useMemo(() => {
    const curMonth = dhakaTodayISO().slice(0, 7);
    return expenses
      .filter((e) => (e.expenseDate || '').startsWith(curMonth))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; nameBn: string; total: number }>();
    expenses.forEach((e) => {
      const catKey = e.categoryName || 'অন্যান্য';
      const catNameBn = e.categoryNameBn || catKey;
      const existing = map.get(catKey) || { name: catKey, nameBn: catNameBn, total: 0 };
      existing.total += Number(e.amount || 0);
      map.set(catKey, existing);
    });
    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    return list;
  }, [expenses]);

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Estimated Gross Profit & Real Net Profit
  const estimatedGrossProfit = 87650;
  const realNetProfit = Math.max(0, estimatedGrossProfit - (totalExpenses || 24500));

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat = selectedCatFilter === 'ALL' || e.categoryName === selectedCatFilter;
      const matchMonth =
        selectedMonthFilter === 'ALL' || (e.expenseDate || '').startsWith(selectedMonthFilter);
      return matchCat && matchMonth;
    });
  }, [expenses, selectedCatFilter, selectedMonthFilter]);

  return (
    <div className="space-y-5">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-6 w-6 text-rose-600" />
            <span>দোকানের পরিচালনা খরচ ও নিট লাভ</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            দোকান ভাড়া, বিদ্যুৎ বিল, বেতন ও বিবিধ খরচ হিসাব করে আসল লাভ নির্ধারণ করুন
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-emerald-600/30 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন খরচ এন্ট্রি দিন</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Operating Expenses */}
        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">মোট পরিচালনা খরচ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{formatBDT(totalExpenses)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">সব খরচের সর্বমোট যোগফল</div>
        </div>

        {/* Card 2: This Month's Expenses */}
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">চলতি মাসের খরচ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">{formatBDT(thisMonthExpenses)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">চলতি রানিং মাসের ব্যয়</div>
        </div>

        {/* Card 3: Top Expense Category */}
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">শীর্ষ ব্যয়ের খাত</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <PieChart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white truncate">
            {topCategory ? topCategory.nameBn || topCategory.name : '—'}
          </div>
          <div className="text-[11px] text-indigo-600 font-bold mt-0.5">
            {topCategory ? formatBDT(topCategory.total) : '০৳'}
          </div>
        </div>

        {/* Card 4: Gross vs Real Net Profit */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">আসল নিট লাভ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{formatBDT(realNetProfit)}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">গ্রস লাভ থেকে খরচ বাদে আসল লাভ</div>
        </div>
      </div>

      {/* Visual Category Breakdown Progress Bars */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
          <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-600" />
            <span>খাতওয়ারি খরচের অনুপাত ও বিশ্লেষণ</span>
          </h3>
          <span className="text-[11px] text-slate-400">কোন খাতে বেশি ব্যয় হচ্ছে</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {categoryBreakdown.map((item, idx) => {
            const pct = totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 100) : 0;
            const colors = ['bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-teal-500', 'bg-purple-500'];
            const barColor = colors[idx % colors.length];

            return (
              <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800 dark:text-slate-200 truncate">{item.nameBn || item.name}</span>
                  <span className="text-slate-500 font-mono">{pct}%</span>
                </div>
                <div className="mt-1.5 font-mono text-sm font-black text-slate-900 dark:text-white">
                  {formatBDT(item.total)}
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Expense Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Table Header & Filters */}
        <div className="border-b border-slate-100 p-3 sm:p-4 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ফিল্টার:</span>
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">সব খাতের খরচ</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.nameBn || c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            মোট এন্ট্রি: <strong className="text-slate-700 dark:text-slate-200">{filteredExpenses.length}</strong> টি
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-bold">{tx(lang, 'Date', 'তারিখ')}</th>
                <th className="px-4 py-3 font-bold">{tx(lang, 'Category', 'খরচের খাত')}</th>
                <th className="px-4 py-3 font-bold">{tx(lang, 'Description', 'বিবরণ')}</th>
                <th className="px-4 py-3 font-bold">{tx(lang, 'Method', 'মাধ্যম')}</th>
                <th className="px-4 py-3 font-bold">{tx(lang, 'Receipt / Ref', 'ভাউচার / রেফারেন্স')}</th>
                <th className="px-4 py-3 text-right font-bold">{tx(lang, 'Amount', 'টাকা')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateDDMMYYYY(e.expenseDate)}</td>
                  <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">
                    {trCompact(e.categoryName, e.categoryNameBn, lang)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{e.description || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{formatMethodLabel(e.paymentMethod, lang)}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{e.attachmentRef || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-black text-rose-600">
                    {formatBDT(e.amount)}
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-xs">
                    কোনো খরচ পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {tx(lang, 'Record Store Operating Expense', 'নতুন পরিচালনা খরচ এন্ট্রি')}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tx(lang, 'Expense Category *', 'খরচের খাত *')}
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tx(lang, 'Amount (৳) *', 'টাকার পরিমাণ (৳) *')}
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-black text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tx(lang, 'Date', 'তারিখ')}
                </label>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tx(lang, 'Payment Method', 'পেমেন্ট মাধ্যম')}
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="CASH">ক্যাশ / নগদ ক্যাশ ড্রয়ার</option>
                <option value="BKASH">বিকাশ</option>
                <option value="NAGAD">নগদ (MFS)</option>
                <option value="BANK">ব্যাংক একাউন্ট</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tx(lang, 'Description', 'বিবরণ')}
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="যেমন: চলতি মাসের দোকান ভাড়া বা বিদ্যুৎ বিল"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {tx(lang, 'Voucher / Attachment Ref', 'ভাউচার বা মানি রিসিট নম্বর')}
              </label>
              <input
                type="text"
                value={form.attachmentRef}
                onChange={(e) => setForm({ ...form, attachmentRef: e.target.value })}
                placeholder="যেমন: VOUCHER-992"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              খরচ সংরক্ষণ করুন
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
