import React, { useEffect, useState } from 'react';
import { RefreshCw, Save, ShieldCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import { apiFetch } from '../lib/api';
import { formatDateTimeDhaka, formatBDT } from '../lib/decimal';
import { tr, tx, normalizeLang, formatStatusLabel } from '../lib/i18n';
import { PWAInstallButton } from '../hooks/usePWAInstall';
import { ImageAssetUploader } from '../components/ProductMedia';

export const SettingsPage: React.FC = () => {
  const {
    store,
    settings,
    staff,
    lang,
    setLang,
    pendingOfflineSales,
    isOnline,
    isSyncing,
    syncOfflineQueue,
    switchRole,
    refreshCatalog,
  } = useApp();

  const [storeForm, setStoreForm] = useState({
    name: store?.name || 'MudirDokan Pro',
    nameBn: store?.nameBn || 'মুদির দোকান প্রো',
    phone: store?.phone || '',
    address: store?.address || '',
    addressBn: store?.addressBn || '',
    binNumber: store?.binNumber || '',
    logoUrl: store?.logoUrl || '',
  });

  const [settingsForm, setSettingsForm] = useState({
    languageMode: normalizeLang(settings?.languageMode || lang),
    receiptFormat: settings?.receiptFormat || '80MM',
    receiptHeader: settings?.receiptHeader || '',
    receiptFooter: settings?.receiptFooter || '',
    allowNegativeStock: settings?.allowNegativeStock || false,
    allowCashierPriceEdit: settings?.allowCashierPriceEdit || false,
    allowCashierDiscount: settings?.allowCashierDiscount ?? true,
    allowCashierReports: settings?.allowCashierReports || false,
    smsProvider: settings?.smsProvider || 'WHATSAPP_LINK',
    smsWebhookUrl: settings?.smsWebhookUrl || '',
    smsSenderId: settings?.smsSenderId || 'MudirDokan',
  });

  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/finance/settings')
      .then((res) => {
        if (res.store) setStoreForm({ ...res.store, logoUrl: res.store.logoUrl || '' });
        if (res.settings) {
          setSettingsForm({
            ...res.settings,
            languageMode: normalizeLang(res.settings.languageMode),
          });
        }
        setSyncLogs(res.syncLogs || []);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/finance/settings', {
        method: 'PUT',
        body: JSON.stringify({ store: storeForm, settings: settingsForm }),
      });
      setLang(normalizeLang(settingsForm.languageMode));
      toast.success(tx(lang, 'Store settings saved', 'দোকানের সেটিংস সংরক্ষিত হয়েছে'));
      await refreshCatalog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tx(lang, 'Failed to save settings', 'সেটিংস সংরক্ষণ ব্যর্থ হয়েছে'));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{tr('settings', lang)}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tx(
              lang,
              'Store Profile & Logo · Language · Thermal Receipt Format · Role Permissions · Offline Sync',
              'দোকানের তথ্য ও লোগো · ভাষা · রসিদ ফরম্যাট · ব্যবহারকারী অনুমতি · অফলাইন সিঙ্ক'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <a
            href="/portal"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-slate-800 dark:bg-slate-900 dark:text-indigo-300"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {tx(lang, 'Open Customer Portal', 'ক্রেতা পোর্টাল খুলুন')}
          </a>
        </div>
      </div>

      {/* Role-Based Access Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-extrabold">
            {tx(lang, 'Active Shift Role (Access Control)', 'বর্তমান শিফট ভূমিকা (অ্যাক্সেস কন্ট্রোল)')}
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          {tx(
            lang,
            'Switch active shift role to verify Cashier restrictions (Cashiers cannot view profit reports, cost prices, process returns, or adjust stock unless authorized).',
            'ক্যাশিয়ার সীমাবদ্ধতা যাচাই করতে শিফটের ভূমিকা পরিবর্তন করুন (অনুমতি ছাড়া ক্যাশিয়ার লাভের রিপোর্ট, ক্রয়মূল্য বা স্টক সমন্বয় দেখতে পারেন না)।'
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {(['OWNER', 'MANAGER', 'CASHIER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => switchRole(r)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                staff?.role === r
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {formatStatusLabel(r, lang)}
            </button>
          ))}
        </div>
      </div>

      {/* Store & POS Configuration Form with Store Logo Uploader */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5"
      >
        <h2 className="text-sm font-extrabold">{tx(lang, 'Store Details, Branding Logo & Receipts', 'দোকানের তথ্য, লোগো ও রসিদ সেটিংস')}</h2>

        <ImageAssetUploader
          kind="store"
          value={storeForm.logoUrl || ''}
          onChange={(url) => setStoreForm((s) => ({ ...s, logoUrl: url }))}
          lang={lang}
          label={tx(lang, 'Store Logo (Shown in Sidebar, Receipts & Customer Portal)', 'দোকানের লোগো (সাইডবার, রসিদ ও ক্রেতা পোর্টালে প্রদর্শিত)')}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'Store Name (English)', 'দোকানের নাম (ইংরেজি)')}</label>
            <input
              value={storeForm.name}
              onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'Store Name (Bangla)', 'দোকানের নাম (বাংলা)')}</label>
            <input
              value={storeForm.nameBn}
              onChange={(e) => setStoreForm({ ...storeForm, nameBn: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'Phone', 'মোবাইল নম্বর')}</label>
            <input
              value={storeForm.phone}
              onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'VAT / BIN Number (Optional)', 'ভ্যাট / বিন নম্বর (ঐচ্ছিক)')}</label>
            <input
              value={storeForm.binNumber || ''}
              onChange={(e) => setStoreForm({ ...storeForm, binNumber: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'Address (English)', 'ঠিকানা (ইংরেজি)')}</label>
            <input
              value={storeForm.address}
              onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'Address (Bangla)', 'ঠিকানা (বাংলা)')}</label>
            <input
              value={storeForm.addressBn || ''}
              onChange={(e) => setStoreForm({ ...storeForm, addressBn: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'Default Language', 'ডিফল্ট ভাষা')}</label>
            <select
              value={settingsForm.languageMode}
              onChange={(e) => {
                const next = normalizeLang(e.target.value);
                setSettingsForm({ ...settingsForm, languageMode: next });
                setLang(next);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="EN">English</option>
              <option value="BN">বাংলা</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">{tx(lang, 'Default Paper Format', 'ডিফল্ট রসিদ সাইজ')}</label>
            <select
              value={settingsForm.receiptFormat}
              onChange={(e) => setSettingsForm({ ...settingsForm, receiptFormat: e.target.value as any })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="58MM">{tx(lang, '58mm Thermal Printer', '৫৮মিমি থার্মাল প্রিন্টার')}</option>
              <option value="80MM">{tx(lang, '80mm Thermal Printer', '৮০মিমি থার্মাল প্রিন্টার')}</option>
              <option value="A4">{tx(lang, 'A4 Full Invoice', 'এ৪ পূর্ণ রসিদ')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.allowNegativeStock}
              onChange={(e) => setSettingsForm({ ...settingsForm, allowNegativeStock: e.target.checked })}
            />
            <span>{tx(lang, 'Allow Negative Stock Sales', 'শূন্য স্টকের নিচে বিক্রয় অনুমোদন')}</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.allowCashierPriceEdit}
              onChange={(e) => setSettingsForm({ ...settingsForm, allowCashierPriceEdit: e.target.checked })}
            />
            <span>{tx(lang, 'Allow Cashier to Edit Selling Price', 'ক্যাশিয়ারকে বিক্রয়মূল্য পরিবর্তনের অনুমতি')}</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.allowCashierDiscount}
              onChange={(e) => setSettingsForm({ ...settingsForm, allowCashierDiscount: e.target.checked })}
            />
            <span>{tx(lang, 'Allow Cashier to Apply Discounts', 'ক্যাশিয়ারকে ছাড় দেওয়ার অনুমতি')}</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={settingsForm.allowCashierReports}
              onChange={(e) => setSettingsForm({ ...settingsForm, allowCashierReports: e.target.checked })}
            />
            <span>{tx(lang, 'Allow Cashier to View Profit Reports', 'ক্যাশিয়ারকে লাভের রিপোর্ট দেখার অনুমতি')}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-500">
              {tx(lang, 'Customer Reminder & OTP Delivery Channel', 'ক্রেতা রিমাইন্ডার ও ওটিপি মাধ্যম')}
            </label>
            <select
              value={settingsForm.smsProvider}
              onChange={(e) => setSettingsForm({ ...settingsForm, smsProvider: e.target.value as any })}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="WHATSAPP_LINK">
                {tx(lang, 'WhatsApp Direct Link + Shopkeeper OTP Relay', 'হোয়াটসঅ্যাপ লিংক ও দোকানদার ওটিপি রিলে')}
              </option>
              <option value="WEBHOOK">{tx(lang, 'Approved SMS / WhatsApp API Webhook', 'এসএমএস / হোয়াটসঅ্যাপ এপিআই ওয়েববুক')}</option>
              <option value="NONE">{tx(lang, 'Disabled', 'নিষ্ক্রিয়')}</option>
            </select>
          </div>
          {settingsForm.smsProvider === 'WEBHOOK' && (
            <div>
              <label className="text-xs font-semibold text-slate-500">
                {tx(lang, 'SMS / WhatsApp Provider Webhook URL', 'এসএমএস / হোয়াটসঅ্যাপ ওয়েববুক ইউআরএল')}
              </label>
              <input
                placeholder="https://api.your-bd-sms-gateway.com/send"
                value={settingsForm.smsWebhookUrl || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, smsWebhookUrl: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          )}
        </div>

        {staff?.role !== 'CASHIER' && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-indigo-700 hover:to-blue-700 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              {tx(lang, 'Save Store Settings', 'সেটিংস সংরক্ষণ করুন')}
            </button>
          </div>
        )}
      </form>

      {/* Offline Sales Queue & Sync Audit Log */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold">{tx(lang, 'Offline Sales Queue & Cloud Sync Log', 'অফলাইন বিক্রয় কিউ ও সিঙ্ক লগ')}</h2>
            <p className="text-xs text-slate-500">
              {tx(lang, 'Connection:', 'সংযোগ:')}{' '}
              <strong>{isOnline ? tx(lang, 'Online', 'অনলাইন') : tx(lang, 'Offline', 'অফলাইন')}</strong> ·{' '}
              {tx(lang, 'Pending Local Queue:', 'অপেক্ষমাণ অফলাইন বিল:')}{' '}
              <strong className="font-mono">{pendingOfflineSales.length}</strong>
            </p>
          </div>
          <button
            type="button"
            disabled={!isOnline || isSyncing}
            onClick={syncOfflineQueue}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {tx(lang, 'Sync Now', 'এখনই সিঙ্ক করুন')}
          </button>
        </div>

        {pendingOfflineSales.length > 0 && (
          <div className="space-y-2">
            {pendingOfflineSales.map((q) => (
              <div
                key={q.clientTransactionUuid}
                className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50/60 p-3 text-xs dark:border-orange-900/50 dark:bg-orange-950/20"
              >
                <div>
                  <div className="font-mono font-bold">
                    {q.localInvoiceNumber} · {formatStatusLabel(q.status, lang)}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    UUID: {q.clientTransactionUuid.slice(0, 12)} · {tx(lang, 'Total', 'মোট')}{' '}
                    {formatBDT(q.payload.computedTotal)}
                    {q.errorMessage ? ` · ${tx(lang, 'Error:', 'ত্রুটি:')} ${q.errorMessage}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {syncLogs.length > 0 && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="py-1.5 pr-3">{tx(lang, 'Time', 'সময়')}</th>
                  <th className="py-1.5 pr-3">UUID</th>
                  <th className="py-1.5 pr-3">{tx(lang, 'Status', 'অবস্থা')}</th>
                  <th className="py-1.5">{tx(lang, 'Details', 'বিবরণ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {syncLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-1.5 pr-3 font-mono text-[11px] text-slate-500">{formatDateTimeDhaka(l.createdAt)}</td>
                    <td className="py-1.5 pr-3 font-mono text-[11px]">{l.clientTransactionUuid.slice(0, 12)}</td>
                    <td className="py-1.5 pr-3 text-[11px] font-semibold">{formatStatusLabel(l.status, lang)}</td>
                    <td className="py-1.5 text-slate-600 dark:text-slate-400">{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
