import { Router } from 'express';
import { and, asc, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  customers,
  customerLedger,
  customerPayments,
  paymentAllocations,
  ledgerAdjustments,
  customerPortalUsers,
  portalOtpCodes,
  customerInvitations,
  dueReminders,
  customerDisputes,
  sales,
  saleItems,
  cashRegisters,
  cashTransactions,
} from '../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { resolveUserStore, logAudit, handleApiError, HttpError } from './context.ts';
import { D, money, dhakaTodayISO } from '../lib/decimal.ts';

export const customersRouter = Router();
customersRouter.use(requireAuth);

const customerSchema = z.object({
  name: z.string().min(1).max(160),
  phone: z.string().min(6).max(30),
  altPhone: z.string().max(30).optional().default(''),
  village: z.string().max(120).optional().default(''),
  area: z.string().max(120).optional().default(''),
  road: z.string().max(120).optional().default(''),
  house: z.string().max(120).optional().default(''),
  customerType: z.enum(['REGULAR', 'VIP', 'WHOLESALE']).optional().default('REGULAR'),
  creditLimit: z.union([z.string(), z.number()]).optional().default('5000'),
  openingBalance: z.union([z.string(), z.number()]).optional().default('0'),
  registrationDate: z.string().optional(),
  notes: z.string().max(500).optional().default(''),
});

// GET /api/customers
customersRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const rows = await db
      .select()
      .from(customers)
      .where(and(eq(customers.storeId, ctx.storeId), eq(customers.isActive, true)))
      .orderBy(desc(customers.currentDue), customers.name);
    res.json(rows);
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch customers');
  }
});

// POST /api/customers (Used both in Customers module & Quick-Create inside POS)
customersRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const parsed = customerSchema.parse(req.body);
    const regDate = parsed.registrationDate || dhakaTodayISO();
    const opening = D(parsed.openingBalance);

    const created = await db.transaction(async (tx) => {
      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(customers)
        .where(eq(customers.storeId, ctx.storeId));
      const customerCode = `${ctx.settings.customerPrefix || 'CUST'}-${String(Number(count) + 1).padStart(4, '0')}`;

      const [cust] = await tx
        .insert(customers)
        .values({
          storeId: ctx.storeId,
          customerCode,
          name: parsed.name.trim(),
          phone: parsed.phone.trim(),
          altPhone: (parsed.altPhone || '').trim(),
          village: (parsed.village || '').trim(),
          area: (parsed.area || '').trim(),
          road: (parsed.road || '').trim(),
          house: (parsed.house || '').trim(),
          customerType: parsed.customerType,
          creditLimit: money(parsed.creditLimit),
          openingBalance: money(opening),
          totalPurchases: '0.00',
          totalPaid: '0.00',
          currentDue: money(opening),
          registrationDate: regDate,
          notes: (parsed.notes || '').trim(),
        })
        .returning();

      await tx.insert(customerLedger).values({
        storeId: ctx.storeId,
        customerId: cust.id,
        entryDate: regDate,
        transactionType: 'OPENING_BALANCE',
        debitAmount: opening.gt(0) ? money(opening) : '0.00',
        creditAmount: opening.lt(0) ? money(opening.abs()) : '0.00',
        runningBalance: money(opening),
        description: opening.gt(0) ? 'Opening receivable due balance' : 'Customer Digital Khata opened',
      });

      await tx.insert(customerPortalUsers).values({
        storeId: ctx.storeId,
        customerId: cust.id,
        phone: cust.phone,
        isActive: true,
      });

      return cust;
    });

    await logAudit(ctx.storeId, ctx.uid, 'CREATE_CUSTOMER', 'CUSTOMER', created.id, `${created.customerCode} ${created.name}`);
    res.status(201).json(created);
  } catch (error) {
    handleApiError(res, error, 'Failed to create customer');
  }
});

