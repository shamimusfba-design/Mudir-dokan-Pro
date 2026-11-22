import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  CreditCard,
  ExternalLink,
  Globe,
  Sparkles,
  ShieldCheck,
  Zap,
  Phone,
  MessageCircle,
  Store,
  User,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { tx, type LanguageMode } from '../lib/i18n';
import { useApp } from '../context/AppContext';

interface BuyProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuyProModal: React.FC<BuyProModalProps> = ({ isOpen, onClose }) => {
  const { lang, loginAsOwner } = useApp();

  const [ownerName, setOwnerName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [customSubdomain, setCustomSubdomain] = useState('');
  const [enableCustomDomain, setEnableCustomDomain] = useState(false);
  const [customDomainName, setCustomDomainName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'annual'>('pro');
  const [trxId, setTrxId] = useState('');

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
      customDomain: enableCustomDomain ? customDomainName.trim() : null,
      plan: selectedPlan,
      trxId: trxId.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('mudirdokan_registered_stores') || '[]');
      existing.unshift(newStore);
      localStorage.setItem('mudirdokan_registered_stores', JSON.stringify(existing));
    } catch {}

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
        `Congratulations ${ownerName}! Your store ${effectiveSubdomain}.mudirdokanpro.com is activated.`,
        `অভিনন্দন ${ownerName}! আপনার দোকান ${effectiveSubdomain}.mudirdokanpro.com চালু হয়েছে।`
      )
    );
    onClose();
  };

  const handleCheckNamecheap = () => {
    const domainToCheck = customDomainName.trim() || `${effectiveSubdomain}.com`;
    const namecheapUrl = `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domainToCheck)}`;
    window.open(namecheapUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hello Mudir Dokan Pro, I want to buy the ${selectedPlan.toUpperCase()} plan for my grocery shop: ${storeName || 'My Grocery'}. Contact: ${regPhone || ''}`
    );
    window.open(`https://wa.me/8801884700631?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>{tx(lang, 'Upgrade to Mudir Dokan Pro', 'মুদির দোকান প্রো ভার্সন কিনুন')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {tx(lang, 'Launch Your Pro Grocery System', 'আপনার দোকানের জন্য প্রো ভার্সন চালু করুন')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {tx(
              lang,
              'Get unlimited 1,359+ product database, digital billing, automated SMS, and priority support.',
              '১,৩৫৯+ পণ্যের রেডি ডাটাবেজ, অফলাইন বারকোড পিওএস, স্বয়ংক্রিয় এসএমএস ও ২৪/৭ ভিআইপি সাপোর্ট।'
            )}
          </p>
        </div>

        {/* Pricing Plan Selector */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            {tx(lang, '1. Choose Subscription Plan:', '১. আপনার সুবিধাজনক প্যাকেজ নির্বাচন করুন:')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'starter',
                name: 'স্টার্টার',
                price: '৳৪৯৯',
                period: '/মাস',
                badge: 'ছোট দোকান',
                features: ['১টি ইউজার', 'ডিজিটাল বাকি খাতা', 'ক্যাশ ড্রয়ার'],
              },
              {
                id: 'pro',
                name: 'প্রো মুদি দোকান',
                price: '৳৯৯৯',
                period: '/মাস',
                badge: 'সেরা পছন্দ ⭐',
                popular: true,
                features: ['১,৩৫৯টি আসল পণ্যের ছবি', 'বারকোড পিওএস', 'এসএমএস তাগাদা', 'অনলাইন সাবডোমেন'],
              },
              {
                id: 'annual',
                name: 'বাৎসরিক ভিআইপি',
                price: '৳৭,৯৯৯',
                period: '/বছর',
                badge: '২ মাস ফ্রি!',
                features: ['কাস্টম ডোমেন সাপোর্ট', 'ভিআইপি ব্যাকআপ', 'লাইফটাইম সাপোর্ট', 'ফ্রি ট্রেনিং'],
              },
            ].map((p) => {
              const isSelected = selectedPlan === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlan(p.id as any)}
                  className={`relative flex flex-col justify-between rounded-2xl border p-3 text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                        {p.badge}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <div className="text-sm font-bold mt-1 text-slate-900 dark:text-white">{p.name}</div>
                    <div className="mt-1 flex items-baseline gap-0.5">
                      <span className="font-mono text-lg font-black text-slate-900 dark:text-white">{p.price}</span>
                      <span className="text-[10px] text-slate-500">{p.period}</span>
                    </div>
                  </div>
                  <ul className="mt-2.5 space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800 pt-2">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        {/* Store Setup & Details Form */}
        <form onSubmit={handleRegisterStore} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {tx(lang, '2. Store & Owner Information:', '২. দোকান ও মালিকের তথ্য:')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {tx(lang, 'Owner Full Name', 'দোকানদারের পূর্ণ নাম')} <span className="text-rose-500">*</span>
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {tx(lang, 'Mobile Number', 'মোবাইল নম্বর')} <span className="text-rose-500">*</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {tx(lang, 'Shop Name', 'দোকানের নাম')} <span className="text-rose-500">*</span>
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
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {tx(lang, 'Shop Location / Address', 'দোকানের অবস্থান / ঠিকানা')}
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

          {/* Subdomain & Custom Domain */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-emerald-600" />
                <span>{tx(lang, 'Free Online Store Link:', 'আপনার দোকানের ফ্রি অনলাইন লিংক:')}</span>
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs">
              <input
                type="text"
                value={customSubdomain || effectiveSubdomain}
                onChange={(e) => setCustomSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-emerald-900 font-bold focus:outline-hidden dark:border-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
                placeholder="shamimgrocery"
              />
              <span className="font-bold text-emerald-800 dark:text-emerald-300">.mudirdokanpro.com</span>
            </div>

            {/* Custom domain checkbox */}
            <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableCustomDomain}
                  onChange={(e) => setEnableCustomDomain(e.target.checked)}
                  className="h-3.5 w-3.5 rounded-sm border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                  {tx(lang, 'Want your own custom .com domain?', 'নিজস্ব .com ডোমেন যুক্ত করতে চান?')}
                </span>
              </label>

              {enableCustomDomain && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customDomainName}
                    onChange={(e) => setCustomDomainName(e.target.value)}
                    placeholder="shamimgrocery.com"
                    className="flex-1 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-emerald-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleCheckNamecheap}
                    className="inline-flex items-center gap-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 text-[11px] font-bold transition cursor-pointer shrink-0"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{tx(lang, 'Namecheap Search', 'নেমচিপ সার্চ')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Section (bKash / Nagad) */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs dark:border-rose-900/60 dark:bg-rose-950/30 space-y-2">
            <div className="flex items-center justify-between text-rose-950 dark:text-rose-200 font-bold">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-rose-600" />
                <span>{tx(lang, '3. Payment via bKash / Nagad (Send Money):', '৩. বিকাশ / নগদ পেমেন্ট (সেন্ড মানি):')}</span>
              </span>
              <span className="font-mono font-black text-sm text-rose-700 dark:text-rose-300">01884700631</span>
            </div>
            <p className="text-[11px] text-rose-800/90 dark:text-rose-300/80">
              {tx(
                lang,
                'Send package amount to 01884700631 (bKash/Nagad Personal) and enter the Transaction ID (TrxID) below:',
                'নির্বাচিত প্যাকেজের ফি 01884700631 নম্বরে পাঠিয়ে ট্রানজেকশন আইডি (TrxID) দিন:'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder="bKash/Nagad TrxID (যেমন: BL9A7K8X)"
                className="flex-1 rounded-xl border border-rose-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-900 focus:outline-hidden dark:border-rose-800 dark:bg-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleWhatsAppContact}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{tx(lang, 'WhatsApp Helpline', 'হোয়াটসঅ্যাপ সহায়তা')}</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>{tx(lang, 'Verify Payment & Activate Pro Store', 'পেমেন্ট নিশ্চিত করে প্রো দোকান চালু করুন')}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
