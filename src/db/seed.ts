import { and, eq, isNull } from 'drizzle-orm';
import { db } from './index.ts';
import {
  stores,
  storeSettings,
  categories,
  brands,
  products,
  productUnits,
  stockMovements,
  expenseCategories,
  suppliers,
  customers,
  customerLedger,
  cashRegisters,
  cashTransactions,
} from './schema.ts';
import { dhakaTodayISO } from '../lib/decimal.ts';
import { getManifestImageForSku } from '../lib/catalog-manifest.ts';

export const BD_CATEGORIES: Array<{ name: string; nameBn: string; iconName: string; accentColor: string }> = [
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

export const BD_BRANDS: Array<{
  name: string;
  nameBn: string;
  company: string;
  logoUrl: string | null;
  logoSource: string;
  logoStatus: 'VERIFIED' | 'UNAVAILABLE';
  brandColor: string;
}> = [
  { name: 'PRAN', nameBn: 'প্রাণ', company: 'PRAN-RFL Group', logoUrl: '/catalog/brands/pran.jpg', logoSource: 'Official PRAN-RFL Brand Mark (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Fresh', nameBn: 'ফ্রেশ', company: 'Meghna Group of Industries', logoUrl: '/catalog/brands/fresh.svg', logoSource: 'Official Meghna Group Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#059669' },
  { name: 'ACI', nameBn: 'এসিআই', company: 'ACI Limited', logoUrl: '/catalog/brands/aci.svg', logoSource: 'Official ACI Limited Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Square', nameBn: 'স্কয়ার', company: 'Square Food & Beverage / Toiletries', logoUrl: '/catalog/brands/square.svg', logoSource: 'Official Square Group Seal (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'Bashundhara', nameBn: 'বসুন্ধরা', company: 'Bashundhara Group', logoUrl: '/catalog/brands/bashundhara.svg', logoSource: 'Official Bashundhara Group Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#047857' },
  { name: 'Akij', nameBn: 'আকিজ', company: 'Akij Food & Beverage', logoUrl: '/catalog/brands/akij.svg', logoSource: 'Official Akij Group Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#0284C7' },
  { name: 'Teer', nameBn: 'তীর', company: 'City Group', logoUrl: '/catalog/brands/teer.png', logoSource: 'Official City Group Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Unilever', nameBn: 'ইউনিলিভার', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/unilever.svg', logoSource: 'Official Unilever Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#1E40AF' },
  { name: 'Marico', nameBn: 'ম্যারিকো', company: 'Marico Bangladesh', logoUrl: '/catalog/brands/marico.svg', logoSource: 'Official Marico Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#0369A1' },
  { name: 'Nestlé', nameBn: 'নেসলে', company: 'Nestlé Bangladesh', logoUrl: '/catalog/brands/nestle.svg', logoSource: 'Official Nestlé Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#475569' },
  { name: 'Coca-Cola', nameBn: 'কোকা-কোলা', company: 'Coca-Cola Bangladesh', logoUrl: '/catalog/brands/coca-cola.svg', logoSource: 'Official Coca-Cola Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'PepsiCo', nameBn: 'পেপসিকো', company: 'Transcom Beverages', logoUrl: '/catalog/brands/pepsi.svg', logoSource: 'Official Pepsi Brand Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'Maggi', nameBn: 'ম্যাগি', company: 'Nestlé Bangladesh', logoUrl: '/catalog/brands/maggi.svg', logoSource: 'Official Maggi Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#EAB308' },
  { name: 'Lux', nameBn: 'লাক্স', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/lux.png', logoSource: 'Official Lux Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#DB2777' },
  { name: 'Lifebuoy', nameBn: 'লাইফবয়', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/lifebuoy.png', logoSource: 'Official Lifebuoy Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Sunsilk', nameBn: 'সানসিল্ক', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/sunsilk.png', logoSource: 'Official Sunsilk Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#EC4899' },
  { name: 'Dove', nameBn: 'ডাভ', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/dove.png', logoSource: 'Official Dove Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Pepsodent', nameBn: 'পেপসোডেন্ট', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/pepsodent.svg', logoSource: 'Official Pepsodent Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#1D4ED8' },
  { name: 'Lays', nameBn: 'লেইস', company: 'PepsiCo Bangladesh', logoUrl: '/catalog/brands/lays.svg', logoSource: 'Official Lay\'s Logo (Wikimedia)', logoStatus: 'VERIFIED', brandColor: '#EAB308' },
  { name: 'Olympic', nameBn: 'অলিম্পিক', company: 'Olympic Industries', logoUrl: '/catalog/brands/olympic.svg', logoSource: 'Official Olympic Brand Logo', logoStatus: 'VERIFIED', brandColor: '#EA580C' },
  { name: 'Danish', nameBn: 'ড্যানিশ', company: 'Partex Star Group', logoUrl: '/catalog/brands/danish.svg', logoSource: 'Official Danish Brand Logo', logoStatus: 'VERIFIED', brandColor: '#0284C7' },
  { name: 'Igloo', nameBn: 'ইগলু', company: 'Abdul Monem Limited', logoUrl: '/catalog/brands/igloo.svg', logoSource: 'Official Igloo Brand Logo', logoStatus: 'VERIFIED', brandColor: '#0891B2' },
  { name: 'Bombay Sweets', nameBn: 'বোম্বে সুইটস', company: 'Bombay Sweets & Co.', logoUrl: '/catalog/brands/bombay-sweets.svg', logoSource: 'Official Bombay Sweets Logo', logoStatus: 'VERIFIED', brandColor: '#D97706' },
  { name: 'Dekko', nameBn: 'ডেক্কো', company: 'Dekko Foods', logoUrl: '/catalog/brands/dekko.svg', logoSource: 'Official Dekko Brand Logo', logoStatus: 'VERIFIED', brandColor: '#7C3AED' },
  { name: 'Radhuni', nameBn: 'রাঁধুনী', company: 'Square Food & Beverage', logoUrl: '/catalog/brands/radhuni.svg', logoSource: 'Official Radhuni Brand Mark', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Local / Loose', nameBn: 'স্থানীয় / খোলা', company: 'Local Wholesale', logoUrl: '/catalog/brands/local.svg', logoSource: 'Local Wholesale Commodities', logoStatus: 'VERIFIED', brandColor: '#059669' },
];

// Strictly verified authentic product packaging photographs (zero AI fakes, zero substitutes)
export const VERIFIED_PRODUCT_MEDIA: Record<string, { imageUrl: string; imageSource: string }> = {
  // Verified starter SKUs
  'PR-FRT-250M': { imageUrl: '/catalog/products/pr-frt-250m.jpg', imageSource: 'OpenFoodFacts Verified Packaging (PRAN Frooto)' },
  'PR-POT-100G': { imageUrl: '/catalog/products/pr-pot-100g.jpg', imageSource: 'OpenFoodFacts Verified Packaging (PRAN Potata)' },
  'NES-CLAS-50G': { imageUrl: '/catalog/products/nes-clas-50g.jpg', imageSource: 'OpenFoodFacts Verified Packaging (Nescafé Classic)' },
  'UNI-LB-100G': { imageUrl: '/catalog/products/uni-lb-100g.jpg', imageSource: 'OpenFoodFacts Verified Packaging (Lifebuoy Soap)' },
  'UNI-SURF-500G': { imageUrl: '/catalog/products/uni-surf-500g.jpg', imageSource: 'OpenFoodFacts Verified Packaging (Surf Excel)' },
  'UNI-VIM-500M': { imageUrl: '/catalog/products/uni-vim-500m.jpg', imageSource: 'OpenFoodFacts Verified Packaging (Vim Dishwash)' },
  'MAR-PAR-200M': { imageUrl: '/catalog/products/mar-par-200m.jpg', imageSource: 'OpenFoodFacts Verified Packaging (Parachute Coconut Oil)' },

  // Mudir Dokan Pro Master Manifest Verified SKU Mappings (1000x1000 square WebP, pure white #FFFFFF background)
  'MDK-0022': { imageUrl: '/images/products/MDK-0022_loose_local_lentil_masoor_dal_500_g.webp', imageSource: 'Wikimedia Commons CC Verified (Split Red Lentil)' },
  'MDK-0098': { imageUrl: '/images/products/MDK-0098_pran_potato_crackers_100_g.webp', imageSource: 'OpenFoodFacts Verified Packaging (PRAN Potata 100g)' },
  'MDK-0119': { imageUrl: '/images/products/MDK-0119_pran_mango_juice_250_ml.webp', imageSource: 'OpenFoodFacts Verified Packaging (PRAN Frooto 250ml)' },
  'MDK-0140': { imageUrl: '/images/products/MDK-0140_nescafe_classic_coffee_50_g.webp', imageSource: 'OpenFoodFacts Verified Packaging (Nescafé Classic 50g)' },
  'MDK-0161': { imageUrl: '/images/products/MDK-0161_local_eggs_1_piece.webp', imageSource: 'Wikimedia Commons CC Verified (Egg on white background)' },
  'MDK-0176': { imageUrl: '/images/products/MDK-0176_unilever_surf_excel_detergent_500_g.webp', imageSource: 'OpenFoodFacts Verified Packaging (Surf Excel 500g)' },
  'MDK-0184': { imageUrl: '/images/products/MDK-0184_unilever_vim_liquid_500_ml.webp', imageSource: 'OpenFoodFacts Verified Packaging (Vim Liquid 500ml)' },
  'MDK-0187': { imageUrl: '/images/products/MDK-0187_unilever_lifebuoy_soap_100_g.webp', imageSource: 'OpenFoodFacts Verified Packaging (Lifebuoy Soap 100g)' },
  'MDK-0208': { imageUrl: '/images/products/MDK-0208_parachute_coconut_oil_200_ml.webp', imageSource: 'OpenFoodFacts Verified Packaging (Parachute Coconut Oil 200ml)' },
};

const BD_EXPENSE_CATEGORIES: Array<{ name: string; nameBn: string }> = [
  { name: 'Shop Rent', nameBn: 'দোকান ভাড়া' },
  { name: 'Electricity Bill', nameBn: 'বিদ্যুৎ বিল' },
  { name: 'Employee Salary', nameBn: 'কর্মচারীর বেতন' },
  { name: 'Transportation', nameBn: 'পরিবহন খরচ' },
  { name: 'Loading / Unloading', nameBn: 'লোডিং ও আনলোডিং' },
  { name: 'Internet & Mobile', nameBn: 'ইন্টারনেট ও মোবাইল' },
  { name: 'Packaging & Polybags', nameBn: 'প্যাকেজিং ও পলিব্যাগ' },
  { name: 'Maintenance & Repair', nameBn: 'মেরামত ও রক্ষণাবেক্ষণ' },
  { name: 'Tea & Refreshments', nameBn: 'চা ও আপ্যায়ন' },
  { name: 'Other Expenses', nameBn: 'অন্যান্য খরচ' },
];

interface StarterSku {
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  name: string;
  nameBn: string;
  variant: string;
  baseUnit: string;
  allowDecimalQty: boolean;
  cost: string;
  price: string;
  stock: string;
  minStock: string;
  isFrequent?: boolean;
  packUnit?: { unitName: string; unitNameBn: string; factor: string };
}

const STARTER_SKUS: StarterSku[] = [
  // Rice, Dal & Grains
  { sku: 'RICE-MIN-1KG', barcode: '8941001000011', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Miniket Rice (Loose)', nameBn: 'মিনিকেট চাল (খোলা)', variant: '1 kg', baseUnit: 'Kg', allowDecimalQty: true, cost: '68.00', price: '76.00', stock: '150', minStock: '25', isFrequent: true, packUnit: { unitName: 'Sack', unitNameBn: 'বস্তা (৫০ কেজি)', factor: '50' } },
  { sku: 'RICE-MIN-5KG', barcode: '8941001000028', category: 'Rice, Dal & Grains', brand: 'ACI', name: 'ACI Aroma Chinigura Rice', nameBn: 'এসিআই অ্যারোমা চিনিগুঁড়া চাল', variant: '1 kg Pack', baseUnit: 'Packet', allowDecimalQty: false, cost: '142.00', price: '160.00', stock: '40', minStock: '8' },
  { sku: 'DAL-MOS-1KG', barcode: '8941001000035', category: 'Rice, Dal & Grains', brand: 'Local / Loose', name: 'Deshi Mosur Dal (Loose)', nameBn: 'দেশি মসুর ডাল', variant: '1 kg', baseUnit: 'Kg', allowDecimalQty: true, cost: '122.00', price: '138.00', stock: '65', minStock: '15', isFrequent: true },
  // Flour, Atta, Maida & Suji
  { sku: 'FR-ATTA-2KG', barcode: '8941152000101', category: 'Flour, Atta, Maida & Suji', brand: 'Fresh', name: 'Fresh Atta', nameBn: 'ফ্রেশ আটা', variant: '2 kg', baseUnit: 'Packet', allowDecimalQty: false, cost: '108.00', price: '120.00', stock: '45', minStock: '10', isFrequent: true },
  { sku: 'FR-MAIDA-1KG', barcode: '8941152000118', category: 'Flour, Atta, Maida & Suji', brand: 'Fresh', name: 'Fresh Maida', nameBn: 'ফ্রেশ ময়দা', variant: '1 kg', baseUnit: 'Packet', allowDecimalQty: false, cost: '66.00', price: '75.00', stock: '35', minStock: '8' },
  { sku: 'TEER-SUJI-500G', barcode: '8941154000201', category: 'Flour, Atta, Maida & Suji', brand: 'Teer', name: 'Teer Suji', nameBn: 'তীর সুজি', variant: '500g', baseUnit: 'Packet', allowDecimalQty: false, cost: '42.00', price: '48.00', stock: '30', minStock: '6' },
  // Cooking Oil & Ghee
  { sku: 'FR-OIL-1L', barcode: '8941152000309', category: 'Cooking Oil & Ghee', brand: 'Fresh', name: 'Fresh Fortified Soybean Oil', nameBn: 'ফ্রেশ সয়াবিন তেল', variant: '1 Liter', baseUnit: 'Bottle', allowDecimalQty: false, cost: '158.00', price: '167.00', stock: '60', minStock: '12', isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (১২ বোতল)', factor: '12' } },
  { sku: 'FR-OIL-2L', barcode: '8941152000316', category: 'Cooking Oil & Ghee', brand: 'Fresh', name: 'Fresh Fortified Soybean Oil', nameBn: 'ফ্রেশ সয়াবিন তেল', variant: '2 Liter', baseUnit: 'Bottle', allowDecimalQty: false, cost: '314.00', price: '334.00', stock: '32', minStock: '8' },
  { sku: 'FR-OIL-5L', barcode: '8941152000323', category: 'Cooking Oil & Ghee', brand: 'Fresh', name: 'Fresh Fortified Soybean Oil', nameBn: 'ফ্রেশ সয়াবিন তেল', variant: '5 Liter', baseUnit: 'Bottle', allowDecimalQty: false, cost: '775.00', price: '818.00', stock: '24', minStock: '6', isFrequent: true },
  { sku: 'TEER-MUST-500M', barcode: '8941154000355', category: 'Cooking Oil & Ghee', brand: 'Teer', name: 'Teer Mustard Oil', nameBn: 'তীর সরিষার তেল', variant: '500 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '145.00', price: '165.00', stock: '25', minStock: '6' },
  // Salt & Sugar
  { sku: 'ACI-SALT-1KG', barcode: '8941102000105', category: 'Salt & Sugar', brand: 'ACI', name: 'ACI Pure Iodized Salt', nameBn: 'এসিআই পিওর লবণ', variant: '1 kg', baseUnit: 'Packet', allowDecimalQty: false, cost: '36.00', price: '42.00', stock: '80', minStock: '15', isFrequent: true, packUnit: { unitName: 'Sack', unitNameBn: 'বস্তা (২৫ প্যাকেট)', factor: '25' } },
  { sku: 'FR-SUGAR-1KG', barcode: '8941152000408', category: 'Salt & Sugar', brand: 'Fresh', name: 'Fresh Refined Sugar', nameBn: 'ফ্রেশ চিনি', variant: '1 kg', baseUnit: 'Packet', allowDecimalQty: false, cost: '126.00', price: '138.00', stock: '55', minStock: '12', isFrequent: true },
  { sku: 'SUGAR-LOOSE-1K', barcode: '8941001000419', category: 'Salt & Sugar', brand: 'Local / Loose', name: 'White Sugar (Loose)', nameBn: 'খোলা চিনি', variant: '1 kg', baseUnit: 'Kg', allowDecimalQty: true, cost: '120.00', price: '132.00', stock: '70', minStock: '15' },
  // Spices & Masala
  { sku: 'SQ-RAD-TUR-200', barcode: '8941157000104', category: 'Spices & Masala', brand: 'Square', name: 'Radhuni Turmeric Powder', nameBn: 'রাঁধুনী হলুদ গুঁড়া', variant: '200g', baseUnit: 'Packet', allowDecimalQty: false, cost: '95.00', price: '112.00', stock: '40', minStock: '10' },
  { sku: 'SQ-RAD-CHL-200', barcode: '8941157000111', category: 'Spices & Masala', brand: 'Square', name: 'Radhuni Red Chili Powder', nameBn: 'রাঁধুনী মরিচ গুঁড়া', variant: '200g', baseUnit: 'Packet', allowDecimalQty: false, cost: '120.00', price: '140.00', stock: '38', minStock: '10' },
  { sku: 'PR-CHICK-50G', barcode: '8941100310102', category: 'Spices & Masala', brand: 'PRAN', name: 'PRAN Chicken Masala', nameBn: 'প্রাণ মুরগির মাংসের মসলা', variant: '50g', baseUnit: 'Packet', allowDecimalQty: false, cost: '46.00', price: '55.00', stock: '48', minStock: '10' },
  // Tea & Coffee
  { sku: 'FR-TEA-400G', barcode: '8941152000507', category: 'Tea & Coffee', brand: 'Fresh', name: 'Fresh Premium Tea', nameBn: 'ফ্রেশ চা পাতা', variant: '400g', baseUnit: 'Packet', allowDecimalQty: false, cost: '188.00', price: '215.00', stock: '30', minStock: '6', isFrequent: true },
  { sku: 'NES-CLAS-50G', barcode: '8941160000109', category: 'Tea & Coffee', brand: 'Nestlé', name: 'Nescafé Classic Jar', nameBn: 'নেসক্যাফে ক্লাসিক কফি', variant: '50g', baseUnit: 'Bottle', allowDecimalQty: false, cost: '190.00', price: '220.00', stock: '18', minStock: '5', isFrequent: true },
  // Biscuits & Bakery
  { sku: 'OLY-ENP-145G', barcode: '8941122000103', category: 'Biscuits & Bakery', brand: 'Olympic', name: 'Olympic Energy Plus Biscuit', nameBn: 'অলিম্পিক এনার্জি প্লাস বিস্কুট', variant: '145g', baseUnit: 'Packet', allowDecimalQty: false, cost: '29.00', price: '35.00', stock: '72', minStock: '15', isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ প্যাকেট)', factor: '24' } },
  { sku: 'PR-POT-100G', barcode: '8941100310201', category: 'Biscuits & Bakery', brand: 'PRAN', name: 'PRAN Potata Spicy Biscuit', nameBn: 'প্রাণ পটাটা বিস্কুট', variant: '100g', baseUnit: 'Packet', allowDecimalQty: false, cost: '25.00', price: '30.00', stock: '65', minStock: '12', isFrequent: true },
  { sku: 'DEK-LEX-200G', barcode: '8941135000107', category: 'Biscuits & Bakery', brand: 'Dekko', name: 'Dekko Cookies Biscuit', nameBn: 'ডেক্কো কুকিজ বিস্কুট', variant: '200g', baseUnit: 'Packet', allowDecimalQty: false, cost: '52.00', price: '62.00', stock: '30', minStock: '6' },
  // Snacks & Chips
  { sku: 'BS-CHANA-300G', barcode: '8941118000100', category: 'Snacks & Chips', brand: 'Bombay Sweets', name: 'Bombay Sweets Chanachur', nameBn: 'বোম্বে সুইটস চানাচুর', variant: '300g', baseUnit: 'Packet', allowDecimalQty: false, cost: '68.00', price: '80.00', stock: '44', minStock: '10' },
  { sku: 'PR-CHIPS-25G', barcode: '8941100310300', category: 'Snacks & Chips', brand: 'PRAN', name: 'PRAN Potato Crackers', nameBn: 'প্রাণ পটেটো ক্র্যাকার্স', variant: '25g', baseUnit: 'Packet', allowDecimalQty: false, cost: '12.50', price: '15.00', stock: '110', minStock: '20', isFrequent: true },
  { sku: 'PEP-LAYS-45G', barcode: '8941180000102', category: 'Snacks & Chips', brand: 'Lays', name: 'Lays Classic Salted', nameBn: 'লেইস ক্লাসিক চিপস', variant: '45g', baseUnit: 'Packet', allowDecimalQty: false, cost: '42.00', price: '50.00', stock: '36', minStock: '8', isFrequent: true },
  // Soft Drinks & Beverages
  { sku: 'AK-MOJO-250M', barcode: '8941170000101', category: 'Soft Drinks & Beverages', brand: 'Akij', name: 'Mojo Cola', nameBn: 'মোজো', variant: '250ml PET', baseUnit: 'Bottle', allowDecimalQty: false, cost: '20.00', price: '25.00', stock: '96', minStock: '24', isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ বোতল)', factor: '24' } },
  { sku: 'AK-MOJO-1L', barcode: '8941170000118', category: 'Soft Drinks & Beverages', brand: 'Akij', name: 'Mojo Cola', nameBn: 'মোজো', variant: '1 Liter', baseUnit: 'Bottle', allowDecimalQty: false, cost: '60.00', price: '70.00', stock: '36', minStock: '12' },
  { sku: 'CC-COKE-125L', barcode: '8941190000108', category: 'Soft Drinks & Beverages', brand: 'Coca-Cola', name: 'Coca-Cola', nameBn: 'কোকা-কোলা', variant: '1.25 Liter', baseUnit: 'Bottle', allowDecimalQty: false, cost: '74.00', price: '85.00', stock: '30', minStock: '8', isFrequent: true },
  { sku: 'PR-UP-500M', barcode: '8941100310409', category: 'Soft Drinks & Beverages', brand: 'PRAN', name: 'PRAN Up', nameBn: 'প্রাণ আপ', variant: '500 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '33.00', price: '40.00', stock: '48', minStock: '12' },
  // Juice & Packaged Drinks
  { sku: 'PR-FRT-250M', barcode: '8941100310508', category: 'Juice & Packaged Drinks', brand: 'PRAN', name: 'PRAN Frooto Mango', nameBn: 'প্রাণ ফ্রুটো আম', variant: '250 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '21.00', price: '25.00', stock: '120', minStock: '24', isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ পিস)', factor: '24' } },
  { sku: 'PR-FRT-500M', barcode: '8941100310515', category: 'Juice & Packaged Drinks', brand: 'PRAN', name: 'PRAN Frooto Mango', nameBn: 'প্রাণ ফ্রুটো আম', variant: '500 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '38.00', price: '45.00', stock: '60', minStock: '12' },
  { sku: 'PR-FRT-1L', barcode: '8941100310522', category: 'Juice & Packaged Drinks', brand: 'PRAN', name: 'PRAN Frooto Mango', nameBn: 'প্রাণ ফ্রুটো আম', variant: '1 Liter', baseUnit: 'Bottle', allowDecimalQty: false, cost: '78.00', price: '90.00', stock: '36', minStock: '8' },
  { sku: 'AK-FRTK-250M', barcode: '8941170000200', category: 'Juice & Packaged Drinks', brand: 'Akij', name: 'Frutika Mango Juice', nameBn: 'ফ্রুটিকা ম্যাঙ্গো জুস', variant: '250 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '21.00', price: '25.00', stock: '72', minStock: '18' },
  // Dairy & Milk Products
  { sku: 'PR-UHT-1L', barcode: '8941100310607', category: 'Dairy & Milk Products', brand: 'PRAN', name: 'PRAN UHT Liquid Milk', nameBn: 'প্রাণ ইউএইচটি তরল দুধ', variant: '1 Liter', baseUnit: 'Packet', allowDecimalQty: false, cost: '96.00', price: '110.00', stock: '40', minStock: '10', isFrequent: true },
  { sku: 'DAN-COND-397G', barcode: '8941145000104', category: 'Dairy & Milk Products', brand: 'Danish', name: 'Danish Condensed Milk', nameBn: 'ড্যানিশ কনডেন্সড মিল্ক', variant: '397g', baseUnit: 'Piece', allowDecimalQty: false, cost: '78.00', price: '90.00', stock: '48', minStock: '12' },
  { sku: 'IGL-VAN-500M', barcode: '8941148000101', category: 'Dairy & Milk Products', brand: 'Igloo', name: 'Igloo Vanilla Ice Cream', nameBn: 'ইগলু ভ্যানিলা আইসক্রিম', variant: '500 ml Box', baseUnit: 'Box', allowDecimalQty: false, cost: '165.00', price: '195.00', stock: '16', minStock: '4' },
  // Eggs
  { sku: 'EGG-FARM-PC', barcode: '8941001000907', category: 'Eggs', brand: 'Local / Loose', name: 'Farm Brown Eggs', nameBn: 'ফার্মের লাল ডিম', variant: 'Per Piece', baseUnit: 'Piece', allowDecimalQty: false, cost: '11.50', price: '13.50', stock: '240', minStock: '36', isFrequent: true, packUnit: { unitName: 'Dozen', unitNameBn: 'ডজন (১২ পিস)', factor: '12' } },
  // Noodles & Pasta
  { sku: 'NES-MAG-8PK', barcode: '8941160000208', category: 'Noodles & Pasta', brand: 'Maggi', name: 'Maggi 2-Minute Noodles', nameBn: 'ম্যাগি নুডুলস ৮ প্যাক', variant: '8 Pack (496g)', baseUnit: 'Packet', allowDecimalQty: false, cost: '155.00', price: '175.00', stock: '35', minStock: '8', isFrequent: true },
  { sku: 'PR-MRN-8PK', barcode: '8941100310706', category: 'Noodles & Pasta', brand: 'PRAN', name: 'Mr. Noodles Magic Masala', nameBn: 'মিস্টার নুডুলস ৮ প্যাক', variant: '8 Pack', baseUnit: 'Packet', allowDecimalQty: false, cost: '142.00', price: '165.00', stock: '42', minStock: '10', isFrequent: true },
  // Sauces & Condiments
  { sku: 'PR-KETCH-340G', barcode: '8941100310805', category: 'Sauces & Condiments', brand: 'PRAN', name: 'PRAN Tomato Ketchup', nameBn: 'প্রাণ টমেটো কেচাপ', variant: '340g Bottle', baseUnit: 'Bottle', allowDecimalQty: false, cost: '105.00', price: '125.00', stock: '28', minStock: '6' },
  // Baby Food
  { sku: 'NES-CER-350G', barcode: '8941160000307', category: 'Baby Food & Baby Care', brand: 'Nestlé', name: 'Nestlé Cerelac Wheat', nameBn: 'সেরেলাক গম', variant: '350g', baseUnit: 'Box', allowDecimalQty: false, cost: '390.00', price: '440.00', stock: '14', minStock: '4' },
  // Soap & Personal Care
  { sku: 'UNI-LUX-100G', barcode: '8941101000106', category: 'Soap & Personal Care', brand: 'Lux', name: 'Lux Velvet Glow Soap', nameBn: 'লাক্স সাবান', variant: '100g', baseUnit: 'Piece', allowDecimalQty: false, cost: '54.00', price: '65.00', stock: '72', minStock: '15', isFrequent: true, packUnit: { unitName: 'Dozen', unitNameBn: 'ডজন (১২ পিস)', factor: '12' } },
  { sku: 'UNI-LUX-150G', barcode: '8941101000113', category: 'Soap & Personal Care', brand: 'Lux', name: 'Lux Velvet Glow Soap', nameBn: 'লাক্স সাবান (বড়)', variant: '150g', baseUnit: 'Piece', allowDecimalQty: false, cost: '78.00', price: '92.00', stock: '48', minStock: '10' },
  { sku: 'UNI-LB-100G', barcode: '8941101000120', category: 'Soap & Personal Care', brand: 'Lifebuoy', name: 'Lifebuoy Total Soap', nameBn: 'লাইফবয় সাবান', variant: '100g', baseUnit: 'Piece', allowDecimalQty: false, cost: '50.00', price: '60.00', stock: '60', minStock: '12', isFrequent: true },
  // Shampoo & Hair Care
  { sku: 'MAR-PAR-200M', barcode: '8941130000102', category: 'Shampoo & Hair Care', brand: 'Marico', name: 'Parachute Coconut Oil', nameBn: 'প্যারাসুট নারিকেল তেল', variant: '200 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '148.00', price: '170.00', stock: '34', minStock: '8', isFrequent: true },
  { sku: 'UNI-SUN-180M', barcode: '8941101000205', category: 'Shampoo & Hair Care', brand: 'Sunsilk', name: 'Sunsilk Black Shine Shampoo', nameBn: 'সানসিল্ক শ্যাম্পু', variant: '180 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '185.00', price: '215.00', stock: '24', minStock: '6' },
  // Toothpaste & Oral Care
  { sku: 'UNI-PEP-140G', barcode: '8941101000304', category: 'Toothpaste & Oral Care', brand: 'Pepsodent', name: 'Pepsodent GermiCheck', nameBn: 'পেপসোডেন্ট টুথপেস্ট', variant: '140g', baseUnit: 'Piece', allowDecimalQty: false, cost: '102.00', price: '120.00', stock: '36', minStock: '8' },
  // Detergent & Dishwashing
  { sku: 'UNI-SURF-500G', barcode: '8941101000403', category: 'Detergent & Dishwashing', brand: 'Unilever', name: 'Surf Excel Powder', nameBn: 'সার্ফ এক্সেল ডিটারজেন্ট', variant: '500g', baseUnit: 'Packet', allowDecimalQty: false, cost: '115.00', price: '132.00', stock: '42', minStock: '10', isFrequent: true },
  { sku: 'UNI-VIM-500M', barcode: '8941101000410', category: 'Detergent & Dishwashing', brand: 'Unilever', name: 'Vim Dishwash Liquid', nameBn: 'ভিম লিকুইড ডিশওয়াশ', variant: '500 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '125.00', price: '145.00', stock: '30', minStock: '6' },
  // Tissue & Mosquito Repellent & Water
  { sku: 'BSH-TIS-120', barcode: '8941165000104', category: 'Tissue & Paper Products', brand: 'Bashundhara', name: 'Bashundhara Facial Tissue', nameBn: 'বসুন্ধরা ফেসিয়াল টিস্যু', variant: '120 Pulls Box', baseUnit: 'Box', allowDecimalQty: false, cost: '64.00', price: '78.00', stock: '40', minStock: '10' },
  { sku: 'ACI-AERO-475M', barcode: '8941102000303', category: 'Mosquito Repellent', brand: 'ACI', name: 'ACI Aerosol Mosquito Spray', nameBn: 'এসিআই অ্যারোসল স্প্রে', variant: '475 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '295.00', price: '340.00', stock: '20', minStock: '5' },
  { sku: 'FR-WAT-500M', barcode: '8941152000903', category: 'Water & Bottled Drinks', brand: 'Fresh', name: 'Fresh Drinking Water', nameBn: 'ফ্রেশ খাবার পানি', variant: '500 ml', baseUnit: 'Bottle', allowDecimalQty: false, cost: '15.00', price: '20.00', stock: '120', minStock: '24', isFrequent: true, packUnit: { unitName: 'Carton', unitNameBn: 'কার্টন (২৪ বোতল)', factor: '24' } },
];

/**
 * Idempotently enriches an existing store's categories, brands, and starter products
 * with verified authentic brand logos, category colors/icons, and verified product photos
 * WITHOUT overwriting any user-uploaded custom images or modifying stock/financial data.
 */
export async function syncVisualCatalogDefaults(storeId: number): Promise<void> {
  const [existingCats, existingBrands, existingProducts] = await Promise.all([
    db.select().from(categories).where(eq(categories.storeId, storeId)),
    db.select().from(brands).where(eq(brands.storeId, storeId)),
    db.select().from(products).where(eq(products.storeId, storeId)),
  ]);

  // 1. Update category iconName / accentColor where missing
  const catMetaByName = new Map(BD_CATEGORIES.map((c) => [c.name.toLowerCase(), c]));
  for (const cat of existingCats) {
    if (!cat.iconName) {
      const meta = catMetaByName.get(cat.name.toLowerCase());
      if (meta) {
        await db
          .update(categories)
          .set({ iconName: meta.iconName, accentColor: meta.accentColor })
          .where(eq(categories.id, cat.id));
      }
    }
  }

  // 2. Update brand logos & colors where missing, and ensure dedicated popular sub-brands exist
  const brandByLower = new Map(existingBrands.map((b) => [b.name.toLowerCase(), b]));
  for (const bMeta of BD_BRANDS) {
    const existing = brandByLower.get(bMeta.name.toLowerCase());
    if (existing) {
      if (!existing.logoUrl && bMeta.logoUrl) {
        await db
          .update(brands)
          .set({
            logoUrl: bMeta.logoUrl,
            logoSource: bMeta.logoSource,
            logoStatus: bMeta.logoStatus,
            brandColor: bMeta.brandColor,
            updatedAt: new Date(),
          })
          .where(eq(brands.id, existing.id));
      }
    } else if (bMeta.logoUrl) {
      await db.insert(brands).values({
        storeId,
        name: bMeta.name,
        nameBn: bMeta.nameBn,
        company: bMeta.company,
        logoUrl: bMeta.logoUrl,
        logoSource: bMeta.logoSource,
        logoStatus: bMeta.logoStatus,
        brandColor: bMeta.brandColor,
      });
    }
  }

  // 3. Backfill strictly-verified product images only where imageUrl is still empty/null
  const now = new Date();
  for (const prod of existingProducts) {
    if (!prod.imageUrl) {
      const media = VERIFIED_PRODUCT_MEDIA[prod.sku];
      if (media) {
        await db
          .update(products)
          .set({
            imageUrl: media.imageUrl,
            imageSource: media.imageSource,
            imageStatus: 'VERIFIED',
            imageUpdatedAt: now,
          })
          .where(and(eq(products.id, prod.id), isNull(products.imageUrl)));
      }
    }
  }
}

export async function provisionStoreForUser(uid: string, ownerName: string): Promise<number> {
  const existing = await db.select().from(stores).where(eq(stores.ownerUid, uid)).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }

  return await db.transaction(async (tx) => {
    const today = dhakaTodayISO();
    const now = new Date();
    const [store] = await tx
      .insert(stores)
      .values({
        ownerUid: uid,
        name: 'MudirDokan Pro',
        nameBn: 'মুদির দোকান প্রো',
        phone: '01700-000000',
        address: 'Mirpur 10, Dhaka-1216, Bangladesh',
        addressBn: 'মিরপুর ১০, ঢাকা-১২১৬, বাংলাদেশ',
        currency: 'BDT',
        currencySymbol: '৳',
        timezone: 'Asia/Dhaka',
        dateFormat: 'DD/MM/YYYY',
      })
      .returning();

    await tx.insert(storeSettings).values({
      storeId: store.id,
      languageMode: 'EN',
      receiptFormat: '80MM',
      allowNegativeStock: false,
      allowCashierPriceEdit: false,
      allowCashierDiscount: true,
      allowCashierReports: false,
    });

    // Seed 28 BD Grocery Categories with icons & colors
    const insertedCategories = await tx
      .insert(categories)
      .values(
        BD_CATEGORIES.map((c, idx) => ({
          storeId: store.id,
          name: c.name,
          nameBn: c.nameBn,
          iconName: c.iconName,
          accentColor: c.accentColor,
          sortOrder: idx + 1,
        }))
      )
      .returning();

    const catByName = new Map<string, number>();
    for (const c of insertedCategories) catByName.set(c.name, c.id);

    // Seed Authentic BD & Global FMCG Brands with verified official logos
    const insertedBrands = await tx
      .insert(brands)
      .values(
        BD_BRANDS.map((b) => ({
          storeId: store.id,
          name: b.name,
          nameBn: b.nameBn,
          company: b.company,
          logoUrl: b.logoUrl,
          logoSource: b.logoSource,
          logoStatus: b.logoStatus,
          brandColor: b.brandColor,
        }))
      )
      .returning();

    const brandByName = new Map<string, number>();
    for (const b of insertedBrands) brandByName.set(b.name, b.id);

    // Seed 10 BD Operating Expense Categories
    await tx.insert(expenseCategories).values(
      BD_EXPENSE_CATEGORIES.map((e) => ({
        storeId: store.id,
        name: e.name,
        nameBn: e.nameBn,
      }))
    );

    // Seed Starter BD FMCG SKUs + Verified Real Packaging Photos + Opening Stock Movements
    const defaultCatId = insertedCategories[0].id;
    for (const item of STARTER_SKUS) {
      const manifestImg = getManifestImageForSku(item.sku);
      const verifiedMedia = VERIFIED_PRODUCT_MEDIA[item.sku];
      const finalImgUrl = manifestImg || verifiedMedia?.imageUrl || null;
      const [prod] = await tx
        .insert(products)
        .values({
          storeId: store.id,
          categoryId: catByName.get(item.category) ?? defaultCatId,
          brandId: brandByName.get(item.brand) ?? null,
          sku: item.sku,
          barcode: item.barcode,
          name: item.name,
          nameBn: item.nameBn,
          variant: item.variant,
          baseUnit: item.baseUnit,
          allowDecimalQty: item.allowDecimalQty,
          avgCostPrice: item.cost,
          lastPurchasePrice: item.cost,
          sellingPrice: item.price,
          currentStock: item.stock,
          minStock: item.minStock,
          imageUrl: finalImgUrl,
          galleryUrls: '[]',
          imageSource: verifiedMedia?.imageSource || 'Master Product Catalog (1000x1000 WebP)',
          imageStatus: finalImgUrl ? 'VERIFIED' : 'UNAVAILABLE',
          imageUpdatedAt: finalImgUrl ? now : null,
          isFrequent: Boolean(item.isFrequent),
        })
        .returning();

      if (item.packUnit) {
        await tx.insert(productUnits).values({
          storeId: store.id,
          productId: prod.id,
          unitName: item.packUnit.unitName,
          unitNameBn: item.packUnit.unitNameBn,
          conversionFactor: item.packUnit.factor,
          isPurchaseDefault: true,
        });
      }

      await tx.insert(stockMovements).values({
        storeId: store.id,
        productId: prod.id,
        movementType: 'OPENING',
        quantityDelta: item.stock,
        unitCost: item.cost,
        balanceAfter: item.stock,
        referenceType: 'SEED',
        notes: 'Initial starter inventory',
        createdByUid: uid,
      });
    }

    // Seed 3 Realistic BD Distributors
    await tx.insert(suppliers).values([
      {
        storeId: store.id,
        supplierCode: 'SUP-0001',
        name: 'PRAN-RFL Mirpur Distributor',
        company: 'PRAN-RFL Group',
        phone: '01711-223344',
        address: 'Section 11, Mirpur, Dhaka',
        openingBalance: '0.00',
        currentDue: '0.00',
      },
      {
        storeId: store.id,
        supplierCode: 'SUP-0002',
        name: 'Meghna Fresh Trading Agency',
        company: 'Meghna Group (Fresh)',
        phone: '01819-556677',
        address: 'Moulvibazar Wholesale Market, Old Dhaka',
        openingBalance: '0.00',
        currentDue: '0.00',
      },
      {
        storeId: store.id,
        supplierCode: 'SUP-0003',
        name: 'Unilever & ACI Town Depot',
        company: 'Multi-Brand FMCG Distributor',
        phone: '01911-889900',
        address: 'Kazipara Commercial Area, Dhaka',
        openingBalance: '0.00',
        currentDue: '0.00',
      },
    ]);

    // Seed 2 Regular Credit Customers so Digital Khata & Portal can be tested immediately
    const [cust1, cust2] = await tx
      .insert(customers)
      .values([
        {
          storeId: store.id,
          customerCode: 'CUST-0001',
          name: 'Md. Karim Uddin',
          phone: '01712000111',
          altPhone: '01812000111',
          village: 'Mirpur',
          area: 'Block C, Section 10',
          road: 'Road 4',
          house: 'House 18',
          customerType: 'REGULAR',
          creditLimit: '10000.00',
          openingBalance: '0.00',
          totalPurchases: '0.00',
          totalPaid: '0.00',
          currentDue: '0.00',
          registrationDate: today,
          notes: 'Regular monthly household buyer',
        },
        {
          storeId: store.id,
          customerCode: 'CUST-0002',
          name: 'Bismillah Tea Stall (Rahim Mia)',
          phone: '01715000222',
          altPhone: '',
          village: 'Mirpur',
          area: 'Main Bazar Mor',
          road: 'Station Road',
          house: 'Shop 7',
          customerType: 'WHOLESALE',
          creditLimit: '25000.00',
          openingBalance: '0.00',
          totalPurchases: '0.00',
          totalPaid: '0.00',
          currentDue: '0.00',
          registrationDate: today,
          notes: 'Buys sugar, condensed milk, biscuits & tea weekly',
        },
      ])
      .returning();

    if (cust1 && cust2) {
      await tx.insert(customerLedger).values([
        {
          storeId: store.id,
          customerId: cust1.id,
          entryDate: today,
          transactionType: 'OPENING_BALANCE',
          debitAmount: '0.00',
          creditAmount: '0.00',
          runningBalance: '0.00',
          description: 'Account opened',
        },
        {
          storeId: store.id,
          customerId: cust2.id,
          entryDate: today,
          transactionType: 'OPENING_BALANCE',
          debitAmount: '0.00',
          creditAmount: '0.00',
          runningBalance: '0.00',
          description: 'Account opened',
        },
      ]);
    }

    // Open initial daily cash register with ৳5,000 opening float
    const [reg] = await tx
      .insert(cashRegisters)
      .values({
        storeId: store.id,
        openedByUid: uid,
        openingBalance: '5000.00',
        status: 'OPEN',
        notes: `Opened automatically for ${ownerName}`,
      })
      .returning();

    await tx.insert(cashTransactions).values({
      storeId: store.id,
      registerId: reg.id,
      txType: 'OPENING',
      amount: '5000.00',
      direction: 'IN',
      referenceType: 'REGISTER',
      referenceId: reg.id,
      description: 'Opening cash float',
      createdByUid: uid,
    });

    return store.id;
  });
}
