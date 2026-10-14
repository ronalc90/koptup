'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CalculatorIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  MapIcon,
  PresentationChartBarIcon,
} from '@heroicons/react/24/outline';
import { GUIDE_STEPS, useDashboard, type GuideStep } from '../lib/store';
import { btn, Modal, NS, useFmt } from './ui';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto del catálogo. */
export const REQUEST_DEMO_HREF = '/solicitar-demo?demos=dashboard-ejecutivo';
export const QUOTE_HREF = '/contact?service=bi-dashboard';

const GUIDE_OPEN_KEY = 'demo:bi:guide-open:v1';

const ctaCls =
  'inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border focus:outline-none focus-visible:ring-2 focus-visible:ring-white';

/** Confirmación para volver la demo a como estaba al entrar (se usa aquí y en Configuración). */
export function ResetDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations(`${NS}.settings`);
  const { resetAll, notify } = useDashboard();
  return (
    <Modal
      title={t('resetTitle')}
      onClose={onClose}
      size="sm"
      labelId="bi-reset-title"
      footer={
        <>
          <button type="button" className={btn.outline} onClick={onClose}>
            {t('cancel')}
          </button>
          <button
            type="button"
            className={btn.danger}
            onClick={() => {
              resetAll();
              onClose();
              notify(t('resetDone'));
            }}
          >
            {t('resetConfirm')}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-700 dark:text-slate-300">{t('resetText')}</p>
    </Modal>
  );
}

/**
 * Encabezado de la demo: qué es, para quién, de dónde salen los datos, salidas
 * comerciales y los primeros pasos sugeridos.
 */
export default function Intro({ onPdf }: { onPdf: () => void }) {
  const t = useTranslations(`${NS}.intro`);
  const fmt = useFmt();
  const { anchor, setView } = useDashboard();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Link
        href="/demo"
        className="inline-flex items-center gap-1.5 mb-3 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        data-testid="exec-back"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('back')}
      </Link>
      <section
        aria-labelledby="exec-intro-title"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 to-blue-700 p-4 sm:p-6 shadow-lg text-white"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,white,transparent_50%)]" aria-hidden="true" />
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <span title={t('sampleHint')} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/30 mb-2 sm:mb-3">
              {t('sampleBadge')}
            </span>
            <h1 id="exec-intro-title" className="text-xl sm:text-3xl font-bold tracking-tight">
              {t('title')}
            </h1>
            <p className="text-sm sm:text-lg text-purple-50/95 mt-1.5 sm:mt-2 max-w-3xl">{t('subtitle')}</p>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-1.5 sm:mt-2 max-w-3xl">{t('audience')}</p>
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
              <Link href={REQUEST_DEMO_HREF} className={`${ctaCls} bg-white text-purple-800 border-white hover:bg-purple-50`} data-testid="exec-cta-demo">
                <PresentationChartBarIcon className="h-4 w-4" aria-hidden="true" />
                {t('requestDemo')}
              </Link>
              <Link href={QUOTE_HREF} className={`${ctaCls} bg-white/10 hover:bg-white/20 border-white/40 text-white`} data-testid="exec-cta-quote">
                <CalculatorIcon className="h-4 w-4" aria-hidden="true" />
                {t('quote')}
              </Link>
              <button type="button" onClick={() => setView('fuentes', 'src-upload-section')} className={`${ctaCls} bg-white/10 hover:bg-white/20 border-white/40 text-white`} data-testid="exec-cta-csv">
                <ArrowUpTrayIcon className="h-4 w-4" aria-hidden="true" />
                {t('tryCsv')}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:items-end shrink-0">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="self-start lg:self-end inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/30 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              data-testid="exec-reset"
            >
              <ArrowPathIcon className="w-4 h-4" aria-hidden="true" />
              {t('reset')}
            </button>
            <p className="text-[11px] sm:text-xs text-purple-100/90 lg:text-right max-w-xs">{t('cutoffNote', { month: fmt.monthIn(anchor) })}</p>
          </div>
        </div>
      </section>

      <details className="group mt-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2 text-sm" data-testid="exec-how">
        <summary className="cursor-pointer list-none flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
          <InformationCircleIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
          {t('how.title')}
          <span className="ml-auto text-xs text-slate-500 group-open:hidden">{t('how.show')}</span>
          <span className="ml-auto text-xs text-slate-500 hidden group-open:inline">{t('how.hide')}</span>
        </summary>
        <ul className="mt-2 space-y-1.5 text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>{t('how.data')}</li>
          <li>{t('how.dates', { month: fmt.monthIn(anchor) })}</li>
          <li>{t('how.noAi')}</li>
          <li>{t('how.simulated')}</li>
          <li>{t('how.storage')}</li>
        </ul>
      </details>

      <GettingStarted onPdf={onPdf} />
      {confirmReset && <ResetDialog onClose={() => setConfirmReset(false)} />}
    </div>
  );
}

