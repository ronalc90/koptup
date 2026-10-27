'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  DocumentMagnifyingGlassIcon,
  LockClosedIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { bogotaNow, fmtBytes, fmtDate, fmtDateTime } from '../lib/dates';
import { hasClauses } from '../lib/clauses';
import { buildWatermarkedPdf } from '../lib/pdf';
import * as server from '../lib/serverApi';
import { useDocs } from '../lib/store';
import type { DocItem } from '../lib/types';
import { keepUntil, ruleFor, safeFileName, watermarkId } from '../lib/util';
import Preview, { type WatermarkInfo } from './Preview';
import { Drawer, Note, btnDanger, btnPrimary, btnSecondary, focusRing, inputCls } from './ui';

interface DocPanelProps {
  doc: DocItem | null;
  onClose: () => void;
  onOcr: (doc: DocItem) => void;
  onClauses: (doc: DocItem) => void;
  onVersions: (doc: DocItem) => void;
  onRetention: (folder: string) => void;
  onTrash: (doc: DocItem) => void;
  onDestroy: (doc: DocItem) => void;
}

type Explain = { loading: boolean; lines: string[]; error?: string; ai: boolean } | null;

export default function DocPanel({ doc, onClose, onOcr, onClauses, onVersions, onRetention, onTrash, onDestroy }: DocPanelProps) {
  const t = useTranslations('demoDocs');
  const { loc, userName, folders, folderLabel, retention, move, toggleFavorite, restore, busy, toast, apiErrorText } = useDocs();
  const [wm, setWm] = useState<WatermarkInfo | null>(null);
  const [explain, setExplain] = useState<Explain>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const docId = doc?.id;

  useEffect(() => {
    setWm(null);
    setExplain(null);
  }, [docId]);

  if (!doc) return null;

  const rule = ruleFor(retention, doc.folder);
  const keep = keepUntil(doc.createdAt, rule.policy);
  const isSample = doc.source === 'sample';
  const isBusy = busy(doc.id);

  const newWatermark = (): WatermarkInfo => ({
    line: t('watermark.label', { name: userName || t('watermark.visitor'), date: fmtDateTime(bogotaNow(), loc) }),
    id: watermarkId(),
  });

  const runExplain = async () => {
    if (isSample) {
      setExplain({ loading: false, lines: doc.explanation || [], ai: false });
      return;
    }
    setExplain({ loading: true, lines: [], ai: true });
    try {
      const text = await server.explainDoc(doc.id);
      setExplain({ loading: false, lines: [text], ai: true });
    } catch (err) {
      setExplain({ loading: false, lines: [], ai: true, error: apiErrorText(err instanceof server.DocsApiError ? err.code : 'server') });
    }
  };

  const downloadCopy = async () => {
    const mark = wm || newWatermark();
    if (!wm) setWm(mark);
    setPdfBusy(true);
    try {
      await buildWatermarkedPdf({
        filename: `${safeFileName(doc.name.replace(/\.[a-z]+$/i, ''))}-copia-controlada.pdf`,
        title: doc.name,
        text: doc.text || '',
        watermark: mark.line,
        watermarkId: mark.id,
        footer: t('watermark.pdfFooter'),
      });
      toast('success', t('toasts.copyReady'));
    } catch {
      toast('error', t('errors.pdf'));
    } finally {
      setPdfBusy(false);
    }
  };

  const toolBtn = `flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-indigo-950/40 ${focusRing}`;
  const canClauses = isSample && hasClauses(doc.text);
  const canVersions = isSample && (doc.versions?.length || 0) > 1;

  return (
    <Drawer open onClose={onClose} label={t('panel.label', { name: doc.name })}>
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{doc.name}</h2>
            <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <span>{t(`toolbar.types.${doc.kind}`)}</span>
              <span aria-hidden="true">•</span>
              <span>{fmtBytes(doc.sizeBytes, loc)}</span>
              <span aria-hidden="true">•</span>
              <span>{fmtDate(doc.createdAt, loc)}</span>
              <span aria-hidden="true">•</span>
              <span>{folderLabel(doc.folder)}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!doc.deleted && (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => void toggleFavorite(doc)}
                aria-pressed={doc.favorite}
                aria-label={doc.favorite ? t('list.unfavorite') : t('list.favorite')}
                title={doc.favorite ? t('list.unfavorite') : t('list.favorite')}
                className={`rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800 ${focusRing}`}
              >
                {doc.favorite ? <StarSolid className="h-6 w-6 text-yellow-500" /> : <StarIcon className="h-6 w-6 text-slate-400" />}
              </button>
            )}
            <button type="button" onClick={onClose} aria-label={t('common.close')} className={`rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${focusRing}`}>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-4 sm:p-5">
        {/* Vista previa */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{isSample ? (doc.ocr ? t('panel.previewScan') : t('panel.previewText')) : t('panel.preview')}</h3>
          {isSample ? (
            <>
              <Preview doc={doc} watermark={wm} />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" aria-pressed={Boolean(wm)} onClick={() => setWm(wm ? null : newWatermark())} className={`${btnSecondary} ${wm ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200' : ''}`}>
                  <PencilSquareIcon className="h-4 w-4" />
                  {wm ? t('panel.watermarkOff') : t('panel.watermarkOn')}
                </button>
                <button type="button" disabled={pdfBusy} onClick={() => void downloadCopy()} className={btnSecondary}>
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  {t('panel.downloadCopy')}
                </button>
              </div>
              {wm && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('panel.watermarkHint')}</p>}
            </>
          ) : (
            <Note tone="blue">{t('panel.noPreview')}</Note>
          )}
        </section>

        {/* Resumen */}
        <section className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:from-blue-950 dark:to-indigo-950">
          <div className="mb-2 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">{isSample ? t('panel.summarySample') : t('panel.summaryAi')}</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{doc.summary || t('panel.noSummary')}</p>
        </section>

        {(doc.keywords?.length || 0) > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <TagIcon className="h-4 w-4" />
              {t('panel.keywords')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {doc.keywords!.map((k) => (
                <span key={k} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">{k}</span>
              ))}
            </div>
          </section>
        )}

        {((doc.entities?.length || 0) > 0 || (doc.entitiesText?.length || 0) > 0) && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{t('panel.entities')}</h3>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {doc.entities?.map((e, i) => (
                <div key={`${e.kind}-${i}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{t(`panel.entityKinds.${e.kind}`)}</dt>
                  <dd className="break-words text-sm font-medium text-slate-900 dark:text-white">{e.value}</dd>
                </div>
              ))}
              {doc.entitiesText?.map((e) => (
                <div key={e} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:col-span-2">
                  {e}
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Carpeta y retención */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="panel-folder" className="mb-1 block text-sm font-bold text-slate-900 dark:text-white">
              {t('panel.folder')}
            </label>
            <select id="panel-folder" value={doc.folder} disabled={isBusy || doc.deleted} onChange={(e) => void move(doc, e.target.value)} className={inputCls}>
              {folders.map((f) => (
                <option key={f} value={f}>{folderLabel(f)}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-sm font-bold text-slate-900 dark:text-white">{t('panel.retentionTitle')}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {keep === 'perm' ? t('panel.keepPerm') : keep ? t('panel.keepUntil', { date: fmtDate(keep, loc), policy: t(`retention.policies.${rule.policy}`) }) : t('panel.noPolicy')}
            </p>
            {rule.hold && (
              <p className="mt-1 inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
                <LockClosedIcon className="h-3.5 w-3.5" />
                {t('panel.onHold')}
              </p>
            )}
            <button type="button" onClick={() => onRetention(doc.folder)} className={`mt-1 flex items-center gap-1 rounded text-xs font-medium text-blue-700 hover:underline dark:text-blue-300 ${focusRing}`}>
              <ArchiveBoxIcon className="h-3.5 w-3.5" />
              {t('panel.editRetention')}
            </button>
          </div>
        </section>

        {/* Herramientas */}
        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">{t('panel.tools')}</h3>
          {isSample ? (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {doc.ocr && (
                  <button type="button" onClick={() => onOcr(doc)} className={toolBtn}>
                    <DocumentMagnifyingGlassIcon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    {t('panel.ocr')}
                  </button>
                )}
                {canClauses && (
                  <button type="button" onClick={() => onClauses(doc)} className={toolBtn}>
                    <ShieldCheckIcon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    {t('panel.clauses')}
                  </button>
                )}
                {canVersions && (
                  <button type="button" onClick={() => onVersions(doc)} className={toolBtn}>
                    <DocumentDuplicateIcon className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    {t('panel.versions', { count: doc.versions!.length })}
                  </button>
                )}
              </div>
              {!doc.ocr && !canClauses && !canVersions && <p className="text-sm text-slate-600 dark:text-slate-300">{t('panel.noTools')}</p>}
            </>
          ) : (
            <Note tone="blue">{t('panel.serverToolsNote')}</Note>
          )}
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t('panel.signText')}{' '}
            <Link href="/demo/firma-electronica" className={`rounded font-medium text-blue-700 underline hover:no-underline dark:text-blue-300 ${focusRing}`}>
              {t('panel.signLink')}
            </Link>
          </p>
        </section>

        {/* Explicar */}
        {!doc.deleted && (
          <section className="space-y-3">
            <button type="button" onClick={() => void runExplain()} disabled={explain?.loading} className={`${btnPrimary} w-full`}>
              <SparklesIcon className="h-5 w-5" />
              {explain?.loading ? t('panel.explaining') : isSample ? t('panel.explainSample') : t('panel.explainAi')}
            </button>
            {explain && !explain.loading && (
              <div className={`rounded-lg p-4 ${explain.error ? 'border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950' : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950'}`} aria-live="polite">
                {explain.error ? (
                  <p className="text-sm text-red-800 dark:text-red-200">{explain.error}</p>
                ) : (
                  <>
                    <h4 className="font-bold text-green-900 dark:text-green-100">{t('panel.explanationTitle')}</h4>
                    <p className="mb-2 text-xs text-green-800/80 dark:text-green-200/80">{explain.ai ? t('panel.explanationAi') : t('panel.explanationSample')}</p>
                    {explain.lines.length > 1 ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-green-900 dark:text-green-100">
                        {explain.lines.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-green-900 dark:text-green-100">{explain.lines[0] || t('panel.explanationEmpty')}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* Papelera */}
        <section className="border-t border-slate-200 pt-4 dark:border-slate-800">
          {doc.deleted ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" disabled={isBusy} onClick={() => void restore(doc)} className={btnSecondary}>
                <ArrowPathIcon className="h-4 w-4" />
                {t('list.restore')}
              </button>
              <button type="button" disabled={isBusy || rule.hold} onClick={() => onDestroy(doc)} className={btnDanger}>
                <TrashIcon className="h-4 w-4" />
                {t('list.destroy')}
              </button>
            </div>
          ) : (
            <button type="button" disabled={isBusy || rule.hold} onClick={() => onTrash(doc)} className={`${btnDanger} w-full`}>
              <TrashIcon className="h-5 w-5" />
              {t('panel.trash')}
            </button>
          )}
          {rule.hold && <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{t('panel.holdExplain')}</p>}
        </section>
      </div>
    </Drawer>
  );
}
