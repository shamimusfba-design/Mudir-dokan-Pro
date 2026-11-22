import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Users,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Headphones,
  Store,
  User,
  Phone,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { tx } from '../lib/i18n';
import { PWAInstallButton } from '../hooks/usePWAInstall';
import { BuyProModal } from '../components/BuyProModal';
import { DemoAccessModal } from '../components/DemoAccessModal';

interface LoginPageProps {
  onOpenPortal: () => void;
  onOpenShowcase?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenPortal, onOpenShowcase }) => {
  const { lang, setLang, darkMode, toggleDarkMode, loginAsOwner } = useApp();

  // Active Login Role Tab: 'owner' | 'customer' (Requested by user)
  const [activeRole, setActiveRole] = useState<'owner' | 'customer'>('owner');

  // Owner Login states
  const [loginPhone, setLoginPhone] = useState('01884700631');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Customer Login states
  const [customerPhone, setCustomerPhone] = useState('');

  // Modals
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Handle Standard Owner Sign-in
  const handleOwnerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      toast.error(tx(lang, 'Please enter your Mobile Number or Email', 'মোবাইল নম্বর বা ইমেইল দিন'));
      return;
    }
    if (!loginPassword.trim()) {
      toast.error(tx(lang, 'Please enter your password', 'পাসওয়ার্ড দিন'));
      return;
    }

    loginAsOwner({
      name: loginPhone === '01884700631' ? 'শামীম (দোকান মালিক)' : `দোকানদার (${loginPhone})`,
      phone: loginPhone.trim(),
      storeName: 'মুদির দোকান প্রো',
      subdomain: 'shamimgrocery',
    });
  };

  // Handle Customer Portal Navigation
  const handleCustomerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      toast.error(tx(lang, 'Please enter your mobile number', 'মোবাইল নম্বর লিখুন'));
      return;
    }
    try {
      localStorage.setItem('mudirdokan_portal_phone_prefill', customerPhone.trim());
    } catch {}
    onOpenPortal();
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#F8FAF7] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 overflow-x-hidden">
      
      {/* Modals */}
      <BuyProModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      <DemoAccessModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* Decorative ambient glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-900/10" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-orange-300/15 blur-3xl dark:bg-orange-900/10" />

      {/* TOP NAVBAR / HEADER */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center gap-3">
          <img
            src="/mudi-dokan-pro-logo.png"
            alt="Mudi Dokan Pro"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Pro Features Showcase Navigation Button */}
          {onOpenShowcase && (
            <button
              type="button"
              onClick={onOpenShowcase}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>{tx(lang, 'Pro Features', 'প্রো ফিচারস')}</span>
            </button>
          )}

          {/* Buy Pro Version Button in Header */}
          <button
            type="button"
            onClick={() => setIsBuyModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white px-3 sm:px-3.5 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">{tx(lang, 'Buy Pro', 'প্রো কিনুন')}</span>
            <span className="xs:hidden">প্রো</span>
          </button>

          {/* Language Switcher: English | বাংলা */}
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={() => setLang('EN')}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                lang === 'EN'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => setLang('BN')}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                lang === 'BN'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>

          <PWAInstallButton compact />

          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="rounded-full border border-slate-200 bg-white/90 p-2 text-slate-600 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* MAIN TWO-COLUMN BODY */}
      <main className="relative z-10 mx-auto my-auto flex w-full max-w-7xl flex-1 items-center px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: BRAND & HAPPY SHOPKEEPER HERO (Exact Approved Artwork) */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-4">
            <div className="relative rounded-3xl overflow-hidden border border-emerald-100/80 bg-white shadow-xl shadow-emerald-950/5 dark:border-emerald-950/40 dark:bg-slate-900">
              <div className="relative w-full overflow-hidden">
                <img
                  src={lang === 'BN' ? '/hero-full-left.jpg' : '/hero-full-left-en.jpg'}
                  alt="Mudi Dokan Pro - Happy Shopkeeper & Dashboard"
                  className="w-full h-auto object-cover object-left select-none pointer-events-none"
                />
              </div>

              {/* Clean Bottom Banner */}
              <div className="border-t border-emerald-100/70 bg-gradient-to-r from-emerald-50 via-white to-amber-50/70 p-3.5 sm:p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {tx(lang, 'MudirDokan Pro — POS & Khata System', 'মুদির দোকান প্রো — আধুনিক পিওএস ও ডিজিটাল খাতা')}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {tx(
                        lang,
                        '1,359 Bangladesh grocery SKUs ready with real-time barcode billing.',
                        '১,৩৫৯টি বাংলাদেশি পণ্যের রেডি ক্যাটালগ এবং বারকোড বিলিং।'
                      )}
                    </p>
                  </div>
                </div>

                {/* Free Demo Trigger Button on Left Banner */}
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-1.5 text-xs font-extrabold shadow-sm shadow-amber-500/25 transition cursor-pointer shrink-0"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{tx(lang, '⚡ Free Demo', '⚡ ফ্রি ডেমো')}</span>
                </button>
              </div>
            </div>

            {/* Quick 3-Pill Highlights */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-2.5 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {tx(lang, 'Live Profit & Loss', 'আসল লাভ-লোকসান')}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {tx(lang, 'Daily accuracy', 'দৈনিক হিসাব')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-white/80 p-2.5 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                  <Package className="h-4 w-4" />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {tx(lang, 'Stock Alerts', 'স্টক সতর্কতা')}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {tx(lang, 'Before run-out', 'পণ্য শেষের আগেই')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-2.5 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {tx(lang, 'Digital Khata', 'ডিজিটাল খাতা')}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {tx(lang, 'Due & Installments', 'বাকি ও আদায়')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CLEAN PROFESSIONAL LOGIN CARD (Shop Owner | Customer) */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
            <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-2xl shadow-emerald-950/10 dark:border-slate-800 dark:bg-slate-900">
              
              {/* Header Title */}
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {tx(lang, 'Welcome Back!', 'স্বাগতম!')}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {activeRole === 'owner'
                    ? tx(lang, 'Sign in to manage your grocery business & store accounts', 'আপনার দোকানের হিসাব ও পিওএস পরিচালনা করতে সাইন ইন করুন')
                    : tx(lang, 'Check your purchases, pending dues and receipts online', 'আপনার বাকি, কেনাকাটা ও জমার হিসাব অনলাইনে দেখতে সাইন ইন করুন')}
                </p>
              </div>

              {/* 2 Roles Switcher: Business Owner | Customer (Requested by user) */}
              <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100/90 p-1 dark:border-slate-800 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveRole('owner')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                    activeRole === 'owner'
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>{tx(lang, 'Shop Owner', 'শপ ওনার')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole('customer')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                    activeRole === 'customer'
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span>{tx(lang, 'Customer', 'কাস্টমার')}</span>
                </button>
              </div>

              {/* TAB 1: SHOP OWNER LOGIN FORM */}
              {activeRole === 'owner' && (
                <form onSubmit={handleOwnerSignIn} className="mt-4 space-y-3.5">
                  {/* Mobile or Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {tx(lang, 'Mobile Number or Email', 'মোবাইল নম্বর অথবা ইমেইল')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="01884700631"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                      />
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {tx(lang, 'Password', 'পাসওয়ার্ড')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 pr-10 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                      />
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{tx(lang, 'Remember Me', 'আমাকে মনে রাখুন')}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info(tx(lang, 'Helpline: 01884700631 for password reset assistance.', 'পাসওয়ার্ড সহায়তায় কল করুন: 01884700631'))}
                      className="text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 cursor-pointer font-medium"
                    >
                      {tx(lang, 'Forgot Password?', 'পাসওয়ার্ড ভুলে গেছেন?')}
                    </button>
                  </div>

                  {/* Standard Clean Sign In Button */}
                  <button
                    type="submit"
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span>{tx(lang, 'Sign In to Your Business', 'দোকানে সাইন ইন করুন')}</span>
                  </button>
                </form>
              )}

              {/* TAB 2: CUSTOMER PORTAL ACCESS */}
              {activeRole === 'customer' && (
                <form onSubmit={handleCustomerSignIn} className="mt-4 space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {tx(lang, 'Customer Mobile Number', 'আপনার মোবাইল নম্বর')}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                      />
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {tx(
                      lang,
                      'Enter the phone number registered with the grocery store to view your digital khata statement and payment receipts.',
                      'দোকানে যে মোবাইল নম্বর দিয়ে কেনাকাটা করেন তা দিয়ে আপনার বাকি ও পেমেন্টের ডিজিটাল স্টেটমেন্ট দেখুন।'
                    )}
                  </p>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>{tx(lang, 'Open Customer Portal', 'কাস্টমার পোর্টাল ও হিসাব দেখুন')}</span>
                  </button>
                </form>
              )}

              {/* PRO FEATURES & DEMO SECTION (Requested by user) */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                
                {/* 1. See Pro Features Landing Page */}
                {onOpenShowcase && (
                  <button
                    type="button"
                    onClick={onOpenShowcase}
                    className="flex w-full items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 p-3 text-xs font-bold text-emerald-950 shadow-xs transition cursor-pointer dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="block font-black text-xs text-emerald-900 dark:text-emerald-200">
                          {tx(lang, 'See Pro Features & Accounting Capabilities', 'প্রো ফিচারস ও হিসাবের খুঁটিনাটি দেখুন')}
                        </span>
                        <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-normal">
                          {tx(lang, 'What calculations & modules this software manages', 'সফটওয়্যারে ঠিক কী কী হিসাব রাখতে পারবেন')}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-emerald-600 shrink-0" />
                  </button>
                )}

                {/* 2. Interactive Demo Registration (Name, Phone, Gmail) */}
                <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 text-xs font-medium">
                    <span className="text-base">⚡</span>
                    <div>
                      <span className="font-bold block text-xs">
                        {tx(lang, 'Want to Test Full Live Demo?', 'সম্পূর্ণ লাইভ ডেমো দেখতে চান?')}
                      </span>
                      <span className="text-[10px] text-amber-700 dark:text-amber-400">
                        {tx(lang, 'Requires Name, Phone & Gmail (Free)', 'নাম, ফোন ও জিমেইল দিয়ে ফ্রি ডেমো')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDemoModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-xs font-black shadow-xs transition cursor-pointer shrink-0"
                  >
                    <span>{tx(lang, 'Start Demo', 'ডেমো দেখুন')}</span>
                  </button>
                </div>

                {/* 3. Buy Pro Version CTA */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsBuyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>{tx(lang, 'Ready to buy? View Pro Packages & Activation ↗', 'সরাসরি কিনতে চান? প্রো প্যাকেজ ও পেমেন্ট দেখুন ↗')}</span>
                  </button>
                </div>

              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER STRIP */}
      <footer className="relative z-20 w-full bg-[#14532D] text-white py-2.5 px-4 shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 sm:gap-14 text-xs font-bold text-emerald-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{tx(lang, 'Secure & Reliable', 'নিরাপদ ও নির্ভরযোগ্য')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>{tx(lang, 'Fast Barcode Billing', 'সহজ ও দ্রুত বিলিং')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-cyan-400" />
            <span>{tx(lang, '24/7 Helpline: 01884700631', '২৪/৭ সাপোর্ট: 01884700631')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
