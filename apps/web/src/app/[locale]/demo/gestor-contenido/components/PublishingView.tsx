'use client';

import { useTranslations } from 'next-intl';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { titleOf } from '../lib/models';
import { can } from '../lib/permissions';
import { blockingIssues } from '../lib/reducer';
import { useCms } from '../lib/store';
import { formatDateTime, formatTime } from '../lib/time';
import type { Entry, Status } from '../lib/types';
import { btn, card, Empty, Note, StatusBadge, Switch, TypeBadge, useUntil } from './ui';

const COLUMNS: Status[] = ['review', 'approved', 'scheduled'];

export default function PublishingView() {
  const t = useTranslations('demoCms.publishing');
  const tStatus = useTranslations('demoCms.status');
  const tEvents = useTranslations('demoCms.publishing.events');
  const tTargets = useTranslations('demoCms.publishing.targets');
  const { state, me, act, toast, openEntry, newId, contentLocale: locale } = useCms();
  const until = useUntil();
  const person = (id: string) => state.people.find((p) => p.id === id)?.name ?? id;
  const admin = can(me.role, 'webhooks.manage');

  const quick = (e: Entry) => {
    const blocked = blockingIssues(state, e).length > 0;
    if (e.status === 'review' && can(me.role, 'entry.approve'))
      return (
        <button
          type="button"
          className={btn.small}
          disabled={blocked}
          onClick={() => {
            act({ type: 'entry.approve', id: e.id });
            toast(t('approvedToast'));
          }}
        >
          {t('approve')}
        </button>
      );
    if ((e.status === 'approved' || e.status === 'scheduled') && can(me.role, 'entry.publish'))
      return (
        <button
          type="button"
          className={btn.small}
          disabled={blocked}
          onClick={() => {
            act({ type: 'entry.publish', id: e.id });
            toast(t('publishedToast'));
          }}
        >
          {t('publishNow')}
        </button>
      );
    return null;
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {COLUMNS.map((s) => {
          const items = state.entries.filter((e) => e.status === s).sort((a, b) => (a.scheduledAt ?? a.updatedAt).localeCompare(b.scheduledAt ?? b.updatedAt));
          return (
            <section key={s} className={`${card} p-3`} aria-label={tStatus(s)}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {tStatus(s)} <span className="text-slate-400 font-normal">({items.length})</span>
              </h3>
              {items.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('emptyColumn')}</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((e) => (
                    <li key={e.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TypeBadge type={e.type} />
                        <StatusBadge entry={e} compact />
                      </div>
                      <button type="button" className="text-sm font-medium text-slate-900 dark:text-white hover:underline text-left break-words" onClick={() => openEntry(e.id)}>
                        {titleOf(e, e.content, locale)}
                      </button>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {s === 'scheduled' && e.scheduledAt
                          ? t('scheduledAt', { date: formatDateTime(e.scheduledAt, locale), rel: until(e.scheduledAt) })
                          : t('by', { name: person(e.updatedBy), date: formatDateTime(e.updatedAt, locale) })}
                      </p>
                      {blockingIssues(state, e).length > 0 && <p className="text-[11px] text-amber-700 dark:text-amber-300">{t('blocked')}</p>}
                      <div className="mt-1.5">{quick(e)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      {me.role === 'writer' && <Note>{t('writerNote')}</Note>}

      <section className={`${card} p-4 space-y-3`} aria-labelledby="cms-hooks-title">
        <h3 id="cms-hooks-title" className="font-bold text-slate-900 dark:text-white">
          {t('webhooksTitle')}
        </h3>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {state.webhooks.map((w) => (
            <li key={w.id} className="py-2 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{tTargets(`${w.id}.name`)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{tTargets(`${w.id}.desc`)}</p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all">POST {w.url}</p>
              </div>
              <Switch
                checked={w.enabled}
                disabled={!admin}
                label={tTargets(`${w.id}.name`)}
                onChange={() => {
                  act({ type: 'webhook.toggle', id: w.id });
                  toast(w.enabled ? t('hookOff') : t('hookOn'), 'info');
                }}
              />
            </li>
          ))}
        </ul>
        {!admin && <Note>{t('adminOnly')}</Note>}

        <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-2">{t('deliveriesTitle')}</h4>
        {state.deliveries.length === 0 ? (
          <Empty>{t('deliveriesEmpty')}</Empty>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-1.5 pr-3 font-semibold">{t('col.time')}</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">{t('col.event')}</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">{t('col.target')}</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">{t('col.entry')}</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">{t('col.paths')}</th>
                  <th className="text-left py-1.5 pr-3 font-semibold">{t('col.result')}</th>
                  <th className="py-1.5">
                    <span className="sr-only">{t('col.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.deliveries.map((d) => (
                  <tr key={d.id} className="text-slate-700 dark:text-slate-300">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{formatTime(d.at, locale)}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {tEvents(d.event)}
                      {d.auto && <span className="block text-[10px] text-blue-700 dark:text-blue-300">{t('auto')}</span>}
                      {d.resent && <span className="block text-[10px] text-slate-500">{t('resent')}</span>}
                    </td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">{tTargets(`${d.target}.name`)}</td>
                    <td className="py-1.5 pr-3">{d.entryTitle}</td>
                    <td className="py-1.5 pr-3 font-mono">{d.paths.join(', ')}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap text-emerald-700 dark:text-emerald-300">{t('simulatedOk')}</td>
                    <td className="py-1.5 text-right">
                      <button
                        type="button"
                        className={btn.small}
                        disabled={!admin}
                        onClick={() => {
                          act({ type: 'webhook.resend', deliveryId: d.id, deliveryNewId: newId('dlv') });
                          toast(t('resentToast'), 'info');
                        }}
                        aria-label={t('resend')}
                        title={t('resend')}
                      >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Note>{t('simulatedNote')}</Note>
      </section>
    </div>
  );
}
