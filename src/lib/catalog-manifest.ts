// Auto-generated from mudir_dokan_pro_image_mapping_manifest.csv
// Source of truth for Mudir Dokan Pro product image collection and verification

export interface ImageMappingManifestRow {
  sku: string;
  productName: string;
  productNameBn: string;
  brand: string;
  category: string;
  variant: string;
  imageFilename: string;
  targetPath: string;
  imageSearchQuery: string;
  matchRequirement: 'GENERIC_PRODUCT_MATCH' | 'EXACT_BRAND_AND_VARIANT';
  sourcePageUrl: string;
  directImageUrl: string;
  imageStatus: 'VERIFIED' | 'MISSING' | 'REVIEW_REQUIRED' | 'RIGHTS_UNCLEAR';
  verifiedBrand: 'YES' | 'NO';
  verifiedVariant: 'YES' | 'NO';
  whiteBackground: 'YES' | 'NO';
  notes: string;
}

export const PRODUCT_IMAGE_MANIFEST_SUMMARY = {
  totalSkus: 220,
  verifiedCount: 9,
  reviewRequiredCount: 11,
  missingCount: 200,
  verifiedSkus: ["MDK-0022", "MDK-0098", "MDK-0119", "MDK-0140", "MDK-0161", "MDK-0176", "MDK-0184", "MDK-0187", "MDK-0208"],
  reviewRequiredSkus: ["MDK-0088", "MDK-0089", "MDK-0090", "MDK-0091", "MDK-0120", "MDK-0129", "MDK-0130", "MDK-0131", "MDK-0192", "MDK-0193", "MDK-0194"],
};

export const VERIFIED_MANIFEST_MAPPINGS: Record<string, {
  imageUrl: string;
  imageSource: string;
  productName: string;
  brand: string;
  variant: string;
}> = {
  'MDK-0022': {
    imageUrl: '/images/products/MDK-0022_loose_local_lentil_masoor_dal_500_g.webp',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Split_Red_Lentil.jpg',
    productName: "Lentil (Masoor Dal)",
    brand: "Loose / Local",
    variant: "500 g",
  },
  'MDK-0098': {
    imageUrl: '/images/products/MDK-0098_pran_potato_crackers_100_g.webp',
    imageSource: 'https://world.openfoodfacts.org/product/8941100310201/pran-potata-spicy-biscuit',
    productName: "Potato Crackers",
    brand: "Pran",
    variant: "100 g",
  },
  'MDK-0119': {
    imageUrl: '/images/products/MDK-0119_pran_mango_juice_250_ml.webp',
    imageSource: 'https://world.openfoodfacts.org/product/8941100310508/pran-frooto-mango-fruit-drink',
    productName: "Mango Juice",
    brand: "Pran",
    variant: "250 ml",
  },
  'MDK-0140': {
    imageUrl: '/images/products/MDK-0140_nescafe_classic_coffee_50_g.webp',
    imageSource: 'https://world.openfoodfacts.org/product/8901058000183/nescafe-classic-nestle',
    productName: "Classic Coffee",
    brand: "Nescafe",
    variant: "50 g",
  },
  'MDK-0161': {
    imageUrl: '/images/products/MDK-0161_local_eggs_1_piece.webp',
    imageSource: 'https://commons.wikimedia.org/wiki/File:Egg_on_white_background.jpg',
    productName: "Eggs",
    brand: "Local",
    variant: "1 Piece",
  },
  'MDK-0176': {
    imageUrl: '/images/products/MDK-0176_unilever_surf_excel_detergent_500_g.webp',
    imageSource: 'https://world.openfoodfacts.org/product/8901030005724/surf-excel-quick-wash-unilever',
    productName: "Surf Excel Detergent",
    brand: "Unilever",
    variant: "500 g",
  },
  'MDK-0184': {
    imageUrl: '/images/products/MDK-0184_unilever_vim_liquid_500_ml.webp',
    imageSource: 'https://world.openfoodfacts.org/product/8901030018243/vim-dishwash-gel-unilever',
    productName: "Vim Liquid",
    brand: "Unilever",
    variant: "500 ml",
  },
  'MDK-0187': {
    imageUrl: '/images/products/MDK-0187_unilever_lifebuoy_soap_100_g.webp',
    imageSource: 'https://world.openfoodfacts.org/product/8901030386762/lifebuoy-total-soap-unilever',
    productName: "Lifebuoy Soap",
    brand: "Unilever",
    variant: "100 g",
  },
  'MDK-0208': {
    imageUrl: '/images/products/MDK-0208_parachute_coconut_oil_200_ml.webp',
    imageSource: 'https://world.openfoodfacts.org/product/8901088012019/parachute-pure-coconut-oil-marico',
    productName: "Coconut Oil",
    brand: "Parachute",
    variant: "200 ml",
  },
};

export function getManifestImageForSku(sku: string): string | null {
  const norm = sku.toUpperCase();
  return VERIFIED_MANIFEST_MAPPINGS[norm]?.imageUrl ?? null;
}
