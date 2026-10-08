'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowPathIcon, ChevronRightIcon, CpuChipIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { KB_ARTICLES, type Ticket } from './data';
import { AiError, draftReply, ensureKbBot, forgetKbBot, stripCitations, type AiDraft } from './ai';
import { Note } from './ui';
import type { HdText } from './useHelpdeskText';

type Phase = 'idle' | 'preparing' | 'asking' | 'done' | 'error';

interface Props {
  hd: HdText;
  ticket: Ticket;
  customerText: string;
  onInsert: (text: string) => void;
}

export default function AiDraftPanel({ hd, ticket, customerText, onInsert }: Props) {
  const { t, tx } = hd;
  const [phase, setPhase] = useState<Phase>('idle');
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [error, setError] = useState<AiError['kind'] | null>(null);
  const [openSource, setOpenSource] = useState<number | null>(null);
  const runRef = useRef(0);

  // Un borrador por ticket: al cambiar de ticket se descarta el anterior.
  useEffect(() => {
    runRef.current += 1;
    setPhase('idle');
    setDraft(null);
    setError(null);
    setOpenSource(null);
  }, [ticket.id]);

  const kbDocs = () =>
    KB_ARTICLES.map((a) => ({
      name: `${t(`kb.articles.${a.id}.title`)}.txt`,
      text: [
        t(`kb.articles.${a.id}.title`),
        '',
        t(`kb.articles.${a.id}.body`),
        '',
        t('ai.docTemplateLabel'),
        t(`kb.articles.${a.id}.reply`, { name: t('ai.docNamePlaceholder') }),
      ].join('\n'),
    }));

  const generate = async () => {
    const run = ++runRef.current;
    setError(null);
    setDraft(null);
    setOpenSource(null);
    setPhase('preparing');
    const docs = kbDocs();
    const message = t('ai.prompt', {
      name: hd.firstName(ticket.customer),
      channel: t(`channels.${ticket.channel}`),
      subject: tx(ticket.subject),
      // Los mensajes más recientes del cliente, recortados para no pasar el límite de la pregunta.
      messages: customerText.length > 1200 ? `…${customerText.slice(-1200)}` : customerText,
      language: t(`languages.${ticket.language}`),
    });
    try {
      const bot = await ensureKbBot(hd.lang, docs, t('ai.persona'), t('ai.botName'));
      if (run !== runRef.current) return;
      setPhase('asking');
      const result = await draftReply(bot, message);
      if (run !== runRef.current) return;
      setDraft(result);
      setPhase('done');
    } catch (err) {
      if (run !== runRef.current) return;
      // Un error del servidor puede venir de un bot que ya no existe: la próxima vez se recrea.
      if (err instanceof AiError && err.kind === 'server') forgetKbBot(hd.lang);
      setError(err instanceof AiError ? err.kind : 'server');
      setPhase('error');
    }
  };

  const busy = phase === 'preparing' || phase === 'asking';

  return (
    <div className="p-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-primary-800 dark:text-primary-200 flex items-center gap-1.5">
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          {t('ai.title')}
        </p>
        <Button size="sm" onClick={generate} disabled={busy} className="whitespace-nowrap">
          {busy ? <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" aria-hidden="true" /> : <SparklesIcon className="h-4 w-4 mr-1" aria-hidden="true" />}
          {phase === 'done' || phase === 'error' ? t('ai.again') : t('ai.button')}
        </Button>
      </div>
      <Note className="mt-1.5">{t('ai.hint')}</Note>

      {busy && (
        <p className="mt-2 text-xs text-secondary-700 dark:text-secondary-300 flex items-center gap-1.5" aria-live="polite">
          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          {phase === 'preparing' ? t('ai.preparing') : t('ai.asking')}
        </p>
      )}

      {phase === 'error' && error && (
        <p className="mt-2 text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5" role="alert">
          <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {t(`ai.errors.${error}`)}
        </p>
      )}

      {phase === 'done' && draft && (
        <div className="mt-2 space-y-2">
          <p
            className={`text-[11px] flex items-start gap-1.5 ${draft.llm ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}
          >
            <CpuChipIcon className="h-3.5 w-3.5 flex-shrink-0 mt-px" aria-hidden="true" />
            {draft.llm
              ? t('ai.modeLlm', {
                  model: draft.model,
                  ms: draft.latencyMs,
                  cost: draft.costUSD !== null ? hd.decimal(draft.costUSD, 5) : '—',
                })
              : draft.providerError
                ? t('ai.modeProviderError')
                : t('ai.modeExtractive')}
          </p>
          <div className="rounded-md bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 p-2.5 text-sm text-secondary-800 dark:text-secondary-200 whitespace-pre-wrap">
            {draft.reply}
          </div>
          {draft.sources.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-secondary-500 mb-1">{t('ai.sources')}</p>
              <div className="flex flex-wrap gap-1.5">
                {draft.sources.map((s) => (
                  <button
                    key={s.index}
                    type="button"
                    onClick={() => setOpenSource(openSource === s.index ? null : s.index)}
                    aria-expanded={openSource === s.index}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-secondary-300 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:border-primary-400"
                  >
                    [{s.index}] {s.name}
                  </button>
                ))}
              </div>
              {openSource !== null && (
                <p className="mt-1.5 text-[11px] text-secondary-600 dark:text-secondary-400 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-md p-2 whitespace-pre-wrap">
                  {draft.sources.find((s) => s.index === openSource)?.chunk}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => onInsert(stripCitations(draft.reply))}
            className="text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline inline-flex items-center gap-1"
          >
            {t('ai.insert')}
            <ChevronRightIcon className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
