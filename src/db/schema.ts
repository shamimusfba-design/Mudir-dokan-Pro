import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  numeric,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// 1. Stores
export const stores = pgTable('stores', {
  id: serial('id').primaryKey(),
  ownerUid: text('owner_uid').notNull(),
  name: text('name').notNull(),
  nameBn: text('name_bn').notNull().default('মুদি দোকান প্রো'),
  phone: text('phone').notNull().default(''),
  address: text('address').notNull().default('Dhaka, Bangladesh'),
  addressBn: text('address_bn').notNull().default('ঢাকা, বাংলাদেশ'),
  binNumber: text('bin_number').default(''),
  currency: text('currency').notNull().default('BDT'),
  currencySymbol: text('currency_symbol').notNull().default('৳'),
  timezone: text('timezone').notNull().default('Asia/Dhaka'),
  dateFormat: text('date_format').notNull().default('DD/MM/YYYY'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Users (linked to Firebase Auth UID + Store RBAC)
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(),
    email: text('email').notNull(),
    name: text('name').notNull().default('Shop Owner'),
    role: text('role').notNull().default('OWNER'), // OWNER | MANAGER | CASHIER
    storeId: integer('store_id').references(() => stores.id),
    pinCode: text('pin_code').default('1234'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('users_store_idx').on(t.storeId)]
);

// 3. Store Settings
export const storeSettings = pgTable('store_settings', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id')
    .references(() => stores.id)
    .notNull()
    .unique(),
  languageMode: text('language_mode').notNull().default('BOTH'), // EN | BN | BOTH
  receiptFormat: text('receipt_format').notNull().default('80MM'), // 58MM | 80MM | A4
  receiptHeader: text('receipt_header').default('ধন্যবাদ, আবার আসবেন / Thank you for shopping with us'),
  receiptFooter: text('receipt_footer').default('বিক্রিত পণ্য ৩ দিনের মধ্যে রসিদসহ পরিবর্তনযোগ্য'),
  allowNegativeStock: boolean('allow_negative_stock').notNull().default(false),
  allowCashierPriceEdit: boolean('allow_cashier_price_edit').notNull().default(false),
  allowCashierDiscount: boolean('allow_cashier_discount').notNull().default(true),
  allowCashierReports: boolean('allow_cashier_reports').notNull().default(false),
  invoicePrefix: text('invoice_prefix').notNull().default('INV'),
  purchasePrefix: text('purchase_prefix').notNull().default('PUR'),
  customerPrefix: text('customer_prefix').notNull().default('CUST'),
  smsProvider: text('sms_provider').notNull().default('WHATSAPP_LINK'), // NONE | WEBHOOK | WHATSAPP_LINK
  smsWebhookUrl: text('sms_webhook_url').default(''),
  smsSenderId: text('sms_sender_id').default('MudirDokan'),
  demoModeActive: boolean('demo_mode_active').notNull().default(false),
  demoPeriodStart: text('demo_period_start'),
  demoPeriodEnd: text('demo_period_end'),
  demoLoadedAt: timestamp('demo_loaded_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Categories
export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    name: text('name').notNull(),
    nameBn: text('name_bn').notNull().default(''),
    parentId: integer('parent_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    iconName: text('icon_name').default(''),
    accentColor: text('accent_color').default('indigo'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('categories_store_idx').on(t.storeId)]
);

// 5. Brands
export const brands = pgTable(
  'brands',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    name: text('name').notNull(),
    nameBn: text('name_bn').notNull().default(''),
    company: text('company').default(''),
    logoUrl: text('logo_url'),
    logoSource: text('logo_source').default(''),
    logoStatus: text('logo_status').notNull().default('UNAVAILABLE'), // VERIFIED | PENDING | UNAVAILABLE
    brandColor: text('brand_color').default('#4f46e5'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('brands_store_idx').on(t.storeId)]
);

// 6. Products (Each variant/size is a separate sellable SKU)
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    categoryId: integer('category_id')
      .references(() => categories.id)
      .notNull(),
    brandId: integer('brand_id').references(() => brands.id),
    sku: text('sku').notNull(),
    barcode: text('barcode').default(''),
    name: text('name').notNull(),
    nameBn: text('name_bn').notNull().default(''),
    variant: text('variant').notNull().default('Standard'),
    baseUnit: text('base_unit').notNull().default('Piece'), // Piece, Kg, Gram, Liter, ml, Packet, Box, Carton, Dozen, Bottle, Bundle, Sack
    allowDecimalQty: boolean('allow_decimal_qty').notNull().default(false),
    avgCostPrice: numeric('avg_cost_price', { precision: 14, scale: 4 }).notNull().default('0'),
    lastPurchasePrice: numeric('last_purchase_price', { precision: 14, scale: 4 }).notNull().default('0'),
    sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull().default('0'),
    currentStock: numeric('current_stock', { precision: 14, scale: 4 }).notNull().default('0'),
    minStock: numeric('min_stock', { precision: 14, scale: 4 }).notNull().default('5'),
    expiryDate: text('expiry_date'),
    imageUrl: text('image_url'),
    galleryUrls: text('gallery_urls').default('[]'),
    imageSource: text('image_source').default(''),
    imageStatus: text('image_status').notNull().default('UNAVAILABLE'), // VERIFIED | PENDING | UNAVAILABLE
    imageUpdatedAt: timestamp('image_updated_at'),
    isFrequent: boolean('is_frequent').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('products_store_idx').on(t.storeId),
    index('products_barcode_idx').on(t.storeId, t.barcode),
    uniqueIndex('products_store_sku_uniq').on(t.storeId, t.sku),
  ]
);

// 7. Product Units (Unit Conversions, e.g., 1 Carton = 24 Pieces)
export const productUnits = pgTable(
  'product_units',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    productId: integer('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    unitName: text('unit_name').notNull(),
    unitNameBn: text('unit_name_bn').default(''),
    conversionFactor: numeric('conversion_factor', { precision: 14, scale: 4 }).notNull().default('1'),
    barcode: text('barcode'),
    sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }),
    isPurchaseDefault: boolean('is_purchase_default').notNull().default(false),
  },
  (t) => [index('product_units_product_idx').on(t.productId)]
);

