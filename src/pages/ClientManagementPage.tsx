import React, { useState, useMemo } from 'react';
import {
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Phone,
  CreditCard,
  Filter,
  Check,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { formatBDT } from '../lib/decimal';
import { tx } from '../lib/i18n';

export interface ClientStore {
  id: string;
  storeName: string;
  subdomain: string;
  ownerName: string;
  ownerPhone: string;
  district: string;
  packageType: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  price: number;
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'DUE';
  startDate: string;
  renewalDate: string;
  paidAmount: number;
  dueAmount: number;
  lastPaymentMethod?: string;
  lastTrxId?: string;
}

const DEFAULT_CLIENTS: ClientStore[] = [
  {
    id: 'C-101',
    storeName: 'শামীম গ্রোসারি & সুপারশপ',
    subdomain: 'shamim',
    ownerName: 'শামীম হোসেন',
    ownerPhone: '01884700631',
    district: 'ঢাকা (মিরপুর ১০)',
    packageType: 'YEARLY',
    price: 9999,
    status: 'ACTIVE',
    startDate: '2026-01-01',
    renewalDate: '2027-01-01',
    paidAmount: 9999,
    dueAmount: 0,
    lastPaymentMethod: 'bKash',
    lastTrxId: 'BK9X24589',
  },
  {
    id: 'C-102',
    storeName: 'আল-মদিনা জেনারেল স্টোর',
    subdomain: 'madina',
    ownerName: 'মো: রফিকুল ইসলাম',
    ownerPhone: '01711223344',
    district: 'ঢাকা (উত্তরা সেক্টর ৭)',
    packageType: 'MONTHLY',
    price: 999,
    status: 'ACTIVE',
    startDate: '2026-11-01',
    renewalDate: '2026-12-01',
    paidAmount: 999,
    dueAmount: 0,
    lastPaymentMethod: 'Nagad',
    lastTrxId: 'NG7M44120',
  },
  {
    id: 'C-103',
    storeName: 'বিসমিল্লাহ ট্রেডার্স & মুদি মার্ট',
    subdomain: 'bismillah',
    ownerName: 'আব্দুল কাদির',
    ownerPhone: '01822334455',
    district: 'চট্টগ্রাম (জিইসি মোড়)',
    packageType: 'MONTHLY',
    price: 999,
    status: 'DUE',
    startDate: '2026-10-15',
    renewalDate: '2026-11-15',
    paidAmount: 500,
    dueAmount: 499,
    lastPaymentMethod: 'bKash',
    lastTrxId: 'BK1A90082',
  },
  {
    id: 'C-104',
    storeName: 'নিউ ঢাকা ডিপার্টমেন্টাল স্টোর',
    subdomain: 'dhaka',
    ownerName: 'কামাল আহমেদ',
    ownerPhone: '01933445566',
    district: 'সিলেট (জিন্দাবাজার)',
    packageType: 'MONTHLY',
    price: 999,
    status: 'TRIAL',
    startDate: '2026-11-18',
    renewalDate: '2026-11-25',
    paidAmount: 0,
    dueAmount: 999,
  },
  {
    id: 'C-105',
    storeName: 'জনপ্রিয় সুপার স্টোর',
    subdomain: 'jonopriyo',
    ownerName: 'তারেক মাহমুদ',
    ownerPhone: '01544556677',
    district: 'রাজশাহী (সাহেব বাজার)',
    packageType: 'YEARLY',
    price: 9999,
    status: 'ACTIVE',
    startDate: '2026-03-01',
    renewalDate: '2027-03-01',
    paidAmount: 9999,
    dueAmount: 0,
    lastPaymentMethod: 'Bank',
    lastTrxId: 'IBBL-994321',
  },
];

export const ClientManagementPage: React.FC = () => {
  const { lang } = useApp();

  const [clients, setClients] = useState<ClientStore[]>(() => {
    try {
      const saved = localStorage.getItem('mudidokan_saas_clients');
      return saved ? JSON.parse(saved) : DEFAULT_CLIENTS;
    } catch {
      return DEFAULT_CLIENTS;
    }
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DUE' | 'TRIAL' | 'EXPIRED'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClientForPay, setSelectedClientForPay] = useState<ClientStore | null>(null);

  // New Client Form
  const [newStoreName, setNewStoreName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newDistrict, setNewDistrict] = useState('ঢাকা');
  const [newPackage, setNewPackage] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [newPaidAmount, setNewPaidAmount] = useState('999');
  const [newTrxId, setNewTrxId] = useState('');

  // Payment Collection Form
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState<'bKash' | 'Nagad' | 'Cash' | 'Bank'>('bKash');
  const [collectTrxId, setCollectTrxId] = useState('');

  const saveClients = (updated: ClientStore[]) => {
    setClients(updated);
    try {
      localStorage.setItem('mudidokan_saas_clients', JSON.stringify(updated));
    } catch {}
  };

  // KPIs
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === 'ACTIVE').length;
  const dueClients = clients.filter((c) => c.status === 'DUE' || c.status === 'TRIAL').length;
  const totalRevenue = clients.reduce((acc, c) => acc + c.paidAmount, 0);
  const totalDueAmount = clients.reduce((acc, c) => acc + c.dueAmount, 0);

  // Filtered List
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.storeName.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q) ||
        c.ownerPhone.includes(q) ||
        c.subdomain.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [clients, statusFilter, search]);

  // Handle Add Client
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newOwnerPhone.trim()) {
      toast.error('দোকানের নাম এবং মোবাইল নম্বর দিন');
      return;
    }

    const price = newPackage === 'YEARLY' ? 9999 : 999;
    const paid = Number(newPaidAmount) || 0;
    const due = Math.max(0, price - paid);
    const sub = (newSubdomain || newStoreName.slice(0, 8)).toLowerCase().replace(/[^a-z0-9]/g, '');

    const newClient: ClientStore = {
      id: `C-${Date.now().toString().slice(-4)}`,
      storeName: newStoreName.trim(),
      subdomain: sub,
      ownerName: newOwnerName.trim() || 'দোকান মালিক',
      ownerPhone: newOwnerPhone.trim(),
      district: newDistrict,
      packageType: newPackage,
      price,
      status: due === 0 ? 'ACTIVE' : 'DUE',
      startDate: new Date().toISOString().slice(0, 10),
      renewalDate: new Date(Date.now() + (newPackage === 'YEARLY' ? 365 : 30) * 86400000).toISOString().slice(0, 10),
      paidAmount: paid,
      dueAmount: due,
      lastPaymentMethod: 'bKash',
      lastTrxId: newTrxId.trim() || undefined,
    };

    saveClients([newClient, ...clients]);
    toast.success('নতুন দোকানদার ক্লায়েন্ট সফলভাবে যুক্ত হয়েছে!');
    setIsAddModalOpen(false);
    setNewStoreName('');
    setNewSubdomain('');
    setNewOwnerName('');
    setNewOwnerPhone('');
    setNewTrxId('');
  };

  // Handle Collect Payment
  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForPay) return;
    const amt = Number(collectAmount) || 0;
    if (amt <= 0) {
      toast.error('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    const updated = clients.map((c) => {
      if (c.id === selectedClientForPay.id) {
        const newPaid = c.paidAmount + amt;
        const newDue = Math.max(0, c.dueAmount - amt);
        return {
          ...c,
          paidAmount: newPaid,
          dueAmount: newDue,
          status: newDue === 0 ? ('ACTIVE' as const) : c.status,
          lastPaymentMethod: collectMethod,
          lastTrxId: collectTrxId.trim() || c.lastTrxId,
        };
      }
      return c;
    });

    saveClients(updated);
    toast.success(`৳${amt} পেমেন্ট সফলভাবে রেকর্ড করা হয়েছে!`);
    setSelectedClientForPay(null);
    setCollectAmount('');
    setCollectTrxId('');
  };

  // Handle Renew License
  const handleRenew = (id: string, days: number) => {
    const updated = clients.map((c) => {
      if (c.id === id) {
        const curDate = new Date(c.renewalDate);
        const nextDate = new Date(Math.max(Date.now(), curDate.getTime()) + days * 86400000);
        return {
          ...c,
          renewalDate: nextDate.toISOString().slice(0, 10),
          status: 'ACTIVE' as const,
        };
      }
      return c;
    });
    saveClients(updated);
    toast.success(`লাইসেন্স মেয়াদ +${days} দিন বৃদ্ধি করা হয়েছে!`);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="h-6 w-6 text-emerald-600" />
            <span>মুদি দোকান প্রো — ক্লায়েন্ট ও সাবস্ক্রিপশন ট্র্যাকিং</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            কার কার দোকান সক্রিয় আছে, কে কত পেমেন্ট দিচ্ছে এবং কার বকেয়া আছে তার কেন্দ্রীয় হিসাব
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-emerald-600/30 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন ক্লায়েন্ট শপ যুক্ত করুন</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট ক্লায়েন্ট দোকান</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{totalClients} টি</div>
          <div className="text-[11px] text-slate-400 mt-0.5">সারা দেশে নিবন্ধিত মুদি শপ</div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">সক্রিয় পেইড শপ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">{activeClients} টি</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">নিয়মিত সাবস্ক্রিপশন চালু</div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">বকেয়া ও ট্রায়াল ক্লায়েন্ট</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{dueClients} টি</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">বকেয়া মোট: {formatBDT(totalDueAmount)}</div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">মোট সাবস্ক্রিপশন আদায়</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-600">{formatBDT(totalRevenue)}</div>
          <div className="text-[11px] text-indigo-600/80 mt-0.5">বিকাশ / নগদ / ব্যাংকে জমা</div>
        </div>
      </div>

      {/* Monthly SaaS Revenue Comparison (চলতি মাস, গত মাস, তার আগের মাস) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>মাসভিত্তিক সাবস্ক্রিপশন ইনকাম ট্র্যাকার (মাসওয়ারি তুলনা)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              চলতি মাস, গত মাস এবং তার আগের মাসের আয় ও ক্লায়েন্ট রিনিউয়াল প্রবৃদ্ধি
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            লাইভ ইনকাম রিপোর্ট
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-3">
          {/* চলতি মাস */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-3.5 dark:border-emerald-800/60 dark:from-emerald-950/40 dark:to-teal-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                চলতি মাস (নভেম্বর ২০২৬)
              </span>
              <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                রানিং মাস
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
              ৳১৬,৯৯৭
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>সংগৃহীত: ৫ টি ক্লায়েন্ট</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">+১৩.৪% প্রবৃদ্ধি ↑</span>
            </div>
          </div>

          {/* গত মাস */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                গত মাস (অক্টোবর ২০২৬)
              </span>
              <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                সমাপ্ত
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              ৳১৪,৯৮৫
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>সংগৃহীত: ৪ টি ক্লায়েন্ট</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">+১৫.৩% প্রবৃদ্ধি ↑</span>
            </div>
          </div>

          {/* তার আগের মাস */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                তার আগের মাস (সেপ্টেম্বর ২০২৬)
              </span>
              <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                সমাপ্ত
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
              ৳১২,৯৮০
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>সংগৃহীত: ৩ টি ক্লায়েন্ট</span>
              <span className="text-slate-400">ভিত্তি মাস</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="দোকানের নাম, মালিকের নাম, ফোন বা সাব-ডোমেইন..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              ['ALL', 'সব দোকান'],
              ['ACTIVE', 'সক্রিয় পেইড'],
              ['DUE', 'বকেয়া'],
              ['TRIAL', 'ট্রায়াল'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === key
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-bold">দোকান ও সাব-ডোমেইন</th>
                <th className="px-4 py-3 font-bold">মালিক ও যোগাযোগ</th>
                <th className="px-4 py-3 font-bold">প্যাকেজ ও রেট</th>
                <th className="px-4 py-3 text-right font-bold">পরিশোধিত</th>
                <th className="px-4 py-3 text-right font-bold">বকেয়া</th>
                <th className="px-4 py-3 font-bold">নবায়ন তারিখ</th>
                <th className="px-4 py-3 text-center font-bold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs text-slate-400">
                    কোনো ক্লায়েন্ট পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  return (
                    <tr key={client.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition">
                      {/* Shop Name & Subdomain */}
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{client.storeName}</span>
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            client.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : client.status === 'DUE'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {client.status === 'ACTIVE' ? 'সক্রিয়' : client.status === 'DUE' ? 'বকেয়া' : 'ট্রায়াল'}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">
                          <span>{client.subdomain}.mudidokanpro.com</span>
                          <a
                            href={`https://mudidokanpro.web.app?shop=${client.subdomain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-indigo-800 p-0.5"
                            title="দোকানের অনলাইন সাইট খুলুন"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{client.district}</div>
                      </td>

                      {/* Owner & Phone */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{client.ownerName}</div>
                        <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{client.ownerPhone}</span>
                        </div>
                      </td>

                      {/* Package */}
                      <td className="px-4 py-3">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {client.packageType === 'YEARLY' ? 'বাৎসরিক (৳৯,৯৯৯)' : 'মাসিক (৳৯৯৯)'}
                        </span>
                        {client.lastTrxId && (
                          <div className="mt-1 text-[10px] text-slate-400 font-mono">
                            {client.lastPaymentMethod}: {client.lastTrxId}
                          </div>
                        )}
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        {formatBDT(client.paidAmount)}
                      </td>

                      {/* Due */}
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {client.dueAmount > 0 ? (
                          <span className="text-rose-600">{formatBDT(client.dueAmount)}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Renewal */}
                      <td className="px-4 py-3 font-mono text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{client.renewalDate}</div>
                        <div className="text-[10px] text-slate-400">শুরু: {client.startDate}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientForPay(client);
                              setCollectAmount(String(client.dueAmount || 999));
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-pointer"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>পেমেন্ট</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRenew(client.id, 30)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-1 text-[11px] font-bold text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 cursor-pointer"
                            title="+৩০ দিন লাইসেন্স বৃদ্ধি"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>+১ মাস</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW CLIENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-600" />
                <span>নতুন দোকানদার ক্লায়েন্ট যুক্ত করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  দোকানের নাম
                </label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="যেমন: ভাই ভাই জেনারেল স্টোর"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  সাব-ডোমেইন নাম (যেমন: bhaibhai)
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950">
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="bhaibhai"
                    className="flex-1 font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                  <span className="text-slate-400 font-mono">.mudidokanpro.com</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মালিকের নাম
                  </label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="শপ ওনারের নাম"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    মোবাইল নম্বর
                  </label>
                  <input
                    type="tel"
                    required
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    প্যাকেজ
                  </label>
                  <select
                    value={newPackage}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      setNewPackage(p);
                      setNewPaidAmount(p === 'YEARLY' ? '9999' : '999');
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="MONTHLY">মাসিক (৳৯৯৯)</option>
                    <option value="YEARLY">বাৎসরিক (৳৯,৯৯৯)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    জমা টাকা
                  </label>
                  <input
                    type="number"
                    value={newPaidAmount}
                    onChange={(e) => setNewPaidAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  bKash / Nagad TrxID (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={newTrxId}
                  onChange={(e) => setNewTrxId(e.target.value)}
                  placeholder="যেমন: BK9X24589"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  ক্লায়েন্ট সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COLLECT PAYMENT */}
      {selectedClientForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">পেমেন্ট গ্রহণ</h3>
                <p className="text-[11px] text-slate-500">{selectedClientForPay.storeName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientForPay(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCollectPayment} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  জমা টাকার পরিমাণ (৳)
                </label>
                <input
                  type="number"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="যেমন: ৯৯৯"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono font-black text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ)</option>
                  <option value="Cash">Cash (নগদ ক্যাশ)</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ট্রানজেকশন আইডি (TrxID)
                </label>
                <input
                  type="text"
                  value={collectTrxId}
                  onChange={(e) => setCollectTrxId(e.target.value)}
                  placeholder="TrxID (ঐচ্ছিক)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPay(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  পেমেন্ট জমা করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
