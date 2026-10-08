'use client';

import { useMemo, useState } from 'react';
import { ArrowDownTrayIcon, MagnifyingGlassIcon, PlusIcon, ScaleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { BrandId, Category, Channel, Priority, Ticket } from './data';
import { downloadFile, includesNorm, priorityRank, slaRemaining, toCsv } from './engine';
import SlaBadge from './SlaBadge';
import { ChannelBadge, PriorityBadge, smallInputCls } from './ui';
import type { HdText } from './useHelpdeskText';

export type InboxView = 'all' | 'open' | 'pending' | 'resolved' | 'unassigned' | 'atRisk';
type SortKey = 'sla' | 'recent' | 'priority';

const VIEWS: InboxView[] = ['all', 'open', 'pending', 'resolved', 'unassigned', 'atRisk'];
const SORTS: SortKey[] = ['sla', 'recent', 'priority'];

const sentimentColor = {
  positive: 'text-green-600 dark:text-green-400',
  neutral: 'text-secondary-500 dark:text-secondary-400',
  negative: 'text-red-600 dark:text-red-400',
} as const;

interface Props {
  hd: HdText;
  tickets: Ticket[];
  clock: number;
  channel: Channel | 'all';
  priority: Priority | 'all';
  brand: BrandId | 'all';
  category: Category | 'all';
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewTicket: () => void;
  notify: (msg: string) => void;
}

export default function Inbox({ hd, tickets, clock, channel, priority, brand, category, selectedId, onSelect, onNewTicket, notify }: Props) {
  const { t, tx } = hd;
  const [search, setSearch] = useState('');
  const [view, setView] = useState<InboxView>('all');
  const [sort, setSort] = useState<SortKey>('sla');

  const filtered = useMemo(() => {
    const rows = tickets.filter((tk) => {
      if (channel !== 'all' && tk.channel !== channel) return false;
      if (priority !== 'all' && tk.priority !== priority) return false;
      if (brand !== 'all' && tk.brand !== brand) return false;
      if (category !== 'all' && tk.category !== category) return false;
      if (view === 'open' && tk.status !== 'open') return false;
      if (view === 'pending' && tk.status !== 'pending') return false;
      if (view === 'resolved' && tk.status !== 'resolved') return false;
      if (view === 'unassigned' && (tk.assignee || tk.status === 'resolved')) return false;
      if (view === 'atRisk' && slaRemaining(tk, clock) > 30) return false;
      if (search.trim()) {
        const hay = [tk.id, tx(tk.subject), tk.customer, tk.city, tk.pqrs?.radicado ?? '', ...tk.tags, ...tk.messages.map((m) => tx(m.text))].join(' ');
        if (!includesNorm(hay, search)) return false;
      }
      return true;
    });
    const statusRank = (tk: Ticket) => (tk.status === 'resolved' ? 2 : tk.status === 'pending' ? 1 : 0);
    return rows.sort((a, b) => {
      if (sort === 'recent') return b.createdAt - a.createdAt;
      if (sort === 'priority') return priorityRank(b.priority) - priorityRank(a.priority) || b.createdAt - a.createdAt;
      return statusRank(a) - statusRank(b) || slaRemaining(a, clock) - slaRemaining(b, clock) || priorityRank(b.priority) - priorityRank(a.priority);
    });
  }, [tickets, channel, priority, brand, category, view, search, sort, clock, tx]);

  const exportCsv = () => {
    const sep = hd.lang === 'es' ? ';' : ',';
    const header = ['id', 'subject', 'customer', 'city', 'channel', 'brand', 'area', 'priority', 'status', 'assignee', 'created', 'sla', 'pqrs'].map((k) =>
      t(`inbox.csv.${k}`),
    );
    const rows = filtered.map((tk) => {
      const rem = slaRemaining(tk, clock);
      return [
        tk.id,
        tx(tk.subject),
        tk.customer,
        tk.city,
        t(`channels.${tk.channel}`),
        t(`brands.${tk.brand}`),
        t(`categories.${tk.category}`),
        t(`priorities.${tk.priority}`),
        t(`statuses.${tk.status}`),
        hd.agentName(tk.assignee),
        hd.dateTime(tk.createdAt),
        Number.isFinite(rem) ? (rem <= 0 ? t('inbox.csv.slaBreached') : hd.duration(rem)) : '',
        tk.pqrs?.radicado ?? '',
      ];
    });
    downloadFile(t('inbox.csv.file'), toCsv([header, ...rows], sep), 'text/csv;charset=utf-8');
    notify(t('inbox.exported', { count: filtered.length }));
  };

  return (
    <section className="order-2 lg:order-none lg:col-span-4 min-w-0">
      <Card variant="bordered" padding="none" className="overflow-hidden">
        <CardHeader className="p-3 sm:p-4 border-b border-secondary-200 dark:border-secondary-700 mb-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">{t('inbox.title')}</CardTitle>
            <span className="text-xs text-secondary-500">{t('inbox.count', { count: filtered.length })}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('inbox.search')}
                aria-label={t('inbox.search')}
                className={`${smallInputCls} pl-8 py-2 text-sm`}
              />
            </div>
            <Button size="sm" onClick={onNewTicket} className="whitespace-nowrap">
              <PlusIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              {t('inbox.newTicket')}
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-secondary-600 dark:text-secondary-400">
              {t('inbox.viewLabel')}
              <select value={view} onChange={(e) => setView(e.target.value as InboxView)} className={`${smallInputCls} w-auto`}>
                {VIEWS.map((v) => (
                  <option key={v} value={v}>
                    {t(`inbox.views.${v}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-secondary-600 dark:text-secondary-400">
              {t('inbox.sortLabel')}
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${smallInputCls} w-auto`}>
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`inbox.sorts.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline disabled:opacity-40"
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('inbox.export')}
            </button>
          </div>
        </CardHeader>
        <div className="max-h-[680px] overflow-y-auto divide-y divide-secondary-100 dark:divide-secondary-800">
          {filtered.length === 0 && <p className="p-6 text-sm text-secondary-500 text-center">{t('inbox.noResults')}</p>}
          {filtered.map((tk) => {
            const active = tk.id === selectedId;
            const lastCustomer = [...tk.messages].reverse().find((m) => m.from === 'customer');
            return (
              <button
                key={tk.id}
                type="button"
                onClick={() => onSelect(tk.id)}
                aria-current={active ? 'true' : undefined}
                className={`w-full text-left p-3 transition-colors border-l-4 ${
                  active ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/40 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="text-[10px] font-mono text-secondary-500">{tk.id}</span>
                    <ChannelBadge channel={tk.channel} label={t(`channels.${tk.channel}`)} />
                    <PriorityBadge priority={tk.priority} label={t(`priorities.${tk.priority}`)} />
                    {tk.pqrs && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        <ScaleIcon className="h-3 w-3" aria-hidden="true" />
                        {t('pqrs.badge')}
                      </span>
                    )}
                  </div>
                  <SlaBadge hd={hd} ticket={tk} clock={clock} />
                </div>
                <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">{tx(tk.subject)}</p>
                {lastCustomer && <p className="text-xs text-secondary-600 dark:text-secondary-400 line-clamp-1 mt-0.5">{tx(lastCustomer.text)}</p>}
                <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px]">
                  <span className="text-secondary-500 flex items-center gap-1 min-w-0">
                    <UserCircleIcon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {tk.customer} · {hd.agentName(tk.assignee)}
                    </span>
                  </span>
                  <span className={`flex items-center gap-1 flex-shrink-0 ${sentimentColor[tk.sentiment]}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                    {t(`sentiments.${tk.sentiment}`)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
