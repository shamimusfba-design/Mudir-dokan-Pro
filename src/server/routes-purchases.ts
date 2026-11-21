import { Router } from 'express';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.ts';
import {
  suppliers,
  supplierLedger,
  supplierPayments,
  purchases,
  purchaseItems,
  purchaseReturns,
  purchaseReturnItems,
  products,
  stockMovements,
  cashRegisters,
  cashTransactions,
} from '../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { resolveUserStore, logAudit, handleApiError, HttpError } from './context.ts';
import { D, money, qty4, dhakaTodayISO, computeWeightedAverageCost } from '../lib/decimal.ts';

export const purchasesRouter = Router();
purchasesRouter.use(requireAuth);

// Suppliers CRUD
const supplierSchema = z.object({
  name: z.string().min(1).max(160),
  company: z.string().max(160).optional().default(''),
  phone: z.string().min(5).max(40),
  address: z.string().max(300).optional().default(''),
  openingBalance: z.union([z.string(), z.number()]).optional().default('0'),
  notes: z.string().max(400).optional().default(''),
});

purchasesRouter.get('/suppliers', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.storeId, ctx.storeId), eq(suppliers.isActive, true)))
      .orderBy(desc(suppliers.currentDue), suppliers.name);
    res.json(rows);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch suppliers');
  }
});

purchasesRouter.post('/suppliers', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = supplierSchema.parse(req.body);
    const opening = D(parsed.openingBalance);
    const today = dhakaTodayISO();

    const created = await db.transaction(async (tx) => {
      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(suppliers)
        .where(eq(suppliers.storeId, ctx.storeId));
      const supplierCode = `SUP-${String(Number(count) + 1).padStart(4, '0')}`;

      const [sup] = await tx
        .insert(suppliers)
        .values({
          storeId: ctx.storeId,
          supplierCode,
          name: parsed.name.trim(),
          company: (parsed.company || '').trim(),
          phone: parsed.phone.trim(),
          address: (parsed.address || '').trim(),
          openingBalance: money(opening),
          totalPurchases: '0.00',
          totalPaid: '0.00',
          currentDue: money(opening),
          notes: (parsed.notes || '').trim(),
        })
        .returning();

      await tx.insert(supplierLedger).values({
        storeId: ctx.storeId,
        supplierId: sup.id,
        entryDate: today,
        transactionType: 'OPENING_BALANCE',
        debitAmount: '0.00',
        creditAmount: money(opening),
        runningBalance: money(opening),
        description: 'Supplier opening balance',
      });

      return sup;
    });

    await logAudit(ctx.storeId, ctx.uid, 'CREATE_SUPPLIER', 'SUPPLIER', created.id, created.name);
    res.status(201).json(created);
  } catch (error) {
    handleApiError(res, error, 'Failed to create supplier');
  }
});

purchasesRouter.get('/suppliers/:id/ledger', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const id = Number(req.params.id);
    const [sup] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.storeId, ctx.storeId)))
      .limit(1);
    if (!sup) throw new HttpError(404, 'Supplier not found');

    const [ledger, supPurchases, supPayments] = await Promise.all([
      db.select().from(supplierLedger).where(eq(supplierLedger.supplierId, id)).orderBy(desc(supplierLedger.id)),
      db.select().from(purchases).where(eq(purchases.supplierId, id)).orderBy(desc(purchases.createdAt)),
      db.select().from(supplierPayments).where(eq(supplierPayments.supplierId, id)).orderBy(desc(supplierPayments.createdAt)),
    ]);

    res.json({ supplier: sup, ledger, purchases: supPurchases, payments: supPayments });
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch supplier ledger');
  }
});

// POST /api/purchases/suppliers/:id/payments - Record Supplier Payment (NOT a new purchase)
const supplierPaySchema = z.object({
  amount: z.union([z.string(), z.number()]),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']).default('CASH'),
  paymentDate: z.string().optional(),
  remarks: z.string().max(300).optional().default(''),
});

