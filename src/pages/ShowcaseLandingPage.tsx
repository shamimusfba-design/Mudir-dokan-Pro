import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Store,
  Phone,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  Clock,
  Gift,
  X,
  Search,
  Eye,
  Check,
  Sun,
  Moon,
  Printer,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ChevronRight,
  Layers,
  HelpCircle,
  Truck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  onOpenDemo?: () => void;
}

// Reusable ScrollReveal wrapper component using native IntersectionObserver
const ScrollReveal: React.FC<{
  children: React.ReactNode;
  animation?: 'fade-up' | 'scale' | 'fade-left' | 'fade-right';
  delay?: number;
  className?: string;
}> = ({ children, animation = 'fade-up', delay = 0, className = '' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const animClass =
    animation === 'scale'
      ? 'scroll-reveal-scale'
      : animation === 'fade-left'
      ? 'scroll-reveal-left'
      : animation === 'fade-right'
      ? 'scroll-reveal-right'
      : 'scroll-reveal';

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${animClass} ${revealed ? 'is-revealed' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

// 12 Key Visual Screen Cards (DokandarPro Clean 3-Column Grid)
interface ScreenCardItem {
  id: string;
  badgeNum: string;
  category: string;
  title: string;
  subtitle: string;
  hookPill: string;
  image: string;
  alt: string;
}

const SCREEN_CARDS: ScreenCardItem[] = [
  {
    id: 'pos-billing',
    badgeNum: '০১',
    category: 'পিওএস কাউন্টার',
    title: 'সুপারফাস্ট বারকোড পিওএস কাউন্টার',
    subtitle: '১ সেকেন্ডে স্ক্যান ও ইনস্ট্যান্ট বিলিং, অফলাইনেও দ্রুততম',
    hookPill: '১০০% অফলাইনে সচল',
    image: '/marketing/02-pos-billing-counter.png',
    alt: 'Visual POS Billing Counter Screen',
  },
  {
    id: 'catalog',
    badgeNum: '০২',
    category: 'রেডি ডাটাবেজ',
    title: '১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ',
    subtitle: 'তীর, প্রাণ, স্কয়ার থেকে মিল্কভিটা—ছবি ও বারকোড লোড করা',
    hookPill: 'টাইপিং ছাড়া শুরু করুন',
    image: '/marketing/05-product-catalog-grid.png',
    alt: '1359 FMCG Grocery SKUs Database',
  },
  {
    id: 'khata',
    badgeNum: '০৩',
    category: 'বাকি খাতা',
    title: 'ডিজিটাল বাকি খাতা ও এসএমএস তাগাদা',
    subtitle: 'কার কত বাকি ও লেনদেন হিস্ট্রি, ১ ক্লিকে হোয়াটসঅ্যাপে মেমো',
    hookPill: 'সম্পর্ক রেখে বাকি আদায়',
    image: '/marketing/13-customers-digital-khata.png',
    alt: 'Customer Khata Digital Ledger',
  },
  {
    id: 'thermal-receipt',
    badgeNum: '০৪',
    category: 'মেমো প্রিন্ট',
    title: 'থার্মাল প্রিন্টার কালির খরচহীন মেমো',
    subtitle: '৫৮মিমি ও ৮০মিমি রসিদ, দোকান ব্র্যান্ডিং সহ গ্রাহকের আস্থা',
    hookPill: 'কালির খরচ শূন্য',
    image: '/marketing/04-receipt-thermal-print.png',
    alt: 'POS Thermal Receipt Preview 58mm 80mm',
  },
  {
    id: 'cash-closing',
    badgeNum: '০৫',
    category: 'ক্যাশ ড্রয়ার',
    title: 'দৈনিক ক্যাশ ড্রয়ার ও শিফট ক্লোজিং',
    subtitle: 'সকাল ও রাতের ক্যাশ ইন/আউট ড্রয়ারের নগদ টাকা মেলানো',
    hookPill: '১ পয়সাও অমিল নয়',
    image: '/marketing/16-cash-register-closing.png',
    alt: 'Daily Cash Register Shift Closing and Drawer Reconciliation',
  },
  {
    id: 'dashboard',
    badgeNum: '০৬',
    category: 'লাভ-ক্ষতি',
    title: 'আসল লাভ-ক্ষতি ও সঠিক হিসাব ড্যাশবোর্ড',
    subtitle: 'গড় ক্রয়মূল্য বাদ দিয়ে দিনের খাঁটি লাভ ও বিক্রির লাইভ অ্যানালিটিক্স',
    hookPill: 'আসল লাভ এক নজরে',
    image: '/marketing/01-dashboard-analytics.png',
    alt: 'Real-time Profit Loss and Sales Trend Dashboard',
  },
  {
    id: 'distributor',
    badgeNum: '০৭',
    category: 'মহাজন চালান',
    title: 'ডিস্ট্রিবিউটর চালান ও কার্টন কনভার্সন',
    subtitle: 'কার্টনে কিনে খুচরা পিস বিক্রি ও মহাজন দেনা খাতা অটো-আপডেট',
    hookPill: 'মহাজন দেনা হিসাব',
    image: '/marketing/09-distributor-purchase.png',
    alt: 'Record Distributor Purchase and Carton Conversion',
  },
  {
    id: 'inventory',
    badgeNum: '০৮',
    category: 'স্টক লেজার',
    title: 'ইনভেন্টরি স্টক ও সম্পদ মূল্যায়ন',
    subtitle: 'দোকানে কত টাকার মাল আছে এবং কোন মাল ফুরিয়ে যাচ্ছে সতর্কবার্তা',
    hookPill: 'স্টক সংকট রোধ',
    image: '/marketing/08-inventory-valuation.png',
    alt: 'Inventory Stock Valuation and Asset Ledger',
  },
  {
    id: 'online-store',
    badgeNum: '০৯',
    category: 'অনলাইন শপ',
    title: 'অনলাইন গ্রোসারি শপ ও ১-পেজ চেকআউট',
    subtitle: 'ঘরেরবাজার স্টাইলে এলাকার কাস্টমারদের জন্য ফ্রি অনলাইন শপ',
    hookPill: 'ঘরে বসে ডেলিভারি অর্ডার',
    image: '/marketing/11-online-storefront.png',
    alt: 'Online Grocery Storefront with District Store Switcher',
  },
  {
    id: 'shop-expenses',
    badgeNum: '১০',
    category: 'দোকান খরচ',
    title: 'দোকানের দৈনন্দিন খরচ ও পরিচালন হিসাব',
    subtitle: 'দোকান ভাড়া, কারেন্ট বিল, কর্মচারী বেতন ও চা-নাস্তার হিসাব',
    hookPill: 'অপ্রয়োজনীয় খরচ রোধ',
    image: '/marketing/15-shop-expenses.png',
    alt: 'Shop Daily Operating Expenses and Utilities Ledger',
  },
  {
    id: 'brands',
    badgeNum: '১১',
    category: 'ব্র্যান্ড ফিল্টার',
    title: '৭৫টি শীর্ষ ব্র্যান্ড লোগো ফিল্টারিং',
    subtitle: 'তীর, প্রাণ, ফ্রেশ, স্কয়ার লোগো দেখে এক ক্লিকে পণ্য ফিল্টার',
    hookPill: 'ব্র্যান্ড ফিল্টারিং',
    image: '/marketing/06-brands-logos-showcase.png',
    alt: '75 FMCG Official Brand Logos',
  },
  {
    id: 'due-aging',
    badgeNum: '১২',
    category: 'বাকি এজিং',
    title: '৫-ধাপের বাকি এজিং এনালাইসিস',
    subtitle: '০-১৫ দিন থেকে ৬০+ দিন পুরনো আটকে থাকা বাকি দ্রুত উদ্ধার',
    hookPill: 'আটকে থাকা টাকা উদ্ধার',
    image: '/marketing/14-due-aging-reports.png',
    alt: 'Receivable Due Aging Analysis Dashboard',
  },
];

// 6 Real Merchant Problem-Solution Hook Photo Cards
interface HookProblemCard {
  id: string;
  badgeNum: string;
  question: string;
  answerStrong: string;
  answerText: string;
  tag: string;
  image: string;
  alt: string;
}

const HOOK_PROBLEM_CARDS: HookProblemCard[] = [
  {
    id: 'offline-billing',
    badgeNum: '০১',
    question: 'নেট বা কারেন্ট চলে গেলে কি বিল বন্ধ থাকবে?',
    answerStrong: 'না, কখনোই না!',
    answerText: 'মুদির দোকান প্রো ১০০% অফলাইন টেকনোলজিতে চলে। ইন্টারনেট না থাকলেও ১ সেকেন্ডের জন্য কাউন্টার থামবে না।',
    tag: '১০০% অফলাইন বিলিং',
    image: '/marketing/02-pos-billing-counter.png',
    alt: '১০০% অফলাইন পিওএস বিলিং কাউন্টার',
  },
  {
    id: 'catalog-entry',
    badgeNum: '০২',
    question: 'হাজার পণ্যের নাম আর দাম এন্ট্রি করতে কি ১ মাস লাগবে?',
    answerStrong: 'একদমই না!',
    answerText: 'তীর, রূপচাঁদা, প্রাণ, স্কয়ার থেকে ডানো, মিল্কভিটা পর্যন্ত ১,৩৫৯টি আসল পণ্যের ছবি ও বারকোড আমরাই আগে থেকে লোড করে দিয়েছি।',
    tag: '১ম দিন থেকেই বিলিং শুরু',
    image: '/marketing/05-product-catalog-grid.png',
    alt: '১,৩৫৯টি আসল পণ্যের ছবি ও বারকোড ক্যাটালগ',
  },
  {
    id: 'due-khata-sms',
    badgeNum: '০৩',
    question: 'বাকি চাইতে লজ্জা লাগে, কাস্টমারের সাথে ভুল বোঝাবুঝি হবে?',
    answerStrong: 'কোনো অস্বস্তি নেই!',
    answerText: '১ ক্লিকে সম্মানজনক বাংলা হোয়াটসঅ্যাপ ও এসএমএস তাগাদায় কাস্টমার নিজেই ঘরে বসে মোবাইলে মেমো ও বাকি দেখে টাকা পরিশোধ করবে।',
    tag: 'সম্পর্ক ঠিক রেখে দ্রুত বাকি আদায়',
    image: '/marketing/13-customers-digital-khata.png',
    alt: 'ডিজিটাল বাকি খাতা ও অটো এসএমএস রিমাইন্ডার',
  },
  {
    id: 'online-offline-combo',
    badgeNum: '০৪',
    question: 'অনলাইন ও অফলাইন ২টিই কি ১টি অ্যাপে চালানো সম্ভব?',
    answerStrong: 'হ্যাঁ, ১০০% সম্ভব!',
    answerText: 'দোকানের কাউন্টারে বসে অফলাইন বারকোড পিওএস বিলিং এবং ইন্টারনেটে এলাকার কাস্টমারদের জন্য অনলাইন গ্রোসারি ডেলিভারি—দুটোই চলবে একটি মাত্র শক্তিশালী অ্যাপে।',
    tag: 'কাউন্টার ও অনলাইন স্টোর একসঙ্গে',
    image: '/marketing/11-online-storefront.png',
    alt: 'অনলাইন গ্রোসারি শপ ও অফলাইন পিওএস একই সাথে',
  },
  {
    id: 'auto-sync-powercut',
    badgeNum: '০৫',
    question: 'নেট না থাকলে ডাটা বা হিসাব কি হারিয়ে যাবে?',
    answerStrong: '১ পয়সার হিসাবও হারাবে না!',
    answerText: 'বিদ্যুৎ বা নেট না থাকলেও অফলাইনে হিসাব অক্ষত থাকবে। যখনই কারেন্ট বা নেট আসবে, সাথে সাথে সমস্ত ডাটা ক্লাউডে অটো-আপডেট ও লাইফটাইম ব্যাকআপ হয়ে যাবে।',
    tag: 'অটো সিঙ্ক • লাইফটাইম ব্যাকআপ',
    image: '/marketing/01-dashboard-analytics.png',
    alt: 'অটো ক্লাউড সিঙ্ক ও রিয়েলটাইম ড্যাশবোর্ড',
  },
  {
    id: 'responsive-ui',
    badgeNum: '০৬',
    question: 'মোবাইল বা কম্পিউটারে সফটওয়্যার চালানো কি জটিল?',
    answerStrong: 'সবার জন্য পানির মতো সহজ!',
    answerText: 'মোবাইল ফোন, ট্যাবলেট, ল্যাপটপ, কম্পিউটার বা টাচস্ক্রিন পিওএস—যেকোনো ডিভাইসে সুপার-স্মুথ ও ১০০% বাংলায় চলবে। কোনো প্রশিক্ষণ ছাড়াই সবাই চালাতে পারবে।',
    tag: 'মোবাইল ও পিসিতে ১০০% রেসপন্সিভ',
    image: '/marketing/15-customer-portal-mobile.png',
    alt: 'মোবাইল ও ডেস্কটপ ফ্রেন্ডলি আধুনিক ইউআই',
  },
];

export const ShowcaseLandingPage: React.FC<ShowcaseLandingPageProps> = ({
  onBackToLogin,
  onOpenPortal,
  onOpenOnlineStore,
  onOpenAdBuilder,
  onOpenDemo,
}) => {
  const { lang, darkMode, toggleDarkMode } = useApp();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyModalPlan, setBuyModalPlan] = useState<'monthly' | 'yearly' | 'custom_vip'>('yearly');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const openBuyModal = (plan: 'monthly' | 'yearly' | 'custom_vip' = 'yearly') => {
    setBuyModalPlan(plan);
    setIsBuyModalOpen(true);
  };

  // Scroll Progress and Floating Action Pill state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showStickyPill, setShowStickyPill] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
      setShowStickyPill(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(134);

  // Lightbox Modal state with Zoom controls
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    title: string;
    caption: string;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  useEffect(() => {
    if (lightboxData) {
      setZoomLevel(1);
    }
  }, [lightboxData]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(Number((prev - 0.5).toFixed(1)), 1));
  const handleResetZoom = () => setZoomLevel(1);
  const toggleClickZoom = () => setZoomLevel((prev) => (prev > 1 ? 1 : 2));

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const el = videoContainerRef.current || videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(curr);
    setVideoProgress((curr / dur) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const target = (parseFloat(e.target.value) / 100) * (videoRef.current.duration || 1);
    videoRef.current.currentTime = target;
    setVideoProgress(parseFloat(e.target.value));
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#FBFDFB] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-[#0A0E17] dark:text-slate-100 font-sans antialiased">
      
      {/* Modals */}
      <BuyProModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} initialPlan={buyModalPlan} />
      <DemoAccessModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* FLOATING ACTION PILL ON SCROLL */}
      {showStickyPill && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-hero-entrance pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 rounded-full border border-slate-700/80 bg-slate-950/95 p-1.5 sm:px-4 sm:py-2 backdrop-blur-xl shadow-2xl text-white">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>মুদির দোকান প্রো</span>
            </span>
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="rounded-full bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-black text-white shadow-md transition cursor-pointer whitespace-nowrap"
            >
              ⚡ ডেমো
            </button>
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-white shadow-md transition cursor-pointer whitespace-nowrap"
            >
              প্রো কিনুন (৫০% ছাড়)
            </button>
            <a
              href="https://wa.me/8801884700631"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition px-2 whitespace-nowrap"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>01884700631</span>
            </a>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL WITH INTERACTIVE ZOOM & DEMO ACCESS */}
      {lightboxData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxData(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 sm:px-6 py-3 text-white gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-black truncate">{lightboxData.title}</h3>
                <p className="text-xs text-slate-400 truncate">{lightboxData.caption}</p>
              </div>

              {/* Interactive Zoom Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-slate-800 rounded-xl px-2 py-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    title="জুম আউট"
                    className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-xs font-bold text-slate-200 px-1 min-w-[3rem] text-center select-none">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    title="জুম ইন"
                    className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  {zoomLevel > 1 && (
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      title="রিসেট (১০০%)"
                      className="p-1 rounded-lg hover:bg-slate-700 text-amber-400 transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setLightboxData(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Zoomable Image Canvas with Pan/Scroll */}
            <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-4 flex items-center justify-center min-h-[350px]">
              <div className="relative overflow-auto max-h-[75vh] max-w-full flex items-center justify-center p-2">
                <img
                  src={lightboxData.url}
                  alt={lightboxData.title}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  }}
                  onClick={toggleClickZoom}
                  title={zoomLevel > 1 ? 'ক্লিক করে রিসেট করুন' : 'ক্লিক করে জুম করুন'}
                  className={`max-h-[72vh] w-auto max-w-full object-contain rounded-xl shadow-2xl transition-all cursor-${zoomLevel > 1 ? 'zoom-out' : 'zoom-in'}`}
                />
              </div>
            </div>

            {/* Clean Lightbox Footer: Live Demo Test (No repetitive pricing!) */}
            <div className="border-t border-slate-800 bg-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                <span>Mudir Dokan Pro · অফিশিয়াল লাইভ ইন্টারফেস</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setLightboxData(null);
                  setIsDemoModalOpen(true);
                }}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-1.5 text-xs font-black text-white transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>⚡ সরাসরি লাইভ ডেমো টেস্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP CLEAN NAVBAR — FIXED SINGLE-LINE STANDARD BUTTONS */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/95 px-3 sm:px-8 py-2.5 sm:py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95">
        {/* Dynamic Top Scroll Progress Bar */}
        <div
          className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-all duration-150 z-50"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img
              src="/mudi-dokan-pro-logo.png"
              alt="Mudi Dokan Pro"
              className="h-8 sm:h-11 w-auto object-contain cursor-pointer"
              onClick={() => {
                window.location.href = '/';
              }}
            />
            <span className="hidden md:inline-block font-black text-slate-800 dark:text-white text-sm tracking-tight whitespace-nowrap">
              মুদি দোকান প্রো
            </span>
          </div>

          {/* Quick Nav Links (DokandarPro style) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-300">
            <a href="#benefits" className="hover:text-emerald-600 transition">সমস্যা ও সমাধান</a>
            <a href="#screens" className="hover:text-emerald-600 transition">স্ক্রিন গ্যালারি</a>
            <a href="#pricing" className="hover:text-emerald-600 transition">প্যাকেজ ও মূল্য</a>
            <a href="tel:01884700631" className="text-emerald-600 hover:underline whitespace-nowrap">হেল্পলাইন: 01884700631</a>
          </nav>

          {/* Action buttons: ALWAYS SINGLE LINE, CLEAN & STANDARD */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Live Demo Link */}
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2 sm:px-3.5 py-1.5 text-xs font-black text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 transition cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="hidden xs:inline">লাইভ </span><span>ডেমো</span>
            </button>

            {/* Login */}
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2 sm:px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition cursor-pointer whitespace-nowrap"
            >
              <Store className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="hidden sm:inline">লগইন</span>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="rounded-full border border-slate-200 bg-white p-1.5 sm:p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer shrink-0"
            >
              {darkMode ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </button>

            {/* Buy Pro Button */}
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-2.5 sm:px-4 py-1.5 text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition cursor-pointer whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="hidden sm:inline">প্রো কিনুন (৫০% ছাড়)</span>
              <span className="sm:hidden">প্রো কিনুন</span>
            </button>
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 1. HERO SECTION — CLEAN, IMPACTFUL & UNCLUTTERED */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden px-4 pt-10 pb-8 sm:px-6 lg:px-8 text-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-600/10" />

        <div className="mx-auto max-w-4xl relative z-10 animate-hero-entrance">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/80 px-4 py-1 text-xs font-black text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300 mb-4 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>মুদি দোকান ও গ্রোসারি ব্যবসার স্মার্ট পিওএস ও ডিজিটাল খাতা</span>
          </div>

          {/* Sharp, Punchy Hook Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.18]">
            দোকান চালান নিশ্চিন্তে, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              হিসাবের দুশ্চিন্তা চিরতরে শেষ!
            </span>
          </h1>

          {/* Clean 1-Sentence Subtitle */}
          <p className="mt-3.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            ১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ, বিদ্যুৎ বা নেট ছাড়াই দ্রুততম বারকোড বিলিং এবং কাস্টমার বাকি আদায়ে অটো হোয়াটসঅ্যাপ ও এসএমএস তাগাদা।
          </p>

          {/* Clean 2-CTA Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-6 py-3 text-sm sm:text-base font-black text-white shadow-xl shadow-amber-500/25 transition cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              <span>⚡ সরাসরি ফ্রি ডেমো টেস্ট করুন</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-6 py-3 text-sm sm:text-base font-black text-white shadow-xl shadow-emerald-700/25 transition cursor-pointer"
            >
              <Zap className="h-5 w-5" />
              <span>প্রো প্যাকেজ কিনুন (৫০% ছাড়)</span>
            </button>
          </div>

        </div>

        {/* ======================================================== */}
        {/* FLOATING PROMO VIDEO PLAYER (HD 1080p বাংলা) */}
        {/* ======================================================== */}
        <ScrollReveal animation="scale" delay={150} className="mx-auto max-w-4xl mt-8">
          <div className="rounded-3xl border border-slate-200/90 bg-slate-950 p-2 sm:p-3 shadow-2xl relative overflow-hidden text-left dark:border-slate-800 animate-glow-pulse">
            
            <div
              ref={videoContainerRef}
              className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center group"
            >
              <video
                ref={videoRef}
                src="/marketing/mudidokan-pro-promo.mp4"
                poster="/marketing/video-poster.jpg"
                playsInline
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => setVideoDuration(videoRef.current?.duration || 134)}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />

              {/* Glowing Center Play Button ONLY (NO TEXT BLOCKING VIDEO) */}
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] transition-all cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-emerald-500/30 animate-ping" />
                    <button
                      type="button"
                      aria-label="ভিডিও চালু করুন"
                      className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:scale-110 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 transition-transform cursor-pointer"
                    >
                      <Play className="h-8 w-8 ml-1 fill-white" />
                    </button>
                  </div>
                </div>
              )}

              {/* Clean Video Controls Bottom Bar with Fullscreen Toggle */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 flex flex-col gap-2 text-white">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={videoProgress || 0}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="hover:text-emerald-400 transition cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="hover:text-emerald-400 transition cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5" />}
                    </button>

                    <span className="font-mono text-[11px] text-slate-300">
                      {formatSec(currentTime)} / {formatSec(videoDuration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      HD 1080p বাংলা
                    </span>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="inline-flex items-center gap-1 rounded-md bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white transition cursor-pointer"
                      title="ফুলস্ক্রিনে দেখুন"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">ফুলস্ক্রিন</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* VIDEO DETAILS & DESCRIPTION (PLACED CLEANLY BELOW VIDEO AS REQUESTED) */}
          <div className="mt-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-black">
                  ▶️ ২ মিনিট ১৪ সেকেন্ড ওয়াকথ্রু
                </span>
                <span className="text-xs text-slate-500 font-bold">অফিশিয়াল বাংলা ডেমো</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1.5">
                কীভাবে মুদির দোকান প্রো আপনার ব্যবসাকে পাল্টে দেবে?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                বারকোড পিওএস, ডিজিটাল বাকি খাতা, থার্মাল প্রিন্ট এবং অনলাইন স্টোরের পূর্ণাঙ্গ বাস্তব ডেমো দেখুন।
              </p>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-black text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Maximize2 className="h-4 w-4 text-emerald-600" />
              <span>ফুলস্ক্রিনে দেখুন</span>
            </button>
          </div>

        </ScrollReveal>

      </section>

      {/* ======================================================== */}
      {/* 2. DOKANDARPRO-STYLE HORIZONTAL VALUE STRIP */}
      {/* ======================================================== */}
      <section className="border-y border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 py-4 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-left">
            
            <div className="flex items-center gap-2.5 p-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">১০০% অফলাইন</h4>
                <p className="text-[10px] text-slate-500">নেট ছাড়া বিলিং</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/70 dark:text-teal-400">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">১,৩৫৯ পণ্য রেডি</h4>
                <p className="text-[10px] text-slate-500">ছবিসহ ক্যাটালগ</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">বাকি খাতা এসএমএস</h4>
                <p className="text-[10px] text-slate-500">১-ক্লিক তাগাদা</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">আসল লাভ-ক্ষতি</h4>
                <p className="text-[10px] text-slate-500">গড় ক্রয়মূল্যে হিসাব</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400">
                <Printer className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">থার্মাল প্রিন্ট</h4>
                <p className="text-[10px] text-slate-500">কালির খরচহীন মেমো</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-1.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">ক্লাউড ব্যাকআপ</h4>
                <p className="text-[10px] text-slate-500">১০০% নিরাপদ ডাটা</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HOOK CONVINCING: মুদি দোকানদারদের ৬টি প্রধান চিন্তা ও সমাধান (PHOTO CARDS) */}
      {/* ======================================================== */}
      <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-6xl">
          
          <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto mb-12">
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              বাস্তব সমাধান
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2 leading-tight">
              মুদি দোকানদারদের ৬টি প্রধান চিন্তা ও আমাদের সমাধান
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              আমরা মুদি দোকানদারদের দৈনন্দিন বাস্তব সমস্যাগুলো ভেতর থেকে বুঝি এবং প্রতিটি সমস্যার ১০০% পরীক্ষিত ডিজিটাল সমাধান তৈরি করেছি।
            </p>
          </ScrollReveal>

          {/* 6 Visual Photo Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {HOOK_PROBLEM_CARDS.map((card, idx) => (
              <ScrollReveal
                key={card.id}
                animation="fade-up"
                delay={idx * 60}
                className="h-full"
              >
                <div className="group h-full rounded-3xl border border-slate-200/90 bg-white shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col justify-between">
                  
                  {/* Photo Header with Zoom Click */}
                  <div
                    className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
                    onClick={() =>
                      setLightboxData({
                        url: card.image,
                        title: card.question,
                        caption: card.tag,
                      })
                    }
                  >
                    <img
                      src={card.image}
                      alt={card.alt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-between p-3">
                      <span className="rounded-md bg-emerald-600/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        <span>{card.tag}</span>
                      </span>

                      <span className="rounded-full bg-white/90 p-1.5 text-slate-900 shadow-md group-hover:scale-110 transition-transform">
                        <Search className="h-3 w-3 text-emerald-700" />
                      </span>
                    </div>

                    <span className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-950/80 backdrop-blur-xs text-xs font-mono font-black text-emerald-400 border border-slate-700/80 shadow-md">
                      {card.badgeNum}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
                        "{card.question}"
                      </h3>
                      <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        <strong className="text-emerald-700 dark:text-emerald-400 font-black">
                          {card.answerStrong}{' '}
                        </strong>
                        {card.answerText}
                      </p>
                    </div>

                    {/* Bottom Action: Test in Live Demo (No repetitive pricing clutter!) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>১০০% সমাধান</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsDemoModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-black text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <span>⚡ সরাসরি ডেমো টেস্ট</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. DOKANDARPRO-STYLE CLEAN 3-COLUMN SCREEN GALLERY (12 FEATURES) */}
      {/* ======================================================== */}
      <section id="screens" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FBFDFB] dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-6xl">
          
          <ScrollReveal animation="fade-up" className="text-center max-w-2xl mx-auto mb-12">
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              সফটওয়্যার এক নজরে
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              মুদির দোকান প্রো-এর বাস্তব স্ক্রিনগুলো দেখুন
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              বারকোড পিওএস ও রেডি ক্যাটালগ থেকে বাকি খাতা, থার্মাল প্রিন্ট, ক্যাশ ড্রয়ার ও লাভ-ক্ষতি—সব আসল স্ক্রিন এক নজরে।
            </p>
          </ScrollReveal>

          {/* Clean 3-Column Screen Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCREEN_CARDS.map((card, idx) => (
              <ScrollReveal
                key={card.id}
                animation="fade-up"
                delay={idx * 40}
                className="h-full"
              >
                <div
                  className="group h-full rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 cursor-pointer flex flex-col justify-between"
                  onClick={() =>
                    setLightboxData({
                      url: card.image,
                      title: card.title,
                      caption: card.subtitle,
                    })
                  }
                >
                  {/* Screenshot Image Container */}
                  <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                    <img
                      src={card.image}
                      alt={card.alt}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Hover Hint */}
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-slate-900 shadow-lg flex items-center gap-1">
                        <Search className="h-3.5 w-3.5 text-emerald-600" />
                        <span>জুম করুন</span>
                      </span>
                    </div>

                    {/* Top Right Hook Tag */}
                    <span className="absolute top-2 right-2 rounded-md bg-slate-950/80 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                      {card.hookPill}
                    </span>
                  </div>

                  {/* Card Bottom Meta (DokandarPro style badge + title + subtitle) */}
                  <div className="pt-3 pb-1 px-1 flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-mono font-black text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                      {card.badgeNum}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {card.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. PRICING SECTION — 4 PACKAGES (AS REQUESTED) */}
      {/* ======================================================== */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-emerald-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-7xl text-center">
          
          <ScrollReveal animation="fade-up">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300 mb-3 animate-pulse">
              <Zap className="h-3.5 w-3.5 text-rose-600" />
              <span>সীমিত সময়ের স্পেশাল অফার</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              আপনার সুবিধার জন্য ৪টি স্পষ্ট প্যাকেজ
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              বিকাশ বা নগদ সেন্ড মানি করুন <strong className="text-emerald-600 font-mono">01884700631</strong> নম্বরে • সাথে সাথে অ্যাক্টিভেশন
            </p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-left max-w-7xl mx-auto">
            
            {/* Package 1: 1 Month Free Demo */}
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      সম্পূর্ণ বিনামূল্যে ⚡
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">১ মাস</span>
                  </div>

                  <h3 className="mt-3 text-base sm:text-lg font-black text-slate-900 dark:text-white">১ মাস ফ্রি ডেমো</h3>
                  
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-amber-600 dark:text-amber-400">৳০</span>
                    <span className="text-xs text-slate-500 font-bold">/১ মাস</span>
                    <span className="text-[10px] font-bold text-emerald-600">ফ্রি ট্রায়াল</span>
                  </div>

                  <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                    টেস্ট করে দেখুন সম্পূর্ণ ফ্রিতে!
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ টেস্ট</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>সুপারফাস্ট অফলাইন বারকোড পিওএস</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>ডিজিটাল বাকি খাতা ও এসএমএস তাগাদা</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>ক্যাশ কাউন্টার ও শিফট ক্লোজিং</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="mt-6 w-full rounded-2xl border-2 border-amber-500 bg-amber-50 py-2.5 text-xs font-black text-amber-900 hover:bg-amber-100 transition cursor-pointer dark:bg-amber-950/40 dark:text-amber-300 whitespace-nowrap"
                >
                  ফ্রি ডেমো শুরু করুন ⚡
                </button>
              </div>
            </ScrollReveal>

            {/* Package 2: Monthly Subscription (499 tk/mo) */}
            <ScrollReveal animation="fade-up" delay={80}>
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      ৫০% মেগা ছাড় 🔥
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">প্রতি মাস</span>
                  </div>

                  <h3 className="mt-3 text-base sm:text-lg font-black text-slate-900 dark:text-white">মাসিক সাবস্ক্রিপশন</h3>
                  
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">৳৪৯৯</span>
                    <span className="text-xs text-slate-500 font-bold">/মাস</span>
                    <span className="font-mono text-[11px] line-through text-slate-400">৳১,০০০</span>
                  </div>

                  <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    ৫০% ছাড়ে প্রতি মাসে মাত্র ৪৯৯৳
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>১,৩৫৯টি রেডি পণ্যের ক্যাটালগ</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>ইনস্ট্যান্ট বারকোড পিওএস ও মেমো প্রিন্ট</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>কাস্টমার বাকি খাতা ও এসএমএস তাগাদা</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>দৈনিক ক্যাশ ড্রয়ার ও শিফট ক্লোজিং</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openBuyModal('monthly')}
                  className="mt-6 w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-2.5 text-xs font-black text-emerald-900 hover:bg-emerald-100 transition cursor-pointer dark:bg-emerald-950/40 dark:text-emerald-300 whitespace-nowrap"
                >
                  মাসিক প্যাকেজ নিন (৳৪৯৯) ⚡
                </button>
              </div>
            </ScrollReveal>

            {/* Package 3: Yearly Subscription (299 tk/month, No Domain & Hosting Fee) */}
            <ScrollReveal animation="scale" delay={160}>
              <div className="relative h-full rounded-3xl border-2 border-emerald-500 bg-white p-5 sm:p-6 shadow-xl flex flex-col justify-between ring-4 ring-emerald-500/10 dark:border-emerald-500 dark:bg-slate-900 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-3 py-1 text-[10px] font-black text-white shadow-md whitespace-nowrap">
                  ⭐ সেরা সেভার (সবচেয়ে জনপ্রিয়)
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      নো ডোমেন ও হোস্টিং ফি 🔥
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">বাৎসরিক অফার</span>
                  </div>

                  <h3 className="mt-3 text-base sm:text-lg font-black text-slate-900 dark:text-white">১ বছর বাৎসরিক প্যাকেজ</h3>
                  
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">৳২৯৯</span>
                    <span className="text-xs text-slate-500 font-bold">/মাস</span>
                    <span className="font-mono text-[11px] line-through text-slate-400">৳১,০০০</span>
                  </div>

                  <div className="mt-1.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-left">
                    <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                      বাৎসরিক মাত্র ৳৩,৫৮৮ (মাসে ৳২৯৯!)
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                      ✓ কোনো ডোমেন ও হোস্টিং ফি নেই • ফ্রি ক্লাউড
                    </p>
                  </div>

                  <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>পূর্ণ ১ বছরের আনলিমিটেড লাইসেন্স</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>ফ্রি অনলাইন বাজার স্টোর ও সাবডোমেন</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>নো ডোমেন ও হোস্টিং ফি (ক্লাউড ব্যাকআপ ফ্রি)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>২৪/৭ ভিআইপি হোয়াটসঅ্যাপ সাপোর্ট ও অটো আপডেট</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openBuyModal('yearly')}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-2.5 text-xs font-black text-white hover:from-emerald-700 shadow-md shadow-emerald-600/30 transition cursor-pointer whitespace-nowrap"
                >
                  বাৎসরিক প্যাকেজ কিনুন (৳৩,৫৮৮) ⚡
                </button>
              </div>
            </ScrollReveal>

            {/* Package 4: Custom Domain & Client's Demand VIP (15,000 tk Including All) */}
            <ScrollReveal animation="fade-up" delay={240}>
              <div className="h-full rounded-3xl border border-indigo-200 bg-white p-5 sm:p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between dark:border-indigo-900/60 dark:bg-slate-900">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      👑 কাস্টম ডোমেন ও ডিমান্ড
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600">VIP সলিউশন</span>
                  </div>

                  <h3 className="mt-3 text-base sm:text-lg font-black text-slate-900 dark:text-white">কাস্টম ডোমেন ফুল সেটআপ</h3>
                  
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-black text-indigo-700 dark:text-indigo-400">৳১৫,০০০</span>
                    <span className="text-[10px] text-slate-500 font-bold">Including All</span>
                  </div>

                  <p className="mt-1 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    ক্লায়েন্টের চাহিদা অনুযায়ী তৈরি
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>ক্লায়েন্টের চাহিদা অনুযায়ী কাস্টমাইজড সফটওয়্যার</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>নিজস্ব .com ডোমেন সহ (যেমন: yourshop.com)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>ডেডিকেটেড হাই-স্পিড ক্লাউড হোস্টিং ও সার্ভার</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>সম্পূর্ণ এককালীন খরচ অন্তর্ভুক্ত (No Hidden Fees)</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => openBuyModal('custom_vip')}
                  className="mt-6 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/30 transition cursor-pointer whitespace-nowrap"
                >
                  ভিআইপি প্যাকেজ অর্ডার করুন (৳১৫,০০০) 👑
                </button>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. FOOTER */}
      {/* ======================================================== */}
      <footer className="border-t border-slate-200/80 bg-white py-6 px-4 dark:border-slate-800 dark:bg-slate-950 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Mudir Dokan Pro — Smart Grocery Solution.</p>
          <div className="flex items-center gap-4 font-bold text-slate-600 dark:text-slate-400">
            <span>হোয়াটসঅ্যাপ হেল্পলাইন: 01884700631</span>
            <button type="button" onClick={onOpenPortal} className="hover:text-emerald-600 cursor-pointer">
              কাস্টমার পোর্টাল
            </button>
            <button type="button" onClick={onBackToLogin} className="hover:text-emerald-600 cursor-pointer">
              দোকানদার লগইন
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};
