'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ClipboardDocumentIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { weeklyReport } from '../lib/engine';
import { useDemo } from '../lib/store';
import { useDocs } from './docs';
import { HealthBadge, Modal, btn, useFmt } from './ui';

export default function WeeklyReportModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoProjectsPro.weekly');
  const tOut = useTranslations('demoProjectsPro.outbox');
  const f = useFmt();
  const { ws, today, act } = useDemo();
  const project = ws.projects.find((p) => p.id === ws.currentProjectId) ?? ws.projects[0];
  const r = useMemo(() => weeklyReport(ws, project, today), [ws, project, today]);
  const { downloadWeekly, weeklyText } = useDocs();
  const text = weeklyText(r);
  const [email, setEmail] = useState(true);
  const [wa, setWa] = useState(true);
  const [busy, setBusy] = useState(false);
  const sent = ws.outbox.filter((o) => o.projectId === project.id).slice(0, 6);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const List = ({ title, items, empty }: { title: string; items: { id: string; text: string; tone?: 'red' }[]; empty: string }) => (
    <div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{empty}</p>
      ) : (
        <ul className="list-disc pl-5 space-y-0.5 text-sm">
          {items.map((i) => (
            <li key={i.id} className={i.tone === 'red' ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-200'}>
              {i.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Modal
      title={t('title', { project: project.name })}
      subtitle={t('period', { from: f.date(r.from, 'long'), to: f.date(r.to, 'long') })}
      onClose={onClose}
      size="lg"
      labelId="gp-weekly"
      footer={
        <>
          <button
            type="button"
            className={btn.outline}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await downloadWeekly(r);
              } finally {
                setBusy(false);
              }
            }}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {t('pdf')}
          </button>
          <button type="button" className={btn.outline} onClick={copy}>
            <ClipboardDocumentIcon className="w-4 h-4" />
            {t('copy')}
          </button>
          <button
            type="button"
            className={btn.primary}
            disabled={!email && !wa}
            onClick={() => {
              const channels = [...(email ? (['email'] as const) : []), ...(wa ? (['whatsapp'] as const) : [])];
              act({ type: 'outbox.weekly', projectId: project.id, channels });
              toast.success(t('sentToast', { who: project.clientContact }));
            }}
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            {t('send')}
          </button>
        </>
      }
    >
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('intro')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
          <p className="text-[11px] text-slate-500">{t('progress')}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{r.stats.progress}%</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
          <p className="text-[11px] text-slate-500">{t('completed')}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{r.completed.length}</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
          <p className="text-[11px] text-slate-500">{t('hours')}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{f.hours(r.hours)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3">
          <p className="text-[11px] text-slate-500">{t('status')}</p>
          <div className="mt-1">
            <HealthBadge level={r.stats.health.level} />
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <List title={t('completedList')} items={r.completed.map((x) => ({ id: x.id, text: x.title }))} empty={t('none')} />
        <List title={t('overdueList')} items={r.overdue.map((x) => ({ id: x.id, text: t('overdueItem', { task: x.title, date: f.date(x.due, 'short') }), tone: 'red' as const }))} empty={t('noneOverdue')} />
        <List title={t('upcomingList')} items={r.upcoming.map((x) => ({ id: x.id, text: `${f.date(x.due, 'short')}: ${x.title}` }))} empty={t('none')} />
        <List title={t('approvalList')} items={r.inClientReview.map((x) => ({ id: x.id, text: x.title }))} empty={t('none')} />
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('waPreview')}</h3>
        <pre className="whitespace-pre-wrap text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 text-slate-800 dark:text-slate-100 font-sans">{text}</pre>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('channels')}</legend>
        <div className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-200">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="rounded text-teal-600" />
            {t('email', { who: project.clientContact })}
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={wa} onChange={(e) => setWa(e.target.checked)} className="rounded text-teal-600" />
            {t('whatsapp')}
          </label>
        </div>
        <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1.5">{t('simulated')}</p>
      </fieldset>

      {sent.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('history')}</h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
            {sent.map((o) => (
              <li key={o.id}>
                {f.dateTime(o.at)} · {tOut(`channel.${o.channel}`)} · {tOut(o.key, o.params)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
