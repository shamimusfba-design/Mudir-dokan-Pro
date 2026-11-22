import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  storeSettings,
  categories,
  brands,
  products,
  productUnits,
  stockMovements,
  stockAdjustments,
  suppliers,
  purchases,
  purchaseItems,
  purchaseReturns,
  purchaseReturnItems,
  supplierPayments,
  supplierLedger,
  customers,
  sales,
  saleItems,
  payments,
  salesReturns,
  salesReturnItems,
  customerPayments,
  paymentAllocations,
  ledgerAdjustments,
  customerLedger,
  dueReminders,
  customerDisputes,
  expenseCategories,
  expenses,
  cashRegisters,
  cashTransactions,
} from './schema.ts';
import { D, money, qty4, dhakaTodayISO } from '../lib/decimal.ts';
import { VERIFIED_PRODUCT_MEDIA, BD_CATEGORIES, BD_BRANDS } from './seed.ts';
import { getManifestImageForSku } from '../lib/catalog-manifest.ts';
import {
  EXTRA_DEMO_BRANDS,
  DEMO_PRODUCTS,
  DEMO_SUPPLIERS,
  DEMO_EXPENSE_CATEGORIES,
  buildDemoCustomers,
} from './demo-catalog.ts';

// Deterministic PRNG (Mulberry32) so seeded data is repeatable and auditable
function createRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemoMonthWindow {
  year: number;
  month: number; // 1..12
  ym: string; // YYYY-MM
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  days: string[]; // All YYYY-MM-DD in this month
  targetSales: number;
}

export interface SixMonthDemoWindow {
  periodStart: string;
  periodEnd: string;
  openingDate: string;
  months: DemoMonthWindow[];
  allDays: string[];
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addDaysISO(iso: string, deltaDays: number): string {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

function dhakaTimestamp(dateISO: string, hour: number, minute: number, second = 0): Date {
  const hh = pad2(hour);
  const mm = pad2(minute);
  const ss = pad2(second);
  return new Date(`${dateISO}T${hh}:${mm}:${ss}+06:00`);
}

function dayOfWeekUTC(dateISO: string): number {
  return new Date(`${dateISO}T00:00:00Z`).getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
}

/**
 * Computes the latest 6 completed calendar months relative to Asia/Dhaka today.
 * Example: if today is 2026-11-21, returns May 2026 .. October 2026 (2026-05-01 to 2026-10-31).
 */
export function getSixMonthDemoWindow(): SixMonthDemoWindow {
  const today = dhakaTodayISO();
  const [yStr, mStr] = today.split('-');
  const curYear = Number(yStr);
  const curMonth = Number(mStr); // 1..12

  // Natural BD seasonal monthly targets summing to exactly ৳60,00,000 (~৳10,00,000/month)
  const monthlyTargets = [985000, 1035000, 980000, 995000, 985000, 1020000];
  const months: DemoMonthWindow[] = [];

  for (let i = 6; i >= 1; i--) {
    let m = curMonth - i;
    let y = curYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const dim = daysInMonth(y, m);
    const ym = `${y}-${pad2(m)}`;
    const days: string[] = [];
    for (let d = 1; d <= dim; d++) {
      days.push(`${ym}-${pad2(d)}`);
    }
    months.push({
      year: y,
      month: m,
      ym,
      startDate: days[0],
      endDate: days[days.length - 1],
      days,
      targetSales: monthlyTargets[6 - i],
    });
  }

  const allDays = months.flatMap((m) => m.days);
  const periodStart = allDays[0];
  const periodEnd = allDays[allDays.length - 1];
  const openingDate = addDaysISO(periodStart, -1);

  return { periodStart, periodEnd, openingDate, months, allDays };
}

async function batchInsert<T extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  rows: T[],
  chunkSize = 1200
): Promise<void> {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await tx.insert(table).values(rows.slice(i, i + chunkSize));
  }
}

async function batchInsertReturningIds<T extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  rows: T[],
  chunkSize = 1200
): Promise<number[]> {
  if (rows.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const res = await tx
      .insert(table)
      .values(rows.slice(i, i + chunkSize))
      .returning({ id: table.id });
    for (const r of res as Array<{ id: number }>) out.push(r.id);
  }
  return out;
}

async function batchInsertReturning<T extends Record<string, unknown>, R>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  rows: T[],
  chunkSize = 400
): Promise<R[]> {
  if (rows.length === 0) return [];
  const out: R[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const res = await tx.insert(table).values(rows.slice(i, i + chunkSize)).returning();
    out.push(...(res as R[]));
  }
  return out;
}

/**
 * Safely deletes ONLY demo-tagged records (is_demo = true) for a store in strict FK order.
 * Preserves 100% of real user records (is_demo = false) and recalculates balances for surviving non-demo entities.
 */
export async function resetDemoData(storeId: number): Promise<{ removedDemoData: boolean }> {
  await db.transaction(async (tx) => {
    // 1. Delete dependent transaction tables (children cascade via FK or deleted explicitly)
    await tx.delete(paymentAllocations).where(and(eq(paymentAllocations.storeId, storeId), eq(paymentAllocations.isDemo, true)));
    await tx.delete(customerDisputes).where(and(eq(customerDisputes.storeId, storeId), eq(customerDisputes.isDemo, true)));
    await tx.delete(dueReminders).where(and(eq(dueReminders.storeId, storeId), eq(dueReminders.isDemo, true)));
    await tx.delete(customerLedger).where(and(eq(customerLedger.storeId, storeId), eq(customerLedger.isDemo, true)));
    await tx.delete(ledgerAdjustments).where(and(eq(ledgerAdjustments.storeId, storeId), eq(ledgerAdjustments.isDemo, true)));
    await tx.delete(salesReturns).where(and(eq(salesReturns.storeId, storeId), eq(salesReturns.isDemo, true)));
    await tx.delete(payments).where(and(eq(payments.storeId, storeId), eq(payments.isDemo, true)));
    await tx.delete(customerPayments).where(and(eq(customerPayments.storeId, storeId), eq(customerPayments.isDemo, true)));
    await tx.delete(sales).where(and(eq(sales.storeId, storeId), eq(sales.isDemo, true)));

    await tx.delete(purchaseReturns).where(and(eq(purchaseReturns.storeId, storeId), eq(purchaseReturns.isDemo, true)));
    await tx.delete(supplierLedger).where(and(eq(supplierLedger.storeId, storeId), eq(supplierLedger.isDemo, true)));
    await tx.delete(supplierPayments).where(and(eq(supplierPayments.storeId, storeId), eq(supplierPayments.isDemo, true)));
    await tx.delete(purchases).where(and(eq(purchases.storeId, storeId), eq(purchases.isDemo, true)));

    await tx.delete(stockAdjustments).where(and(eq(stockAdjustments.storeId, storeId), eq(stockAdjustments.isDemo, true)));
    await tx.delete(stockMovements).where(and(eq(stockMovements.storeId, storeId), eq(stockMovements.isDemo, true)));
    await tx.delete(expenses).where(and(eq(expenses.storeId, storeId), eq(expenses.isDemo, true)));
    await tx.delete(cashTransactions).where(and(eq(cashTransactions.storeId, storeId), eq(cashTransactions.isDemo, true)));
    await tx.delete(cashRegisters).where(and(eq(cashRegisters.storeId, storeId), eq(cashRegisters.isDemo, true)));

    // 2. Delete demo-only master entities (guarded so any entity referenced by real non-demo records is preserved)
    await tx.delete(customers).where(
      and(
        eq(customers.storeId, storeId),
        eq(customers.isDemo, true),
        sql`NOT EXISTS (SELECT 1 FROM sales s WHERE s.customer_id = ${customers.id} AND s.is_demo = false)`
      )
    );
    await tx.delete(suppliers).where(
      and(
        eq(suppliers.storeId, storeId),
        eq(suppliers.isDemo, true),
        sql`NOT EXISTS (SELECT 1 FROM purchases p WHERE p.supplier_id = ${suppliers.id} AND p.is_demo = false)`
      )
    );
    await tx.delete(products).where(
      and(
        eq(products.storeId, storeId),
        eq(products.isDemo, true),
        sql`NOT EXISTS (SELECT 1 FROM sale_items si WHERE si.product_id = ${products.id})`,
        sql`NOT EXISTS (SELECT 1 FROM purchase_items pi WHERE pi.product_id = ${products.id})`,
        sql`NOT EXISTS (SELECT 1 FROM stock_movements sm WHERE sm.product_id = ${products.id})`
      )
    );
    await tx.delete(expenseCategories).where(
      and(
        eq(expenseCategories.storeId, storeId),
        eq(expenseCategories.isDemo, true),
        sql`NOT EXISTS (SELECT 1 FROM expenses e WHERE e.category_id = ${expenseCategories.id})`
      )
    );

    // 3. Recompute stock & WAC for surviving non-demo products in ONE bulk SQL update
    const survivingProducts = await tx
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.isDemo, false)));

    if (survivingProducts.length > 0) {
      const survivingIds = survivingProducts.map((p) => p.id);
      const remainingMoves = await tx
        .select()
        .from(stockMovements)
        .where(and(eq(stockMovements.storeId, storeId), inArray(stockMovements.productId, survivingIds)))
        .orderBy(stockMovements.id);

      const movesByProd = new Map<number, typeof remainingMoves>();
      for (const m of remainingMoves) {
        const list = movesByProd.get(m.productId) || [];
        list.push(m);
        movesByProd.set(m.productId, list);
      }

      const updates: Array<{ id: number; stock: string; avg: string; last: string }> = [];
      for (const p of survivingProducts) {
        const moves = movesByProd.get(p.id) || [];
        if (moves.length === 0) continue;
        let stock = D(0);
        let totalVal = D(0);
        let lastCost = D(p.lastPurchasePrice);
        for (const m of moves) {
          const delta = D(m.quantityDelta);
          const uCost = D(m.unitCost);
          if (delta.gt(0)) {
            totalVal = totalVal.plus(delta.times(uCost));
            stock = stock.plus(delta);
            if (m.movementType === 'PURCHASE_IN' || m.movementType === 'OPENING') lastCost = uCost;
          } else {
            const curAvg = stock.gt(0) ? totalVal.dividedBy(stock) : uCost;
            stock = stock.plus(delta);
            totalVal = stock.gt(0) ? stock.times(curAvg) : D(0);
          }
        }
        const avg = stock.gt(0) ? totalVal.dividedBy(stock) : lastCost;
        updates.push({
          id: p.id,
          stock: qty4(stock),
          avg: avg.toFixed(4),
          last: lastCost.toFixed(4),
        });
      }

      if (updates.length > 0) {
        const tuples = sql.join(
          updates.map((u) => sql`(${u.id}::int, ${u.stock}::numeric(14,4), ${u.avg}::numeric(14,4), ${u.last}::numeric(14,4))`),
          sql`, `
        );
        await tx.execute(sql`
          UPDATE products AS p
          SET current_stock = v.stock, avg_cost_price = v.avg, last_purchase_price = v.last, updated_at = NOW()
          FROM (VALUES ${tuples}) AS v(id, stock, avg, last)
          WHERE p.id = v.id
        `);
      }
    }

    // 4. Recompute balances for surviving non-demo customers
    await tx.execute(sql`
      UPDATE customers c
      SET
        total_purchases = COALESCE(agg.debits, 0),
        total_paid = COALESCE(agg.credits, 0),
        current_due = COALESCE(agg.net_due, c.opening_balance),
        updated_at = NOW()
      FROM (
        SELECT
          c2.id,
          COALESCE(SUM(CASE WHEN l.transaction_type = 'CREDIT_SALE' THEN l.debit_amount ELSE 0 END), 0)::numeric(14,2) AS debits,
          COALESCE(SUM(CASE WHEN l.transaction_type IN ('PARTIAL_PAYMENT','FULL_PAYMENT') THEN l.credit_amount ELSE 0 END), 0)::numeric(14,2) AS credits,
          CASE WHEN COUNT(l.id) > 0 THEN COALESCE(SUM(l.debit_amount - l.credit_amount), 0)::numeric(14,2) ELSE c2.opening_balance END AS net_due
        FROM customers c2
        LEFT JOIN customer_ledger l ON l.customer_id = c2.id
        WHERE c2.store_id = ${storeId} AND c2.is_demo = false
        GROUP BY c2.id, c2.opening_balance
      ) agg
      WHERE c.id = agg.id
    `);

    // 5. Ensure at least one OPEN register exists if non-demo registers were all closed
    const openRegs = await tx
      .select({ id: cashRegisters.id })
      .from(cashRegisters)
      .where(and(eq(cashRegisters.storeId, storeId), eq(cashRegisters.status, 'OPEN')));
    if (openRegs.length === 0) {
      const [latestNonDemo] = await tx
        .select()
        .from(cashRegisters)
        .where(and(eq(cashRegisters.storeId, storeId), eq(cashRegisters.isDemo, false)))
        .orderBy(desc(cashRegisters.openedAt))
        .limit(1);
      if (latestNonDemo) {
        await tx
          .update(cashRegisters)
          .set({ status: 'OPEN', closedAt: null, closedByUid: null })
          .where(eq(cashRegisters.id, latestNonDemo.id));
      }
    }

    // 6. Clear DEMO MODE flags on store_settings
    await tx
      .update(storeSettings)
      .set({
        demoModeActive: false,
        demoPeriodStart: null,
        demoPeriodEnd: null,
        demoLoadedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.storeId, storeId));
  });

  return { removedDemoData: true };
}

export interface DemoLoadSummary {
  periodStart: string;
  periodEnd: string;
  productsCount: number;
  suppliersCount: number;
  customersCount: number;
  purchasesCount: number;
  salesCount: number;
  creditSalesCount: number;
  customerPaymentsCount: number;
  supplierPaymentsCount: number;
  expensesCount: number;
  salesReturnsCount: number;
  purchaseReturnsCount: number;
  stockAdjustmentsCount: number;
  cashRegistersCount: number;
  totalSales: string;
  paidAtSale: string;
  creditIssuedAtSale: string;
  totalCogs: string;
  grossProfit: string;
  grossMarginPct: string;
  operatingExpenses: string;
  netProfit: string;
  reconciliation: DemoVerificationReport;
}

/**
 * Generates and bulk-inserts a complete, interconnected 6-month Bangladesh grocery store dataset
 * reconciling to ~৳60,00,000 sales (~৳10L/mo), ~৳30L instant paid / ~৳30L credit, 20% gross margin,
 * WAC inventory, customer khata, supplier payables, operating expenses, and daily cash registers.
 *
 * Uses pure in-memory chronological simulation + chunked bulk inserts so Cloud SQL finishes in ~5 seconds.
 */
