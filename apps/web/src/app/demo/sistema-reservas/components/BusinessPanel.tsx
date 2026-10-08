'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarDaysIcon, ChartBarIcon, ChatBubbleLeftRightIcon, ListBulletIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useReservas } from '../lib/store';
import type { ISODate } from '../lib/types';
import AgendaView, { type NewPrefill } from './AgendaView';
import BookingsTable from './BookingsTable';
import Indicators from './Indicators';
import MessagesView from './MessagesView';
import { btnPrimary, btnSmall, selectCls, useFmt, useKind } from './ui';

export type PanelTab = 'agenda' | 'list' | 'kpis' | 'messages';
const TABS: { id: PanelTab; icon: typeof CalendarDaysIcon }[] = [
  { id: 'agenda', icon: CalendarDaysIcon },
  { id: 'list', icon: ListBulletIcon },
  { id: 'kpis', icon: ChartBarIcon },
  { id: 'messages', icon: ChatBubbleLeftRightIcon },
];

export default function BusinessPanel({
  tab,
  setTab,
  agendaDate,
  setAgendaDate,
  onOpen,
  onNew,
  onReschedule,
}: {
  tab: PanelTab;
  setTab: (t: PanelTab) => void;
  agendaDate: ISODate;
  setAgendaDate: (d: ISODate) => void;
  onOpen: (id: string) => void;
  onNew: (p: NewPrefill) => void;
  onReschedule: (id: string) => void;
}) {
  const t = useTranslations('demoReservas.panel');
  const { biz, data, state } = useReservas();
  const f = useFmt();
  const kind = useKind(biz);
  const [viewAs, setViewAs] = useState('all');
  const last = state.lastBookingId ? data.bookings.find((b) => b.id === state.lastBookingId) : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{t('title', { business: biz.name })}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="sm:w-60">
            <label htmlFor="view-as" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              {t('viewAs')}
            </label>
            <select id="view-as" className={selectCls} value={viewAs} onChange={(e) => setViewAs(e.target.value)}>
              <option value="all">{t('reception')}</option>
              {biz.staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {biz.staffKind === 'court' ? s.name : t('asStaff', { name: s.name })}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className={btnPrimary} onClick={() => onNew({})}>
            <PlusIcon className="h-4 w-4" />
            {t('new')}
          </button>
        </div>
      </div>

      {viewAs !== 'all' && <p className="mb-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 px-3 py-2 text-xs text-sky-800 dark:text-sky-200">{t(biz.staffKind === 'court' ? 'viewAsCourtNote' : 'viewAsNote', { kind: kind.one.toLowerCase() })}</p>}

      {last && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/30 px-3 py-2.5 text-sm">
          <span className="text-orange-900 dark:text-orange-100">{t('lastBooking', { code: last.code, name: last.client.name, date: f.date(last.date, 'dayMonth'), time: f.time(last.start) })}</span>
          <span className="sm:ml-auto flex gap-2">
            <button
              type="button"
              className={btnSmall}
              onClick={() => {
                setAgendaDate(last.date);
                setTab('agenda');
              }}
            >
              {t('showInAgenda')}
            </button>
            <button type="button" className={btnSmall} onClick={() => onOpen(last.id)}>
              {t('openLast')}
            </button>
          </span>
        </div>
      )}

      <div role="tablist" aria-label={t('tabsLabel')} className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === id ? 'border-orange-600 text-orange-700 dark:text-orange-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'agenda' && <AgendaView viewAs={viewAs} date={agendaDate} setDate={setAgendaDate} onOpen={onOpen} onNew={onNew} />}
        {tab === 'list' && <BookingsTable viewAs={viewAs} onOpen={onOpen} />}
        {tab === 'kpis' && <Indicators />}
        {tab === 'messages' && <MessagesView viewAs={viewAs} onOpen={onOpen} onReschedule={onReschedule} />}
      </div>
    </div>
  );
}
