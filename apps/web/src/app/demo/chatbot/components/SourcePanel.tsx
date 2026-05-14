'use client';

import { useTranslations } from 'next-intl';
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import type { SourceChunk } from './data';
import Tooltip from './ui/Tooltip';

interface SourcePanelProps {
  chunk: SourceChunk | null;
  onClose: () => void;
}

/**
 * Drawer derecho con el chunk original que sustenta una cita inline.
 * Visualiza scores (chunk + rerank), fuente, página y el snippet en mono.
 */
export default function SourcePanel({ chunk, onClose }: SourcePanelProps) {
  const t = useTranslations('demoChatbot');
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
            <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.subtitle')}
            </p>
          </div>
          <Tooltip content={t('sourcePanel.close')} side="left">
            <button
              type="button"
              onClick={onClose}
              aria-label={t('sourcePanel.close')}
              className="rounded-md p-1.5 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </header>

        <div className="grid grid-cols-2 gap-2 border-b border-secondary-200 px-5 py-3 text-xs dark:border-secondary-800">
          <div className="col-span-2">
            <div className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.source')}
            </div>
            <div className="font-semibold text-secondary-900 dark:text-secondary-100">
              {chunk.sourceName ?? t(`sources.${chunk.sourceKey}`)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.chunkScore')}
            </div>
            <div className="font-mono text-secondary-900 dark:text-secondary-100">
              {chunk.score.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.rerankScore')}
            </div>
            <div className="font-mono text-secondary-900 dark:text-secondary-100">
              {chunk.rerankScore.toFixed(2)}
            </div>
          </div>
          {chunk.page ? (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                {t('sourcePanel.page')}
              </div>
              <div className="font-mono text-secondary-900 dark:text-secondary-100">
                {chunk.page}
              </div>
            </div>
          ) : null}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('sourcePanel.updated')}
            </div>
            <div className="font-mono text-secondary-900 dark:text-secondary-100">
              {chunk.updated}
            </div>
          </div>
        </div>

        <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words bg-secondary-50 px-5 py-4 font-mono text-xs leading-relaxed text-secondary-800 dark:bg-secondary-950 dark:text-secondary-200">
          {chunk.snippet}
        </pre>

        <footer className="border-t border-secondary-200 px-5 py-3 dark:border-secondary-800">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            {t('sourcePanel.openOriginal')}
          </button>
        </footer>
      </aside>
    </div>
  );
}
