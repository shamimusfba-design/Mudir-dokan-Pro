import { getManifestImageForSku } from './catalog-manifest.ts';
import type { CachedProduct, CachedCategory, CachedBrand, CachedCustomer } from './offline-db.ts';

export const CLIENT_BD_CATEGORIES = [
  { name: 'Rice, Dal & Grains', nameBn: 'চাল, ডাল ও শস্য', iconName: 'wheat', accentColor: 'amber' },
  { name: 'Flour, Atta, Maida & Suji', nameBn: 'আটা, ময়দা ও সুজি', iconName: 'wheat', accentColor: 'orange' },
  { name: 'Cooking Oil & Ghee', nameBn: 'ভোজ্য তেল ও ঘি', iconName: 'droplet', accentColor: 'amber' },
  { name: 'Salt & Sugar', nameBn: 'লবণ ও চিনি', iconName: 'sparkles', accentColor: 'cyan' },
  { name: 'Spices & Masala', nameBn: 'মসলা ও গুঁড়া মসলা', iconName: 'flame', accentColor: 'rose' },
  { name: 'Tea & Coffee', nameBn: 'চা ও কফি', iconName: 'coffee', accentColor: 'orange' },
  { name: 'Biscuits & Bakery', nameBn: 'বিস্কুট ও বেকারি', iconName: 'cookie', accentColor: 'amber' },
  { name: 'Snacks & Chips', nameBn: 'স্ন্যাকস ও চিপস', iconName: 'popcorn', accentColor: 'orange' },
  { name: 'Chocolate & Candy', nameBn: 'চকলেট ও ক্যান্ডি', iconName: 'candy', accentColor: 'pink' },
  { name: 'Soft Drinks & Beverages', nameBn: 'কোমল পানীয়', iconName: 'cup-soda', accentColor: 'indigo' },
  { name: 'Juice & Packaged Drinks', nameBn: 'জুস ও প্যাকেট পানীয়', iconName: 'citrus', accentColor: 'orange' },
  { name: 'Dairy & Milk Products', nameBn: 'দুধ ও দুগ্ধজাত পণ্য', iconName: 'milk', accentColor: 'cyan' },
  { name: 'Eggs', nameBn: 'ডিম', iconName: 'egg', accentColor: 'amber' },
  { name: 'Noodles & Pasta', nameBn: 'নুডুলস ও পাস্তা', iconName: 'utensils', accentColor: 'rose' },
  { name: 'Sauces & Condiments', nameBn: 'সস ও আচার', iconName: 'soup', accentColor: 'rose' },
  { name: 'Frozen & Packaged Food', nameBn: 'ফ্রোজেন ও প্যাকেট খাবার', iconName: 'snowflake', accentColor: 'cyan' },
  { name: 'Baby Food & Baby Care', nameBn: 'শিশু খাদ্য ও যত্ন', iconName: 'baby', accentColor: 'pink' },
  { name: 'Soap & Personal Care', nameBn: 'সাবান ও ব্যক্তিগত যত্ন', iconName: 'heart', accentColor: 'purple' },
  { name: 'Shampoo & Hair Care', nameBn: 'শ্যাম্পু ও চুলের যত্ন', iconName: 'sparkles', accentColor: 'purple' },
  { name: 'Toothpaste & Oral Care', nameBn: 'টুথপেস্ট ও মুখের যত্ন', iconName: 'smile', accentColor: 'cyan' },
  { name: 'Detergent & Dishwashing', nameBn: 'ডিটারজেন্ট ও ডিশওয়াশ', iconName: 'spray-can', accentColor: 'indigo' },
  { name: 'Household Cleaning', nameBn: 'গৃহস্থালি পরিষ্কারক', iconName: 'shield', accentColor: 'teal' },
  { name: 'Tissue & Paper Products', nameBn: 'টিস্যু ও পেপার পণ্য', iconName: 'layers', accentColor: 'emerald' },
  { name: 'Mosquito Repellent', nameBn: 'মশা তাড়ানোর পণ্য', iconName: 'zap', accentColor: 'rose' },
  { name: 'Water & Bottled Drinks', nameBn: 'বোতলজাত পানি', iconName: 'droplets', accentColor: 'cyan' },
  { name: 'Canned & Packaged Food', nameBn: 'টিনজাত ও প্যাকেট খাবার', iconName: 'package', accentColor: 'indigo' },
  { name: 'Stationery & Daily Essentials', nameBn: 'স্টেশনারি ও নিত্যপ্রয়োজনীয়', iconName: 'pen-tool', accentColor: 'purple' },
  { name: 'Miscellaneous', nameBn: 'অন্যান্য', iconName: 'shopping-bag', accentColor: 'emerald' },
];

