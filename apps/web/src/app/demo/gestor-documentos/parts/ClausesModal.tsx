'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { detectClauses, type Risk } from '../lib/clauses';
import type { DocItem } from '../lib/types';
import { Modal, Note, focusRing } from './ui';

const RISK_CLS: Record<Risk, string> = {
  low: 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
  medium: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  high: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
};

export default function ClausesModal({ doc, onClose }: { doc: DocItem | null; onClose: () => void }) {
  const t = useTranslations('demoDocs');
  const [filter, setFilter] = useState<Risk | 'all'>('all');
  const clauses = useMemo(() => (doc?.text ? detectClauses(doc.text) : []), [doc]);
  const count = (r: Risk) => clauses.filter((c) => c.risk === r).length;
  const shown = filter === 'all' ? clauses : clauses.filter((c) => c.risk === filter);
  const filters: (Risk | 'all')[] = ['all', 'high', 'medium', 'low'];

  return (
    <Modal open={Boolean(doc)} onClose={() => { setFilter('all'); onClose(); }} size="lg" title={t('clauses.title')} subtitle={doc?.name} icon={<ShieldCheckIcon className="h-6 w-6" />}>
      <div className="space-y-4">
        <Note>{t('clauses.note')}</Note>
        {clauses.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('clauses.none')}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('clauses.summary', { total: clauses.length, high: count('high'), medium: count('medium'), low: count('low') })}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t('clauses.filterLabel')}>
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${focusRing} ${filter === f ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                >
                  {f === 'all' ? t('clauses.filterAll') : t(`clauses.risk.${f}`)}
                </button>
              ))}
            </div>
            <ul className="space-y-2">
              {shown.map((c) => (
                <li key={c.heading} className={`rounded-lg border p-3 ${RISK_CLS[c.risk]}`}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{t(`clauses.types.${c.type}`)}</p>
                      <p className="text-xs opacity-80">{c.heading}</p>
                    </div>
                    <span className="shrink-0 self-start rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold uppercase dark:bg-black/30">{t(`clauses.risk.${c.risk}`)}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium">{t(`clauses.reasons.${c.reason}`, { percent: c.percent ?? 0 })}</p>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">«{c.excerpt}»</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  );
}
