'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { PrinterIcon, LockClosedIcon, EyeIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { PRESETS, type PayMethod } from './data';
import { buildReport, timeLabel } from './engine';
import type { Closure, PosStore } from './usePosStore';
import { StatusBadge } from './PosModals';
import { Stat, employeeName, printById, useFmt } from './ui';

export function ReportsPanel({
  store,
  notify,
  onView,
  onClose,
  onOpen,
  onViewZ,
}: {
  store: PosStore;
  notify: (m: string) => void;
  onView: (saleId: string) => void;
  onClose: () => void;
  onOpen: () => void;
  onViewZ: (c: Closure) => void;
}) {
  const t = useTranslations('demoPos');
  const f = useFmt();
  const { preset, sede, data } = store;
  const p = PRESETS[preset];
  const sedeObj = p.sedes.find((s) => s.id === sede);
  const shift = data.shifts[sede];
  const sales = store.shiftSales(sede, shift.number);
  const r = buildReport(sales);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const closures = data.closures.filter((c) => c.sede === sede).slice().reverse();
  const isRestaurant = preset === 'restaurant';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">{t('reports.title', { n: shift.number })}</h2>
          <p className="text-sm text-secondary-500">
            {sedeObj?.name} · {t('receipt.cashier', { name: employeeName(preset, shift.cashierId) })} ·{' '}
            {shift.open ? t('reports.openSince', { time: shift.openedAt }) : t('shift.closedShort')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="gap-1"
            onClick={() => {
              notify(t('receipt.printing'));
              printById('pos-x-print');
            }}
          >
            <PrinterIcon className="h-4 w-4" /> {t('reports.printX')}
          </Button>
          {shift.open ? (
            <Button variant="danger" onClick={onClose} className="gap-1">
              <LockClosedIcon className="h-4 w-4" /> {t('reports.closeShift')}
            </Button>
          ) : (
            <Button onClick={onOpen}>{t('shift.openTitle')}</Button>
          )}
        </div>
      </div>

      <div id="pos-x-print" className="space-y-5">
        <p className="hidden print:block font-mono text-xs">
          {p.business.name} · {sedeObj?.name} · {t('reports.title', { n: shift.number })}
        </p>
        {r.count === 0 && r.refundsCount === 0 ? (
          <Card variant="bordered" padding="md" className="text-sm text-secondary-600 dark:text-secondary-400">
            {t('reports.empty')}
          </Card>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label={t('reports.sales')} value={f.money(r.total)} tone="text-primary-600 dark:text-primary-400" sub={isRestaurant ? t('reports.salesSubTips') : undefined} />
          <Stat label={t('reports.docs')} value={r.count} />
          <Stat label={t('reports.avgTicket')} value={f.money(r.avg)} />
          <Stat label={t('shift.expected')} value={f.money(shift.base + r.netCash)} sub={t('reports.expectedSub', { base: f.money(shift.base) })} />
          {isRestaurant && <Stat label={t('reports.tips')} value={f.money(r.tips)} />}
          <Stat label={t('reports.discounts')} value={f.money(r.discounts)} />
          <Stat label={t('reports.voids')} value={shift.voids} tone="text-amber-600" sub={t('reports.voidsSub')} />
          <Stat label={t('reports.refunds')} value={r.refundsCount} tone="text-red-600" sub={f.money(r.refundsTotal)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card variant="bordered" padding="sm">
            <h3 className="font-semibold text-sm text-secondary-900 dark:text-white mb-2">{t('reports.byMethod')}</h3>
            <dl className="text-sm space-y-1">
              {(['cash', 'card', 'qr', 'gift'] as PayMethod[]).map((m) => (
                <div key={m} className="flex justify-between gap-2">
                  <dt className="text-secondary-600 dark:text-secondary-400">{t(`checkout.methods.${m}`)}</dt>
                  <dd className="font-medium">{f.money(r.byMethod[m])}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] text-secondary-500 mt-2">{t('reports.cashNet')}</p>
          </Card>
          <Card variant="bordered" padding="sm">
            <h3 className="font-semibold text-sm text-secondary-900 dark:text-white mb-2">{t('reports.taxes')}</h3>
            {r.taxes.length === 0 ? (
              <p className="text-sm text-secondary-500">—</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-secondary-500 text-left">
                    <th className="font-medium pb-1">{t('reports.rate')}</th>
                    <th className="font-medium pb-1 text-right">{t('ticket.base')}</th>
                    <th className="font-medium pb-1 text-right">{t('reports.tax')}</th>
                  </tr>
                </thead>
                <tbody>
                  {r.taxes.map((x) => (
                    <tr key={x.kind}>
                      <td className="py-0.5">{t(`tax.${x.kind}`)}</td>
                      <td className="py-0.5 text-right">{f.money(x.base)}</td>
                      <td className="py-0.5 text-right">{f.money(x.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card variant="bordered" padding="sm">
            <h3 className="font-semibold text-sm text-secondary-900 dark:text-white mb-2">{t('reports.top')}</h3>
            {r.top.length === 0 ? (
              <p className="text-sm text-secondary-500">—</p>
            ) : (
              <ol className="text-sm space-y-1">
                {r.top.map((x) => (
                  <li key={x.name} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">
                      {x.emoji} {x.name} <span className="text-secondary-500">· {f.qty(Math.round(x.qty * 1000) / 1000, x.byWeight)}</span>
                    </span>
                    <span className="font-medium shrink-0">{f.money(x.amount)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <Card variant="bordered" padding="none">
        <div className="p-3 sm:p-4 border-b border-secondary-200 dark:border-secondary-800">
          <h3 className="font-semibold text-secondary-900 dark:text-white">{t('reports.salesList', { n: sales.length })}</h3>
          <p className="text-[11px] text-secondary-500">{t('reports.salesListHint')}</p>
        </div>
        {sales.length === 0 ? (
          <p className="p-4 text-sm text-secondary-500">{t('reports.noSales')}</p>
        ) : (
          <ul className="divide-y divide-secondary-200 dark:divide-secondary-800">
            {sales
              .slice()
              .reverse()
              .map((s) => (
                <li key={s.id} className="p-3 sm:px-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                  <span className="text-secondary-500 shrink-0 whitespace-nowrap">{timeLabel(s.createdAt, f.locale)}</span>
                  <span className="font-mono text-xs">{s.number}</span>
                  <span className="text-xs text-secondary-500">{s.docType === 'pos' ? t('reports.docPosShort') : t('reports.docInvoiceShort')}</span>
                  <span className={`font-semibold ${s.refunded ? 'line-through text-secondary-400' : 'text-secondary-900 dark:text-white'}`}>{f.money(s.total)}</span>
                  <StatusBadge status={s.status} />
                  {s.refunded && <Badge size="sm" variant="danger">{t('reports.refundedBadge', { nc: s.creditNote ?? '' })}</Badge>}
                  <span className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => onView(s.id)} className="flex items-center gap-1 text-xs text-primary-700 dark:text-primary-300 hover:underline">
                      <EyeIcon className="h-4 w-4" /> {t('reports.view')}
                    </button>
                    {!s.refunded && shift.open && (
                      confirmId === s.id ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs">{t('reports.refundConfirm')}</span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              store.refundSale(s.id);
                              setConfirmId(null);
                              notify(t('reports.refundDone', { n: s.number }));
                            }}
                          >
                            {t('common.yes')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                            {t('common.no')}
                          </Button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => setConfirmId(s.id)} className="flex items-center gap-1 text-xs text-red-600 hover:underline">
                          <ArrowUturnLeftIcon className="h-4 w-4" /> {t('reports.refund')}
                        </button>
                      )
                    )}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>

      {closures.length > 0 && (
        <Card variant="bordered" padding="sm">
          <h3 className="font-semibold text-sm text-secondary-900 dark:text-white mb-2">{t('reports.closures')}</h3>
          <ul className="text-sm divide-y divide-secondary-200 dark:divide-secondary-800">
            {closures.map((c) => (
              <li key={c.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium">{t('z.title', { n: c.z })}</span>
                <span className="text-secondary-500 text-xs">{timeLabel(c.closedAt, f.locale)}</span>
                <span>{f.money(c.report.total)}</span>
                <span className={`text-xs ${c.diff === 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}>
                  {t('shift.diff')}: {f.money(c.diff)}
                </span>
                <button type="button" onClick={() => onViewZ(c)} className="ml-auto text-xs text-primary-700 dark:text-primary-300 hover:underline">
                  {t('reports.view')}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
