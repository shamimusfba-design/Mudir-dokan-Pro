import { Router } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  stores,
  storeSettings,
  customers,
  customerLedger,
  customerPayments,
  paymentAllocations,
  customerPortalUsers,
  portalOtpCodes,
  customerInvitations,
  customerDisputes,
  sales,
  saleItems,
  products,
} from '../db/schema.ts';
import { requirePortalAuth, signPortalToken, type PortalRequest } from '../middleware/auth.ts';
import { handleApiError, HttpError } from './context.ts';

export const portalRouter = Router();

function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, '').trim();
}

// GET /api/portal/invite/:token - Resolve QR/Invite Link safely (no sensitive data exposed)
portalRouter.get('/invite/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '').trim();
    const [inv] = await db
      .select({
        token: customerInvitations.token,
        expiresAt: customerInvitations.expiresAt,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerCode: customers.customerCode,
        storeName: stores.name,
        storeNameBn: stores.nameBn,
        storeLogoUrl: stores.logoUrl,
      })
      .from(customerInvitations)
      .innerJoin(customers, eq(customerInvitations.customerId, customers.id))
      .innerJoin(stores, eq(customerInvitations.storeId, stores.id))
      .where(eq(customerInvitations.token, token))
      .limit(1);

    if (!inv || new Date(inv.expiresAt).getTime() < Date.now()) {
      throw new HttpError(404, 'Invitation link is invalid or expired');
    }

    res.json({
      storeName: inv.storeName,
      storeNameBn: inv.storeNameBn,
      storeLogoUrl: inv.storeLogoUrl,
      customerName: inv.customerName,
      customerCode: inv.customerCode,
      phone: inv.customerPhone,
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to resolve portal invitation');
  }
});

// POST /api/portal/auth/request-otp
portalRouter.post('/auth/request-otp', async (req, res) => {
  try {
    const schema = z.object({
      phone: z.string().min(6).max(30),
      inviteToken: z.string().optional(),
    });
    const parsed = schema.parse(req.body);
    const cleanedPhone = normalizePhone(parsed.phone);

    let customerRow: typeof customers.$inferSelect | undefined;
    if (parsed.inviteToken) {
      const [inv] = await db
        .select()
        .from(customerInvitations)
        .where(eq(customerInvitations.token, parsed.inviteToken))
        .limit(1);
      if (inv && new Date(inv.expiresAt).getTime() > Date.now()) {
        const [c] = await db.select().from(customers).where(eq(customers.id, inv.customerId)).limit(1);
        if (c && normalizePhone(c.phone) === cleanedPhone) {
          customerRow = c;
        }
      }
    }

    if (!customerRow) {
      const candidates = await db.select().from(customers).where(eq(customers.isActive, true));
      customerRow = candidates.find((c) => normalizePhone(c.phone) === cleanedPhone);
    }

    if (!customerRow) {
      throw new HttpError(404, 'No active customer account found for this mobile number. Please ask your shopkeeper.');
    }

    // Generate 6-digit OTP
    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    await db.insert(portalOtpCodes).values({
      storeId: customerRow.storeId,
      customerId: customerRow.id,
      phone: cleanedPhone,
      codeHash: hashOtp(code),
      shopkeeperDisplayCode: code,
      expiresAt,
    });

    const [settings] = await db
      .select()
      .from(storeSettings)
      .where(eq(storeSettings.storeId, customerRow.storeId))
      .limit(1);

    let smsDispatched = false;
    if (settings?.smsProvider === 'WEBHOOK' && settings.smsWebhookUrl) {
      try {
        const resp = await fetch(settings.smsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanedPhone,
            message: `Your MudirDokan Digital Khata login OTP is ${code}. Valid for 10 minutes.`,
          }),
        });
        smsDispatched = resp.ok;
      } catch {
        smsDispatched = false;
      }
    }

    res.json({
      success: true,
      smsDispatched,
      expiresInSeconds: 600,
      message: smsDispatched
        ? 'OTP sent to your mobile via SMS.'
        : 'OTP generated. Ask the shopkeeper for your 6-digit code shown in their Digital Khata panel (or check SMS once gateway is configured).',
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to generate OTP');
  }
});

