import { BD_UNITS, toBnDigits, toEnDigits } from './decimal';

export type LanguageMode = 'EN' | 'BN';

export function normalizeLang(val?: string | null): LanguageMode {
  return val === 'BN' ? 'BN' : 'EN';
}

export function getSavedLang(): LanguageMode {
  if (typeof window === 'undefined') return 'BN';
  const saved = localStorage.getItem('mudirdokan_lang');
  return saved === 'EN' ? 'EN' : 'BN';
}

export function saveLang(mode: LanguageMode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mudirdokan_lang', mode);
  document.documentElement.lang = mode === 'BN' ? 'bn' : 'en';
}

interface DictionaryEntry {
  en: string;
  bn: string;
}

const DICT: Record<string, DictionaryEntry> = {
  appName: { en: 'MudirDokan Pro', bn: 'মুদি দোকান প্রো' },
  dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  pos: { en: 'POS Billing', bn: 'বিক্রয় কাউন্টার' },
  products: { en: 'Products', bn: 'পণ্য তালিকা' },
  inventory: { en: 'Inventory', bn: 'মজুদ ও স্টক' },
  purchases: { en: 'Purchases', bn: 'পণ্য ক্রয়' },
  suppliers: { en: 'Suppliers', bn: 'সরবরাহকারী' },
  customers: { en: 'Customers & Khata', bn: 'ক্রেতা ও ডিজিটাল খাতা' },
  customerDue: { en: 'Customer Due', bn: 'ক্রেতার বাকি' },
  supplierDue: { en: 'Supplier Due', bn: 'সরবরাহকারীর পাওনা' },
  expenses: { en: 'Expenses', bn: 'দোকানের খরচ' },
  reports: { en: 'Profit & Reports', bn: 'লাভ ও রিপোর্ট' },
  cashManagement: { en: 'Cash Register', bn: 'ক্যাশ ব্যবস্থাপনা' },
  settings: { en: 'Settings', bn: 'সেটিংস' },
  customerPortal: { en: 'Customer Portal', bn: 'ক্রেতা পোর্টাল' },
  onlineStore: { en: 'Online Storefront', bn: 'অনলাইন শপ (ই-কমার্স)' },
  adCampaigns: { en: 'Ad Landing Builder', bn: 'অ্যাড ল্যান্ডিং বিল্ডার' },
  clientManagement: { en: 'Client & SaaS Tracking', bn: 'ক্লায়েন্ট ট্র্যাকিং ও সাবস্ক্রিপশন' },

  // Dashboard KPIs
  todaySales: { en: 'Sales Revenue', bn: 'মোট বিক্রয়' },
  grossProfit: { en: 'Gross Profit', bn: 'মোট লাভ (গ্রস)' },
  netProfit: { en: 'Net Profit', bn: 'নিট লাভ' },
  operatingExpenses: { en: 'Operating Expenses', bn: 'পরিচালনা খরচ' },
  cashReceived: { en: 'Cash Received', bn: 'নগদ গ্রহণ' },
  customerOutstanding: { en: 'Customer Outstanding', bn: 'ক্রেতার কাছে পাওনা' },
  supplierOutstanding: { en: 'Supplier Outstanding', bn: 'সরবরাহকারীর পাওনা' },
  inventoryValue: { en: 'Inventory Value', bn: 'মজুদ পণ্যের মূল্য' },

  // Common actions
  save: { en: 'Save', bn: 'সংরক্ষণ' },
  cancel: { en: 'Cancel', bn: 'বাতিল' },
  delete: { en: 'Delete', bn: 'মুছুন' },
  edit: { en: 'Edit', bn: 'সম্পাদনা' },
  add: { en: 'Add', bn: 'যোগ করুন' },
  search: { en: 'Search', bn: 'খুঁজুন' },
  print: { en: 'Print', bn: 'প্রিন্ট' },
  exportCsv: { en: 'Export CSV', bn: 'সিএসভি ডাউনলোড' },
  completeSale: { en: 'Complete Sale', bn: 'বিক্রয় সম্পন্ন করুন' },
  collectDue: { en: 'Collect Due', bn: 'বাকি আদায়' },
  paySupplier: { en: 'Pay Supplier', bn: 'পাওনা পরিশোধ' },
  newSale: { en: 'New Sale', bn: 'নতুন বিক্রয়' },
  signOut: { en: 'Sign Out', bn: 'লগ আউট' },

  // POS & Credit
  subtotal: { en: 'Subtotal', bn: 'উপমোট' },
  discount: { en: 'Discount', bn: 'ছাড়' },
  grandTotal: { en: 'Grand Total', bn: 'সর্বমোট' },
  paidAmount: { en: 'Paid Amount', bn: 'পরিশোধিত' },
  dueAmount: { en: 'Due / Baki', bn: 'বাকি' },
  changeReturn: { en: 'Change Return', bn: 'ফেরত টাকা' },
  walkInCustomer: { en: 'Walk-in Cash Customer', bn: 'সাধারণ নগদ ক্রেতা' },
  expectedPayDate: { en: 'Expected Payment Date', bn: 'বাকি পরিশোধের সম্ভাব্য তারিখ' },
  offlineModeBanner: {
    en: 'Offline Mode — Stock figures are cached locally. Sales queue automatically.',
    bn: 'অফলাইন মোড — স্টক তথ্য ক্যাশ থেকে দেখানো হচ্ছে। বিক্রয় স্বয়ংক্রিয়ভাবে সিঙ্ক হবে।',
  },
};