// 8. Stock Movements (Immutable audit trail for every stock change)
export const stockMovements = pgTable(
  'stock_movements',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    productId: integer('product_id')
      .references(() => products.id)
      .notNull(),
    movementType: text('movement_type').notNull(), // OPENING | PURCHASE_IN | SALE_OUT | SALE_RETURN | PURCHASE_RETURN | ADJUSTMENT_IN | ADJUSTMENT_OUT | DAMAGE | EXPIRED | TRANSFER
    quantityDelta: numeric('quantity_delta', { precision: 14, scale: 4 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 14, scale: 4 }).notNull().default('0'),
    balanceAfter: numeric('balance_after', { precision: 14, scale: 4 }).notNull(),
    referenceType: text('reference_type').notNull(), // SEED | PURCHASE | SALE | ADJUSTMENT | RETURN
    referenceId: integer('reference_id'),
    notes: text('notes').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('stock_movements_store_idx').on(t.storeId),
    index('stock_movements_product_idx').on(t.productId),
  ]
);

// 9. Stock Adjustments
export const stockAdjustments = pgTable(
  'stock_adjustments',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    productId: integer('product_id')
      .references(() => products.id)
      .notNull(),
    adjustmentType: text('adjustment_type').notNull(), // INCREASE | DECREASE | DAMAGE | EXPIRED
    quantity: numeric('quantity', { precision: 14, scale: 4 }).notNull(),
    unitCost: numeric('unit_cost', { precision: 14, scale: 4 }).notNull().default('0'),
    reason: text('reason').notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('stock_adj_store_idx').on(t.storeId)]
);

