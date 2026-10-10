'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/admin/demos/shared';
import ClientPicker from '@/components/admin/ClientPicker';
import { apiRequest } from '@/lib/demo-system';
import { useInvoicePdf } from '@/hooks/useInvoicePdf';
import {
  INVOICE_STATUSES,
  describeError,
  formatDay,
  formatMoney,
  todayInColombia,
  type AdminProjectView,
  type ClientAccount,
  type Currency,
  type InvoiceStatus,
  type InvoiceView,
} from '@/lib/portal';
import { BanknotesIcon, DocumentArrowDownIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUS_VARIANT: Record<InvoiceStatus, 'secondary' | 'warning' | 'success' | 'danger'> = {
  draft: 'secondary',
  pending: 'warning',
  overdue: 'danger',
  paid: 'success',
  cancelled: 'secondary',
};

type Line = { description: string; quantity: string; unitPrice: string };
const emptyLine = (): Line => ({ description: '', quantity: '1', unitPrice: '' });

function AdminInvoicesInner() {
  const t = useTranslations('adminInvoicesPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { download, downloading } = useInvoicePdf();
  const [invoices, setInvoices] = useState<InvoiceView[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [paying, setPaying] = useState<InvoiceView | null>(null);
  const [payMethod, setPayMethod] = useState('transferencia');
  const [payRef, setPayRef] = useState('');
  const [cancelling, setCancelling] = useState<InvoiceView | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [creating, setCreating] = useState(false);

  const errorTexts = { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (query) params.set('q', query);
      const data = await apiRequest<InvoiceView[]>(`/admin/invoices${params.toString() ? `?${params}` : ''}`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      setInvoices([]);
      setLoadError(describeError(err, locale, errorTexts));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, query, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const registerPayment = async () => {
    if (!paying) return;
    try {
      await apiRequest(`/invoices/${paying.id}/pay`, { method: 'POST', body: { paymentMethod: payMethod, transactionId: payRef.trim() || undefined } });
      toast.success(t('paymentRegistered'));
      setPaying(null);
      setPayRef('');
      await load();
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    }
  };

  const cancelInvoice = async () => {
    if (!cancelling) return;
    if (cancelReason.trim().length < 3) {
      toast.error(t('cancelReasonRequired'));
      return;
    }
    try {
      await apiRequest(`/invoices/${cancelling.id}/cancel`, { method: 'POST', body: { motivo: cancelReason.trim() } });
      toast.success(t('cancelled'));
      setCancelling(null);
      setCancelReason('');
      await load();
    } catch (err) {
      toast.error(describeError(err, locale, errorTexts));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('newInvoice')}
          </Button>
        </div>

        <Card variant="bordered">
          <CardContent className="p-4 space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(search.trim());
              }}
            >
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  aria-label={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                />
              </div>
              <Button type="submit" size="sm">
                {tc('search')}
              </Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {(['all', ...INVOICE_STATUSES] as const).map((s) => (
                <Button key={s} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => setStatus(s)} aria-pressed={status === s}>
                  {s === 'all' ? t('filterAll') : tc(`invoiceStatus.${s}`)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : loadError ? (
          <Card variant="bordered">
            <CardContent className="p-10 text-center" role="alert">
              <p className="text-red-600 dark:text-red-400 mb-4">{loadError}</p>
              <Button variant="outline" onClick={() => void load()}>
                {tc('retry')}
              </Button>
            </CardContent>
          </Card>
        ) : invoices.length === 0 ? (
          <Card variant="bordered">
            <CardContent className="p-10 text-center">
              <BanknotesIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-700 dark:text-secondary-300 font-medium">{query || status !== 'all' ? t('noResults') : t('empty')}</p>
              {!query && status === 'all' && <p className="text-sm text-secondary-500 mt-1">{t('emptyHint')}</p>}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <Card key={inv.id} variant="bordered" data-invoice={inv.invoiceNumber}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{inv.invoiceNumber}</h3>
                        <Badge variant={STATUS_VARIANT[inv.status]} size="sm" data-status={inv.status}>
                          {tc(`invoiceStatus.${inv.status}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 break-words">
                        {inv.client.name} · {inv.client.email}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {[inv.projectName ? t('project', { name: inv.projectName }) : null, inv.orderId ? t('order', { id: inv.orderId }) : null].filter(Boolean).join(' · ') ||
                          t('noProject')}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {t('dates', { issued: formatDay(inv.issueDate, locale), due: formatDay(inv.dueDate, locale) })}
                        {inv.paidDate ? ` · ${t('paidOn', { date: formatDay(inv.paidDate, locale) })}` : ''}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-secondary-900 dark:text-white">{formatMoney(inv.total, inv.currency, locale)}</p>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => void download(inv.id)} isLoading={downloading === inv.id}>
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      {t('downloadPdf')}
                    </Button>
                    {(inv.status === 'pending' || inv.status === 'overdue') && (
                      <>
                        <Button size="sm" onClick={() => setPaying(inv)}>
                          {t('registerPayment')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setCancelling(inv)}>
                          {t('cancelInvoice')}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {paying && (
          <ConfirmDialog
            title={t('registerPaymentTitle', { number: paying.invoiceNumber })}
            message={t('registerPaymentHelp', { amount: formatMoney(paying.total, paying.currency, locale) })}
            confirmLabel={t('registerPayment')}
            cancelLabel={tc('cancel')}
            onConfirm={registerPayment}
            onClose={() => setPaying(null)}
          >
            <div className="space-y-3">
              <div>
                <label htmlFor="pay-method" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  {t('paymentMethod')}
                </label>
                <select
                  id="pay-method"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                >
                  {(['transferencia', 'consignacion', 'tarjeta', 'efectivo', 'otro'] as const).map((m) => (
                    <option key={m} value={m}>
                      {t(`methods.${m}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="pay-ref" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                  {t('paymentReference')}
                </label>
                <input
                  id="pay-ref"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
                />
              </div>
            </div>
          </ConfirmDialog>
        )}

        {cancelling && (
          <ConfirmDialog
            title={t('cancelTitle', { number: cancelling.invoiceNumber })}
            message={t('cancelHelp')}
            confirmLabel={t('cancelInvoice')}
            cancelLabel={tc('cancel')}
            danger
            onConfirm={cancelInvoice}
            onClose={() => setCancelling(null)}
          >
            <label htmlFor="cancel-reason" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('cancelReason')}
            </label>
            <textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={300}
              className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
            />
          </ConfirmDialog>
        )}

        {creating && (
          <NewInvoiceModal
            onClose={() => setCreating(false)}
            onCreated={async (number) => {
              setCreating(false);
              toast.success(t('issued', { number }));
              await load();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

/** Emitir una factura a nombre de un cliente (con proyecto opcional). */
function NewInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (number: string) => void | Promise<void> }) {
  const t = useTranslations('adminInvoicesPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [client, setClient] = useState<ClientAccount | null>(null);
  const [projects, setProjects] = useState<AdminProjectView[]>([]);
  const [projectId, setProjectId] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [currency, setCurrency] = useState<Currency>('COP');
  const [tax, setTax] = useState('19');
  const [dueDate, setDueDate] = useState(todayInColombia(15));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setProjectId('');
    if (!client) {
      setProjects([]);
      return;
    }
    apiRequest<AdminProjectView[]>(`/admin/projects?clientId=${client.id}`)
      .then((rows) => setProjects(Array.isArray(rows) ? rows : []))
      .catch(() => setProjects([]));
  }, [client]);

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const taxRate = Math.min(100, Math.max(0, Number(tax) || 0)) / 100;

  const submit = async () => {
    setError('');
    const items = lines
      .filter((l) => l.description.trim())
      .map((l) => ({ description: l.description.trim(), quantity: Math.round(Number(l.quantity)), unitPrice: Number(l.unitPrice) }));
    if (!client) return setError(t('form.clientRequired'));
    if (items.length === 0 || items.some((i) => !(i.quantity >= 1) || !(i.unitPrice >= 0) || Number.isNaN(i.unitPrice))) return setError(t('form.itemsRequired'));
    setBusy(true);
    try {
      const inv = await apiRequest<InvoiceView>('/invoices', {
        method: 'POST',
        body: { clientId: client.id, ...(projectId ? { projectId } : {}), items, currency, taxRate, dueDate, ...(notes.trim() ? { notes: notes.trim() } : {}) },
      });
      await onCreated(inv.invoiceNumber);
    } catch (err) {
      setError(describeError(err, locale, { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') }));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white';

  return (
    <Modal title={t('newInvoice')} onClose={onClose} wide>
      <div className="space-y-4">
        <ClientPicker value={client} onChange={setClient} label={t('form.client')} />
        {client && (
          <div>
            <label htmlFor="inv-project" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.project')}
            </label>
            <select id="inv-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
              <option value="">{t('form.noProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <p className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('form.items')}</p>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  aria-label={t('form.description')}
                  placeholder={t('form.description')}
                  value={l.description}
                  onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                  className={`${inputCls} col-span-12 sm:col-span-6`}
                  maxLength={300}
                />
                <input
                  aria-label={t('form.quantity')}
                  type="number"
                  min={1}
                  value={l.quantity}
                  onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))}
                  className={`${inputCls} col-span-3 sm:col-span-2`}
                />
                <input
                  aria-label={t('form.unitPrice')}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={t('form.unitPrice')}
                  value={l.unitPrice}
                  onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, unitPrice: e.target.value } : x)))}
                  className={`${inputCls} col-span-7 sm:col-span-3`}
                />
                <button
                  type="button"
                  onClick={() => setLines(lines.length > 1 ? lines.filter((_, j) => j !== i) : lines)}
                  disabled={lines.length === 1}
                  className="col-span-2 sm:col-span-1 p-2 rounded-lg text-secondary-500 hover:text-red-600 disabled:opacity-40"
                  aria-label={t('form.removeItem')}
                >
                  <TrashIcon className="h-5 w-5 mx-auto" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLines([...lines, emptyLine()])} className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500">
            + {t('form.addItem')}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="inv-currency" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.currency')}
            </label>
            <select id="inv-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputCls}>
              <option value="COP">COP</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label htmlFor="inv-tax-new" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.tax')}
            </label>
            <input id="inv-tax-new" type="number" min={0} max={100} value={tax} onChange={(e) => setTax(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="inv-due-new" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.dueDate')}
            </label>
            <input id="inv-due-new" type="date" min={todayInColombia()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="inv-notes" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {t('form.notes')}
          </label>
          <textarea id="inv-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} className={inputCls} />
        </div>
        <p className="text-sm text-secondary-700 dark:text-secondary-300" data-testid="invoice-preview-total">
          {t('form.preview', {
            subtotal: formatMoney(subtotal, currency, locale),
            tax: formatMoney(subtotal * taxRate, currency, locale),
            total: formatMoney(subtotal * (1 + taxRate), currency, locale),
          })}
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {tc('cancel')}
          </Button>
          <Button onClick={() => void submit()} isLoading={busy} disabled={busy}>
            {t('form.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={null}>
      <AdminInvoicesInner />
    </Suspense>
  );
}
