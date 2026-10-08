'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { SITES } from '../lib/catalog';
import { useHr } from '../lib/store';
import { active, enps } from '../lib/selectors';
import type { Survey } from '../lib/types';
import { Field, Modal, SectionTitle, btn, inputCls, useFmt } from './ui';

/**
 * Clima laboral: resultados de las encuestas de pulso (eNPS) y lanzamiento de
 * una nueva. El envío es simulado y las respuestas se generan con el botón
 * "Simular respuestas" para ver cómo cambia el indicador.
 */
export default function ClimateCard() {
  const t = useTranslations('demoHrms.climate');
  const ts = useTranslations('demoHrms.sites');
  const { state, dispatch } = useHr();
  const f = useFmt();
  const [launching, setLaunching] = useState(false);
  const [question, setQuestion] = useState<Survey['question']>('enps');
  const [audience, setAudience] = useState<Survey['audience']>('all');
  const sorted = useMemo(() => [...state.surveys].sort((a, b) => (a.sentOn < b.sentOn ? -1 : 1)), [state.surveys]);
  const closed = sorted.filter((s) => s.closed);
  const last = closed[closed.length - 1];
  const open = sorted.filter((s) => !s.closed);
  const list = active(state);

  const simulate = (s: Survey) => {
    // Respuestas deterministas según el número de la encuesta (no aleatorias en cada clic).
    const n = Number(s.id.replace(/\D/g, '')) || 1;
    const responses = Math.round(s.invited * (0.68 + (n % 5) * 0.03));
    const promoters = Math.round(responses * (0.46 + (n % 4) * 0.025));
    const detractors = Math.round(responses * (0.13 + (n % 3) * 0.02));
    dispatch({ type: 'survey.responses', id: s.id, promoters, passives: responses - promoters - detractors, detractors });
    toast.success(t('simulated', { n: responses }));
  };

  const responses = (s: Survey) => s.promoters + s.passives + s.detractors;

  return (
    <Card variant="bordered">
      <SectionTitle
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <button type="button" className={btn.small} onClick={() => setLaunching(true)}>
            {t('launch')}
          </button>
        }
      />
      {last && (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-secondary-500">{t(`questions.${last.question}`)}</p>
              <p className="text-3xl font-bold text-emerald-600">{enps(last) > 0 ? '+' : ''}{enps(last)}</p>
            </div>
            <p className="text-xs text-secondary-500 text-right">
              {t('participation', { n: responses(last), total: last.invited, pct: f.num((responses(last) / last.invited) * 100) })}
              <br />
              {f.date(last.sentOn)}
            </p>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden" aria-label={t('distribution')}>
            <div className="bg-emerald-500" style={{ width: `${(last.promoters / responses(last)) * 100}%` }} />
            <div className="bg-amber-400" style={{ width: `${(last.passives / responses(last)) * 100}%` }} />
            <div className="bg-red-500" style={{ width: `${(last.detractors / responses(last)) * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-secondary-600 dark:text-secondary-300">
            <span>● {t('promoters', { n: last.promoters })}</span>
            <span>● {t('passives', { n: last.passives })}</span>
            <span>● {t('detractors', { n: last.detractors })}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 mb-1">{t('history')}</p>
            <div className="flex items-end gap-2 h-16">
              {closed.filter((s) => s.question === 'enps').map((s) => {
                const v = enps(s);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center justify-end h-full" title={`${f.date(s.sentOn)}: ${v}`}>
                    <span className="text-[10px] text-secondary-600 dark:text-secondary-300">{v}</span>
                    <div className="w-full rounded-t bg-violet-400 dark:bg-violet-600" style={{ height: `${Math.max(6, v)}%` }} />
                    <span className="text-[10px] text-secondary-500 mt-0.5">{f.date(s.sentOn, 'dayMonth')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {open.map((s) => (
        <div key={s.id} className="mt-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-sm">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-secondary-900 dark:text-white">{t(`questions.${s.question}`)}</p>
            <Badge variant="info" size="sm">{t('open')}</Badge>
          </div>
          <p className="text-xs text-secondary-600 dark:text-secondary-300 mt-1">{t('sent', { n: s.invited, audience: s.audience === 'all' ? t('audienceAll') : ts(s.audience) })}</p>
          <button type="button" className={`${btn.small} mt-2`} onClick={() => simulate(s)}>
            {t('simulate')}
          </button>
        </div>
      ))}
      {launching && (
        <Modal title={t('launchTitle')} subtitle={t('launchSubtitle')} onClose={() => setLaunching(false)} size="sm" labelId="hrms-survey-title">
          <div className="space-y-3">
            <Field label={t('question')} htmlFor="survey-q">
              <select id="survey-q" className={inputCls} value={question} onChange={(e) => setQuestion(e.target.value as Survey['question'])}>
                {(['enps', 'workload', 'safety'] as const).map((q) => (
                  <option key={q} value={q}>
                    {t(`questions.${q}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('audience')} htmlFor="survey-a">
              <select id="survey-a" className={inputCls} value={audience} onChange={(e) => setAudience(e.target.value as Survey['audience'])}>
                <option value="all">{t('audienceAll')} ({list.length})</option>
                {SITES.map((s) => (
                  <option key={s} value={s}>
                    {ts(s)} ({list.filter((e) => e.site === s).length})
                  </option>
                ))}
              </select>
            </Field>
            <p className="text-[11px] text-secondary-500">{t('channelNote')}</p>
            <div className="flex justify-end gap-2">
              <button type="button" className={btn.outline} onClick={() => setLaunching(false)}>
                {t('cancel')}
              </button>
              <button
                type="button"
                className={btn.primary}
                onClick={() => {
                  const invited = audience === 'all' ? list.length : list.filter((e) => e.site === audience).length;
                  dispatch({ type: 'survey.launch', survey: { question, audience, invited } });
                  setLaunching(false);
                  toast.success(t('launched', { n: invited }));
                }}
              >
                {t('send')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
