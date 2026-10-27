'use client';

import { useTranslations } from 'next-intl';
import { CheckIcon } from '@heroicons/react/24/solid';
import type { TabId } from '../_lib/tabs';

export interface Progreso {
  /** Abrió el simulador. */
  simulador: boolean;
  /** Cambió una regla, la tolerancia o el manual. */
  cambio: boolean;
  /** Vio en el simulador el efecto de sus cambios frente a lo guardado. */
  efecto: boolean;
}

const PASOS: Array<{ id: keyof Progreso; tab: TabId }> = [
  { id: 'simulador', tab: 'simulador' },
  { id: 'cambio', tab: 'reglas' },
  { id: 'efecto', tab: 'simulador' },
];

/** Primeros pasos visibles: qué hacer primero y qué tanto llevas. */
export default function PrimerosPasos({ progreso, onIr }: { progreso: Progreso; onIr: (tab: TabId) => void }) {
  const t = useTranslations('demoExpertSystem.start');
  const hechos = PASOS.filter((p) => progreso[p.id]).length;

  return (
    <section
      aria-labelledby="primeros-pasos"
      className="mb-6 rounded-xl border border-primary-200 bg-white/80 p-4 dark:border-primary-800 dark:bg-secondary-900/60"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="primeros-pasos" className="font-semibold text-secondary-900 dark:text-white">
          {t('title')}
        </h2>
        <p className="text-xs text-secondary-500 dark:text-secondary-400" aria-live="polite">
          {hechos === PASOS.length ? t('done') : t('progress', { hechos, total: PASOS.length })}
        </p>
      </div>
      <ol className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {PASOS.map(({ id, tab }, i) => {
          const hecho = progreso[id];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onIr(tab)}
                className="flex h-full w-full items-start gap-3 rounded-lg border border-secondary-200 bg-white p-3 text-left transition-colors hover:border-primary-400 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-secondary-700 dark:bg-secondary-800 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 dark:focus-visible:ring-offset-secondary-900"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    hecho
                      ? 'bg-green-600 text-white'
                      : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  }`}
                  aria-hidden="true"
                >
                  {hecho ? <CheckIcon className="h-4 w-4" /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-secondary-900 dark:text-white">{t(`${id}Title`)}</span>
                  <span className="block text-sm text-secondary-600 dark:text-secondary-400">{t(`${id}Text`)}</span>
                  {hecho && <span className="sr-only">{t('stepDone')}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
