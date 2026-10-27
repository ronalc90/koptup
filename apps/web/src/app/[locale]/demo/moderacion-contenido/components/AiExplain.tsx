'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SparklesIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { AiError, askPolicy, ensurePolicyBot, forgetPolicyBot, policyDocs, type AiAnswer } from '../lib/ai';
import { fmtNumber } from '../lib/format';
import { useModeration } from '../lib/store';
import { CATEGORIES } from '../lib/types';

type Phase = 'idle' | 'preparing' | 'asking' | 'done' | 'error';

/**
 * Botón «Explicar con IA»: manda el texto al asistente de nuestro servidor,
 * que responde citando el apartado de la política que aplica. Es la única
 * parte de la demo que usa un modelo de IA.
 */
export default function AiExplain({ text, compact = false }: { text: string; compact?: boolean }) {
  const t = useTranslations('demoModeration.ai');
  const tm = useTranslations('demoModeration');
  const { lang } = useModeration();
  const [phase, setPhase] = useState<Phase>('idle');
  const [answer, setAnswer] = useState<AiAnswer | null>(null);
  const [error, setError] = useState<AiError['kind'] | null>(null);
  const run = useRef(0);

  // Si cambia el texto (otro caso), la explicación anterior ya no aplica.
  useEffect(() => {
    run.current += 1;
    setPhase('idle');
    setAnswer(null);
    setError(null);
  }, [text, lang]);

  const ask = async () => {
    const id = ++run.current;
    setError(null);
    setAnswer(null);
    setPhase('preparing');
    try {
      const names = Object.fromEntries(CATEGORIES.map((c) => [c, tm(`categories.${c}.name`)]));
      const docs = policyDocs(lang, names);
      let bot = await ensurePolicyBot(lang, docs, t('persona'), t('botName'));
      if (id !== run.current) return;
      setPhase('asking');
      let res: AiAnswer;
      try {
        res = await askPolicy(bot, t('question', { text }));
      } catch (err) {
        // El servidor pudo haber perdido el asistente: se recrea una vez.
        if (!(err instanceof AiError) || err.kind !== 'server') throw err;
        forgetPolicyBot(lang);
        bot = await ensurePolicyBot(lang, docs, t('persona'), t('botName'));
        res = await askPolicy(bot, t('question', { text }));
      }
      if (id !== run.current) return;
      setAnswer(res);
      setPhase('done');
    } catch (err) {
      if (id !== run.current) return;
      setError(err instanceof AiError ? err.kind : 'server');
      setPhase('error');
    }
  };

  const busy = phase === 'preparing' || phase === 'asking';
  return (
    <div className={`rounded-lg border border-violet-200 bg-violet-50/60 p-3 text-sm dark:border-violet-800 dark:bg-violet-950/30 ${compact ? '' : 'mt-1'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={ask} isLoading={busy} disabled={busy || !text.trim()} className="gap-1 border-violet-600 text-violet-700 hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-violet-900/40">
          {!busy && <SparklesIcon className="h-4 w-4" aria-hidden />}
          {phase === 'done' ? t('again') : t('button')}
        </Button>
        <span className="text-xs text-secondary-600 dark:text-secondary-400">{busy ? t(phase === 'preparing' ? 'preparing' : 'asking') : t('hint')}</span>
      </div>
      <div aria-live="polite">
        {phase === 'error' && error && (
          <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
            {t(`errors.${error}`)}
          </p>
        )}
        {phase === 'done' && answer && (
          <div className="mt-3 space-y-2">
            <p className={`text-xs font-medium ${answer.llm ? 'text-violet-700 dark:text-violet-300' : 'text-amber-800 dark:text-amber-200'}`}>
              {answer.llm
                ? t('modeLlm', { model: answer.model, seconds: fmtNumber(answer.latencyMs / 1000, lang, 1) })
                : answer.error === 'budget_exhausted'
                  ? t('modeBudget')
                  : answer.error === 'llm_provider_error'
                    ? t('modeProviderError')
                    : t('modeExtractive')}
            </p>
            <p className="whitespace-pre-line text-secondary-800 dark:text-secondary-100">{answer.reply}</p>
            {answer.sources.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary-700 dark:text-secondary-300">{t('sources')}</p>
                <ul className="mt-1 space-y-1 text-xs text-secondary-600 dark:text-secondary-400">
                  {answer.sources.map((src) => (
                    <li key={`${src.index}-${src.name}`}>
                      <span className="font-mono">[{src.index}]</span> {src.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('disclaimer')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
