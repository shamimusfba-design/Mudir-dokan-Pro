import { Router } from 'express';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import {
  users,
  stores,
  storeSettings,
  expenseCategories,
  expenses,
  cashRegisters,
  cashTransactions,
  sales,
  saleItems,
  payments,
  purchases,
  products,
  categories,
  brands,
  customers,
  suppliers,
  syncLogs,
} from '../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { resolveUserStore, logAudit, handleApiError, HttpError } from './context.ts';
import { D, money, dhakaTodayISO } from '../lib/decimal.ts';

export const financeRouter = Router();
financeRouter.use(requireAuth);

// --- Expenses ---
financeRouter.get('/expense-categories', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.storeId, ctx.storeId))
      .orderBy(expenseCategories.name);
    res.json(rows);
  } catch (error) {
    handleApiError(res, error, 'Failed to load expense categories');
  }
});

financeRouter.get('/expenses', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db
      .select({
        expense: expenses,
        categoryName: expenseCategories.name,
        categoryNameBn: expenseCategories.nameBn,
      })
      .from(expenses)
      .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(eq(expenses.storeId, ctx.storeId))
      .orderBy(desc(expenses.expenseDate), desc(expenses.id))
      .limit(200);

    res.json(
      rows.map((r) => ({
        ...r.expense,
        categoryName: r.categoryName,
        categoryNameBn: r.categoryNameBn,
      }))
    );
  } catch (error) {
    handleApiError(res, error, 'Failed to load expenses');
  }
});

const createExpenseSchema = z.object({
  categoryId: z.number().int().positive(),
  amount: z.union([z.string(), z.number()]),
  expenseDate: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']).default('CASH'),
  description: z.string().max(400).optional().default(''),
  attachmentRef: z.string().max(250).optional().default(''),
});

financeRouter.post('/expenses', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = createExpenseSchema.parse(req.body);
    const amount = D(parsed.amount);
    if (amount.lte(0)) throw new HttpError(400, 'Expense amount must be greater than zero');
    const expDate = parsed.expenseDate || dhakaTodayISO();

    const created = await db.transaction(async (tx) => {
      const [exp] = await tx
        .insert(expenses)
        .values({
          storeId: ctx.storeId,
          categoryId: parsed.categoryId,
          amount: money(amount),
          expenseDate: expDate,
          paymentMethod: parsed.paymentMethod,
          description: parsed.description || '',
          attachmentRef: parsed.attachmentRef || '',
          createdByUid: ctx.uid,
        })
        .returning();

      if (parsed.paymentMethod === 'CASH') {
        const [openReg] = await tx
          .select()
          .from(cashRegisters)
          .where(and(eq(cashRegisters.storeId, ctx.storeId), eq(cashRegisters.status, 'OPEN')))
          .orderBy(desc(cashRegisters.openedAt))
          .limit(1);

        await tx.insert(cashTransactions).values({
          storeId: ctx.storeId,
          registerId: openReg?.id ?? null,
          txType: 'EXPENSE_CASH',
          amount: money(amount),
          direction: 'OUT',
          referenceType: 'EXPENSE',
          referenceId: exp.id,
          description: parsed.description || 'Operating expense',
          createdByUid: ctx.uid,
        });
      }

      return exp;
    });

    await logAudit(ctx.storeId, ctx.uid, 'CREATE_EXPENSE', 'EXPENSE', created.id, `৳${created.amount}`);
    res.status(201).json(created);
  } catch (error) {
    handleApiError(res, error, 'Failed to record expense');
  }
});

// --- Cash Register & Transactions ---
financeRouter.get('/cash-register', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const [registers, txs] = await Promise.all([
      db
        .select()
        .from(cashRegisters)
        .where(eq(cashRegisters.storeId, ctx.storeId))
        .orderBy(desc(cashRegisters.openedAt))
        .limit(20),
      db
        .select()
        .from(cashTransactions)
        .where(eq(cashTransactions.storeId, ctx.storeId))
        .orderBy(desc(cashTransactions.createdAt))
        .limit(120),
    ]);

    const activeRegister = registers.find((r) => r.status === 'OPEN') || null;
    const activeTxs = activeRegister ? txs.filter((t) => t.registerId === activeRegister.id) : [];

    let totalIn = D(0);
    let totalOut = D(0);
    for (const t of activeTxs) {
      if (t.direction === 'IN') totalIn = totalIn.plus(D(t.amount));
      else totalOut = totalOut.plus(D(t.amount));
    }
    const currentDrawerBalance = totalIn.minus(totalOut);

    res.json({
      activeRegister,
      currentDrawerBalance: money(currentDrawerBalance),
      totalIn: money(totalIn),
      totalOut: money(totalOut),
      registers,
      transactions: txs,
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to load cash register');
  }
});