// 10. Suppliers
export const suppliers = pgTable(
  'suppliers',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    supplierCode: text('supplier_code').notNull(),
    name: text('name').notNull(),
    company: text('company').default(''),
    phone: text('phone').notNull(),
    address: text('address').default(''),
    openingBalance: numeric('opening_balance', { precision: 14, scale: 2 }).notNull().default('0'),
    totalPurchases: numeric('total_purchases', { precision: 14, scale: 2 }).notNull().default('0'),
    totalPaid: numeric('total_paid', { precision: 14, scale: 2 }).notNull().default('0'),
    currentDue: numeric('current_due', { precision: 14, scale: 2 }).notNull().default('0'),
    notes: text('notes').default(''),
    isActive: boolean('is_active').notNull().default(true),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('suppliers_store_idx').on(t.storeId)]
);

// 11. Purchases
export const purchases = pgTable(
  'purchases',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    supplierId: integer('supplier_id')
      .references(() => suppliers.id)
      .notNull(),
    invoiceNumber: text('invoice_number').notNull(),
    supplierInvoiceNo: text('supplier_invoice_no').default(''),
    purchaseDate: text('purchase_date').notNull(), // YYYY-MM-DD
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0'),
    transportCost: numeric('transport_cost', { precision: 14, scale: 2 }).notNull().default('0'),
    otherCost: numeric('other_cost', { precision: 14, scale: 2 }).notNull().default('0'),
    discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0'),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    dueAmount: numeric('due_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    paymentMethod: text('payment_method').notNull().default('CASH'),
    status: text('status').notNull().default('COMPLETED'), // COMPLETED | RETURNED | PARTIAL_RETURN
    notes: text('notes').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('purchases_store_idx').on(t.storeId),
    index('purchases_supplier_idx').on(t.supplierId),
  ]
);

// 12. Purchase Items
export const purchaseItems = pgTable(
  'purchase_items',
  {
    id: serial('id').primaryKey(),
    purchaseId: integer('purchase_id')
      .references(() => purchases.id, { onDelete: 'cascade' })
      .notNull(),
    productId: integer('product_id')
      .references(() => products.id)
      .notNull(),
    productName: text('product_name').notNull(),
    purchaseUnit: text('purchase_unit').notNull().default('Piece'),
    conversionFactor: numeric('conversion_factor', { precision: 14, scale: 4 }).notNull().default('1'),
    enteredQty: numeric('entered_qty', { precision: 14, scale: 4 }).notNull(),
    baseQty: numeric('base_qty', { precision: 14, scale: 4 }).notNull(),
    unitCostEntered: numeric('unit_cost_entered', { precision: 14, scale: 4 }).notNull(),
    landedUnitCostBase: numeric('landed_unit_cost_base', { precision: 14, scale: 4 }).notNull(),
    lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull(),
    expiryDate: text('expiry_date'),
  },
  (t) => [index('purchase_items_purchase_idx').on(t.purchaseId)]
);

