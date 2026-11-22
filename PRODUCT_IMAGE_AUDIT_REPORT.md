# MUDIR DOKAN PRO — PRODUCT IMAGE COLLECTION & MAPPING AUDIT REPORT

**Date & Time**: 2026-11-22  
**Manifest Source of Truth**: `mudir_dokan_pro_image_mapping_manifest.csv`  
**Target Image Directory**: `public/images/products/`  
**Image Standard**: 1000x1000 Square WebP, Pure White Background (`#FFFFFF`), 85–90% Centered Subject, Zero Fake AI Packaging.

---

## 1. Executive Summary & KPIs

| Metric | Count | Percentage | Status |
| :--- | :--- | :--- | :--- |
| **Total Catalog SKUs** | **220** | 100.0% | Master Catalog Defined |
| **Verified Authentic Images** | **9** | 4.1% | Checked, Processed & Mapped |
| **Review Required Images** | **11** | 5.0% | Size / Variant Mismatches Flagged |
| **Missing Images (Graceful Fallback)** | **200** | 90.9% | Graceful UI Fallbacks Active |
| **Rights Unclear Images** | **0** | 0.0% | Clear |
| **Broken / Corrupt Files** | **0** | 0.0% | Zero Broken Files |
| **Duplicate Files in Target Dir** | **0** | 0.0% | Zero Duplicates in `public/images/products` |

---

## 2. Verified Images Breakdown

All verified images have been validated to exist at `public/images/products/`, formatted as optimized `1000x1000` square WebP, with pure white (`#FFFFFF`) corners and centered products:

