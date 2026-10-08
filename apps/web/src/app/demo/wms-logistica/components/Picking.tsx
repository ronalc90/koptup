'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { AISLE_M, BIN_BY_ID, MODULE_M, PICKERS, STORAGE_ZONES, AISLES, MODULES } from '../lib/catalog';
import { pickPlan, type PickTask } from '../lib/engine';
import { minutesOf } from '../lib/dates';
import { fmtClock, fmtNum, fmtPct } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { PickStrategy } from '../lib/types';
import { Empty, Kpi, Panel, Pill, Segmented, SimNote, inputCls, baseInputCls, tdCls, thCls, useProductName, useT } from './ui';

const STRATEGIES: PickStrategy[] = ['wave', 'batch', 'zone', 'cluster'];
const TRIP_COLORS = ['#0f766e', '#7c3aed', '#c2410c', '#2563eb', '#be185d', '#4d7c0f'];

export default function Picking() {
  const t = useT();
  const name = useProductName();
  const { state, nav, lang, dispatch, notify, go } = useWms();
  const waves = state.waves.filter((w) => w.wh === nav.wh);
  const openWaves = waves.filter((w) => w.status === 'open');
  const [waveId, setWaveId] = useState<string | undefined>(nav.focus?.startsWith('OLA-') ? nav.focus : openWaves[0]?.id ?? waves[0]?.id);
  useEffect(() => {
    if (nav.focus?.startsWith('OLA-')) setWaveId(nav.focus);
  }, [nav.focus]);
  useEffect(() => {
    if (!waves.some((w) => w.id === waveId)) setWaveId(openWaves[0]?.id ?? waves[0]?.id);
  }, [waves, openWaves, waveId]);
  const wave = waves.find((w) => w.id === waveId);
  const orders = useMemo(() => (wave ? wave.orders.map((id) => state.orders.find((o) => o.id === id)!).filter(Boolean) : []), [wave, state.orders]);
  const plan = useMemo(() => (wave ? pickPlan(orders, wave.strategy) : null), [orders, wave]);
  const current = plan?.tasks.find((x) => !x.done);
  const [loc, setLoc] = useState('');
  const [code, setCode] = useState('');
  useEffect(() => {
    setLoc('');
    setCode('');
  }, [current?.key]);

  if (!wave || !plan) {
    return (
      <Panel title={t('picking.title')} subtitle={t('picking.subtitle')}>
        <Empty>
          <p>{t('picking.noWave')}</p>
          <Button size="sm" className="mt-3" onClick={() => go('orders')}>
            {t('picking.goOrders')}
          </Button>
        </Empty>
      </Panel>
    );
  }

  const product = current ? state.products.find((p) => p.sku === current.sku) : undefined;
  const locOk = !!current && loc.trim().toUpperCase() === current.bin;
  const codeOk = !!current && !!product && (code.trim() === product.barcode || code.trim().toUpperCase() === product.sku);
  const savings = plan.naiveMeters > 0 ? ((plan.naiveMeters - plan.meters) / plan.naiveMeters) * 100 : 0;
  const doneCount = plan.tasks.filter((x) => x.done).length;

  const confirm = (task: PickTask) => {
    dispatch({ type: 'pick.confirm', items: task.items, at: now() });
  };

  const label = (task: PickTask) => {
    if (wave.strategy === 'cluster') return t('picking.tote', { n: task.tote ?? 1, order: task.items[0].order });
    if (wave.strategy === 'batch') return t('picking.forOrders', { n: task.items.length });
    return task.items[0].order;
  };

  return (
    <div className="space-y-5">
      <Panel
        title={t('picking.title')}
        subtitle={t('picking.subtitle')}
        actions={
          waves.length > 1 ? (
            <select className={`${baseInputCls} w-56 pr-9`} value={wave.id} onChange={(e) => setWaveId(e.target.value)} aria-label={t('picking.waveSelect')}>
              {waves.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.id} · {fmtClock(minutesOf(w.at), lang)} · {t(`orders.waveStatus.${w.status}`)}
                </option>
              ))}
            </select>
          ) : undefined
        }
      >
        <div className="mb-3 text-sm text-secondary-600 dark:text-secondary-300">
          {t('picking.waveInfo', { id: wave.id, n: orders.length, done: doneCount, total: plan.tasks.length })}
        </div>
        <Segmented
          label={t('picking.strategy')}
          value={wave.strategy}
          options={STRATEGIES.map((s) => ({ id: s, label: t(`strategies.${s}.name`) }))}
          onChange={(s) => dispatch({ type: 'wave.strategy', wave: wave.id, strategy: s })}
        />
        <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-300">{t(`strategies.${wave.strategy}.desc`)}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label={t('picking.stops')} value={fmtNum(plan.stops, lang)} hint={t('picking.trips', { n: plan.trips.length })} />
          <Kpi label={t('picking.distance')} value={`${fmtNum(plan.meters, lang)} m`} hint={t('picking.naive', { m: fmtNum(plan.naiveMeters, lang) })} />
          <Kpi label={t('picking.savings')} value={fmtPct(savings, lang, 0)} tone={savings > 0 ? 'text-emerald-600' : undefined} hint={t('picking.savingsHint')} />
          <Kpi label={t('picking.estTime')} value={`${fmtNum(plan.minutes, lang, 1)} min`} hint={plan.parallel ? t('picking.parallel') : t('picking.serial')} />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Panel title={t('picking.routeTitle')} subtitle={t('picking.routeSubtitle')} className="xl:col-span-3">
          <RouteSvg trips={plan.trips} />
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {plan.trips.map((tr, i) => (
              <span key={tr.label + i} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-4 rounded" style={{ background: TRIP_COLORS[i % TRIP_COLORS.length] }} />
                {wave.strategy === 'zone'
                  ? t('picking.tripZone', { zone: tr.label, picker: PICKERS[i % PICKERS.length], m: fmtNum(tr.meters, lang) })
                  : wave.strategy === 'wave'
                    ? t('picking.tripOrder', { order: tr.label, m: fmtNum(tr.meters, lang) })
                    : wave.strategy === 'cluster'
                      ? t('picking.tripCart', { n: tr.label, m: fmtNum(tr.meters, lang) })
                      : t('picking.tripBatch', { m: fmtNum(tr.meters, lang) })}
              </span>
            ))}
          </div>
          <SimNote className="mt-3">{t('picking.routeNote')}</SimNote>
        </Panel>

        <Panel title={t('picking.picker')} subtitle={t('picking.pickerSubtitle')} className="xl:col-span-2">
          <div className="mx-auto max-w-sm rounded-[1.75rem] border-[8px] border-secondary-900 bg-secondary-50 p-4 shadow-lg dark:border-secondary-700 dark:bg-secondary-900">
            {current && product ? (
              <div className="space-y-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-secondary-500">
                  {t('picking.taskN', { n: doneCount + 1, total: plan.tasks.length })} · {label(current)}
                </div>
                <div className="rounded-xl bg-stone-700 p-3 text-white">
                  <div className="text-xs opacity-80">{t('picking.goTo')}</div>
                  <div className="font-mono text-2xl font-bold">{current.bin}</div>
                  <div className="mt-1 text-sm">
                    {t('picking.take', { qty: current.qty })} · {name(current.sku)}
                  </div>
                  <div className="text-xs opacity-80">
                    {t('common.lot')} {current.lot} · {current.sku}
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1 flex items-center justify-between text-xs font-medium">
                    {t('picking.scanLoc')}
                    {locOk && <CheckCircleIcon className="h-4 w-4 text-emerald-600" />}
                  </span>
                  <input className={inputCls} value={loc} onChange={(e) => setLoc(e.target.value)} placeholder={current.bin} autoComplete="off" />
                </label>
                <label className="block">
                  <span className="mb-1 flex items-center justify-between text-xs font-medium">
                    {t('picking.scanProduct')}
                    {codeOk && <CheckCircleIcon className="h-4 w-4 text-emerald-600" />}
                  </span>
                  <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder={product.barcode} inputMode="numeric" autoComplete="off" />
                </label>
                {code.trim() && !codeOk && <p className="text-xs text-red-600">{t('picking.wrongProduct')}</p>}
                {loc.trim() && !locOk && <p className="text-xs text-red-600">{t('picking.wrongLoc')}</p>}
                <button
                  type="button"
                  onClick={() => {
                    setLoc(current.bin);
                    setCode(product.barcode);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  <QrCodeIcon className="h-4 w-4" /> {t('picking.simulateScan')}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    disabled={!locOk || !codeOk}
                    onClick={() => {
                      confirm(current);
                      notify(t('picking.picked', { qty: current.qty, bin: current.bin }));
                    }}
                  >
                    {t('picking.confirm')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      dispatch({ type: 'pick.short', items: current.items, at: now() });
                      notify(t('picking.shortToast', { bin: current.bin }), 'warn');
                    }}
                  >
                    {t('picking.short')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm">
                <CheckCircleIcon className="mx-auto h-10 w-10 text-emerald-600" />
                <p className="mt-2 font-semibold">{t('picking.allDone')}</p>
                <Button size="sm" className="mt-3" onClick={() => go('packing')}>
                  {t('picking.goPacking')}
                </Button>
              </div>
            )}
          </div>
          {current && (
            <button
              type="button"
              onClick={() => {
                const pending = plan.tasks.filter((x) => !x.done);
                dispatch({ type: 'pick.confirm', items: pending.flatMap((x) => x.items), at: now() });
                notify(t('picking.allConfirmed', { n: pending.length }));
              }}
              className="mt-3 w-full text-center text-xs font-semibold text-secondary-600 hover:underline dark:text-secondary-300"
            >
              {t('picking.confirmAll')}
            </button>
          )}
          <SimNote className="mt-3">{t('picking.pickerNote')}</SimNote>
        </Panel>
      </div>

      <Panel title={t('picking.listTitle')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className={thCls}>#</th>
                <th className={thCls}>{t('picking.trip')}</th>
                <th className={thCls}>{t('common.bin')}</th>
                <th className={thCls}>{t('common.product')}</th>
                <th className={`${thCls} text-right`}>{t('common.qty')}</th>
                <th className={thCls}>{t('picking.destination')}</th>
                <th className={thCls}>{t('orders.status')}</th>
              </tr>
            </thead>
            <tbody>
              {plan.tasks.map((task, i) => (
                <tr key={task.key} className={`border-b border-secondary-100 dark:border-secondary-800 ${current?.key === task.key ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}>
                  <td className={`${tdCls} text-secondary-500`}>{i + 1}</td>
                  <td className={`${tdCls} text-xs`}>{task.tripLabel || '—'}</td>
                  <td className={`${tdCls} font-mono text-xs`}>{task.bin}</td>
                  <td className={tdCls}>
                    {name(task.sku)}
                    <div className="font-mono text-xs text-secondary-500">
                      {task.sku} · {t('common.lot')} {task.lot}
                    </div>
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>{task.qty}</td>
                  <td className={`${tdCls} text-xs`}>{label(task)}</td>
                  <td className={tdCls}>
                    {task.short ? (
                      <Pill tone="danger" className="gap-1">
                        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        {t('picking.status.short')}
                      </Pill>
                    ) : task.done ? (
                      <Pill tone="success">{t('picking.status.picked')}</Pill>
                    ) : (
                      <Pill>{t('picking.status.pending')}</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/** Plano simplificado de la bodega con el recorrido calculado (no es un plano real). */
function RouteSvg({ trips }: { trips: { label: string; bins: string[]; meters: number }[] }) {
  const t = useT();
  const W = 340;
  const rows = STORAGE_ZONES.length * AISLES;
  const H = rows * 18 + 40;
  const scaleX = (W - 60) / (MODULES * MODULE_M);
  const scaleY = (H - 40) / (rows * AISLE_M);
  const px = (xm: number) => 40 + xm * scaleX;
  const py = (ym: number) => H - 24 - ym * scaleY;
  const pathFor = (bins: string[]) => {
    const pts: [number, number][] = [[0, 0]];
    let prev: { row: number; x: number; y: number } | null = null;
    for (const id of bins) {
      const b = BIN_BY_ID[id];
      const cur = { row: b.row, x: b.module * MODULE_M, y: b.row * AISLE_M };
      if (!prev) pts.push([0, cur.y], [cur.x, cur.y]);
      else if (prev.row === cur.row) pts.push([cur.x, cur.y]);
      else pts.push([0, prev.y], [0, cur.y], [cur.x, cur.y]);
      prev = cur;
    }
    if (prev) pts.push([0, prev.y], [0, 0]);
    return pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${px(x).toFixed(1)} ${py(y).toFixed(1)}`).join(' ');
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-xl border border-secondary-200 bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800/50" role="img" aria-label={t('picking.routeAria')}>
      {Array.from({ length: rows }, (_, r) => r + 1).map((row) => {
        const zone = STORAGE_ZONES[Math.floor((row - 1) / AISLES)];
        return (
          <g key={row}>
            <text x={4} y={py(row * AISLE_M) + 3} fontSize="8" fill="currentColor" className="text-secondary-500">
              {zone}-{String(((row - 1) % AISLES) + 1).padStart(2, '0')}
            </text>
            {Array.from({ length: MODULES }, (_, m) => (
              <rect key={m} x={px((m + 1) * MODULE_M) - 6} y={py(row * AISLE_M) - 5} width={12} height={10} rx={2} className="fill-secondary-200 dark:fill-secondary-700" />
            ))}
          </g>
        );
      })}
      <rect x={30} y={H - 20} width={44} height={14} rx={3} className="fill-stone-600" />
      <text x={52} y={H - 10} fontSize="8" textAnchor="middle" fill="white">
        {t('picking.dock')}
      </text>
      {trips.map((tr, i) => (
        <path key={tr.label + i} d={pathFor(tr.bins)} fill="none" stroke={TRIP_COLORS[i % TRIP_COLORS.length]} strokeWidth={2} strokeOpacity={0.85} strokeLinejoin="round" transform={`translate(${(i % 3) * 1.5}, ${(i % 3) * -1.5})`} />
      ))}
      {trips.flatMap((tr, i) =>
        tr.bins.map((id, k) => {
          const b = BIN_BY_ID[id];
          return (
            <g key={`${i}-${id}`}>
              <circle cx={px(b.module * MODULE_M)} cy={py(b.row * AISLE_M)} r={5.5} fill={TRIP_COLORS[i % TRIP_COLORS.length]} />
              <text x={px(b.module * MODULE_M)} y={py(b.row * AISLE_M) + 2.5} fontSize="6.5" textAnchor="middle" fill="white" fontWeight="bold">
                {k + 1}
              </text>
            </g>
          );
        }),
      )}
    </svg>
  );
}
