'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Button from '@/components/ui/Button';
import Card, { CardContent } from '@/components/ui/Card';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest } from '@/lib/demo-system';
import { formatFileSize, formatMoney, type Currency } from '@/lib/portal';
import { ArrowLeftIcon, ArrowUpTrayIcon, DocumentTextIcon, PhotoIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

/** Límites del backend (POST /api/orders). */
const MAX_FILES = 10;
const MAX_FILE_MB = 20;
const ACCEPT = '.pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar';

interface ItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface ProjectOption {
  _id: string;
  name: string;
  status: string;
}

const emptyItem = (): ItemDraft => ({ description: '', quantity: '1', unitPrice: '' });

function NewOrderForm() {
  const router = useRouter();
  const t = useTranslations('newOrderPage');
  const locale = useLocale();
  const errorText = useErrorText();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [currency, setCurrency] = useState<Currency>('COP');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Proyectos del cliente para ligar el pedido (opcional).
  useEffect(() => {
    apiRequest<ProjectOption[]>('/projects')
      .then((rows) => setProjects((Array.isArray(rows) ? rows : []).filter((p) => p.status !== 'cancelled' && p.status !== 'completed')))
      .catch(() => setProjects([]));
  }, []);

  const updateItem = (index: number, field: keyof ItemDraft, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (tooBig.length) toast.error(t('fileTooBig', { name: tooBig[0].name, max: MAX_FILE_MB }));
    const accepted = incoming.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    const next = [...attachments, ...accepted];
    if (next.length > MAX_FILES) toast.error(t('tooManyFiles', { max: MAX_FILES }));
    setAttachments(next.slice(0, MAX_FILES));
    if (fileInput.current) fileInput.current.value = '';
  };

  const parsedItems = items.map((it) => ({
    name: it.description.trim(),
    quantity: Number(it.quantity),
    price: it.unitPrice === '' ? 0 : Number(it.unitPrice),
  }));
  const total = parsedItems.reduce((sum, it) => sum + (Number.isFinite(it.quantity * it.price) ? it.quantity * it.price : 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError(t('errors.nameRequired'));
      return;
    }
    const filled = parsedItems.filter((it) => it.name);
    if (filled.length === 0) {
      setError(t('errors.itemsRequired'));
      return;
    }
    if (filled.some((it) => !Number.isInteger(it.quantity) || it.quantity < 1 || !Number.isFinite(it.price) || it.price < 0)) {
      setError(t('errors.itemsInvalid'));
      return;
    }

    const form = new FormData();
    form.append('name', name.trim());
    form.append('description', description.trim());
    form.append('currency', currency);
    form.append('items', JSON.stringify(filled));
    if (comments.trim()) form.append('comments', comments.trim());
    if (projectId) form.append('projectId', projectId);
    attachments.forEach((file) => form.append('attachments', file));

    setSubmitting(true);
    try {
      const created = await apiRequest<{ id: string }>('/orders', { method: 'POST', body: form });
      toast.success(t('created', { id: created.id }));
      router.push(`/dashboard/orders/${encodeURIComponent(created.id)}`);
    } catch (err) {
      setError(errorText(err, t('errors.generic')));
      setSubmitting(false);
    }
  };

  const inputCls =
    'block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Button variant="ghost" size="sm" className="mb-3" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {t('back')}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{t('title')}</h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
      </div>

      <Card variant="bordered">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="order-name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                {t('name')} *
              </label>
              <input id="order-name" type="text" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={t('namePlaceholder')} required />
            </div>

            <div>
              <label htmlFor="order-description" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                {t('description')}
              </label>
              <textarea id="order-description" value={description} maxLength={5000} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} placeholder={t('descriptionPlaceholder')} />
            </div>

            <div className="bg-primary-50 dark:bg-primary-950 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
              <label htmlFor="order-detail" className="block text-sm font-medium text-primary-900 dark:text-primary-200 mb-1">
                {t('detail')}
              </label>
              <p className="text-xs text-primary-700 dark:text-primary-300 mb-3">{t('detailHelp')}</p>
              <textarea id="order-detail" value={comments} maxLength={5000} onChange={(e) => setComments(e.target.value)} rows={6} className={inputCls} placeholder={t('detailPlaceholder')} />
            </div>

            {projects.length > 0 && (
              <div>
                <label htmlFor="order-project" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  {t('project')}
                </label>
                <select id="order-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
                  <option value="">{t('noProject')}</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-secondary-50 dark:bg-secondary-900 p-4 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <p className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('attachments')}</p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">{t('attachmentsHelp', { files: MAX_FILES, size: MAX_FILE_MB })}</p>
              <label htmlFor="order-files" className="flex items-center justify-center px-4 py-6 border-2 border-dashed border-secondary-300 dark:border-secondary-700 rounded-lg cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors">
                <span className="text-center">
                  <ArrowUpTrayIcon className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
                  <span className="block text-sm text-secondary-600 dark:text-secondary-400">{t('chooseFiles')}</span>
                  <span className="block text-xs text-secondary-500 mt-1">{t('allowedTypes')}</span>
                </span>
                <input ref={fileInput} id="order-files" type="file" multiple accept={ACCEPT} onChange={(e) => addFiles(e.target.files)} className="sr-only" />
              </label>
              {attachments.length > 0 && (
                <ul className="space-y-2 mt-3">
                  {attachments.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-secondary-950 rounded-lg border border-secondary-200 dark:border-secondary-700">
                      <div className="flex items-center gap-3 min-w-0">
                        {file.type.startsWith('image/') ? <PhotoIcon className="h-5 w-5 text-blue-500 flex-shrink-0" /> : <DocumentTextIcon className="h-5 w-5 text-secondary-500 flex-shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">{file.name}</p>
                          <p className="text-xs text-secondary-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950 rounded text-red-600 dark:text-red-400"
                        aria-label={t('removeFile', { name: file.name })}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <fieldset>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <legend className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">{t('items')} *</legend>
                <div className="flex items-center gap-3">
                  <label htmlFor="order-currency" className="text-sm text-secondary-600 dark:text-secondary-400">
                    {t('currency')}
                  </label>
                  <select id="order-currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="px-2 py-1 text-sm rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white">
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-secondary-900 rounded-lg border border-secondary-200 dark:border-secondary-700">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <label htmlFor={`item-desc-${idx}`} className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                          {t('itemDescription')}
                        </label>
                        <input id={`item-desc-${idx}`} type="text" maxLength={200} value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} className={inputCls} placeholder={t('itemPlaceholder')} />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor={`item-qty-${idx}`} className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                          {t('quantity')}
                        </label>
                        <input id={`item-qty-${idx}`} type="number" min={1} step={1} value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className={inputCls} />
                      </div>
                      <div className="md:col-span-3">
                        <label htmlFor={`item-price-${idx}`} className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                          {t('unitPrice', { currency })}
                        </label>
                        <input id={`item-price-${idx}`} type="number" min={0} step={currency === 'COP' ? 1000 : 0.01} value={it.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} placeholder="0" className={inputCls} />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)))}
                          disabled={items.length === 1}
                          className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-700 rounded-lg text-sm text-secondary-700 dark:text-secondary-300 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={t('removeItem', { index: idx + 1 })}
                        >
                          <XMarkIcon className="h-5 w-5 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setItems((prev) => [...prev, emptyItem()])} disabled={items.length >= 50}>
                <PlusIcon className="h-4 w-4 mr-1" />
                {t('addItem')}
              </Button>
            </fieldset>

            {error && (
              <div className="p-3 border border-red-300 bg-red-50 dark:bg-red-950 rounded" role="alert">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
              <div>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('estimatedTotal')}</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatMoney(total, currency, locale)}</p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/orders')} disabled={submitting}>
                  {t('cancel')}
                </Button>
                <Button type="submit" size="lg" isLoading={submitting} disabled={submitting}>
                  {submitting ? t('creating') : t('create')}
                </Button>
              </div>
            </div>

            <p className="text-sm text-secondary-600 dark:text-secondary-400 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">{t('note')}</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/** Portal › Nuevo pedido (dentro del marco del portal; envía a la API con la sesión). */
export default function NewOrderPage() {
  return (
    <DashboardLayout>
      <NewOrderForm />
    </DashboardLayout>
  );
}
