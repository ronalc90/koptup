'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, ArrowPathIcon, BeakerIcon, ChevronDownIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAutomation } from '../lib/store';
import { ConfirmDialog, focusRing } from './ui';

/** Franja superior: volver al catálogo, rótulos de honestidad y restablecer. */
export default function DemoBar() {
  const t = useTranslations('demoAutomation.shell');
  const { reset, live, toast } = useAutomation();
  const [info, setInfo] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="border-b border-secondary-800 bg-secondary-950">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-1.5 text-[11px] sm:px-5">
        <Link href="/demo" className={`inline-flex items-center gap-1 rounded font-medium text-secondary-300 hover:text-white ${focusRing}`}>
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {t('back')}
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 font-semibold text-amber-200" title={t('sampleHint')}>
          <BeakerIcon className="h-3.5 w-3.5" />
          {t('sampleBadge')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 font-semibold text-sky-200">{t('simBadge')}</span>
        <button type="button" onClick={() => setInfo((v) => !v)} aria-expanded={info} aria-controls="auto-how" className={`inline-flex items-center gap-1 rounded text-secondary-300 hover:text-white ${focusRing}`}>
          <InformationCircleIcon className="h-3.5 w-3.5" />
          {t('how')}
          <ChevronDownIcon className={`h-3 w-3 transition-transform ${info ? 'rotate-180' : ''}`} />
        </button>
        <span className="flex-1" />
        <button type="button" onClick={() => setConfirm(true)} disabled={live.running} className={`inline-flex items-center gap-1 rounded text-secondary-400 hover:text-white disabled:opacity-50 ${focusRing}`}>
          <ArrowPathIcon className="h-3.5 w-3.5" />
          {t('reset')}
        </button>
      </div>
      {info && (
        <div id="auto-how" className="grid gap-4 border-t border-secondary-800 bg-secondary-900/60 px-3 py-3 text-xs text-secondary-300 sm:px-5 md:grid-cols-3">
          <div>
            <p className="mb-1 font-semibold text-white">{t('realTitle')}</p>
            <ul className="list-disc space-y-1 pl-4">
              {(t.raw('real') as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-white">{t('simTitle')}</p>
            <ul className="list-disc space-y-1 pl-4">
              {(t.raw('sim') as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-white">{t('tourTitle')}</p>
            <ol className="list-decimal space-y-1 pl-4">
              {(t.raw('tour') as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title={t('resetTitle')}
        body={t('resetBody')}
        confirmLabel={t('reset')}
        danger
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          reset().then(() => toast(t('resetDone'), 'info'));
        }}
      />
    </div>
  );
}
