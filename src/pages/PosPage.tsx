import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  WifiOff,
  Split,
  X,
  Star,
  LayoutGrid,
  SlidersHorizontal,
  ShoppingBag,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { D, money, formatBDT, formatQty, dhakaTodayISO, PAYMENT_METHODS } from '../lib/decimal';
import { tr, trCompact, tx, formatStatusLabel, formatUnitLabel, formatVariant } from '../lib/i18n';
import { enqueueOfflineSale, offlineDb, type CachedProduct } from '../lib/offline-db';
import { ReceiptModal, type PrintableReceipt } from '../components/ReceiptModal';
import { ProductImage, BrandLogo, CategoryIcon, getCategoryTheme } from '../components/ProductMedia';
import { matchesBanglishQuery } from '../lib/search-banglish';

interface CartItem {
  product: CachedProduct;
  unitName: string;
  conversionFactor: number;
  enteredQty: string;
  unitSellingPrice: string;
}

export const PosPage: React.FC = () => {
  const { products, categories, brands, customers, store, settings, staff, isOnline, lang, refreshCatalog } = useApp();

  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<number | 'ALL' | 'FREQUENT'>('ALL');
  const [selectedBrandId, setSelectedBrandId] = useState<number | 'ALL'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [variantFilter, setVariantFilter] = useState<string>('ALL');
  const [priceRange, setPriceRange] = useState<'ALL' | 'UNDER_100' | '100_500' | 'OVER_500'>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [billDiscount, setBillDiscount] = useState('0');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [expectedPaymentDate, setExpectedPaymentDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<PrintableReceipt | null>(null);
  const [allowLimitOverride, setAllowLimitOverride] = useState(false);

  // Modern Fast Billing & Due Management States
  const [paidInput, setPaidInput] = useState<string>('');
  const [paidInputTouched, setPaidInputTouched] = useState<boolean>(false);

  // Due customer assignment: 'EXISTING' or 'NEW'
  const [dueCustomerMode, setDueCustomerMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [existingCustQuery, setExistingCustQuery] = useState<string>('');
  const [showCustDropdown, setShowCustDropdown] = useState<boolean>(false);
  const [dueCustName, setDueCustName] = useState<string>('');
  const [dueCustPhone, setDueCustPhone] = useState<string>('');
  const [dueCustArea, setDueCustArea] = useState<string>('');
  const [showProUpgradeModal, setShowProUpgradeModal] = useState<boolean>(false);

  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCust, setNewCust] = useState({
    name: '',
    phone: '',
    area: '',
    customerType: 'REGULAR' as 'REGULAR' | 'VIP' | 'WHOLESALE' | 'OCCASIONAL',
    creditLimit: '5000',
  });

  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  // Active categories that have products (plus all categories sorted so populated come first)
  const categoryCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of products) {
      map.set(p.categoryId, (map.get(p.categoryId) || 0) + 1);
    }
    return map;
  }, [products]);

  const filteredExistingCustomers = useMemo(() => {
    const q = existingCustQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, existingCustQuery]);

  const activeCategories = useMemo(() => {
    return [...categories]
      .filter((c) => (categoryCounts.get(c.id) || 0) > 0)
      .sort((a, b) => {
        const nameA = lang === 'BN' && a.nameBn ? a.nameBn : a.name;
        const nameB = lang === 'BN' && b.nameBn ? b.nameBn : b.name;
        return nameA.localeCompare(nameB, lang === 'BN' ? 'bn' : 'en');
      });
  }, [categories, categoryCounts, lang]);

  const brandsWithProducts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of products) {
      if (p.brandId) counts.set(p.brandId, (counts.get(p.brandId) || 0) + 1);
    }
    return brands
      .filter((b) => (counts.get(b.id) || 0) > 0)
      .sort((a, b) => {
        const aLogo = a.logoUrl ? 1 : 0;
        const bLogo = b.logoUrl ? 1 : 0;
        if (bLogo !== aLogo) return bLogo - aLogo;
        return (counts.get(b.id) || 0) - (counts.get(a.id) || 0);
      });
  }, [brands, products]);

  const uniqueVariants = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.variant && p.variant.trim()) set.add(p.variant.trim());
    }
    return Array.from(set).sort().slice(0, 24);
  }, [products]);

  // Cart quick lookup map (productId -> index & total qty)
  const cartQtyMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const item of cart) {
      map.set(item.product.id, (map.get(item.product.id) || 0) + Number(item.enteredQty || 0));
    }
    return map;
  }, [cart]);

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

  const searchSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => {
        const b = p.brandId ? brandMap.get(p.brandId) : null;
        const c = catMap.get(p.categoryId);
        const corpus = `${p.name} ${p.nameBn} ${p.sku} ${p.barcode || ''} ${p.variant || ''} ${b?.name || ''} ${b?.nameBn || ''} ${c?.name || ''} ${c?.nameBn || ''}`.toLowerCase();
        return matchesBanglishQuery(corpus, q);
      })
      .slice(0, 7);
  }, [products, query, brandMap, catMap]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (p.isActive === false) return false;
      if (q) {
        const b = p.brandId ? brandMap.get(p.brandId) : null;
        const c = catMap.get(p.categoryId);
        const corpus = `${p.name} ${p.nameBn} ${p.sku} ${p.barcode || ''} ${p.variant || ''} ${b?.name || ''} ${b?.nameBn || ''} ${c?.name || ''} ${c?.nameBn || ''}`.toLowerCase();
        if (!matchesBanglishQuery(corpus, q)) return false;
      } else {
        if (selectedCatId === 'FREQUENT' && !p.isFrequent) return false;
        if (typeof selectedCatId === 'number' && p.categoryId !== selectedCatId) return false;
        if (selectedBrandId !== 'ALL' && p.brandId !== selectedBrandId) return false;
      }

      const stock = Number(p.currentStock);
      const min = Number(p.minStock);
      if (stockFilter === 'IN_STOCK' && stock <= 0) return false;
      if (stockFilter === 'LOW_STOCK' && !(stock > 0 && stock <= min)) return false;
      if (stockFilter === 'OUT_OF_STOCK' && stock > 0) return false;

      if (variantFilter !== 'ALL' && p.variant !== variantFilter) return false;

      const price = Number(p.sellingPrice);
      if (priceRange === 'UNDER_100' && price >= 100) return false;
      if (priceRange === '100_500' && (price < 100 || price > 500)) return false;
      if (priceRange === 'OVER_500' && price <= 500) return false;

      return true;
    });
  }, [products, query, selectedCatId, selectedBrandId, stockFilter, variantFilter, priceRange, brandMap, catMap]);

  const [displayLimit, setDisplayLimit] = useState(60);

  useEffect(() => {
    setDisplayLimit(60);
  }, [query, selectedCatId, selectedBrandId, stockFilter, variantFilter, priceRange]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  const hasActiveFilters =
    selectedBrandId !== 'ALL' || stockFilter !== 'ALL' || variantFilter !== 'ALL' || priceRange !== 'ALL';

  const clearFilters = () => {
    setSelectedBrandId('ALL');
    setStockFilter('ALL');
    setVariantFilter('ALL');
    setPriceRange('ALL');
  };

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
        },
      ];
    });
  };

  const decrementProductInCart = (prodId: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === prodId);
      if (idx < 0) return prev;
      const step = prev[idx].product.allowDecimalQty ? 0.5 : 1;
      const next = D(prev[idx].enteredQty).minus(step);
      if (next.lte(0)) {
        return prev.filter((_, i) => i !== idx);
      }
      return prev.map((item, i) => (i === idx ? { ...item, enteredQty: formatQty(next) } : item));
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
        setSearchFocused(false);
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
        setSearchFocused(false);
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
    for (const item of cart) {
      const gross = D(item.enteredQty).times(D(item.unitSellingPrice));
      subtotal = subtotal.plus(gross);
    }
    const bDisc = D(billDiscount);
    const grandTotal = DecimalMaxZero(subtotal.minus(bDisc));

    let enteredPaid = D(0);
    if (paidInputTouched) {
      enteredPaid = paidInput.trim() === '' ? D(0) : D(paidInput);
    } else {
      enteredPaid = grandTotal;
    }

    const appliedPaid = enteredPaid.gt(grandTotal) ? grandTotal : enteredPaid;
    const due = grandTotal.minus(appliedPaid);
    const changeReturn = enteredPaid.gt(grandTotal) ? enteredPaid.minus(grandTotal) : D(0);
    const isDueSale = due.gt(0);

    return { subtotal, itemDiscounts: D(0), totalDiscount: bDisc, grandTotal, enteredPaid, appliedPaid, due, changeReturn, isDueSale };
  }, [cart, billDiscount, paidInput, paidInputTouched]);

  const setFullCashPayment = () => {
    setPaidInput(money(totals.grandTotal));
    setPaidInputTouched(true);
  };

  const setFullCreditSale = () => {
    setPaidInput('0');
    setPaidInputTouched(true);
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
      let created: { id: number; name: string; customerCode: string } | null = null;
      if (isOnline) {
        try {
          created = await apiFetch<{ id: number; name: string; customerCode: string }>('/api/customers', {
            method: 'POST',
            body: JSON.stringify(newCust),
          });
        } catch (apiErr) {
          console.warn('Online customer API failed, creating locally:', apiErr);
        }
      }

      if (!created) {
        const localId = Date.now();
        const code = `CUST-${localId.toString().slice(-4)}`;
        const localRecord = {
          id: localId,
          customerCode: code,
          name: newCust.name.trim(),
          phone: newCust.phone.trim(),
          customerType: newCust.customerType || 'REGULAR',
          creditLimit: newCust.creditLimit || '5000',
          currentDue: '0.00',
        };
        await offlineDb.customers.put(localRecord);
        created = { id: localId, name: localRecord.name, customerCode: code };
      }

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

    // Demo mode restriction: max 100 entries
    if (settings?.demoModeActive) {
      const demoCount = Number(localStorage.getItem('mudirdokan_demo_entry_count') || '0');
      if (demoCount >= 100) {
        setShowProUpgradeModal(true);
        return;
      }
    }

    let finalCustomerId: number | null = null;
    let finalCustName: string | null = null;
    let finalCustPhone: string | null = null;
    let finalTotalDue: string | undefined = undefined;

    // Due sale customer validation
    if (totals.isDueSale) {
      if (dueCustomerMode === 'NEW') {
        if (!dueCustName.trim() || !dueCustPhone.trim()) {
          toast.error(
            tx(
              lang,
              'Customer Name and Mobile Number are required for credit/due sales.',
              'বাকি বিক্রয়ের জন্য ক্রেতার নাম ও মোবাইল নম্বর আবশ্যক।'
            )
          );
          return;
        }

        // Auto create new customer record
        try {
          let created: { id: number; name: string; customerCode: string } | null = null;
          if (isOnline) {
            try {
              created = await apiFetch<{ id: number; name: string; customerCode: string }>('/api/customers', {
                method: 'POST',
                body: JSON.stringify({
                  name: dueCustName.trim(),
                  phone: dueCustPhone.trim(),
                  area: dueCustArea.trim(),
                  customerType: 'REGULAR',
                  creditLimit: '5000',
                }),
              });
            } catch (apiErr) {
              console.warn('Online customer creation failed, using offline DB:', apiErr);
            }
          }
          if (!created) {
            const localId = Date.now();
            const code = `CUST-${localId.toString().slice(-4)}`;
            const localRecord = {
              id: localId,
              customerCode: code,
              name: dueCustName.trim(),
              phone: dueCustPhone.trim(),
              customerType: 'REGULAR' as const,
              creditLimit: '5000',
              currentDue: money(totals.due),
            };
            await offlineDb.customers.put(localRecord);
            created = { id: localId, name: localRecord.name, customerCode: code };
          }
          finalCustomerId = created.id;
          finalCustName = dueCustName.trim();
          finalCustPhone = dueCustPhone.trim();
          finalTotalDue = money(totals.due);
          await refreshCatalog();
        } catch (err) {
          toast.error(tx(lang, 'Failed to save customer for credit sale', 'বাকির জন্য ক্রেতা সংরক্ষণ ব্যর্থ হয়েছে'));
          return;
        }
      } else {
        // Existing customer selected
        if (!selectedCustomerId || !selectedCustomer) {
          toast.error(
            tx(
              lang,
              'Select an existing customer or enter new customer details for due sale.',
              'বাকির জন্য বিদ্যমান ক্রেতা নির্বাচন করুন বা নতুন ক্রেতার তথ্য দিন।'
            )
          );
          return;
        }
        finalCustomerId = selectedCustomer.id;
        finalCustName = selectedCustomer.name;
        finalCustPhone = selectedCustomer.phone;
        finalTotalDue = money(D(selectedCustomer.currentDue || 0).plus(totals.due));
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
    }

    setSubmitting(true);
    const clientUuid = crypto.randomUUID();
    const saleDate = dhakaTodayISO();

    const validPayments = totals.appliedPaid.gt(0)
      ? [{ method: 'CASH', amount: money(totals.appliedPaid), referenceNo: '' }]
      : [];

    const payload = {
      clientTransactionUuid: clientUuid,
      saleDate,
      customerId: finalCustomerId,
      customerName: finalCustName || undefined,
      customerPhone: finalCustPhone || undefined,
      subtotal: money(totals.subtotal),
      billDiscount: money(billDiscount),
      totalAmount: money(totals.grandTotal),
      paidAmount: money(totals.appliedPaid),
      dueAmount: money(totals.due),
      expectedPaymentDate: totals.due.gt(0) ? expectedPaymentDate || null : null,
      allowCreditLimitOverride: allowLimitOverride,
      items: cart.map((i) => {
        const lineTotal = money(D(i.enteredQty).times(D(i.unitSellingPrice)).minus(D(i.itemDiscount || 0)));
        return {
          productId: i.product.id,
          productName: trCompact(i.product.name, i.product.nameBn, lang),
          variant: i.product.variant,
          unitName: i.unitName,
          conversionFactor: String(i.conversionFactor),
          enteredQty: i.enteredQty,
          unitSellingPrice: i.unitSellingPrice,
          itemDiscount: money(i.itemDiscount || 0),
          lineTotal,
        };
      }),
      payments: validPayments,
    };

    try {
      let saleCompleted = false;

      // 1. Attempt online API submission if connected
      if (isOnline) {
        try {
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
            customerName: finalCustName,
            customerPhone: finalCustPhone,
            expectedPaymentDate: res.sale.expectedPaymentDate,
            items: (res.items || []).map((it: any) => ({
              ...it,
              lineTotal: it.lineTotal || money(D(it.enteredQty).times(D(it.unitSellingPrice)).minus(D(it.itemDiscount || 0))),
            })),
            subtotal: res.sale.subtotal,
            discount: money(D(res.sale.itemDiscountTotal).plus(D(res.sale.billDiscount))),
            totalAmount: res.sale.totalAmount,
            paidAmount: res.sale.paidAmount,
            dueAmount: res.sale.dueAmount,
            customerTotalDue: finalTotalDue,
            payments: res.payments,
          });
          saleCompleted = true;
          await refreshCatalog();
        } catch (apiErr) {
          console.warn('Online sale API unreachable or inactive, automatically falling back to offline queue:', apiErr);
        }
      }

      // 2. Offline-First Resilience: If offline or backend server is inactive / HTML-responding, save locally to IndexedDB
      if (!saleCompleted) {
        const queued = await enqueueOfflineSale({
          clientTransactionUuid: clientUuid,
          saleDate,
          customerId: finalCustomerId,
          customerName: finalCustName || undefined,
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
        toast.success(
          tx(
            lang,
            `Sale ${queued.localInvoiceNumber} completed! (Offline cache - will auto-sync to cloud)`,
            `বিক্রয় ${queued.localInvoiceNumber} সম্পন্ন হয়েছে! (ক্যাশে সংরক্ষিত - অনলাইন সিঙ্ক হবে)`
          )
        );
        setReceipt({
          type: 'SALE',
          invoiceNumber: queued.localInvoiceNumber,
          saleDate,
          customerName: finalCustName,
          customerPhone: finalCustPhone,
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
          customerTotalDue: finalTotalDue,
          payments: validPayments,
        });
        await refreshCatalog();
      }

      // Track demo entries
      if (settings?.demoModeActive) {
        try {
          const next = Number(localStorage.getItem('mudirdokan_demo_entry_count') || '0') + 1;
          localStorage.setItem('mudirdokan_demo_entry_count', String(next));
        } catch {}
      }

      setCart([]);
      setBillDiscount('0');
      setSelectedCustomerId(null);
      setDueCustName('');
      setDueCustPhone('');
      setDueCustArea('');
      setPaidInput('');
      setPaidInputTouched(false);
      setExpectedPaymentDate('');
      setAllowLimitOverride(false);
      searchRef.current?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Checkout failed', 'বিক্রয় সম্পন্ন ব্যর্থ হয়েছে'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 xl:gap-4 lg:grid-cols-12 lg:items-start w-full">
      {/* Left: Search with Thumbnails, Sticky Category Chips, Brand Logos, Multi-Filter & Studio Grid */}
      <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-3 min-w-0">
        {!isOnline && (
          <div className="flex items-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-xs font-semibold text-orange-900 dark:border-orange-700/60 dark:bg-orange-950/40 dark:text-orange-200">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>{tr('offlineModeBanner', lang)}</span>
          </div>
        )}

        {/* Instant Search Bar with Visual Suggestions + Filter Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={tx(
                lang,
                'Scan barcode or search product, brand, size... (F2)',
                'বারকোড স্ক্যান করুন অথবা পণ্য, ব্র্যান্ড, সাইজ খুঁজুন... (F2)'
              )}
              className="w-full rounded-xl border border-indigo-200 bg-white py-3 pl-10 pr-16 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Barcode className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            {/* Live Search Suggestions with Product Thumbnails & Brand Logos */}
            {searchFocused && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-40 mt-1.5 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-100 bg-slate-50/80 px-3.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950/60">
                  {tx(lang, 'Quick Add Matches', 'দ্রুত যোগ করুন')}
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {searchSuggestions.map((p) => {
                    const br = p.brandId ? brandMap.get(p.brandId) : null;
                    const cat = catMap.get(p.categoryId);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addToCart(p);
                          setQuery('');
                          setSearchFocused(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-indigo-50/70 dark:hover:bg-slate-800/80 cursor-pointer"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductImage
                            src={p.imageUrl}
                            sku={p.sku}
                            alt={p.name}
                            iconName={cat?.iconName}
                            accentColor={cat?.accentColor}
                            fallbackIndex={p.categoryId}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {br && (
                                <BrandLogo
                                  logoUrl={br.logoUrl}
                                  name={br.name}
                                  brandColor={br.brandColor}
                                  size="xs"
                                />
                              )}
                              <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                {trCompact(p.name, p.nameBn, lang)}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {formatVariant(p.variant, lang)} · {p.sku} · {tx(lang, 'Stock:', 'স্টক:')} {formatQty(p.currentStock, lang)}{' '}
                              {formatUnitLabel(p.baseUnit, lang)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="font-mono text-sm font-extrabold text-indigo-700 dark:text-indigo-400">
                            {formatBDT(p.sellingPrice)}
                          </div>
                          <div className="text-[10px] font-semibold text-emerald-600">
                            + {tx(lang, 'Add', 'যোগ')}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-bold transition cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{tx(lang, 'Filters', 'ফিল্টার')}</span>
          </button>
        </div>

        {/* Collapsible Multi-Filter Panel (Stock, Size/Variant, Price Range) */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-indigo-100 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="ALL">{tx(lang, 'Availability: All', 'স্টক: সব')}</option>
              <option value="IN_STOCK">{tx(lang, 'In Stock Only', 'স্টক আছে')}</option>
              <option value="LOW_STOCK">{tx(lang, 'Low Stock', 'কম স্টক')}</option>
              <option value="OUT_OF_STOCK">{tx(lang, 'Out of Stock', 'স্টক শেষ')}</option>
            </select>

            <select
              value={variantFilter}
              onChange={(e) => setVariantFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="ALL">{tx(lang, 'Size / Variant: All', 'সাইজ / ধরন: সব')}</option>
              {uniqueVariants.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="ALL">{tx(lang, 'Price: Any', 'মূল্য: সব')}</option>
              <option value="UNDER_100">{tx(lang, 'Under ৳100', '৳১০০ এর নিচে')}</option>
              <option value="100_500">{tx(lang, '৳100 – ৳500', '৳১০০ – ৳৫০০')}</option>
              <option value="OVER_500">{tx(lang, 'Above ৳500', '৳৫০০ এর বেশি')}</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                {tx(lang, 'Reset', 'রিসেট')}
              </button>
            )}
          </div>
        )}

        {/* Sticky Filter Strip: Freezes categories & brands at top when scrolling down */}
        <div className="sticky top-0 z-20 -mx-1 px-1 py-1.5 bg-[#F6F8FC]/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          {/* Colorful Category Icon Strip with Left-to-Right Slider */}
          <div className="pos-horizontal-slider flex items-stretch gap-2 overflow-x-auto pb-1.5">
            <button
              type="button"
              onClick={() => setSelectedCatId('ALL')}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                selectedCatId === 'ALL'
                  ? 'border-indigo-600 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  selectedCatId === 'ALL' ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-bold whitespace-nowrap">{tx(lang, 'All Items', 'সব পণ্য')}</div>
                <div className={`text-[10px] font-mono ${selectedCatId === 'ALL' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {products.length}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedCatId('FREQUENT')}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                selectedCatId === 'FREQUENT'
                  ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  selectedCatId === 'FREQUENT' ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                }`}
              >
                <Star className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs font-bold whitespace-nowrap">{tx(lang, 'Frequent', 'জনপ্রিয়')}</div>
                <div className={`text-[10px] font-mono ${selectedCatId === 'FREQUENT' ? 'text-orange-100' : 'text-slate-400'}`}>
                  {products.filter((p) => p.isFrequent).length}
                </div>
              </div>
            </button>

            {activeCategories.map((cat, idx) => {
              const theme = getCategoryTheme(cat.accentColor, idx);
              const active = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                    active
                      ? `border-transparent bg-gradient-to-r ${theme.gradient} text-white shadow-sm`
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      active ? 'bg-white/20 text-white' : `${theme.bgSoft} ${theme.text}`
                    }`}
                  >
                    <CategoryIcon iconName={cat.iconName} className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold whitespace-nowrap">{trCompact(cat.name, cat.nameBn, lang)}</div>
                    <div className={`text-[10px] font-mono ${active ? 'text-white/80' : 'text-slate-400'}`}>
                      {categoryCounts.get(cat.id) || 0}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Visual Brand Logo Filter Strip with Left-to-Right Slider */}
          <div className="pos-horizontal-slider flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedBrandId('ALL')}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedBrandId === 'ALL'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {tx(lang, 'All Brands', 'সব ব্র্যান্ড')}
            </button>
            {brandsWithProducts.map((b) => {
              const active = selectedBrandId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBrandId(active ? 'ALL' : b.id)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/70 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  <BrandLogo logoUrl={b.logoUrl} name={b.name} brandColor={b.brandColor} size="xs" />
                  <span className="whitespace-nowrap">{trCompact(b.name, b.nameBn, lang)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visually Rich Product Selection Grid (Responsive Full Width: 2 cols on mobile, scales up to 6 cols) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-2.5 w-full">
          {visibleProducts.map((prod) => {
            const stock = Number(prod.currentStock);
            const isOut = stock <= 0;
            const isLow = stock > 0 && stock <= Number(prod.minStock);
            const brand = prod.brandId ? brandMap.get(prod.brandId) : null;
            const cat = catMap.get(prod.categoryId);
            const inCartQty = cartQtyMap.get(prod.id) || 0;

            return (
              <div
                key={prod.id}
                className={`group flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-3 shadow-xs transition duration-150 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
                  inCartQty > 0
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : isOut
                      ? 'border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10'
                      : 'border-slate-200/90 hover:border-indigo-400 dark:border-slate-800 dark:hover:border-indigo-500'
                }`}
              >
                {/* Top Photo Stage with Official Brand Logo & In-Cart Counter */}
                <button
                  type="button"
                  onClick={() => addToCart(prod)}
                  className="relative w-full text-left cursor-pointer"
                >
                  <ProductImage
                    src={prod.imageUrl}
                    sku={prod.sku}
                    alt={trCompact(prod.name, prod.nameBn, lang)}
                    iconName={cat?.iconName}
                    accentColor={cat?.accentColor}
                    fallbackIndex={prod.categoryId}
                    size="card"
                  />

                  {brand && (
                    <div className="absolute left-2 top-2">
                      <BrandLogo
                        logoUrl={brand.logoUrl}
                        name={brand.name}
                        brandColor={brand.brandColor}
                        size="xs"
                      />
                    </div>
                  )}

                  {inCartQty > 0 && (
                    <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 font-mono text-xs font-extrabold text-white shadow-sm">
                      {formatQty(inCartQty)}
                    </span>
                  )}

                  {isLow && !isOut && (
                    <span className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 rounded-md bg-orange-500/95 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {tx(lang, 'Low', 'কম')}
                    </span>
                  )}
                </button>

                {/* Product Metadata */}
                <div className="mt-2.5 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    <span>{brand ? trCompact(brand.name, brand.nameBn, lang) : prod.sku}</span>
                    {cat && <span>·</span>}
                    {cat && <span className="text-slate-400">{trCompact(cat.name, cat.nameBn, lang)}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart(prod)}
                    className="mt-1 block w-full text-left text-[15px] sm:text-base font-extrabold leading-snug text-slate-900 line-clamp-2 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {trCompact(prod.name, prod.nameBn, lang)}
                  </button>
                  <div className="mt-1 inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {formatVariant(prod.variant, lang)}
                  </div>
                </div>

                {/* Eye-Catching Price & Stock Row */}
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <div className="flex items-baseline justify-between gap-1">
                    <div className="font-mono text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatBDT(prod.sellingPrice, lang)}
                    </div>
                    <div
                      className={`font-mono text-[11px] font-bold ${
                        isOut
                          ? 'text-rose-600 dark:text-rose-400'
                          : isLow
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-slate-400'
                      }`}
                    >
                      {isOut
                        ? tx(lang, 'Out', 'শেষ')
                        : `${formatQty(prod.currentStock, lang)} ${formatUnitLabel(prod.baseUnit, lang)}`}
                    </div>
                  </div>

                  {inCartQty > 0 ? (
                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-1 dark:bg-emerald-950/50">
                      <button
                        type="button"
                        onClick={() => decrementProductInCart(prod.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-xs hover:bg-emerald-100 dark:bg-slate-800 dark:text-emerald-300 cursor-pointer"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="font-mono text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                        {formatQty(inCartQty, lang)} {formatUnitLabel(prod.baseUnit, lang)}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(prod)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(prod)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{tx(lang, 'Add to Cart', 'কার্টে যোগ')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {displayLimit < filteredProducts.length && (
            <div className="col-span-full mt-4 flex flex-col items-center justify-center gap-2 py-4">
              <p className="text-xs font-semibold text-slate-500">
                {tx(
                  lang,
                  `Showing ${visibleProducts.length} of ${filteredProducts.length} items`,
                  `${filteredProducts.length}টি পণ্যের মধ্যে ${visibleProducts.length}টি প্রদর্শিত`
                )}
              </p>
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 60)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {tx(
                  lang,
                  `Load More (${filteredProducts.length - visibleProducts.length} remaining)`,
                  `আরও পণ্য দেখুন (বাকি ${filteredProducts.length - visibleProducts.length}টি)`
                )}
              </button>
            </div>
          )}
          {filteredProducts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
              {tx(lang, 'No matching products found.', 'কোনো মিল থাকা পণ্য পাওয়া যায়নি।')}
            </div>
          )}
        </div>
      </div>

      {/* Right: Sticky Live Billing Cart (Positioned at far right corner, compact SaaS layout) */}
      <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 min-w-[310px] w-full rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700/80 dark:bg-slate-900 lg:sticky lg:top-3 flex flex-col overflow-hidden">
        {/* Vibrant Clean Cart Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 px-3.5 py-2.5 text-white">
          <div className="flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-extrabold">{tx(lang, 'Billing Counter', 'বিলিং কার্ট')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-[11px] font-bold">
              {cart.length} {tx(lang, 'items', 'টি')}
            </span>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setPaidInput('');
                  setPaidInputTouched(false);
                }}
                className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold hover:bg-white/25 cursor-pointer"
              >
                {tx(lang, 'Clear', 'মুছুন')}
              </button>
            )}
          </div>
        </div>

        {/* Cart Items List with Distinct Separated Cards & Crisp Borders */}
        <div className="max-h-[320px] overflow-y-auto p-2.5 space-y-2">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              {tx(lang, 'Click products or scan a barcode to start billing.', 'বিল শুরু করতে পণ্য ক্লিক করুন বা বারকোড স্ক্যান করুন।')}
            </div>
          ) : (
            cart.map((item, idx) => {
              const lineTotal = D(item.enteredQty).times(D(item.unitSellingPrice));
              const cat = catMap.get(item.product.categoryId);
              return (
                <div
                  key={`${item.product.id}-${item.unitName}-${idx}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/90 p-2 shadow-2xs dark:border-slate-700/80 dark:bg-slate-800/60 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <ProductImage
                        src={item.product.imageUrl}
                        sku={item.product.sku}
                        alt={item.product.name}
                        iconName={cat?.iconName}
                        accentColor={cat?.accentColor}
                        fallbackIndex={item.product.categoryId}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.product.name}>
                          {trCompact(item.product.name, item.product.nameBn, lang)}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{formatVariant(item.product.variant, lang)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCart((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                      title={tx(lang, 'Remove', 'বাতিল')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const step = item.product.allowDecimalQty ? 0.5 : 1;
                          const next = D(item.enteredQty).minus(step);
                          if (next.gt(0)) updateCartItem(idx, { enteredQty: formatQty(next) });
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 cursor-pointer text-xs"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <input
                        type="number"
                        step={item.product.allowDecimalQty ? '0.05' : '1'}
                        min="0.01"
                        value={item.enteredQty}
                        onChange={(e) => updateCartItem(idx, { enteredQty: e.target.value })}
                        className="w-12 rounded-md border border-slate-300 bg-white py-0.5 text-center font-mono text-xs font-bold dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const step = item.product.allowDecimalQty ? 0.5 : 1;
                          const next = D(item.enteredQty).plus(step);
                          updateCartItem(idx, { enteredQty: formatQty(next) });
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 cursor-pointer text-xs"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>

                      {(item.product.units || []).length > 0 ? (
                        <select
                          value={item.unitName}
                          onChange={(e) => switchItemUnit(idx, e.target.value)}
                          className="rounded-md border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <option value={item.product.baseUnit}>{formatUnitLabel(item.product.baseUnit, lang)}</option>
                          {(item.product.units || []).map((u) => (
                            <option key={u.id} value={u.unitName}>
                              {formatUnitLabel(u.unitName, lang)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 pl-0.5">
                          {formatUnitLabel(item.unitName, lang)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-right">
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        ×{formatBDT(item.unitSellingPrice)}
                      </span>
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                        = {formatBDT(lineTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Totals & Clean Direct Payment (No unnecessary method tabs) */}
        <div className="border-t border-slate-200 p-3 space-y-2.5 dark:border-slate-700/80">
          {/* Bill Summary */}
          <div className="space-y-1 text-xs">
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
                  className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right font-mono text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-black text-slate-900 dark:border-slate-700 dark:text-white">
              <span>{tr('grandTotal', lang)}</span>
              <span className="font-mono text-base text-emerald-700 dark:text-emerald-400">{formatBDT(totals.grandTotal)}</span>
            </div>
          </div>

          {/* Fast Quick Buttons: Full Cash & Full Credit */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={setFullCashPayment}
              className={`rounded-xl border py-1.5 text-xs font-bold transition cursor-pointer ${
                !totals.isDueSale
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}
            >
              {tx(lang, '⚡ Full Paid (নগদ)', '⚡ সম্পূর্ণ নগদ পরিশোধ')}
            </button>
            <button
              type="button"
              onClick={setFullCreditSale}
              className={`rounded-xl border py-1.5 text-xs font-bold transition cursor-pointer ${
                totals.isDueSale && totals.appliedPaid.isZero()
                  ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                  : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
              }`}
            >
              {tx(lang, '📝 Full Due (বাকি)', '📝 সম্পূর্ণ বাকি')}
            </button>
          </div>

          {/* Paid Amount Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {tx(lang, 'Paid Amount (পরিশোধিত টাকা)', 'জমা / পরিশোধিত টাকা')}
              </label>
              {totals.due.gt(0) && (
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {tx(lang, 'Due:', 'বাকি:')} {formatBDT(totals.due)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder={money(totals.grandTotal)}
                value={paidInputTouched ? paidInput : money(totals.grandTotal)}
                onChange={(e) => {
                  setPaidInputTouched(true);
                  setPaidInput(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-right font-mono text-sm font-black text-slate-900 focus:border-emerald-600 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Change return banner if customer paid more than bill */}
          {totals.changeReturn.gt(0) && (
            <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span>{tx(lang, 'Change to Return:', 'কাস্টমারকে ফেরত দিন:')}</span>
              <span className="font-mono text-sm font-black">{formatBDT(totals.changeReturn)}</span>
            </div>
          )}

          {/* CONDITIONAL DUE SECTION: RENDERED ONLY WHEN DUE > 0 */}
          {totals.isDueSale && (
            <div className="space-y-3 rounded-2xl border-2 border-rose-300 bg-rose-50/70 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span className="text-xs font-extrabold text-rose-800 dark:text-rose-300">
                    {tx(lang, 'Due Amount (বাকি বিক্রয়):', 'বাকি পরিমাণ:')}
                  </span>
                </div>
                <span className="font-mono text-sm font-black text-rose-700 dark:text-rose-300">
                  {formatBDT(totals.due)}
                </span>
              </div>

              <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                {tx(
                  lang,
                  'Customer Name & Mobile Number are required to record a due sale.',
                  'বাকিতে বিক্রয়ের জন্য ক্রেতার নাম ও মোবাইল নম্বর আবশ্যক।'
                )}
              </p>

              {/* Segmented Mode: Existing vs New Customer */}
              <div className="flex rounded-xl bg-white/80 p-0.5 border border-rose-200 dark:bg-slate-900 dark:border-rose-900/50">
                <button
                  type="button"
                  onClick={() => setDueCustomerMode('EXISTING')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                    dueCustomerMode === 'EXISTING'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700 dark:text-slate-300'
                  }`}
                >
                  {tx(lang, 'Existing Customer', 'বিদ্যমান ক্রেতা')}
                </button>
                <button
                  type="button"
                  onClick={() => setDueCustomerMode('NEW')}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${
                    dueCustomerMode === 'NEW'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-rose-700 dark:text-slate-300'
                  }`}
                >
                  {tx(lang, 'New Customer', 'নতুন ক্রেতা')}
                </button>
              </div>

              {dueCustomerMode === 'EXISTING' ? (
                <div className="space-y-2">
                  {/* Searchable input box at the top */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={tx(lang, 'Search customer by name...', 'নাম লিখে ক্রেতা খুঁজুন...')}
                      value={selectedCustomer ? selectedCustomer.name : existingCustQuery}
                      onChange={(e) => {
                        if (selectedCustomer) setSelectedCustomerId(null);
                        setExistingCustQuery(e.target.value);
                        setShowCustDropdown(true);
                      }}
                      onFocus={() => setShowCustDropdown(true)}
                      className="w-full rounded-xl border border-rose-300 bg-white py-2 pl-8 pr-8 text-xs font-bold text-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 focus:outline-hidden dark:border-rose-900/60 dark:bg-slate-900 dark:text-white"
                    />
                    {(selectedCustomer || existingCustQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(null);
                          setExistingCustQuery('');
                          setShowCustDropdown(true);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Customer list: only shows Name and Due amount */}
                  {showCustDropdown && !selectedCustomer && (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-rose-200 bg-white shadow-lg dark:border-rose-900/60 dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredExistingCustomers.length === 0 ? (
                        <div className="px-3 py-3 text-center text-xs text-slate-400">
                          {tx(lang, 'No customer found matching name.', 'এই নামে কোনো ক্রেতা পাওয়া যায়নি।')}
                        </div>
                      ) : (
                        filteredExistingCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setExistingCustQuery('');
                              setShowCustDropdown(false);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                          >
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {c.name}
                            </span>
                            <span className="font-mono text-xs font-extrabold text-rose-600 dark:text-rose-400">
                              {tx(lang, 'Due:', 'বাকি:')} {formatBDT(c.currentDue)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="rounded-xl bg-white/95 p-2.5 text-xs space-y-1.5 border border-rose-100 dark:border-rose-900/50 dark:bg-slate-900 shadow-2xs">
                      <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{selectedCustomer.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                        <span>{tx(lang, 'Previous Due:', 'পূর্বের বাকি:')}</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatBDT(selectedCustomer.currentDue)}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-rose-700 dark:text-rose-400 border-t border-slate-100 pt-1 dark:border-slate-800">
                        <span>{tx(lang, 'Total Due After Sale:', 'বিক্রয়ের পর মোট বকেয়া:')}</span>
                        <span className="font-mono text-sm font-black">
                          {formatBDT(D(selectedCustomer.currentDue).plus(totals.due))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      {tx(lang, 'Customer Full Name', 'ক্রেতার নাম')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={tx(lang, 'e.g. Rahim Mia', 'যেমন: রহিম মিয়া')}
                      value={dueCustName}
                      onChange={(e) => setDueCustName(e.target.value)}
                      className="w-full rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-rose-900/60 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      {tx(lang, 'Mobile Phone Number', 'মোবাইল নম্বর')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01700-000000"
                      value={dueCustPhone}
                      onChange={(e) => setDueCustPhone(e.target.value)}
                      className="w-full rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 dark:border-rose-900/60 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                      {tx(lang, 'Area / Village (Optional)', 'ঠিকানা বা গ্রাম (ঐচ্ছিক)')}
                    </label>
                    <input
                      type="text"
                      placeholder={tx(lang, 'e.g. Purba Para, Ward 4', 'যেমন: পূর্বপাড়া')}
                      value={dueCustArea}
                      onChange={(e) => setDueCustArea(e.target.value)}
                      className="w-full rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs text-slate-900 dark:border-rose-900/60 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    {tx(
                      lang,
                      '✓ Customer will be auto-saved and linked to digital khata immediately.',
                      '✓ বিক্রয় সম্পন্ন হলেই এই ক্রেতার নামে স্বয়ংক্রিয়ভাবে ডিজিটাল খাতা খোলা হবে।'
                    )}
                  </p>
                </div>
              )}

              {/* Expected Payment Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                  {tr('expectedPayDate', lang)} ({tx(lang, 'Optional', 'ঐচ্ছিক')})
                </label>
                <input
                  type="date"
                  value={expectedPaymentDate}
                  onChange={(e) => setExpectedPaymentDate(e.target.value)}
                  className="w-full rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 font-mono text-xs dark:border-rose-900/60 dark:bg-slate-900"
                />
              </div>

              {creditLimitExceeded && (
                <div className="space-y-1.5 text-xs text-rose-700 dark:text-rose-400">
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

          {/* Action Button: Single Click Cash vs Due Sale */}
          <button
            type="button"
            disabled={submitting || cart.length === 0}
            onClick={handleCheckout}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold text-white shadow-md disabled:opacity-50 transition cursor-pointer ${
              totals.isDueSale
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 shadow-rose-600/25 hover:from-rose-700 hover:to-amber-700'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-800'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting
              ? tx(lang, 'Processing...', 'প্রক্রিয়া চলছে...')
              : totals.isDueSale
                ? `${tx(lang, 'Complete Due Sale (বাকি বিক্রয়)', 'বাকি বিক্রয় সম্পন্ন করুন')} · ${formatBDT(totals.grandTotal)}`
                : `${tr('completeSale', lang)} (F9) · ${formatBDT(totals.grandTotal)}`}
          </button>
        </div>
      </div>

      {/* Pro WhatsApp Upgrade Modal (Demo Entry Limit Reached) */}
      {showProUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-emerald-300 bg-white p-6 shadow-2xl dark:border-emerald-800 dark:bg-slate-900 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {tx(lang, '⚡ Demo Trial Limit Reached', '⚡ ডেমো ট্রায়াল সীমা পূর্ণ')}
              </span>
              <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-white">
                {tx(lang, '100 Sample Entries Completed!', '১০০টি পরীক্ষামূলক এন্ট্রি সম্পন্ন হয়েছে!')}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {tx(
                  lang,
                  'You have completed 100 sample trial entries in Mudi Dokan Pro. To unlock unlimited billing, multi-device cloud sync, digital khata SMS, and full store management, upgrade to the Pro edition today.',
                  'আপনি মুদি দোকান প্রো ডেমো স্টোরে ১০০টি সফল ট্রায়াল এন্ট্রি সম্পন্ন করেছেন। আনলিমিটেড লাইভ বিক্রয়, ক্লাউড অটো-সিঙ্ক, ডিজিটাল খাতা এসএমএস ও ফুল ফিচারের জন্য আজই সম্পূর্ণ প্রো ভার্সনে আপগ্রেড করুন।'
                )}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`https://wa.me/8801884700631?text=${encodeURIComponent(
                  lang === 'BN'
                    ? 'হ্যালো মুদি দোকান প্রো, আমি ডেমো ট্রায়াল সম্পন্ন করেছি এবং এখন ফুল প্রো ভার্সন কিনতে/লাইসেন্স নিতে আগ্রহী।'
                    : 'Hello Mudi Dokan Pro, I have completed the demo trial and would like to purchase/upgrade to the Full Pro Version.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-800 transition"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{tx(lang, 'Upgrade on WhatsApp (01884700631)', 'হোয়াটসঅ্যাপে আপগ্রেড করুন (০১৮৮৪ ৭০০ ৬৩১)')}</span>
              </a>
              <button
                type="button"
                onClick={() => setShowProUpgradeModal(false)}
                className="rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
              >
                {tx(lang, 'Close', 'বন্ধ করুন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick-Create Customer Modal */}
      {showQuickCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleQuickCreateCustomer}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {trCompact('Quick Create Customer', 'দ্রুত নতুন ক্রেতা যোগ করুন', lang)}
              </h3>
              <button type="button" onClick={() => setShowQuickCustomer(false)} className="text-slate-400 cursor-pointer">
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
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
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
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
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
                      setNewCust({ ...newCust, customerType: e.target.value as 'REGULAR' | 'VIP' | 'WHOLESALE' | 'OCCASIONAL' })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="REGULAR">{formatStatusLabel('REGULAR', lang)}</option>
                    <option value="VIP">{formatStatusLabel('VIP', lang)}</option>
                    <option value="WHOLESALE">{formatStatusLabel('WHOLESALE', lang)}</option>
                    <option value="OCCASIONAL">{formatStatusLabel('OCCASIONAL', lang)}</option>
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
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950"
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
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuickCustomer(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700 cursor-pointer"
              >
                {tr('cancel', lang)}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-blue-700 cursor-pointer"
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
