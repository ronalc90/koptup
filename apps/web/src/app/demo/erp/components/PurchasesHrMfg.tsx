'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  SparklesIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import { formatMoney, SectionHeader, CountryBadge } from './shared';

export function PurchasesModule({ currencyCode }: { currencyCode: string }) {
  const t = useTranslations('demoErp.purchases');
  const pos = [
    { id: 'PO-2041', supplier: 'TecnoSur SAS', date: '2026-05-10', amount: 28400, flow: [true, true, false], status: 'inReview' as const },
    { id: 'PO-2042', supplier: 'Distrib. Hermes', date: '2026-05-11', amount: 14200, flow: [true, true, true], status: 'approved' as const },
    { id: 'PO-2043', supplier: 'Global Parts MX', date: '2026-05-12', amount: 65500, flow: [true, false, false], status: 'inReview' as const },
    { id: 'PO-2044', supplier: 'Insumos AR', date: '2026-05-13', amount: 8950, flow: [false, false, false], status: 'rejected' as const },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md" className="lg:col-span-2">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="space-y-3">
          {pos.map((po) => (
            <div key={po.id} className="p-4 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:border-primary-400 transition-colors">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-bold text-primary-600 dark:text-primary-400">{po.id}</span>
                    {po.status === 'approved' && <Badge variant="success">{t('approved')}</Badge>}
                    {po.status === 'inReview' && <Badge variant="warning">{t('inReview')}</Badge>}
                    {po.status === 'rejected' && <Badge variant="danger">{t('rejected')}</Badge>}
                  </div>
                  <p className="text-sm text-secondary-900 dark:text-white font-medium">{po.supplier}</p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{po.date}</p>
                </div>
                <span className="text-lg font-bold text-secondary-900 dark:text-white">{formatMoney(po.amount, currencyCode)}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase text-secondary-500 dark:text-secondary-400 mb-1.5 font-semibold">{t('approvalFlow')}</p>
                <div className="flex items-center gap-2">
                  {[t('level1'), t('level2'), t('level3')].map((label, i) => {
                    const done = po.flow[i];
                    const isCurrent = !done && po.flow.slice(0, i).every(Boolean) && po.status !== 'rejected';
                    return (
                      <div key={label} className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            done
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                                ? 'bg-amber-400 text-white animate-pulse'
                                : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-500'
                          }`}
                        >
                          {done ? <CheckCircleIcon className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className="text-xs text-secondary-700 dark:text-secondary-300 truncate">{label}</span>
                        {i < 2 && <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-500' : 'bg-secondary-200 dark:bg-secondary-700'}`} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="bordered" padding="md">
        <div className="flex items-center gap-2 mb-2">
          <DocumentTextIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-secondary-900 dark:text-white">{t('ocrTitle')}</h3>
        </div>
        <Badge variant="info" className="gap-1 mb-3">
          <SparklesIcon className="w-3 h-3" />
          {t('ocrSubtitle')}
        </Badge>
        <div className="space-y-2 text-sm">
          <OcrField label={t('fieldNit')} value="900.484.221-3" />
          <OcrField label={t('fieldDate')} value="2026-05-10" />
          <OcrField label={t('fieldDue')} value="2026-06-09" />
          <OcrField label={t('fieldSubtotal')} value={formatMoney(23866, currencyCode)} />
          <OcrField label={t('fieldTax')} value={formatMoney(4534, currencyCode)} />
          <OcrField label={t('fieldTotal')} value={formatMoney(28400, currencyCode)} bold />
          <OcrField label={t('fieldItems')} value="7" />
        </div>
        <p className="text-[10px] text-secondary-500 dark:text-secondary-500 mt-3 flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {t('extractedAt')}
        </p>
        <Button size="sm" variant="outline" fullWidth className="mt-3 gap-1">
          <PlusCircleIcon className="w-4 h-4" />
          {t('uploadInvoice')}
        </Button>
      </Card>
    </div>
  );
}

function OcrField({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-secondary-100 dark:border-secondary-800 last:border-0">
      <span className="text-xs text-secondary-600 dark:text-secondary-400">{label}</span>
      <span className={`text-xs ${bold ? 'font-bold text-secondary-900 dark:text-white' : 'text-secondary-700 dark:text-secondary-300'}`}>{value}</span>
    </div>
  );
}

export function HrModule({ currencyCode }: { currencyCode: string }) {
  const t = useTranslations('demoErp.hr');
  const employees = [
    { name: 'María Gómez', position: 'CFO', dept: 'Finanzas', salary: 8500, status: 'statusActive' as const, country: 'CO' },
    { name: 'Carlos Ruiz', position: 'Tech Lead', dept: 'Tecnología', salary: 6200, status: 'statusActive' as const, country: 'CO' },
    { name: 'Sofía Pérez', position: 'Sr. Designer', dept: 'Producto', salary: 4800, status: 'statusVacation' as const, country: 'MX' },
    { name: 'Diego Soto', position: 'Account Mgr', dept: 'Ventas', salary: 4200, status: 'statusActive' as const, country: 'AR' },
    { name: 'Laura Vega', position: 'HR Manager', dept: 'RRHH', salary: 5100, status: 'statusActive' as const, country: 'CL' },
  ];
  const onVacation = employees.filter((e) => e.status === 'statusVacation').length;
  const total = employees.length;
  const payroll = employees.reduce((s, e) => s + e.salary, 0);

  const vacations = [
    { name: 'Sofía Pérez', from: '2026-05-10', to: '2026-05-20', days: 10 },
    { name: 'Andrés López', from: '2026-05-22', to: '2026-05-27', days: 5 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase font-semibold">{t('employees')}</p>
        <p className="text-3xl font-bold text-secondary-900 dark:text-white">{total}</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{t('headcount')}</p>
      </Card>
      <Card variant="bordered" padding="md">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase font-semibold">{t('onVacation')}</p>
        <p className="text-3xl font-bold text-secondary-900 dark:text-white">{onVacation}</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{t('statusVacation')}</p>
      </Card>
      <Card variant="bordered" padding="md">
        <p className="text-xs text-secondary-500 dark:text-secondary-400 uppercase font-semibold">{t('payrollMonth')}</p>
        <p className="text-3xl font-bold text-secondary-900 dark:text-white">{formatMoney(payroll, currencyCode)}</p>
        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{t('payrollTitle')}</p>
      </Card>

      <Card variant="bordered" padding="md" className="lg:col-span-2">
        <SectionHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-xs uppercase text-secondary-500 dark:text-secondary-400 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2 pr-3">{t('name')}</th>
                <th className="py-2 pr-3">{t('position')}</th>
                <th className="py-2 pr-3">{t('department')}</th>
                <th className="py-2 pr-3 text-right">{t('salary')}</th>
                <th className="py-2 pl-3"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.name} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2.5 pr-3 text-secondary-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <CountryBadge code={e.country} />
                      {e.name}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-secondary-700 dark:text-secondary-300">{e.position}</td>
                  <td className="py-2.5 pr-3 text-secondary-600 dark:text-secondary-400">{e.dept}</td>
                  <td className="py-2.5 pr-3 text-right text-secondary-900 dark:text-white font-medium">{formatMoney(e.salary, currencyCode)}</td>
                  <td className="py-2.5 pl-3">
                    <Badge variant={e.status === 'statusActive' ? 'success' : 'warning'}>{t(e.status)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card variant="bordered" padding="md">
        <h3 className="font-bold text-secondary-900 dark:text-white mb-3">{t('vacationsTitle')}</h3>
        <div className="space-y-2">
          {vacations.map((v) => (
            <div key={v.name} className="p-2.5 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <p className="font-medium text-sm text-secondary-900 dark:text-white">{v.name}</p>
              <p className="text-xs text-secondary-600 dark:text-secondary-400">
                {v.from} → {v.to} · {v.days} {t('days')}
              </p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="primary" className="flex-1 text-xs">
                  {t('approve')}
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  {t('reject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function ManufacturingModule() {
  const t = useTranslations('demoErp.manufacturing');
  type Node = { name: string; qty: number; children?: Node[] };
  const bom: Node = {
    name: 'Laptop Pro 14"',
    qty: 1,
    children: [
      { name: 'Chasis ensamblado', qty: 1, children: [{ name: 'Carcasa aluminio', qty: 1 }, { name: 'Bisagras', qty: 2 }] },
      { name: 'Motherboard', qty: 1, children: [{ name: 'CPU M3', qty: 1 }, { name: 'RAM 16GB', qty: 2 }, { name: 'SSD 512GB', qty: 1 }] },
      { name: 'Pantalla 14" Retina', qty: 1 },
      { name: 'Batería 70Wh', qty: 1 },
    ],
  };

  const workOrders = [
    { id: 'WO-0451', product: 'Laptop Pro 14"', qty: 50, progress: 78, due: '2026-05-22' },
    { id: 'WO-0452', product: 'Monitor 27" 4K', qty: 120, progress: 42, due: '2026-05-28' },
    { id: 'WO-0453', product: 'Dock Thunderbolt', qty: 80, progress: 15, due: '2026-06-04' },
  ];

  const mrp = [
    { action: 'buy', item: 'CPU M3', qty: 120, reason: 'reasonLow' as const },
    { action: 'produce', item: 'Chasis ensamblado', qty: 50, reason: 'reasonForecast' as const },
    { action: 'transfer', item: 'SSD 512GB', qty: 80, reason: 'reasonLead' as const },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card variant="bordered" padding="md">
        <SectionHeader title={t('bomTitle')} />
        <div className="text-sm">
          <BomNode node={bom} depth={0} qtyLabel={t('qty')} />
        </div>
      </Card>

      <Card variant="bordered" padding="md" className="lg:col-span-2">
        <SectionHeader title={t('workOrders')} />
        <div className="space-y-3">
          {workOrders.map((w) => (
            <div key={w.id} className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700">
              <div className="flex justify-between items-start mb-2 flex-wrap gap-1">
                <div>
                  <span className="font-mono text-xs text-primary-600 dark:text-primary-400">{t('wo')} {w.id}</span>
                  <p className="font-medium text-sm text-secondary-900 dark:text-white">{w.product}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('dueDate')}: {w.due}</p>
                  <p className="text-xs text-secondary-700 dark:text-secondary-300">{t('qtyOrdered')}: {w.qty}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-secondary-100 dark:bg-secondary-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-700" style={{ width: `${w.progress}%` }} />
                </div>
                <span className="text-xs font-semibold text-secondary-700 dark:text-secondary-300 w-10 text-right">{w.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="bordered" padding="md" className="lg:col-span-3">
        <div className="flex items-center gap-2 mb-1">
          <SparklesIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-secondary-900 dark:text-white">{t('mrpTitle')}</h3>
        </div>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('mrpSubtitle')}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {mrp.map((m, i) => {
            const variant = m.action === 'buy' ? 'info' : m.action === 'produce' ? 'success' : 'warning';
            return (
              <div key={i} className="p-3 rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50/40 dark:bg-secondary-800/40">
                <Badge variant={variant} className="mb-2">
                  {t(m.action as any)}
                </Badge>
                <p className="font-medium text-sm text-secondary-900 dark:text-white">{m.item}</p>
                <p className="text-xs text-secondary-600 dark:text-secondary-400">
                  {t('qty')}: <span className="font-semibold">{m.qty}</span>
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                  {t('reason')}: {t(m.reason)}
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function BomNode({ node, depth, qtyLabel }: { node: { name: string; qty: number; children?: any[] }; depth: number; qtyLabel: string }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className={depth === 0 ? '' : 'ml-4 border-l border-secondary-200 dark:border-secondary-700 pl-3'}>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className="flex items-center gap-2 py-1 w-full text-left hover:bg-secondary-50 dark:hover:bg-secondary-800/50 rounded px-1"
      >
        {hasChildren && <span className={`text-secondary-500 transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>}
        {!hasChildren && <span className="w-2 h-2 rounded-full bg-primary-500" />}
        <span className="font-medium text-secondary-900 dark:text-white text-sm">{node.name}</span>
        <span className="ml-auto text-xs text-secondary-500 dark:text-secondary-400">
          {qtyLabel} {node.qty}
        </span>
      </button>
      {hasChildren && open && (
        <div>
          {node.children!.map((c, i) => (
            <BomNode key={i} node={c} depth={depth + 1} qtyLabel={qtyLabel} />
          ))}
        </div>
      )}
    </div>
  );
}
