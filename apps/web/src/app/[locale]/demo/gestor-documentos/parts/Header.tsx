'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, BeakerIcon, CloudIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { COMPANY } from '../lib/sample';
import { useDocs } from '../lib/store';
import { formatNit } from '../lib/util';
import type { Mode } from '../lib/types';
import { focusRing } from './ui';

export default function Header() {
  const t = useTranslations('demoDocs');
  const { mode, setMode, ready } = useDocs();
  const modes: Mode[] = ['sample', 'server'];

  return (
    <div className="border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto max-w-[1600px] px-4 pb-3 pt-4 sm:px-6">
        <Link href="/demo" className={`mb-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300 ${focusRing}`}>
          <ArrowLeftIcon className="h-4 w-4" />
          {t('shell.back')}
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{t('shell.title')}</h1>
              {mode === 'sample' ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200" title={t('shell.sampleHint')}>
                  <BeakerIcon className="h-3.5 w-3.5" />
                  {t('shell.sampleBadge')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
                  <CloudIcon className="h-3.5 w-3.5" />
                  {t('shell.serverBadge')}
                </span>
              )}
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              {mode === 'sample' ? t('shell.caseLine', { company: COMPANY.name, nit: formatNit(COMPANY.nit), city: COMPANY.city }) : t('shell.serverLine')}
            </p>
          </div>
          <div role="tablist" aria-label={t('shell.modeLabel')} className="inline-flex w-full shrink-0 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800 sm:w-auto">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                disabled={!ready}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:flex-none ${focusRing} ${
                  mode === m ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {t(`shell.modes.${m}`)}
              </button>
            ))}
          </div>
        </div>

        <details className="group mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900">
          <summary className={`flex cursor-pointer list-none items-center gap-2 rounded font-medium text-slate-800 dark:text-slate-200 ${focusRing}`}>
            <InformationCircleIcon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            {t('how.title')}
            <span className="ml-auto text-xs text-slate-500 group-open:hidden">{t('common.show')}</span>
            <span className="ml-auto hidden text-xs text-slate-500 group-open:inline">{t('common.hide')}</span>
          </summary>
          <div className="mt-3 grid gap-4 text-slate-700 dark:text-slate-300 md:grid-cols-2">
            <div>
              <p className="mb-1 font-semibold text-slate-900 dark:text-white">{t('how.realTitle')}</p>
              <ul className="list-disc space-y-1 pl-5">
                {(t.raw('how.real') as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-900 dark:text-white">{t('how.simTitle')}</p>
              <ul className="list-disc space-y-1 pl-5">
                {(t.raw('how.sim') as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-900 dark:text-white">{t('how.tourTitle')}</p>
              <ol className="list-decimal space-y-1 pl-5">
                {(t.raw('how.tour') as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-900 dark:text-white">{t('how.buildTitle')}</p>
              <ul className="list-disc space-y-1 pl-5">
                {(t.raw('how.build') as string[]).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
