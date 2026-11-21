import React, { useEffect, useState } from 'react';
import { Plus, Trash2, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { D, money, formatBDT, formatDateDDMMYYYY, formatQty, dhakaTodayISO } from '../lib/decimal';
import { tr, trCompact, tx, formatMethodLabel, formatStatusLabel, formatUnitLabel } from '../lib/i18n';

interface PurchaseLine {
  productId: number;
  purchaseUnit: string;
  conversionFactor: string;
  enteredQty: string;
  unitCostEntered: string;
  expiryDate: string;
}

export const PurchasesPage: React.FC = () => {
  const { products, lang, staff, refreshCatalog } = useApp();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [supplierId, setSupplierId] = useState<number>(0);
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(dhakaTodayISO());
  const [transportCost, setTransportCost] = useState('0');
  const [otherCost, setOtherCost] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK'>('CASH');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);

  const loadData = async () => {
    try {
      const [pRes, sRes] = await Promise.all([apiFetch('/api/purchases'), apiFetch('/api/purchases/suppliers')]);
      setPurchases(pRes);
      setSuppliers(sRes);
      if (sRes.length > 0 && supplierId === 0) setSupplierId(sRes[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to load purchases', 'ক্রয় তালিকা লোড ব্যর্থ হয়েছে'));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addLine = () => {
    const prod = products[0];
    if (!prod) return;
    const defaultPack = prod.units?.find((u) => u.isPurchaseDefault) || prod.units?.[0];
    setLines((prev) => [
      ...prev,
      {
        productId: prod.id,
        purchaseUnit: defaultPack ? defaultPack.unitName : prod.baseUnit,
        conversionFactor: defaultPack ? formatQty(defaultPack.conversionFactor) : '1',
        enteredQty: '1',
        unitCostEntered: defaultPack
          ? money(D(prod.avgCostPrice).times(D(defaultPack.conversionFactor)))
          : money(prod.avgCostPrice),
        expiryDate: '',
      },
    ]);
  };

  const handleProductChange = (idx: number, prodId: number) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const defaultPack = prod.units?.find((u) => u.isPurchaseDefault) || prod.units?.[0];
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              productId: prod.id,
              purchaseUnit: defaultPack ? defaultPack.unitName : prod.baseUnit,
              conversionFactor: defaultPack ? formatQty(defaultPack.conversionFactor) : '1',
              unitCostEntered: defaultPack
                ? money(D(prod.avgCostPrice).times(D(defaultPack.conversionFactor)))
                : money(prod.avgCostPrice),
            }
          : l
      )
    );
  };

  const subtotal = lines.reduce((acc, l) => acc.plus(D(l.enteredQty).times(D(l.unitCostEntered))), D(0));
  const totalAmount = subtotal.plus(D(transportCost)).plus(D(otherCost)).minus(D(discount));
  const dueAmount = totalAmount.minus(D(paidAmount));

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || lines.length === 0) {
      toast.error(tx(lang, 'Select a supplier and add at least one product line', 'সরবরাহকারী নির্বাচন করুন এবং অন্তত একটি পণ্য যোগ করুন'));
      return;
    }
    try {
      await apiFetch('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplierId,
          supplierInvoiceNo,
          purchaseDate,
          transportCost,
          otherCost,
          discount,
          paidAmount,
          paymentMethod,
          notes,
          items: lines,
        }),
      });
      toast.success(
        tx(lang, 'Purchase recorded — stock & weighted average costs updated', 'ক্রয় সংরক্ষিত হয়েছে — স্টক ও গড় ক্রয়মূল্য আপডেট হয়েছে')
      );
      setShowForm(false);
      setLines([]);
      setTransportCost('0');
      setOtherCost('0');
      setDiscount('0');
      setPaidAmount('0');
      setNotes('');
      await Promise.all([loadData(), refreshCatalog()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to save purchase', 'ক্রয় সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  };

  const handleReturnPurchase = async (id: number, invoiceNumber: string) => {
    const reason = window.prompt(
      tx(lang, `Reason for returning purchase ${invoiceNumber}:`, `ক্রয় বিল ${invoiceNumber} ফেরতের কারণ:`),
      tx(lang, 'Damaged stock returned', 'নষ্ট পণ্য ফেরত দেওয়া হয়েছে')
    );
    if (!reason) return;
    try {
      await apiFetch(`/api/purchases/${id}/return`, { method: 'POST', body: JSON.stringify({ reason }) });
      toast.success(tx(lang, 'Purchase returned and supplier balance adjusted', 'ক্রয় ফেরত এবং সরবরাহকারীর ব্যালেন্স সমন্বয় হয়েছে'));
      await Promise.all([loadData(), refreshCatalog()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Return failed', 'ফেরত প্রক্রিয়া ব্যর্থ হয়েছে'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{tr('purchases', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Distributor stock-in with Carton/Sack unit conversion & automatic Weighted Average Cost calculation',
              'কার্টন বা বস্তা থেকে মূল এককে রূপান্তর এবং স্বয়ংক্রিয় গড় ক্রয়মূল্য হিসাবসহ পণ্য ক্রয়'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            if (lines.length === 0) addLine();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          {tx(lang, 'New Distributor Purchase', 'নতুন পণ্য ক্রয়')}
        </button>
      </div>

      {/* Purchases Table */}
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Invoice #', 'রসিদ নং')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Date', 'তারিখ')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Supplier', 'সরবরাহকারী')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Items Summary', 'পণ্যের বিবরণ')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Total', 'মোট')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Paid', 'পরিশোধ')}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Due', 'বাকি')}</th>
                <th className="px-4 py-2.5 font-semibold">{tx(lang, 'Status', 'অবস্থা')}</th>
                {staff?.role !== 'CASHIER' && (
                  <th className="px-4 py-2.5 text-right font-semibold">{tx(lang, 'Action', 'কার্যক্রম')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                    {p.invoiceNumber}
                    {p.supplierInvoiceNo && (
                      <div className="text-[10px] text-slate-400">
                        {tx(lang, 'Ref:', 'চালান:')} {p.supplierInvoiceNo}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{formatDateDDMMYYYY(p.purchaseDate)}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{p.supplierName}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {(p.items || [])
                      .map(
                        (i: any) =>
                          `${i.productName} (${formatQty(i.enteredQty)} ${formatUnitLabel(i.purchaseUnit, lang)} = ${formatQty(
                            i.baseQty
                          )})`
                      )
                      .join(', ')}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatBDT(p.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-emerald-700">{formatBDT(p.paidAmount)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-amber-700">{formatBDT(p.dueAmount)}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{formatStatusLabel(p.status, lang)}</td>
                  {staff?.role !== 'CASHIER' && (
                    <td className="px-4 py-2.5 text-right">
                      {p.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => handleReturnPurchase(p.id, p.invoiceNumber)}
                          className="inline-flex items-center gap-1 text-red-600 hover:underline cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {tx(lang, 'Return', 'ফেরত')}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    {tx(
                      lang,
                      'No distributor purchases recorded yet. Click "New Distributor Purchase" to stock in items.',
                      'এখনো কোনো ক্রয় রেকর্ড হয়নি। স্টক তুলতে "নতুন পণ্য ক্রয়" বাটনে ক্লিক করুন।'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <form
            onSubmit={handleSavePurchase}
            className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4 my-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {tx(lang, 'Record Distributor Purchase', 'নতুন পণ্য ক্রয় এন্ট্রি')}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Supplier *', 'সরবরাহকারী *')}
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({tx(lang, 'Due:', 'বাকি:')} {formatBDT(s.currentDue)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Distributor Invoice #', 'চালান / বিল নম্বর')}
                </label>
                <input
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  placeholder={tx(lang, 'Optional challan no', 'চালান নম্বর (ঐচ্ছিক)')}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {tx(lang, 'Purchase Date', 'ক্রয়ের তারিখ')}
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {tx(
                    lang,
                    'Purchased Items (Supports Carton/Sack to Base Piece Conversion)',
                    'ক্রয়কৃত পণ্য (কার্টন/বস্তা থেকে মূল এককে রূপান্তর)'
                  )}
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> {tx(lang, 'Add Row', 'নতুন সারি')}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lines.map((line, idx) => {
                  const prod = products.find((p) => p.id === line.productId);
                  const baseQty = D(line.enteredQty).times(D(line.conversionFactor));
                  const lineTotal = D(line.enteredQty).times(D(line.unitCostEntered));
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-end rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"
                    >
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-500">{tx(lang, 'Product', 'পণ্য')}</label>
                        <select
                          value={line.productId}
                          onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                          className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {trCompact(p.name, p.nameBn, lang)} ({p.variant})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500">{tx(lang, 'Purchase Unit', 'ক্রয় একক')}</label>
                        <input
                          value={line.purchaseUnit}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, purchaseUnit: e.target.value } : l))
                            )
                          }
                          className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] text-slate-500">{tx(lang, '× Base', '× একক')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.conversionFactor}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, conversionFactor: e.target.value } : l))
                            )
                          }
                          className="w-full rounded border border-slate-200 px-2 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-[10px] text-slate-500">{tx(lang, 'Qty', 'পরিমাণ')}</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.enteredQty}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, enteredQty: e.target.value } : l))
                            )
                          }
                          className="w-full rounded border border-slate-200 px-2 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-500">
                          {tx(lang, `Cost / ${line.purchaseUnit} (৳)`, `দর / ${formatUnitLabel(line.purchaseUnit, lang)} (৳)`)}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitCostEntered}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, unitCostEntered: e.target.value } : l))
                            )
                          }
                          className="w-full rounded border border-slate-200 px-2 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between gap-1 pb-1">
                        <div className="text-right">
                          <div className="font-mono text-xs font-bold">{formatBDT(lineTotal)}</div>
                          <div className="text-[10px] text-emerald-700">
                            +{formatQty(baseQty)} {formatUnitLabel(prod?.baseUnit, lang)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Costs & Payment */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 border-t border-slate-200 pt-3 dark:border-slate-800">
              <div>
                <label className="text-[11px] text-slate-500">{tx(lang, 'Transport Cost (৳)', 'পরিবহন খরচ (৳)')}</label>
                <input
                  type="number"
                  value={transportCost}
                  onChange={(e) => setTransportCost(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">{tx(lang, 'Other Cost (৳)', 'অন্যান্য খরচ (৳)')}</label>
                <input
                  type="number"
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">{tx(lang, 'Discount (৳)', 'ছাড় (৳)')}</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">{tx(lang, 'Paid Now (৳)', 'নগদ পরিশোধ (৳)')}</label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500">{tx(lang, 'Method', 'মাধ্যম')}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  {(['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK'] as const).map((m) => (
                    <option key={m} value={m}>
                      {formatMethodLabel(m, lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">
              <div className="flex items-center gap-6 font-mono">
                <span>
                  {tx(lang, 'Total:', 'মোট:')} <strong>{formatBDT(totalAmount)}</strong>
                </span>
                <span>
                  {tx(lang, 'Paid:', 'পরিশোধ:')} <strong className="text-emerald-700">{formatBDT(paidAmount)}</strong>
                </span>
                <span>
                  {tx(lang, 'Supplier Due:', 'বাকি:')} <strong className="text-red-600">{formatBDT(dueAmount)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-xs">
                  {tr('cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  {tx(lang, 'Save Purchase & Update Stock', 'ক্রয় সংরক্ষণ ও স্টক আপডেট')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
