'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ComputerDesktopIcon, TableCellsIcon, ClockIcon, CheckCircleIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { PRESETS, SELLER_COMMISSION, type Station } from './data';
import { lineAmount } from './engine';
import { orderKey, type KdsOrder, type PosStore } from './usePosStore';
import { OpenTableModal } from './PosModals';
import { employeeName, shortName, useFmt } from './ui';

// ---------------------------------------------------------------------------
// Mesas
// ---------------------------------------------------------------------------

export function TablesPanel({ store, onPick }: { store: PosStore; onPick: (target: string) => void }) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const { preset, sede, data } = store;
  const p = PRESETS[preset];
  const [opening, setOpening] = useState<{ id: number; seats: number } | null>(null);
  const waiters = p.employees
    .filter((e) => e.sede === sede && e.role === 'waiter' && data.staff[e.id]?.clockedIn)
    .map((e) => ({ id: e.id, name: e.name }));
  const counter = data.orders[orderKey(sede, 'counter')];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{t('tables.title')}</h2>
        <p className="text-sm text-secondary-500">{t('tables.subtitle')}</p>
      </div>
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        {(['free', 'busy', 'bill'] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${s === 'free' ? 'bg-green-500' : s === 'busy' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            {t(`tables.states.${s}`)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card variant="bordered" padding="none" className="overflow-hidden border-2 border-secondary-300 dark:border-secondary-600">
          <button type="button" onClick={() => onPick('counter')} className="w-full h-full text-left p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-secondary-900 dark:text-white">{t('ticket.counter')}</span>
              <ShoppingBagIcon className="h-6 w-6 opacity-70" />
            </div>
            <div className="text-xs text-secondary-500">
              {counter?.lines.length ? t('tables.items', { n: counter.lines.length, amount: f.money(counter.lines.reduce((s, l) => s + lineAmount(l), 0)) }) : t('tables.counterHint')}
            </div>
          </button>
        </Card>
        {p.tables.map((tb) => {
          const o = data.orders[orderKey(sede, `t${tb.id}`)];
          const status = !o ? 'free' : o.billRequested ? 'bill' : 'busy';
          const amount = o ? o.lines.reduce((s, l) => s + lineAmount(l), 0) : 0;
          const kdsOpen = data.kds.filter((k) => k.sede === sede && k.target === `t${tb.id}`).length;
          const tone =
            status === 'free'
              ? 'bg-green-500/10 border-green-500 text-green-800 dark:text-green-300'
              : status === 'busy'
                ? 'bg-blue-500/10 border-blue-500 text-blue-800 dark:text-blue-300'
                : 'bg-amber-500/10 border-amber-500 text-amber-800 dark:text-amber-300';
          return (
            <Card key={tb.id} variant="bordered" padding="none" className={`overflow-hidden border-2 ${tone}`}>
              <button
                type="button"
                onClick={() => (o ? onPick(`t${tb.id}`) : setOpening(tb))}
                className="w-full h-full text-left p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl font-bold">{t('tables.table', { n: tb.id })}</span>
                  <TableCellsIcon className="h-6 w-6 opacity-70" />
                </div>
                <div className="text-xs opacity-80">{o?.guests ? t('tables.guestsOf', { n: o.guests, seats: tb.seats }) : t('tables.seats', { n: tb.seats })}</div>
                <Badge variant="default" size="sm" className="mt-2">
                  {t(`tables.states.${status}`)}
                </Badge>
                {o && (
                  <div className="text-[11px] mt-1.5 space-y-0.5 opacity-90">
                    {o.waiterId && <div>{t('ticket.waiter', { name: shortName(employeeName(preset, o.waiterId)) })}</div>}
                    <div>{t('tables.items', { n: o.lines.length, amount: f.money(amount) })}</div>
                    {kdsOpen > 0 && <div>{t('tables.inKitchen', { n: kdsOpen })}</div>}
                  </div>
                )}
                {!o && <div className="text-[11px] mt-1.5 opacity-80">{t('tables.tapToOpen')}</div>}
              </button>
            </Card>
          );
        })}
      </div>
      {opening && (
        <OpenTableModal
          table={opening.id}
          seats={opening.seats}
          waiters={waiters}
          onCancel={() => setOpening(null)}
          onConfirm={(waiterId, guests) => {
            store.openTable(opening.id, waiterId, guests);
            setOpening(null);
            onPick(`t${opening.id}`);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cocina (KDS)
// ---------------------------------------------------------------------------

const kdsBorder = (min: number) => (min < 8 ? 'border-l-green-500' : min < 15 ? 'border-l-amber-500' : 'border-l-red-500');

export function KdsPanel({ store, now }: { store: PosStore; now: number | null }) {
  const t = useTranslations('demoPos');
  const { sede, data } = store;
  const [station, setStation] = useState<Station | 'all'>('all');
  const orders = data.kds
    .filter((k) => k.sede === sede && (station === 'all' || k.station === station))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.number - b.number);
  const elapsed = (k: KdsOrder) => (now && k.createdAt ? Math.max(0, Math.floor((now - k.createdAt) / 60_000)) : k.ageMin);
  const count = (s: KdsOrder['status']) => data.kds.filter((k) => k.sede === sede && k.status === s).length;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{t('kds.title')}</h2>
        <p className="text-sm text-secondary-500">{t('kds.subtitle')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'kitchen', 'bar'] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={station === s}
            onClick={() => setStation(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              station === s ? 'bg-fuchsia-600 text-white' : 'bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300'
            }`}
          >
            {t(`kds.stations.${s}`)}
          </button>
        ))}
        <span className="text-xs text-secondary-500 sm:ml-auto">
          {t('kds.counts', { n: count('new'), p: count('preparing'), r: count('ready') })}
        </span>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-secondary-500">
          <ComputerDesktopIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          {t('kds.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.map((o) => {
            const min = elapsed(o);
            return (
              <Card key={o.id} variant="bordered" padding="none" className={`border-l-4 ${kdsBorder(min)}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-bold text-secondary-900 dark:text-white">{t('kds.order', { n: o.number })}</div>
                      <div className="text-xs text-secondary-500">
                        {o.target === 'counter' ? t('ticket.counter') : t('tables.table', { n: o.target.slice(1) })} · {t(`kds.stations.${o.station}`)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={o.status === 'ready' ? 'success' : o.status === 'preparing' ? 'warning' : 'info'} size="sm">
                        {t(`kds.states.${o.status}`)}
                      </Badge>
                      <span className="text-xs text-secondary-500 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {t('kds.elapsed', { min })}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm text-secondary-700 dark:text-secondary-300 mb-3">
                    {o.lines.map((l, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                  {o.status === 'ready' ? (
                    <Button size="sm" fullWidth variant="outline" onClick={() => store.deliverKds(o.id)} className="gap-1">
                      <CheckCircleIcon className="h-4 w-4" /> {t('kds.deliver')}
                    </Button>
                  ) : (
                    <Button size="sm" fullWidth onClick={() => store.advanceKds(o.id)}>
                      {o.status === 'new' ? t('kds.start') : t('kds.markReady')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-secondary-500 mt-4">{t('kds.note')}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empleados
// ---------------------------------------------------------------------------

export function StaffPanel({ store, notify }: { store: PosStore; notify: (m: string) => void }) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const { preset, sede, data } = store;
  const p = PRESETS[preset];
  const shift = data.shifts[sede];
  const sales = store.shiftSales(sede, shift.number).filter((s) => !s.refunded);
  const people = p.employees.filter((e) => e.sede === sede);

  const metric = (id: string, role: string) => {
    if (role === 'cashier' || role === 'supervisor') {
      const mine = sales.filter((s) => s.cashierId === id);
      return t('staff.metrics.cashier', { n: mine.length, amount: f.money(mine.reduce((a, s) => a + s.total, 0)) });
    }
    if (role === 'seller') {
      const mine = sales.filter((s) => s.sellerId === id);
      const base = mine.reduce((a, s) => a + s.base, 0);
      return t('staff.metrics.seller', { amount: f.money(base), commission: f.money(Math.round(base * SELLER_COMMISSION)), pct: f.locale === 'en' ? '1.5%' : '1,5 %' });
    }
    if (role === 'waiter') {
      const mine = sales.filter((s) => s.waiterId === id);
      const open = Object.entries(data.orders).filter(([k, o]) => k.startsWith(sede + '|t') && o.waiterId === id).length;
      return t('staff.metrics.waiter', { open, n: mine.length, tips: f.money(mine.reduce((a, s) => a + s.tip, 0)) });
    }
    const st: Station = role === 'bartender' ? 'bar' : 'kitchen';
    const pending = data.kds.filter((k) => k.sede === sede && k.station === st).length;
    return t('staff.metrics.station', { n: pending });
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{t('staff.title')}</h2>
        <p className="text-sm text-secondary-500">{t('staff.subtitle', { n: shift.number })}</p>
      </div>
      <div className="space-y-2">
        {people.map((e) => {
          const st = data.staff[e.id];
          return (
            <Card key={e.id} variant="bordered" padding="sm" className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold shrink-0">
                {e.name
                  .split(' ')
                  .map((x) => x[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-[10rem]">
                <div className="font-semibold text-secondary-900 dark:text-white">{e.name}</div>
                <div className="text-xs text-secondary-500">
                  {t(`staff.roles.${e.role}`)} · {st.clockedIn ? t('staff.since', { time: st.since }) : st.lastOut ? t('staff.out', { time: st.lastOut }) : t('staff.notToday')}
                </div>
                <div className="text-xs text-secondary-600 dark:text-secondary-400 mt-0.5">{metric(e.id, e.role)}</div>
              </div>
              <Badge variant={st.clockedIn ? 'success' : 'default'} size="sm">
                {st.clockedIn ? t('staff.active') : t('staff.off')}
              </Badge>
              <Button
                size="sm"
                variant={st.clockedIn ? 'outline' : 'primary'}
                onClick={() => {
                  store.punch(e.id);
                  notify(st.clockedIn ? t('staff.outToast', { name: e.name }) : t('staff.inToast', { name: e.name }));
                }}
              >
                {st.clockedIn ? t('staff.clockOut') : t('staff.clockIn')}
              </Button>
            </Card>
          );
        })}
      </div>
      <p className="text-[11px] text-secondary-500 mt-4">{t('staff.note')}</p>
    </div>
  );
}
