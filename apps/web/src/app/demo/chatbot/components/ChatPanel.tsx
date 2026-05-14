'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  PaperAirplaneIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { SCENARIOS, type ScenarioKey, type SourceChunk } from './data';
import Tooltip from './ui/Tooltip';
import InfoIcon from './ui/InfoIcon';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Texto completo. Para streaming usamos `streamedChars` para "tipear". */
  content: string;
  scenario?: ScenarioKey;
  sources?: SourceChunk[];
  confidence?: number;
  streamedChars?: number;
  done?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  onInput: (v: string) => void;
  onSend: () => void;
  onRunScenario: (k: ScenarioKey) => void;
  onCiteClick: (chunk: SourceChunk) => void;
  isStreaming: boolean;
  thinkingMessageId: string | null;
}

/**
 * Render del mensaje del assistant con citas `[n]` clickeables.
 * Mantenemos pura la función para facilitar tests.
 *
 * Cada cita incluye un tooltip con preview del chunk (snippet + score).
 */
function renderAssistantContent(
  text: string,
  sources: SourceChunk[] | undefined,
  onCiteClick: (c: SourceChunk) => void,
  citationTooltipLabel: string,
): React.ReactNode {
  // Regex: [n] o **bold**
  const tokens = text.split(/(\[\d+\]|\*\*[^*]+\*\*)/g);
  return tokens.map((tok, i) => {
    const citeMatch = tok.match(/^\[(\d+)\]$/);
    if (citeMatch && sources) {
      const idx = Number(citeMatch[1]) - 1;
      const chunk = sources[idx];
      if (chunk) {
        const preview =
          chunk.snippet.length > 220 ? chunk.snippet.slice(0, 220) + '…' : chunk.snippet;
        return (
          <Tooltip
            key={i}
            content={
              <span className="block">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-primary-300">
                  {citationTooltipLabel}
                </span>
                <span className="mt-1 block whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                  {preview}
                </span>
              </span>
            }
            side="top"
            maxWidth={320}
          >
            <button
              type="button"
              onClick={() => onCiteClick(chunk)}
              className="mx-0.5 inline-flex items-center rounded bg-primary-100 px-1 py-0 align-baseline text-[10px] font-semibold text-primary-800 transition hover:bg-primary-200 dark:bg-primary-900/60 dark:text-primary-100 dark:hover:bg-primary-900"
              aria-label={`source ${idx + 1}`}
            >
              [{idx + 1}]
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

function ConfidenceGauge({ value, tooltip }: { value: number; tooltip: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color = clamped >= 85 ? 'bg-emerald-500' : clamped >= 65 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <Tooltip content={tooltip} side="top" align="start">
      <div
        className="flex cursor-help items-center gap-2"
        aria-label={`confidence ${clamped}%`}
      >
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary-200 dark:bg-secondary-700">
          <div
            className={`h-full ${color} transition-all`}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="font-mono text-[10px] font-semibold text-secondary-600 dark:text-secondary-400">
          {clamped}%
        </span>
      </div>
    </Tooltip>
  );
}

export default function ChatPanel({
  messages,
  input,
  onInput,
  onSend,
  onRunScenario,
  onCiteClick,
  isStreaming,
  thinkingMessageId,
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

  const scenarioButtons = useMemo(
    () =>
      SCENARIOS.map((k) => ({
        key: k,
        label: t(`chat.scenarioLabels.${k}`),
      })),
    [t],
  );

  // Si solo está el welcome message (1 mensaje, role assistant, sin sources), considéralo "empty"
  const isEmpty =
    messages.length <= 1 && (messages[0]?.role !== 'assistant' || !messages[0]?.sources);

  return (
    <section className="flex h-full w-full flex-col bg-secondary-50 dark:bg-secondary-950">
      <header className="flex items-center justify-between gap-3 border-b border-secondary-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-secondary-800 dark:bg-secondary-900/80">
        <div className="flex items-center gap-2.5">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <div>
            <h2 className="text-[15px] font-bold leading-tight tracking-tight text-secondary-900 dark:text-white">
              {t('chat.title')}
            </h2>
            <p className="text-[10.5px] leading-tight text-secondary-500 dark:text-secondary-400">
              {t('chat.subtitle')}
            </p>
          </div>
        </div>
        <Tooltip content={t('ux.tooltips.scenarioPicker')} side="bottom" align="end">
          <div className="hidden flex-wrap items-center gap-1 md:flex">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
              {t('chat.scenarios')}
            </span>
            {scenarioButtons.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onRunScenario(s.key)}
                disabled={isStreaming}
                className="inline-flex items-center gap-1 rounded-full border border-secondary-200 bg-white px-2.5 py-1 text-[10px] font-medium text-secondary-700 transition hover:-translate-y-px hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-primary-950/40 dark:hover:text-primary-200"
              >
                <SparklesIcon className="h-3 w-3" />
                {s.label}
              </button>
            ))}
          </div>
        </Tooltip>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
      >
        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                  {msg.content}
                </div>
              </div>
            );
          }

          const isThinking = thinkingMessageId === msg.id;
          const visible = isThinking
            ? ''
            : msg.streamedChars !== undefined
            ? msg.content.slice(0, msg.streamedChars)
            : msg.content;

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
                  {isThinking ? (
                    <span className="inline-flex items-center gap-1 text-secondary-500 dark:text-secondary-400">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-500" />
                      <span className="ml-2 text-xs">{t('chat.thinking')}</span>
                    </span>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {renderAssistantContent(
                        visible,
                        msg.sources,
                        onCiteClick,
                        t('ux.tooltips.citation'),
                      )}
                      {msg.streamedChars !== undefined && !msg.done ? (
                        <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-primary-500 align-middle" />
                      ) : null}
                    </div>
                  )}
                </div>

                {!isThinking && msg.done && msg.sources && msg.sources.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                      {t('chat.sources')}
                    </span>
                    {msg.sources.map((s, i) => (
                      <Tooltip
                        key={s.id}
                        content={
                          <span className="block whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
                            {s.snippet.length > 200
                              ? s.snippet.slice(0, 200) + '…'
                              : s.snippet}
                          </span>
                        }
                        side="top"
                        maxWidth={320}
                      >
                        <button
                          type="button"
                          onClick={() => onCiteClick(s)}
                          className="inline-flex items-center gap-1 rounded-full border border-secondary-200 bg-white px-2.5 py-1 text-[10.5px] text-secondary-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-primary-950/40 dark:hover:text-primary-200"
                        >
                          <span className="font-mono">[{i + 1}]</span>
                          <span>{t(`sources.${s.sourceKey}`)}</span>
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                ) : null}

                {!isThinking && msg.done && msg.confidence !== undefined ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                        {t('chat.confidence')}
                      </span>
                      <ConfidenceGauge
                        value={msg.confidence}
                        tooltip={t('ux.tooltips.confidence')}
                      />
                      <InfoIcon content={t('ux.tooltips.confidence')} size="xs" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip content={t('ux.tooltips.feedbackUp')} side="top">
                        <button
                          type="button"
                          aria-label={t('chat.feedbackUp')}
                          className="rounded p-1 text-secondary-500 transition hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                        >
                          <HandThumbUpIcon className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t('ux.tooltips.feedbackDown')} side="top">
                        <button
                          type="button"
                          aria-label={t('chat.feedbackDown')}
                          className="rounded p-1 text-secondary-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                        >
                          <HandThumbDownIcon className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                      <Tooltip content={t('ux.tooltips.regenerate')} side="top" align="end">
                        <button
                          type="button"
                          aria-label={t('chat.regenerate')}
                          className="rounded p-1 text-secondary-500 transition hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-950/40 dark:hover:text-primary-300"
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ) : null}

                {/* Empty state: prompt suggestions clickeables debajo del welcome */}
                {isEmpty && idx === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-secondary-300 bg-white/60 px-4 py-4 dark:border-secondary-700 dark:bg-secondary-900/40">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-secondary-600 dark:text-secondary-300">
                      {t('ux.empty.title')}
                    </p>
                    <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                      {t('ux.empty.subtitle')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SCENARIOS.map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => onRunScenario(k)}
                          disabled={isStreaming}
                          className="group inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-secondary-700 transition hover:-translate-y-px hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 hover:shadow-sm dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:bg-primary-950/40 dark:hover:text-primary-200"
                        >
                          <SparklesIcon className="h-3 w-3 text-primary-500 group-hover:text-primary-600" />
                          {t(`chat.scenarioLabels.${k}`)}
                        </button>
                      ))}
                    </div>
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
            className="flex-1 resize-none rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm text-secondary-900 placeholder:text-secondary-400 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-secondary-700 dark:bg-secondary-950 dark:text-secondary-100"
            disabled={isStreaming}
            aria-label={t('chat.placeholder')}
          />
          <Tooltip content={t('ux.tooltips.send')} side="top" align="end">
            <button
              type="button"
              onClick={onSend}
              disabled={isStreaming || !input.trim()}
              aria-label={t('chat.send')}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('chat.send')}</span>
            </button>
          </Tooltip>
        </div>
      </footer>
    </section>
  );
}
