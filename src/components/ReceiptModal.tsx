import React, { useState } from 'react';
import { Printer, X, MessageSquare } from 'lucide-react';
import { formatBDT, formatDateDDMMYYYY, formatQty } from '../lib/decimal';
import { useApp, type StoreInfo, type StoreSettingsInfo } from '../context/AppContext';
import { tx, trCompact, formatMethodLabel, formatUnitLabel, formatVariant } from '../lib/i18n';

export interface PrintableSaleReceipt {
  type: 'SALE';
  invoiceNumber: string;
  saleDate: string;
  customerName?: string | null;
  customerPhone?: string | null;
  expectedPaymentDate?: string | null;
  isOffline?: boolean;
  items: Array<{
    productName: string;
    variant?: string;
    unitName: string;
    enteredQty: string | number;
    unitSellingPrice: string | number;
    itemDiscount?: string | number;
    lineTotal: string | number;
  }>;
  subtotal: string | number;
  discount: string | number;
  totalAmount: string | number;
  paidAmount: string | number;
  dueAmount: string | number;
  customerTotalDue?: string | number;
  payments: Array<{ method: string; amount: string | number }>;
}

export interface PrintablePaymentReceipt {
  type: 'PAYMENT';
  receiptNumber: string;
  paymentDate: string;
  customerName: string;
  customerCode: string;
  customerPhone: string;
  amount: string | number;
  paymentMethod: string;
  previousDue?: string | number;
  remainingDue: string | number;
  remarks?: string;
  allocations?: Array<{ invoiceNumber: string; allocatedAmount: string | number }>;
}

export type PrintableReceipt = PrintableSaleReceipt | PrintablePaymentReceipt;

