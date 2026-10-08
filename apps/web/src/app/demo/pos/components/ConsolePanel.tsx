'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ArrowsRightLeftIcon, ExclamationTriangleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { PRESETS } from './data';
import type { PosStore } from './usePosStore';
import { inputCls, selectCls, useFmt } from './ui';

/** Consola central: ventas por sede, existencias de todas las sedes, traslados y precio central. */
export function ConsolePanel({ store, notify }: { store: PosStore; notify: (m: string, tone?: 'ok' | 'error') => void }) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const { preset, data, state } = store;
  const p = PRESETS[preset];
  const [onlyLow, setOnlyLow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [priceStr, setPriceStr] = useState('');
  const [tr, setTr] = useState({ productId: p.products[0].id, from: p.sedes[0].id, to: p.sedes[1].id, qty: '' });
  const [trErr, setTrErr] = useState<string | null>(null);

  const product = p.products.find((x) => x.id === tr.productId) ?? p.products[0];
  const rows = p.sedes.map((s) => {
    const mine = data.sales.filter((x) => x.sede === s.id && !x.refunded);
    const myTotal = mine.reduce((a, x) => a + x.total, 0);
    const low = p.products.filter((pr) => (data.stock[s.id]?.[pr.id] ?? 0) <= pr.min).length;
    const queued = data.sales.filter((x) => x.sede === s.id && x.status === 'queued').length;
    return { s, mine: mine.length, myTotal, low, queued, shiftOpen: data.shifts[s.id]?.open };
  });
  const totalDay = rows.reduce((a, r) => a + r.myTotal + r.s.otherTills.total, 0);
  const products = p.products.filter((pr) => !onlyLow || p.sedes.some((s) => (data.stock[s.id]?.[pr.id] ?? 0) <= pr.min));

  const doTransfer = () => {
    setTrErr(null);
    const qty = Number(tr.qty.replace(',', '.'));
    if (state.offline) return setTrErr(t('console.transfer.errors.offline'));
    if (tr.from === tr.to) return setTrErr(t('console.transfer.errors.same'));
    if (!Number.isFinite(qty) || qty <= 0 || (!product.byWeight && !Number.isInteger(qty))) return setTrErr(t('console.transfer.errors.qty'));
    const have = data.stock[tr.from]?.[tr.productId] ?? 0;
    if (qty > have) return setTrErr(t('console.transfer.errors.stock', { n: f.qty(have, product.byWeight) }));
    if (store.transfer(tr.productId, tr.from, tr.to, qty)) {
      notify(t('console.transfer.done', { qty: f.qty(qty, product.byWeight), name: product.name }));
      setTr({ ...tr, qty: '' });
    }
  };

  const savePrice = (id: string) => {
    const v = Number(priceStr);
    if (!Number.isFinite(v) || v < 100 || v > 10_000_000) {
      notify(t('console.prices.invalid'), 'error');
      return;
    }
    store.setPrice(id, v);
    setEditing(null);
    notify(t('console.prices.saved'));
  };

  const sedeName = (id: string) => p.sedes.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{t('console.title', { business: p.business.name })}</h2>
        <p className="text-sm text-secondary-500">{t('console.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {rows.map((r) => (
          <Card key={r.s.id} variant="bordered" padding="sm" className={r.s.id === store.sede ? 'ring-2 ring-fuchsia-500' : ''}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-secondary-900 dark:text-white truncate">{r.s.name}</h3>
                <p className="text-[11px] text-secondary-500">{r.s.id === store.sede ? t('console.current') : r.s.address}</p>
              </div>
              <Badge size="sm" variant={r.shiftOpen ? 'success' : 'default'}>
                {r.shiftOpen ? t('console.open') : t('console.closed')}
              </Badge>
            </div>
            <dl className="text-sm space-y-1">
              <div className="flex justify-between gap-2">
                <dt className="text-secondary-600 dark:text-secondary-400">{t('console.myTill')}</dt>
                <dd>{t('console.salesValue', { n: r.mine, amount: f.money(r.myTotal) })}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-secondary-600 dark:text-secondary-400">{t('console.otherTills')}</dt>
                <dd>{t('console.salesValue', { n: r.s.otherTills.tickets, amount: f.money(r.s.otherTills.total) })}</dd>
              </div>
              <div className="flex justify-between gap-2 font-semibold border-t border-secondary-200 dark:border-secondary-700 pt-1">
                <dt>{t('console.dayTotal')}</dt>
                <dd>{f.money(r.myTotal + r.s.otherTills.total)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
              {r.low > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                  {t('console.lowStock', { n: r.low })}
                </span>
              )}
              {r.queued > 0 && <span className="text-amber-700 dark:text-amber-300">{t('toolbar.queued', { n: r.queued })}</span>}
            </div>
            {r.s.id !== store.sede && (
              <button type="button" onClick={() => store.setSede(r.s.id)} className="mt-2 text-xs text-primary-700 dark:text-primary-300 underline">
                {t('console.switch')}
              </button>
            )}
          </Card>
        ))}
      </div>
      <p className="text-sm text-secondary-700 dark:text-secondary-300">
        {t('console.chainTotal', { amount: f.money(totalDay) })} <span className="text-[11px] text-secondary-500">{t('console.otherTillsNote')}</span>
      </p>

      <Card variant="bordered" padding="none">
        <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 border-b border-secondary-200 dark:border-secondary-800">
          <div>
            <h3 className="font-semibold text-secondary-900 dark:text-white">{t('console.stockTitle')}</h3>
            <p className="text-[11px] text-secondary-500">{t('console.stockHint')}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
            {t('console.onlyLow')}
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-800">
                <th className="font-medium p-2 sm:px-4">{t('console.product')}</th>
                <th className="font-medium p-2">{t('console.price')}</th>
                {p.sedes.map((s) => (
                  <th key={s.id} className="font-medium p-2 text-right">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((pr) => (
                <tr key={pr.id} className="border-b border-secondary-100 dark:border-secondary-800/70">
                  <td className="p-2 sm:px-4">
                    <span aria-hidden="true">{pr.emoji}</span> {pr.name}
                    <span className="block text-[10px] text-secondary-500">{t('console.minLabel', { n: f.qty(pr.min, pr.byWeight) })}</span>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {editing === pr.id ? (
                      <span className="flex items-center gap-1">
                        <input
                          type="number"
                          min={100}
                          value={priceStr}
                          onChange={(e) => setPriceStr(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
                          onKeyDown={(e) => e.key === 'Enter' && savePrice(pr.id)}
                          aria-label={t('console.prices.label', { name: pr.name })}
                          className={`${inputCls} !w-28 !py-1`}
                        />
                        <Button size="sm" onClick={() => savePrice(pr.id)}>
                          {t('common.save')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                          {t('common.cancel')}
                        </Button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(pr.id);
                          setPriceStr(String(store.priceOf(pr)));
                        }}
                        className="flex items-center gap-1 hover:text-primary-700 dark:hover:text-primary-300"
                        aria-label={t('console.prices.edit', { name: pr.name })}
                      >
                        {f.money(store.priceOf(pr))}
                        {pr.byWeight && '/kg'}
                        <PencilSquareIcon className="h-3.5 w-3.5 opacity-60" />
                        {data.prices[pr.id] !== undefined && <Badge size="sm" variant="primary">{t('console.prices.changed')}</Badge>}
                      </button>
                    )}
                  </td>
                  {p.sedes.map((s) => {
                    const q = data.stock[s.id]?.[pr.id] ?? 0;
                    const low = q <= pr.min;
                    return (
                      <td key={s.id} className={`p-2 text-right whitespace-nowrap ${low ? 'text-red-600 font-semibold' : ''}`}>
                        {f.qty(q, pr.byWeight)}
                        {low && <ExclamationTriangleIcon className="h-3.5 w-3.5 inline ml-1" aria-label={t('console.low')} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="p-3 sm:px-4 text-[11px] text-secondary-500">{t('console.prices.note')}</p>
      </Card>

      <Card variant="bordered" padding="sm">
        <h3 className="font-semibold text-secondary-900 dark:text-white flex items-center gap-2 mb-1">
          <ArrowsRightLeftIcon className="h-5 w-5" />
          {t('console.transfer.title')}
        </h3>
        <p className="text-[11px] text-secondary-500 mb-3">{t('console.transfer.hint')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <select value={tr.productId} onChange={(e) => setTr({ ...tr, productId: e.target.value })} aria-label={t('console.product')} className={`${selectCls} lg:col-span-2`}>
            {p.products.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name}
              </option>
            ))}
          </select>
          <select value={tr.from} onChange={(e) => setTr({ ...tr, from: e.target.value })} aria-label={t('console.transfer.from')} className={selectCls}>
            {p.sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {t('console.transfer.fromOpt', { name: s.name })}
              </option>
            ))}
          </select>
          <select value={tr.to} onChange={(e) => setTr({ ...tr, to: e.target.value })} aria-label={t('console.transfer.to')} className={selectCls}>
            {p.sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {t('console.transfer.toOpt', { name: s.name })}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              value={tr.qty}
              inputMode="decimal"
              onChange={(e) => setTr({ ...tr, qty: e.target.value.replace(/[^0-9.,]/g, '').slice(0, 6) })}
              placeholder={product.byWeight ? 'kg' : t('console.transfer.units')}
              aria-label={t('console.transfer.qty')}
              className={`${inputCls} !w-24`}
            />
            <Button onClick={doTransfer} className="flex-1">
              {t('console.transfer.button')}
            </Button>
          </div>
        </div>
        {trErr && <p className="text-xs text-red-600 mt-2">{trErr}</p>}
        {data.transfers.length > 0 && (
          <ul className="mt-3 text-xs text-secondary-600 dark:text-secondary-400 space-y-1">
            {data.transfers.slice(0, 6).map((x) => {
              const pr = p.products.find((y) => y.id === x.productId);
              return (
                <li key={x.id}>
                  {x.at} · {f.qty(x.qty, pr?.byWeight)} {pr?.name} · {sedeName(x.from)} → {sedeName(x.to)}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