financeRouter.post('/cash-register/open', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const opening = D(req.body?.openingBalance || 0);
    const notes = String(req.body?.notes || '').trim();

    const [existingOpen] = await db
      .select()
      .from(cashRegisters)
      .where(and(eq(cashRegisters.storeId, ctx.storeId), eq(cashRegisters.status, 'OPEN')))
      .limit(1);
    if (existingOpen) throw new HttpError(400, 'A cash register session is already open');

    const reg = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(cashRegisters)
        .values({
          storeId: ctx.storeId,
          openedByUid: ctx.uid,
          openingBalance: money(opening),
          status: 'OPEN',
          notes,
        })
        .returning();

      if (opening.gt(0)) {
        await tx.insert(cashTransactions).values({
          storeId: ctx.storeId,
          registerId: created.id,
          txType: 'OPENING',
          amount: money(opening),
          direction: 'IN',
          referenceType: 'REGISTER',
          referenceId: created.id,
          description: 'Register opening float',
          createdByUid: ctx.uid,
        });
      }
      return created;
    });

    res.status(201).json(reg);
  } catch (error) {
    handleApiError(res, error, 'Failed to open cash register');
  }
});

financeRouter.post('/cash-register/close', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const actualClosing = D(req.body?.actualClosing || 0);
    const notes = String(req.body?.notes || '').trim();

    const [openReg] = await db
      .select()
      .from(cashRegisters)
      .where(and(eq(cashRegisters.storeId, ctx.storeId), eq(cashRegisters.status, 'OPEN')))
      .orderBy(desc(cashRegisters.openedAt))
      .limit(1);
    if (!openReg) throw new HttpError(400, 'No open cash register found');

    const regTxs = await db.select().from(cashTransactions).where(eq(cashTransactions.registerId, openReg.id));
    let expected = D(0);
    for (const t of regTxs) {
      expected = t.direction === 'IN' ? expected.plus(D(t.amount)) : expected.minus(D(t.amount));
    }

    const [closed] = await db
      .update(cashRegisters)
      .set({
        closedByUid: ctx.uid,
        closedAt: new Date(),
        expectedClosing: money(expected),
        actualClosing: money(actualClosing),
        status: 'CLOSED',
        notes: notes || openReg.notes,
      })
      .where(eq(cashRegisters.id, openReg.id))
      .returning();

    await logAudit(ctx.storeId, ctx.uid, 'CLOSE_REGISTER', 'REGISTER', closed.id, `Actual ৳${closed.actualClosing}`);
    res.json(closed);
  } catch (error) {
    handleApiError(res, error, 'Failed to close cash register');
  }
});

financeRouter.post('/cash-register/transaction', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const schema = z.object({
      direction: z.enum(['IN', 'OUT']),
      amount: z.union([z.string(), z.number()]),
      description: z.string().min(2).max(250),
    });
    const parsed = schema.parse(req.body);
    const amt = D(parsed.amount);
    if (amt.lte(0)) throw new HttpError(400, 'Amount must be greater than zero');

    const [openReg] = await db
      .select()
      .from(cashRegisters)
      .where(and(eq(cashRegisters.storeId, ctx.storeId), eq(cashRegisters.status, 'OPEN')))
      .orderBy(desc(cashRegisters.openedAt))
      .limit(1);

    const [txRow] = await db
      .insert(cashTransactions)
      .values({
        storeId: ctx.storeId,
        registerId: openReg?.id ?? null,
        txType: parsed.direction === 'IN' ? 'CASH_IN' : 'CASH_OUT',
        amount: money(amt),
        direction: parsed.direction,
        referenceType: 'MANUAL',
        description: parsed.description.trim(),
        createdByUid: ctx.uid,
      })
      .returning();

    res.status(201).json(txRow);
  } catch (error) {
    handleApiError(res, error, 'Failed to log cash movement');
  }
});

