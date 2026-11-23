import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  Zap,
  Store,
  Phone,
  CheckCircle2,
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
  Check,
  Sun,
  Moon,
  ArrowLeft,
  Printer,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Smartphone,
  ShoppingBag,
  Clock,
  Gift,
  X,
  Search,
  Eye,
  Layers,
  FileText,
  BadgePercent,
  CheckCircle,
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

interface FeatureItem {
  id: string;
  category: 'pos' | 'catalog' | 'khata' | 'profit' | 'suppliers' | 'ecommerce';
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  alt: string;
  highlightText?: string;
}

const ALL_FEATURES: FeatureItem[] = [
  {
    id: 'pos-billing',
    category: 'pos',
    badge: 'ফিচার ১ · কাউন্টার পিওএস',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    title: '১ সেকেন্ডে ভিজ্যুয়াল বারকোড স্ক্যান ও দ্রুততম বিলিং কাউন্টার',
    description:
      'দোকানে কাস্টমারের ভিড় থাকলেও কোনো চাপ নেই! বারকোড স্ক্যান করুন অথবা পণ্যের ছবিতে স্পর্শ করলেই তাৎক্ষণিক কার্টে যোগ হবে। ইন্টারনেট সংযোগ চলে গেলেও কাউন্টার বন্ধ হবে না—১০০% অফলাইনে ফুল স্পিডে বিল করা যায়।',
    bullets: [
      '১ সেকেন্ডে বারকোড স্ক্যান ও ইনস্ট্যান্ট বিলিং',
      'প্রতিটি আইটেমের আলাদা রঙ ও স্পষ্ট বর্ডার',
      'ইন্টারনেট ছাড়াই ১০০% অফলাইন ক্যাশ কাউন্টার',
      'ক্যাশ, বিকাশ, নগদ বা আংশিক পরিশোধ সাপোর্ট',
    ],
    image: '/marketing/02-pos-billing-counter.png',
    alt: 'Visual POS Billing Counter Screen',
    highlightText: 'ভিড় সামলানোর জন্য দ্রুততম পিওএস কাউন্টার',
  },
  {
    id: 'pos-due-sale',
    category: 'pos',
    badge: 'ফিচার ২ · বাকিতে বিক্রি',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    title: 'বাকিতে বিক্রি (Due Sale) — পূর্বের বাকি ও নতুন বাকি এক ক্লিকে',
    description:
      'কাউন্টারেই কাস্টমারের নাম সার্চ করে বাকিতে বিক্রির বোতাম চাপুন। কাস্টমারের আগের বাকি কত ছিল, এই কেনাকাটায় কত হলো এবং মোট বকেয়া কত দাঁড়াল—সফটওয়্যার স্বয়ংক্রিয়ভাবে হিসাব করে মেমোতে প্রিন্ট করে দেবে।',
    bullets: [
      'কাস্টমার সার্চ করলেই তাৎক্ষণিক পূর্বের বকেয়া প্রদর্শন',
      'আংশিক নগদ জমা ও বাকি টাকা পৃথকভাবে ট্র্যাকিং',
      'গ্রাহকের ক্রেডিট লিমিট পার হলে সতর্কবার্তা',
      'প্রতিটি বিক্রির তারিখ ও ইনভয়েস নম্বরসহ স্বয়ংক্রিয় লেজার এন্ট্রি',
    ],
    image: '/marketing/03-pos-due-sale-khata.png',
    alt: 'POS Due Sale Workflow Modal',
    highlightText: 'বাকির হিসাবে কোনো ভুল বা খাতার পাতা ওল্টানো লাগবে না',
  },
  {
    id: 'thermal-receipt',
    category: 'pos',
    badge: 'ফিচার ৩ · মেমো প্রিন্ট',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    title: 'থার্মাল প্রিন্টারে প্রফেশনাল মেমো প্রিন্ট (58mm, 80mm ও A4)',
    description:
      'কালি বা রিবনের বাড়তি খরচ ছাড়াই ব্লুটুথ বা ইউএসবি থার্মাল প্রিন্টারে মাত্র ১ সেকেন্ডে দোকানের নিজস্ব নাম, মোবাইল নম্বর, ঠিকানা ও পণ্যের আইটেমাইজড তালিকা সহ সুন্দর মেমো প্রিন্ট করুন।',
    bullets: [
      '58mm ও 80mm পকেট ও ডেস্কটপ থার্মাল প্রিন্টার সাপোর্ট',
      'দোকানের নাম, ঠিকানা ও কাস্টমার মেমো নম্বর অটো-জেনারেটেড',
      'পূর্বের বাকি ও বর্তমান মেমো বকেয়ার স্পষ্ট বিবরণ',
      'এক ক্লিকে রসিদ রিপ্রিন্ট করার সুবিধা',
    ],
    image: '/marketing/04-receipt-thermal-print.png',
    alt: 'POS Thermal Receipt Preview 58mm 80mm',
    highlightText: 'দোকানের ব্র্যান্ডিং সহ প্রফেশনাল মেমো',
  },
  {
    id: 'catalog-skus',
    category: 'catalog',
    badge: 'ফিচার ৪ · প্রাক-কনফিগার ক্যাটালগ',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    title: '১,৩৫৯টি আসল পণ্যের ফটো ক্যাটালগ (সব আগে থেকেই লোড করা!)',
    description:
      'বাজারে অন্য কোনো সফটওয়্যার নিলে আপনাকে নিজে বসে বসে শত শত পণ্যের নাম, সাইজ ও ছবি তুলতে হয়। মুদির দোকান প্রো-তে তীর, রূপচাঁদা, প্রাণ, স্কয়ার, এসিআই, ডানো, মিল্কভিটাসহ বাংলাদেশের ১,৩৫৯টি আসল মুদি পণ্যের ছবি আগে থেকেই দেওয়া আছে!',
    bullets: [
      '১,৩৫৯টি আসল পণ্যের হোয়াইট ব্যাকগ্রাউন্ড ফটো ডাটাবেজ',
      'আসল সাইজ (১ কেজি, ৫ কেজি, ৫০০ গ্রাম, ১ লিটার ইত্যাদি)',
      'প্রোডাক্ট কোড ও অফিশিয়াল বারকোড ইন্টিগ্রেটেড',
      'এক ক্লিকে নিজস্ব বিক্রয়মূল্য ও কেনা দাম সেটআপ',
    ],
    image: '/marketing/05-product-catalog-grid.png',
    alt: '1359 FMCG Grocery SKUs Database',
    highlightText: 'কোনো ডাটা এন্ট্রির ঝামেলা নেই—আজই শুরু করুন',
  },
  {
    id: 'brands-catalog',
    category: 'catalog',
    badge: 'ফিচার ৫ · ব্র্যান্ড ফিল্টার',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    title: '৭৫টি শীর্ষস্থানীয় এফএমসিজি ব্র্যান্ডের অফিশিয়াল লোগো ক্যাটালগ',
    description:
      'প্রাণ, ফ্রেশ, এসিআই, স্কয়ার, বসুন্ধরা, আকিজ, তীর, ইউনিলিভার, ম্যারিকো, নেসলে, কোকা-কোলা সহ বাংলাদেশের ৭৫টি জনপ্রিয় কোম্পানির লোগো দেওয়া আছে। ব্র্যান্ড অনুযায়ী যেকোনো পণ্য এক ক্লিকে খুঁজে পাওয়া যায়।',
    bullets: [
      '৭৫টি শীর্ষস্থানীয় খাদ্য ও প্রসাধন ব্র্যান্ড লোগো',
      'ব্র্যান্ড ফিল্টার দিয়ে সেকেন্ডে পণ্য সার্চিং',
      'নতুন স্থানীয় ব্র্যান্ড বা নিজস্ব খোলা আইটেম যুক্ত করার সুবিধা',
    ],
    image: '/marketing/06-brands-logos-showcase.png',
    alt: '75 FMCG Official Brand Logos',
    highlightText: 'ব্র্যান্ডের লোগো দেখে সহজে পণ্য চেনার নিশ্চয়তা',
  },
  {
    id: 'categories-grid',
    category: 'catalog',
    badge: 'ফিচার ৬ · ক্যাটাগরি ভিউ',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    title: '২৮টি সুসজ্জিত ক্যাটাগরি ও হাই-রেজুলেশন খাদ্যপণ্যের ফটো',
    description:
      'চাল-ডাল, আটা-ময়দা, ভোজ্যতেল ও ঘি, লবণ-চিনি, মশলা, চা-কফি, বিস্কুট ও বেকারি, স্ন্যাকস, দুগ্ধজাত পণ্য সহ ২৮টি সাজানো বিভাগে পণ্যগুলো সাজানো থাকে। যেকোনো কর্মচারীও খুব সহজে পণ্য চিনতে পারে।',
    bullets: [
      '২৮টি সাজানো মুদি ও সুপারশপ ক্যাটাগরি',
      'সুন্দর ভিজ্যুয়াল আইকন ও কালার থিম',
      'ক্যাটাগরি ভিত্তিক স্টক এবং বিক্রির হিসাব ট্র্যাকিং',
    ],
    image: '/marketing/07-categories-grid.png',
    alt: '28 Visual Category Grid',
    highlightText: 'নতুন কর্মচারীও কোনো ভুল ছাড়াই বিক্রি করতে পারবে',
  },
  {
    id: 'customer-khata',
    category: 'khata',
    badge: 'ফিচার ৭ · ডিজিটাল বাকি খাতা',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    title: 'ডিজিটাল বাকি খাতা লেজার — কার কত বাকি রিয়েল-টাইমে দেখুন',
    description:
      'কোন কাস্টমারের কাছে কত টাকা বকেয়া আছে, শেষ কবে কত টাকা পরিশোধ করেছে এবং তার বাকি নেওয়ার সীমা (Credit Limit) কত—সব এক জায়গায়। কাগজের খাতা হারিয়ে যাওয়া বা পানিতে ভেজার ভয় চিরতরে শেষ।',
    bullets: [
      'কাস্টমার প্রোফাইল, ফোন নম্বর ও ঠিকানাসহ সম্পূর্ণ রেকর্ড',
      'লাইফটাইম ক্রয়, মোট জমা ও বর্তমান বকেয়া ব্যালেন্স',
      'এক ক্লিকে কাস্টমারের ডিজিটাল স্টেটমেন্ট প্রিন্ট বা ডাউনলোড',
      'কাস্টমার পোর্টাল কিউআর ও ওটিপি এক্সেস',
    ],
    image: '/marketing/13-customers-digital-khata.png',
    alt: 'Customer Khata Digital Ledger',
    highlightText: 'বাকি খাতা থাকবে নিরাপদ ও সম্পূর্ণ ডিজিটাল',
  },
  {
    id: 'due-aging-reports',
    category: 'khata',
    badge: 'ফিচার ৮ · বাকি এজিং এনালাইসিস',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    title: '৫-ধাপের বাকি এজিং রিপোর্ট (০-৭, ৮-১৫, ১৬-৩০, ৩১-৬০, ৬০+ দিন)',
    description:
      'কোন কাস্টমারের বাকি কতদিন পুরনো হয়ে গেছে তা দিন অনুযায়ী ভাগ করে দেখায়। ফলে যে বাকিগুলো আটকে যাওয়ার ঝুঁকি আছে, সেগুলো আগে থেকেই চিহ্নিত করে দ্রুত তাগাদা দিয়ে টাকা আদায় করা যায়।',
    bullets: [
      '০-৭ দিন, ৮-১৫ দিন, ১৬-৩০ দিন, ৩১-৬০ দিন ও ৬০+ দিন বাকি ট্র্যাকিং',
      'এক নজরে ওভারডিউ (Overdue) কাস্টমার ও মোট বকেয়া টাকার পরিমাণ',
      'ইনভয়েস অনুযায়ী সরাসরি "বাকি আদায় করুন (Collect Due)" বাটন',
    ],
    image: '/marketing/14-due-aging-reports.png',
    alt: 'Receivable Due Aging Analysis Dashboard',
    highlightText: 'কোনো বাকি আর বছরের পর বছর আটকে থাকবে না',
  },
  {
    id: 'dashboard-profit',
    category: 'profit',
    badge: 'ফিচার ৯ · আসল লাভ-লোকসান',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    title: 'রিয়েল-টাইম আসল লাভ-লোকসান ও ৬ মাসের সেলস ট্রেন্ড চার্ট',
    description:
      'শুধু বিক্রি নয়, নিট লাভ কত হলো তা জানা সবচেয়ে জরুরি। ওয়েটেড এভারেজ কস্টিং (Weighted Average Cost) ফর্মুলায় প্রতিটি আইটেমের কেনা দাম ধরে গ্রস প্রফিট, নেট প্রফিট ও ক্যাশ ইনহ্যান্ড রিয়েল-টাইমে ক্যালকুলেট হয়।',
    bullets: [
      'দৈনিক, ৭ দিন, চলতি মাস ও ৬ মাসের বিক্রয় ও গ্রস প্রফিট ট্রেন্ড',
      'ক্যাটাগরি অনুযায়ী সবচেয়ে বেশি লাভজনক পণ্যের চার্ট',
      'নগদ আদায় ও বাকি বিক্রির আলাদা নির্ভুল বিভাজন',
    ],
    image: '/marketing/01-dashboard-analytics.png',
    alt: 'Real-time Profit Loss and Sales Trend Dashboard',
    highlightText: 'দোকানের প্রতিটি টাকার লাভ-ক্ষতির স্পষ্ট ছবি',
  },
  {
    id: 'inventory-valuation',
    category: 'profit',
    badge: 'ফিচার ১০ · স্টক ও সম্পদ মূল্য',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    title: 'দোকানে কত টাকার মাল আছে? (স্টক লেজার ও ক্রয়মূল্য মূল্যায়ন)',
    description:
      'মুহূর্তেই জানতে পারবেন আপনার দোকানে বর্তমান কেনা দামে মোট কত টাকার মালামাল স্টক আছে এবং তা বিক্রি করলে মোট কত টাকা ক্যাশ হবে। স্টক কমে গেলে স্বয়ংক্রিয় লো-স্টক অ্যালার্ট পাবেন।',
    bullets: [
      'ইনভেন্টরি অ্যাসেট ভ্যালু (কেনা দামে মোট স্টক মূল্য)',
      'আনুমানিক বিক্রয়মূল্য (Estimated Retail Value) ও প্রত্যাশিত লাভ',
      'বাংলা ও ইংরেজি ভাষায় স্টক সার্চ ও ইনস্ট্যান্ট স্টক অ্যাড/সাবট্র্যাক্ট',
    ],
    image: '/marketing/08-inventory-valuation.png',
    alt: 'Inventory Stock Valuation and Asset Ledger',
    highlightText: 'স্টক চুরি বা ঘাটতি হওয়ার আর কোনো সুযোগ নেই',
  },
  {
    id: 'shop-expenses',
    category: 'profit',
    badge: 'ফিচার ১১ · দোকান খরচ খাতা',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    title: 'দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর বেতন ও দৈনন্দিন খরচ খাতা',
    description:
      'দোকানের দোকান ভাড়া, বিদ্যুৎ বিল, কর্মচারীর নাস্তা ও অন্যান্য খরচ এন্ট্রি করলেই তা সরাসরি গ্রস প্রফিট থেকে বাদ গিয়ে দিন শেষে প্রকৃত নিট লাভ (Operating Net Profit) বের করে দেবে।',
    bullets: [
      'ভাড়া, কারেন্ট বিল, চা-নাস্তা ও ডেলিভারি খরচের ক্যাটাগরি',
      'ক্যাশ নাকি বিকাশ/নগদে পরিশোধ করা হয়েছে তার রেকর্ড',
      'মাস শেষে মোট পরিচালন ব্যয়ের স্বয়ংক্রিয় হিসাব',
    ],
    image: '/marketing/15-shop-expenses.png',
    alt: 'Shop Operating Expenses Ledger',
    highlightText: 'অপ্রয়োজনীয় খরচ কমবে এবং নিট লাভ নিশ্চিত হবে',
  },
  {
    id: 'cash-register',
    category: 'profit',
    badge: 'ফিচার ১২ · ক্যাশ ড্রয়ার হিসাব',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    title: 'দৈনিক ক্যাশ ড্রয়ার ব্যালেন্স ও শিফট ক্লোজিং মেলানো',
    description:
      'সকালে ড্রয়ারে কত ক্যাশ নিয়ে শুরু করলেন, সারাদিনের নগদ বিক্রি কত হলো, কত ক্যাশ বাইরে গেল এবং রাতে ড্রয়ার বন্ধ করার সময় ড্রয়ারের টাকার সাথে সফটওয়্যারের হিসাব হুবহু মিলে যাবে।',
    bullets: [
      'কারেন্ট ক্যাশ ড্রয়ার ব্যালেন্স ও শিফট স্ট্যাটাস ট্র্যাকিং',
      'ম্যানুয়াল ক্যাশ-ইন (জমা) ও ক্যাশ-আউট (উত্তোলন) এন্ট্রি',
      'প্রতি রাতে ক্যাশ ড্রয়ার লেনদেন লেজার ও শিফট ক্লোজিং',
    ],
    image: '/marketing/16-cash-register-closing.png',
    alt: 'Daily Cash Register Shift Closing and Drawer Reconciliation',
    highlightText: 'ক্যাশের ১টি পয়সাও অমিল থাকবে না',
  },
  {
    id: 'distributor-purchase',
    category: 'suppliers',
    badge: 'ফিচার ১৩ · কোম্পানি চালান',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    title: 'ডিস্ট্রিবিউটর চালান ও কার্টন-টু-পিস কনভার্সন (কার্টনে কিনে খুচরা বিক্রি)',
    description:
      'কোম্পানি থেকে কার্টন বা বস্তায় মাল কিনে খুচরা পিস বা কেজিতে বিক্রি করার সম্পূর্ণ অটোমেটিক হিসাব। গাড়ি ভাড়া বা পরিবহন খরচ যোগ হয়ে প্রতিটি পিসের আসল কেনা দাম নিখুঁতভাবে নির্ধারিত হয়।',
    bullets: [
      'কার্টন/বস্তা থেকে খুচরা পিস বা কেজিতে রূপান্তর',
      'পরিবহন ও অন্যান্য খরচ যোগ করে গড় ক্রয়মূল্য নির্ণয়',
      'কোম্পানি ইনভয়েস নম্বর ও তারিখ সহ চালান সংরক্ষণ',
    ],
    image: '/marketing/09-distributor-purchase.png',
    alt: 'Record Distributor Purchase and Carton Conversion',
    highlightText: 'পাইকারি কেনার পর খুচরা বিক্রির নিখুঁত হিসাব',
  },
  {
    id: 'suppliers-directory',
    category: 'suppliers',
    badge: 'ফিচার ১৪ · মহাজন দেনা খাতা',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    title: 'সাপ্লায়ার ও মহাজন খাতা — কোম্পানি দেনা ও চালান লেজার',
    description:
      'ইউনিলিভার, স্কয়ার, ফ্রেশ, তীর কিংবা স্থানীয় পাইকারি মহাজনের কাছে মোট কত টাকার মালামাল এলো, কত টাকা পরিশোধ করলেন এবং কত টাকা দেনা আছে তার পৃথক লেজার।',
    bullets: [
      'সাপ্লায়ার ও ডিলার ডিরেক্টরি ও যোগাযোগ নম্বর',
      'মোট ক্রয়, মোট পরিশোধ ও বকেয়া দেনা (Payable) হিসাব',
      'এক ক্লিকে মহাজন লেজার খাতা ও দেনা পরিশোধ রসিদ',
    ],
    image: '/marketing/10-suppliers-directory.png',
    alt: 'Suppliers and Distributor Dues Directory',
    highlightText: 'কোম্পানি বা মহাজনের সাথে দেনা-পাওনা নিয়ে তর্কাতর্কি মুক্ত',
  },
  {
    id: 'online-storefront',
    category: 'ecommerce',
    badge: 'ফিচার ১৫ · অনলাইন বাজার',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    title: 'অনলাইন অর্ডার স্টোরফ্রন্ট — ঠিক যেমন ঘরেরবাজার ও চালডাল',
    description:
      'আপনার এলাকার কাস্টমারদের জন্য তৈরি নিজস্ব অনলাইন গ্রোসারি স্টোর! সারা বাংলাদেশের জেলা ও দোকান নির্বাচন করে কাস্টমাররা ঘরে বসেই মোবাইল দিয়ে পণ্য কার্টে অ্যাড করে অর্ডার দিতে পারবে।',
    bullets: [
      'জেলা ও স্টোরভিত্তিক স্মার্ট ক্যাটালগ ফিল্টার',
      '১,৩৫৯টি খাদ্যপণ্যের ছবি ও সাইজ সহ সুন্দর অনলাইন ডিসপ্লে',
      'হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি (COD) সুবিধা',
    ],
    image: '/marketing/11-online-storefront.png',
    alt: 'Online Grocery Storefront with District Store Switcher',
    highlightText: 'এলাকার কাস্টমারদের অনলাইনে সার্ভিস দিয়ে বিক্রি বাড়ান',
  },
  {
    id: 'online-cart-checkout',
    category: 'ecommerce',
    badge: 'ফিচার ১৬ · ১-পেজ এক্সপ্রেস চেকআউট',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    title: 'স্লাইড-ইন শপিং কার্ট ও ১-পেজ ফাস্ট চেকআউট (বিকাশ বা ক্যাশ অন ডেলিভারি)',
    description:
      'কাস্টমারকে কোনো দীর্ঘ অ্যাকাউন্ট খুলতে হবে না। নাম, মোবাইল নম্বর ও ঠিকানা দিয়ে ১ ক্লিকেই অর্ডার কনফার্ম করতে পারবে। ফলে বেশি বেশি কাস্টমার কোনো ঝামেলা ছাড়াই অর্ডার সম্পন্ন করে।',
    bullets: [
      'ইনস্ট্যান্ট স্লাইড-ইন শপিং কার্ট ড্রয়ার',
      'ডেলিভারি চার্জ ও সর্বমোট প্রদেয় টাকার স্বচ্ছ হিসাব',
      'ক্যাশ অন ডেলিভারি এবং বিকাশ/নগদ অগ্রিম পেমেন্ট মেথড',
    ],
    image: '/marketing/12-online-cart-checkout.png',
    alt: 'Express 1-Page Shopping Cart Drawer Checkout',
    highlightText: 'সহজ চেকআউট মানেই সর্বোচ্চ অনলাইন অর্ডার কনভার্সন',
  },
  {
    id: 'ad-landing-preview',
    category: 'ecommerce',
    badge: 'ফিচার ১৭ · হাই-কনভার্শন অ্যাড ল্যান্ডিং',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    title: 'ফেসবুক ও টিকটক বিজ্ঞাপনের জন্য প্রিমিয়াম অ্যাড ল্যান্ডিং পেজ',
    description:
      'মধু, ঘি, তেল, চালের কম্বো প্যাকেজ বিক্রির জন্য ফেসবুক বা টিকটকে বিজ্ঞাপন দেওয়ার জন্য তৈরি আকর্ষণীয় ল্যান্ডিং পেজ। ভিডিও রিভিউ, কাস্টমার টেস্টমোনিয়াল ও সরাসরি অর্ডার ফর্ম সহ রেডি।',
    bullets: [
      'মোবাইলে চোখের পলকে লোড হওয়া সুপারফাস্ট ল্যান্ডিং ডিজাইন',
      'ইউটিউব আনবক্সিং/রিভিউ ভিডিও প্লেয়ার এমবেড সুবিধা',
      'সীমিত সময়ের মেগা অফার ব্যাজ ও সরাসরি অর্ডার ফর্ম',
    ],
    image: '/marketing/17-ad-landing-live-preview.png',
    alt: 'High Converting Facebook TikTok Ad Landing Page Preview',
    highlightText: 'ফেসবুক বিজ্ঞাপনে পণ্য বিক্রির সর্বোচ্চ রিটার্ন',
  },
  {
    id: 'ad-landing-builder',
    category: 'ecommerce',
    badge: 'ফিচার ১৮ · অ্যাড বিল্ডার ও পিক্সেল',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    title: 'সহজ অ্যাড ল্যান্ডিং পেজ বিল্ডার ও ফেসবুক/টিকটক পিক্সেল ট্র্যাকিং',
    description:
      'কোনো কোডিং ছাড়া মাত্র ২ মিনিটে বিজ্ঞাপনের হেডলাইন, অফার প্রাইজ, ইউটিউব ভিডিও লিঙ্ক ও ফেসবুক পিক্সেল আইডি বসিয়ে নিজের ক্যাম্পেইন পেজ তৈরি করুন। ১ ক্লিকে শেয়ারেবল লিঙ্ক কপি করুন।',
    bullets: [
      '৩টি হাই-কনভার্টিং টেমপ্লেট (এগ্রো/গ্রোসারি, ভিডিও-ফার্স্ট ও কম্বো অফার)',
      'ফেসবুক ও টিকটক পিক্সেল আইডি ইন্টিগ্রেশন ট্র্যাকিং',
      '১ ক্লিকে নিজস্ব ইউনিক বিজ্ঞাপনী লিঙ্ক কপি ও লাইভ প্রিভিউ',
    ],
    image: '/marketing/18-ad-landing-builder.png',
    alt: 'Visual Ad Landing Page Builder and Pixel Setup',
    highlightText: 'বিজ্ঞাপনের ট্র্যাকিং ও কনভার্সন অপ্টিমাইজেশন এক ছাতার নিচে',
  },
];

