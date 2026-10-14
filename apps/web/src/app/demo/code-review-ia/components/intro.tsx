'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon, CalculatorIcon, CheckCircleIcon, PresentationChartBarIcon, MapIcon,
} from '@heroicons/react/24/outline';
import { FOCUS, type T } from './tabs';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto. */
export const REQUEST_DEMO_HREF = '/solicitar-demo?demos=code-review-ia';
export const QUOTE_HREF = '/contact?service=code-review-ia';

/** Enlace «Volver al catálogo de demos». */
export function BackToCatalog({ t }: { t: T }) {
  return (
    <Link
      href="/demo"
      className={`mb-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-neutral-200 hover:text-white ${FOCUS}`}
    >
      <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
      {t('header.back')}
    </Link>
  );
}

/** «Solicitar demo guiada» y «Cotizar para tu equipo» (encabezado, cierre de los primeros pasos y nota final). */
export function CommercialLinks({ t, className = '' }: { t: T; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Link
        href={REQUEST_DEMO_HREF}
        className={`inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 ${FOCUS}`}
      >
        <PresentationChartBarIcon className="w-4 h-4" aria-hidden="true" />
        {t('header.requestDemo')}
      </Link>
      <Link
        href={QUOTE_HREF}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-neutral-400 px-3 py-1.5 text-sm font-medium text-neutral-100 hover:bg-neutral-800 ${FOCUS}`}
      >
        <CalculatorIcon className="w-4 h-4" aria-hidden="true" />
        {t('header.quote')}
      </Link>
    </div>
  );
}

export type StepId = 'apply' | 'diff' | 'repo' | 'merge' | 'own';
export const STEP_IDS: StepId[] = ['apply', 'diff', 'repo', 'merge', 'own'];

/**
 * Primeros pasos: cada botón deja lista la pantalla donde se hace el paso, y el
 * paso se marca solo cuando de verdad se hizo en la demo (aplicar una
 * sugerencia, abrir el diff, ver el repositorio, fusionar, revisar un diff propio).
 */
export function FirstSteps({
  t, done, onGo,
}: { t: T; done: Record<StepId, boolean>; onGo: (id: StepId, from: HTMLElement) => void }) {
  const count = STEP_IDS.filter((id) => done[id]).length;
  const all = count === STEP_IDS.length;
  return (
    <section aria-labelledby="crv-steps-title" className="border-b border-zinc-800 bg-zinc-900/70">
      <div className="max-w-[1500px] mx-auto px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="crv-steps-title" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100">
            <MapIcon className="w-4 h-4 text-violet-300" aria-hidden="true" />
            {t('steps.title')}
          </h2>
          <span className="text-xs text-zinc-400" aria-live="polite">{t('steps.progress', { done: count, total: STEP_IDS.length })}</span>
        </div>
        <ol className="relative mt-2 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {STEP_IDS.map((id, i) => (
            <li key={id} className="w-[240px] shrink-0 lg:w-auto">
              <button
                type="button"
                onClick={(e) => onGo(id, e.currentTarget)}
                className={`h-full w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${FOCUS} ${done[id] ? 'border-emerald-500/40 bg-emerald-500/5 text-zinc-200' : 'border-zinc-700 bg-zinc-950/60 text-zinc-200 hover:border-violet-400/60'}`}
              >
                <span className="flex items-start gap-2">
                  {done[id] ? (
                    <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-[11px] font-semibold text-violet-200" aria-hidden="true">{i + 1}</span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium text-zinc-100">{t(`steps.${id}.title`)}</span>
                    <span className="mt-0.5 block text-zinc-400">{t(`steps.${id}.hint`)}</span>
                    <span className="sr-only">{done[id] ? t('steps.doneSr') : t('steps.pendingSr')}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        {all && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-2">
            <p className="text-xs text-zinc-200">{t('steps.allDone')}</p>
            <CommercialLinks t={t} />
          </div>
        )}
      </div>
    </section>
  );
}

/** Confirmación de «Restablecer»: Escape la cancela y el foco entra al botón de confirmar. */
export function ResetConfirm({ t, onConfirm, onCancel }: { t: T; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="crv-reset-title" className="mt-3 rounded-lg border border-amber-500/40 bg-amber-950/60 px-3 py-2 text-sm text-amber-100 flex flex-wrap items-center gap-3">
      <p id="crv-reset-title" className="min-w-0 flex-1 basis-64">{t('header.resetConfirm')}</p>
      <div className="flex gap-2">
        <button ref={ref} type="button" onClick={onConfirm} className={`rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 ${FOCUS}`}>
          {t('header.resetYes')}
        </button>
        <button type="button" onClick={onCancel} className={`rounded-md border border-amber-500/50 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/60 ${FOCUS}`}>
          {t('header.resetNo')}
        </button>
      </div>
    </div>
  );
}
