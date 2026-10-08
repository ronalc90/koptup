'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { INCLUDED_KEYS, type IncludedKey } from './data';
import { splitParagraphs, type SampleCompany, type SampleDocument } from './sampleKnowledge';
import InfoIcon from './ui/InfoIcon';

export type KbPhase = 'preparing' | 'ready' | 'error';

interface SidebarProps {
  company: SampleCompany;
  kbPhase: KbPhase;
  docsIndexed: number;
  onRetry: () => void;
  onOpenDocument: (doc: SampleDocument) => void;
  activeIncluded: IncludedKey | null;
  onSelectIncluded: (key: IncludedKey) => void;
}

/**
 * Columna izquierda del Playground:
 *  1. Los documentos de la empresa de ejemplo (lo único que consulta el
 *     asistente) y su estado de indexación real en el backend.
 *  2. "Qué incluye hoy": solo capacidades que existen en el código.
 */
export default function Sidebar({
  company,
  kbPhase,
  docsIndexed,
  onRetry,
  onOpenDocument,
  activeIncluded,
  onSelectIncluded,
}: SidebarProps) {
  const t = useTranslations('demoChatbot');

  return (
    <aside
      className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto border-r border-secondary-200 bg-white/70 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/70"
      aria-label={t('kb.title')}
    >
      <section className="border-b border-secondary-200 px-4 py-3 dark:border-secondary-800">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
            {t('kb.title')}
          </p>
          <InfoIcon content={t('kb.subtitle')} side="bottom" align="end" />
        </div>
        <p className="mt-1 text-sm font-semibold text-secondary-900 dark:text-white">{company.name}</p>
        <p className="text-[11px] text-secondary-500 dark:text-secondary-400">
          {t('companies.sectorCity', { sector: company.sector, city: company.city })} · {t('companies.fictitious')}
        </p>

        <div className="mt-2 text-[11px]" role="status">
          {kbPhase === 'preparing' ? (
            <span className="inline-flex items-center gap-1 text-secondary-500 dark:text-secondary-400">
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              {t('kb.preparing')}
            </span>
          ) : kbPhase === 'ready' ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
              <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('kb.ready', { count: docsIndexed })}
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-1 text-red-700 dark:text-red-300">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('kb.error')}
              <button
                type="button"
                onClick={onRetry}
                className="rounded border border-red-200 px-1.5 py-0.5 font-semibold hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
              >
                {t('kb.retry')}
              </button>
            </span>
          )}
        </div>

        <ul className="mt-2 space-y-1.5">
          {company.docs.map((d) => (
            <li key={d.fileName}>
              <button
                type="button"
                onClick={() => onOpenDocument(d)}
                className="flex w-full items-center gap-2 rounded-md bg-secondary-50 px-2.5 py-1.5 text-left text-xs ring-1 ring-secondary-100 transition hover:ring-primary-300 dark:bg-secondary-800/60 dark:ring-secondary-700/60 dark:hover:ring-primary-700"
                aria-label={`${t('kb.open')}: ${d.fileName}`}
              >
                <DocumentTextIcon className="h-4 w-4 shrink-0 text-secondary-500 dark:text-secondary-400" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-secondary-800 dark:text-secondary-100">{d.fileName}</span>
                  <span className="block text-[10px] text-secondary-500 dark:text-secondary-400">
                    {t('kb.sections', { count: splitParagraphs(d.text).length })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-2 py-3">
        <div className="flex items-center justify-between gap-2 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-500 dark:text-secondary-400">
            {t('included.title')}
          </p>
          <InfoIcon content={t('included.subtitle')} side="bottom" align="end" />
        </div>
        <ul className="mt-2 space-y-1">
          {INCLUDED_KEYS.map((key) => {
            const active = activeIncluded === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectIncluded(key)}
                  aria-current={active ? 'true' : undefined}
                  className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    active
                      ? 'bg-primary-50 text-primary-900 ring-1 ring-primary-200 dark:bg-primary-950/70 dark:text-primary-100 dark:ring-primary-800/60'
                      : 'text-secondary-700 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-secondary-200 dark:text-secondary-300 dark:hover:bg-secondary-800/60 dark:hover:ring-secondary-700'
                  }`}
                >
                  <CheckCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  <span className="leading-tight">
                    <span className="block font-semibold">{t(`included.items.${key}.title`)}</span>
                    <span className="mt-0.5 block text-[10.5px] text-secondary-500 dark:text-secondary-400">
                      {t(`included.items.${key}.summary`)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 px-2 text-[10.5px] leading-relaxed text-secondary-500 dark:text-secondary-400">
          {t('included.future')}{' '}
          <Link href="/services#planes-rag" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
            {t('included.futureLink')}
          </Link>
        </p>
      </section>
    </aside>
  );
}