export const ShowcaseLandingPage: React.FC<ShowcaseLandingPageProps> = ({
  onBackToLogin,
  onOpenPortal,
  onOpenOnlineStore,
  onOpenAdBuilder,
  onOpenDemo,
}) => {
  const { lang, setLang, darkMode, toggleDarkMode } = useApp();

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'pos' | 'catalog' | 'khata' | 'profit' | 'suppliers' | 'ecommerce'>('all');
  
  // Video player controls state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Lightbox Modal state for full-screen screenshot preview
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; desc: string; badge: string } | null>(null);

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

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const targetTime = (parseFloat(e.target.value) / 100) * (videoRef.current.duration || 1);
    videoRef.current.currentTime = targetTime;
    setVideoProgress(parseFloat(e.target.value));
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredFeatures = ALL_FEATURES.filter((f) => {
    if (activeCategory === 'all') return true;
    return f.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-slate-900 selection:bg-emerald-500 selection:text-white dark:bg-[#0B1120] dark:text-slate-100 font-sans">
      
      {/* Modals */}
      <BuyProModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      <DemoAccessModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />

      {/* LIGHTBOX MODAL FOR HIGH-RES FULLSCREEN SCREENSHOT PREVIEW */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-3xl border border-emerald-500/30 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-5 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  {lightboxImage.badge}
                </span>
                <h3 className="text-sm sm:text-base font-black truncate max-w-xl">
                  {lightboxImage.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* High-res Image View */}
            <div className="flex-1 overflow-auto bg-slate-950 p-2 sm:p-4 flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            {/* Footer with Details */}
            <div className="border-t border-slate-800 bg-slate-900 px-5 py-3 text-xs sm:text-sm text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="line-clamp-2 text-slate-400 max-w-2xl">{lightboxImage.desc}</p>
              <button
                type="button"
                onClick={() => {
                  setLightboxImage(null);
                  setIsBuyModalOpen(true);
                }}
                className="shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-black text-white shadow-md shadow-emerald-600/30 transition cursor-pointer"
              >
                প্রো চালু করুন (৳৪৯৯/মাস) ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-emerald-100/80 bg-white/95 px-3 sm:px-6 lg:px-8 py-3 backdrop-blur-md shadow-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/mudi-dokan-pro-logo.png"
              alt="Mudi Dokan Pro"
              className="h-9 sm:h-11 w-auto object-contain cursor-pointer"
              onClick={() => {
                window.location.href = '/';
              }}
            />
            <span className="hidden sm:inline-block font-extrabold text-sm text-slate-800 dark:text-white">
              মুদি দোকান প্রো
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Live Demo Link */}
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-300 transition cursor-pointer shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>⚡ লাইভ ডেমো</span>
            </button>

            {/* Online Storefront link */}
            {onOpenOnlineStore && (
              <button
                type="button"
                onClick={onOpenOnlineStore}
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 text-xs font-bold text-teal-900 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 transition cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-teal-600" />
                <span>অনলাইন শপ</span>
              </button>
            )}

            {/* Ad Builder link */}
            {onOpenAdBuilder && (
              <button
                type="button"
                onClick={onOpenAdBuilder}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 text-xs font-bold text-purple-900 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300 transition cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-purple-600" />
                <span>অ্যাড বিল্ডার</span>
              </button>
            )}

            {/* Back to Login */}
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              <Store className="h-3.5 w-3.5 text-slate-500" />
              <span>লগইন</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-xs hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Buy Pro Button */}
            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-1.5 text-xs sm:text-sm font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>প্রো কিনুন (৫০% ছাড়)</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden px-4 pt-8 pb-10 sm:px-6 lg:px-8 text-center">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-full max-w-5xl rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-900/10" />

        <div className="mx-auto max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-black text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shadow-xs mb-4">
            <Store className="h-4 w-4 text-emerald-600" />
            <span>মুদি দোকান ও গ্রোসারি ব্যবসার পূর্ণাঙ্গ ১০০% নির্ভরযোগ্য ডিজিটাল সলিউশন</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            কাগজের খাতার দিন শেষ—দোকানের প্রতিটি টাকার হিসাব এখন ১০০% নির্ভুল
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            আসল লাভ-লোকসান, ১,৩৫৯টি আসল পণ্যের ছবিসহ দ্রুততম বারকোড বিলিং, কাস্টমার বাকি ও অটো এসএমএস তাগাদা, সাপ্লায়ার চালান এবং ক্যাশ ড্রয়ার—সবকিছু চলবে একটি মাত্র শক্তিশালী সিস্টেমে।
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-amber-500/25 transition cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              <span>⚡ সরাসরি লাইভ ডেমো টেস্ট (ফ্রি ট্রায়াল)</span>
            </button>

            {onOpenOnlineStore && (
              <button
                type="button"
                onClick={onOpenOnlineStore}
                className="flex items-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 px-5 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-teal-600/25 transition cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>🛒 অনলাইন গ্রোসারি স্টোর</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsBuyModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-5 py-3.5 text-sm sm:text-base font-black text-white shadow-xl shadow-emerald-700/25 transition cursor-pointer"
            >
              <Zap className="h-5 w-5" />
              <span>প্রো প্যাকেজ কিনুন (৫০% ছাড়)</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* REAL HD VIDEO PLAYER (MudiDokanPro_Promo_v1.mp4) */}
        {/* ======================================================== */}
        <div className="mx-auto max-w-4xl mt-10 rounded-3xl border-2 border-emerald-500/40 bg-slate-950 p-2 sm:p-4 shadow-2xl relative overflow-hidden group text-left">
          
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
            
            {/* Real Video Element */}
            <video
              ref={videoRef}
              src="/marketing/mudidokan-pro-promo.mp4"
              poster="/marketing/video-poster.jpg"
              playsInline
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />

            {/* Play/Pause Center Overlay Button (Visible when paused) */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all cursor-pointer p-4 text-center"
                onClick={togglePlay}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-emerald-500/30 animate-ping" />
                  <button
                    type="button"
                    aria-label="ভিডিও চালু করুন"
                    className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 hover:scale-110 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/60 transition-transform cursor-pointer"
                  >
                    <Play className="h-8 w-8 ml-1 fill-white" />
                  </button>
                </div>

                <div className="mt-4 max-w-md">
                  <span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-3.5 py-1 text-xs font-bold text-emerald-200">
                    ▶️ ২ মিনিট ১৪ সেকেন্ডের লাইভ ভিডিও ওয়াকথ্রু
                  </span>
                  <h3 className="text-base sm:text-xl font-black text-white mt-2 drop-shadow-md">
                    কীভাবে মুদির দোকান প্রো আপনার ব্যবসাকে পাল্টে দেবে?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">ক্লিক করুন ভিডিও দেখতে</p>
                </div>
              </div>
            )}

            {/* Video Controls Bottom Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 sm:p-4 flex flex-col gap-2 text-white">
              {/* Progress Slider */}
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
                    title={isPlaying ? 'বিরতি দিন' : 'চালু করুন'}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleMute}
                    className="hover:text-emerald-400 transition cursor-pointer"
                    title={isMuted ? 'সাউন্ড চালু করুন' : 'সাউন্ড বন্ধ করুন'}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5" />}
                  </button>

                  <span className="font-mono text-[11px] text-slate-300">
                    {formatSec(currentTime)} / {formatSec(videoDuration || 134)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    HD 1080p · বাংলা অডিও
                  </span>
                  <button
                    type="button"
                    onClick={handleFullscreen}
                    className="hover:text-emerald-400 transition cursor-pointer"
                    title="ফুলস্ক্রিন করুন"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* 4 Core Pillars Below Video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-3 pt-2 border-t border-slate-800 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2 p-1.5">
              <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>১০০% অফলাইনে ফুল স্পিডে চলে</span>
            </div>
            <div className="flex items-center gap-2 p-1.5">
              <Package className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>১,৩৫৯টি আসল পণ্যের ছবি লোড করা</span>
            </div>
            <div className="flex items-center gap-2 p-1.5">
              <MessageCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>অটোমেটিক হোয়াটসঅ্যাপ/এসএমএস তাগাদা</span>
            </div>
            <div className="flex items-center gap-2 p-1.5">
              <Printer className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>থার্মাল প্রিন্টারে মেমো প্রিন্ট</span>
            </div>
          </div>

        </div>

      </section>

      {/* ======================================================== */}
      {/* 18 REAL SCREENSHOT FEATURE TOUR WITH INTERACTIVE FILTER */}
      {/* ======================================================== */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl">
          
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              বাস্তব ইন্টারফেসের ১৮টি স্ক্রিনশট গ্যালারি
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
              সফটওয়্যারটির প্রতিটি মডিউল নিজের চোখে দেখে নিন
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              যেকোনো স্ক্রিনশটে ক্লিক করে সম্পূর্ণ বড় স্ক্রিনে আসল হিসাব, ইনভয়েস ও মেমো দেখুন।
            </p>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-6">
              {[
                { id: 'all', label: 'সব ফিচার (১৮টি)' },
                { id: 'pos', label: 'কাউন্টার পিওএস ও মেমো' },
                { id: 'catalog', label: '১,৩৫৯ পণ্যের ক্যাটালগ' },
                { id: 'khata', label: 'বাকি খাতা ও এজিং' },
                { id: 'profit', label: 'লাভ-ক্ষতি ও ক্যাশ ড্রয়ার' },
                { id: 'suppliers', label: 'কোম্পানি চালান ও মহাজন' },
                { id: 'ecommerce', label: 'অনলাইন শপ ও অ্যাড বিল্ডার' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    activeCategory === tab.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 dark:bg-emerald-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Grid with Real High-Res Screenshots */}
          <div className="space-y-12">
            {filteredFeatures.map((feat, idx) => {
              const isEven = idx % 2 === 1;
              return (
                <div
                  key={feat.id}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center rounded-3xl border border-slate-200/90 bg-[#F8FAF7] p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition duration-300"
                >
                  {/* Text Details Side */}
                  <div className={`lg:col-span-6 space-y-3.5 ${isEven ? 'order-1 lg:order-2' : 'order-1'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${feat.badgeColor}`}>
                        {feat.badge}
                      </span>
                      {feat.highlightText && (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                          ⭐ {feat.highlightText}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {feat.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {feat.description}
                    </p>

                    <div className="space-y-2 text-xs font-bold text-slate-800 dark:text-slate-200 pt-1">
                      {feat.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImage({
                            url: feat.image,
                            title: feat.title,
                            desc: feat.description,
                            badge: feat.badge,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100 transition cursor-pointer dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                        <span>স্ক্রিনশট বড় করে দেখুন ↗</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDemoModalOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 cursor-pointer"
                      >
                        <span>সরাসরি টেস্ট করুন</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Screenshot Image Side with Zoom Hover & Click */}
                  <div
                    className={`lg:col-span-6 ${
                      isEven ? 'order-2 lg:order-1' : 'order-2'
                    } rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white dark:border-slate-700 group/img relative cursor-pointer`}
                    onClick={() =>
                      setLightboxImage({
                        url: feat.image,
                        title: feat.title,
                        desc: feat.description,
                        badge: feat.badge,
                      })
                    }
                  >
                    <img
                      src={feat.image}
                      alt={feat.alt}
                      className="w-full h-auto object-cover group-hover/img:scale-102 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Hover Overlay Hint */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-900 shadow-xl flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5 text-emerald-600" />
                        <span>বড় করে দেখতে ক্লিক করুন</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* COMPARISON MATRIX: Paper Khata vs Other POS vs MudirDokan */}
      {/* ======================================================== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F8FAF7] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-5xl text-center">
          
          <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            স্পষ্ট পার্থক্য দেখুন
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            কেন সাধারণ সফটওয়্যার ফেলে মুদি দোকান প্রো বেছে নেবেন?
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            অন্যান্য কোম্পানি শুধু বিক্রি দেখায়, কিন্তু মুদির দোকান প্রো আপনার সারাদিনের হিসাব, বাকি ও লাভ নিশ্চিত করে।
          </p>

          <div className="mt-10 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950 text-left">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 font-black text-slate-700 dark:text-slate-200">
                  <th className="p-4 sm:p-5">ফিচার / সুবিধা</th>
                  <th className="p-4 sm:p-5 text-slate-400">কাগজের খাতা</th>
                  <th className="p-4 sm:p-5 text-slate-400">সাধারণ সফটওয়্যার</th>
                  <th className="p-4 sm:p-5 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-black">
                    মুদি দোকান প্রো 👑
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-600 dark:text-slate-300">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">১,৩৫৯টি আসল পণ্যের ফটো ডাটাবেজ</td>
                  <td className="p-4 sm:p-5 text-rose-500">❌ কোনো সুযোগ নেই</td>
                  <td className="p-4 sm:p-5 text-amber-600">⚠️ নিজেকে ফটো তুলে নাম টাইপ করতে হয়</td>
                  <td className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold">
                    ✅ আগে থেকেই সব পণ্যের ছবি দেওয়া আছে
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">ইন্টারনেট ছাড়া অফলাইন পিওএস বিলিং</td>
                  <td className="p-4 sm:p-5 text-slate-500">ম্যানুয়াল কলম-কাগজ</td>
                  <td className="p-4 sm:p-5 text-rose-500">❌ নেট না থাকলে বিল বন্ধ</td>
                  <td className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold">
                    ✅ ১০০% অফলাইনে বিদ্যুৎ/নেট ছাড়াই সচল
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">কাস্টমার বাকি অটো এসএমএস / হোয়াটসঅ্যাপ</td>
                  <td className="p-4 sm:p-5 text-rose-500">❌ মুখে চাইতে অস্বস্তি</td>
                  <td className="p-4 sm:p-5 text-slate-400">সাধারণত থাকে না</td>
                  <td className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold">
                    ✅ ১-ক্লিকে সম্মানজনক ভাষায় তাগাদা মেসেজ
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">আসল লাভ-লোকসান (গড় ক্রয়মূল্য ফর্মুলা)</td>
                  <td className="p-4 sm:p-5 text-rose-500">❌ কখনোই হিসাব মেলে না</td>
                  <td className="p-4 sm:p-5 text-amber-600">⚠️ শুধু মোট বিক্রি দেখায়, লাভ নয়</td>
                  <td className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold">
                    ✅ কেনা দাম ও খরচ বাদ দিয়ে প্রকৃত নিট লাভ
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white">অনলাইন অর্ডার স্টোর ও অ্যাড বিল্ডার</td>
                  <td className="p-4 sm:p-5 text-rose-500">❌ নেই</td>
                  <td className="p-4 sm:p-5 text-rose-500">❌ আলাদা ২০-৩০ হাজার টাকা খরচ</td>
                  <td className="p-4 sm:p-5 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold">
                    ✅ সম্পূর্ণ ফ্রিতে সফটওয়্যারের ভেতরেই যুক্ত
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* PRICING & BUY PRO SECTION: 3 REVISED PACKAGES */}
      {/* ======================================================== */}
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

            {/* Package 2: Yearly Super Saver (10,000 -> 3,588 = 299/mo) */}
            <div className="relative rounded-3xl border-2 border-emerald-500 bg-white p-6 shadow-xl dark:border-emerald-500 dark:bg-slate-900 flex flex-col justify-between ring-4 ring-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-1 text-[11px] font-black text-white shadow-md">
                ⭐ সেরা সেভার (মাসে মাত্র ৳২৯৯!)
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
                  <span className="text-xs font-black text-emerald-700">(মাসে মাত্র ৳২৯৯!)</span>
                </div>

                <div className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span className="line-through">রেগুলার ৳১০,০০০</span>
                  <span className="line-through text-rose-500">১২ মাসে ৪৯৯ করে ৳৫,৯৮৮</span>
                </div>

                <p className="mt-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  🎉 বছরে এককালীন মোট ৳৬,৪১২ সেভিংস!
                </p>

                <ul className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>পূর্ণ ১ বছরের আনলিমিটেড লাইসেন্স</span>
                  </li>
                  <li className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>চাল-ডাল ও ঘরের বাজার স্টাইল ফ্রি অনলাইন স্টোর</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>ফ্রি সাবডোমেন (*.mudidokanpro.com)</span>
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

            {/* Package 3: Custom Domain VIP (5,000 first year, 3,500 renewal) */}
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
                  <span className="font-mono text-3xl font-black text-indigo-700 dark:text-indigo-400">৳৫,০০০</span>
                  <span className="text-xs text-slate-500">/বছর</span>
                  <span className="font-mono text-xs line-through text-slate-400">রেগুলার ৳১০,০০০</span>
                </div>

                <p className="mt-1 text-[11px] font-bold text-slate-500">
                  রিনিউয়াল ফি: মাত্র ৳৩,৫০০ / বছর
                </p>

                <p className="mt-1 text-xs text-indigo-900 dark:text-indigo-300 leading-snug">
                  💡 নিজস্ব .com ব্র্যান্ডে ঘরের বাজার ও চাল-ডাল ধাঁচের ফুল ই-কমার্স ও ডেলিভারি অটোমেশন।
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
                কাস্টম ডোমেন ভিআইপি কিনুন (৳৫,০০০) 👑
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
