'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, MapIcon } from '@heroicons/react/24/outline';
import { useHr } from '../lib/store';
import { QUOTE_HREF, REQUEST_DEMO_HREF } from './Header';

const OPEN_KEY = 'koptup.hrms.guideOpen';

type StepId = 'request' | 'approve' | 'hire' | 'pay' | 'assistant';

/**
 * Recorrido sugerido: cinco pasos que cubren el ciclo completo (la app pide,
 * Gestión Humana aprueba, se contrata, se paga y el colaborador consulta).
 * Cada paso se marca solo cuando el estado de la demo muestra que se hizo.
 */
export default function GettingStarted() {
  const t = useTranslations('demoHrms.guide');
  const { state, openApp, setTab } = useHr();
  const [open, setOpen] = useState(true);

  // Preferencia del visitante (mostrar u ocultar); se lee después de montar.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(OPEN_KEY) === '0') setOpen(false);
    } catch {
      /* sin almacenamiento: queda abierto */
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
  };

  const fromApp = state.leaves.filter((l) => l.source === 'app');
  const steps: { id: StepId; done: boolean; action: () => void }[] = [
    { id: 'request', done: fromApp.length > 0, action: () => openApp(true, 'vacation') },
    { id: 'approve', done: fromApp.some((l) => l.status !== 'pending'), action: () => setTab('absences') },
    { id: 'hire', done: !!state.guide.hired, action: () => setTab('talent') },
    { id: 'pay', done: state.run.status === 'paid' || state.paidRuns.length > 0, action: () => setTab('payroll') },
    { id: 'assistant', done: !!state.guide.assistant, action: () => openApp(true, 'assistant') },
  ];
  const done = steps.filter((s) => s.done).length;
  const all = done === steps.length;

  return (
    <section aria-labelledby="hrms-guide-title" className="rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-white/80 dark:bg-secondary-900/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="hrms-guide-title" className="text-base sm:text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" aria-hidden="true" />
            {t('title')}
          </h2>
          <p className="text-xs sm:text-sm text-secondary-600 dark:text-secondary-400 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-secondary-500 dark:text-secondary-400" aria-live="polite">
            {t('progress', { done, total: steps.length })}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="hrms-guide-steps"
            className="text-xs font-medium text-violet-700 dark:text-violet-300 hover:underline rounded"
          >
            {open ? t('hide') : t('show')}
          </button>
        </div>
      </div>
      {open && (
        <div id="hrms-guide-steps">
          <ol className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3">
            {steps.map((s, i) => (
              <li
                key={s.id}
                className={`flex flex-col rounded-xl border p-3 ${
                  s.done
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20'
                    : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900'
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-secondary-900 dark:text-white">
                  {s.done ? (
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={t('done')} />
                  ) : (
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-[11px] font-bold text-white" aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                  {t(`steps.${s.id}.title`)}
                </p>
                <p className="mt-1 flex-1 hidden sm:block text-xs text-secondary-600 dark:text-secondary-400">{t(`steps.${s.id}.text`)}</p>
                <button type="button" onClick={s.action} className="mt-1 sm:mt-2 self-start text-xs font-semibold text-violet-700 dark:text-violet-300 hover:underline rounded">
                  {t(`steps.${s.id}.action`)} →
                </button>
              </li>
            ))}
          </ol>
          {all && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 p-3">
              <p className="text-sm text-secondary-800 dark:text-secondary-100 flex-1 min-w-[12rem]">{t('finished')}</p>
              <Link href={REQUEST_DEMO_HREF} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-violet-600 text-violet-700 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-900/40">
                {t('finishedDemo')}
              </Link>
              <Link href={QUOTE_HREF} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700">
                {t('finishedQuote')}
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
