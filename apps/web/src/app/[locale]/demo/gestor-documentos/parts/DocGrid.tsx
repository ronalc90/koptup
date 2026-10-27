'use client';

import { useTranslations } from 'next-intl';
import { ArrowPathIcon, LockClosedIcon, PencilIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { fmtBytes, fmtDate } from '../lib/dates';
import { useDocs } from '../lib/store';
import type { DocItem, DocKind } from '../lib/types';
import { ruleFor } from '../lib/util';
import type { Snippet } from '../lib/search';
import type { VisibleDoc } from '../lib/view';
import { focusRing } from './ui';

/** Fragmento con las coincidencias resaltadas. */
export function SnippetText({ snippet }: { snippet: Snippet }) {
  return (
    <>
      {snippet.cutStart && '…'}
      {snippet.parts.map((part, i) =>
        part.hit ? (
          <mark key={i} className="rounded bg-yellow-200 px-0.5 text-slate-900 dark:bg-yellow-400/40 dark:text-white">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
      {snippet.cutEnd && '…'}
    </>
  );
}

export const KIND_ICON: Record<DocKind, string> = { pdf: '📄', docx: '📝', txt: '📃', csv: '📊', other: '📄' };

interface DocGridProps {
  items: VisibleDoc[];
  trashView: boolean;
  onOpen: (doc: DocItem) => void;
  onRename: (doc: DocItem) => void;
  onDestroy: (doc: DocItem) => void;
}

export default function DocGrid({ items, trashView, onOpen, onRename, onDestroy }: DocGridProps) {
  const t = useTranslations('demoDocs');
  const { loc, folderLabel, retention, toggleFavorite, restore, busy } = useDocs();

  return (
    <ul aria-label={t('list.gridLabel')} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ doc, snippet }) => {
        const rule = ruleFor(retention, doc.folder);
        const isBusy = busy(doc.id);
        return (
          <li key={doc.id} className="relative flex flex-col rounded-xl border-2 border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-4xl" aria-hidden="true">
                {KIND_ICON[doc.kind]}
              </span>
              <div className="relative z-10 flex items-center gap-1">
                {trashView ? (
                  <>
                    <button type="button" disabled={isBusy} onClick={() => void restore(doc)} title={t('list.restore')} aria-label={`${t('list.restore')}: ${doc.name}`} className={`rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-950 ${focusRing}`}>
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    <button type="button" disabled={isBusy || rule.hold} onClick={() => onDestroy(doc)} title={rule.hold ? t('panel.onHold') : t('list.destroy')} aria-label={`${t('list.destroy')}: ${doc.name}`} className={`rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950 ${focusRing}`}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" disabled={isBusy} onClick={() => onRename(doc)} title={t('list.rename')} aria-label={`${t('list.rename')}: ${doc.name}`} className={`rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800 ${focusRing}`}>
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void toggleFavorite(doc)}
                      aria-pressed={doc.favorite}
                      title={doc.favorite ? t('list.unfavorite') : t('list.favorite')}
                      aria-label={`${doc.favorite ? t('list.unfavorite') : t('list.favorite')}: ${doc.name}`}
                      className={`rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800 ${focusRing}`}
                    >
                      {doc.favorite ? <StarSolid className="h-5 w-5 text-yellow-500" /> : <StarIcon className="h-5 w-5 text-slate-400" />}
                    </button>
                  </>
                )}
              </div>
            </div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
              <button type="button" onClick={() => onOpen(doc)} className={`line-clamp-2 break-words text-left after:absolute after:inset-0 after:rounded-xl after:content-[''] ${focusRing}`}>
                {doc.name}
              </button>
            </h3>
            <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>{t(`toolbar.types.${doc.kind}`)}</span>
              <span aria-hidden="true">•</span>
              <span>{fmtBytes(doc.sizeBytes, loc)}</span>
              <span aria-hidden="true">•</span>
              <span>{fmtDate(doc.createdAt, loc)}</span>
            </p>
            {trashView && doc.deletedAt && <p className="mb-2 text-xs text-orange-700 dark:text-orange-300">{t('list.deletedOn', { date: fmtDate(doc.deletedAt, loc) })}</p>}
            <div className="mb-2 flex flex-wrap gap-1">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">{folderLabel(doc.folder)}</span>
              {rule.policy !== 'none' && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{t(`retention.policies.${rule.policy}`)}</span>}
              {rule.hold && (
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-950 dark:text-red-300">
                  <LockClosedIcon className="h-3 w-3" />
                  {t('sidebar.holdBadge')}
                </span>
              )}
            </div>
            {doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doc.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {tag}
                  </span>
                ))}
                {doc.tags.length > 3 && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">+{doc.tags.length - 3}</span>}
              </div>
            )}
            {snippet && (
              <p className="mt-2 rounded-lg bg-yellow-50 p-2 text-xs leading-relaxed text-slate-700 dark:bg-yellow-500/10 dark:text-slate-300">
                <span className="font-semibold">{t('list.matchIn')} </span>
                <SnippetText snippet={snippet} />
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