export function tr(key: keyof typeof DICT | string, mode: LanguageMode): string {
  const entry = DICT[key];
  if (!entry) return String(key);
  return mode === 'BN' ? entry.bn : entry.en;
}

export function trCompact(en: string, bn: string | null | undefined, mode: LanguageMode): string {
  if (mode === 'BN') return bn && bn.trim() ? bn : en;
  return en;
}

export function tx(mode: LanguageMode, en: string, bn: string): string {
  return mode === 'BN' ? bn : en;
}

const METHOD_LABELS: Record<string, { en: string; bn: string }> = {
  CASH: { en: 'Cash', bn: 'নগদ' },
  BKASH: { en: 'bKash', bn: 'বিকাশ' },
  NAGAD: { en: 'Nagad', bn: 'নগদ (Nagad)' },
  ROCKET: { en: 'Rocket', bn: 'রকেট' },
  CARD: { en: 'Card', bn: 'কার্ড' },
  BANK: { en: 'Bank', bn: 'ব্যাংক' },
  CREDIT_DUE: { en: 'Credit (Baki)', bn: 'বাকি বিক্রয়' },
};

export function formatMethodLabel(method: string | null | undefined, mode: LanguageMode): string {
  if (!method) return '—';
  const entry = METHOD_LABELS[method.toUpperCase()];
  if (!entry) return method;
  return mode === 'BN' ? entry.bn : entry.en;
}

const STATUS_LABELS: Record<string, { en: string; bn: string }> = {
  PAID: { en: 'Paid', bn: 'পরিশোধিত' },
  PARTIAL: { en: 'Partial', bn: 'আংশিক' },
  PARTIALLY_PAID: { en: 'Partially Paid', bn: 'আংশিক পরিশোধিত' },
  DUE: { en: 'Due', bn: 'বাকি' },
  UNPAID: { en: 'Unpaid', bn: 'অপরিশোধিত' },
  OVERDUE: { en: 'Overdue', bn: 'মেয়াদোত্তীর্ণ' },
  DUE_TODAY: { en: 'Due Today', bn: 'আজকের বাকি' },
  UPCOMING: { en: 'Upcoming', bn: 'আসন্ন' },
  COMPLETED: { en: 'Completed', bn: 'সম্পন্ন' },
  RETURNED: { en: 'Returned', bn: 'ফেরত' },
  OPEN: { en: 'Open', bn: 'খোলা' },
  CLOSED: { en: 'Closed', bn: 'বন্ধ' },
  RESOLVED: { en: 'Resolved', bn: 'সমাধানকৃত' },
  REJECTED: { en: 'Rejected', bn: 'প্রত্যাখ্যাত' },
  REGULAR: { en: 'Regular', bn: 'নিয়মিত' },
  VIP: { en: 'VIP', bn: 'ভিআইপি' },
  WHOLESALE: { en: 'Wholesale', bn: 'পাইকারি' },
  OCCASIONAL: { en: 'Occasional', bn: 'অনিয়মিত' },
  OWNER: { en: 'Owner', bn: 'মালিক' },
  MANAGER: { en: 'Manager', bn: 'ম্যানেজার' },
  CASHIER: { en: 'Cashier', bn: 'ক্যাশিয়ার' },
  OPENING_BALANCE: { en: 'Opening Balance', bn: 'পূর্বের জের' },
  CREDIT_SALE: { en: 'Credit Sale', bn: 'বাকিতে বিক্রয়' },
  PARTIAL_PAYMENT: { en: 'Partial Payment', bn: 'আংশিক পরিশোধ' },
  FULL_PAYMENT: { en: 'Full Payment', bn: 'পূর্ণ পরিশোধ' },
  SALES_RETURN: { en: 'Sales Return', bn: 'বিক্রয় ফেরত' },
  BALANCE_ADJUSTMENT: { en: 'Balance Adjustment', bn: 'ব্যালেন্স সমন্বয়' },
  PURCHASE: { en: 'Purchase', bn: 'ক্রয়' },
  PURCHASE_CASH: { en: 'Cash Purchase', bn: 'নগদ ক্রয়' },
  SUPPLIER_PAYMENT: { en: 'Supplier Payment', bn: 'সরবরাহকারী পরিশোধ' },
  PURCHASE_RETURN: { en: 'Purchase Return', bn: 'ক্রয় ফেরত' },
  SALE: { en: 'Sale', bn: 'বিক্রয়' },
  ADJUSTMENT_IN: { en: 'Stock In', bn: 'স্টক বৃদ্ধি' },
  ADJUSTMENT_OUT: { en: 'Stock Out', bn: 'স্টক হ্রাস' },
  DAMAGE: { en: 'Damaged', bn: 'ক্ষতিগ্রস্ত' },
  EXPIRED: { en: 'Expired', bn: 'মেয়াদোত্তীর্ণ' },
  MANUAL_IN: { en: 'Cash In', bn: 'নগদ জমা' },
  MANUAL_OUT: { en: 'Cash Out', bn: 'নগদ উত্তোলন' },
  CASH_IN: { en: 'Cash In', bn: 'নগদ জমা' },
  CASH_OUT: { en: 'Cash Out', bn: 'নগদ উত্তোলন' },
  OPENING: { en: 'Opening Float', bn: 'প্রারম্ভিক ক্যাশ' },
  SALE_CASH: { en: 'Cash Sale', bn: 'নগদ বিক্রয়' },
  CUSTOMER_DUE_COLLECTION: { en: 'Due Collection (Cash)', bn: 'নগদ বাকি আদায়' },
  DUE_COLLECTION: { en: 'Due Collection', bn: 'বাকি আদায়' },
  EXPENSE: { en: 'Expense', bn: 'খরচ' },
  EXPENSE_CASH: { en: 'Cash Expense', bn: 'নগদ খরচ' },
  SALES_RETURN_CASH: { en: 'Cash Sales Return', bn: 'নগদ বিক্রয় ফেরত' },
  OWNER_INVESTMENT: { en: 'Owner Investment', bn: 'মালিকের মূলধন জমা' },
  OWNER_DRAWING: { en: 'Owner Drawing', bn: 'মালিকের উত্তোলন' },
  BANK_DEPOSIT: { en: 'Bank Deposit', bn: 'ব্যাংকে জমা' },
  BANK_WITHDRAWAL: { en: 'Bank Withdrawal', bn: 'ব্যাংক থেকে উত্তোলন' },
  PENDING: { en: 'Pending', bn: 'অপেক্ষমাণ' },
  SYNCED: { en: 'Synced', bn: 'সিঙ্ক সম্পন্ন' },
  CONFLICT: { en: 'Conflict', bn: 'সংঘর্ষ' },
  ERROR: { en: 'Error', bn: 'ত্রুটি' },
};

