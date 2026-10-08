'use client';

import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import { titleOf } from '../lib/models';
import { useCms } from '../lib/store';
import { formatDateTime } from '../lib/time';
import { STATUSES, TOUR_STEPS, type TourStep } from '../lib/types';
import { btn, card, STATUS_COLORS, TypeBadge, useUntil } from './ui';

const TOUR_TARGET: Record<TourStep, { view?: 'models'; entry?: string }> = {
  model: { view: 'models' },
  edit: { entry: 'loc-chapinero' },
  assistant: { entry: 'loc-chapinero' },
  publish: { entry: 'loc-chapinero' },
  rag: { entry: 'faq-ecografia' },
};

export default function Dashboard() {
  const t = useTranslations('demoCms.home');
  const tStatus = useTranslations('demoCms.status');
  const tRole = useTranslations('demoCms.roles');
  const tAct = useTranslations('demoCms.activity');
  const { state, me, go, openEntry, showEntries, contentLocale } = useCms();
  const until = useUntil();
  const locale = contentLocale;
  const counts = STATUSES.map((s) => ({ s, n: state.entries.filter((e) => e.status === s).length }));
  const scheduled = state.entries
    .filter((e) => e.status === 'scheduled' && e.scheduledAt)
    .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''));
  const person = (id: string) => state.people.find((p) => p.id === id)?.name ?? id;
  const done = TOUR_STEPS.filter((s) => state.tour[s]).length;

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('hello', { name: me.name.split(' ')[0] })}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('roleLine', { role: tRole(`${me.role}.name`), desc: tRole(`${me.role}.desc`) })}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {counts.map(({ s, n }) => (
          <button key={s} type="button" onClick={() => showEntries(s)} className={`${card} p-4 text-left hover:border-pink-400 transition-colors`}>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLORS[s]}`}>{tStatus(s)}</span>
            <span className="block text-2xl font-bold text-slate-900 dark:text-white mt-2">{n}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{t('entriesCount', { n })}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <section className={`${card} p-5 lg:col-span-3`} aria-labelledby="cms-tour-title">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <h3 id="cms-tour-title" className="font-bold text-slate-900 dark:text-white">
              {t('tourTitle')}
            </h3>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('tourProgress', { done, total: TOUR_STEPS.length })}</span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{t('tourIntro')}</p>
          <ol className="space-y-3">
            {TOUR_STEPS.map((s, i) => {
              const ok = state.tour[s];
              const target = TOUR_TARGET[s];
              return (
                <li key={s} className="flex items-start gap-3">
                  {ok ? <CheckSolid className="w-6 h-6 text-emerald-600 shrink-0" aria-label={t('stepDone')} /> : <span className="w-6 h-6 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-500 flex items-center justify-center">{i + 1}</span>}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${ok ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{t(`tour.${s}.title`)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{t(`tour.${s}.desc`)}</p>
                  </div>
                  <button type="button" className={btn.small} onClick={() => (target.view ? go(target.view) : target.entry && openEntry(target.entry))} disabled={!!target.entry && !state.entries.some((e) => e.id === target.entry)}>
                    {t('go')}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={`${card} p-5 lg:col-span-2`} aria-labelledby="cms-truth-title">
          <h3 id="cms-truth-title" className="font-bold text-slate-900 dark:text-white mb-2">
            {t('truthTitle')}
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {(['browser', 'ai', 'simulated', 'project'] as const).map((k) => (
              <li key={k} className="flex gap-2">
                <CheckCircleIcon className="w-4 h-4 mt-0.5 shrink-0 text-pink-600" />
                <span>
                  <strong className="text-slate-900 dark:text-white">{t(`truth.${k}.title`)}</strong> {t(`truth.${k}.desc`)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className={`${card} p-5`} aria-labelledby="cms-sched-title">
          <h3 id="cms-sched-title" className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-blue-600" />
            {t('scheduledTitle')}
          </h3>
          {scheduled.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('scheduledEmpty')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {scheduled.map((e) => {
                return (
                  <li key={e.id} className="py-2 flex flex-wrap items-center gap-2">
                    <TypeBadge type={e.type} />
                    <button type="button" onClick={() => openEntry(e.id)} className="text-sm font-medium text-slate-900 dark:text-white hover:underline text-left min-w-0 break-words">
                      {titleOf(e, e.content, locale)}
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                      {formatDateTime(e.scheduledAt ?? '', locale)} · {until(e.scheduledAt ?? '')}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={`${card} p-5`} aria-labelledby="cms-act-title">
          <h3 id="cms-act-title" className="font-bold text-slate-900 dark:text-white mb-3">
            {t('activityTitle')}
          </h3>
          {state.activity.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('activityEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {state.activity.slice(0, 8).map((a) => (
                <li key={a.id} className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold text-slate-900 dark:text-white">{person(a.by)}</span> {tAct(a.kind, { title: a.entryTitle ?? '', detail: a.detail ?? '' })}
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{formatDateTime(a.at, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
