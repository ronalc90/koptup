'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { splitParagraphs, type SampleDocument } from './sampleKnowledge';

interface DocumentViewerProps {
  doc: SampleDocument | null;
  companyName: string;
  /** Texto del fragmento citado, para resaltarlo (opcional). */
  highlight?: string | null;
  onClose: () => void;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Visor del documento de ejemplo completo, con el fragmento citado resaltado. */
export default function DocumentViewer({ doc, companyName, highlight, onClose }: DocumentViewerProps) {
  const t = useTranslations('demoChatbot.docViewer');
  const markRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    markRef.current?.scrollIntoView({ block: 'center' });
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, onClose]);

  if (!doc) return null;
  const target = highlight ? norm(highlight) : '';
  const paragraphs = splitParagraphs(doc.text);

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-2xl dark:border-secondary-700 dark:bg-secondary-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-secondary-200 px-5 py-4 dark:border-secondary-800">
          <div className="flex min-w-0 items-start gap-2.5">
            <DocumentTextIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-300" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
                {t('title')}
              </p>
              <h3 id="doc-viewer-title" className="break-words text-base font-bold text-secondary-900 dark:text-white">
                {doc.fileName}
              </h3>
              <p className="mt-0.5 text-xs text-secondary-500 dark:text-secondary-400">
                {t('fictitious', { company: companyName })}
                {target ? ` ${t('highlighted')}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="rounded-md p-1.5 text-secondary-500 transition hover:bg-secondary-100 hover:text-secondary-900 dark:hover:bg-secondary-800 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="space-y-3 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-secondary-800 dark:text-secondary-200">
          {paragraphs.map((p, i) => {
            const hit = target && norm(p).includes(target);
            return hit ? (
              <mark
                key={i}
                ref={(el) => {
                  if (el) markRef.current = el;
                }}
                className="block rounded-md bg-amber-100 px-2 py-1 text-secondary-900 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-50 dark:ring-amber-700"
              >
                {p}
              </mark>
            ) : (
              <p key={i}>{p}</p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
