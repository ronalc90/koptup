'use client';

import { useMemo, useState } from 'react';
import { ArrowDownTrayIcon, ScaleIcon } from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PQRS_TERM_DAYS, type Ticket } from './data';
import { downloadFile, pqrsInfo, toCsv, type PqrsInfo } from './engine';
import { Note } from './ui';
import type { HdText } from './useHelpdeskText';

type Filter = 'all' | 'open' | 'dueSoon' | 'overdue' | 'answered';
const FILTERS: Filter[] = ['all', 'open', 'dueSoon', 'overdue', 'answered'];

const stateVariant: Record<PqrsInfo['state'], 'success' | 'danger' | 'warning' | 'info'> = {
  answered: 'success',
  overdue: 'danger',
  dueSoon: 'warning',
  onTime: 'info',
};

export default function PqrsPanel({
  hd,
  tickets,
  clock,
  onOpenTicket,
  notify,
}: {
  hd: HdText;
  tickets: Ticket[];
  clock: number;
  onOpenTicket: (id: string) => void;
  notify: (msg: string) => void;
}) {
  const { t, tx } = hd;
  const [filter, setFilter] = useState<Filter>('all');

  const rows = useMemo(
    () =>
      tickets
        .filter((tk) => tk.pqrs)
        .map((tk) => ({ tk, info: pqrsInfo(tk, clock) as PqrsInfo }))
        .sort((a, b) => (a.info.state === 'answered' ? 1 : 0) - (b.info.state === 'answered' ? 1 : 0) || a.info.daysLeft - b.info.daysLeft),
    [tickets, clock],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, open: 0, dueSoon: 0, overdue: 0, answered: 0 };
    for (const r of rows) {
      if (r.info.state === 'answered') c.answered += 1;
      else {
        c.open += 1;
        if (r.info.state === 'dueSoon') c.dueSoon += 1;
        if (r.info.state === 'overdue') c.overdue += 1;
      }
    }
    return c;
  }, [rows]);

  const visible = rows.filter(({ info }) => {
    if (filter === 'all') return true;
    if (filter === 'open') return info.state !== 'answered';
    return info.state === filter;
  });

  const leftLabel = (info: PqrsInfo) =>
    info.state === 'answered'
      ? '—'
      : info.daysLeft < 0
        ? t('sla.pqrsOverdue', { n: -info.daysLeft })
        : info.daysLeft === 0
          ? t('sla.pqrsToday')
          : t('sla.pqrsLeft', { n: info.daysLeft });

  const exportCsv = () => {
    const sep = hd.lang === 'es' ? ';' : ',';
    const header = ['radicado', 'type', 'customer', 'subject', 'channel', 'filed', 'due', 'left', 'state', 'ticket'].map((k) => t(`pqrs.csv.${k}`));
    const data = visible.map(({ tk, info }) => [
      tk.pqrs?.radicado ?? '',
      t(`pqrs.types.${tk.pqrs?.type ?? 'peticion'}`),
      tk.customer,
      tx(tk.subject),
      t(`channels.${tk.channel}`),
      hd.isoDate(tk.pqrs?.filedDay ?? 0),
      hd.isoDate(info.dueDay),
      info.state === 'answered' ? '' : info.daysLeft,
      t(`pqrs.states.${info.state}`),
      tk.id,
    ]);
    downloadFile(t('pqrs.csv.file'), toCsv([header, ...data], sep), 'text/csv;charset=utf-8');
    notify(t('pqrs.exported', { count: visible.length }));
  };

  return (
    <Card variant="bordered" padding="md" className="mt-6 min-w-0">
      <CardHeader className="mb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <ScaleIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
              {t('pqrs.title')}
            </CardTitle>
            <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">{t('pqrs.subtitle', { date: hd.date(Math.floor(clock / 1440)) })}</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={visible.length === 0}
            className="self-start inline-flex items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-300 hover:underline disabled:opacity-40"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {t('pqrs.export')}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-3" role="group" aria-label={t('pqrs.filterLabel')}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-secondary-900 dark:bg-white text-white dark:text-secondary-900'
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700'
              }`}
            >
              {t(`pqrs.filters.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>

        {visible.length === 0 && <p className="text-sm text-secondary-500 py-4 text-center">{t('pqrs.empty')}</p>}

        {visible.length > 0 && (
          <>
            {/* Escritorio: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                    <th className="py-2 pr-3 font-medium">{t('pqrs.columns.radicado')}</th>
                    <th className="py-2 pr-3 font-medium">{t('pqrs.columns.type')}</th>
                    <th className="py-2 pr-3 font-medium">{t('pqrs.columns.customer')}</th>
                    <th className="py-2 pr-3 font-medium">{t('pqrs.columns.filed')}</th>
                    <th className="py-2 pr-3 font-medium">{t('pqrs.columns.due')}</th>
                    <th className="py-2 pr-3 font-medium">{t('pqrs.columns.left')}</th>
                    <th className="py-2 font-medium">{t('pqrs.columns.state')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                  {visible.map(({ tk, info }) => (
                    <tr key={tk.id} className="align-top">
                      <td className="py-2 pr-3">
                        <button type="button" onClick={() => onOpenTicket(tk.id)} className="font-mono text-xs text-primary-700 dark:text-primary-300 hover:underline">
                          {tk.pqrs?.radicado}
                        </button>
                        <p className="text-[11px] text-secondary-500">{tk.id}</p>
                      </td>
                      <td className="py-2 pr-3 text-secondary-800 dark:text-secondary-200">{t(`pqrs.types.${tk.pqrs?.type ?? 'peticion'}`)}</td>
                      <td className="py-2 pr-3">
                        <p className="text-secondary-900 dark:text-white">{tk.customer}</p>
                        <p className="text-[11px] text-secondary-500 line-clamp-1">{tx(tk.subject)}</p>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-secondary-700 dark:text-secondary-300">{hd.date(tk.pqrs?.filedDay ?? 0)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-secondary-700 dark:text-secondary-300">{hd.date(info.dueDay)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-secondary-700 dark:text-secondary-300">{leftLabel(info)}</td>
                      <td className="py-2">
                        <Badge variant={stateVariant[info.state]} size="sm" className="whitespace-nowrap">
                          {t(`pqrs.states.${info.state}`)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Móvil: tarjetas */}
            <div className="md:hidden space-y-2">
              {visible.map(({ tk, info }) => (
                <button
                  key={tk.id}
                  type="button"
                  onClick={() => onOpenTicket(tk.id)}
                  className="w-full text-left p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-400"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs text-primary-700 dark:text-primary-300">{tk.pqrs?.radicado}</span>
                    <Badge variant={stateVariant[info.state]} size="sm" className="whitespace-nowrap">
                      {t(`pqrs.states.${info.state}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary-900 dark:text-white">
                    {t(`pqrs.types.${tk.pqrs?.type ?? 'peticion'}`)} · {tk.customer}
                  </p>
                  <p className="text-[11px] text-secondary-500 line-clamp-1">{tx(tk.subject)}</p>
                  <p className="text-[11px] text-secondary-600 dark:text-secondary-400 mt-1">
                    {t('pqrs.mobileDates', { filed: hd.date(tk.pqrs?.filedDay ?? 0), due: hd.date(info.dueDay) })}
                    {info.state === 'answered' ? '' : ` · ${leftLabel(info)}`}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
        <Note className="mt-3">{t('pqrs.termNote', { days: PQRS_TERM_DAYS })}</Note>
      </CardContent>
    </Card>
  );
}
