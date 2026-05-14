'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  ComputerDesktopIcon,
  TableCellsIcon,
  ClockIcon,
  CheckCircleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

export interface TableInfo { id: number; seats: number; status: 'free' | 'busy' | 'bill'; waiter?: string }
export interface KdsOrder { id: number; table: number; lines: string[]; createdAt: number; status: 'new' | 'cooking' | 'ready' }
export interface Employee { id: number; name: string; role: string; clockedIn: boolean; hours: number; commission: number }

const tableColor = (s: TableInfo['status']) =>
  s === 'free'
    ? 'bg-green-500/15 border-green-500 text-green-700 dark:text-green-300'
    : s === 'busy'
    ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300'
    : 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300';

const elapsedMin = (ms: number) => Math.max(0, Math.floor((Date.now() - ms) / 60_000));
const kdsColor = (min: number) =>
  min < 5 ? 'border-green-500' : min < 10 ? 'border-amber-500' : 'border-red-500';

export function TablesPanel({
  tables,
  onSelect,
}: {
  tables: TableInfo[];
  onSelect: (id: number) => void;
}) {
  const t = useTranslations('demoPos');
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('tables.title')}</h2>
        <p className="text-sm text-secondary-500">{t('tables.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tables.map((tb) => (
          <Card
            key={tb.id}
            variant="bordered"
            padding="none"
            className={`overflow-hidden border-2 ${tableColor(tb.status)}`}
          >
            <button onClick={() => onSelect(tb.id)} className="w-full text-left p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{t('tables.table', { n: tb.id })}</span>
                <TableCellsIcon className="h-6 w-6 opacity-70" />
              </div>
              <div className="text-xs opacity-80">{t('tables.seats', { n: tb.seats })}</div>
              <Badge variant="default" size="sm" className="mt-2">
                {t(`tables.states.${tb.status}`)}
              </Badge>
              {tb.waiter && (
                <div className="text-[11px] mt-1 opacity-80">
                  {t('tables.assignWaiter')}: {t(`tables.waiters.${tb.waiter}`)}
                </div>
              )}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function KdsPanel({
  orders,
  onAdvance,
  onDeliver,
}: {
  orders: KdsOrder[];
  onAdvance: (id: number) => void;
  onDeliver: (id: number) => void;
}) {
  const t = useTranslations('demoPos');
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('kds.title')}</h2>
        <p className="text-sm text-secondary-500">{t('kds.subtitle')}</p>
      </div>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-secondary-500">
          <ComputerDesktopIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          {t('kds.empty')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {orders.map((o) => {
            const min = elapsedMin(o.createdAt);
            return (
              <Card key={o.id} variant="bordered" padding="none" className={`border-l-4 ${kdsColor(min)}`}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-bold text-secondary-900 dark:text-white">
                        {t('kds.order', { n: o.id })}
                      </div>
                      {o.table > 0 && (
                        <div className="text-xs text-secondary-500">{t('kds.table', { n: o.table })}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={o.status === 'ready' ? 'success' : o.status === 'cooking' ? 'warning' : 'info'}
                        size="sm"
                      >
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
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        {l}
                      </li>
                    ))}
                  </ul>
                  {o.status !== 'ready' ? (
                    <Button size="sm" fullWidth onClick={() => onAdvance(o.id)}>
                      {o.status === 'new' ? '→ ' + t('kds.states.cooking') : t('kds.markReady')}
                    </Button>
                  ) : (
                    <Button size="sm" fullWidth variant="outline" onClick={() => onDeliver(o.id)}>
                      <CheckCircleIcon className="h-4 w-4 mr-1" /> {t('kds.deliver')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReportsPanel() {
  const t = useTranslations('demoPos');
  const data = {
    sales: 1850000,
    tickets: 47,
    avgTicket: 39361,
    cash: 720000,
    card: 880000,
    digital: 250000,
    voids: 2,
    refunds: 1,
    topProduct: 'Hamburguesa BBQ',
  };
  const kpis = [
    { k: 'sales', v: '$' + data.sales.toLocaleString(), accent: 'text-primary-600' },
    { k: 'tickets', v: data.tickets },
    { k: 'avgTicket', v: '$' + data.avgTicket.toLocaleString() },
    { k: 'cash', v: '$' + data.cash.toLocaleString() },
    { k: 'card', v: '$' + data.card.toLocaleString() },
    { k: 'digital', v: '$' + data.digital.toLocaleString() },
  ];
  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('reports.title')}</h2>
        <p className="text-sm text-secondary-500">{t('reports.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {kpis.map((kpi) => (
          <Card key={kpi.k} variant="bordered" padding="sm">
            <div className="text-xs text-secondary-500">{t(`reports.${kpi.k}`)}</div>
            <div className={`text-2xl font-bold mt-1 ${kpi.accent || 'text-secondary-900 dark:text-white'}`}>
              {kpi.v}
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <Card variant="bordered" padding="sm">
          <div className="text-xs text-secondary-500">{t('reports.voids')}</div>
          <div className="text-xl font-bold text-amber-600">{data.voids}</div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="text-xs text-secondary-500">{t('reports.refunds')}</div>
          <div className="text-xl font-bold text-red-600">{data.refunds}</div>
        </Card>
        <Card variant="bordered" padding="sm">
          <div className="text-xs text-secondary-500">{t('reports.topProduct')}</div>
          <div className="text-base font-bold text-secondary-900 dark:text-white">🍔 {data.topProduct}</div>
        </Card>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex items-center gap-1">
          <PrinterIcon className="h-4 w-4" /> {t('reports.printX')}
        </Button>
        <Button variant="danger">{t('reports.closeShift')}</Button>
      </div>
    </div>
  );
}

export function EmployeesPanel({
  employees,
  onPunch,
}: {
  employees: Employee[];
  onPunch: (id: number) => void;
}) {
  const t = useTranslations('demoPos');
  return (
    <div className="max-w-3xl">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('employees.title')}</h2>
      </div>
      <div className="space-y-2">
        {employees.map((e) => (
          <Card key={e.id} variant="bordered" padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold">
              {e.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-secondary-900 dark:text-white">{e.name}</div>
              <div className="text-xs text-secondary-500">{e.role}</div>
            </div>
            <div className="hidden md:block text-right text-xs text-secondary-600 dark:text-secondary-400">
              <div>{t('employees.hours', { h: e.hours.toFixed(1) })}</div>
              <div>{t('employees.commission', { amount: '$' + e.commission.toLocaleString() })}</div>
            </div>
            <Badge variant={e.clockedIn ? 'success' : 'default'} size="sm">
              {e.clockedIn ? t('employees.active') : t('employees.off')}
            </Badge>
            <Button size="sm" variant={e.clockedIn ? 'outline' : 'primary'} onClick={() => onPunch(e.id)}>
              {e.clockedIn ? t('employees.clockOut') : t('employees.clockIn')}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