export async function loadDemoData(storeId: number, actorUid: string): Promise<DemoLoadSummary> {
  // Always cleanly reset any previous demo data first so this operation is 100% idempotent
  await resetDemoData(storeId);

  const win = getSixMonthDemoWindow();
  const rng = createRng(20261121);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const randRange = (min: number, max: number) => min + rng() * (max - min);

  let totalPurchasesCount = 0;
  let totalSalesCount = 0;
  let totalCreditSalesCount = 0;
  let totalCustPaymentsCount = 0;
  let totalSupPaymentsCount = 0;
  let totalSalesReturnsCount = 0;
  let totalPurchaseReturnsCount = 0;
  let totalStockAdjCount = 0;

  await db.transaction(async (tx) => {
    const openingTs = dhakaTimestamp(win.openingDate, 9, 0, 0);
    const todayNow = new Date();

    // -----------------------------------------------------------------------
    // 1. Ensure Categories, Brands, Expense Categories
    // -----------------------------------------------------------------------
    const existingCats = await tx.select().from(categories).where(eq(categories.storeId, storeId));
    const catByName = new Map(existingCats.map((c) => [c.name, c.id]));
    const missingCats = BD_CATEGORIES.filter((c) => !catByName.has(c.name));
    if (missingCats.length > 0) {
      const ins = await tx
        .insert(categories)
        .values(
          missingCats.map((c, idx) => ({
            storeId,
            name: c.name,
            nameBn: c.nameBn,
            iconName: c.iconName,
            accentColor: c.accentColor,
            sortOrder: existingCats.length + idx + 1,
          }))
        )
        .returning();
      for (const c of ins) catByName.set(c.name, c.id);
    }

    const existingBrands = await tx.select().from(brands).where(eq(brands.storeId, storeId));
    const brandByName = new Map(existingBrands.map((b) => [b.name, b.id]));
    const allWantedBrands = [...BD_BRANDS, ...EXTRA_DEMO_BRANDS];
    const missingBrands = allWantedBrands.filter((b) => !brandByName.has(b.name));
    if (missingBrands.length > 0) {
      const ins = await tx
        .insert(brands)
        .values(
          missingBrands.map((b) => ({
            storeId,
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
      for (const b of ins) brandByName.set(b.name, b.id);
    }

    const existingExpCats = await tx.select().from(expenseCategories).where(eq(expenseCategories.storeId, storeId));
    const expCatByName = new Map(existingExpCats.map((c) => [c.name, c.id]));
    const missingExpCats = DEMO_EXPENSE_CATEGORIES.filter((c) => !expCatByName.has(c.name));
    if (missingExpCats.length > 0) {
      const ins = await tx
        .insert(expenseCategories)
        .values(
          missingExpCats.map((c) => ({
            storeId,
            name: c.name,
            nameBn: c.nameBn,
            isDemo: true,
          }))
        )
        .returning();
      for (const c of ins) expCatByName.set(c.name, c.id);
    }

    // -----------------------------------------------------------------------
    // 2. Ensure 270 Products (Reuse existing starter SKUs + Insert 220+ Demo SKUs)
    // -----------------------------------------------------------------------
    const existingProducts = await tx.select().from(products).where(eq(products.storeId, storeId));
    const prodBySku = new Map(existingProducts.map((p) => [p.sku, p]));
    const defaultCatId = Array.from(catByName.values())[0];

    const newProductRows: Array<typeof products.$inferInsert> = [];
    const newPackUnitsMeta: Array<{ sku: string; unitName: string; unitNameBn: string; factor: number }> = [];

    for (const def of DEMO_PRODUCTS) {
      if (prodBySku.has(def.sku)) continue;
      const manifestImg = getManifestImageForSku(def.sku);
      const verified = VERIFIED_PRODUCT_MEDIA[def.sku];
      const finalImgUrl = manifestImg || verified?.imageUrl || null;
      newProductRows.push({
        storeId,
        categoryId: catByName.get(def.category) ?? defaultCatId,
        brandId: brandByName.get(def.brand) ?? null,
        sku: def.sku,
        barcode: def.barcode,
        name: def.name,
        nameBn: def.nameBn,
        variant: def.variant,
        baseUnit: def.baseUnit,
        allowDecimalQty: def.allowDecimalQty,
        avgCostPrice: def.cost.toFixed(4),
        lastPurchasePrice: def.cost.toFixed(4),
        sellingPrice: def.price.toFixed(2),
        currentStock: qty4(D(def.openingStock)),
        minStock: qty4(D(def.minStock)),
        imageUrl: finalImgUrl,
        galleryUrls: '[]',
        imageSource: verified?.imageSource || 'Master Product Catalog (1000x1000 WebP)',
        imageStatus: finalImgUrl ? 'VERIFIED' : 'UNAVAILABLE',
        imageUpdatedAt: finalImgUrl ? openingTs : null,
        isFrequent: Boolean(def.isFrequent),
        isActive: true,
        isDemo: true,
        createdAt: openingTs,
        updatedAt: openingTs,
      });
      if (def.packUnit) {
        newPackUnitsMeta.push({
          sku: def.sku,
          unitName: def.packUnit.unitName,
          unitNameBn: def.packUnit.unitNameBn,
          factor: def.packUnit.factor,
        });
      }
    }

    const insertedNewProds = newProductRows.length
      ? await batchInsertReturning<typeof products.$inferInsert, typeof products.$inferSelect>(tx, products, newProductRows)
      : [];
    for (const p of insertedNewProds) prodBySku.set(p.sku, p);

    if (newPackUnitsMeta.length > 0) {
      await batchInsert(
        tx,
        productUnits,
        newPackUnitsMeta
          .map((u) => {
            const p = prodBySku.get(u.sku);
            if (!p) return null;
            return {
              storeId,
              productId: p.id,
              unitName: u.unitName,
              unitNameBn: u.unitNameBn,
              conversionFactor: qty4(D(u.factor)),
              isPurchaseDefault: true,
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      );
    }

    // Opening stock movements for newly created demo SKUs
    if (insertedNewProds.length > 0) {
      await batchInsert(
        tx,
        stockMovements,
        insertedNewProds.map((p) => ({
          storeId,
          productId: p.id,
          movementType: 'OPENING',
          quantityDelta: p.currentStock,
          unitCost: p.avgCostPrice,
          balanceAfter: p.currentStock,
          referenceType: 'SEED',
          notes: '6-month demo opening inventory',
          isDemo: true,
          createdByUid: actorUid,
          createdAt: openingTs,
        }))
      );
    }

    // Build in-memory Inventory & WAC Tracker for all catalog SKUs
    interface ProdState {
      id: number;
      sku: string;
      name: string;
      variant: string;
      baseUnit: string;
      allowDecimalQty: boolean;
      sellingPrice: number;
      baseCost: number;
      minStock: number;
      supplierKey: string;
      demandWeight: number;
      stock: ReturnType<typeof D>;
      totalVal: ReturnType<typeof D>;
      lastCost: ReturnType<typeof D>;
      packUnit?: { unitName: string; factor: number };
    }

    const prodStates: ProdState[] = [];
    const prodsBySupplier = new Map<string, ProdState[]>();

    for (const def of DEMO_PRODUCTS) {
      const dbProd = prodBySku.get(def.sku);
      if (!dbProd) continue;
      const st = D(dbProd.currentStock);
      const avg = D(dbProd.avgCostPrice);
      const state: ProdState = {
        id: dbProd.id,
        sku: def.sku,
        name: dbProd.name,
        variant: dbProd.variant,
        baseUnit: dbProd.baseUnit,
        allowDecimalQty: dbProd.allowDecimalQty,
        sellingPrice: Number(dbProd.sellingPrice),
        baseCost: def.cost,
        minStock: def.minStock,
        supplierKey: def.supplierKey,
        demandWeight: def.demandWeight,
        stock: st,
        totalVal: st.times(avg),
        lastCost: avg.gt(0) ? avg : D(def.cost),
        packUnit: def.packUnit ? { unitName: def.packUnit.unitName, factor: def.packUnit.factor } : undefined,
      };
      prodStates.push(state);
      const supList = prodsBySupplier.get(def.supplierKey) || [];
      supList.push(state);
      prodsBySupplier.set(def.supplierKey, supList);
    }

    const getWac = (p: ProdState) => (p.stock.gt(0) ? p.totalVal.dividedBy(p.stock) : p.lastCost);

    const lowMarginPool: ProdState[] = [];
    const midMarginPool: ProdState[] = [];
    const highMarginPool: ProdState[] = [];
    for (const p of prodStates) {
      const targetWholesaleCost = Math.min(p.baseCost, p.sellingPrice * 0.80);
      p.baseCost = Number(targetWholesaleCost.toFixed(4));
      const estMargin = (p.sellingPrice - p.baseCost) / p.sellingPrice;
      const reps = Math.max(1, Math.round(p.demandWeight));
      for (let r = 0; r < reps; r++) {
        if (estMargin < 0.195) lowMarginPool.push(p);
        else if (estMargin <= 0.212) midMarginPool.push(p);
        else highMarginPool.push(p);
      }
    }
    const allWeightedPool = [...lowMarginPool, ...midMarginPool, ...highMarginPool];

    // -----------------------------------------------------------------------
    // 3. Insert 20 Demo Suppliers + Opening Balances
    // -----------------------------------------------------------------------
    const insertedSuppliers = await batchInsertReturning<typeof suppliers.$inferInsert, typeof suppliers.$inferSelect>(
      tx,
      suppliers,
      DEMO_SUPPLIERS.map((s) => ({
        storeId,
        supplierCode: s.code,
        name: s.name,
        company: s.company,
        phone: s.phone,
        address: s.address,
        openingBalance: money(D(s.openingBalance)),
        totalPurchases: '0.00',
        totalPaid: '0.00',
        currentDue: money(D(s.openingBalance)),
        notes: s.notes,
        isActive: true,
        isDemo: true,
        createdAt: openingTs,
      }))
    );

    interface SupState {
      id: number;
      key: string;
      name: string;
      openingBalance: ReturnType<typeof D>;
      totalPurchases: ReturnType<typeof D>;
      totalPaid: ReturnType<typeof D>;
      currentDue: ReturnType<typeof D>;
    }

    interface SupLedgerDraft extends Omit<typeof supplierLedger.$inferInsert, 'referenceId'> {
      refKind?: 'PURCHASE' | 'PURCHASE_RETURN' | 'SUPPLIER_PAYMENT';
      refIdx?: number;
    }

    const supByKey = new Map<string, SupState>();
    const supStates: SupState[] = [];
    const supLedgerDrafts: SupLedgerDraft[] = [];

    for (let i = 0; i < DEMO_SUPPLIERS.length; i++) {
      const def = DEMO_SUPPLIERS[i];
      const row = insertedSuppliers[i];
      const ob = D(def.openingBalance);
      const st: SupState = {
        id: row.id,
        key: def.key,
        name: row.name,
        openingBalance: ob,
        totalPurchases: D(0),
        totalPaid: D(0),
        currentDue: ob,
      };
      supByKey.set(def.key, st);
      supStates.push(st);
      supLedgerDrafts.push({
        storeId,
        supplierId: row.id,
        entryDate: win.openingDate,
        transactionType: 'OPENING_BALANCE',
        debitAmount: money(ob),
        creditAmount: '0.00',
        runningBalance: money(ob),
        description: 'Opening supplier payable balance',
        isDemo: true,
        createdAt: openingTs,
      });
    }

    // -----------------------------------------------------------------------
    // 4. Insert 110 Fictional Bangladeshi Customers + Opening Balances
    // -----------------------------------------------------------------------
    const custDefs = buildDemoCustomers();
    const insertedCustomers = await batchInsertReturning<typeof customers.$inferInsert, typeof customers.$inferSelect>(
      tx,
      customers,
      custDefs.map((c, idx) => {
        const regOffset = -(15 + (idx % 120));
        const regDate = addDaysISO(win.periodStart, regOffset);
        return {
          storeId,
          customerCode: c.code,
          name: c.name,
          phone: c.phone,
          altPhone: c.altPhone,
          village: c.village,
          area: c.area,
          road: c.road,
          house: c.house,
          customerType: c.customerType,
          creditLimit: money(D(c.creditLimit)),
          openingBalance: money(D(c.openingBalance)),
          totalPurchases: '0.00',
          totalPaid: '0.00',
          currentDue: money(D(c.openingBalance)),
          registrationDate: regDate,
          notes: c.notes,
          isActive: true,
          isDemo: true,
          createdAt: openingTs,
          updatedAt: openingTs,
        };
      })
    );

    interface OpenInvoiceRef {
      saleIdx: number;
      invoiceNumber: string;
      saleDate: string;
      expectedPaymentDate: string;
      dueAmount: ReturnType<typeof D>;
      paidAmount: ReturnType<typeof D>;
    }

    interface CustState {
      id: number;
      code: string;
      name: string;
      customerType: 'REGULAR' | 'VIP' | 'WHOLESALE' | 'OCCASIONAL';
      creditLimit: number;
      creditPropensity: number;
      paymentDiscipline: 'PROMPT' | 'NORMAL' | 'SLOW' | 'OVERDUE';
      orderSizeMultiplier: number;
      totalPurchases: ReturnType<typeof D>;
      totalPaid: ReturnType<typeof D>;
      currentDue: ReturnType<typeof D>;
      openInvoices: OpenInvoiceRef[];
      lastPaidDayIdx: number;
    }

    interface CustLedgerDraft extends Omit<typeof customerLedger.$inferInsert, 'saleId' | 'customerPaymentId' | 'salesReturnId'> {
      saleIdx?: number;
      cpIdx?: number;
      srIdx?: number;
    }

    const custStates: CustState[] = [];
    const creditCustStates: CustState[] = [];
    const custLedgerDrafts: CustLedgerDraft[] = [];

    for (let i = 0; i < custDefs.length; i++) {
      const def = custDefs[i];
      const row = insertedCustomers[i];
      const ob = D(def.openingBalance);
      const st: CustState = {
        id: row.id,
        code: row.customerCode,
        name: row.name,
        customerType: def.customerType,
        creditLimit: def.creditLimit,
        creditPropensity: def.creditPropensity,
        paymentDiscipline: def.paymentDiscipline,
        orderSizeMultiplier: def.orderSizeMultiplier,
        totalPurchases: D(0),
        totalPaid: D(0),
        currentDue: ob,
        openInvoices: [],
        lastPaidDayIdx: -20,
      };
      custStates.push(st);
      if (def.creditPropensity > 0) creditCustStates.push(st);
      custLedgerDrafts.push({
        storeId,
        customerId: row.id,
        entryDate: win.openingDate,
        transactionType: 'OPENING_BALANCE',
        debitAmount: money(ob),
        creditAmount: '0.00',
        runningBalance: money(ob),
        description: ob.gt(0) ? 'Opening due balance brought forward' : 'Customer account opened',
        isDemo: true,
        createdAt: openingTs,
      });
    }

    // Close any pre-existing non-demo open cash register so historical demo registers sequence cleanly
    await tx
      .update(cashRegisters)
      .set({
        status: 'CLOSED',
        closedByUid: actorUid,
        closedAt: openingTs,
        expectedClosing: '5000.00',
        actualClosing: '5000.00',
        notes: 'Closed before 6-month demo history',
      })
      .where(and(eq(cashRegisters.storeId, storeId), eq(cashRegisters.status, 'OPEN'), eq(cashRegisters.isDemo, false)));

    // -----------------------------------------------------------------------
    // 5. PURE IN-MEMORY 184-Day Chronological Simulation (Zero DB round trips inside loop!)
    // -----------------------------------------------------------------------
    const registerDrafts: Array<typeof cashRegisters.$inferInsert> = [];
    const purchaseDrafts: Array<typeof purchases.$inferInsert> = [];
    const purchaseItemDrafts: Array<Omit<typeof purchaseItems.$inferInsert, 'purchaseId'> & { purIdx: number }> = [];
    const purchaseReturnDrafts: Array<Omit<typeof purchaseReturns.$inferInsert, 'purchaseId'> & { purIdx: number }> = [];
    const purchaseReturnItemDrafts: Array<Omit<typeof purchaseReturnItems.$inferInsert, 'purchaseReturnId'> & { prIdx: number }> = [];

    const saleDrafts: Array<typeof sales.$inferInsert> = [];
    const saleItemDrafts: Array<Omit<typeof saleItems.$inferInsert, 'saleId'> & { saleIdx: number }> = [];
    const paymentDrafts: Array<Omit<typeof payments.$inferInsert, 'saleId'> & { saleIdx: number }> = [];
    const salesReturnDrafts: Array<Omit<typeof salesReturns.$inferInsert, 'saleId'> & { saleIdx: number }> = [];
    const salesReturnItemDrafts: Array<Omit<typeof salesReturnItems.$inferInsert, 'salesReturnId'> & { srIdx: number }> = [];

    const custPaymentDrafts: Array<typeof customerPayments.$inferInsert> = [];
    const paymentAllocDrafts: Array<{ cpIdx: number; saleIdx: number; allocatedAmount: string; createdAt: Date }> = [];
    const supPaymentDrafts: Array<typeof supplierPayments.$inferInsert> = [];

    const stockMoveDrafts: Array<
      Omit<typeof stockMovements.$inferInsert, 'referenceId'> & {
        refKind?: 'PURCHASE' | 'PURCHASE_RETURN' | 'SALE' | 'SALES_RETURN';
        refIdx?: number;
      }
    > = [];
    const stockAdjDrafts: Array<typeof stockAdjustments.$inferInsert> = [];
    const expenseDrafts: Array<typeof expenses.$inferInsert> = [];
    const cashTxDrafts: Array<
      Omit<typeof cashTransactions.$inferInsert, 'registerId' | 'referenceId'> & {
        regIdx: number;
        refKind?: 'REGISTER' | 'PURCHASE' | 'SALE' | 'SALES_RETURN' | 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
        refIdx?: number;
      }
    > = [];
    const dueReminderDrafts: Array<Omit<typeof dueReminders.$inferInsert, 'saleId'> & { saleIdx?: number }> = [];
    const disputeDrafts: Array<Omit<typeof customerDisputes.$inferInsert, 'saleId'> & { saleIdx?: number }> = [];

    let purchaseSeq = 1;
    let saleSeq = 1;
    let custPmtSeq = 1;
    let supPmtSeq = 1;
    let saleRetSeq = 1;
    let purRetSeq = 1;

    let runningCashFloat = D(25000);

    const pickSaleMethod = (): 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD' | 'BANK' => {
      const r = rng();
      if (r < 0.62) return 'CASH';
      if (r < 0.80) return 'BKASH';
      if (r < 0.91) return 'NAGAD';
      if (r < 0.94) return 'ROCKET';
      if (r < 0.98) return 'CARD';
      return 'BANK';
    };

    const pickDueMethod = (): 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' => {
      const r = rng();
      if (r < 0.58) return 'CASH';
      if (r < 0.79) return 'BKASH';
      if (r < 0.91) return 'NAGAD';
      if (r < 0.95) return 'ROCKET';
      return 'BANK';
    };

    const pickSupplierMethod = (): 'CASH' | 'BANK' | 'BKASH' | 'NAGAD' => {
      const r = rng();
      if (r < 0.45) return 'CASH';
      if (r < 0.78) return 'BANK';
      if (r < 0.90) return 'BKASH';
      return 'NAGAD';
    };

    const executePurchaseInMem = (
      sup: SupState,
      dateISO: string,
      hour: number,
      min: number,
      regIdx: number,
      dayCashTracker: { balance: ReturnType<typeof D> },
      forcedSkus?: ProdState[]
    ) => {
      const supProds = forcedSkus && forcedSkus.length > 0 ? forcedSkus : prodsBySupplier.get(sup.key) || [];
      if (supProds.length === 0) return null;

      const sorted = [...supProds].sort(
        (a, b) => a.stock.toNumber() / Math.max(1, a.minStock) - b.stock.toNumber() / Math.max(1, b.minStock)
      );
      const count = forcedSkus ? sorted.length : Math.min(sorted.length, Math.max(3, Math.min(9, 4 + Math.floor(rng() * 6))));
      const chosen = sorted.slice(0, count);

      const lineDrafts: Array<{
        prod: ProdState;
        unitName: string;
        factor: number;
        enteredQty: number;
        baseQty: number;
        unitCostBase: ReturnType<typeof D>;
        rawLineTotal: ReturnType<typeof D>;
      }> = [];

      let subtotal = D(0);
      for (const p of chosen) {
        const targetOrder = Math.max(p.minStock * 1.6, p.demandWeight * 7.5);
        const factor = p.packUnit && rng() < 0.5 ? p.packUnit.factor : 1;
        const enteredQty = Math.max(1, Math.round((targetOrder * randRange(0.8, 1.35)) / factor));
        const baseQty = enteredQty * factor;
        // Wholesale distributor invoice rate slightly below net landed target (transport + unloading offset by trade discount)
        const unitCostBase = D(p.baseCost * randRange(0.980, 1.004)).toDecimalPlaces(4);
        const rawLineTotal = D(baseQty).times(unitCostBase).toDecimalPlaces(2);
        subtotal = subtotal.plus(rawLineTotal);
        lineDrafts.push({
          prod: p,
          unitName: factor > 1 && p.packUnit ? p.packUnit.unitName : p.baseUnit,
          factor,
          enteredQty,
          baseQty,
          unitCostBase,
          rawLineTotal,
        });
      }

      if (subtotal.lte(0)) return null;
      // Realistic proportional transport & unloading (~0.7%–1.3% of invoice) balanced by distributor trade discount (~0.8%–1.5%)
      const transportCost = D(Math.max(100, Math.min(850, Math.round((subtotal.toNumber() * randRange(0.006, 0.012)) / 10) * 10)));
      const otherCost =
        rng() < 0.55 ? D(Math.max(50, Math.min(300, Math.round((subtotal.toNumber() * randRange(0.002, 0.005)) / 10) * 10))) : D(0);
      const discount = D(Math.round(subtotal.toNumber() * randRange(0.008, 0.016)));
      const extraNet = transportCost.plus(otherCost).minus(discount);
      const totalAmount = subtotal.plus(extraNet);

      const payRatio = rng() < 0.25 ? 1.0 : rng() < 0.7 ? randRange(0.3, 0.65) : 0.0;
      const paidAmount = D(Math.round(totalAmount.times(payRatio).toNumber()));
      const dueAmount = totalAmount.minus(paidAmount);
      const paymentMethod = pickSupplierMethod();

      const invNo = `DPUR-${dateISO.replace(/-/g, '')}-${String(purchaseSeq++).padStart(4, '0')}`;
      const ts = dhakaTimestamp(dateISO, hour, min, Math.floor(rng() * 50));

      const purIdx = purchaseDrafts.length;
      purchaseDrafts.push({
        storeId,
        supplierId: sup.id,
        invoiceNumber: invNo,
        supplierInvoiceNo: `SUP-${sup.key}-${String(purchaseSeq).padStart(4, '0')}`,
        purchaseDate: dateISO,
        subtotal: money(subtotal),
        transportCost: money(transportCost),
        otherCost: money(otherCost),
        discount: money(discount),
        totalAmount: money(totalAmount),
        paidAmount: money(paidAmount),
        dueAmount: money(dueAmount),
        paymentMethod,
        status: 'COMPLETED',
        notes: `Scheduled wholesale restock from ${sup.name}`,
        isDemo: true,
        createdByUid: actorUid,
        createdAt: ts,
      });
      totalPurchasesCount++;

      let allocatedExtra = D(0);
      for (let i = 0; i < lineDrafts.length; i++) {
        const d = lineDrafts[i];
        const share =
          i === lineDrafts.length - 1
            ? extraNet.minus(allocatedExtra)
            : extraNet.times(d.rawLineTotal).dividedBy(subtotal).toDecimalPlaces(2);
        allocatedExtra = allocatedExtra.plus(share);
        const landedLineVal = d.rawLineTotal.plus(share);
        const landedUnitCost = landedLineVal.dividedBy(d.baseQty);

        d.prod.stock = d.prod.stock.plus(d.baseQty);
        d.prod.totalVal = d.prod.totalVal.plus(landedLineVal);
        d.prod.lastCost = landedUnitCost;

        purchaseItemDrafts.push({
          purIdx,
          productId: d.prod.id,
          productName: d.prod.name,
          purchaseUnit: d.unitName,
          conversionFactor: qty4(D(d.factor)),
          enteredQty: qty4(D(d.enteredQty)),
          baseQty: qty4(D(d.baseQty)),
          unitCostEntered: d.unitCostBase.times(d.factor).toFixed(4),
          landedUnitCostBase: landedUnitCost.toFixed(4),
          lineTotal: money(landedLineVal),
          expiryDate: addDaysISO(dateISO, 150 + Math.floor(rng() * 210)),
        });

        stockMoveDrafts.push({
          storeId,
          productId: d.prod.id,
          movementType: 'PURCHASE_IN',
          quantityDelta: qty4(D(d.baseQty)),
          unitCost: landedUnitCost.toFixed(4),
          balanceAfter: qty4(d.prod.stock),
          referenceType: 'PURCHASE',
          refKind: 'PURCHASE',
          refIdx: purIdx,
          notes: `Purchase ${invNo}`,
          isDemo: true,
          createdByUid: actorUid,
          createdAt: ts,
        });
      }

      sup.totalPurchases = sup.totalPurchases.plus(totalAmount);
      sup.currentDue = sup.currentDue.plus(totalAmount);
      supLedgerDrafts.push({
        storeId,
        supplierId: sup.id,
        entryDate: dateISO,
        transactionType: 'PURCHASE',
        refKind: 'PURCHASE',
        refIdx: purIdx,
        invoiceNumber: invNo,
        debitAmount: money(totalAmount),
        creditAmount: '0.00',
        runningBalance: money(sup.currentDue),
        paymentMethod,
        description: `Purchase invoice ${invNo}`,
        isDemo: true,
        createdAt: ts,
      });

      if (paidAmount.gt(0)) {
        sup.totalPaid = sup.totalPaid.plus(paidAmount);
        sup.currentDue = sup.currentDue.minus(paidAmount);
        supLedgerDrafts.push({
          storeId,
          supplierId: sup.id,
          entryDate: dateISO,
          transactionType: 'PAYMENT',
          refKind: 'PURCHASE',
          refIdx: purIdx,
          invoiceNumber: invNo,
          debitAmount: '0.00',
          creditAmount: money(paidAmount),
          runningBalance: money(sup.currentDue),
          paymentMethod,
          description: `Paid against ${invNo}`,
          isDemo: true,
          createdAt: ts,
        });

        if (paymentMethod === 'CASH') {
          dayCashTracker.balance = dayCashTracker.balance.minus(paidAmount);
          cashTxDrafts.push({
            storeId,
            regIdx,
            txType: 'PURCHASE_CASH',
            amount: money(paidAmount),
            direction: 'OUT',
            referenceType: 'PURCHASE',
            refKind: 'PURCHASE',
            refIdx: purIdx,
            description: `Cash purchase ${invNo} (${sup.name})`,
            isDemo: true,
            createdByUid: actorUid,
            createdAt: ts,
          });
        }
      }

      return { purIdx, lineDrafts, ts };
    };

    let globalDayIdx = 0;
    const recentCompletedSalesForReturn: Array<{
      saleIdx: number;
      invoiceNumber: string;
      customer: CustState | null;
      saleDate: string;
      totalAmount: ReturnType<typeof D>;
      paidAtSale: ReturnType<typeof D>;
      wasCashOnly: boolean;
      items: Array<{
        prod: ProdState;
        baseQty: number;
        unitPrice: number;
        unitCost: ReturnType<typeof D>;
        lineTotal: ReturnType<typeof D>;
        lineCogs: ReturnType<typeof D>;
      }>;
    }> = [];

    for (let mIdx = 0; mIdx < win.months.length; mIdx++) {
      const mWin = win.months[mIdx];

      const dayWeights: number[] = mWin.days.map((dISO, idx) => {
        const dow = dayOfWeekUTC(dISO);
        let w = dow === 5 || dow === 6 ? randRange(1.32, 1.52) : randRange(0.84, 1.04);
        if (idx < 5) w *= 1.18;
        if ((mIdx === 1 && idx >= 12 && idx <= 19) || (mIdx === 5 && idx >= 14 && idx <= 20)) {
          w *= 1.32;
        }
        return w;
      });
      const weightSum = dayWeights.reduce((a, b) => a + b, 0);

      let monthSalesAccum = D(0);
      let monthCogsAccum = D(0);
      let monthPaidAtSaleAccum = D(0);
      const monthPaidTarget = D(mWin.targetSales).times(0.5);

      const rentAmt = 28000;
      const salaryStaff1 = 14000;
      const salaryStaff2 = 12000;
      const salaryStaff3 = 10000;
      const elecAmt = Math.round(randRange(6800, 8600) / 50) * 50;
      const netAmt = 1800;
      const secAmt = 2000;
      const softAmt = 1500;
      const waterAmt = Math.round(randRange(1100, 1500) / 50) * 50;

      for (let dIdx = 0; dIdx < mWin.days.length; dIdx++) {
        const dateISO = mWin.days[dIdx];
        globalDayIdx++;

        const openTs = dhakaTimestamp(dateISO, 8, 30, 0);
        const dayOpeningCash = runningCashFloat;
        const regIdx = registerDrafts.length;
        registerDrafts.push({
          storeId,
          openedByUid: actorUid,
          openedAt: openTs,
          openingBalance: money(dayOpeningCash),
          status: 'OPEN',
          notes: `Daily counter shift — ${dateISO}`,
          isDemo: true,
        });

        const dayCashTracker = { balance: dayOpeningCash };
        cashTxDrafts.push({
          storeId,
          regIdx,
          txType: 'OPENING',
          amount: money(dayOpeningCash),
          direction: 'IN',
          referenceType: 'REGISTER',
          refKind: 'REGISTER',
          refIdx: regIdx,
          description: `Opening cash float (${dateISO})`,
          isDemo: true,
          createdByUid: actorUid,
          createdAt: openTs,
        });

        if (globalDayIdx === 2) {
          const invAmt = D(100000);
          dayCashTracker.balance = dayCashTracker.balance.plus(invAmt);
          cashTxDrafts.push({
            storeId,
            regIdx,
            txType: 'OWNER_INVESTMENT',
            amount: money(invAmt),
            direction: 'IN',
            referenceType: 'OWNER',
            description: 'Owner working capital injection for seasonal inventory',
            isDemo: true,
            createdByUid: actorUid,
            createdAt: dhakaTimestamp(dateISO, 9, 10, 0),
          });
        }

        // A. Morning Restocking Purchases
        const scheduledSup = supStates[(globalDayIdx - 1) % supStates.length];
        const lowBySup = new Map<string, ProdState[]>();
        for (const p of prodStates) {
          if (p.stock.lt(Math.max(p.minStock * 1.8, p.demandWeight * 4.5))) {
            const arr = lowBySup.get(p.supplierKey) || [];
            arr.push(p);
            lowBySup.set(p.supplierKey, arr);
          }
        }

        const purchasedTodaySups = new Set<string>();
        const shouldScheduledBuy = globalDayIdx <= 20 || rng() < 0.82;
        if (shouldScheduledBuy) {
          const res = executePurchaseInMem(scheduledSup, dateISO, 9, 20 + Math.floor(rng() * 35), regIdx, dayCashTracker);
          if (res) purchasedTodaySups.add(scheduledSup.key);

          // Occasional Purchase Return (~10 across 6 months)
          if (res && globalDayIdx % 19 === 0 && totalPurchaseReturnsCount < 11 && res.lineDrafts.length > 0) {
            const retItem = res.lineDrafts[0];
            const retQty = Math.min(2, Math.max(1, Math.floor(retItem.baseQty / 4)));
            if (retItem.prod.stock.gte(retQty + 2)) {
              const uCost = getWac(retItem.prod);
              const retVal = uCost.times(retQty).toDecimalPlaces(2);
              const retNo = `DPR-${dateISO.replace(/-/g, '')}-${String(purRetSeq++).padStart(3, '0')}`;
              const retTs = dhakaTimestamp(dateISO, 11, 15, 0);
              const prIdx = purchaseReturnDrafts.length;

              purchaseReturnDrafts.push({
                storeId,
                purIdx: res.purIdx,
                supplierId: scheduledSup.id,
                returnNumber: retNo,
                totalAmount: money(retVal),
                reason: 'Damaged outer carton on delivery inspection',
                isDemo: true,
                createdByUid: actorUid,
                createdAt: retTs,
              });
              purchaseReturnItemDrafts.push({
                prIdx,
                productId: retItem.prod.id,
                baseQty: qty4(D(retQty)),
                unitCost: uCost.toFixed(4),
                lineTotal: money(retVal),
              });
              retItem.prod.stock = retItem.prod.stock.minus(retQty);
              retItem.prod.totalVal = retItem.prod.totalVal.minus(retVal);
              stockMoveDrafts.push({
                storeId,
                productId: retItem.prod.id,
                movementType: 'PURCHASE_RETURN',
                quantityDelta: qty4(D(-retQty)),
                unitCost: uCost.toFixed(4),
                balanceAfter: qty4(retItem.prod.stock),
                referenceType: 'RETURN',
                refKind: 'PURCHASE_RETURN',
                refIdx: prIdx,
                notes: `Purchase return ${retNo}`,
                isDemo: true,
                createdByUid: actorUid,
                createdAt: retTs,
              });
              scheduledSup.currentDue = scheduledSup.currentDue.minus(retVal);
              supLedgerDrafts.push({
                storeId,
                supplierId: scheduledSup.id,
                entryDate: dateISO,
                transactionType: 'PURCHASE_RETURN',
                refKind: 'PURCHASE_RETURN',
                refIdx: prIdx,
                invoiceNumber: retNo,
                debitAmount: '0.00',
                creditAmount: money(retVal),
                runningBalance: money(scheduledSup.currentDue),
                description: `Supplier return credit (${retNo})`,
                isDemo: true,
                createdAt: retTs,
              });
              totalPurchaseReturnsCount++;
            }
          }
        }

        for (const [sKey, lowList] of lowBySup.entries()) {
          if (purchasedTodaySups.has(sKey)) continue;
          if (lowList.length >= 2 || lowList.some((p) => p.stock.lt(p.minStock))) {
            const supObj = supByKey.get(sKey);
            if (supObj) {
              executePurchaseInMem(supObj, dateISO, 10, 15 + Math.floor(rng() * 40), regIdx, dayCashTracker, lowList);
              purchasedTodaySups.add(sKey);
            }
          }
        }

        // B. Daily Sales Generation
        const remainingDays = mWin.days.length - dIdx;
        const remainingMonthSales = D(mWin.targetSales).minus(monthSalesAccum);
        let daySalesTarget =
          remainingDays === 1
            ? Math.max(18000, remainingMonthSales.toNumber())
            : (mWin.targetSales * dayWeights[dIdx]) / weightSum;

        if (remainingDays <= 4 && remainingDays > 1) {
          daySalesTarget = Math.max(18000, remainingMonthSales.toNumber() / remainingDays);
        }

        const numSalesToday = Math.max(10, Math.min(18, Math.round(daySalesTarget / 2450)));
        let daySalesAccum = D(0);

        for (let sIdx = 0; sIdx < numSalesToday; sIdx++) {
          const isLastSaleOfDay = sIdx === numSalesToday - 1;
          const remainingDayTarget = daySalesTarget - daySalesAccum.toNumber();
          if (remainingDayTarget < 250) break;

          const saleTarget = isLastSaleOfDay
            ? Math.max(350, remainingDayTarget)
            : Math.max(400, (remainingDayTarget / (numSalesToday - sIdx)) * randRange(0.55, 1.48));

          const curPaidRatio = monthSalesAccum.gt(0) ? monthPaidAtSaleAccum.dividedBy(monthSalesAccum).toNumber() : 0.5;
          const remainingPaidNeeded = monthPaidTarget.minus(monthPaidAtSaleAccum).toNumber();
          const remainingTotalNeeded = Math.max(1, remainingMonthSales.toNumber());
          const neededPaidProb = Math.min(0.92, Math.max(0.08, remainingPaidNeeded / remainingTotalNeeded));

          const rType = rng();
          let saleArchetype: 'FULL_PAID' | 'PARTIAL_CREDIT' | 'FULL_CREDIT';
          if (rType < neededPaidProb - 0.14) {
            saleArchetype = 'FULL_PAID';
          } else if (rType < neededPaidProb + 0.22) {
            saleArchetype = 'PARTIAL_CREDIT';
          } else {
            saleArchetype = 'FULL_CREDIT';
          }
          if (remainingDays <= 3) {
            if (curPaidRatio < 0.495) saleArchetype = 'FULL_PAID';
            else if (curPaidRatio > 0.505) saleArchetype = 'FULL_CREDIT';
          }

          let cust: CustState | null = null;
          if (saleArchetype === 'FULL_PAID') {
            cust = rng() < 0.55 ? null : pick(custStates);
          } else {
            let candidate = pick(creditCustStates);
            for (let tries = 0; tries < 8; tries++) {
              if (candidate.currentDue.toNumber() + saleTarget <= candidate.creditLimit * 1.15) break;
              candidate = pick(creditCustStates);
            }
            cust = candidate;
          }

          const curCogsRatio = monthSalesAccum.gt(0) ? monthCogsAccum.dividedBy(monthSalesAccum).toNumber() : 0.80;
          const targetItemCount = Math.max(2, Math.min(8, Math.round(saleTarget / 520)));
          const usedProdIds = new Set<number>();

          interface DraftSaleItem {
            prod: ProdState;
            qty: number;
            unitPrice: number;
            unitCost: ReturnType<typeof D>;
            itemDiscount: ReturnType<typeof D>;
            lineGross: ReturnType<typeof D>;
            lineTotal: ReturnType<typeof D>;
            lineCogs: ReturnType<typeof D>;
            lineProfit: ReturnType<typeof D>;
          }

          const draftItems: DraftSaleItem[] = [];
          let subtotal = D(0);
          let itemDiscountTotal = D(0);
          let totalCogs = D(0);

          for (let k = 0; k < targetItemCount + 3; k++) {
            if (subtotal.toNumber() >= saleTarget * 0.94 && draftItems.length >= 2) break;
            if (draftItems.length >= 9) break;

            let pool = allWeightedPool;
            const needHigherMargin = curCogsRatio > 0.8005;
            const needLowerMargin = curCogsRatio < 0.7995;
            if (needHigherMargin && highMarginPool.length > 0) {
              pool = rng() < 0.82 ? highMarginPool : midMarginPool;
            } else if (needLowerMargin && lowMarginPool.length > 0) {
              pool = rng() < 0.82 ? lowMarginPool : midMarginPool;
            }

            let chosenProd: ProdState | null = null;
            for (let tries = 0; tries < 18; tries++) {
              const cand = pick(pool);
              if (usedProdIds.has(cand.id) || cand.stock.lt(2)) continue;
              const liveMargin = (cand.sellingPrice - getWac(cand).toNumber()) / cand.sellingPrice;
              if (needHigherMargin && liveMargin < 0.20 && tries < 12) continue;
              if (needLowerMargin && liveMargin > 0.205 && tries < 12) continue;
              chosenProd = cand;
              break;
            }
            if (!chosenProd) continue;
            usedProdIds.add(chosenProd.id);

            const remBudget = Math.max(chosenProd.sellingPrice, saleTarget - subtotal.toNumber());
            const maxSafeQty = Math.max(
              1,
              Math.min(Math.floor(chosenProd.stock.toNumber() - 1), chosenProd.baseUnit === 'Piece' && chosenProd.sellingPrice <= 30 ? 24 : 12)
            );
            let qty = Math.max(1, Math.min(maxSafeQty, Math.round((remBudget * randRange(0.25, 0.65)) / chosenProd.sellingPrice)));
            if (chosenProd.allowDecimalQty && rng() < 0.3) {
              qty = Math.min(maxSafeQty, Math.max(0.5, Math.round(qty * 2) / 2));
            }
            if (chosenProd.stock.lt(qty)) continue;

            const uCost = getWac(chosenProd);
            const lineGross = D(qty).times(chosenProd.sellingPrice).toDecimalPlaces(2);
            const itemDisc = rng() < 0.08 && lineGross.gte(250) ? D(Math.round(lineGross.toNumber() * 0.015)) : D(0);
            const lineTotal = lineGross.minus(itemDisc);
            const lineCogs = D(qty).times(uCost).toDecimalPlaces(4);
            const lineProfit = lineTotal.minus(lineCogs);

            subtotal = subtotal.plus(lineGross);
            itemDiscountTotal = itemDiscountTotal.plus(itemDisc);
            totalCogs = totalCogs.plus(lineCogs);

            draftItems.push({
              prod: chosenProd,
              qty,
              unitPrice: chosenProd.sellingPrice,
              unitCost: uCost,
              itemDiscount: itemDisc,
              lineGross,
              lineTotal,
              lineCogs,
              lineProfit,
            });
          }

          if (draftItems.length === 0) continue;

          const billDiscount = rng() < 0.07 && subtotal.gte(1200) ? D(Math.round(subtotal.toNumber() * 0.01)) : D(0);
          const totalAmount = subtotal.minus(itemDiscountTotal).minus(billDiscount);
          if (totalAmount.lte(0)) continue;
          const grossProfit = totalAmount.minus(totalCogs);

          let paidAtSale = D(0);
          if (saleArchetype === 'FULL_PAID') {
            paidAtSale = totalAmount;
          } else if (saleArchetype === 'PARTIAL_CREDIT') {
            const frac = randRange(0.25, 0.58);
            paidAtSale = D(Math.round((totalAmount.toNumber() * frac) / 10) * 10);
            if (paidAtSale.gte(totalAmount)) paidAtSale = totalAmount.minus(100);
            if (paidAtSale.lt(50)) paidAtSale = D(0);
          } else {
            paidAtSale = D(0);
          }

          const dueAtSale = totalAmount.minus(paidAtSale);
          const paymentStatus = dueAtSale.lte(0) ? 'PAID' : paidAtSale.gt(0) ? 'PARTIAL' : 'UNPAID';
          const expectedPaymentDate = dueAtSale.gt(0)
            ? addDaysISO(dateISO, cust?.customerType === 'WHOLESALE' ? 14 : cust?.customerType === 'VIP' ? 20 : 10)
            : null;

          const saleHour = 9 + Math.floor((sIdx / Math.max(1, numSalesToday)) * 12);
          const saleMin = Math.floor(rng() * 58);
          const saleTs = dhakaTimestamp(dateISO, Math.min(21, saleHour), saleMin, Math.floor(rng() * 50));
          const invNo = `DINV-${dateISO.replace(/-/g, '')}-${String(saleSeq++).padStart(5, '0')}`;

          const saleIdx = saleDrafts.length;
          saleDrafts.push({
            storeId,
            customerId: cust?.id ?? null,
            invoiceNumber: invNo,
            clientTransactionUuid: `demo-${storeId}-${invNo}`,
            saleDate: dateISO,
            subtotal: money(subtotal),
            itemDiscountTotal: money(itemDiscountTotal),
            billDiscount: money(billDiscount),
            totalAmount: money(totalAmount),
            paidAmount: money(paidAtSale),
            dueAmount: money(dueAtSale),
            totalCogs: totalCogs.toFixed(4),
            grossProfit: money(grossProfit),
            paymentStatus,
            status: 'COMPLETED',
            expectedPaymentDate,
            isOfflineOrigin: rng() < 0.08,
            notes: billDiscount.gt(0) ? 'Regular customer promotional discount applied' : '',
            isDemo: true,
            cashierUid: actorUid,
            createdAt: saleTs,
          });

          totalSalesCount++;
          if (dueAtSale.gt(0)) totalCreditSalesCount++;
          daySalesAccum = daySalesAccum.plus(totalAmount);
          monthSalesAccum = monthSalesAccum.plus(totalAmount);
          monthCogsAccum = monthCogsAccum.plus(totalCogs);
          monthPaidAtSaleAccum = monthPaidAtSaleAccum.plus(paidAtSale);

          for (const it of draftItems) {
            it.prod.stock = it.prod.stock.minus(it.qty);
            it.prod.totalVal = it.prod.totalVal.minus(it.lineCogs);

            saleItemDrafts.push({
              saleIdx,
              productId: it.prod.id,
              productName: it.prod.name,
              variant: it.prod.variant,
              unitName: it.prod.baseUnit,
              conversionFactor: '1.0000',
              enteredQty: qty4(D(it.qty)),
              baseQty: qty4(D(it.qty)),
              unitSellingPrice: money(D(it.unitPrice)),
              unitCostSnapshot: it.unitCost.toFixed(4),
              itemDiscount: money(it.itemDiscount),
              lineTotal: money(it.lineTotal),
              lineCogs: it.lineCogs.toFixed(4),
              lineProfit: money(it.lineProfit),
            });

            stockMoveDrafts.push({
              storeId,
              productId: it.prod.id,
              movementType: 'SALE_OUT',
              quantityDelta: qty4(D(-it.qty)),
              unitCost: it.unitCost.toFixed(4),
              balanceAfter: qty4(it.prod.stock),
              referenceType: 'SALE',
              refKind: 'SALE',
              refIdx: saleIdx,
              notes: `Sale ${invNo}`,
              isDemo: true,
              createdByUid: actorUid,
              createdAt: saleTs,
            });
          }

          const usedMethods: string[] = [];
          let cashPortionAtSale = D(0);
          if (paidAtSale.gt(0)) {
            const doSplit = paidAtSale.gte(1500) && rng() < 0.14;
            if (doSplit) {
              const cashPart = D(Math.round((paidAtSale.toNumber() * 0.5) / 50) * 50);
              const digitalPart = paidAtSale.minus(cashPart);
              const digMethod = rng() < 0.65 ? 'BKASH' : 'NAGAD';
              paymentDrafts.push(
                {
                  storeId,
                  saleIdx,
                  customerId: cust?.id ?? null,
                  method: 'CASH',
                  amount: money(cashPart),
                  referenceNo: '',
                  isDemo: true,
                  paidAt: saleTs,
                },
                {
                  storeId,
                  saleIdx,
                  customerId: cust?.id ?? null,
                  method: digMethod,
                  amount: money(digitalPart),
                  referenceNo: `${digMethod.slice(0, 2)}${String(1000000 + saleSeq * 17).slice(0, 8)}`,
                  isDemo: true,
                  paidAt: saleTs,
                }
              );
              usedMethods.push('CASH', digMethod);
              cashPortionAtSale = cashPart;
            } else {
              const m = pickSaleMethod();
              paymentDrafts.push({
                storeId,
                saleIdx,
                customerId: cust?.id ?? null,
                method: m,
                amount: money(paidAtSale),
                referenceNo: m === 'CASH' ? '' : `${m.slice(0, 2)}${String(2000000 + saleSeq * 13).slice(0, 8)}`,
                isDemo: true,
                paidAt: saleTs,
              });
              usedMethods.push(m);
              if (m === 'CASH') cashPortionAtSale = paidAtSale;
            }
          }

          if (cashPortionAtSale.gt(0)) {
            dayCashTracker.balance = dayCashTracker.balance.plus(cashPortionAtSale);
            cashTxDrafts.push({
              storeId,
              regIdx,
              txType: 'SALE_CASH',
              amount: money(cashPortionAtSale),
              direction: 'IN',
              referenceType: 'SALE',
              refKind: 'SALE',
              refIdx: saleIdx,
              description: `Cash sale ${invNo}`,
              isDemo: true,
              createdByUid: actorUid,
              createdAt: saleTs,
            });
          }

          if (cust) {
            const productSummary = draftItems.map((i) => `${i.prod.name} (${i.qty} ${i.prod.baseUnit})`).join(', ');
            cust.totalPurchases = cust.totalPurchases.plus(totalAmount);
            cust.currentDue = cust.currentDue.plus(totalAmount);

            custLedgerDrafts.push({
              storeId,
              customerId: cust.id,
              entryDate: dateISO,
              saleIdx,
              invoiceNumber: invNo,
              transactionType: 'CREDIT_SALE',
              productSummary,
              debitAmount: money(totalAmount),
              creditAmount: '0.00',
              runningBalance: money(cust.currentDue),
              paymentMethod: usedMethods.join('+') || 'CREDIT',
              expectedPaymentDate,
              description: dueAtSale.gt(0)
                ? `Credit/Partial sale (${invNo}) — Due: ৳${money(dueAtSale)}`
                : `Paid sale (${invNo})`,
              isDemo: true,
              createdAt: saleTs,
            });

            if (paidAtSale.gt(0)) {
              cust.totalPaid = cust.totalPaid.plus(paidAtSale);
              cust.currentDue = cust.currentDue.minus(paidAtSale);
              custLedgerDrafts.push({
                storeId,
                customerId: cust.id,
                entryDate: dateISO,
                saleIdx,
                invoiceNumber: invNo,
                transactionType: dueAtSale.lte(0) ? 'FULL_PAYMENT' : 'PARTIAL_PAYMENT',
                productSummary,
                debitAmount: '0.00',
                creditAmount: money(paidAtSale),
                runningBalance: money(cust.currentDue),
                paymentMethod: usedMethods.join('+'),
                description: `Counter payment (${usedMethods.join('+')}) for ${invNo}`,
                isDemo: true,
                createdAt: new Date(saleTs.getTime() + 1000),
              });
            }

            if (dueAtSale.gt(0)) {
              cust.openInvoices.push({
                saleIdx,
                invoiceNumber: invNo,
                saleDate: dateISO,
                expectedPaymentDate: expectedPaymentDate || addDaysISO(dateISO, 15),
                dueAmount: dueAtSale,
                paidAmount: paidAtSale,
              });
            }
          }

          const isPureCashReturnable = paidAtSale.eq(totalAmount) && cashPortionAtSale.eq(paidAtSale);
          const isPureCreditReturnable = paidAtSale.eq(0) && cust !== null;
          if (draftItems.length <= 5 && totalAmount.lte(3000) && (isPureCashReturnable || isPureCreditReturnable) && rng() < 0.14) {
            recentCompletedSalesForReturn.push({
              saleIdx,
              invoiceNumber: invNo,
              customer: cust,
              saleDate: dateISO,
              totalAmount,
              paidAtSale,
              wasCashOnly: isPureCashReturnable,
              items: draftItems.map((i) => ({
                prod: i.prod,
                baseQty: i.qty,
                unitPrice: i.unitPrice,
                unitCost: i.unitCost,
                lineTotal: i.lineTotal,
                lineCogs: i.lineCogs,
              })),
            });
          }
        }

        // C. Occasional Sales Return (~18 across 6 months)
        if (globalDayIdx % 10 === 0 && recentCompletedSalesForReturn.length > 0 && totalSalesReturnsCount < 18) {
          const cand = recentCompletedSalesForReturn.shift()!;
          const invRef = cand.customer?.openInvoices.find((inv) => inv.saleIdx === cand.saleIdx);
          const untouched = !cand.customer || cand.paidAtSale.eq(cand.totalAmount) || (invRef && invRef.paidAmount.eq(cand.paidAtSale));
          if (untouched) {
            const retTs = dhakaTimestamp(dateISO, 16, 20, 0);
            const retNo = `DSR-${dateISO.replace(/-/g, '')}-${String(saleRetSeq++).padStart(3, '0')}`;
            const totalCogsRev = cand.items.reduce((acc, i) => acc.plus(i.lineCogs), D(0));
            const refundMethod = cand.customer && cand.paidAtSale.lt(cand.totalAmount) ? 'CREDIT_ADJUSTMENT' : 'CASH';
            const srIdx = salesReturnDrafts.length;

            salesReturnDrafts.push({
              storeId,
              saleIdx: cand.saleIdx,
              customerId: cand.customer?.id ?? null,
              returnNumber: retNo,
              totalRefund: money(cand.totalAmount),
              totalCogsReversed: totalCogsRev.toFixed(4),
              refundMethod,
              reason: pick(['Seal opened / defective packaging', 'Customer bought wrong variant', 'Short expiry return exchange']),
              isDemo: true,
              createdByUid: actorUid,
              createdAt: retTs,
            });

            for (const it of cand.items) {
              salesReturnItemDrafts.push({
                srIdx,
                productId: it.prod.id,
                baseQty: qty4(D(it.baseQty)),
                unitSellingPrice: money(D(it.unitPrice)),
                unitCostSnapshot: it.unitCost.toFixed(4),
                lineTotal: money(it.lineTotal),
              });
            }

            // Update original sale directly in memory
            saleDrafts[cand.saleIdx].status = 'RETURNED';
            saleDrafts[cand.saleIdx].dueAmount = '0.00';

            // Adjust monthly accumulators only if the returned sale belonged to this same month
            if (cand.saleDate.startsWith(mWin.ym)) {
              monthSalesAccum = monthSalesAccum.minus(cand.totalAmount);
              monthCogsAccum = monthCogsAccum.minus(totalCogsRev);
              monthPaidAtSaleAccum = monthPaidAtSaleAccum.minus(cand.paidAtSale);
            }

            for (const it of cand.items) {
              it.prod.stock = it.prod.stock.plus(it.baseQty);
              it.prod.totalVal = it.prod.totalVal.plus(it.lineCogs);
              stockMoveDrafts.push({
                storeId,
                productId: it.prod.id,
                movementType: 'SALE_RETURN',
                quantityDelta: qty4(D(it.baseQty)),
                unitCost: it.unitCost.toFixed(4),
                balanceAfter: qty4(it.prod.stock),
                referenceType: 'RETURN',
                refKind: 'SALES_RETURN',
                refIdx: srIdx,
                notes: `Sales return ${retNo} (${cand.invoiceNumber})`,
                isDemo: true,
                createdByUid: actorUid,
                createdAt: retTs,
              });
            }

            if (refundMethod === 'CASH') {
              dayCashTracker.balance = dayCashTracker.balance.minus(cand.totalAmount);
              cashTxDrafts.push({
                storeId,
                regIdx,
                txType: 'SALES_RETURN_CASH',
                amount: money(cand.totalAmount),
                direction: 'OUT',
                referenceType: 'RETURN',
                refKind: 'SALES_RETURN',
                refIdx: srIdx,
                description: `Cash refund for return ${retNo} (${cand.invoiceNumber})`,
                isDemo: true,
                createdByUid: actorUid,
                createdAt: retTs,
              });
            }

            if (cand.customer) {
              const dueToCancel = cand.totalAmount.minus(cand.paidAtSale);
              if (refundMethod === 'CREDIT_ADJUSTMENT' && dueToCancel.gt(0)) {
                cand.customer.currentDue = cand.customer.currentDue.minus(dueToCancel);
                cand.customer.openInvoices = cand.customer.openInvoices.filter((inv) => inv.saleIdx !== cand.saleIdx);
                custLedgerDrafts.push({
                  storeId,
                  customerId: cand.customer.id,
                  entryDate: dateISO,
                  saleIdx: cand.saleIdx,
                  srIdx,
                  invoiceNumber: retNo,
                  transactionType: 'SALES_RETURN',
                  debitAmount: '0.00',
                  creditAmount: money(dueToCancel),
                  runningBalance: money(cand.customer.currentDue),
                  paymentMethod: 'CREDIT_ADJUSTMENT',
                  description: `Sales return credit (${retNo}) against ${cand.invoiceNumber}`,
                  isDemo: true,
                  createdAt: retTs,
                });
              }
            }

            totalSalesReturnsCount++;
          }
        }

        // D. Customer Due Collections (Multi-Invoice FIFO Allocations)
        const dueCandidates = creditCustStates.filter(
          (c) => c.currentDue.gt(200) && c.openInvoices.length > 0 && globalDayIdx - c.lastPaidDayIdx >= 5
        );

        const targetDuePayers = Math.min(dueCandidates.length, 3 + (rng() < 0.55 ? 1 : 0));
        for (let pIdx = 0; pIdx < targetDuePayers; pIdx++) {
          const c = pick(dueCandidates);
          if (c.currentDue.lte(150) || c.openInvoices.length === 0) continue;
          if (c.paymentDiscipline === 'OVERDUE' && (mIdx >= 4 || rng() < 0.65)) continue;
          if (c.paymentDiscipline === 'SLOW' && mIdx === 5 && rng() < 0.55) continue;

          const isFinalStretch = mIdx === 5 && dIdx >= 16;
          if (isFinalStretch && rng() < 0.45) continue;

          const maxAllocatable = c.openInvoices.reduce((acc, inv) => acc.plus(inv.dueAmount), D(0));
          const maxPayable = maxAllocatable.gt(c.currentDue) ? c.currentDue : maxAllocatable;
          if (maxPayable.lt(200)) continue;

          const payAmt =
            rng() < 0.45
              ? maxPayable
              : D(Math.max(200, Math.round((maxPayable.toNumber() * randRange(0.35, 0.78)) / 50) * 50));
          const finalPay = payAmt.gt(maxPayable) ? maxPayable : payAmt;
          if (finalPay.lte(0)) continue;

          const pmtMethod = pickDueMethod();
          const pmtTs = dhakaTimestamp(dateISO, 13 + Math.floor(rng() * 7), Math.floor(rng() * 58), 0);
          const rcpNo = `DRCP-${dateISO.replace(/-/g, '')}-${String(custPmtSeq++).padStart(4, '0')}`;
          const cpIdx = custPaymentDrafts.length;

          custPaymentDrafts.push({
            storeId,
            customerId: c.id,
            receiptNumber: rcpNo,
            amount: money(finalPay),
            paymentMethod: pmtMethod,
            paymentDate: dateISO,
            referenceNo: pmtMethod === 'CASH' ? '' : `${pmtMethod.slice(0, 2)}${String(5000000 + custPmtSeq * 19).slice(0, 8)}`,
            remarks: `Due collection (${c.customerType})`,
            isDemo: true,
            createdByUid: actorUid,
            createdAt: pmtTs,
          });

          let rem = finalPay;
          const allocInvoiceNos: string[] = [];

          for (const inv of c.openInvoices) {
            if (rem.lte(0)) break;
            if (inv.dueAmount.lte(0)) continue;
            const apply = rem.gt(inv.dueAmount) ? inv.dueAmount : rem;
            rem = rem.minus(apply);
            inv.dueAmount = inv.dueAmount.minus(apply);
            inv.paidAmount = inv.paidAmount.plus(apply);
            allocInvoiceNos.push(inv.invoiceNumber);

            paymentAllocDrafts.push({
              cpIdx,
              saleIdx: inv.saleIdx,
              allocatedAmount: money(apply),
              createdAt: pmtTs,
            });

            // Mutate sale draft in memory directly!
            saleDrafts[inv.saleIdx].paidAmount = money(inv.paidAmount);
            saleDrafts[inv.saleIdx].dueAmount = money(inv.dueAmount);
            saleDrafts[inv.saleIdx].paymentStatus = inv.dueAmount.lte(0) ? 'PAID' : 'PARTIAL';
          }

          c.openInvoices = c.openInvoices.filter((inv) => inv.dueAmount.gt(0));
          c.totalPaid = c.totalPaid.plus(finalPay);
          c.currentDue = c.currentDue.minus(finalPay);
          c.lastPaidDayIdx = globalDayIdx;

          custLedgerDrafts.push({
            storeId,
            customerId: c.id,
            entryDate: dateISO,
            cpIdx,
            invoiceNumber: rcpNo,
            transactionType: c.currentDue.lte(0) ? 'FULL_PAYMENT' : 'PARTIAL_PAYMENT',
            debitAmount: '0.00',
            creditAmount: money(finalPay),
            runningBalance: money(c.currentDue),
            paymentMethod: pmtMethod,
            description: `Due collected (${pmtMethod}) — Allocated: ${allocInvoiceNos.slice(0, 3).join(', ')}`,
            isDemo: true,
            createdAt: pmtTs,
          });

          if (pmtMethod === 'CASH') {
            dayCashTracker.balance = dayCashTracker.balance.plus(finalPay);
            cashTxDrafts.push({
              storeId,
              regIdx,
              txType: 'CUSTOMER_DUE_COLLECTION',
              amount: money(finalPay),
              direction: 'IN',
              referenceType: 'CUSTOMER_PAYMENT',
              refKind: 'CUSTOMER_PAYMENT',
              refIdx: cpIdx,
              description: `Cash due collection ${rcpNo} — ${c.name}`,
              isDemo: true,
              createdByUid: actorUid,
              createdAt: pmtTs,
            });
          }

          totalCustPaymentsCount++;
        }

        // E. Supplier Due Payments
        if (rng() < 0.85) {
          const owingSups = supStates.filter((s) => s.currentDue.gt(5000));
          if (owingSups.length > 0) {
            const sup = pick(owingSups);
            const payFrac = randRange(0.35, 0.72);
            const payAmt = D(Math.max(2000, Math.round((sup.currentDue.toNumber() * payFrac) / 500) * 500));
            const finalSupPay = payAmt.gt(sup.currentDue) ? sup.currentDue : payAmt;
            const sMethod = pickSupplierMethod();
            const sTs = dhakaTimestamp(dateISO, 15, 10 + Math.floor(rng() * 45), 0);
            const spNo = `DSPAY-${dateISO.replace(/-/g, '')}-${String(supPmtSeq++).padStart(4, '0')}`;
            const spIdx = supPaymentDrafts.length;

            supPaymentDrafts.push({
              storeId,
              supplierId: sup.id,
              receiptNumber: spNo,
              amount: money(finalSupPay),
              paymentMethod: sMethod,
              paymentDate: dateISO,
              remarks: `Supplier due payment (${sup.name})`,
              isDemo: true,
              createdByUid: actorUid,
              createdAt: sTs,
            });

            sup.totalPaid = sup.totalPaid.plus(finalSupPay);
            sup.currentDue = sup.currentDue.minus(finalSupPay);

            supLedgerDrafts.push({
              storeId,
              supplierId: sup.id,
              entryDate: dateISO,
              transactionType: 'PAYMENT',
              refKind: 'SUPPLIER_PAYMENT',
              refIdx: spIdx,
              invoiceNumber: spNo,
              debitAmount: '0.00',
              creditAmount: money(finalSupPay),
              runningBalance: money(sup.currentDue),
              paymentMethod: sMethod,
              description: `Supplier due payment ${spNo} (${sMethod})`,
              isDemo: true,
              createdAt: sTs,
            });

            if (sMethod === 'CASH') {
              dayCashTracker.balance = dayCashTracker.balance.minus(finalSupPay);
              cashTxDrafts.push({
                storeId,
                regIdx,
                txType: 'SUPPLIER_PAYMENT',
                amount: money(finalSupPay),
                direction: 'OUT',
                referenceType: 'SUPPLIER_PAYMENT',
                refKind: 'SUPPLIER_PAYMENT',
                refIdx: spIdx,
                description: `Cash supplier payment ${spNo} (${sup.name})`,
                isDemo: true,
                createdByUid: actorUid,
                createdAt: sTs,
              });
            }

            totalSupPaymentsCount++;
          }
        }

        // F. Stock Adjustments
        if (globalDayIdx % 7 === 0) {
          const adjProd = pick(prodStates.filter((p) => p.stock.gte(8)));
          if (adjProd) {
            const rAdj = rng();
            const adjType: 'DAMAGE' | 'EXPIRED' | 'DECREASE' | 'INCREASE' =
              rAdj < 0.45 ? 'DAMAGE' : rAdj < 0.78 ? 'EXPIRED' : rAdj < 0.90 ? 'DECREASE' : 'INCREASE';
            const qty = Math.min(3, Math.max(1, Math.floor(rng() * 3) + 1));
            const uCost = getWac(adjProd);
            const valDelta = uCost.times(qty).toDecimalPlaces(2);
            const adjTs = dhakaTimestamp(dateISO, 18, 30, 0);

            const reasonMap = {
              DAMAGE: 'Torn packet / broken bottle during shelf restocking',
              EXPIRED: 'Expired batch removed during shelf audit',
              DECREASE: 'Monthly physical stock count shrinkage',
              INCREASE: 'Physical stock count surplus reconciled',
            };

            stockAdjDrafts.push({
              storeId,
              productId: adjProd.id,
              adjustmentType: adjType,
              quantity: qty4(D(qty)),
              unitCost: uCost.toFixed(4),
              reason: reasonMap[adjType],
              isDemo: true,
              createdByUid: actorUid,
              createdAt: adjTs,
            });

            if (adjType === 'INCREASE') {
              adjProd.stock = adjProd.stock.plus(qty);
              adjProd.totalVal = adjProd.totalVal.plus(valDelta);
            } else {
              adjProd.stock = adjProd.stock.minus(qty);
              adjProd.totalVal = adjProd.totalVal.minus(valDelta);
            }

            stockMoveDrafts.push({
              storeId,
              productId: adjProd.id,
              movementType: adjType === 'INCREASE' ? 'ADJUSTMENT_IN' : adjType === 'DECREASE' ? 'ADJUSTMENT_OUT' : adjType,
              quantityDelta: qty4(D(adjType === 'INCREASE' ? qty : -qty)),
              unitCost: uCost.toFixed(4),
              balanceAfter: qty4(adjProd.stock),
              referenceType: 'ADJUSTMENT',
              notes: reasonMap[adjType],
              isDemo: true,
              createdByUid: actorUid,
              createdAt: adjTs,
            });
            totalStockAdjCount++;
          }
        }

        // G. Operating Expenses
        const logExpense = (
          catName: string,
          amount: number,
          method: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK',
          desc: string,
          hour: number
        ) => {
          const catId = expCatByName.get(catName) ?? Array.from(expCatByName.values())[0];
          const amtD = D(amount);
          const eTs = dhakaTimestamp(dateISO, hour, Math.floor(rng() * 55), 0);
          expenseDrafts.push({
            storeId,
            categoryId: catId,
            amount: money(amtD),
            expenseDate: dateISO,
            paymentMethod: method,
            description: desc,
            attachmentRef: `VCH-${dateISO.replace(/-/g, '')}-${catName.slice(0, 3).toUpperCase()}`,
            isDemo: true,
            createdByUid: actorUid,
            createdAt: eTs,
          });
          if (method === 'CASH') {
            dayCashTracker.balance = dayCashTracker.balance.minus(amtD);
            cashTxDrafts.push({
              storeId,
              regIdx,
              txType: 'EXPENSE_CASH',
              amount: money(amtD),
              direction: 'OUT',
              referenceType: 'EXPENSE',
              description: `${catName}: ${desc}`,
              isDemo: true,
              createdByUid: actorUid,
              createdAt: eTs,
            });
          }
        };

        const dayNum = dIdx + 1;
        if (dayNum === 2) logExpense('Shop Rent', rentAmt, 'BANK', `Monthly shop rent (${mWin.ym})`, 11);
        if (dayNum === 5) {
          logExpense('Employee Salary', salaryStaff1, 'CASH', `Salesman salary — Md. Sohel (${mWin.ym})`, 19);
          logExpense('Employee Salary', salaryStaff2, 'CASH', `Counter cashier salary — Md. Rubel (${mWin.ym})`, 19);
          logExpense('Employee Salary', salaryStaff3, 'BKASH', `Helper salary — Md. Arif (${mWin.ym})`, 19);
        }
        if (dayNum === 10) logExpense('Electricity Bill', elecAmt, 'BKASH', `DESCO commercial electricity bill (${mWin.ym})`, 12);
        if (dayNum === 12) {
          logExpense('Internet & Mobile', netAmt, 'BKASH', `Broadband WiFi & shop mobile pack (${mWin.ym})`, 13);
          logExpense('Security & Guard Fee', secAmt, 'CASH', `Market night guard & association fee (${mWin.ym})`, 14);
        }
        if (dayNum === 15) {
          logExpense('Software Subscription', softAmt, 'BKASH', `POS cloud backup & SMS bundle (${mWin.ym})`, 12);
          logExpense('Water & Utility Bill', waterAmt, 'NAGAD', `WASA water & utility charges (${mWin.ym})`, 13);
        }
        if (dayNum === 22) {
          logExpense('Bank Charges', Math.round(randRange(450, 750)), 'BANK', `Bank account & cheque maintenance fee (${mWin.ym})`, 15);
          logExpense('bKash / Nagad Charges', Math.round(randRange(1400, 2200) / 50) * 50, 'BKASH', `Merchant MFS cash-out & settlement charges (${mWin.ym})`, 16);
        }
        if (dayNum === 26) {
          logExpense('Marketing & Promotion', Math.round(randRange(1200, 2400) / 100) * 100, 'CASH', `Local leaflets & festive offer banners (${mWin.ym})`, 14);
          logExpense('Printing & Stationery', Math.round(randRange(700, 1200) / 50) * 50, 'CASH', `Thermal POS receipt rolls, ledger pads & pens`, 14);
        }

        if (dayNum % 3 === 0) {
          logExpense('Transportation', Math.round(randRange(350, 850) / 50) * 50, 'CASH', 'Rickshaw van & pickup fare from wholesale market', 11);
        }
        if (dayNum % 4 === 0) {
          logExpense('Loading / Unloading', Math.round(randRange(250, 600) / 50) * 50, 'CASH', 'Sack & carton coolie / unloading labor', 10);
          logExpense('Tea & Refreshments', Math.round(randRange(220, 420) / 10) * 10, 'CASH', 'Staff tea, snacks & distributor hospitality', 17);
        }
        if (dayNum % 5 === 0) {
          logExpense('Packaging & Polybags', Math.round(randRange(650, 1200) / 50) * 50, 'CASH', 'Carry bags, paper sacks & brown wrapping tape', 12);
          logExpense('Local Delivery Cost', Math.round(randRange(300, 650) / 50) * 50, 'CASH', 'Home delivery rider charges for VIP/Wholesale orders', 16);
        }
        if (dayNum % 6 === 0) {
          logExpense('Shop Cleaning & Hygiene', Math.round(randRange(300, 550) / 50) * 50, 'CASH', 'Floor wash, detergent & cleaner wages', 9);
          logExpense('Product Handling & Ice', Math.round(randRange(250, 500) / 50) * 50, 'CASH', 'Freezer maintenance & cold-drink handling', 15);
        }
        if (dayNum % 9 === 0) {
          logExpense('Generator & Fuel', Math.round(randRange(700, 1400) / 50) * 50, 'CASH', 'Load-shedding IPS/generator diesel & fuel', 18);
        }
        if (dayNum === 18) {
          logExpense('Maintenance & Repair', Math.round(randRange(1000, 2400) / 100) * 100, 'CASH', 'Shelf welding, LED lights & chiller service', 15);
        }
        if (dayNum === 25 && mIdx % 2 === 0) {
          logExpense('Equipment Repair', Math.round(randRange(900, 1800) / 100) * 100, 'CASH', 'Digital weighing scale & barcode scanner servicing', 16);
        }
        if (dayNum === 28) {
          logExpense('Other Expenses', Math.round(randRange(600, 1200) / 50) * 50, 'CASH', 'Market welfare & miscellaneous shop costs', 18);
        }

        // H. Treasury Cash Flow
        if (dayNum === 20) {
          const drawAmt = D(30000);
          if (dayCashTracker.balance.gt(drawAmt.plus(12000))) {
            dayCashTracker.balance = dayCashTracker.balance.minus(drawAmt);
            cashTxDrafts.push({
              storeId,
              regIdx,
              txType: 'OWNER_DRAWING',
              amount: money(drawAmt),
              direction: 'OUT',
              referenceType: 'OWNER',
              description: `Monthly owner household drawing (${mWin.ym})`,
              isDemo: true,
              createdByUid: actorUid,
              createdAt: dhakaTimestamp(dateISO, 20, 15, 0),
            });
          }
        }

        if (dayCashTracker.balance.lt(12000)) {
          const withdrawAmt = D(Math.ceil((35000 - dayCashTracker.balance.toNumber()) / 5000) * 5000);
          dayCashTracker.balance = dayCashTracker.balance.plus(withdrawAmt);
          cashTxDrafts.push({
            storeId,
            regIdx,
            txType: 'BANK_WITHDRAWAL',
            amount: money(withdrawAmt),
            direction: 'IN',
            referenceType: 'BANK',
            description: 'Cash withdrawn from business bank account for supplier float',
            isDemo: true,
            createdByUid: actorUid,
            createdAt: dhakaTimestamp(dateISO, 20, 45, 0),
          });
        }

        if (dayCashTracker.balance.gt(68000)) {
          const depositAmt = D(Math.floor((dayCashTracker.balance.toNumber() - 32000) / 5000) * 5000);
          if (depositAmt.gt(0)) {
            dayCashTracker.balance = dayCashTracker.balance.minus(depositAmt);
            cashTxDrafts.push({
              storeId,
              regIdx,
              txType: 'BANK_DEPOSIT',
              amount: money(depositAmt),
              direction: 'OUT',
              referenceType: 'BANK',
              description: 'Surplus counter cash deposited to Islami Bank / DBBL business account',
              isDemo: true,
              createdByUid: actorUid,
              createdAt: dhakaTimestamp(dateISO, 21, 30, 0),
            });
          }
        }

        // Close daily register directly in memory!
        const closeTs = dhakaTimestamp(dateISO, 22, 30, 0);
        registerDrafts[regIdx].closedByUid = actorUid;
        registerDrafts[regIdx].closedAt = closeTs;
        registerDrafts[regIdx].expectedClosing = money(dayCashTracker.balance);
        registerDrafts[regIdx].actualClosing = money(dayCashTracker.balance);
        registerDrafts[regIdx].status = 'CLOSED';

        runningCashFloat = dayCashTracker.balance;
      }
    }

    // 6. Active Register for Today carrying forward the reconciled float
    const activeRegIdx = registerDrafts.length;
    registerDrafts.push({
      storeId,
      openedByUid: actorUid,
      openedAt: todayNow,
      openingBalance: money(runningCashFloat),
      status: 'OPEN',
      notes: 'Active register carrying forward 6-month reconciled cash float',
      isDemo: true,
    });
    cashTxDrafts.push({
      storeId,
      regIdx: activeRegIdx,
      txType: 'OPENING',
      amount: money(runningCashFloat),
      direction: 'IN',
      referenceType: 'REGISTER',
      refKind: 'REGISTER',
      refIdx: activeRegIdx,
      description: 'Opening cash float carried forward from demo period',
      isDemo: true,
      createdByUid: actorUid,
      createdAt: todayNow,
    });

    // 7. Due Reminders & Customer Disputes
    const overdueCustomers = custStates
      .filter((c) => c.currentDue.gt(1500) && c.openInvoices.some((inv) => inv.expectedPaymentDate < win.periodEnd))
      .slice(0, 18);

    for (let i = 0; i < overdueCustomers.length; i++) {
      const c = overdueCustomers[i];
      const oldestInv = c.openInvoices[0];
      dueReminderDrafts.push({
        storeId,
        customerId: c.id,
        saleIdx: oldestInv?.saleIdx,
        reminderType: i % 3 === 0 ? 'OVERDUE_REMINDER' : 'DUE_REMINDER',
        channel: i % 2 === 0 ? 'WHATSAPP' : 'SMS',
        message: `আসসালামু আলাইকুম ${c.name}, মুদির দোকান প্রো-তে আপনার বকেয়া ৳${money(c.currentDue)}। অনুগ্রহ করে সুবিধামতো পরিশোধ করুন।`,
        status: 'SENT',
        scheduledFor: win.periodEnd,
        isDemo: true,
        sentAt: dhakaTimestamp(win.periodEnd, 11, 30, 0),
        createdAt: dhakaTimestamp(win.periodEnd, 11, 30, 0),
      });
    }

    for (let i = 0; i < Math.min(4, overdueCustomers.length); i++) {
      const c = overdueCustomers[i];
      const inv = c.openInvoices[0];
      const resolved = i < 2;
      disputeDrafts.push({
        storeId,
        customerId: c.id,
        saleIdx: inv?.saleIdx,
        reason:
          i === 0
            ? 'Requested verification of 5L soybean oil quantity on invoice'
            : i === 1
            ? 'Confirmed partial bKash payment reference matching'
            : 'Customer asked to re-check rice weight on last credit bill',
        status: resolved ? 'RESOLVED' : 'OPEN',
        resolutionNote: resolved ? 'Verified receipt & CCTV counter slip with customer.' : '',
        isDemo: true,
        createdAt: dhakaTimestamp(addDaysISO(win.periodEnd, -(i + 2)), 14, 0, 0),
        resolvedAt: resolved ? dhakaTimestamp(addDaysISO(win.periodEnd, -i), 16, 0, 0) : null,
      });
    }

    // -----------------------------------------------------------------------
    // 8. BULK INSERT ALL PARENT TABLES FIRST & MAP REAL DB IDs
    // -----------------------------------------------------------------------
    const regIds = await batchInsertReturningIds(tx, cashRegisters, registerDrafts, 1200);
    const purIds = await batchInsertReturningIds(tx, purchases, purchaseDrafts, 1200);
    const prIds = await batchInsertReturningIds(
      tx,
      purchaseReturns,
      purchaseReturnDrafts.map(({ purIdx, ...rest }) => ({ ...rest, purchaseId: purIds[purIdx] })),
      1200
    );
    const saleIds = await batchInsertReturningIds(tx, sales, saleDrafts, 1200);
    const srIds = await batchInsertReturningIds(
      tx,
      salesReturns,
      salesReturnDrafts.map(({ saleIdx, ...rest }) => ({ ...rest, saleId: saleIds[saleIdx] })),
      1200
    );
    const cpIds = await batchInsertReturningIds(tx, customerPayments, custPaymentDrafts, 1200);
    const spIds = await batchInsertReturningIds(tx, supplierPayments, supPaymentDrafts, 1200);

    // -----------------------------------------------------------------------
    // 9. BULK INSERT ALL CHILD & LEDGER TABLES
    // -----------------------------------------------------------------------
    await batchInsert(
      tx,
      purchaseItems,
      purchaseItemDrafts.map(({ purIdx, ...rest }) => ({ ...rest, purchaseId: purIds[purIdx] })),
      1200
    );
    await batchInsert(
      tx,
      purchaseReturnItems,
      purchaseReturnItemDrafts.map(({ prIdx, ...rest }) => ({ ...rest, purchaseReturnId: prIds[prIdx] })),
      1200
    );
    await batchInsert(
      tx,
      saleItems,
      saleItemDrafts.map(({ saleIdx, ...rest }) => ({ ...rest, saleId: saleIds[saleIdx] })),
      1200
    );
    await batchInsert(
      tx,
      salesReturnItems,
      salesReturnItemDrafts.map(({ srIdx, ...rest }) => ({ ...rest, salesReturnId: srIds[srIdx] })),
      1200
    );
    await batchInsert(
      tx,
      payments,
      paymentDrafts.map(({ saleIdx, ...rest }) => ({ ...rest, saleId: saleIds[saleIdx] })),
      1200
    );
    await batchInsert(
      tx,
      paymentAllocations,
      paymentAllocDrafts.map((a) => ({
        storeId,
        customerPaymentId: cpIds[a.cpIdx],
        saleId: saleIds[a.saleIdx],
        allocatedAmount: a.allocatedAmount,
        isDemo: true,
        createdAt: a.createdAt,
      })),
      1200
    );
    await batchInsert(
      tx,
      stockMovements,
      stockMoveDrafts.map(({ refKind, refIdx, ...rest }) => {
        let referenceId: number | null = null;
        if (refKind === 'PURCHASE' && refIdx !== undefined) referenceId = purIds[refIdx];
        else if (refKind === 'PURCHASE_RETURN' && refIdx !== undefined) referenceId = prIds[refIdx];
        else if (refKind === 'SALE' && refIdx !== undefined) referenceId = saleIds[refIdx];
        else if (refKind === 'SALES_RETURN' && refIdx !== undefined) referenceId = srIds[refIdx];
        return { ...rest, referenceId };
      }),
      1400
    );
    await batchInsert(tx, stockAdjustments, stockAdjDrafts, 1200);
    await batchInsert(
      tx,
      supplierLedger,
      supLedgerDrafts.map(({ refKind, refIdx, ...rest }) => {
        let referenceId: number | null = null;
        if (refKind === 'PURCHASE' && refIdx !== undefined) referenceId = purIds[refIdx];
        else if (refKind === 'PURCHASE_RETURN' && refIdx !== undefined) referenceId = prIds[refIdx];
        else if (refKind === 'SUPPLIER_PAYMENT' && refIdx !== undefined) referenceId = spIds[refIdx];
        return { ...rest, referenceId };
      }),
      1200
    );
    await batchInsert(
      tx,
      customerLedger,
      custLedgerDrafts.map(({ saleIdx, cpIdx, srIdx, ...rest }) => ({
        ...rest,
        saleId: saleIdx !== undefined ? saleIds[saleIdx] : null,
        customerPaymentId: cpIdx !== undefined ? cpIds[cpIdx] : null,
        salesReturnId: srIdx !== undefined ? srIds[srIdx] : null,
      })),
      1200
    );
    await batchInsert(tx, expenses, expenseDrafts, 1200);
    await batchInsert(
      tx,
      cashTransactions,
      cashTxDrafts.map(({ regIdx, refKind, refIdx, ...rest }) => {
        let referenceId: number | null = null;
        if (refKind === 'REGISTER' && refIdx !== undefined) referenceId = regIds[refIdx];
        else if (refKind === 'PURCHASE' && refIdx !== undefined) referenceId = purIds[refIdx];
        else if (refKind === 'SALE' && refIdx !== undefined) referenceId = saleIds[refIdx];
        else if (refKind === 'SALES_RETURN' && refIdx !== undefined) referenceId = srIds[refIdx];
        else if (refKind === 'CUSTOMER_PAYMENT' && refIdx !== undefined) referenceId = cpIds[refIdx];
        else if (refKind === 'SUPPLIER_PAYMENT' && refIdx !== undefined) referenceId = spIds[refIdx];
        return { ...rest, registerId: regIds[regIdx], referenceId };
      }),
      1200
    );
    await batchInsert(
      tx,
      dueReminders,
      dueReminderDrafts.map(({ saleIdx, ...rest }) => ({ ...rest, saleId: saleIdx !== undefined ? saleIds[saleIdx] : null })),
      1200
    );
    await batchInsert(
      tx,
      customerDisputes,
      disputeDrafts.map(({ saleIdx, ...rest }) => ({ ...rest, saleId: saleIdx !== undefined ? saleIds[saleIdx] : null })),
      1200
    );

    // -----------------------------------------------------------------------
    // 10. BULK UPDATE Final Product Stocks/WAC, Customer Totals, and Supplier Totals (3 SQL queries!)
    // -----------------------------------------------------------------------
    if (prodStates.length > 0) {
      const pTuples = sql.join(
        prodStates.map((p) => {
          const wac = getWac(p);
          return sql`(${p.id}::int, ${qty4(p.stock)}::numeric(14,4), ${wac.toFixed(4)}::numeric(14,4), ${p.lastCost.toFixed(4)}::numeric(14,4))`;
        }),
        sql`, `
      );
      await tx.execute(sql`
        UPDATE products AS p
        SET current_stock = v.stock, avg_cost_price = v.wac, last_purchase_price = v.last_cost, updated_at = NOW()
        FROM (VALUES ${pTuples}) AS v(id, stock, wac, last_cost)
        WHERE p.id = v.id
      `);
    }

    if (custStates.length > 0) {
      const cTuples = sql.join(
        custStates.map(
          (c) =>
            sql`(${c.id}::int, ${money(c.totalPurchases)}::numeric(14,2), ${money(c.totalPaid)}::numeric(14,2), ${money(c.currentDue)}::numeric(14,2))`
        ),
        sql`, `
      );
      await tx.execute(sql`
        UPDATE customers AS c
        SET total_purchases = v.tp, total_paid = v.tpaid, current_due = v.due, updated_at = NOW()
        FROM (VALUES ${cTuples}) AS v(id, tp, tpaid, due)
        WHERE c.id = v.id
      `);
    }

    if (supStates.length > 0) {
      const sTuples = sql.join(
        supStates.map(
          (s) =>
            sql`(${s.id}::int, ${money(s.totalPurchases)}::numeric(14,2), ${money(s.totalPaid)}::numeric(14,2), ${money(s.currentDue)}::numeric(14,2))`
        ),
        sql`, `
      );
      await tx.execute(sql`
        UPDATE suppliers AS s
        SET total_purchases = v.tp, total_paid = v.tpaid, current_due = v.due
        FROM (VALUES ${sTuples}) AS v(id, tp, tpaid, due)
        WHERE s.id = v.id
      `);
    }

    // -----------------------------------------------------------------------
    // 11. Activate DEMO MODE Flag & Period Metadata on Store Settings
    // -----------------------------------------------------------------------
    await tx
      .update(storeSettings)
      .set({
        demoModeActive: true,
        demoPeriodStart: win.periodStart,
        demoPeriodEnd: win.periodEnd,
        demoLoadedAt: todayNow,
        updatedAt: todayNow,
      })
      .where(eq(storeSettings.storeId, storeId));
  });

  const reconciliation = await verifyDemoReconciliation(storeId);

  return {
    periodStart: win.periodStart,
    periodEnd: win.periodEnd,
    productsCount: reconciliation.counts.products,
    suppliersCount: reconciliation.counts.suppliers,
    customersCount: reconciliation.counts.customers,
    purchasesCount: totalPurchasesCount,
    salesCount: totalSalesCount,
    creditSalesCount: totalCreditSalesCount,
    customerPaymentsCount: totalCustPaymentsCount,
    supplierPaymentsCount: totalSupPaymentsCount,
    expensesCount: reconciliation.counts.expenses,
    salesReturnsCount: totalSalesReturnsCount,
    purchaseReturnsCount: totalPurchaseReturnsCount,
    stockAdjustmentsCount: totalStockAdjCount,
    cashRegistersCount: win.allDays.length + 1,
    totalSales: reconciliation.sixMonthFinancials.totalSales,
    paidAtSale: reconciliation.sixMonthFinancials.paidAtSale,
    creditIssuedAtSale: reconciliation.sixMonthFinancials.creditIssuedAtSale,
    totalCogs: reconciliation.sixMonthFinancials.totalCogs,
    grossProfit: reconciliation.sixMonthFinancials.grossProfit,
    grossMarginPct: reconciliation.sixMonthFinancials.grossMarginPct,
    operatingExpenses: reconciliation.sixMonthFinancials.operatingExpenses,
    netProfit: reconciliation.sixMonthFinancials.netProfit,
    reconciliation,
  };
}

export interface DemoCheckResult {
  key: string;
  label: string;
  passed: boolean;
  actual: string;
  expected: string;
}

export interface DemoVerificationReport {
  allPassed: boolean;
  periodStart: string;
  periodEnd: string;
  counts: {
    products: number;
    suppliers: number;
    customers: number;
    purchases: number;
    sales: number;
    creditSales: number;
    customerPayments: number;
    supplierPayments: number;
    expenses: number;
    salesReturns: number;
    purchaseReturns: number;
    stockAdjustments: number;
  };
  sixMonthFinancials: {
    totalSales: string;
    paidAtSale: string;
    creditIssuedAtSale: string;
    dueCollections: string;
    totalCogs: string;
    grossProfit: string;
    grossMarginPct: string;
    operatingExpenses: string;
    netProfit: string;
    closingInventoryValue: string;
    customerOutstanding: string;
    supplierOutstanding: string;
  };
  monthlyBreakdown: Array<{
    ym: string;
    totalSales: string;
    paidAtSale: string;
    creditIssuedAtSale: string;
    cogs: string;
    grossProfit: string;
    grossMarginPct: string;
    expenses: string;
    netProfit: string;
    salesCount: number;
  }>;
  checks: DemoCheckResult[];
}

/**
 * Automated Accounting & Integrity Reconciliation Audit directly against PostgreSQL.
 */
export async function verifyDemoReconciliation(storeId: number): Promise<DemoVerificationReport> {
  const [settingsRow] = await db.select().from(storeSettings).where(eq(storeSettings.storeId, storeId)).limit(1);
  const win = getSixMonthDemoWindow();
  const periodStart = settingsRow?.demoPeriodStart || win.periodStart;
  const periodEnd = settingsRow?.demoPeriodEnd || win.periodEnd;

  const [
    countsRes,
    salesSummaryRes,
    paidAtSaleRes,
    dueCollRes,
    expenseRes,
    monthlySalesRes,
    monthlyPaidRes,
    monthlyExpRes,
    custReconRes,
    supReconRes,
    invReconRes,
    cashReconRes,
    orphanRes,
  ] = await Promise.all([
    db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM products WHERE store_id = ${storeId} AND is_active = true)::int AS products,
        (SELECT COUNT(*) FROM suppliers WHERE store_id = ${storeId} AND is_active = true)::int AS suppliers,
        (SELECT COUNT(*) FROM customers WHERE store_id = ${storeId} AND is_active = true)::int AS customers,
        (SELECT COUNT(*) FROM purchases WHERE store_id = ${storeId} AND purchase_date >= ${periodStart} AND purchase_date <= ${periodEnd})::int AS purchases,
        (SELECT COUNT(*) FROM sales WHERE store_id = ${storeId} AND status = 'COMPLETED' AND sale_date >= ${periodStart} AND sale_date <= ${periodEnd})::int AS sales,
        (SELECT COUNT(*) FROM sales s WHERE s.store_id = ${storeId} AND s.status = 'COMPLETED' AND s.sale_date >= ${periodStart} AND s.sale_date <= ${periodEnd}
          AND s.total_amount > COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.sale_id = s.id), 0))::int AS credit_sales,
        (SELECT COUNT(*) FROM customer_payments WHERE store_id = ${storeId} AND payment_date >= ${periodStart} AND payment_date <= ${periodEnd})::int AS customer_payments,
        (SELECT COUNT(*) FROM supplier_payments WHERE store_id = ${storeId} AND payment_date >= ${periodStart} AND payment_date <= ${periodEnd})::int AS supplier_payments,
        (SELECT COUNT(*) FROM expenses WHERE store_id = ${storeId} AND expense_date >= ${periodStart} AND expense_date <= ${periodEnd})::int AS expenses,
        (SELECT COUNT(*) FROM sales_returns WHERE store_id = ${storeId})::int AS sales_returns,
        (SELECT COUNT(*) FROM purchase_returns WHERE store_id = ${storeId})::int AS purchase_returns,
        (SELECT COUNT(*) FROM stock_adjustments WHERE store_id = ${storeId})::int AS stock_adjustments
    `),
    db.execute(sql`
      SELECT
        COALESCE(SUM(total_amount), 0)::numeric(14,2) AS total_sales,
        COALESCE(SUM(total_cogs), 0)::numeric(14,2) AS total_cogs,
        COALESCE(SUM(gross_profit), 0)::numeric(14,2) AS gross_profit
      FROM sales
      WHERE store_id = ${storeId} AND status = 'COMPLETED' AND sale_date >= ${periodStart} AND sale_date <= ${periodEnd}
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(p.amount), 0)::numeric(14,2) AS paid_at_sale
      FROM payments p
      INNER JOIN sales s ON s.id = p.sale_id
      WHERE s.store_id = ${storeId} AND s.status = 'COMPLETED' AND s.sale_date >= ${periodStart} AND s.sale_date <= ${periodEnd}
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(amount), 0)::numeric(14,2) AS due_collections
      FROM customer_payments
      WHERE store_id = ${storeId} AND payment_date >= ${periodStart} AND payment_date <= ${periodEnd}
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(amount), 0)::numeric(14,2) AS total_expenses
      FROM expenses
      WHERE store_id = ${storeId} AND expense_date >= ${periodStart} AND expense_date <= ${periodEnd}
    `),
    db.execute(sql`
      SELECT
        SUBSTRING(sale_date, 1, 7) AS ym,
        COUNT(*)::int AS sales_count,
        COALESCE(SUM(total_amount), 0)::numeric(14,2) AS total_sales,
        COALESCE(SUM(total_cogs), 0)::numeric(14,2) AS total_cogs,
        COALESCE(SUM(gross_profit), 0)::numeric(14,2) AS gross_profit
      FROM sales
      WHERE store_id = ${storeId} AND status = 'COMPLETED' AND sale_date >= ${periodStart} AND sale_date <= ${periodEnd}
      GROUP BY SUBSTRING(sale_date, 1, 7)
      ORDER BY ym
    `),
    db.execute(sql`
      SELECT
        SUBSTRING(s.sale_date, 1, 7) AS ym,
        COALESCE(SUM(p.amount), 0)::numeric(14,2) AS paid_at_sale
      FROM payments p
      INNER JOIN sales s ON s.id = p.sale_id
      WHERE s.store_id = ${storeId} AND s.status = 'COMPLETED' AND s.sale_date >= ${periodStart} AND s.sale_date <= ${periodEnd}
      GROUP BY SUBSTRING(s.sale_date, 1, 7)
    `),
    db.execute(sql`
      SELECT
        SUBSTRING(expense_date, 1, 7) AS ym,
        COALESCE(SUM(amount), 0)::numeric(14,2) AS total_expenses
      FROM expenses
      WHERE store_id = ${storeId} AND expense_date >= ${periodStart} AND expense_date <= ${periodEnd}
      GROUP BY SUBSTRING(expense_date, 1, 7)
    `),
    db.execute(sql`
      SELECT
        COALESCE(SUM(c.current_due), 0)::numeric(14,2) AS cust_table_due,
        COALESCE(SUM(COALESCE(l.ledger_due, c.opening_balance)), 0)::numeric(14,2) AS ledger_due,
        COUNT(*) FILTER (WHERE ABS(c.current_due - COALESCE(l.ledger_due, c.opening_balance)) > 0.05)::int AS mismatched_customers
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, SUM(debit_amount - credit_amount) AS ledger_due
        FROM customer_ledger
        WHERE store_id = ${storeId}
        GROUP BY customer_id
      ) l ON l.customer_id = c.id
      WHERE c.store_id = ${storeId}
    `),
    db.execute(sql`
      SELECT
        COALESCE(SUM(s.current_due), 0)::numeric(14,2) AS sup_table_due,
        COALESCE(SUM(COALESCE(l.ledger_due, s.opening_balance)), 0)::numeric(14,2) AS ledger_due,
        COUNT(*) FILTER (WHERE ABS(s.current_due - COALESCE(l.ledger_due, s.opening_balance)) > 0.05)::int AS mismatched_suppliers
      FROM suppliers s
      LEFT JOIN (
        SELECT supplier_id, SUM(debit_amount - credit_amount) AS ledger_due
        FROM supplier_ledger
        WHERE store_id = ${storeId}
        GROUP BY supplier_id
      ) l ON l.supplier_id = s.id
      WHERE s.store_id = ${storeId}
    `),
    db.execute(sql`
      SELECT
        COALESCE((SELECT SUM(quantity_delta * unit_cost) FROM stock_movements WHERE store_id = ${storeId} AND movement_type = 'OPENING'), 0)::numeric(14,2) AS opening_val,
        COALESCE((SELECT SUM(quantity_delta * unit_cost) FROM stock_movements WHERE store_id = ${storeId} AND movement_type = 'PURCHASE_IN'), 0)::numeric(14,2) AS purchase_val,
        COALESCE((SELECT SUM(ABS(quantity_delta) * unit_cost) FROM stock_movements WHERE store_id = ${storeId} AND movement_type = 'PURCHASE_RETURN'), 0)::numeric(14,2) AS pur_ret_val,
        COALESCE((SELECT SUM(ABS(quantity_delta) * unit_cost) FROM stock_movements WHERE store_id = ${storeId} AND movement_type = 'SALE_OUT'), 0)::numeric(14,2) AS sale_out_val,
        COALESCE((SELECT SUM(quantity_delta * unit_cost) FROM stock_movements WHERE store_id = ${storeId} AND movement_type = 'SALE_RETURN'), 0)::numeric(14,2) AS sale_ret_val,
        COALESCE((SELECT SUM(quantity_delta * unit_cost) FROM stock_movements WHERE store_id = ${storeId} AND movement_type IN ('DAMAGE', 'EXPIRED', 'ADJUSTMENT_OUT', 'ADJUSTMENT_IN')), 0)::numeric(14,2) AS adj_val,
        COALESCE((SELECT SUM(current_stock * avg_cost_price) FROM products WHERE store_id = ${storeId} AND current_stock > 0), 0)::numeric(14,2) AS closing_val
    `),
    db.execute(sql`
      SELECT
        COUNT(*)::int AS total_closed_registers,
        COUNT(*) FILTER (WHERE ABS(COALESCE(r.actual_closing, 0) - COALESCE(t.net_cash, 0)) > 0.05)::int AS mismatched_registers
      FROM cash_registers r
      LEFT JOIN (
        SELECT register_id, SUM(CASE WHEN direction = 'IN' THEN amount ELSE -amount END) AS net_cash
        FROM cash_transactions
        WHERE store_id = ${storeId}
        GROUP BY register_id
      ) t ON t.register_id = r.id
      WHERE r.store_id = ${storeId} AND r.status = 'CLOSED' AND r.is_demo = true
    `),
    db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM sales WHERE store_id = ${storeId} AND status = 'COMPLETED' AND due_amount > 0 AND customer_id IS NULL)::int AS anon_credit_sales,
        (SELECT COUNT(*) FROM products WHERE store_id = ${storeId} AND current_stock < 0)::int AS negative_stock_products,
        (SELECT COUNT(*) FROM sale_items si LEFT JOIN sales s ON s.id = si.sale_id WHERE s.id IS NULL)::int AS orphan_sale_items
    `),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cRow = (countsRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sRow = (salesSummaryRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pRow = (paidAtSaleRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dRow = (dueCollRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eRow = (expenseRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const custRow = (custReconRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supRow = (supReconRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invRow = (invReconRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cashRow = (cashReconRes.rows[0] || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orphRow = (orphanRes.rows[0] || {}) as any;

  const totalSales = D(sRow.total_sales || 0);
  const totalCogs = D(sRow.total_cogs || 0);
  const grossProfit = totalSales.minus(totalCogs);
  const grossMarginPct = totalSales.gt(0) ? grossProfit.dividedBy(totalSales).times(100) : D(0);
  const paidAtSale = D(pRow.paid_at_sale || 0);
  const creditIssuedAtSale = totalSales.minus(paidAtSale);
  const dueCollections = D(dRow.due_collections || 0);
  const totalExpenses = D(eRow.total_expenses || 0);
  const netProfit = grossProfit.minus(totalExpenses);

  const paidByYm = new Map<string, ReturnType<typeof D>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of monthlyPaidRes.rows as any[]) paidByYm.set(String(r.ym), D(r.paid_at_sale || 0));
  const expByYm = new Map<string, ReturnType<typeof D>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of monthlyExpRes.rows as any[]) expByYm.set(String(r.ym), D(r.total_expenses || 0));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyBreakdown = (monthlySalesRes.rows as any[]).map((r) => {
    const ym = String(r.ym);
    const ms = D(r.total_sales || 0);
    const mc = D(r.total_cogs || 0);
    const mgp = ms.minus(mc);
    const mp = paidByYm.get(ym) || D(0);
    const mcred = ms.minus(mp);
    const mexp = expByYm.get(ym) || D(0);
    const mnp = mgp.minus(mexp);
    return {
      ym,
      totalSales: money(ms),
      paidAtSale: money(mp),
      creditIssuedAtSale: money(mcred),
      cogs: money(mc),
      grossProfit: money(mgp),
      grossMarginPct: ms.gt(0) ? mgp.dividedBy(ms).times(100).toFixed(2) : '0.00',
      expenses: money(mexp),
      netProfit: money(mnp),
      salesCount: Number(r.sales_count || 0),
    };
  });

  const openingVal = D(invRow.opening_val || 0);
  const purchaseVal = D(invRow.purchase_val || 0);
  const purRetVal = D(invRow.pur_ret_val || 0);
  const saleOutVal = D(invRow.sale_out_val || 0);
  const saleRetVal = D(invRow.sale_ret_val || 0);
  const adjVal = D(invRow.adj_val || 0);
  const closingVal = D(invRow.closing_val || 0);
  const expectedClosingInv = openingVal.plus(purchaseVal).minus(purRetVal).minus(saleOutVal).plus(saleRetVal).plus(adjVal);
  const invDiff = closingVal.minus(expectedClosingInv).abs();

  const checks: DemoCheckResult[] = [
    {
      key: 'six_month_sales',
      label: '6-Month Total Sales (~৳60,00,000)',
      passed: totalSales.gte(5900000) && totalSales.lte(6100000),
      actual: `৳${money(totalSales)}`,
      expected: '৳59,00,000 – ৳61,00,000',
    },
    {
      key: 'paid_vs_credit_split',
      label: 'Instant Paid (~৳30L) vs Credit (~৳30L) Split',
      passed: paidAtSale.gte(2900000) && paidAtSale.lte(3100000) && creditIssuedAtSale.gte(2900000) && creditIssuedAtSale.lte(3100000),
      actual: `Paid ৳${money(paidAtSale)} / Credit ৳${money(creditIssuedAtSale)}`,
      expected: '~50% / ~50% (~৳30L each)',
    },
    {
      key: 'gross_margin_20',
      label: 'Gross Profit Margin (20% on Sales)',
      passed: grossMarginPct.gte(19.3) && grossMarginPct.lte(20.7),
      actual: `${grossMarginPct.toFixed(2)}% (GP ৳${money(grossProfit)}, COGS ৳${money(totalCogs)})`,
      expected: '20.0% ± 0.7% (~৳12L GP / ~৳48L COGS)',
    },
    {
      key: 'scale_entities',
      label: 'Catalog & Master Entity Scale',
      passed: Number(cRow.products) >= 200 && Number(cRow.customers) >= 100 && Number(cRow.suppliers) >= 15,
      actual: `${cRow.products} products, ${cRow.customers} customers, ${cRow.suppliers} suppliers`,
      expected: '≥200 products, ≥100 customers, ≥15 suppliers',
    },
    {
      key: 'scale_transactions',
      label: 'Transaction Volume Scale',
      passed: Number(cRow.credit_sales) >= 500 && Number(cRow.purchases) >= 200 && Number(cRow.expenses) >= 150,
      actual: `${cRow.credit_sales} credit sales, ${cRow.purchases} purchases, ${cRow.expenses} expenses`,
      expected: '≥500 credit sales, ≥200 purchases, ≥150 expenses',
    },
    {
      key: 'customer_khata_recon',
      label: 'Customer Khata Ledger Reconciliation',
      passed: Number(custRow.mismatched_customers) === 0,
      actual: `৳${money(D(custRow.cust_table_due || 0))} (${custRow.mismatched_customers} mismatches)`,
      expected: '0 ledger discrepancies',
    },
    {
      key: 'supplier_ledger_recon',
      label: 'Supplier Ledger Reconciliation',
      passed: Number(supRow.mismatched_suppliers) === 0,
      actual: `৳${money(D(supRow.sup_table_due || 0))} (${supRow.mismatched_suppliers} mismatches)`,
      expected: '0 ledger discrepancies',
    },
    {
      key: 'inventory_equation',
      label: 'Inventory Valuation Equation (Opening + Purchases - COGS ± Adj = Closing)',
      passed: invDiff.lte(15),
      actual: `Closing ৳${money(closingVal)} vs Formula ৳${money(expectedClosingInv)} (Δ ৳${money(invDiff)})`,
      expected: 'Δ ≤ ৳15.00',
    },
    {
      key: 'cash_register_recon',
      label: 'Daily Cash Registers Reconciliation',
      passed: Number(cashRow.total_closed_registers) >= 180 && Number(cashRow.mismatched_registers) === 0,
      actual: `${cashRow.total_closed_registers} closed registers (${cashRow.mismatched_registers} mismatches)`,
      expected: '≥180 closed registers, 0 discrepancies',
    },
    {
      key: 'integrity_rules',
      label: 'Zero Anonymous Credit Sales, Negative Stock & Orphans',
      passed:
        Number(orphRow.anon_credit_sales) === 0 &&
        Number(orphRow.negative_stock_products) === 0 &&
        Number(orphRow.orphan_sale_items) === 0,
      actual: `Anon credit: ${orphRow.anon_credit_sales}, Neg stock: ${orphRow.negative_stock_products}, Orphans: ${orphRow.orphan_sale_items}`,
      expected: 'All 0',
    },
  ];

  return {
    allPassed: checks.every((c) => c.passed),
    periodStart,
    periodEnd,
    counts: {
      products: Number(cRow.products || 0),
      suppliers: Number(cRow.suppliers || 0),
      customers: Number(cRow.customers || 0),
      purchases: Number(cRow.purchases || 0),
      sales: Number(cRow.sales || 0),
      creditSales: Number(cRow.credit_sales || 0),
      customerPayments: Number(cRow.customer_payments || 0),
      supplierPayments: Number(cRow.supplier_payments || 0),
      expenses: Number(cRow.expenses || 0),
      salesReturns: Number(cRow.sales_returns || 0),
      purchaseReturns: Number(cRow.purchase_returns || 0),
      stockAdjustments: Number(cRow.stock_adjustments || 0),
    },
    sixMonthFinancials: {
      totalSales: money(totalSales),
      paidAtSale: money(paidAtSale),
      creditIssuedAtSale: money(creditIssuedAtSale),
      dueCollections: money(dueCollections),
      totalCogs: money(totalCogs),
      grossProfit: money(grossProfit),
      grossMarginPct: grossMarginPct.toFixed(2),
      operatingExpenses: money(totalExpenses),
      netProfit: money(netProfit),
      closingInventoryValue: money(closingVal),
      customerOutstanding: money(D(custRow.cust_table_due || 0)),
      supplierOutstanding: money(D(supRow.sup_table_due || 0)),
    },
    monthlyBreakdown,
    checks,
  };
}
