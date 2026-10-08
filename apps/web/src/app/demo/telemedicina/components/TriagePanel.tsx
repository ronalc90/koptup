'use client';

/**
 * Orientación de síntomas por reglas fijas de ejemplo (no usa IA y no es un diagnóstico).
 * Los signos de alarma muestran la derivación a urgencias / línea 123 en lugar de agendar.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ExclamationTriangleIcon, ListBulletIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { classifySymptoms } from './logic';
import { PRIORITY_STYLES } from './ui';
import type { LogFn } from './store';
import type { SpecKey, TriageResult } from './types';

interface Msg {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

export default function TriagePanel({ onBook, log }: { onBook: (spec: SpecKey) => void; log: LogFn }) {
  const t = useTranslations('demoTelemed');
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [busy, setBusy] = useState(false);

  function run(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    setMsgs((m) => [...m, { id: m.length + 1, from: 'user', text: clean }]);
    setInput('');
    setBusy(true);
    setResult(null);
    window.setTimeout(() => {
      const r = classifySymptoms(clean);
      setResult(r);
      setMsgs((m) => [...m, { id: m.length + 1, from: 'bot', text: t(`triage.reco.${r.rule}`) }]);
      setBusy(false);
      log('patient', 'triageRun', { rule: { t: `triage.rules.${r.rule}` } });
    }, 500);
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListBulletIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            {t('triage.title')}
          </CardTitle>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('triage.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-y-auto bg-secondary-50 dark:bg-secondary-950/40 rounded-xl p-3 space-y-2 mb-3" aria-live="polite">
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white border border-secondary-200 dark:border-secondary-700">
                <p className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">{t('triage.bot')}</p>
                <p>{t('triage.intro')}</p>
              </div>
            </div>
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white border border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">{m.from === 'user' ? t('triage.you') : t('triage.bot')}</p>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {busy && <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('triage.analyzing')}</p>}
          </div>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') run(input);
              }}
              placeholder={t('triage.placeholder')}
              aria-label={t('triage.placeholder')}
            />
            <Button onClick={() => run(input)} disabled={busy || !input.trim()}>
              {t('triage.send')}
            </Button>
          </div>
          <div className="mt-3">
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-2">{t('triage.examplesTitle')}</p>
            <div className="flex flex-wrap gap-2">
              {(['ex1', 'ex2', 'ex3', 'ex4', 'ex5'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => run(t(`triage.examples.${k}`))}
                  disabled={busy}
                  className="text-xs px-2.5 py-1 rounded-full border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-200 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  {t(`triage.examples.${k}`)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="bordered" padding="md">
        <CardHeader>
          <CardTitle className="text-base">{t('triage.resultTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!result && <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('triage.resultEmpty')}</p>}
          {result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ring-2 ${PRIORITY_STYLES[result.urgency].ring} bg-white dark:bg-secondary-800`}>
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${PRIORITY_STYLES[result.urgency].dot}`} />
                  <p className="font-semibold text-secondary-900 dark:text-white">{t(`priority.${result.urgency}`)}</p>
                </div>
                <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-2">{t(`triage.reco.${result.rule}`)}</p>
                <p className="text-[11px] text-secondary-500 mt-2">{t('triage.ruleApplied', { rule: t(`triage.rules.${result.rule}`) })}</p>
              </div>
              {result.alarm ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-900 dark:text-red-100 space-y-2"
                >
                  <p className="flex items-start gap-2 font-semibold">
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                    {t('triage.alarmTitle')}
                  </p>
                  <p>{t('triage.alarmBody')}</p>
                  <p className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
                    <PhoneIcon className="w-4 h-4" /> {t('triage.call123')}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2">{t('triage.suggested')}</p>
                  <div className="flex flex-col gap-2">
                    {result.specs.map((s) => (
                      <Button key={s} variant="outline" onClick={() => onBook(s)}>
                        {t('triage.book', { spec: t(`specialties.${s}`) })}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  setResult(null);
                  setMsgs([]);
                }}
              >
                {t('triage.reset')}
              </Button>
            </div>
          )}
          <p className="text-[11px] text-secondary-500 dark:text-secondary-400 mt-4">{t('triage.disclaimer')}</p>
        </CardContent>
      </Card>
    </section>
  );
}