// 13. Purchase Returns
export const purchaseReturns = pgTable('purchase_returns', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id')
    .references(() => stores.id)
    .notNull(),
  purchaseId: integer('purchase_id')
    .references(() => purchases.id)
    .notNull(),
  supplierId: integer('supplier_id')
    .references(() => suppliers.id)
    .notNull(),
  returnNumber: text('return_number').notNull(),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  reason: text('reason').default(''),
  isDemo: boolean('is_demo').notNull().default(false),
  createdByUid: text('created_by_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Purchase Return Items
export const purchaseReturnItems = pgTable('purchase_return_items', {
  id: serial('id').primaryKey(),
  purchaseReturnId: integer('purchase_return_id')
    .references(() => purchaseReturns.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  baseQty: numeric('base_qty', { precision: 14, scale: 4 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 14, scale: 4 }).notNull(),
  lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull(),
});

// 15. Supplier Payments
export const supplierPayments = pgTable(
  'supplier_payments',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    supplierId: integer('supplier_id')
      .references(() => suppliers.id)
      .notNull(),
    receiptNumber: text('receipt_number').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    paymentMethod: text('payment_method').notNull().default('CASH'),
    paymentDate: text('payment_date').notNull(),
    remarks: text('remarks').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('supplier_payments_store_idx').on(t.storeId)]
);

// 16. Supplier Ledger
export const supplierLedger = pgTable(
  'supplier_ledger',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    supplierId: integer('supplier_id')
      .references(() => suppliers.id)
      .notNull(),
    entryDate: text('entry_date').notNull(),
    transactionType: text('transaction_type').notNull(), // OPENING_BALANCE | PURCHASE | PAYMENT | PURCHASE_RETURN | ADJUSTMENT
    referenceId: integer('reference_id'),
    invoiceNumber: text('invoice_number').default(''),
    debitAmount: numeric('debit_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    creditAmount: numeric('credit_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    runningBalance: numeric('running_balance', { precision: 14, scale: 2 }).notNull().default('0'),
    paymentMethod: text('payment_method').default(''),
    description: text('description').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('supplier_ledger_supplier_idx').on(t.supplierId)]
);

// 17. Customers (Extended for Digital Khata & Self-Service Portal)
export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerCode: text('customer_code').notNull(), // Auto-generated CUST-0001
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    altPhone: text('alt_phone').default(''),
    village: text('village').default(''),
    area: text('area').default(''),
    road: text('road').default(''),
    house: text('house').default(''),
    customerType: text('customer_type').notNull().default('REGULAR'), // REGULAR | VIP | WHOLESALE
    creditLimit: numeric('credit_limit', { precision: 14, scale: 2 }).notNull().default('5000'),
    openingBalance: numeric('opening_balance', { precision: 14, scale: 2 }).notNull().default('0'),
    totalPurchases: numeric('total_purchases', { precision: 14, scale: 2 }).notNull().default('0'),
    totalPaid: numeric('total_paid', { precision: 14, scale: 2 }).notNull().default('0'),
    currentDue: numeric('current_due', { precision: 14, scale: 2 }).notNull().default('0'),
    registrationDate: text('registration_date').notNull(), // YYYY-MM-DD
    notes: text('notes').default(''),
    isActive: boolean('is_active').notNull().default(true),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('customers_store_idx').on(t.storeId),
    index('customers_phone_idx').on(t.storeId, t.phone),
    uniqueIndex('customers_store_code_uniq').on(t.storeId, t.customerCode),
  ]
);

