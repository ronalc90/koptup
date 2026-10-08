'use client';

import { useState } from 'react';
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CITY_BY_ID, CLIENT_BY_ID } from '../lib/catalog';
import { stockBySku } from '../lib/engine';
import { fmtNum } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { CrossStep } from '../lib/types';
import { Empty, Field, Panel, Pill, SimNote, inputCls, tdCls, thCls, useProductName, useT } from './ui';

const STEPS: CrossStep[] = ['sort', 'consolidate', 'dispatch', 'done'];
const KIT_SKU = 'LIR-KITBV';

export default function CrossDockKits() {
  const t = useT();
  const name = useProductName();
  const { state, nav, dispatch, lang, today, notify, go, setWh } = useWms();
  const tasks = state.crossDock.filter((x) => x.wh === nav.wh);
  const waiting = state.pos.filter((p) => p.wh === nav.wh && p.crossDockOrder && (p.status === 'expected' || p.status === 'receiving'));

  const kit = state.products.find((p) => p.sku === KIT_SKU);
  const comps = (kit?.kit ?? []).map((c) => {
    const st = stockBySku(state, 'fun', c.sku, today);
    return { ...c, available: st.available, possible: Math.floor(st.available / c.qty) };
  });
  const possible = comps.length ? Math.min(...comps.map((c) => c.possible)) : 0;
  const kitsInStock = state.lots.filter((l) => l.wh === 'fun' && l.sku === KIT_SKU && l.qty > 0).reduce((s, l) => s + l.qty, 0);
  const [qty, setQty] = useState(10);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Panel title={t('crossdock.title')} subtitle={t('crossdock.subtitle')}>
        <div className="space-y-3">
          {waiting.map((p) => (
            <div key={p.id} className="rounded-xl border border-dashed border-secondary-300 p-3 text-sm dark:border-secondary-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold">{p.id}</span>
                <Pill tone="info">{t('crossdock.waiting')}</Pill>
              </div>
              <p className="mt-1 text-secondary-600 dark:text-secondary-300">{t('crossdock.waitingText', { order: p.crossDockOrder ?? '' })}</p>
              <button type="button" onClick={() => go('receiving', { focus: p.id })} className="mt-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
                {t('crossdock.goReceive')}
              </button>
            </div>
          ))}
          {tasks.length === 0 && waiting.length === 0 && <Empty>{t('crossdock.none')}</Empty>}
          {tasks.map((x) => {
            const o = state.orders.find((ord) => ord.id === x.order);
            const sh = o?.shipment ? state.shipments.find((s) => s.id === o.shipment) : undefined;
            const idx = STEPS.indexOf(x.step);
            return (
              <div key={x.id} className="rounded-xl border border-secondary-200 p-3 text-sm dark:border-secondary-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">
                    {x.po} <ArrowRightIcon className="inline h-3.5 w-3.5" /> {x.order}
                  </div>
                  <Pill tone={x.step === 'done' ? 'success' : 'warning'}>{t(`crossdock.steps.${x.step}`)}</Pill>
                </div>
                {o && (
                  <div className="text-xs text-secondary-500">
                    {o.customer} · {CITY_BY_ID[o.city]?.name} · {CLIENT_BY_ID[o.client].name} · {t('common.unitsN', { n: x.units })}
                  </div>
                )}
                <ol className="mt-3 flex flex-wrap items-center gap-1 text-xs">
                  <li className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">✓ {t('crossdock.received')}</li>
                  {STEPS.slice(0, 3).map((st, i) => (
                    <li
                      key={st}
                      className={`rounded-full px-2 py-0.5 ${
                        i < idx ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : i === idx ? 'bg-amber-100 font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-300'
                      }`}
                    >
                      {i < idx ? '✓ ' : ''}
                      {t(`crossdock.steps.${st}`)}
                    </li>
                  ))}
                </ol>
                {x.step !== 'done' ? (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      dispatch({ type: 'xd.advance', id: x.id, at: now() });
                      notify(t(`crossdock.toast.${x.step}`, { order: x.order }));
                    }}
                  >
                    {t(`crossdock.action.${x.step}`)}
                  </Button>
                ) : (
                  sh && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                      {t('crossdock.shipped', { guide: sh.id, carrier: t(`carrierNames.${sh.carrier}`) })}
                      <button type="button" className="font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => go('tracking', { focus: sh.id })}>
                        {t('common.viewTracking')}
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
        <SimNote className="mt-3">{t('crossdock.note')}</SimNote>
      </Panel>

      <Panel title={t('kits.title')} subtitle={t('kits.subtitle')}>
        {nav.wh !== 'fun' ? (
          <div className="space-y-2 text-sm">
            <p>{t('kits.onlyFun')}</p>
            <Button size="sm" variant="outline" onClick={() => setWh('fun')}>
              {t('kits.switch')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-secondary-50 p-3 text-sm dark:bg-secondary-800/60">
              <div className="font-semibold">{name(KIT_SKU)}</div>
              <div className="text-xs text-secondary-500">
                {KIT_SKU} · {t('kits.inStock', { n: kitsInStock })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-secondary-200 dark:border-secondary-700">
                    <th className={thCls}>{t('kits.component')}</th>
                    <th className={`${thCls} text-right`}>{t('kits.perKit')}</th>
                    <th className={`${thCls} text-right`}>{t('kits.available')}</th>
                    <th className={`${thCls} text-right`}>{t('kits.possible')}</th>
                  </tr>
                </thead>
                <tbody>
                  {comps.map((c) => (
                    <tr key={c.sku} className="border-b border-secondary-100 dark:border-secondary-800">
                      <td className={tdCls}>
                        {name(c.sku)} <span className="font-mono text-xs text-secondary-500">{c.sku}</span>
                      </td>
                      <td className={`${tdCls} text-right`}>{c.qty}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(c.available, lang)}</td>
                      <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(c.possible, lang)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (qty < 1 || qty > possible) return;
                dispatch({ type: 'kit.build', qty, at: now() });
                notify(t('kits.built', { n: qty }));
              }}
            >
              <Field label={t('kits.qty')} className="w-32">
                <input type="number" min={1} max={possible} className={inputCls} value={qty} onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))} />
              </Field>
              <Button type="submit" disabled={qty < 1 || qty > possible}>
                {t('kits.build')}
              </Button>
              <span className="text-xs text-secondary-500">{t('kits.max', { n: possible })}</span>
            </form>
            <SimNote>{t('kits.note')}</SimNote>
          </div>
        )}
      </Panel>
    </div>
  );
}
