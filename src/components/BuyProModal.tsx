import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  CreditCard,
  Globe,
  Sparkles,
  ShieldCheck,
  Zap,
  Phone,
  MessageCircle,
  Store,
  User,
  Copy,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  Clock,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { tx } from '../lib/i18n';
import { useApp } from '../context/AppContext';

interface BuyProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyProModal: React.FC<BuyProModalProps> = ({ isOpen, onClose }) => {
  const { lang, loginAsOwner } = useApp();

  // 3 Packages (Monthly 499, Yearly 299/mo -> 3,588, Custom Domain & Demand 15,000)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'custom_vip'>('yearly');

  // Store & Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [customSubdomain, setCustomSubdomain] = useState('');

  // In-App Custom Domain Checker (NEVER LEAVE SITE)
  const [enableCustomDomain, setEnableCustomDomain] = useState(false);
  const [customDomainName, setCustomDomainName] = useState('');
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainCheckResult, setDomainCheckResult] = useState<{
    domain: string;
    status: 'available' | 'taken' | 'idle';
    message: string;
  }>({ domain: '', status: 'idle', message: '' });

  // Payment
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Auto-generate subdomain slug from store name
  const effectiveSubdomain = useMemo(() => {
    if (customSubdomain.trim()) {
      return customSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    }
    const clean = storeName
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    return clean || 'shamimgrocery';
  }, [storeName, customSubdomain]);

  if (!isOpen) return null;

  const currentPrice =
    selectedPlan === 'monthly' ? 499 : selectedPlan === 'yearly' ? 3588 : 15000;
  const regularPrice =
    selectedPlan === 'monthly' ? 1000 : selectedPlan === 'yearly' ? 12000 : 25000;
  const planLabel =
    selectedPlan === 'monthly'
      ? '১ মাস সাবস্ক্রিপশন (৳৪৯৯)'
      : selectedPlan === 'yearly'
        ? '১ বছর বাৎসরিক মেগা অফার (মাসে মাত্র ৳২৯৯ হিসেবে ৳৩,৫৮৮ - নো ডোমেন ও হোস্টিং ফি)'
        : 'কাস্টম ডোমেন ও ক্লায়েন্ট ডিমান্ড ভিআইপি (৳১৫,০০০ - Including All)';

  // Copy bKash/Nagad Number
  const handleCopyNumber = () => {
    navigator.clipboard.writeText('01884700631');
    setCopiedNumber(true);
    toast.success(tx(lang, 'bKash/Nagad number copied: 01884700631', 'বিকাশ/নগদ নম্বর কপি হয়েছে: 01884700631'));
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  // In-App Domain Availability Checker (Google DNS over HTTPS)
  const handleCheckDomainInApp = async () => {
    let clean = customDomainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) {
      clean = `${effectiveSubdomain}.com`;
      setCustomDomainName(clean);
    }
    if (!clean.includes('.')) {
      clean = `${clean}.com`;
      setCustomDomainName(clean);
    }

    setCheckingDomain(true);
    setDomainCheckResult({ domain: clean, status: 'idle', message: 'ডোমেন চেক করা হচ্ছে...' });

    try {
      // Query DNS A records via Google DoH
      const resA = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(clean)}&type=A`);
      const dataA = await resA.json();

      // Query DNS NS records
      const resNS = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(clean)}&type=NS`);
      const dataNS = await resNS.json();

      const hasA = dataA.Status === 0 && dataA.Answer && dataA.Answer.length > 0;
      const hasNS = dataNS.Status === 0 && dataNS.Answer && dataNS.Answer.length > 0;

      if (hasA || hasNS) {
        setDomainCheckResult({
          domain: clean,
          status: 'taken',
          message: `⚠️ "${clean}" ইতিমধ্যে নিবন্ধিত। অন্য নাম দিন (যেমন: ${clean.replace('.com', '')}bazar.com বা ${clean.replace('.com', '')}store.com)।`,
        });
      } else {
        setDomainCheckResult({
          domain: clean,
          status: 'available',
          message: `🎉 অভিনন্দন! "${clean}" সম্পূর্ণ খালি আছে! প্রো সাবস্ক্রিপশন নিলে আমরাই এটি আপনার নামে কিনে সফটওয়্যারের সাথে সেটআপ করে দেব।`,
        });
      }
    } catch {
      // Offline fallback
      setDomainCheckResult({
        domain: clean,
        status: 'available',
        message: `✅ "${clean}" ডোমেনটি আপনার অর্ডারে যুক্ত করা হয়েছে। আমরাই এটি আপনার জন্য ভেরিফাই করে সেটআপ করে দেব।`,
      });
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleRegisterStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) {
      toast.error(tx(lang, 'Please enter owner name', 'দোকানদারের নাম লিখুন'));
      return;
    }
    if (!regPhone.trim()) {
      toast.error(tx(lang, 'Please enter mobile number', 'মোবাইল নম্বর লিখুন'));
      return;
    }
    if (!storeName.trim()) {
      toast.error(tx(lang, 'Please enter store name', 'দোকানের নাম লিখুন'));
      return;
    }
    if (!trxId.trim()) {
      toast.error(tx(lang, 'Please enter bKash/Nagad TrxID after payment', 'পেমেন্টের পর বিকাশ/নগদ TrxID নম্বর দিন'));
      return;
    }

    const newStore = {
      name: ownerName.trim(),
      phone: regPhone.trim(),
      storeName: storeName.trim(),
      address: storeAddress.trim(),
      subdomain: effectiveSubdomain,
      customDomain: enableCustomDomain && customDomainName.trim() ? customDomainName.trim() : null,
      plan: selectedPlan,
      price: currentPrice,
      trxId: trxId.trim(),
      createdAt: new Date().toISOString(),
    };

    // Save lead & store in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('mudirdokan_registered_stores') || '[]');
      existing.unshift(newStore);
      localStorage.setItem('mudirdokan_registered_stores', JSON.stringify(existing));

      const leads = JSON.parse(localStorage.getItem('mudirdokan_all_leads') || '[]');
      leads.unshift({
        type: 'PRO_SUBSCRIPTION_ORDER',
        name: ownerName.trim(),
        phone: regPhone.trim(),
        storeName: storeName.trim(),
        plan: selectedPlan,
        price: currentPrice,
        trxId: trxId.trim(),
        domain: enableCustomDomain ? customDomainName.trim() : `${effectiveSubdomain}.mudirdokanpro.com`,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('mudirdokan_all_leads', JSON.stringify(leads));
    } catch {}

    // Auto-open WhatsApp with invoice message for Shamim
    const waText = encodeURIComponent(
      `আসসালামু আলাইকুম মুদি দোকান প্রো। আমি ${planLabel} প্যাকেজ কিনেছি।\n` +
      `দোকান: ${storeName}\n` +
      `মালিক: ${ownerName}\n` +
      `মোবাইল: ${regPhone}\n` +
      `পেমেন্ট: ৳${currentPrice} (TrxID: ${trxId})\n` +
      (enableCustomDomain && customDomainName ? `কাস্টম ডোমেন: ${customDomainName}\n` : `অনলাইন লিংক: ${effectiveSubdomain}.mudirdokanpro.com\n`) +
      `দয়া করে আমার প্রো স্টোর ভেরিফাই ও অ্যাক্টিভ করুন।`
    );
    window.open(`https://wa.me/8801884700631?text=${waText}`, '_blank', 'noopener,noreferrer');

    loginAsOwner({
      name: ownerName.trim(),
      phone: regPhone.trim(),
      storeName: storeName.trim(),
      subdomain: effectiveSubdomain,
      customDomain: enableCustomDomain ? customDomainName.trim() : undefined,
    });

    toast.success(
      tx(
        lang,
        `Congratulations ${ownerName}! Your Pro Store order has been submitted.`,
        `অভিনন্দন ${ownerName}! আপনার প্রো দোকান অ্যাক্টিভেশন অর্ডার সফল হয়েছে।`
      )
    );
    onClose();
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hello Mudir Dokan Pro, I have questions about the ${planLabel} (৳${currentPrice}). Shop: ${storeName || 'My Grocery'}. Phone: ${regPhone || ''}`
    );
    window.open(`https://wa.me/8801884700631?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100 my-auto">
        
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 sm:px-8 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {tx(lang, 'Upgrade to Mudir Dokan Pro', 'মুদি দোকান প্রো অ্যাক্টিভেশন')}
                </h2>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  ৫০% ডিসকাউন্ট 🔥
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {tx(lang, 'Limited Time Offer • Instant Activation • 1,359 SKUs', 'সীমিত সময়ের অফার • দ্রুত এক্টিভেশন • ১,৩৫৯টি আসল পণ্যের ছবি')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2-COLUMN MODERN LAYOUT */}
        <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* LEFT COLUMN: PACKAGE SELECTION & IN-APP DOMAIN CHECKER */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            
            {/* Step 1: 3 Packages (Monthly 499, Yearly 299/mo, Custom Domain & Demand 15,000) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-emerald-600" />
                  <span>১. প্যাকেজ নির্বাচন করুন</span>
                </span>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>সীমিত সময়ের অফার</span>
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Package 1: Monthly (50% Off: 1,000 -> 499) */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('monthly')}
                  className={`w-full rounded-2xl border p-3 text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedPlan === 'monthly'
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/40'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      ৫০% মেগা ছাড় 🔥
                    </span>
                    {selectedPlan === 'monthly' && <Check className="h-4 w-4 text-emerald-600" />}
                  </div>

                  <div className="mt-1.5 flex items-baseline justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">১ মাস সাবস্ক্রিপশন</h4>
                      <p className="text-[10px] text-slate-500">রেগুলার ১,০০০ — ৫০% ছাড়ে মাত্র ৪৯৯৳</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">৳৪৯৯</span>
                        <span className="text-[10px] text-slate-500">/মাস</span>
                      </div>
                      <span className="font-mono text-[10px] line-through text-slate-400">৳১,০০০</span>
                    </div>
                  </div>
                </button>

                {/* Package 2: Yearly (Mega Saver: 299/mo -> 3,588/yr, No Domain & Hosting Fee) */}
                <button
                  type="button"
                  onClick={() => setSelectedPlan('yearly')}
                  className={`relative w-full rounded-2xl border p-3 text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedPlan === 'yearly'
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/40'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      ⭐ বাৎসরিক মেগা অফার (নো ডোমেন ও হোস্টিং ফি)
                    </span>
                    {selectedPlan === 'yearly' && <Check className="h-4 w-4 text-emerald-600" />}
                  </div>

                  <div className="mt-1.5 flex items-baseline justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">১ বছর (বাৎসরিক মেগা অফার)</h4>
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        বাৎসরিক নিলে মাসে মাত্র ৳২৯৯! (এককালীন ৳৩,৫৮৮)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-400">৳৩,৫৮৮</span>
                        <span className="text-[10px] text-slate-500">/বছর</span>
                      </div>
                      <span className="font-mono text-[10px] line-through text-slate-400">৳১২,০০০</span>
                    </div>
                  </div>
                </button>

                {/* Package 3: Custom Domain & Client's Demand VIP (15,000 Including All) */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan('custom_vip');
                    setEnableCustomDomain(true);
                  }}
                  className={`w-full rounded-2xl border p-3 text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedPlan === 'custom_vip'
                      ? 'border-indigo-600 bg-indigo-50/90 shadow-md ring-2 ring-indigo-600/30 dark:border-indigo-500 dark:bg-indigo-950/40'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      👑 কাস্টম ডোমেন ও ডিমান্ড (VIP)
                    </span>
                    {selectedPlan === 'custom_vip' && <Check className="h-4 w-4 text-indigo-600" />}
                  </div>

                  <div className="mt-1.5 flex items-baseline justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">কাস্টম ডোমেন ফুল সেটআপ</h4>
                      <p className="text-[10px] text-slate-500">ক্লায়েন্টের নিজস্ব চাহিদা অনুযায়ী তৈরি</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-lg font-black text-indigo-700 dark:text-indigo-400">৳১৫,০০০</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600">Including All</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* In-App Domain Availability Checker: NEVER LEAVE THIS SITE */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <span>২. ফ্রি অনলাইন স্টোর লিংক:</span>
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  ফ্রি অন্তর্ভুক্ত
                </span>
              </div>

              {/* Subdomain */}
              <div className="flex items-center gap-1 font-mono text-xs">
                <input
                  type="text"
                  value={customSubdomain || effectiveSubdomain}
                  onChange={(e) => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-32 rounded-lg border border-emerald-300 bg-white px-2 py-1 text-emerald-900 font-bold focus:outline-hidden dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
                  placeholder="shamimgrocery"
                />
                <span className="font-bold text-emerald-800 dark:text-emerald-300 truncate">.mudirdokanpro.com</span>
              </div>

              {/* Custom .com domain in-app checker */}
              <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableCustomDomain}
                    onChange={(e) => setEnableCustomDomain(e.target.checked)}
                    className="h-3.5 w-3.5 rounded-sm border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-200">
                    নিজস্ব .com ডোমেন যুক্ত করতে চান? (যেমন: yourshop.com)
                  </span>
                </label>

                {enableCustomDomain && (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={customDomainName}
                        onChange={(e) => {
                          setCustomDomainName(e.target.value.toLowerCase());
                          setDomainCheckResult({ domain: '', status: 'idle', message: '' });
                        }}
                        placeholder="যেমন: shamimgrocery.com"
                        className="flex-1 rounded-xl border border-emerald-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-emerald-700 dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleCheckDomainInApp}
                        disabled={checkingDomain}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[11px] font-bold transition cursor-pointer shrink-0 disabled:opacity-60"
                      >
                        {checkingDomain ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Search className="h-3.5 w-3.5" />
                        )}
                        <span>{checkingDomain ? 'চেকিং...' : 'চেক করুন'}</span>
                      </button>
                    </div>

                    {/* In-app check result badge */}
                    {domainCheckResult.status !== 'idle' && (
                      <div
                        className={`rounded-xl p-2.5 text-xs leading-relaxed ${
                          domainCheckResult.status === 'available'
                            ? 'border border-emerald-300 bg-emerald-100/90 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'border border-amber-300 bg-amber-100/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
                        }`}
                      >
                        <p className="font-semibold">{domainCheckResult.message}</p>
                      </div>
                    )}

                    <p className="text-[10px] text-emerald-800/80 dark:text-emerald-400">
                      💡 আপনি কোনো অন্য সাইটে যাবেন না—আমরাই আপনার নামে ডোমেন রেজিস্ট্রেশন ও সফটওয়্যারের সাথে লিংক করে দেব।
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Included Value Highlights */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5 text-xs">
              <span className="font-black text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                প্যাকেজের সাথে যা যা ফ্রি পাচ্ছেন:
              </span>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>১,৩৫৯টি আসল পণ্যের ছবি ও বারকোড রেডি</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>অফলাইন-ফার্স্ট ক্যাশ কাউন্টার ও রিয়েল লাভ হিসাব</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>২৪/৭ ব্যক্তিগত হোয়াটসঅ্যাপ সাপোর্ট ও ব্যাকআপ</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: STORE OWNER INFO & BKASH/NAGAD PAYMENT */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <form onSubmit={handleRegisterStore} className="space-y-4">
              
              {/* Store & Owner Inputs */}
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <Store className="h-3.5 w-3.5 text-emerald-600" />
                  <span>৩. দোকান ও মালিকের তথ্য</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      দোকানদারের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="যেমন: মো: শামীম হোসেন"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মোবাইল নম্বর (হোয়াটসঅ্যাপ) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="01884700631"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      দোকানের নাম <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="যেমন: শামীম জেনারেল স্টোর"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      দোকানের অবস্থান / ঠিকানা
                    </label>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="যেমন: মিরপুর ১০, ঢাকা"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section (bKash / Nagad Send Money) */}
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-4 text-xs dark:border-rose-900/60 dark:bg-rose-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-black text-rose-950 dark:text-rose-200">
                    <CreditCard className="h-4 w-4 text-rose-600" />
                    <span>৪. বিকাশ / নগদ পেমেন্ট (সেন্ড মানি):</span>
                  </span>
                  <span className="font-mono font-black text-sm text-rose-700 dark:text-rose-300">
                    পরিশোধযোগ্য: ৳{currentPrice}
                  </span>
                </div>

                {/* Account Number Box with Click-to-Copy */}
                <div className="flex items-center justify-between rounded-xl border border-rose-300 bg-white px-3 py-2 dark:border-rose-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                      বিকাশ / নগদ পার্সোনাল
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white tracking-wider">
                      01884700631
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 transition cursor-pointer"
                  >
                    {copiedNumber ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                  </button>
                </div>

                {/* TrxID Input */}
                <div>
                  <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-300 mb-1">
                    পেমেন্টের ট্রানজেকশন আইডি (TrxID) দিন: <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                      placeholder="যেমন: BL9A7K8X বা 9J72M1"
                      className="flex-1 rounded-xl border border-rose-300 bg-white px-3 py-2 font-mono text-xs font-black text-slate-900 focus:outline-hidden dark:border-rose-800 dark:bg-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleWhatsAppContact}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">হোয়াটসঅ্যাপ</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Activation Button */}
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-4 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-600/30 transition cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>পেমেন্ট নিশ্চিত করে প্রো দোকান চালু করুন (৳{currentPrice}) ⚡</span>
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 text-center pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>১০০% নিরাপদ লেনদেন</span>
                </span>
                <span>•</span>
                <span>২৪/৭ হেল্পলাইন: 01884700631</span>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
