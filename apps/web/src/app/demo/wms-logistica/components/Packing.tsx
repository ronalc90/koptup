'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, PrinterIcon, ArrowDownTrayIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CITY_BY_ID, CLIENT_BY_ID } from '../lib/catalog';
import { BOX_TARE, bestQuotes, boxFor, orderNetKg, orderUnits, pickedQty, productMap, quotes, shipZone } from '../lib/engine';
import { fmtCOP, fmtNum } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { CarrierId, Order, Shipment } from '../lib/types';
import { Empty, Field, Modal, Panel, Pill, ProgressBar, SimNote, inputCls, selectCls, tdCls, thCls, useProductName, useT } from './ui';
import { useCutoffLabel } from './Orders';
import { labelLines, labelPdf, printLabel, type LabelTexts } from './label';

export function useLabelTexts(): LabelTexts {
  const t = useT();
  return {
    sample: t('label.sample'),
    from: t('label.from'),
    to: t('label.to'),
    order: t('label.order'),
    guide: t('label.guide'),
    weight: t('label.weight'),
    box: t('label.box'),
    service: t('label.service'),
    units: t('common.units'),
  };
}

export default function Packing() {
  const t = useT();
  const cutoffLabel = useCutoffLabel();
  const { state, nav, lang, today, go } = useWms();
  const pm = useMemo(() => productMap(state.products), [state.products]);
  const ready = state.orders.filter((o) => o.wh === nav.wh && o.status === 'picked').sort((a, b) => (a.cutoff < b.cutoff ? -1 : 1));
  const [selected, setSelected] = useState<string | undefined>(nav.focus?.startsWith('PED-') ? nav.focus : ready[0]?.id);
  useEffect(() => {
    if (nav.focus?.startsWith('PED-')) setSelected(nav.focus);
  }, [nav.focus]);
  useEffect(() => {
    if (!ready.some((o) => o.id === selected)) setSelected(ready[0]?.id);
  }, [ready, selected]);
  const order = ready.find((o) => o.id === selected);
  const [labelFor, setLabelFor] = useState<Shipment | null>(null);
  const shippedToday = state.shipments
    .filter((s) => s.wh === nav.wh && s.events[0]?.at.slice(0, 10) === today)
    .sort((a, b) => (a.events[0].at < b.events[0].at ? 1 : -1))
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <Panel title={t('packing.queue')} subtitle={t('packing.queueSubtitle')} className="xl:col-span-2">
          {ready.length === 0 ? (
            <Empty>
              <p>{t('packing.none')}</p>
              <Button size="sm" className="mt-3" onClick={() => go('picking')}>
                {t('packing.goPicking')}
              </Button>
            </Empty>
          ) : (
            <ul className="space-y-2">
              {ready.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    aria-pressed={o.id === selected}
                    onClick={() => setSelected(o.id)}
                    className={`w-full rounded-xl border p-3 text-left text-sm ${o.id === selected ? 'border-stone-600 bg-stone-50 dark:bg-stone-900/30' : 'border-secondary-200 hover:border-stone-400 dark:border-secondary-700'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold">{o.id}</span>
                      <span className="text-xs text-secondary-500">{cutoffLabel(o)}</span>
                    </div>
                    <div className="mt-0.5">
                      {o.customer} · {CITY_BY_ID[o.city]?.name}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {CLIENT_BY_ID[o.client].name} · {t('common.unitsN', { n: orderUnits(o, true) })}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="xl:col-span-3">
          {order ? (
            <PackStation key={order.id} order={order} onShipped={(sh) => setLabelFor(sh)} pm={pm} />
          ) : (
            <Panel title={t('packing.station')}>
              <Empty>{t('packing.pick')}</Empty>
            </Panel>
          )}
        </div>
      </div>

      <Panel title={t('packing.shippedToday')}>
        {shippedToday.length === 0 ? (
          <p className="text-sm text-secondary-500">{t('packing.noneShipped')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className={thCls}>{t('tracking.guide')}</th>
                  <th className={thCls}>{t('orders.order')}</th>
                  <th className={thCls}>{t('tracking.carrier')}</th>
                  <th className={thCls}>{t('orders.destination')}</th>
                  <th className={`${thCls} text-right`}>{t('packing.cost')}</th>
                  <th className={thCls} />
                </tr>
              </thead>
              <tbody>
                {shippedToday.map((s) => (
                  <tr key={s.id} className="border-b border-secondary-100 dark:border-secondary-800">
                    <td className={`${tdCls} font-mono text-xs`}>{s.id}</td>
                    <td className={`${tdCls} font-mono text-xs`}>{s.order}</td>
                    <td className={tdCls}>{t(`carrierNames.${s.carrier}`)}</td>
                    <td className={tdCls}>{CITY_BY_ID[s.city]?.name}</td>
                    <td className={`${tdCls} text-right tabular-nums`}>{fmtCOP(s.cost, lang)}</td>
                    <td className={`${tdCls} text-right`}>
                      <button type="button" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => setLabelFor(s)}>
                        {t('packing.viewLabel')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {labelFor && <LabelModal shipment={labelFor} onClose={() => setLabelFor(null)} />}
    </div>
  );
}

function PackStation({ order, onShipped, pm }: { order: Order; onShipped: (s: Shipment) => void; pm: ReturnType<typeof productMap> }) {
  const t = useT();
  const name = useProductName();
  const { state, lang, dispatch, notify } = useWms();
  const [code, setCode] = useState('');
  const net = orderNetKg(order, pm);
  const [box, setBox] = useState<Shipment['box']>(boxFor(net));
  const [weight, setWeight] = useState(Math.round((net + BOX_TARE[boxFor(net)]) * 100) / 100);
  const [carrier, setCarrier] = useState<CarrierId | ''>('');
  const verified = order.verified ?? {};
  const lines = order.lines.map((l, i) => ({ sku: l.sku, ordered: l.qty, picked: pickedQty(order, i), verified: verified[l.sku] ?? 0 }));
  const allVerified = lines.every((l) => l.verified >= l.picked);
  const totalPicked = lines.reduce((s, l) => s + l.picked, 0);
  const totalVerified = lines.reduce((s, l) => s + Math.min(l.verified, l.picked), 0);
  const short = lines.reduce((s, l) => s + Math.max(0, l.ordered - l.picked), 0);
  const list = quotes(order.wh, order.city, weight);
  const best = bestQuotes(list);
  const preferred = state.preferred[order.wh];
  useEffect(() => {
    const ok = list.filter((q) => q.ok);
    if (!carrier || !ok.some((q) => q.carrier.id === carrier)) setCarrier(ok.find((q) => q.carrier.id === preferred)?.carrier.id ?? best.cheapest ?? '');
  }, [list, carrier, preferred, best.cheapest]);

  const verify = (value: string) => {
    const p = state.products.find((x) => x.barcode === value.trim() || x.sku === value.trim().toUpperCase());
    const line = p ? lines.find((l) => l.sku === p.sku) : undefined;
    if (!line) notify(t('packing.notInOrder'), 'error');
    else if (line.verified >= line.picked) notify(t('packing.alreadyVerified', { sku: line.sku }), 'warn');
    else dispatch({ type: 'pack.verify', order: order.id, sku: line.sku, units: 1 });
    setCode('');
  };

  return (
    <Panel title={t('packing.stationFor', { id: order.id })} subtitle={`${order.customer} · ${order.address} · ${CITY_BY_ID[order.city]?.name}`}>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold">{t('packing.verify')}</span>
            <span className="text-xs text-secondary-500">
              {totalVerified}/{totalPicked}
            </span>
          </div>
          <ProgressBar value={totalPicked ? (totalVerified / totalPicked) * 100 : 0} tone={allVerified ? 'bg-emerald-600' : 'bg-stone-600'} />
          <ul className="mt-3 space-y-1 text-sm">
            {lines.map((l) => (
              <li key={l.sku} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary-50 px-3 py-1.5 dark:bg-secondary-800/60">
                <span className="min-w-0">
                  {name(l.sku)} <span className="font-mono text-xs text-secondary-500">{pm[l.sku]?.barcode}</span>
                </span>
                <span className="flex items-center gap-2 text-xs">
                  {l.verified >= l.picked ? <CheckCircleIcon className="h-4 w-4 text-emerald-600" /> : null}
                  {Math.min(l.verified, l.picked)}/{l.picked}
                  {l.picked < l.ordered && <Pill tone="danger">{t('packing.shortN', { n: l.ordered - l.picked })}</Pill>}
                  {l.verified < l.picked && (
                    <button type="button" className="font-semibold text-primary-600 hover:underline dark:text-primary-400" onClick={() => verify(pm[l.sku]?.barcode ?? l.sku)}>
                      {t('packing.simulateOne')}
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {!allVerified && (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) verify(code);
              }}
            >
              <label className="flex-1">
                <span className="sr-only">{t('packing.scan')}</span>
                <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('packing.scanPh')} inputMode="numeric" autoComplete="off" />
              </label>
              <Button type="submit" variant="outline" disabled={!code.trim()}>
                <QrCodeIcon className="mr-1.5 h-4 w-4" />
                {t('packing.scanBtn')}
              </Button>
              <Button type="button" variant="ghost" onClick={() => dispatch({ type: 'pack.verifyAll', order: order.id })}>
                {t('packing.verifyAll')}
              </Button>
            </form>
          )}
          {short > 0 && <p className="mt-2 text-xs text-red-600">{t('packing.shortNote', { n: short })}</p>}
        </div>

        <div className={`space-y-3 ${allVerified ? '' : 'pointer-events-none opacity-50'}`} aria-disabled={!allVerified}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t('packing.net')}>
              <input className={inputCls} value={`${fmtNum(net, lang, 2)} kg`} readOnly />
            </Field>
            <Field label={t('packing.box')}>
              <select
                className={selectCls}
                value={box}
                disabled={!allVerified}
                onChange={(e) => {
                  const b = e.target.value as Shipment['box'];
                  setBox(b);
                  setWeight(Math.round((net + BOX_TARE[b]) * 100) / 100);
                }}
              >
                {(['S', 'M', 'L', 'P'] as const).map((b) => (
                  <option key={b} value={b}>
                    {t(`packing.boxes.${b}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('packing.weight')}>
              <input type="number" step="0.01" min={0.05} className={inputCls} value={weight} disabled={!allVerified} onChange={(e) => setWeight(Math.max(0.05, Number(e.target.value) || 0))} />
            </Field>
          </div>
          <div>
            <div className="mb-1 text-sm font-semibold">
              {t('packing.quotes', { city: CITY_BY_ID[order.city]?.name ?? '', zone: t(`zones.${shipZone(order.wh, order.city)}`) })}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm" role="radiogroup" aria-label={t('packing.carrier')}>
                <tbody>
                  {list.map((q) => (
                    <tr key={q.carrier.id} className={`border-b border-secondary-100 dark:border-secondary-800 ${q.ok ? '' : 'text-secondary-400'}`}>
                      <td className={tdCls}>
                        <label className="inline-flex items-center gap-2">
                          <input type="radio" name={`carrier-${order.id}`} disabled={!q.ok || !allVerified} checked={carrier === q.carrier.id} onChange={() => setCarrier(q.carrier.id)} />
                          <span className="font-medium">{t(`carrierNames.${q.carrier.id}`)}</span>
                        </label>
                        <div className="mt-0.5 flex flex-wrap gap-1">
                          {best.cheapest === q.carrier.id && <Pill tone="success">{t('packing.cheapest')}</Pill>}
                          {best.fastest === q.carrier.id && <Pill tone="info">{t('packing.fastest')}</Pill>}
                          {preferred === q.carrier.id && <Pill tone="primary">{t('carriers.preferred')}</Pill>}
                        </div>
                      </td>
                      <td className={`${tdCls} text-right tabular-nums`}>{q.ok ? fmtCOP(q.price, lang) : '—'}</td>
                      <td className={`${tdCls} text-right text-xs`}>{q.ok ? (q.days === 0 ? t('carriers.sameDay') : t('carriers.days', { n: q.days })) : t(`packing.reasons.${q.reason}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Button
            disabled={!allVerified || !carrier}
            onClick={() => {
              if (!carrier) return;
              const at = now();
              dispatch({ type: 'pack.ship', order: order.id, carrier, weightKg: weight, box, at });
              const q = list.find((x) => x.carrier.id === carrier)!;
              notify(t('packing.shipped', { order: order.id, carrier: t(`carrierNames.${carrier}`) }));
              // Muestra la etiqueta con los datos que se acaban de generar.
              onShipped({
                id: '__pending__',
                order: order.id,
                wh: order.wh,
                carrier,
                city: order.city,
                cost: q.price,
                weightKg: weight,
                box,
                etaDays: q.days,
                status: 'created',
                events: [{ status: 'created', at }],
              });
            }}
          >
            {t('packing.ship')}
          </Button>
          <SimNote>{t('packing.note')}</SimNote>
        </div>
      </div>
    </Panel>
  );
}

export function LabelModal({ shipment, onClose }: { shipment: Shipment; onClose: () => void }) {
  const t = useT();
  const baseTx = useLabelTexts();
  const { state, notify, lang } = useWms();
  // Si la guía se acaba de generar, se toma la versión guardada (con su número).
  const sh = shipment.id === '__pending__' ? state.shipments.find((s) => s.order === shipment.order) ?? shipment : shipment;
  const order = state.orders.find((o) => o.id === sh.order);
  const tx = { ...baseTx, carrierName: t(`carrierNames.${sh.carrier}`) };
  if (!order) return null;
  const units = orderUnits(order, true);
  return (
    <Modal
      title={t('label.title', { guide: sh.id })}
      onClose={onClose}
      footer={
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!printLabel(order, sh, tx, units)) notify(t('label.printError'), 'error');
            }}
          >
            <PrinterIcon className="mr-1.5 h-4 w-4" />
            {t('label.print')}
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              await labelPdf(order, sh, tx, units);
              notify(t('label.downloaded'));
            }}
          >
            <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
            {t('label.pdf')}
          </Button>
        </>
      }
    >
      <div className="mx-auto max-w-xs overflow-hidden rounded-lg border-2 border-secondary-900 bg-white text-secondary-900">
        <div className="flex justify-between bg-stone-700 px-3 py-2 text-sm font-bold text-white">
          <span>{t(`carrierNames.${sh.carrier}`)}</span>
          <span className="text-[10px] font-normal">{tx.sample}</span>
        </div>
        <div className="space-y-2 p-3 text-xs">
          <div>
            <div className="text-[10px] uppercase text-secondary-500">{tx.from}</div>
            {labelLines(order, sh).from.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <div>
            <div className="text-[10px] uppercase text-secondary-500">{tx.to}</div>
            <div className="text-sm font-bold">{order.customer}</div>
            <div>{order.address}</div>
            <div className="font-semibold">{CITY_BY_ID[order.city]?.name}</div>
          </div>
          <div className="border-t border-secondary-300 pt-2">
            {tx.order}: {order.id} · {fmtNum(sh.weightKg, lang, 2)} kg · {tx.box} {sh.box} · {units} {tx.units}
          </div>
          <div className="flex h-12 items-end overflow-hidden" aria-hidden>
            {sh.id.split('').flatMap((ch, i) => {
              const c = ch.charCodeAt(0);
              return [1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3), 1].map((w, k) => (
                <span key={`${i}-${k}`} style={{ width: w * 2, height: '100%', background: k % 2 === 0 ? '#000' : 'transparent', display: 'inline-block' }} />
              ));
            })}
          </div>
          <div className="text-center font-mono text-sm font-bold">{sh.id}</div>
        </div>
      </div>
      <SimNote className="mt-3">{t('label.note')}</SimNote>
    </Modal>
  );
}
