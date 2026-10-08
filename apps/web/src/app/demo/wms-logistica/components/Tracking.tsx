'use client';

import { useEffect, useState } from 'react';
import { MagnifyingGlassIcon, ClipboardDocumentIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CITY_BY_ID, CLIENT_BY_ID } from '../lib/catalog';
import { fmtCOP, fmtDateTime } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { Shipment, ShipStatus } from '../lib/types';
import { Empty, Panel, Pill, SimNote, inputCls, tdCls, thCls, useT, type Tone } from './ui';
import { LabelModal } from './Packing';

type Filter = 'all' | 'active' | 'delivered' | 'exception';

export const SHIP_TONE: Record<ShipStatus, Tone> = {
  created: 'default',
  pickedUp: 'info',
  inTransit: 'info',
  outForDelivery: 'warning',
  arrived: 'warning',
  delivered: 'success',
  exception: 'danger',
};

export default function Tracking() {
  const t = useT();
  const { state, nav, lang, today, dispatch, notify, go } = useWms();
  const [filter, setFilter] = useState<Filter>(nav.focus === 'exception' ? 'exception' : 'all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | undefined>(nav.focus && nav.focus !== 'exception' ? nav.focus : undefined);
  const [label, setLabel] = useState<Shipment | null>(null);
  useEffect(() => {
    if (nav.focus === 'exception') setFilter('exception');
    else if (nav.focus) setSelected(nav.focus);
  }, [nav.focus]);

  const all = state.shipments.filter((s) => s.wh === nav.wh);
  const q = query.trim().toLowerCase();
  const list = all
    .filter((s) => filter === 'all' || (filter === 'active' ? !['delivered', 'exception'].includes(s.status) : s.status === filter))
    .filter((s) => {
      if (!q) return true;
      const o = state.orders.find((x) => x.id === s.order);
      return s.id.toLowerCase().includes(q) || s.order.toLowerCase().includes(q) || (o?.customer.toLowerCase().includes(q) ?? false);
    })
    .sort((a, b) => (a.events[a.events.length - 1].at < b.events[b.events.length - 1].at ? 1 : -1));
  const sh = all.find((s) => s.id === selected) ?? list[0];
  const order = sh ? state.orders.find((o) => o.id === sh.order) : undefined;
  const counts: Record<Filter, number> = {
    all: all.length,
    active: all.filter((s) => !['delivered', 'exception'].includes(s.status)).length,
    delivered: all.filter((s) => s.status === 'delivered').length,
    exception: all.filter((s) => s.status === 'exception').length,
  };

  const message =
    sh && order
      ? t('tracking.whatsapp', {
          name: order.customer.split(' ')[0],
          order: order.id,
          client: CLIENT_BY_ID[order.client].name,
          carrier: t(`carrierNames.${sh.carrier}`),
          guide: sh.id,
          eta: sh.etaDays === 0 ? t('tracking.etaToday') : t('tracking.etaDays', { n: sh.etaDays }),
        })
      : '';

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <Panel title={t('tracking.title')} subtitle={t('tracking.subtitle')} className="xl:col-span-3">
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label={t('tracking.filter')}>
          {(['all', 'active', 'delivered', 'exception'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs ${filter === f ? 'bg-stone-700 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200'}`}
            >
              {t(`tracking.filters.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>
        <label className="relative mb-3 block">
          <span className="sr-only">{t('tracking.search')}</span>
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
          <input className={`${inputCls} pl-8`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('tracking.searchPh')} />
        </label>
        {list.length === 0 ? (
          <Empty>{t('tracking.none')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className={thCls}>{t('tracking.guide')}</th>
                  <th className={thCls}>{t('orders.customer')}</th>
                  <th className={thCls}>{t('tracking.carrier')}</th>
                  <th className={thCls}>{t('orders.destination')}</th>
                  <th className={thCls}>{t('orders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const o = state.orders.find((x) => x.id === s.order);
                  const last = s.events[s.events.length - 1];
                  return (
                    <tr key={s.id} className={`border-b border-secondary-100 dark:border-secondary-800 ${sh?.id === s.id ? 'bg-stone-50 dark:bg-stone-900/30' : ''}`}>
                      <td className={tdCls}>
                        <button type="button" className="font-mono text-xs font-semibold text-primary-700 hover:underline dark:text-primary-300" aria-pressed={sh?.id === s.id} onClick={() => setSelected(s.id)}>
                          {s.id}
                        </button>
                        <div className="font-mono text-xs text-secondary-500">{s.order}</div>
                      </td>
                      <td className={`${tdCls} text-xs`}>{o?.customer}</td>
                      <td className={`${tdCls} text-xs`}>{t(`carrierNames.${s.carrier}`)}</td>
                      <td className={`${tdCls} text-xs`}>{CITY_BY_ID[s.city]?.name}</td>
                      <td className={tdCls}>
                        <Pill tone={SHIP_TONE[s.status]}>{t(`tracking.statuses.${s.status}`)}</Pill>
                        <div className="text-xs text-secondary-500">{fmtDateTime(last.at, today, lang)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={sh ? t('tracking.detail', { guide: sh.id }) : t('tracking.detailEmpty')} className="xl:col-span-2">
        {!sh || !order ? (
          <Empty>{t('tracking.pick')}</Empty>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="text-xs text-secondary-600 dark:text-secondary-300">
              {order.id} · {order.customer} · {order.address}, {CITY_BY_ID[order.city]?.name}
              <br />
              {t(`carrierNames.${sh.carrier}`)} · {fmtCOP(sh.cost, lang)} · {sh.weightKg} kg
            </div>
            <ol className="relative space-y-3 border-l-2 border-secondary-200 pl-4 dark:border-secondary-700">
              {sh.events.map((e, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full ${e.status === 'exception' ? 'bg-red-500' : e.status === 'delivered' ? 'bg-emerald-500' : 'bg-stone-500'}`} />
                  <div className="font-medium">{t(`tracking.statuses.${e.status}`)}</div>
                  <div className="text-xs text-secondary-500">
                    {fmtDateTime(e.at, today, lang)}
                    {e.note ? ` · ${t.has(`tracking.notes.${e.note}`) ? t(`tracking.notes.${e.note}`) : t(`driver.reasons.${e.note}`)}` : ''}
                  </div>
                </li>
              ))}
            </ol>
            {sh.pod && (
              <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
                {t('tracking.pod', { name: sh.pod.name, at: fmtDateTime(sh.pod.at, today, lang) })}
                {sh.pod.signature && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sh.pod.signature} alt={t('driver.signatureAlt')} className="mt-2 h-14 rounded border border-emerald-300 bg-white" />
                )}
                {!sh.pod.signature && sh.carrier !== 'own' && <div className="mt-1">{t('tracking.podCarrier')}</div>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {sh.carrier !== 'own' && !['delivered', 'exception'].includes(sh.status) && (
                <Button
                  size="sm"
                  onClick={() => {
                    dispatch({ type: 'ship.advance', shipment: sh.id, at: now() });
                    notify(t('tracking.advanced'));
                  }}
                >
                  {t('tracking.advance')}
                </Button>
              )}
              {sh.status === 'exception' && (
                <Button
                  size="sm"
                  onClick={() => {
                    dispatch({ type: 'ship.reschedule', shipment: sh.id, at: now() });
                    notify(t('tracking.rescheduled'));
                  }}
                >
                  {t('tracking.reschedule')}
                </Button>
              )}
              {sh.carrier === 'own' && sh.status !== 'delivered' && (
                <Button size="sm" variant="outline" onClick={() => go('driver')}>
                  {t('tracking.openDriver')}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setLabel(sh)}>
                {t('packing.viewLabel')}
              </Button>
            </div>
            <SimNote>{sh.carrier === 'own' ? t('tracking.ownNote') : t('tracking.carrierNote')}</SimNote>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <ChatBubbleLeftRightIcon className="h-4 w-4" /> {t('tracking.waTitle')}
              </div>
              <div className="whitespace-pre-line rounded-lg bg-white p-2 text-xs text-secondary-800 shadow-sm dark:bg-secondary-900 dark:text-secondary-200">{message}</div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline dark:text-emerald-200"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message);
                    notify(t('tracking.copied'));
                  } catch {
                    notify(t('tracking.copyError'), 'error');
                  }
                }}
              >
                <ClipboardDocumentIcon className="h-4 w-4" /> {t('tracking.copy')}
              </button>
              <SimNote className="mt-2">{t('tracking.waNote')}</SimNote>
            </div>
          </div>
        )}
      </Panel>
      {label && <LabelModal shipment={label} onClose={() => setLabel(null)} />}
    </div>
  );
}
