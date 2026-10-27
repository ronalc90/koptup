'use client';

import { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { AISLES, BIN_BY_ID, CLIENT_BY_ID, MODULES, QUARANTINE_BINS, STORAGE_BINS, STORAGE_ZONES } from '../lib/catalog';
import { abcClasses, binContents } from '../lib/engine';
import { diffDays } from '../lib/dates';
import { fmtDate, fmtNum } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { Lot } from '../lib/types';
import { Kpi, Panel, Pill, SimNote, inputCls, useProductName, useT } from './ui';

const CLASS_STYLE = {
  A: 'bg-emerald-500 border-emerald-600 text-white',
  B: 'bg-sky-500 border-sky-600 text-white',
  C: 'bg-slate-400 border-slate-500 text-white dark:bg-slate-500',
  Q: 'bg-amber-400 border-amber-500 text-amber-950',
  empty: 'bg-secondary-100 border-secondary-300 text-secondary-500 dark:bg-secondary-800 dark:border-secondary-600',
} as const;

export default function WarehouseMap() {
  const t = useT();
  const name = useProductName();
  const { state, nav, lang, today, dispatch, notify, go } = useWms();
  const contents = useMemo(() => binContents(state, nav.wh), [state, nav.wh]);
  const cls = useMemo(() => abcClasses(state.products), [state.products]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>('A-01-01');
  useEffect(() => {
    if (nav.focus && BIN_BY_ID[nav.focus]) setSelected(nav.focus);
  }, [nav.focus]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return new Set<string>();
    return new Set(
      Object.entries(contents)
        .filter(([, lots]) => lots.some((l) => l.sku.toLowerCase().includes(q) || l.lot.toLowerCase().includes(q) || name(l.sku).toLowerCase().includes(q)))
        .map(([bin]) => bin),
    );
  }, [q, contents, name]);

  const styleFor = (bin: string) => {
    const lots = contents[bin];
    if (!lots?.length) return CLASS_STYLE.empty;
    if (BIN_BY_ID[bin]?.zone === 'Q' || lots.some((l) => l.status === 'quarantine')) return CLASS_STYLE.Q;
    return CLASS_STYLE[cls[lots[0].sku] ?? 'C'];
  };

  const used = STORAGE_BINS.filter((b) => contents[b.id]?.length).length;
  const qLots = QUARANTINE_BINS.reduce((s, b) => s + (contents[b.id]?.length ?? 0), 0);
  const sel = contents[selected] ?? [];
  const binInfo = BIN_BY_ID[selected];

  const renderCell = (bin: string) => {
    const lots = contents[bin];
    const hit = matches.has(bin);
    return (
      <button
        key={bin}
        type="button"
        onClick={() => setSelected(bin)}
        aria-pressed={selected === bin}
        aria-label={`${bin}: ${lots?.length ? lots.map((l) => `${l.sku} ${l.qty}`).join(', ') : t('map.emptyBin')}`}
        title={bin}
        className={`aspect-square w-full rounded border text-[9px] font-semibold leading-none transition sm:text-[10px] ${styleFor(bin)} ${
          selected === bin ? 'ring-2 ring-stone-900 ring-offset-1 dark:ring-white' : ''
        } ${q && !hit ? 'opacity-25' : ''} ${hit ? 'ring-2 ring-fuchsia-500' : ''}`}
      >
        {bin.slice(-2)}
      </button>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Panel
        className="xl:col-span-2"
        title={t('map.title')}
        subtitle={t('map.subtitle')}
        actions={
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">{t('map.search')}</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
            <input className={`${inputCls} pl-8`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('map.searchPh')} />
          </label>
        }
      >
        <div className="mb-3 flex flex-wrap gap-3 text-xs">
          {(['A', 'B', 'C', 'Q', 'empty'] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-3 w-3 rounded border ${CLASS_STYLE[k]}`} />
              {t(`map.legend.${k}`)}
            </span>
          ))}
        </div>
        {q && <p className="mb-3 text-sm text-secondary-600 dark:text-secondary-300">{t('map.matches', { n: matches.size })}</p>}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {STORAGE_ZONES.map((zone) => (
            <div key={zone}>
              <div className="mb-2 flex items-center gap-2">
                <Pill>{t('map.zone', { zone })}</Pill>
                <span className="text-xs text-secondary-500">{t(`map.zones.${zone}`)}</span>
              </div>
              <div className="space-y-1">
                {Array.from({ length: AISLES }, (_, i) => i + 1).map((aisle) => (
                  <div key={aisle} className="flex items-center gap-1.5">
                    <span className="w-8 shrink-0 text-[10px] text-secondary-500">P{String(aisle).padStart(2, '0')}</span>
                    <div className="grid flex-1 grid-cols-8 gap-1">
                      {Array.from({ length: MODULES }, (_, m) => `${zone}-${String(aisle).padStart(2, '0')}-${String(m + 1).padStart(2, '0')}`).map((bin) => (
                        renderCell(bin)
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Pill tone="warning">{t('map.zone', { zone: 'Q' })}</Pill>
              <span className="text-xs text-secondary-500">{t('map.zones.Q')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-8 shrink-0 text-[10px] text-secondary-500">P01</span>
              <div className="grid flex-1 grid-cols-8 gap-1">
                {QUARANTINE_BINS.map((b) => (
                  renderCell(b.id)
                ))}
              </div>
            </div>
            <p className="mt-3 text-xs text-secondary-500">{t('map.dockHint')}</p>
          </div>
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel title={selected} subtitle={binInfo ? t('map.binParts', { zone: binInfo.zone, aisle: binInfo.aisle, module: binInfo.module }) : undefined}>
          {sel.length === 0 ? (
            <p className="text-sm text-secondary-500">{t('map.emptyBin')}</p>
          ) : (
            <ul className="space-y-3">
              {sel.map((l: Lot) => {
                const days = l.expiry ? diffDays(today, l.expiry) : null;
                const product = state.products.find((p) => p.sku === l.sku);
                return (
                  <li key={l.id} className="rounded-xl border border-secondary-200 p-3 text-sm dark:border-secondary-700">
                    <div className="font-medium">{name(l.sku)}</div>
                    <div className="font-mono text-xs text-secondary-500">
                      {l.sku} · {t('common.lot')} {l.lot}
                    </div>
                    <div className="mt-1 text-xs text-secondary-600 dark:text-secondary-300">{product ? CLIENT_BY_ID[product.client].name : ''}</div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                      <dt className="text-secondary-500">{t('common.qty')}</dt>
                      <dd className="text-right font-semibold tabular-nums">{fmtNum(l.qty, lang)}</dd>
                      <dt className="text-secondary-500">{t('map.reserved')}</dt>
                      <dd className="text-right tabular-nums">{fmtNum(l.reserved, lang)}</dd>
                      <dt className="text-secondary-500">{t('map.class')}</dt>
                      <dd className="text-right">{cls[l.sku] ?? 'C'}</dd>
                      <dt className="text-secondary-500">{t('common.expires')}</dt>
                      <dd className="text-right">
                        {l.expiry ? (
                          <span className={days !== null && days < 0 ? 'text-red-600' : days !== null && days <= 30 ? 'text-amber-600' : ''}>
                            {fmtDate(l.expiry, lang)}
                            {days !== null && days <= 30 ? ` (${days < 0 ? t('stock.expired') : t('stock.inDays', { n: days })})` : ''}
                          </span>
                        ) : (
                          t('stock.noExpiry')
                        )}
                      </dd>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => go('stock', { focus: l.sku })}>
                        {t('map.kardex')}
                      </Button>
                      {l.status === 'available' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={l.reserved > 0}
                          title={l.reserved > 0 ? t('map.reservedBlock') : undefined}
                          onClick={() => {
                            dispatch({ type: 'lot.quarantine', lot: l.id, at: now() });
                            notify(t('map.toQuarantine', { lot: l.lot }), 'warn');
                          }}
                        >
                          {t('map.quarantine')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!!l.expiry && l.expiry < today}
                          title={l.expiry && l.expiry < today ? t('map.expiredBlock') : undefined}
                          onClick={() => {
                            dispatch({ type: 'lot.release', lot: l.id, at: now() });
                            notify(t('map.released', { lot: l.lot }));
                          }}
                        >
                          {t('map.release')}
                        </Button>
                      )}
                    </div>
                    {l.status === 'quarantine' && l.expiry && l.expiry < today && <p className="mt-2 text-xs text-red-600">{t('map.expiredBlock')}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
        <Panel title={t('map.kpis')}>
          <div className="grid grid-cols-2 gap-3">
            <Kpi label={t('map.total')} value={fmtNum(STORAGE_BINS.length, lang)} />
            <Kpi label={t('map.used')} value={fmtNum(used, lang)} tone="text-emerald-600" />
            <Kpi label={t('map.free')} value={fmtNum(STORAGE_BINS.length - used, lang)} tone="text-sky-600" />
            <Kpi label={t('map.qLots')} value={fmtNum(qLots, lang)} tone="text-amber-600" />
          </div>
          <SimNote className="mt-3">{t('map.note')}</SimNote>
        </Panel>
      </div>
    </div>
  );
}
