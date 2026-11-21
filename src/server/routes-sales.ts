import { Router } from 'express';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  sales,
  saleItems,
  payments,
  products,
  stockMovements,
  customers,
  customerLedger,
  cashRegisters,
  cashTransactions,
  salesReturns,
  salesReturnItems,
  syncLogs,
} from '../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { resolveUserStore, logAudit, handleApiError, HttpError, type ResolvedStoreContext } from './context.ts';
import { D, money, qty4, dhakaTodayISO } from '../lib/decimal.ts';

export const salesRouter = Router();
salesRouter.use(requireAuth);

const saleItemInputSchema = z.object({
  productId: z.number().int().positive(),
  unitName: z.string().min(1).default('Piece'),
  conversionFactor: z.union([z.string(), z.number()]).default('1'),
  enteredQty: z.union([z.string(), z.number()]),
  unitSellingPrice: z.union([z.string(), z.number()]),
  itemDiscount: z.union([z.string(), z.number()]).optional().default('0'),
});

const paymentInputSchema = z.object({
  method: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'CARD', 'BANK']),
  amount: z.union([z.string(), z.number()]),
  referenceNo: z.string().optional().default(''),
});

export const createSaleSchema = z.object({
  clientTransactionUuid: z.string().min(6).max(120).optional(),
  saleDate: z.string().optional(),
  customerId: z.number().int().positive().nullable().optional(),
  billDiscount: z.union([z.string(), z.number()]).optional().default('0'),
  expectedPaymentDate: z.string().nullable().optional(),
  notes: z.string().max(400).optional().default(''),
  isOfflineOrigin: z.boolean().optional().default(false),
  allowCreditLimitOverride: z.boolean().optional().default(false),
  items: z.array(saleItemInputSchema).min(1, 'Cart must contain at least one item'),
  payments: z.array(paymentInputSchema).default([]),
});