// POST /api/portal/auth/verify-otp
portalRouter.post('/auth/verify-otp', async (req, res) => {
  try {
    const schema = z.object({
      phone: z.string().min(6).max(30),
      otp: z.string().length(6),
      inviteToken: z.string().optional(),
    });
    const parsed = schema.parse(req.body);
    const cleanedPhone = normalizePhone(parsed.phone);

    const [otpRow] = await db
      .select()
      .from(portalOtpCodes)
      .where(eq(portalOtpCodes.phone, cleanedPhone))
      .orderBy(desc(portalOtpCodes.createdAt))
      .limit(1);

    if (!otpRow || otpRow.usedAt || new Date(otpRow.expiresAt).getTime() < Date.now()) {
      throw new HttpError(400, 'OTP is invalid or expired. Please request a new OTP.');
    }

    if (otpRow.attempts >= 5) {
      throw new HttpError(429, 'Too many invalid attempts. Please request a fresh OTP.');
    }

    if (otpRow.codeHash !== hashOtp(parsed.otp)) {
      await db
        .update(portalOtpCodes)
        .set({ attempts: otpRow.attempts + 1 })
        .where(eq(portalOtpCodes.id, otpRow.id));
      throw new HttpError(400, 'Incorrect 6-digit OTP code');
    }

    await db.update(portalOtpCodes).set({ usedAt: new Date() }).where(eq(portalOtpCodes.id, otpRow.id));

    await db
      .insert(customerPortalUsers)
      .values({
        storeId: otpRow.storeId,
        customerId: otpRow.customerId,
        phone: cleanedPhone,
        isActive: true,
        lastLoginAt: new Date(),
      })
      .onConflictDoUpdate({
        target: customerPortalUsers.customerId,
        set: { lastLoginAt: new Date(), phone: cleanedPhone },
      });

    if (parsed.inviteToken) {
      await db
        .update(customerInvitations)
        .set({ usedAt: new Date() })
        .where(eq(customerInvitations.token, parsed.inviteToken));
    }

    const token = signPortalToken({
      customerId: otpRow.customerId,
      storeId: otpRow.storeId,
      phone: cleanedPhone,
    });

    res.json({ token });
  } catch (error) {
    handleApiError(res, error, 'OTP verification failed');
  }
});