export function formatStatusLabel(status: string | null | undefined, mode: LanguageMode): string {
  if (!status) return '—';
  const entry = STATUS_LABELS[status.toUpperCase()];
  if (!entry) return status;
  return mode === 'BN' ? entry.bn : entry.en;
}

export function formatUnitLabel(unit: string | null | undefined, mode: LanguageMode): string {
  if (!unit) return '';
  if (mode === 'BN') {
    const match = BD_UNITS.find((u) => u.code.toLowerCase() === unit.toLowerCase());
    return match ? match.bn : toBnDigits(unit);
  }
  const match = BD_UNITS.find((u) => u.code.toLowerCase() === unit.toLowerCase() || u.bn === unit);
  return match ? match.code : toEnDigits(unit);
}

export function formatVariant(variant: string | null | undefined, mode: LanguageMode): string {
  if (!variant) return '';
  if (mode === 'EN') {
    let out = toEnDigits(variant);
    out = out
      .replace(/কেজি/gi, 'kg')
      .replace(/গ্রাম/gi, 'g')
      .replace(/মিলি/gi, 'ml')
      .replace(/লিটার/gi, 'L')
      .replace(/বস্তা/gi, 'Sack')
      .replace(/পিস/gi, 'Pcs')
      .replace(/প্যাকেট/gi, 'Pkt')
      .replace(/বোতল/gi, 'Bottle')
      .replace(/বক্স/gi, 'Box')
      .replace(/কার্টন/gi, 'Carton')
      .replace(/ডজন/gi, 'Dozen')
      .replace(/জার/gi, 'Jar')
      .replace(/ইঞ্চি/gi, 'inch')
      .replace(/\s+/g, ' ')
      .trim();
    return out;
  } else {
    let out = toBnDigits(variant);
    out = out
      .replace(/\bkg\b|\bKg\b|\bKG\b/gi, 'কেজি')
      .replace(/\bgm\b|\bg\b|\bgram\b|\bgrams\b/gi, 'গ্রাম')
      .replace(/\bml\b|\bML\b/gi, 'মিলি')
      .replace(/\bliter\b|\blitre\b|\bL\b/gi, 'লিটার')
      .replace(/\bsack\b|\bSack\b|\bbag\b/gi, 'বস্তা')
      .replace(/\bpcs\b|\bpc\b|\bpiece\b|\bPiece\b/gi, 'পিস')
      .replace(/\bpkt\b|\bpack\b|\bpacket\b/gi, 'প্যাকেট')
      .replace(/\bbottle\b|\bBottle\b/gi, 'বোতল')
      .replace(/\bbox\b|\bBox\b/gi, 'বক্স')
      .replace(/\bcarton\b|\bCarton\b/gi, 'কার্টন')
      .replace(/\bdozen\b|\bDozen\b/gi, 'ডজন')
      .replace(/\bjar\b|\bJar\b/gi, 'জার')
      .replace(/\binch\b|\binches\b/gi, 'ইঞ্চি')
      .replace(/\s+/g, ' ')
      .trim();
    return out;
  }
}
