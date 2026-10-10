'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Modal } from '@/components/admin/demos/shared';
import { PortalEmpty, PortalError, PortalLoading } from '@/components/dashboard/PortalStates';
import { useErrorText } from '@/hooks/useErrorText';
import { apiRequest } from '@/lib/demo-system';
import {
  DELIVERABLE_STATUSES,
  downloadWithSession,
  formatDay,
  formatFileSize,
  openExternal,
  refreshPanelCounts,
  saveBlob,
  type DeliverableStatus,
  type DeliverableView,
} from '@/lib/portal';
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, DocumentTextIcon, FolderIcon } from '@heroicons/react/24/outline';

const STATUS_BADGE: Record<DeliverableStatus, string> = {
  pending: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300',
  in_review: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300',
  approved: 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300',
  rejected: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',
};

function ReviewModal({
  deliverable,
  mode,
  onClose,
  onDone,
}: {
  deliverable: DeliverableView;
  mode: 'approve' | 'reject';
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations('deliverablesPage');
  const errorText = useErrorText();
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'reject' && comments.trim().length < 3) {
      setError(t('review.commentsRequired'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/deliverables/${encodeURIComponent(deliverable.id)}/${mode}`, {
        method: 'POST',
        body: comments.trim() ? { comments: comments.trim() } : {},
      });
      toast.success(mode === 'approve' ? t('review.approved') : t('review.rejected'));
      onDone();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Modal title={mode === 'approve' ? t('review.approveTitle', { title: deliverable.title }) : t('review.rejectTitle', { title: deliverable.title })} onClose={busy ? () => undefined : onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-secondary-700 dark:text-secondary-300">{mode === 'approve' ? t('review.approveHelp') : t('review.rejectHelp')}</p>
        <div>
          <label htmlFor="review-comments" className="block text-sm font-medium text-secondary-800 dark:text-secondary-200 mb-1">
            {mode === 'approve' ? t('review.commentsOptional') : t('review.comments')}
          </label>
          <textarea
            id="review-comments"
            rows={4}
            maxLength={2000}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-secondary-300 dark:border-secondary-700 bg-white dark:bg-secondary-950 text-secondary-900 dark:text-white"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t('review.cancel')}
          </Button>
          <Button type="submit" variant={mode === 'approve' ? 'primary' : 'danger'} isLoading={busy} disabled={busy}>
            {mode === 'approve' ? t('approve') : t('reject')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeliverablesContent() {
  const t = useTranslations('deliverablesPage');
  const tc = useTranslations('portalCommon');
  const locale = useLocale();
  const errorText = useErrorText();
  const [items, setItems] = useState<DeliverableView[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<'all' | DeliverableStatus>('all');
  const [review, setReview] = useState<{ d: DeliverableView; mode: 'approve' | 'reject' } | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await apiRequest<DeliverableView[]>('/deliverables');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setItems(null);
      setLoadError(errorText(err));
    }
  }, [errorText]);

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
      saveBlob(await downloadWithSession(`/deliverables/${encodeURIComponent(d.id)}/download`), d.fileName || d.id);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setDownloading(null);
    }
  };

  const visible = useMemo(() => (items ?? []).filter((d) => filter === 'all' || d.status === filter), [items, filter]);

  // Agrupados por proyecto.
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; list: DeliverableView[] }>();
    for (const d of visible) {
      const key = d.project?.id ?? 'none';
      const name = d.project?.name ?? t('noProject');
      if (!map.has(key)) map.set(key, { name, list: [] });
      map.get(key)!.list.push(d);
    }
    return Array.from(map.values());
  }, [visible, t]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
        <p className="text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
      </div>

      {loadError ? (
        <PortalError message={loadError} onRetry={() => void load()} />
      ) : !items ? (
        <PortalLoading />
      ) : items.length === 0 ? (
        <PortalEmpty icon={DocumentTextIcon} title={t('emptyTitle')} body={t('emptyBody')} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="bordered">
              <CardContent className="p-5 text-center">
                <p className="text-2xl font-bold text-secondary-900 dark:text-white">{items.length}</p>
                <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('total')}</p>
              </CardContent>
            </Card>
            {DELIVERABLE_STATUSES.map((s) => (
              <Card key={s} variant="bordered">
                <CardContent className="p-5 text-center">
                  <p className="text-2xl font-bold text-secondary-900 dark:text-white">{items.filter((d) => d.status === s).length}</p>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">{tc(`deliverableStatus.${s}`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label={t('filterLabel')}>
            {(['all', ...DELIVERABLE_STATUSES] as const).map((s) => (
              <Button key={s} size="sm" variant={filter === s ? 'primary' : 'outline'} aria-pressed={filter === s} onClick={() => setFilter(s)}>
                {s === 'all' ? t('all') : tc(`deliverableStatus.${s}`)}
              </Button>
            ))}
          </div>

          {groups.length === 0 ? (
            <Card variant="bordered">
              <CardContent className="p-10 text-center text-secondary-600 dark:text-secondary-400">{t('noResults')}</CardContent>
            </Card>
          ) : (
            groups.map((g) => (
              <section key={g.name} className="space-y-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-secondary-900 dark:text-white">
                  <FolderIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  {g.name}
                </h2>
                {g.list.map((d) => (
                  <Card key={d.id} variant="bordered" data-deliverable={d.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-secondary-900 dark:text-white break-words">{d.title}</h3>
                            <Badge variant="secondary" size="sm" className={STATUS_BADGE[d.status]}>
                              {tc(`deliverableStatus.${d.status}`)}
                            </Badge>
                            <Badge variant="outline" size="sm">
                              {tc(`deliverableType.${d.type}`)}
                            </Badge>
                          </div>
                          {d.description && <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 whitespace-pre-wrap">{d.description}</p>}
                          <p className="text-xs text-secondary-500">
                            {[
                              d.id,
                              t('version', { version: d.version }),
                              formatDay(d.uploadDate, locale),
                              d.storage === 'file' ? `${d.fileName} · ${formatFileSize(d.fileSize)}` : t('externalLink'),
                            ].join(' · ')}
                          </p>
                          {d.comments && (
                            <p className="mt-2 text-sm text-secondary-700 dark:text-secondary-300">
                              <span className="font-medium">{t('yourComment')}</span> {d.comments}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => void download(d)} isLoading={downloading === d.id}>
                            {d.storage === 'link' ? <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" /> : <ArrowDownTrayIcon className="h-4 w-4 mr-1" />}
                            {d.storage === 'link' ? t('openLink') : t('download')}
                          </Button>
                          {d.status === 'in_review' && (
                            <>
                              <Button size="sm" onClick={() => setReview({ d, mode: 'approve' })}>
                                {t('approve')}
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => setReview({ d, mode: 'reject' })}>
                                {t('reject')}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            ))
          )}
        </>
      )}

      {review && (
        <ReviewModal
          deliverable={review.d}
          mode={review.mode}
          onClose={() => setReview(null)}
          onDone={() => {
            setReview(null);
            refreshPanelCounts();
            void load();
          }}
        />
      )}
    </div>
  );
}

/**
 * Portal › Entregables: los del cliente (por proyecto), con descarga, enlace
 * externo y revisión (aprobar o pedir cambios con comentario). Sin datos de
 * ejemplo si la API falla.
 */
export default function DeliverablesPage() {
  return (
    <DashboardLayout>
      <DeliverablesContent />
    </DashboardLayout>
  );
}