purchasesRouter.post('/suppliers/:id/payments', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const supplierId = Number(req.params.id);
    const parsed = supplierPaySchema.parse(req.body);
    const amount = D(parsed.amount);
    if (amount.lte(0)) throw new HttpError(400, 'Payment amount must be greater than zero');
    const payDate = parsed.paymentDate || dhakaTodayISO();

    const result = await db.transaction(async (tx) => {
      const [sup] = await tx
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.id, supplierId), eq(suppliers.storeId, ctx.storeId)))
        .limit(1);
      if (!sup) throw new HttpError(404, 'Supplier not found');

      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(supplierPayments)
        .where(eq(supplierPayments.storeId, ctx.storeId));
      const receiptNumber = `SP-${payDate.replace(/-/g, '')}-${String(Number(count) + 1).padStart(4, '0')}`;

      const [pmt] = await tx
        .insert(supplierPayments)
        .values({
          storeId: ctx.storeId,
          supplierId: sup.id,
          receiptNumber,
          amount: money(amount),
          paymentMethod: parsed.paymentMethod,
          paymentDate: payDate,
          remarks: parsed.remarks || '',
          createdByUid: ctx.uid,
        })
        .returning();

      const nextDue = D(sup.currentDue).minus(amount);
      const nextPaid = D(sup.totalPaid).plus(amount);

      await tx.insert(supplierLedger).values({
        storeId: ctx.storeId,
        supplierId: sup.id,
        entryDate: payDate,
        transactionType: 'PAYMENT',
        referenceId: pmt.id,
        invoiceNumber: receiptNumber,
        debitAmount: money(amount),
        creditAmount: '0.00',
        runningBalance: money(nextDue),
        paymentMethod: parsed.paymentMethod,
        description: parsed.remarks || `Payment to ${sup.name}`,
      });

      await tx
        .update(suppliers)
        .set({ totalPaid: money(nextPaid), currentDue: money(nextDue) })
        .where(eq(suppliers.id, sup.id));

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
          txType: 'SUPPLIER_PAYMENT',
          amount: money(amount),
          direction: 'OUT',
          referenceType: 'SUPPLIER_PAYMENT',
          referenceId: pmt.id,
          description: `Supplier payment to ${sup.name} (${receiptNumber})`,
          createdByUid: ctx.uid,
        });
      }

      return { payment: pmt, currentDue: money(nextDue) };
    });

    await logAudit(ctx.storeId, ctx.uid, 'SUPPLIER_PAYMENT', 'SUPPLIER', supplierId, `Paid ৳${money(amount)}`);
    res.status(201).json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to record supplier payment');
  }
});

// Purchases CRUD with Unit Conversion & Weighted Average Cost Recalculation
const purchaseItemSchema = z.object({
  productId: z.number().int().positive(),
  purchaseUnit: z.string().min(1).default('Piece'),
  conversionFactor: z.union([z.string(), z.number()]).default('1'),
  enteredQty: z.union([z.string(), z.number()]),
  unitCostEntered: z.union([z.string(), z.number()]),
  expiryDate: z.string().nullable().optional(),
});

const createPurchaseSchema = z.object({
  supplierId: z.number().int().positive(),
  supplierInvoiceNo: z.string().max(80).optional().default(''),
  purchaseDate: z.string().optional(),
  transportCost: z.union([z.string(), z.number()]).optional().default('0'),
  otherCost: z.union([z.string(), z.number()]).optional().default('0'),
  discount: z.union([z.string(), z.number()]).optional().default('0'),
  paidAmount: z.union([z.string(), z.number()]).optional().default('0'),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']).default('CASH'),
  notes: z.string().max(400).optional().default(''),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
});

purchasesRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db
      .select({
        purchase: purchases,
        supplierName: suppliers.name,
        supplierPhone: suppliers.phone,
      })
      .from(purchases)
      .innerJoin(suppliers, eq(purchases.supplierId, suppliers.id))
      .where(eq(purchases.storeId, ctx.storeId))
      .orderBy(desc(purchases.createdAt))
      .limit(100);

    const ids = rows.map((r) => r.purchase.id);
    const items = ids.length ? await db.select().from(purchaseItems).where(inArray(purchaseItems.purchaseId, ids)) : [];
    const byPurchase = new Map<number, typeof items>();
    for (const i of items) {
      const list = byPurchase.get(i.purchaseId) || [];
      list.push(i);
      byPurchase.set(i.purchaseId, list);
    }

    res.json(
      rows.map((r) => ({
        ...r.purchase,
        supplierName: r.supplierName,
        supplierPhone: r.supplierPhone,
        items: byPurchase.get(r.purchase.id) || [],
      }))
    );
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch purchases');
  }
});

purchasesRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = createPurchaseSchema.parse(req.body);
    const purchaseDate = parsed.purchaseDate || dhakaTodayISO();
    const transportCost = D(parsed.transportCost);
    const otherCost = D(parsed.otherCost);
    const discount = D(parsed.discount);
    const paidAmount = D(parsed.paidAmount);

    const result = await db.transaction(async (tx) => {
      const [sup] = await tx
        .select()
        .from(suppliers)
        .where(and(eq(suppliers.id, parsed.supplierId), eq(suppliers.storeId, ctx.storeId)))
        .limit(1);
      if (!sup) throw new HttpError(404, 'Supplier not found');

      const prodIds = Array.from(new Set(parsed.items.map((i) => i.productId)));
      const prodRows = await tx
        .select()
        .from(products)
        .where(and(eq(products.storeId, ctx.storeId), inArray(products.id, prodIds)));
      const prodMap = new Map(prodRows.map((p) => [p.id, p]));

      let subtotal = D(0);
      const rawLines = parsed.items.map((item) => {
        const prod = prodMap.get(item.productId);
        if (!prod) throw new HttpError(404, `Product ${item.productId} not found`);
        const enteredQty = D(item.enteredQty);
        const factor = D(item.conversionFactor);
        const unitCostEntered = D(item.unitCostEntered);
        if (enteredQty.lte(0) || factor.lte(0) || unitCostEntered.lt(0)) {
          throw new HttpError(400, `Invalid quantity or cost for ${prod.name}`);
        }
        const baseQty = enteredQty.times(factor);
        const lineSubtotal = enteredQty.times(unitCostEntered);
        subtotal = subtotal.plus(lineSubtotal);
        return { prod, item, enteredQty, factor, baseQty, unitCostEntered, lineSubtotal };
      });

      const netExtra = transportCost.plus(otherCost).minus(discount);
      const totalAmount = subtotal.plus(netExtra);
      if (totalAmount.lt(0)) throw new HttpError(400, 'Total purchase cannot be negative');
      const dueAmount = totalAmount.minus(paidAmount);

      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(purchases)
        .where(eq(purchases.storeId, ctx.storeId));
      const invoiceNumber = `${ctx.settings.purchasePrefix || 'PUR'}-${purchaseDate.replace(/-/g, '')}-${String(
        Number(count) + 1
      ).padStart(4, '0')}`;

      const [createdPurchase] = await tx
        .insert(purchases)
        .values({
          storeId: ctx.storeId,
          supplierId: sup.id,
          invoiceNumber,
          supplierInvoiceNo: parsed.supplierInvoiceNo || '',
          purchaseDate,
          subtotal: money(subtotal),
          transportCost: money(transportCost),
          otherCost: money(otherCost),
          discount: money(discount),
          totalAmount: money(totalAmount),
          paidAmount: money(paidAmount),
          dueAmount: money(dueAmount),
          paymentMethod: parsed.paymentMethod,
          status: 'COMPLETED',
          notes: parsed.notes || '',
          createdByUid: ctx.uid,
        })
        .returning();

      // Update each product's stock & Weighted Average Cost!
      for (const line of rawLines) {
        // Proportionally allocate transport + other costs - discount into landed cost
        const shareRatio = subtotal.gt(0) ? line.lineSubtotal.dividedBy(subtotal) : D(0);
        const landedLineCost = line.lineSubtotal.plus(netExtra.times(shareRatio));
        const landedUnitCostBase = landedLineCost.dividedBy(line.baseQty);

        // Fetch fresh stock in case same product appears twice in invoice
        const [freshProd] = await tx.select().from(products).where(eq(products.id, line.prod.id)).limit(1);
        const newAvgCost = computeWeightedAverageCost(
          freshProd.currentStock,
          freshProd.avgCostPrice,
          line.baseQty,
          landedLineCost
        );
        const newStock = D(freshProd.currentStock).plus(line.baseQty);

        await tx.insert(purchaseItems).values({
          purchaseId: createdPurchase.id,
          productId: line.prod.id,
          productName: line.prod.name,
          purchaseUnit: line.item.purchaseUnit,
          conversionFactor: qty4(line.factor),
          enteredQty: qty4(line.enteredQty),
          baseQty: qty4(line.baseQty),
          unitCostEntered: line.unitCostEntered.toFixed(4),
          landedUnitCostBase: landedUnitCostBase.toFixed(4),
          lineTotal: money(line.lineSubtotal),
          expiryDate: line.item.expiryDate || null,
        });

        await tx
          .update(products)
          .set({
            currentStock: qty4(newStock),
            avgCostPrice: newAvgCost,
            lastPurchasePrice: landedUnitCostBase.toFixed(4),
            expiryDate: line.item.expiryDate || freshProd.expiryDate,
            updatedAt: new Date(),
          })
          .where(eq(products.id, line.prod.id));

        await tx.insert(stockMovements).values({
          storeId: ctx.storeId,
          productId: line.prod.id,
          movementType: 'PURCHASE_IN',
          quantityDelta: qty4(line.baseQty),
          unitCost: landedUnitCostBase.toFixed(4),
          balanceAfter: qty4(newStock),
          referenceType: 'PURCHASE',
          referenceId: createdPurchase.id,
          notes: `Purchase ${invoiceNumber} (${line.enteredQty.toNumber()} ${line.item.purchaseUnit} = ${line.baseQty.toNumber()} ${line.prod.baseUnit})`,
          createdByUid: ctx.uid,
        });
      }

      // Update supplier ledger & balance
      let runningBal = D(sup.currentDue).plus(totalAmount);
      await tx.insert(supplierLedger).values({
        storeId: ctx.storeId,
        supplierId: sup.id,
        entryDate: purchaseDate,
        transactionType: 'PURCHASE',
        referenceId: createdPurchase.id,
        invoiceNumber,
        debitAmount: '0.00',
        creditAmount: money(totalAmount),
        runningBalance: money(runningBal),
        paymentMethod: parsed.paymentMethod,
        description: `Purchase invoice ${invoiceNumber}`,
      });

      if (paidAmount.gt(0)) {
        runningBal = runningBal.minus(paidAmount);
        await tx.insert(supplierLedger).values({
          storeId: ctx.storeId,
          supplierId: sup.id,
          entryDate: purchaseDate,
          transactionType: 'PAYMENT',
          referenceId: createdPurchase.id,
          invoiceNumber,
          debitAmount: money(paidAmount),
          creditAmount: '0.00',
          runningBalance: money(runningBal),
          paymentMethod: parsed.paymentMethod,
          description: `Upfront payment on ${invoiceNumber}`,
        });

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
            txType: 'PURCHASE_CASH',
            amount: money(paidAmount),
            direction: 'OUT',
            referenceType: 'PURCHASE',
            referenceId: createdPurchase.id,
            description: `Cash paid for purchase ${invoiceNumber}`,
            createdByUid: ctx.uid,
          });
        }
      }

      await tx
        .update(suppliers)
        .set({
          totalPurchases: money(D(sup.totalPurchases).plus(totalAmount)),
          totalPaid: money(D(sup.totalPaid).plus(paidAmount)),
          currentDue: money(runningBal),
        })
        .where(eq(suppliers.id, sup.id));

      return createdPurchase;
    });

    await logAudit(
      ctx.storeId,
      ctx.uid,
      'CREATE_PURCHASE',
      'PURCHASE',
      result.id,
      `${result.invoiceNumber} Total ৳${result.totalAmount} Due ৳${result.dueAmount}`
    );
    res.status(201).json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to record purchase');
  }
});