// PUT /api/customers/:id
customersRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const id = Number(req.params.id);
    const parsed = customerSchema.partial().parse(req.body);
    const [existing] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.storeId, ctx.storeId)))
      .limit(1);
    if (!existing) throw new HttpError(404, 'Customer not found');

    const [updated] = await db
      .update(customers)
      .set({
        name: parsed.name ? parsed.name.trim() : existing.name,
        phone: parsed.phone ? parsed.phone.trim() : existing.phone,
        altPhone: parsed.altPhone !== undefined ? parsed.altPhone.trim() : existing.altPhone,
        village: parsed.village !== undefined ? parsed.village.trim() : existing.village,
        area: parsed.area !== undefined ? parsed.area.trim() : existing.area,
        road: parsed.road !== undefined ? parsed.road.trim() : existing.road,
        house: parsed.house !== undefined ? parsed.house.trim() : existing.house,
        customerType: parsed.customerType ?? existing.customerType,
        creditLimit: parsed.creditLimit !== undefined ? money(parsed.creditLimit) : existing.creditLimit,
        notes: parsed.notes !== undefined ? parsed.notes.trim() : existing.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, id), eq(customers.storeId, ctx.storeId)))
      .returning();

    if (parsed.phone) {
      await db
        .update(customerPortalUsers)
        .set({ phone: parsed.phone.trim() })
        .where(eq(customerPortalUsers.customerId, id));
    }

    await logAudit(ctx.storeId, ctx.uid, 'UPDATE_CUSTOMER', 'CUSTOMER', id, `${updated.customerCode} updated`);
    res.json(updated);
  } catch (error) {
    handleApiError(res, error, 'Failed to update customer');
  }
});

// GET /api/customers/:id/khata - Complete Digital Khata, Invoices, Allocations, Analytics, Invites & Disputes
customersRouter.get('/:id/khata', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const id = Number(req.params.id);
    const [cust] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.storeId, ctx.storeId)))
      .limit(1);
    if (!cust) throw new HttpError(404, 'Customer not found');

    const [ledger, custSales, custPayments, reminders, disputes, invites, latestOtps] = await Promise.all([
      db.select().from(customerLedger).where(eq(customerLedger.customerId, id)).orderBy(desc(customerLedger.id)),
      db.select().from(sales).where(and(eq(sales.customerId, id), eq(sales.storeId, ctx.storeId))).orderBy(desc(sales.createdAt)),
      db.select().from(customerPayments).where(eq(customerPayments.customerId, id)).orderBy(desc(customerPayments.createdAt)),
      db.select().from(dueReminders).where(eq(dueReminders.customerId, id)).orderBy(desc(dueReminders.createdAt)).limit(30),
      db.select().from(customerDisputes).where(eq(customerDisputes.customerId, id)).orderBy(desc(customerDisputes.createdAt)),
      db.select().from(customerInvitations).where(eq(customerInvitations.customerId, id)).orderBy(desc(customerInvitations.createdAt)).limit(5),
      db
        .select()
        .from(portalOtpCodes)
        .where(and(eq(portalOtpCodes.customerId, id), eq(portalOtpCodes.storeId, ctx.storeId)))
        .orderBy(desc(portalOtpCodes.createdAt))
        .limit(1),
    ]);

    const saleIds = custSales.map((s) => s.id);
    const items = saleIds.length ? await db.select().from(saleItems).where(inArray(saleItems.saleId, saleIds)) : [];
    const itemsBySale = new Map<number, typeof items>();
    for (const i of items) {
      const list = itemsBySale.get(i.saleId) || [];
      list.push(i);
      itemsBySale.set(i.saleId, list);
    }

    const paymentIds = custPayments.map((p) => p.id);
    const allocs = paymentIds.length
      ? await db
          .select({
            id: paymentAllocations.id,
            customerPaymentId: paymentAllocations.customerPaymentId,
            saleId: paymentAllocations.saleId,
            allocatedAmount: paymentAllocations.allocatedAmount,
            invoiceNumber: sales.invoiceNumber,
          })
          .from(paymentAllocations)
          .innerJoin(sales, eq(paymentAllocations.saleId, sales.id))
          .where(inArray(paymentAllocations.customerPaymentId, paymentIds))
      : [];

    const allocsByPayment = new Map<number, typeof allocs>();
    for (const a of allocs) {
      const list = allocsByPayment.get(a.customerPaymentId) || [];
      list.push(a);
      allocsByPayment.set(a.customerPaymentId, list);
    }

    // Compute Customer Analytics
    const completedSales = custSales.filter((s) => s.status !== 'CANCELLED' && s.status !== 'RETURNED');
    const purchaseCount = completedSales.length;
    const lifetimeValue = completedSales.reduce((acc, s) => acc.plus(D(s.totalAmount)), D(0));
    const avgPurchaseValue = purchaseCount > 0 ? lifetimeValue.dividedBy(purchaseCount) : D(0);
    const lastPurchaseDate = completedSales[0]?.saleDate || null;

    // Average Payment Delay (days past expectedPaymentDate for overdue or paid invoices)
    const todayMs = new Date(`${dhakaTodayISO()}T00:00:00Z`).getTime();
    let delaySum = 0;
    let delayCount = 0;
    for (const s of completedSales) {
      if (s.expectedPaymentDate && D(s.dueAmount).gt(0)) {
        const expMs = new Date(`${s.expectedPaymentDate}T00:00:00Z`).getTime();
        const diffDays = Math.floor((todayMs - expMs) / 86400000);
        if (diffDays > 0) {
          delaySum += diffDays;
          delayCount += 1;
        }
      }
    }
    const avgPaymentDelayDays = delayCount > 0 ? Math.round(delaySum / delayCount) : 0;

    const creditLimitDec = D(cust.creditLimit);
    const utilizationPct = creditLimitDec.gt(0)
      ? Math.min(100, Math.round(D(cust.currentDue).dividedBy(creditLimitDec).times(100).toNumber()))
      : 0;

    const activeOtp =
      latestOtps[0] && !latestOtps[0].usedAt && new Date(latestOtps[0].expiresAt).getTime() > Date.now()
        ? { code: latestOtps[0].shopkeeperDisplayCode, expiresAt: latestOtps[0].expiresAt }
        : null;

    res.json({
      customer: cust,
      ledger,
      sales: custSales.map((s) => ({ ...s, items: itemsBySale.get(s.id) || [] })),
      unpaidInvoices: custSales
        .filter((s) => s.status === 'COMPLETED' && D(s.dueAmount).gt(0))
        .sort((a, b) => a.saleDate.localeCompare(b.saleDate)),
      payments: custPayments.map((p) => ({ ...p, allocations: allocsByPayment.get(p.id) || [] })),
      reminders,
      disputes,
      latestInvitation: invites[0] || null,
      activeOtp,
      analytics: {
        lifetimePurchaseValue: money(lifetimeValue),
        totalPaid: cust.totalPaid,
        currentOutstanding: cust.currentDue,
        purchaseFrequency: purchaseCount,
        averagePurchaseValue: money(avgPurchaseValue),
        lastPurchaseDate,
        averagePaymentDelayDays: avgPaymentDelayDays,
        creditLimitUtilizationPct: utilizationPct,
      },
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to fetch customer Digital Khata');
  }
});

