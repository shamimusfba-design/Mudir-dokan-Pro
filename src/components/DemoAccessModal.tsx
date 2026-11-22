import React, { useState } from 'react';
import {
  X,
  Sparkles,
  User,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
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

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      toast.error(tx(lang, 'Please enter a valid Gmail / Email', 'সঠিক জিমেইল / ইমেইল লিখুন'));
      return;
    }

    setLoading(true);

    // Save lead to localStorage
    const lead = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      timestamp: new Date().toISOString(),
      source: 'DEMO_MODAL',
    };

    try {
      const existing = JSON.parse(localStorage.getItem('mudirdokan_demo_leads') || '[]');
      existing.unshift(lead);
      localStorage.setItem('mudirdokan_demo_leads', JSON.stringify(existing));

      const allLeads = JSON.parse(localStorage.getItem('mudirdokan_all_leads') || '[]');
      allLeads.unshift({
        type: 'DEMO_REGISTRATION',
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('mudirdokan_all_leads', JSON.stringify(allLeads));
    } catch {}

    try {
      await enterDemoMode();
      toast.success(
        tx(
          lang,
          `Welcome ${name}! Exploring Mudir Dokan Pro Demo Store with 1,359 items.`,
          `স্বাগতম ${name}! ১,৩৫৯টি আসল পণ্যের ডেমো স্টোরে আপনাকে স্বাগতম।`
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
        <div className="text-center pb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>{tx(lang, 'Instant Live Demo Access', 'বিনামূল্যে লাইভ ডেমো এক্সেস')}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {tx(lang, 'Register to View Demo', 'ডেমো দেখতে তথ্য প্রদান করুন')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Enter your name, phone number & Gmail to unlock the full 1,359-item POS demo.',
              'আপনার নাম, ফোন নম্বর ও জিমেইল দিয়ে সম্পূর্ণ ডেমো স্টোরটি এক্সপ্লোর করুন।'
            )}
          </p>
        </div>

        {/* Form with 3 fields: Name, Phone, Gmail */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* 1. Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {tx(lang, '1. Full Name', '১. আপনার পূর্ণ নাম')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: মো: আরিফুল ইসলাম"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
              />
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* 2. Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {tx(lang, '2. Mobile Number (WhatsApp)', '২. মোবাইল নম্বর (হোয়াটসঅ্যাপ)')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
              />
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* 3. Gmail / Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {tx(lang, '3. Gmail / Email Address', '৩. আপনার জিমেইল / ইমেইল')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 pl-10 text-xs sm:text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
              />
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="rounded-xl bg-amber-50/60 p-2.5 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{tx(lang, 'Instant access to full POS counter with 1,359 real items', '১,৩৫৯টি আসল পণ্যের সম্পূর্ণ কাউন্টার ও ড্যাশবোর্ড ফ্রি')}</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{tx(lang, 'No credit card or payment needed for demo', 'ডেমোর জন্য কোনো পেমেন্ট বা ফি প্রয়োজন নেই')}</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-amber-500/25 transition cursor-pointer disabled:opacity-70"
          >
            <span>{loading ? tx(lang, 'Loading Demo...', 'ডেমো লোড হচ্ছে...') : tx(lang, 'Enter Full Demo Store ⚡', 'সম্পূর্ণ ডেমো স্টোরে প্রবেশ করুন ⚡')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
