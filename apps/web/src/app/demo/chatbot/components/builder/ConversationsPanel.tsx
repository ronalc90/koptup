'use client';

/**
 * ConversationsPanel — historial real del bot (`GET /api/chatbot/bots/:id/conversations`):
 * preguntas, respuestas y fuentes, con métricas simples, exportación a CSV y
 * borrado (`DELETE …/conversations`). Son operaciones del dueño: llevan el
 * token del bot si el backend lo entregó.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowPathIcon, TrashIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

import { BotApiError, clearConversations, getConversations, isNotFoundReply, type RemoteConversationTurn } from './api';

interface ConversationsPanelProps {
  botId: string | null;
  /** Cambia para pedir una recarga (p. ej. después de guardar). */
  refreshKey: number;
}

interface Exchange {
  id: string;
  question: string;
  answer: string;
  sources: string[];
  timestamp: string;
  notFound: boolean;
}

/** Une cada pregunta con la respuesta que le sigue. */
function toExchanges(turns: RemoteConversationTurn[]): Exchange[] {
  const out: Exchange[] = [];
  for (let i = 0; i < turns.length; i += 1) {
    const turn = turns[i];
    if (turn.role !== 'user') continue;
    const next = turns[i + 1]?.role === 'assistant' ? turns[i + 1] : undefined;
    const sources = next?.sources ?? [];
    out.push({
      id: turn.id,
      question: turn.content,
      answer: next?.content ?? '',
      sources: [...new Set(sources.map((s) => s.name))],
      timestamp: turn.timestamp,
      notFound: next ? isNotFoundReply({ reply: next.content, sources: next.sources ?? [] }) : true,
    });
  }
  return out.reverse();
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

export default function ConversationsPanel({ botId, refreshKey }: ConversationsPanelProps) {
  const t = useTranslations('demoChatbot.builder.conversations');
  const locale = useLocale();
  const [turns, setTurns] = useState<RemoteConversationTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!botId) {
      setTurns([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getConversations(botId)
      .then((list) => {
        if (!cancelled) setTurns(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setTurns([]);
        setError(err instanceof BotApiError && (err.status === 401 || err.status === 403) ? 'notOwner' : 'loadFailed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [botId, refreshKey, nonce]);

  const exchanges = useMemo(() => toExchanges(turns), [turns]);
  const withSources = exchanges.filter((e) => !e.notFound && e.sources.length > 0).length;
  const notFound = exchanges.filter((e) => e.notFound).length;

  const fmtDate = useCallback(
    (iso: string) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleString(locale === 'en' ? 'en-US' : 'es-CO', { dateStyle: 'short', timeStyle: 'short' });
    },
    [locale],
  );

  const handleExport = useCallback(() => {
    if (!botId || exchanges.length === 0) return;
    const header = [t('date'), t('user'), t('assistant'), t('sources')].map(csvCell).join(',');
    const rows = [...exchanges]
      .reverse()
      .map((e) => [e.timestamp, e.question, e.answer, e.sources.join(' | ')].map(csvCell).join(','));
    const blob = new Blob([`﻿${[header, ...rows].join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversaciones-${botId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t('exported'));
  }, [botId, exchanges, t]);

  const handleClear = useCallback(async () => {
    if (!botId) return;
    if (!window.confirm(t('clearConfirm'))) return;
    try {
      await clearConversations(botId);
      setTurns([]);
      toast.success(t('cleared'));
    } catch {
      toast.error(t('loadFailed'));
    }
  }, [botId, t]);

  return (
    <section className="rounded-lg border border-secondary-200 bg-white shadow-sm dark:border-secondary-800 dark:bg-secondary-900">
      <header className="flex flex-col gap-2 border-b border-secondary-200 px-4 py-3 dark:border-secondary-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-secondary-900 dark:text-white">{t('title')}</h3>
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        {botId ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md border border-secondary-300 px-2 py-1 text-[11px] font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-800"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('refresh')}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exchanges.length === 0}
              className="inline-flex items-center gap-1 rounded-md border border-secondary-300 px-2 py-1 text-[11px] font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-secondary-800"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('export')}
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={exchanges.length === 0}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('clear')}
            </button>
          </div>
        ) : null}
      </header>

      {!botId ? (
        <p className="px-4 py-6 text-center text-xs text-secondary-500 dark:text-secondary-400">{t('saveFirst')}</p>
      ) : (
        <div className="px-4 py-3">
          <dl className="grid grid-cols-3 gap-2">
            {[
              { k: 'questions', v: String(exchanges.length) },
              { k: 'withSources', v: String(withSources) },
              { k: 'notFound', v: String(notFound) },
            ].map((c) => (
              <div key={c.k} className="rounded-lg bg-secondary-50 px-2 py-1.5 ring-1 ring-secondary-100 dark:bg-secondary-800/80 dark:ring-secondary-700/60">
                <dt className="text-[9px] uppercase tracking-wide text-secondary-500 dark:text-secondary-400">{t(c.k)}</dt>
                <dd className="font-mono text-sm font-bold text-secondary-900 dark:text-white">{c.v}</dd>
              </div>
            ))}
          </dl>

          {error ? (
            <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="alert">
              {error === 'notOwner' ? t('notOwner') : t('loadFailed')}
            </p>
          ) : exchanges.length === 0 ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-secondary-500 dark:text-secondary-400">
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4" aria-hidden="true" />
              {t('empty')}
            </p>
          ) : (
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {exchanges.map((e) => (
                <li key={e.id} className="rounded-md border border-secondary-200 px-3 py-2 text-xs dark:border-secondary-700">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-secondary-500 dark:text-secondary-400">
                    <span>{fmtDate(e.timestamp)}</span>
                    {e.notFound ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        {t('notFound')}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-semibold text-secondary-900 dark:text-white">{e.question}</p>
                  <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap text-secondary-600 dark:text-secondary-300">{e.answer}</p>
                  {e.sources.length > 0 ? (
                    <p className="mt-1 text-[10px] text-secondary-500 dark:text-secondary-400">
                      {t('sources')}: {e.sources.join(', ')}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