// POST /api/purchases/:id/return - Purchase return reversing inventory & supplier balance
purchasesRouter.post('/:id/return', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER') throw new HttpError(403, 'Owner or Manager authorization required');
    const purchaseId = Number(req.params.id);
    const reason = String(req.body?.reason || 'Returned to distributor').trim();

    const result = await db.transaction(async (tx) => {
      const [pur] = await tx
        .select()
        .from(purchases)
        .where(and(eq(purchases.id, purchaseId), eq(purchases.storeId, ctx.storeId)))
        .limit(1);
      if (!pur) throw new HttpError(404, 'Purchase not found');
      if (pur.status === 'RETURNED') throw new HttpError(400, 'Purchase already returned');

      const items = await tx.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, pur.id));
      const today = dhakaTodayISO();
      const returnNumber = `PR-${today.replace(/-/g, '')}-${pur.id}`;

      const [pr] = await tx
        .insert(purchaseReturns)
        .values({
          storeId: ctx.storeId,
          purchaseId: pur.id,
          supplierId: pur.supplierId,
          returnNumber,
          totalAmount: pur.totalAmount,
          reason,
          createdByUid: ctx.uid,
        })
        .returning();

      for (const item of items) {
        await tx.insert(purchaseReturnItems).values({
          purchaseReturnId: pr.id,
          productId: item.productId,
          baseQty: item.baseQty,
          unitCost: item.landedUnitCostBase,
          lineTotal: item.lineTotal,
        });

        const [prod] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (prod) {
          const nextStock = D(prod.currentStock).minus(D(item.baseQty));
          await tx
            .update(products)
            .set({ currentStock: qty4(nextStock), updatedAt: new Date() })
            .where(eq(products.id, prod.id));

          await tx.insert(stockMovements).values({
            storeId: ctx.storeId,
            productId: prod.id,
            movementType: 'PURCHASE_RETURN',
            quantityDelta: qty4(D(item.baseQty).negated()),
            unitCost: item.landedUnitCostBase,
            balanceAfter: qty4(nextStock),
            referenceType: 'RETURN',
            referenceId: pr.id,
            notes: `Purchase return ${pur.invoiceNumber}: ${reason}`,
            createdByUid: ctx.uid,
          });
        }
      }

      await tx.update(purchases).set({ status: 'RETURNED' }).where(eq(purchases.id, pur.id));

      const [sup] = await tx.select().from(suppliers).where(eq(suppliers.id, pur.supplierId)).limit(1);
      if (sup) {
        const nextDue = D(sup.currentDue).minus(D(pur.totalAmount));
        await tx.insert(supplierLedger).values({
          storeId: ctx.storeId,
          supplierId: sup.id,
          entryDate: today,
          transactionType: 'PURCHASE_RETURN',
          referenceId: pr.id,
          invoiceNumber: returnNumber,
          debitAmount: pur.totalAmount,
          creditAmount: '0.00',
          runningBalance: money(nextDue),
          description: `Return of ${pur.invoiceNumber}: ${reason}`,
        });
        await tx
          .update(suppliers)
          .set({ currentDue: money(nextDue) })
          .where(eq(suppliers.id, sup.id));
      }

      return pr;
    });

    await logAudit(ctx.storeId, ctx.uid, 'PURCHASE_RETURN', 'PURCHASE', purchaseId, result.returnNumber);
    res.json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to process purchase return');
  }
});
