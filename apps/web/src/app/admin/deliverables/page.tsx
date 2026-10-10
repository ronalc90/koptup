'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/admin/demos/shared';
import { apiRequest } from '@/lib/demo-system';
import {
  DELIVERABLE_STATUSES,
  describeError,
  downloadWithSession,
  formatDay,
  formatFileSize,
  openExternal,
  saveBlob,
  type AdminProjectView,
  type DeliverableStatus,
  type DeliverableView,
} from '@/lib/portal';
import { ArrowDownTrayIcon, DocumentTextIcon, LinkIcon, PlusIcon } from '@heroicons/react/24/outline';

const STATUS_VARIANT: Record<DeliverableStatus, 'secondary' | 'warning' | 'success' | 'danger'> = {
  pending: 'secondary',
  in_review: 'warning',
  approved: 'success',
  rejected: 'danger',
};
const TYPES = ['documentation', 'design', 'code', 'prototype', 'other'] as const;

export default function AdminDeliverablesPage() {
  const t = useTranslations('adminDeliverablesPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [deliverables, setDeliverables] = useState<DeliverableView[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const errorTexts = { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest<DeliverableView[]>(`/admin/deliverables${status !== 'all' ? `?status=${status}` : ''}`);
      setDeliverables(Array.isArray(data) ? data : []);
    } catch (err) {
      setDeliverables([]);
      setLoadError(describeError(err, locale, errorTexts));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const download = async (d: DeliverableView) => {
    if (d.storage === 'link') {
      if (!openExternal(d.url)) toast.error(tc('errors.generic'));
      return;
    }
    setDownloading(d.id);
    try {
      saveBlob(await downloadWithSession(`/deliverables/${encodeURIComponent(d.id)}/download`), d.fileName || `${d.id}`);
    } catch (err) {
      const e = err as { status?: number };
      toast.error(e.status === 410 ? t('fileGone') : describeError(err, locale, errorTexts));
    } finally {
      setDownloading(null);
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
          <Button onClick={() => setUploading(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('newDeliverable')}
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {(['all', ...DELIVERABLE_STATUSES] as const).map((s) => (
            <Button key={s} size="sm" variant={status === s ? 'primary' : 'outline'} onClick={() => setStatus(s)} aria-pressed={status === s}>
              {s === 'all' ? t('filterAll') : tc(`deliverableStatus.${s}`)}
            </Button>
          ))}
        </div>

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
        ) : deliverables.length === 0 ? (
          <Card variant="bordered">
            <CardContent className="p-10 text-center">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-secondary-400 mb-4" />
              <p className="text-secondary-700 dark:text-secondary-300 font-medium">{status !== 'all' ? t('noResults') : t('empty')}</p>
              {status === 'all' && <p className="text-sm text-secondary-500 mt-1">{t('emptyHint')}</p>}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => (
              <Card key={d.id} variant="bordered" data-deliverable={d.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white break-words">{d.title}</h3>
                        <Badge variant={STATUS_VARIANT[d.status]} size="sm">
                          {tc(`deliverableStatus.${d.status}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        {d.client.name ?? '—'} · {d.client.email ?? ''}
                      </p>
                      <p className="text-xs text-secondary-500 mt-1">
                        {d.id} · {t('projectLabel', { name: d.project?.name ?? '—' })} · {tc(`deliverableType.${d.type}`)} · {formatDay(d.uploadDate, locale)}
                      </p>
                      {d.comments && d.status !== 'in_review' && (
                        <p className="text-sm mt-2 text-secondary-700 dark:text-secondary-300">
                          <span className="font-medium">{t('clientComment')}:</span> {d.comments}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-secondary-500 sm:text-right">
                      {d.storage === 'link' ? t('externalLink') : `${d.fileName} · ${formatFileSize(d.fileSize)}`}
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => void download(d)} isLoading={downloading === d.id}>
                      {d.storage === 'link' ? <LinkIcon className="h-4 w-4 mr-2" /> : <ArrowDownTrayIcon className="h-4 w-4 mr-2" />}
                      {d.storage === 'link' ? t('openLink') : t('download')}
                    </Button>
                    {d.status === 'in_review' && <span className="text-xs text-secondary-500 self-center">{t('waitingClient')}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {uploading && (
          <UploadDeliverableModal
            onClose={() => setUploading(false)}
            onDone={async () => {
              setUploading(false);
              toast.success(t('shared'));
              await load();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

function UploadDeliverableModal({ onClose, onDone }: { onClose: () => void; onDone: () => void | Promise<void> }) {
  const t = useTranslations('adminDeliverablesPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const [projects, setProjects] = useState<AdminProjectView[] | null>(null);
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]>('documentation');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'file' | 'link'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<AdminProjectView[]>('/admin/projects')
      .then((rows) => setProjects((Array.isArray(rows) ? rows : []).filter((p) => p.client && p.status !== 'cancelled')))
      .catch(() => setProjects([]));
  }, []);

  const submit = async () => {
    setError('');
    if (!projectId) return setError(t('form.projectRequired'));
    if (title.trim().length < 2) return setError(t('form.titleRequired'));
    if (mode === 'file' && !file) return setError(t('form.fileRequired'));
    if (mode === 'link' && !/^https:\/\//i.test(link.trim())) return setError(t('form.linkInvalid'));
    const form = new FormData();
    form.append('projectId', projectId);
    form.append('title', title.trim());
    form.append('type', type);
    if (description.trim()) form.append('description', description.trim());
    if (mode === 'file' && file) form.append('file', file);
    else form.append('link', link.trim());
    setBusy(true);
    try {
      await apiRequest('/deliverables', { method: 'POST', body: form });
      await onDone();
    } catch (err) {
      setError(describeError(err, locale, { network: tc('errors.network'), rateLimited: tc('errors.rateLimited'), server: tc('errors.server'), generic: tc('errors.generic') }));
    } finally {
      setBusy(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white';

  return (
    <Modal title={t('newDeliverable')} onClose={onClose} wide>
      <div className="space-y-4">
        <div>
          <label htmlFor="del-project" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {t('form.project')}
          </label>
          {projects === null ? (
            <p className="text-sm text-secondary-500">{t('form.loadingProjects')}</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-amber-700 dark:text-amber-400">{t('form.noProjects')}</p>
          ) : (
            <select id="del-project" value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
              <option value="">{t('form.chooseProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.client?.name}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-secondary-500 mt-1">{t('form.ownerNote')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="del-title" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.title')}
            </label>
            <input id="del-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputCls} />
          </div>
          <div>
            <label htmlFor="del-type" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
              {t('form.type')}
            </label>
            <select id="del-type" value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])} className={inputCls}>
              {TYPES.map((x) => (
                <option key={x} value={x}>
                  {tc(`deliverableType.${x}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="del-desc" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
            {t('form.description')}
          </label>
          <textarea id="del-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} className={inputCls} />
        </div>
        <fieldset>
          <legend className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">{t('form.source')}</legend>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="del-mode" checked={mode === 'file'} onChange={() => setMode('file')} /> {t('form.modeFile')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="del-mode" checked={mode === 'link'} onChange={() => setMode('link')} /> {t('form.modeLink')}
            </label>
          </div>
          {mode === 'file' ? (
            <>
              <input
                type="file"
                aria-label={t('form.modeFile')}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-secondary-700 dark:text-secondary-300"
              />
              <p className="text-xs text-secondary-500 mt-1">{t('form.fileHint')}</p>
            </>
          ) : (
            <input type="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} className={inputCls} aria-label={t('form.modeLink')} />
          )}
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {tc('cancel')}
          </Button>
          <Button onClick={() => void submit()} isLoading={busy} disabled={busy || !projects?.length}>
            {t('form.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
