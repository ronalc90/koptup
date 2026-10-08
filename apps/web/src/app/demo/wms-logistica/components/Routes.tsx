'use client';

import { useMemo, useState } from 'react';
import { ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CITY_BY_ID, WAREHOUSE_BY_ID } from '../lib/catalog';
import { evalRoutes, optimizeRoutes, type RouteStop } from '../lib/engine';
import { timeToMinutes } from '../lib/dates';
import { fmtClock, fmtNum } from '../lib/format';
import { useWms } from '../lib/store';
import type { WarehouseId, WmsState } from '../lib/types';
import { Empty, Field, Kpi, Panel, Pill, SimNote, inputCls, tdCls, thCls, useT } from './ui';

export const VEHICLE_COLORS = ['#0f766e', '#7c3aed', '#c2410c', '#2563eb'];

export function routeStops(state: WmsState, wh: WarehouseId): Record<string, RouteStop> {
  const out: Record<string, RouteStop> = {};
  for (const id of state.routes[wh].plan.flat()) {
    const o = state.orders.find((x) => x.id === id);
    const sh = o?.shipment ? state.shipments.find((s) => s.id === o.shipment) : undefined;
    if (!o?.stop || !sh) continue;
    out[id] = { order: id, x: o.stop.x, y: o.stop.y, from: o.stop.from, to: o.stop.to, kg: sh.weightKg };
  }
  return out;
}

export function routeStarted(state: WmsState, wh: WarehouseId) {
  return state.routes[wh].plan.flat().some((id) => {
    const o = state.orders.find((x) => x.id === id);
    const sh = o?.shipment ? state.shipments.find((s) => s.id === o.shipment) : undefined;
    return sh && sh.status !== 'created';
  });
}

