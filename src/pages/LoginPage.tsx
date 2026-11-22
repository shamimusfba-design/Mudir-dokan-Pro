import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Users,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Headphones,
  ShoppingBag,
  Store,
  User,
  Phone,
  Check,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { tx, type LanguageMode } from '../lib/i18n';
import { PWAInstallButton } from '../hooks/usePWAInstall';

interface LoginPageProps {
  onOpenPortal: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenPortal }) => {
  const { lang, setLang, darkMode, toggleDarkMode, signInWithGoogle, enterDemoMode } = useApp();

  const [activeTab, setActiveTab] = useState<'owner' | 'customer'>('owner');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPackageDays, setSelectedPackageDays] = useState<'1' | '3' | '7' | '30'>('7');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error(tx(lang, 'Please enter email and password', 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন'));
      return;
    }

    setLoading(true);
    try {
      if (authMode === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(userCred.user, { displayName: name.trim() });
        }
        toast.success(tx(lang, 'Account created successfully! Welcome to Mudi Dokan Pro.', 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! মুদির দোকান প্রো-তে স্বাগতম।'));
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success(tx(lang, 'Signed in successfully!', 'সফলভাবে সাইন ইন হয়েছে!'));
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      let errMsg = err.message || 'Authentication failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = tx(lang, 'Invalid email or password. Please try again.', 'ভুল ইমেইল বা পাসওয়ার্ড। পুনরায় চেষ্টা করুন।');
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = tx(lang, 'Email already registered. Please sign in.', 'এই ইমেইলটি ইতিমধ্যে নিবন্ধিত। সাইন ইন করুন।');
      } else if (err.code === 'auth/weak-password') {
        errMsg = tx(lang, 'Password should be at least 6 characters.', 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।');
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error(tx(lang, 'Please enter your email address first', 'পাসওয়ার্ড রিসেট করতে প্রথমে আপনার ইমেইল লিখুন'));
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      toast.success(
        tx(
          lang,
          `Password reset link sent to ${email.trim()}. Check your inbox.`,
          `${email.trim()} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে।`
        )
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerPhone.trim()) {
      sessionStorage.setItem('mudirdokan_portal_phone', customerPhone.trim());
    }
    onOpenPortal();
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#F8FAF7] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-slate-950 dark:text-slate-100 overflow-x-hidden">
      {/* Decorative subtle ambient glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-900/10" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-orange-300/15 blur-3xl dark:bg-orange-900/10" />

      {/* TOP NAVBAR / HEADER */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top-left Brand Logo (visible on mobile if header space permits) */}
        <div className="flex items-center gap-2">
          <img
            src="/mudi-dokan-pro-logo.png"
            alt="Mudi Dokan Pro"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
          />
        </div>

        {/* Top-right Language Toggle & Theme Button */}
        <div className="flex items-center gap-2.5">
          {/* Pill Language Switcher: English | বাংলা */}
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 p-1 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={() => setLang('EN')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer ${
                lang === 'EN'
                  ? 'bg-[#16A34A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <span className="text-[11px]">🌐</span>
              <span>English</span>
            </button>
            <button
              type="button"
              onClick={() => setLang('BN')}
              className={`rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer ${
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
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
          
          {/* LEFT COLUMN: BRAND & HAPPY SHOPKEEPER & FEATURE HIGHLIGHTS */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
            
            {/* Visual Hero Container with Shopkeeper, Groceries & Floating Dashboard */}
            <div className="relative rounded-3xl overflow-hidden border border-emerald-100/80 bg-white shadow-xl shadow-emerald-950/5 dark:border-emerald-950/40 dark:bg-slate-900">
              
              {/* Background Composite of the Reference Design: Happy Shopkeeper + Dashboard */}
              <div className="relative w-full overflow-hidden">
                <img
                  src={lang === 'BN' ? '/hero-full-left.jpg' : '/hero-full-left-en.jpg'}
                  alt="Mudi Dokan Pro - Happy Shopkeeper & Dashboard"
                  className="w-full h-auto object-cover object-left select-none pointer-events-none"
                />
              </div>

              {/* Interactive Smart Family Bazar Package banner at bottom of card */}
              <div className="border-t border-emerald-100/70 bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/80 p-3 sm:p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {tx(lang, 'Smart Family Bazar Package', 'পরিবারের সদস্য অনুযায়ী বাজারের Smart Package')}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {tx(
                          lang,
                          "Plan your family's grocery shopping based on family size.",
                          'পারিবারিক চাহিদামতো সাপ্তাহিক বা মাসিক বাজার প্ল্যান করুন।'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Period Pills */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {(
                      [
                        { key: '1', en: '1 Day', bn: '১ দিন' },
                        { key: '3', en: '3 Days', bn: '৩ দিন' },
                        { key: '7', en: '7 Days', bn: '৭ দিন' },
                        { key: '30', en: '1 Month', bn: '১ মাস' },
                      ] as const
                    ).map((pkg) => (
                      <button
                        key={pkg.key}
                        type="button"
                        onClick={() => {
                          setSelectedPackageDays(pkg.key);
                          toast.info(
                            tx(
                              lang,
                              `${pkg.en} Family Bazar Package selected (Promotional Preview)`,
                              `${pkg.bn} পারিবারিক বাজার প্যাকেজ নির্বাচিত হয়েছে`
                            )
                          );
                        }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                          selectedPackageDays === pkg.key
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-600 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {tx(lang, pkg.en, pkg.bn)}
                      </button>
                    ))}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-800 text-white">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Desktop Highlights Footer Pill */}
            <div className="hidden sm:grid grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 p-2.5 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {tx(lang, 'Real Profit & Loss', 'আসল লাভ-লোকসান')}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {tx(lang, 'Sales & costs daily', 'প্রতিদিনের নিখুঁত হিসাব')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-white/80 p-2.5 shadow-xs backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                  <Package className="h-4 w-4" />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {tx(lang, 'Low Stock Alert', 'স্টক সতর্কতা')}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {tx(lang, 'Know before run-out', 'পণ্য শেষের আগেই অ্যালার্ট')}
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
                    {tx(lang, 'Customer due ledger', 'বাকি ও কিস্তি ব্যবস্থাপনা')}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: PREMIUM WHITE LOGIN CARD */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-2xl shadow-emerald-950/10 dark:border-slate-800 dark:bg-slate-900">
              
              {/* Card Header with Official Mudi Dokan Pro Logo */}
              <div className="text-center">
                <img
                  src="/mudi-dokan-pro-logo.png"
                  alt="Mudi Dokan Pro"
                  className="mx-auto h-14 sm:h-16 w-auto object-contain drop-shadow-xs"
                />
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {tx(lang, 'Welcome Back', 'স্বাগতম')}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {tx(
                    lang,
                    "Your business is ready. Let's get started.",
                    'আপনার ব্যবসা প্রস্তুত। শুরু করুন।'
                  )}
                </p>
              </div>

              {/* Owner / Customer Tabs */}
              <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('owner')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                    activeTab === 'owner'
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span>{tx(lang, 'Business Owner', 'দোকান মালিক')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('customer')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition cursor-pointer ${
                    activeTab === 'customer'
                      ? 'bg-[#16A34A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>{tx(lang, 'Customer', 'সম্মানিত ক্রেতা')}</span>
                </button>
              </div>

              {/* TAB 1: BUSINESS OWNER LOGIN */}
              {activeTab === 'owner' && (
                <div className="mt-5 space-y-4">
                  <form onSubmit={handleEmailAuth} className="space-y-3.5">
                    
                    {authMode === 'register' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {tx(lang, 'Full Name / Shop Name', 'পূর্ণ নাম বা দোকানের নাম')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={tx(lang, 'e.g. Shamim Ahmed', 'যেমন: শামীম আহমেদ')}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                          />
                          <Store className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    )}

                    {/* Email Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tx(lang, 'Email or Phone Number', 'ইমেইল বা মোবাইল নম্বর')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="owner@store.com"
                          required
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                        />
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tx(lang, 'Password', 'পাসওয়ার্ড')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                    <div className="flex items-center justify-between text-xs">
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
                        onClick={handleForgotPassword}
                        className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400 cursor-pointer"
                      >
                        {tx(lang, 'Forgot Password?', 'পাসওয়ার্ড ভুলে গেছেন?')}
                      </button>
                    </div>

                    {/* Sign In / Register Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16A34A] to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4" />
                          <span>
                            {authMode === 'register'
                              ? tx(lang, 'Create Account & Open Store', 'অ্যাকাউন্ট খুলুন ও দোকান শুরু করুন')
                              : tx(lang, 'Sign In to Your Business', 'আপনার ব্যবসায় প্রবেশ করুন')}
                          </span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-900">
                      {tx(lang, 'or continue with', 'অথবা')}
                    </span>
                  </div>

                  {/* Google Sign-In Button */}
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{tx(lang, 'Continue with Google', 'গুগল দিয়ে প্রবেশ করুন')}</span>
                  </button>

                  {/* Demo Store Access Button */}
                  <button
                    type="button"
                    onClick={enterDemoMode}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {tx(
                        lang,
                        'Explore Demo Store (1,359 Products & Images)',
                        'ডেমো স্টোরে সরাসরি প্রবেশ করুন (১,৩৫৯টি পণ্য)'
                      )}
                    </span>
                  </button>

                  {/* Switch between Sign In / Register */}
                  <div className="pt-2 text-center text-xs text-slate-500">
                    {authMode === 'signin' ? (
                      <p>
                        <span>{tx(lang, 'New to Mudi Dokan Pro? ', 'নতুন মুদির দোকানদার? ')}</span>
                        <button
                          type="button"
                          onClick={() => setAuthMode('register')}
                          className="font-bold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
                        >
                          {tx(lang, 'Register Now', 'রেজিস্ট্রেশন করুন')}
                        </button>
                      </p>
                    ) : (
                      <p>
                        <span>{tx(lang, 'Already have an account? ', 'ইতিমধ্যে অ্যাকাউন্ট আছে? ')}</span>
                        <button
                          type="button"
                          onClick={() => setAuthMode('signin')}
                          className="font-bold text-emerald-700 hover:underline dark:text-emerald-400 cursor-pointer"
                        >
                          {tx(lang, 'Sign In', 'সাইন ইন করুন')}
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOMER KHATA PORTAL LOGIN */}
              {activeTab === 'customer' && (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      {tx(lang, 'Customer Self-Service Khata Portal', 'ক্রেতা সেলফ-সার্ভিস খাতা পোর্টাল')}
                    </p>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                      {tx(
                        lang,
                        'View your credit dues, download itemized receipts, make bKash/Nagad payments, and verify balances directly.',
                        'আপনার বাকির হিসাব দেখুন, ক্যাশমেমো ডাউনলোড করুন এবং বিকাশ/নগদে বকেয়া পরিশোধ করুন।'
                      )}
                    </p>
                  </div>

                  <form onSubmit={handleCustomerSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {tx(lang, 'Your Registered Mobile Number', 'আপনার নিবন্ধিত মোবাইল নম্বর')}
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="01700-000000"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pl-10 text-sm text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
                        />
                        <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>{tx(lang, 'Open Customer Self-Service Portal', 'ক্রেতা খাতা পোর্টাল খুলুন')}</span>
                    </button>
                  </form>

                  <div className="pt-2 text-center text-[11px] text-slate-400">
                    {tx(
                      lang,
                      'Have a 30-day invitation QR from your local grocer? Scan it directly to login.',
                      'দোকানদারের দেওয়া ৩০ দিনের কিউআর কোড স্ক্যান করেও সরাসরি ঢুকতে পারবেন।'
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER STRIP: SECURE & RELIABLE | EASY TO USE | 24/7 SUPPORT */}
      <footer className="relative z-20 w-full bg-[#14532D] text-white py-3 px-4 shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 sm:gap-14 text-xs font-bold text-emerald-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{tx(lang, 'Secure & Reliable', 'নিরাপদ ও নির্ভরযোগ্য')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>{tx(lang, 'Easy to Use', 'সহজ ও দ্রুত')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-cyan-400" />
            <span>{tx(lang, '24/7 Support', '২৪/৭ সাপোর্ট')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
