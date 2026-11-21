import React, { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { formatBDT, formatDateTimeDhaka } from '../lib/decimal';
import { tr, tx, formatStatusLabel } from '../lib/i18n';

export const CashManagementPage: React.FC = () => {
  const { lang } = useApp();
  const [data, setData] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [closingAmt, setClosingAmt] = useState('');
  const [openingAmt, setOpeningAmt] = useState('5000');

  const loadRegister = async () => {
    try {
      const res = await apiFetch('/api/finance/cash-register');
      setData(res);
      setClosingAmt(res.currentDrawerBalance || '0');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load cash register', 'ক্যাশ রেজিস্টার লোড ব্যর্থ হয়েছে'));
    }
  };

  useEffect(() => {
    loadRegister();
  }, []);

  const handleManualCash = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/finance/cash-register/transaction', {
        method: 'POST',
        body: JSON.stringify({ direction, amount, description: desc }),
      });
      toast.success(
        direction === 'IN'
          ? tx(lang, 'Cash In recorded', 'নগদ জমা রেকর্ড হয়েছে')
          : tx(lang, 'Cash Out recorded', 'নগদ উত্তোলন রেকর্ড হয়েছে')
      );
      setAmount('');
      setDesc('');
      loadRegister();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to record cash transaction', 'ক্যাশ লেনদেন সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  };

  const handleOpenRegister = async () => {
    try {
      await apiFetch('/api/finance/cash-register/open', {
        method: 'POST',
        body: JSON.stringify({ openingBalance: openingAmt }),
      });
      toast.success(tx(lang, 'Cash register opened', 'ক্যাশ রেজিস্টার খোলা হয়েছে'));
      loadRegister();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to open register', 'রেজিস্টার খোলা ব্যর্থ হয়েছে'));
    }
  };

  const handleCloseRegister = async () => {
    try {
      await apiFetch('/api/finance/cash-register/close', {
        method: 'POST',
        body: JSON.stringify({ actualClosing: closingAmt }),
      });
      toast.success(tx(lang, 'Daily cash register closed & reconciled', 'দৈনিক ক্যাশ ক্লোজিং সম্পন্ন হয়েছে'));
      loadRegister();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to close register', 'ক্লোজিং ব্যর্থ হয়েছে'));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('cashManagement', lang)}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {tx(
            lang,
            'Daily Cash Drawer Balance · Auto-linked to Cash Sales, Due Collections, Purchases & Cash Expenses',
            'দৈনিক ক্যাশ ড্রয়ার ব্যালেন্স · নগদ বিক্রয়, বাকি আদায়, ক্রয় ও খরচের সাথে স্বয়ংক্রিয়ভাবে যুক্ত'
          )}
        </p>
      </div>

      {/* Live Cash Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">{tx(lang, 'Current Cash Drawer Balance', 'বর্তমান ক্যাশ ব্যালেন্স')}</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatBDT(data?.currentDrawerBalance || 0)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {tx(lang, 'Shift Status:', 'শিফট অবস্থা:')}{' '}
            {data?.activeRegister ? formatStatusLabel('OPEN', lang) : formatStatusLabel('CLOSED', lang)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">{tx(lang, 'Total Cash In (Shift)', 'মোট নগদ জমা')}</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white">
            +{formatBDT(data?.totalIn || 0)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs text-slate-500">{tx(lang, 'Total Cash Out (Shift)', 'মোট নগদ খরচ / উত্তোলন')}</div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-700">-{formatBDT(data?.totalOut || 0)}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <form
          onSubmit={handleManualCash}
          className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3"
        >
          <h2 className="text-sm font-bold">{tx(lang, 'Manual Cash-In / Cash-Out Entry', 'ম্যানুয়াল ক্যাশ জমা / উত্তোলন')}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDirection('IN')}
              className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold cursor-pointer ${
                direction === 'IN' ? 'bg-emerald-600 text-white' : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" /> {tx(lang, 'Cash In (Deposit)', 'ক্যাশ জমা')}
            </button>
            <button
              type="button"
              onClick={() => setDirection('OUT')}
              className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold cursor-pointer ${
                direction === 'OUT' ? 'bg-amber-600 text-white' : 'border border-slate-200 dark:border-slate-700'
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> {tx(lang, 'Cash Out (Withdrawal)', 'ক্যাশ উত্তোলন')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              placeholder={tx(lang, 'Amount (৳)', 'টাকার পরিমাণ (৳)')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
            />
            <input
              required
              placeholder={tx(lang, 'Reason / Note', 'কারণ / মন্তব্য')}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer"
          >
            {tx(lang, 'Record Cash Movement', 'লেনদেন সংরক্ষণ করুন')}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-bold">{tx(lang, 'Daily Cash Closing & Shift Control', 'দৈনিক ক্যাশ ক্লোজিং ও শিফট নিয়ন্ত্রণ')}</h2>
          {data?.activeRegister ? (
            <>
              <p className="text-xs text-slate-500">
                {tx(lang, 'Opened', 'খোলা হয়েছে')} {formatDateTimeDhaka(data.activeRegister.openedAt)} ·{' '}
                {tx(lang, 'Opening:', 'প্রারম্ভিক:')}{' '}
                <span className="font-mono font-semibold">{formatBDT(data.activeRegister.openingBalance)}</span>
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={closingAmt}
                  onChange={(e) => setClosingAmt(e.target.value)}
                  placeholder={tx(lang, 'Counted Cash in Drawer (৳)', 'ড্রয়ারে গোনা নগদ টাকা (৳)')}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
                <button
                  type="button"
                  onClick={handleCloseRegister}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" /> {tx(lang, 'Close Day', 'দিন ক্লোজ করুন')}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={openingAmt}
                onChange={(e) => setOpeningAmt(e.target.value)}
                placeholder={tx(lang, 'Opening Float (৳)', 'শুরুর ক্যাশ (৳)')}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
              />
              <button
                type="button"
                onClick={handleOpenRegister}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                <Unlock className="h-3.5 w-3.5" /> {tx(lang, 'Open Register', 'ক্যাশ খুলুন')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cash Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3 text-sm font-semibold dark:border-slate-800">
          {tx(lang, 'Cash Drawer Transaction Ledger', 'ক্যাশ লেনদেনের তালিকা')}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60">
              <tr>
                <th className="px-4 py-2.5">{tx(lang, 'Date & Time', 'তারিখ ও সময়')}</th>
                <th className="px-4 py-2.5">{tx(lang, 'Type', 'ধরন')}</th>
                <th className="px-4 py-2.5">{tx(lang, 'Description', 'বিবরণ')}</th>
                <th className="px-4 py-2.5 text-right">{tx(lang, 'Amount', 'টাকা')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(data?.transactions || []).map((t: any) => (
                <tr key={t.id}>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateTimeDhaka(t.createdAt)}</td>
                  <td className="px-4 py-2.5 text-[11px]">{formatStatusLabel(t.txType, lang)}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{t.description}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono font-bold ${
                      t.direction === 'IN' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {t.direction === 'IN' ? '+' : '-'}
                    {formatBDT(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