| SKU | Product Name | Brand | Variant | Target File | Source Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `MDK-0022` | Lentil (Masoor Dal) | Loose / Local | 500 g | `public/images/products/MDK-0022_loose_local_lentil_masoor_dal_500_g.webp` | [Source Page](https://commons.wikimedia.org/wiki/File:Split_Red_Lentil.jpg) |
| `MDK-0098` | Potato Crackers | Pran | 100 g | `public/images/products/MDK-0098_pran_potato_crackers_100_g.webp` | [Source Page](https://world.openfoodfacts.org/product/8941100310201/pran-potata-spicy-biscuit) |
| `MDK-0119` | Mango Juice | Pran | 250 ml | `public/images/products/MDK-0119_pran_mango_juice_250_ml.webp` | [Source Page](https://world.openfoodfacts.org/product/8941100310508/pran-frooto-mango-fruit-drink) |
| `MDK-0140` | Classic Coffee | Nescafe | 50 g | `public/images/products/MDK-0140_nescafe_classic_coffee_50_g.webp` | [Source Page](https://world.openfoodfacts.org/product/8901058000183/nescafe-classic-nestle) |
| `MDK-0161` | Eggs | Local | 1 Piece | `public/images/products/MDK-0161_local_eggs_1_piece.webp` | [Source Page](https://commons.wikimedia.org/wiki/File:Egg_on_white_background.jpg) |
| `MDK-0176` | Surf Excel Detergent | Unilever | 500 g | `public/images/products/MDK-0176_unilever_surf_excel_detergent_500_g.webp` | [Source Page](https://world.openfoodfacts.org/product/8901030005724/surf-excel-quick-wash-unilever) |
| `MDK-0184` | Vim Liquid | Unilever | 500 ml | `public/images/products/MDK-0184_unilever_vim_liquid_500_ml.webp` | [Source Page](https://world.openfoodfacts.org/product/8901030018243/vim-dishwash-gel-unilever) |
| `MDK-0187` | Lifebuoy Soap | Unilever | 100 g | `public/images/products/MDK-0187_unilever_lifebuoy_soap_100_g.webp` | [Source Page](https://world.openfoodfacts.org/product/8901030386762/lifebuoy-total-soap-unilever) |
| `MDK-0208` | Coconut Oil | Parachute | 200 ml | `public/images/products/MDK-0208_parachute_coconut_oil_200_ml.webp` | [Source Page](https://world.openfoodfacts.org/product/8901088012019/parachute-pure-coconut-oil-marico) |

---

## 3. Review Required & Size/Brand Mismatches (Strict Authenticity Enforcement)

Per the strict image rules, **no AI-generated fake branded packaging** or **size/brand substitutions** are permitted. The following items from legacy assets or catalogs were flagged for review due to package variant or brand discrepancies:

| Catalog Asset | Asset Description | Manifest Target | Discrepancy Reason | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| `cc-coke-125l.jpg` | Coca-Cola 1.25L | MDK-0129 / MDK-0130 / MDK-0131 (250ml, 500ml, 1L) | Size / Variant Mismatch (1.25L vs 250ml/500ml/1L) | Left missing; awaiting exact manufacturer photo |
| `nes-mag-8pk.jpg` | Maggi 8-Pack (496g) | MDK-0088 / MDK-0089 (70g, 280g) | Variant Mismatch (8-pack 496g vs 70g single / 280g 4-pack) | Left missing; awaiting exact manufacturer photo |
| `pr-mrn-8pk.jpg` | Mr. Noodles 8-Pack | MDK-0090 / MDK-0091 (70g, 280g) | Variant Mismatch (8-pack vs 70g single / 280g 4-pack) | Left missing; awaiting exact manufacturer photo |
| `uni-sun-180m.jpg` | Sunsilk 180ml | MDK-0192 / MDK-0193 / MDK-0194 (80ml, 170ml, 340ml) | Variant Mismatch (180ml vs 170ml/80ml) | Left missing; awaiting exact manufacturer photo |
| `pr-chick-50g.jpg` | PRAN Chicken Masala 50g | MDK-0072 / MDK-0073 (Radhuni Chicken Curry Masala) | Brand Mismatch (PRAN vs Radhuni) | Left missing; awaiting exact manufacturer photo |
| `pr-frt-500m.jpg` | PRAN Frooto 500ml | MDK-0119 (250ml) | Duplicate file reuse of 250ml image (11901 bytes) | Left missing; awaiting exact manufacturer photo |
| `pr-frt-1l.jpg` | PRAN Frooto 1L | MDK-0119 (250ml) | Duplicate file reuse of 250ml image (11901 bytes) | Left missing; awaiting exact manufacturer photo |
| `nes-cer-350g.jpg` | Nestlé Cerelac 350g | None | SKU not present in Mudir Dokan 220 manifest catalog | Left missing; awaiting exact manufacturer photo |
| `pep-lays-45g.jpg` | Lay's Classic 45g | None | SKU not present in Mudir Dokan 220 manifest catalog | Left missing; awaiting exact manufacturer photo |

---

## 4. Duplicate Files Analysis

- **Target Directory (`public/images/products/`)**: **0 duplicate files**. Every file represents an individually verified SKU.
- **Legacy Catalog Directory (`public/catalog/products/`)**: Found duplicate file hash reuse where `pr-frt-500m.jpg` (11,901 bytes) and `pr-frt-1l.jpg` (11,901 bytes) were identical byte copies of `pr-frt-250m.jpg`. These substitutions were rejected and properly marked `REVIEW_REQUIRED`.

---

## 5. UI Fallback & Offline PWA Architecture

1. **Graceful UI Fallbacks**:
   - `src/components/ProductMedia.tsx` was enhanced with `KNOWN_VERIFIED_SKUS` resolution and a fallback badge that displays category icons, initial badges, and bilingual labels without broken image icons.
   - For all 200 missing images, the UI displays a clean, responsive placeholder matching the category accent color.

2. **Offline-First PWA Synchronization**:
   - `vite.config.ts` was updated to include `webp`, `jpg`, and `jpeg` within Workbox precaching glob patterns.
   - Runtime caching was updated to `urlPattern: /\/(?:catalog|uploads|images)\/.*\.(?:png|jpg|jpeg|webp|svg)$/i`.
   - Precached assets increased from 34 entries to 60 entries (7,206 KiB), ensuring full offline availability.

---

## 6. Verification Status by Category

| Category | Total SKUs | Verified | Review Required | Missing |
| :--- | :---: | :---: | :---: | :---: |
| Household & Personal Care | 44 | 4 | 3 | 37 |
| Rice & Grains | 37 | 1 | 0 | 36 |
| Beverages | 36 | 2 | 4 | 30 |
| Snacks & Biscuits | 31 | 1 | 4 | 26 |
| Spices | 26 | 0 | 0 | 26 |
| Dairy, Eggs & Bakery | 17 | 1 | 0 | 16 |
| Cooking Oil | 15 | 0 | 0 | 15 |
| Sugar & Salt | 9 | 0 | 0 | 9 |
| Home & Cleaning | 5 | 0 | 0 | 5 |

---

## 7. Next Steps for Expanding Coverage
1. Obtain official distributor master image assets from Meghna Group (Fresh), City Group (Teer), Square Food & Beverage (Radhuni), and Akij (Mojo).
2. Schedule a batch high-speed studio photo shoot for loose grains (Miniket, Nazirshail, Paijam, Chinigura) against a pure white lightbox.
3. Automatically update `mudir_dokan_pro_image_mapping_manifest.csv` as new authentic packaging batches are verified.