export default function RoutesView() {
  const t = useT();
  const { state, nav, lang, dispatch, notify, go } = useWms();
  const w = WAREHOUSE_BY_ID[nav.wh];
  const route = state.routes[nav.wh];
  const stops = useMemo(() => routeStops(state, nav.wh), [state, nav.wh]);
  const startMin = timeToMinutes(route.start);
  const current = evalRoutes(route.plan, stops, w.vehicles, startMin);
  const started = routeStarted(state, nav.wh);
  const [before, setBefore] = useState<{ km: number; late: number; minutes: number } | null>(null);
  const total = Object.keys(stops).length;

  const optimize = () => {
    const res = optimizeRoutes(route.plan, stops, w.vehicles, startMin);
    if (!res.improved) {
      notify(t('routes.alreadyBest'), 'warn');
      return;
    }
    setBefore({ km: current.km, late: current.late, minutes: current.minutes });
    dispatch({ type: 'routes.apply', wh: nav.wh, plan: res.plan });
    const after = evalRoutes(res.plan, stops, w.vehicles, startMin);
    notify(t('routes.optimizedToast', { km: fmtNum(current.km - after.km, lang, 1) }));
  };

  return (
    <div className="space-y-5">
      <Panel
        title={t('routes.title', { wh: w.name })}
        subtitle={t('routes.subtitle')}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Field label={t('routes.start')} className="w-32">
              <input type="time" className={inputCls} value={route.start} onChange={(e) => e.target.value && dispatch({ type: 'routes.start', wh: nav.wh, start: e.target.value })} />
            </Field>
            <Button onClick={optimize} disabled={started || total < 2}>
              <ArrowPathRoundedSquareIcon className="mr-1.5 h-4 w-4" />
              {t('routes.optimize')}
            </Button>
          </div>
        }
      >
        {total === 0 ? (
          <Empty>{t('routes.none')}</Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label={t('routes.vehicles')} value={w.vehicles.length} hint={t('routes.stopsN', { n: total })} />
              <Kpi label={t('routes.km')} value={`${fmtNum(current.km, lang, 1)} km`} hint={before ? t('routes.before', { v: `${fmtNum(before.km, lang, 1)} km` }) : t('routes.kmHint')} tone={before && before.km > current.km ? 'text-emerald-600' : undefined} />
              <Kpi label={t('routes.time')} value={`${fmtNum(current.minutes, lang)} min`} hint={before ? t('routes.before', { v: `${fmtNum(before.minutes, lang)} min` }) : t('routes.timeHint')} />
              <Kpi label={t('routes.late')} value={current.late} tone={current.late ? 'text-red-600' : 'text-emerald-600'} hint={before ? t('routes.before', { v: String(before.late) }) : t('routes.lateHint')} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Pill tone={route.optimized ? 'success' : 'default'}>{route.optimized ? t('routes.optimized') : t('routes.notOptimized')}</Pill>
              {started && <Pill tone="warning">{t('routes.started')}</Pill>}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <RouteMap plan={route.plan} stops={stops} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200 dark:border-secondary-700">
                      <th className={thCls}>{t('routes.vehicle')}</th>
                      <th className={`${thCls} text-right`}>{t('routes.stopsCol')}</th>
                      <th className={`${thCls} text-right`}>{t('routes.load')}</th>
                      <th className={`${thCls} text-right`}>km</th>
                      <th className={`${thCls} text-right`}>{t('routes.back')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.routes.map((r, i) => (
                      <tr key={r.vehicle} className="border-b border-secondary-100 dark:border-secondary-800">
                        <td className={tdCls}>
                          <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ background: VEHICLE_COLORS[i % VEHICLE_COLORS.length] }} />
                          {r.vehicle}
                        </td>
                        <td className={`${tdCls} text-right`}>{r.stops.length}</td>
                        <td className={`${tdCls} text-right tabular-nums ${r.overCapacity ? 'font-semibold text-red-600' : ''}`}>
                          {fmtNum(r.kg, lang, 1)}/{fmtNum(r.capacityKg, lang)} kg
                        </td>
                        <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(r.km, lang, 1)}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{fmtClock(startMin + r.minutes, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        <SimNote className="mt-4">{t('routes.note')}</SimNote>
      </Panel>

      {total > 0 && (
        <Panel title={t('routes.stopsTitle')} actions={<Button size="sm" variant="outline" onClick={() => go('driver')}>{t('routes.openDriver')}</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className={thCls}>{t('routes.vehicle')}</th>
                  <th className={thCls}>#</th>
                  <th className={thCls}>{t('orders.order')}</th>
                  <th className={thCls}>{t('orders.destination')}</th>
                  <th className={thCls}>{t('routes.window')}</th>
                  <th className={thCls}>{t('routes.eta')}</th>
                  <th className={thCls}>{t('orders.status')}</th>
                </tr>
              </thead>
              <tbody>
                {current.routes.flatMap((r) =>
                  r.stops.map((st, k) => {
                    const o = state.orders.find((x) => x.id === st.order)!;
                    const sh = state.shipments.find((s) => s.id === o.shipment);
                    const stop = stops[st.order];
                    return (
                      <tr key={st.order} className="border-b border-secondary-100 dark:border-secondary-800">
                        <td className={`${tdCls} text-xs`}>{r.vehicle}</td>
                        <td className={tdCls}>{k + 1}</td>
                        <td className={`${tdCls} font-mono text-xs`}>{o.id}</td>
                        <td className={`${tdCls} text-xs`}>
                          {o.customer} · {o.address}, {CITY_BY_ID[o.city]?.name}
                        </td>
                        <td className={`${tdCls} text-xs`}>
                          {fmtClock(stop.from, lang)} – {fmtClock(stop.to, lang)}
                        </td>
                        <td className={`${tdCls} text-xs ${st.late ? 'font-semibold text-red-600' : ''}`}>
                          {fmtClock(st.arrive, lang)}
                          {st.late ? ` · ${t('routes.lateTag')}` : ''}
                        </td>
                        <td className={tdCls}>
                          <Pill tone={sh?.status === 'delivered' ? 'success' : sh?.status === 'exception' ? 'danger' : sh?.status === 'arrived' ? 'warning' : 'default'}>
                            {!sh || sh.status === 'created' ? t('driver.pendingStatus') : t(`tracking.statuses.${sh.status}`)}
                          </Pill>
                        </td>
                      </tr>
                    );
                  }),
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

/** Mapa ilustrativo (sin calles reales): posiciones en km desde la bodega. */
export function RouteMap({ plan, stops, highlight }: { plan: string[][]; stops: Record<string, RouteStop>; highlight?: string }) {
  const t = useT();
  const pts = Object.values(stops);
  const xs = [0, ...pts.map((p) => p.x)];
  const ys = [0, ...pts.map((p) => p.y)];
  const minX = Math.min(...xs) - 1.5;
  const maxX = Math.max(...xs) + 1.5;
  const minY = Math.min(...ys) - 1.5;
  const maxY = Math.max(...ys) + 1.5;
  const W = 320;
  const H = 240;
  const sx = (x: number) => ((x - minX) / (maxX - minX || 1)) * (W - 20) + 10;
  const sy = (y: number) => H - (((y - minY) / (maxY - minY || 1)) * (H - 20) + 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-xl border border-secondary-200 bg-gradient-to-br from-sky-50 to-emerald-50 dark:border-secondary-700 dark:from-sky-950/30 dark:to-emerald-950/20" role="img" aria-label={t('routes.mapAria')}>
      <defs>
        <pattern id="wms-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-secondary-300 dark:text-secondary-700" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#wms-grid)" />
      {plan.map((seq, i) => {
        const coords = [[0, 0], ...seq.filter((id) => stops[id]).map((id) => [stops[id].x, stops[id].y]), [0, 0]];
        const d = coords.map(([x, y], k) => `${k ? 'L' : 'M'} ${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`).join(' ');
        return <path key={i} d={d} fill="none" stroke={VEHICLE_COLORS[i % VEHICLE_COLORS.length]} strokeWidth={2} strokeOpacity={0.8} strokeLinejoin="round" />;
      })}
      {plan.flatMap((seq, i) =>
        seq
          .filter((id) => stops[id])
          .map((id, k) => (
            <g key={id}>
              <circle cx={sx(stops[id].x)} cy={sy(stops[id].y)} r={highlight === id ? 9 : 7} fill={VEHICLE_COLORS[i % VEHICLE_COLORS.length]} stroke="white" strokeWidth={highlight === id ? 3 : 1.5} />
              <text x={sx(stops[id].x)} y={sy(stops[id].y) + 3} fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">
                {k + 1}
              </text>
            </g>
          )),
      )}
      <rect x={sx(0) - 9} y={sy(0) - 9} width={18} height={18} rx={3} className="fill-stone-700" />
      <text x={sx(0)} y={sy(0) + 3} fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">
        B
      </text>
    </svg>
  );
}
