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
  Printer,
  Play,
  Pause,
  Volume2,
  Smartphone,
  ShoppingBag,
  Clock,
  Gift,
} from 'lucide-react';
import { tx } from '../lib/i18n';
import { useApp } from '../context/AppContext';
import { BuyProModal } from '../components/BuyProModal';
import { DemoAccessModal } from '../components/DemoAccessModal';

interface ShowcaseLandingPageProps {
  onBackToLogin: () => void;
  onOpenPortal: () => void;
  onOpenOnlineStore?: () => void;
  onOpenAdBuilder?: () => void;
}

export const ShowcaseLandingPage: React.FC<ShowcaseLandingPageProps> = ({
  onBackToLogin,
  onOpenPortal,
  onOpenOnlineStore,
  onOpenAdBuilder,
}) => {
  const { lang, setLang, darkMode, toggleDarkMode } = useApp();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-[#0B1120] dark:text-slate-100 font-sans">
      
      {/* Modals */}
      <BuyProModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      <DemoAccessModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/95 px-3 sm:px-6 lg:px-8 py-3 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
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
            {/* Online Storefront link */}
            {onOpenOnlineStore && (
              <button
                type="button"
                onClick={onOpenOnlineStore}
                className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                <span>অনলাইন শপ (ডেমো)</span>
              </button>
            )}

            {/* Ad Campaign Builder link */}
            {onOpenAdBuilder && (
              <button
                type="button"
                onClick={onOpenAdBuilder}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-900 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 transition cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>অ্যাড ল্যান্ডিং পেজ বিল্ডার</span>
              </button>
            )}

            {/* Language switcher */}
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setLang('EN')}
                className={`rounded-full px-2 py-1 transition cursor-pointer ${
                  lang === 'EN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('BN')}
                className={`rounded-full px-2 py-1 transition cursor-pointer ${
                  lang === 'BN'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                বাংলা
              </button>
            </div>

            {/* Dark mode */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Live Demo Trigger (Requires Name, Phone, Gmail) */}
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 text-xs font-black transition cursor-pointer dark:bg-amber-950/60 dark:text-amber-300"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>⚡ ফ্রি ডেমো টেস্ট</span>
            </button>

            {/* Buy Pro Button */}
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-1.5 text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>প্রো কিনুন</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden px-4 pt-8 pb-12 sm:px-6 lg:px-8 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-full max-w-5xl rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-900/10" />

        <div className="mx-auto max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-xs mb-4">
            <Store className="h-4 w-4 text-emerald-600" />
            <span>মুদির দোকান ও গ্রোসারি ব্যবসার পূর্ণাঙ্গ ডিজিটাল সলিউশন</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            কাগজের খাতার দিন শেষ—দোকানের প্রতিটি টাকার হিসাব এখন ১০০% নির্ভুল
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            আসল লাভ-লোকসান, ১,৩৫৯টি আসল পণ্যের ছবিসহ বারকোড বিলিং, কাস্টমার বাকি ও অটো এসএমএস তাগাদা, সাপ্লায়ার চালান এবং ক্যাশ ড্রয়ার—সবকিছু চলবে একটি মাত্র শক্তিশালী সিস্টেমে।
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-amber-500/25 transition cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              <span>৩ মিনিটে ফ্রি ডেমো দেখুন (নাম ও ফোন দিন) ⚡</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-emerald-700/25 transition cursor-pointer"
            >
              <Zap className="h-5 w-5" />
              <span>প্রো প্যাকেজ কিনুন (৫০% ছাড়)</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE VIDEO / WALKTHROUGH MOCKUP PLAYER */}
        <div className="mx-auto max-w-4xl mt-10 rounded-3xl border-2 border-emerald-500/30 bg-slate-900 p-2 sm:p-4 shadow-2xl relative overflow-hidden group">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center text-white">
            
            {/* Background simulated dashboard preview */}
            <img
              src="/features/dashboard.png"
              alt="Mudir Dokan Pro Walkthrough"
              className={`w-full h-full object-cover transition-all duration-700 ${
                isVideoPlaying ? 'opacity-90 scale-102' : 'opacity-40 filter blur-[1px]'
              }`}
            />

            {/* Overlay Play Controls */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] space-y-4 p-4 text-center">
              <button
                type="button"
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 hover:scale-110 transition-transform cursor-pointer"
              >
                {isVideoPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1 fill-white" />}
              </button>

              <div>
                <span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3 py-1 text-xs font-bold text-emerald-200">
                  {isVideoPlaying ? '▶️ সফটওয়্যার ওয়াকথ্রু প্লে হচ্ছে...' : 'ভিডিও ওয়াকথ্রু ও ডেমো প্রিভিউ'}
                </span>
                <h3 className="text-base sm:text-xl font-black mt-2">
                  কীভাবে মাত্র ১ সেকেন্ডে বারকোড বিল ও বাকির হিসাব রাখা যায়?
                </h3>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-slate-900/90 p-3 flex items-center justify-between text-xs font-mono text-emerald-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span>লাইভ ডেমো ভিডিও মোড</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-slate-400" />
                <span>HD 1080p · বাংলা ডেমো</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 10 CORE FEATURES WITH REAL SCREENSHOTS & DEEP DETAILS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ১০টি মূল ফিচার ও বাস্তব স্ক্রিনশট
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              সফটওয়্যারটির ভেতরে আপনি ঠিক কী কী হিসাব ও ফিচার পাবেন?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              বাংলাদেশের মুদি দোকানের বাস্তব প্রয়োজনের প্রতিটি ক্ষেত্র নিখুঁতভাবে তৈরি করা হয়েছে।
            </p>
          </div>

          <div className="space-y-12">
            
            {/* Feature 1: 1,359 Real SKUs Pre-loaded */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-[#F8FAF7] p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  ফিচার ১ · রেডি ক্যাটালগ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ১,৩৫৯টি আসল পণ্যের ফটো ডাটাবেজ (সব আগে থেকেই দেওয়া আছে)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  আপনাকে বসে বসে হাজার হাজার পণ্যের নাম টাইপ করতে হবে না বা ছবি তুলতে হবে না। তীর, প্রাণ, স্কয়ার, এসিআই, বসুন্ধরা, রূপচাঁদাসহ বাংলাদেশের মুদি দোকানের সব ব্র্যান্ড ও নন-ব্র্যান্ড পণ্যের আসল ছবি, সাইজ ও বারকোড আগে থেকেই রেডি করা আছে।
                </p>
                <div className="space-y-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>১,৩৫৯টি আসল পণ্যের হোয়াইট ব্যাকগ্রাউন্ড ফটো</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>অফিসিয়াল বারকোড স্ক্যান সাপোর্ট</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white dark:border-slate-700">
                <img
                  src="/features/products-catalog.png"
                  alt="1,359 Grocery SKUs Catalog"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Feature 2: Ultra-fast POS Billing */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 order-2 lg:order-1 rounded-2xl overflow-hidden border border-slate-200 shadow-md dark:border-slate-700">
                <img
                  src="/features/pos-screen.png"
                  alt="Fast POS Billing Screen"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-3">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                  ফিচার ২ · কাউন্টার পিওএস
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  দ্রুততম ভিজ্যুয়াল বারকোড পিওএস ও ক্যাশ কাউন্টার
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  পণ্য সিলেক্ট বা বারকোড স্ক্যান করলেই তাৎক্ষণিক কার্টে চলে যায়। প্রতিটি আইটেমের জন্য আলাদা ব্যাকগ্রাউন্ড ও বর্ডারসহ কার্ড যাতে ভুল না হয়। ইন্টারনেট চলে গেলেও কাউন্টার বিলিং সম্পূর্ণ সচল থাকে।
                </p>
                <div className="space-y-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>১ সেকেন্ডে বারকোড স্ক্যানিং ও বিলিং</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>১০০% অফলাইনে ফুল স্পিডে চলে</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Real Profit & Loss Engine */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-[#F8FAF7] p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  ফিচার ৩ · লাভ-লোকসান হিসাব
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  রিয়েল-টাইম আসল লাভ-লোকসান (কখনোই লস হবে না)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  ওয়েটেড এভারেজ কস্টিং (Weighted Average Cost) ফর্মুলায় প্রতিটি চালানের পাইকারি ক্রয়মূল্য ট্র্যাক করে। দিন শেষে মোট কত টাকার পণ্য বিক্রি হলো, কত টাকা কেনা খরচ ছিল এবং নিট কত লাভ হলো তা দশমিক পর্যন্ত নিখুঁত হিসাব দেয়।
                </p>
                <div className="space-y-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>প্রতিটি পণ্যের গ্রস প্রফিট ও মার্জিন</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>দৈনিক, সাপ্তাহিক ও মাসিক লাভ-ক্ষতির পূর্ণাঙ্গ রিপোর্ট</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white dark:border-slate-700">
                <img
                  src="/features/dashboard-profit.png"
                  alt="Real Profit and Loss Dashboard"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Feature 4: Digital Customer Khata & Dues Tracking */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 order-2 lg:order-1 rounded-2xl overflow-hidden border border-slate-200 shadow-md dark:border-slate-700">
                <img
                  src="/features/dashboard.png"
                  alt="Customer Due Khata Screen"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-3">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  ফিচার ৪ · বাকি খাতা
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  কার কত বাকি আছে এক ক্লিকে পরিষ্কার দেখা
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  কোন কাস্টমারের কাছে কত টাকা বকেয়া আছে, কতদিন ধরে বাকি এবং শেষ কবে কত টাকা জমা দিয়েছে তার ডিজিটাল খাতা। কাস্টমারভিত্তিক ক্রেডিট লিমিট সেট করা যায় যাতে নির্ধারিত টাকার বেশি বাকি না হতে পারে।
                </p>
                <div className="space-y-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>গ্রাহকের বাকি সীমা (Credit Limit) সেটআপ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600" />
                    <span>আংশিক কিস্তিতে জমা নেওয়ার সুবিধা</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 5: WhatsApp & SMS Reminder Automation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-[#F8FAF7] p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  ফিচার ৫ · অটো তাগাদা
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  ১-ক্লিকে হোয়াটসঅ্যাপ ও মোবাইলে মেসেজ তাগাদা
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  মুখে বাকি চাওয়ার অস্বস্তি থেকে মুক্তি! বোতাম চাপলেই কাস্টমারের মোবাইলে সম্মানজনক ভাষায় মোট বাকির পরিমাণ ও পরিশোধের লিঙ্কসহ মেসেজ চলে যায়।
                </p>
                <div className="space-y-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>অটোমেটিক বাংলা এসএমএস ও হোয়াটসঅ্যাপ তাগাদা</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>বাকির টাকা দ্রুত আদায়ের নিশ্চয়তা</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white p-4 text-center">
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-left font-mono text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    <span>গ্রাহকের হোয়াটসঅ্যাপে পাঠানো মেসেজ প্রিভিউ:</span>
                  </div>
                  <p className="pt-2">"আসসালামু আলাইকুম মো: আরিফ ভাই। শামীম গ্রোসারিতে আপনার বর্তমান বকেয়া বাকি ৳১,৪৫০ টাকা। অনুগ্রহপূর্বক বাকির টাকা পরিশোধ করে আমাদের সেবা অব্যাহত রাখুন। ধন্যবাদ।"</p>
                </div>
              </div>
            </div>

            {/* Feature 6: Customer Self-Service Portal */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                  ফিচার ৬ · কাস্টমার পোর্টাল
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  কাস্টমার নিজে তার মোবাইল দিয়ে বাকি ও মেমো দেখতে পারবে
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  গ্রাহক তার নিজস্ব মোবাইল নম্বর দিয়ে লগইন করে ঘরে বসেই দেখতে পারবে সে কবে কোন পণ্য কিনেছে, কত টাকা বাকি আছে এবং কত টাকা জমা হয়েছে। ফলে কোনো ভুল বোঝাবুঝি বা হিসাব নিয়ে তর্কাতর্কি হওয়ার সুযোগ থাকে না।
                </p>
                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-100 cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>কাস্টমার পোর্টাল লাইভ দেখুন ↗</span>
                </button>
              </div>
              <div className="lg:col-span-6 rounded-2xl border border-purple-200 bg-purple-50/50 p-6 text-center space-y-3">
                <Smartphone className="h-12 w-12 text-purple-600 mx-auto" />
                <h4 className="font-black text-sm text-purple-950">গ্রাহকের নিজস্ব ডিজিটাল স্টেটমেন্ট</h4>
                <p className="text-xs text-purple-800 max-w-sm mx-auto">
                  প্রতিটি বিক্রির ডিজিটাল ইনভয়েস রসিদ গ্রাহকের ফোনে সংরক্ষিত থাকে।
                </p>
              </div>
            </div>

            {/* Feature 7: Online Store & eCommerce (GhorerBazar Style) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-[#F8FAF7] p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  ফিচার ৭ · অনলাইন শপ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  অনলাইন অর্ডার ও শপিং কার্ট (ঠিক যেমন ghorerbazar.com)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  আপনার মুদির দোকানের জন্য তৈরি নিজস্ব অনলাইন স্টোর! এলাকার কাস্টমাররা ঘরে বসে মোবাইল দিয়ে পণ্য কার্টে অ্যাড করতে পারবে এবং ক্যাশ অন ডেলিভারিতে সরাসরি অর্ডার দিতে পারবে।
                </p>
                {onOpenOnlineStore && (
                  <button
                    type="button"
                    onClick={onOpenOnlineStore}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-xs font-black shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>অনলাইন শপ ডেমো ওপেন করুন ↗</span>
                  </button>
                )}
              </div>
              <div className="lg:col-span-6 rounded-2xl border border-amber-300 bg-amber-50/60 p-6 text-center space-y-3">
                <Truck className="h-12 w-12 text-amber-600 mx-auto" />
                <h4 className="font-black text-sm text-amber-950">হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি</h4>
                <p className="text-xs text-amber-800 max-w-sm mx-auto">
                  অর্ডার আসার সাথে সাথে দোকানদারের মোবাইলে নোটিফিকেশন চলে আসে।
                </p>
              </div>
            </div>

            {/* Feature 8: Thermal Receipt Printing */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  ফিচার ৮ · প্রিন্ট মেমো
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  থার্মাল প্রিন্টারে প্রফেশনাল মেমো প্রিন্ট (58mm ও 80mm)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  যে কোনো সাধারণ ব্লুটুথ বা ইউএসবি থার্মাল প্রিন্টারে ১ সেকেন্ডে দোকানের নাম, ঠিকানা, পণ্য তালিকা ও কিউআর কোডসহ পরিষ্কার মেমো প্রিন্ট হয়।
                </p>
              </div>
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center space-y-2">
                <Printer className="h-12 w-12 text-slate-700 mx-auto" />
                <h4 className="font-bold text-xs">58mm & 80mm POS Thermal Receipt</h4>
                <p className="text-[11px] text-slate-500">কালির খরচ ছাড়া দ্রুততম প্রিন্টিং সুবিধা</p>
              </div>
            </div>

            {/* Feature 9: Supplier & Wholesaler Khata */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-[#F8FAF7] p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                  ফিচার ৯ · মহাজন খাতা
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  কোম্পানি চালান ও সাপ্লায়ার দেনার হিসাব
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  ইউনিলিভার, স্কয়ার, এসিআই, মেঘনা বা পাইকারি মহাজনদের কোন চালানে কত টাকার মালামাল আসলো, কত টাকা দেওয়া হলো এবং কত টাকা বাকি আছে তার আলাদা খাতা।
                </p>
              </div>
              <div className="lg:col-span-6 rounded-2xl border border-purple-200 bg-purple-50/50 p-6 text-center space-y-2">
                <Package className="h-12 w-12 text-purple-600 mx-auto" />
                <h4 className="font-bold text-xs">সাপ্লায়ার পেমেন্ট ও ইনভয়েস ট্র্যাকিং</h4>
                <p className="text-[11px] text-slate-500">মহাজনদের দেনা নিয়ে আর কোনো ভুল বোঝাবুঝি নয়</p>
              </div>
            </div>

            {/* Feature 10: Stock Alert & Cash Drawer Reconciliation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="lg:col-span-6 space-y-3">
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                  ফিচার ১০ · ড্রয়ার ও স্টক
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  স্টক শেষ হওয়ার পূর্বে সতর্কতা ও ক্যাশ ড্রয়ার মেলানো
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  কোন মালামাল ফুরিয়ে যাচ্ছে আগেই নোটিফিকেশন পাবেন। দিন শেষে দোকানের ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন খরচ বাদ দিয়ে ক্যাশ ড্রয়ারের নগদ টাকার সাথে সফটওয়্যারের হিসাব হুবহু মিলে যাবে।
                </p>
              </div>
              <div className="lg:col-span-6 rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center space-y-2">
                <DollarSign className="h-12 w-12 text-rose-600 mx-auto" />
                <h4 className="font-bold text-xs">প্রতি রাতে ক্যাশ ড্রয়ার রিকনসিলিয়েশন</h4>
                <p className="text-[11px] text-slate-500">দোকানের প্রতিটি টাকার সঠিক হিসাব নিশ্চিত</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* PRICING & BUY PRO SECTION: EXACTLY 3 REVISED PACKAGES */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-emerald-50/30 to-white dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-900">
        <div className="mx-auto max-w-6xl text-center">
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300 mb-3 animate-pulse">
            <Zap className="h-3.5 w-3.5 text-rose-600" />
            <span>সীমিত সময়ের স্পেশাল ডিসকাউন্ট অফার</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            আপনার সুবিধাজনক প্যাকেজ বেছে নিন
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            বিকাশ বা নগদ-এ পেমেন্ট করুন 01884700631 নম্বরে • সাথে সাথে অ্যাক্টিভেশন • ফ্রি সাপোর্ট
          </p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Package 1: Monthly (50% Off: 1000 -> 499) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    ৫০% মেগা ছাড় 🔥
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">১ মাসের জন্য</span>
                </div>

                <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">১ মাস সাবস্ক্রিপশন</h3>
                
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">৳৪৯৯</span>
                  <span className="text-xs text-slate-500">/মাস</span>
                  <span className="font-mono text-xs line-through text-slate-400">রেগুলার ৳১,০০০</span>
                </div>

                <p className="mt-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  রেগুলার ১,০০০৳ — ৫০% ছাড়ে মাত্র ৪৯৯৳!
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>ফাস্ট বারকোড পিওএস ও প্রিন্টিং</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>ডিজিটাল বাকি খাতা ও এসএমএস তাগাদা</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>অফলাইন ক্যাশ কাউন্টার ও ড্রয়ার মেলানো</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setIsBuyModalOpen(true)}
                className="mt-6 w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-2.5 text-xs font-black text-emerald-900 hover:bg-emerald-100 transition cursor-pointer"
              >
                ১ মাসের প্যাকেজ কিনুন (৳৪৯৯) ⚡
              </button>
            </div>

            {/* Package 2: Yearly Super Saver (10,000 -> 5,988 -> 299/mo = 3,588) */}
            <div className="relative rounded-3xl border-2 border-emerald-500 bg-white p-6 shadow-xl dark:border-emerald-500 dark:bg-slate-900 flex flex-col justify-between ring-4 ring-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-1 text-[11px] font-black text-white shadow-md">
                ⭐ সেরা সেভার (মাসে ২০০৳ সেভ!)
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    বিগ সেভ অফার 🎉
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">পূর্ণ ১ বছর</span>
                </div>

                <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">১ বছর মেগা সেভার</h3>
                
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">৳৩,৫৮৮</span>
                  <span className="text-xs text-slate-500">/বছর</span>
                  <span className="text-xs font-black text-emerald-700">(মাত্র ৳২৯৯/মাস)</span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="line-through">রেগুলার ৳১০,০০০</span>
                  <span className="line-through text-rose-500">১২ মাসে ৪৯৯ করে ৳৫,৯৮৮</span>
                </div>

                <p className="mt-1 text-xs font-black text-rose-600 dark:text-rose-400">
                  বছরে মোট ৳৬,৪১২ টাকা মেগা সেভ!
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
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
                    <span>দোকানের ফ্রি অনলাইন সাবডোমেন</span>
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
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 text-xs sm:text-sm font-black text-white hover:from-emerald-700 shadow-md shadow-emerald-600/30 transition cursor-pointer"
              >
                বাৎসরিক প্যাকেজ কিনুন (৳৩,৫৮৮) ⚡
              </button>
            </div>

            {/* Package 3: Custom Domain VIP (10,000 first year, 6,000 renewal) */}
            <div className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm dark:border-indigo-900/60 dark:bg-slate-900 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    👑 কাস্টম ডোমেন ভিআইপি
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600">নিজস্ব .com ডোমেন</span>
                </div>

                <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">হাই-স্পিড ডোমেন + ক্লাউড</h3>
                
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-black text-indigo-700 dark:text-indigo-400">৳১০,০০০</span>
                  <span className="text-xs text-slate-500">১ম বছর</span>
                  <span className="font-mono text-xs line-through text-slate-400">রেগুলার ৳১৬,০০০</span>
                </div>

                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  রিনিউয়াল ফি: মাত্র ৳৬,০০০ / বছর
                </p>

                <p className="mt-1 text-xs text-indigo-900 dark:text-indigo-300 leading-snug">
                  💡 বাজারে ডোমেন ও হাই-স্পিড ক্লাউড হোস্টিং নিতেই বছরে ৫,০০০-৬,০০০৳ চলে যায়। এখানে সফটওয়্যারসহ ফুল সেটআপ অন্তর্ভুক্ত!
                </p>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>নিজস্ব .com ডোমেন (যেমন: yourshop.com)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>হাই-স্পিড ডেডিকেটেড ক্লাউড হোস্টিং</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>সম্পূর্ণ অটোমেটিক ক্লাউড ব্যাকআপ</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>ব্যক্তিগত ট্রেনিং ও ভিআইপি অনবোর্ডিং</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setIsBuyModalOpen(true)}
                className="mt-6 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
              >
                কাস্টম ডোমেন ভিআইপি কিনুন (৳১০,০০০) 👑
              </button>
            </div>

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