// POST /api/customers/:id/payments - Multi-Invoice Payment Allocation & Due Collection (NOT new revenue)
const dueCollectionSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  paymentMethod: z.enum(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']).default('CASH'),
  paymentDate: z.string().optional(),
  referenceNo: z.string().max(80).optional().default(''),
  remarks: z.string().max(300).optional().default(''),
  allocations: z
    .array(
      z.object({
        saleId: z.number().int().positive(),
        allocatedAmount: z.union([z.string(), z.number()]),
      })
    )
    .optional(),
});

customersRouter.post('/:id/payments', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const customerId = Number(req.params.id);
    const parsed = dueCollectionSchema.parse(req.body);
    const totalPay = D(parsed.amount);
    if (totalPay.lte(0)) throw new HttpError(400, 'Payment amount must be greater than zero');
    const payDate = parsed.paymentDate || dhakaTodayISO();

    const result = await db.transaction(async (tx) => {
      const [cust] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.storeId, ctx.storeId)))
        .limit(1);
      if (!cust) throw new HttpError(404, 'Customer not found');

      const [{ count }] = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(customerPayments)
        .where(eq(customerPayments.storeId, ctx.storeId));
      const receiptNumber = `RCP-${payDate.replace(/-/g, '')}-${String(Number(count) + 1).padStart(4, '0')}`;

      const [payment] = await tx
        .insert(customerPayments)
        .values({
          storeId: ctx.storeId,
          customerId: cust.id,
          receiptNumber,
          amount: money(totalPay),
          paymentMethod: parsed.paymentMethod,
          paymentDate: payDate,
          referenceNo: parsed.referenceNo || '',
          remarks: parsed.remarks || '',
          createdByUid: ctx.uid,
        })
        .returning();

      // Fetch open invoices ordered oldest first (FIFO)
      const openInvoices = await tx
        .select()
        .from(sales)
        .where(
          and(
            eq(sales.storeId, ctx.storeId),
            eq(sales.customerId, cust.id),
            eq(sales.status, 'COMPLETED'),
            gt(sales.dueAmount, '0')
          )
        )
        .orderBy(asc(sales.saleDate), asc(sales.id));

      const allocatedDetails: Array<{ saleId: number; invoiceNumber: string; allocatedAmount: string }> = [];

      if (parsed.allocations && parsed.allocations.length > 0) {
        let sumAlloc = D(0);
        const invoiceMap = new Map(openInvoices.map((inv) => [inv.id, inv]));
        for (const alloc of parsed.allocations) {
          const amt = D(alloc.allocatedAmount);
          if (amt.lte(0)) continue;
          const inv = invoiceMap.get(alloc.saleId);
          if (!inv) continue;
          const capped = amt.gt(D(inv.dueAmount)) ? D(inv.dueAmount) : amt;
          sumAlloc = sumAlloc.plus(capped);
          if (sumAlloc.gt(totalPay.plus('0.01'))) {
            throw new HttpError(400, 'Total allocated amount cannot exceed payment amount');
          }

          const nextInvPaid = D(inv.paidAmount).plus(capped);
          const nextInvDue = D(inv.dueAmount).minus(capped);
          const nextStatus = nextInvDue.lte(0) ? 'PAID' : 'PARTIAL';

          await tx
            .update(sales)
            .set({
              paidAmount: money(nextInvPaid),
              dueAmount: money(nextInvDue),
              paymentStatus: nextStatus,
            })
            .where(eq(sales.id, inv.id));

          await tx.insert(paymentAllocations).values({
            storeId: ctx.storeId,
            customerPaymentId: payment.id,
            saleId: inv.id,
            allocatedAmount: money(capped),
          });
          allocatedDetails.push({ saleId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: money(capped) });
        }
      } else {
        // Automatic FIFO allocation across oldest unpaid invoices
        let remaining = totalPay;
        for (const inv of openInvoices) {
          if (remaining.lte(0)) break;
          const invDue = D(inv.dueAmount);
          const apply = remaining.gt(invDue) ? invDue : remaining;
          remaining = remaining.minus(apply);

          const nextInvPaid = D(inv.paidAmount).plus(apply);
          const nextInvDue = invDue.minus(apply);
          const nextStatus = nextInvDue.lte(0) ? 'PAID' : 'PARTIAL';

          await tx
            .update(sales)
            .set({
              paidAmount: money(nextInvPaid),
              dueAmount: money(nextInvDue),
              paymentStatus: nextStatus,
            })
            .where(eq(sales.id, inv.id));

          await tx.insert(paymentAllocations).values({
            storeId: ctx.storeId,
            customerPaymentId: payment.id,
            saleId: inv.id,
            allocatedAmount: money(apply),
          });
          allocatedDetails.push({ saleId: inv.id, invoiceNumber: inv.invoiceNumber, allocatedAmount: money(apply) });
        }
      }

      const nextDue = D(cust.currentDue).minus(totalPay);
      const nextTotalPaid = D(cust.totalPaid).plus(totalPay);
      const allocSummary = allocatedDetails.length
        ? `Allocated to ${allocatedDetails.map((a) => `${a.invoiceNumber} (৳${a.allocatedAmount})`).join(', ')}`
        : 'Applied to customer account balance';

      await tx.insert(customerLedger).values({
        storeId: ctx.storeId,
        customerId: cust.id,
        entryDate: payDate,
        customerPaymentId: payment.id,
        invoiceNumber: receiptNumber,
        transactionType: nextDue.lte(0) ? 'FULL_PAYMENT' : 'PARTIAL_PAYMENT',
        debitAmount: '0.00',
        creditAmount: money(totalPay),
        runningBalance: money(nextDue),
        paymentMethod: parsed.paymentMethod,
        description: parsed.remarks ? `${parsed.remarks} · ${allocSummary}` : allocSummary,
      });

      await tx
        .update(customers)
        .set({
          totalPaid: money(nextTotalPaid),
          currentDue: money(nextDue),
          updatedAt: new Date(),
        })
        .where(eq(customers.id, cust.id));

      // Record cash inflow in Cash Register (NOTE: NOT sales revenue!)
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
          txType: 'CUSTOMER_DUE_COLLECTION',
          amount: money(totalPay),
          direction: 'IN',
          referenceType: 'CUSTOMER_PAYMENT',
          referenceId: payment.id,
          description: `Due collected from ${cust.name} (${receiptNumber})`,
          createdByUid: ctx.uid,
        });
      }

      return {
        payment,
        allocations: allocatedDetails,
        customer: { ...cust, currentDue: money(nextDue), totalPaid: money(nextTotalPaid) },
      };
    });

    await logAudit(
      ctx.storeId,
      ctx.uid,
      'COLLECT_CUSTOMER_DUE',
      'CUSTOMER',
      customerId,
      `${result.payment.receiptNumber} ৳${result.payment.amount} (${parsed.paymentMethod})`
    );
    res.status(201).json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to collect customer due payment');
  }
});

