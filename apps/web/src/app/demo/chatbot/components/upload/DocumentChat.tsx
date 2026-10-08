'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Tooltip from '../ui/Tooltip';
import {
  DemoRagApiError,
  askDemoDocument,
  type DemoCitation,
  type DemoDocument,
  type DemoErrorCode,
  type DemoLimits,
} from './api';
import { demoErrorText, unavailableReasonFor, type UploadDemoTranslator } from './messages';

interface DocumentChatProps {
  doc: DemoDocument;
  limits: DemoLimits;
  /** Volver al formulario para subir otro documento. */
  onReset: (opts?: { expired?: boolean }) => void;
  onUnavailable: (reason: 'budget_exhausted' | 'disabled') => void;
  /** Se llama en cada pregunta enviada (la página dispara demo_start una sola vez). */
  onQuestion: () => void;
}

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: DemoCitation[];
  notFound?: boolean;
  pending?: boolean;
}

const SUGGESTION_KEYS = ['summary', 'dates', 'requirements'] as const;

/** Grupos entre corchetes y referencias de página/fragmento dentro de ellos. */
const BRACKET_SPLIT = /(\[[^\]\n]{1,80}\])/g;
const IS_BRACKET = /^\[[^\]\n]{1,80}\]$/;
const CITATION_ITEM = /(p\.|p\b|pág\.?|pag\.?|página|pagina|page|fragmento|fragment|frag\.?)\s*(\d{1,4})/gi;

function citationNumber(c: DemoCitation): number | undefined {
  return c.page ?? c.fragment;
}

function citationLabel(t: UploadDemoTranslator, c: DemoCitation): string {
  return c.page !== undefined ? t('chat.page', { n: c.page }) : t('chat.fragment', { n: c.fragment ?? 0 });
}

/** Negritas `**x**` del modelo. */
function renderBold(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    return bold ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-secondary-900 dark:text-white">
        {bold[1]}
      </strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    );
  });
}

/**
 * Respuesta con las citas `[p. N]` / `[fragmento N]` convertidas en chips con
 * tooltip del extracto (mismo patrón visual que las citas `[n]` de ChatPanel).
 */
function renderAnswer(
  text: string,
  citations: DemoCitation[] | undefined,
  unit: DemoDocument['citationUnit'],
  t: UploadDemoTranslator,
): ReactNode[] {
  return text.split(BRACKET_SPLIT).map((part, i) => {
    if (!IS_BRACKET.test(part)) return <span key={i}>{renderBold(part, String(i))}</span>;
    const numbers = Array.from(part.matchAll(CITATION_ITEM), (m) => Number(m[2]));
    if (numbers.length === 0) return <span key={i}>{part}</span>;
    return (
      <span key={i}>
        {numbers.map((n) => {
          const citation = citations?.find((c) => citationNumber(c) === n);
          const label = unit === 'page' ? t('chat.page', { n }) : t('chat.fragment', { n });
          const chip = (
            <span className="mx-0.5 inline-flex items-center rounded bg-primary-100 px-1 py-0 align-baseline text-[10px] font-semibold text-primary-800 dark:bg-primary-900/60 dark:text-primary-100">
              {label}
            </span>
          );
          return citation ? (
            <Tooltip
              key={`${i}-${n}`}
              content={
                <span className="block whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                  {citation.excerpt.length > 220 ? `${citation.excerpt.slice(0, 220)}…` : citation.excerpt}
                </span>
              }
              side="top"
              maxWidth={320}
            >
              {chip}
            </Tooltip>
          ) : (
            <span key={`${i}-${n}`}>{chip}</span>
          );
        })}
      </span>
    );
  });
}

function SourceItem({ citation, t }: { citation: DemoCitation; t: UploadDemoTranslator }) {
  const [open, setOpen] = useState(false);
  const long = citation.excerpt.length > 180;
  return (
    <li className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-xs dark:border-secondary-700 dark:bg-secondary-900">
      <span className="inline-flex items-center rounded bg-primary-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary-800 dark:bg-primary-900/60 dark:text-primary-100">
        {citationLabel(t, citation)}
      </span>
      <p
        className={`mt-1.5 whitespace-pre-wrap leading-relaxed text-secondary-700 dark:text-secondary-300 ${
          open ? '' : 'line-clamp-3'
        }`}
      >
        {citation.excerpt}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          {open ? t('chat.showLess') : t('chat.showMore')}
        </button>
      ) : null}
    </li>
  );
}

