import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Layout,
  Video,
  FileText,
  Star,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Save,
  Plus,
  Trash2,
  Share2,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Check,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';

export const AdLandingPageBuilder: React.FC = () => {
  const { store } = useApp();

  // Template: 'agro' | 'video_first' | 'combo'
  const [template, setTemplate] = useState<'agro' | 'video_first' | 'combo'>('agro');

  // Store Brand & Logo
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [storeBrandName, setStoreBrandName] = useState('মুদি দোকান স্পেশাল');

  // Ad Copy & Content
  const [headline, setHeadline] = useState('১০০% খাঁটি প্রাকৃতিক মধু — শতভাগ ভেজালমুক্ত ও প্রাকৃতিক শক্তির উৎস');
  const [subheadline, setSubheadline] = useState('সুন্দরবনের চাকভাঙা কাঁচা মধু। ল্যাব টেস্টে শতভাগ খাঁটি প্রমাণিত। পরিবারকে রাখুন সুস্থ ও সতেজ।');
  const [badgeText, setBadgeText] = useState('🔥 সীমিত সময়ের বিশেষ মেগা অফার — ক্যাশ অন ডেলিভারি');
  const [regularPrice, setRegularPrice] = useState(1450);
  const [offerPrice, setOfferPrice] = useState(990);
  const [productUnit, setProductUnit] = useState('১ কেজি জার');
  const [youtubeUrl, setYoutubeUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [pixelId, setPixelId] = useState('');

  // Bundle Packages for Multi-Item Selection
  const [selectedPackageIdx, setSelectedPackageIdx] = useState(0);
  const bundlePackages = [
    { name: '১ কেজি জার (স্ট্যান্ডার্ড প্যাক)', qty: 1, price: 990, regular: 1450, tag: 'জনপ্রিয়' },
    { name: '২ কেজি মেগা কম্বো (৳১৩০ সাশ্রয়)', qty: 2, price: 1850, regular: 2900, tag: '⭐ সেরা ডিল' },
    { name: '৩ কেজি ফ্যামিলি প্যাক (৳২৭০ সাশ্রয়)', qty: 3, price: 2700, regular: 4350, tag: 'মেগা সেভার' },
  ];

  // Delivery Charge Selection: ঢাকার মধ্যে ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা
  const [deliveryArea, setDeliveryArea] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const deliveryFee = deliveryArea === 'inside_dhaka' ? 80 : 150;

  // Bullet Features
  const [features, setFeatures] = useState<string[]>([
    'সুন্দরবনের নিজস্ব সংগ্রহকারীদের মাধ্যমে সরাসরি সংগৃহীত',
    'কোনো প্রকার কৃত্রিম চিনি, ফ্লেভার বা কেমিক্যাল মুক্ত',
    'পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ ক্যাশ অন ডেলিভারিতে পেমেন্ট',
    'পছন্দ না হলে সাথে সাথে ১০০% ক্যাশব্যাক গ্যারান্টি',
  ]);

  // Customer Reviews
  const [reviews, setReviews] = useState<Array<{ name: string; comment: string; stars: number }>>([
    { name: 'কামরুল হাসান, উত্তরা', comment: 'মধুর স্বাদ ও সুবাস অসাধারণ! একদম চাকের মধুর মতোই দারুণ।', stars: 5 },
    { name: 'আরিফুল ইসলাম, মিরপুর', comment: 'খুব দ্রুত ডেলিভারি পেয়েছি। প্যাকেজিং ও কোয়ালিটি সেরা। ধন্যবাদ মুদি দোকান প্রো।', stars: 5 },
    { name: 'ফারহানা চৌধুরী, ধানমন্ডি', comment: 'আমার বাচ্চার ঠাণ্ডার জন্য নিয়েছিলাম, খুব উপকার হয়েছে। খাঁটি পণ্য।', stars: 5 },
  ]);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');

  // Helper to extract YouTube Embed ID
  const youtubeEmbedUrl = useMemo(() => {
    if (!youtubeUrl.trim()) return '';
    try {
      if (youtubeUrl.includes('embed/')) return youtubeUrl;
      const url = new URL(youtubeUrl);
      const videoId = url.searchParams.get('v') || url.pathname.split('/').pop();
      return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
    } catch {
      return '';
    }
  }, [youtubeUrl]);

  // Save Settings
  const handleSaveCampaign = () => {
    const campaignData = {
      template,
      headline,
      subheadline,
      badgeText,
      regularPrice,
      offerPrice,
      productUnit,
      youtubeUrl,
      pixelId,
      features,
      reviews,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('mudirdokan_ad_campaign', JSON.stringify(campaignData));
      toast.success('অ্যাড ল্যান্ডিং পেজ সফলভাবে সংরক্ষণ করা হয়েছে!');
    } catch {
      toast.error('সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const campaignLink = `https://${store?.name ? store.name.toLowerCase().replace(/\s+/g, '-') : 'myshop'}.mudirdokanpro.com/offer/special`;

  const copyCampaignLink = () => {
    navigator.clipboard.writeText(campaignLink);
    toast.success('অ্যাড ক্যাম্পেইনের লিঙ্ক কপি হয়েছে! ফেসবুক/টিকটক অ্যাডে ব্যবহার করুন।');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Facebook / TikTok Ad Ready
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            হাই-কনভার্শন অ্যাড ল্যান্ডিং পেজ বিল্ডার
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ফেসবুক বা টিকটকে বিজ্ঞাপন চালিয়ে সরাসরি অর্ডার পেতে নিজের পণ্যের আকর্ষণীয় ল্যান্ডিং পেজ তৈরি করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Editor / Preview Switcher */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'editor'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              এডিটর
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              লাইভ প্রিভিউ
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveCampaign}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-black shadow-xs transition"
          >
            <Save className="h-3.5 w-3.5" />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </div>

      {/* Campaign Link Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 sm:p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
        <div className="flex items-center gap-2 text-xs">
          <Share2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-950 dark:text-emerald-200">
            আপনার বিজ্ঞাপনের জন্য তৈরি ল্যান্ডিং পেজ লিঙ্ক:
          </span>
          <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 underline truncate max-w-xs">
            {campaignLink}
          </span>
        </div>
        <button
          type="button"
          onClick={copyCampaignLink}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>লিঙ্ক কপি করুন</span>
        </button>
      </div>

      {/* MAIN VIEW: EDITOR OR PREVIEW */}
      {activeTab === 'editor' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Settings Column */}
          <div className="lg:col-span-6 space-y-5">
            {/* Template Selector */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <label className="block text-xs font-black uppercase text-slate-500">
                ১. ল্যান্ডিং পেজ টেমপ্লেট নির্বাচন করুন
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'agro', name: 'প্রিমিয়াম এগ্রো/গ্রোসারি', desc: 'ঘি, তেল, মধু স্পেশাল' },
                  { id: 'video_first', name: 'ভিডিও-ফার্স্ট হাই-কনভার্শন', desc: 'বড় ভিডিও ও ফাস্ট ফর্ম' },
                  { id: 'combo', name: 'কম্বো অফার ও ডিসকাউন্ট', desc: 'বান্ডেল বাজার প্যাকেজ' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as any)}
                    className={`rounded-xl border p-2.5 text-left transition ${
                      template === t.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-600/30'
                        : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{t.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ad Copy */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <label className="block text-xs font-black uppercase text-slate-500">
                ২. বিজ্ঞাপনের টেক্সট ও শিরোনাম
              </label>
              
              <div>
                <label className="block text-[11px] font-bold mb-1">অফার ব্যাজ টেক্সট</label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">মূল ক্যাচলাইন / হেডলাইন</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">বর্ণনা / সাব-হেডলাইন</label>
                <textarea
                  rows={2}
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Pricing & Units */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <label className="block text-xs font-black uppercase text-slate-500">
                ৩. অফার মূল্য ও ডিসকাউন্ট
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold mb-1">অফার প্রাইস (৳)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">রেগুলার প্রাইস (৳)</label>
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono line-through"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">সাইজ / পরিমাণ</label>
                  <input
                    type="text"
                    value={productUnit}
                    onChange={(e) => setProductUnit(e.target.value)}
                    placeholder="যেমন: ১ কেজি"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Media & Reviews Column */}
          <div className="lg:col-span-6 space-y-5">
            {/* YouTube Video URL */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <label className="block text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-rose-600" />
                <span>৪. YouTube ভিডিও লিঙ্ক (আনবক্সিং বা রিভিউ)</span>
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              />
              <p className="text-[10px] text-slate-400">
                ইউটিউবে আপনার প্রোডাক্টের আনবক্সিং ভিডিও আপলোড করে লিঙ্ক বসালে তা স্বয়ংক্রিয়ভাবে ভিডিও প্লেয়ার হিসেবে ল্যান্ডিং পেজে ডিসপ্লে হবে।
              </p>
            </div>

            {/* Facebook / TikTok Pixel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <label className="block text-xs font-black uppercase text-slate-500">
                ৫. Facebook / TikTok Pixel Tracking ID
              </label>
              <input
                type="text"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="যেমন: 123456789012345"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono"
              />
              <p className="text-[10px] text-slate-400">
                অ্যাড ম্যানেজার থেকে পিক্সেল আইডি দিলে প্রতি অর্ডারের কনভার্সন ট্র্যাক হবে।
              </p>
            </div>

            {/* Bullet Features Editor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2.5">
              <label className="block text-xs font-black uppercase text-slate-500">
                ৬. পণ্যের বিশেষত্ব ও বুলেট পয়েন্ট
              </label>
              {features.map((f, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={f}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[idx] = e.target.value;
                      setFeatures(updated);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFeatures([...features, 'নতুন গুণমান বা বিশেষত্ব যোগ করুন'])}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>নতুন বুলেট যোগ করুন</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* LIVE LANDING PAGE PREVIEW (GHORER BAZAR / AGRO ECOMMERCE AD STYLE) */
        <div className="rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900 max-w-3xl mx-auto">
          
          {/* Store Bar */}
          <div className="bg-[#14532D] text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <span>{store?.name || 'মুদি দোকান প্রো'} — অফিসিয়াল অনলাইন স্টোর</span>
          </div>

          {/* Ad Hero */}
          <div className="p-6 sm:p-8 space-y-4 text-center">
            <span className="inline-block rounded-full bg-rose-100 text-rose-800 px-3.5 py-1 text-xs font-black dark:bg-rose-950 dark:text-rose-300 animate-pulse">
              {badgeText}
            </span>

            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {headline}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              {subheadline}
            </p>

            {/* Pricing Display */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="font-mono text-2xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">
                ৳{offerPrice}
              </span>
              <span className="text-xs font-bold text-slate-500">({productUnit})</span>
              <span className="font-mono text-sm sm:text-base line-through text-slate-400">
                রেগুলার ৳{regularPrice}
              </span>
            </div>
          </div>

          {/* YouTube Video Embed Preview */}
          {youtubeEmbedUrl && (
            <div className="px-6 sm:px-8">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-md">
                <iframe
                  src={youtubeEmbedUrl}
                  title="Product Showcase Video"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Bullet Highlights */}
          <div className="p-6 sm:p-8 bg-emerald-50/50 dark:bg-emerald-950/20 my-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 text-center">
              কেন আমাদের পণ্যটি বাজারের সেরা?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto">
              {features.map((f, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="px-6 sm:px-8 pb-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 text-center">
              সম্মানিত গ্রাহকদের মতামত (Customer Reviews)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reviews.map((r, idx) => (
                <div key={idx} className="rounded-2xl border border-slate-200 p-3 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                  <div className="flex text-amber-400 mb-1">
                    {'★'.repeat(r.stars)}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">"{r.comment}"</p>
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white mt-2">— {r.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* EMBEDDED 1-CLICK ORDER FORM (HIGH CONVERTING) */}
          <div className="bg-gradient-to-b from-emerald-50 via-white to-emerald-50 p-6 sm:p-8 border-t border-emerald-200 dark:from-slate-900 dark:to-slate-900">
            <div className="max-w-md mx-auto text-center space-y-4">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                অর্ডার করতে নিচের ফর্মটি পূরণ করুন
              </h3>
              <p className="text-xs text-slate-500">
                পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন (ক্যাশ অন ডেলিভারি)
              </p>

              <form onSubmit={(e) => { e.preventDefault(); toast.success('অর্ডার প্লেস সফল হয়েছে (প্রিভিউ মোড)!'); }} className="space-y-4 text-left">
                {/* Multi-Item Package Selection */}
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-slate-800 dark:text-slate-200">
                    প্যাকেজ নির্বাচন করুন:
                  </label>
                  <div className="space-y-2">
                    {bundlePackages.map((pkg, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                          selectedPackageIdx === idx
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="bundlePkg"
                            checked={selectedPackageIdx === idx}
                            onChange={() => setSelectedPackageIdx(idx)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900">{pkg.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              <span className="line-through">৳{pkg.regular}</span>{' '}
                              <span className="text-emerald-700 font-bold">৳{pkg.price}</span>
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {pkg.tag}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">আপনার নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="আপনার পূর্ণ নাম"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">সম্পূর্ণ ডেলিভারি ঠিকানা *</label>
                  <input
                    type="text"
                    required
                    placeholder="বাসা/রোড নম্বর, এলাকা, থানা, জেলা"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                  />
                </div>

                {/* Delivery Area Selection: ঢাকার মধ্যে ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা */}
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-slate-800 dark:text-slate-200">
                    ডেলিভারি এরিয়া বেছে নিন:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition ${
                        deliveryArea === 'inside_dhaka'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delArea"
                        checked={deliveryArea === 'inside_dhaka'}
                        onChange={() => setDeliveryArea('inside_dhaka')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>ঢাকার মধ্যে (৳৮০)</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-bold transition ${
                        deliveryArea === 'outside_dhaka'
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delArea"
                        checked={deliveryArea === 'outside_dhaka'}
                        onChange={() => setDeliveryArea('outside_dhaka')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>ঢাকার বাইরে (৳১৫০)</span>
                    </label>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="rounded-xl border border-emerald-200 bg-white p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>পণ্যের মূল্য ({bundlePackages[selectedPackageIdx].name}):</span>
                    <span className="font-mono font-bold">৳{bundlePackages[selectedPackageIdx].price}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ডেলিভারি চার্জ ({deliveryArea === 'inside_dhaka' ? 'ঢাকার মধ্যে' : 'ঢাকার বাইরে'}):</span>
                    <span className="font-mono font-bold">৳{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t border-slate-100 pt-1.5">
                    <span>সর্বমোট প্রদেয় বিল:</span>
                    <span className="font-mono text-emerald-700 text-sm">
                      ৳{bundlePackages[selectedPackageIdx].price + deliveryFee}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-600/30 hover:from-emerald-700 transition cursor-pointer"
                >
                  ক্যাশ অন ডেলিভারিতে অর্ডার কনফার্ম করুন (৳{bundlePackages[selectedPackageIdx].price + deliveryFee}) 🚀
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
