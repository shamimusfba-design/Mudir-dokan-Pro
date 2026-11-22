import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  Zap,
  Store,
  Phone,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Truck,
  CreditCard,
  BarChart3,
  HelpCircle,
  MessageCircle,
  Globe,
  Headphones,
  Laptop,
  Check,
  Sun,
  Moon,
  ArrowLeft,
} from 'lucide-react';
import { tx } from '../lib/i18n';
import { useApp } from '../context/AppContext';
import { BuyProModal } from '../components/BuyProModal';
import { DemoAccessModal } from '../components/DemoAccessModal';

interface ShowcaseLandingPageProps {
  onBackToLogin: () => void;
  onOpenPortal: () => void;
}

export const ShowcaseLandingPage: React.FC<ShowcaseLandingPageProps> = ({
  onBackToLogin,
  onOpenPortal,
}) => {
  const { lang, setLang, darkMode, toggleDarkMode } = useApp();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-[#0B1120] dark:text-slate-100 font-sans">
      
      {/* Modals */}
      <BuyProModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      <DemoAccessModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-900/95 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{tx(lang, 'Back to Login', 'লগইনে ফিরুন')}</span>
            </button>
            <img
              src="/mudi-dokan-pro-logo.png"
              alt="Mudi Dokan Pro"
              className="h-9 sm:h-11 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language switcher */}
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setLang('EN')}
                className={`rounded-full px-2.5 py-1 transition cursor-pointer ${
                  lang === 'EN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('BN')}
                className={`rounded-full px-2.5 py-1 transition cursor-pointer ${
                  lang === 'BN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Live Demo Trigger */}
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3.5 py-1.5 text-xs font-black transition cursor-pointer dark:bg-amber-950/60 dark:text-amber-300"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>{tx(lang, '⚡ Free Live Demo', '⚡ ফ্রি লাইভ ডেমো')}</span>
            </button>

            {/* Buy Pro Button */}
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2 text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>{tx(lang, 'Buy Pro Version', 'প্রো ভার্সন কিনুন')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-full max-w-5xl rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-900/10" />

        <div className="mx-auto max-w-5xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-xs mb-5">
            <Store className="h-4 w-4 text-emerald-600" />
            <span>
              {tx(
                lang,
                'Smart POS & Business Intelligence Built for Bangladesh Retail',
                'বাংলাদেশের রিটেইল ও মুদি দোকানের জন্য সেরা স্মার্ট বিজনেস সলিউশন'
              )}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            {tx(
              lang,
              'End the Paper Khata Era. Every Single Taka Accounted For.',
              'কাগজের খাতার দিন শেষ—দোকানের প্রতিটি টাকার হিসাব এখন ১০০% নিখুঁত।'
            )}
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            {tx(
              lang,
              'Live profit & loss, 1,359 verified FMCG products with official photos, customer due tracking with instant WhatsApp/SMS, supplier invoices & offline counter billing—everything running seamlessly in one powerful software.',
              'আসল লাভ-লোকসান, ১,৩৫৯টি আসল পণ্যের ফটো লাইব্রেরি, বারকোড স্ক্যানার, কাস্টমার বাকি ও স্বয়ংক্রিয় এসএমএস, সাপ্লায়ার চালান এবং ক্যাশ ড্রয়ার—সবকিছু চলবে একটি মাত্র নির্ভরযোগ্য সিস্টেমে।'
            )}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-amber-500/25 transition cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              <span>{tx(lang, 'View Full Live Demo (Free)', 'বিনামূল্যে লাইভ ডেমো দেখুন ⚡')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-emerald-700/25 transition cursor-pointer"
            >
              <Zap className="h-5 w-5" />
              <span>{tx(lang, 'Get Mudir Dokan Pro Today', 'আজই প্রো ভার্সন কিনুন')}</span>
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Instant access with Name, Phone & Gmail • No credit card required • 1,359 items pre-loaded',
              'নাম, ফোন ও জিমেইল দিয়েই তাৎক্ষণিক এক্সেস • কোনো কার্ডের দরকার নেই • ১,৩৫৯টি পণ্য রেডি'
            )}
          </p>
        </div>

        {/* Hero Visual Preview */}
        <div className="mx-auto max-w-5xl mt-10 rounded-3xl border border-emerald-100 bg-white p-2 sm:p-4 shadow-2xl shadow-emerald-950/10 dark:border-slate-800 dark:bg-slate-900">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src="/hero-full-left.jpg"
              alt="Mudir Dokan Pro Preview"
              className="w-full h-auto object-cover rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES & ACCOUNTING MODULES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {tx(
                lang,
                'Everything You Can Track & Calculate with Mudir Dokan Pro',
                'মুদির দোকান প্রো দিয়ে আপনি ঠিক কী কী হিসাব রাখতে পারবেন?'
              )}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              {tx(
                lang,
                'Designed directly with grocery retailers across Bangladesh to eliminate daily ledger chaos.',
                'বাংলাদেশের বাস্তব মুদি দোকানের প্রতিটি হিসাবের সূক্ষ্ম সমস্যা সমাধান করতে এটি বিশেষভাবে তৈরি।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* 1. Real Profit & Loss */}
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-6 dark:border-emerald-950/50 dark:bg-slate-900 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tx(lang, '1. Live Profit & Gross Margin Engine', '১. আসল লাভ-লোকসান ও মার্জিন হিসাব')}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {tx(
                  lang,
                  'Weighted Average Cost algorithm automatically tracks your true purchase cost versus selling price. Know exactly how many Takas profit you made today, this week, and this month down to the paisa.',
                  'ওয়েটেড এভারেজ কস্টিং ফর্মুলায় প্রতিটি পণ্যের পাইকারি কেনা দাম ও বিক্রয়মূল্যের পার্থক্য রিয়েল-টাইমে হিসাব হয়। দিন শেষে কত টাকা মাল বিক্রি হলো এবং পকেটে কত টাকা আসল লাভ থাকলো তা এক সেকেন্ডে দেখুন।'
                )}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{tx(lang, 'Daily, Weekly & Monthly P&L Reports', 'দৈনিক, সাপ্তাহিক ও মাসিক লাভ-ক্ষতির খাতা')}</span>
              </div>
            </div>

            {/* 2. Visual POS with 1,359 Items */}
            <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-6 dark:border-blue-950/50 dark:bg-slate-900 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/30 mb-4">
                <Store className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tx(lang, '2. 1,359 Real Bangladeshi Grocery SKUs', '২. ১,৩৫৯টি আসল পণ্যের ভিজ্যুয়াল ক্যাটালগ')}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {tx(
                  lang,
                  'No tedious data entry! Includes Pran, ACI, Square, Unilever, Teer, Bashundhara, fresh produce, and spices with verified product photos and official barcodes pre-configured.',
                  'আপনাকে বসে বসে হাজার হাজার পণ্যের নাম বা ছবি তুলতে হবে না। প্রাণ, স্কয়ার, এসিআই, তীর, বসুন্ধরাসহ বাংলাদেশের জনপ্রিয় সব পণ্যের আসল স্টুডিও ছবি, সঠিক সাইজ ও বারকোড আগে থেকেই যুক্ত আছে।'
                )}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{tx(lang, 'Barcode Scanner & Fast Visual Grid', 'বারকোড স্ক্যানার ও ফটো গ্রিড বিলিং')}</span>
              </div>
            </div>

            {/* 3. Customer Due Khata & Portal */}
            <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-6 dark:border-amber-950/50 dark:bg-slate-900 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-600/30 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tx(lang, '3. Customer Digital Khata & SMS', '৩. গ্রাহকের ডিজিটাল বাকি খাতা ও এসএমএস')}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {tx(
                  lang,
                  'Manage customer credit limits, multi-invoice partial payments, and overdue aging. Automatically send WhatsApp/SMS balance reminders and let customers view their digital ledger online.',
                  'কোন কাস্টমারের কাছে কত টাকা বাকি, কবে কত টাকা জমা দিয়েছে তার ডিজিটাল হিসাব। এক ক্লিকে গ্রাহকের মোবাইলে সুন্দর এসএমএস/হোয়াটসঅ্যাপ তাগাদা পাঠানো যায় এবং গ্রাহক তার ব্যালেন্স অনলাইনে চেক করতে পারে।'
                )}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{tx(lang, 'Zero Bad Debt with Smart Credit Limits', 'বাকি তোলার ঝামেলা নেই • লিমিট সেট')}</span>
              </div>
            </div>

            {/* 4. Supplier Khata & Invoices */}
            <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-6 dark:border-purple-950/50 dark:bg-slate-900 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/30 mb-4">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tx(lang, '4. Supplier & Company Ledger', '৪. সাপ্লায়ার ও কোম্পানি চালান খাতা')}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {tx(
                  lang,
                  'Track delivery invoices from FMCG distributors and wholesalers. Record payments made, pending dues to suppliers, and auto-update inventory when new stock arrives.',
                  'কোন কোম্পানির কত টাকার চালান আসলো, মহাজনকে কত টাকা দিয়েছেন আর কত বাকি আছে তার পরিষ্কার রেকর্ড। নতুন মাল দোকানে ঢুকলে সাথে সাথে ইনভেন্টরি ও ক্রয়মূল্য আপডেট হয়ে যায়।'
                )}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{tx(lang, 'Full Supplier Payment History', 'ডিলার ও মহাজনদের দেনার নিখুঁত হিসাব')}</span>
              </div>
            </div>

            {/* 5. Smart Stock & Expiry Alerts */}
            <div className="rounded-3xl border border-rose-100 bg-rose-50/40 p-6 dark:border-rose-950/50 dark:bg-slate-900 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/30 mb-4">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tx(lang, '5. Stock Shortage & Expiry Alerts', '৫. পণ্য শেষের সতর্কতা ও এক্সপায়ারি ট্র্যাকিং')}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {tx(
                  lang,
                  'Never tell a customer "mal shesh"! Automatic alerts pop up before products run out. Track shelf-life, batch expiry dates, and damaged products to avoid unrecorded stock loss.',
                  'কাস্টমার দোকানে এসে "মাল নাই" শুনে ফিরে যাবে না। চিনি, তেল বা চাল ফুরিয়ে যাওয়ার আগেই সফটওয়্যার আপনাকে নোটিফিকেশন দেবে। মেয়াদোত্তীর্ণ ও নষ্ট পণ্যের ক্ষতির হিসাব আলাদা থাকবে।'
                )}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{tx(lang, 'Prevent Loss & Theft in Shop', 'দোকানের মালামাল গরমিল ও চুরি প্রতিরোধ')}</span>
              </div>
            </div>

            {/* 6. Daily Expense & Cash Drawer */}
            <div className="rounded-3xl border border-teal-100 bg-teal-50/40 p-6 dark:border-teal-950/50 dark:bg-slate-900 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md shadow-teal-600/30 mb-4">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {tx(lang, '6. Daily Expenses & Cash Drawer Balance', '৬. দোকান খরচ ও ক্যাশ ড্রয়ার হিসাব')}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {tx(
                  lang,
                  'Record shop rent, employee salaries, electricity bills, and tea/snacks. At the end of the day, reconcile collected cash with drawer physical cash so not a single Taka is missing.',
                  'দোকানের ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন ও নাস্তার দৈনন্দিন খরচ আলাদা খাতায় এন্ট্রি হবে। দিন শেষে ক্যাশ ড্রয়ারের আসল নগদ টাকার সাথে সফটওয়্যারের হিসাব হুবহু মিলে যাবে।'
                )}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{tx(lang, 'Total Cash Reconciliation Every Night', 'প্রতি রাতে ড্রয়ারের টাকার নিখুঁত হিসাব')}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* WHY UPGRADE: COMPARISON TABLE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {tx(
                lang,
                'Traditional Paper Khata vs. Mudir Dokan Pro',
                'কাগজের খাতা বনাম মুদির দোকান প্রো'
              )}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {tx(
                lang,
                'Why thousands of shopkeepers are switching to digital intelligence',
                'কেন আধুনিক দোকানদাররা খাতা ফেলে সফটওয়্যার ব্যবহার করছেন?'
              )}
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-100/80 p-4 text-xs font-black dark:border-slate-800 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <div className="col-span-5 sm:col-span-4">{tx(lang, 'Feature / Operation', 'হিসাবের ধরণ')}</div>
              <div className="col-span-3 sm:col-span-4 text-rose-600 dark:text-rose-400">{tx(lang, 'Manual Paper Khata', 'কাগজের খাতা')}</div>
              <div className="col-span-4 sm:col-span-4 text-emerald-600 dark:text-emerald-400">{tx(lang, 'Mudir Dokan Pro', 'মুদির দোকান প্রো')}</div>
            </div>

            {[
              {
                feature: 'লাভের সঠিক হিসাব',
                manual: 'অনুমান নির্ভর, আসল লাভ জানা যায় না',
                pro: 'প্রতিটি পণ্যের কেনা-বেচার রিয়েল লাভ',
              },
              {
                feature: 'ক্যাটালগ ও বারকোড',
                manual: 'হাতে লিখে বিল, দাম মনে রাখতে হয়',
                pro: '১,৩৫৯টি আইটেমের ছবি ও বারকোড রেডি',
              },
              {
                feature: 'বাকি টাকা আদায়',
                manual: 'ভুলে যাওয়ার ভয়, গ্রাহকের সাথে ভুল বোঝাবুঝি',
                pro: 'স্বয়ংক্রিয় এসএমএস তাগাদা ও অনলাইন খাতা',
              },
              {
                feature: 'ডাটা নিরাপত্তা',
                manual: 'খাতা ছিঁড়ে যাওয়া, ভেজা বা হারানোর ভয়',
                pro: '১০০% নিরাপদ অফলাইন ও ক্লাউড অটো ব্যাকআপ',
              },
              {
                feature: 'ইন্টারনেট সমস্যা',
                manual: 'কোন সুবিধা নেই',
                pro: 'অফলাইনে বিদ্যুৎ/নেট ছাড়াও ফুল স্পিডে চলে',
              },
              {
                feature: 'স্টক ফুরিয়ে যাওয়া',
                manual: 'কাস্টমার এসে ফিরে গেলে তবেই বোঝা যায়',
                pro: 'মাল শেষের আগেই স্ক্রিনে অটো নোটিফিকেশন',
              },
            ].map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 border-b border-slate-100 p-3.5 text-xs sm:text-sm items-center dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
              >
                <div className="col-span-5 sm:col-span-4 font-bold text-slate-900 dark:text-white">
                  {row.feature}
                </div>
                <div className="col-span-3 sm:col-span-4 flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{row.manual}</span>
                </div>
                <div className="col-span-4 sm:col-span-4 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{row.pro}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING & BUY PRO SECTION: EXACTLY 2 PACKAGES (MONTHLY 499 & YEARLY 4999) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-900">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300 mb-3 animate-pulse">
            <Zap className="h-3.5 w-3.5 text-rose-600" />
            <span>{tx(lang, 'Limited Time 50% Mega Discount Offer', 'সীমিত সময়ের ৫০% মেগা ডিসকাউন্ট অফার')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            {tx(lang, 'Simple, Transparent & Discounted Pricing', 'সহজ, সাশ্রয়ী ও ডিসকাউন্ট প্যাকেজ')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {tx(
              lang,
              'Pay securely via bKash / Nagad to 01884700631 • Instant store activation • No hidden charges',
              'বিকাশ বা নগদ-এ পেমেন্ট করুন 01884700631 নম্বরে • সাথে সাথে এক্টিভেশন • কোনো লুকানো চার্জ নেই'
            )}
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
            
            {/* Package 1: Monthly (50% Off: 1000 -> 499) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    ৫০% মেগা ডিসকাউন্ট 🔥
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">১ মাসের জন্য</span>
                </div>

                <h3 className="mt-3 text-xl font-black text-slate-900 dark:text-white">মাসিক সাবস্ক্রিপশন</h3>
                
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-black text-emerald-700 dark:text-emerald-400">৳৪৯৯</span>
                  <span className="text-xs text-slate-500">/মাস</span>
                  <span className="font-mono text-sm line-through text-slate-400 dark:text-slate-500">রেগুলার ৳১,০০০</span>
                </div>

                <p className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                  রেগুলার ১,০০০ টাকার প্যাকেজ মাত্র ৪৯৯ টাকায়!
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>ফাস্ট ভিজ্যুয়াল বারকোড পিওএস</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>ডিজিটাল বাকি খাতা ও এসএমএস তাগাদা</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>দৈনিক খরচ ও ক্যাশ ড্রয়ার হিসাব</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>অফলাইন-ফার্স্ট ক্যাশ কাউন্টার</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setIsBuyModalOpen(true)}
                className="mt-8 w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50/80 py-3 text-xs sm:text-sm font-black text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition cursor-pointer"
              >
                ১ মাসের প্যাকেজ কিনুন (৳৪৯৯) ⚡
              </button>
            </div>

            {/* Package 2: Yearly (Mega Saver: 12000 -> 4999) */}
            <div className="relative rounded-3xl border-2 border-emerald-500 bg-white p-6 sm:p-7 shadow-xl dark:border-emerald-500 dark:bg-slate-900 flex flex-col justify-between ring-4 ring-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-1 text-[11px] font-black text-white shadow-md">
                সেরা সাশ্রয়ী পছন্দ ⭐
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    ৫৮% মেগা সেভিংস 🎉
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">পূর্ণ ১ বছর</span>
                </div>

                <h3 className="mt-3 text-xl font-black text-slate-900 dark:text-white">বাৎসরিক মেগা অফার</h3>
                
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-black text-emerald-700 dark:text-emerald-400">৳৪,৯৯৯</span>
                  <span className="text-xs text-slate-500">/বছর</span>
                  <span className="font-mono text-sm line-through text-slate-400 dark:text-slate-500">রেগুলার ৳১২,০০০</span>
                </div>

                <p className="mt-2 text-xs font-black text-rose-600 dark:text-rose-400">
                  ১ বছরের জন্য ১২,০০০ টাকারটা মাত্র ৫,০০০ টাকা (৳৪,৯৯৯)!
                </p>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>পূর্ণ ১ বছরের আনলিমিটেড লাইসেন্স</span>
                  </li>
                  <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>সব প্রো ফিচার ও আপডেট সম্পূর্ণ ফ্রি</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>১,৩৫৯টি আসল পণ্যের ফটো ডাটাবেজ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>দোকানের ফ্রি অনলাইন সাবডোমেন</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>লাইফটাইম সিকিউর ক্লাউড ব্যাকআপ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>২৪/৭ ভিআইপি হোয়াটসঅ্যাপ সাপোর্ট</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setIsBuyModalOpen(true)}
                className="mt-8 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3.5 text-xs sm:text-sm font-black text-white hover:from-emerald-700 hover:to-teal-800 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                বাৎসরিক মেগা অফার কিনুন (৳৪,৯৯৯) ⚡
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-[#14532D] text-white">
        <div className="mx-auto max-w-4xl text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-black">
            {tx(
              lang,
              'Ready to Transform Your Grocery Store Today?',
              'আজই আপনার মুদি দোকানকে ডিজিটাল ও লাভজনক করে তুলুন'
            )}
          </h2>
          <p className="text-xs sm:text-base text-emerald-100 max-w-2xl mx-auto">
            {tx(
              lang,
              'Join successful grocery retailers running smooth, dispute-free businesses across Bangladesh.',
              'বাকি আদায়ের ঝামেলা ছাড়া, নির্ভুল লাভে এবং আধুনিক কায়দায় দোকান পরিচালনা করুন।'
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition cursor-pointer"
            >
              বিনামূল্যে ডেমো টেস্ট করুন ⚡
            </button>
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 px-6 py-3 text-xs sm:text-sm font-black shadow-lg transition cursor-pointer"
            >
              প্রো প্যাকেজ অ্যাক্টিভ করুন 🛒
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 dark:border-slate-800 dark:bg-slate-950 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Mudir Dokan Pro — Smart Grocery Business Solution.</p>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>হেল্পলাইন: 01884700631</span>
            <button type="button" onClick={onOpenPortal} className="hover:text-emerald-600">
              কাস্টমার পোর্টাল
            </button>
            <button type="button" onClick={onBackToLogin} className="hover:text-emerald-600">
              দোকানদার লগইন
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
