'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline';
import type { ChatMessage, SourceChunk } from './data';
import Tooltip from './ui/Tooltip';

interface ChatPanelProps {
  companyName: string;
  messages: ChatMessage[];
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
  /** Preguntas sugeridas (la última está fuera de los documentos a propósito). */
  suggestions: string[];
  outOfScope: string;
  onAsk: (question: string) => void;
  onCiteClick: (chunk: SourceChunk) => void;
  onFeedback: (messageId: string, value: 'up' | 'down') => void;
  onRegenerate: (messageId: string) => void;
  /** Hay una pregunta en curso. */
  busy: boolean;
  /** La base de conocimiento todavía se está indexando. */
  preparing: boolean;
}

/**
 * Texto del asistente con citas `[n]` clicables (abren el fragmento real) y
 * negritas `**texto**`.
 */
function renderAssistantContent(
  text: string,
  sources: SourceChunk[] | undefined,
  onCiteClick: (c: SourceChunk) => void,
  citationLabel: (n: number, name: string) => string,
  citationTooltip: string,
): React.ReactNode {
  const tokens = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
  return tokens.map((tok, i) => {
    const citeMatch = tok.match(/^\[(\d+)\]$/);
    if (citeMatch && sources) {
      const chunk = sources[Number(citeMatch[1]) - 1];
      if (chunk) {
        const preview = chunk.text.length > 220 ? `${chunk.text.slice(0, 220)}…` : chunk.text;
        return (
          <Tooltip
            key={i}
            content={
              <span className="block">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-primary-300">
                  {citationTooltip}
                </span>
                <span className="mt-1 block whitespace-pre-wrap text-[10px] leading-relaxed">{preview}</span>
              </span>
            }
            side="top"
            maxWidth={320}
          >
            <button
              type="button"
              onClick={() => onCiteClick(chunk)}
              className="mx-0.5 inline-flex items-center rounded bg-primary-100 px-1 py-0 align-baseline text-[10px] font-semibold text-primary-800 transition hover:bg-primary-200 dark:bg-primary-900/60 dark:text-primary-100 dark:hover:bg-primary-900"
              aria-label={citationLabel(chunk.index, chunk.docName)}
            >
              [{chunk.index}]
            </button>
          </Tooltip>
        );
      }
    }
    const boldMatch = tok.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={i} className="font-semibold text-secondary-900 dark:text-white">
          {boldMatch[1]}
        </strong>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}

export default function ChatPanel({
  companyName,
  messages,
  input,
  onInput,
  onSend,
  suggestions,
  outOfScope,
  onAsk,
  onCiteClick,
  onFeedback,
  onRegenerate,
  busy,
  preparing,
}: ChatPanelProps) {
  const t = useTranslations('demoChatbot');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const citationLabel = (n: number, name: string) => t('chat.sourceButton', { n, name });
  const hasQuestions = messages.some((m) => m.role === 'user');
  const allSuggestions = [...suggestions.map((q) => ({ q, out: false })), { q: outOfScope, out: true }];

  const suggestionButtons = (compact: boolean) =>
    allSuggestions.map(({ q, out }) => (
      <button
        key={q}
        type="button"
        onClick={() => onAsk(q)}
        disabled={busy}
        className={`group inline-flex items-center gap-1.5 rounded-lg border bg-white text-left font-medium transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:bg-secondary-900 ${
          compact ? 'shrink-0 whitespace-nowrap px-2 py-1 text-[10.5px]' : 'max-w-full px-2.5 py-1.5 text-[11.5px] hover:-translate-y-px'
        } ${
          out
            ? 'border-dashed border-amber-300 text-amber-800 hover:border-amber-400 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/40'
            : 'border-secondary-200 text-secondary-700 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 dark:border-secondary-700 dark:text-secondary-200 dark:hover:bg-primary-950/40 dark:hover:text-primary-200'
        }`}
      >
        {out ? (
          <NoSymbolIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
        ) : (
          <SparklesIcon className="h-3 w-3 shrink-0 text-primary-500" aria-hidden="true" />
        )}
        <span className="min-w-0">
          {q}
          {out ? <span className="ml-1 text-[10px] font-normal opacity-80">({t('chat.outOfScopeTag')})</span> : null}
        </span>
      </button>
    ));

  return (
    <section className="flex h-full w-full flex-col bg-secondary-50 dark:bg-secondary-950">
      <header className="flex flex-col gap-2 border-b border-secondary-200 bg-white/80 px-4 py-2.5 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/80">
        <div className="flex items-center gap-2.5">
          <ChatBubbleLeftRightIcon className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold leading-tight tracking-tight text-secondary-900 dark:text-white">
              {t('chat.title')}
            </h2>
            <p className="truncate text-[10.5px] leading-tight text-secondary-500 dark:text-secondary-400">
              {t('chat.subtitle', { company: companyName })}
            </p>
          </div>
        </div>
        {hasQuestions ? (
          <div className="hidden min-w-0 items-center gap-1 overflow-x-auto pb-0.5 md:flex">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('chat.suggested')}
            </span>
            {suggestionButtons(true)}
          </div>
        ) : null}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                  <span className="sr-only">{t('chat.you')}: </span>
                  {msg.content}
                </div>
              </div>
            );
          }

          const meta = msg.meta;
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="min-w-0 max-w-[92%] space-y-2 sm:max-w-[85%]">
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
                    <span className="inline-flex items-center gap-1 text-secondary-500 dark:text-secondary-400" role="status">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500" />
                      <span className="ml-2 text-xs">{preparing ? t('chat.preparing') : t('chat.thinking')}</span>
                    </span>
                  ) : msg.errorKey ? (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-red-700 dark:text-red-300" role="alert">
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{t(`chat.${msg.errorKey}`)}</span>
                      <button
                        type="button"
                        onClick={() => onRegenerate(msg.id)}
                        disabled={busy}
                        className="rounded-md border border-red-200 px-2 py-0.5 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950/40"
                      >
                        {t('chat.retry')}
                      </button>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {renderAssistantContent(msg.content, msg.sources, onCiteClick, citationLabel, t('chat.citationTooltip'))}
                    </div>
                  )}
                </div>

                {!msg.pending && msg.sources && msg.sources.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                      {t('chat.sources')}
                    </span>
                    {msg.sources.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onCiteClick(s)}
                        aria-label={citationLabel(s.index, s.docName)}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-secondary-200 bg-white px-2.5 py-1 text-[10.5px] text-secondary-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-primary-950/40 dark:hover:text-primary-200"
                      >
                        <span className="font-mono">[{s.index}]</span>
                        <span className="truncate">{s.docName}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                {meta ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <p className="inline-flex items-center gap-1 text-[10.5px] text-secondary-500 dark:text-secondary-400">
                      {meta.notFound ? (
                        <>
                          <NoSymbolIcon className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                          {t('chat.notFound')}
                        </>
                      ) : meta.generative ? (
                        <>
                          <CheckBadgeIcon className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                          {t('chat.generatedBy', { model: meta.model, count: msg.sources?.length ?? 0 })}
                        </>
                      ) : meta.providerError ? (
                        <>
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                          {t('chat.providerError')}
                        </>
                      ) : (
                        <>
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                          {t('chat.extractive')}
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-1">
                      <Tooltip content={t('chat.feedbackUp')} side="top">
                        <button
                          type="button"
                          onClick={() => onFeedback(msg.id, 'up')}
                          aria-label={t('chat.feedbackUp')}
                          aria-pressed={msg.feedback === 'up'}
                          className={`rounded p-1 transition ${
                            msg.feedback === 'up'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                              : 'text-secondary-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300'
                          }`}
                        >
                          <HandThumbUpIcon className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t('chat.feedbackDown')} side="top">
                        <button
                          type="button"
                          onClick={() => onFeedback(msg.id, 'down')}
                          aria-label={t('chat.feedbackDown')}
                          aria-pressed={msg.feedback === 'down'}
                          className={`rounded p-1 transition ${
                            msg.feedback === 'down'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                              : 'text-secondary-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300'
                          }`}
                        >
                          <HandThumbDownIcon className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t('chat.regenerateTooltip')} side="top" align="end">
                        <button
                          type="button"
                          onClick={() => onRegenerate(msg.id)}
                          disabled={busy}
                          aria-label={t('chat.regenerate')}
                          className="rounded p-1 text-secondary-500 transition hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-primary-950/40 dark:hover:text-primary-300"
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ) : null}

                {msg.welcome && !hasQuestions ? (
                  <div className="mt-3 rounded-xl border border-dashed border-secondary-300 bg-white/60 px-4 py-4 dark:border-secondary-700 dark:bg-secondary-900/40">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-600 dark:text-secondary-300">
                      {t('chat.emptyTitle')}
                    </p>
                    <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{t('chat.emptySubtitle')}</p>
                    <div className="mt-3 flex flex-wrap gap-2">{suggestionButtons(false)}</div>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="border-t border-secondary-200 bg-white px-4 py-3 dark:border-secondary-800 dark:bg-secondary-900">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={2}
            maxLength={500}
            className="min-w-0 flex-1 resize-none rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-100"
            disabled={busy}
            aria-label={t('chat.placeholder')}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={busy || !input.trim()}
            aria-label={t('chat.send')}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('chat.send')}</span>
          </button>
        </div>
      </footer>
    </section>
  );
}
