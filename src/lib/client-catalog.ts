import { getManifestImageForSku, COMPLETE_CATALOG_MANIFEST } from './catalog-manifest.ts';
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
  { name: 'Rupchanda', nameBn: 'রূপচাঁদা', company: 'Bangladesh Edible Oil Ltd', logoUrl: '/catalog/brands/rupchanda.png', logoSource: 'Official Rupchanda Logo', logoStatus: 'VERIFIED', brandColor: '#E11D48' },
  { name: 'Mojo', nameBn: 'মোজো', company: 'Akij Food & Beverage', logoUrl: '/catalog/brands/mojo.png', logoSource: 'Official Mojo Logo', logoStatus: 'VERIFIED', brandColor: '#E11D48' },
  { name: 'Dano', nameBn: 'ডানো', company: 'Arla Foods Bangladesh', logoUrl: '/catalog/brands/dano.png', logoSource: 'Official Dano Logo', logoStatus: 'VERIFIED', brandColor: '#2563EB' },
  { name: 'Diploma', nameBn: 'ডিপ্লোমা', company: 'New Zealand Dairy', logoUrl: '/catalog/brands/diploma.png', logoSource: 'Official Diploma Logo', logoStatus: 'VERIFIED', brandColor: '#059669' },
  { name: 'Marks', nameBn: 'মার্কস', company: 'Abul Khair Group', logoUrl: '/catalog/brands/marks.png', logoSource: 'Official Marks Logo', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Ispahani', nameBn: 'ইস্পাহানি', company: 'M. M. Ispahani Limited', logoUrl: '/catalog/brands/ispahani.png', logoSource: 'Official Ispahani Logo', logoStatus: 'VERIFIED', brandColor: '#047857' },
  { name: 'Finlay', nameBn: 'ফিনলে', company: 'The Consolidated Tea', logoUrl: '/catalog/brands/finlay.png', logoSource: 'Official Finlay Logo', logoStatus: 'VERIFIED', brandColor: '#B45309' },
  { name: 'Taaza', nameBn: 'তাজা', company: 'Unilever Bangladesh', logoUrl: '/catalog/brands/taaza.png', logoSource: 'Official Taaza Logo', logoStatus: 'VERIFIED', brandColor: '#15803D' },
  { name: 'Haque', nameBn: 'হক', company: 'Haque Food Industries', logoUrl: '/catalog/brands/haque.png', logoSource: 'Official Haque Logo', logoStatus: 'VERIFIED', brandColor: '#DC2626' },
  { name: 'Cocola', nameBn: 'কোকোলা', company: 'Cocola Food Products', logoUrl: '/catalog/brands/cocola.png', logoSource: 'Official Cocola Logo', logoStatus: 'VERIFIED', brandColor: '#D97706' },
  { name: 'Savlon', nameBn: 'স্যাভলন', company: 'ACI Consumer Brands', logoUrl: '/catalog/brands/savlon.png', logoSource: 'Official Savlon Brand Logo', logoStatus: 'VERIFIED', brandColor: '#059669' },
];