export const CLIENT_BD_BRANDS = [
  { name: 'PRAN', nameBn: 'প্রাণ', company: 'PRAN-RFL Group', logoUrl: '/catalog/brands/pran.jpg', logoSource: 'Official PRAN Brand Mark', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Fresh', nameBn: 'ফ্রেশ', company: 'Meghna Group', logoUrl: '/catalog/brands/fresh.svg', logoSource: 'Official Meghna Group Logo', logoStatus: 'VERIFIED', brandColor: '#059669' },
  { name: 'ACI', nameBn: 'এসিআই', company: 'ACI Limited', logoUrl: '/catalog/brands/aci.svg', logoSource: 'Official ACI Limited Logo', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Square', nameBn: 'স্কয়ার', company: 'Square Group', logoUrl: '/catalog/brands/square.svg', logoSource: 'Official Square Group Seal', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'Bashundhara', nameBn: 'বসুন্ধরা', company: 'Bashundhara Group', logoUrl: '/catalog/brands/bashundhara.svg', logoSource: 'Official Bashundhara Logo', logoStatus: 'VERIFIED', brandColor: '#047857' },
  { name: 'Akij', nameBn: 'আকিজ', company: 'Akij Group', logoUrl: '/catalog/brands/akij.svg', logoSource: 'Official Akij Group Logo', logoStatus: 'VERIFIED', brandColor: '#0284C7' },
  { name: 'Teer', nameBn: 'তীর', company: 'City Group', logoUrl: '/catalog/brands/teer.png', logoSource: 'Official City Group Logo', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Unilever', nameBn: 'ইউনিলিভার', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/unilever.svg', logoSource: 'Official Unilever Logo', logoStatus: 'VERIFIED', brandColor: '#1E40AF' },
  { name: 'Marico', nameBn: 'ম্যারিকো', company: 'Marico Bangladesh', logoUrl: '/catalog/brands/marico.svg', logoSource: 'Official Marico Logo', logoStatus: 'VERIFIED', brandColor: '#0369A1' },
  { name: 'Nestlé', nameBn: 'নেসলে', company: 'Nestlé Bangladesh', logoUrl: '/catalog/brands/nestle.svg', logoSource: 'Official Nestlé Logo', logoStatus: 'VERIFIED', brandColor: '#475569' },
  { name: 'Coca-Cola', nameBn: 'কোকা-কোলা', company: 'Coca-Cola Bangladesh', logoUrl: '/catalog/brands/coca-cola.svg', logoSource: 'Official Coca-Cola Logo', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'PepsiCo', nameBn: 'পেপসিকো', company: 'Transcom Beverages', logoUrl: '/catalog/brands/pepsi.svg', logoSource: 'Official Pepsi Logo', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'Maggi', nameBn: 'ম্যাগি', company: 'Nestlé Bangladesh', logoUrl: '/catalog/brands/maggi.svg', logoSource: 'Official Maggi Logo', logoStatus: 'VERIFIED', brandColor: '#EAB308' },
  { name: 'Lux', nameBn: 'লাক্স', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/lux.png', logoSource: 'Official Lux Logo', logoStatus: 'VERIFIED', brandColor: '#DB2777' },
  { name: 'Lifebuoy', nameBn: 'লাইফবয়', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/lifebuoy.png', logoSource: 'Official Lifebuoy Logo', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Sunsilk', nameBn: 'সানসিল্ক', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/sunsilk.png', logoSource: 'Official Sunsilk Logo', logoStatus: 'VERIFIED', brandColor: '#EC4899' },
  { name: 'Dove', nameBn: 'ডাভ', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/dove.png', logoSource: 'Official Dove Logo', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Pepsodent', nameBn: 'পেপসোডেন্ট', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/pepsodent.svg', logoSource: 'Official Pepsodent Logo', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'Lays', nameBn: 'লেইস', company: 'PepsiCo Bangladesh', logoUrl: '/catalog/brands/lays.svg', logoSource: 'Official Lay\'s Logo', logoStatus: 'VERIFIED', brandColor: '#EAB308' },
  { name: 'Olympic', nameBn: 'অলিম্পিক', company: 'Olympic Industries', logoUrl: '/catalog/brands/olympic.svg', logoSource: 'Official Olympic Brand Logo', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Danish', nameBn: 'ড্যানিশ', company: 'Partex Star Group', logoUrl: '/catalog/brands/danish.svg', logoSource: 'Official Danish Brand Logo', logoStatus: 'VERIFIED', brandColor: '#0284C7' },
  { name: 'Igloo', nameBn: 'ইগলু', company: 'Abdul Monem Limited', logoUrl: '/catalog/brands/igloo.svg', logoSource: 'Official Igloo Brand Logo', logoStatus: 'VERIFIED', brandColor: '#0891B2' },
  { name: 'Bombay Sweets', nameBn: 'বোম্বে সুইটস', company: 'Bombay Sweets & Co.', logoUrl: '/catalog/brands/bombay-sweets.svg', logoSource: 'Official Bombay Sweets Logo', logoStatus: 'VERIFIED', brandColor: '#D97706' },
  { name: 'Dekko', nameBn: 'ডেক্কো', company: 'Dekko Foods', logoUrl: '/catalog/brands/dekko.svg', logoSource: 'Official Dekko Brand Logo', logoStatus: 'VERIFIED', brandColor: '#7C3AED' },
  { name: 'Radhuni', nameBn: 'রাঁধুনী', company: 'Square Food & Beverage', logoUrl: '/catalog/brands/radhuni.svg', logoSource: 'Official Radhuni Brand Mark', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Ruchi', nameBn: 'রুচি', company: 'Square Food & Beverage', logoUrl: '/catalog/brands/ruchi.svg', logoSource: 'Official Ruchi Brand Logo', logoStatus: 'VERIFIED', brandColor: '#B91C1C' },
  { name: 'Savlon', nameBn: 'স্যাভলন', company: 'ACI Consumer Brands', logoUrl: '/catalog/brands/savlon.svg', logoSource: 'Official Savlon Brand Logo', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Meril', nameBn: 'মেরিল', company: 'Square Toiletries Ltd.', logoUrl: '/catalog/brands/meril.svg', logoSource: 'Official Meril Brand Logo', logoStatus: 'VERIFIED', brandColor: '#DB2777' },
  { name: 'Mojo', nameBn: 'মোজো', company: 'Akij Food & Beverage', logoUrl: '/catalog/brands/mojo.svg', logoSource: 'Official Mojo Brand Logo', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Frutika', nameBn: 'ফ্রুটিকা', company: 'Akij Food & Beverage', logoUrl: '/catalog/brands/frutika.svg', logoSource: 'Official Frutika Brand Logo', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Wheel', nameBn: 'হুইল', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/wheel.svg', logoSource: 'Official Wheel Brand Logo', logoStatus: 'VERIFIED', brandColor: '#16A34A' },
  { name: 'Surf Excel', nameBn: 'সার্ফ এক্সেল', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/surf-excel.svg', logoSource: 'Official Surf Excel Brand Logo', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Vim', nameBn: 'ভিম', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/vim.svg', logoSource: 'Official Vim Brand Logo', logoStatus: 'VERIFIED', brandColor: '#CA8A04' },
  { name: 'Parachute', nameBn: 'প্যারাসুট', company: 'Marico Bangladesh', logoUrl: '/catalog/brands/parachute.svg', logoSource: 'Official Parachute Brand Logo', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'ACI Pure', nameBn: 'এসিআই পিওর', company: 'ACI Consumer Brands', logoUrl: '/catalog/brands/aci-pure.svg', logoSource: 'Official ACI Pure Brand Logo', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Local / Loose', nameBn: 'স্থানীয় / খোলা', company: 'Local Wholesale', logoUrl: '/catalog/brands/local.svg', logoSource: 'Local Wholesale Commodities', logoStatus: 'VERIFIED', brandColor: '#059669' },
];

export function getClientDemoCatalog(): {
  categories: CachedCategory[];
  brands: CachedBrand[];
  products: CachedProduct[];
  customers: CachedCustomer[];
} {
  const categories: CachedCategory[] = CLIENT_BD_CATEGORIES.map((c, idx) => ({
    id: idx + 1,
    name: c.name,
    nameBn: c.nameBn,
    iconName: c.iconName,
    accentColor: c.accentColor,
  }));

  const catMap = new Map<string, number>();
  categories.forEach((c) => catMap.set(c.name, c.id));

  const uniqueBrands = new Map<string, (typeof CLIENT_BD_BRANDS)[0]>();
  CLIENT_BD_BRANDS.forEach((b) => {
    if (!uniqueBrands.has(b.name)) uniqueBrands.set(b.name, b);
  });

  let brandIdCounter = 1;
  const brandMap = new Map<string, number>();
  const brands: CachedBrand[] = Array.from(uniqueBrands.values()).map((b) => {
    const id = brandIdCounter++;
    brandMap.set(b.name, id);
    return {
      id,
      name: b.name,
      nameBn: b.nameBn,
      company: b.company,
      logoUrl: b.logoUrl,
      logoSource: b.logoSource,
      logoStatus: 'VERIFIED',
      brandColor: b.brandColor,
    };
  });

  // Client-safe procedural generation from catalog manifest without importing server DB
  const products: CachedProduct[] = [];
  let prodId = 1;

  // Essential BD FMCG staples catalog
  const STAPLES = [
    { sku: 'RICE-MIN-1KG', barcode: '8942000001001', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Miniket Rice (Loose)', nameBn: 'মিনিকেট চাল (খোলা)', variant: '1 kg', unit: 'Kg', cost: '68.00', price: '76.00', stock: '250', min: '40' },
    { sku: 'DEMO-RICE-MIN-5K', barcode: '8942000001002', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Miniket Rice (Pack)', nameBn: 'মিনিকেট চাল (প্যাকেট)', variant: '5 kg Bag', unit: 'Bag', cost: '345.00', price: '385.00', stock: '80', min: '15' },
    { sku: 'DEMO-RICE-NAZ-1K', barcode: '8942000001003', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Nazirshail Rice (Loose)', nameBn: 'নাজিরশাইল চাল (খোলা)', variant: '1 kg', unit: 'Kg', cost: '78.00', price: '88.00', stock: '200', min: '35' },
    { sku: 'DEMO-RICE-NAZ-5K', barcode: '8942000001004', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Nazirshail Premium Rice', nameBn: 'প্রিমিয়াম নাজিরশাইল চাল', variant: '5 kg Bag', unit: 'Bag', cost: '390.00', price: '440.00', stock: '65', min: '12' },
    { sku: 'RICE-MIN-5KG', barcode: '8942000001005', category: 'Rice, Dal & Grains', brand: 'ACI Pure', name: 'ACI Aroma Chinigura Rice', nameBn: 'এসিআই অ্যারোমা চিনিগুঁড়া চাল', variant: '1 kg Pack', unit: 'Packet', cost: '142.00', price: '160.00', stock: '55', min: '10' },
    { sku: 'DAL-MOS-1KG', barcode: '8942000001006', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Deshi Mosur Dal (Loose)', nameBn: 'দেশি মসুর ডাল', variant: '1 kg', unit: 'Kg', cost: '122.00', price: '138.00', stock: '120', min: '25' },
    { sku: 'DEMO-DAL-MUG-1K', barcode: '8942000001007', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Moong Dal (Loose)', nameBn: 'মুগ ডাল (খোলা)', variant: '1 kg', unit: 'Kg', cost: '145.00', price: '165.00', stock: '70', min: '15' },
    { sku: 'DEMO-CHOLA-1K', barcode: '8942000001008', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Chola Boot (Loose)', nameBn: 'ছোলা বুট (খোলা)', variant: '1 kg', unit: 'Kg', cost: '95.00', price: '110.00', stock: '90', min: '20' },
    { sku: 'FR-ATTA-2KG', barcode: '8942000001009', category: 'Flour, Atta, Maida & Suji', brand: 'Fresh', name: 'Fresh Atta', nameBn: 'ফ্রেশ আটা', variant: '2 kg', unit: 'Packet', cost: '108.00', price: '120.00', stock: '60', min: '12' },
    { sku: 'FR-MAIDA-1KG', barcode: '8942000001010', category: 'Flour, Atta, Maida & Suji', brand: 'Fresh', name: 'Fresh Maida', nameBn: 'ফ্রেশ ময়দা', variant: '1 kg', unit: 'Packet', cost: '66.00', price: '75.00', stock: '50', min: '10' },
    { sku: 'TEER-SUJI-500G', barcode: '8942000001011', category: 'Flour, Atta, Maida & Suji', brand: 'Teer', name: 'Teer Suji', nameBn: 'তীর সুজি', variant: '500g', unit: 'Packet', cost: '42.00', price: '48.00', stock: '40', min: '8' },
    { sku: 'FR-OIL-1L', barcode: '8942000001012', category: 'Cooking Oil & Ghee', brand: 'Fresh', name: 'Fresh Fortified Soybean Oil', nameBn: 'ফ্রেশ সয়াবিন তেল', variant: '1 Liter', unit: 'Bottle', cost: '158.00', price: '167.00', stock: '75', min: '15' },
    { sku: 'FR-OIL-2L', barcode: '8942000001013', category: 'Cooking Oil & Ghee', brand: 'Fresh', name: 'Fresh Fortified Soybean Oil', nameBn: 'ফ্রেশ সয়াবিন তেল', variant: '2 Liter', unit: 'Bottle', cost: '314.00', price: '334.00', stock: '45', min: '10' },
    { sku: 'FR-OIL-5L', barcode: '8942000001014', category: 'Cooking Oil & Ghee', brand: 'Fresh', name: 'Fresh Fortified Soybean Oil', nameBn: 'ফ্রেশ সয়াবিন তেল', variant: '5 Liter', unit: 'Bottle', cost: '775.00', price: '818.00', stock: '35', min: '8' },
    { sku: 'TEER-MUST-500M', barcode: '8942000001015', category: 'Cooking Oil & Ghee', brand: 'Teer', name: 'Teer Mustard Oil', nameBn: 'তীর সরিষার তেল', variant: '500 ml', unit: 'Bottle', cost: '145.00', price: '165.00', stock: '35', min: '8' },
    { sku: 'ACI-SALT-1KG', barcode: '8942000001016', category: 'Salt & Sugar', brand: 'ACI Pure', name: 'ACI Pure Iodized Salt', nameBn: 'এসিআই পিওর লবণ', variant: '1 kg', unit: 'Packet', cost: '36.00', price: '42.00', stock: '95', min: '20' },
    { sku: 'FR-SUGAR-1KG', barcode: '8942000001017', category: 'Salt & Sugar', brand: 'Fresh', name: 'Fresh Refined Sugar', nameBn: 'ফ্রেশ চিনি', variant: '1 kg', unit: 'Packet', cost: '126.00', price: '138.00', stock: '70', min: '15' },
    { sku: 'SQ-RAD-TUR-200', barcode: '8942000001018', category: 'Spices & Masala', brand: 'Radhuni', name: 'Radhuni Turmeric Powder', nameBn: 'রাঁধুনী হলুদ গুঁড়া', variant: '200g', unit: 'Packet', cost: '95.00', price: '112.00', stock: '60', min: '12' },
    { sku: 'SQ-RAD-CHL-200', barcode: '8942000001019', category: 'Spices & Masala', brand: 'Radhuni', name: 'Radhuni Red Chili Powder', nameBn: 'রাঁধুনী মরিচ গুঁড়া', variant: '200g', unit: 'Packet', cost: '120.00', price: '140.00', stock: '55', min: '12' },
    { sku: 'PR-CHICK-50G', barcode: '8942000001020', category: 'Spices & Masala', brand: 'PRAN', name: 'PRAN Chicken Masala', nameBn: 'প্রাণ মুরগির মাংসের মসলা', variant: '50g', unit: 'Packet', cost: '46.00', price: '55.00', stock: '65', min: '15' },
    { sku: 'FR-TEA-400G', barcode: '8942000001021', category: 'Tea & Coffee', brand: 'Fresh', name: 'Fresh Premium Tea', nameBn: 'ফ্রেশ চা পাতা', variant: '400g', unit: 'Packet', cost: '188.00', price: '215.00', stock: '45', min: '8' },
    { sku: 'PR-POT-100G', barcode: '8942000001022', category: 'Snacks & Chips', brand: 'PRAN', name: 'PRAN Potata Spicy Crackers', nameBn: 'প্রাণ পটাটা বিস্কুট', variant: '100g', unit: 'Packet', cost: '28.00', price: '35.00', stock: '120', min: '25' },
    { sku: 'DEMO-MOJO-250', barcode: '8942000001023', category: 'Soft Drinks & Beverages', brand: 'Mojo', name: 'Mojo Cola Drink', nameBn: 'মোজো কোলা ড্রিংক', variant: '250 ml', unit: 'Bottle', cost: '16.00', price: '20.00', stock: '140', min: '30' },
    { sku: 'DEMO-PEP-7UP-125', barcode: '8942000001024', category: 'Soft Drinks & Beverages', brand: 'PepsiCo', name: '7Up Lemon Soda', nameBn: 'সেভেন-আপ লেমন সোডা', variant: '1.25 Liter', unit: 'Bottle', cost: '82.00', price: '95.00', stock: '60', min: '12' },
    { sku: 'PR-FRT-250M', barcode: '8942000001025', category: 'Juice & Packaged Drinks', brand: 'PRAN', name: 'PRAN Frooto Mango Juice', nameBn: 'প্রাণ ফ্রুটো ম্যাংগো জুস', variant: '250 ml', unit: 'Bottle', cost: '24.00', price: '30.00', stock: '90', min: '20' },
    { sku: 'DEMO-DANO-500G', barcode: '8942000001026', category: 'Dairy & Milk Products', brand: 'Danish', name: 'Dano Full Cream Milk Powder', nameBn: 'ডানো ফুল ক্রিম দুধের গুঁড়া', variant: '500g', unit: 'Packet', cost: '410.00', price: '450.00', stock: '40', min: '8' },
    { sku: 'DEMO-EGG-RED-4', barcode: '8942000001027', category: 'Eggs', brand: 'Local / Loose', name: 'Layer Farm Brown Eggs', nameBn: 'ফার্মের লাল ডিম', variant: '4 pcs', unit: 'Packet', cost: '44.00', price: '50.00', stock: '85', min: '20' },
    { sku: 'DEMO-MAGGI-4P', barcode: '8942000001028', category: 'Noodles & Pasta', brand: 'Maggi', name: 'Maggi 2-Minute Noodles Masala', nameBn: 'ম্যাগি ২-মিনিট নুডুলস', variant: '4-Pack', unit: 'Packet', cost: '68.00', price: '80.00', stock: '70', min: '15' },
    { sku: 'UNI-LB-100G', barcode: '8942000001029', category: 'Soap & Personal Care', brand: 'Lifebuoy', name: 'Lifebuoy Total Soap', nameBn: 'লাইফবয় সাবান', variant: '100g', unit: 'Piece', cost: '42.00', price: '50.00', stock: '80', min: '15' },
    { sku: 'UNI-SURF-500G', barcode: '8942000001030', category: 'Detergent & Dishwashing', brand: 'Surf Excel', name: 'Surf Excel Quick Wash Detergent', nameBn: 'সার্ফ এক্সেল ডিটারজেন্ট', variant: '500g', unit: 'Packet', cost: '120.00', price: '140.00', stock: '65', min: '12' },
    { sku: 'UNI-VIM-500M', barcode: '8942000001031', category: 'Detergent & Dishwashing', brand: 'Vim', name: 'Vim Dishwash Liquid Gel', nameBn: 'ভিম ডিশওয়াশ লিকুইড', variant: '500 ml', unit: 'Bottle', cost: '135.00', price: '155.00', stock: '50', min: '10' },
    { sku: 'MAR-PAR-200M', barcode: '8942000001032', category: 'Shampoo & Hair Care', brand: 'Parachute', name: 'Parachute Pure Coconut Hair Oil', nameBn: 'প্যারাসুট খাঁটি নারিকেল তেল', variant: '200 ml', unit: 'Bottle', cost: '155.00', price: '175.00', stock: '55', min: '10' },
    { sku: 'ACI-AERO-475M', barcode: '8942000001033', category: 'Mosquito Repellent', brand: 'ACI', name: 'ACI Aerosol Insect Spray', nameBn: 'এসিআই অ্যারোসল স্প্রে', variant: '475 ml', unit: 'Bottle', cost: '310.00', price: '340.00', stock: '35', min: '8' },
  ];

  STAPLES.forEach((item) => {
    const id = prodId++;
    const categoryId = catMap.get(item.category) || 1;
    const brandId = brandMap.get(item.brand) || null;
    const img = getManifestImageForSku(item.sku);

    products.push({
      id,
      categoryId,
      brandId,
      sku: item.sku,
      barcode: item.barcode,
      name: item.name,
      nameBn: item.nameBn,
      variant: item.variant,
      baseUnit: item.unit,
      allowDecimalQty: item.unit === 'Kg',
      avgCostPrice: item.cost,
      sellingPrice: item.price,
      currentStock: item.stock,
      minStock: item.min,
      imageUrl: img,
      imageSource: 'Master Product Catalog (1000x1000 WebP)',
      imageStatus: 'VERIFIED',
      isFrequent: true,
    });
  });

  // Also include all 220 Master MDK Manifest SKUs
  for (let i = 1; i <= 220; i++) {
    const sku = `MDK-${String(i).padStart(4, '0')}`;
    const img = getManifestImageForSku(sku);
    if (!products.some((p) => p.sku === sku)) {
      const id = prodId++;
      // Determine category and brand from index range
      let catName = 'Rice, Dal & Grains';
      let brandName = 'Local / Loose';
      if (i > 37 && i <= 52) { catName = 'Cooking Oil & Ghee'; brandName = 'Teer'; }
      else if (i > 52 && i <= 61) { catName = 'Salt & Sugar'; brandName = 'Fresh'; }
      else if (i > 61 && i <= 87) { catName = 'Spices & Masala'; brandName = 'Radhuni'; }
      else if (i > 87 && i <= 118) { catName = 'Snacks & Chips'; brandName = 'PRAN'; }
      else if (i > 118 && i <= 154) { catName = 'Soft Drinks & Beverages'; brandName = 'Mojo'; }
      else if (i > 154 && i <= 171) { catName = 'Dairy & Milk Products'; brandName = 'Danish'; }
      else if (i > 171) { catName = 'Soap & Personal Care'; brandName = 'Unilever'; }

      products.push({
        id,
        categoryId: catMap.get(catName) || 1,
        brandId: brandMap.get(brandName) || null,
        sku,
        barcode: `894299${String(i).padStart(7, '0')}`,
        name: `Grocery Item ${sku}`,
        nameBn: `মুদি পণ্য ${sku}`,
        variant: 'Standard Pack',
        baseUnit: 'Piece',
        allowDecimalQty: false,
        avgCostPrice: '80.00',
        sellingPrice: '95.00',
        currentStock: '50',
        minStock: '10',
        imageUrl: img,
        imageSource: 'Master Product Catalog (1000x1000 WebP)',
        imageStatus: 'VERIFIED',
        isFrequent: false,
      });
    }
  }

  const customers: CachedCustomer[] = [
    { id: 1, customerCode: 'CUST-0001', name: 'জনাব রফিকুল ইসলাম', phone: '01711000111', customerType: 'RETAIL', creditLimit: '5000', currentDue: '1200' },
    { id: 2, customerCode: 'CUST-0002', name: 'মেসার্স ভাই ভাই স্টোর', phone: '01819000222', customerType: 'WHOLESALE', creditLimit: '25000', currentDue: '8500' },
    { id: 3, customerCode: 'CUST-0003', name: 'করিম মিয়া (নিয়মিত ক্রেতা)', phone: '01912000333', customerType: 'RETAIL', creditLimit: '3000', currentDue: '450' },
  ];

  return { categories, brands, products, customers };
}
