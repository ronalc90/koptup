'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { SparklesIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { PRIORITY_STYLES, Priority, TriageMsg, TriageResult } from './types';

interface Props {
  onBook: () => void;
}

export default function TriagePanel({ onBook }: Props) {
  const t = useTranslations('demoTelemed');
  const [triageInput, setTriageInput] = useState('');
  const [triageMsgs, setTriageMsgs] = useState<TriageMsg[]>([{ id: 'ai0', from: 'ai', text: t('triage.ai_intro') }]);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);

  function classify(text: string): TriageResult {
    const lower = text.toLowerCase();
    if (/(pecho|chest|disnea|aire|aliento|breath)/.test(lower)) {
      return {
        urgency: 'red',
        specialties: [t('specialties.cardio'), t('specialties.pneumo'), t('specialties.general')],
        recommendation: 'Consultar urgencias presencial / videoconsulta inmediata. Riesgo cardiovascular potencial.',
      };
    }
    if (/(fiebre|tos|fever|cough|garganta)/.test(lower)) {
      return {
        urgency: 'yellow',
        specialties: [t('specialties.general'), t('specialties.pneumo')],
        recommendation: 'Videoconsulta el mismo día. Solicitar hemograma y PCR.',
      };
    }
    if (/(piel|rash|picaz|skin|erup)/.test(lower)) {
      return {
        urgency: 'green',
        specialties: [t('specialties.derma')],
        recommendation: 'Agendar dermatología en las próximas 48-72h.',
      };
    }
    if (/(cabeza|migra|head)/.test(lower)) {
      return {
        urgency: 'yellow',
        specialties: [t('specialties.neuro'), t('specialties.general')],
        recommendation: 'Evaluación clínica en 24h. Considerar imágenes si persiste.',
      };
    }
    return {
      urgency: 'green',
      specialties: [t('specialties.general')],
      recommendation: 'Reservar consulta de medicina general.',
    };
  }

  function runTriage(text: string) {
    if (!text.trim()) return;
    setTriageMsgs((m) => [...m, { id: `u${Date.now()}`, from: 'user', text: text.trim() }]);
    setTriageInput('');
    setTriageLoading(true);
    setTriageResult(null);
    setTimeout(() => {
      const r = classify(text);
      setTriageResult(r);
      setTriageMsgs((m) => [...m, { id: `a${Date.now()}`, from: 'ai', text: r.recommendation }]);
      setTriageLoading(false);
    }, 900);
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            {t('triage.title')}
          </CardTitle>
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">{t('triage.subtitle')}</p>
        </CardHeader>
        <CardContent>
          <div className="h-72 overflow-y-auto bg-secondary-50 dark:bg-secondary-950/40 rounded-xl p-3 space-y-2 mb-3" aria-live="polite">
            {triageMsgs.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white border border-secondary-200 dark:border-secondary-700'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5">
                    {m.from === 'user' ? t('triage.you') : t('triage.ai')}
                  </p>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
            {triageLoading && (
              <div className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                <CpuChipIcon className="w-4 h-4 animate-pulse" />
                {t('triage.analyzing')}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              value={triageInput}
              onChange={(e) => setTriageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runTriage(triageInput)}
              placeholder={t('triage.placeholder')}
              aria-label={t('triage.placeholder')}
            />
            <Button onClick={() => runTriage(triageInput)} disabled={triageLoading}>
              {t('triage.send')}
            </Button>
          </div>
          <div className="mt-3">
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-2">{t('triage.examples.title')}</p>
            <div className="flex flex-wrap gap-2">
              {(['ex1', 'ex2', 'ex3', 'ex4'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => runTriage(t(`triage.examples.${k}`))}
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
          <CardTitle className="text-base">{t('triage.urgencyLevel')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!triageResult && <p className="text-sm text-secondary-500 dark:text-secondary-400">{t('triage.disclaimer')}</p>}
          {triageResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ring-2 ${PRIORITY_STYLES[triageResult.urgency].ring} bg-white dark:bg-secondary-800`}>
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${PRIORITY_STYLES[triageResult.urgency].dot}`} />
                  <p className="font-semibold text-secondary-900 dark:text-white">
                    {t(`queue.priority.${triageResult.urgency as Priority}`)}
                  </p>
                </div>
                <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-2">{triageResult.recommendation}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400 mb-2">
                  {t('triage.suggestedSpecialties')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {triageResult.specialties.map((s) => (
                    <Badge key={s} variant="primary">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button fullWidth onClick={onBook}>{t('triage.bookNow')}</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTriageResult(null);
                    setTriageMsgs([{ id: 'ai0', from: 'ai', text: t('triage.ai_intro') }]);
                  }}
                >
                  {t('triage.reset')}
                </Button>
              </div>
            </div>
          )}
          <p className="text-[11px] text-secondary-400 dark:text-secondary-500 mt-4 italic">* {t('triage.disclaimer')}</p>
        </CardContent>
      </Card>
    </section>
  );
}