// --- Dashboard & Reports (Accounting-accurate Profit Engine) ---
financeRouter.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const today = dhakaTodayISO();
    const from = String(req.query.from || today).slice(0, 10);
    const to = String(req.query.to || today).slice(0, 10);

    const monthStart = `${today.slice(0, 7)}-01`;
    const [periodSales, todayOnlySales, monthOnlySales, periodExpenses, allProducts, allCats, allCustomers, allSuppliers, recentPurchases] =
      await Promise.all([
        db
          .select({
            sale: sales,
            customerName: customers.name,
          })
          .from(sales)
          .leftJoin(customers, eq(sales.customerId, customers.id))
          .where(
            and(
              eq(sales.storeId, ctx.storeId),
              eq(sales.status, 'COMPLETED'),
              gte(sales.saleDate, from),
              lte(sales.saleDate, to)
            )
          )
          .orderBy(desc(sales.createdAt)),
        db
          .select({
            totalAmount: sales.totalAmount,
            grossProfit: sales.grossProfit,
          })
          .from(sales)
          .where(and(eq(sales.storeId, ctx.storeId), eq(sales.status, 'COMPLETED'), eq(sales.saleDate, today))),
        db
          .select({
            totalAmount: sales.totalAmount,
          })
          .from(sales)
          .where(
            and(
              eq(sales.storeId, ctx.storeId),
              eq(sales.status, 'COMPLETED'),
              gte(sales.saleDate, monthStart),
              lte(sales.saleDate, today)
            )
          ),
        db
          .select()
          .from(expenses)
          .where(and(eq(expenses.storeId, ctx.storeId), gte(expenses.expenseDate, from), lte(expenses.expenseDate, to))),
        db
          .select()
          .from(products)
          .where(and(eq(products.storeId, ctx.storeId), eq(products.isActive, true))),
        db.select().from(categories).where(eq(categories.storeId, ctx.storeId)),
        db
          .select()
          .from(customers)
          .where(and(eq(customers.storeId, ctx.storeId), eq(customers.isActive, true)))
          .orderBy(desc(customers.currentDue)),
        db
          .select()
          .from(suppliers)
          .where(and(eq(suppliers.storeId, ctx.storeId), eq(suppliers.isActive, true))),
        db
          .select({
            purchase: purchases,
            supplierName: suppliers.name,
          })
          .from(purchases)
          .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
          .where(eq(purchases.storeId, ctx.storeId))
          .orderBy(desc(purchases.createdAt))
          .limit(6),
      ]);

    const saleIds = periodSales.map((r) => r.sale.id);
    const [periodSaleItems, periodPayments, cashInflows] = await Promise.all([
      saleIds.length ? db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds)) : Promise.resolve([]),
      saleIds.length ? db.select().from(payments).where(inArray(payments.saleId, saleIds)) : Promise.resolve([]),
      db
        .select()
        .from(cashTransactions)
        .where(
          and(
            eq(cashTransactions.storeId, ctx.storeId),
            eq(cashTransactions.direction, 'IN'),
            sql`DATE(${cashTransactions.createdAt} AT TIME ZONE 'Asia/Dhaka') >= ${from}`,
            sql`DATE(${cashTransactions.createdAt} AT TIME ZONE 'Asia/Dhaka') <= ${to}`
          )
        ),
    ]);

    const totalSales = periodSales.reduce((acc, r) => acc.plus(D(r.sale.totalAmount)), D(0));
    const totalCogs = periodSales.reduce((acc, r) => acc.plus(D(r.sale.totalCogs)), D(0));
    const grossProfit = totalSales.minus(totalCogs);
    const totalExpenses = periodExpenses.reduce((acc, e) => acc.plus(D(e.amount)), D(0));
    const netProfit = grossProfit.minus(totalExpenses);
    const todaySalesTotal = todayOnlySales.reduce((acc, r) => acc.plus(D(r.totalAmount)), D(0));
    const todayProfitTotal = todayOnlySales.reduce((acc, r) => acc.plus(D(r.grossProfit)), D(0));
    const monthlyRevenueTotal = monthOnlySales.reduce((acc, r) => acc.plus(D(r.totalAmount)), D(0));
    const cashReceived = cashInflows
      .filter((t) => t.txType === 'SALE_CASH' || t.txType === 'CUSTOMER_DUE_COLLECTION')
      .reduce((acc, t) => acc.plus(D(t.amount)), D(0));
    const customerOutstanding = allCustomers.reduce((acc, c) => acc.plus(D(c.currentDue)), D(0));
    const supplierOutstanding = allSuppliers.reduce((acc, s) => acc.plus(D(s.currentDue)), D(0));
    const inventoryValue = allProducts.reduce(
      (acc, p) => acc.plus(D(p.currentStock).gt(0) ? D(p.currentStock).times(D(p.avgCostPrice)) : D(0)),
      D(0)
    );

    // Daily trend (last 14 days or within range)
    const trendMap = new Map<string, { date: string; sales: number; grossProfit: number }>();
    for (const r of periodSales) {
      const d = r.sale.saleDate;
      const prev = trendMap.get(d) || { date: d, sales: 0, grossProfit: 0 };
      prev.sales += D(r.sale.totalAmount).toNumber();
      prev.grossProfit += D(r.sale.grossProfit).toNumber();
      trendMap.set(d, prev);
    }
    const dailyTrend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Payment method breakdown
    const pmtMap = new Map<string, number>();
    for (const p of periodPayments) {
      pmtMap.set(p.method, (pmtMap.get(p.method) || 0) + D(p.amount).toNumber());
    }
    const totalCreditIssued = periodSales.reduce((acc, r) => acc.plus(D(r.sale.dueAmount)), D(0)).toNumber();
    if (totalCreditIssued > 0) pmtMap.set('CREDIT_DUE', totalCreditIssued);
    const paymentBreakdown = Array.from(pmtMap.entries()).map(([method, amount]) => ({
      method,
      amount: Number(amount.toFixed(2)),
    }));

    // Category breakdown & Top-selling products
    const prodMap = new Map(allProducts.map((p) => [p.id, p]));
    const catMap = new Map(allCats.map((c) => [c.id, c.name]));
    const catSalesMap = new Map<string, number>();
    const topProdMap = new Map<
      number,
      {
        productId: number;
        name: string;
        variant: string;
        imageUrl: string | null;
        categoryId: number;
        qty: number;
        revenue: number;
        profit: number;
      }
    >();

    for (const item of periodSaleItems) {
      const prod = prodMap.get(item.productId);
      const catName = prod ? catMap.get(prod.categoryId) || 'Other' : 'Other';
      catSalesMap.set(catName, (catSalesMap.get(catName) || 0) + D(item.lineTotal).toNumber());

      const prev = topProdMap.get(item.productId) || {
        productId: item.productId,
        name: item.productName,
        variant: item.variant || '',
        imageUrl: prod?.imageUrl ?? null,
        categoryId: prod?.categoryId ?? 0,
        qty: 0,
        revenue: 0,
        profit: 0,
      };
      prev.qty += D(item.baseQty).toNumber();
      prev.revenue += D(item.lineTotal).toNumber();
      prev.profit += D(item.lineProfit).toNumber();
      topProdMap.set(item.productId, prev);
    }

    const salesByCategory = Array.from(catSalesMap.entries())
      .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    const topSellingProducts = Array.from(topProdMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const lowStockProducts = allProducts.filter((p) => D(p.currentStock).gt(0) && D(p.currentStock).lte(D(p.minStock)));
    const outOfStockProducts = allProducts.filter((p) => D(p.currentStock).lte(0));

    const hideProfit = ctx.role === 'CASHIER' && !ctx.settings.allowCashierReports;

    res.json({
      range: { from, to },
      canViewProfit: !hideProfit,
      kpis: {
        sales: money(totalSales),
        grossProfit: hideProfit ? null : money(grossProfit),
        netProfit: hideProfit ? null : money(netProfit),
        expenses: money(totalExpenses),
        cashReceived: money(cashReceived),
        customerOutstanding: money(customerOutstanding),
        supplierOutstanding: money(supplierOutstanding),
        inventoryValue: hideProfit ? null : money(inventoryValue),
        todaySales: money(todaySalesTotal),
        todayProfit: hideProfit ? null : money(todayProfitTotal),
        monthlyRevenue: money(monthlyRevenueTotal),
        totalProducts: allProducts.length,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      dailyTrend: hideProfit ? dailyTrend.map((d) => ({ ...d, grossProfit: 0 })) : dailyTrend,
      salesByCategory,
      paymentBreakdown,
      topSellingProducts: hideProfit ? topSellingProducts.map((p) => ({ ...p, profit: 0 })) : topSellingProducts,
      lowStockProducts: lowStockProducts.slice(0, 12),
      outOfStockProducts: outOfStockProducts.slice(0, 12),
      recentTransactions: periodSales.slice(0, 10).map((r) => ({
        ...r.sale,
        grossProfit: hideProfit ? null : r.sale.grossProfit,
        totalCogs: hideProfit ? null : r.sale.totalCogs,
        customerName: r.customerName,
      })),
      recentPurchases: recentPurchases.map((r) => ({ ...r.purchase, supplierName: r.supplierName })),
      pendingCustomerDues: allCustomers.filter((c) => D(c.currentDue).gt(0)).slice(0, 10),
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to load dashboard metrics');
  }
});

// GET /api/finance/reports - Comprehensive Accounting Reports (Role-gated)
financeRouter.get('/reports', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER' && !ctx.settings.allowCashierReports) {
      throw new HttpError(403, 'Profit & financial reports require Owner or Manager authorization');
    }

    const today = dhakaTodayISO();
    const from = String(req.query.from || `${today.slice(0, 7)}-01`).slice(0, 10);
    const to = String(req.query.to || today).slice(0, 10);

    const [periodSales, periodPurchases, periodExpenses, allProducts, allCats, allBrands, allCustomers, allSuppliers, cashTxs] =
      await Promise.all([
        db
          .select()
          .from(sales)
          .where(and(eq(sales.storeId, ctx.storeId), eq(sales.status, 'COMPLETED'), gte(sales.saleDate, from), lte(sales.saleDate, to))),
        db
          .select()
          .from(purchases)
          .where(and(eq(purchases.storeId, ctx.storeId), eq(purchases.status, 'COMPLETED'), gte(purchases.purchaseDate, from), lte(purchases.purchaseDate, to))),
        db
          .select({
            expense: expenses,
            categoryName: expenseCategories.name,
          })
          .from(expenses)
          .innerJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
          .where(and(eq(expenses.storeId, ctx.storeId), gte(expenses.expenseDate, from), lte(expenses.expenseDate, to))),
        db.select().from(products).where(and(eq(products.storeId, ctx.storeId), eq(products.isActive, true))),
        db.select().from(categories).where(eq(categories.storeId, ctx.storeId)),
        db.select().from(brands).where(eq(brands.storeId, ctx.storeId)),
        db.select().from(customers).where(and(eq(customers.storeId, ctx.storeId), eq(customers.isActive, true))),
        db.select().from(suppliers).where(and(eq(suppliers.storeId, ctx.storeId), eq(suppliers.isActive, true))),
        db
          .select()
          .from(cashTransactions)
          .where(
            and(
              eq(cashTransactions.storeId, ctx.storeId),
              sql`DATE(${cashTransactions.createdAt} AT TIME ZONE 'Asia/Dhaka') >= ${from}`,
              sql`DATE(${cashTransactions.createdAt} AT TIME ZONE 'Asia/Dhaka') <= ${to}`
            )
          ),
      ]);

    const saleIds = periodSales.map((s) => s.id);
    const items = saleIds.length ? await db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds)) : [];

    const totalRevenue = periodSales.reduce((acc, s) => acc.plus(D(s.totalAmount)), D(0));
    const totalCogs = periodSales.reduce((acc, s) => acc.plus(D(s.totalCogs)), D(0));
    const grossProfit = totalRevenue.minus(totalCogs);
    const totalOperatingExpenses = periodExpenses.reduce((acc, r) => acc.plus(D(r.expense.amount)), D(0));
    const netProfit = grossProfit.minus(totalOperatingExpenses);
    const totalPurchasesAmt = periodPurchases.reduce((acc, p) => acc.plus(D(p.totalAmount)), D(0));

    const prodMap = new Map(allProducts.map((p) => [p.id, p]));
    const catMap = new Map(allCats.map((c) => [c.id, c.name]));
    const brandObjMap = new Map(allBrands.map((b) => [b.id, b]));

    const prodStats = new Map<
      number,
      {
        productId: number;
        sku: string;
        name: string;
        variant: string;
        imageUrl: string | null;
        categoryId: number;
        qtySold: number;
        revenue: number;
        cogs: number;
        grossProfit: number;
      }
    >();
    const catStats = new Map<string, { category: string; revenue: number; cogs: number; grossProfit: number }>();
    const brandStats = new Map<
      string,
      { brandId: number | null; brand: string; logoUrl: string | null; brandColor: string | null; revenue: number; qtySold: number }
    >();

    for (const i of items) {
      const prod = prodMap.get(i.productId);
      const rev = D(i.lineTotal).toNumber();
      const cogs = D(i.lineCogs).toNumber();
      const gp = D(i.lineProfit).toNumber();
      const qty = D(i.baseQty).toNumber();

      const pStat = prodStats.get(i.productId) || {
        productId: i.productId,
        sku: prod?.sku || '',
        name: i.productName,
        variant: i.variant || '',
        imageUrl: prod?.imageUrl ?? null,
        categoryId: prod?.categoryId ?? 0,
        qtySold: 0,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
      };
      pStat.qtySold += qty;
      pStat.revenue += rev;
      pStat.cogs += cogs;
      pStat.grossProfit += gp;
      prodStats.set(i.productId, pStat);

      const catName = prod ? catMap.get(prod.categoryId) || 'Other' : 'Other';
      const cStat = catStats.get(catName) || { category: catName, revenue: 0, cogs: 0, grossProfit: 0 };
      cStat.revenue += rev;
      cStat.cogs += cogs;
      cStat.grossProfit += gp;
      catStats.set(catName, cStat);

      const brandObj = prod?.brandId ? brandObjMap.get(prod.brandId) : undefined;
      const brandName = brandObj ? brandObj.name : 'Unbranded';
      const bStat = brandStats.get(brandName) || {
        brandId: brandObj?.id ?? null,
        brand: brandName,
        logoUrl: brandObj?.logoUrl ?? null,
        brandColor: brandObj?.brandColor ?? null,
        revenue: 0,
        qtySold: 0,
      };
      bStat.revenue += rev;
      bStat.qtySold += qty;
      brandStats.set(brandName, bStat);
    }

    const soldIds = new Set(prodStats.keys());
    const slowMovingProducts = allProducts
      .filter((p) => !soldIds.has(p.id) && D(p.currentStock).gt(0))
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        variant: p.variant,
        imageUrl: p.imageUrl ?? null,
        categoryId: p.categoryId,
        currentStock: p.currentStock,
        stockValue: money(D(p.currentStock).times(D(p.avgCostPrice))),
      }))
      .slice(0, 25);

    const cashIn = cashTxs.filter((t) => t.direction === 'IN').reduce((acc, t) => acc.plus(D(t.amount)), D(0));
    const cashOut = cashTxs.filter((t) => t.direction === 'OUT').reduce((acc, t) => acc.plus(D(t.amount)), D(0));

    res.json({
      range: { from, to },
      profitSummary: {
        salesRevenue: money(totalRevenue),
        cogs: money(totalCogs),
        grossProfit: money(grossProfit),
        grossMarginPct: totalRevenue.gt(0) ? grossProfit.dividedBy(totalRevenue).times(100).toFixed(1) : '0.0',
        operatingExpenses: money(totalOperatingExpenses),
        netProfit: money(netProfit),
        totalPurchases: money(totalPurchasesAmt),
        salesCount: periodSales.length,
      },
      productProfit: Array.from(prodStats.values()).sort((a, b) => b.grossProfit - a.grossProfit),
      categoryProfit: Array.from(catStats.values()).sort((a, b) => b.grossProfit - a.grossProfit),
      brandSales: Array.from(brandStats.values()).sort((a, b) => b.revenue - a.revenue),
      slowMovingProducts,
      expenseBreakdown: periodExpenses.map((e) => ({
        id: e.expense.id,
        date: e.expense.expenseDate,
        category: e.categoryName,
        amount: e.expense.amount,
        method: e.expense.paymentMethod,
        description: e.expense.description,
      })),
      cashFlow: {
        totalIn: money(cashIn),
        totalOut: money(cashOut),
        netCashFlow: money(cashIn.minus(cashOut)),
      },
      dues: {
        customerDueTotal: money(allCustomers.reduce((acc, c) => acc.plus(D(c.currentDue)), D(0))),
        supplierDueTotal: money(allSuppliers.reduce((acc, s) => acc.plus(D(s.currentDue)), D(0))),
      },
      inventoryValuation: {
        totalCostValue: money(
          allProducts.reduce(
            (acc, p) => acc.plus(D(p.currentStock).gt(0) ? D(p.currentStock).times(D(p.avgCostPrice)) : D(0)),
            D(0)
          )
        ),
        totalRetailValue: money(
          allProducts.reduce(
            (acc, p) => acc.plus(D(p.currentStock).gt(0) ? D(p.currentStock).times(D(p.sellingPrice)) : D(0)),
            D(0)
          )
        ),
      },
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to generate financial reports');
  }
});

