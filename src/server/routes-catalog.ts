import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import {
  categories,
  brands,
  products,
  productUnits,
  stockMovements,
  stockAdjustments,
} from '../db/schema.ts';
import { syncVisualCatalogDefaults } from '../db/seed.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { resolveUserStore, logAudit, handleApiError, HttpError } from './context.ts';
import { D, money, qty4 } from '../lib/decimal.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, '../../public/uploads');

export const catalogRouter = Router();
catalogRouter.use(requireAuth);

// POST /api/catalog/upload-image - Save optimized product/brand/store image to disk (never store large blobs in Postgres)
const uploadImageSchema = z.object({
  dataUrl: z.string().min(20),
  kind: z.enum(['product', 'brand', 'store']).default('product'),
});

catalogRouter.post('/upload-image', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = uploadImageSchema.parse(req.body);

    const match = parsed.dataUrl.match(/^data:(image\/(?:webp|jpeg|jpg|png|svg\+xml));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      throw new HttpError(400, 'Invalid image format. Allowed: WebP, JPEG, PNG, or SVG.');
    }

    const mime = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 2 * 1024 * 1024) {
      throw new HttpError(400, 'Image exceeds 2 MB limit. Please upload a smaller image.');
    }

    const ext = mime.includes('webp')
      ? 'webp'
      : mime.includes('png')
        ? 'png'
        : mime.includes('svg')
          ? 'svg'
          : 'jpg';
    const subDir = parsed.kind === 'brand' ? 'brands' : parsed.kind === 'store' ? 'stores' : 'products';
    const targetDir = path.join(UPLOADS_ROOT, subDir);
    fs.mkdirSync(targetDir, { recursive: true });

    const filename = `s${ctx.storeId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(targetDir, filename), buffer);

    const url = `/uploads/${subDir}/${filename}`;
    await logAudit(ctx.storeId, ctx.uid, 'UPLOAD_IMAGE', parsed.kind.toUpperCase(), null, url);
    res.status(201).json({ url, sizeBytes: buffer.length });
  } catch (error) {
    handleApiError(res, error, 'Failed to upload image');
  }
});

// GET /api/catalog/bootstrap - Full catalog & store info for POS & Offline Cache
catalogRouter.get('/bootstrap', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    // Idempotently ensure visual defaults (verified brand logos, category icons, verified SKU images) exist
    await syncVisualCatalogDefaults(ctx.storeId);

    const [cats, brnds, prods, units] = await Promise.all([
      db.select().from(categories).where(eq(categories.storeId, ctx.storeId)).orderBy(categories.sortOrder, categories.name),
      db.select().from(brands).where(eq(brands.storeId, ctx.storeId)).orderBy(brands.name),
      db.select().from(products).where(and(eq(products.storeId, ctx.storeId), eq(products.isActive, true))).orderBy(products.name),
      db.select().from(productUnits).where(eq(productUnits.storeId, ctx.storeId)),
    ]);

    const unitsByProd = new Map<number, typeof units>();
    for (const u of units) {
      const list = unitsByProd.get(u.productId) || [];
      list.push(u);
      unitsByProd.set(u.productId, list);
    }

    const enrichedProducts = prods.map((p) => {
      let parsedGallery: string[] = [];
      try {
        const g = JSON.parse(p.galleryUrls || '[]');
        if (Array.isArray(g)) parsedGallery = g.filter((x) => typeof x === 'string' && x.trim().length > 0);
      } catch {
        parsedGallery = [];
      }
      return {
        ...p,
        gallery: parsedGallery,
        units: unitsByProd.get(p.id) || [],
      };
    });

    res.json({
      user: { uid: ctx.uid, email: ctx.email, name: ctx.userName, role: ctx.role },
      store: ctx.store,
      settings: ctx.settings,
      categories: cats,
      brands: brnds,
      products: enrichedProducts,
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to load store catalog');
  }
});

// Categories CRUD
const categorySchema = z.object({
  name: z.string().min(1).max(120),
  nameBn: z.string().max(120).optional().default(''),
  parentId: z.number().int().nullable().optional(),
  iconName: z.string().max(40).optional().default(''),
  accentColor: z.string().max(30).optional().default('indigo'),
});

catalogRouter.get('/categories', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.storeId, ctx.storeId))
      .orderBy(categories.sortOrder, categories.name);
    res.json(rows);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch categories');
  }
});

catalogRouter.post('/categories', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = categorySchema.parse(req.body);
    const [created] = await db
      .insert(categories)
      .values({
        storeId: ctx.storeId,
        name: parsed.name.trim(),
        nameBn: (parsed.nameBn || '').trim(),
        parentId: parsed.parentId ?? null,
        iconName: (parsed.iconName || '').trim(),
        accentColor: parsed.accentColor || 'indigo',
      })
      .returning();
    await logAudit(ctx.storeId, ctx.uid, 'CREATE_CATEGORY', 'CATEGORY', created.id, created.name);
    res.status(201).json(created);
  } catch (error) {
    handleApiError(res, error, 'Failed to create category');
  }
});

catalogRouter.put('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, 'Invalid category ID');
    const parsed = categorySchema.partial().parse(req.body);

    const [existing] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.storeId, ctx.storeId)))
      .limit(1);
    if (!existing) throw new HttpError(404, 'Category not found');

    const [updated] = await db
      .update(categories)
      .set({
        name: parsed.name ? parsed.name.trim() : existing.name,
        nameBn: parsed.nameBn !== undefined ? parsed.nameBn.trim() : existing.nameBn,
        iconName: parsed.iconName !== undefined ? parsed.iconName.trim() : existing.iconName,
        accentColor: parsed.accentColor !== undefined ? parsed.accentColor : existing.accentColor,
      })
      .where(and(eq(categories.id, id), eq(categories.storeId, ctx.storeId)))
      .returning();

    await logAudit(ctx.storeId, ctx.uid, 'UPDATE_CATEGORY', 'CATEGORY', updated.id, updated.name);
    res.json(updated);
  } catch (error) {
    handleApiError(res, error, 'Failed to update category');
  }
});

// Brands CRUD (with authentic logo management)
const brandSchema = z.object({
  name: z.string().min(1).max(120),
  nameBn: z.string().max(120).optional().default(''),
  company: z.string().max(160).optional().default(''),
  logoUrl: z.string().max(500).nullable().optional(),
  logoSource: z.string().max(250).optional().default(''),
  logoStatus: z.enum(['VERIFIED', 'PENDING', 'UNAVAILABLE']).optional(),
  brandColor: z.string().max(30).optional().default('#4f46e5'),
});

catalogRouter.get('/brands', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db.select().from(brands).where(eq(brands.storeId, ctx.storeId)).orderBy(brands.name);
    res.json(rows);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch brands');
  }
});

catalogRouter.post('/brands', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = brandSchema.parse(req.body);
    const cleanLogo = parsed.logoUrl?.trim() || null;
    const status = parsed.logoStatus || (cleanLogo ? 'VERIFIED' : 'UNAVAILABLE');
    const [created] = await db
      .insert(brands)
      .values({
        storeId: ctx.storeId,
        name: parsed.name.trim(),
        nameBn: (parsed.nameBn || '').trim(),
        company: (parsed.company || '').trim(),
        logoUrl: cleanLogo,
        logoSource: (parsed.logoSource || (cleanLogo ? 'Admin Upload / Official Source' : '')).trim(),
        logoStatus: status,
        brandColor: parsed.brandColor || '#4f46e5',
      })
      .returning();
    await logAudit(ctx.storeId, ctx.uid, 'CREATE_BRAND', 'BRAND', created.id, created.name);
    res.status(201).json(created);
  } catch (error) {
    handleApiError(res, error, 'Failed to create brand');
  }
});

catalogRouter.put('/brands/:id', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, 'Invalid brand ID');
    const parsed = brandSchema.partial().parse(req.body);

    const [existing] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.storeId, ctx.storeId)))
      .limit(1);
    if (!existing) throw new HttpError(404, 'Brand not found');

    const nextLogo = parsed.logoUrl !== undefined ? parsed.logoUrl?.trim() || null : existing.logoUrl;
    const nextStatus =
      parsed.logoStatus ?? (nextLogo ? (existing.logoStatus === 'UNAVAILABLE' ? 'VERIFIED' : existing.logoStatus) : 'UNAVAILABLE');

    const [updated] = await db
      .update(brands)
      .set({
        name: parsed.name ? parsed.name.trim() : existing.name,
        nameBn: parsed.nameBn !== undefined ? parsed.nameBn.trim() : existing.nameBn,
        company: parsed.company !== undefined ? parsed.company.trim() : existing.company,
        logoUrl: nextLogo,
        logoSource: parsed.logoSource !== undefined ? parsed.logoSource.trim() : existing.logoSource,
        logoStatus: nextStatus,
        brandColor: parsed.brandColor ?? existing.brandColor,
        updatedAt: new Date(),
      })
      .where(and(eq(brands.id, id), eq(brands.storeId, ctx.storeId)))
      .returning();

    await logAudit(ctx.storeId, ctx.uid, 'UPDATE_BRAND', 'BRAND', updated.id, updated.name);
    res.json(updated);
  } catch (error) {
    handleApiError(res, error, 'Failed to update brand');
  }
});

catalogRouter.delete('/brands/:id', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER') throw new HttpError(403, 'Cashiers cannot delete brands');
    const id = Number(req.params.id);
    await db
      .update(products)
      .set({ brandId: null, updatedAt: new Date() })
      .where(and(eq(products.brandId, id), eq(products.storeId, ctx.storeId)));
    const deleted = await db
      .delete(brands)
      .where(and(eq(brands.id, id), eq(brands.storeId, ctx.storeId)))
      .returning();
    if (!deleted.length) throw new HttpError(404, 'Brand not found');
    await logAudit(ctx.storeId, ctx.uid, 'DELETE_BRAND', 'BRAND', id, deleted[0].name);
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error, 'Failed to delete brand');
  }
});

// Products CRUD (with full image & gallery asset management)
const productUnitInputSchema = z.object({
  unitName: z.string().min(1),
  unitNameBn: z.string().optional().default(''),
  conversionFactor: z.union([z.string(), z.number()]),
  sellingPrice: z.union([z.string(), z.number()]).nullable().optional(),
  isPurchaseDefault: z.boolean().optional().default(false),
});

const productSchema = z.object({
  categoryId: z.number().int().positive(),
  brandId: z.number().int().positive().nullable().optional(),
  sku: z.string().min(1).max(80),
  barcode: z.string().max(80).optional().default(''),
  name: z.string().min(1).max(180),
  nameBn: z.string().max(180).optional().default(''),
  variant: z.string().max(100).optional().default('Standard'),
  baseUnit: z.string().min(1).max(40).default('Piece'),
  allowDecimalQty: z.boolean().optional().default(false),
  avgCostPrice: z.union([z.string(), z.number()]).default('0'),
  sellingPrice: z.union([z.string(), z.number()]).default('0'),
  currentStock: z.union([z.string(), z.number()]).optional().default('0'),
  minStock: z.union([z.string(), z.number()]).optional().default('5'),
  expiryDate: z.string().nullable().optional(),
  imageUrl: z.string().max(600).nullable().optional(),
  gallery: z.array(z.string().max(600)).optional(),
  imageSource: z.string().max(250).optional().default(''),
  imageStatus: z.enum(['VERIFIED', 'PENDING', 'UNAVAILABLE']).optional(),
  isFrequent: z.boolean().optional().default(false),
  units: z.array(productUnitInputSchema).optional(),
});

catalogRouter.post('/products', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = productSchema.parse(req.body);
    const initialStock = qty4(parsed.currentStock);
    const avgCost = D(parsed.avgCostPrice).toFixed(4);
    const sellPrice = money(parsed.sellingPrice);
    const cleanImg = parsed.imageUrl?.trim() || null;
    const cleanGallery = (parsed.gallery || []).map((g) => g.trim()).filter(Boolean).slice(0, 6);
    const imgStatus = parsed.imageStatus || (cleanImg ? 'VERIFIED' : 'UNAVAILABLE');

    const created = await db.transaction(async (tx) => {
      const [prod] = await tx
        .insert(products)
        .values({
          storeId: ctx.storeId,
          categoryId: parsed.categoryId,
          brandId: parsed.brandId ?? null,
          sku: parsed.sku.trim().toUpperCase(),
          barcode: (parsed.barcode || '').trim(),
          name: parsed.name.trim(),
          nameBn: (parsed.nameBn || '').trim(),
          variant: (parsed.variant || 'Standard').trim(),
          baseUnit: parsed.baseUnit,
          allowDecimalQty: parsed.allowDecimalQty,
          avgCostPrice: avgCost,
          lastPurchasePrice: avgCost,
          sellingPrice: sellPrice,
          currentStock: initialStock,
          minStock: qty4(parsed.minStock),
          expiryDate: parsed.expiryDate || null,
          imageUrl: cleanImg,
          galleryUrls: JSON.stringify(cleanGallery),
          imageSource: (parsed.imageSource || (cleanImg ? 'Admin Upload / Official Catalog' : '')).trim(),
          imageStatus: imgStatus,
          imageUpdatedAt: cleanImg ? new Date() : null,
          isFrequent: parsed.isFrequent,
        })
        .returning();

      if (parsed.units && parsed.units.length > 0) {
        await tx.insert(productUnits).values(
          parsed.units
            .filter((u) => D(u.conversionFactor).gt(0))
            .map((u) => ({
              storeId: ctx.storeId,
              productId: prod.id,
              unitName: u.unitName,
              unitNameBn: u.unitNameBn || '',
              conversionFactor: qty4(u.conversionFactor),
              sellingPrice: u.sellingPrice ? money(u.sellingPrice) : null,
              isPurchaseDefault: Boolean(u.isPurchaseDefault),
            }))
        );
      }

      if (D(initialStock).gt(0)) {
        await tx.insert(stockMovements).values({
          storeId: ctx.storeId,
          productId: prod.id,
          movementType: 'OPENING',
          quantityDelta: initialStock,
          unitCost: avgCost,
          balanceAfter: initialStock,
          referenceType: 'SEED',
          referenceId: prod.id,
          notes: 'Initial opening stock on product creation',
          createdByUid: ctx.uid,
        });
      }

      return prod;
    });

    await logAudit(ctx.storeId, ctx.uid, 'CREATE_PRODUCT', 'PRODUCT', created.id, `${created.sku} - ${created.name}`);
    res.status(201).json(created);
  } catch (error) {
    handleApiError(res, error, 'Failed to create product (SKU may already exist)');
  }
});

catalogRouter.put('/products/:id', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new HttpError(400, 'Invalid product ID');

    const parsed = productSchema.partial().parse(req.body);
    const [existing] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.storeId, ctx.storeId)))
      .limit(1);
    if (!existing) throw new HttpError(404, 'Product not found');

    const nextImg = parsed.imageUrl !== undefined ? parsed.imageUrl?.trim() || null : existing.imageUrl;
    const imgChanged = parsed.imageUrl !== undefined && nextImg !== existing.imageUrl;
    const nextGallery =
      parsed.gallery !== undefined
        ? JSON.stringify(parsed.gallery.map((g) => g.trim()).filter(Boolean).slice(0, 6))
        : existing.galleryUrls;
    const nextImgStatus =
      parsed.imageStatus ??
      (nextImg ? (existing.imageStatus === 'UNAVAILABLE' ? 'VERIFIED' : existing.imageStatus) : 'UNAVAILABLE');

    const updated = await db.transaction(async (tx) => {
      // Never modify currentStock silently via PUT /products; stock must go through stock adjustments or purchases
      const [prod] = await tx
        .update(products)
        .set({
          categoryId: parsed.categoryId ?? existing.categoryId,
          brandId: parsed.brandId !== undefined ? parsed.brandId : existing.brandId,
          sku: parsed.sku ? parsed.sku.trim().toUpperCase() : existing.sku,
          barcode: parsed.barcode !== undefined ? parsed.barcode.trim() : existing.barcode,
          name: parsed.name ? parsed.name.trim() : existing.name,
          nameBn: parsed.nameBn !== undefined ? parsed.nameBn.trim() : existing.nameBn,
          variant: parsed.variant !== undefined ? parsed.variant.trim() : existing.variant,
          baseUnit: parsed.baseUnit ?? existing.baseUnit,
          allowDecimalQty: parsed.allowDecimalQty ?? existing.allowDecimalQty,
          avgCostPrice: parsed.avgCostPrice !== undefined ? D(parsed.avgCostPrice).toFixed(4) : existing.avgCostPrice,
          sellingPrice: parsed.sellingPrice !== undefined ? money(parsed.sellingPrice) : existing.sellingPrice,
          minStock: parsed.minStock !== undefined ? qty4(parsed.minStock) : existing.minStock,
          expiryDate: parsed.expiryDate !== undefined ? parsed.expiryDate : existing.expiryDate,
          imageUrl: nextImg,
          galleryUrls: nextGallery,
          imageSource: parsed.imageSource !== undefined ? parsed.imageSource.trim() : existing.imageSource,
          imageStatus: nextImgStatus,
          imageUpdatedAt: imgChanged || parsed.imageStatus ? new Date() : existing.imageUpdatedAt,
          isFrequent: parsed.isFrequent ?? existing.isFrequent,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, id), eq(products.storeId, ctx.storeId)))
        .returning();

      if (parsed.units !== undefined) {
        await tx.delete(productUnits).where(and(eq(productUnits.productId, id), eq(productUnits.storeId, ctx.storeId)));
        const validUnits = parsed.units.filter((u) => D(u.conversionFactor).gt(0));
        if (validUnits.length > 0) {
          await tx.insert(productUnits).values(
            validUnits.map((u) => ({
              storeId: ctx.storeId,
              productId: id,
              unitName: u.unitName,
              unitNameBn: u.unitNameBn || '',
              conversionFactor: qty4(u.conversionFactor),
              sellingPrice: u.sellingPrice ? money(u.sellingPrice) : null,
              isPurchaseDefault: Boolean(u.isPurchaseDefault),
            }))
          );
        }
      }

      return prod;
    });

    await logAudit(ctx.storeId, ctx.uid, 'UPDATE_PRODUCT', 'PRODUCT', updated.id, `${updated.sku} updated`);
    res.json(updated);
  } catch (error) {
    handleApiError(res, error, 'Failed to update product');
  }
});

catalogRouter.delete('/products/:id', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER') throw new HttpError(403, 'Cashiers cannot delete products');
    const id = Number(req.params.id);
    const [updated] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.storeId, ctx.storeId)))
      .returning();
    if (!updated) throw new HttpError(404, 'Product not found');
    await logAudit(ctx.storeId, ctx.uid, 'ARCHIVE_PRODUCT', 'PRODUCT', id, updated.name);
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error, 'Failed to archive product');
  }
});

// Inventory Adjustments (Never silent - always logs stock_movements & stock_adjustments)
const adjustmentSchema = z.object({
  productId: z.number().int().positive(),
  adjustmentType: z.enum(['INCREASE', 'DECREASE', 'DAMAGE', 'EXPIRED']),
  quantity: z.union([z.string(), z.number()]),
  reason: z.string().min(2).max(250),
});

catalogRouter.post('/inventory/adjust', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER') throw new HttpError(403, 'Manager or Owner permission required for stock adjustments');
    const parsed = adjustmentSchema.parse(req.body);
    const qty = D(parsed.quantity);
    if (qty.lte(0)) throw new HttpError(400, 'Adjustment quantity must be greater than zero');

    const result = await db.transaction(async (tx) => {
      const [prod] = await tx
        .select()
        .from(products)
        .where(and(eq(products.id, parsed.productId), eq(products.storeId, ctx.storeId)))
        .limit(1);
      if (!prod) throw new HttpError(404, 'Product not found');

      const delta = parsed.adjustmentType === 'INCREASE' ? qty : qty.negated();
      const newStock = D(prod.currentStock).plus(delta);
      if (newStock.lt(0) && !ctx.settings.allowNegativeStock) {
        throw new HttpError(400, `Insufficient stock. Available: ${prod.currentStock}`);
      }

      const [adj] = await tx
        .insert(stockAdjustments)
        .values({
          storeId: ctx.storeId,
          productId: prod.id,
          adjustmentType: parsed.adjustmentType,
          quantity: qty4(qty),
          unitCost: prod.avgCostPrice,
          reason: parsed.reason.trim(),
          createdByUid: ctx.uid,
        })
        .returning();

      await tx
        .update(products)
        .set({ currentStock: qty4(newStock), updatedAt: new Date() })
        .where(eq(products.id, prod.id));

      const movementType =
        parsed.adjustmentType === 'INCREASE'
          ? 'ADJUSTMENT_IN'
          : parsed.adjustmentType === 'DAMAGE'
            ? 'DAMAGE'
            : parsed.adjustmentType === 'EXPIRED'
              ? 'EXPIRED'
              : 'ADJUSTMENT_OUT';

      await tx.insert(stockMovements).values({
        storeId: ctx.storeId,
        productId: prod.id,
        movementType,
        quantityDelta: qty4(delta),
        unitCost: prod.avgCostPrice,
        balanceAfter: qty4(newStock),
        referenceType: 'ADJUSTMENT',
        referenceId: adj.id,
        notes: parsed.reason.trim(),
        createdByUid: ctx.uid,
      });

      return { adjustment: adj, newStock: qty4(newStock) };
    });

    await logAudit(
      ctx.storeId,
      ctx.uid,
      `STOCK_${parsed.adjustmentType}`,
      'PRODUCT',
      parsed.productId,
      `${parsed.adjustmentType} ${qty.toString()} (${parsed.reason})`
    );
    res.status(201).json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to adjust inventory');
  }
});

// Inventory Movements History & Valuation Summary
catalogRouter.get('/inventory/movements', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const productId = req.query.productId ? Number(req.query.productId) : null;
    const condition = productId
      ? and(eq(stockMovements.storeId, ctx.storeId), eq(stockMovements.productId, productId))
      : eq(stockMovements.storeId, ctx.storeId);

    const rows = await db
      .select({
        id: stockMovements.id,
        productId: stockMovements.productId,
        productName: products.name,
        variant: products.variant,
        sku: products.sku,
        baseUnit: products.baseUnit,
        imageUrl: products.imageUrl,
        movementType: stockMovements.movementType,
        quantityDelta: stockMovements.quantityDelta,
        unitCost: stockMovements.unitCost,
        balanceAfter: stockMovements.balanceAfter,
        referenceType: stockMovements.referenceType,
        referenceId: stockMovements.referenceId,
        notes: stockMovements.notes,
        createdAt: stockMovements.createdAt,
      })
      .from(stockMovements)
      .innerJoin(products, eq(stockMovements.productId, products.id))
      .where(condition)
      .orderBy(desc(stockMovements.createdAt))
      .limit(200);

    const [valuation] = await db
      .select({
        totalValue: sql<string>`COALESCE(SUM(GREATEST(${products.currentStock}, 0) * ${products.avgCostPrice}), 0)`,
        totalRetailValue: sql<string>`COALESCE(SUM(GREATEST(${products.currentStock}, 0) * ${products.sellingPrice}), 0)`,
        totalSkus: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(and(eq(products.storeId, ctx.storeId), eq(products.isActive, true)));

    res.json({
      movements: rows,
      valuation: {
        totalCostValue: money(valuation?.totalValue || 0),
        totalRetailValue: money(valuation?.totalRetailValue || 0),
        totalSkus: Number(valuation?.totalSkus || 0),
      },
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch stock movements');
  }
});
