'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon, CheckIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { diffMinutes, fmtAgo } from '../lib/format';
import { useAutomation, type ReviewAction } from '../lib/store';
import type { ReviewItem, RunRecord } from '../lib/types';
import { ConfirmDialog, Modal, btnDanger, btnGhost, btnPrimary, inputCls } from './ui';

export default function ReviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoAutomation.review');
  const tr = useTranslations('demoAutomation');
  const { s, now, loc, msg, resolveReview, discardOpen, toast, setActive } = useAutomation();
  const [view, setView] = useState<'open' | 'closed'>('open');
  const [busy, setBusy] = useState<string | null>(null);
  const [fixes, setFixes] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, RunRecord>>({});
  const [confirmAll, setConfirmAll] = useState(false);
  // Cada vez que se abre, empieza en «Abiertos» y sin resultados anteriores.
  useEffect(() => {
    if (!open) return;
    setView('open');
    setResults({});
  }, [open]);
  const openItems = s.reviews.filter((r) => r.status === 'open');
  const closed = s.reviews.filter((r) => r.status !== 'open');
  const list = view === 'open' ? openItems : closed;
  const wfName = (id: string) => s.workflows.find((w) => w.id === id)?.name ?? '—';

  const act = async (item: ReviewItem, action: ReviewAction) => {
    setBusy(item.id);
    const run = await resolveReview(item.id, action, item.missingPath ? fixes[item.id] : undefined);
    setBusy(null);
    if (run) {
      setResults((p) => ({ ...p, [item.id]: run }));
      const ok = run.status === 'success' || run.status === 'retried' || run.status === 'stopped';
      toast(`${run.id}: ${msg(run.summary)}`, ok ? 'ok' : 'warn');
    } else if (action === 'done') toast(t('toastDone', { id: item.id }));
    else if (action === 'discard') toast(t('toastDiscarded', { id: item.id }), 'info');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      subtitle={t('subtitle')}
      size="lg"
      footer={
        <>
          {view === 'open' && openItems.length > 0 && (
            <button type="button" onClick={() => setConfirmAll(true)} className={btnDanger}>
              <TrashIcon className="h-3.5 w-3.5" />
              {t('discardAll', { count: openItems.length })}
            </button>
          )}
          <button type="button" onClick={onClose} className={btnGhost}>
            {t('close')}
          </button>
        </>
      }
    >
      <div role="tablist" className="mb-3 flex gap-1">
        {(['open', 'closed'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`rounded-full px-3 py-1 text-xs ${view === v ? 'bg-primary-600 text-white' : 'bg-secondary-800 text-secondary-300 hover:bg-secondary-700'}`}
          >
            {t(`tabs.${v}`, { count: v === 'open' ? openItems.length : closed.length })}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="rounded-md border border-secondary-800 p-4 text-center text-sm text-secondary-400">{view === 'open' ? t('emptyOpen') : t('emptyClosed')}</p>
      ) : (
        <ul className="space-y-3">
          {list.map((item) => {
            const result = results[item.id];
            const exception = item.kind === 'exception';
            return (
              <li key={item.id} className={`rounded-lg border p-3 ${item.status === 'open' ? (exception ? 'border-amber-500/40 bg-amber-500/5' : 'border-rose-500/40 bg-rose-500/5') : 'border-secondary-800'}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                  <span className={`rounded-full px-2 py-0.5 font-semibold ${exception ? 'bg-amber-500/15 text-amber-200' : 'bg-rose-500/15 text-rose-200'}`}>{t(`kind.${item.kind}`)}</span>
                  <span className="font-mono text-secondary-300">{item.id}</span>
                  <span className="text-secondary-500">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(item.workflowId);
                      onClose();
                    }}
                    className="truncate text-left text-primary-300 underline-offset-2 hover:underline"
                    title={t('goToFlow')}
                  >
                    {wfName(item.workflowId)}
                  </button>
                  <span className="text-secondary-500">·</span>
                  <span className="text-secondary-400">{fmtAgo(Math.max(0, diffMinutes(item.createdAt, now)), loc)}</span>
                </div>
                <p className="mt-1.5 text-sm text-white">
                  {t('atStep', { step: item.stepName, run: item.runId })}
                </p>
                <p className="mt-0.5 text-xs text-secondary-300">{msg(item.reason)}</p>
                <p className="mt-0.5 text-[11px] text-secondary-500">{t('sample', { name: tr(`samples.${item.sampleId}`) })}</p>

                {item.status === 'open' ? (
                  <>
                    {item.missingPath && (
                      <label className="mt-2 block text-[11px] text-secondary-300">
                        {t('fixLabel', { path: item.missingPath })}
                        <input
                          value={fixes[item.id] ?? ''}
                          onChange={(e) => setFixes((p) => ({ ...p, [item.id]: e.target.value }))}
                          placeholder={t('fixPlaceholder')}
                          className={`${inputCls} mt-1 font-mono`}
                        />
                      </label>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {exception ? (
                        <button type="button" disabled={busy !== null} onClick={() => act(item, 'continue')} className={btnPrimary}>
                          <PlayIcon className="h-3.5 w-3.5" />
                          {busy === item.id ? t('working') : item.resumeFrom ? t('continue') : t('approve')}
                        </button>
                      ) : (
                        <button type="button" disabled={busy !== null} onClick={() => act(item, 'retry')} className={btnPrimary}>
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                          {busy === item.id ? t('working') : t('retry')}
                        </button>
                      )}
                      <button type="button" disabled={busy !== null} onClick={() => act(item, 'done')} className={btnGhost}>
                        <CheckIcon className="h-3.5 w-3.5" />
                        {t('done')}
                      </button>
                      <button type="button" disabled={busy !== null} onClick={() => act(item, 'discard')} className={`${btnGhost} text-rose-200`}>
                        <TrashIcon className="h-3.5 w-3.5" />
                        {t('discard')}
                      </button>
                    </div>
                    {result && (
                      <p className="mt-2 text-[11px] text-amber-200" aria-live="polite">
                        {t('stillOpen', { run: result.id })} {msg(result.summary)}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-[11px] text-emerald-200">
                    {t(`status.${item.status}`)}
                    {item.resolution ? `: ${msg(item.resolution)}` : ''}
                    {item.resolvedAt ? ` · ${fmtAgo(Math.max(0, diffMinutes(item.resolvedAt, now)), loc)}` : ''}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={confirmAll}
        title={t('discardAllTitle')}
        body={t('discardAllBody', { count: openItems.length })}
        confirmLabel={t('discardAll', { count: openItems.length })}
        danger
        onClose={() => setConfirmAll(false)}
        onConfirm={() => {
          const n = discardOpen();
          toast(t('toastDiscardedAll', { count: n }), 'info');
        }}
      />
    </Modal>
  );
}
