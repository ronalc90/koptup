'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClockIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { APPEAL_SLA_HOURS } from '../lib/data';
import { fmtNumber } from '../lib/format';
import { pick, useModeration } from '../lib/store';
import type { Appeal } from '../lib/types';
import { CategoryChip, Modal, SectionTitle, SimNote, inputCls, labelCls } from './ui';
import { useText } from './useText';

function SlaBadge({ a }: { a: Appeal }) {
  const t = useTranslations('demoModeration.appeals');
  const { now, lang } = useModeration();
  if (a.status !== 'open') {
    const hours = (new Date(a.resolvedAt ?? a.receivedAt).getTime() - new Date(a.receivedAt).getTime()) / 3_600_000;
    const late = hours > APPEAL_SLA_HOURS;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${late ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'}`}>
        <ClockIcon className="h-3.5 w-3.5" aria-hidden />
        {late ? t('answeredLate', { h: fmtNumber(hours, lang, 1) }) : t('answeredIn', { h: fmtNumber(hours, lang, 1) })}
      </span>
    );
  }
  const left = APPEAL_SLA_HOURS - (now - new Date(a.receivedAt).getTime()) / 3_600_000;
  const cls = left < 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : left < 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${cls}`}>
      <ClockIcon className="h-3.5 w-3.5" aria-hidden />
      {left < 0 ? t('overdueBy', { h: fmtNumber(-left, lang, 1) }) : t('left', { h: fmtNumber(left, lang, 1) })}
    </span>
  );
}

export default function AppealsTab() {
  const t = useTranslations('demoModeration');
  const { s, lang, resolveAppeal, toast } = useModeration();
  const { ago } = useText();
  const [dialog, setDialog] = useState<{ id: string; outcome: 'upheld' | 'reversed' } | null>(null);
  const [note, setNote] = useState('');
  const open = s.appeals.filter((a) => a.status === 'open').sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
  const done = s.appeals.filter((a) => a.status !== 'open').sort((a, b) => (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? ''));
  const current = dialog ? s.appeals.find((a) => a.id === dialog.id) : undefined;

  const card = (a: Appeal) => (
    <li key={a.id} className="rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono text-xs text-secondary-600 dark:text-secondary-400">
              {a.id} · {a.caseRef}
            </span>
            <CategoryChip label={a.category} />
            <span className="text-secondary-700 dark:text-secondary-300">{t('appeals.originalLine', { decision: t(`appeals.original.${a.original}`) })}</span>
            <SlaBadge a={a} />
          </div>
          <p className="text-sm text-secondary-800 dark:text-secondary-100">{pick(a.reason, lang)}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {t('appeals.meta', { ago: ago(a.receivedAt), reviewer: a.reviewer || t('common.you') })}
          </p>
          {a.status !== 'open' && (
            <p className="text-sm font-medium text-secondary-800 dark:text-secondary-100">
              {t(`appeals.result.${a.status}`)}
              {a.note ? ` · ${a.note}` : ''}
            </p>
          )}
        </div>
        {a.status === 'open' && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button size="sm" onClick={() => setDialog({ id: a.id, outcome: 'upheld' })}>
              {t('appeals.uphold')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog({ id: a.id, outcome: 'reversed' })}>
              {t('appeals.reverse')}
            </Button>
          </div>
        )}
      </div>
    </li>
  );

  return (
    <section>
      <SectionTitle title={t('appeals.title')} subtitle={t('appeals.subtitle', { h: APPEAL_SLA_HOURS })} />
      {open.length ? <ul className="space-y-3">{open.map(card)}</ul> : <p className="rounded-xl border border-dashed border-secondary-300 p-6 text-center text-sm text-secondary-600 dark:border-secondary-700 dark:text-secondary-400">{t('appeals.empty')}</p>}
      {done.length > 0 && (
        <>
          <h3 className="mb-2 mt-6 font-semibold text-secondary-900 dark:text-white">{t('appeals.doneTitle', { n: done.length })}</h3>
          <ul className="space-y-3">{done.map(card)}</ul>
        </>
      )}
      <SimNote className="mt-4">{t('appeals.note')}</SimNote>

      <Modal
        open={!!dialog && !!current}
        onClose={() => {
          setDialog(null);
          setNote('');
        }}
        title={dialog && current ? t(dialog.outcome === 'upheld' ? 'appeals.upholdTitle' : 'appeals.reverseTitle', { id: current.id }) : ''}
      >
        {dialog && current && (
          <div className="space-y-3 text-sm">
            <p className="text-secondary-700 dark:text-secondary-300">{t(dialog.outcome === 'upheld' ? 'appeals.upholdText' : 'appeals.reverseText', { case: current.caseRef })}</p>
            <label className="block">
              <span className={labelCls}>{t('decision.note')}</span>
              <textarea data-autofocus value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} rows={2} className={inputCls} placeholder={t('appeals.notePlaceholder')} />
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDialog(null);
                  setNote('');
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                size="sm"
                variant={dialog.outcome === 'upheld' ? 'primary' : 'outline'}
                onClick={() => {
                  resolveAppeal(current.id, dialog.outcome, note.trim());
                  toast(t(dialog.outcome === 'upheld' ? 'appeals.upheldToast' : 'appeals.reversedToast', { id: current.id }));
                  setDialog(null);
                  setNote('');
                }}
              >
                {t(dialog.outcome === 'upheld' ? 'appeals.uphold' : 'appeals.reverse')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
