import Dexie, { type Table } from 'dexie';

export interface CachedProductUnit {
  id: number;
  productId: number;
  unitName: string;
  unitNameBn?: string | null;
  conversionFactor: string;
  sellingPrice?: string | null;
  isPurchaseDefault?: boolean;
}

export interface CachedProduct {
  id: number;
  categoryId: number;
  brandId: number | null;
  sku: string;
  barcode: string;
  name: string;
  nameBn: string;
  variant: string;
  baseUnit: string;
  allowDecimalQty: boolean;
  avgCostPrice: string;
  sellingPrice: string;
  currentStock: string;
  minStock: string;
  expiryDate?: string | null;
  isFrequent: boolean;
  units?: CachedProductUnit[];
}

export interface CachedCategory {
  id: number;
  name: string;
  nameBn: string;
}

export interface CachedBrand {
  id: number;
  name: string;
  nameBn: string;
  company?: string | null;
}

export interface CachedCustomer {
  id: number;
  customerCode: string;
  name: string;
  phone: string;
  customerType: string;
  creditLimit: string;
  currentDue: string;
}

export interface OfflineSalePayload {
  clientTransactionUuid: string;
  saleDate: string;
  customerId: number | null;
  customerName?: string;
  billDiscount: string;
  expectedPaymentDate?: string | null;
  notes?: string;
  items: Array<{
    productId: number;
    productName: string;
    variant: string;
    unitName: string;
    conversionFactor: string;
    enteredQty: string;
    unitSellingPrice: string;
    itemDiscount: string;
  }>;
  payments: Array<{
    method: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD' | 'BANK';
    amount: string;
    referenceNo?: string;
  }>;
  computedSubtotal: string;
  computedTotal: string;
  computedPaid: string;
  computedDue: string;
}

export interface QueuedOfflineSale {
  clientTransactionUuid: string;
  localInvoiceNumber: string;
  payload: OfflineSalePayload;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'ERROR';
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  syncedAt?: string;
}

class MudirDokanOfflineDB extends Dexie {
  products!: Table<CachedProduct, number>;
  categories!: Table<CachedCategory, number>;
  brands!: Table<CachedBrand, number>;
  customers!: Table<CachedCustomer, number>;
  offlineSalesQueue!: Table<QueuedOfflineSale, string>;

  constructor() {
    super('MudirDokanProOfflineDB');
    this.version(1).stores({
      products: 'id, sku, barcode, categoryId, brandId, name',
      categories: 'id, name',
      brands: 'id, name',
      customers: 'id, customerCode, phone, name',
      offlineSalesQueue: 'clientTransactionUuid, status, createdAt',
    });
  }
}

export const offlineDb = new MudirDokanOfflineDB();

export async function cacheStoreCatalog(data: {
  products?: CachedProduct[];
  categories?: CachedCategory[];
  brands?: CachedBrand[];
  customers?: CachedCustomer[];
}) {
  try {
    await offlineDb.transaction(
      'rw',
      offlineDb.products,
      offlineDb.categories,
      offlineDb.brands,
      offlineDb.customers,
      async () => {
        if (data.products) {
          await offlineDb.products.clear();
          await offlineDb.products.bulkPut(data.products);
        }
        if (data.categories) {
          await offlineDb.categories.clear();
          await offlineDb.categories.bulkPut(data.categories);
        }
        if (data.brands) {
          await offlineDb.brands.clear();
          await offlineDb.brands.bulkPut(data.brands);
        }
        if (data.customers) {
          await offlineDb.customers.clear();
          await offlineDb.customers.bulkPut(data.customers);
        }
      }
    );
  } catch (err) {
    console.error('Failed to update IndexedDB offline cache:', err);
  }
}

export async function enqueueOfflineSale(payload: OfflineSalePayload): Promise<QueuedOfflineSale> {
  const localInvoiceNumber = `OFF-${Date.now().toString().slice(-6)}`;
  const record: QueuedOfflineSale = {
    clientTransactionUuid: payload.clientTransactionUuid,
    localInvoiceNumber,
    payload,
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };
  await offlineDb.offlineSalesQueue.put(record);

  // Optimistically adjust cached local stock so offline UI reflects deductions
  for (const item of payload.items) {
    const prod = await offlineDb.products.get(item.productId);
    if (prod) {
      const deducted = Number(item.enteredQty) * Number(item.conversionFactor);
      const nextStock = Math.max(0, Number(prod.currentStock) - deducted);
      await offlineDb.products.update(item.productId, { currentStock: nextStock.toFixed(4) });
    }
  }
  if (payload.customerId && Number(payload.computedDue) > 0) {
    const cust = await offlineDb.customers.get(payload.customerId);
    if (cust) {
      const nextDue = Number(cust.currentDue) + Number(payload.computedDue);
      await offlineDb.customers.update(payload.customerId, { currentDue: nextDue.toFixed(2) });
    }
  }

  return record;
}
