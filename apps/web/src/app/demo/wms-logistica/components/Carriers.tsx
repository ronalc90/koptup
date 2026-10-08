'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import { CARRIERS, CITIES, WAREHOUSE_BY_ID, type ShipZone } from '../lib/catalog';
import { bestQuotes, quotes, shipZone } from '../lib/engine';
import { fmtCOP, fmtNum } from '../lib/format';
import { useWms } from '../lib/store';
import { Field, Panel, Pill, SimNote, inputCls, selectCls, tdCls, thCls, useT } from './ui';

const ZONES: ShipZone[] = ['local', 'regional', 'national', 'special'];

export default function Carriers() {
  const t = useT();
  const { state, nav, lang, dispatch, notify } = useWms();
  const preferred = state.preferred[nav.wh];
  const [city, setCity] = useState('clo');
  const [kg, setKg] = useState(2);
  const list = quotes(nav.wh, city, kg);
  const best = bestQuotes(list);

  return (
    <div className="space-y-5">
      <Panel title={t('carriers.title')} subtitle={t('carriers.subtitle', { wh: WAREHOUSE_BY_ID[nav.wh].name })}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {CARRIERS.map((c) => {
            const isPref = preferred === c.id;
            return (
              <div key={c.id} className={`rounded-xl border p-4 text-sm ${isPref ? 'border-stone-600 ring-1 ring-stone-600' : 'border-secondary-200 dark:border-secondary-700'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-secondary-900 dark:text-white">{t(`carrierNames.${c.id}`)}</div>
                    <div className="text-xs text-secondary-500">{t(`carriers.kind.${c.id === 'own' ? 'own' : c.id === 'mac' ? 'cargo' : 'parcel'}`)}</div>
                  </div>
                  {isPref && (
                    <Pill tone="primary" className="gap-1">
                      <StarIcon className="h-3 w-3" /> {t('carriers.preferred')}
                    </Pill>
                  )}
                </div>
                <table className="mt-3 w-full text-xs">
                  <tbody>
                    {ZONES.map((z) => {
                      const v = c.zones[z];
                      return (
                        <tr key={z} className="border-t border-secondary-100 dark:border-secondary-800">
                          <td className="py-1 text-secondary-500">{t(`zones.${z}`)}</td>
                          <td className="py-1 text-right tabular-nums">{v ? fmtCOP(v[0], lang) : t('carriers.noCoverage')}</td>
                          <td className="py-1 text-right">{v ? (v[1] === 0 ? t('carriers.sameDay') : t('carriers.days', { n: v[1] })) : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-secondary-500">
                  {c.perKg ? t('carriers.perKg', { price: fmtCOP(c.perKg, lang), included: c.includedKg }) : t('carriers.flat')} · {t('carriers.maxKg', { n: fmtNum(c.maxKg, lang) })}
                </div>
                <Button
                  size="sm"
                  variant={isPref ? 'ghost' : 'outline'}
                  fullWidth
                  className="mt-3"
                  disabled={isPref}
                  onClick={() => {
                    dispatch({ type: 'carrier.prefer', wh: nav.wh, carrier: c.id });
                    notify(t('carriers.preferredSet', { name: t(`carrierNames.${c.id}`), wh: WAREHOUSE_BY_ID[nav.wh].name }));
                  }}
                >
                  {isPref ? t('carriers.isPreferred') : t('carriers.makePreferred')}
                </Button>
              </div>
            );
          })}
        </div>
        <SimNote className="mt-4">{t('carriers.note')}</SimNote>
      </Panel>

      <Panel title={t('carriers.quoteTitle')} subtitle={t('carriers.quoteSubtitle', { wh: WAREHOUSE_BY_ID[nav.wh].city })}>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label={t('carriers.destination')}>
            <select className={selectCls} value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.dept})
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('carriers.weight')}>
            <input type="number" min={0.1} step={0.1} className={inputCls} value={kg} onChange={(e) => setKg(Math.max(0.1, Number(e.target.value) || 0.1))} />
          </Field>
          <div className="flex items-end">
            <Pill tone="info">{t('carriers.zoneIs', { zone: t(`zones.${shipZone(nav.wh, city)}`) })}</Pill>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-secondary-200 dark:border-secondary-700">
                <th className={thCls}>{t('tracking.carrier')}</th>
                <th className={`${thCls} text-right`}>{t('carriers.rate')}</th>
                <th className={`${thCls} text-right`}>{t('carriers.time')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((q) => (
                <tr key={q.carrier.id} className={`border-b border-secondary-100 dark:border-secondary-800 ${q.ok ? '' : 'text-secondary-400'}`}>
                  <td className={tdCls}>
                    {t(`carrierNames.${q.carrier.id}`)}{' '}
                    {best.cheapest === q.carrier.id && <Pill tone="success">{t('packing.cheapest')}</Pill>}{' '}
                    {best.fastest === q.carrier.id && <Pill tone="info">{t('packing.fastest')}</Pill>}
                  </td>
                  <td className={`${tdCls} text-right tabular-nums`}>{q.ok ? fmtCOP(q.price, lang) : '—'}</td>
                  <td className={`${tdCls} text-right text-xs`}>{q.ok ? (q.days === 0 ? t('carriers.sameDay') : t('carriers.days', { n: q.days })) : t(`packing.reasons.${q.reason}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SimNote className="mt-3">{t('carriers.quoteNote')}</SimNote>
      </Panel>
    </div>
  );
}
