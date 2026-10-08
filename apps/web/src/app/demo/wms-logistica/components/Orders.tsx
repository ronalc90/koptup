'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CITIES, CITY_BY_ID, CLIENT_BY_ID, CUSTOMERS, LOCALITIES, STREETS, WAREHOUSE_BY_ID, WHOLESALERS } from '../lib/catalog';
import { minutesOf } from '../lib/dates';
import { fmtClock, fmtDate, fmtNum } from '../lib/format';
import { now, releasePlan, useWms } from '../lib/store';
import { cutoffFor } from '../lib/seed';
import type { Channel, Order, OrderStatus, PickStrategy } from '../lib/types';
import { Empty, Field, Panel, Pill, SimNote, inputCls, baseInputCls, selectCls, tdCls, thCls, useProductName, useT, type Tone } from './ui';

export const ORDER_TONE: Record<OrderStatus, Tone> = { new: 'info', released: 'warning', picked: 'primary', shipped: 'success', delivered: 'default' };
const FILTERS: ('all' | OrderStatus)[] = ['all', 'new', 'released', 'picked', 'shipped', 'delivered'];
const STRATEGIES: PickStrategy[] = ['wave', 'batch', 'zone', 'cluster'];

export function useCutoffLabel() {
  const t = useT();
  const { today, lang } = useWms();
  return (o: Order) => {
    const date = o.cutoff.slice(0, 10);
    const time = fmtClock(minutesOf(o.cutoff), lang);
    if (date === today) return t('orders.cutoffToday', { time });
    if (date > today) return t('orders.cutoffTomorrow', { time });
    return `${fmtDate(date, lang)}, ${time}`;
  };
}

