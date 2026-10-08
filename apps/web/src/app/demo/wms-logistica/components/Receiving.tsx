'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, QrCodeIcon, TruckIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CLIENT_BY_ID, SUPPLIER_BY_ID, ean13, fmtNit } from '../lib/catalog';
import { binContents, emptyBins } from '../lib/engine';
import { fmtDate, fmtDateTime, fmtNum } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { PurchaseOrder } from '../lib/types';
import { Empty, Field, Panel, Pill, SimNote, inputCls, selectCls, tdCls, thCls, useProductName, useT, type Tone } from './ui';

/** Código de un producto que no viene en ninguna OC (para mostrar el rechazo). */
const UNKNOWN_CODE = ean13('200000999999');

const PO_TONE: Record<PurchaseOrder['status'], Tone> = { expected: 'info', receiving: 'warning', closed: 'success', closedIssues: 'danger' };

export default function Receiving() {
  const t = useT();
  const name = useProductName();
  const { state, nav, dispatch, lang, today, notify, go } = useWms();
  const pos = useMemo(
    () =>
      state.pos
        .filter((p) => p.wh === nav.wh)
        .sort((a, b) => Number(a.status === 'closed' || a.status === 'closedIssues') - Number(b.status === 'closed' || b.status === 'closedIssues') || (a.eta < b.eta ? -1 : 1)),
    [state.pos, nav.wh],
  );
  const [selected, setSelected] = useState<string | undefined>(nav.focus && nav.focus.startsWith('OC-') ? nav.focus : pos.find((p) => p.status === 'expected' || p.status === 'receiving')?.id ?? pos[0]?.id);
  useEffect(() => {
    if (nav.focus && nav.focus.startsWith('OC-')) setSelected(nav.focus);
  }, [nav.focus]);
  useEffect(() => {
    if (!pos.some((p) => p.id === selected)) setSelected(pos.find((p) => p.status === 'expected' || p.status === 'receiving')?.id ?? pos[0]?.id);
  }, [pos, selected]);
  const po = pos.find((p) => p.id === selected);
  const [code, setCode] = useState('');
  const [units, setUnits] = useState(1);
  const open = po && (po.status === 'expected' || po.status === 'receiving');
  const products = state.products;

  const scan = (value: string) => {
    if (!po || !value.trim()) return;
    const p = products.find((x) => x.barcode === value.trim() || x.sku === value.trim().toUpperCase());
    const inPo = p && po.lines.some((l) => l.sku === p.sku);
    dispatch({ type: 'po.scan', po: po.id, code: value, units, at: now() });
    if (!inPo) notify(t('receiving.scanUnknown', { code: value.trim() }), 'error');
    setCode('');
  };

  const tasks = state.putaway.filter((x) => x.wh === nav.wh).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'));
  const pending = tasks.filter((x) => x.status === 'pending');
  const contents = binContents(state, nav.wh);
  const empties = emptyBins(state, nav.wh);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Panel title={t('receiving.listTitle')} subtitle={t('receiving.listSubtitle')} className="xl:col-span-2">
          {pos.length === 0 ? (
            <Empty>{t('receiving.none')}</Empty>
          ) : (
            <ul className="space-y-2">
              {pos.map((p) => {
                const sup = SUPPLIER_BY_ID[p.supplier];
                const exp = p.lines.reduce((s, l) => s + l.expected, 0);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-pressed={p.id === selected}
                      onClick={() => setSelected(p.id)}
                      className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                        p.id === selected ? 'border-stone-600 bg-stone-50 dark:bg-stone-900/30' : 'border-secondary-200 hover:border-stone-400 dark:border-secondary-700'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold">{p.id}</span>
                        <Pill tone={PO_TONE[p.status]}>{t(`receiving.status.${p.status}`)}</Pill>
                      </div>
                      <div className="mt-1 font-medium text-secondary-900 dark:text-white">{sup.name}</div>
                      <div className="text-xs text-secondary-500">
                        {t('receiving.forClient', { client: CLIENT_BY_ID[p.client].name })} · {p.status === 'closed' || p.status === 'closedIssues' ? t('receiving.arrived') : t('receiving.eta')} {fmtDateTime(p.eta, today, lang)} · {t('common.unitsN', { n: exp })}
                      </div>
                      {p.crossDockOrder && <Pill tone="primary" className="mt-1">{t('receiving.crossDockTag', { order: p.crossDockOrder })}</Pill>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          className="xl:col-span-3"
          title={po ? `${po.id} · ${SUPPLIER_BY_ID[po.supplier].name}` : t('receiving.detail')}
          subtitle={po ? `NIT ${fmtNit(SUPPLIER_BY_ID[po.supplier].nit)} · ${SUPPLIER_BY_ID[po.supplier].city} · ${t('receiving.forClient', { client: CLIENT_BY_ID[po.client].name })}` : undefined}
        >
          {!po ? (
            <Empty>{t('receiving.pick')}</Empty>
          ) : (
            <div className="space-y-4">
              <ul className="space-y-2 sm:hidden">
                {po.lines.map((l) => {
                  const diff = l.received - l.expected;
                  return (
                    <li key={l.sku} className="rounded-xl border border-secondary-200 p-3 text-sm dark:border-secondary-700">
                      <div className="font-medium">{name(l.sku)}</div>
                      <div className="font-mono text-xs text-secondary-500">
                        {l.sku} · {t('common.lot')} {l.lot}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-secondary-500">{t('receiving.expected')}</div>
                          <div className="font-semibold tabular-nums">{fmtNum(l.expected, lang)}</div>
                        </div>
                        <div>
                          <div className="text-secondary-500">{t('receiving.received')}</div>
                          <div className="font-semibold tabular-nums">{fmtNum(l.received, lang)}</div>
                        </div>
                        <div>
                          <div className="text-secondary-500">{open ? t('receiving.pending') : t('receiving.diff')}</div>
                          <div className={`font-semibold tabular-nums ${!open && diff < 0 ? 'text-red-600' : ''}`}>{open ? (diff >= 0 ? (diff ? `+${diff}` : t('receiving.complete')) : fmtNum(-diff, lang)) : diff > 0 ? `+${diff}` : diff}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-secondary-500">{t('receiving.damaged')}</span>
                        <button
                          type="button"
                          aria-label={t('receiving.damageLess', { sku: l.sku })}
                          disabled={!open || l.damaged === 0}
                          onClick={() => dispatch({ type: 'po.damage', po: po.id, sku: l.sku, delta: -1 })}
                          className="rounded border border-secondary-300 p-1 disabled:opacity-40 dark:border-secondary-600"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center tabular-nums">{l.damaged}</span>
                        <button
                          type="button"
                          aria-label={t('receiving.damageMore', { sku: l.sku })}
                          disabled={!open || l.damaged >= l.received}
                          onClick={() => dispatch({ type: 'po.damage', po: po.id, sku: l.sku, delta: 1 })}
                          className="rounded border border-secondary-300 p-1 disabled:opacity-40 dark:border-secondary-600"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200 dark:border-secondary-700">
                      <th className={thCls}>{t('common.product')}</th>
                      <th className={thCls}>{t('common.lot')}</th>
                      <th className={`${thCls} text-right`}>{t('receiving.expected')}</th>
                      <th className={`${thCls} text-right`}>{t('receiving.received')}</th>
                      <th className={`${thCls} text-center`}>{t('receiving.damaged')}</th>
                      <th className={`${thCls} text-right`}>{open ? t('receiving.pending') : t('receiving.diff')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {po.lines.map((l) => {
                      const diff = l.received - l.expected;
                      return (
                        <tr key={l.sku} className="border-b border-secondary-100 dark:border-secondary-800">
                          <td className={tdCls}>
                            <div className="font-medium">{name(l.sku)}</div>
                            <div className="font-mono text-xs text-secondary-500">{l.sku} · {products.find((p) => p.sku === l.sku)?.barcode}</div>
                          </td>
                          <td className={`${tdCls} text-xs`}>
                            <div className="font-mono">{l.lot}</div>
                            {l.expiry && <div className="text-secondary-500">{t('common.expires')} {fmtDate(l.expiry, lang)}</div>}
                          </td>
                          <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(l.expected, lang)}</td>
                          <td className={`${tdCls} text-right font-semibold tabular-nums`}>{fmtNum(l.received, lang)}</td>
                          <td className={`${tdCls} text-center`}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={t('receiving.damageLess', { sku: l.sku })}
                                disabled={!open || l.damaged === 0}
                                onClick={() => dispatch({ type: 'po.damage', po: po.id, sku: l.sku, delta: -1 })}
                                className="rounded border border-secondary-300 p-0.5 disabled:opacity-40 dark:border-secondary-600"
                              >
                                <MinusIcon className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center tabular-nums">{l.damaged}</span>
                              <button
                                type="button"
                                aria-label={t('receiving.damageMore', { sku: l.sku })}
                                disabled={!open || l.damaged >= l.received}
                                onClick={() => dispatch({ type: 'po.damage', po: po.id, sku: l.sku, delta: 1 })}
                                className="rounded border border-secondary-300 p-0.5 disabled:opacity-40 dark:border-secondary-600"
                              >
                                <PlusIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className={`${tdCls} text-right`}>
                            {diff === 0 ? (
                              <Pill tone="success">{open ? t('receiving.complete') : '0'}</Pill>
                            ) : open ? (
                              <Pill tone={diff > 0 ? 'info' : 'default'}>{diff > 0 ? `+${diff}` : fmtNum(-diff, lang)}</Pill>
                            ) : (
                              <Pill tone={diff < 0 ? 'danger' : 'info'}>{diff > 0 ? `+${diff}` : diff}</Pill>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {open ? (
                <>
                  <div className="rounded-xl border border-secondary-200 p-3 dark:border-secondary-700">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <QrCodeIcon className="h-4 w-4" /> {t('receiving.scanTitle')}
                    </div>
                    <form
                      className="flex flex-col gap-2 sm:flex-row sm:items-end"
                      onSubmit={(e) => {
                        e.preventDefault();
                        scan(code);
                      }}
                    >
                      <Field label={t('receiving.code')} className="flex-1">
                        <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('receiving.codePh')} inputMode="numeric" autoComplete="off" />
                      </Field>
                      <Field label={t('receiving.unitsPerScan')} className="sm:w-40">
                        <select className={selectCls} value={units} onChange={(e) => setUnits(Number(e.target.value))}>
                          <option value={1}>{t('receiving.unit1')}</option>
                          <option value={6}>{t('receiving.unit6')}</option>
                          <option value={12}>{t('receiving.unit12')}</option>
                        </select>
                      </Field>
                      <Button type="submit" disabled={!code.trim()}>
                        {t('receiving.scanBtn')}
                      </Button>
                    </form>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-secondary-500">{t('receiving.quick')}</span>
                      {po.lines.map((l) => (
                        <button key={l.sku} type="button" onClick={() => scan(products.find((p) => p.sku === l.sku)!.barcode)} className="rounded-full border border-secondary-300 px-2 py-0.5 font-mono hover:border-stone-500 dark:border-secondary-600">
                          {l.sku}
                        </button>
                      ))}
                      <button type="button" onClick={() => scan(UNKNOWN_CODE)} className="rounded-full border border-red-300 px-2 py-0.5 text-red-700 hover:border-red-500 dark:border-red-800 dark:text-red-300">
                        {t('receiving.quickUnknown')}
                      </button>
                    </div>
                    <SimNote className="mt-3">{t('receiving.scannerNote')}</SimNote>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => dispatch({ type: 'po.unload', po: po.id, at: now() })}>
                      <TruckIcon className="mr-1.5 h-4 w-4" />
                      {t('receiving.unload')}
                    </Button>
                    <Button
                      onClick={() => {
                        dispatch({ type: 'po.close', po: po.id, at: now() });
                        const missing = po.lines.some((l) => l.received !== l.expected) || po.lines.some((l) => l.damaged > 0);
                        notify(missing ? t('receiving.closedIssues', { po: po.id }) : t('receiving.closedOk', { po: po.id }), missing ? 'warn' : 'ok');
                      }}
                      disabled={po.lines.every((l) => l.received === 0)}
                    >
                      <CheckCircleIcon className="mr-1.5 h-4 w-4" />
                      {t('receiving.close')}
                    </Button>
                  </div>
                  <SimNote>{t('receiving.unloadNote')}</SimNote>
                </>
              ) : (
                <div className="rounded-xl bg-secondary-50 p-3 text-sm dark:bg-secondary-800/60">
                  <div className="font-semibold">
                    {t('receiving.closedAt', { at: po.closedAt ? fmtDateTime(po.closedAt, today, lang) : '—' })}
                  </div>
                  {po.issues.length === 0 ? (
                    <div className="text-secondary-600 dark:text-secondary-300">{t('receiving.noIssues')}</div>
                  ) : (
                    <ul className="mt-1 list-inside list-disc text-secondary-700 dark:text-secondary-300">
                      {po.issues.map((i, idx) => (
                        <li key={idx}>{t(`receiving.issue.${i.type}`, { qty: i.qty, sku: i.sku ?? '' })}</li>
                      ))}
                    </ul>
                  )}
                  {po.crossDockOrder && (
                    <button type="button" className="mt-2 text-xs font-semibold text-primary-600 hover:underline" onClick={() => go('crossdock')}>
                      {t('receiving.toCrossDock')}
                    </button>
                  )}
                </div>
              )}

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('receiving.scanLog')}</div>
                {po.scans.length === 0 ? (
                  <p className="text-sm text-secondary-500">{t('receiving.scanEmpty')}</p>
                ) : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto">
                    {po.scans.map((sc, i) => (
                      <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary-50 px-3 py-1.5 text-xs dark:bg-secondary-800/60">
                        <span className="font-mono">{sc.code}</span>
                        <span>{sc.sku ? `${sc.sku} × ${sc.units}` : t('receiving.notInPo')}</span>
                        <Pill tone={sc.result === 'ok' ? 'success' : sc.result === 'over' ? 'info' : 'danger'}>{t(`receiving.scanResult.${sc.result}`)}</Pill>
                        <span className="text-secondary-500">{fmtDateTime(sc.at, today, lang)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel title={t('putaway.title')} subtitle={t('putaway.subtitle')}>
        {tasks.length === 0 ? (
          <Empty>{t('putaway.none')}</Empty>
        ) : (
          <div className="space-y-2">
            {pending.length === 0 && <p className="text-sm text-emerald-700 dark:text-emerald-300">{t('putaway.allDone')}</p>}
            {tasks.slice(0, 12).map((task) => {
              const sameSkuBins = Object.entries(contents)
                .filter(([b, lots]) => !b.startsWith('Q') && lots.every((l) => l.sku === task.sku))
                .map(([b]) => b);
              const choices = [...new Set([task.suggested, ...sameSkuBins, ...empties])];
              return (
                <div key={task.id} className="flex flex-col gap-3 rounded-xl border border-secondary-200 p-3 text-sm md:flex-row md:items-center dark:border-secondary-700">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {name(task.sku)} <span className="font-mono text-xs text-secondary-500">{task.sku}</span>
                    </div>
                    <div className="text-xs text-secondary-500">
                      {t('putaway.meta', { qty: task.qty, lot: task.lot, ref: task.ref })}
                      {task.expiry ? ` · ${t('common.expires')} ${fmtDate(task.expiry, lang)}` : ''}
                    </div>
                    <div className="mt-1 text-xs text-secondary-700 dark:text-secondary-300">
                      <span className="font-semibold">{t('putaway.rule')}:</span> {t(`putaway.rules.${task.rule}`)}
                    </div>
                  </div>
                  {task.status === 'done' ? (
                    <Pill tone="success" className="gap-1">
                      <CheckCircleIcon className="h-4 w-4" /> {t('putaway.doneIn', { bin: task.bin ?? '' })}
                    </Pill>
                  ) : (
                    <div className="flex flex-wrap items-end gap-2">
                      <Field label={t('putaway.suggested')}>
                        <select
                          className={`${selectCls} min-w-[9rem] font-mono`}
                          value={task.suggested}
                          disabled={task.quarantine}
                          onChange={(e) => dispatch({ type: 'putaway.change', task: task.id, bin: e.target.value })}
                          aria-label={t('putaway.change')}
                        >
                          {choices.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Button
                        size="sm"
                        onClick={() => {
                          dispatch({ type: 'putaway.confirm', task: task.id, at: now() });
                          notify(t('putaway.confirmedToast', { qty: task.qty, sku: task.sku, bin: task.suggested }));
                        }}
                      >
                        {t('putaway.confirm')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <SimNote className="mt-3">{t('putaway.note')}</SimNote>
      </Panel>
    </div>
  );
}
