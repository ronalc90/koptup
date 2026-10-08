'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { AssistantError, ask, ensurePolicyBot, forgetPolicyBot, type AssistantAnswer } from '../lib/assistant';
import { policyDocs } from '../lib/policies';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  answer?: AssistantAnswer;
  error?: boolean;
}

/** Chat del colaborador con el asistente de políticas (IA real vía backend, con citas). */
export default function Assistant() {
  const t = useTranslations('demoHrms.assistant');
  const locale = useLocale();
  const lang = locale === 'en' ? 'en' : 'es';
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs, busy]);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setText('');
    const history = msgs.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: 'user', content: q }]);
    setBusy(true);
    const docs = policyDocs(lang);
    try {
      let botId = await ensurePolicyBot(lang, docs, t('persona'), t('botName'));
      let answer: AssistantAnswer;
      try {
        answer = await ask(botId, q, history);
      } catch (err) {
        if (err instanceof AssistantError && err.kind === 'server') {
          forgetPolicyBot(lang);
          botId = await ensurePolicyBot(lang, docs, t('persona'), t('botName'));
          answer = await ask(botId, q, history);
        } else throw err;
      }
      setMsgs((m) => [...m, { role: 'assistant', content: answer.reply, answer }]);
    } catch (err) {
      const kind = err instanceof AssistantError ? err.kind : 'server';
      setMsgs((m) => [...m, { role: 'assistant', content: t(`errors.${kind}`), error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mb-2">{t('intro')}</p>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1" aria-live="polite">
        {msgs.length === 0 && (
          <div className="space-y-1.5">
            {(['q1', 'q2', 'q3', 'q4'] as const).map((k) => (
              <button key={k} type="button" onClick={() => send(t(`suggestions.${k}`))} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white dark:bg-secondary-800 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950">
                {t(`suggestions.${k}`)}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs whitespace-pre-line ${m.role === 'user' ? 'bg-violet-600 text-white rounded-br-sm' : m.error ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100 border border-secondary-200 dark:border-secondary-700 rounded-bl-sm'}`}>
              {m.content}
              {m.answer && m.answer.sources.length > 0 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-[10px] font-semibold text-violet-700 dark:text-violet-300">{t('sources', { n: m.answer.sources.length })}</summary>
                  <ul className="mt-1 space-y-1">
                    {m.answer.sources.map((s) => (
                      <li key={s.index} className="text-[10px] text-secondary-600 dark:text-secondary-300">
                        <span className="font-semibold">[{s.index}] {s.name}</span>
                        <span className="block line-clamp-3">{s.chunk}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {m.answer && (
                <p className="mt-1 text-[9px] text-secondary-500">
                  {m.answer.llm ? t('modeLlm', { model: m.answer.model }) : m.answer.providerError ? t('modeProviderError') : t('modeExtractive')}
                </p>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-xs text-secondary-500">{t('thinking')}</p>}
        <div ref={endRef} />
      </div>
      <form
        className="flex gap-1.5 mt-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder={t('placeholder')} aria-label={t('placeholder')} className="flex-1 min-w-0 px-3 py-2 rounded-full text-xs border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <button type="submit" disabled={busy || !text.trim()} aria-label={t('send')} className="p-2 rounded-full bg-violet-600 text-white disabled:opacity-50">
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