/** Chat sobre el documento subido: contador x/10, citas visibles y aviso de borrado en 1 hora. */
export default function DocumentChat({ doc, limits, onReset, onUnavailable, onQuestion }: DocumentChatProps) {
  const t = useTranslations('demoChatbot.uploadDemo');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatItem[]>(() => [
    { id: 'welcome', role: 'assistant', content: t('chat.welcome', { name: doc.name }) },
  ]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<DemoErrorCode | null>(null);
  const [used, setUsed] = useState(doc.questionsUsed);
  const [expired, setExpired] = useState(false);

  const max = doc.maxQuestions;
  const limitReached = used >= max;
  const hasAsked = messages.some((m) => m.role === 'user');

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, error]);

  // El backend borra el documento a la hora; la UI lo refleja a tiempo.
  useEffect(() => {
    const ms = Date.parse(doc.expiresAt) - Date.now();
    if (!Number.isFinite(ms) || ms <= 0) {
      setExpired(true);
      return;
    }
    const id = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(id);
  }, [doc.expiresAt]);

  const expiryTime = new Date(doc.expiresAt).toLocaleTimeString(locale === 'en' ? 'en-US' : 'es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const send = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || asking || limitReached || expired) return;
      if (question.length > limits.maxQuestionChars) {
        setError('invalid_question');
        return;
      }
      onQuestion();
      setError(null);
      setInput('');
      setAsking(true);
      const stamp = Date.now();
      const pendingId = `a-${stamp}`;
      setMessages((prev) => [
        ...prev,
        { id: `u-${stamp}`, role: 'user', content: question },
        { id: pendingId, role: 'assistant', content: '', pending: true },
      ]);
      try {
        const res = await askDemoDocument(doc.docId, question);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingId
              ? { id: pendingId, role: 'assistant', content: res.answer, citations: res.citations, notFound: res.notFound }
              : m,
          ),
        );
        setUsed(res.questionsUsed);
      } catch (err) {
        const code: DemoErrorCode = err instanceof DemoRagApiError ? err.code : 'unknown';
        setMessages((prev) => prev.filter((m) => m.id !== pendingId));
        const unavailable = unavailableReasonFor(code);
        if (unavailable) {
          onUnavailable(unavailable);
          return;
        }
        if (code === 'document_not_found') setExpired(true);
        else if (code === 'question_limit') setUsed(max);
        else {
          setInput(question); // para reintentar sin volver a escribir
          setError(code);
        }
      } finally {
        setAsking(false);
      }
    },
    [asking, doc.docId, expired, limitReached, limits.maxQuestionChars, max, onQuestion, onUnavailable],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  const pagesLabel = doc.pagesEstimated
    ? t('chat.pagesEstimated', { count: doc.pages })
    : t('chat.pages', { count: doc.pages });
  const inputDisabled = asking || limitReached || expired;

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-secondary-50 dark:bg-secondary-950">
      {/* Encabezado: documento, contador y avisos */}
      <header className="border-b border-secondary-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/85">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <DocumentTextIcon className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold leading-tight tracking-tight text-secondary-900 dark:text-white">
                {doc.name}
              </h2>
              <p className="text-[10.5px] leading-tight text-secondary-500 dark:text-secondary-400">
                {doc.kind.toUpperCase()} · {pagesLabel}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
                limitReached
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                  : 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-200'
              }`}
              aria-live="polite"
            >
              {t('chat.counter', { used, max })}
            </span>
            <button
              type="button"
              onClick={() => onReset({ expired })}
              disabled={asking}
              aria-label={t('chat.newDocument')}
              className="inline-flex items-center gap-1 rounded-md border border-secondary-200 px-2 py-1 text-[11px] font-medium text-secondary-600 transition hover:border-primary-300 hover:bg-secondary-50 hover:text-secondary-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800 dark:hover:text-white"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{t('chat.newDocument')}</span>
            </button>
          </div>
        </div>
        <div className="mx-auto mt-2 flex w-full max-w-3xl flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <p className="inline-flex items-center gap-1 text-secondary-600 dark:text-secondary-400">
            <ClockIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('chat.expiry', { time: expiryTime })}
          </p>
          <p className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('warning.title')}
          </p>
        </div>
      </header>

      {/* Conversación */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                    <span className="sr-only">{t('chat.you')}: </span>
                    {msg.content}
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[85%] space-y-2">
                  <div className="rounded-2xl rounded-bl-sm border border-secondary-200 bg-white px-4 py-3 text-[14px] leading-relaxed text-secondary-800 shadow-sm dark:border-secondary-800 dark:bg-secondary-900 dark:text-secondary-100">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-primary-500 to-violet-600 text-[10px] font-bold text-white shadow-sm">
                        K
                      </span>
                      <span className="text-[11px] font-semibold text-secondary-700 dark:text-secondary-300">
                        {t('chat.assistant')}
                      </span>
                    </div>
                    {msg.pending ? (
                      <span className="inline-flex items-center gap-1 text-secondary-500 dark:text-secondary-400">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500" />
                        <span className="ml-2 text-xs">{t('chat.thinking')}</span>
                      </span>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {renderAnswer(msg.content, msg.citations, doc.citationUnit, t)}
                      </div>
                    )}
                    {msg.notFound ? (
                      <p className="mt-2 text-[11px] italic text-secondary-500 dark:text-secondary-400">
                        {t('chat.notFoundHint')}
                      </p>
                    ) : null}
                  </div>

                  {msg.citations && msg.citations.length > 0 ? (
                    <div className="px-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                        {t('chat.sources')}
                      </p>
                      <ul className="mt-1.5 space-y-1.5">
                        {msg.citations.map((c, i) => (
                          <SourceItem key={`${msg.id}-${citationNumber(c) ?? i}-${i}`} citation={c} t={t} />
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {/* Sugerencias antes de la primera pregunta */}
                  {msg.id === 'welcome' && !hasAsked && !limitReached && !expired ? (
                    <div className="flex flex-wrap items-center gap-2 px-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                        {t('chat.suggestionsTitle')}
                      </span>
                      {SUGGESTION_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => void send(t(`chat.suggestions.${key}`))}
                          disabled={asking}
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-secondary-700 transition hover:-translate-y-px hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-primary-950/40 dark:hover:text-primary-200"
                        >
                          <SparklesIcon className="h-3 w-3 text-primary-500 group-hover:text-primary-600" aria-hidden="true" />
                          {t(`chat.suggestions.${key}`)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {limitReached && !expired ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-semibold">{t('chat.limitReached', { max })}</p>
              <p className="mt-0.5 text-xs">{t('chat.limitReachedBody')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  {t('cta.schedule')}
                </Link>
                <button
                  type="button"
                  onClick={() => onReset()}
                  className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium transition hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40"
                >
                  {t('chat.newDocument')}
                </button>
              </div>
            </div>
          ) : null}

          {expired ? (
            <div className="rounded-xl border border-secondary-200 bg-white px-4 py-3 text-sm text-secondary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200">
              <p>{t('chat.expired')}</p>
              <button
                type="button"
                onClick={() => onReset({ expired: true })}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                {t('chat.newDocument')}
              </button>
            </div>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            >
              <ExclamationCircleIcon className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{demoErrorText(t, error, limits)}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Entrada */}
      <footer className="border-t border-secondary-200 bg-white px-4 py-3 dark:border-secondary-800 dark:bg-secondary-900">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <ChatBubbleLeftRightIcon className="mb-2.5 hidden h-5 w-5 shrink-0 text-secondary-400 sm:block" aria-hidden="true" />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={2}
            maxLength={limits.maxQuestionChars}
            disabled={inputDisabled}
            aria-label={t('chat.placeholder')}
            className="flex-1 resize-none rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-100"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={inputDisabled || !input.trim()}
            aria-label={t('chat.send')}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t('chat.send')}</span>
          </button>
        </div>
      </footer>
    </section>
  );
}