// 18. Sales (Idempotent offline UUID + Credit Expected Payment Date)
export const sales = pgTable(
  'sales',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id').references(() => customers.id),
    invoiceNumber: text('invoice_number').notNull(),
    clientTransactionUuid: text('client_transaction_uuid').notNull(),
    saleDate: text('sale_date').notNull(), // YYYY-MM-DD
    subtotal: numeric('subtotal', { precision: 14, scale: 2 }).notNull().default('0'),
    itemDiscountTotal: numeric('item_discount_total', { precision: 14, scale: 2 }).notNull().default('0'),
    billDiscount: numeric('bill_discount', { precision: 14, scale: 2 }).notNull().default('0'),
    totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    dueAmount: numeric('due_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    totalCogs: numeric('total_cogs', { precision: 14, scale: 4 }).notNull().default('0'),
    grossProfit: numeric('gross_profit', { precision: 14, scale: 2 }).notNull().default('0'),
    paymentStatus: text('payment_status').notNull().default('PAID'), // PAID | PARTIAL | UNPAID
    status: text('status').notNull().default('COMPLETED'), // COMPLETED | CANCELLED | RETURNED | PARTIAL_RETURN
    expectedPaymentDate: text('expected_payment_date'), // YYYY-MM-DD
    isOfflineOrigin: boolean('is_offline_origin').notNull().default(false),
    notes: text('notes').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    cashierUid: text('cashier_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('sales_store_date_idx').on(t.storeId, t.saleDate),
    index('sales_customer_idx').on(t.customerId),
    uniqueIndex('sales_store_uuid_uniq').on(t.storeId, t.clientTransactionUuid),
  ]
);

// 19. Sale Items
export const saleItems = pgTable(
  'sale_items',
  {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id')
      .references(() => sales.id, { onDelete: 'cascade' })
      .notNull(),
    productId: integer('product_id')
      .references(() => products.id)
      .notNull(),
    productName: text('product_name').notNull(),
    variant: text('variant').default(''),
    unitName: text('unit_name').notNull().default('Piece'),
    conversionFactor: numeric('conversion_factor', { precision: 14, scale: 4 }).notNull().default('1'),
    enteredQty: numeric('entered_qty', { precision: 14, scale: 4 }).notNull(),
    baseQty: numeric('base_qty', { precision: 14, scale: 4 }).notNull(),
    unitSellingPrice: numeric('unit_selling_price', { precision: 14, scale: 2 }).notNull(),
    unitCostSnapshot: numeric('unit_cost_snapshot', { precision: 14, scale: 4 }).notNull().default('0'),
    itemDiscount: numeric('item_discount', { precision: 14, scale: 2 }).notNull().default('0'),
    lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull(),
    lineCogs: numeric('line_cogs', { precision: 14, scale: 4 }).notNull().default('0'),
    lineProfit: numeric('line_profit', { precision: 14, scale: 2 }).notNull().default('0'),
  },
  (t) => [index('sale_items_sale_idx').on(t.saleId)]
);

// 20. Payments (Split payments at POS checkout)
export const payments = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    saleId: integer('sale_id')
      .references(() => sales.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: integer('customer_id').references(() => customers.id),
    method: text('method').notNull(), // CASH | BKASH | NAGAD | ROCKET | CARD | BANK
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    referenceNo: text('reference_no').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    paidAt: timestamp('paid_at').defaultNow().notNull(),
  },
  (t) => [index('payments_sale_idx').on(t.saleId)]
);

// 21. Sales Returns
export const salesReturns = pgTable('sales_returns', {
  id: serial('id').primaryKey(),
  storeId: integer('store_id')
    .references(() => stores.id)
    .notNull(),
  saleId: integer('sale_id')
    .references(() => sales.id)
    .notNull(),
  customerId: integer('customer_id').references(() => customers.id),
  returnNumber: text('return_number').notNull(),
  totalRefund: numeric('total_refund', { precision: 14, scale: 2 }).notNull(),
  totalCogsReversed: numeric('total_cogs_reversed', { precision: 14, scale: 4 }).notNull().default('0'),
  refundMethod: text('refund_method').notNull().default('CASH'), // CASH | CREDIT_ADJUSTMENT
  reason: text('reason').default(''),
  isDemo: boolean('is_demo').notNull().default(false),
  createdByUid: text('created_by_uid').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 22. Sales Return Items
export const salesReturnItems = pgTable('sales_return_items', {
  id: serial('id').primaryKey(),
  salesReturnId: integer('sales_return_id')
    .references(() => salesReturns.id, { onDelete: 'cascade' })
    .notNull(),
  saleItemId: integer('sale_item_id').references(() => saleItems.id),
  productId: integer('product_id')
    .references(() => products.id)
    .notNull(),
  baseQty: numeric('base_qty', { precision: 14, scale: 4 }).notNull(),
  unitSellingPrice: numeric('unit_selling_price', { precision: 14, scale: 2 }).notNull(),
  unitCostSnapshot: numeric('unit_cost_snapshot', { precision: 14, scale: 4 }).notNull().default('0'),
  lineTotal: numeric('line_total', { precision: 14, scale: 2 }).notNull(),
});

// 23. Customer Payments (Due Collection)
export const customerPayments = pgTable(
  'customer_payments',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    receiptNumber: text('receipt_number').notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    paymentMethod: text('payment_method').notNull().default('CASH'), // CASH | BKASH | NAGAD | ROCKET | BANK
    paymentDate: text('payment_date').notNull(), // YYYY-MM-DD
    referenceNo: text('reference_no').default(''),
    remarks: text('remarks').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('customer_payments_store_idx').on(t.storeId),
    index('customer_payments_customer_idx').on(t.customerId),
  ]
);

// 24. Payment Allocations (Maps one due payment across multiple invoices)
export const paymentAllocations = pgTable(
  'payment_allocations',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerPaymentId: integer('customer_payment_id')
      .references(() => customerPayments.id, { onDelete: 'cascade' })
      .notNull(),
    saleId: integer('sale_id')
      .references(() => sales.id)
      .notNull(),
    allocatedAmount: numeric('allocated_amount', { precision: 14, scale: 2 }).notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('payment_alloc_payment_idx').on(t.customerPaymentId),
    index('payment_alloc_sale_idx').on(t.saleId),
  ]
);

