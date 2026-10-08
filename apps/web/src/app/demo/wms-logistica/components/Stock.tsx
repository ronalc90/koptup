'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CLIENTS, CLIENT_BY_ID, WAREHOUSES, WAREHOUSE_BY_ID } from '../lib/catalog';
import { abcClasses, availableQty, fefoSort, importProducts, lotsIn, toCsv, type ImportError } from '../lib/engine';
import { diffDays } from '../lib/dates';
import { fmtDate, fmtDateTime, fmtNum } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { ClientId, Lot, Product, WarehouseId } from '../lib/types';
import { Empty, Field, Modal, Panel, Pill, SimNote, download, inputCls, baseInputCls, selectCls, tdCls, thCls, useProductName, useT } from './ui';

type SortKey = 'sku' | 'available' | 'expiry' | 'bins';

const TEMPLATE = 'sku;nombre;cliente;codigo_barras;costo_unitario;peso_kg;vence\nLIR-SER30;Sérum facial 30 ml;Lirio;;27900;0,08;si\nCTH-MAN45;Mantel antimanchas 1,45 m;Casa Tejo;;45900;0,7;no\n';

export default function Stock() {
  const t = useT();
  const name = useProductName();
  const { state, nav, lang, today, dispatch, notify } = useWms();
  const [query, setQuery] = useState('');
  const [client, setClient] = useState<ClientId | ''>('');
  const [expiringOnly, setExpiringOnly] = useState(nav.focus === 'expiring');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'sku', dir: 1 });
  const [open, setOpen] = useState<string | null>(nav.focus && nav.focus !== 'expiring' ? nav.focus : null);
  const [transfer, setTransfer] = useState<Lot | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (nav.focus === 'expiring') setExpiringOnly(true);
    else if (nav.focus) {
      setOpen(nav.focus);
      setExpiringOnly(false);
    }
  }, [nav.focus]);

  const cls = useMemo(() => abcClasses(state.products), [state.products]);
  const lots = lotsIn(state, nav.wh);
  const pendingPutaway = state.putaway.filter((p) => p.wh === nav.wh && p.status === 'pending');

  const rows = useMemo(() => {
    const whClients = WAREHOUSE_BY_ID[nav.wh].clients;
    return state.products
      .filter((p) => whClients.includes(p.client) || lots.some((l) => l.sku === p.sku) || p.imported)
      .map((p) => {
        const mine = lots.filter((l) => l.sku === p.sku);
        const available = mine.filter((l) => l.status === 'available' && (!l.expiry || l.expiry >= today)).reduce((s, l) => s + l.qty - l.reserved, 0);
        const reserved = mine.reduce((s, l) => s + l.reserved, 0);
        const quarantine = mine.filter((l) => l.status === 'quarantine' || (l.expiry && l.expiry < today)).reduce((s, l) => s + l.qty, 0);
        const toPutaway = pendingPutaway.filter((x) => x.sku === p.sku).reduce((s, x) => s + x.qty, 0);
        const expiries = mine.filter((l) => l.expiry && l.status === 'available').map((l) => l.expiry!).sort();
        const next = expiries[0] ?? null;
        return { p, available, reserved, quarantine, toPutaway, bins: new Set(mine.map((l) => l.bin)).size, next, lots: mine };
      });
  }, [state.products, lots, pendingPutaway, nav.wh, today]);

  const q = query.trim().toLowerCase();
  const filtered = rows
    .filter((r) => !client || r.p.client === client)
    .filter((r) => !q || r.p.sku.toLowerCase().includes(q) || name(r.p.sku).toLowerCase().includes(q) || r.p.barcode.includes(q) || r.lots.some((l) => l.lot.toLowerCase().includes(q)))
    .filter((r) => !expiringOnly || r.lots.some((l) => l.expiry && diffDays(today, l.expiry) <= 30))
    .sort((a, b) => {
      const d = sort.dir;
      if (sort.key === 'available') return (a.available - b.available) * d;
      if (sort.key === 'bins') return (a.bins - b.bins) * d;
      if (sort.key === 'expiry') return ((a.next ?? '9999') < (b.next ?? '9999') ? -1 : (a.next ?? '9999') > (b.next ?? '9999') ? 1 : 0) * d;
      return a.p.sku.localeCompare(b.p.sku) * d;
    });

  const sortBtn = (key: SortKey, label: string, right = false) => (
    <th className={`${thCls} ${right ? 'text-right' : ''}`} aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-secondary-900 dark:hover:text-white" onClick={() => setSort((s) => ({ key, dir: s.key === key ? ((-s.dir) as 1 | -1) : 1 }))}>
        {label}
        {sort.key === key ? (sort.dir === 1 ? '↑' : '↓') : ''}
      </button>
    </th>
  );

  const exportStock = () => {
    const header = [t('csv.sku'), t('csv.product'), t('csv.client'), t('csv.bin'), t('csv.lot'), t('csv.expiry'), t('csv.qty'), t('csv.reserved'), t('csv.status')];
    const body = lots
      .slice()
      .sort((a, b) => a.sku.localeCompare(b.sku) || fefoSort(a, b))
      .map((l) => [
        l.sku,
        name(l.sku),
        CLIENT_BY_ID[state.products.find((p) => p.sku === l.sku)?.client ?? 'lir'].name,
        l.bin,
        l.lot,
        l.expiry ?? '',
        l.qty,
        l.reserved,
        l.status === 'quarantine' ? t('stock.status.quarantine') : l.expiry && l.expiry < today ? t('stock.status.expired') : t('stock.status.available'),
      ]);
    download(`existencias-${nav.wh}-${today}.csv`, toCsv([header, ...body]));
    notify(t('stock.exported', { n: body.length }));
  };

  const exportKardex = (sku: string) => {
    const moves = state.moves.filter((m) => m.wh === nav.wh && m.sku === sku);
    const header = [t('csv.date'), t('csv.type'), t('csv.sku'), t('csv.lot'), t('csv.bin'), t('csv.qty'), t('csv.ref')];
    download(`kardex-${sku}-${nav.wh}.csv`, toCsv([header, ...moves.map((m) => [m.at.replace('T', ' '), t(`moves.${m.type}`), m.sku, m.lot, m.bin, m.qty, m.ref])]));
    notify(t('stock.kardexExported', { n: moves.length }));
  };

  return (
    <div className="space-y-5">
      <Panel
        title={t('stock.title')}
        subtitle={t('stock.subtitle', { wh: WAREHOUSE_BY_ID[nav.wh].name })}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportStock}>
              <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" />
              {t('stock.export')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImporting(true)}>
              <ArrowUpTrayIcon className="mr-1.5 h-4 w-4" />
              {t('stock.import')}
            </Button>
          </>
        }
      >
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end">
          <label className="relative block flex-1">
            <span className="sr-only">{t('stock.search')}</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-secondary-400" />
            <input className={`${inputCls} pl-8`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('stock.searchPh')} />
          </label>
          <select className={`${baseInputCls} w-full md:w-56 pr-9`} value={client} onChange={(e) => setClient(e.target.value as ClientId | '')} aria-label={t('stock.client')}>
            <option value="">{t('stock.allClients')}</option>
            {CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={expiringOnly} onChange={(e) => setExpiringOnly(e.target.checked)} className="rounded border-secondary-300" />
            {t('stock.expiringOnly')}
          </label>
        </div>

        {filtered.length === 0 ? (
          <Empty>{t('stock.noResults')}</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-secondary-200 dark:border-secondary-700">
                  <th className={thCls} />
                  {sortBtn('sku', t('common.product'))}
                  <th className={thCls}>{t('stock.client')}</th>
                  {sortBtn('available', t('stock.available'), true)}
                  <th className={`${thCls} text-right`}>{t('stock.reserved')}</th>
                  <th className={`${thCls} text-right`}>{t('stock.blocked')}</th>
                  <th className={`${thCls} text-right`}>{t('stock.toPutaway')}</th>
                  {sortBtn('bins', t('stock.bins'), true)}
                  {sortBtn('expiry', t('stock.nextExpiry'))}
                  <th className={thCls}>{t('stock.class')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isOpen = open === r.p.sku;
                  const days = r.next ? diffDays(today, r.next) : null;
                  return (
                    <Fragment key={r.p.sku}>
                      <tr className="border-b border-secondary-100 hover:bg-secondary-50 dark:border-secondary-800 dark:hover:bg-secondary-800/40">
                        <td className={tdCls}>
                          <button type="button" aria-expanded={isOpen} aria-label={t('stock.toggle', { sku: r.p.sku })} onClick={() => setOpen(isOpen ? null : r.p.sku)} className="rounded p-0.5 hover:bg-secondary-200 dark:hover:bg-secondary-700">
                            {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className={tdCls}>
                          <button type="button" className="text-left" onClick={() => setOpen(isOpen ? null : r.p.sku)}>
                            <div className="font-medium">{name(r.p.sku)}</div>
                            <div className="font-mono text-xs text-secondary-500">
                              {r.p.sku} · {r.p.barcode}
                            </div>
                          </button>
                          {r.p.imported && <Pill tone="info">{t('stock.imported')}</Pill>}
                        </td>
                        <td className={`${tdCls} text-xs`}>{CLIENT_BY_ID[r.p.client].name}</td>
                        <td className={`${tdCls} text-right font-semibold tabular-nums`}>{fmtNum(r.available, lang)}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(r.reserved, lang)}</td>
                        <td className={`${tdCls} text-right tabular-nums ${r.quarantine ? 'text-amber-600' : ''}`}>{fmtNum(r.quarantine, lang)}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{fmtNum(r.toPutaway, lang)}</td>
                        <td className={`${tdCls} text-right tabular-nums`}>{r.bins}</td>
                        <td className={tdCls}>
                          {r.next ? (
                            <span className={days !== null && days < 0 ? 'text-red-600' : days !== null && days <= 30 ? 'font-semibold text-amber-600' : ''}>
                              {fmtDate(r.next, lang)}
                            </span>
                          ) : (
                            <span className="text-secondary-400">—</span>
                          )}
                          {days !== null && days <= 30 && <div className="text-xs text-amber-600">{days < 0 ? t('stock.expired') : t('stock.inDays', { n: days })}</div>}
                        </td>
                        <td className={tdCls}>
                          <Pill tone={cls[r.p.sku] === 'A' ? 'success' : cls[r.p.sku] === 'B' ? 'info' : 'default'}>{cls[r.p.sku] ?? 'C'}</Pill>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-secondary-200 bg-secondary-50/60 dark:border-secondary-700 dark:bg-secondary-800/30">
                          <td colSpan={10} className="px-3 py-3">
                            <SkuDetail sku={r.p.sku} lots={r.lots} onTransfer={setTransfer} onKardex={() => exportKardex(r.p.sku)} />
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
        <SimNote className="mt-3">{t('stock.note')}</SimNote>
      </Panel>

      {transfer && <TransferModal lot={transfer} onClose={() => setTransfer(null)} />}
      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onImport={(products) => {
            dispatch({ type: 'products.import', products, at: now(), wh: nav.wh });
          }}
          existing={state.products}
        />
      )}
    </div>
  );
}

function SkuDetail({ sku, lots, onTransfer, onKardex }: { sku: string; lots: Lot[]; onTransfer: (l: Lot) => void; onKardex: () => void }) {
  const t = useT();
  const { state, nav, lang, today } = useWms();
  const moves = state.moves.filter((m) => m.wh === nav.wh && m.sku === sku).slice(0, 25);
  const sorted = [...lots].sort(fefoSort);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="min-w-0">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('stock.lotsTitle')}</div>
        {sorted.length === 0 ? (
          <p className="text-sm text-secondary-500">{t('stock.noLots')}</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className={thCls}>{t('common.bin')}</th>
                <th className={thCls}>{t('common.lot')}</th>
                <th className={thCls}>{t('common.expires')}</th>
                <th className={`${thCls} text-right`}>{t('common.qty')}</th>
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((l, i) => (
                <tr key={l.id} className="border-t border-secondary-200 dark:border-secondary-700">
                  <td className={`${tdCls} font-mono`}>{l.bin}</td>
                  <td className={`${tdCls} font-mono`}>
                    {l.lot}
                    {i === 0 && l.status === 'available' && <Pill tone="success" className="ml-1">{t('stock.fefoFirst')}</Pill>}
                    {l.status === 'quarantine' && <Pill tone="warning" className="ml-1">{t('stock.status.quarantine')}</Pill>}
                  </td>
                  <td className={tdCls}>{l.expiry ? fmtDate(l.expiry, lang) : '—'}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>
                    {fmtNum(l.qty, lang)}
                    {l.reserved > 0 && <div className="text-secondary-500">{t('stock.reservedN', { n: l.reserved })}</div>}
                  </td>
                  <td className={`${tdCls} text-right`}>
                    <button
                      type="button"
                      disabled={availableQty(l) <= 0 || (!!l.expiry && l.expiry < today)}
                      onClick={() => onTransfer(l)}
                      className="font-semibold text-primary-600 hover:underline disabled:cursor-not-allowed disabled:text-secondary-400 disabled:no-underline dark:text-primary-400"
                    >
                      {t('stock.transfer')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-secondary-500">{t('stock.kardex')}</span>
          <button type="button" onClick={onKardex} className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
            {t('stock.kardexCsv')}
          </button>
        </div>
        {moves.length === 0 ? (
          <p className="text-sm text-secondary-500">{t('stock.noMoves')}</p>
        ) : (
          <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">
            {moves.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded bg-white px-2 py-1 dark:bg-secondary-900">
                <span className="w-28 shrink-0 text-secondary-500">{fmtDateTime(m.at, today, lang)}</span>
                <span className="min-w-0 flex-1">{t(`moves.${m.type}`)} · {m.bin} · {m.ref}</span>
                <span className={`font-semibold tabular-nums ${m.qty < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{m.qty > 0 ? `+${m.qty}` : m.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TransferModal({ lot, onClose }: { lot: Lot; onClose: () => void }) {
  const t = useT();
  const name = useProductName();
  const { dispatch, notify } = useWms();
  const targets = WAREHOUSES.filter((w) => w.id !== lot.wh);
  const [to, setTo] = useState<WarehouseId>(targets[0].id);
  const max = availableQty(lot);
  const [qty, setQty] = useState(Math.min(12, max));
  const valid = qty >= 1 && qty <= max;
  return (
    <Modal
      title={t('stock.transferTitle')}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            disabled={!valid}
            onClick={() => {
              dispatch({ type: 'lot.transfer', lot: lot.id, to, qty, at: now() });
              notify(t('stock.transferred', { qty, to: WAREHOUSE_BY_ID[to].name }));
              onClose();
            }}
          >
            {t('stock.transferConfirm')}
          </Button>
        </>
      }
    >
      <p className="mb-3">
        {name(lot.sku)} · {t('common.lot')} <span className="font-mono">{lot.lot}</span> · {lot.bin}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t('stock.destination')}>
          <select className={selectCls} value={to} onChange={(e) => setTo(e.target.value as WarehouseId)}>
            {targets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('stock.transferQty', { max })}>
          <input type="number" min={1} max={max} className={inputCls} value={qty} onChange={(e) => setQty(Number(e.target.value) || 0)} />
        </Field>
      </div>
      <SimNote className="mt-3">{t('stock.transferNote')}</SimNote>
    </Modal>
  );
}

function ImportModal({ onClose, onImport, existing }: { onClose: () => void; onImport: (p: Product[]) => void; existing: Product[] }) {
  const t = useT();
  const { notify } = useWms();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ added: Product[]; errors: ImportError[] } | null>(null);

  const run = (content: string) => {
    const r = importProducts(content, existing);
    setResult(r);
    if (r.added.length) {
      onImport(r.added);
      notify(t('stock.importDone', { n: r.added.length }));
    } else notify(t('stock.importNone'), 'warn');
  };

  return (
    <Modal title={t('stock.importTitle')} onClose={onClose} wide footer={<Button size="sm" variant="ghost" onClick={onClose}>{t('common.close')}</Button>}>
      <p className="mb-2">{t('stock.importText')}</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => download('plantilla-productos.csv', '﻿' + TEMPLATE)}>
          {t('stock.template')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          {t('stock.chooseFile')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 512 * 1024) {
              notify(t('stock.fileTooBig'), 'error');
              return;
            }
            run(await f.text());
            e.target.value = '';
          }}
        />
      </div>
      <Field label={t('stock.paste')}>
        <textarea className={`${inputCls} font-mono text-xs`} rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={TEMPLATE} />
      </Field>
      <Button size="sm" className="mt-2" disabled={!text.trim()} onClick={() => run(text)}>
        {t('stock.importRun')}
      </Button>
      {result && (
        <div className="mt-3 rounded-lg bg-secondary-50 p-3 text-xs dark:bg-secondary-800/60">
          <div className="font-semibold">{t('stock.importResult', { added: result.added.length, errors: result.errors.length })}</div>
          {result.errors.length > 0 && (
            <ul className="mt-1 list-inside list-disc">
              {result.errors.slice(0, 8).map((e, i) => (
                <li key={i}>{t('stock.importError', { line: e.line, reason: t(`stock.importReasons.${e.reason}`) })}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <SimNote className="mt-3">{t('stock.importNote')}</SimNote>
    </Modal>
  );
}