// POST /api/customers/:id/adjustments - Audited Balance Adjustment (Never silent deletion)
const adjustSchema = z.object({
  direction: z.enum(['DEBIT', 'CREDIT']),
  amount: z.union([z.string(), z.number()]),
  reason: z.string().min(3).max(300),
});

customersRouter.post('/:id/adjustments', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    if (ctx.role === 'CASHIER') throw new HttpError(403, 'Owner or Manager authorization required for ledger adjustments');
    const customerId = Number(req.params.id);
    const parsed = adjustSchema.parse(req.body);
    const amt = D(parsed.amount);
    if (amt.lte(0)) throw new HttpError(400, 'Adjustment amount must be greater than zero');
    const today = dhakaTodayISO();

    const result = await db.transaction(async (tx) => {
      const [cust] = await tx
        .select()
        .from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.storeId, ctx.storeId)))
        .limit(1);
      if (!cust) throw new HttpError(404, 'Customer not found');

      const [adj] = await tx
        .insert(ledgerAdjustments)
        .values({
          storeId: ctx.storeId,
          customerId: cust.id,
          direction: parsed.direction,
          amount: money(amt),
          reason: parsed.reason.trim(),
          createdByUid: ctx.uid,
        })
        .returning();

      const nextDue = parsed.direction === 'DEBIT' ? D(cust.currentDue).plus(amt) : D(cust.currentDue).minus(amt);

      await tx.insert(customerLedger).values({
        storeId: ctx.storeId,
        customerId: cust.id,
        entryDate: today,
        adjustmentId: adj.id,
        invoiceNumber: `ADJ-${adj.id}`,
        transactionType: 'BALANCE_ADJUSTMENT',
        debitAmount: parsed.direction === 'DEBIT' ? money(amt) : '0.00',
        creditAmount: parsed.direction === 'CREDIT' ? money(amt) : '0.00',
        runningBalance: money(nextDue),
        description: `Audited adjustment (${parsed.direction}): ${parsed.reason.trim()}`,
      });

      await tx
        .update(customers)
        .set({ currentDue: money(nextDue), updatedAt: new Date() })
        .where(eq(customers.id, cust.id));

      return { adjustment: adj, currentDue: money(nextDue) };
    });

    await logAudit(
      ctx.storeId,
      ctx.uid,
      'LEDGER_ADJUSTMENT',
      'CUSTOMER',
      customerId,
      `${parsed.direction} ৳${money(amt)}: ${parsed.reason}`
    );
    res.status(201).json(result);
  } catch (error) {
    handleApiError(res, error, 'Failed to record audited ledger adjustment');
  }
});

