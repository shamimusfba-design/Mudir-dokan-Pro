import { offlineDb, enqueueOfflineSale, cacheStoreCatalog, type CachedProduct, type CachedCustomer, type CachedCategory, type CachedBrand } from './offline-db';
import { getClientDemoCatalog, CLIENT_BD_CATEGORIES } from './client-catalog';
import { D, money, dhakaTodayISO } from './decimal';
import { auth } from './firebase';

// Default BD Expense Categories
export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 1, name: 'Shop Rent', nameBn: 'দোকান ভাড়া' },
  { id: 2, name: 'Electricity Bill', nameBn: 'বিদ্যুৎ ও কারেন্ট বিল' },
  { id: 3, name: 'Staff Salary & Food', nameBn: 'কর্মচারী বেতন ও নাস্তা' },
  { id: 4, name: 'Transport & Freight', nameBn: 'পরিবহন ও মালামাল খালাস' },
  { id: 5, name: 'Maintenance & Repair', nameBn: 'দোকান মেরামত ও মেনটেইনেন্স' },
  { id: 6, name: 'Packaging & Carry Bags', nameBn: 'প্যাকেজিং ও পলিথিন/ব্যাগ' },
  { id: 7, name: 'Tea & Refreshments', nameBn: 'চা-নাস্তা ও আপ্যায়ন' },
  { id: 8, name: 'Taxes & Trade License', nameBn: 'পৌরসভা ও ট্রেড লাইসেন্স কর' },
  { id: 9, name: 'Internet & Mobile Bill', nameBn: 'ইন্টারনেট ও মোবাইল বিল' },
  { id: 10, name: 'Miscellaneous Expense', nameBn: 'বিবিধ খরচ' },
];

export const DEFAULT_SUPPLIERS = [
  { id: 1, name: 'PRAN Foods Ltd.', contactPerson: 'কবির হোসেন', phone: '01711111111', company: 'PRAN-RFL Group', currentDue: '0.00' },
  { id: 2, name: 'Fresh (Meghna Group)', contactPerson: 'তারেক মাহমুদ', phone: '01722222222', company: 'Meghna Group', currentDue: '0.00' },
  { id: 3, name: 'ACI Pure Flour & Grains', contactPerson: 'মো. রফিক', phone: '01733333333', company: 'ACI Limited', currentDue: '0.00' },
  { id: 4, name: 'Radhuni / Ruchi (Square)', contactPerson: 'কামাল আহমেদ', phone: '01744444444', company: 'Square Consumer Products', currentDue: '0.00' },
  { id: 5, name: 'Teer (City Group)', contactPerson: 'আবুল কালাম', phone: '01755555555', company: 'City Group', currentDue: '0.00' },
  { id: 6, name: 'Bashundhara Food & Beverage', contactPerson: 'নাসির উদ্দিন', phone: '01766666666', company: 'Bashundhara Group', currentDue: '0.00' },
  { id: 7, name: 'Akij Essential Goods', contactPerson: 'সোহেল রানা', phone: '01777777777', company: 'Akij Group', currentDue: '0.00' },
  { id: 8, name: 'Unilever Bangladesh', contactPerson: 'মিজানুর রহমান', phone: '01788888888', company: 'Unilever', currentDue: '0.00' },
];

function getStoredJson<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStoredJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
  }
}

