'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUturnLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { SOURCES } from '../lib/data';
import { dateTime, norm, num } from '../lib/format';
import { useDemo } from '../lib/store';
import { Modal, btn, inputCls } from './ui';
import NewSourceWizard from './NewSourceWizard';

type Filter = 'all' | 'active' | 'paused' | 'review';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('demoScraping');
  const { s, ready, loc, selectSource, reset } = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [wizard, setWizard] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const items = [
    ...SOURCES.map((m) => {
      const r = s.results[m.id];
      const paused = s.paused.includes(m.id);
      return {
        id: m.id as string,
        name: t(`sources.${m.id}.name`),
        kind: t(`sources.kind.${m.kind}`),
        origin: m.origin,
        state: (paused ? 'paused' : 'active') as Filter,
        dot: paused ? 'bg-yellow-400' : r?.status === 'error' ? 'bg-rose-400' : r?.status === 'partial' ? 'bg-amber-400' : 'bg-emerald-400',
        statusLabel: paused ? t('sidebar.status.paused') : r?.status === 'partial' ? t('sidebar.status.partial') : r?.status === 'error' ? t('sidebar.status.error') : t('sidebar.status.active'),
        line: ready && r ? t('sidebar.records', { count: r.rows.length, formatted: num(r.rows.length, loc) }) : '',
        updated: ready && r ? t('sidebar.updated', { when: dateTime(r.at, loc) }) : '',
      };
    }),
    ...s.customSources.map((c) => ({
      id: c.id,
      name: c.name,
      kind: t(`sources.kind.${c.kind}`),
      origin: c.url,
      state: 'review' as Filter,
      dot: 'bg-sky-400',
      statusLabel: t('sidebar.status.review'),
      line: c.url.replace(/^https?:\/\//, ''),
      updated: '',
    })),
  ];
  const counts: Record<Filter, number> = {
    all: items.length,
    active: items.filter((i) => i.state === 'active').length,
    paused: items.filter((i) => i.state === 'paused').length,
    review: items.filter((i) => i.state === 'review').length,
  };
  const needle = norm(q.trim());
  const shown = items.filter((i) => (filter === 'all' || i.state === filter) && (!needle || norm(`${i.name} ${i.kind} ${i.origin}`).includes(needle)));

  return (
    <aside className={`${open ? 'block' : 'hidden'} w-full shrink-0 border-r border-secondary-800 bg-secondary-900/40 lg:block lg:w-72 lg:min-h-[calc(100vh-105px)] ${open ? 'absolute inset-x-0 z-20 lg:static' : ''}`}>
      <div className="space-y-3 bg-secondary-950 p-3 lg:bg-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-secondary-400">{t('sidebar.title')}</h2>
          <button type="button" onClick={() => setWizard(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-emerald-300 hover:bg-secondary-800" title={t('sidebar.newSourceHint')}>
            <PlusIcon className="h-4 w-4" />
            {t('sidebar.newSource')}
          </button>
        </div>
        <label className="block">
          <span className="sr-only">{t('sidebar.search')}</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('sidebar.search')} className={`${inputCls} !py-1.5 !text-xs`} />
        </label>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {(['all', 'active', 'paused', 'review'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-2 py-0.5 ${filter === f ? 'border-zinc-400 bg-zinc-100/10 text-zinc-100' : 'border-secondary-700 text-secondary-400 hover:text-white'}`}
            >
              {t(`sidebar.filters.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>
        <ul className="space-y-1.5">
          {shown.length === 0 && <li className="px-1 py-3 text-xs text-secondary-500">{t('sidebar.empty')}</li>}
          {shown.map((i) => {
            const active = s.activeId === i.id;
            return (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectSource(i.id);
                    onClose();
                  }}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full rounded-lg border-l-4 p-2.5 text-left transition-colors ${
                    active ? 'border-y border-r border-zinc-300 border-y-zinc-400/40 border-r-zinc-400/40 bg-zinc-100/5' : 'border-secondary-800 bg-secondary-900/60 hover:border-secondary-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-white">{i.name}</span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-secondary-400">
                      <span className={`inline-block h-2 w-2 rounded-full ${i.dot}`} aria-hidden="true" />
                      {i.statusLabel}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-secondary-400">{i.kind}</div>
                  {(i.line || i.updated) && (
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-secondary-500">
                      <span className="truncate">{i.line}</span>
                      <span className="shrink-0">{i.updated}</span>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] leading-relaxed text-secondary-500">{t('sidebar.note')}</p>
        <button type="button" onClick={() => setConfirmReset(true)} className={`${btn.ghost} w-full justify-start`}>
          <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
          {t('actions.reset')}
        </button>
      </div>
      <NewSourceWizard open={wizard} onClose={() => setWizard(false)} onCreated={() => onClose()} />
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title={t('actions.resetTitle')}>
        <p className="text-sm text-secondary-300">{t('actions.resetConfirm')}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btn.secondary} onClick={() => setConfirmReset(false)}>{t('actions.cancel')}</button>
          <button
            type="button"
            className={btn.primary}
            onClick={() => {
              reset();
              setConfirmReset(false);
              onClose();
            }}
          >
            {t('actions.reset')}
          </button>
        </div>
      </Modal>
    </aside>
  );
}
