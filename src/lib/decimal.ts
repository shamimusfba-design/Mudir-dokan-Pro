import Decimal from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function D(val: string | number | Decimal | null | undefined): Decimal {
  if (val === null || val === undefined || val === '') return new Decimal(0);
  try {
    return new Decimal(val);
  } catch {
    return new Decimal(0);
  }
}

export function money(val: string | number | Decimal | null | undefined): string {
  return D(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function qty4(val: string | number | Decimal | null | undefined): string {
  return D(val).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4);
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function toEnDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[০-৯]/g, (d) => String(d.charCodeAt(0) - 0x09e6));
}

export function formatBDT(val: string | number | Decimal | null | undefined, mode?: 'EN' | 'BN'): string {
  const num = D(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (mode === 'BN') {
    const bnFormatted = toBnDigits(formatted);
    return num < 0 ? `-৳${bnFormatted}` : `৳${bnFormatted}`;
  }
  return num < 0 ? `-৳${formatted}` : `৳${formatted}`;
}

export function formatQty(val: string | number | Decimal | null | undefined, mode?: 'EN' | 'BN'): string {
  const d = D(val);
  const enStr = d.isInteger() ? d.toFixed(0) : d.toDecimalPlaces(3).toNumber().toString();
  if (mode === 'BN') {
    return toBnDigits(enStr);
  }
  return enStr;
}

export function dhakaTodayISO(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(now); // YYYY-MM-DD
}

export function formatDateDDMMYYYY(iso?: string | Date | null): string {
  if (!iso) return '—';
  if (iso instanceof Date) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dhaka',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(iso);
  }
  const s = String(iso).slice(0, 10);
  const parts = s.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return s;
}

export function formatDateTimeDhaka(iso?: string | Date | null): string {
  if (!iso) return '—';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function computeWeightedAverageCost(
  currentStock: string | number | Decimal,
  currentAvgCost: string | number | Decimal,
  incomingBaseQty: string | number | Decimal,
  incomingTotalLandedCost: string | number | Decimal
): string {
  const oldQty = Decimal.max(D(currentStock), 0);
  const inQty = D(incomingBaseQty);
  const totalQty = oldQty.plus(inQty);
  if (totalQty.lte(0)) {
    return D(currentAvgCost).toFixed(4);
  }
  const oldVal = oldQty.times(D(currentAvgCost));
  const newVal = oldVal.plus(D(incomingTotalLandedCost));
  return newVal.dividedBy(totalQty).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4);
}

export const BD_UNITS = [
  { code: 'Piece', bn: 'পিস', decimal: false },
  { code: 'Kg', bn: 'কেজি', decimal: true },
  { code: 'Gram', bn: 'গ্রাম', decimal: true },
  { code: 'Liter', bn: 'লিটার', decimal: true },
  { code: 'ml', bn: 'মিলি', decimal: false },
  { code: 'Packet', bn: 'প্যাকেট', decimal: false },
  { code: 'Box', bn: 'বক্স', decimal: false },
  { code: 'Carton', bn: 'কার্টন', decimal: false },
  { code: 'Dozen', bn: 'ডজন', decimal: false },
  { code: 'Bottle', bn: 'বোতল', decimal: false },
  { code: 'Bundle', bn: 'বান্ডিল', decimal: false },
  { code: 'Sack', bn: 'বস্তা', decimal: false },
] as const;

export const PAYMENT_METHODS = [
  { code: 'CASH', en: 'Cash', bn: 'নগদ' },
  { code: 'BKASH', en: 'bKash', bn: 'বিকাশ' },
  { code: 'NAGAD', en: 'Nagad', bn: 'নগদ অ্যাপ' },
  { code: 'ROCKET', en: 'Rocket', bn: 'রকেট' },
  { code: 'CARD', en: 'Card', bn: 'কার্ড' },
  { code: 'BANK', en: 'Bank', bn: 'ব্যাংক' },
] as const;