// 25. Ledger Adjustments (Audited corrections without deleting history)
export const ledgerAdjustments = pgTable(
  'ledger_adjustments',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    direction: text('direction').notNull(), // DEBIT | CREDIT
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    reason: text('reason').notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('ledger_adj_customer_idx').on(t.customerId)]
);

// 26. Customer Ledger (Digital Customer Khata - Immutable chronological log)
export const customerLedger = pgTable(
  'customer_ledger',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    entryDate: text('entry_date').notNull(), // YYYY-MM-DD
    saleId: integer('sale_id').references(() => sales.id),
    customerPaymentId: integer('customer_payment_id').references(() => customerPayments.id),
    salesReturnId: integer('sales_return_id').references(() => salesReturns.id),
    adjustmentId: integer('adjustment_id').references(() => ledgerAdjustments.id),
    invoiceNumber: text('invoice_number').default(''),
    transactionType: text('transaction_type').notNull(), // OPENING_BALANCE | CREDIT_SALE | PARTIAL_PAYMENT | FULL_PAYMENT | SALES_RETURN | BALANCE_ADJUSTMENT
    productSummary: text('product_summary').default(''),
    debitAmount: numeric('debit_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    creditAmount: numeric('credit_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    runningBalance: numeric('running_balance', { precision: 14, scale: 2 }).notNull().default('0'),
    paymentMethod: text('payment_method').default(''),
    expectedPaymentDate: text('expected_payment_date'),
    description: text('description').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('customer_ledger_customer_idx').on(t.customerId),
    index('customer_ledger_store_idx').on(t.storeId),
  ]
);

// 27. Customer Portal Users
export const customerPortalUsers = pgTable(
  'customer_portal_users',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull()
      .unique(),
    phone: text('phone').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('portal_users_phone_idx').on(t.phone)]
);

// 28. Portal OTP Codes
export const portalOtpCodes = pgTable(
  'portal_otp_codes',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    shopkeeperDisplayCode: text('shopkeeper_display_code').notNull(), // Visible only to authenticated shopkeeper when no external SMS gateway is configured
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('portal_otp_phone_idx').on(t.phone)]
);

// 29. Customer Invitations (Secure QR & Link invitations)
export const customerInvitations = pgTable(
  'customer_invitations',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('customer_invites_customer_idx').on(t.customerId)]
);

