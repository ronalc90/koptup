'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowsRightLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ITEMS, ITEM_BY_SKU, SUPPLIER_BY_ID, WAREHOUSES } from '../lib/catalog';
import { periodRange, stockOf, valuationAt } from '../lib/engine';
import { csvMoney, downloadCsv } from '../lib/format';
import { itemMatches } from '../lib/search';
import { pad } from '../lib/seed';
import { useErp } from '../lib/store';
import type { ItemKind, WarehouseId } from '../lib/types';
import { Empty, FieldLabel, Modal, MoreButton, Note, SectionHeader, SubTabs, Th, btn, inputCls, plainSelectCls, rowCls, theadCls, useFmt, usePager } from './ui';

type Method = 'avg' | 'fifo';

/** OC abierta (pendiente o aprobada) que ya cubre un SKU en una bodega. */
export function useOpenPoFor() {
  const { state } = useErp();
  return (sku: string, wh: WarehouseId) => state.pos.find((p) => (p.status === 'pending' || p.status === 'approved') && p.warehouse === wh && p.lines.some((l) => l.sku === sku));
}

/** Crea una OC sugerida para reponer un SKU hasta su máximo. */
export function useCreateReorderPo() {
  const { state, dispatch, ensureOpenPeriod } = useErp();
  const t = useTranslations('demoErp.inventory');
  return (sku: string, wh: WarehouseId, have: number, cost: number, origin: 'reorder' | 'mrp', qtyOverride?: number) => {
    const it = ITEM_BY_SKU[sku];
    const target = it.target[wh] || 0;
    const qty = qtyOverride ?? Math.max(10, Math.ceil((target - have) / 10) * 10);
    const n = state.counters.OC;
    dispatch({ type: 'createPo', supplierId: it.supplierId!, warehouse: wh, lines: [{ sku, qty, price: Math.round(cost), vat: it.vat }], origin });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.poCreated', { doc: `OC-${pad(n)}`, supplier: SUPPLIER_BY_ID[it.supplierId!].name }));
  };
}

