'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { SourceChunk } from './data';
import InfoIcon from './ui/InfoIcon';

interface SourcePanelProps {
  chunk: SourceChunk | null;
  onClose: () => void;
  /** Si el documento está disponible completo (documentos de ejemplo), abre el visor. */
  onOpenDocument?: (chunk: SourceChunk) => void;
}

/**
 * Panel lateral con el fragmento real que sustenta una cita: documento,
 * posición de la cita, puntaje BM25 que devolvió el backend y el texto exacto.
 */
export default function SourcePanel({ chunk, onClose, onOpenDocument }: SourcePanelProps) {
  const t = useTranslations('demoChatbot');

  useEffect(() => {
    if (!chunk) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chunk, onClose]);

  if (!chunk) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-stretch justify-end bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-panel-title"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-secondary-200 bg-white shadow-2xl dark:border-secondary-700 dark:bg-secondary-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-secondary-200 px-5 py-4 dark:border-secondary-800">
          <div>
            <h3 id="source-panel-title" className="text-base font-bold text-secondary-900 dark:text-white">
              {t('sourcePanel.title')}
            </h3>
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">{t('sourcePanel.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('sourcePanel.close')}
            className="rounded-md p-1.5 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-secondary-200 px-5 py-3 text-xs dark:border-secondary-800">
          <div className="col-span-2">
            <dt className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.document')}
            </dt>
            <dd className="break-words font-semibold text-secondary-900 dark:text-secondary-100">{chunk.docName}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.position')}
            </dt>
            <dd className="font-mono text-secondary-900 dark:text-secondary-100">[{chunk.index}]</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.score')}
              <InfoIcon content={t('sourcePanel.scoreHint')} size="xs" side="bottom" align="end" />
            </dt>
            <dd className="font-mono text-secondary-900 dark:text-secondary-100">{chunk.score.toFixed(3)}</dd>
          </div>
        </dl>

        <p className="flex-1 overflow-auto whitespace-pre-wrap break-words bg-secondary-50 px-5 py-4 text-sm leading-relaxed text-secondary-800 dark:bg-secondary-950 dark:text-secondary-200">
          {chunk.text}
        </p>

        {onOpenDocument ? (
          <footer className="border-t border-secondary-200 px-5 py-3 dark:border-secondary-800">
            <button
              type="button"
              onClick={() => onOpenDocument(chunk)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300"
            >
              <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
              {t('sourcePanel.openDocument')}
            </button>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