export const ReceiptModal: React.FC<{
  receipt: PrintableReceipt;
  store: StoreInfo | null;
  settings: StoreSettingsInfo | null;
  onClose: () => void;
}> = ({ receipt, store, settings, onClose }) => {
  const { lang } = useApp();
  const [paperSize, setPaperSize] = useState<'58MM' | '80MM' | 'A4'>(settings?.receiptFormat || '80MM');

  const widthClass =
    paperSize === '58MM' ? 'max-w-[260px] text-[11px]' : paperSize === '80MM' ? 'max-w-[340px] text-xs' : 'max-w-[680px] text-sm';

  const handlePrint = () => {
    window.print();
  };

  const storeTitle = store
    ? trCompact(store.name, store.nameBn, lang)
    : tx(lang, 'MudirDokan Pro', 'মুদি দোকান প্রো');
  const storeAddress = store ? trCompact(store.address, store.addressBn, lang) : '';

  const whatsappShareUrl = (() => {
    const phone = receipt.customerPhone?.replace(/[^0-9]/g, '');
    if (!phone) return null;
    const bdPhone = phone.startsWith('88') ? phone : `88${phone}`;
    if (receipt.type === 'SALE') {
      const msg =
        lang === 'BN'
          ? `${storeTitle}\nইনভয়েস: ${receipt.invoiceNumber}\nতারিখ: ${formatDateDDMMYYYY(
              receipt.saleDate
            )}\nমোট বিল: ${formatBDT(receipt.totalAmount)}\nপরিশোধ: ${formatBDT(
              receipt.paidAmount
            )}\nবাকি: ${formatBDT(receipt.dueAmount)}`
          : `${storeTitle}\nInvoice: ${receipt.invoiceNumber}\nDate: ${formatDateDDMMYYYY(
              receipt.saleDate
            )}\nTotal: ${formatBDT(receipt.totalAmount)}\nPaid: ${formatBDT(
              receipt.paidAmount
            )}\nDue: ${formatBDT(receipt.dueAmount)}`;
      return `https://wa.me/${bdPhone}?text=${encodeURIComponent(msg)}`;
    }
    const msg =
      lang === 'BN'
        ? `${storeTitle}\nপেমেন্ট রসিদ: ${receipt.receiptNumber}\nজমা: ${formatBDT(
            receipt.amount
          )} (${formatMethodLabel(receipt.paymentMethod, lang)})\nঅবশিষ্ট বাকি: ${formatBDT(
            receipt.remainingDue
          )}`
        : `${storeTitle}\nPayment Receipt: ${receipt.receiptNumber}\nPaid: ${formatBDT(
            receipt.amount
          )} (${formatMethodLabel(receipt.paymentMethod, lang)})\nRemaining Due: ${formatBDT(
            receipt.remainingDue
          )}`;
    return `https://wa.me/${bdPhone}?text=${encodeURIComponent(msg)}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {tx(lang, 'Receipt Preview', 'রসিদ প্রিভিউ')}
            </span>
            <div className="ml-2 flex items-center rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              {(['58MM', '80MM', 'A4'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPaperSize(sz)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    paperSize === sz
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {whatsappShareUrl && (
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {tx(lang, 'WhatsApp', 'হোয়াটসঅ্যাপ')}
              </a>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              {tx(lang, 'Print', 'প্রিন্ট')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-center bg-slate-100 p-6 dark:bg-slate-950 overflow-x-auto">
          <div
            className={`printable-area w-full ${widthClass} bg-white p-5 text-slate-900 shadow-sm border border-slate-200`}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3">
              {store?.logoUrl && (
                <img
                  src={store.logoUrl}
                  alt={storeTitle}
                  className="mx-auto mb-1.5 h-10 max-w-[120px] object-contain"
                />
              )}
              <div className="text-base font-bold tracking-tight">{storeTitle}</div>
              {storeAddress && <div className="mt-0.5 text-[11px] text-slate-600">{storeAddress}</div>}
              {store?.phone && (
                <div className="text-[11px] text-slate-600">
                  {tx(lang, 'Tel:', 'ফোন:')} {store.phone}
                </div>
              )}
              {store?.binNumber && (
                <div className="text-[10px] text-slate-500">
                  {tx(lang, 'BIN:', 'বিন:')} {store.binNumber}
                </div>
              )}
            </div>

            {receipt.type === 'SALE' ? (
              <>
                <div className="mt-2.5 flex justify-between text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div>
                    <div>
                      <strong>{tx(lang, 'Invoice:', 'রসিদ নং:')}</strong>{' '}
                      <span className="font-mono">{receipt.invoiceNumber}</span>
                    </div>
                    <div>
                      <strong>{tx(lang, 'Customer:', 'ক্রেতা:')}</strong>{' '}
                      {receipt.customerName || tx(lang, 'Walk-in Cash', 'সাধারণ ক্রেতা')}
                    </div>
                    {receipt.customerPhone && <div className="font-mono">{receipt.customerPhone}</div>}
                  </div>
                  <div className="text-right">
                    <div>{formatDateDDMMYYYY(receipt.saleDate)}</div>
                    {receipt.isOffline && (
                      <div className="font-semibold text-amber-700">
                        {tx(lang, 'Offline Queued', 'অফলাইনে সংরক্ষিত')}
                      </div>
                    )}
                  </div>
                </div>

                <table className="mt-2 w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-400 text-left text-[11px]">
                      <th className="py-1">{tx(lang, 'Item', 'পণ্য')}</th>
                      <th className="py-1 text-right">{tx(lang, 'Qty', 'পরিমাণ')}</th>
                      <th className="py-1 text-right">{tx(lang, 'Rate', 'দর')}</th>
                      <th className="py-1 text-right">{tx(lang, 'Total', 'মোট')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dotted divide-slate-300">
                    {receipt.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1 pr-1">
                          <div className="font-medium leading-tight">{item.productName}</div>
                          {item.variant && <div className="text-[10px] text-slate-500">{formatVariant(item.variant, lang)}</div>}
                        </td>
                        <td className="py-1 text-right font-mono whitespace-nowrap">
                          {formatQty(item.enteredQty, lang)} {formatUnitLabel(item.unitName, lang)}
                        </td>
                        <td className="py-1 text-right font-mono whitespace-nowrap">
                          {formatBDT(item.unitSellingPrice, lang)}
                        </td>
                        <td className="py-1 text-right font-mono font-semibold whitespace-nowrap">
                          {formatBDT(item.lineTotal, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-3 border-t border-dashed border-slate-400 pt-2 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>{tx(lang, 'Subtotal:', 'উপমোট:')}</span>
                    <span>{formatBDT(receipt.subtotal, lang)}</span>
                  </div>
                  {Number(receipt.discount) > 0 && (
                    <div className="flex justify-between">
                      <span>{tx(lang, 'Discount:', 'ছাড়:')}</span>
                      <span>-{formatBDT(receipt.discount, lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-slate-300 pt-1">
                    <span>{tx(lang, 'Grand Total:', 'সর্বমোট:')}</span>
                    <span>{formatBDT(receipt.totalAmount, lang)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tx(lang, 'Paid Amount:', 'পরিশোধিত:')}</span>
                    <span>{formatBDT(receipt.paidAmount, lang)}</span>
                  </div>
                  {Number(receipt.dueAmount) > 0 && (
                    <div className="flex justify-between font-bold text-red-700">
                      <span>{tx(lang, 'Current Due:', 'চলতি বাকি:')}</span>
                      <span>{formatBDT(receipt.dueAmount, lang)}</span>
                    </div>
                  )}
                  {receipt.customerTotalDue !== undefined && Number(receipt.customerTotalDue) > 0 && (
                    <div className="flex justify-between font-black text-rose-800 border-t border-slate-300 pt-0.5">
                      <span>{tx(lang, 'Total Outstanding Due:', 'মোট সর্বমোট বকেয়া:')}</span>
                      <span>{formatBDT(receipt.customerTotalDue, lang)}</span>
                    </div>
                  )}
                  {receipt.expectedPaymentDate && (
                    <div className="flex justify-between text-[11px]">
                      <span>{tx(lang, 'Expected Pay Date:', 'সম্ভাব্য পরিশোধ তারিখ:')}</span>
                      <span>{formatDateDDMMYYYY(receipt.expectedPaymentDate)}</span>
                    </div>
                  )}
                </div>

                {receipt.payments.length > 0 && (
                  <div className="mt-2 border-t border-dotted border-slate-300 pt-1.5 text-[11px]">
                    <span className="font-semibold">{tx(lang, 'Payment:', 'পেমেন্ট:')} </span>
                    {receipt.payments.map((p, idx) => (
                      <span key={idx} className="mr-2 font-mono">
                        {formatMethodLabel(p.method, lang)} {formatBDT(p.amount)}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mt-2.5 text-center font-bold uppercase tracking-wide text-xs">
                  {tx(lang, 'Payment Receipt', 'বাকি আদায়ের রসিদ')}
                </div>
                <div className="mt-2 space-y-1 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                  <div className="flex justify-between">
                    <span>{tx(lang, 'Receipt No:', 'রসিদ নং:')}</span>
                    <span className="font-mono font-semibold">{receipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tx(lang, 'Date:', 'তারিখ:')}</span>
                    <span className="font-mono">{formatDateDDMMYYYY(receipt.paymentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tx(lang, 'Customer:', 'ক্রেতা:')}</span>
                    <span className="font-semibold">
                      {receipt.customerName} ({receipt.customerCode})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tx(lang, 'Phone:', 'মোবাইল:')}</span>
                    <span className="font-mono">{receipt.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tx(lang, 'Method:', 'মাধ্যম:')}</span>
                    <span className="font-semibold">{formatMethodLabel(receipt.paymentMethod, lang)}</span>
                  </div>
                </div>

                {receipt.allocations && receipt.allocations.length > 0 && (
                  <div className="mt-2 border-b border-dashed border-slate-300 pb-2 text-[11px]">
                    <div className="font-semibold mb-1">
                      {tx(lang, 'Invoice Allocation:', 'সমন্বয়কৃত বিল:')}
                    </div>
                    {receipt.allocations.map((a, idx) => (
                      <div key={idx} className="flex justify-between font-mono">
                        <span>{a.invoiceNumber}</span>
                        <span>{formatBDT(a.allocatedAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 space-y-1 font-mono">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{tx(lang, 'Amount Received:', 'জমা:')}</span>
                    <span>{formatBDT(receipt.amount, lang)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>{tx(lang, 'Remaining Due:', 'অবশিষ্ট বাকি:')}</span>
                    <span>{formatBDT(receipt.remainingDue, lang)}</span>
                  </div>
                  {receipt.remarks && (
                    <div className="text-[11px] font-sans text-slate-600 pt-1">
                      {tx(lang, 'Note:', 'মন্তব্য:')} {receipt.remarks}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mt-4 border-t border-dashed border-slate-400 pt-2 text-center text-[10px] text-slate-600">
              <div>
                {settings?.receiptHeader ||
                  tx(lang, 'Thank you for shopping with us!', 'ধন্যবাদ, আবার আসবেন!')}
              </div>
              <div className="mt-0.5">{settings?.receiptFooter}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
