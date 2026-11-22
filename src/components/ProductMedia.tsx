import React, { useEffect, useRef, useState } from 'react';
import {
  Wheat,
  Droplets,
  Flame,
  Coffee,
  Cookie,
  Candy,
  CupSoda,
  Milk,
  Egg,
  Utensils,
  Snowflake,
  Baby,
  Sparkles,
  Smile,
  SprayCan,
  Bug,
  GlassWater,
  Package,
  Pencil,
  ShoppingBasket,
  Upload,
  Link as LinkIcon,
  Trash2,
  CheckCircle2,
  Clock,
  ImageOff,
  Loader2,
  Plus,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../lib/api';
import { tx, type LanguageMode } from '../lib/i18n';

export interface CategoryAccentTheme {
  key: string;
  bgSoft: string;
  bgSolid: string;
  text: string;
  border: string;
  ring: string;
  gradient: string;
}

const ACCENT_THEMES: Record<string, CategoryAccentTheme> = {
  indigo: {
    key: 'indigo',
    bgSoft: 'bg-indigo-50 dark:bg-indigo-950/50',
    bgSolid: 'bg-indigo-600 text-white',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/70',
    ring: 'ring-indigo-500/30',
    gradient: 'from-indigo-500 to-blue-600',
  },
  emerald: {
    key: 'emerald',
    bgSoft: 'bg-emerald-50 dark:bg-emerald-950/50',
    bgSolid: 'bg-emerald-600 text-white',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800/70',
    ring: 'ring-emerald-500/30',
    gradient: 'from-emerald-500 to-teal-600',
  },
  orange: {
    key: 'orange',
    bgSoft: 'bg-orange-50 dark:bg-orange-950/50',
    bgSolid: 'bg-orange-500 text-white',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800/70',
    ring: 'ring-orange-500/30',
    gradient: 'from-orange-500 to-amber-500',
  },
  rose: {
    key: 'rose',
    bgSoft: 'bg-rose-50 dark:bg-rose-950/50',
    bgSolid: 'bg-rose-600 text-white',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800/70',
    ring: 'ring-rose-500/30',
    gradient: 'from-rose-500 to-pink-600',
  },
  purple: {
    key: 'purple',
    bgSoft: 'bg-purple-50 dark:bg-purple-950/50',
    bgSolid: 'bg-purple-600 text-white',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/70',
    ring: 'ring-purple-500/30',
    gradient: 'from-purple-500 to-indigo-600',
  },
  cyan: {
    key: 'cyan',
    bgSoft: 'bg-cyan-50 dark:bg-cyan-950/50',
    bgSolid: 'bg-cyan-600 text-white',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800/70',
    ring: 'ring-cyan-500/30',
    gradient: 'from-cyan-500 to-sky-600',
  },
  amber: {
    key: 'amber',
    bgSoft: 'bg-amber-50 dark:bg-amber-950/50',
    bgSolid: 'bg-amber-500 text-white',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/70',
    ring: 'ring-amber-500/30',
    gradient: 'from-amber-500 to-orange-500',
  },
  teal: {
    key: 'teal',
    bgSoft: 'bg-teal-50 dark:bg-teal-950/50',
    bgSolid: 'bg-teal-600 text-white',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800/70',
    ring: 'ring-teal-500/30',
    gradient: 'from-teal-500 to-emerald-600',
  },
  blue: {
    key: 'blue',
    bgSoft: 'bg-blue-50 dark:bg-blue-950/50',
    bgSolid: 'bg-blue-600 text-white',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800/70',
    ring: 'ring-blue-500/30',
    gradient: 'from-blue-500 to-indigo-600',
  },
  pink: {
    key: 'pink',
    bgSoft: 'bg-pink-50 dark:bg-pink-950/50',
    bgSolid: 'bg-pink-600 text-white',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-200 dark:border-pink-800/70',
    ring: 'ring-pink-500/30',
    gradient: 'from-pink-500 to-rose-600',
  },
};

export const CATEGORY_ACCENT_KEYS = Object.keys(ACCENT_THEMES);

export function getCategoryTheme(accentColor?: string | null, fallbackIndex = 0): CategoryAccentTheme {
  if (accentColor && ACCENT_THEMES[accentColor]) {
    return ACCENT_THEMES[accentColor];
  }
  const key = CATEGORY_ACCENT_KEYS[Math.abs(fallbackIndex) % CATEGORY_ACCENT_KEYS.length];
  return ACCENT_THEMES[key];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Wheat,
  Droplets,
  Flame,
  Coffee,
  Cookie,
  Candy,
  CupSoda,
  Milk,
  Egg,
  Utensils,
  Snowflake,
  Baby,
  Sparkles,
  Smile,
  SprayCan,
  Bug,
  GlassWater,
  Package,
  Pencil,
  ShoppingBasket,
};

export const CATEGORY_ICON_KEYS = Object.keys(ICON_MAP);

export const CategoryIcon: React.FC<{ iconName?: string | null; className?: string }> = ({
  iconName,
  className = 'h-4 w-4',
}) => {
  const IconComp = (iconName && ICON_MAP[iconName]) || ShoppingBasket;
  return <IconComp className={className} />;
};

export const ProductImage: React.FC<{
  src?: string | null;
  alt: string;
  iconName?: string | null;
  accentColor?: string | null;
  fallbackIndex?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'card';
  className?: string;
  showUnavailableLabel?: boolean;
  lang?: LanguageMode;
}> = ({
  src,
  alt,
  iconName,
  accentColor,
  fallbackIndex = 0,
  size = 'card',
  className = '',
  showUnavailableLabel = false,
  lang = 'EN',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const theme = getCategoryTheme(accentColor, fallbackIndex);

  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);

  const sizeClass =
    size === 'xs'
      ? 'h-8 w-8 rounded-lg'
      : size === 'sm'
        ? 'h-10 w-10 rounded-lg'
        : size === 'md'
          ? 'h-14 w-14 rounded-xl'
          : size === 'lg'
            ? 'h-24 w-24 rounded-xl'
            : 'h-32 w-full rounded-xl';

  const iconSizeClass =
    size === 'xs'
      ? 'h-3.5 w-3.5'
      : size === 'sm'
        ? 'h-4 w-4'
        : size === 'md'
          ? 'h-6 w-6'
          : size === 'lg'
            ? 'h-8 w-8'
            : 'h-9 w-9';

  const hasValidSrc = Boolean(src && src.trim() && !errored);

  if (!hasValidSrc) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden border ${theme.bgSoft} ${theme.border} ${sizeClass} ${className}`}
        title={alt}
      >
        <CategoryIcon iconName={iconName} className={`${iconSizeClass} ${theme.text} opacity-85`} />
        {showUnavailableLabel && size === 'card' && (
          <span className="mt-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
            {tx(lang, 'Add Photo', 'ছবি যোগ করুন')}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-slate-100 bg-white dark:border-slate-800 dark:bg-white ${sizeClass} ${className}`}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-100 dark:bg-slate-200" />
      )}
      <img
        src={src!}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`h-full w-full object-contain transition-opacity duration-200 ${
          size === 'card' ? 'p-2' : size === 'lg' ? 'p-1.5' : 'p-0.5'
        } ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export const BrandLogo: React.FC<{
  logoUrl?: string | null;
  name: string;
  brandColor?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ logoUrl, name, brandColor, size = 'sm', className = '' }) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [logoUrl]);

  const boxClass =
    size === 'xs'
      ? 'h-5 w-8 rounded'
      : size === 'sm'
        ? 'h-6 w-11 rounded-md'
        : size === 'md'
          ? 'h-9 w-16 rounded-lg'
          : 'h-12 w-24 rounded-xl';

  if (logoUrl && logoUrl.trim() && !errored) {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/80 bg-white px-1 py-0.5 shadow-2xs dark:border-slate-700 ${boxClass} ${className}`}
        title={name}
      >
        <img
          src={logoUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setErrored(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  const accentStyle = brandColor && /^#[0-9a-fA-F]{3,8}$/.test(brandColor)
    ? { backgroundColor: `${brandColor}1A`, color: brandColor, borderColor: `${brandColor}40` }
    : undefined;

  return (
    <span
      style={accentStyle}
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 font-bold tracking-tight text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 ${
        size === 'xs'
          ? 'h-5 min-w-5 px-1 text-[9px]'
          : size === 'sm'
            ? 'h-6 min-w-6 px-1.5 text-[10px]'
            : size === 'md'
              ? 'h-9 min-w-9 px-2 text-xs'
              : 'h-12 min-w-12 px-2.5 text-sm'
      } ${className}`}
      title={name}
    >
      {initials || name.slice(0, 2).toUpperCase()}
    </span>
  );
};

export const StoreLogoBadge: React.FC<{
  logoUrl?: string | null;
  storeName: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ logoUrl, storeName, size = 'md' }) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [logoUrl]);

  const dim =
    size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-14 w-14 rounded-2xl' : 'h-9 w-9 rounded-xl';
  const iconDim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5';

  if (logoUrl && logoUrl.trim() && !errored) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-indigo-200 bg-white p-1 shadow-xs dark:border-indigo-800 ${dim}`}
      >
        <img
          src={logoUrl}
          alt={storeName}
          onError={() => setErrored(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 text-white shadow-sm ${dim}`}
    >
      <Store className={iconDim} />
    </div>
  );
};

async function resizeImageToDataUrl(file: File, maxDim = 640): Promise<string> {
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const supportsPngTransparency = file.type === 'image/png';
      const outMime = supportsPngTransparency ? 'image/png' : 'image/webp';
      let dataUrl = canvas.toDataURL(outMime, 0.86);
      if (!dataUrl.startsWith(`data:${outMime}`)) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.86);
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unsupported or corrupted image file'));
    };
    img.src = objectUrl;
  });
}

export const ImageAssetUploader: React.FC<{
  kind: 'product' | 'brand' | 'store';
  value: string;
  onChange: (nextUrl: string) => void;
  gallery?: string[];
  onGalleryChange?: (next: string[]) => void;
  source?: string;
  onSourceChange?: (next: string) => void;
  status?: string;
  onStatusChange?: (next: 'VERIFIED' | 'PENDING' | 'UNAVAILABLE') => void;
  lang: LanguageMode;
  label?: string;
}> = ({
  kind,
  value,
  onChange,
  gallery,
  onGalleryChange,
  source,
  onSourceChange,
  status,
  onStatusChange,
  lang,
  label,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');

  useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  const uploadSingleFile = async (file: File): Promise<string> => {
    const dataUrl = await resizeImageToDataUrl(file, kind === 'brand' ? 400 : 640);
    const resp = await apiFetch<{ url: string }>('/api/catalog/upload-image', {
      method: 'POST',
      body: JSON.stringify({
        kind,
        filename: file.name,
        dataUrl,
      }),
    });
    return resp.url;
  };

  const handlePrimaryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadSingleFile(file);
      onChange(url);
      if (onSourceChange && !source) onSourceChange('Shop Upload');
      if (onStatusChange) onStatusChange('VERIFIED');
      toast.success(tx(lang, 'Image uploaded & optimized', 'ছবি আপলোড ও অপটিমাইজ হয়েছে'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Upload failed', 'আপলোড ব্যর্থ হয়েছে'));
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onGalleryChange) return;
    setUploading(true);
    try {
      const url = await uploadSingleFile(file);
      onGalleryChange([...(gallery || []), url]);
      toast.success(tx(lang, 'Gallery photo added', 'গ্যালারি ছবি যোগ হয়েছে'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Upload failed', 'আপলোড ব্যর্থ হয়েছে'));
    } finally {
      setUploading(false);
    }
  };

  const applyUrl = () => {
    const trimmed = urlInput.trim();
    onChange(trimmed);
    if (trimmed && onStatusChange && (!status || status === 'UNAVAILABLE')) {
      onStatusChange('VERIFIED');
    }
    if (!trimmed && onStatusChange) {
      onStatusChange('UNAVAILABLE');
    }
  };

  const removePrimary = () => {
    onChange('');
    setUrlInput('');
    if (onStatusChange) onStatusChange('UNAVAILABLE');
  };

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5 space-y-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {label ||
              (kind === 'brand'
                ? tx(lang, 'Official Brand Logo', 'অফিসিয়াল ব্র্যান্ড লোগো')
                : kind === 'store'
                  ? tx(lang, 'Store Branding Logo', 'দোকানের লোগো')
                  : tx(lang, 'Authentic Product Image', 'আসল পণ্যের ছবি'))}
          </span>
        </div>
        {status && onStatusChange && (
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold">
            {status === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {tx(lang, 'Verified', 'যাচাইকৃত')}
              </span>
            ) : status === 'PENDING' ? (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" />
                {tx(lang, 'Pending', 'অপেক্ষমাণ')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <ImageOff className="h-3.5 w-3.5" />
                {tx(lang, 'Unavailable', 'ছবি নেই')}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Live Preview */}
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs dark:border-slate-700">
          {value ? (
            <img
              src={value}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <ImageOff className="h-6 w-6" />
              <span className="mt-1 text-[10px]">{tx(lang, 'No image', 'ছবি নেই')}</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handlePrimaryFile}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {value ? tx(lang, 'Replace Photo', 'ছবি পরিবর্তন') : tx(lang, 'Upload Photo', 'ছবি আপলোড')}
            </button>
            {value && (
              <button
                type="button"
                onClick={removePrimary}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {tx(lang, 'Remove', 'মুছুন')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <LinkIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onBlur={applyUrl}
                placeholder={tx(lang, 'Or paste official image URL (https://... or /catalog/...)', 'অথবা অফিসিয়াল ছবির URL দিন...')}
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <button
              type="button"
              onClick={applyUrl}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {tx(lang, 'Apply', 'প্রয়োগ')}
            </button>
          </div>
        </div>
      </div>

      {/* Metadata: Source & Verification Status */}
      {(onSourceChange || onStatusChange) && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {onSourceChange && (
            <input
              type="text"
              value={source || ''}
              onChange={(e) => onSourceChange(e.target.value)}
              placeholder={tx(lang, 'Image Source (e.g. Official Brand Catalog)', 'ছবির উৎস (যেমন: অফিসিয়াল ব্র্যান্ড ক্যাটালগ)')}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          )}
          {onStatusChange && (
            <select
              value={status || 'UNAVAILABLE'}
              onChange={(e) => onStatusChange(e.target.value as 'VERIFIED' | 'PENDING' | 'UNAVAILABLE')}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="VERIFIED">{tx(lang, 'Status: Verified Authentic', 'অবস্থা: যাচাইকৃত আসল ছবি')}</option>
              <option value="PENDING">{tx(lang, 'Status: Pending Verification', 'অবস্থা: যাচাই অপেক্ষমাণ')}</option>
              <option value="UNAVAILABLE">{tx(lang, 'Status: Unavailable', 'অবস্থা: ছবি নেই')}</option>
            </select>
          )}
        </div>
      )}

      {/* Optional Multi-Image Gallery */}
      {onGalleryChange && (
        <div className="border-t border-indigo-100 pt-2.5 dark:border-indigo-900/40">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
              {tx(lang, `Additional Gallery Photos (${(gallery || []).length})`, `অতিরিক্ত গ্যালারি ছবি (${(gallery || []).length})`)}
            </span>
            <input
              ref={galleryFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleGalleryFile}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => galleryFileRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              {tx(lang, 'Add Angle', 'আরও ছবি')}
            </button>
          </div>
          {(gallery || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(gallery || []).map((gUrl, idx) => (
                <div
                  key={`${gUrl}-${idx}`}
                  className="group relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700"
                >
                  <img src={gUrl} alt={`Gallery ${idx + 1}`} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => onGalleryChange((gallery || []).filter((_, i) => i !== idx))}
                    className="absolute right-0.5 top-0.5 rounded bg-rose-600/90 p-0.5 text-white opacity-0 transition group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