async function executeAtomicSale(ctx: ResolvedStoreContext, rawInput: z.infer<typeof createSaleSchema>) {
  const clientUuid = rawInput.clientTransactionUuid || crypto.randomUUID();
  const saleDate = rawInput.saleDate || dhakaTodayISO();

  // Idempotency check BEFORE transaction to cleanly handle offline duplicate retries
  const existingSale = await db
    .select()
    .from(sales)
    .where(and(eq(sales.storeId, ctx.storeId), eq(sales.clientTransactionUuid, clientUuid)))
    .limit(1);

  if (existingSale.length > 0) {
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, existingSale[0].id));
    const pmts = await db.select().from(payments).where(eq(payments.saleId, existingSale[0].id));
    return { sale: existingSale[0], items, payments: pmts, duplicateSkipped: true };
  }

  return await db.transaction(async (tx) => {
    const prodIds = Array.from(new Set(rawInput.items.map((i) => i.productId)));
    const prodRows = await tx
      .select()
      .from(products)
      .where(and(eq(products.storeId, ctx.storeId), inArray(products.id, prodIds)));

    const prodMap = new Map(prodRows.map((p) => [p.id, p]));
    const stockTracker = new Map(prodRows.map((p) => [p.id, D(p.currentStock)]));

    let subtotal = D(0);
    let itemDiscountTotal = D(0);
    let totalCogs = D(0);

    const preparedItems: Array<{
      productId: number;
      productName: string;
      variant: string;
      unitName: string;
      conversionFactor: string;
      enteredQty: string;
      baseQty: string;
      unitSellingPrice: string;
      unitCostSnapshot: string;
      itemDiscount: string;
      lineTotal: string;
      lineCogs: string;
      lineProfit: string;
      newStock: string;
    }> = [];

    for (const item of rawInput.items) {
      const prod = prodMap.get(item.productId);
      if (!prod) throw new HttpError(404, `Product ID ${item.productId} not found`);

      const enteredQty = D(item.enteredQty);
      const factor = D(item.conversionFactor);
      if (enteredQty.lte(0) || factor.lte(0)) {
        throw new HttpError(400, `Invalid quantity for ${prod.name}`);
      }

      const baseQty = enteredQty.times(factor);
      const currentAvail = stockTracker.get(prod.id) ?? D(0);
      const nextStock = currentAvail.minus(baseQty);
      if (nextStock.lt(0) && !ctx.settings.allowNegativeStock && !rawInput.isOfflineOrigin) {
        throw new HttpError(
          400,
          `Insufficient stock for ${prod.name} (${prod.variant}). Available: ${currentAvail.toFixed(2)} ${prod.baseUnit}`
        );
      }
      stockTracker.set(prod.id, nextStock);

      // Enforce cashier price-edit permission
      const defaultUnitPrice = D(prod.sellingPrice).times(factor);
      let effectivePrice = D(item.unitSellingPrice);
      if (ctx.role === 'CASHIER' && !ctx.settings.allowCashierPriceEdit && !effectivePrice.eq(defaultUnitPrice)) {
        effectivePrice = defaultUnitPrice;
      }

      const grossLine = enteredQty.times(effectivePrice);
      const disc = ctx.role === 'CASHIER' && !ctx.settings.allowCashierDiscount ? D(0) : D(item.itemDiscount);
      const lineTotal = grossLine.minus(disc);
      if (lineTotal.lt(0)) throw new HttpError(400, `Discount cannot exceed line amount for ${prod.name}`);

      const unitCost = D(prod.avgCostPrice);
      const lineCogs = baseQty.times(unitCost);
      const lineProfit = lineTotal.minus(lineCogs);

      subtotal = subtotal.plus(grossLine);
      itemDiscountTotal = itemDiscountTotal.plus(disc);
      totalCogs = totalCogs.plus(lineCogs);

      preparedItems.push({
        productId: prod.id,
        productName: prod.name,
        variant: prod.variant,
        unitName: item.unitName,
        conversionFactor: qty4(factor),
        enteredQty: qty4(enteredQty),
        baseQty: qty4(baseQty),
        unitSellingPrice: money(effectivePrice),
        unitCostSnapshot: unitCost.toFixed(4),
        itemDiscount: money(disc),
        lineTotal: money(lineTotal),
        lineCogs: lineCogs.toFixed(4),
        lineProfit: money(lineProfit),
        newStock: qty4(nextStock),
      });
    }

    const billDiscount =
      ctx.role === 'CASHIER' && !ctx.settings.allowCashierDiscount ? D(0) : D(rawInput.billDiscount);
    const totalAmount = subtotal.minus(itemDiscountTotal).minus(billDiscount);
    if (totalAmount.lt(0)) throw new HttpError(400, 'Total bill cannot be negative');

    const validPayments = rawInput.payments.filter((p) => D(p.amount).gt(0));
    const rawPaidSum = validPayments.reduce((acc, p) => acc.plus(D(p.amount)), D(0));
    // Cap applied paidAmount to totalAmount (change returned in cash is not retained revenue)
    const paidAmount = rawPaidSum.gt(totalAmount) ? totalAmount : rawPaidSum;
    const dueAmount = totalAmount.minus(paidAmount);

    // STRICT RULE: Never allow an anonymous credit sale!
    if (dueAmount.gt(0) && !rawInput.customerId) {
      throw new HttpError(
        400,
        'Anonymous credit sale is not allowed. Please select or create a customer for due/baki sales.'
      );
    }

    let customerRow: typeof customers.$inferSelect | null = null;
    if (rawInput.customerId) {
      const [cust] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.id, rawInput.customerId), eq(customers.storeId, ctx.storeId)))
        .limit(1);
      if (!cust) throw new HttpError(404, 'Selected customer not found');
      customerRow = cust;

      if (dueAmount.gt(0) && !rawInput.allowCreditLimitOverride && !rawInput.isOfflineOrigin) {
        const projectedDue = D(cust.currentDue).plus(dueAmount);
        if (D(cust.creditLimit).gt(0) && projectedDue.gt(D(cust.creditLimit))) {
          throw new HttpError(
            400,
            `Credit limit exceeded for ${cust.name}. Limit: ৳${cust.creditLimit}, Projected Due: ৳${money(projectedDue)}.`
          );
        }
      }
    }

    const grossProfit = totalAmount.minus(totalCogs);
    const paymentStatus = dueAmount.lte(0) ? 'PAID' : paidAmount.gt(0) ? 'PARTIAL' : 'UNPAID';

    const [{ count }] = await tx
      .select({ count: sql<number>`COUNT(*)` })
      .from(sales)
      .where(eq(sales.storeId, ctx.storeId));
    const invoiceNumber = `${ctx.settings.invoicePrefix || 'INV'}-${saleDate.replace(/-/g, '')}-${String(
      Number(count) + 1
    ).padStart(4, '0')}`;

    const [createdSale] = await tx
      .insert(sales)
      .values({
        storeId: ctx.storeId,
        customerId: rawInput.customerId ?? null,
        invoiceNumber,
        clientTransactionUuid: clientUuid,
        saleDate,
        subtotal: money(subtotal),
        itemDiscountTotal: money(itemDiscountTotal),
        billDiscount: money(billDiscount),
        totalAmount: money(totalAmount),
        paidAmount: money(paidAmount),
        dueAmount: money(dueAmount),
        totalCogs: totalCogs.toFixed(4),
        grossProfit: money(grossProfit),
        paymentStatus,
        status: 'COMPLETED',
        expectedPaymentDate: dueAmount.gt(0) ? rawInput.expectedPaymentDate || null : null,
        isOfflineOrigin: rawInput.isOfflineOrigin,
        notes: rawInput.notes || '',
        cashierUid: ctx.uid,
      })
      .returning();

    // Insert sale items + update product stocks + log immutable stock movements
    const insertedItems = [];
    for (const item of preparedItems) {
      const [si] = await tx
        .insert(saleItems)
        .values({
          saleId: createdSale.id,
          productId: item.productId,
          productName: item.productName,
          variant: item.variant,
          unitName: item.unitName,
          conversionFactor: item.conversionFactor,
          enteredQty: item.enteredQty,
          baseQty: item.baseQty,
          unitSellingPrice: item.unitSellingPrice,
          unitCostSnapshot: item.unitCostSnapshot,
          itemDiscount: item.itemDiscount,
          lineTotal: item.lineTotal,
          lineCogs: item.lineCogs,
          lineProfit: item.lineProfit,
        })
        .returning();
      insertedItems.push(si);

      await tx
        .update(products)
        .set({ currentStock: item.newStock, updatedAt: new Date() })
        .where(eq(products.id, item.productId));

      await tx.insert(stockMovements).values({
        storeId: ctx.storeId,
        productId: item.productId,
        movementType: 'SALE_OUT',
        quantityDelta: qty4(D(item.baseQty).negated()),
        unitCost: item.unitCostSnapshot,
        balanceAfter: item.newStock,
        referenceType: 'SALE',
        referenceId: createdSale.id,
        notes: `Sale ${invoiceNumber}`,
        createdByUid: ctx.uid,
      });
    }

    // Insert split payments & record cash register inflows
    const insertedPayments = [];
    let cashInflow = D(0);
    let remainingToApply = totalAmount;
    for (const p of validPayments) {
      if (remainingToApply.lte(0)) break;
      const amt = D(p.amount);
      const applied = amt.gt(remainingToApply) ? remainingToApply : amt;
      remainingToApply = remainingToApply.minus(applied);

      const [pmt] = await tx
        .insert(payments)
        .values({
          storeId: ctx.storeId,
          saleId: createdSale.id,
          customerId: rawInput.customerId ?? null,
          method: p.method,
          amount: money(applied),
          referenceNo: p.referenceNo || '',
        })
        .returning();
      insertedPayments.push(pmt);
      if (p.method === 'CASH') {
        cashInflow = cashInflow.plus(applied);
      }
    }

    if (cashInflow.gt(0)) {
      const [openReg] = await tx
        .select()
        .from(cashRegisters)
        .where(and(eq(cashRegisters.storeId, ctx.storeId), eq(cashRegisters.status, 'OPEN')))
        .orderBy(desc(cashRegisters.openedAt))
        .limit(1);

      await tx.insert(cashTransactions).values({
        storeId: ctx.storeId,
        registerId: openReg?.id ?? null,
        txType: 'SALE_CASH',
        amount: money(cashInflow),
        direction: 'IN',
        referenceType: 'SALE',
        referenceId: createdSale.id,
        description: `Cash sale ${invoiceNumber}`,
        createdByUid: ctx.uid,
      });
    }

    // Update Customer Totals & Write Immutable Digital Khata Ledger Entries
    if (customerRow) {
      const nextTotalPurchases = D(customerRow.totalPurchases).plus(totalAmount);
      const nextTotalPaid = D(customerRow.totalPaid).plus(paidAmount);
      let runningBal = D(customerRow.currentDue);
      const productSummary = preparedItems
        .map((i) => `${i.productName} (${D(i.enteredQty).toNumber()} ${i.unitName})`)
        .join(', ');

      // Debit entry for the full invoice total
      runningBal = runningBal.plus(totalAmount);
      await tx.insert(customerLedger).values({
        storeId: ctx.storeId,
        customerId: customerRow.id,
        entryDate: saleDate,
        saleId: createdSale.id,
        invoiceNumber,
        transactionType: 'CREDIT_SALE',
        productSummary,
        debitAmount: money(totalAmount),
        creditAmount: '0.00',
        runningBalance: money(runningBal),
        paymentMethod: insertedPayments.map((p) => p.method).join('+') || 'CREDIT',
        expectedPaymentDate: createdSale.expectedPaymentDate,
        description: dueAmount.gt(0)
          ? `Credit/Partial sale (${invoiceNumber}) — Due: ৳${money(dueAmount)}`
          : `Cash/Paid sale (${invoiceNumber})`,
      });

      // If any amount was paid at counter, record corresponding credit entry in Digital Khata
      if (paidAmount.gt(0)) {
        runningBal = runningBal.minus(paidAmount);
        await tx.insert(customerLedger).values({
          storeId: ctx.storeId,
          customerId: customerRow.id,
          entryDate: saleDate,
          saleId: createdSale.id,
          invoiceNumber,
          transactionType: dueAmount.lte(0) ? 'FULL_PAYMENT' : 'PARTIAL_PAYMENT',
          productSummary: '',
          debitAmount: '0.00',
          creditAmount: money(paidAmount),
          runningBalance: money(runningBal),
          paymentMethod: insertedPayments.map((p) => p.method).join('+'),
          description: `Counter payment against ${invoiceNumber}`,
        });
      }

      await tx
        .update(customers)
        .set({
          totalPurchases: money(nextTotalPurchases),
          totalPaid: money(nextTotalPaid),
          currentDue: money(runningBal),
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerRow.id));
    }

    return { sale: createdSale, items: insertedItems, payments: insertedPayments, duplicateSkipped: false };
  });
}