// --- Store Settings & Role Access ---
financeRouter.get('/settings', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const logs = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.storeId, ctx.storeId))
      .orderBy(desc(syncLogs.createdAt))
      .limit(30);
    res.json({
      store: ctx.store,
      settings: ctx.settings,
      user: { uid: ctx.uid, email: ctx.email, name: ctx.userName, role: ctx.role },
      syncLogs: logs,
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to load settings');
  }
});

financeRouter.put('/settings', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER') throw new HttpError(403, 'Only Owner or Manager can update store settings');

    const { store: storeInput, settings: settingsInput } = req.body || {};

    if (storeInput) {
      await db
        .update(stores)
        .set({
          name: storeInput.name || ctx.store.name,
          nameBn: storeInput.nameBn ?? ctx.store.nameBn,
          phone: storeInput.phone ?? ctx.store.phone,
          address: storeInput.address ?? ctx.store.address,
          addressBn: storeInput.addressBn ?? ctx.store.addressBn,
          binNumber: storeInput.binNumber ?? ctx.store.binNumber,
          logoUrl: storeInput.logoUrl !== undefined ? (storeInput.logoUrl || null) : ctx.store.logoUrl,
        })
        .where(eq(stores.id, ctx.storeId));
    }

    if (settingsInput) {
      await db
        .update(storeSettings)
        .set({
          languageMode: settingsInput.languageMode ?? ctx.settings.languageMode,
          receiptFormat: settingsInput.receiptFormat ?? ctx.settings.receiptFormat,
          receiptHeader: settingsInput.receiptHeader ?? ctx.settings.receiptHeader,
          receiptFooter: settingsInput.receiptFooter ?? ctx.settings.receiptFooter,
          allowNegativeStock: Boolean(settingsInput.allowNegativeStock ?? ctx.settings.allowNegativeStock),
          allowCashierPriceEdit: Boolean(settingsInput.allowCashierPriceEdit ?? ctx.settings.allowCashierPriceEdit),
          allowCashierDiscount: Boolean(settingsInput.allowCashierDiscount ?? ctx.settings.allowCashierDiscount),
          allowCashierReports: Boolean(settingsInput.allowCashierReports ?? ctx.settings.allowCashierReports),
          smsProvider: settingsInput.smsProvider ?? ctx.settings.smsProvider,
          smsWebhookUrl: settingsInput.smsWebhookUrl ?? ctx.settings.smsWebhookUrl,
          smsSenderId: settingsInput.smsSenderId ?? ctx.settings.smsSenderId,
          updatedAt: new Date(),
        })
        .where(eq(storeSettings.storeId, ctx.storeId));
    }

    const fresh = await resolveUserStore(req);
    await logAudit(ctx.storeId, ctx.uid, 'UPDATE_SETTINGS', 'STORE', ctx.storeId, 'Store settings updated');
    res.json({ store: fresh.store, settings: fresh.settings });
  } catch (error) {
    handleApiError(res, error, 'Failed to save store settings');
  }
});

// Switch active role (allows store owner to switch into Manager or Cashier shift mode)
financeRouter.put('/role', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const role = z.enum(['OWNER', 'MANAGER', 'CASHIER']).parse(req.body?.role);
    // Only the original store owner can elevate back to OWNER or change roles freely
    if (ctx.store.ownerUid !== ctx.uid && role === 'OWNER') {
      throw new HttpError(403, 'Only the store owner can switch to Owner role');
    }
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.uid, ctx.uid));
    res.json({ role });
  } catch (error) {
    handleApiError(res, error, 'Failed to update staff role');
  }
});