export default function InventoryModule() {
  const t = useTranslations('demoErp.inventory');
  const tc = useTranslations('demoErp.common');
  const tw = useTranslations('demoErp.warehouses');
  const { computed, filters, goTo, locale } = useErp();
  const f = useFmt();
  const [wh, setWh] = useState<'all' | WarehouseId>('all');
  const [kind, setKind] = useState<'all' | ItemKind>('all');
  const [method, setMethod] = useState<Method>('avg');
  const [kardex, setKardex] = useState<string | null>(null);
  const [transfer, setTransfer] = useState(false);
  const openPoFor = useOpenPoFor();
  const createPo = useCreateReorderPo();
  const r = periodRange(filters.period);
  const isCurrent = r.end === '2026-09-30';

  const val = useMemo(() => valuationAt(computed.movements, r.end), [computed, r.end]);

  if (filters.company === 'log') {
    return (
      <Card variant="bordered" padding="md">
        <SectionHeader title={t('title')} />
        <Empty>{t('noInventoryLog')}</Empty>
      </Card>
    );
  }

  const rows = ITEMS.filter((i) => i.kind !== 'service')
    .filter((i) => kind === 'all' || i.kind === kind)
    .filter((i) => itemMatches(i.sku, filters.search))
    .flatMap((i) =>
      (Object.keys(i.target) as WarehouseId[])
        .filter((w) => wh === 'all' || w === wh)
        .map((w) => {
          const qty = stockOf(val, i.sku, w);
          const unit = method === 'avg' ? val.avgCost[i.sku] : val.valueFifo[i.sku] / Math.max(1e-9, Object.values(val.stock[i.sku] || {}).reduce((a, b) => a + (b || 0), 0));
          const reorder = i.reorder[w] || 0;
          const status: 'ok' | 'low' | 'out' = qty <= 0 ? 'out' : qty < reorder ? 'low' : 'ok';
          return { sku: i.sku, wh: w, qty, unit: Number.isFinite(unit) ? unit : val.avgCost[i.sku], reorder, status, value: qty * (Number.isFinite(unit) ? unit : val.avgCost[i.sku]) };
        }),
    );
  const totalAvg = ITEMS.filter((i) => i.kind !== 'service' && (kind === 'all' || i.kind === kind)).reduce((a, i) => a + val.valueAvg[i.sku], 0);
  const totalFifo = ITEMS.filter((i) => i.kind !== 'service' && (kind === 'all' || i.kind === kind)).reduce((a, i) => a + val.valueFifo[i.sku], 0);
  const shownTotal = rows.reduce((a, x) => a + x.value, 0);
  const alerts = rows.filter((x) => x.status !== 'ok');

  const exportCsv = () => {
    const head = [t('cols.sku'), t('cols.item'), t('cols.warehouse'), t('cols.stock'), t('cols.reorder'), t('cols.unitCost'), t('cols.value'), t('cols.status'), tc('currency')];
    const data = rows.map((x) => [x.sku, f.item(x.sku), tw(x.wh), x.qty, x.reorder, csvMoney(x.unit, filters.currency), csvMoney(x.value, filters.currency), t(`status.${x.status}`), filters.currency]);
    downloadCsv(`inventario-${r.end}-${method}.csv`, [head, ...data], locale);
    toast.success(tc('csvDone', { n: data.length }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-3 min-w-0">
        <SectionHeader title={t('title')} subtitle={t('subtitle', { date: f.date(r.end) })}>
          <button className={btn.outline} onClick={exportCsv}>
            <ArrowDownTrayIcon className="w-4 h-4" />
            {tc('exportCsv')}
          </button>
          <button className={btn.primary} onClick={() => setTransfer(true)}>
            <ArrowsRightLeftIcon className="w-4 h-4" />
            {t('transfer.open')}
          </button>
        </SectionHeader>

        <div className="flex flex-wrap items-end gap-3 mb-3">
          <label className="block w-44">
            <FieldLabel>{t('filters.warehouse')}</FieldLabel>
            <select className={plainSelectCls} value={wh} onChange={(e) => setWh(e.target.value as 'all' | WarehouseId)}>
              <option value="all">{t('filters.allWarehouses')}</option>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>
                  {tw(w)}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-44">
            <FieldLabel>{t('filters.kind')}</FieldLabel>
            <select className={plainSelectCls} value={kind} onChange={(e) => setKind(e.target.value as 'all' | ItemKind)}>
              <option value="all">{t('filters.allKinds')}</option>
              {(['merch', 'finished', 'raw'] as ItemKind[]).map((k) => (
                <option key={k} value={k}>
                  {t(`kinds.${k}`)}
                </option>
              ))}
            </select>
          </label>
          <div>
            <FieldLabel>{t('method.label')}</FieldLabel>
            <SubTabs
              value={method}
              onChange={setMethod}
              tabs={[
                { id: 'avg', label: t('method.avg') },
                { id: 'fifo', label: t('method.fifo') },
              ]}
            />
          </div>
        </div>
        <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-3">
          {t('method.totals', { avg: f.money(totalAvg), fifo: f.money(totalFifo), diff: f.money(totalFifo - totalAvg) })} {t('method.policy')}
        </p>

        {rows.length === 0 ? (
          <Empty>{tc('noResults')}</Empty>
        ) : (
          <InventoryTable rows={rows} onKardex={setKardex} />
        )}
        <p className="text-xs text-secondary-500 mt-2 text-right">{t('shownTotal', { value: f.money(shownTotal) })}</p>
      </Card>

      <Card variant="bordered" padding="md" className="min-w-0">
        <h3 className="font-bold text-secondary-900 dark:text-white mb-1 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
          {t('alerts.title')}
        </h3>
        <p className="text-xs text-secondary-500 mb-3">{t('alerts.subtitle')}</p>
        {alerts.length === 0 && <Empty>{t('alerts.none')}</Empty>}
        <div className="space-y-2">
          {alerts.map((a) => {
            const po = openPoFor(a.sku, a.wh);
            const it = ITEM_BY_SKU[a.sku];
            return (
              <div key={`${a.sku}-${a.wh}`} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/50 dark:bg-secondary-800/40">
                <p className="font-mono text-[11px] text-primary-600 dark:text-primary-400">
                  {a.sku} · {tw(a.wh)}
                </p>
                <p className="text-sm text-secondary-900 dark:text-white">{f.item(a.sku)}</p>
                <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">{t(a.status === 'out' ? 'alerts.out' : 'alerts.low', { qty: f.qty(a.qty), reorder: f.qty(a.reorder) })}</p>
                {po ? (
                  <button className={`${btn.ghost} mt-1.5 px-0`} onClick={() => goTo('purchases', po.no)}>
                    {t('alerts.inProgress', { doc: po.no })}
                  </button>
                ) : it.supplierId && isCurrent ? (
                  <button className={`${btn.primary} mt-2 w-full`} onClick={() => createPo(a.sku, a.wh, a.qty, val.avgCost[a.sku], 'reorder')}>
                    {t('alerts.createPo', { qty: f.qty(Math.max(10, Math.ceil(((it.target[a.wh] || 0) - a.qty) / 10) * 10)) })}
                  </button>
                ) : it.kind === 'finished' && isCurrent ? (
                  <button className={`${btn.outline} mt-2 w-full`} onClick={() => (a.wh === 'bog' ? goTo('manufacturing') : setTransfer(true))}>
                    {a.wh === 'bog' ? t('alerts.produce') : t('alerts.transfer')}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
        {!isCurrent && <p className="text-[11px] text-secondary-500 mt-3">{t('alerts.pastPeriod')}</p>}
      </Card>

      {kardex && <KardexModal sku={kardex} onClose={() => setKardex(null)} />}
      {transfer && <TransferForm onClose={() => setTransfer(false)} />}
    </div>
  );
}

function InventoryTable({ rows, onKardex }: { rows: { sku: string; wh: WarehouseId; qty: number; unit: number; reorder: number; status: 'ok' | 'low' | 'out'; value: number }[]; onKardex: (sku: string) => void }) {
  const t = useTranslations('demoErp.inventory');
  const tw = useTranslations('demoErp.warehouses');
  const f = useFmt();
  const pager = usePager(rows, 15);
  return (
    <>
      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className={theadCls}>
              <Th>{t('cols.sku')}</Th>
              <Th>{t('cols.item')}</Th>
              <Th>{t('cols.warehouse')}</Th>
              <Th right>{t('cols.stock')}</Th>
              <Th right>{t('cols.reorder')}</Th>
              <Th right>{t('cols.unitCost')}</Th>
              <Th right>{t('cols.value')}</Th>
              <Th>{t('cols.status')}</Th>
            </tr>
          </thead>
          <tbody>
            {pager.visible.map((x) => (
              <tr key={`${x.sku}-${x.wh}`} className={`${rowCls} hover:bg-secondary-50 dark:hover:bg-secondary-800/40`}>
                <td className="py-2 pr-3 whitespace-nowrap">
                  <button className="font-mono text-xs text-primary-600 dark:text-primary-400 hover:underline" onClick={() => onKardex(x.sku)} aria-label={t('kardex.open', { sku: x.sku })}>
                    {x.sku}
                  </button>
                </td>
                <td className="py-2 pr-3 text-secondary-900 dark:text-white whitespace-nowrap">{f.item(x.sku)}</td>
                <td className="py-2 pr-3 text-secondary-700 dark:text-secondary-300 whitespace-nowrap">{tw(x.wh)}</td>
                <td className="py-2 pr-3 text-right font-medium">{f.qty(x.qty)}</td>
                <td className="py-2 pr-3 text-right text-secondary-500">{f.qty(x.reorder)}</td>
                <td className="py-2 pr-3 text-right text-secondary-700 dark:text-secondary-300 whitespace-nowrap">{f.money(x.unit)}</td>
                <td className="py-2 pr-3 text-right font-semibold whitespace-nowrap">{f.money(x.value)}</td>
                <td className="py-2 pr-3 whitespace-nowrap">
                  <Badge variant={x.status === 'ok' ? 'success' : x.status === 'low' ? 'warning' : 'danger'}>{t(`status.${x.status}`)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MoreButton pager={pager} />
      <p className="text-[11px] text-secondary-500 mt-2">{t('kardex.hint')}</p>
    </>
  );
}

function KardexModal({ sku, onClose }: { sku: string; onClose: () => void }) {
  const t = useTranslations('demoErp.inventory');
  const tw = useTranslations('demoErp.warehouses');
  const { computed, filters } = useErp();
  const f = useFmt();
  const r = periodRange(filters.period);
  const [wh, setWh] = useState<'all' | WarehouseId>('all');
  const it = ITEM_BY_SKU[sku];
  const rows = useMemo(() => {
    let qty = 0;
    let value = 0;
    const out: { date: string; doc: string; kind: string; wh: WarehouseId; qty: number; unit: number; balQty: number; balAvg: number }[] = [];
    for (const m of computed.movements) {
      if (m.sku !== sku || m.date > r.end) continue;
      if (wh !== 'all' && m.wh !== wh) continue;
      if (wh === 'all' && (m.kind === 'transferIn' || m.kind === 'transferOut')) continue;
      qty += m.qty;
      value += m.value;
      if (m.date >= r.start) out.push({ date: m.date, doc: m.doc, kind: m.kind, wh: m.wh, qty: m.qty, unit: m.unitCost, balQty: qty, balAvg: qty > 0 ? value / qty : m.unitCost });
    }
    return out.reverse();
  }, [computed, sku, r.start, r.end, wh]);
  const pager = usePager(rows, 20);
  return (
    <Modal wide title={t('kardex.title', { sku })} subtitle={`${f.item(sku)} · ${t('kardex.subtitle')}`} onClose={onClose}>
      <label className="block w-48 mb-3">
        <FieldLabel>{t('filters.warehouse')}</FieldLabel>
        <select className={plainSelectCls} value={wh} onChange={(e) => setWh(e.target.value as 'all' | WarehouseId)}>
          <option value="all">{t('kardex.allWarehouses')}</option>
          {(Object.keys(it.target) as WarehouseId[]).map((w) => (
            <option key={w} value={w}>
              {tw(w)}
            </option>
          ))}
        </select>
      </label>
      {rows.length === 0 ? (
        <Empty>{t('kardex.empty')}</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className={theadCls}>
                <Th>{t('kardex.date')}</Th>
                <Th>{t('kardex.doc')}</Th>
                <Th>{t('kardex.type')}</Th>
                <Th>{t('cols.warehouse')}</Th>
                <Th right>{t('kardex.in')}</Th>
                <Th right>{t('kardex.out')}</Th>
                <Th right>{t('kardex.unit')}</Th>
                <Th right>{t('kardex.balance')}</Th>
              </tr>
            </thead>
            <tbody>
              {pager.visible.map((m, i) => (
                <tr key={i} className={rowCls}>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{f.date(m.date)}</td>
                  <td className="py-1.5 pr-3 font-mono">{m.doc}</td>
                  <td className="py-1.5 pr-3">{t(`kardex.kinds.${m.kind}`)}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{tw(m.wh)}</td>
                  <td className="py-1.5 pr-3 text-right text-emerald-700 dark:text-emerald-400">{m.qty > 0 ? f.qty(m.qty) : ''}</td>
                  <td className="py-1.5 pr-3 text-right text-rose-700 dark:text-rose-400">{m.qty < 0 ? f.qty(-m.qty) : ''}</td>
                  <td className="py-1.5 pr-3 text-right whitespace-nowrap">{f.money(m.unit)}</td>
                  <td className="py-1.5 pr-3 text-right font-medium">{f.qty(m.balQty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <MoreButton pager={pager} />
      <p className="text-[11px] text-secondary-500 mt-3">{t('kardex.note')}</p>
    </Modal>
  );
}

function TransferForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('demoErp.inventory');
  const tc = useTranslations('demoErp.common');
  const tw = useTranslations('demoErp.warehouses');
  const { computed, dispatch, state, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const items = ITEMS.filter((i) => i.kind === 'merch' || i.kind === 'finished');
  const [sku, setSku] = useState(items[0].sku);
  const [from, setFrom] = useState<WarehouseId>('bog');
  const [to, setTo] = useState<WarehouseId>('baq');
  const [qty, setQty] = useState('');
  const [error, setError] = useState('');
  const current = useMemo(() => valuationAt(computed.movements, '9999-12-31'), [computed]);
  const have = stockOf(current, sku, from);
  const save = () => {
    const q = Math.round(Number(qty));
    if (from === to) return setError(t('transfer.errorSame'));
    if (!q || q <= 0) return setError(t('transfer.errorQty'));
    if (q > have) return setError(t('transfer.errorStock', { have: f.qty(have) }));
    const n = state.counters.TR;
    dispatch({ type: 'transfer', sku, qty: q, from, to });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.transferred', { doc: `TR-${pad(n)}`, qty: f.qty(q), item: f.item(sku), from: tw(from), to: tw(to) }));
    onClose();
  };
  return (
    <Modal
      title={t('transfer.title')}
      subtitle={t('transfer.subtitle')}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save}>
            {t('transfer.save')}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <FieldLabel>{t('cols.item')}</FieldLabel>
          <select className={plainSelectCls} value={sku} onChange={(e) => setSku(e.target.value)}>
            {items.map((i) => (
              <option key={i.sku} value={i.sku}>
                {i.sku} · {f.item(i.sku)}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <FieldLabel>{t('transfer.from')}</FieldLabel>
            <select className={plainSelectCls} value={from} onChange={(e) => setFrom(e.target.value as WarehouseId)}>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>
                  {tw(w)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>{t('transfer.to')}</FieldLabel>
            <select className={plainSelectCls} value={to} onChange={(e) => setTo(e.target.value as WarehouseId)}>
              {WAREHOUSES.map((w) => (
                <option key={w} value={w}>
                  {tw(w)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <FieldLabel>{t('transfer.qty')}</FieldLabel>
          <input className={inputCls} inputMode="numeric" value={qty} placeholder="0" onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ''))} />
          <span className="text-[11px] text-secondary-500">{t('transfer.available', { qty: f.qty(have), wh: tw(from) })}</span>
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Note>{t('transfer.note')}</Note>
      </div>
    </Modal>
  );
}
