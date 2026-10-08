'use client';

/**
 * Chat embebible de un bot (`/embed/chatbot/[botId]`).
 *
 * Lee la configuración pública del bot (`GET /api/chatbot/bots/:id`) y
 * conversa con `POST /api/chatbot/bots/:id/chat` (mismo pipeline que la
 * demo: búsqueda BM25 → modelo de OpenAI o modo extractivo → citas). Cada
 * cita [n] abre el fragmento usado.
 *
 * Se pinta como una capa fija a pantalla completa para ocupar todo el iframe.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PaperAirplaneIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import {
  BotApiError,
  chatWithBot,
  getBot,
  type RemoteBotConfig,
  type RemoteChatReplySource,
} from '@/app/demo/chatbot/components/builder/api';

interface EmbedChatProps {
  botId: string | null;
  colorOverride: string | null;
  /** Abierto desde /widget.js: muestra el botón de cerrar (avisa a la página que lo insertó). */
  widget: boolean;
}

interface EmbedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: RemoteChatReplySource[];
  pending?: boolean;
  failed?: boolean;
  question?: string;
  welcome?: boolean;
}

type Status = 'loading' | 'ready' | 'notFound' | 'error';

const HEX = /^#[0-9a-f]{6}$/i;

export default function EmbedChat({ botId, colorOverride, widget }: EmbedChatProps) {
  const t = useTranslations('demoChatbot.embedPage');
  const [status, setStatus] = useState<Status>(botId ? 'loading' : 'notFound');
  const [bot, setBot] = useState<RemoteBotConfig | null>(null);
  const [messages, setMessages] = useState<EmbedMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [openSource, setOpenSource] = useState<{ msgId: string; index: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const idRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!botId) return;
    let cancelled = false;
    setStatus('loading');
    getBot(botId)
      .then((b) => {
        if (cancelled) return;
        setBot(b);
        setMessages([{ id: 'welcome', role: 'assistant', content: b.welcome, welcome: true }]);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus(err instanceof BotApiError && err.status === 404 ? 'notFound' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [botId, attempt]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, openSource]);

  const color = colorOverride ?? (bot && HEX.test(bot.color) ? bot.color : '#4F46E5');

  const send = useCallback(
    async (question: string, retryId?: string) => {
      const q = question.trim();
      if (!q || !botId || busy) return;
      setBusy(true);
      const history = messages
        .filter((m) => !m.welcome && !m.pending && !m.failed && m.content)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      let asstId = retryId;
      if (retryId) {
        setMessages((prev) => prev.map((m) => (m.id === retryId ? { ...m, pending: true, failed: false, content: '' } : m)));
      } else {
        idRef.current += 1;
        asstId = `a-${idRef.current}`;
        const userId = `u-${idRef.current}`;
        setMessages((prev) => [
          ...prev,
          { id: userId, role: 'user', content: q },
          { id: asstId!, role: 'assistant', content: '', pending: true, question: q },
        ]);
      }
      try {
        const res = await chatWithBot(botId, q, history);
        setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, pending: false, content: res.reply, sources: res.sources, question: q } : m)),
        );
      } catch {
        setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, pending: false, failed: true, question: q } : m)));
      } finally {
        setBusy(false);
      }
    },
    [botId, busy, messages],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input;
    setInput('');
    void send(q);
  };

  const close = () => {
    try {
      window.parent.postMessage({ type: 'koptup-chatbot:close', botId }, '*');
    } catch {
      /* sin ventana padre */
    }
  };

  const renderContent = (m: EmbedMessage) =>
    m.content.split(/(\[\d+\])/g).map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      const n = match ? Number(match[1]) : 0;
      const source = match ? m.sources?.[n - 1] : undefined;
      if (!source) return <span key={i}>{part}</span>;
      const active = openSource?.msgId === m.id && openSource.index === n;
      return (
        <button
          key={i}
          type="button"
          onClick={() => setOpenSource(active ? null : { msgId: m.id, index: n })}
          aria-expanded={active}
          aria-label={t('sourceTitle', { n, name: source.name })}
          className="mx-0.5 rounded px-1 align-baseline text-[11px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          [{n}]
        </button>
      );
    });

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white text-secondary-900 dark:bg-secondary-950 dark:text-secondary-100">
      <header className="flex items-center justify-between gap-2 px-4 py-3 text-white" style={{ backgroundColor: color }}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xl leading-none" aria-hidden="true">
            {bot?.avatar ?? '💬'}
          </span>
          <span className="truncate text-sm font-semibold">{bot?.name ?? ''}</span>
        </div>
        {widget ? (
          <button type="button" onClick={close} aria-label={t('close')} className="rounded p-1 hover:bg-white/20">
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </header>

      {status === 'loading' ? (
        <p className="flex flex-1 items-center justify-center text-sm text-secondary-500" role="status">
          {t('loading')}
        </p>
      ) : status === 'notFound' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" aria-hidden="true" />
          <h1 className="text-base font-bold">{t('notFoundTitle')}</h1>
          <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('notFoundBody')}</p>
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center" role="alert">
          <p className="text-sm text-secondary-600 dark:text-secondary-300">{t('errorNetwork')}</p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {t('retry')}
          </button>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-secondary-50 px-3 py-4 dark:bg-secondary-900" role="log" aria-live="polite">
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm px-3 py-2 text-sm text-white" style={{ backgroundColor: color }}>
                    {m.content}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="flex flex-col items-start gap-1.5">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm leading-relaxed shadow-sm ring-1 ring-secondary-200 dark:bg-secondary-800 dark:ring-secondary-700">
                    {m.pending ? (
                      <span className="text-secondary-500 dark:text-secondary-400" role="status">
                        {t('thinking')}
                      </span>
                    ) : m.failed ? (
                      <span className="flex flex-wrap items-center gap-2 text-red-700 dark:text-red-300">
                        {t('errorNetwork')}
                        <button
                          type="button"
                          onClick={() => m.question && void send(m.question, m.id)}
                          className="rounded border border-red-200 px-2 py-0.5 text-xs font-semibold"
                        >
                          {t('retry')}
                        </button>
                      </span>
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{renderContent(m)}</span>
                    )}
                  </div>
                  {!m.pending && m.sources && m.sources.length > 0 ? (
                    <div className="flex max-w-[90%] flex-wrap items-center gap-1 text-[11px] text-secondary-500 dark:text-secondary-400">
                      <span className="font-semibold uppercase tracking-wide">{t('sources')}</span>
                      {m.sources.map((s, i) => {
                        const n = s.index ?? i + 1;
                        const active = openSource?.msgId === m.id && openSource.index === n;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setOpenSource(active ? null : { msgId: m.id, index: n })}
                            aria-expanded={active}
                            className="max-w-full truncate rounded-full border border-secondary-200 bg-white px-2 py-0.5 hover:border-secondary-400 dark:border-secondary-700 dark:bg-secondary-800"
                          >
                            [{n}] {s.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {openSource?.msgId === m.id && m.sources?.[openSource.index - 1] ? (
                    <div className="max-w-[90%] rounded-lg border border-secondary-200 bg-white p-2.5 text-xs dark:border-secondary-700 dark:bg-secondary-800">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          {t('sourceTitle', { n: openSource.index, name: m.sources[openSource.index - 1].name })}
                        </span>
                        <button type="button" onClick={() => setOpenSource(null)} className="text-secondary-500 hover:underline">
                          {t('hideSource')}
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap text-secondary-700 dark:text-secondary-200">
                        {m.sources[openSource.index - 1].chunk}
                      </p>
                    </div>
                  ) : null}
                </div>
              ),
            )}
          </div>

          <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-secondary-200 bg-white p-2.5 dark:border-secondary-700 dark:bg-secondary-950">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              rows={1}
              maxLength={500}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              disabled={busy}
              className="min-w-0 flex-1 resize-none rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 focus:outline-none focus:ring-2 dark:border-secondary-600 dark:bg-secondary-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t('send')}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </form>
          <p className="bg-white pb-1.5 text-center text-[10px] text-secondary-400 dark:bg-secondary-950">
            <a href="https://www.koptup.com/rag" target="_blank" rel="noopener noreferrer" className="hover:underline">
              {t('poweredBy')}
            </a>
          </p>
        </>
      )}
    </div>
  );
}