// POST /api/sales
salesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = createSaleSchema.parse(req.body);
    const result = await executeAtomicSale(ctx, parsed);
    if (!result.duplicateSkipped) {
      await logAudit(
        ctx.storeId,
        ctx.uid,
        'CREATE_SALE',
        'SALE',
        result.sale.id,
        `${result.sale.invoiceNumber} Total ৳${result.sale.totalAmount} Due ৳${result.sale.dueAmount}`
      );
    }
    res.status(result.duplicateSkipped ? 200 : 201).json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to complete sale');
  }
});

// POST /api/sales/sync - Idempotent Batch Sync for Offline POS Queue
salesRouter.post('/sync', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const batchSchema = z.object({ sales: z.array(createSaleSchema) });
    const { sales: queuedSales } = batchSchema.parse(req.body);

    const results: Array<{
      clientTransactionUuid: string;
      status: 'SYNCED' | 'DUPLICATE_SKIPPED' | 'CONFLICT' | 'ERROR';
      invoiceNumber?: string;
      message?: string;
    }> = [];

    for (const s of queuedSales) {
      const uuid = s.clientTransactionUuid || crypto.randomUUID();
      try {
        const resObj = await executeAtomicSale(ctx, { ...s, clientTransactionUuid: uuid, isOfflineOrigin: true });
        const status = resObj.duplicateSkipped ? 'DUPLICATE_SKIPPED' : 'SYNCED';
        await db.insert(syncLogs).values({
          storeId: ctx.storeId,
          clientTransactionUuid: uuid,
          entityType: 'SALE',
          status,
          message: `Synced as ${resObj.sale.invoiceNumber}`,
        });
        results.push({
          clientTransactionUuid: uuid,
          status,
          invoiceNumber: resObj.sale.invoiceNumber,
          message: resObj.duplicateSkipped ? 'Already synced earlier' : 'Synced successfully',
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sync failed';
        const status = msg.toLowerCase().includes('stock') || msg.toLowerCase().includes('limit') ? 'CONFLICT' : 'ERROR';
        await db.insert(syncLogs).values({
          storeId: ctx.storeId,
          clientTransactionUuid: uuid,
          entityType: 'SALE',
          status,
          message: msg,
        });
        results.push({
          clientTransactionUuid: uuid,
          status,
          message: msg,
        });
      }
    }

    res.json({ results });
  } catch (error) {
    handleApiError(res, error, 'Failed to synchronize offline sales');
  }
});