/**
 * Primeros pasos: cinco acciones de un minuto que cuentan la historia del
 * tablero. Cada paso se marca solo cuando el visitante lo hace (el estado lo
 * lleva el store) y su botón lo lleva al lugar exacto.
 */
function GettingStarted({ onPdf }: { onPdf: () => void }) {
  const t = useTranslations(`${NS}.guide`);
  const { guide, setView, setSegment } = useDashboard();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(GUIDE_OPEN_KEY) === '0') setOpen(false);
    } catch {
      /* sin almacenamiento: queda abierto */
    }
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(GUIDE_OPEN_KEY, next ? '1' : '0');
    } catch {
      /* sin almacenamiento */
    }
  };

  const run = (step: GuideStep) => {
    if (step === 'period') {
      const el = document.getElementById('exec-period');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
    } else if (step === 'finance') setView('finanzas', 'fin-cash-section');
    else if (step === 'customer') {
      setSegment('riesgo');
      setView('clientes', 'cust-section');
    } else if (step === 'ask') setView('preguntas', 'ask-section');
    else onPdf();
  };

  const done = GUIDE_STEPS.filter((s) => guide[s]).length;
  const all = done === GUIDE_STEPS.length;

  return (
    <section aria-labelledby="exec-guide-title" className="mt-3 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-white/80 dark:bg-slate-900/80 p-4 sm:p-5" data-testid="exec-guide">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="exec-guide-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" aria-hidden="true" />
            {t('title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite" data-testid="exec-guide-progress">
            {t('progress', { done, total: GUIDE_STEPS.length })}
          </span>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="exec-guide-steps"
            className="text-xs font-medium text-purple-700 dark:text-purple-300 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {open ? t('hide') : t('show')}
          </button>
        </div>
      </div>
      {open && (
        <div id="exec-guide-steps">
          <ol className="mt-3 grid grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3">
            {GUIDE_STEPS.map((id, i) => {
              const isDone = guide[id];
              return (
                <li
                  key={id}
                  data-guide-step={id}
                  data-done={isDone ? 'true' : 'false'}
                  className={`flex flex-col rounded-xl border p-3 ${
                    isDone ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    {isDone ? (
                      <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-label={t('done')} />
                    ) : (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[11px] font-bold text-white" aria-hidden="true">
                        {i + 1}
                      </span>
                    )}
                    {t(`steps.${id}.title`)}
                  </p>
                  <p className="mt-1 flex-1 hidden sm:block text-xs text-slate-600 dark:text-slate-400">{t(`steps.${id}.text`)}</p>
                  <button
                    type="button"
                    onClick={() => run(id)}
                    className="mt-1 sm:mt-2 self-start text-left text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    {t(`steps.${id}.action`)} →
                  </button>
                </li>
              );
            })}
          </ol>
          {all && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 p-3" data-testid="exec-guide-finished">
              <p className="text-sm text-slate-800 dark:text-slate-100 flex-1 min-w-[12rem]">{t('finished')}</p>
              <Link
                href={REQUEST_DEMO_HREF}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-600 text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/40"
              >
                {t('finishedDemo')}
              </Link>
              <Link href={QUOTE_HREF} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700">
                {t('finishedQuote')}
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