// 30. Due Reminders & Notifications
export const dueReminders = pgTable(
  'due_reminders',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    saleId: integer('sale_id').references(() => sales.id),
    reminderType: text('reminder_type').notNull(), // PURCHASE_CONFIRMATION | PAYMENT_CONFIRMATION | DUE_REMINDER | OVERDUE_REMINDER | MONTHLY_STATEMENT
    channel: text('channel').notNull().default('WHATSAPP'), // SMS | WHATSAPP
    message: text('message').notNull(),
    status: text('status').notNull().default('SENT'), // QUEUED | SENT | FAILED
    scheduledFor: text('scheduled_for'),
    isDemo: boolean('is_demo').notNull().default(false),
    sentAt: timestamp('sent_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('due_reminders_customer_idx').on(t.customerId)]
);

// 31. Customer Disputes
export const customerDisputes = pgTable(
  'customer_disputes',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    saleId: integer('sale_id').references(() => sales.id),
    ledgerId: integer('ledger_id').references(() => customerLedger.id),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('OPEN'), // OPEN | RESOLVED | REJECTED
    resolutionNote: text('resolution_note').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  (t) => [index('customer_disputes_customer_idx').on(t.customerId)]
);

// 32. Expense Categories
export const expenseCategories = pgTable(
  'expense_categories',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    name: text('name').notNull(),
    nameBn: text('name_bn').notNull().default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('expense_categories_store_idx').on(t.storeId)]
);

// 33. Expenses
export const expenses = pgTable(
  'expenses',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    categoryId: integer('category_id')
      .references(() => expenseCategories.id)
      .notNull(),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    expenseDate: text('expense_date').notNull(), // YYYY-MM-DD
    paymentMethod: text('payment_method').notNull().default('CASH'),
    description: text('description').default(''),
    attachmentRef: text('attachment_ref').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('expenses_store_date_idx').on(t.storeId, t.expenseDate)]
);

// 34. Cash Registers
export const cashRegisters = pgTable(
  'cash_registers',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    openedByUid: text('opened_by_uid').notNull(),
    closedByUid: text('closed_by_uid'),
    openedAt: timestamp('opened_at').defaultNow().notNull(),
    closedAt: timestamp('closed_at'),
    openingBalance: numeric('opening_balance', { precision: 14, scale: 2 }).notNull().default('0'),
    expectedClosing: numeric('expected_closing', { precision: 14, scale: 2 }),
    actualClosing: numeric('actual_closing', { precision: 14, scale: 2 }),
    status: text('status').notNull().default('OPEN'), // OPEN | CLOSED
    notes: text('notes').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
  },
  (t) => [index('cash_registers_store_idx').on(t.storeId)]
);

// 35. Cash Transactions
export const cashTransactions = pgTable(
  'cash_transactions',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    registerId: integer('register_id').references(() => cashRegisters.id),
    txType: text('tx_type').notNull(), // OPENING | SALE_CASH | CUSTOMER_DUE_COLLECTION | PURCHASE_CASH | SUPPLIER_PAYMENT | EXPENSE_CASH | SALES_RETURN_CASH | CASH_IN | CASH_OUT
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    direction: text('direction').notNull(), // IN | OUT
    referenceType: text('reference_type').default(''),
    referenceId: integer('reference_id'),
    description: text('description').default(''),
    isDemo: boolean('is_demo').notNull().default(false),
    createdByUid: text('created_by_uid').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('cash_tx_store_idx').on(t.storeId)]
);

// 36. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    actorUid: text('actor_uid').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id'),
    details: text('details').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('audit_logs_store_idx').on(t.storeId)]
);

// 37. Sync Logs (Offline-first idempotent synchronization records)
export const syncLogs = pgTable(
  'sync_logs',
  {
    id: serial('id').primaryKey(),
    storeId: integer('store_id')
      .references(() => stores.id)
      .notNull(),
    clientTransactionUuid: text('client_transaction_uuid').notNull(),
    entityType: text('entity_type').notNull().default('SALE'),
    status: text('status').notNull(), // SYNCED | DUPLICATE_SKIPPED | CONFLICT | ERROR
    message: text('message').default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('sync_logs_store_idx').on(t.storeId)]
);
