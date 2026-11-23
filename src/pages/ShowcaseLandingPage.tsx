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
  Layers,
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
  Sparkle,
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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
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

interface ShowcaseTab {
  id: string;
  tabLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  tagColor: string;
  hookTitle: string;
  punchline: string;
  highlights: { title: string; desc: string }[];
  screenshots: {
    title: string;
    caption: string;
    image: string;
    alt: string;
  }[];
}

const SHOWCASE_TABS: ShowcaseTab[] = [
  {
    id: 'pos',
    tabLabel: 'সুপারফাস্ট পিওএস ও মেমো',
    icon: Zap,
    tag: 'কাউন্টার স্পিড',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    hookTitle: 'কাস্টমারের দীর্ঘ লাইন? মাত্র ১ সেকেন্ডে বারকোড স্ক্যানে মেমো প্রিন্ট!',
    punchline: 'ইন্টারনেট চলে গেলেও ১ সেকেন্ডের জন্য বিল থামবে না। ক্যাশ, বিকাশ বা বাকিতে বিক্রি—সব চলবে ১০০% অফলাইনে।',
    highlights: [
      { title: '১ সেকেন্ডে বারকোড বিলিং', desc: 'আইটেমের ছবিতে স্পর্শ বা স্ক্যান করলেই তাৎক্ষণিক কার্টে অ্যাড।' },
      { title: 'বাকিতে বিক্রি (Due Sale)', desc: 'কাস্টমার সিলেক্ট করলেই আগের বাকি ও নতুন বাকি স্বয়ংক্রিয় যোগ।' },
      { title: 'থার্মাল মেমো প্রিন্ট', desc: 'কালির খরচ ছাড়া ব্লুটুথ প্রিন্টারে ৫৮মিমি/৮০মিমি প্রফেশনাল ভাউচার।' },
    ],
    screenshots: [
      {
        title: 'ভিজ্যুয়াল বারকোড পিওএস কাউন্টার',
        caption: 'পণ্য ও ব্র্যান্ড ফিল্টার সহ সুপারফাস্ট বিলিং স্ক্রিন',
        image: '/marketing/02-pos-billing-counter.png',
        alt: 'POS Billing Counter',
      },
      {
        title: 'বাকি বিক্রি ও কাস্টমার খাতা পপআপ',
        caption: 'আগের বাকি ও নতুন মেমোর মোট বকেয়া নিখুঁত ক্যালকুলেশন',
        image: '/marketing/03-pos-due-sale-khata.png',
        alt: 'POS Due Sale Modal',
      },
      {
        title: 'থার্মাল প্রিন্টার মেমো রসিদ',
        caption: 'দোকানের নাম, মেমো নম্বর ও আইটেমাইজড রসিদ প্রিন্ট প্রিভিউ',
        image: '/marketing/04-receipt-thermal-print.png',
        alt: 'Thermal Receipt Preview',
      },
    ],
  },
  {
    id: 'catalog',
    tabLabel: '১,৩৫৯টি আসল পণ্যের ছবি রেডি',
    icon: Package,
    tag: 'জিরো টাইপিং',
    tagColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    hookTitle: 'হাজার পণ্যের নাম আর ছবি কে তুলবে? ১,৩৫৯টি আসল পণ্যের ছবি আমরাই রেডি রেখেছি!',
    punchline: 'কোনো ডাটা এন্ট্রির ঝামেলা নেই। তীর, রূপচাঁদা, প্রাণ, স্কয়ার থেকে লাক্স, ডানো পর্যন্ত—সব পণ্য ছবিসহ আজই রেডি।',
    highlights: [
      { title: '১,৩৫৯টি ফটো ক্যাটালগ', desc: 'হোয়াইট ব্যাকগ্রাউন্ড আসল পণ্যের ছবি ও ওজন/সাইজ প্রি-সেট।' },
      { title: '৭৫টি অফিশিয়াল ব্র্যান্ড লোগো', desc: 'শীর্ষস্থানীয় ব্র্যান্ডের লোগো দেখে সেকেন্ডে আইটেম ফিল্টার।' },
      { title: '২৮টি সাজানো ক্যাটাগরি', desc: 'চাল-ডাল, তেল-ঘি, মশলা, বিস্কুটসহ সুসজ্জিত খাদ্যপণ্য বিভাগ।' },
    ],
    screenshots: [
      {
        title: '১,৩৫৯টি মুদি পণ্যের ভিজ্যুয়াল গ্রিড',
        caption: 'আসল ছবি, সাইজ, স্টক ও বিক্রয়মূল্য সহ ক্যাটালগ',
        image: '/marketing/05-product-catalog-grid.png',
        alt: 'Grocery Product Catalog',
      },
      {
        title: '৭৫টি শীর্ষস্থানীয় ব্র্যান্ডের লোগো',
        caption: 'প্রাণ, ফ্রেশ, এসিআই, স্কয়ার, বসুন্ধরা ইত্যাদি অফিশিয়াল লোগো',
        image: '/marketing/06-brands-logos-showcase.png',
        alt: 'FMCG Brand Logos',
      },
      {
        title: '২৮টি ক্যাটাগরি ভিত্তিক ভিজ্যুয়াল ভিউ',
        caption: 'খাদ্যপণ্যের ছবিসহ সুসজ্জিত ক্যাটাগরি বিভাগ',
        image: '/marketing/07-categories-grid.png',
        alt: 'Visual Categories Grid',
      },
    ],
  },
  {
    id: 'khata',
    tabLabel: 'ডিজিটাল বাকি খাতা ও এসএমএস',
    icon: Smartphone,
    tag: 'বাকি আদায়',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    hookTitle: 'বাকি চাইতে মুখে লজ্জা? ১ ক্লিকে হোয়াটসঅ্যাপ ও এসএমএস তাগাদা পাঠান!',
    punchline: 'সম্পর্ক নষ্ট না করে সম্মানজনক ভাষায় অটো তাগাদা মেসেজ। কাস্টমার নিজে ঘরে বসেই মোবাইল দিয়ে তার বাকি ও মেমো দেখতে পারবে।',
    highlights: [
      { title: 'ডিজিটাল বাকি খাতা লেজার', desc: 'কাগজের খাতা হারানোর ভয় নেই—কার কত বাকি ও লেনদেন ইতিহাস এক ক্লিকে।' },
      { title: '০ থেকে ৬০+ দিন বাকি এজিং', desc: 'কোন বাকি কতদিন আটকে আছে তা চিহ্নিত করে দ্রুত টাকা আদায়ের ব্যবস্থা।' },
      { title: 'কাস্টমার সেলফ-সার্ভিস পোর্টাল', desc: 'কাস্টমার তার ফোনে ওটিপি দিয়ে নিজের রসিদ ও বাকি সরাসরি চেক করতে পারে।' },
    ],
    screenshots: [
      {
        title: 'কাস্টমার ডিজিটাল বাকি খাতা',
        caption: 'ব্যালেন্স লেজার, মোট ক্রয়, ক্রেডিট লিমিট ও কিউআর পোর্টাল',
        image: '/marketing/13-customers-digital-khata.png',
        alt: 'Customer Khata Ledger',
      },
      {
        title: 'বাকি এজিং এনালাইসিস রিপোর্ট',
        caption: '০-৭, ৮-১৫, ১৬-৩০, ৩১-৬০ ও ৬০+ দিন অনুযায়ী বকেয়া ট্র্যাকিং',
        image: '/marketing/14-due-aging-reports.png',
        alt: 'Due Aging Analysis',
      },
    ],
  },
  {
    id: 'profit',
    tabLabel: 'আসল লাভ-লোকসান ও ক্যাশ ড্রয়ার',
    icon: TrendingUp,
    tag: 'নিখুঁত লাভ',
    tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    hookTitle: 'সারাদিন লাখ টাকার বিক্রি করলেন, কিন্তু আসল লাভ কত? দিনশেষে ১ পয়সাও অমিল হবে না!',
    punchline: 'ওয়েটেড এভারেজ কস্টিংয়ে পাইকারি কেনা দাম ও দোকান খরচ বাদ দিয়ে আসল নিট প্রফিট। ক্যাশ ড্রয়ারের নগদ টাকার সাথে সফটওয়্যার হুবহু মিলে যাবে।',
    highlights: [
      { title: 'আসল লাভ-লোকসান চার্ট', desc: 'প্রতিটি পণ্যের ক্রয়মূল্যের নিখুঁত গড়ের ভিত্তিতে গ্রস ও নিট প্রফিট।' },
      { title: 'দোকান খরচ ও পরিচালনা খাতা', desc: 'দোকান ভাড়া, কারেন্ট বিল, নাস্তা খরচ বাদ দিয়ে প্রকৃত লাভ।' },
      { title: 'ক্যাশ ড্রয়ার শিফট ক্লোজিং', desc: 'সকালের ওপেনিং ক্যাশ ও সারাদিনের লেনদেন মিলিয়ে রাতের ক্লোজিং।' },
    ],
    screenshots: [
      {
        title: 'রিয়েল-টাইম ড্যাশবোর্ড ও লাভ-ক্ষতির ট্রেন্ড',
        caption: 'পিরিয়ড সেলস, গ্রস প্রফিট (৳৮৭,৬৫৯.১০) ও ক্যাটাগরি সেলস চার্ট',
        image: '/marketing/01-dashboard-analytics.png',
        alt: 'Profit Loss Dashboard',
      },
      {
        title: 'ইনভেন্টরি স্টক ও সম্পদ মূল্যায়ন',
        caption: 'দোকানে বর্তমান কেনা দামে মোট কত টাকার মালামাল স্টক আছে',
        image: '/marketing/08-inventory-valuation.png',
        alt: 'Inventory Valuation',
      },
      {
        title: 'দৈনিক ক্যাশ ড্রয়ার শিফট ক্লোজিং',
        caption: 'ক্যাশ ইন/আউট এন্ট্রি ও ড্রয়ারের নগদ টাকার সাথে সফটওয়্যার মেলানো',
        image: '/marketing/16-cash-register-closing.png',
        alt: 'Cash Register Closing',
      },
      {
        title: 'দোকান ভাড়া ও পরিচালন খরচ খাতা',
        caption: 'ভাড়া, বিদ্যুৎ ও নাস্তা খরচ বাদ দিয়ে নিখুঁত অপারেটিং নিট লাভ',
        image: '/marketing/15-shop-expenses.png',
        alt: 'Shop Expenses Ledger',
      },
    ],
  },
  {
    id: 'suppliers',
    tabLabel: 'কোম্পানি চালান ও মহাজন দেনা',
    icon: Store,
    tag: 'মহাজন খাতা',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    hookTitle: 'কার্টনে মাল কিনে খুচরা বিক্রি করেন? কোম্পানির চালানে ১ টাকারও গরমিল হবে না!',
    punchline: 'গাড়ি ভাড়া বা পরিবহন খরচ স্বয়ংক্রিয়ভাবে প্রতিটি পিসের আসল কেনা দামে যুক্ত হয়। কোম্পানি ও মহাজনের চালান দেনা-পাওনা সম্পূর্ণ স্বচ্ছ।',
    highlights: [
      { title: 'কার্টন-টু-পিস কনভার্সন', desc: 'কার্টন বা বস্তায় কিনে খুচরা পিস বা কেজিতে রূপান্তরের অটোমেটিক কস্টিং।' },
      { title: 'কোম্পানি চালান ট্র্যাকিং', desc: 'ইউনিলিভার, স্কয়ার, প্রাণ বা মহাজনের ইনভয়েস নম্বরসহ চালান সংরক্ষণ।' },
      { title: 'মহাজন দেনা লেজার খাতা', desc: 'কোম্পানির দেনা-পাওনা নিয়ে আর কোনো ভুল বোঝাবুঝি বা অমিল থাকবে না।' },
    ],
    screenshots: [
      {
        title: 'ডিস্ট্রিবিউটর চালান এন্ট্রি ও ইউনিট কনভার্সন',
        caption: 'কার্টন টু বেস পিস কনভার্সন, গাড়ি ভাড়া ও কেনা দাম হিসাব',
        image: '/marketing/09-distributor-purchase.png',
        alt: 'Distributor Purchase Challan',
      },
      {
        title: 'সাপ্লায়ার ও মহাজন ডিরেক্টরি',
        caption: 'মোট ক্রয়, মোট পরিশোধ ও বকেয়া দেনা (Payable) লেজার',
        image: '/marketing/10-suppliers-directory.png',
        alt: 'Suppliers Directory Ledger',
      },
    ],
  },
  {
    id: 'ecommerce',
    tabLabel: 'অনলাইন বাজার ও ফেসবুক অ্যাড',
    icon: ShoppingBag,
    tag: 'ডিজিটাল সেলস',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    hookTitle: 'এলাকার কাস্টমাররা ঘরে বসে অর্ডার করতে চায়? চালডাল ও ঘরেরবাজার স্টাইলে অনলাইন স্টোর চালান!',
    punchline: 'কাস্টমারদের জন্য তৈরি ১-পেজ ফাস্ট চেকআউট এবং ফেসবুক ও টিকটক বিজ্ঞাপনে বিক্রি বাড়ানোর ল্যান্ডিং পেজ বিল্ডার।',
    highlights: [
      { title: 'অনলাইন গ্রোসারি শপ', desc: 'জেলা ও দোকান সিলেক্ট করে কাস্টমাররা ঘরে বসেই মোবাইল দিয়ে অর্ডার করতে পারবে।' },
      { title: '১-পেজ ফাস্ট চেকআউট', desc: 'কোনো লগইন ছাড়াই নাম ও ঠিকানায় ক্যাশ অন ডেলিভারিতে অর্ডার গ্রহণ।' },
      { title: 'অ্যাড ল্যান্ডিং বিল্ডার', desc: 'ইউটিউব ভিডিও ও ফেসবুক পিক্সেল বসিয়ে ২ মিনিটে বিজ্ঞাপনের ল্যান্ডিং পেজ তৈরি।' },
    ],
    screenshots: [
      {
        title: 'অনলাইন বাজার স্টোরফ্রন্ট',
        caption: 'জেলা ও দোকান নির্বাচন সহ আসল পণ্যের অনলাইন অর্ডার পেজ',
        image: '/marketing/11-online-storefront.png',
        alt: 'Online Storefront',
      },
      {
        title: 'স্লাইড-ইন কার্ট ও ১-পেজ চেকআউট',
        caption: 'ক্যাশ অন ডেলিভারি ও বিকাশ অগ্রিম পেমেন্টে ঝামেলাহীন অর্ডার',
        image: '/marketing/12-online-cart-checkout.png',
        alt: 'Online Cart Checkout',
      },
      {
        title: 'ফেসবুক ও টিকটক অ্যাড ল্যান্ডিং পেজ',
        caption: 'ভিডিও রিভিউ ও সরাসরি অর্ডার ফর্ম সহ হাই-কনভার্টিং ল্যান্ডিং পেজ',
        image: '/marketing/17-ad-landing-live-preview.png',
        alt: 'Ad Landing Page Preview',
      },
      {
        title: 'অ্যাড ল্যান্ডিং পেজ বিল্ডার ও পিক্সেল',
        caption: 'টেমপ্লেট নির্বাচন, অফার প্রাইজ ও পিক্সেল ট্র্যাকিং সেটআপ',
        image: '/marketing/18-ad-landing-builder.png',
        alt: 'Ad Landing Builder',
      },
    ],
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
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('pos');
  const [activeScreenshotIdx, setActiveScreenshotIdx] = useState<number>(0);

  // Scroll Progress and Floating Action Pill state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showStickyPill, setShowStickyPill] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }
      setShowStickyPill(window.scrollY > 480);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Video player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(134);

  // Lightbox Modal state
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    title: string;
    caption: string;
  } | null>(null);

  const activeTab = SHOWCASE_TABS.find((t) => t.id === activeTabId) || SHOWCASE_TABS[0];
  const activeScreenshot = activeTab.screenshots[activeScreenshotIdx] || activeTab.screenshots[0];

  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
    setActiveScreenshotIdx(0);
  };

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
    <div className="min-h-screen bg-[#FAFCF8] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-[#090D16] dark:text-slate-100 font-sans antialiased">
      
      {/* Modals */}
      <BuyProModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      <DemoAccessModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* FLOATING ACTION PILL ON SCROLL */}
      {showStickyPill && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-hero-entrance pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 rounded-full border border-slate-700/80 bg-slate-950/90 p-2 sm:px-4 sm:py-2.5 backdrop-blur-xl shadow-2xl text-white">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>মুদির দোকান প্রো</span>
            </span>
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="rounded-full bg-amber-500 hover:bg-amber-600 px-4 py-1.5 text-xs font-black text-white shadow-md transition cursor-pointer"
            >
              ⚡ ফ্রি ডেমো টেস্ট
            </button>
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-black text-white shadow-md transition cursor-pointer"
            >
              প্রো কিনুন (৫০% ছাড়)
            </button>
            <a
              href="https://wa.me/8801884700631"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white transition px-2"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>01884700631</span>
            </a>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
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
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-3.5 text-white">
              <div>
                <h3 className="text-sm sm:text-base font-black truncate">{lightboxData.title}</h3>
                <p className="text-xs text-slate-400">{lightboxData.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-4 flex items-center justify-center">
              <img
                src={lightboxData.url}
                alt={lightboxData.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="border-t border-slate-800 bg-slate-900 px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-bold">Mudir Dokan Pro · অফিশিয়াল ইন্টারফেস</span>
              <button
                type="button"
                onClick={() => {
                  setLightboxData(null);
                  setIsBuyModalOpen(true);
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-black text-white transition cursor-pointer"
              >
                প্রো চালু করুন (৳৪৯৯/মাস) ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP CLEAN NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 px-4 sm:px-8 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
        {/* Dynamic Scroll Progress Bar */}
        <div
          className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-all duration-150 z-50"
          style={{ width: `${scrollProgress}%` }}
        />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <img
              src="/mudi-dokan-pro-logo.png"
              alt="Mudi Dokan Pro"
              className="h-10 sm:h-11 w-auto object-contain cursor-pointer"
              onClick={() => {
                window.location.href = '/';
              }}
            />
            <span className="hidden sm:inline-block font-black text-slate-800 dark:text-white text-sm">
              মুদি দোকান প্রো
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Demo Link */}
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 text-xs font-black text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>⚡ লাইভ ডেমো</span>
            </button>

            {/* Online Storefront link */}
            {onOpenOnlineStore && (
              <button
                type="button"
                onClick={onOpenOnlineStore}
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-900 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300 transition cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-teal-600" />
                <span>অনলাইন শপ</span>
              </button>
            )}

            {/* Login */}
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              <Store className="h-3.5 w-3.5 text-slate-500" />
              <span>লগইন</span>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Buy Pro Button */}
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-1.5 text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>প্রো কিনুন (৫০% ছাড়)</span>
            </button>
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* HERO SECTION — ENTRANCE ANIMATION & CLEAN HOOK */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden px-4 pt-10 pb-12 sm:px-6 lg:px-8 text-center">
        {/* Subtle Ambient Radial Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-600/10" />

        <div className="mx-auto max-w-4xl relative z-10 animate-hero-entrance">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/80 px-4 py-1.5 text-xs font-black text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/60 dark:text-emerald-300 mb-5 shadow-xs">
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
          <p className="mt-4 text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            ১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ, বিদ্যুৎ বা নেট ছাড়াই দ্রুততম বারকোড বিলিং এবং কাস্টমার বাকি আদায়ে ১-ক্লিক অটোমেটিক এসএমএস তাগাদা।
          </p>

          {/* Clean 2-CTA Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-amber-500/25 transition cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              <span>⚡ সরাসরি ফ্রি ডেমো টেস্ট করুন</span>
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

        {/* ======================================================== */}
        {/* FLOATING PROMO VIDEO PLAYER WITH GLOW PULSE */}
        {/* ======================================================== */}
        <ScrollReveal animation="scale" delay={150} className="mx-auto max-w-4xl mt-10">
          <div className="rounded-3xl border border-slate-200/80 bg-slate-950 p-2 sm:p-3 shadow-2xl relative overflow-hidden text-left dark:border-slate-800 animate-glow-pulse">
            
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              
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

              {/* Glowing Center Play Overlay */}
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] transition-all cursor-pointer p-4 text-center"
                  onClick={togglePlay}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="absolute h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-emerald-500/30 animate-ping" />
                    <button
                      type="button"
                      aria-label="ভিডিও চালু করুন"
                      className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:scale-105 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/50 transition-transform cursor-pointer"
                    >
                      <Play className="h-8 w-8 ml-1 fill-white" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3.5 py-1 text-xs font-bold text-emerald-200">
                      ▶️ ২ মিনিট ১৪ সেকেন্ডের লাইভ প্রেজেন্টেশন
                    </span>
                    <h3 className="text-base sm:text-xl font-black text-white mt-1.5 drop-shadow-md">
                      কীভাবে মুদির দোকান প্রো আপনার ব্যবসাকে পাল্টে দেবে?
                    </h3>
                  </div>
                </div>
              )}

              {/* Clean Video Controls Bottom Bar */}
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
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="hover:text-emerald-400 transition cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5" />}
                    </button>

                    <span className="font-mono text-[11px] text-slate-300">
                      {formatSec(currentTime)} / {formatSec(videoDuration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      HD 1080p বাংলা
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* 4 Clean Micro-Pill Benefits */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pt-2 border-t border-slate-800 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2 p-1.5">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>১০০% অফলাইনে বিলিং</span>
              </div>
              <div className="flex items-center gap-2 p-1.5">
                <Package className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>১,৩৫৯টি আসল পণ্যের ছবি</span>
              </div>
              <div className="flex items-center gap-2 p-1.5">
                <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>অটোমেটিক বাকি এসএমএস</span>
              </div>
              <div className="flex items-center gap-2 p-1.5">
                <Printer className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>থার্মাল মেমো প্রিন্ট</span>
              </div>
            </div>

          </div>
        </ScrollReveal>

      </section>

      {/* ======================================================== */}
      {/* INTERACTIVE HOOK-DRIVEN SHOWCASE (CLEAN DOKANDARPRO-STYLE) */}
      {/* ======================================================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl">
          
          <ScrollReveal animation="fade-up" delay={50} className="text-center max-w-3xl mx-auto mb-8">
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ফিচার প্রেজেন্টেশন ও লাইভ স্ক্রিনশট
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              আপনার দোকানের প্রতিটি সমস্যার সহজ সমাধান
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              নিচের ট্যাবগুলোতে ক্লিক করে প্রতিটি মডিউলের আসল ইন্টারফেস ও কার্যকারিতা দেখুন।
            </p>
          </ScrollReveal>

          {/* Interactive Navigation Tabs */}
          <ScrollReveal animation="fade-up" delay={100} className="flex overflow-x-auto pb-2 scrollbar-none items-center justify-start sm:justify-center gap-2 mb-8">
            {SHOWCASE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-102 dark:bg-emerald-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{tab.tabLabel}</span>
                </button>
              );
            })}
          </ScrollReveal>

          {/* Active Tab Spotlight Showcase Card */}
          <ScrollReveal animation="scale" delay={150}>
            <div className="rounded-3xl border border-slate-200/90 bg-[#F9FBFA] p-6 sm:p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 transition-all hover:shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left Column: Sharp Hook & Punchy Points */}
                <div className="lg:col-span-5 space-y-4">
                  
                  <span className={`inline-block rounded-full border px-3 py-0.5 text-xs font-black ${activeTab.tagColor}`}>
                    {activeTab.tag}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug">
                    {activeTab.hookTitle}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {activeTab.punchline}
                  </p>

                  {/* Micro Highlights */}
                  <div className="space-y-3 pt-2">
                    {activeTab.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mt-0.5">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {h.title}
                          </h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {h.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sub-Screenshot Selector Pills */}
                  {activeTab.screenshots.length > 1 && (
                    <div className="pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        স্ক্রিনশট পরিবর্তন করুন:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeTab.screenshots.map((s, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setActiveScreenshotIdx(sIdx)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                              activeScreenshotIdx === sIdx
                                ? 'bg-slate-900 text-white shadow-sm dark:bg-emerald-600'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {sIdx + 1}. {s.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxData({
                          url: activeScreenshot.image,
                          title: activeScreenshot.title,
                          caption: activeScreenshot.caption,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-xs hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300 transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      <span>পূর্ণাঙ্গ স্ক্রিনশট দেখুন ↗</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDemoModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 cursor-pointer"
                    >
                      <span>ডেমো মোডে চালান</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>

                {/* Right Column: Clean Screenshot Frame with Hover Zoom */}
                <div className="lg:col-span-7">
                  <div
                    className="rounded-2xl border border-slate-200/90 bg-white shadow-lg overflow-hidden group/screen relative cursor-pointer dark:border-slate-700 dark:bg-slate-950 hover:shadow-2xl transition-all duration-300"
                    onClick={() =>
                      setLightboxData({
                        url: activeScreenshot.image,
                        title: activeScreenshot.title,
                        caption: activeScreenshot.caption,
                      })
                    }
                  >
                    {/* Mock Window Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                        <span className="ml-2 font-mono text-[10px] text-slate-400">mudidokanpro.web.app</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <Search className="h-3 w-3" />
                        <span>জুম করতে ক্লিক করুন</span>
                      </span>
                    </div>

                    <img
                      src={activeScreenshot.image}
                      alt={activeScreenshot.alt}
                      className="w-full h-auto object-cover group-hover/screen:scale-101 transition-transform duration-300"
                    />

                    {/* Caption Bar */}
                    <div className="p-3 bg-white border-t border-slate-100 dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{activeScreenshot.title}</p>
                        <p className="text-[11px] text-slate-500">{activeScreenshot.caption}</p>
                      </div>
                      <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                        লাইভ ইন্টারফেস
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 6-PILLAR BENTO GRID WITH STAGGERED SCROLL REVEAL */}
      {/* ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#FAFCF8] dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800/80">
        <div className="mx-auto max-w-6xl">
          
          <ScrollReveal animation="fade-up" delay={50} className="text-center max-w-2xl mx-auto mb-10">
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ৬টি অতুলনীয় সুবিধা
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
              কেন মুদির দোকান প্রো আপনার সেরা পছন্দ?
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Card 1 */}
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="h-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">১০০% অফলাইন পিওএস</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  দোকানের কারেন্ট বা ওয়াইফাই চলে গেলেও কাউন্টারের একটি সেলও আটকাবে না। অফলাইনে বিল প্রিন্ট হবে এবং নেট আসলে ক্লাউডে অটো-সিঙ্ক হবে।
                </p>
              </div>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal animation="fade-up" delay={100}>
              <div className="h-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400 mb-4">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">১,৩৫৯টি আসল পণ্যের ফটো</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  আপনাকে বসে বসে ১ মাস ধরে পণ্যের ছবি ও নাম এন্ট্রি করতে হবে না। বাংলাদেশের জনপ্রিয় সব ব্র্যান্ড ও গ্রোসারি পণ্য আগে থেকেই রেডি।
                </p>
              </div>
            </ScrollReveal>

            {/* Card 3 */}
            <ScrollReveal animation="fade-up" delay={200}>
              <div className="h-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mb-4">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">অটো হোয়াটসঅ্যাপ ও এসএমএস</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  মুখে চেয়ে সম্পর্ক খারাপ না করে কাস্টমারকে সম্মানজনক ভাষায় ডিজিটাল মেমো ও বাকির তাগাদা পাঠান। টাকা আদায় হবে দ্রুত।
                </p>
              </div>
            </ScrollReveal>

            {/* Card 4 */}
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="h-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">আসল লাভ ও কস্টিং ইঞ্জিন</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ওয়েটেড এভারেজ কস্টিং ফর্মুলায় প্রতিটি পণ্যের ক্রয়মূল্য ও দোকান খরচ বাদ দিয়ে আসল লাভ হিসাব হবে—কখনোই লস হবে না।
                </p>
              </div>
            </ScrollReveal>

            {/* Card 5 */}
            <ScrollReveal animation="fade-up" delay={400}>
              <div className="h-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
                  <Printer className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">কালির খরচহীন থার্মাল প্রিন্ট</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  যেকোনো ব্লুটুথ বা ইউএসবি থার্মাল প্রিন্টারে মাত্র ১ সেকেন্ডে দোকান ব্র্যান্ডিং সহ মেমো প্রিন্ট। প্রতি মাসে কালির হাজার টাকা সাশ্রয়।
                </p>
              </div>
            </ScrollReveal>

            {/* Card 6 */}
            <ScrollReveal animation="fade-up" delay={500}>
              <div className="h-full rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-4">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">ফ্রি অনলাইন গ্রোসারি স্টোর</h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ঘরেরবাজার ও চালডাল ধাঁচের নিজস্ব অনলাইন অর্ডার স্টোরফ্রন্ট। এলাকার কাস্টমাররা ঘরে বসেই মোবাইল দিয়ে অর্ডার করতে পারবে।
                </p>
              </div>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* CLEAN COMPARISON TABLE WITH SCROLL REVEAL */}
      {/* ======================================================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/60 border-t border-slate-200/70 dark:border-slate-800/80">
        <div className="mx-auto max-w-4xl text-center">
          
          <ScrollReveal animation="fade-up" delay={50}>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              কাগজের খাতা বনাম মুদির দোকান প্রো
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              খাতার হিসাবে ভুল ও ক্ষতি বন্ধ করে আধুনিক ব্যবসার নিয়ন্ত্রণ নিজের হাতে নিন।
            </p>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={150} className="mt-8">
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-950 text-left">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 font-black text-slate-700 dark:text-slate-200">
                    <th className="p-3.5 sm:p-4">বিষয়</th>
                    <th className="p-3.5 sm:p-4 text-slate-400">কাগজের খাতা</th>
                    <th className="p-3.5 sm:p-4 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-black">
                      মুদির দোকান প্রো 👑
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-300">
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white">১,৩৫৯টি পণ্যের ফটো ক্যাটালগ</td>
                    <td className="p-3.5 sm:p-4 text-rose-500">❌ নেই</td>
                    <td className="p-3.5 sm:p-4 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold">
                      ✅ আগে থেকেই লোড করা
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white">ইন্টারনেট ছাড়া অফলাইন পিওএস</td>
                    <td className="p-3.5 sm:p-4 text-slate-500">ম্যানুয়াল কলম-কাগজ</td>
                    <td className="p-3.5 sm:p-4 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold">
                      ✅ ১০০% সচল অফলাইনেও
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white">বাকি কালেকশনে অটো এসএমএস</td>
                    <td className="p-3.5 sm:p-4 text-rose-500">❌ চেয়ে চেয়ে লজ্জা</td>
                    <td className="p-3.5 sm:p-4 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold">
                      ✅ ১-ক্লিকে প্রফেশনাল তাগাদা
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white">আসল লাভ ও ক্যাশ ড্রয়ার মেলানো</td>
                    <td className="p-3.5 sm:p-4 text-rose-500">❌ কখনো মেলে না</td>
                    <td className="p-3.5 sm:p-4 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-bold">
                      ✅ ১ পয়সারও অমিল থাকবে না
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollReveal>

        </div>
      </section>

      {/* ======================================================== */}
      {/* CLEAN PRICING SECTION — MATCHING PROMO VIDEO EXACTLY */}
      {/* ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-emerald-50/20 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-5xl text-center">
          
          <ScrollReveal animation="fade-up" delay={50}>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3.5 py-1 text-xs font-black text-rose-800 dark:bg-rose-950 dark:text-rose-300 mb-3 animate-pulse">
              <Zap className="h-3.5 w-3.5 text-rose-600" />
              <span>সীমিত সময়ের স্পেশাল অফার</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              আপনার সুবিধাজনক প্যাকেজ বেছে নিন
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              বিকাশ বা নগদ সেন্ড মানি করুন <strong className="text-emerald-600 font-mono">01884700631</strong> নম্বরে • সাথে সাথে অ্যাক্টিভেশন
            </p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Package 1: Monthly (50% Off: 1000 -> 499) */}
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    ৫০% ছাড় 🔥
                  </span>

                  <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">১ মাস সাবস্ক্রিপশন</h3>
                  
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">৳৪৯৯</span>
                    <span className="text-xs text-slate-500">/মাস</span>
                    <span className="font-mono text-xs line-through text-slate-400">৳১,০০০</span>
                  </div>

                  <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                    ৫০% ছাড়ে মাত্র ৪৯৯৳
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>ফাস্ট বারকোড পিওএস ও প্রিন্টিং</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>ডিজিটাল বাকি খাতা ও এসএমএস তাগাদা</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>অফলাইন ক্যাশ কাউন্টার ও ড্রয়ার মেলানো</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(true)}
                  className="mt-6 w-full rounded-2xl border-2 border-emerald-600 bg-emerald-50 py-2.5 text-xs font-black text-emerald-900 hover:bg-emerald-100 transition cursor-pointer dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  ১ মাসের প্যাকেজ কিনুন (৳৪৯৯) ⚡
                </button>
              </div>
            </ScrollReveal>

            {/* Package 2: Yearly Super Saver (Highlighted) */}
            <ScrollReveal animation="scale" delay={150}>
              <div className="relative h-full rounded-3xl border-2 border-emerald-500 bg-white p-6 shadow-xl flex flex-col justify-between ring-4 ring-emerald-500/10 dark:border-emerald-500 dark:bg-slate-900 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-1 text-[11px] font-black text-white shadow-md">
                  ⭐ সেরা সেভার (মাসে মাত্র ৳২৯৯!)
                </div>

                <div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    মেগা সেভ অফার 🎉
                  </span>

                  <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">১ বছর মেগা সেভার</h3>
                  
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">৳৩,৫৮৮</span>
                    <span className="text-xs text-slate-500">/বছর</span>
                    <span className="text-xs font-black text-emerald-700">(মাসে মাত্র ৳২৯৯)</span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                    <span className="line-through">রেগুলার ৳১০,০০০</span>
                    <span className="text-rose-600 font-extrabold">বছরে ৳৬,৪১২ সেভ!</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>পূর্ণ ১ বছরের আনলিমিটেড লাইসেন্স</span>
                    </li>
                    <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>ফ্রি অনলাইন বাজার স্টোরফ্রন্ট</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>ফ্রি সাবডোমেন (*.mudidokanpro.com)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
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
            </ScrollReveal>

            {/* Package 3: Custom Domain VIP */}
            <ScrollReveal animation="fade-up" delay={300}>
              <div className="h-full rounded-3xl border border-indigo-200 bg-white p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between dark:border-indigo-900/60 dark:bg-slate-900">
                <div>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    👑 কাস্টম ডোমেন ভিআইপি
                  </span>

                  <h3 className="mt-3 text-lg font-black text-slate-900 dark:text-white">হাই-স্পিড ডোমেন + ক্লাউড</h3>
                  
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-black text-indigo-700 dark:text-indigo-400">৳৫,০০০</span>
                    <span className="text-xs text-slate-500">/বছর</span>
                    <span className="font-mono text-xs line-through text-slate-400">রেগুলার ৳১০,০০০</span>
                  </div>

                  <p className="mt-1 text-[11px] font-bold text-slate-500">
                    রিনিউয়াল ফি: মাত্র ৳৩,৫০০ / বছর
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>নিজস্ব .com ডোমেন (যেমন: yourshop.com)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>হাই-স্পিড ডেডিকেটেড ক্লাউড হোস্টিং</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                      <span>সম্পূর্ণ অটোমেটিক ক্লাউড ব্যাকআপ</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(true)}
                  className="mt-6 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-xs font-black text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  কাস্টম ডোমেন ভিআইপি (৳৫,০০০) 👑
                </button>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* FOOTER */}
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