// GET /api/customers/due/dashboard - Due Tracking & 5-Bucket Aging Reports
customersRouter.get('/due/dashboard', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const today = dhakaTodayISO();
    const todayMs = new Date(`${today}T00:00:00Z`).getTime();

    const [allCustomers, allCreditSales] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(and(eq(customers.storeId, ctx.storeId), eq(customers.isActive, true)))
        .orderBy(desc(customers.currentDue)),
      db
        .select({
          sale: sales,
          customerName: customers.name,
          customerPhone: customers.phone,
          customerCode: customers.customerCode,
          customerType: customers.customerType,
        })
        .from(sales)
        .innerJoin(customers, eq(sales.customerId, customers.id))
        .where(and(eq(sales.storeId, ctx.storeId), eq(sales.status, 'COMPLETED')))
        .orderBy(asc(sales.expectedPaymentDate), asc(sales.saleDate)),
    ]);

    const totalOutstanding = allCustomers.reduce((acc, c) => acc.plus(D(c.currentDue)), D(0));

    let dueToday = D(0);
    let upcomingDue = D(0);
    let overdueAmount = D(0);
    const overdueCustomerIds = new Set<number>();
    let partiallyPaidCount = 0;
    let fullyPaidCount = 0;

    const aging = {
      '0_7': { label: '0–7 Days', amount: D(0), count: 0 },
      '8_15': { label: '8–15 Days', amount: D(0), count: 0 },
      '16_30': { label: '16–30 Days', amount: D(0), count: 0 },
      '31_60': { label: '31–60 Days', amount: D(0), count: 0 },
      '60_plus': { label: '60+ Days', amount: D(0), count: 0 },
    };

    const openInvoices = [];

    for (const row of allCreditSales) {
      const s = row.sale;
      const due = D(s.dueAmount);
      if (s.paymentStatus === 'PAID' || due.lte(0)) {
        fullyPaidCount += 1;
        continue;
      }
      if (s.paymentStatus === 'PARTIAL') partiallyPaidCount += 1;

      const saleMs = new Date(`${s.saleDate}T00:00:00Z`).getTime();
      const ageDays = Math.max(0, Math.floor((todayMs - saleMs) / 86400000));
      let bucket: keyof typeof aging = '0_7';
      if (ageDays <= 7) bucket = '0_7';
      else if (ageDays <= 15) bucket = '8_15';
      else if (ageDays <= 30) bucket = '16_30';
      else if (ageDays <= 60) bucket = '31_60';
      else bucket = '60_plus';

      aging[bucket].amount = aging[bucket].amount.plus(due);
      aging[bucket].count += 1;

      let dueState: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'NO_DATE' = 'NO_DATE';
      if (s.expectedPaymentDate) {
        if (s.expectedPaymentDate < today) {
          dueState = 'OVERDUE';
          overdueAmount = overdueAmount.plus(due);
          if (s.customerId) overdueCustomerIds.add(s.customerId);
        } else if (s.expectedPaymentDate === today) {
          dueState = 'DUE_TODAY';
          dueToday = dueToday.plus(due);
        } else {
          dueState = 'UPCOMING';
          upcomingDue = upcomingDue.plus(due);
        }
      } else if (ageDays > 30) {
        dueState = 'OVERDUE';
        overdueAmount = overdueAmount.plus(due);
        if (s.customerId) overdueCustomerIds.add(s.customerId);
      }

      openInvoices.push({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        saleDate: s.saleDate,
        expectedPaymentDate: s.expectedPaymentDate,
        totalAmount: s.totalAmount,
        paidAmount: s.paidAmount,
        dueAmount: s.dueAmount,
        paymentStatus: s.paymentStatus,
        customerId: s.customerId,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        customerCode: row.customerCode,
        customerType: row.customerType,
        ageDays,
        agingBucket: bucket,
        dueState,
      });
    }

    res.json({
      summary: {
        totalOutstanding: money(totalOutstanding),
        dueToday: money(dueToday),
        upcomingDue: money(upcomingDue),
        overdueCustomers: overdueCustomerIds.size,
        overdueAmount: money(overdueAmount),
        partiallyPaidInvoices: partiallyPaidCount,
        fullyPaidInvoices: fullyPaidCount,
      },
      aging: Object.entries(aging).map(([key, val]) => ({
        bucket: key,
        label: val.label,
        amount: money(val.amount),
        count: val.count,
      })),
      openInvoices,
      customersWithDue: allCustomers.filter((c) => D(c.currentDue).gt(0)),
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to load customer due dashboard');
  }
});

