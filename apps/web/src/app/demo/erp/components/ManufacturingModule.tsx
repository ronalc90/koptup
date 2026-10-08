'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { PlusIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BOMS, ITEMS, ITEM_BY_SKU, explodeBom } from '../lib/catalog';
import { periodRange, stockOf, valuationAt } from '../lib/engine';
import { opMatches } from '../lib/search';
import { pad } from '../lib/seed';
import { useErp } from '../lib/store';
import type { BomComponent, ProductionOrder } from '../lib/types';
import { useCreateReorderPo, useOpenPoFor } from './InventoryModule';
import { Empty, FieldLabel, Modal, MoreButton, Note, SectionHeader, btn, inputCls, plainSelectCls, useFmt, usePager } from './ui';

export default function ManufacturingModule() {
  const t = useTranslations('demoErp.manufacturing');
  const { state, computed, filters, dispatch, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const [bomSku, setBomSku] = useState(BOMS[0].sku);
  const [creating, setCreating] = useState<{ sku: string; qty: number } | null>(null);
  const openPoFor = useOpenPoFor();
  const createPo = useCreateReorderPo();
  const current = useMemo(() => valuationAt(computed.movements, '9999-12-31'), [computed]);
  const r = periodRange(filters.period);

  const orders = useMemo(
    () =>
      state.production
        .filter((o) => o.status !== 'done' || (o.finish && o.finish.date >= r.start && o.finish.date <= r.end) || (o.date >= r.start && o.date <= r.end))
        .filter((o) => opMatches(o, filters.search))
        .sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || (b.date > a.date ? 1 : -1)),
    [state.production, r.start, r.end, filters.search],
  );
  const pager = usePager(orders, 6);

  // MRP: necesidades de las órdenes planeadas contra el stock disponible
  const mrp = useMemo(() => {
    const need: Record<string, number> = {};
    for (const o of state.production.filter((x) => x.status === 'planned')) {
      for (const c of explodeBom(o.sku)) need[c.sku] = (need[c.sku] || 0) + c.qty * o.qty;
    }
    const buy = ITEMS.filter((i) => i.kind === 'raw').map((i) => {
      const have = stockOf(current, i.sku, 'bog');
      const required = Math.round((need[i.sku] || 0) * 100) / 100;
      const after = have - required;
      const reorder = i.reorder.bog || 0;
      const shortfall = after < reorder;
      const qty = shortfall ? Math.max(10, Math.ceil(((i.target.bog || 0) - after) / 10) * 10) : 0;
      return { sku: i.sku, have, required, after, reorder, shortfall, qty };
    });
    const produce = ITEMS.filter((i) => i.kind === 'finished').map((i) => {
      const have = stockOf(current, i.sku, 'bog');
      const planned = state.production.filter((o) => o.sku === i.sku && o.status !== 'done').reduce((a, o) => a + o.qty, 0);
      const reorder = i.reorder.bog || 0;
      return { sku: i.sku, have, planned, reorder, suggest: have + planned < reorder ? Math.round(((i.target.bog || 0) * 1.2) / 50) * 50 : 0 };
    });
    return { buy, produce };
  }, [state.production, current]);

  if (filters.company === 'log') {
    return (
      <Card variant="bordered" padding="md">
        <SectionHeader title={t('title')} />
        <Empty>{t('noManufacturingLog')}</Empty>
      </Card>
    );
  }

  const shortagesFor = (o: ProductionOrder) =>
    explodeBom(o.sku)
      .map((c) => ({ sku: c.sku, need: Math.round(c.qty * o.qty * 100) / 100, have: stockOf(current, c.sku, o.warehouse) }))
      .filter((x) => x.have < x.need);

  const start = (o: ProductionOrder) => {
    if (shortagesFor(o).length) return;
    dispatch({ type: 'startOp', id: o.id });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.started', { doc: o.no }));
  };
  const finish = (o: ProductionOrder) => {
    dispatch({ type: 'finishOp', id: o.id });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.finished', { doc: o.no, qty: f.qty(o.qty), item: f.item(o.sku) }));
  };

  const bom = BOMS.find((b) => b.sku === bomSku)!;
  const unitCost = explodeBom(bomSku).reduce((a, c) => a + c.qty * (current.avgCost[c.sku] || ITEM_BY_SKU[c.sku].cost), 0);
  const price = ITEM_BY_SKU[bomSku].price;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="min-w-0">
        <SectionHeader title={t('bom.title')} subtitle={t('bom.subtitle')} />
        <label className="block mb-3">
          <FieldLabel>{t('bom.product')}</FieldLabel>
          <select className={plainSelectCls} value={bomSku} onChange={(e) => setBomSku(e.target.value)}>
            {BOMS.map((b) => (
              <option key={b.sku} value={b.sku}>
                {b.sku} · {f.item(b.sku)}
              </option>
            ))}
          </select>
        </label>
        <div className="text-sm">
          <p className="font-medium text-secondary-900 dark:text-white mb-1">
            {f.item(bomSku)} <span className="text-xs text-secondary-500">· {t('bom.perUnit')}</span>
          </p>
          {bom.components.map((c, i) => (
            <BomNode key={i} node={c} depth={1} factor={1} avg={current.avgCost} />
          ))}
        </div>
        <dl className="mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700 text-sm space-y-1">
          <div className="flex justify-between">
            <dt className="text-secondary-600 dark:text-secondary-400">{t('bom.unitCost')}</dt>
            <dd className="font-semibold">{f.money(unitCost)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-secondary-600 dark:text-secondary-400">{t('bom.price')}</dt>
            <dd>{f.money(price)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-secondary-600 dark:text-secondary-400">{t('bom.margin')}</dt>
            <dd className="text-emerald-700 dark:text-emerald-400 font-semibold">{f.pct((price - unitCost) / price)}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-secondary-500 mt-2">{t('bom.note')}</p>
      </Card>

      <Card variant="bordered" padding="md" className="lg:col-span-2 min-w-0">
        <SectionHeader title={t('orders.title')} subtitle={t('orders.subtitle')}>
          <button className={btn.primary} onClick={() => setCreating({ sku: BOMS[0].sku, qty: 0 })}>
            <PlusIcon className="w-4 h-4" />
            {t('orders.new')}
          </button>
        </SectionHeader>
        {orders.length === 0 ? (
          <Empty>{t('orders.empty')}</Empty>
        ) : (
          <div className="space-y-3">
            {pager.visible.map((o) => {
              const short = o.status === 'planned' ? shortagesFor(o) : [];
              return (
                <div key={o.id} className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700">
                  <div className="flex justify-between items-start gap-2 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-primary-600 dark:text-primary-400">{o.no}</span>
                        <Badge variant={o.status === 'done' ? 'success' : o.status === 'inProgress' ? 'info' : 'default'}>{t(`orders.status.${o.status}`)}</Badge>
                        {o.user && <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">{t('yours')}</span>}
                      </div>
                      <p className="font-medium text-sm text-secondary-900 dark:text-white">
                        {f.qty(o.qty)} × {f.item(o.sku)}
                      </p>
                      <p className="text-[11px] text-secondary-500">
                        {t('orders.dates', { created: f.date(o.date), start: o.start ? f.date(o.start.date) : '—', finish: o.finish ? f.date(o.finish.date) : '—' })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {o.status === 'planned' && (
                        <button className={btn.primary} onClick={() => start(o)} disabled={short.length > 0}>
                          {t('orders.start')}
                        </button>
                      )}
                      {o.status === 'inProgress' && (
                        <button className={btn.primary} onClick={() => finish(o)}>
                          {t('orders.finish')}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
                    {t('orders.consumes')}{' '}
                    {explodeBom(o.sku)
                      .map((c) => `${f.qty(Math.round(c.qty * o.qty * 100) / 100)} ${ITEM_BY_SKU[c.sku].unit === 'kg' ? 'kg' : t('orders.units')} ${f.item(c.sku)}`)
                      .join(' · ')}
                  </p>
                  {short.length > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {t('orders.shortage', { list: short.map((x) => `${f.item(x.sku)} (${f.qty(x.have)} / ${f.qty(x.need)})`).join(', ') })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <MoreButton pager={pager} />
      </Card>

      <Card variant="bordered" padding="md" className="lg:col-span-3 min-w-0">
        <SectionHeader title={t('mrp.title')} subtitle={t('mrp.subtitle')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-semibold uppercase text-secondary-500 mb-2">{t('mrp.buyTitle')}</h4>
            <div className="space-y-2">
              {mrp.buy.map((m) => {
                const po = openPoFor(m.sku, 'bog');
                return (
                  <div key={m.sku} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">{f.item(m.sku)}</p>
                      <p className="text-[11px] text-secondary-500">{t('mrp.buyLine', { have: f.qty(m.have), required: f.qty(m.required), after: f.qty(Math.round(m.after * 100) / 100), reorder: f.qty(m.reorder) })}</p>
                    </div>
                    {!m.shortfall ? (
                      <Badge variant="success">{t('mrp.covered')}</Badge>
                    ) : po ? (
                      <Badge variant="info">{t('mrp.poOpen', { doc: po.no })}</Badge>
                    ) : (
                      <button className={btn.primary} onClick={() => createPo(m.sku, 'bog', m.after, current.avgCost[m.sku], 'mrp', m.qty)}>
                        {t('mrp.createPo', { qty: f.qty(m.qty) })}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase text-secondary-500 mb-2">{t('mrp.produceTitle')}</h4>
            <div className="space-y-2">
              {mrp.produce.map((m) => (
                <div key={m.sku} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">{f.item(m.sku)}</p>
                    <p className="text-[11px] text-secondary-500">{t('mrp.produceLine', { have: f.qty(m.have), planned: f.qty(m.planned), reorder: f.qty(m.reorder) })}</p>
                  </div>
                  {m.suggest ? (
                    <button className={btn.primary} onClick={() => setCreating({ sku: m.sku, qty: m.suggest })}>
                      {t('mrp.createOp', { qty: f.qty(m.suggest) })}
                    </button>
                  ) : (
                    <Badge variant="success">{t('mrp.covered')}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Note>{t('mrp.note')}</Note>
        </div>
      </Card>

      {creating && <OpForm initial={creating} onClose={() => setCreating(null)} />}
    </div>
  );
}

function BomNode({ node, depth, factor, avg }: { node: BomComponent; depth: number; factor: number; avg: Record<string, number> }) {
  const t = useTranslations('demoErp.manufacturing');
  const f = useFmt();
  const [open, setOpen] = useState(true);
  const ph = node.phantom;
  const qty = node.qty * factor;
  const unit = ph ? ph.unit : ITEM_BY_SKU[node.sku].unit;
  const name = ph ? (f.locale === 'en' ? ph.nameEn : ph.name) : f.item(node.sku);
  // Los componentes de un subensamble están expresados por unidad del subensamble
  const cost = ph ? ph.components.reduce((a, c) => a + c.qty * (avg[c.sku] || ITEM_BY_SKU[c.sku].cost), 0) * qty : qty * (avg[node.sku] || ITEM_BY_SKU[node.sku].cost);
  return (
    <div className={depth === 1 ? '' : 'ml-4 border-l border-secondary-200 dark:border-secondary-700 pl-3'}>
      <button onClick={() => ph && setOpen((o) => !o)} aria-expanded={ph ? open : undefined} className={`flex items-center gap-2 py-1 w-full text-left rounded px-1 ${ph ? 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50' : 'cursor-default'}`}>
        {ph ? <span className={`text-secondary-500 transition-transform ${open ? 'rotate-90' : ''}`}>▸</span> : <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
        <span className="text-secondary-900 dark:text-white text-sm min-w-0 break-words">
          {name}
          {ph && <span className="ml-1 text-[10px] text-amber-700 dark:text-amber-300">{t('bom.phantom')}</span>}
        </span>
        <span className="ml-auto shrink-0 text-xs text-secondary-500 whitespace-nowrap">
          {Number.isInteger(qty) ? f.qty(qty) : f.dec(qty, 3)} {unit === 'kg' ? 'kg' : t('orders.units')} · {f.money(cost)}
        </span>
      </button>
      {ph && open && (
        <div>
          {ph.components.map((c, i) => (
            <BomNode key={i} node={c} depth={depth + 1} factor={qty} avg={avg} />
          ))}
        </div>
      )}
    </div>
  );
}

function OpForm({ initial, onClose }: { initial: { sku: string; qty: number }; onClose: () => void }) {
  const t = useTranslations('demoErp.manufacturing');
  const tc = useTranslations('demoErp.common');
  const { dispatch, state, ensureOpenPeriod } = useErp();
  const f = useFmt();
  const [sku, setSku] = useState(initial.sku);
  const [qty, setQty] = useState(initial.qty ? String(initial.qty) : '');
  const [error, setError] = useState('');
  const save = () => {
    const q = Math.round(Number(qty));
    if (!q || q <= 0 || q > 50000) return setError(t('form.errorQty'));
    const n = state.counters.OP;
    dispatch({ type: 'createOp', sku, qty: q });
    if (ensureOpenPeriod()) toast(t('periodSwitched'));
    toast.success(t('toasts.created', { doc: `OP-${pad(n)}` }));
    onClose();
  };
  const q = Math.round(Number(qty)) || 0;
  return (
    <Modal
      title={t('form.title')}
      subtitle={t('form.subtitle')}
      onClose={onClose}
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            {tc('cancel')}
          </button>
          <button className={btn.primary} onClick={save}>
            {t('form.save')}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <FieldLabel>{t('bom.product')}</FieldLabel>
          <select className={plainSelectCls} value={sku} onChange={(e) => setSku(e.target.value)}>
            {BOMS.map((b) => (
              <option key={b.sku} value={b.sku}>
                {b.sku} · {f.item(b.sku)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <FieldLabel>{t('form.qty')}</FieldLabel>
          <input className={inputCls} inputMode="numeric" value={qty} placeholder="0" onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ''))} />
        </label>
        {q > 0 && (
          <p className="text-xs text-secondary-600 dark:text-secondary-400">
            {t('orders.consumes')}{' '}
            {explodeBom(sku)
              .map((c) => `${f.qty(Math.round(c.qty * q * 100) / 100)} ${ITEM_BY_SKU[c.sku].unit === 'kg' ? 'kg' : t('orders.units')} ${f.item(c.sku)}`)
              .join(' · ')}
          </p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
