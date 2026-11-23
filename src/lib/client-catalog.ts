import { getManifestImageForSku, COMPLETE_CATALOG_MANIFEST } from './catalog-manifest.ts';
import type { CachedProduct, CachedCategory, CachedBrand, CachedCustomer } from './offline-db.ts';

export const CLIENT_BD_CATEGORIES = [
  {
    "id": 1,
    "name": "Rice, Dal & Grains",
    "nameBn": "চাল, ডাল ও শস্য",
    "iconName": "wheat",
    "accentColor": "amber",
    "img": "/images/categories/rice_grains.webp"
  },
  {
    "id": 2,
    "name": "Flour, Atta, Maida & Suji",
    "nameBn": "আটা, ময়দা ও সুজি",
    "iconName": "wheat",
    "accentColor": "orange",
    "img": "/images/categories/flour_atta.webp"
  },
  {
    "id": 3,
    "name": "Cooking Oil & Ghee",
    "nameBn": "ভোজ্য তেল ও ঘি",
    "iconName": "droplet",
    "accentColor": "amber",
    "img": "/images/categories/cooking_oil.webp"
  },
  {
    "id": 4,
    "name": "Salt & Sugar",
    "nameBn": "লবণ ও চিনি",
    "iconName": "sparkles",
    "accentColor": "cyan",
    "img": "/images/categories/salt_sugar.webp"
  },
  {
    "id": 5,
    "name": "Spices & Masala",
    "nameBn": "মসলা ও গুঁড়া মসলা",
    "iconName": "flame",
    "accentColor": "rose",
    "img": "/images/categories/spices_masala.webp"
  },
  {
    "id": 6,
    "name": "Tea & Coffee",
    "nameBn": "চা ও কফি",
    "iconName": "coffee",
    "accentColor": "orange",
    "img": "/images/categories/tea_coffee.webp"
  },
  {
    "id": 7,
    "name": "Biscuits & Bakery",
    "nameBn": "বিস্কুট ও বেকারি",
    "iconName": "cookie",
    "accentColor": "amber",
    "img": "/images/categories/biscuits_bakery.webp"
  },
  {
    "id": 8,
    "name": "Snacks & Chips",
    "nameBn": "স্ন্যাকস ও চিপস",
    "iconName": "popcorn",
    "accentColor": "orange",
    "img": "/images/categories/snacks_chips.webp"
  },
  {
    "id": 9,
    "name": "Chocolate & Candy",
    "nameBn": "চকলেট ও ক্যান্ডি",
    "iconName": "candy",
    "accentColor": "pink",
    "img": "/images/categories/chocolate_candy.webp"
  },
  {
    "id": 10,
    "name": "Soft Drinks & Beverages",
    "nameBn": "কোমল পানীয়",
    "iconName": "cup-soda",
    "accentColor": "indigo",
    "img": "/images/categories/soft_drinks.webp"
  },
  {
    "id": 11,
    "name": "Juice & Packaged Drinks",
    "nameBn": "জুস ও প্যাকেট পানীয়",
    "iconName": "citrus",
    "accentColor": "orange",
    "img": "/images/categories/juice_drinks.webp"
  },
  {
    "id": 12,
    "name": "Dairy & Milk Products",
    "nameBn": "দুধ ও দুগ্ধজাত পণ্য",
    "iconName": "milk",
    "accentColor": "cyan",
    "img": "/images/categories/dairy_milk.webp"
  },
  {
    "id": 13,
    "name": "Eggs",
    "nameBn": "ডিম",
    "iconName": "egg",
    "accentColor": "amber",
    "img": "/images/categories/eggs.webp"
  },
  {
    "id": 14,
    "name": "Noodles & Pasta",
    "nameBn": "নুডুলস ও পাস্তা",
    "iconName": "utensils",
    "accentColor": "rose",
    "img": "/images/categories/noodles_pasta.webp"
  },
  {
    "id": 15,
    "name": "Sauces & Condiments",
    "nameBn": "সস ও আচার",
    "iconName": "soup",
    "accentColor": "rose",
    "img": "/images/categories/sauces_condiments.webp"
  },
  {
    "id": 16,
    "name": "Frozen & Packaged Food",
    "nameBn": "ফ্রোজেন ও প্যাকেট খাবার",
    "iconName": "snowflake",
    "accentColor": "cyan",
    "img": "/images/categories/frozen_packaged.webp"
  },
  {
    "id": 17,
    "name": "Baby Food & Baby Care",
    "nameBn": "শিশু খাদ্য ও যত্ন",
    "iconName": "baby",
    "accentColor": "pink",
    "img": "/images/categories/baby_food.webp"
  },
  {
    "id": 18,
    "name": "Soap & Personal Care",
    "nameBn": "সাবান ও ব্যক্তিগত যত্ন",
    "iconName": "heart",
    "accentColor": "purple",
    "img": "/images/categories/soap_personal.webp"
  },
  {
    "id": 19,
    "name": "Shampoo & Hair Care",
    "nameBn": "শ্যাম্পু ও চুলের যত্ন",
    "iconName": "sparkles",
    "accentColor": "purple",
    "img": "/images/categories/shampoo_hair.webp"
  },
  {
    "id": 20,
    "name": "Toothpaste & Oral Care",
    "nameBn": "টুথপেস্ট ও মুখের যত্ন",
    "iconName": "smile",
    "accentColor": "cyan",
    "img": "/images/categories/toothpaste_oral.webp"
  },
  {
    "id": 21,
    "name": "Detergent & Dishwashing",
    "nameBn": "ডিটারজেন্ট ও ডিশওয়াশ",
    "iconName": "spray-can",
    "accentColor": "indigo",
    "img": "/images/categories/detergent_dishwashing.webp"
  },
  {
    "id": 22,
    "name": "Household Cleaning",
    "nameBn": "গৃহস্থালি পরিষ্কারক",
    "iconName": "shield",
    "accentColor": "teal",
    "img": "/images/categories/household_cleaning.webp"
  },
  {
    "id": 23,
    "name": "Tissue & Paper Products",
    "nameBn": "টিস্যু ও পেপার পণ্য",
    "iconName": "layers",
    "accentColor": "emerald",
    "img": "/images/categories/tissue_paper.webp"
  },
  {
    "id": 24,
    "name": "Mosquito Repellent",
    "nameBn": "মশা তাড়ানোর পণ্য",
    "iconName": "zap",
    "accentColor": "rose",
    "img": "/images/categories/mosquito_repellent.webp"
  },
  {
    "id": 25,
    "name": "Water & Bottled Drinks",
    "nameBn": "বোতলজাত পানি",
    "iconName": "droplets",
    "accentColor": "cyan",
    "img": "/images/categories/water_bottled.webp"
  },
  {
    "id": 26,
    "name": "Canned & Packaged Food",
    "nameBn": "টিনজাত ও প্যাকেট খাবার",
    "iconName": "package",
    "accentColor": "indigo",
    "img": "/images/categories/canned_packaged.webp"
  },
  {
    "id": 27,
    "name": "Stationery & Daily Essentials",
    "nameBn": "স্টেশনারি ও নিত্যপ্রয়োজনীয়",
    "iconName": "pen-tool",
    "accentColor": "purple",
    "img": "/images/categories/stationery_daily.webp"
  },
  {
    "id": 28,
    "name": "Miscellaneous",
    "nameBn": "অন্যান্য",
    "iconName": "shopping-bag",
    "accentColor": "emerald",
    "img": "/images/categories/miscellaneous.webp"
  }
];

