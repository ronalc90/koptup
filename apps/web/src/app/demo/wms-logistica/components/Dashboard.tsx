'use client';

import {
  ClipboardDocumentListIcon,
  InboxArrowDownIcon,
  ArchiveBoxArrowDownIcon,
  CubeIcon,
  TruckIcon,
  ClockIcon,
  CheckBadgeIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { WAREHOUSE_BY_ID } from '../lib/catalog';
import { kpis } from '../lib/engine';
import { fmtDateTime, fmtNum, fmtPct } from '../lib/format';
import { useWms } from '../lib/store';
import { Kpi, Panel, SimNote, useT } from './ui';

export default function Dashboard() {
  const t = useT();
  const { state, nav, today, lang, go } = useWms();
  const k = kpis(state, nav.wh, today);
  const w = WAREHOUSE_BY_ID[nav.wh];
  const log = state.log.filter((l) => l.wh === nav.wh).slice(0, 10);
  const alerts: { key: string; text: string; onClick: () => void }[] = [];
  if (k.expired) alerts.push({ key: 'expired', text: t('dashboard.alerts.expired', { n: k.expired }), onClick: () => go('stock', { focus: 'expiring' }) });
  if (k.expiring) alerts.push({ key: 'expiring', text: t('dashboard.alerts.expiring', { n: k.expiring }), onClick: () => go('stock', { focus: 'expiring' }) });
  if (k.putawayPending) alerts.push({ key: 'putaway', text: t('dashboard.alerts.putaway', { n: k.putawayPending }), onClick: () => go('receiving') });
  if (k.countsDue) alerts.push({ key: 'counts', text: t('dashboard.alerts.counts', { n: k.countsDue }), onClick: () => go('counts') });
  const exceptions = state.shipments.filter((s) => s.wh === nav.wh && s.status === 'exception').length;
  if (exceptions) alerts.push({ key: 'exceptions', text: t('dashboard.alerts.exceptions', { n: exceptions }), onClick: () => go('tracking', { focus: 'exception' }) });
  if (k.rmasOpen) alerts.push({ key: 'rmas', text: t('dashboard.alerts.rmas', { n: k.rmasOpen }), onClick: () => go('returns') });

  return (
    <div className="space-y-5">
      <Panel title={t('dashboard.title', { wh: w.name })} subtitle={t('dashboard.subtitle')}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Kpi icon={ClipboardDocumentListIcon} label={t('dashboard.kpi.ordersToday')} value={fmtNum(k.ordersToday, lang)} hint={t('dashboard.kpi.dueToday', { n: k.dueToday })} onClick={() => go('orders')} />
          <Kpi icon={InboxArrowDownIcon} label={t('dashboard.kpi.toRelease')} value={fmtNum(k.toRelease, lang)} hint={t('dashboard.kpi.toReleaseHint')} onClick={() => go('orders')} tone="text-sky-700 dark:text-sky-300" />
          <Kpi icon={ClipboardDocumentCheckIcon} label={t('dashboard.kpi.inPicking')} value={fmtNum(k.inPicking, lang)} hint={t('dashboard.kpi.inPickingHint')} onClick={() => go('picking')} />
          <Kpi icon={CubeIcon} label={t('dashboard.kpi.toPack')} value={fmtNum(k.toPack, lang)} hint={t('dashboard.kpi.toPackHint')} onClick={() => go('packing')} />
          <Kpi icon={TruckIcon} label={t('dashboard.kpi.shippedToday')} value={fmtNum(k.shippedToday, lang)} hint={t('dashboard.kpi.inTransit', { n: k.inTransit })} onClick={() => go('tracking')} />
          <Kpi
            icon={ClockIcon}
            label={t('dashboard.kpi.onTime')}
            value={k.shippedToday ? fmtPct(k.onTimePct, lang) : '—'}
            hint={t('dashboard.kpi.onTimeHint')}
            tone={k.onTimePct >= 95 ? 'text-emerald-600' : 'text-amber-600'}
            onClick={() => go('orders')}
          />
          <Kpi
            icon={CheckBadgeIcon}
            label={t('dashboard.kpi.accuracy')}
            value={fmtPct(k.accuracy, lang)}
            hint={t('dashboard.kpi.accuracyHint', { n: k.counted })}
            tone={k.accuracy >= 99 ? 'text-emerald-600' : 'text-amber-600'}
            onClick={() => go('counts')}
          />
          <Kpi icon={BuildingStorefrontIcon} label={t('dashboard.kpi.occupancy')} value={fmtPct(k.occupancy, lang, 0)} hint={t('dashboard.kpi.occupancyHint', { n: k.usedBins })} onClick={() => go('map')} />
          <Kpi icon={ArchiveBoxArrowDownIcon} label={t('dashboard.kpi.posOpen')} value={fmtNum(k.posOpen, lang)} hint={t('dashboard.kpi.putawayHint', { n: k.putawayPending })} onClick={() => go('receiving')} />
          <Kpi icon={ExclamationTriangleIcon} label={t('dashboard.kpi.expiring')} value={fmtNum(k.expiring, lang)} hint={t('dashboard.kpi.expiredHint', { n: k.expired })} tone={k.expiring || k.expired ? 'text-amber-600' : undefined} onClick={() => go('stock', { focus: 'expiring' })} />
          <Kpi icon={ArrowUturnLeftIcon} label={t('dashboard.kpi.rmas')} value={fmtNum(k.rmasOpen, lang)} hint={t('dashboard.kpi.rmasHint')} onClick={() => go('returns')} />
          <Kpi icon={ClipboardDocumentCheckIcon} label={t('dashboard.kpi.counts')} value={fmtNum(k.countsDue, lang)} hint={t('dashboard.kpi.countsHint')} onClick={() => go('counts')} />
        </div>
        <SimNote className="mt-4">{t('dashboard.note')}</SimNote>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel title={t('dashboard.alertsTitle')}>
          {alerts.length === 0 ? (
            <p className="text-sm text-secondary-500">{t('dashboard.noAlerts')}</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((a) => (
                <li key={a.key}>
                  <button type="button" onClick={a.onClick} className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm text-amber-900 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                    <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">{a.text}</span>
                    <span className="text-xs font-semibold">{t('common.open')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={t('dashboard.activity')}>
          {log.length === 0 ? (
            <p className="text-sm text-secondary-500">{t('dashboard.noActivity')}</p>
          ) : (
            <ul className="divide-y divide-secondary-100 text-sm dark:divide-secondary-800">
              {log.map((l) => (
                <li key={l.id} className="flex gap-3 py-2">
                  <span className="w-24 shrink-0 text-xs tabular-nums text-secondary-500">{fmtDateTime(l.at, today, lang)}</span>
                  <span className="min-w-0 text-secondary-800 dark:text-secondary-200">{t(`log.${l.key}`, l.params)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
