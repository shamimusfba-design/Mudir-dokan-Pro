// Complete Bangladesh Grocery Store 6-Month Demo Catalog
// 215+ realistic Bangladeshi FMCG & loose grocery SKUs, 18 Suppliers, 110 Fictional Customers, 22 Expense Categories

export interface DemoBrandDef {
  name: string;
  nameBn: string;
  company: string;
  logoUrl: string | null;
  logoSource: string;
  logoStatus: 'VERIFIED' | 'UNAVAILABLE';
  brandColor: string;
}

export const EXTRA_DEMO_BRANDS: DemoBrandDef[] = [
  { name: 'Ruchi', nameBn: 'রুচি', company: 'Square Food & Beverage', logoUrl: '/catalog/brands/square.svg', logoSource: 'Square Food & Beverage Brand Family', logoStatus: 'VERIFIED', brandColor: '#B91C1C' },
  { name: 'Savlon', nameBn: 'স্যাভলন', company: 'ACI Consumer Brands', logoUrl: '/catalog/brands/aci.svg', logoSource: 'ACI Consumer Brands Family', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Meril', nameBn: 'মেরিল', company: 'Square Toiletries Ltd.', logoUrl: '/catalog/brands/square.svg', logoSource: 'Square Toiletries Brand Family', logoStatus: 'VERIFIED', brandColor: '#DB2777' },
  { name: 'Mojo', nameBn: 'মোজো', company: 'Akij Food & Beverage', logoUrl: '/catalog/brands/akij.svg', logoSource: 'Akij Food & Beverage Brand Family', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Frutika', nameBn: 'ফ্রুটিকা', company: 'Akij Food & Beverage', logoUrl: '/catalog/brands/akij.svg', logoSource: 'Akij Food & Beverage Brand Family', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Wheel', nameBn: 'হুইল', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/unilever.svg', logoSource: 'Unilever Bangladesh Brand Family', logoStatus: 'VERIFIED', brandColor: '#16A34A' },
  { name: 'Surf Excel', nameBn: 'সার্ফ এক্সেল', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/unilever.svg', logoSource: 'Unilever Bangladesh Brand Family', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Vim', nameBn: 'ভিম', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/unilever.svg', logoSource: 'Unilever Bangladesh Brand Family', logoStatus: 'VERIFIED', brandColor: '#CA8A04' },
  { name: 'Parachute', nameBn: 'প্যারাসুট', company: 'Marico Bangladesh', logoUrl: '/catalog/brands/marico.svg', logoSource: 'Marico Bangladesh Brand Family', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'Pepsi', nameBn: 'পেপসি', company: 'Transcom Beverages', logoUrl: '/catalog/brands/pepsi.svg', logoSource: 'Official Pepsi Brand Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'ACI Pure', nameBn: 'এসিআই পিওর', company: 'ACI Consumer Brands', logoUrl: '/catalog/brands/aci.svg', logoSource: 'Official ACI Limited Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
];

export interface DemoSkuDef {
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  name: string;
  nameBn: string;
  variant: string;
  baseUnit: string;
  allowDecimalQty: boolean;
  cost: number; // Base unit cost (calibrated around 80% of sellingPrice for 20% gross margin on sales)
  price: number; // Selling price in BDT
  openingStock: number;
  minStock: number;
  isFrequent?: boolean;
  demandWeight: number; // Relative sales velocity (1-10)
  supplierKey: string;
  packUnit?: { unitName: string; unitNameBn: string; factor: number };
}

// Helper to build a SKU cleanly while ensuring realistic BD pricing & ~20% gross margin on sales
function sku(
  code: string,
  idx: number,
  category: string,
  brand: string,
  name: string,
  nameBn: string,
  variant: string,
  baseUnit: string,
  price: number,
  marginPct: number, // Gross margin on sales (e.g. 0.20 => cost = price * 0.80)
  openingStock: number,
  minStock: number,
  supplierKey: string,
  demandWeight: number,
  opts?: { allowDecimalQty?: boolean; isFrequent?: boolean; packUnit?: { unitName: string; unitNameBn: string; factor: number } }
): DemoSkuDef {
  const cost = Number((price * (1 - marginPct)).toFixed(2));
  return {
    sku: code,
    barcode: `894200${String(idx).padStart(7, '0')}`,
    category,
    brand,
    name,
    nameBn,
    variant,
    baseUnit,
    allowDecimalQty: Boolean(opts?.allowDecimalQty),
    cost,
    price,
    openingStock,
    minStock,
    isFrequent: Boolean(opts?.isFrequent),
    demandWeight,
    supplierKey,
    packUnit: opts?.packUnit,
  };
}

let _bcIdx = 1001;
const nextBc = () => _bcIdx++;

export const DEMO_PRODUCTS: DemoSkuDef[] = [
  // =========================================================================
  // 1. Rice, Dal & Grains (20 SKUs)
  // =========================================================================
  sku('RICE-MIN-1KG', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Miniket Rice (Loose)', 'মিনিকেট চাল (খোলা)', '1 kg', 'Kg', 75, 0.18, 220, 40, 'RICE', 10, { allowDecimalQty: true, isFrequent: true, packUnit: { unitName: 'Sack', unitNameBn: 'বস্তা (৫০ কেজি)', factor: 50 } }),
  sku('DEMO-RICE-MIN-5K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Miniket Rice (Pack)', 'মিনিকেট চাল (প্যাক)', '5 kg Bag', 'Packet', 370, 0.18, 70, 15, 'RICE', 8),
  sku('DEMO-RICE-NAZ-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Nazirshail Rice (Loose)', 'নাজিরশাইল চাল (খোলা)', '1 kg', 'Kg', 82, 0.18, 180, 30, 'RICE', 9, { allowDecimalQty: true, isFrequent: true, packUnit: { unitName: 'Sack', unitNameBn: 'বস্তা (৫০ কেজি)', factor: 50 } }),
  sku('DEMO-RICE-NAZ-5K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Nazirshail Premium Rice', 'নাজিরশাইল প্রিমিয়াম চাল', '5 kg Bag', 'Packet', 405, 0.18, 55, 10, 'RICE', 7),
  sku('DEMO-RICE-BR28-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'BR-28 Rice (Loose)', 'বিআর-২৮ চাল (খোলা)', '1 kg', 'Kg', 64, 0.18, 200, 40, 'RICE', 8, { allowDecimalQty: true }),
  sku('DEMO-RICE-ATOP-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Kataribhog Atop Rice', 'কাটারিভোগ আতপ চাল', '1 kg', 'Kg', 95, 0.19, 90, 20, 'RICE', 5, { allowDecimalQty: true }),
  sku('RICE-MIN-5KG', nextBc(), 'Rice, Dal & Grains', 'ACI Pure', 'ACI Aroma Chinigura Rice', 'এসিআই অ্যারোমা চিনিগুঁড়া চাল', '1 kg Pack', 'Packet', 160, 0.20, 65, 15, 'ACI', 7, { isFrequent: true }),
  sku('DEMO-PR-CHIN-1K', nextBc(), 'Rice, Dal & Grains', 'PRAN', 'PRAN Chinigura Aromatic Rice', 'প্রাণ চিনিগুঁড়া সুগন্ধি চাল', '1 kg', 'Packet', 158, 0.20, 60, 12, 'PRAN', 6),
  sku('DEMO-FR-CHIN-1K', nextBc(), 'Rice, Dal & Grains', 'Fresh', 'Fresh Chinigura Rice', 'ফ্রেশ চিনিগুঁড়া চাল', '1 kg', 'Packet', 155, 0.20, 55, 12, 'FRESH', 6),
  sku('DEMO-TEER-CHIN-1K', nextBc(), 'Rice, Dal & Grains', 'Teer', 'Teer Chinigura Rice', 'তীর চিনিগুঁড়া চাল', '1 kg', 'Packet', 156, 0.20, 50, 10, 'TEER', 5),
  sku('DAL-MOS-1KG', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Deshi Mosur Dal (Loose)', 'দেশি মসুর ডাল (খোলা)', '1 kg', 'Kg', 138, 0.19, 130, 25, 'DAL', 9, { allowDecimalQty: true, isFrequent: true }),
  sku('DEMO-DAL-MOS-IMP', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Imported Mosur Dal (Bold)', 'আমদানিকৃত মসুর ডাল', '1 kg', 'Kg', 115, 0.19, 120, 20, 'DAL', 7, { allowDecimalQty: true }),
  sku('DEMO-DAL-MUG-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Shona Mug Dal (Loose)', 'সোনা মুগ ডাল (খোলা)', '1 kg', 'Kg', 175, 0.20, 75, 15, 'DAL', 6, { allowDecimalQty: true }),
  sku('DEMO-DAL-BOOT-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Boot / Chola Dal (Loose)', 'ছোলার ডাল (খোলা)', '1 kg', 'Kg', 120, 0.20, 80, 15, 'DAL', 5, { allowDecimalQty: true }),
  sku('DEMO-CHOLA-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Deshi Chickpeas (Chola)', 'ছোলা বুট (খোলা)', '1 kg', 'Kg', 112, 0.20, 95, 20, 'DAL', 6, { allowDecimalQty: true }),
  sku('DEMO-DAL-KHES-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Khesari Dal (Loose)', 'খেসারি ডাল (খোলা)', '1 kg', 'Kg', 105, 0.20, 85, 15, 'DAL', 5, { allowDecimalQty: true }),
  sku('DEMO-DAL-MASH-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Mashkalai Dal (Loose)', 'মাষকলাই ডাল (খোলা)', '1 kg', 'Kg', 165, 0.20, 50, 10, 'DAL', 4, { allowDecimalQty: true }),
  sku('DEMO-CHIRA-1K', nextBc(), 'Rice, Dal & Grains', 'Local / Loose', 'Deshi Flattened Rice (Chira)', 'দেশি চিড়া (খোলা)', '1 kg', 'Kg', 85, 0.21, 70, 15, 'DAL', 5, { allowDecimalQty: true }),
  sku('DEMO-MURI-500G', nextBc(), 'Rice, Dal & Grains', 'PRAN', 'PRAN Puffed Rice (Muri)', 'প্রাণ মুড়ি', '500g', 'Packet', 60, 0.21, 65, 15, 'PRAN', 6),
  sku('DEMO-PR-MOS-1K', nextBc(), 'Rice, Dal & Grains', 'PRAN', 'PRAN Mosur Dal Pack', 'প্রাণ মসুর ডাল প্যাক', '1 kg', 'Packet', 148, 0.20, 55, 10, 'PRAN', 5),

  // =========================================================================
  // 2. Flour, Atta, Maida & Suji (12 SKUs)
  // =========================================================================
  sku('FR-ATTA-2KG', nextBc(), 'Flour, Atta, Maida & Suji', 'Fresh', 'Fresh Atta', 'ফ্রেশ আটা', '2 kg', 'Packet', 120, 0.19, 95, 20, 'FRESH', 9, { isFrequent: true }),
  sku('DEMO-FR-ATTA-1K', nextBc(), 'Flour, Atta, Maida & Suji', 'Fresh', 'Fresh Atta', 'ফ্রেশ আটা', '1 kg', 'Packet', 62, 0.19, 80, 15, 'FRESH', 7),
  sku('FR-MAIDA-1KG', nextBc(), 'Flour, Atta, Maida & Suji', 'Fresh', 'Fresh Maida', 'ফ্রেশ ময়দা', '1 kg', 'Packet', 75, 0.19, 75, 15, 'FRESH', 7),
  sku('DEMO-FR-MAIDA-2K', nextBc(), 'Flour, Atta, Maida & Suji', 'Fresh', 'Fresh Maida', 'ফ্রেশ ময়দা', '2 kg', 'Packet', 146, 0.19, 55, 12, 'FRESH', 6),
  sku('DEMO-TEER-ATTA-2K', nextBc(), 'Flour, Atta, Maida & Suji', 'Teer', 'Teer Whole Wheat Atta', 'তীর আটা', '2 kg', 'Packet', 122, 0.19, 85, 18, 'TEER', 8, { isFrequent: true }),
  sku('DEMO-TEER-MAID-1K', nextBc(), 'Flour, Atta, Maida & Suji', 'Teer', 'Teer Refined Maida', 'তীর ময়দা', '1 kg', 'Packet', 76, 0.19, 65, 12, 'TEER', 6),
  sku('TEER-SUJI-500G', nextBc(), 'Flour, Atta, Maida & Suji', 'Teer', 'Teer Suji', 'তীর সুজি', '500g', 'Packet', 48, 0.20, 70, 12, 'TEER', 6),
  sku('DEMO-ACI-ATTA-2K', nextBc(), 'Flour, Atta, Maida & Suji', 'ACI Pure', 'ACI Pure Atta', 'এসিআই পিওর আটা', '2 kg', 'Packet', 124, 0.19, 65, 12, 'ACI', 7),
  sku('DEMO-ACI-MAID-1K', nextBc(), 'Flour, Atta, Maida & Suji', 'ACI Pure', 'ACI Pure Maida', 'এসিআই পিওর ময়দা', '1 kg', 'Packet', 78, 0.20, 55, 10, 'ACI', 5),
  sku('DEMO-BSH-ATTA-2K', nextBc(), 'Flour, Atta, Maida & Suji', 'Bashundhara', 'Bashundhara Atta', 'বসুন্ধরা আটা', '2 kg', 'Packet', 120, 0.19, 60, 12, 'BSH', 6),
  sku('DEMO-FR-SUJI-500', nextBc(), 'Flour, Atta, Maida & Suji', 'Fresh', 'Fresh Semolina (Suji)', 'ফ্রেশ সুজি', '500g', 'Packet', 48, 0.20, 55, 10, 'FRESH', 5),
  sku('DEMO-BESON-500G', nextBc(), 'Flour, Atta, Maida & Suji', 'Local / Loose', 'Pure Gram Flour (Beson)', 'খাঁটি বেসন (খোলা)', '500g', 'Packet', 75, 0.21, 50, 10, 'DAL', 5),

  // =========================================================================
  // 3. Cooking Oil & Ghee (15 SKUs)
  // =========================================================================
  sku('FR-OIL-1L', nextBc(), 'Cooking Oil & Ghee', 'Fresh', 'Fresh Fortified Soybean Oil', 'ফ্রেশ সয়াবিন তেল', '1 Liter', 'Bottle', 170, 0.17, 110, 20, 'FRESH', 10, { isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (১২ বোতল)', factor: 12 } }),
  sku('FR-OIL-2L', nextBc(), 'Cooking Oil & Ghee', 'Fresh', 'Fresh Fortified Soybean Oil', 'ফ্রেশ সয়াবিন তেল', '2 Liter', 'Bottle', 338, 0.17, 70, 14, 'FRESH', 9),
  sku('FR-OIL-5L', nextBc(), 'Cooking Oil & Ghee', 'Fresh', 'Fresh Fortified Soybean Oil', 'ফ্রেশ সয়াবিন তেল', '5 Liter', 'Bottle', 825, 0.17, 55, 10, 'FRESH', 10, { isFrequent: true }),
  sku('DEMO-TEER-OIL-1L', nextBc(), 'Cooking Oil & Ghee', 'Teer', 'Teer Fortified Soybean Oil', 'তীর সয়াবিন তেল', '1 Liter', 'Bottle', 170, 0.17, 90, 18, 'TEER', 8),
  sku('DEMO-TEER-OIL-2L', nextBc(), 'Cooking Oil & Ghee', 'Teer', 'Teer Fortified Soybean Oil', 'তীর সয়াবিন তেল', '2 Liter', 'Bottle', 338, 0.17, 60, 12, 'TEER', 7),
  sku('DEMO-TEER-OIL-5L', nextBc(), 'Cooking Oil & Ghee', 'Teer', 'Teer Fortified Soybean Oil', 'তীর সয়াবিন তেল', '5 Liter', 'Bottle', 825, 0.17, 45, 10, 'TEER', 8),
  sku('DEMO-BSH-OIL-5L', nextBc(), 'Cooking Oil & Ghee', 'Bashundhara', 'Bashundhara Soybean Oil', 'বসুন্ধরা সয়াবিন তেল', '5 Liter', 'Bottle', 820, 0.17, 40, 8, 'BSH', 7),
  sku('TEER-MUST-500M', nextBc(), 'Cooking Oil & Ghee', 'Teer', 'Teer Mustard Oil', 'তীর সরিষার তেল', '500 ml', 'Bottle', 165, 0.19, 60, 12, 'TEER', 7),
  sku('DEMO-RAD-MUST-500', nextBc(), 'Cooking Oil & Ghee', 'Radhuni', 'Radhuni Pure Mustard Oil', 'রাঁধুনী খাঁটি সরিষার তেল', '500 ml', 'Bottle', 175, 0.20, 55, 12, 'SQUARE', 7),
  sku('DEMO-RAD-MUST-200', nextBc(), 'Cooking Oil & Ghee', 'Radhuni', 'Radhuni Pure Mustard Oil', 'রাঁধুনী খাঁটি সরিষার তেল', '200 ml', 'Bottle', 75, 0.20, 65, 15, 'SQUARE', 6),
  sku('DEMO-PR-MUST-500', nextBc(), 'Cooking Oil & Ghee', 'PRAN', 'PRAN Mustard Oil', 'প্রাণ সরিষার তেল', '500 ml', 'Bottle', 168, 0.20, 55, 10, 'PRAN', 6),
  sku('DEMO-OIL-LOOSE-1L', nextBc(), 'Cooking Oil & Ghee', 'Local / Loose', 'Loose Soybean Oil', 'খোলা সয়াবিন তেল', '1 Liter', 'Liter', 155, 0.18, 120, 25, 'OIL', 8, { allowDecimalQty: true }),
  sku('DEMO-PR-GHEE-200', nextBc(), 'Cooking Oil & Ghee', 'PRAN', 'PRAN Premium Ghee', 'প্রাণ প্রিমিয়াম ঘি', '200g Jar', 'Bottle', 340, 0.21, 35, 8, 'PRAN', 5),
  sku('DEMO-PR-GHEE-400', nextBc(), 'Cooking Oil & Ghee', 'PRAN', 'PRAN Premium Ghee', 'প্রাণ প্রিমিয়াম ঘি', '400g Jar', 'Bottle', 660, 0.21, 25, 6, 'PRAN', 4),
  sku('DEMO-FR-RICEB-2L', nextBc(), 'Cooking Oil & Ghee', 'Fresh', 'Fresh Rice Bran Oil', 'ফ্রেশ রাইস ব্র্যান অয়েল', '2 Liter', 'Bottle', 395, 0.19, 32, 8, 'FRESH', 5),

  // =========================================================================
  // 4. Salt & Sugar (9 SKUs)
  // =========================================================================
  sku('ACI-SALT-1KG', nextBc(), 'Salt & Sugar', 'ACI Pure', 'ACI Pure Iodized Salt', 'এসিআই পিওর লবণ', '1 kg', 'Packet', 42, 0.20, 140, 25, 'ACI', 10, { isFrequent: true, packUnit: { unitName: 'Sack', unitNameBn: 'বস্তা (২৫ প্যাকেট)', factor: 25 } }),
  sku('DEMO-FR-SALT-1K', nextBc(), 'Salt & Sugar', 'Fresh', 'Fresh Super Vacuum Salt', 'ফ্রেশ সুপার লবণ', '1 kg', 'Packet', 42, 0.20, 110, 20, 'FRESH', 8),
  sku('DEMO-MOL-SALT-1K', nextBc(), 'Salt & Sugar', 'Local / Loose', 'Molla Super Iodized Salt', 'মোল্লা সুপার লবণ', '1 kg', 'Packet', 40, 0.20, 100, 20, 'LOCAL', 7),
  sku('DEMO-SALT-LOOSE', nextBc(), 'Salt & Sugar', 'Local / Loose', 'Cooking Salt (Loose)', 'খোলা লবণ', '1 kg', 'Kg', 32, 0.22, 90, 20, 'LOCAL', 5, { allowDecimalQty: true }),
  sku('FR-SUGAR-1KG', nextBc(), 'Salt & Sugar', 'Fresh', 'Fresh Refined Sugar', 'ফ্রেশ রিফাইন্ড চিনি', '1 kg', 'Packet', 138, 0.18, 120, 25, 'FRESH', 9, { isFrequent: true }),
  sku('DEMO-TEER-SUG-1K', nextBc(), 'Salt & Sugar', 'Teer', 'Teer Refined Sugar', 'তীর রিফাইন্ড চিনি', '1 kg', 'Packet', 138, 0.18, 95, 20, 'TEER', 8),
  sku('SUGAR-LOOSE-1K', nextBc(), 'Salt & Sugar', 'Local / Loose', 'White Sugar (Loose)', 'খোলা চিনি', '1 kg', 'Kg', 130, 0.18, 140, 30, 'LOCAL', 9, { allowDecimalQty: true }),
  sku('DEMO-GUR-DATE-500', nextBc(), 'Salt & Sugar', 'Local / Loose', 'Deshi Patali Gur (Jaggery)', 'দেশি পাটালি গুড়', '500g', 'Packet', 145, 0.22, 45, 10, 'LOCAL', 4),
  sku('DEMO-ACI-BLKSALT', nextBc(), 'Salt & Sugar', 'ACI Pure', 'ACI Pure Bit Lobon', 'এসিআই বিট লবণ', '200g', 'Bottle', 65, 0.23, 40, 8, 'ACI', 4),

  // =========================================================================
  // 5. Spices & Masala (18 SKUs)
  // =========================================================================
  sku('SQ-RAD-TUR-200', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Turmeric Powder', 'রাঁধুনী হলুদ গুঁড়া', '200g', 'Packet', 112, 0.22, 85, 15, 'SQUARE', 8, { isFrequent: true }),
  sku('SQ-RAD-CHL-200', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Red Chili Powder', 'রাঁধুনী মরিচ গুঁড়া', '200g', 'Packet', 140, 0.22, 80, 15, 'SQUARE', 8, { isFrequent: true }),
  sku('DEMO-RAD-COR-200', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Coriander Powder', 'রাঁধুনী ধনিয়া গুঁড়া', '200g', 'Packet', 98, 0.22, 75, 15, 'SQUARE', 7),
  sku('DEMO-RAD-CUM-100', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Cumin Powder', 'রাঁধুনী জিরা গুঁড়া', '100g', 'Packet', 135, 0.22, 65, 12, 'SQUARE', 7),
  sku('DEMO-RAD-BIR-40', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Biryani Masala', 'রাঁধুনী বিরিয়ানি মসলা', '40g', 'Packet', 65, 0.23, 85, 15, 'SQUARE', 7),
  sku('DEMO-RAD-BEEF-100', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Beef Curry Masala', 'রাঁধুনী গরুর মাংসের মসলা', '100g', 'Packet', 85, 0.23, 75, 15, 'SQUARE', 7),
  sku('DEMO-RAD-HAL-200', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Ready Mix Haleem', 'রাঁধুনী হালিম মিক্স', '200g', 'Box', 75, 0.23, 70, 12, 'SQUARE', 6),
  sku('DEMO-RAD-ROAST', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Roast Masala', 'রাঁধুনী রোস্ট মসলা', '35g', 'Packet', 60, 0.23, 65, 12, 'SQUARE', 6),
  sku('PR-CHICK-50G', nextBc(), 'Spices & Masala', 'PRAN', 'PRAN Chicken Masala', 'প্রাণ মুরগির মাংসের মসলা', '50g', 'Packet', 55, 0.23, 85, 15, 'PRAN', 7),
  sku('DEMO-PR-TUR-200', nextBc(), 'Spices & Masala', 'PRAN', 'PRAN Turmeric Powder', 'প্রাণ হলুদ গুঁড়া', '200g', 'Packet', 108, 0.22, 70, 12, 'PRAN', 6),
  sku('DEMO-PR-CHL-200', nextBc(), 'Spices & Masala', 'PRAN', 'PRAN Chili Powder', 'প্রাণ মরিচ গুঁড়া', '200g', 'Packet', 136, 0.22, 70, 12, 'PRAN', 6),
  sku('DEMO-ACI-TUR-200', nextBc(), 'Spices & Masala', 'ACI Pure', 'ACI Pure Turmeric Powder', 'এসিআই পিওর হলুদ গুঁড়া', '200g', 'Packet', 110, 0.22, 65, 12, 'ACI', 6),
  sku('DEMO-ACI-CHL-200', nextBc(), 'Spices & Masala', 'ACI Pure', 'ACI Pure Chili Powder', 'এসিআই পিওর মরিচ গুঁড়া', '200g', 'Packet', 138, 0.22, 60, 12, 'ACI', 6),
  sku('DEMO-SPC-JIRA-100', nextBc(), 'Spices & Masala', 'Local / Loose', 'Whole Cumin (Gota Jira)', 'গোটা জিরা (খোলা)', '100g', 'Packet', 115, 0.22, 80, 15, 'OIL', 7),
  sku('DEMO-SPC-ELACH-50', nextBc(), 'Spices & Masala', 'Local / Loose', 'Green Cardamom (Elach)', 'সবুজ এলাচ (খোলা)', '50g', 'Packet', 190, 0.22, 55, 10, 'OIL', 5),
  sku('DEMO-SPC-DARU-100', nextBc(), 'Spices & Masala', 'Local / Loose', 'Cinnamon Stick (Daruchini)', 'দারুচিনি (খোলা)', '100g', 'Packet', 75, 0.22, 70, 12, 'OIL', 5),
  sku('DEMO-SPC-GARAM-50', nextBc(), 'Spices & Masala', 'Radhuni', 'Radhuni Garam Masala', 'রাঁধুনী গরম মসলা', '40g', 'Packet', 70, 0.23, 60, 12, 'SQUARE', 6),
  sku('DEMO-SPC-TEJP-50', nextBc(), 'Spices & Masala', 'Local / Loose', 'Bay Leaf (Tejpata)', 'তেজপাতা', '50g', 'Packet', 30, 0.25, 70, 15, 'OIL', 5),

  // =========================================================================
  // 6. Tea & Coffee (9 SKUs)
  // =========================================================================
  sku('FR-TEA-400G', nextBc(), 'Tea & Coffee', 'Fresh', 'Fresh Premium Tea', 'ফ্রেশ প্রিমিয়াম চা', '400g', 'Packet', 215, 0.21, 70, 14, 'FRESH', 8, { isFrequent: true }),
  sku('DEMO-FR-TEA-200', nextBc(), 'Tea & Coffee', 'Fresh', 'Fresh Premium Tea', 'ফ্রেশ প্রিমিয়াম চা', '200g', 'Packet', 112, 0.21, 75, 15, 'FRESH', 7),
  sku('DEMO-UNI-TAZA-400', nextBc(), 'Tea & Coffee', 'Unilever', 'Brooke Bond Taaza Tea', 'ব্রুক বন্ড তাজা চা', '400g', 'Packet', 225, 0.21, 75, 15, 'UNILEVER', 8, { isFrequent: true }),
  sku('DEMO-UNI-TAZA-200', nextBc(), 'Tea & Coffee', 'Unilever', 'Brooke Bond Taaza Tea', 'ব্রুক বন্ড তাজা চা', '200g', 'Packet', 115, 0.21, 80, 15, 'UNILEVER', 7),
  sku('DEMO-TEER-TEA-400', nextBc(), 'Tea & Coffee', 'Teer', 'Teer Premium Tea', 'তীর প্রিমিয়াম চা', '400g', 'Packet', 210, 0.21, 55, 12, 'TEER', 6),
  sku('DEMO-AK-ISP-400', nextBc(), 'Tea & Coffee', 'Akij', 'Ispahani Mirzapore Tea', 'ইস্পাহানি মির্জাপুর চা', '400g', 'Packet', 235, 0.20, 65, 12, 'LOCAL', 8),
  sku('NES-CLAS-50G', nextBc(), 'Tea & Coffee', 'Nestlé', 'Nescafé Classic Jar', 'নেসক্যাফে ক্লাসিক কফি', '50g', 'Bottle', 220, 0.21, 45, 10, 'NESTLE', 6, { isFrequent: true }),
  sku('DEMO-NES-CLAS-100', nextBc(), 'Tea & Coffee', 'Nestlé', 'Nescafé Classic Jar', 'নেসক্যাফে ক্লাসিক কফি', '100g', 'Bottle', 410, 0.21, 30, 6, 'NESTLE', 5),
  sku('DEMO-NES-3IN1-20', nextBc(), 'Tea & Coffee', 'Nestlé', 'Nescafé 3-in-1 Coffee Pack', 'নেসক্যাফে ৩-ইন-১ কফি', '20 Sachets', 'Packet', 240, 0.22, 40, 8, 'NESTLE', 5),

  // =========================================================================
  // 7. Biscuits & Bakery (14 SKUs)
  // =========================================================================
  sku('OLY-ENP-145G', nextBc(), 'Biscuits & Bakery', 'Olympic', 'Olympic Energy Plus Biscuit', 'অলিম্পিক এনার্জি প্লাস বিস্কুট', '145g', 'Packet', 35, 0.22, 130, 25, 'OLYMPIC', 9, { isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ প্যাকেট)', factor: 24 } }),
  sku('DEMO-OLY-NUT-150', nextBc(), 'Biscuits & Bakery', 'Olympic', 'Olympic Nutty Real Peanut Biscuit', 'অলিম্পিক নাটি বিস্কুট', '150g', 'Packet', 45, 0.22, 100, 20, 'OLYMPIC', 8),
  sku('DEMO-OLY-TIP-120', nextBc(), 'Biscuits & Bakery', 'Olympic', 'Olympic Tip Salted Biscuit', 'অলিম্পিক টিপ বিস্কুট', '120g', 'Packet', 30, 0.22, 110, 20, 'OLYMPIC', 8),
  sku('DEMO-OLY-LEX-200', nextBc(), 'Biscuits & Bakery', 'Olympic', 'Olympic Lexus Vegetable Crackers', 'অলিম্পিক লেক্সাস বিস্কুট', '200g', 'Packet', 70, 0.22, 85, 15, 'OLYMPIC', 7),
  sku('DEMO-OLY-DRY-250', nextBc(), 'Biscuits & Bakery', 'Olympic', 'Olympic Dry Cake Toast', 'অলিম্পিক ড্রাই কেক', '250g', 'Packet', 95, 0.22, 65, 12, 'OLYMPIC', 6),
  sku('PR-POT-100G', nextBc(), 'Biscuits & Bakery', 'PRAN', 'PRAN Potata Spicy Biscuit', 'প্রাণ পটাটা স্পাইসি বিস্কুট', '100g', 'Packet', 30, 0.22, 130, 24, 'PRAN', 9, { isFrequent: true }),
  sku('DEMO-PR-FIT-120', nextBc(), 'Biscuits & Bakery', 'PRAN', 'PRAN Fit Cracker Biscuit', 'প্রাণ ফিট ক্র্যাকার বিস্কুট', '120g', 'Packet', 35, 0.22, 95, 18, 'PRAN', 7),
  sku('DEMO-PR-TOAST-300', nextBc(), 'Biscuits & Bakery', 'PRAN', 'PRAN Milk Toast Biscuit', 'প্রাণ মিল্ক টোস্ট বিস্কুট', '300g', 'Packet', 75, 0.22, 80, 15, 'PRAN', 7),
  sku('DEMO-PR-ALLT-BUN', nextBc(), 'Biscuits & Bakery', 'PRAN', 'All Time Milk Bread', 'অল টাইম মিল্ক ব্রেড', '300g Loaf', 'Packet', 65, 0.21, 55, 12, 'PRAN', 8),
  sku('DEMO-PR-ALLT-CAKE', nextBc(), 'Biscuits & Bakery', 'PRAN', 'All Time Family Cake', 'অল টাইম ফ্যামিলি কেক', '250g', 'Box', 120, 0.22, 48, 10, 'PRAN', 6),
  sku('DEMO-DAN-DORA-150', nextBc(), 'Biscuits & Bakery', 'Danish', 'Danish Dorio Cream Biscuit', 'ড্যানিশ ডরিও বিস্কুট', '150g', 'Packet', 45, 0.22, 75, 15, 'OLYMPIC', 6),
  sku('DEMO-DAN-LEX-180', nextBc(), 'Biscuits & Bakery', 'Danish', 'Danish Dry Cake', 'ড্যানিশ ড্রাই কেক', '200g', 'Packet', 85, 0.22, 65, 12, 'OLYMPIC', 6),
  sku('DEK-LEX-200G', nextBc(), 'Biscuits & Bakery', 'Dekko', 'Dekko Cookies Biscuit', 'ডেক্কো কুকিজ বিস্কুট', '200g', 'Packet', 65, 0.22, 70, 15, 'LOCAL', 6),
  sku('DEMO-DEK-OREO-120', nextBc(), 'Biscuits & Bakery', 'Dekko', 'Dekko Chocolate Cream Biscuit', 'ডেক্কো চকলেট ক্রিম বিস্কুট', '120g', 'Packet', 40, 0.22, 75, 15, 'LOCAL', 6),

  // =========================================================================
  // 8. Snacks & Chips (14 SKUs)
  // =========================================================================
  sku('BS-CHANA-300G', nextBc(), 'Snacks & Chips', 'Bombay Sweets', 'Bombay Sweets Chanachur', 'বোম্বে সুইটস চানাচুর', '300g', 'Packet', 85, 0.22, 85, 18, 'LOCAL', 8, { isFrequent: true }),
  sku('DEMO-BS-RING-20', nextBc(), 'Snacks & Chips', 'Bombay Sweets', 'Bombay Sweets Ring Chips', 'বোম্বে সুইটস রিং চিপস', '25g', 'Packet', 20, 0.23, 140, 25, 'LOCAL', 8),
  sku('DEMO-BS-POT-25', nextBc(), 'Snacks & Chips', 'Bombay Sweets', 'Bombay Sweets Potato Crackers', 'বোম্বে সুইটস পটেটো ক্র্যাকার্স', '25g', 'Packet', 20, 0.23, 130, 25, 'LOCAL', 8),
  sku('DEMO-RUC-CHANA-300', nextBc(), 'Snacks & Chips', 'Ruchi', 'Ruchi BBQ Chanachur', 'রুচি বারবিকিউ চানাচুর', '300g', 'Packet', 90, 0.22, 85, 18, 'SQUARE', 8, { isFrequent: true }),
  sku('DEMO-RUC-JHAL-150', nextBc(), 'Snacks & Chips', 'Ruchi', 'Ruchi Jhal Chanachur', 'রুচি ঝাল চানাচুর', '150g', 'Packet', 48, 0.22, 95, 20, 'SQUARE', 7),
  sku('DEMO-RUC-DAL-100', nextBc(), 'Snacks & Chips', 'Ruchi', 'Ruchi Fried Dal', 'রুচি ডাল ভাজা', '100g', 'Packet', 40, 0.23, 85, 15, 'SQUARE', 6),
  sku('DEMO-RUC-PEAN-100', nextBc(), 'Snacks & Chips', 'Ruchi', 'Ruchi Salted Peanuts', 'রুচি বাদাম ভাজা', '100g', 'Packet', 55, 0.23, 75, 15, 'SQUARE', 6),
  sku('PR-CHIPS-25G', nextBc(), 'Snacks & Chips', 'PRAN', 'PRAN Potato Crackers', 'প্রাণ পটেটো ক্র্যাকার্স', '25g', 'Packet', 15, 0.23, 160, 30, 'PRAN', 9, { isFrequent: true }),
  sku('DEMO-PR-CHANA-300', nextBc(), 'Snacks & Chips', 'PRAN', 'PRAN Jhal Chanachur', 'প্রাণ ঝাল চানাচুর', '300g', 'Packet', 80, 0.22, 80, 15, 'PRAN', 7),
  sku('DEMO-PR-DAL-25G', nextBc(), 'Snacks & Chips', 'PRAN', 'PRAN Fried Moong Dal', 'প্রাণ মুগ ডাল ভাজা', '25g', 'Packet', 15, 0.24, 150, 30, 'PRAN', 8),
  sku('PEP-LAYS-45G', nextBc(), 'Snacks & Chips', 'Lays', 'Lays Classic Salted', 'লেইস ক্লাসিক সল্টেড চিপস', '45g', 'Packet', 50, 0.22, 80, 15, 'PEPSI', 8, { isFrequent: true }),
  sku('DEMO-LAYS-CRM-45', nextBc(), 'Snacks & Chips', 'Lays', 'Lays American Style Cream & Onion', 'লেইস ক্রিম অ্যান্ড অনিয়ন', '45g', 'Packet', 50, 0.22, 75, 15, 'PEPSI', 7),
  sku('DEMO-LAYS-MAS-45', nextBc(), 'Snacks & Chips', 'Lays', 'Lays Spanish Tomato Tango', 'লেইস টমেটো ট্যাঙ্গো', '45g', 'Packet', 50, 0.22, 70, 15, 'PEPSI', 7),
  sku('DEMO-KUR-MAS-45', nextBc(), 'Snacks & Chips', 'PepsiCo', 'Kurkure Masala Munch', 'কুরকুরে মসলা মাঞ্চ', '45g', 'Packet', 35, 0.22, 95, 20, 'PEPSI', 7),

  // =========================================================================
  // 9. Chocolate & Candy (7 SKUs)
  // =========================================================================
  sku('DEMO-NES-KITK-38', nextBc(), 'Chocolate & Candy', 'Nestlé', 'Nestlé KitKat 4-Finger', 'নেসলে কিটক্যাট চকলেট', '38g', 'Piece', 55, 0.22, 85, 15, 'NESTLE', 7),
  sku('DEMO-NES-MUNCH', nextBc(), 'Chocolate & Candy', 'Nestlé', 'Nestlé Munch Wafer Bar', 'নেসলে মাঞ্চ চকলেট', '20g', 'Piece', 25, 0.23, 120, 25, 'NESTLE', 7),
  sku('DEMO-PR-CHOCO-JAR', nextBc(), 'Chocolate & Candy', 'PRAN', 'PRAN Choco Bean', 'প্রাণ চকো বিন', '15g', 'Packet', 15, 0.24, 150, 30, 'PRAN', 7),
  sku('DEMO-PR-MANGO-CND', nextBc(), 'Chocolate & Candy', 'PRAN', 'PRAN Mango Candy Pack', 'প্রাণ ম্যাঙ্গো ক্যান্ডি প্যাক', '200g', 'Packet', 75, 0.23, 65, 12, 'PRAN', 5),
  sku('DEMO-PR-LOLLI-24', nextBc(), 'Chocolate & Candy', 'PRAN', 'PRAN Lollipop Jar', 'প্রাণ ললিপপ', 'Piece', 'Piece', 10, 0.25, 200, 40, 'PRAN', 7),
  sku('DEMO-OLY-PULSE', nextBc(), 'Chocolate & Candy', 'Olympic', 'Olympic Pulse Candy Pack', 'অলিম্পিক পালস ক্যান্ডি', '150g', 'Packet', 60, 0.23, 70, 12, 'OLYMPIC', 5),
  sku('DEMO-DAN-CHOCO-35', nextBc(), 'Chocolate & Candy', 'Danish', 'Danish Dairy Chocolate Bar', 'ড্যানিশ ডেইরি চকলেট', '35g', 'Piece', 45, 0.23, 75, 15, 'OLYMPIC', 6),

  // =========================================================================
  // 10. Soft Drinks & Beverages (13 SKUs)
  // =========================================================================
  sku('AK-MOJO-250M', nextBc(), 'Soft Drinks & Beverages', 'Mojo', 'Mojo Cola', 'মোজো কোলা', '250ml PET', 'Bottle', 25, 0.21, 168, 36, 'AKIJ', 10, { isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ বোতল)', factor: 24 } }),
  sku('AK-MOJO-1L', nextBc(), 'Soft Drinks & Beverages', 'Mojo', 'Mojo Cola', 'মোজো কোলা', '1 Liter', 'Bottle', 70, 0.21, 72, 18, 'AKIJ', 8),
  sku('DEMO-MOJO-2L', nextBc(), 'Soft Drinks & Beverages', 'Mojo', 'Mojo Cola Family Pack', 'মোজো কোলা ২ লিটার', '2 Liter', 'Bottle', 120, 0.20, 48, 12, 'AKIJ', 7),
  sku('DEMO-AK-CLEM-500', nextBc(), 'Soft Drinks & Beverages', 'Akij', 'Clemon Lemon Drink', 'ক্লেমন লেমন ড্রিংক', '500 ml', 'Bottle', 40, 0.21, 96, 24, 'AKIJ', 7),
  sku('DEMO-AK-SPEED-250', nextBc(), 'Soft Drinks & Beverages', 'Akij', 'Speed Energy Drink', 'স্পিড এনার্জি ড্রিংক', '250 ml', 'Bottle', 35, 0.22, 120, 24, 'AKIJ', 8),
  sku('CC-COKE-125L', nextBc(), 'Soft Drinks & Beverages', 'Coca-Cola', 'Coca-Cola', 'কোকা-কোলা', '1.25 Liter', 'Bottle', 85, 0.20, 72, 16, 'COKE', 9, { isFrequent: true }),
  sku('DEMO-CC-COKE-250', nextBc(), 'Soft Drinks & Beverages', 'Coca-Cola', 'Coca-Cola', 'কোকা-কোলা', '250 ml', 'Bottle', 25, 0.21, 144, 30, 'COKE', 8),
  sku('DEMO-CC-SPR-125', nextBc(), 'Soft Drinks & Beverages', 'Coca-Cola', 'Sprite Lemon Lime', 'স্প্রাইট', '1.25 Liter', 'Bottle', 85, 0.20, 60, 12, 'COKE', 7),
  sku('DEMO-PEP-250M', nextBc(), 'Soft Drinks & Beverages', 'Pepsi', 'Pepsi Cola', 'পেপসি কোলা', '250 ml', 'Bottle', 25, 0.21, 144, 30, 'PEPSI', 8),
  sku('DEMO-PEP-125L', nextBc(), 'Soft Drinks & Beverages', 'Pepsi', 'Pepsi Cola', 'পেপসি কোলা', '1.25 Liter', 'Bottle', 85, 0.20, 60, 12, 'PEPSI', 7),
  sku('DEMO-PEP-7UP-125', nextBc(), 'Soft Drinks & Beverages', 'Pepsi', '7Up Lemon Lime', 'সেভেন-আপ', '1.25 Liter', 'Bottle', 85, 0.20, 60, 12, 'PEPSI', 7),
  sku('PR-UP-500M', nextBc(), 'Soft Drinks & Beverages', 'PRAN', 'PRAN Up', 'প্রাণ আপ', '500 ml', 'Bottle', 40, 0.21, 96, 24, 'PRAN', 7),
  sku('DEMO-PR-PWR-250', nextBc(), 'Soft Drinks & Beverages', 'PRAN', 'PRAN Power Energy Drink', 'প্রাণ পাওয়ার ড্রিংক', '250 ml', 'Bottle', 35, 0.22, 96, 20, 'PRAN', 6),

  // =========================================================================
  // 11. Juice & Packaged Drinks (9 SKUs)
  // =========================================================================
  sku('PR-FRT-250M', nextBc(), 'Juice & Packaged Drinks', 'PRAN', 'PRAN Frooto Mango', 'প্রাণ ফ্রুটো আম', '250 ml', 'Bottle', 25, 0.21, 192, 36, 'PRAN', 10, { isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ পিস)', factor: 24 } }),
  sku('PR-FRT-500M', nextBc(), 'Juice & Packaged Drinks', 'PRAN', 'PRAN Frooto Mango', 'প্রাণ ফ্রুটো আম', '500 ml', 'Bottle', 45, 0.21, 96, 20, 'PRAN', 8),
  sku('PR-FRT-1L', nextBc(), 'Juice & Packaged Drinks', 'PRAN', 'PRAN Frooto Mango', 'প্রাণ ফ্রুটো আম', '1 Liter', 'Bottle', 90, 0.21, 60, 12, 'PRAN', 7),
  sku('DEMO-PR-MANG-200', nextBc(), 'Juice & Packaged Drinks', 'PRAN', 'PRAN Mango Juice Tetra', 'প্রাণ ম্যাঙ্গো জুস প্যাক', '200 ml Pack', 'Packet', 25, 0.22, 144, 24, 'PRAN', 8),
  sku('DEMO-PR-LITCHI', nextBc(), 'Juice & Packaged Drinks', 'PRAN', 'PRAN Litchi Drink', 'প্রাণ লিচু ড্রিংক', '250 ml', 'Bottle', 25, 0.22, 120, 24, 'PRAN', 7),
  sku('AK-FRTK-250M', nextBc(), 'Juice & Packaged Drinks', 'Frutika', 'Frutika Mango Juice', 'ফ্রুটিকা ম্যাঙ্গো জুস', '250 ml', 'Bottle', 25, 0.21, 144, 24, 'AKIJ', 8, { isFrequent: true }),
  sku('DEMO-FRTK-500M', nextBc(), 'Juice & Packaged Drinks', 'Frutika', 'Frutika Mango Juice', 'ফ্রুটিকা ম্যাঙ্গো জুস', '500 ml', 'Bottle', 45, 0.21, 72, 16, 'AKIJ', 6),
  sku('DEMO-FRTK-1L', nextBc(), 'Juice & Packaged Drinks', 'Frutika', 'Frutika Mango Juice', 'ফ্রুটিকা ম্যাঙ্গো জুস', '1 Liter', 'Bottle', 90, 0.21, 48, 12, 'AKIJ', 6),
  sku('DEMO-PR-TANG-500', nextBc(), 'Juice & Packaged Drinks', 'PRAN', 'PRAN Orange Powder Drink', 'প্রাণ অরেঞ্জ ড্রিংক পাউডার', '500g Jar', 'Bottle', 260, 0.22, 32, 8, 'PRAN', 5),

  // =========================================================================
  // 12. Dairy & Milk Products (12 SKUs)
  // =========================================================================
  sku('PR-UHT-1L', nextBc(), 'Dairy & Milk Products', 'PRAN', 'PRAN UHT Liquid Milk', 'প্রাণ ইউএইচটি তরল দুধ', '1 Liter', 'Packet', 110, 0.19, 80, 18, 'PRAN', 9, { isFrequent: true }),
  sku('DEMO-PR-UHT-500', nextBc(), 'Dairy & Milk Products', 'PRAN', 'PRAN UHT Liquid Milk', 'প্রাণ ইউএইচটি তরল দুধ', '500 ml', 'Packet', 58, 0.19, 85, 18, 'PRAN', 8),
  sku('DEMO-PR-LPOW-500', nextBc(), 'Dairy & Milk Products', 'PRAN', 'PRAN Full Cream Milk Powder', 'প্রাণ গুঁড়া দুধ', '500g', 'Packet', 420, 0.19, 40, 10, 'PRAN', 7),
  sku('DEMO-FR-MILK-500', nextBc(), 'Dairy & Milk Products', 'Fresh', 'Fresh Instant Full Cream Milk', 'ফ্রেশ গুঁড়া দুধ', '500g', 'Packet', 425, 0.19, 42, 10, 'FRESH', 7),
  sku('DEMO-FR-MILK-1K', nextBc(), 'Dairy & Milk Products', 'Fresh', 'Fresh Instant Full Cream Milk', 'ফ্রেশ গুঁড়া দুধ ১ কেজি', '1 kg', 'Packet', 830, 0.18, 28, 6, 'FRESH', 6),
  sku('DEMO-NES-NIDO-400', nextBc(), 'Dairy & Milk Products', 'Nestlé', 'Nestlé Nido Fortigrow', 'নেসলে নিডো গুঁড়া দুধ', '400g', 'Packet', 495, 0.19, 32, 8, 'NESTLE', 6),
  sku('DAN-COND-397G', nextBc(), 'Dairy & Milk Products', 'Danish', 'Danish Condensed Milk', 'ড্যানিশ কনডেন্সড মিল্ক', '397g', 'Piece', 92, 0.20, 84, 18, 'OLYMPIC', 8),
  sku('DEMO-FR-COND-397', nextBc(), 'Dairy & Milk Products', 'Fresh', 'Fresh Condensed Milk', 'ফ্রেশ কনডেন্সড মিল্ক', '397g', 'Piece', 90, 0.20, 72, 15, 'FRESH', 7),
  sku('IGL-VAN-500M', nextBc(), 'Dairy & Milk Products', 'Igloo', 'Igloo Vanilla Ice Cream', 'ইগলু ভ্যানিলা আইসক্রিম', '500 ml Box', 'Box', 195, 0.22, 36, 8, 'DAIRY', 6),
  sku('DEMO-IGL-CHOC-500', nextBc(), 'Dairy & Milk Products', 'Igloo', 'Igloo Chocolate Ice Cream', 'ইগলু চকলেট আইসক্রিম', '500 ml Box', 'Box', 210, 0.22, 30, 6, 'DAIRY', 5),
  sku('DEMO-IGL-CUP-100', nextBc(), 'Dairy & Milk Products', 'Igloo', 'Igloo Kulfi / Cup Ice Cream', 'ইগলু কাপ আইসক্রিম', '100 ml Cup', 'Piece', 45, 0.23, 80, 15, 'DAIRY', 7),
  sku('DEMO-PR-BUTT-200', nextBc(), 'Dairy & Milk Products', 'PRAN', 'PRAN Salted Butter', 'প্রাণ বাটার', '200g', 'Box', 235, 0.20, 32, 8, 'PRAN', 5),

  // =========================================================================
  // 13. Eggs (3 SKUs)
  // =========================================================================
  sku('EGG-FARM-PC', nextBc(), 'Eggs', 'Local / Loose', 'Farm Brown Eggs', 'ফার্মের লাল ডিম', 'Per Piece', 'Piece', 13, 0.18, 480, 72, 'VEG', 10, { isFrequent: true, packUnit: { unitName: 'Dozen', unitNameBn: 'ডজন (১২ পিস)', factor: 12 } }),
  sku('DEMO-EGG-DUCK-PC', nextBc(), 'Eggs', 'Local / Loose', 'Deshi Duck Eggs', 'হাঁসের ডিম', 'Per Piece', 'Piece', 18, 0.19, 180, 36, 'VEG', 6, { packUnit: { unitName: 'Dozen', unitNameBn: 'ডজন (১২ পিস)', factor: 12 } }),
  sku('DEMO-EGG-DESHI', nextBc(), 'Eggs', 'Local / Loose', 'Deshi Hen Eggs', 'দেশি মুরগির ডিম', 'Per Piece', 'Piece', 19, 0.19, 120, 24, 'VEG', 5),

  // =========================================================================
  // 14. Noodles & Pasta (9 SKUs)
  // =========================================================================
  sku('NES-MAG-8PK', nextBc(), 'Noodles & Pasta', 'Maggi', 'Maggi 2-Minute Noodles', 'ম্যাগি ২-মিনিট নুডুলস', '8 Pack (496g)', 'Packet', 175, 0.20, 75, 16, 'NESTLE', 9, { isFrequent: true }),
  sku('DEMO-MAG-4PK', nextBc(), 'Noodles & Pasta', 'Maggi', 'Maggi 2-Minute Noodles', 'ম্যাগি ২-মিনিট নুডুলস', '4 Pack', 'Packet', 92, 0.20, 80, 16, 'NESTLE', 8),
  sku('DEMO-MAG-1PK', nextBc(), 'Noodles & Pasta', 'Maggi', 'Maggi Masala Single Pack', 'ম্যাগি সিঙ্গেল নুডুলস', '62g', 'Packet', 24, 0.21, 140, 24, 'NESTLE', 8),
  sku('PR-MRN-8PK', nextBc(), 'Noodles & Pasta', 'PRAN', 'Mr. Noodles Magic Masala', 'মিস্টার নুডুলস ম্যাজিক মসলা', '8 Pack', 'Packet', 165, 0.21, 80, 16, 'PRAN', 9, { isFrequent: true }),
  sku('DEMO-PR-MRN-CUP', nextBc(), 'Noodles & Pasta', 'PRAN', 'Mr. Noodles Cup Noodles', 'মিস্টার কাপ নুডুলস', '40g Cup', 'Piece', 45, 0.22, 85, 18, 'PRAN', 7),
  sku('DEMO-BSH-NOOD-8', nextBc(), 'Noodles & Pasta', 'Bashundhara', 'Bashundhara Instant Noodles', 'বসুন্ধরা ইনস্ট্যান্ট নুডুলস', '8 Pack', 'Packet', 160, 0.21, 60, 12, 'BSH', 6),
  sku('DEMO-PR-PASTA-400', nextBc(), 'Noodles & Pasta', 'PRAN', 'PRAN Penne Pasta', 'প্রাণ পাস্তা', '400g', 'Packet', 120, 0.22, 55, 10, 'PRAN', 5),
  sku('DEMO-BSH-PASTA', nextBc(), 'Noodles & Pasta', 'Bashundhara', 'Bashundhara Macaroni Pasta', 'বসুন্ধরা ম্যাকারনি পাস্তা', '400g', 'Packet', 115, 0.22, 50, 10, 'BSH', 5),
  sku('DEMO-DEK-STICK', nextBc(), 'Noodles & Pasta', 'Dekko', 'Dekko Stick Noodles', 'ডেক্কো স্টিক নুডুলস', '180g', 'Packet', 42, 0.22, 75, 15, 'LOCAL', 6),

  // =========================================================================
  // 15. Sauces & Condiments (8 SKUs)
  // =========================================================================
  sku('PR-KETCH-340G', nextBc(), 'Sauces & Condiments', 'PRAN', 'PRAN Tomato Ketchup', 'প্রাণ টমেটো কেচাপ', '340g Bottle', 'Bottle', 125, 0.22, 65, 12, 'PRAN', 7),
  sku('DEMO-PR-HOT-340', nextBc(), 'Sauces & Condiments', 'PRAN', 'PRAN Hot Tomato Sauce', 'প্রাণ হট টমেটো সস', '340g Bottle', 'Bottle', 130, 0.22, 55, 12, 'PRAN', 6),
  sku('DEMO-PR-ACHAR-400', nextBc(), 'Sauces & Condiments', 'PRAN', 'PRAN Mango Pickle (Achar)', 'প্রাণ আমের আচার', '400g Jar', 'Bottle', 155, 0.23, 45, 10, 'PRAN', 5),
  sku('DEMO-RUC-KETCH', nextBc(), 'Sauces & Condiments', 'Ruchi', 'Ruchi Tomato Ketchup', 'রুচি টমেটো কেচাপ', '330g', 'Bottle', 130, 0.22, 55, 12, 'SQUARE', 6),
  sku('DEMO-RUC-MANG-ACH', nextBc(), 'Sauces & Condiments', 'Ruchi', 'Ruchi Mango Kashmiri Achar', 'রুচি কাশ্মীরি আমের আচার', '400g', 'Bottle', 165, 0.23, 45, 10, 'SQUARE', 5),
  sku('DEMO-PR-SOY-200', nextBc(), 'Sauces & Condiments', 'PRAN', 'PRAN Soy Sauce', 'প্রাণ সয়া সস', '200 ml', 'Bottle', 75, 0.23, 50, 10, 'PRAN', 5),
  sku('DEMO-MAG-CHILI', nextBc(), 'Sauces & Condiments', 'Maggi', 'Maggi Hot & Sweet Sauce', 'ম্যাগি হট অ্যান্ড সুইট সস', '500g', 'Bottle', 195, 0.22, 38, 8, 'NESTLE', 5),
  sku('DEMO-PR-VINEGAR', nextBc(), 'Sauces & Condiments', 'PRAN', 'PRAN White Vinegar', 'প্রাণ সাদা সিরকা', '650 ml', 'Bottle', 85, 0.23, 45, 8, 'PRAN', 4),

  // =========================================================================
  // 16. Frozen & Packaged Food (5 SKUs)
  // =========================================================================
  sku('DEMO-PR-PARATA-10', nextBc(), 'Frozen & Packaged Food', 'PRAN', 'PRAN Frozen Paratha', 'প্রাণ ফ্রোজেন পরোটা', '10 Pcs Pack', 'Packet', 165, 0.21, 45, 10, 'PRAN', 6),
  sku('DEMO-PR-SING-12', nextBc(), 'Frozen & Packaged Food', 'PRAN', 'PRAN Frozen Singara', 'প্রাণ ফ্রোজেন সিঙ্গারা', '12 Pcs Pack', 'Packet', 145, 0.22, 40, 8, 'PRAN', 5),
  sku('DEMO-PR-NUG-250', nextBc(), 'Frozen & Packaged Food', 'PRAN', 'PRAN Chicken Nuggets', 'প্রাণ চিকেন নাগেটস', '250g', 'Packet', 225, 0.21, 32, 8, 'PRAN', 5),
  sku('DEMO-ACI-PARATA', nextBc(), 'Frozen & Packaged Food', 'ACI Pure', 'ACI Pure Frozen Paratha', 'এসিআই ফ্রোজেন পরোটা', '10 Pcs', 'Packet', 170, 0.21, 35, 8, 'ACI', 5),
  sku('DEMO-PR-LACCHA', nextBc(), 'Frozen & Packaged Food', 'PRAN', 'PRAN Laccha Semai', 'প্রাণ লাচ্ছা সেমাই', '200g', 'Packet', 55, 0.22, 95, 18, 'PRAN', 7),

  // =========================================================================
  // 17. Baby Food & Baby Care (7 SKUs)
  // =========================================================================
  sku('NES-CER-350G', nextBc(), 'Baby Food & Baby Care', 'Nestlé', 'Nestlé Cerelac Wheat', 'নেসলে সেরেলাক গম', '350g', 'Box', 440, 0.19, 36, 8, 'NESTLE', 6),
  sku('DEMO-NES-CER-FRT', nextBc(), 'Baby Food & Baby Care', 'Nestlé', 'Nestlé Cerelac Mixed Fruit', 'নেসলে সেরেলাক ফ্রুটস', '350g', 'Box', 460, 0.19, 32, 8, 'NESTLE', 5),
  sku('DEMO-NES-LACTO-1', nextBc(), 'Baby Food & Baby Care', 'Nestlé', 'Nestlé Lactogen 1 Formula', 'নেসলে ল্যাকটোজেন ১', '350g', 'Box', 690, 0.18, 24, 6, 'NESTLE', 5),
  sku('DEMO-MER-LOT-100', nextBc(), 'Baby Food & Baby Care', 'Meril', 'Meril Baby Lotion', 'মেরিল বেবি লোশন', '100 ml', 'Bottle', 175, 0.22, 40, 8, 'SQUARE', 5),
  sku('DEMO-MER-POW-100', nextBc(), 'Baby Food & Baby Care', 'Meril', 'Meril Baby Powder', 'মেরিল বেবি পাউডার', '100g', 'Bottle', 120, 0.22, 45, 8, 'SQUARE', 5),
  sku('DEMO-BSH-DIAP-M', nextBc(), 'Baby Food & Baby Care', 'Bashundhara', 'Bashundhara Baby Diaper (M)', 'বসুন্ধরা বেবি ডায়াপার', '24 Pcs Pack', 'Packet', 540, 0.21, 28, 6, 'BSH', 5),
  sku('DEMO-MER-SOAP-75', nextBc(), 'Baby Food & Baby Care', 'Meril', 'Meril Baby Soap', 'মেরিল বেবি সাবান', '75g', 'Piece', 65, 0.22, 60, 12, 'SQUARE', 5),

  // =========================================================================
  // 18. Soap & Personal Care (13 SKUs)
  // =========================================================================
  sku('UNI-LUX-100G', nextBc(), 'Soap & Personal Care', 'Lux', 'Lux Velvet Glow Soap', 'লাক্স ভেলভেট গ্লো সাবান', '100g', 'Piece', 65, 0.21, 130, 24, 'UNILEVER', 9, { isFrequent: true, packUnit: { unitName: 'Dozen', unitNameBn: 'ডজন (১২ পিস)', factor: 12 } }),
  sku('UNI-LUX-150G', nextBc(), 'Soap & Personal Care', 'Lux', 'Lux Velvet Glow Soap', 'লাক্স সাবান (বড়)', '150g', 'Piece', 92, 0.21, 85, 16, 'UNILEVER', 7),
  sku('UNI-LB-100G', nextBc(), 'Soap & Personal Care', 'Lifebuoy', 'Lifebuoy Total Soap', 'লাইফবয় টোটাল সাবান', '100g', 'Piece', 60, 0.21, 130, 24, 'UNILEVER', 9, { isFrequent: true }),
  sku('DEMO-LB-HW-170', nextBc(), 'Soap & Personal Care', 'Lifebuoy', 'Lifebuoy Handwash Pouch', 'লাইফবয় হ্যান্ডওয়াশ রিফিল', '170 ml', 'Packet', 95, 0.22, 65, 12, 'UNILEVER', 6),
  sku('DEMO-DOVE-100G', nextBc(), 'Soap & Personal Care', 'Dove', 'Dove Cream Beauty Bar', 'ডাভ বিউটি বার সাবান', '100g', 'Piece', 135, 0.21, 60, 12, 'UNILEVER', 6),
  sku('DEMO-SAV-SOAP-100', nextBc(), 'Soap & Personal Care', 'Savlon', 'Savlon Antiseptic Soap', 'স্যাভলন অ্যান্টিসেপটিক সাবান', '100g', 'Piece', 62, 0.21, 95, 18, 'ACI', 7),
  sku('DEMO-SAV-LIQ-112', nextBc(), 'Soap & Personal Care', 'Savlon', 'Savlon Antiseptic Liquid', 'স্যাভলন অ্যান্টিসেপটিক লিকুইড', '112 ml', 'Bottle', 105, 0.22, 55, 10, 'ACI', 6),
  sku('DEMO-SAV-HW-200', nextBc(), 'Soap & Personal Care', 'Savlon', 'Savlon Liquid Handwash', 'স্যাভলন হ্যান্ডওয়াশ', '200 ml Pump', 'Bottle', 135, 0.22, 50, 10, 'ACI', 6),
  sku('DEMO-MER-MILK-100', nextBc(), 'Soap & Personal Care', 'Meril', 'Meril Milk Soap', 'মেরিল মিল্ক সাবান', '100g', 'Piece', 60, 0.22, 90, 18, 'SQUARE', 7),
  sku('DEMO-MER-LIP-4G', nextBc(), 'Soap & Personal Care', 'Meril', 'Meril Protective Lip Gel', 'মেরিল লিপ জেল', '10g', 'Piece', 55, 0.23, 65, 12, 'SQUARE', 5),
  sku('DEMO-MER-PET-50', nextBc(), 'Soap & Personal Care', 'Meril', 'Meril Petroleum Jelly', 'মেরিল পেট্রোলিয়াম জেলি', '50 ml', 'Bottle', 75, 0.23, 60, 12, 'SQUARE', 5),
  sku('DEMO-UNI-VAS-100', nextBc(), 'Soap & Personal Care', 'Unilever', 'Vaseline Healthy Bright Lotion', 'ভ্যাসলিন বডি লোশন', '100 ml', 'Bottle', 195, 0.21, 45, 10, 'UNILEVER', 6),
  sku('DEMO-UNI-POND-50', nextBc(), 'Soap & Personal Care', 'Unilever', 'Ponds Face Wash', 'পন্ডস ফেসওয়াশ', '50g', 'Piece', 160, 0.22, 48, 10, 'UNILEVER', 6),

  // =========================================================================
  // 19. Shampoo & Hair Care (10 SKUs)
  // =========================================================================
  sku('MAR-PAR-200M', nextBc(), 'Shampoo & Hair Care', 'Parachute', 'Parachute Coconut Oil', 'প্যারাসুট নারিকেল তেল', '200 ml', 'Bottle', 170, 0.21, 75, 15, 'MARICO', 8, { isFrequent: true }),
  sku('DEMO-PAR-500M', nextBc(), 'Shampoo & Hair Care', 'Parachute', 'Parachute Coconut Oil', 'প্যারাসুট নারিকেল তেল', '500 ml', 'Bottle', 390, 0.20, 40, 8, 'MARICO', 6),
  sku('DEMO-PAR-BELI-200', nextBc(), 'Shampoo & Hair Care', 'Parachute', 'Parachute Beliphool Hair Oil', 'প্যারাসুট বেলিফুল তেল', '200 ml', 'Bottle', 155, 0.21, 60, 12, 'MARICO', 6),
  sku('UNI-SUN-180M', nextBc(), 'Shampoo & Hair Care', 'Sunsilk', 'Sunsilk Black Shine Shampoo', 'সানসিল্ক ব্ল্যাক শাইন শ্যাম্পু', '180 ml', 'Bottle', 215, 0.21, 60, 12, 'UNILEVER', 7, { isFrequent: true }),
  sku('DEMO-SUN-MINI-6M', nextBc(), 'Shampoo & Hair Care', 'Sunsilk', 'Sunsilk Mini Pack Strip', 'সানসিল্ক মিনি প্যাক', '6 ml Sachet', 'Piece', 5, 0.25, 360, 60, 'UNILEVER', 8),
  sku('DEMO-DOVE-SHM-170', nextBc(), 'Shampoo & Hair Care', 'Dove', 'Dove Intense Repair Shampoo', 'ডাভ শ্যাম্পু', '170 ml', 'Bottle', 265, 0.21, 45, 10, 'UNILEVER', 6),
  sku('DEMO-UNI-CLR-180', nextBc(), 'Shampoo & Hair Care', 'Unilever', 'Clear Anti-Dandruff Shampoo', 'ক্লিয়ার শ্যাম্পু', '180 ml', 'Bottle', 240, 0.21, 48, 10, 'UNILEVER', 6),
  sku('DEMO-UNI-TRES-190', nextBc(), 'Shampoo & Hair Care', 'Unilever', 'TRESemmé Keratin Shampoo', 'ট্রেসেমি শ্যাম্পু', '190 ml', 'Bottle', 310, 0.21, 30, 6, 'UNILEVER', 4),
  sku('DEMO-MER-REV-200', nextBc(), 'Shampoo & Hair Care', 'Meril', 'Revive Perfect Skin Hair Oil', 'স্কয়ার রিভাইভ হেয়ার অয়েল', '200 ml', 'Bottle', 150, 0.22, 42, 8, 'SQUARE', 5),
  sku('DEMO-MAR-NHR-200', nextBc(), 'Shampoo & Hair Care', 'Marico', 'Nihar Shanti Amla Oil', 'নিহার শান্তি আমলা তেল', '200 ml', 'Bottle', 160, 0.21, 50, 10, 'MARICO', 5),

  // =========================================================================
  // 20. Toothpaste & Oral Care (7 SKUs)
  // =========================================================================
  sku('UNI-PEP-140G', nextBc(), 'Toothpaste & Oral Care', 'Pepsodent', 'Pepsodent GermiCheck', 'পেপসোডেন্ট টুথপেস্ট', '140g', 'Piece', 120, 0.21, 80, 15, 'UNILEVER', 8, { isFrequent: true }),
  sku('DEMO-PEP-200G', nextBc(), 'Toothpaste & Oral Care', 'Pepsodent', 'Pepsodent GermiCheck Family', 'পেপসোডেন্ট ২০০ গ্রাম', '200g', 'Piece', 165, 0.21, 55, 10, 'UNILEVER', 6),
  sku('DEMO-UNI-CLS-145', nextBc(), 'Toothpaste & Oral Care', 'Unilever', 'Close-Up Red Hot Toothpaste', 'ক্লোজআপ টুথপেস্ট', '145g', 'Piece', 135, 0.21, 70, 14, 'UNILEVER', 7),
  sku('DEMO-SQ-MEDI-140', nextBc(), 'Toothpaste & Oral Care', 'Square', 'Mediplus DS Toothpaste', 'মেডিপ্লাস টুথপেস্ট', '140g', 'Piece', 130, 0.22, 65, 12, 'SQUARE', 6),
  sku('DEMO-SQ-WHITE-100', nextBc(), 'Toothpaste & Oral Care', 'Square', 'White Plus Toothpaste', 'হোয়াইট প্লাস টুথপেস্ট', '100g', 'Piece', 85, 0.22, 65, 12, 'SQUARE', 6),
  sku('DEMO-UNI-BRUSH', nextBc(), 'Toothpaste & Oral Care', 'Pepsodent', 'Pepsodent Soft Toothbrush', 'পেপসোডেন্ট টুথব্রাশ', 'Single', 'Piece', 45, 0.24, 90, 18, 'UNILEVER', 6),
  sku('DEMO-ACI-BRUSH', nextBc(), 'Toothpaste & Oral Care', 'ACI', 'ACI Colgate/Soft Toothbrush', 'সফট টুথব্রাশ', 'Single', 'Piece', 40, 0.24, 80, 15, 'ACI', 5),

  // =========================================================================
  // 21. Detergent & Dishwashing (11 SKUs)
  // =========================================================================
  sku('UNI-SURF-500G', nextBc(), 'Detergent & Dishwashing', 'Surf Excel', 'Surf Excel Powder', 'সার্ফ এক্সেল ডিটারজেন্ট', '500g', 'Packet', 135, 0.21, 90, 18, 'UNILEVER', 9, { isFrequent: true }),
  sku('DEMO-SURF-1KG', nextBc(), 'Detergent & Dishwashing', 'Surf Excel', 'Surf Excel Powder', 'সার্ফ এক্সেল ১ কেজি', '1 kg', 'Packet', 260, 0.20, 55, 12, 'UNILEVER', 7),
  sku('DEMO-WHL-500G', nextBc(), 'Detergent & Dishwashing', 'Wheel', 'Wheel Washing Powder', 'হুইল ওয়াশিং পাউডার', '500g', 'Packet', 78, 0.21, 110, 20, 'UNILEVER', 9, { isFrequent: true }),
  sku('DEMO-WHL-1KG', nextBc(), 'Detergent & Dishwashing', 'Wheel', 'Wheel Washing Powder', 'হুইল ওয়াশিং পাউডার ১ কেজি', '1 kg', 'Packet', 150, 0.20, 75, 15, 'UNILEVER', 8),
  sku('DEMO-WHL-BAR-130', nextBc(), 'Detergent & Dishwashing', 'Wheel', 'Wheel Laundry Bar Soap', 'হুইল কাপড় কাচার সাবান', '130g', 'Piece', 35, 0.22, 120, 24, 'UNILEVER', 8),
  sku('DEMO-UNI-RIN-500', nextBc(), 'Detergent & Dishwashing', 'Unilever', 'Rin Power White Powder', 'রিন পাওয়ার হোয়াইট', '500g', 'Packet', 105, 0.21, 80, 16, 'UNILEVER', 7),
  sku('UNI-VIM-500M', nextBc(), 'Detergent & Dishwashing', 'Vim', 'Vim Dishwash Liquid', 'ভিম লিকুইড ডিশওয়াশ', '500 ml', 'Bottle', 145, 0.21, 70, 14, 'UNILEVER', 8, { isFrequent: true }),
  sku('DEMO-VIM-BAR-300', nextBc(), 'Detergent & Dishwashing', 'Vim', 'Vim Dishwash Bar', 'ভিম ডিশওয়াশ বার', '300g', 'Piece', 45, 0.22, 110, 20, 'UNILEVER', 8),
  sku('DEMO-SQ-CHAKA-130', nextBc(), 'Detergent & Dishwashing', 'Square', 'Chaka Ball Laundry Soap', 'চাকা বল সাবান', '130g', 'Piece', 32, 0.22, 110, 20, 'SQUARE', 7),
  sku('DEMO-SQ-CHAK-500', nextBc(), 'Detergent & Dishwashing', 'Square', 'Chaka Washing Powder', 'চাকা ওয়াশিং পাউডার', '500g', 'Packet', 75, 0.22, 85, 16, 'SQUARE', 7),
  sku('DEMO-FR-DISH-500', nextBc(), 'Detergent & Dishwashing', 'Fresh', 'Fresh Dishwash Liquid', 'ফ্রেশ ডিশওয়াশ লিকুইড', '500 ml', 'Bottle', 130, 0.22, 55, 12, 'FRESH', 6),

  // =========================================================================
  // 22. Household Cleaning (6 SKUs)
  // =========================================================================
  sku('DEMO-HARP-500M', nextBc(), 'Household Cleaning', 'Local / Loose', 'Harpic Toilet Cleaner', 'হারপিক টয়লেট ক্লিনার', '500 ml', 'Bottle', 135, 0.21, 60, 12, 'LOCAL', 7),
  sku('DEMO-LYZ-500M', nextBc(), 'Household Cleaning', 'Local / Loose', 'Lizol Floor Cleaner', 'লাইজল ফ্লোর ক্লিনার', '500 ml', 'Bottle', 165, 0.22, 48, 10, 'LOCAL', 6),
  sku('DEMO-SAV-FLR-500', nextBc(), 'Household Cleaning', 'Savlon', 'Savlon Disinfectant Surface Spray', 'স্যাভলন সারফেস ক্লিনার', '500 ml', 'Bottle', 175, 0.22, 42, 8, 'ACI', 5),
  sku('DEMO-ACI-GLS-350', nextBc(), 'Household Cleaning', 'ACI', 'ACI Glass Cleaner Spray', 'এসিআই গ্লাস ক্লিনার', '350 ml', 'Bottle', 120, 0.22, 40, 8, 'ACI', 5),
  sku('DEMO-SCRUB-PK', nextBc(), 'Household Cleaning', 'Local / Loose', 'Scotch-Brite Dish Scrubber', 'ডিশ স্ক্রাবার মাজুনি', 'Single', 'Piece', 30, 0.25, 100, 20, 'PACK', 6),
  sku('DEMO-BROOM-PHUL', nextBc(), 'Household Cleaning', 'Local / Loose', 'Phul Jharu (Floor Broom)', 'ফুল ঝাড়ু', 'Single', 'Piece', 110, 0.24, 35, 8, 'PACK', 4),

  // =========================================================================
  // 23. Tissue & Paper Products (7 SKUs)
  // =========================================================================
  sku('BSH-TIS-120', nextBc(), 'Tissue & Paper Products', 'Bashundhara', 'Bashundhara Facial Tissue', 'বসুন্ধরা ফেসিয়াল টিস্যু', '120 Pulls Box', 'Box', 78, 0.22, 85, 16, 'BSH', 8, { isFrequent: true }),
  sku('DEMO-BSH-TOIL-1', nextBc(), 'Tissue & Paper Products', 'Bashundhara', 'Bashundhara Toilet Tissue', 'বসুন্ধরা টয়লেট টিস্যু', 'Single Roll', 'Piece', 32, 0.22, 140, 25, 'BSH', 8),
  sku('DEMO-BSH-NAP-100', nextBc(), 'Tissue & Paper Products', 'Bashundhara', 'Bashundhara Paper Napkin', 'বসুন্ধরা পেপার ন্যাপকিন', '100 Pcs Pack', 'Packet', 58, 0.22, 95, 18, 'BSH', 7),
  sku('DEMO-BSH-KITCH', nextBc(), 'Tissue & Paper Products', 'Bashundhara', 'Bashundhara Kitchen Towel', 'বসুন্ধরা কিচেন টাওয়েল', '2 Rolls', 'Packet', 125, 0.22, 50, 10, 'BSH', 5),
  sku('DEMO-BSH-PKT-10', nextBc(), 'Tissue & Paper Products', 'Bashundhara', 'Bashundhara Pocket Tissue', 'বসুন্ধরা পকেট টিস্যু', '10 Pulls', 'Packet', 15, 0.24, 150, 30, 'BSH', 7),
  sku('DEMO-FR-TIS-120', nextBc(), 'Tissue & Paper Products', 'Fresh', 'Fresh Facial Tissue Box', 'ফ্রেশ ফেসিয়াল টিস্যু', '120 Pulls', 'Box', 75, 0.22, 70, 14, 'FRESH', 6),
  sku('DEMO-FR-TOIL-1', nextBc(), 'Tissue & Paper Products', 'Fresh', 'Fresh Toilet Tissue Roll', 'ফ্রেশ টয়লেট টিস্যু', 'Single Roll', 'Piece', 30, 0.22, 110, 20, 'FRESH', 6),

  // =========================================================================
  // 24. Mosquito Repellent (5 SKUs)
  // =========================================================================
  sku('ACI-AERO-475M', nextBc(), 'Mosquito Repellent', 'ACI', 'ACI Aerosol Mosquito Spray', 'এসিআই অ্যারোসল স্প্রে', '475 ml', 'Bottle', 340, 0.20, 45, 10, 'ACI', 7, { isFrequent: true }),
  sku('DEMO-ACI-AERO-250', nextBc(), 'Mosquito Repellent', 'ACI', 'ACI Aerosol Spray', 'এসিআই অ্যারোসল ছোট', '250 ml', 'Bottle', 210, 0.21, 50, 10, 'ACI', 6),
  sku('DEMO-ACI-COIL-10', nextBc(), 'Mosquito Repellent', 'ACI', 'ACI Black Fighter Coil', 'এসিআই মশার কয়েল', '10 Coils Box', 'Box', 75, 0.22, 95, 20, 'ACI', 8),
  sku('DEMO-GODR-GOODK', nextBc(), 'Mosquito Repellent', 'Local / Loose', 'Good Knight Liquid Vaporizer', 'গুড নাইট রিফিল', '45 ml', 'Bottle', 110, 0.22, 55, 12, 'LOCAL', 6),
  sku('DEMO-PR-COIL-10', nextBc(), 'Mosquito Repellent', 'PRAN', 'PRAN Eagle Mosquito Coil', 'প্রাণ ঈগল মশার কয়েল', '10 Coils', 'Box', 70, 0.22, 80, 15, 'PRAN', 6),

  // =========================================================================
  // 25. Water & Bottled Drinks (6 SKUs)
  // =========================================================================
  sku('FR-WAT-500M', nextBc(), 'Water & Bottled Drinks', 'Fresh', 'Fresh Drinking Water', 'ফ্রেশ খাবার পানি', '500 ml', 'Bottle', 20, 0.24, 192, 48, 'FRESH', 9, { isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ বোতল)', factor: 24 } }),
  sku('DEMO-FR-WAT-2L', nextBc(), 'Water & Bottled Drinks', 'Fresh', 'Fresh Drinking Water', 'ফ্রেশ খাবার পানি ২ লিটার', '2 Liter', 'Bottle', 40, 0.23, 96, 24, 'FRESH', 7),
  sku('DEMO-FR-WAT-5L', nextBc(), 'Water & Bottled Drinks', 'Fresh', 'Fresh Drinking Water Jar', 'ফ্রেশ খাবার পানি ৫ লিটার', '5 Liter', 'Bottle', 85, 0.22, 48, 12, 'FRESH', 6),
  sku('DEMO-AK-SPA-500', nextBc(), 'Water & Bottled Drinks', 'Akij', 'Spa Drinking Water', 'স্পা খাবার পানি', '500 ml', 'Bottle', 20, 0.24, 144, 36, 'AKIJ', 8),
  sku('DEMO-PR-WAT-500', nextBc(), 'Water & Bottled Drinks', 'PRAN', 'PRAN Drinking Water', 'প্রাণ খাবার পানি', '500 ml', 'Bottle', 20, 0.24, 144, 36, 'PRAN', 7),
  sku('DEMO-CC-KIN-500', nextBc(), 'Water & Bottled Drinks', 'Coca-Cola', 'Kinley Drinking Water', 'কিনলে খাবার পানি', '500 ml', 'Bottle', 20, 0.24, 120, 24, 'COKE', 7),

  // =========================================================================
  // 26. Canned & Packaged Food (5 SKUs)
  // =========================================================================
  sku('DEMO-PR-HONEY-250', nextBc(), 'Canned & Packaged Food', 'PRAN', 'PRAN Sundarbans Honey', 'প্রাণ খাঁটি মধু', '250g Bottle', 'Bottle', 260, 0.22, 35, 8, 'PRAN', 5),
  sku('DEMO-PR-JAM-350', nextBc(), 'Canned & Packaged Food', 'PRAN', 'PRAN Mixed Fruit Jam', 'প্রাণ ফ্রুট জ্যাম', '350g Jar', 'Bottle', 165, 0.22, 40, 8, 'PRAN', 5),
  sku('DEMO-PR-CORN-300', nextBc(), 'Canned & Packaged Food', 'PRAN', 'PRAN Corn Flakes', 'প্রাণ কর্ন ফ্লেক্স', '300g Box', 'Box', 180, 0.22, 35, 8, 'PRAN', 5),
  sku('DEMO-NES-KOKO-330', nextBc(), 'Canned & Packaged Food', 'Nestlé', 'Nestlé Koko Krunch', 'নেসলে কোকো ক্রাঞ্চ', '330g Box', 'Box', 360, 0.21, 25, 6, 'NESTLE', 4),
  sku('DEMO-ACI-OATS-500', nextBc(), 'Canned & Packaged Food', 'ACI Pure', 'ACI Pure Rolled Oats', 'এসিআই পিওর ওটস', '500g Jar', 'Bottle', 240, 0.21, 35, 8, 'ACI', 5),

  // =========================================================================
  // 27. Stationery & Daily Essentials (6 SKUs)
  // =========================================================================
  sku('DEMO-PEN-MAT-1', nextBc(), 'Stationery & Daily Essentials', 'Local / Loose', 'Matador High School Pen', 'ম্যাটাডোর বলপেন', 'Single', 'Piece', 10, 0.25, 200, 40, 'PACK', 7),
  sku('DEMO-KHATA-120', nextBc(), 'Stationery & Daily Essentials', 'Bashundhara', 'Bashundhara Exercise Khata', 'বসুন্ধরা খাতা', '120 Pages', 'Piece', 55, 0.23, 75, 15, 'BSH', 6),
  sku('DEMO-MATCH-BOX', nextBc(), 'Stationery & Daily Essentials', 'Local / Loose', 'Safety Match Box (Dozen)', 'দেশলাই বক্স', '1 Box', 'Piece', 5, 0.30, 300, 50, 'PACK', 7),
  sku('DEMO-CANDLE-PK', nextBc(), 'Stationery & Daily Essentials', 'Local / Loose', 'White Wax Candle Pack', 'মোমবাতি প্যাক', '6 Pcs', 'Packet', 60, 0.24, 65, 15, 'PACK', 5),
  sku('DEMO-BATT-AA-2', nextBc(), 'Stationery & Daily Essentials', 'Local / Loose', 'Olympic AA Pencil Battery', 'পেন্সিল ব্যাটারি (জোড়া)', '2 Pcs', 'Packet', 45, 0.24, 80, 15, 'PACK', 5),
  sku('DEMO-TAPE-CLR', nextBc(), 'Stationery & Daily Essentials', 'Local / Loose', 'Scotch Tape Clear', 'কসটেপ', '1 Roll', 'Piece', 35, 0.25, 60, 12, 'PACK', 4),

  // =========================================================================
  // 28. Miscellaneous — Fresh Produce & Loose Kitchen Essentials (10 SKUs)
  // =========================================================================
  sku('DEMO-VEG-ONION-1K', nextBc(), 'Miscellaneous', 'Local / Loose', 'Deshi Onion (Peyaj)', 'দেশি পেঁয়াজ (খোলা)', '1 kg', 'Kg', 95, 0.20, 180, 35, 'VEG', 10, { allowDecimalQty: true, isFrequent: true }),
  sku('DEMO-VEG-POT-1K', nextBc(), 'Miscellaneous', 'Local / Loose', 'Diamond Potato (Alu)', 'ডায়মন্ড আলু (খোলা)', '1 kg', 'Kg', 52, 0.20, 220, 40, 'VEG', 10, { allowDecimalQty: true, isFrequent: true }),
  sku('DEMO-VEG-GARL-1K', nextBc(), 'Miscellaneous', 'Local / Loose', 'Deshi Garlic (Roshun)', 'দেশি রসুন (খোলা)', '1 kg', 'Kg', 210, 0.21, 70, 15, 'VEG', 8, { allowDecimalQty: true }),
  sku('DEMO-VEG-GING-1K', nextBc(), 'Miscellaneous', 'Local / Loose', 'Fresh Ginger (Ada)', 'আদা (খোলা)', '1 kg', 'Kg', 240, 0.21, 60, 12, 'VEG', 7, { allowDecimalQty: true }),
  sku('DEMO-VEG-CHIL-250', nextBc(), 'Miscellaneous', 'Local / Loose', 'Dried Red Chili (Shukna Morich)', 'শুকনা মরিচ (খোলা)', '250g', 'Packet', 110, 0.22, 65, 12, 'VEG', 6),
  sku('DEMO-ORS-SAL-10', nextBc(), 'Miscellaneous', 'Local / Loose', 'SMC Orsaline-N Pack', 'এসএমসি ওরস্যালাইন-এন', '10 Sachets', 'Packet', 60, 0.21, 90, 20, 'LOCAL', 7),
  sku('DEMO-AGAR-PK', nextBc(), 'Miscellaneous', 'Local / Loose', 'Agarbati Incense Pack', 'আগরবাতি প্যাক', '20 Sticks', 'Packet', 35, 0.25, 70, 12, 'PACK', 4),
  sku('DEMO-FOIL-ROLL', nextBc(), 'Miscellaneous', 'Local / Loose', 'Aluminum Kitchen Foil Roll', 'অ্যালুমিনিয়াম ফয়েল রোল', '10 Meter', 'Box', 145, 0.23, 35, 8, 'PACK', 4),
  sku('DEMO-ZIP-BAG', nextBc(), 'Miscellaneous', 'Local / Loose', 'Food Grade Poly Bag Bundle', 'পলিব্যাগ বান্ডিল', '50 Pcs', 'Bundle', 65, 0.25, 80, 15, 'PACK', 5),
  sku('DEMO-DETT-SML', nextBc(), 'Miscellaneous', 'Local / Loose', 'Dettol Antiseptic Liquid', 'ডেটল অ্যান্টিসেপটিক', '125 ml', 'Bottle', 120, 0.21, 50, 10, 'LOCAL', 6),
];

export interface DemoSupplierDef {
  key: string;
  code: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  openingBalance: number;
  notes: string;
}

export const DEMO_SUPPLIERS: DemoSupplierDef[] = [
  { key: 'PRAN', code: 'DSUP-0001', name: 'PRAN-RFL Mirpur Distribution House', company: 'PRAN-RFL Group', phone: '01711-401001', address: 'Section 11, Mirpur, Dhaka', openingBalance: 35000, notes: 'Weekly PRAN beverage, snacks, dairy & spice deliveries' },
  { key: 'FRESH', code: 'DSUP-0002', name: 'Meghna Fresh Agency (Moulvibazar)', company: 'Meghna Group of Industries', phone: '01819-401002', address: 'Moulvibazar Wholesale Market, Old Dhaka', openingBalance: 48000, notes: 'Soybean oil, atta, sugar, tea, milk powder & water' },
  { key: 'UNILEVER', code: 'DSUP-0003', name: 'Unilever Dhaka North Town Depot', company: 'Unilever Bangladesh Ltd.', phone: '01911-401003', address: 'Kazipara Commercial Zone, Dhaka', openingBalance: 32000, notes: 'Lux, Lifebuoy, Surf Excel, Wheel, Vim, Sunsilk, Dove, Pepsodent' },
  { key: 'ACI', code: 'DSUP-0004', name: 'ACI Consumer Brands Depot', company: 'ACI Limited', phone: '01712-401004', address: 'Tejgaon Industrial Area, Dhaka', openingBalance: 22000, notes: 'ACI Pure Salt, Atta, Savlon, Aerosol, Mosquito Coils' },
  { key: 'NESTLE', code: 'DSUP-0005', name: 'Nestlé Authorised Distributor', company: 'Nestlé Bangladesh PLC', phone: '01715-401005', address: 'Mohakhali Commercial Area, Dhaka', openingBalance: 26000, notes: 'Maggi, Nescafé, Cerelac, Nido, KitKat' },
  { key: 'SQUARE', code: 'DSUP-0006', name: 'Square Consumer & Food Agency', company: 'Square Food & Toiletries', phone: '01713-401006', address: 'Panthapath / Karwan Bazar, Dhaka', openingBalance: 24000, notes: 'Radhuni spices, Ruchi snacks, Meril toiletries, Chaka soap' },
  { key: 'TEER', code: 'DSUP-0007', name: 'City Group Teer Wholesale Point', company: 'City Group', phone: '01817-401007', address: 'Chawkbazar, Old Dhaka', openingBalance: 30000, notes: 'Teer Soybean Oil, Mustard Oil, Atta, Sugar, Suji' },
  { key: 'AKIJ', code: 'DSUP-0008', name: 'Akij Beverage & Food Distributor', company: 'Akij Food & Beverage Ltd.', phone: '01716-401008', address: 'Gabtoli Distribution Hub, Dhaka', openingBalance: 18000, notes: 'Mojo, Frutika, Clemon, Speed, Spa Water' },
  { key: 'COKE', code: 'DSUP-0009', name: 'Dhaka Beverage Distributors (IBPL)', company: 'Coca-Cola Bangladesh', phone: '01912-401009', address: 'Bhaluka / Uttara Beverage Depot', openingBalance: 15000, notes: 'Coca-Cola, Sprite, Kinley Water' },
  { key: 'PEPSI', code: 'DSUP-0010', name: 'Transcom Beverages & Frito-Lay Depot', company: 'Transcom / PepsiCo', phone: '01718-401010', address: 'Tongi Industrial Estate, Gazipur', openingBalance: 16000, notes: 'Pepsi, 7Up, Lays, Kurkure' },
  { key: 'BSH', code: 'DSUP-0011', name: 'Bashundhara Paper & Food Agency', company: 'Bashundhara Group', phone: '01719-401011', address: 'Badda Link Road, Dhaka', openingBalance: 19000, notes: 'Bashundhara Tissue, Diaper, Atta, Oil, Noodles, Khata' },
  { key: 'OLYMPIC', code: 'DSUP-0012', name: 'Olympic & Danish Biscuit Wholesaler', company: 'Olympic / Partex Distributors', phone: '01815-401012', address: 'Kaptan Bazar, Dhaka', openingBalance: 14000, notes: 'Olympic Energy Plus, Nutty, Lexus, Danish Condensed Milk' },
  { key: 'MARICO', code: 'DSUP-0013', name: 'Marico Hair Care Agency', company: 'Marico Bangladesh Ltd.', phone: '01720-401013', address: 'Mirpur 12 Commercial Plot, Dhaka', openingBalance: 11000, notes: 'Parachute Coconut Oil, Beliphool, Nihar' },
  { key: 'RICE', code: 'DSUP-0014', name: 'Babubazar Bismillah Rice Arat', company: 'Babubazar Rice Wholesalers', phone: '01711-401014', address: 'Babubazar Rice Market, Old Dhaka', openingBalance: 55000, notes: 'Miniket, Nazirshail, BR-28, Kataribhog rice sacks' },
  { key: 'DAL', code: 'DSUP-0015', name: 'Moulvibazar Dal & Grain Traders', company: 'Al-Madina Grain Arat', phone: '01811-401015', address: 'Moulvibazar, Old Dhaka', openingBalance: 28000, notes: 'Mosur dal, mug dal, chola, chira, beson wholesale' },
  { key: 'VEG', code: 'DSUP-0016', name: 'Karwan Bazar Onion, Potato & Egg Arat', company: 'Karwan Bazar Agro Suppliers', phone: '01714-401016', address: 'Karwan Bazar Wholesale Yard, Dhaka', openingBalance: 18000, notes: 'Daily onion, potato, garlic, ginger & farm eggs' },
  { key: 'OIL', code: 'DSUP-0017', name: 'Chawkbazar Loose Oil & Spice Traders', company: 'Rahman Spice & Oil House', phone: '01914-401017', address: 'Begum Bazar, Old Dhaka', openingBalance: 15000, notes: 'Loose soybean oil, whole cumin, cardamom, cinnamon' },
  { key: 'DAIRY', code: 'DSUP-0018', name: 'Igloo Cold Chain & Local FMCG Supply', company: 'Abdul Monem / Local Trade', phone: '01611-401018', address: 'Tejgaon Cold Storage, Dhaka', openingBalance: 9000, notes: 'Igloo ice cream freezer stock' },
  { key: 'LOCAL', code: 'DSUP-0019', name: 'Dhaka General FMCG & Grocery Wholesale', company: 'Hazi Trading Corporation', phone: '01722-401019', address: 'Moulvibazar Lane 4, Old Dhaka', openingBalance: 21000, notes: 'Bombay Sweets, Dekko, Ispahani, Harpic, Lizol, Dettol, SMC' },
  { key: 'PACK', code: 'DSUP-0020', name: 'Chawkbazar Packaging & Stationery Mart', company: 'Bengal Poly & Paper Supply', phone: '01822-401020', address: 'Chawkbazar, Old Dhaka', openingBalance: 6000, notes: 'Polybags, pens, candles, matches, brooms, scrubbers' },
];

export interface DemoExpenseCategoryDef {
  name: string;
  nameBn: string;
  group: 'FIXED' | 'VARIABLE' | 'OTHER';
}

export const DEMO_EXPENSE_CATEGORIES: DemoExpenseCategoryDef[] = [
  // Fixed Expenses
  { name: 'Shop Rent', nameBn: 'দোকান ভাড়া', group: 'FIXED' },
  { name: 'Employee Salary', nameBn: 'কর্মচারীর বেতন', group: 'FIXED' },
  { name: 'Electricity Bill', nameBn: 'বিদ্যুৎ বিল', group: 'FIXED' },
  { name: 'Internet & Mobile', nameBn: 'ইন্টারনেট ও মোবাইল', group: 'FIXED' },
  { name: 'Security & Guard Fee', nameBn: 'নিরাপত্তা ও গার্ড বিল', group: 'FIXED' },
  { name: 'Software Subscription', nameBn: 'সফটওয়্যার সাবস্ক্রিপশন', group: 'FIXED' },
  // Variable Expenses
  { name: 'Transportation', nameBn: 'পরিবহন খরচ', group: 'VARIABLE' },
  { name: 'Loading / Unloading', nameBn: 'লোডিং ও আনলোডিং', group: 'VARIABLE' },
  { name: 'Packaging & Polybags', nameBn: 'প্যাকেজিং ও পলিব্যাগ', group: 'VARIABLE' },
  { name: 'Shop Cleaning & Hygiene', nameBn: 'দোকান পরিষ্কার খরচ', group: 'VARIABLE' },
  { name: 'Tea & Refreshments', nameBn: 'চা ও আপ্যায়ন', group: 'VARIABLE' },
  { name: 'Local Delivery Cost', nameBn: 'ডেলিভারি খরচ', group: 'VARIABLE' },
  { name: 'Maintenance & Repair', nameBn: 'মেরামত ও রক্ষণাবেক্ষণ', group: 'VARIABLE' },
  { name: 'Product Handling & Ice', nameBn: 'পণ্য সংরক্ষণ ও হ্যান্ডলিং', group: 'VARIABLE' },
  { name: 'Generator & Fuel', nameBn: 'জেনারেটর ও জ্বালানি', group: 'VARIABLE' },
  { name: 'Water & Utility Bill', nameBn: 'পানির বিল', group: 'VARIABLE' },
  // Other Business Expenses
  { name: 'Marketing & Promotion', nameBn: 'প্রচার ও মার্কেটিং', group: 'OTHER' },
  { name: 'Printing & Stationery', nameBn: 'প্রিন্টিং ও স্টেশনারি', group: 'OTHER' },
  { name: 'Bank Charges', nameBn: 'ব্যাংক চার্জ', group: 'OTHER' },
  { name: 'bKash / Nagad Charges', nameBn: 'বিকাশ / নগদ চার্জ', group: 'OTHER' },
  { name: 'Equipment Repair', nameBn: 'যন্ত্রপাতি মেরামত', group: 'OTHER' },
  { name: 'Other Expenses', nameBn: 'অন্যান্য খরচ', group: 'OTHER' },
];

export interface DemoCustomerDef {
  code: string;
  name: string;
  phone: string;
  altPhone: string;
  village: string;
  area: string;
  road: string;
  house: string;
  customerType: 'REGULAR' | 'VIP' | 'WHOLESALE' | 'OCCASIONAL';
  creditLimit: number;
  openingBalance: number;
  // Behavioral persona
  creditPropensity: number; // 0 = cash-only, 1 = mostly credit
  paymentDiscipline: 'PROMPT' | 'NORMAL' | 'SLOW' | 'OVERDUE';
  orderSizeMultiplier: number;
  notes: string;
}

const FIRST_NAMES_MALE = [
  'Md. Rafiqul', 'Md. Kamrul', 'Abdul', 'Md. Jahangir', 'Md. Habibur', 'Tariqul', 'Saiful', 'Nazrul',
  'Mizanur', 'Shahidul', 'Mahmudul', 'Ashraful', 'Anwar', 'Delwar', 'Firoz', 'Golam',
  'Imran', 'Jasim', 'Khaled', 'Lutfur', 'Masud', 'Nurul', 'Omar', 'Parvez',
  'Quamrul', 'Rezaul', 'Shafiqul', 'Tofazzal', 'Wahidul', 'Zahirul', 'Ariful', 'Babul',
  'Didarul', 'Ehsanul', 'Farhad', 'Gias', 'Helal', 'Ibrahim', 'Jamal', 'Kawsar',
  'Mamun', 'Nizam', 'Obaidul', 'Pannu', 'Rashed', 'Sajjad', 'Tanvir', 'Uzzal',
];

const LAST_NAMES_MALE = [
  'Islam', 'Hossain', 'Rahman', 'Ahmed', 'Uddin', 'Mia', 'Chowdhury', 'Sarkar',
  'Khan', 'Bhuiyan', 'Talukder', 'Molla', 'Sheikh', 'Biswas', 'Howlader', 'Siddiqui',
  'Patwary', 'Majumder', 'Kazi', 'Akanda', 'Fakir', 'Gazi', 'Matubbar', 'Sikder',
];

const FEMALE_NAMES = [
  'Nasima Akter', 'Fatema Begum', 'Rehana Parvin', 'Salma Khatun', 'Taslima Sultana',
  'Shamima Nasrin', 'Farhana Yasmin', 'Nusrat Jahan', 'Roksana Begum', 'Sharmin Akter',
  'Hasina Banu', 'Monira Islam', 'Sabina Yasmin', 'Kulsum Begum', 'Jannatul Ferdous',
  'Sadia Afrin', 'Tahmina Rahman', 'Meherun Nesa', 'Lubna Chowdhury', 'Morsheda Begum',
  'Rumana Haque', 'Afsana Mimi', 'Bilkis Begum', 'Dilara Parveen',
];

const WHOLESALE_SHOPS = [
  'Bismillah Tea Stall (Rahim Mia)', 'Al-Amin Hotel & Restaurant', 'Mayer Doa Catering Service',
  'Madina Mess & Hostel', 'Dhaka Biriyani House', 'Shahjalal Tea & Snacks Corner',
  'New Star Bakery & Cafe', 'Brothers Mess (Section 10)', 'Green View Girls Hostel',
  'Mirpur Office Canteen', 'Noorjahan Mini Mart', 'Kazi Enterprise Pantry',
  'Sadia Fast Food & Juice Bar', 'Janata Hotel & Sweets', 'Al-Baraka Departmental Mess',
];

const DHAKA_AREAS = [
  { village: 'Mirpur', area: 'Section 10, Block C', road: 'Road 4' },
  { village: 'Mirpur', area: 'Section 11, Avenue 5', road: 'Lane 7' },
  { village: 'Mirpur', area: 'Section 12, Pallabi', road: 'Road 9' },
  { village: 'Mirpur', area: 'Kazipara', road: 'Begum Rokeya Sarani' },
  { village: 'Mirpur', area: 'Shewrapara', road: 'East Shewrapara' },
  { village: 'Mirpur', area: 'Section 6, Block B', road: 'Road 2' },
  { village: 'Mirpur', area: 'Section 2, Rupnagar', road: 'Road 11' },
  { village: 'Mirpur', area: 'Monipur Bazar', road: 'Main Road' },
  { village: 'Mirpur', area: 'Pirerbagh', road: '60 Feet Road' },
  { village: 'Mirpur', area: 'Kallyanpur', road: 'Road 3' },
  { village: 'Mohammadpur', area: 'Tajmahal Road', road: 'Block C' },
  { village: 'Uttara', area: 'Sector 7', road: 'Road 14' },
];

export function buildDemoCustomers(): DemoCustomerDef[] {
  const list: DemoCustomerDef[] = [];
  const prefixes = ['017', '018', '019', '016', '015'];

  // 15 WHOLESALE customers (high volume, high credit limit, multi-installment)
  for (let i = 0; i < 15; i++) {
    const loc = DHAKA_AREAS[i % DHAKA_AREAS.length];
    const discipline: DemoCustomerDef['paymentDiscipline'] =
      i < 5 ? 'PROMPT' : i < 11 ? 'NORMAL' : i < 13 ? 'SLOW' : 'OVERDUE';
    list.push({
      code: `DCUST-${String(i + 1).padStart(4, '0')}`,
      name: WHOLESALE_SHOPS[i],
      phone: `${prefixes[i % prefixes.length]}91${String(100100 + i * 37).slice(0, 6)}`,
      altPhone: i % 2 === 0 ? `${prefixes[(i + 2) % prefixes.length]}92${String(200100 + i * 29).slice(0, 6)}` : '',
      village: loc.village,
      area: loc.area,
      road: loc.road,
      house: `Shop ${i + 3}`,
      customerType: 'WHOLESALE',
      creditLimit: 85000 + (i % 4) * 25000,
      openingBalance: i < 10 ? (i + 1) * 2500 : 0,
      creditPropensity: 0.85,
      paymentDiscipline: discipline,
      orderSizeMultiplier: 2.3,
      notes: 'Regular wholesale/hotel bulk grocery account',
    });
  }

  // 22 VIP household & office customers (strong monthly spend, reliable credit)
  for (let i = 0; i < 22; i++) {
    const idx = 15 + i;
    const loc = DHAKA_AREAS[idx % DHAKA_AREAS.length];
    const name =
      i % 3 === 0
        ? FEMALE_NAMES[i % FEMALE_NAMES.length]
        : `${FIRST_NAMES_MALE[i % FIRST_NAMES_MALE.length]} ${LAST_NAMES_MALE[(i * 3) % LAST_NAMES_MALE.length]}`;
    const discipline: DemoCustomerDef['paymentDiscipline'] =
      i < 10 ? 'PROMPT' : i < 18 ? 'NORMAL' : i < 20 ? 'SLOW' : 'OVERDUE';
    list.push({
      code: `DCUST-${String(idx + 1).padStart(4, '0')}`,
      name,
      phone: `${prefixes[idx % prefixes.length]}81${String(300100 + idx * 41).slice(0, 6)}`,
      altPhone: i % 3 === 0 ? `${prefixes[(idx + 1) % prefixes.length]}82${String(400100 + idx * 19).slice(0, 6)}` : '',
      village: loc.village,
      area: loc.area,
      road: loc.road,
      house: `House ${12 + i}, Flat ${(i % 5) + 1}B`,
      customerType: 'VIP',
      creditLimit: 45000 + (i % 3) * 15000,
      openingBalance: i < 12 ? (i % 4 + 1) * 1200 : 0,
      creditPropensity: i < 3 ? 0.0 : 0.78, // 3 VIPs are cash-only
      paymentDiscipline: discipline,
      orderSizeMultiplier: 1.55,
      notes: i < 3 ? 'VIP cash-only monthly family grocery buyer' : 'VIP monthly salary-cycle family khata customer',
    });
  }

  // 48 REGULAR neighborhood family customers (mix of cash-only, partial credit, regular monthly)
  for (let i = 0; i < 48; i++) {
    const idx = 37 + i;
    const loc = DHAKA_AREAS[idx % DHAKA_AREAS.length];
    const name =
      i % 4 === 0
        ? FEMALE_NAMES[(i + 7) % FEMALE_NAMES.length]
        : `${FIRST_NAMES_MALE[(i + 11) % FIRST_NAMES_MALE.length]} ${LAST_NAMES_MALE[(i + 5) % LAST_NAMES_MALE.length]}`;
    const cashOnly = i < 10;
    const discipline: DemoCustomerDef['paymentDiscipline'] =
      i % 7 === 0 ? 'OVERDUE' : i % 5 === 0 ? 'SLOW' : i % 2 === 0 ? 'PROMPT' : 'NORMAL';
    list.push({
      code: `DCUST-${String(idx + 1).padStart(4, '0')}`,
      name,
      phone: `${prefixes[idx % prefixes.length]}71${String(500100 + idx * 53).slice(0, 6)}`,
      altPhone: '',
      village: loc.village,
      area: loc.area,
      road: loc.road,
      house: `House ${20 + i}`,
      customerType: 'REGULAR',
      creditLimit: cashOnly ? 5000 : 20000 + (i % 4) * 5000,
      openingBalance: !cashOnly && i < 24 ? (i % 5 + 1) * 500 : 0,
      creditPropensity: cashOnly ? 0.0 : 0.72,
      paymentDiscipline: discipline,
      orderSizeMultiplier: 1.0,
      notes: cashOnly ? 'Regular neighborhood cash shopper' : 'Regular neighborhood family credit khata',
    });
  }

  // 25 OCCASIONAL customers (walk-in regulars, mostly cash or small occasional due)
  for (let i = 0; i < 25; i++) {
    const idx = 85 + i;
    const loc = DHAKA_AREAS[idx % DHAKA_AREAS.length];
    const name =
      i % 3 === 0
        ? FEMALE_NAMES[(i + 13) % FEMALE_NAMES.length]
        : `${FIRST_NAMES_MALE[(i + 23) % FIRST_NAMES_MALE.length]} ${LAST_NAMES_MALE[(i + 9) % LAST_NAMES_MALE.length]}`;
    const cashOnly = i < 15;
    list.push({
      code: `DCUST-${String(idx + 1).padStart(4, '0')}`,
      name,
      phone: `${prefixes[idx % prefixes.length]}61${String(700100 + idx * 67).slice(0, 6)}`,
      altPhone: '',
      village: loc.village,
      area: loc.area,
      road: loc.road,
      house: `Holding ${40 + i}`,
      customerType: 'OCCASIONAL',
      creditLimit: cashOnly ? 3000 : 8000,
      openingBalance: 0,
      creditPropensity: cashOnly ? 0.0 : 0.45,
      paymentDiscipline: i % 4 === 0 ? 'SLOW' : 'PROMPT',
      orderSizeMultiplier: 0.72,
      notes: 'Occasional neighborhood shopper',
    });
  }

  return list;
}
