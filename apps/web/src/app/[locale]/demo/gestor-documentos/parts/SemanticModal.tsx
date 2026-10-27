'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SparklesIcon } from '@heroicons/react/24/outline';
import * as server from '../lib/serverApi';
import { useDocs } from '../lib/store';
import type { DocItem } from '../lib/types';
import { expandedSearch } from '../lib/view';
import { SnippetText } from './DocGrid';
import { Modal, Note, btnSecondary, focusRing } from './ui';

interface Props {
  query: string | null;
  onClose: () => void;
  onOpenDoc: (doc: DocItem) => void;
}

function without<T>(obj: Record<string, T>, key: string): Record<string, T> {
  const next = { ...obj };
  delete next[key];
  return next;
}

function relevance(score: number): 'high' | 'mid' | 'low' {
  return score >= 0.75 ? 'high' : score >= 0.4 ? 'mid' : 'low';
}

export default function SemanticModal({ query, onClose, onOpenDoc }: Props) {
  const t = useTranslations('demoDocs');
  const { mode, docs, apiErrorText } = useDocs();
  const open = query !== null;
  const [serverHits, setServerHits] = useState<server.SemanticHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [why, setWhy] = useState<Record<string, { loading: boolean; text: string; error?: boolean }>>({});

  const sampleHits = useMemo(() => (open && mode === 'sample' ? expandedSearch(docs, query || '') : []), [open, mode, docs, query]);

  useEffect(() => {
    setWhy({});
    setServerHits(null);
    setError(null);
    if (!open || mode !== 'server' || !query) return;
    let alive = true;
    setLoading(true);
    server
      .semanticSearch(query)
      .then((hits) => alive && setServerHits(hits))
      .catch((err) => alive && setError(apiErrorText(err instanceof server.DocsApiError ? err.code : 'server')))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, mode, query, apiErrorText]);

  const explainServer = async (hit: server.SemanticHit) => {
    setWhy((w) => ({ ...w, [hit.id]: { loading: true, text: '' } }));
    try {
      const text = await server.explainMatch(hit.id, query || '', hit.similarity / 100);
      setWhy((w) => ({ ...w, [hit.id]: { loading: false, text } }));
    } catch (err) {
      setWhy((w) => ({ ...w, [hit.id]: { loading: false, text: apiErrorText(err instanceof server.DocsApiError ? err.code : 'server'), error: true } }));
    }
  };

  const openDoc = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (doc) onOpenDoc(doc);
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={t('semantic.title')} subtitle={t('semantic.query', { query: query || '' })} icon={<SparklesIcon className="h-6 w-6" />}>
      <div className="space-y-4">
        <Note tone={mode === 'sample' ? 'amber' : 'blue'}>{mode === 'sample' ? t('semantic.sampleNote') : t('semantic.serverNote')}</Note>

        {mode === 'sample' &&
          (sampleHits.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-600 dark:text-slate-300">{t('semantic.noResults')}</p>
          ) : (
            <ul className="space-y-3">
              {sampleHits.map((h) => (
                <li key={h.doc.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{h.doc.name}</p>
                    <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">{t(`semantic.relevance.${relevance(h.score)}`)}</span>
                  </div>
                  {h.doc.summary && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{h.doc.summary}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => openDoc(h.doc.id)} className={btnSecondary}>
                      {t('semantic.open')}
                    </button>
                    <button
                      type="button"
                      aria-expanded={Boolean(why[h.doc.id])}
                      onClick={() => setWhy((w) => (w[h.doc.id] ? without(w, h.doc.id) : { ...w, [h.doc.id]: { loading: false, text: '' } }))}
                      className={`inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 ${focusRing}`}
                    >
                      <SparklesIcon className="h-4 w-4" />
                      {t('semantic.why')}
                    </button>
                  </div>
                  {why[h.doc.id] && (
                    <div className="mt-2 space-y-1 rounded-lg border border-purple-200 bg-white p-3 text-xs text-slate-700 dark:border-purple-900 dark:bg-slate-900 dark:text-slate-300">
                      {h.direct.length > 0 && <p>{t('semantic.whyDirect', { terms: h.direct.join(', ') })}</p>}
                      {h.related.length > 0 && <p>{t('semantic.whyRelated', { terms: h.related.join(', ') })}</p>}
                      {h.snippet && (
                        <p>
                          {t('semantic.whySnippet')} «<SnippetText snippet={h.snippet} />»
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ))}

        {mode === 'server' && (
          <>
            {loading && (
              <div className="py-8 text-center" role="status">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t('semantic.searching')}</p>
              </div>
            )}
            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}
            {serverHits && serverHits.length === 0 && <p className="py-6 text-center text-sm text-slate-600 dark:text-slate-300">{t('semantic.noResultsServer')}</p>}
            {serverHits && serverHits.length > 0 && (
              <ul className="space-y-3">
                {serverHits.map((h) => (
                  <li key={h.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 break-words font-semibold text-slate-900 dark:text-white">{h.name}</p>
                      <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950 dark:text-purple-300">{t('semantic.similarity', { pct: h.similarity })}</span>
                    </div>
                    {h.summary && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{h.summary}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => openDoc(h.id)} className={btnSecondary}>
                        {t('semantic.open')}
                      </button>
                      <button type="button" disabled={why[h.id]?.loading} onClick={() => void explainServer(h)} className={`inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60 ${focusRing}`}>
                        <SparklesIcon className="h-4 w-4" />
                        {why[h.id]?.loading ? t('semantic.explaining') : t('semantic.why')}
                      </button>
                    </div>
                    {why[h.id] && !why[h.id].loading && (
                      <p className={`mt-2 whitespace-pre-wrap rounded-lg border p-3 text-xs ${why[h.id].error ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200' : 'border-purple-200 bg-white text-slate-700 dark:border-purple-900 dark:bg-slate-900 dark:text-slate-300'}`}>
                        {why[h.id].text}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