// GET /api/portal/me - STRICT CUSTOMER-SAFE DTO ONLY (Zero cost/profit/other-customer leakage)
portalRouter.get('/me', requirePortalAuth, async (req: PortalRequest, res) => {
  try {
    const { customerId, storeId } = req.portalCustomer!;

    const [[store], [customer]] = await Promise.all([
      db
        .select({
          name: stores.name,
          nameBn: stores.nameBn,
          phone: stores.phone,
          address: stores.address,
          addressBn: stores.addressBn,
          currencySymbol: stores.currencySymbol,
          logoUrl: stores.logoUrl,
        })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1),
      db
        .select({
          id: customers.id,
          customerCode: customers.customerCode,
          name: customers.name,
          phone: customers.phone,
          altPhone: customers.altPhone,
          village: customers.village,
          area: customers.area,
          road: customers.road,
          house: customers.house,
          customerType: customers.customerType,
          creditLimit: customers.creditLimit,
          openingBalance: customers.openingBalance,
          totalPurchases: customers.totalPurchases,
          totalPaid: customers.totalPaid,
          currentDue: customers.currentDue,
          registrationDate: customers.registrationDate,
        })
        .from(customers)
        .where(and(eq(customers.id, customerId), eq(customers.storeId, storeId)))
        .limit(1),
    ]);

    if (!customer) throw new HttpError(404, 'Account not found');

    const [ledger, purchaseRows, paymentRows, disputes] = await Promise.all([
      db
        .select({
          id: customerLedger.id,
          entryDate: customerLedger.entryDate,
          invoiceNumber: customerLedger.invoiceNumber,
          transactionType: customerLedger.transactionType,
          productSummary: customerLedger.productSummary,
          debitAmount: customerLedger.debitAmount,
          creditAmount: customerLedger.creditAmount,
          runningBalance: customerLedger.runningBalance,
          paymentMethod: customerLedger.paymentMethod,
          expectedPaymentDate: customerLedger.expectedPaymentDate,
          description: customerLedger.description,
          createdAt: customerLedger.createdAt,
        })
        .from(customerLedger)
        .where(and(eq(customerLedger.customerId, customerId), eq(customerLedger.storeId, storeId)))
        .orderBy(desc(customerLedger.id)),
      // STRICT projection: NEVER select totalCogs or grossProfit
      db
        .select({
          id: sales.id,
          invoiceNumber: sales.invoiceNumber,
          saleDate: sales.saleDate,
          subtotal: sales.subtotal,
          itemDiscountTotal: sales.itemDiscountTotal,
          billDiscount: sales.billDiscount,
          totalAmount: sales.totalAmount,
          paidAmount: sales.paidAmount,
          dueAmount: sales.dueAmount,
          paymentStatus: sales.paymentStatus,
          status: sales.status,
          expectedPaymentDate: sales.expectedPaymentDate,
          createdAt: sales.createdAt,
        })
        .from(sales)
        .where(and(eq(sales.customerId, customerId), eq(sales.storeId, storeId)))
        .orderBy(desc(sales.createdAt)),
      db
        .select({
          id: customerPayments.id,
          receiptNumber: customerPayments.receiptNumber,
          amount: customerPayments.amount,
          paymentMethod: customerPayments.paymentMethod,
          paymentDate: customerPayments.paymentDate,
          referenceNo: customerPayments.referenceNo,
          remarks: customerPayments.remarks,
          createdAt: customerPayments.createdAt,
        })
        .from(customerPayments)
        .where(and(eq(customerPayments.customerId, customerId), eq(customerPayments.storeId, storeId)))
        .orderBy(desc(customerPayments.createdAt)),
      db
        .select({
          id: customerDisputes.id,
          saleId: customerDisputes.saleId,
          ledgerId: customerDisputes.ledgerId,
          reason: customerDisputes.reason,
          status: customerDisputes.status,
          resolutionNote: customerDisputes.resolutionNote,
          createdAt: customerDisputes.createdAt,
        })
        .from(customerDisputes)
        .where(and(eq(customerDisputes.customerId, customerId), eq(customerDisputes.storeId, storeId)))
        .orderBy(desc(customerDisputes.createdAt)),
    ]);

    const saleIds = purchaseRows.map((s) => s.id);
    // STRICT projection: NEVER select unitCostSnapshot, lineCogs, or lineProfit
    const safeSaleItems = saleIds.length
      ? await db
          .select({
            id: saleItems.id,
            saleId: saleItems.saleId,
            productName: saleItems.productName,
            variant: saleItems.variant,
            unitName: saleItems.unitName,
            enteredQty: saleItems.enteredQty,
            unitSellingPrice: saleItems.unitSellingPrice,
            itemDiscount: saleItems.itemDiscount,
            lineTotal: saleItems.lineTotal,
            productImageUrl: products.imageUrl,
          })
          .from(saleItems)
          .leftJoin(products, eq(saleItems.productId, products.id))
          .where(inArray(saleItems.saleId, saleIds))
      : [];

    const itemsBySale = new Map<number, typeof safeSaleItems>();
    for (const item of safeSaleItems) {
      const list = itemsBySale.get(item.saleId) || [];
      list.push(item);
      itemsBySale.set(item.saleId, list);
    }

    const paymentIds = paymentRows.map((p) => p.id);
    const allocRows = paymentIds.length
      ? await db
          .select({
            customerPaymentId: paymentAllocations.customerPaymentId,
            allocatedAmount: paymentAllocations.allocatedAmount,
            invoiceNumber: sales.invoiceNumber,
          })
          .from(paymentAllocations)
          .innerJoin(sales, eq(paymentAllocations.saleId, sales.id))
          .where(and(eq(paymentAllocations.storeId, storeId), inArray(paymentAllocations.customerPaymentId, paymentIds)))
      : [];

    const allocsByPayment = new Map<number, typeof allocRows>();
    for (const a of allocRows) {
      const list = allocsByPayment.get(a.customerPaymentId) || [];
      list.push(a);
      allocsByPayment.set(a.customerPaymentId, list);
    }

    res.json({
      store,
      customer,
      ledger,
      purchases: purchaseRows.map((s) => ({ ...s, items: itemsBySale.get(s.id) || [] })),
      payments: paymentRows.map((p) => ({ ...p, allocations: allocsByPayment.get(p.id) || [] })),
      disputes,
    });
  } catch (error) {
    handleApiError(res, error, 'Failed to load customer portal account');
  }
});

// POST /api/portal/disputes - Customer raises an inquiry/dispute on their own invoice/ledger entry
portalRouter.post('/disputes', requirePortalAuth, async (req: PortalRequest, res) => {
  try {
    const { customerId, storeId } = req.portalCustomer!;
    const schema = z.object({
      saleId: z.number().int().positive().nullable().optional(),
      ledgerId: z.number().int().positive().nullable().optional(),
      reason: z.string().min(5).max(500),
    });
    const parsed = schema.parse(req.body);

    const [created] = await db
      .insert(customerDisputes)
      .values({
        storeId,
        customerId,
        saleId: parsed.saleId ?? null,
        ledgerId: parsed.ledgerId ?? null,
        reason: parsed.reason.trim(),
        status: 'OPEN',
      })
      .returning();

    res.status(201).json(created);
  } catch (error) {
    handleApiError(res, error, 'Failed to submit inquiry');
  }
});