// POST /api/customers/:id/invitations - Generate secure QR/Link Portal Invitation
customersRouter.post('/:id/invitations', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const customerId = Number(req.params.id);
    const [cust] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.storeId, ctx.storeId)))
      .limit(1);
    if (!cust) throw new HttpError(404, 'Customer not found');

    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const [invite] = await db
      .insert(customerInvitations)
      .values({
        storeId: ctx.storeId,
        customerId: cust.id,
        token,
        expiresAt,
        createdByUid: ctx.uid,
      })
      .returning();

    await db
      .insert(customerPortalUsers)
      .values({ storeId: ctx.storeId, customerId: cust.id, phone: cust.phone, isActive: true })
      .onConflictDoNothing();

    await logAudit(ctx.storeId, ctx.uid, 'CREATE_PORTAL_INVITE', 'CUSTOMER', cust.id, `Portal invite generated`);
    res.status(201).json(invite);
  } catch (error) {
    handleApiError(res, error, 'Failed to generate customer portal invitation');
  }
});

// POST /api/customers/:id/reminders - Log & Dispatch SMS/WhatsApp Notification
const reminderSchema = z.object({
  reminderType: z.enum([
    'PURCHASE_CONFIRMATION',
    'PAYMENT_CONFIRMATION',
    'DUE_REMINDER',
    'OVERDUE_REMINDER',
    'MONTHLY_STATEMENT',
  ]),
  channel: z.enum(['SMS', 'WHATSAPP']).default('WHATSAPP'),
  saleId: z.number().int().positive().nullable().optional(),
  message: z.string().min(4).max(1000),
});

