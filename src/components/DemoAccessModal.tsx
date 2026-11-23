import React, { useState } from 'react';
import {
  X,
  Sparkles,
  User,
  Phone,
  Mail,
  Store,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { tx } from '../lib/i18n';
import { useApp } from '../context/AppContext';

interface DemoAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DemoAccessModal: React.FC<DemoAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { lang, enterDemoMode } = useApp();

  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');

  // Sign Up fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');

  // Sign In fields
  const [signInShopName, setSignInShopName] = useState(() => localStorage.getItem('mudidokan_demo_shop_name') || '');
  const [signInPhone, setSignInPhone] = useState(() => localStorage.getItem('mudidokan_demo_user_phone') || '');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(tx(lang, 'Please enter your name', 'আপনার নাম লিখুন'));
      return;
    }
    if (!phone.trim()) {
      toast.error(tx(lang, 'Please enter mobile number', 'মোবাইল নম্বর লিখুন'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error(tx(lang, 'Please enter a valid Gmail / Email', 'সঠিক জিমেইল বা ইমেইল লিখুন'));
      return;
    }
    if (!shopName.trim()) {
      toast.error(tx(lang, 'Please enter your shop name', 'দোকানের নাম লিখুন'));
      return;
    }

    setLoading(true);

    const lead = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      shopName: shopName.trim(),
      timestamp: new Date().toISOString(),
      source: 'DEMO_SIGNUP',
    };

    try {
      const existing = JSON.parse(localStorage.getItem('mudirdokan_demo_leads') || '[]');
      existing.unshift(lead);
      localStorage.setItem('mudirdokan_demo_leads', JSON.stringify(existing));

      // Also add to SaaS clients list for owner tracking
      const saasClients = JSON.parse(localStorage.getItem('mudidokan_saas_clients') || '[]');
      const newClientRecord = {
        id: `DEMO-${Date.now().toString().slice(-4)}`,
        storeName: shopName.trim(),
        subdomain: shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'myshop',
        ownerName: name.trim(),
        ownerPhone: phone.trim(),
        district: 'ঢাকা',
        packageType: 'MONTHLY',
        price: 999,
        status: 'TRIAL',
        startDate: new Date().toISOString().slice(0, 10),
        renewalDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        paidAmount: 0,
        dueAmount: 999,
      };
      saasClients.unshift(newClientRecord);
      localStorage.setItem('mudidokan_saas_clients', JSON.stringify(saasClients));
    } catch {}

    try {
      await enterDemoMode({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        shopName: shopName.trim(),
      });
      toast.success(
        tx(
          lang,
          `Welcome ${name}! Exploring ${shopName} demo store.`,
          `স্বাগতম ${name}! "${shopName}" ডেমো স্টোরে আপনাকে স্বাগতম।`
        )
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error(tx(lang, 'Failed to enter demo mode', 'ডেমো লোড হতে সমস্যা হয়েছে'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign In with Shop Name and Phone
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInShopName.trim()) {
      toast.error(tx(lang, 'Please enter your shop name', 'দোকানের নাম লিখুন'));
      return;
    }
    if (!signInPhone.trim()) {
      toast.error(tx(lang, 'Please enter registered phone number', 'নিবন্ধিত মোবাইল নম্বর দিন'));
      return;
    }

    setLoading(true);

    try {
      await enterDemoMode({
        name: `দোকানদার (${signInPhone.trim()})`,
        phone: signInPhone.trim(),
        shopName: signInShopName.trim(),
      });
      toast.success(
        tx(
          lang,
          `Welcome back to ${signInShopName}!`,
          `স্বাগতম! "${signInShopName}" ডেমো স্টোর সফলভাবে লোড হয়েছে।`
        )
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      toast.error(tx(lang, 'Failed to enter demo mode', 'ডেমো লগইন হতে সমস্যা হয়েছে'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>{tx(lang, 'Instant Live Demo Gateway', 'মুদি দোকান প্রো — লাইভ ডেমো গেটওয়ে')}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {activeTab === 'signup' ? 'ফ্রি ডেমো দেখতে সাইন আপ করুন' : 'বিদ্যমান ডেমো অ্যাকাউন্টে সাইন ইন'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ১,৩৫৯টি আসল পণ্যের ছবিসহ পিওএস বিলিং ও অনলাইন স্টোর এক্সপ্লোর করুন
          </p>
        </div>

        {/* TAB TOGGLE: Sign Up vs Sign In */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('signup')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-white text-emerald-800 shadow-xs dark:bg-slate-900 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>নতুন রেজিস্ট্রেশন (সাইন আপ)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-white text-emerald-800 shadow-xs dark:bg-slate-900 dark:text-emerald-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>সাইন ইন (লগইন)</span>
          </button>
        </div>

        {/* TAB 1: SIGN UP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUp} className="mt-4 space-y-3">
            {/* 1. Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                আপনার নাম <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মো: আলমগীর হোসেন"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 pl-10 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                />
                <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* 2. Shop Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                দোকানের নাম (যা ড্যাশবোর্ডে শো করবে) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="যেমন: আলমগীর জেনারেল স্টোর"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 pl-10 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                />
                <Store className="absolute left-3.5 top-2.5 h-4 w-4 text-emerald-600" />
              </div>
            </div>

            {/* 3. Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 pl-10 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                />
                <Phone className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* 4. Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ইমেইল / জিমেইল <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alamgir@gmail.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 pl-10 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                />
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white py-3 text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>ডেমো স্টোর তৈরি হচ্ছে...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>ফ্রি ডেমোতে প্রবেশ করুন ⚡</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="mt-4 space-y-3.5">
            {/* 1. Shop Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                দোকানের নাম <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={signInShopName}
                  onChange={(e) => setSignInShopName(e.target.value)}
                  placeholder="রেজিস্টারকৃত দোকানের নাম"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                />
                <Store className="absolute left-3.5 top-3 h-4 w-4 text-indigo-600" />
              </div>
            </div>

            {/* 2. Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                মোবাইল নম্বর <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={signInPhone}
                  onChange={(e) => setSignInPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                />
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 text-xs sm:text-sm font-black shadow-md shadow-indigo-600/25 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>লগইন হচ্ছে...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>ডেমোতে লগইন করুন ➔</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>আপনার তথ্য ১০০% সুরক্ষিত · ডেমোতে ১,৩৫৯টি আইটেম সক্রিয়</span>
        </div>

      </div>
    </div>
  );
};