export const CLIENT_BD_BRANDS = [
    {
      "name": "PRAN",
      "nameBn": "প্রাণ",
      "company": "PRAN-RFL Group",
      "logoUrl": "/catalog/brands/pran.jpg",
      "logoSource": "Official PRAN Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Fresh",
      "nameBn": "ফ্রেশ",
      "company": "Meghna Group",
      "logoUrl": "/catalog/brands/fresh.svg",
      "logoSource": "Official Fresh Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#059669"
    },
    {
      "name": "ACI Pure",
      "nameBn": "এসিআই পিওর",
      "company": "ACI Limited",
      "logoUrl": "/catalog/brands/aci-pure.png",
      "logoSource": "Official ACI Pure Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#2563EB"
    },
    {
      "name": "ACI",
      "nameBn": "এসিআই",
      "company": "ACI Limited",
      "logoUrl": "/catalog/brands/aci.svg",
      "logoSource": "Official ACI Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#2563EB"
    },
    {
      "name": "Square",
      "nameBn": "স্কয়ার",
      "company": "Square Group",
      "logoUrl": "/catalog/brands/square.svg",
      "logoSource": "Official Square Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#1D4ED8"
    },
    {
      "name": "Bashundhara",
      "nameBn": "বসুন্ধরা",
      "company": "Bashundhara Group",
      "logoUrl": "/catalog/brands/bashundhara.svg",
      "logoSource": "Official Bashundhara Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#047857"
    },
    {
      "name": "Akij",
      "nameBn": "আকিজ",
      "company": "Akij Group",
      "logoUrl": "/catalog/brands/akij.svg",
      "logoSource": "Official Akij Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Teer",
      "nameBn": "তীর",
      "company": "City Group",
      "logoUrl": "/catalog/brands/teer.png",
      "logoSource": "Official Teer Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EA580C"
    },
    {
      "name": "Unilever",
      "nameBn": "ইউনিলিভার",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/unilever.svg",
      "logoSource": "Official Unilever Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#1E40AF"
    },
    {
      "name": "Marico",
      "nameBn": "ম্যারিকো",
      "company": "Marico Bangladesh",
      "logoUrl": "/catalog/brands/marico.svg",
      "logoSource": "Official Marico Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0369A1"
    },
    {
      "name": "Nestlé",
      "nameBn": "নেসলে",
      "company": "Nestlé Bangladesh",
      "logoUrl": "/catalog/brands/nestle.svg",
      "logoSource": "Official Nestlé Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#475569"
    },
    {
      "name": "Coca-Cola",
      "nameBn": "কোকা-কোলা",
      "company": "Coca-Cola Bangladesh",
      "logoUrl": "/catalog/brands/coca-cola.svg",
      "logoSource": "Official Coca-Cola Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "PepsiCo",
      "nameBn": "পেপসিকো",
      "company": "Transcom Beverages",
      "logoUrl": "/catalog/brands/pepsico.svg",
      "logoSource": "Official PepsiCo Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#1D4ED8"
    },
    {
      "name": "Maggi",
      "nameBn": "ম্যাগি",
      "company": "Nestlé Bangladesh",
      "logoUrl": "/catalog/brands/maggi.svg",
      "logoSource": "Official Maggi Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EAB308"
    },
    {
      "name": "Lux",
      "nameBn": "লাক্স",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/lux.png",
      "logoSource": "Official Lux Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DB2777"
    },
    {
      "name": "Lifebuoy",
      "nameBn": "লাইফবয়",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/lifebuoy.png",
      "logoSource": "Official Lifebuoy Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Sunsilk",
      "nameBn": "সানসিল্ক",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/sunsilk.png",
      "logoSource": "Official Sunsilk Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EC4899"
    },
    {
      "name": "Dove",
      "nameBn": "ডাভ",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/dove.png",
      "logoSource": "Official Dove Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#2563EB"
    },
    {
      "name": "Pepsodent",
      "nameBn": "পেপসোডেন্ট",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/pepsodent.svg",
      "logoSource": "Official Pepsodent Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#1D4ED8"
    },
    {
      "name": "Closeup",
      "nameBn": "ক্লোজআপ",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/closeup.png",
      "logoSource": "Official Closeup Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Surf Excel",
      "nameBn": "সার্ফ এক্সেল",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/surf-excel.svg",
      "logoSource": "Official Surf Excel Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#1E40AF"
    },
    {
      "name": "Rin",
      "nameBn": "রিন",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/rin.png",
      "logoSource": "Official Rin Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#2563EB"
    },
    {
      "name": "Wheel",
      "nameBn": "হুইল",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/wheel.png",
      "logoSource": "Official Wheel Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Vim",
      "nameBn": "ভিম",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/vim.png",
      "logoSource": "Official Vim Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EAB308"
    },
    {
      "name": "Lays",
      "nameBn": "লেইস",
      "company": "PepsiCo Bangladesh",
      "logoUrl": "/catalog/brands/lays.svg",
      "logoSource": "Official Lays Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EAB308"
    },
    {
      "name": "Olympic",
      "nameBn": "অলিম্পিক",
      "company": "Olympic Industries",
      "logoUrl": "/catalog/brands/olympic.png",
      "logoSource": "Official Olympic Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EA580C"
    },
    {
      "name": "Danish",
      "nameBn": "ড্যানিশ",
      "company": "Partex Star Group",
      "logoUrl": "/catalog/brands/danish.png",
      "logoSource": "Official Danish Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Igloo",
      "nameBn": "ইগলু",
      "company": "Abdul Monem Limited",
      "logoUrl": "/catalog/brands/igloo.png",
      "logoSource": "Official Igloo Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0891B2"
    },
    {
      "name": "Bombay Sweets",
      "nameBn": "বোম্বে সুইটস",
      "company": "Bombay Sweets & Co.",
      "logoUrl": "/catalog/brands/bombay-sweets.png",
      "logoSource": "Official Bombay Sweets Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#D97706"
    },
    {
      "name": "Dekko",
      "nameBn": "ডেক্কো",
      "company": "Dekko Foods",
      "logoUrl": "/catalog/brands/dekko.png",
      "logoSource": "Official Dekko Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#7C3AED"
    },
    {
      "name": "Radhuni",
      "nameBn": "রাঁধুনী",
      "company": "Square Food & Beverage",
      "logoUrl": "/catalog/brands/radhuni.png",
      "logoSource": "Official Radhuni Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Rupchanda",
      "nameBn": "রূপচাঁদা",
      "company": "Bangladesh Edible Oil Ltd",
      "logoUrl": "/catalog/brands/rupchanda.png",
      "logoSource": "Official Rupchanda Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#E11D48"
    },
    {
      "name": "Mojo",
      "nameBn": "মোজো",
      "company": "Akij Food & Beverage",
      "logoUrl": "/catalog/brands/mojo.png",
      "logoSource": "Official Mojo Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#E11D48"
    },
    {
      "name": "Dano",
      "nameBn": "ডানো",
      "company": "Arla Foods Bangladesh",
      "logoUrl": "/catalog/brands/dano.png",
      "logoSource": "Official Dano Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#2563EB"
    },
    {
      "name": "Diploma",
      "nameBn": "ডিপ্লোমা",
      "company": "New Zealand Dairy",
      "logoUrl": "/catalog/brands/diploma.png",
      "logoSource": "Official Diploma Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#059669"
    },
    {
      "name": "Marks",
      "nameBn": "মার্কস",
      "company": "Abul Khair Group",
      "logoUrl": "/catalog/brands/marks.png",
      "logoSource": "Official Marks Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Ispahani",
      "nameBn": "ইস্পাহানি",
      "company": "M. M. Ispahani Limited",
      "logoUrl": "/catalog/brands/ispahani.png",
      "logoSource": "Official Ispahani Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#047857"
    },
    {
      "name": "Finlay",
      "nameBn": "ফিনলে",
      "company": "The Consolidated Tea",
      "logoUrl": "/catalog/brands/finlay.png",
      "logoSource": "Official Finlay Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#B45309"
    },
    {
      "name": "Taaza",
      "nameBn": "তাজা",
      "company": "Unilever Bangladesh",
      "logoUrl": "/catalog/brands/taaza.png",
      "logoSource": "Official Taaza Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#15803D"
    },
    {
      "name": "Haque",
      "nameBn": "হক",
      "company": "Haque Food Industries",
      "logoUrl": "/catalog/brands/haque.png",
      "logoSource": "Official Haque Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Cocola",
      "nameBn": "কোকোলা",
      "company": "Cocola Food Products",
      "logoUrl": "/catalog/brands/cocola.jpg",
      "logoSource": "Official Cocola Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#D97706"
    },
    {
      "name": "Savlon",
      "nameBn": "স্যাভলন",
      "company": "ACI Consumer Brands",
      "logoUrl": "/catalog/brands/savlon.png",
      "logoSource": "Official Savlon Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#059669"
    },
    {
      "name": "Chashi",
      "nameBn": "চাষী",
      "company": "Square Food & Beverage",
      "logoUrl": "/catalog/brands/chashi.png",
      "logoSource": "Official Chashi Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#D97706"
    },
    {
      "name": "Ruchi",
      "nameBn": "রুচি",
      "company": "Square Food & Beverage",
      "logoUrl": "/catalog/brands/ruchi.png",
      "logoSource": "Official Ruchi Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#E11D48"
    },
    {
      "name": "Harpic",
      "nameBn": "হারপিক",
      "company": "Reckitt Benckiser",
      "logoUrl": "/catalog/brands/harpic.png",
      "logoSource": "Official Harpic Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#1E40AF"
    },
    {
      "name": "Dettol",
      "nameBn": "ডেটল",
      "company": "Reckitt Benckiser",
      "logoUrl": "/catalog/brands/dettol.png",
      "logoSource": "Official Dettol Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#16A34A"
    },
    {
      "name": "Lizol",
      "nameBn": "লাইজল",
      "company": "Reckitt Benckiser",
      "logoUrl": "/catalog/brands/lizol.png",
      "logoSource": "Official Lizol Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EA580C"
    },
    {
      "name": "Good Knight",
      "nameBn": "গুড নাইট",
      "company": "Godrej Bangladesh",
      "logoUrl": "/catalog/brands/good-knight.png",
      "logoSource": "Official Good Knight Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Mortein",
      "nameBn": "মর্টিন",
      "company": "Reckitt Benckiser",
      "logoUrl": "/catalog/brands/mortein.png",
      "logoSource": "Official Mortein Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Hit",
      "nameBn": "হিট",
      "company": "Godrej Bangladesh",
      "logoUrl": "/catalog/brands/hit.png",
      "logoSource": "Official Hit Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "SMC",
      "nameBn": "এসএমসি",
      "company": "Social Marketing Company",
      "logoUrl": "/catalog/brands/smc.png",
      "logoSource": "Official SMC Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#2563EB"
    },
    {
      "name": "Matador",
      "nameBn": "মেটাডোর",
      "company": "Matador Group",
      "logoUrl": "/catalog/brands/matador.png",
      "logoSource": "Official Matador Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Milk Vita",
      "nameBn": "মিল্ক ভিটা",
      "company": "Bangladesh Milk Producers",
      "logoUrl": "/catalog/brands/milk-vita.png",
      "logoSource": "Official Milk Vita Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Aarong Dairy",
      "nameBn": "আড়ং ডেইরি",
      "company": "BRAC Enterprises",
      "logoUrl": "/catalog/brands/aarong-dairy.png",
      "logoSource": "Official Aarong Dairy Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Kazi Farms",
      "nameBn": "কাজী ফার্মস",
      "company": "Kazi Farms Group",
      "logoUrl": "/catalog/brands/kazi-farms.png",
      "logoSource": "Official Kazi Farms Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#15803D"
    },
    {
      "name": "Golden Harvest",
      "nameBn": "গোল্ডেন হারভেস্ট",
      "company": "Golden Harvest Agro",
      "logoUrl": "/catalog/brands/golden-harvest.png",
      "logoSource": "Official Golden Harvest Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#D97706"
    },
    {
      "name": "Cadbury",
      "nameBn": "ক্যাডবেরি",
      "company": "Mondelez International",
      "logoUrl": "/catalog/brands/cadbury.svg",
      "logoSource": "Official Cadbury Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#581C87"
    },
    {
      "name": "Colgate",
      "nameBn": "কোলগেট",
      "company": "Colgate-Palmolive",
      "logoUrl": "/catalog/brands/colgate.svg",
      "logoSource": "Official Colgate Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Sensodyne",
      "nameBn": "সেনসোডাইন",
      "company": "Haleon",
      "logoUrl": "/catalog/brands/sensodyne.png",
      "logoSource": "Official Sensodyne Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Meril",
      "nameBn": "মেরিল",
      "company": "Square Toiletries",
      "logoUrl": "/catalog/brands/meril.png",
      "logoSource": "Official Meril Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#059669"
    },
    {
      "name": "Parachute",
      "nameBn": "প্যারাসুট",
      "company": "Marico Bangladesh",
      "logoUrl": "/catalog/brands/parachute.png",
      "logoSource": "Official Parachute Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Jui",
      "nameBn": "জুঁই",
      "company": "Square Toiletries",
      "logoUrl": "/catalog/brands/jui.png",
      "logoSource": "Official Jui Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#047857"
    },
    {
      "name": "Kumarika",
      "nameBn": "কুমারিকা",
      "company": "Hemas Consumer",
      "logoUrl": "/catalog/brands/kumarika.png",
      "logoSource": "Official Kumarika Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#15803D"
    },
    {
      "name": "Tibet",
      "nameBn": "তিব্বত",
      "company": "Kohinoor Chemical",
      "logoUrl": "/catalog/brands/tibet.png",
      "logoSource": "Official Tibet Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#0284C7"
    },
    {
      "name": "Sandalina",
      "nameBn": "স্যান্ডালিনা",
      "company": "Kohinoor Chemical",
      "logoUrl": "/catalog/brands/sandalina.png",
      "logoSource": "Official Sandalina Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#D97706"
    },
    {
      "name": "All Time",
      "nameBn": "অল টাইম",
      "company": "PRAN Foods",
      "logoUrl": "/catalog/brands/all-time.png",
      "logoSource": "Official All Time Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EA580C"
    },
    {
      "name": "Dan Cake",
      "nameBn": "ড্যান কেক",
      "company": "Dan Cake Bangladesh",
      "logoUrl": "/catalog/brands/dan-cake.png",
      "logoSource": "Official Dan Cake Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Britannia",
      "nameBn": "ব্রিটানিয়া",
      "company": "Britannia Industries",
      "logoUrl": "/catalog/brands/britannia.svg",
      "logoSource": "Official Britannia Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Ahmed",
      "nameBn": "আহমেদ",
      "company": "Ahmed Food Products",
      "logoUrl": "/catalog/brands/ahmed.png",
      "logoSource": "Official Ahmed Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "BD Foods",
      "nameBn": "বিডি ফুডস",
      "company": "BD Foods Limited",
      "logoUrl": "/catalog/brands/bd-foods.png",
      "logoSource": "Official BD Foods Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#15803D"
    },
    {
      "name": "Dragon",
      "nameBn": "ড্রাগন",
      "company": "Dragon Matches",
      "logoUrl": "/catalog/brands/dragon.png",
      "logoSource": "Official Dragon Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Supermom",
      "nameBn": "সুপারমম",
      "company": "Square Toiletries",
      "logoUrl": "/catalog/brands/supermom.png",
      "logoSource": "Official Supermom Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#EC4899"
    },
    {
      "name": "Huggies",
      "nameBn": "হাগিস",
      "company": "Kimberly-Clark",
      "logoUrl": "/catalog/brands/huggies.png",
      "logoSource": "Official Huggies Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Napa",
      "nameBn": "নাপা",
      "company": "Beximco Pharmaceuticals",
      "logoUrl": "/catalog/brands/napa.png",
      "logoSource": "Official Napa Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#DC2626"
    },
    {
      "name": "Loose / Local",
      "nameBn": "খোলা / লোকাল",
      "company": "Local Bangladesh Produce",
      "logoUrl": "/catalog/brands/loose-local.svg",
      "logoSource": "Official Loose / Local Brand Mark",
      "logoStatus": "VERIFIED",
      "brandColor": "#059669"
    }
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

  COMPLETE_CATALOG_MANIFEST.forEach((manifestItem) => {
    const id = prodId++;
    const img = manifestItem.imagePath;
    
    // Map manifest category name to UI category
    let mappedCatId = catMap.get(manifestItem.category) || 1;

    // Map brand
    const brandId = brandMap.get(manifestItem.brand) || null;

    const varLower = manifestItem.variant.toLowerCase();
    const isKg = varLower.includes('kg') || varLower.includes('কেজি');
    const isL = varLower.includes('l') || varLower.includes('লিটার');

    products.push({
      id,
      categoryId: mappedCatId,
      brandId,
      sku: manifestItem.sku,
      barcode: `894299${String(id).padStart(7, '0')}`,
      name: manifestItem.productName,
      nameBn: manifestItem.productNameBn || manifestItem.productName,
      variant: manifestItem.variant,
      baseUnit: isKg ? 'Kg' : isL ? 'L' : 'Piece',
      allowDecimalQty: isKg,
      avgCostPrice: '80.00',
      sellingPrice: '95.00',
      currentStock: '50',
      minStock: '10',
      imageUrl: img,
      imageSource: img ? 'Verified Physical Packshot' : 'Pending Verification',
      imageStatus: manifestItem.status,
      isFrequent: id <= 35,
    });
  });

  const customers: CachedCustomer[] = [
    { id: 1, customerCode: 'CUST-0001', name: 'আলমগীর হোসেন', phone: '01711000001', customerType: 'RETAIL', currentDue: '1500.00', creditLimit: '5000.00' },
    { id: 2, customerCode: 'CUST-0002', name: 'মো. রফিকুল ইসলাম', phone: '01812000002', customerType: 'RETAIL', currentDue: '2350.00', creditLimit: '8000.00' },
    { id: 3, customerCode: 'CUST-0003', name: 'আব্দুল করিম', phone: '01913000003', customerType: 'RETAIL', currentDue: '0.00', creditLimit: '3000.00' },
  ];

  return { categories, brands, products, customers };
}
