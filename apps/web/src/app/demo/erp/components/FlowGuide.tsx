'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon, ChevronDownIcon, MapIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import { useErp } from '../lib/store';
import type { ModuleId } from '../lib/types';

/**
 * Recorrido de punta a punta: cada paso se marca solo cuando haces la acción
 * en la demo (no es un tour de diapositivas).
 */
export default function FlowGuide() {
  const t = useTranslations('demoErp.flow');
  const { state, goTo, module } = useErp();
  const [open, setOpen] = useState(true);

  const steps: { id: string; module: ModuleId; done: boolean }[] = [
    { id: 'invoice', module: 'sales', done: state.sales.some((s) => s.user && s.status === 'invoiced') },
    { id: 'reorder', module: 'inventory', done: state.pos.some((p) => p.user && (p.origin === 'reorder' || p.origin === 'mrp')) },
    { id: 'approve', module: 'purchases', done: state.pos.some((p) => p.user && p.status === 'received') },
    { id: 'reconcile', module: 'finance', done: state.bank.some((b) => b.match?.by === 'user') },
    { id: 'ledger', module: 'accounting', done: !!state.visited.accounting && state.sales.some((s) => s.user && s.status === 'invoiced') },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card variant="bordered" padding="none" className="overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
        <span className="flex items-center gap-2 min-w-0">
          <MapIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
          <span className="font-semibold text-sm text-secondary-900 dark:text-white">{t('title')}</span>
          <span className="text-xs text-secondary-500 dark:text-secondary-400 truncate">{t('progress', { done: doneCount, total: steps.length })}</span>
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-secondary-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">{t('intro')}</p>
          <ol className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button
                  onClick={() => goTo(s.module, undefined, true)}
                  className={`w-full h-full text-left p-3 rounded-lg border transition-colors ${
                    s.done
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30'
                      : module === s.module
                        ? 'border-primary-400 dark:border-primary-600 bg-primary-50/60 dark:bg-primary-950/30'
                        : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">
                    {s.done ? <CheckCircleIcon className="w-4 h-4 text-emerald-600" /> : <span className="w-4 h-4 rounded-full border border-current text-[9px] flex items-center justify-center">{i + 1}</span>}
                    {t(`steps.${s.id}.module`)}
                  </span>
                  <span className="block text-xs text-secondary-800 dark:text-secondary-200 mt-1">{t(`steps.${s.id}.text`)}</span>
                </button>
              </li>
            ))}
          </ol>
          {doneCount === steps.length && <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">{t('done')}</p>}
        </div>
      )}
    </Card>
  );
}