// GET /api/sales
salesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db
      .select({
        sale: sales,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerCode: customers.customerCode,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .where(eq(sales.storeId, ctx.storeId))
      .orderBy(desc(sales.createdAt))
      .limit(150);

    const saleIds = rows.map((r) => r.sale.id);
    const items = saleIds.length ? await db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds)) : [];
    const pmts = saleIds.length ? await db.select().from(payments).where(inArray(payments.saleId, saleIds)) : [];

    const itemsBySale = new Map<number, typeof items>();
    for (const i of items) {
      const list = itemsBySale.get(i.saleId) || [];
      list.push(i);
      itemsBySale.set(i.saleId, list);
    }

    const pmtsBySale = new Map<number, typeof pmts>();
    for (const p of pmts) {
      const list = pmtsBySale.get(p.saleId) || [];
      list.push(p);
      pmtsBySale.set(p.saleId, list);
    }

    res.json(
      rows.map((r) => ({
        ...r.sale,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerCode: r.customerCode,
        items: itemsBySale.get(r.sale.id) || [],
        payments: pmtsBySale.get(r.sale.id) || [],
      }))
    );
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch sales history');
  }
});

// POST /api/sales/:id/return - Authorized Sales Return reversing stock, COGS, and customer balance
salesRouter.post('/:id/return', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER') {
      throw new HttpError(403, 'Manager or Owner authorization required to cancel or return a sale');
    }
    const saleId = Number(req.params.id);
    const reason = String(req.body?.reason || 'Customer return').trim();

    const result = await db.transaction(async (tx) => {
      const [sale] = await tx
        .select()
        .from(sales)
        .where(and(eq(sales.id, saleId), eq(sales.storeId, ctx.storeId)))
        .limit(1);
      if (!sale) throw new HttpError(404, 'Sale invoice not found');
      if (sale.status === 'RETURNED' || sale.status === 'CANCELLED') {
        throw new HttpError(400, 'This sale has already been returned or cancelled');
      }

      const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, sale.id));
      const today = dhakaTodayISO();
      const returnNumber = `SR-${today.replace(/-/g, '')}-${sale.id}`;

      const [sr] = await tx
        .insert(salesReturns)
        .values({
          storeId: ctx.storeId,
          saleId: sale.id,
          customerId: sale.customerId,
          returnNumber,
          totalRefund: sale.totalAmount,
          totalCogsReversed: sale.totalCogs,
          refundMethod: sale.customerId && D(sale.dueAmount).gt(0) ? 'CREDIT_ADJUSTMENT' : 'CASH',
          reason,
          createdByUid: ctx.uid,
        })
        .returning();

      for (const item of items) {
        await tx.insert(salesReturnItems).values({
          salesReturnId: sr.id,
          saleItemId: item.id,
          productId: item.productId,
          baseQty: item.baseQty,
          unitSellingPrice: item.unitSellingPrice,
          unitCostSnapshot: item.unitCostSnapshot,
          lineTotal: item.lineTotal,
        });

        const [prod] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (prod) {
          const restoredStock = D(prod.currentStock).plus(D(item.baseQty));
          await tx
            .update(products)
            .set({ currentStock: qty4(restoredStock), updatedAt: new Date() })
            .where(eq(products.id, prod.id));

          await tx.insert(stockMovements).values({
            storeId: ctx.storeId,
            productId: prod.id,
            movementType: 'SALE_RETURN',
            quantityDelta: item.baseQty,
            unitCost: item.unitCostSnapshot,
            balanceAfter: qty4(restoredStock),
            referenceType: 'RETURN',
            referenceId: sr.id,
            notes: `Sales return for ${sale.invoiceNumber}: ${reason}`,
            createdByUid: ctx.uid,
          });
        }
      }

      // Update sale status
      await tx
        .update(sales)
        .set({ status: 'RETURNED', dueAmount: '0.00', paymentStatus: 'PAID' })
        .where(eq(sales.id, sale.id));

      // Reverse customer ledger if customer linked
      if (sale.customerId) {
        const [cust] = await tx.select().from(customers).where(eq(customers.id, sale.customerId)).limit(1);
        if (cust) {
          // Credit the customer's khata by the unpaid due portion (or full invoice if adjusted against balance)
          const creditAdjustment = D(sale.dueAmount).gt(0) ? D(sale.dueAmount) : D(0);
          const cashRefund = D(sale.paidAmount);
          const nextDue = D(cust.currentDue).minus(creditAdjustment);
          const nextPurchases = DecimalMaxZero(D(cust.totalPurchases).minus(D(sale.totalAmount)));
          const nextPaid = DecimalMaxZero(D(cust.totalPaid).minus(cashRefund));

          await tx.insert(customerLedger).values({
            storeId: ctx.storeId,
            customerId: cust.id,
            entryDate: today,
            saleId: sale.id,
            salesReturnId: sr.id,
            invoiceNumber: returnNumber,
            transactionType: 'SALES_RETURN',
            debitAmount: '0.00',
            creditAmount: money(creditAdjustment),
            runningBalance: money(nextDue),
            paymentMethod: cashRefund.gt(0) ? 'CASH_REFUND' : 'CREDIT_ADJUSTMENT',
            description: `Return of ${sale.invoiceNumber} (${reason}) — Cash refunded: ৳${money(cashRefund)}`,
          });

          await tx
            .update(customers)
            .set({
              totalPurchases: money(nextPurchases),
              totalPaid: money(nextPaid),
              currentDue: money(nextDue),
              updatedAt: new Date(),
            })
            .where(eq(customers.id, cust.id));
        }
      }

      // Cash outflow if cash was paid originally
      if (D(sale.paidAmount).gt(0)) {
        const [openReg] = await tx
          .select()
          .from(cashRegisters)
          .where(and(eq(cashRegisters.storeId, ctx.storeId), eq(cashRegisters.status, 'OPEN')))
          .orderBy(desc(cashRegisters.openedAt))
          .limit(1);

        await tx.insert(cashTransactions).values({
          storeId: ctx.storeId,
          registerId: openReg?.id ?? null,
          txType: 'SALES_RETURN_CASH',
          amount: sale.paidAmount,
          direction: 'OUT',
          referenceType: 'RETURN',
          referenceId: sr.id,
          description: `Refund for returned invoice ${sale.invoiceNumber}`,
          createdByUid: ctx.uid,
        });
      }

      return sr;
    });

    await logAudit(ctx.storeId, ctx.uid, 'SALES_RETURN', 'SALE', saleId, `${result.returnNumber}: ${reason}`);
    res.json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to process sales return');
  }
});

function DecimalMaxZero(val: ReturnType<typeof D>) {
  return val.lt(0) ? D(0) : val;
}