export async function handleClientMockApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(path, 'http://localhost');
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let body: any = {};
  if (options.body) {
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      body = {};
    }
  }

  const today = dhakaTodayISO();
  const demoData = getClientDemoCatalog();

  // 1. GET /api/catalog/bootstrap
  if (pathname === '/api/catalog/bootstrap' && method === 'GET') {
    let [prods, cats, brs] = await Promise.all([
      offlineDb.products.toArray(),
      offlineDb.categories.toArray(),
      offlineDb.brands.toArray(),
    ]);

    const CURRENT_CATALOG_REV = 'rev_2026_11_22_dairy_images_fix';
    const cachedRev = localStorage.getItem('mudir_catalog_rev');
    if (!prods || prods.length < demoData.products.length || cachedRev !== CURRENT_CATALOG_REV) {
      await cacheStoreCatalog(demoData);
      localStorage.setItem('mudir_catalog_rev', CURRENT_CATALOG_REV);
      prods = demoData.products;
      cats = demoData.categories;
      brs = demoData.brands;
    }

    const role = localStorage.getItem('mudidokan_role') || 'OWNER';
    return {
      user: {
        id: 1,
        storeId: 1,
        email: auth.currentUser?.email || 'shopkeeper@mudidokan.com',
        fullName: auth.currentUser?.displayName || 'মুদি দোকানদার',
        role,
        phone: '01884700631',
        isActive: true,
      },
      store: {
        id: 1,
        name: 'মুদি দোকান প্রো (MudirDokan Pro)',
        nameBn: 'মুদি দোকান প্রো',
        code: 'STORE-001',
        address: 'ঢাকা, বাংলাদেশ',
        phone: '01884700631',
      },
      settings: {
        id: 1,
        storeId: 1,
        currency: 'BDT',
        currencySymbol: '৳',
        lowStockThreshold: '10',
        allowNegativeStock: false,
        demoModeActive: true,
        allowCashierReports: true,
        demoPeriodStart: '2026-05-01',
        demoPeriodEnd: '2026-10-31',
      },
      categories: cats,
      brands: brs,
      products: prods,
    } as T;
  }

  // 2. GET /api/finance/dashboard
  if (pathname === '/api/finance/dashboard' && method === 'GET') {
    const from = searchParams.get('from') || `${today.slice(0, 7)}-01`;
    const to = searchParams.get('to') || today;

    const [allProducts, allCustomers, offlineQueue] = await Promise.all([
      offlineDb.products.toArray().then((p) => (p.length ? p : demoData.products)),
      offlineDb.customers.toArray().then((c) => (c.length ? c : demoData.customers)),
      offlineDb.offlineSalesQueue.toArray(),
    ]);

    // Aggregate real offline sales created by the user in this session
    let sessionSalesTotal = D(0);
    let sessionGrossProfit = D(0);
    const recentTxList: any[] = [];
    const catSalesMap = new Map<string, number>();

    const catMap = new Map(demoData.categories.map((c) => [c.id, c.name]));

    for (const q of offlineQueue) {
      const p = q.payload;
      const saleTotal = D(p.computedTotal || 0);
      sessionSalesTotal = sessionSalesTotal.plus(saleTotal);
      // Rough 18% profit estimation for local sales
      const estProfit = saleTotal.times(0.18);
      sessionGrossProfit = sessionGrossProfit.plus(estProfit);

      recentTxList.unshift({
        id: Math.abs(parseInt(q.localInvoiceNumber.replace(/\D/g, '') || '1')),
        invoiceNumber: q.localInvoiceNumber,
        saleDate: p.saleDate || today,
        totalAmount: p.computedTotal,
        paidAmount: p.computedPaid,
        dueAmount: p.computedDue,
        customerName: p.customerName || 'নগদ ক্রেতা',
        grossProfit: estProfit.toFixed(2),
      });

      for (const item of p.items) {
        const prod = allProducts.find((pr) => pr.id === item.productId);
        const cName = prod ? catMap.get(prod.categoryId) || 'অন্যান্য' : 'অন্যান্য';
        catSalesMap.set(cName, (catSalesMap.get(cName) || 0) + Number(item.unitSellingPrice || 0) * Number(item.enteredQty || 1));
      }
    }

    // Baseline Demo aggregates so charts look full and vibrant
    const is6m = from.startsWith('2026-05') || from < '2026-10-01';
    const baseSales = is6m ? 485000 : 86500;
    const baseProfit = is6m ? 87300 : 15570;
    const baseExpenses = is6m ? 24500 : 4200;

    const totalSalesNum = Number(sessionSalesTotal.plus(baseSales).toFixed(2));
    const grossProfitNum = Number(sessionGrossProfit.plus(baseProfit).toFixed(2));
    const totalExpensesNum = baseExpenses;
    const netProfitNum = Number((grossProfitNum - totalExpensesNum).toFixed(2));
    const grossMarginPct = totalSalesNum > 0 ? ((grossProfitNum / totalSalesNum) * 100).toFixed(1) : '18.0';

    const customerOutstanding = allCustomers.reduce((acc, c) => acc.plus(D(c.currentDue || 0)), D(0));
    const lowStockList = allProducts.filter((p) => Number(p.currentStock) > 0 && Number(p.currentStock) <= Number(p.minStock));
    const outOfStockList = allProducts.filter((p) => Number(p.currentStock) <= 0);

    // Build trend buckets
    const dailyTrend = is6m
      ? [
          { date: '2026-05', sales: 74200, grossProfit: 13350 },
          { date: '2026-06', sales: 79800, grossProfit: 14360 },
          { date: '2026-07', sales: 81400, grossProfit: 14650 },
          { date: '2026-08', sales: 83900, grossProfit: 15100 },
          { date: '2026-09', sales: 82500, grossProfit: 14850 },
          { date: '2026-10', sales: 83200 + Number(sessionSalesTotal.toFixed(2)), grossProfit: 14990 + Number(sessionGrossProfit.toFixed(2)) },
        ]
      : [
          { date: '2026-11-01', sales: 3850, grossProfit: 693 },
          { date: '2026-11-05', sales: 4200, grossProfit: 756 },
          { date: '2026-11-10', sales: 4950, grossProfit: 891 },
          { date: '2026-11-15', sales: 5120, grossProfit: 921 },
          { date: '2026-11-20', sales: 4800, grossProfit: 864 },
          { date: today, sales: 5200 + Number(sessionSalesTotal.toFixed(2)), grossProfit: 936 + Number(sessionGrossProfit.toFixed(2)) },
        ];

    const salesByCategory = [
      { category: 'চাল, ডাল ও শস্য', amount: 32400 },
      { category: 'ভোজ্য তেল ও ঘি', amount: 26500 },
      { category: 'আটা, ময়দা ও সুজি', amount: 15800 },
      { category: 'মসলা ও গুঁড়া মসলা', amount: 12200 },
      { category: 'বিস্কুট ও বেকারি', amount: 9400 },
      { category: 'চা ও কফি', amount: 7600 },
    ];

    const topSellingProducts = allProducts.slice(0, 8).map((p, idx) => ({
      productId: p.id,
      name: p.name,
      variant: p.variant,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
      qty: 45 - idx * 4,
      revenue: (45 - idx * 4) * Number(p.sellingPrice),
      profit: Math.round((45 - idx * 4) * (Number(p.sellingPrice) - Number(p.avgCostPrice))),
    }));

    return {
      range: { from, to },
      canViewProfit: true,
      kpis: {
        sales: money(totalSalesNum),
        cogs: money(totalSalesNum - grossProfitNum),
        grossProfit: money(grossProfitNum),
        grossMarginPct,
        netProfit: money(netProfitNum),
        expenses: money(totalExpensesNum),
        paidAtSale: money(totalSalesNum * 0.85),
        creditSalesIssued: money(totalSalesNum * 0.15),
        dueCollections: money(18400),
        cashReceived: money(totalSalesNum * 0.85 + 18400),
        customerOutstanding: money(customerOutstanding),
        supplierOutstanding: '0.00',
        inventoryValue: money(1359 * 85),
        todaySales: money(sessionSalesTotal.plus(4850)),
        todayProfit: money(sessionGrossProfit.plus(873)),
        monthlyRevenue: money(totalSalesNum),
        totalProducts: allProducts.length,
        lowStockCount: lowStockList.length,
        outOfStockCount: outOfStockList.length,
      },
      dailyTrend,
      salesByCategory,
      paymentBreakdown: [
        { method: 'CASH', amount: Math.round(totalSalesNum * 0.72) },
        { method: 'BKASH', amount: Math.round(totalSalesNum * 0.18) },
        { method: 'NAGAD', amount: Math.round(totalSalesNum * 0.06) },
        { method: 'CREDIT_DUE', amount: Math.round(totalSalesNum * 0.04) },
      ],
      topSellingProducts,
      lowStockProducts: lowStockList.slice(0, 10),
      outOfStockProducts: outOfStockList.slice(0, 10),
      recentTransactions: recentTxList.slice(0, 10),
      recentPurchases: [],
      pendingCustomerDues: allCustomers.filter((c) => Number(c.currentDue) > 0).slice(0, 10),
    } as T;
  }

  // 3. GET /api/customers & POST /api/customers
  if (pathname === '/api/customers') {
    if (method === 'GET') {
      let custs = await offlineDb.customers.toArray();
      if (!custs || custs.length === 0) {
        custs = demoData.customers;
        await offlineDb.customers.bulkPut(custs);
      }
      return custs as T;
    }
    if (method === 'POST') {
      const localId = Date.now();
      const code = `CUST-${localId.toString().slice(-4)}`;
      const newCust: CachedCustomer = {
        id: localId,
        customerCode: code,
        name: body.name || 'নতুন ক্রেতা',
        phone: body.phone || '',
        customerType: body.customerType || 'REGULAR',
        creditLimit: body.creditLimit || '5000.00',
        currentDue: body.openingBalance || '0.00',
      };
      await offlineDb.customers.put(newCust);
      return newCust as T;
    }
  }

  // 4. GET /api/customers/due/dashboard
  if (pathname === '/api/customers/due/dashboard') {
    let custs = await offlineDb.customers.toArray();
    if (!custs || custs.length === 0) custs = demoData.customers;

    const withDue = custs.filter((c) => Number(c.currentDue) > 0);
    const totalOutstanding = withDue.reduce((sum, c) => sum + Number(c.currentDue), 0);

    const aging = [
      { bucket: '0_7', label: '0–7 Days', amount: (totalOutstanding * 0.35).toFixed(2) },
      { bucket: '8_15', label: '8–15 Days', amount: (totalOutstanding * 0.25).toFixed(2) },
      { bucket: '16_30', label: '16–30 Days', amount: (totalOutstanding * 0.20).toFixed(2) },
      { bucket: '31_60', label: '31–60 Days', amount: (totalOutstanding * 0.12).toFixed(2) },
      { bucket: '60_PLUS', label: '60+ Days', amount: (totalOutstanding * 0.08).toFixed(2) },
    ];

    const openInvoices = withDue.map((c, i) => ({
      id: 100 + i,
      invoiceNumber: `INV-2026-${String(1001 + i)}`,
      customerId: c.id,
      customerName: c.name,
      customerPhone: c.phone,
      totalAmount: (Number(c.currentDue) * 1.5).toFixed(2),
      paidAmount: (Number(c.currentDue) * 0.5).toFixed(2),
      dueAmount: c.currentDue,
      saleDate: today,
      expectedPaymentDate: today,
      agingBucket: '0_7',
    }));

    return {
      summary: {
        totalOutstanding: totalOutstanding.toFixed(2),
        dueToday: (totalOutstanding * 0.15).toFixed(2),
        upcomingDue: (totalOutstanding * 0.45).toFixed(2),
        overdueCustomers: Math.max(1, withDue.length),
        overdueAmount: (totalOutstanding * 0.25).toFixed(2),
        partiallyPaidInvoices: withDue.length,
        fullyPaidInvoices: 42,
      },
      aging,
      openInvoices,
      customersWithDue: withDue,
    } as T;
  }

  // 5. GET /api/customers/:id/khata
  const khataMatch = pathname.match(/^\/api\/customers\/(\d+)\/khata$/);
  if (khataMatch && method === 'GET') {
    const custId = Number(khataMatch[1]);
    const cust = (await offlineDb.customers.get(custId)) || demoData.customers.find((c) => c.id === custId) || {
      id: custId,
      customerCode: `CUST-${custId}`,
      name: 'ক্রেতা',
      phone: '01700000000',
      customerType: 'REGULAR',
      creditLimit: '5000.00',
      currentDue: '0.00',
    };

    const currentDueNum = Number(cust.currentDue || 0);
    const limitNum = Number(cust.creditLimit || 5000);
    const utilization = limitNum > 0 ? Math.min(100, Math.round((currentDueNum / limitNum) * 100)) : 0;

    return {
      customer: {
        ...cust,
        altPhone: '',
        village: 'মিরপুর',
        area: 'ঢাকা',
        road: 'রোড ২',
        house: 'বাড়ি ১২',
        totalPaid: '8500.00',
        registrationDate: '2026-05-01',
      },
      analytics: {
        lifetimePurchaseValue: (currentDueNum + 8500).toFixed(2),
        totalPaid: '8500.00',
        currentOutstanding: cust.currentDue,
        purchaseFrequency: 12,
        averagePurchaseValue: '750.00',
        lastPurchaseDate: today,
        averagePaymentDelayDays: 6,
        creditLimitUtilizationPct: utilization,
      },
      ledger: [
        {
          id: 1,
          txType: 'OPENING_BALANCE',
          txDate: '2026-05-01',
          referenceNo: 'INIT-001',
          debit: cust.currentDue,
          credit: '0.00',
          runningBalance: cust.currentDue,
          notes: 'পূর্ববর্তী বাকি (Opening Due)',
        },
      ],
      sales: [
        {
          id: 1,
          invoiceNumber: `INV-2026-1001`,
          saleDate: today,
          totalAmount: '1200.00',
          paidAmount: '800.00',
          dueAmount: '400.00',
        },
      ],
      payments: [
        {
          id: 1,
          receiptNumber: 'REC-2026-001',
          paymentDate: today,
          amount: '800.00',
          method: 'CASH',
        },
      ],
      disputes: [],
      unpaidInvoices: [],
      latestInvitation: { token: 'demo-invite-token' },
      activeOtp: null,
    } as T;
  }

  // 6. POST /api/customers/:id/payments
  const payMatch = pathname.match(/^\/api\/customers\/(\d+)\/payments$/);
  if (payMatch && method === 'POST') {
    const custId = Number(payMatch[1]);
    const paidAmt = Number(body.amount || 0);
    const cust = await offlineDb.customers.get(custId);
    if (cust) {
      const nextDue = Math.max(0, Number(cust.currentDue) - paidAmt);
      await offlineDb.customers.update(custId, { currentDue: nextDue.toFixed(2) });
    }
    return {
      success: true,
      payment: {
        id: Date.now(),
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        paymentDate: body.paymentDate || today,
        amount: String(paidAmt),
        method: body.paymentMethod || 'CASH',
        remarks: body.remarks || 'বাকি আদায়',
      },
      customer: {
        ...(cust || {}),
        currentDue: cust ? Math.max(0, Number(cust.currentDue) - paidAmt).toFixed(2) : '0.00',
      },
      allocations: [],
    } as T;
  }

  // 7. POST /api/customers/:id/adjustments
  const adjMatch = pathname.match(/^\/api\/customers\/(\d+)\/adjustments$/);
  if (adjMatch && method === 'POST') {
    const custId = Number(adjMatch[1]);
    const amt = Number(body.amount || 0);
    const dir = body.direction || 'CREDIT';
    const cust = await offlineDb.customers.get(custId);
    if (cust) {
      const nextDue = dir === 'DEBIT' ? Number(cust.currentDue) + amt : Math.max(0, Number(cust.currentDue) - amt);
      await offlineDb.customers.update(custId, { currentDue: nextDue.toFixed(2) });
    }
    return { success: true } as T;
  }

  // 8. GET & POST /api/finance/expenses
  if (pathname === '/api/finance/expenses') {
    const exps = getStoredJson<any[]>('mudidokan_expenses', [
      { id: 1, categoryId: 1, categoryName: 'Shop Rent', categoryNameBn: 'দোকান ভাড়া', amount: '8000.00', expenseDate: today, paymentMethod: 'CASH', description: 'দোকান ভাড়া' },
      { id: 2, categoryId: 2, categoryName: 'Electricity Bill', categoryNameBn: 'বিদ্যুৎ ও কারেন্ট বিল', amount: '1850.00', expenseDate: today, paymentMethod: 'BKASH', description: 'কারেন্ট বিল' },
      { id: 3, categoryId: 7, categoryName: 'Tea & Refreshments', categoryNameBn: 'চা-নাস্তা ও আপ্যায়ন', amount: '240.00', expenseDate: today, paymentMethod: 'CASH', description: 'চা ও বিস্কুট' },
    ]);

    if (method === 'GET') return exps as T;

    if (method === 'POST') {
      const cat = DEFAULT_EXPENSE_CATEGORIES.find((c) => c.id === Number(body.categoryId)) || DEFAULT_EXPENSE_CATEGORIES[0];
      const newExp = {
        id: Date.now(),
        categoryId: cat.id,
        categoryName: cat.name,
        categoryNameBn: cat.nameBn,
        amount: String(body.amount || '0'),
        expenseDate: body.expenseDate || today,
        paymentMethod: body.paymentMethod || 'CASH',
        description: body.description || '',
      };
      exps.unshift(newExp);
      setStoredJson('mudidokan_expenses', exps);
      return newExp as T;
    }
  }

  // 9. GET /api/finance/expense-categories
  if (pathname === '/api/finance/expense-categories') {
    return DEFAULT_EXPENSE_CATEGORIES as T;
  }

  // 10. GET & POST /api/finance/cash-register & /open & /close & /transaction
  if (pathname.startsWith('/api/finance/cash-register')) {
    const reg = getStoredJson<any>('mudidokan_cash_register', {
      currentDrawerBalance: '5578.00',
      totalIn: '6200.00',
      totalOut: '622.00',
      activeRegister: { id: 1, openingCash: '5000.00', openedAt: today },
      transactions: [
        { id: 1, createdAt: today, txType: 'OPENING_FLOAT', direction: 'IN', amount: '5000.00', description: 'ওপেনিং ক্যাশ' },
        { id: 2, createdAt: today, txType: 'SALE_CASH', direction: 'IN', amount: '1200.00', description: 'নগদ বিক্রয়' },
        { id: 3, createdAt: today, txType: 'EXPENSE_CASH', direction: 'OUT', amount: '622.00', description: 'দোকানের খরচ' },
      ],
    });

    if (pathname === '/api/finance/cash-register' && method === 'GET') {
      return reg as T;
    }
    if (pathname === '/api/finance/cash-register/transaction' && method === 'POST') {
      const amt = Number(body.amount || 0);
      const isOut = body.direction === 'OUT';
      const cur = Number(reg.currentDrawerBalance || 0);
      reg.currentDrawerBalance = (isOut ? cur - amt : cur + amt).toFixed(2);
      if (isOut) reg.totalOut = (Number(reg.totalOut || 0) + amt).toFixed(2);
      else reg.totalIn = (Number(reg.totalIn || 0) + amt).toFixed(2);

      reg.transactions.unshift({
        id: Date.now(),
        createdAt: today,
        txType: isOut ? 'CASH_OUT' : 'CASH_IN',
        direction: body.direction,
        amount: String(amt),
        description: body.description || '',
      });
      setStoredJson('mudidokan_cash_register', reg);
      return { success: true } as T;
    }
    if (pathname === '/api/finance/cash-register/open' && method === 'POST') {
      reg.activeRegister = { id: Date.now(), openingCash: body.openingBalance || '5000', openedAt: today };
      reg.currentDrawerBalance = body.openingBalance || '5000';
      setStoredJson('mudidokan_cash_register', reg);
      return { success: true } as T;
    }
    if (pathname === '/api/finance/cash-register/close' && method === 'POST') {
      reg.activeRegister = null;
      setStoredJson('mudidokan_cash_register', reg);
      return { success: true } as T;
    }
  }

  // 11. GET & POST /api/finance/settings
  if (pathname === '/api/finance/settings') {
    const settingsObj = getStoredJson<any>('mudidokan_settings', {
      store: {
        id: 1,
        name: 'মুদি দোকান প্রো (MudirDokan Pro)',
        nameBn: 'মুদি দোকান প্রো',
        code: 'STORE-001',
        phone: '01884700631',
        address: 'ঢাকা, বাংলাদেশ',
        logoUrl: '',
      },
      settings: {
        id: 1,
        storeId: 1,
        currency: 'BDT',
        currencySymbol: '৳',
        lowStockThreshold: '10',
        allowNegativeStock: false,
        demoModeActive: true,
        allowCashierReports: true,
        languageMode: 'BN',
        deliveryFeeInsideDhaka: 80,
        deliveryFeeOutsideDhaka: 150,
        freeDeliveryThreshold: 0,
      },
      syncLogs: [],
    });

    if (method === 'GET') return settingsObj as T;
    if (method === 'POST') {
      if (body.store) settingsObj.store = { ...settingsObj.store, ...body.store };
      if (body.settings) settingsObj.settings = { ...settingsObj.settings, ...body.settings };
      setStoredJson('mudidokan_settings', settingsObj);
      return settingsObj as T;
    }
  }

  // 12. PUT /api/finance/role
  if (pathname === '/api/finance/role') {
    const newRole = body.role || 'OWNER';
    localStorage.setItem('mudidokan_role', newRole);
    return { role: newRole } as T;
  }

  // 13. GET /api/finance/reports
  if (pathname === '/api/finance/reports') {
    const prods = await offlineDb.products.toArray();
    const demoProds = prods.length > 0 ? prods : [];

    const productProfit = demoProds.slice(0, 20).map((p, i) => {
      const sold = 45 + ((p.id * 17) % 180);
      const sellPrice = Number(p.sellingPrice) || 95;
      const costPrice = Number(p.avgCostPrice) || sellPrice * 0.82;
      const rev = sold * sellPrice;
      const cogs = sold * costPrice;
      const gp = rev - cogs;
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        nameBn: p.nameBn,
        variant: p.variant,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
        qtySold: sold,
        revenue: rev,
        cogs: cogs,
        grossProfit: gp,
      };
    }).sort((a, b) => b.grossProfit - a.grossProfit);

    const catMap = new Map<number, { categoryId: number; category: string; revenue: number; cogs: number; grossProfit: number }>();
    productProfit.forEach((p) => {
      const existing = catMap.get(p.categoryId) || { categoryId: p.categoryId, category: `Category #${p.categoryId}`, revenue: 0, cogs: 0, grossProfit: 0 };
      existing.revenue += p.revenue;
      existing.cogs += p.cogs;
      existing.grossProfit += p.grossProfit;
      catMap.set(p.categoryId, existing);
    });

    const categoryProfit = Array.from(catMap.values()).map(c => {
      const catObj = CLIENT_BD_CATEGORIES.find(dc => dc.id === c.categoryId);
      return {
        ...c,
        category: catObj ? catObj.name : c.category,
      };
    }).sort((a, b) => b.grossProfit - a.grossProfit);

    const brandSales = [
      { brand: 'ACI Pure', qtySold: 340, revenue: 48500 },
      { brand: 'Teer', qtySold: 295, revenue: 41200 },
      { brand: 'Fresh', qtySold: 280, revenue: 39800 },
      { brand: 'PRAN', qtySold: 260, revenue: 36500 },
      { brand: 'Radhuni', qtySold: 210, revenue: 29800 },
      { brand: 'Dano', qtySold: 110, revenue: 44000 },
      { brand: 'Rin', qtySold: 185, revenue: 21500 },
    ].sort((a, b) => b.revenue - a.revenue);

    const slowMovingProducts = demoProds.slice(25, 35).map((p) => ({
      sku: p.sku,
      name: p.name,
      variant: p.variant,
      currentStock: p.currentStock,
      stockValue: (Number(p.currentStock) * (Number(p.avgCostPrice) || 80)).toFixed(2),
    }));

    const profitSummary = {
      salesRevenue: '485000.00',
      salesCount: 684,
      paidAtSale: '412000.00',
      creditIssued: '73000.00',
      cogs: '397700.00',
      grossProfit: '87300.00',
      grossMarginPct: '18.0',
      operatingExpenses: '24500.00',
      netProfit: '62800.00',
      dueCollections: '46200.00',
      totalPurchases: '420000.00',
    };

    return {
      profitSummary,
      pnl: profitSummary,
      inventoryValuation: { totalCostValue: '115500.00' },
      dues: { customerDueTotal: '26800.00', supplierDueTotal: '0.00' },
      cashFlow: {
        totalIn: '458200.00',
        totalOut: '444500.00',
        netCashFlow: '13700.00',
        byType: [
          { txType: 'SALE_CASH', direction: 'IN', amount: 349200 },
          { txType: 'DUE_COLLECTION', direction: 'IN', amount: 36800 },
          { txType: 'SUPPLIER_PAYMENT', direction: 'OUT', amount: 320000 },
          { txType: 'EXPENSE_SHOP_RENT', direction: 'OUT', amount: 12000 },
          { txType: 'EXPENSE_ELECTRICITY', direction: 'OUT', amount: 6500 },
          { txType: 'EXPENSE_STAFF', direction: 'OUT', amount: 6000 },
        ],
      },
      monthlyBreakdown: [
        { ym: '2026-05', salesCount: 104, revenue: '74200.00', paidAtSale: '63000.00', creditIssued: '11200.00', cogs: '60850.00', grossProfit: '13350.00', grossMarginPct: '18.0', expenses: '3900.00', netProfit: '9450.00' },
        { ym: '2026-06', salesCount: 112, revenue: '79800.00', paidAtSale: '68000.00', creditIssued: '11800.00', cogs: '65440.00', grossProfit: '14360.00', grossMarginPct: '18.0', expenses: '4100.00', netProfit: '10260.00' },
        { ym: '2026-07', salesCount: 115, revenue: '81400.00', paidAtSale: '69000.00', creditIssued: '12400.00', cogs: '66750.00', grossProfit: '14650.00', grossMarginPct: '18.0', expenses: '4200.00', netProfit: '10450.00' },
        { ym: '2026-08', salesCount: 118, revenue: '83900.00', paidAtSale: '71000.00', creditIssued: '12900.00', cogs: '68800.00', grossProfit: '15100.00', grossMarginPct: '18.0', expenses: '4150.00', netProfit: '10950.00' },
        { ym: '2026-09', salesCount: 116, revenue: '82500.00', paidAtSale: '70000.00', creditIssued: '12500.00', cogs: '67650.00', grossProfit: '14850.00', grossMarginPct: '18.0', expenses: '4050.00', netProfit: '10800.00' },
        { ym: '2026-10', salesCount: 119, revenue: '83200.00', paidAtSale: '71000.00', creditIssued: '12200.00', cogs: '68220.00', grossProfit: '14990.00', grossMarginPct: '18.0', expenses: '4100.00', netProfit: '10890.00' },
      ],
      paymentChannels: {
        salesAtCounter: [
          { method: 'CASH', count: 492, amount: '349200.00' },
          { method: 'BKASH', count: 124, amount: '87300.00' },
          { method: 'NAGAD', count: 68, amount: '48500.00' },
        ],
        dueCollections: [
          { method: 'CASH', count: 54, amount: '36800.00' },
          { method: 'BKASH', count: 18, amount: '9400.00' },
        ],
      },
      productProfit,
      categoryProfit,
      brandSales,
      slowMovingProducts,
    } as T;
  }

  // 14. GET & POST /api/purchases & /suppliers
  if (pathname === '/api/purchases/suppliers') {
    if (method === 'GET') {
      const sups = getStoredJson<any[]>('mudidokan_suppliers', DEFAULT_SUPPLIERS);
      return sups as T;
    }
    if (method === 'POST') {
      const sups = getStoredJson<any[]>('mudidokan_suppliers', DEFAULT_SUPPLIERS);
      const newSup = { id: Date.now(), ...body, currentDue: '0.00' };
      sups.push(newSup);
      setStoredJson('mudidokan_suppliers', sups);
      return newSup as T;
    }
  }

  if (pathname.startsWith('/api/purchases/suppliers/') && pathname.endsWith('/ledger')) {
    return {
      supplier: DEFAULT_SUPPLIERS[0],
      transactions: [],
      summary: { totalPurchases: '50000.00', totalPaid: '50000.00', currentDue: '0.00' },
    } as T;
  }

  if (pathname === '/api/purchases') {
    const purs = getStoredJson<any[]>('mudidokan_purchases', []);
    if (method === 'GET') return purs as T;
    if (method === 'POST') {
      const newPur = { id: Date.now(), ...body, createdAt: today };
      purs.unshift(newPur);
      setStoredJson('mudidokan_purchases', purs);
      return newPur as T;
    }
  }

  // 15. GET & POST /api/catalog/inventory/movements & /adjust & /batch-adjust
  if (pathname === '/api/catalog/inventory/movements') {
    const prods = await offlineDb.products.toArray();
    let totalCostVal = D(0);
    let totalRetailVal = D(0);
    for (const p of prods) {
      const stock = Number(p.currentStock || 0);
      if (stock > 0) {
        totalCostVal = totalCostVal.plus(D(stock).times(D(p.avgCostPrice || 0)));
        totalRetailVal = totalRetailVal.plus(D(stock).times(D(p.sellingPrice || 0)));
      }
    }
    const movements = getStoredJson<any[]>('mudidokan_stock_movements', []);
    return {
      movements,
      valuation: {
        totalCostValue: money(totalCostVal.isZero() ? 115500 : totalCostVal),
        totalRetailValue: money(totalRetailVal.isZero() ? 138500 : totalRetailVal),
        totalSkus: prods.length || 1359,
      },
    } as T;
  }

  if (pathname === '/api/catalog/inventory/adjust' && method === 'POST') {
    const pid = Number(body.productId);
    const qty = Number(body.quantity || 0);
    const type = body.adjustmentType || 'INCREASE';
    const cost = body.costPrice ? String(body.costPrice) : undefined;
    const prod = await offlineDb.products.get(pid);
    if (prod) {
      const cur = Number(prod.currentStock || 0);
      const next = type === 'INCREASE' ? cur + qty : Math.max(0, cur - qty);
      const updates: any = { currentStock: next.toFixed(4) };
      if (cost && Number(cost) > 0) {
        updates.avgCostPrice = money(cost);
      }
      await offlineDb.products.update(pid, updates);

      const movements = getStoredJson<any[]>('mudidokan_stock_movements', []);
      movements.unshift({
        id: movements.length + 1,
        productId: pid,
        productName: prod.name,
        productNameBn: prod.nameBn,
        variant: prod.variant,
        type: type === 'INCREASE' ? 'STOCK_IN' : 'STOCK_OUT',
        quantityChange: type === 'INCREASE' ? `+${qty}` : `-${qty}`,
        balanceAfter: next.toFixed(2),
        costRate: cost || prod.avgCostPrice,
        createdAt: new Date().toISOString(),
        reason: body.reason || 'সরাসরি ইনভেন্টরি স্টক আপডেট',
      });
      setStoredJson('mudidokan_stock_movements', movements.slice(0, 100));
    }
    return { success: true } as T;
  }

  if (pathname === '/api/catalog/inventory/batch-adjust' && method === 'POST') {
    const list = body.adjustments || [];
    const movements = getStoredJson<any[]>('mudidokan_stock_movements', []);
    for (const item of list) {
      const pid = Number(item.productId);
      const qty = Number(item.quantity || 0);
      const type = item.adjustmentType || 'INCREASE';
      const cost = item.costPrice ? String(item.costPrice) : undefined;
      const prod = await offlineDb.products.get(pid);
      if (prod) {
        const cur = Number(prod.currentStock || 0);
        const next = type === 'INCREASE' ? cur + qty : Math.max(0, cur - qty);
        const updates: any = { currentStock: next.toFixed(4) };
        if (cost && Number(cost) > 0) {
          updates.avgCostPrice = money(cost);
        }
        await offlineDb.products.update(pid, updates);

        movements.unshift({
          id: movements.length + 1,
          productId: pid,
          productName: prod.name,
          productNameBn: prod.nameBn,
          variant: prod.variant,
          type: type === 'INCREASE' ? 'BULK_STOCK_IN' : 'BULK_STOCK_OUT',
          quantityChange: type === 'INCREASE' ? `+${qty}` : `-${qty}`,
          balanceAfter: next.toFixed(2),
          costRate: cost || prod.avgCostPrice,
          createdAt: new Date().toISOString(),
          reason: item.reason || 'বাল্ক স্টক সমন্বয়',
        });
      }
    }
    setStoredJson('mudidokan_stock_movements', movements.slice(0, 150));
    return { success: true, count: list.length } as T;
  }

  // 16. POST /api/sales
  if (pathname === '/api/sales' && method === 'POST') {
    let computedSubtotal = D(0);
    const enrichedItems = (body.items || []).map((i: any) => {
      const gross = D(i.enteredQty || 1).times(D(i.unitSellingPrice || 0));
      const disc = D(i.itemDiscount || 0);
      const lineTotal = money(gross.minus(disc));
      computedSubtotal = computedSubtotal.plus(D(lineTotal));
      return {
        productId: i.productId,
        productName: i.productName || 'পণ্য',
        variant: i.variant || '',
        unitName: i.unitName || 'Piece',
        conversionFactor: String(i.conversionFactor || 1),
        enteredQty: String(i.enteredQty || 1),
        unitSellingPrice: money(i.unitSellingPrice || 0),
        itemDiscount: money(i.itemDiscount || 0),
        lineTotal,
      };
    });

    const billDisc = D(body.billDiscount || 0);
    const totalAmount = money(computedSubtotal.minus(billDisc).lt(0) ? D(0) : computedSubtotal.minus(billDisc));
    const validPayments = (body.payments || []).map((p: any) => ({
      method: p.method || 'CASH',
      amount: money(p.amount || 0),
      referenceNo: p.referenceNo || '',
    }));
    const paidAmount = money(validPayments.reduce((acc: any, p: any) => acc.plus(D(p.amount)), D(0)));
    const dueAmount = money(D(totalAmount).minus(D(paidAmount)).lt(0) ? D(0) : D(totalAmount).minus(D(paidAmount)));

    const queued = await enqueueOfflineSale({
      clientTransactionUuid: body.clientTransactionUuid || crypto.randomUUID(),
      saleDate: body.saleDate || today,
      customerId: body.customerId || null,
      customerName: body.customerName || undefined,
      billDiscount: money(billDisc),
      expectedPaymentDate: body.expectedPaymentDate || null,
      items: enrichedItems,
      payments: validPayments,
      computedSubtotal: money(computedSubtotal),
      computedTotal: totalAmount,
      computedPaid: paidAmount,
      computedDue: dueAmount,
    });

    return {
      sale: {
        id: Math.abs(parseInt(queued.localInvoiceNumber.replace(/\D/g, '') || '1')),
        invoiceNumber: queued.localInvoiceNumber,
        saleDate: body.saleDate || today,
        expectedPaymentDate: body.expectedPaymentDate || null,
        subtotal: money(computedSubtotal),
        itemDiscountTotal: '0.00',
        billDiscount: money(billDisc),
        totalAmount,
        paidAmount,
        dueAmount,
      },
      items: enrichedItems,
      payments: validPayments,
    } as T;
  }

  // 17. POST /api/sales/batch-offline
  if (pathname === '/api/sales/batch-offline' && method === 'POST') {
    const salesList = body.sales || [];
    return {
      results: salesList.map((s: any) => ({
        clientTransactionUuid: s.clientTransactionUuid,
        status: 'SYNCED',
        message: 'Synchronized locally',
      })),
    } as T;
  }

  // 18. POST /api/finance/demo/load & /reset
  if (pathname === '/api/finance/demo/load') {
    return {
      success: true,
      periodStart: '2026-05-01',
      periodEnd: '2026-10-31',
      salesCount: 684,
      totalSales: '485000.00',
      reconciliation: { balanced: true },
    } as T;
  }

  if (pathname === '/api/finance/demo/reset') {
    return { success: true } as T;
  }

  // Fallback for any other endpoint
  return {} as T;
}
