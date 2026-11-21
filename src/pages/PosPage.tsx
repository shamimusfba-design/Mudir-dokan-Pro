import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Barcode, Plus, Minus, Trash2, UserPlus, CheckCircle2, WifiOff, Split, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { D, money, formatBDT, formatQty, dhakaTodayISO, PAYMENT_METHODS } from '../lib/decimal';
import { tr, trCompact, tx, formatStatusLabel, formatUnitLabel } from '../lib/i18n';
import { enqueueOfflineSale, type CachedProduct } from '../lib/offline-db';
import { ReceiptModal, type PrintableReceipt } from '../components/ReceiptModal';

interface CartItem {
  product: CachedProduct;
  unitName: string;
  conversionFactor: number;
  enteredQty: string;
  unitSellingPrice: string;
  itemDiscount: string;
}

interface PaymentRow {
  method: 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD' | 'BANK';
  amount: string;
  referenceNo: string;
}

export const PosPage: React.FC = () => {
  const { products, categories, brands, customers, store, settings, staff, isOnline, lang, refreshCatalog } = useApp();

  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | 'ALL' | 'FREQUENT'>('FREQUENT');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscount, setBillDiscount] = useState('0');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([{ method: 'CASH', amount: '', referenceNo: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<PrintableReceipt | null>(null);
  const [allowLimitOverride, setAllowLimitOverride] = useState(false);

  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    area: '',
    customerType: 'REGULAR' as 'REGULAR' | 'VIP' | 'WHOLESALE',
    creditLimit: '5000',
  });

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !submitting) {
          handleCheckout();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const b = p.brandId ? brandMap.get(p.brandId) : null;
        const bName = (b?.name || '').toLowerCase();
        const bNameBn = (b?.nameBn || '').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.nameBn.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode || '').toLowerCase().includes(q) ||
          bName.includes(q) ||
          bNameBn.includes(q)
        );
      }
      if (selectedCatId === 'FREQUENT') return p.isFrequent;
      if (selectedCatId === 'ALL') return true;
      return p.categoryId === selectedCatId;
    });
  }, [products, query, selectedCatId, brandMap]);

  const addToCart = (prod: CachedProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === prod.id && i.unitName === prod.baseUnit);
      if (idx >= 0) {
        const copy = [...prev];
        const nextQty = D(copy[idx].enteredQty).plus(1);
        copy[idx] = { ...copy[idx], enteredQty: formatQty(nextQty) };
        return copy;
      }
      return [
        ...prev,
        {
          product: prod,
          unitName: prod.baseUnit,
          conversionFactor: 1,
          enteredQty: '1',
          unitSellingPrice: money(prod.sellingPrice),
          itemDiscount: '0',
        },
      ];
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      const q = query.trim().toLowerCase();
      const exact = products.find(
        (p) => (p.barcode || '').toLowerCase() === q || p.sku.toLowerCase() === q
      );
      if (exact) {
        addToCart(exact);
        setQuery('');
        toast.success(
          tx(
            lang,
            `Added ${exact.name} (${exact.variant})`,
            `${trCompact(exact.name, exact.nameBn, lang)} (${exact.variant}) যোগ হয়েছে`
          )
        );
      } else if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setQuery('');
      }
    }
  };

  const updateCartItem = (index: number, patch: Partial<CartItem>) => {
    setCart((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const switchItemUnit = (index: number, unitName: string) => {
    setCart((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (unitName === item.product.baseUnit) {
          return {
            ...item,
            unitName: item.product.baseUnit,
            conversionFactor: 1,
            unitSellingPrice: money(item.product.sellingPrice),
          };
        }
        const matched = (item.product.units || []).find((u) => u.unitName === unitName);
        if (!matched) return item;
        const factor = Number(matched.conversionFactor) || 1;
        const price = matched.sellingPrice
          ? money(matched.sellingPrice)
          : money(D(item.product.sellingPrice).times(factor));
        return {
          ...item,
          unitName: matched.unitName,
          conversionFactor: factor,
          unitSellingPrice: price,
        };
      })
    );
  };

  const totals = useMemo(() => {
    let subtotal = D(0);
    let itemDiscounts = D(0);
    for (const item of cart) {
      const gross = D(item.enteredQty).times(D(item.unitSellingPrice));
      subtotal = subtotal.plus(gross);
      itemDiscounts = itemDiscounts.plus(D(item.itemDiscount));
    }
    const bDisc = D(billDiscount);
    const totalDiscount = itemDiscounts.plus(bDisc);
    const grandTotal = DecimalMaxZero(subtotal.minus(totalDiscount));
    const enteredPaid = paymentRows.reduce((acc, r) => acc.plus(D(r.amount)), D(0));
    const appliedPaid = enteredPaid.gt(grandTotal) ? grandTotal : enteredPaid;
    const due = grandTotal.minus(appliedPaid);
    const changeReturn = enteredPaid.gt(grandTotal) ? enteredPaid.minus(grandTotal) : D(0);
    return { subtotal, itemDiscounts, totalDiscount, grandTotal, enteredPaid, appliedPaid, due, changeReturn };
  }, [cart, billDiscount, paymentRows]);

  const setFullCashPayment = () => {
    setPaymentRows([{ method: 'CASH', amount: money(totals.grandTotal), referenceNo: '' }]);
  };

  const setFullCreditSale = () => {
    setPaymentRows([{ method: 'CASH', amount: '0', referenceNo: '' }]);
  };

  const canEditPrice = staff?.role !== 'CASHIER' || Boolean(settings?.allowCashierPriceEdit);
  const canDiscount = staff?.role !== 'CASHIER' || Boolean(settings?.allowCashierDiscount);

  const projectedCustomerDue = selectedCustomer ? D(selectedCustomer.currentDue).plus(totals.due) : D(0);
  const creditLimitExceeded =
    Boolean(selectedCustomer) &&
    totals.due.gt(0) &&
    D(selectedCustomer!.creditLimit).gt(0) &&
    projectedCustomerDue.gt(D(selectedCustomer!.creditLimit));

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim() || !newCust.phone.trim()) {
      toast.error(tx(lang, 'Customer name and mobile number are required', 'ক্রেতার নাম ও মোবাইল নম্বর আবশ্যক'));
      return;
    }
    try {
      const created = await apiFetch('/api/customers', {
        method: 'POST',
        body: JSON.stringify(newCust),
      });
      await refreshCatalog();
      setSelectedCustomerId(created.id);
      setShowQuickCustomer(false);
      setNewCust({ name: '', phone: '', area: '', customerType: 'REGULAR', creditLimit: '5000' });
      toast.success(
        tx(lang, `Created ${created.name} (${created.customerCode})`, `${created.name} (${created.customerCode}) তৈরি হয়েছে`)
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to create customer', 'ক্রেতা তৈরি ব্যর্থ হয়েছে'));
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(tx(lang, 'Add at least one product to the cart', 'কার্টে অন্তত একটি পণ্য যোগ করুন'));
      return;
    }
    if (totals.due.gt(0) && !selectedCustomerId) {
      toast.error(
        tx(
          lang,
          'Anonymous credit sale is not allowed. Select or create a customer for due/baki.',
          'নাম ছাড়া বাকিতে বিক্রি করা যাবে না। বাকির জন্য ক্রেতা নির্বাচন বা যোগ করুন।'
        )
      );
      return;
    }
    if (creditLimitExceeded && !allowLimitOverride) {
      toast.error(
        tx(
          lang,
          'Credit limit exceeded! Enable Manager override or collect a larger upfront payment.',
          'ক্রেডিট লিমিট অতিক্রম করেছে! ম্যানেজার অনুমোদন দিন বা বেশি নগদ গ্রহণ করুন।'
        )
      );
      return;
    }

    setSubmitting(true);
    const clientUuid = crypto.randomUUID();
    const saleDate = dhakaTodayISO();
    const validPayments = paymentRows
      .filter((p) => D(p.amount).gt(0))
      .map((p) => ({ method: p.method, amount: money(p.amount), referenceNo: p.referenceNo }));

    const payload = {
      clientTransactionUuid: clientUuid,
      saleDate,
      customerId: selectedCustomerId,
      billDiscount: money(billDiscount),
      expectedPaymentDate: totals.due.gt(0) ? expectedPaymentDate || null : null,
      allowCreditLimitOverride: allowLimitOverride,
      items: cart.map((i) => ({
        productId: i.product.id,
        unitName: i.unitName,
        conversionFactor: String(i.conversionFactor),
        enteredQty: i.enteredQty,
        unitSellingPrice: i.unitSellingPrice,
        itemDiscount: money(i.itemDiscount),
      })),
      payments: validPayments,
    };

    try {
      if (isOnline) {
        const res = await apiFetch<{ sale: any; items: any[]; payments: any[] }>('/api/sales', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success(
          tx(lang, `Sale ${res.sale.invoiceNumber} completed`, `বিক্রয় ${res.sale.invoiceNumber} সম্পন্ন হয়েছে`)
        );
        setReceipt({
          type: 'SALE',
          invoiceNumber: res.sale.invoiceNumber,
          saleDate: res.sale.saleDate,
          customerName: selectedCustomer?.name || null,
          customerPhone: selectedCustomer?.phone || null,
          expectedPaymentDate: res.sale.expectedPaymentDate,
          items: res.items,
          subtotal: res.sale.subtotal,
          discount: money(D(res.sale.itemDiscountTotal).plus(D(res.sale.billDiscount))),
          totalAmount: res.sale.totalAmount,
          paidAmount: res.sale.paidAmount,
          dueAmount: res.sale.dueAmount,
          payments: res.payments,
        });
        await refreshCatalog();
      } else {
        const queued = await enqueueOfflineSale({
          clientTransactionUuid: clientUuid,
          saleDate,
          customerId: selectedCustomerId,
          customerName: selectedCustomer?.name,
          billDiscount: money(billDiscount),
          expectedPaymentDate: totals.due.gt(0) ? expectedPaymentDate || null : null,
          items: cart.map((i) => ({
            productId: i.product.id,
            productName: trCompact(i.product.name, i.product.nameBn, lang),
            variant: i.product.variant,
            unitName: i.unitName,
            conversionFactor: String(i.conversionFactor),
            enteredQty: i.enteredQty,
            unitSellingPrice: i.unitSellingPrice,
            itemDiscount: money(i.itemDiscount),
          })),
          payments: validPayments,
          computedSubtotal: money(totals.subtotal),
          computedTotal: money(totals.grandTotal),
          computedPaid: money(totals.appliedPaid),
          computedDue: money(totals.due),
        });
        toast.warning(
          tx(
            lang,
            `Offline Sale ${queued.localInvoiceNumber} saved locally. Will auto-sync when online.`,
            `অফলাইন বিক্রয় ${queued.localInvoiceNumber} স্থানীয়ভাবে সংরক্ষিত হয়েছে। অনলাইনে এলেই সিঙ্ক হবে।`
          )
        );
        setReceipt({
          type: 'SALE',
          invoiceNumber: queued.localInvoiceNumber,
          saleDate,
          customerName: selectedCustomer?.name || null,
          customerPhone: selectedCustomer?.phone || null,
          expectedPaymentDate: totals.due.gt(0) ? expectedPaymentDate || null : null,
          isOffline: true,
          items: cart.map((i) => ({
            productName: trCompact(i.product.name, i.product.nameBn, lang),
            variant: i.product.variant,
            unitName: i.unitName,
            enteredQty: i.enteredQty,
            unitSellingPrice: i.unitSellingPrice,
            lineTotal: money(D(i.enteredQty).times(D(i.unitSellingPrice)).minus(D(i.itemDiscount))),
          })),
          subtotal: money(totals.subtotal),
          discount: money(totals.totalDiscount),
          totalAmount: money(totals.grandTotal),
          paidAmount: money(totals.appliedPaid),
          dueAmount: money(totals.due),
          payments: validPayments,
        });
        await refreshCatalog();
      }

      setCart([]);
      setBillDiscount('0');
      setSelectedCustomerId(null);
      setExpectedPaymentDate('');
      setAllowLimitOverride(false);
      setPaymentRows([{ method: 'CASH', amount: '', referenceNo: '' }]);
      searchRef.current?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Checkout failed', 'বিক্রয় সম্পন্ন ব্যর্থ হয়েছে'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
      {/* Left: Search, Categories, Product Grid */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {!isOnline && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{tr('offlineModeBanner', lang)}</span>
          </div>
        )}

        {/* Search & Barcode Input */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={tx(
                lang,
                'Scan barcode or search product, brand, SKU... (F2)',
                'বারকোড স্ক্যান করুন অথবা পণ্য, ব্র্যান্ড, কোড খুঁজুন... (F2)'
              )}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
            <Barcode className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCatId('FREQUENT')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCatId === 'FREQUENT'
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {trCompact('Frequent Items', 'জনপ্রিয় পণ্য', lang)}
          </button>
          <button
            type="button"
            onClick={() => setSelectedCatId('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCatId === 'ALL'
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {trCompact('All Products', 'সব পণ্য', lang)} ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCatId(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCatId === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {trCompact(cat.name, cat.nameBn, lang)}
            </button>
          ))}
        </div>

        {/* Product Selection Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((prod) => {
            const stock = Number(prod.currentStock);
            const isOut = stock <= 0;
            const isLow = stock > 0 && stock <= Number(prod.minStock);
            const brand = prod.brandId ? brandMap.get(prod.brandId) : null;
            const brandLabel = brand ? trCompact(brand.name, brand.nameBn, lang) : prod.sku;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => addToCart(prod)}
                className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition cursor-pointer ${
                  isOut
                    ? 'border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20'
                    : 'border-slate-200 bg-white hover:border-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">{brandLabel}</span>
                    <span className="font-mono shrink-0">{prod.variant}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold leading-snug text-slate-900 dark:text-white line-clamp-2">
                    {trCompact(prod.name, prod.nameBn, lang)}
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                  <div className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                    {formatBDT(prod.sellingPrice)}
                    <span className="text-[10px] font-normal text-slate-500">/{formatUnitLabel(prod.baseUnit, lang)}</span>
                  </div>
                  <div
                    className={`font-mono text-[11px] font-semibold ${
                      isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {formatQty(prod.currentStock)} {formatUnitLabel(prod.baseUnit, lang)}
                    {!isOnline ? ` (${tx(lang, 'Cached', 'ক্যাশ')})` : ''}
                  </div>
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-slate-700">
              {tx(lang, 'No matching products found.', 'কোনো মিল থাকা পণ্য পাওয়া যায়নি।')}
            </div>
          )}
        </div>
      </div>

      {/* Right: Sticky Live Cart, Customer Credit & Split Payment Panel */}
      <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-20 flex flex-col">
        {/* Customer Selector Bar */}
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {trCompact('Customer / Digital Khata', 'ক্রেতা নির্বাচন', lang)}
            </label>
            <button
              type="button"
              onClick={() => setShowQuickCustomer(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {tx(lang, 'Quick Add', 'দ্রুত যোগ')}
            </button>
          </div>
          <select
            value={selectedCustomerId ?? ''}
            onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">{tr('walkInCustomer', lang)}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) · {tx(lang, 'Due:', 'বাকি:')} {formatBDT(c.currentDue)}
              </option>
            ))}
          </select>
          {selectedCustomer && (
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                {selectedCustomer.customerCode} · {formatStatusLabel(selectedCustomer.customerType, lang)}
              </span>
              <span className="font-mono">
                {tx(lang, 'Due:', 'বাকি:')}{' '}
                <strong className="text-red-600">{formatBDT(selectedCustomer.currentDue)}</strong> /{' '}
                {tx(lang, 'Limit', 'লিমিট')} {formatBDT(selectedCustomer.creditLimit)}
              </span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 px-4 dark:divide-slate-800">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {tx(lang, 'Click products or scan a barcode to start billing.', 'বিল শুরু করতে পণ্যে ক্লিক করুন বা বারকোড স্ক্যান করুন।')}
            </div>
          ) : (
            cart.map((item, idx) => {
              const lineTotal = D(item.enteredQty).times(D(item.unitSellingPrice)).minus(D(item.itemDiscount));
              return (
                <div key={`${item.product.id}-${item.unitName}-${idx}`} className="py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {trCompact(item.product.name, item.product.nameBn, lang)}
                      </div>
                      <div className="text-[11px] text-slate-500">{item.product.variant}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const step = item.product.allowDecimalQty ? 0.5 : 1;
                          const next = D(item.enteredQty).minus(step);
                          if (next.gt(0)) updateCartItem(idx, { enteredQty: formatQty(next) });
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        step={item.product.allowDecimalQty ? '0.05' : '1'}
                        min="0.01"
                        value={item.enteredQty}
                        onChange={(e) => updateCartItem(idx, { enteredQty: e.target.value })}
                        className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-center font-mono text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const step = item.product.allowDecimalQty ? 0.5 : 1;
                          const next = D(item.enteredQty).plus(step);
                          updateCartItem(idx, { enteredQty: formatQty(next) });
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>

                      {(item.product.units || []).length > 0 ? (
                        <select
                          value={item.unitName}
                          onChange={(e) => switchItemUnit(idx, e.target.value)}
                          className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-950"
                        >
                          <option value={item.product.baseUnit}>{formatUnitLabel(item.product.baseUnit, lang)}</option>
                          {(item.product.units || []).map((u) => (
                            <option key={u.id} value={u.unitName}>
                              {formatUnitLabel(u.unitName, lang)} (×{formatQty(u.conversionFactor)})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[11px] text-slate-500 pl-0.5">{formatUnitLabel(item.unitName, lang)}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canEditPrice ? (
                        <input
                          type="number"
                          value={item.unitSellingPrice}
                          onChange={(e) => updateCartItem(idx, { unitSellingPrice: e.target.value })}
                          title={tx(lang, 'Unit selling price', 'একক বিক্রয় মূল্য')}
                          className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      ) : (
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                          ×{formatBDT(item.unitSellingPrice)}
                        </span>
                      )}
                      <span className="w-20 text-right font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {formatBDT(lineTotal)}
                      </span>
                    </div>
                  </div>

                  {canDiscount && (
                    <div className="flex items-center justify-end gap-2 text-[11px] text-slate-500">
                      <span>{tx(lang, 'Item disc (৳):', 'পণ্য ছাড় (৳):')}</span>
                      <input
                        type="number"
                        min="0"
                        value={item.itemDiscount}
                        onChange={(e) => updateCartItem(idx, { itemDiscount: e.target.value })}
                        className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-right font-mono text-[11px] dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Totals & Payment Splits */}
        <div className="border-t border-slate-200 p-4 space-y-3 dark:border-slate-800">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{tr('subtotal', lang)}</span>
              <span className="font-mono">{formatBDT(totals.subtotal)}</span>
            </div>
            {canDiscount && (
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>{trCompact('Overall Bill Discount', 'সর্বমোট ছাড়', lang)} (৳)</span>
                <input
                  type="number"
                  min="0"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(e.target.value)}
                  className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1 text-right font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-800 dark:text-white">
              <span>{tr('grandTotal', lang)}</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">{formatBDT(totals.grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={setFullCashPayment}
              className="rounded-lg border border-emerald-600/30 bg-emerald-50 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 cursor-pointer"
            >
              {tx(lang, 'Full Cash', 'পূর্ণ নগদ')}
            </button>
            <button
              type="button"
              onClick={setFullCreditSale}
              className="rounded-lg border border-amber-600/30 bg-amber-50 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 cursor-pointer"
            >
              {tx(lang, 'Full Credit', 'সম্পূর্ণ বাকি')}
            </button>
            <button
              type="button"
              onClick={() => setPaymentRows((prev) => [...prev, { method: 'BKASH', amount: '', referenceNo: '' }])}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <Split className="h-3.5 w-3.5" />
              {tx(lang, 'Split', 'ভাগ করুন')}
            </button>
          </div>

          <div className="space-y-2">
            {paymentRows.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={row.method}
                  onChange={(e) =>
                    setPaymentRows((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, method: e.target.value as PaymentRow['method'] } : r))
                    )
                  }
                  className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-950"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.code} value={m.code}>
                      {trCompact(m.en, m.bn, lang)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder={tx(lang, 'Paid ৳', 'জমা ৳')}
                  value={row.amount}
                  onChange={(e) =>
                    setPaymentRows((prev) => prev.map((r, i) => (i === idx ? { ...r, amount: e.target.value } : r)))
                  }
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right font-mono text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
                />
                {paymentRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPaymentRows((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-slate-50 p-3 text-xs space-y-1 dark:bg-slate-950">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">{tr('paidAmount', lang)}</span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {formatBDT(totals.appliedPaid)}
              </span>
            </div>
            {totals.changeReturn.gt(0) && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">{tr('changeReturn', lang)}</span>
                <span className="font-mono font-semibold text-blue-600">{formatBDT(totals.changeReturn)}</span>
              </div>
            )}
            {totals.due.gt(0) && (
              <div className="flex justify-between font-bold text-red-600 dark:text-red-400">
                <span>{tr('dueAmount', lang)}</span>
                <span className="font-mono">{formatBDT(totals.due)}</span>
              </div>
            )}
          </div>

          {totals.due.gt(0) && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
              {!selectedCustomerId && (
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  {tx(
                    lang,
                    'Select or Quick-Add a customer above to record a credit/baki sale.',
                    'বাকিতে বিক্রয় করতে উপরে একজন ক্রেতা নির্বাচন বা যোগ করুন।'
                  )}
                </p>
              )}
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  {tr('expectedPayDate', lang)}
                </label>
                <input
                  type="date"
                  value={expectedPaymentDate}
                  onChange={(e) => setExpectedPaymentDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
              {creditLimitExceeded && (
                <div className="space-y-1.5 text-xs text-red-700 dark:text-red-400">
                  <p className="font-semibold">
                    {tx(
                      lang,
                      `Credit limit (${formatBDT(selectedCustomer!.creditLimit)}) will be exceeded (Projected: ${formatBDT(projectedCustomerDue)}).`,
                      `ক্রেডিট লিমিট (${formatBDT(selectedCustomer!.creditLimit)}) অতিক্রম করবে (সম্ভাব্য বাকি: ${formatBDT(projectedCustomerDue)})।`
                    )}
                  </p>
                  {staff?.role !== 'CASHIER' && (
                    <label className="flex items-center gap-2 text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowLimitOverride}
                        onChange={(e) => setAllowLimitOverride(e.target.checked)}
                      />
                      <span>
                        {tx(
                          lang,
                          `Authorize credit limit override (${formatStatusLabel(staff?.role, lang)})`,
                          `ক্রেডিট লিমিট অতিক্রমের অনুমোদন (${formatStatusLabel(staff?.role, lang)})`
                        )}
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={submitting || cart.length === 0}
            onClick={handleCheckout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting
              ? tx(lang, 'Processing...', 'প্রক্রিয়া চলছে...')
              : `${tr('completeSale', lang)} (F9) · ${formatBDT(totals.grandTotal)}`}
          </button>
        </div>
      </div>

      {/* Quick-Create Customer Modal */}
      {showQuickCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleQuickCreateCustomer}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {trCompact('Quick Create Customer', 'দ্রুত নতুন ক্রেতা যোগ করুন', lang)}
              </h3>
              <button type="button" onClick={() => setShowQuickCustomer(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Full Name *', 'পূর্ণ নাম *')}
                </label>
                <input
                  required
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Mobile Number *', 'মোবাইল নম্বর *')}
                </label>
                <input
                  required
                  placeholder="017XXXXXXXX"
                  value={newCust.phone}
                  onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {tx(lang, 'Customer Type', 'ক্রেতার ধরন')}
                  </label>
                  <select
                    value={newCust.customerType}
                    onChange={(e) =>
                      setNewCust({ ...newCust, customerType: e.target.value as 'REGULAR' | 'VIP' | 'WHOLESALE' })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="REGULAR">{formatStatusLabel('REGULAR', lang)}</option>
                    <option value="VIP">{formatStatusLabel('VIP', lang)}</option>
                    <option value="WHOLESALE">{formatStatusLabel('WHOLESALE', lang)}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {tx(lang, 'Credit Limit (৳)', 'ক্রেডিট লিমিট (৳)')}
                  </label>
                  <input
                    type="number"
                    value={newCust.creditLimit}
                    onChange={(e) => setNewCust({ ...newCust, creditLimit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Area / Address', 'এলাকা / ঠিকানা')}
                </label>
                <input
                  value={newCust.area}
                  onChange={(e) => setNewCust({ ...newCust, area: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickCustomer(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium dark:border-slate-700"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
              >
                {tx(lang, 'Create & Select', 'তৈরি ও নির্বাচন করুন')}
              </button>
            </div>
          </form>
        </div>
      )}

      {receipt && <ReceiptModal receipt={receipt} store={store} settings={settings} onClose={() => setReceipt(null)} />}
    </div>
  );
};

function DecimalMaxZero(val: ReturnType<typeof D>) {
  return val.lt(0) ? D(0) : val;
}