export default function Orders() {
  const t = useT();
  const name = useProductName();
  const cutoffLabel = useCutoffLabel();
  const { state, nav, lang, today, dispatch, notify, go } = useWms();
  const [filter, setFilter] = useState<'all' | OrderStatus>('new');
  const [channel, setChannel] = useState<Channel | ''>('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<PickStrategy>('wave');
  const [open, setOpen] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<Channel>('web');

  const all = state.orders.filter((o) => o.wh === nav.wh);
  const q = query.trim().toLowerCase();
  const list = all
    .filter((o) => filter === 'all' || o.status === filter)
    .filter((o) => !channel || o.channel === channel)
    .filter((o) => !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || (CITY_BY_ID[o.city]?.name ?? '').toLowerCase().includes(q))
    .sort((a, b) => (a.cutoff < b.cutoff ? -1 : a.cutoff > b.cutoff ? 1 : a.id.localeCompare(b.id)));

  const releasable = all.filter((o) => o.status === 'new' && !o.crossDockPo);
  const stockCheck = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const o of releasable) out[o.id] = releasePlan(state, [o.id], today).ok.length === 1;
    return out;
  }, [releasable, state, today]);
  const sel = selected.filter((id) => releasable.some((o) => o.id === id));
  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === 'all' ? all.length : all.filter((o) => o.status === f).length]));

  const release = () => {
    const { ok, failed } = releasePlan(state, sel, today);
    if (!ok.length) {
      notify(t('orders.noStock'), 'error');
      return;
    }
    dispatch({ type: 'wave.release', wh: nav.wh, orders: sel, strategy, at: now() });
    setSelected([]);
    notify(failed.length ? t('orders.releasedPartial', { ok: ok.length, failed: failed.length }) : t('orders.released', { n: ok.length }), failed.length ? 'warn' : 'ok');
  };

  const simulateIncoming = () => {
    const w = WAREHOUSE_BY_ID[nav.wh];
    const client = w.clients[Math.floor(Math.random() * w.clients.length)];
    const pool = state.products.filter((p) => p.client === client && !p.imported && (!p.kit || nav.wh === 'fun'));
    const n = Math.min(pool.length, incoming === 'wholesale' ? 2 : 1 + Math.floor(Math.random() * 2));
    const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, n);
    const local = Math.random() < 0.5 && incoming !== 'wholesale';
    const at = now();
    let city: string;
    let address = `${STREETS[Math.floor(Math.random() * STREETS.length)]} ${2 + Math.floor(Math.random() * 160)} # ${1 + Math.floor(Math.random() * 98)}-${10 + Math.floor(Math.random() * 89)}`;
    let stop: Order['stop'];
    if (local) {
      const locs = LOCALITIES[w.metro];
      const loc = locs[Math.floor(Math.random() * locs.length)];
      city = loc.city;
      address += `, ${loc.name}`;
      stop = { x: loc.x, y: loc.y, from: 480, to: 1080 };
    } else {
      const options = CITIES.filter((c) => c.metro !== w.metro && c.region !== 'special');
      city = options[Math.floor(Math.random() * options.length)].id;
    }
    const seq = state.seq + 1 + Math.floor(Math.random() * 50);
    const order: Order = {
      id: `PED-${60000 + seq}`,
      wh: nav.wh,
      client,
      channel: incoming,
      customer: incoming === 'wholesale' ? WHOLESALERS[Math.floor(Math.random() * WHOLESALERS.length)] : CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
      city,
      address,
      createdAt: at,
      cutoff: cutoffFor(at, incoming),
      lines: chosen.map((p) => ({ sku: p.sku, qty: incoming === 'wholesale' ? (p.bulky ? 2 : 12) : 1, alloc: [] })),
      status: 'new',
      stop,
    };
    if (state.orders.some((o) => o.id === order.id)) return;
    dispatch({ type: 'order.add', order, at });
    setFilter('new');
    notify(t('orders.incoming', { id: order.id, channel: t(`channels.${incoming}`) }));
  };

  const waves = state.waves.filter((w) => w.wh === nav.wh).slice(0, 6);

  return (
    <div className="space-y-5">
      <Panel
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <select className={`${baseInputCls} w-44 pr-9`} value={incoming} onChange={(e) => setIncoming(e.target.value as Channel)} aria-label={t('orders.incomingChannel')}>
              {(['web', 'meli', 'wholesale'] as Channel[]).map((c) => (
                <option key={c} value={c}>
                  {t(`channels.${c}`)}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" onClick={simulateIncoming}>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              {t('orders.simulate')}
            </Button>
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label={t('orders.filter')}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs transition ${filter === f ? 'bg-stone-700 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 dark:bg-secondary-800 dark:text-secondary-200'}`}
            >
              {t(`orders.filters.${f}`)} ({counts[f]})
            </button>
          ))}
        </div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <label className="relative block flex-1">
            <span className="sr-only">{t('orders.search')}</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
            <input className={`${inputCls} pl-8`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('orders.searchPh')} />
          </label>
          <select className={`${baseInputCls} w-full sm:w-48 pr-9`} value={channel} onChange={(e) => setChannel(e.target.value as Channel | '')} aria-label={t('orders.channel')}>
            <option value="">{t('orders.allChannels')}</option>
            {(['web', 'meli', 'wholesale'] as Channel[]).map((c) => (
              <option key={c} value={c}>
                {t(`channels.${c}`)}
              </option>
            ))}
          </select>
        </div>

        {(filter === 'new' || filter === 'all') && releasable.length > 0 && (
          <div className="mb-3 flex flex-col gap-2 rounded-xl border border-stone-300 bg-stone-50 p-3 text-sm md:flex-row md:items-end dark:border-stone-700 dark:bg-stone-900/30">
            <div className="flex-1">
              <div className="font-semibold">{t('orders.waveBar', { n: sel.length })}</div>
              <div className="flex flex-wrap gap-3 text-xs">
                <button type="button" className="font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => {
                    const due = releasable.filter((o) => o.cutoff.slice(0, 10) <= today && stockCheck[o.id]).map((o) => o.id);
                    setSelected(due);
                    if (!due.length) notify(t('orders.noneDue'), 'warn');
                  }}>
                  {t('orders.selectDue')}
                </button>
                <button type="button" className="font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => setSelected(releasable.filter((o) => stockCheck[o.id]).map((o) => o.id))}>
                  {t('orders.selectAll')}
                </button>
                {sel.length > 0 && (
                  <button type="button" className="text-secondary-600 hover:underline" onClick={() => setSelected([])}>
                    {t('orders.clear')}
                  </button>
                )}
              </div>
            </div>
            <Field label={t('orders.strategy')} className="md:w-52">
              <select className={selectCls} value={strategy} onChange={(e) => setStrategy(e.target.value as PickStrategy)}>
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {t(`strategies.${s}.name`)}
                  </option>
                ))}
              </select>
            </Field>
            <Button onClick={release} disabled={!sel.length}>
              {t('orders.release')}
            </Button>
          </div>
        )}

        {list.length === 0 ? (
          <Empty>{t('orders.none')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className={thCls}>
                    <span className="sr-only">{t('orders.select')}</span>
                  </th>
                  <th className={thCls}>{t('orders.order')}</th>
                  <th className={thCls}>{t('orders.channel')}</th>
                  <th className={thCls}>{t('orders.customer')}</th>
                  <th className={thCls}>{t('orders.destination')}</th>
                  <th className={`${thCls} text-right`}>{t('orders.units')}</th>
                  <th className={thCls}>{t('orders.cutoff')}</th>
                  <th className={thCls}>{t('orders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((o) => {
                  const canSelect = o.status === 'new' && !o.crossDockPo && stockCheck[o.id];
                  const isOpen = open === o.id;
                  const late = !o.shippedAt && o.cutoff < now();
                  return (
                    <Fragment key={o.id}>
                      <tr className="border-b border-secondary-100 dark:border-secondary-800">
                        <td className={tdCls}>
                          {o.status === 'new' && !o.crossDockPo && (
                            <input
                              type="checkbox"
                              className="rounded border-secondary-300"
                              disabled={!canSelect}
                              checked={sel.includes(o.id)}
                              onChange={(e) => setSelected((s) => (e.target.checked ? [...s, o.id] : s.filter((x) => x !== o.id)))}
                              aria-label={t('orders.selectOne', { id: o.id })}
                            />
                          )}
                        </td>
                        <td className={tdCls}>
                          <button type="button" className="inline-flex items-center gap-1 font-mono text-xs font-semibold" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : o.id)}>
                            {isOpen ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                            {o.id}
                          </button>
                          <div className="text-xs text-secondary-500">{CLIENT_BY_ID[o.client].name}</div>
                        </td>
                        <td className={tdCls}>
                          <Pill tone={o.channel === 'meli' ? 'warning' : o.channel === 'wholesale' ? 'primary' : 'info'}>{t(`channels.${o.channel}`)}</Pill>
                        </td>
                        <td className={`${tdCls} text-xs`}>{o.customer}</td>
                        <td className={`${tdCls} text-xs`}>
                          {CITY_BY_ID[o.city]?.name}
                          <div className="text-secondary-500">{o.address}</div>
                        </td>
                        <td className={`${tdCls} text-right tabular-nums`}>
                          {fmtNum(o.lines.reduce((s, l) => s + l.qty, 0), lang)}
                          <div className="text-xs text-secondary-500">{t('orders.lines', { n: o.lines.length })}</div>
                        </td>
                        <td className={`${tdCls} text-xs ${late ? 'font-semibold text-red-600' : ''}`}>{cutoffLabel(o)}</td>
                        <td className={tdCls}>
                          <Pill tone={ORDER_TONE[o.status]}>{t(`orders.statuses.${o.status}`)}</Pill>
                          {o.crossDockPo && o.status === 'new' && <div className="mt-1 text-xs text-secondary-500">{t('orders.waitingPo', { po: o.crossDockPo })}</div>}
                          {o.status === 'new' && !o.crossDockPo && !stockCheck[o.id] && <div className="mt-1 text-xs text-red-600">{t('orders.noStockRow')}</div>}
                          {o.wave && o.status === 'released' && (
                            <button type="button" className="mt-1 block text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => go('picking', { focus: o.wave })}>
                              {t('orders.goPicking', { wave: o.wave })}
                            </button>
                          )}
                          {o.status === 'picked' && (
                            <button type="button" className="mt-1 block text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => go('packing', { focus: o.id })}>
                              {t('orders.goPacking')}
                            </button>
                          )}
                          {(o.status === 'shipped' || o.status === 'delivered') && o.shipment && (
                            <button type="button" className="mt-1 block text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => go('tracking', { focus: o.shipment })}>
                              {o.shipment}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-secondary-200 bg-secondary-50/60 dark:border-secondary-700 dark:bg-secondary-800/30">
                          <td />
                          <td colSpan={7} className="px-2 py-2">
                            <ul className="space-y-1 text-xs">
                              {o.lines.map((ln) => (
                                <li key={ln.sku}>
                                  <span className="font-medium">{name(ln.sku)}</span> <span className="font-mono text-secondary-500">{ln.sku}</span> × {ln.qty}
                                  {ln.alloc.length > 0 && (
                                    <span className="text-secondary-500">
                                      {' '}
                                      → {ln.alloc.map((a) => `${a.bin} (${t('common.lot')} ${a.lot}, ${a.qty})`).join(' · ')}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <SimNote className="mt-3">{t('orders.note')}</SimNote>
      </Panel>

      <Panel title={t('orders.wavesTitle')} subtitle={t('orders.wavesSubtitle')}>
        {waves.length === 0 ? (
          <Empty>{t('orders.noWaves')}</Empty>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {waves.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-secondary-200 p-3 text-sm dark:border-secondary-700">
                <div>
                  <div className="font-mono text-xs font-semibold">{w.id}</div>
                  <div className="text-xs text-secondary-500">
                    {t('orders.waveMeta', { n: w.orders.length, time: fmtClock(minutesOf(w.at), lang), strategy: t(`strategies.${w.strategy}.name`) })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={w.status === 'done' ? 'success' : 'warning'}>{t(`orders.waveStatus.${w.status}`)}</Pill>
                  {w.status === 'open' && (
                    <Button size="sm" onClick={() => go('picking', { focus: w.id })}>
                      {t('orders.pickNow')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