export function getClientDemoCatalog() {
  const categories: CachedCategory[] = CLIENT_BD_CATEGORIES.map((c, i) => ({
    id: i + 1,
    name: c.name,
    nameBn: c.nameBn,
    iconName: c.iconName,
    accentColor: c.accentColor,
    displayOrder: i + 1,
    isActive: true,
  }));

  const brands: CachedBrand[] = CLIENT_BD_BRANDS.map((b, i) => ({
    id: i + 1,
    name: b.name,
    nameBn: b.nameBn,
    company: b.company,
    logoUrl: b.logoUrl,
    logoSource: b.logoSource,
    logoStatus: b.logoStatus,
    brandColor: b.brandColor,
    isPopular: true,
  }));

  const catMap = new Map<string, number>();
  categories.forEach((c) => {
    catMap.set(c.name, c.id);
    if (c.nameBn) catMap.set(c.nameBn, c.id);
  });

  const brandMap = new Map<string, number>();
  brands.forEach((b) => {
    brandMap.set(b.name, b.id);
    if (b.nameBn) brandMap.set(b.nameBn, b.id);
  });

  const products: CachedProduct[] = [];
  let prodId = 1;

  // Add all 220 Master MDK Manifest SKUs
  COMPLETE_CATALOG_MANIFEST.forEach((manifestItem) => {
    const id = prodId++;
    const img = manifestItem.imagePath; // Will be non-null ONLY for verified genuine images
    
    // Map manifest category name to UI category
    let mappedCatId = 1;
    const catLower = manifestItem.category.toLowerCase();
    if (catLower.includes('rice') || catLower.includes('grain')) mappedCatId = catMap.get('Rice, Dal & Grains') || 1;
    else if (catLower.includes('flour') || catLower.includes('atta') || catLower.includes('suji')) mappedCatId = catMap.get('Flour, Atta, Maida & Suji') || 2;
    else if (catLower.includes('oil') || catLower.includes('ghee')) mappedCatId = catMap.get('Cooking Oil & Ghee') || 3;
    else if (catLower.includes('sugar') || catLower.includes('salt')) mappedCatId = catMap.get('Salt & Sugar') || 4;
    else if (catLower.includes('spice')) mappedCatId = catMap.get('Spices & Masala') || 5;
    else if (catLower.includes('beverage')) mappedCatId = catMap.get('Soft Drinks & Beverages') || 10;
    else if (catLower.includes('biscuit') || catLower.includes('snack')) mappedCatId = catMap.get('Biscuits & Bakery') || 7;
    else if (catLower.includes('dairy') || catLower.includes('milk') || catLower.includes('egg')) mappedCatId = catMap.get('Dairy & Milk Products') || 12;
    else if (catLower.includes('clean') || catLower.includes('detergent') || catLower.includes('soap')) mappedCatId = catMap.get('Detergent & Dishwashing') || 21;
    else if (catLower.includes('personal') || catLower.includes('care')) mappedCatId = catMap.get('Soap & Personal Care') || 18;

    // Map brand
    const brandId = brandMap.get(manifestItem.brand) || null;

    products.push({
      id,
      categoryId: mappedCatId,
      brandId,
      sku: manifestItem.sku,
      barcode: `894299${String(id).padStart(7, '0')}`,
      name: manifestItem.productName,
      nameBn: manifestItem.productNameBn || manifestItem.productName,
      variant: manifestItem.variant,
      baseUnit: manifestItem.variant.toLowerCase().includes('kg') ? 'Kg' : manifestItem.variant.toLowerCase().includes('l') ? 'L' : 'Piece',
      allowDecimalQty: manifestItem.variant.toLowerCase().includes('kg'),
      avgCostPrice: '80.00',
      sellingPrice: '95.00',
      currentStock: '50',
      minStock: '10',
      imageUrl: img,
      imageSource: img ? 'Chaldal Verified Physical Packshot' : 'Pending Verification',
      imageStatus: manifestItem.status,
      isFrequent: id <= 25,
    });
  });

  const customers: CachedCustomer[] = [
    { id: 1, name: 'আলমগীর হোসেন', phone: '01711000001', address: 'দোকান রোড, মিরপুর-১০', currentDue: '1500.00', totalPurchase: '18500.00', creditLimit: '5000.00', isBlacklisted: false },
    { id: 2, name: 'মো. রফিকুল ইসলাম', phone: '01812000002', address: 'রোড ২, ধানমন্ডি', currentDue: '2350.00', totalPurchase: '32000.00', creditLimit: '8000.00', isBlacklisted: false },
    { id: 3, name: 'আব্দুল করিম', phone: '01913000003', address: 'বাজার গলি, উত্তরা সেক্টর ৩', currentDue: '0.00', totalPurchase: '12400.00', creditLimit: '3000.00', isBlacklisted: false },
  ];

  return { categories, brands, products, customers };
}