customersRouter.post('/:id/reminders', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const customerId = Number(req.params.id);
    const parsed = reminderSchema.parse(req.body);
    const [cust] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.storeId, ctx.storeId)))
      .limit(1);
    if (!cust) throw new HttpError(404, 'Customer not found');

    let status: 'SENT' | 'QUEUED' | 'FAILED' = 'SENT';
    // If store configured an external SMS/WhatsApp webhook provider, dispatch server-side
    if (ctx.settings.smsProvider === 'WEBHOOK' && ctx.settings.smsWebhookUrl) {
      try {
        const resp = await fetch(ctx.settings.smsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cust.phone,
            senderId: ctx.settings.smsSenderId,
            channel: parsed.channel,
            type: parsed.reminderType,
            message: parsed.message,
          }),
        });
        status = resp.ok ? 'SENT' : 'FAILED';
      } catch {
        status = 'FAILED';
      }
    }

    const [created] = await db
      .insert(dueReminders)
      .values({
        storeId: ctx.storeId,
        customerId: cust.id,
        saleId: parsed.saleId ?? null,
        reminderType: parsed.reminderType,
        channel: parsed.channel,
        message: parsed.message,
        status,
        scheduledFor: dhakaTodayISO(),
      })
      .returning();

    const cleanedPhone = cust.phone.replace(/[^0-9]/g, '');
    const bdPhone = cleanedPhone.startsWith('88') ? cleanedPhone : `88${cleanedPhone}`;
    const whatsappUrl = `https://wa.me/${bdPhone}?text=${encodeURIComponent(parsed.message)}`;

    res.status(201).json({ reminder: created, whatsappUrl });
  } catch (error) {
    handleApiError(res, error, 'Failed to send customer reminder');
  }
});

// PATCH /api/customers/disputes/:disputeId - Resolve customer dispute
customersRouter.patch('/disputes/:disputeId', async (req: AuthRequest, res) => {
  try {
    const ctx = await resolveUserStore(req);
    const disputeId = Number(req.params.disputeId);
    const status = z.enum(['RESOLVED', 'REJECTED']).parse(req.body?.status);
    const resolutionNote = String(req.body?.resolutionNote || '').trim();

    const [updated] = await db
      .update(customerDisputes)
      .set({ status, resolutionNote, resolvedAt: new Date() })
      .where(and(eq(customerDisputes.id, disputeId), eq(customerDisputes.storeId, ctx.storeId)))
      .returning();
    if (!updated) throw new HttpError(404, 'Dispute not found');
    res.json(updated);
  } catch (error) {
    handleApiError(res, error, 'Failed to update dispute');
  }
});
