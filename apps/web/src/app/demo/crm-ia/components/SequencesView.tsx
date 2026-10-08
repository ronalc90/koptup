'use client';

import { useMemo, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  Deal,
  Enrollment,
  EnrollmentStatus,
  REF_DATE,
  SEQUENCE_STEPS,
  SequenceChannel,
  addDays,
  daysBetween,
  isOpen,
} from './crm';
import { Note, SectionHeader, inputCls } from './ui';
import { useCrmText } from './useCrmText';

const CHANNEL_META: Record<SequenceChannel, { icon: typeof EnvelopeIcon; color: string }> = {
  email: { icon: EnvelopeIcon, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  whatsapp: { icon: ChatBubbleLeftRightIcon, color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  call: { icon: PhoneIcon, color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  task: { icon: CheckCircleIcon, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
};

const STATUS_VARIANT: Record<EnrollmentStatus, 'success' | 'warning' | 'info' | 'default'> = {
  active: 'success',
  paused: 'warning',
  replied: 'info',
  finished: 'default',
};

interface Props {
  deals: Deal[];
  enrollments: Enrollment[];
  onEnroll: (dealId: string) => void;
  onRunStep: (dealId: string) => void;
  onStatus: (dealId: string, status: EnrollmentStatus) => void;
  onRemove: (dealId: string) => void;
  onOpen: (id: string) => void;
  notify: (msg: string) => void;
}

export default function SequencesView({ deals, enrollments, onEnroll, onRunStep, onStatus, onRemove, onOpen, notify }: Props) {
  const tx = useCrmText();
  const { t } = tx;
  const [toEnroll, setToEnroll] = useState('');

  const rows = useMemo(
    () =>
      enrollments
        .map((e) => ({ e, deal: deals.find((d) => d.id === e.dealId) }))
        .filter((r): r is { e: Enrollment; deal: Deal } => Boolean(r.deal)),
    [enrollments, deals],
  );
  const candidates = deals.filter((d) => isOpen(d) && !enrollments.some((e) => e.dealId === d.id));

  const stats = {
    enrolled: rows.length,
    active: rows.filter((r) => r.e.status === 'active').length,
    replied: rows.filter((r) => r.e.status === 'replied').length,
    sent: rows.reduce((s, r) => s + r.e.stepsDone, 0),
  };
  const replyRate = stats.enrolled ? Math.round((stats.replied / stats.enrolled) * 100) : 0;

  const enroll = () => {
    const d = deals.find((x) => x.id === toEnroll);
    if (!d) return;
    onEnroll(d.id);
    setToEnroll('');
    notify(t('sequences.enrolledToast', { company: d.company }));
  };

  const run = (r: { e: Enrollment; deal: Deal }) => {
    const step = SEQUENCE_STEPS[r.e.stepsDone];
    if (!step) return;
    onRunStep(r.deal.id);
    notify(
      r.e.stepsDone + 1 >= SEQUENCE_STEPS.length
        ? t('sequences.finishedToast', { company: r.deal.company })
        : t('sequences.ranToast', { step: t(`sequences.steps.${step.id}`), company: r.deal.company }),
    );
  };

  return (
    <div>
      <SectionHeader title={t('sequences.title')} subtitle={t('sequences.subtitle')} />
      <Note>{t('sequences.simulatedNote')}</Note>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {(
          [
            ['enrolled', stats.enrolled],
            ['active', stats.active],
            ['replied', stats.replied],
            ['replyRate', tx.pct(replyRate)],
            ['sent', stats.sent],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-3 text-center">
            <p className="text-xs text-secondary-600 dark:text-secondary-400">{t(`sequences.metrics.${k}`)}</p>
            <p className="text-lg font-bold text-secondary-900 dark:text-white">{v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Pasos */}
        <div className="lg:col-span-2 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 min-w-0">
          <h3 className="font-semibold text-secondary-900 dark:text-white">{t('sequences.name')}</h3>
          <p className="text-xs text-secondary-500 mb-3">{t('sequences.stepsTitle')}</p>
          <ol className="space-y-2">
            {SEQUENCE_STEPS.map((step) => {
              const Icon = CHANNEL_META[step.channel].icon;
              return (
                <li key={step.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-800">
                  <div className="flex flex-col items-center flex-shrink-0 w-12">
                    <span className="text-[11px] text-secondary-500">{t('sequences.stepDay', { day: step.day })}</span>
                    <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${CHANNEL_META[step.channel].color}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-secondary-500">{t(`channels.${step.channel}`)}</p>
                    <p className="text-sm text-secondary-900 dark:text-white">{t(`sequences.steps.${step.id}`)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Inscritos */}
        <div className="lg:col-span-3 rounded-xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 p-4 min-w-0">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <label htmlFor="crm-seq-enroll" className="sr-only">
              {t('sequences.enrollLabel')}
            </label>
            <select id="crm-seq-enroll" value={toEnroll} onChange={(e) => setToEnroll(e.target.value)} className={inputCls} disabled={candidates.length === 0}>
              <option value="">{candidates.length ? t('sequences.enrollPlaceholder') : t('sequences.noneToEnroll')}</option>
              {candidates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company} · {t(`stages.${d.stage}`)}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={enroll} disabled={!toEnroll} className="whitespace-nowrap">
              {t('sequences.enroll')}
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="text-center py-8 text-sm text-secondary-500">{t('sequences.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => {
                const { e, deal } = r;
                const next = SEQUENCE_STEPS[e.stepsDone];
                const due = next ? addDays(e.start, next.day) : null;
                const dueDays = due ? daysBetween(REF_DATE, due) : 0;
                const canRun = e.status === 'active' && Boolean(next);
                return (
                  <li key={e.dealId} className="rounded-lg border border-secondary-200 dark:border-secondary-800 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpen(deal.id)}
                          className="font-medium text-sm text-secondary-900 dark:text-white hover:text-primary-700 dark:hover:text-primary-300 text-left"
                        >
                          {deal.company}
                        </button>
                        <p className="text-xs text-secondary-500">
                          {deal.contactName} · {t('sequences.startedOn', { date: tx.date(e.start) })}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[e.status]} size="sm">
                        {t(`sequences.status.${e.status}`)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2" aria-label={t('sequences.progress', { done: e.stepsDone, total: SEQUENCE_STEPS.length })}>
                      <div className="flex gap-1 flex-1">
                        {SEQUENCE_STEPS.map((s, i) => (
                          <span
                            key={s.id}
                            className={`h-1.5 flex-1 rounded-full ${i < e.stepsDone ? 'bg-primary-600' : 'bg-secondary-200 dark:bg-secondary-700'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-secondary-600 dark:text-secondary-400 whitespace-nowrap">
                        {t('sequences.progress', { done: e.stepsDone, total: SEQUENCE_STEPS.length })}
                      </span>
                    </div>
                    {next && e.status !== 'replied' && e.status !== 'finished' && (
                      <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1.5">
                        {t('sequences.nextStep', {
                          day: next.day,
                          channel: t(`channels.${next.channel}`),
                          step: t(`sequences.steps.${next.id}`),
                        })}{' '}
                        {e.status === 'active' && (
                          <span className={dueDays < 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                            {dueDays < 0 ? t('sequences.dueOverdue', { days: -dueDays }) : t('sequences.dueIn', { days: dueDays })}
                          </span>
                        )}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {canRun && (
                        <Button size="sm" onClick={() => run(r)}>
                          {t('sequences.runStep')}
                        </Button>
                      )}
                      {(e.status === 'active' || e.status === 'paused') && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onStatus(deal.id, e.status === 'active' ? 'paused' : 'active')}>
                            {e.status === 'active' ? t('sequences.pause') : t('sequences.resume')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              onStatus(deal.id, 'replied');
                              notify(t('sequences.repliedToast', { company: deal.company }));
                            }}
                          >
                            {t('sequences.markReplied')}
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => onRemove(deal.id)}>
                        {t('sequences.remove')}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
