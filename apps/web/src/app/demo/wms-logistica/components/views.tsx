'use client';

import { useState } from 'react';
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  MapIcon,
  PhoneIcon,
  PencilSquareIcon,
  CameraIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Bin, ROTATION_STYLES, STATUS_TONE, PickingMode } from './shared';

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-secondary-100 dark:border-secondary-800 py-1.5">
      <span className="text-secondary-500">{label}</span>
      <span className="font-medium text-secondary-900 dark:text-white">{value}</span>
    </div>
  );
}

export function KpiBox({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
      <div className="text-xs text-secondary-500">{label}</div>
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

/* -------------------- WAREHOUSE -------------------- */
export function WarehouseView({ t, bins, hoveredBin, setHoveredBin }: any) {
  const occupied = bins.filter((b: Bin) => b.rotation !== 'empty' && b.rotation !== 'quarantine').length;
  const quarantine = bins.filter((b: Bin) => b.rotation === 'quarantine').length;
  const empty = bins.filter((b: Bin) => b.rotation === 'empty').length;
  const zones: Bin['zone'][] = ['A', 'B', 'C', 'Q'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card padding="md" className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl">{t('warehouse.title')}</CardTitle>
              <p className="text-sm text-secondary-500 mt-1">{t('warehouse.subtitle')}</p>
            </div>
            <div className="flex gap-2 flex-wrap text-xs">
              {(['high', 'medium', 'low', 'quarantine', 'empty'] as const).map((k) => (
                <span key={k} className="inline-flex items-center gap-1.5">
                  <span className={`inline-block w-3 h-3 rounded ${ROTATION_STYLES[k].split(' ')[0]}`} />
                  {t(`warehouse.legend.${k}`)}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <div className="space-y-4">
          {zones.map((zone) => {
            const zoneBins = bins.filter((b: Bin) => b.zone === zone);
            if (!zoneBins.length) return null;
            return (
              <div key={zone}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={zone === 'Q' ? 'warning' : 'default'} size="sm">{t('warehouse.zone')} {zone}</Badge>
                  <span className="text-xs text-secondary-500">{t(`warehouse.zones.${zone}`)}</span>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {zoneBins.map((bin: Bin) => (
                    <button
                      key={bin.id}
                      onMouseEnter={() => setHoveredBin(bin)}
                      onMouseLeave={() => setHoveredBin(null)}
                      className={`aspect-square rounded border ${ROTATION_STYLES[bin.rotation]} transition-all`}
                      title={bin.id}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <div className="space-y-4">
        <Card padding="md">
          <div className="text-xs uppercase tracking-wide text-secondary-500 mb-3">{t('warehouse.hoverHint')}</div>
          {hoveredBin ? (
            <div className="space-y-2 text-sm">
              <div className="text-lg font-semibold text-secondary-900 dark:text-white">{hoveredBin.id}</div>
              {hoveredBin.rotation === 'empty' ? (
                <Badge variant="default">{t('warehouse.empty')}</Badge>
              ) : (
                <>
                  <Row label={t('warehouse.sku')} value={hoveredBin.sku || '-'} />
                  <Row label={t('warehouse.stock')} value={hoveredBin.stock?.toString() || '-'} />
                  <Row label={t('warehouse.rotation')} value={t(`warehouse.legend.${hoveredBin.rotation}`)} />
                  <Row label={t('warehouse.lastMove')} value={hoveredBin.lastMove || '-'} />
                </>
              )}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-secondary-400 text-sm">{t('warehouse.hoverHint')}</div>
          )}
        </Card>
        <Card padding="md">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <KpiBox label={t('warehouse.kpis.totalBins')} value={bins.length} tone="text-primary-600" />
            <KpiBox label={t('warehouse.kpis.occupied')} value={occupied} tone="text-emerald-600" />
            <KpiBox label={t('warehouse.kpis.available')} value={empty} tone="text-sky-600" />
            <KpiBox label={t('warehouse.kpis.quarantine')} value={quarantine} tone="text-amber-600" />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* -------------------- RECEIVING -------------------- */
const POS = [
  { id: 'PO-9821', supplier: 'Acme Supplies', eta: '08:30', items: 240, status: 'arrived' as const, discrepancy: null as any, qty: 0 },
  { id: 'PO-9822', supplier: 'Global Parts', eta: '09:15', items: 96, status: 'checking' as const, discrepancy: 'missing' as const, qty: 4 },
  { id: 'PO-9823', supplier: 'Andina Foods', eta: '10:00', items: 380, status: 'expected' as const, discrepancy: null, qty: 0 },
  { id: 'PO-9824', supplier: 'Pacific Goods', eta: '07:45', items: 152, status: 'completed' as const, discrepancy: null, qty: 0 },
  { id: 'PO-9825', supplier: 'BogoBox', eta: '11:30', items: 64, status: 'discrepancy' as const, discrepancy: 'damaged' as const, qty: 7 },
];

const PUTAWAY = [
  { idx: 0, sku: 'SKU-8104', desc: 'Auriculares BT', bin: 'A-02-03', score: 0.94, reason: 'highRotation' },
  { idx: 1, sku: 'SKU-8210', desc: 'Caja vino 12u', bin: 'C-04-07', score: 0.88, reason: 'heavy' },
  { idx: 2, sku: 'SKU-8307', desc: 'Cable USB-C', bin: 'A-03-04', score: 0.91, reason: 'affinity' },
  { idx: 3, sku: 'SKU-8418', desc: 'Yogurt 1L', bin: 'A-01-08', score: 0.97, reason: 'fefo' },
];

export function ReceivingView({ t, scans, scanInput, setScanInput, handleScan, confirmedPutaway, setConfirmedPutaway }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card padding="md" className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl">{t('receiving.title')}</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('receiving.subtitle')}</p>
        </CardHeader>
        <div className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-2">{t('receiving.incomingPos')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-secondary-500 border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2">PO</th>
                <th>{t('receiving.supplier')}</th>
                <th>{t('receiving.eta')}</th>
                <th className="text-right">{t('receiving.items')}</th>
                <th>{t('receiving.discrepancies')}</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {POS.map((po) => (
                <tr key={po.id} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 font-mono text-xs">{po.id}</td>
                  <td>{po.supplier}</td>
                  <td>{po.eta}</td>
                  <td className="text-right">{po.items}</td>
                  <td>
                    {po.discrepancy ? (
                      <Badge variant="danger" size="sm">{t(`receiving.discrepancyTypes.${po.discrepancy}`)} · {po.qty}</Badge>
                    ) : (
                      <span className="text-xs text-secondary-400">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <Badge variant={STATUS_TONE[po.status] as any} size="sm">{t(`receiving.status.${po.status}`)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <CardTitle className="text-base">{t('putaway.title')}</CardTitle>
          <p className="text-sm text-secondary-500 mb-3">{t('putaway.subtitle')}</p>
          <div className="space-y-2">
            {PUTAWAY.map((p) => {
              const done = confirmedPutaway[p.idx];
              return (
                <div key={p.idx} className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{p.sku}</span>
                      <span className="text-sm text-secondary-500">· {p.desc}</span>
                    </div>
                    <div className="text-xs text-secondary-500 mt-0.5 flex items-center gap-1">
                      <SparklesIcon className="h-3 w-3 text-primary-500" />
                      {t(`putaway.reasons.${p.reason}`)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="text-xs text-secondary-500 block">{t('putaway.suggested')}</span>
                      <span className="font-mono font-semibold">{p.bin}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-xs text-secondary-500 block">{t('putaway.score')}</span>
                      <span className="font-semibold text-emerald-600">{(p.score * 100).toFixed(0)}%</span>
                    </div>
                    {done ? (
                      <Badge variant="success" size="sm" className="gap-1">
                        <CheckCircleIcon className="h-4 w-4" /> {t('putaway.confirmed')}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => setConfirmedPutaway({ ...confirmedPutaway, [p.idx]: true })}>{t('putaway.confirm')}</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <Card padding="md">
        <CardTitle className="text-base flex items-center gap-2">
          <MagnifyingGlassIcon className="h-4 w-4" /> {t('receiving.scanTitle')}
        </CardTitle>
        <div className="flex gap-2 mt-3">
          <Input value={scanInput} onChange={(e: any) => setScanInput(e.target.value)} placeholder={t('receiving.scanPlaceholder')} onKeyDown={(e: any) => e.key === 'Enter' && handleScan()} />
          <Button onClick={handleScan}>{t('receiving.scanBtn')}</Button>
        </div>
        <div className="mt-4 text-xs text-secondary-500 uppercase tracking-wide">{t('receiving.scanLog')}</div>
        <div className="mt-2 space-y-1 max-h-72 overflow-y-auto">
          {scans.length === 0 && <div className="text-sm text-secondary-400 py-6 text-center">{t('receiving.scanEmpty')}</div>}
          {scans.map((s: any, i: number) => (
            <div key={i} className="flex justify-between items-center px-3 py-2 rounded bg-secondary-50 dark:bg-secondary-800 text-sm">
              <span className="font-mono">{s.code}</span>
              <span className="text-xs text-secondary-500 flex items-center gap-1">
                <ClockIcon className="h-3 w-3" /> {s.at}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* -------------------- PICKING -------------------- */
export function PickingView({ t, mode, setMode, waveStarted, setWaveStarted }: any) {
  const PICKS = [
    { order: 'ORD-10245', sku: 'SKU-8104', bin: 'A-02-03', qty: 2, status: 'picked' as const },
    { order: 'ORD-10245', sku: 'SKU-8307', bin: 'A-03-04', qty: 1, status: 'picked' as const },
    { order: 'ORD-10246', sku: 'SKU-8210', bin: 'C-04-07', qty: 3, status: 'inProgress' as const },
    { order: 'ORD-10246', sku: 'SKU-8418', bin: 'A-01-08', qty: 1, status: 'pending' as const },
    { order: 'ORD-10247', sku: 'SKU-8602', bin: 'B-02-05', qty: 4, status: 'pending' as const },
    { order: 'ORD-10248', sku: 'SKU-8711', bin: 'B-03-02', qty: 2, status: 'pending' as const },
  ];
  const modes: PickingMode[] = ['wave', 'batch', 'zone', 'cluster'];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card padding="md" className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl">{t('picking.title')}</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('picking.subtitle')}</p>
        </CardHeader>
        <div className="text-xs text-secondary-500 mb-2">{t('picking.modeLabel')}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`p-3 rounded-lg text-left text-sm border transition-all ${
                mode === m ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:border-primary-300'
              }`}
            >
              <div className="font-semibold text-secondary-900 dark:text-white">{t(`picking.modes.${m}`)}</div>
              <div className="text-xs text-secondary-500 mt-1">{t(`picking.modeDesc.${m}`)}</div>
            </button>
          ))}
        </div>

        <div className="text-sm font-semibold mb-2">{t('picking.pickList')}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2">#</th>
                <th>{t('picking.order')}</th>
                <th>{t('picking.sku')}</th>
                <th>{t('picking.bin')}</th>
                <th className="text-right">{t('picking.qty')}</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {PICKS.map((p, i) => (
                <tr key={i} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 text-secondary-500">{i + 1}</td>
                  <td className="font-mono text-xs">{p.order}</td>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td className="font-mono text-xs">{p.bin}</td>
                  <td className="text-right">{p.qty}</td>
                  <td className="text-right">
                    <Badge variant={STATUS_TONE[p.status] as any} size="sm">{t(`picking.status.${p.status}`)}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <CardTitle className="text-base">{t('picking.route')}</CardTitle>
        <div className="mt-3 relative h-48 rounded-lg bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-800 dark:to-secondary-900 border border-secondary-200 dark:border-secondary-700 overflow-hidden">
          <svg viewBox="0 0 240 180" className="w-full h-full">
            <path d="M 20 150 Q 60 30 100 80 T 180 50 L 220 130" stroke="#10b981" strokeWidth="3" fill="none" strokeDasharray="6 4" />
            {[[20, 150], [70, 60], [100, 80], [140, 40], [180, 50], [220, 130]].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="8" fill="#0ea5e9" stroke="white" strokeWidth="2" />
                <text x={x} y={y + 3} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">{i + 1}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <KpiBox label={t('picking.stops')} value={6} tone="text-primary-600" />
          <KpiBox label="km" value={1.42} tone="text-sky-600" />
          <KpiBox label="%" value={37} tone="text-emerald-600" />
        </div>
        <Button fullWidth className="mt-3" onClick={() => setWaveStarted(true)} disabled={waveStarted}>
          {waveStarted ? t('picking.waveStarted') : t('picking.startWave')}
        </Button>
      </Card>
    </div>
  );
}

/* -------------------- CYCLE COUNT -------------------- */
export function CycleCountView({ t }: any) {
  const classes = [
    { id: 'A', color: 'from-rose-500 to-red-600', skus: 320, pct: 70, next: '2026-05-15' },
    { id: 'B', color: 'from-amber-500 to-orange-600', skus: 980, pct: 22, next: '2026-05-25' },
    { id: 'C', color: 'from-emerald-500 to-teal-600', skus: 4500, pct: 8, next: '2026-07-10' },
  ];
  const tasks = [
    { id: 'CC-301', task: 'Zona A · estantería 01', due: '2026-05-15', assignee: 'C. Ramírez', status: 'scheduled' as const },
    { id: 'CC-302', task: 'Zona A · estantería 02', due: '2026-05-15', assignee: 'M. Lozano', status: 'inProgress' as const },
    { id: 'CC-303', task: 'Zona B · estantería 04', due: '2026-05-18', assignee: 'J. Pérez', status: 'scheduled' as const },
    { id: 'CC-304', task: 'Zona C · pallet 12', due: '2026-05-14', assignee: 'A. Suárez', status: 'done' as const },
  ];
  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardHeader>
          <CardTitle className="text-xl">{t('cycleCount.title')}</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('cycleCount.subtitle')}</p>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className={`p-5 rounded-xl bg-gradient-to-br ${c.color} text-white shadow-lg`}>
              <div className="text-xs uppercase tracking-wider opacity-80">{t(`cycleCount.class${c.id}`)}</div>
              <div className="text-3xl font-bold mt-1">{c.skus.toLocaleString()}</div>
              <div className="text-xs opacity-80">{t('cycleCount.skusInClass')}</div>
              <div className="mt-3 text-sm opacity-90">{t(`cycleCount.class${c.id}Desc`)}</div>
              <div className="mt-3 flex justify-between text-xs">
                <div>
                  <div className="opacity-80">{t('cycleCount.valuePct')}</div>
                  <div className="font-bold text-lg">{c.pct}%</div>
                </div>
                <div className="text-right">
                  <div className="opacity-80">{t('cycleCount.nextCount')}</div>
                  <div className="font-semibold">{c.next}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card padding="md">
        <CardTitle className="text-base">{t('cycleCount.schedule')}</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2">#</th>
                <th>{t('cycleCount.task')}</th>
                <th>{t('cycleCount.due')}</th>
                <th>{t('cycleCount.assignee')}</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 font-mono text-xs">{task.id}</td>
                  <td>{task.task}</td>
                  <td>{task.due}</td>
                  <td>{task.assignee}</td>
                  <td className="text-right"><Badge variant={STATUS_TONE[task.status] as any} size="sm">{t(`cycleCount.status.${task.status}`)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------- CROSS-DOCK -------------------- */
export function CrossDockView({ t }: any) {
  const cd = ['inbound', 'sort', 'consolidate', 'outbound'];
  const kit = ['components', 'assemble', 'qc', 'packed'];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card padding="md">
        <CardHeader>
          <CardTitle className="text-xl">{t('crossDock.title')}</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('crossDock.subtitle')}</p>
        </CardHeader>
        <FlowSteps t={t} title={t('crossDock.flowCrossDock')} steps={cd} color="from-sky-500 to-blue-600" />
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <KpiBox label={t('crossDock.activeOrders')} value={28} tone="text-sky-600" />
          <KpiBox label={t('crossDock.completed')} value={142} tone="text-emerald-600" />
          <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
            <div className="text-xs text-secondary-500">{t('crossDock.avgTime')}</div>
            <div className="text-2xl font-bold text-primary-600">2h 14m</div>
          </div>
        </div>
      </Card>
      <Card padding="md">
        <CardHeader>
          <CardTitle className="text-xl">Kitting</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('crossDock.subtitle')}</p>
        </CardHeader>
        <FlowSteps t={t} title={t('crossDock.flowKitting')} steps={kit} color="from-violet-500 to-purple-600" />
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <KpiBox label={t('crossDock.activeOrders')} value={11} tone="text-violet-600" />
          <KpiBox label={t('crossDock.completed')} value={56} tone="text-emerald-600" />
          <div className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
            <div className="text-xs text-secondary-500">{t('crossDock.avgTime')}</div>
            <div className="text-2xl font-bold text-primary-600">38m</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FlowSteps({ t, title, steps, color }: { t: any; title: string; steps: string[]; color: string }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-3">{title}</div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className={`px-3 py-2 rounded-lg bg-gradient-to-br ${color} text-white text-sm font-medium shadow-md min-w-[110px] text-center`}>
              <div className="text-[10px] opacity-80">Step {i + 1}</div>
              <div>{t(`crossDock.steps.${s}`)}</div>
            </div>
            {i < steps.length - 1 && <div className="text-secondary-400 text-xl">→</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- CARRIERS -------------------- */
export function CarriersView({ t }: any) {
  const carriers = [
    { name: 'FedEx', emoji: '✈️', color: 'from-violet-500 to-purple-600', sla: '24-48h', rate: '$ 14.500', coverage: 'international', rating: 4.7, preferred: false },
    { name: 'DHL', emoji: '🚚', color: 'from-yellow-500 to-amber-600', sla: '24-72h', rate: '$ 16.200', coverage: 'international', rating: 4.8, preferred: false },
    { name: 'UPS', emoji: '📦', color: 'from-amber-700 to-yellow-700', sla: '48h', rate: '$ 12.800', coverage: 'international', rating: 4.5, preferred: false },
    { name: 'Servientrega', emoji: '🟢', color: 'from-emerald-500 to-green-600', sla: '24-48h', rate: '$ 8.900', coverage: 'national', rating: 4.4, preferred: true },
    { name: 'Coordinadora', emoji: '🟠', color: 'from-orange-500 to-red-600', sla: '24h', rate: '$ 9.500', coverage: 'national', rating: 4.6, preferred: false },
    { name: 'Inter Rapidísimo', emoji: '🔴', color: 'from-red-500 to-rose-600', sla: '48h', rate: '$ 7.800', coverage: 'national', rating: 4.2, preferred: false },
    { name: 'TCC', emoji: '🟡', color: 'from-yellow-400 to-amber-500', sla: '48-72h', rate: '$ 7.200', coverage: 'national', rating: 4.0, preferred: false },
    { name: 'Mensajería Local', emoji: '🛵', color: 'from-sky-500 to-blue-600', sla: '2-4h', rate: '$ 5.500', coverage: 'lastMile', rating: 4.3, preferred: false },
  ];
  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="text-xl">{t('carriers.title')}</CardTitle>
        <p className="text-sm text-secondary-500 mt-1">{t('carriers.subtitle')}</p>
      </CardHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {carriers.map((c) => (
          <div key={c.name} className="p-4 rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:border-primary-400 transition-all">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl shadow`}>{c.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-secondary-900 dark:text-white">{c.name}</div>
                <div className="text-xs text-secondary-500">{t(`carriers.${c.coverage}`)}</div>
              </div>
              {c.preferred && <Badge variant="primary" size="sm">★</Badge>}
            </div>
            <div className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-secondary-500">{t('carriers.sla')}</span><span className="font-medium">{c.sla}</span></div>
              <div className="flex justify-between"><span className="text-secondary-500">{t('carriers.rate')}</span><span className="font-medium">{c.rate}</span></div>
              <div className="flex justify-between"><span className="text-secondary-500">{t('carriers.rating')}</span><span className="font-medium text-amber-500">★ {c.rating}</span></div>
            </div>
            <Button size="sm" variant="outline" fullWidth className="mt-3">{t('carriers.select')}</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* -------------------- DRIVER -------------------- */
export function DriverView({ t, podCaptured, setPodCaptured }: any) {
  const stops = [
    { i: 1, name: 'Cra 15 #45-22', client: 'María L.', eta: '09:10', status: 'delivered' as const },
    { i: 2, name: 'Cl 80 #12-08', client: 'Juan R.', eta: '09:40', status: 'delivered' as const },
    { i: 3, name: 'Av 7 #112-30', client: 'Sofía C.', eta: '10:15', status: 'arrivedDriver' as const },
    { i: 4, name: 'Cra 50 #100-15', client: 'Andrés P.', eta: '10:45', status: 'pending' as const },
    { i: 5, name: 'Cl 26 #65-90', client: 'Camila G.', eta: '11:20', status: 'pending' as const },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card padding="md" className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl">{t('driver.title')}</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('driver.subtitle')}</p>
        </CardHeader>
        <div className="relative rounded-xl h-64 bg-gradient-to-br from-sky-100 via-emerald-50 to-blue-100 dark:from-sky-900/30 dark:via-emerald-900/20 dark:to-blue-900/30 border border-secondary-200 dark:border-secondary-700 overflow-hidden">
          <svg viewBox="0 0 320 200" className="w-full h-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-secondary-300 dark:text-secondary-700" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="320" height="200" fill="url(#grid)" />
            <path d="M 20 180 L 80 140 L 120 100 L 180 60 L 240 80 L 290 30" stroke="#10b981" strokeWidth="3" fill="none" />
            {[[20, 180, '1'], [80, 140, '2'], [120, 100, '3'], [180, 60, '4'], [240, 80, '5'], [290, 30, 'D']].map(([x, y, n], i) => (
              <g key={i}>
                <circle cx={x as number} cy={y as number} r="10" fill={n === 'D' ? '#0ea5e9' : (i < 3 ? '#22c55e' : '#94a3b8')} stroke="white" strokeWidth="2" />
                <text x={x as number} y={(y as number) + 3} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">{n}</text>
              </g>
            ))}
          </svg>
          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 dark:bg-secondary-900/90 rounded text-xs font-mono">{t('driver.deviceLabel')}</div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">{t('driver.deliveries')}</div>
            <div className="text-xs text-secondary-500">2 {t('driver.completed')} / 5 {t('driver.stops')}</div>
          </div>
          <div className="space-y-2">
            {stops.map((s) => (
              <div key={s.i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-800">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center text-sm font-bold">{s.i}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-secondary-500">{s.client} · ETA {s.eta}</div>
                </div>
                <Badge variant={STATUS_TONE[s.status] as any} size="sm">{t(`driver.status.${s.status === 'arrivedDriver' ? 'arrived' : s.status}`)}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card padding="md">
        <CardTitle className="text-base">{t('driver.next')}</CardTitle>
        <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-primary-500 to-emerald-500 text-white">
          <div className="text-xs opacity-80">Stop #3</div>
          <div className="text-lg font-bold">Av 7 #112-30</div>
          <div className="text-sm opacity-90 mt-1">Sofía C. · ETA 10:15</div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1"><MapIcon className="h-4 w-4" />{t('driver.navigate')}</button>
            <button className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-1"><PhoneIcon className="h-4 w-4" />{t('driver.callClient')}</button>
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm font-semibold mb-2">{t('driver.pod')}</div>
          {podCaptured ? (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5" /> {t('driver.podCaptured')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPodCaptured(1)} className="p-4 rounded-lg border-2 border-dashed border-secondary-300 dark:border-secondary-700 hover:border-primary-400 flex flex-col items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <PencilSquareIcon className="h-6 w-6" />
                {t('driver.captureSignature')}
              </button>
              <button onClick={() => setPodCaptured(2)} className="p-4 rounded-lg border-2 border-dashed border-secondary-300 dark:border-secondary-700 hover:border-primary-400 flex flex-col items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400">
                <CameraIcon className="h-6 w-6" />
                {t('driver.capturePhoto')}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* -------------------- ROUTES VRP -------------------- */
export function RoutesView({ t }: any) {
  const [reopt, setReopt] = useState(false);
  const stops = [
    { id: 1, addr: 'Cra 7 #20', window: '08:00-10:00', load: '12 kg', vehicle: 'V-01' },
    { id: 2, addr: 'Cl 100 #15', window: '09:00-11:00', load: '8 kg', vehicle: 'V-01' },
    { id: 3, addr: 'Av Boyacá #80', window: '10:00-12:00', load: '24 kg', vehicle: 'V-02' },
    { id: 4, addr: 'Cra 50 #110', window: '11:00-13:00', load: '15 kg', vehicle: 'V-02' },
    { id: 5, addr: 'Cl 26 #65', window: '13:00-15:00', load: '6 kg', vehicle: 'V-03' },
    { id: 6, addr: 'Av 19 #140', window: '14:00-16:00', load: '18 kg', vehicle: 'V-03' },
  ];
  return (
    <Card padding="md">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-xl">{t('routes.title')}</CardTitle>
            <p className="text-sm text-secondary-500 mt-1">{t('routes.subtitle')}</p>
          </div>
          <Button onClick={() => setReopt(true)} variant={reopt ? 'secondary' : 'primary'}>
            <ArrowPathRoundedSquareIcon className="h-4 w-4 mr-2" />
            {reopt ? t('routes.optimized') : t('routes.reoptimize')}
          </Button>
        </div>
      </CardHeader>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiBox label={t('routes.vehicles')} value={3} tone="text-sky-600" />
        <KpiBox label={t('routes.stops')} value={stops.length} tone="text-primary-600" />
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
          <div className="text-xs text-emerald-700 dark:text-emerald-300">{t('routes.kmSaved')}</div>
          <div className="text-2xl font-bold text-emerald-600">{reopt ? '32 km' : '— km'}</div>
        </div>
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
          <div className="text-xs text-emerald-700 dark:text-emerald-300">{t('routes.timeSaved')}</div>
          <div className="text-2xl font-bold text-emerald-600">{reopt ? '48 min' : '—'}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-secondary-500 mb-2">{t('routes.before')}</div>
          <div className="rounded-lg h-44 bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 p-2">
            <svg viewBox="0 0 240 140" className="w-full h-full">
              <path d="M 30 100 L 120 30 L 60 80 L 200 50 L 90 110 L 180 100" stroke="#ef4444" strokeWidth="2" fill="none" />
              {[[30, 100], [120, 30], [60, 80], [200, 50], [90, 110], [180, 100]].map(([x, y], i) => (<circle key={i} cx={x} cy={y} r="5" fill="#ef4444" />))}
            </svg>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-secondary-500 mb-2">{t('routes.after')}</div>
          <div className="rounded-lg h-44 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-2">
            <svg viewBox="0 0 240 140" className="w-full h-full">
              <path d="M 30 100 L 60 80 L 90 110 L 120 30 L 180 100 L 200 50" stroke="#10b981" strokeWidth="2" fill="none" />
              {[[30, 100], [60, 80], [90, 110], [120, 30], [180, 100], [200, 50]].map(([x, y], i) => (<circle key={i} cx={x} cy={y} r="5" fill="#10b981" />))}
            </svg>
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-700">
              <th className="py-2">#</th>
              <th>Address</th>
              <th>{t('routes.timeWindow')}</th>
              <th>{t('routes.load')}</th>
              <th>{t('routes.vehicle')}</th>
            </tr>
          </thead>
          <tbody>
            {stops.map((s) => (
              <tr key={s.id} className="border-b border-secondary-100 dark:border-secondary-800">
                <td className="py-2">{s.id}</td>
                <td>{s.addr}</td>
                <td className="text-secondary-500">{s.window}</td>
                <td>{s.load}</td>
                <td><Badge size="sm">{s.vehicle}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* -------------------- TRACKING -------------------- */
export function TrackingView({ t }: any) {
  const shipments = [
    { id: 'GUI-552201', client: 'TechRetail S.A.', carrier: 'Servientrega', dest: 'Bogotá', eta: 'Hoy 16:30', status: 'outForDelivery' as const, events: 4 },
    { id: 'GUI-552202', client: 'Moda Capital', carrier: 'Coordinadora', dest: 'Cali', eta: 'Mañana 10:00', status: 'inTransit' as const, events: 3 },
    { id: 'GUI-552203', client: 'BogoMarket', carrier: 'Inter Rapidísimo', dest: 'Bucaramanga', eta: 'Hoy 14:00', status: 'delivered' as const, events: 5 },
    { id: 'GUI-552204', client: 'Andina Foods', carrier: 'TCC', dest: 'Medellín', eta: 'Mañana 18:00', status: 'picked' as const, events: 1 },
    { id: 'GUI-552205', client: 'Pacific Tech', carrier: 'DHL', dest: 'Lima (PE)', eta: '3 días', status: 'exception' as const, events: 2 },
  ];
  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="text-xl">{t('tracking.title')}</CardTitle>
        <p className="text-sm text-secondary-500 mt-1">{t('tracking.subtitle')}</p>
      </CardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-700">
              <th className="py-2">{t('tracking.tracking')}</th>
              <th>{t('tracking.client')}</th>
              <th>{t('tracking.carrier')}</th>
              <th>{t('tracking.destination')}</th>
              <th>{t('tracking.eta')}</th>
              <th className="text-right">{t('tracking.events')}</th>
              <th className="text-right">{t('tracking.status')}</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-b border-secondary-100 dark:border-secondary-800 hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                <td className="py-2 font-mono text-xs">{s.id}</td>
                <td>{s.client}</td>
                <td>{s.carrier}</td>
                <td>{s.dest}</td>
                <td className="text-secondary-500">{s.eta}</td>
                <td className="text-right">{s.events}</td>
                <td className="text-right">
                  <Badge variant={STATUS_TONE[s.status] as any} size="sm">{t(`tracking.statuses.${s.status}`)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* -------------------- RETURNS -------------------- */
export function ReturnsView({ t, rmaOrder, setRmaOrder, rmaReason, setRmaReason, rmaComments, setRmaComments, rmas, submitRma }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card padding="md">
        <CardHeader>
          <CardTitle className="text-xl">{t('returns.newRma')}</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('returns.subtitle')}</p>
        </CardHeader>
        <div className="space-y-3">
          <Input label={t('returns.orderId')} placeholder={t('returns.orderIdPh')} value={rmaOrder} onChange={(e: any) => setRmaOrder(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">{t('returns.reason')}</label>
            <select value={rmaReason} onChange={(e) => setRmaReason(e.target.value)} className="w-full rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white px-3 py-2">
              {(['damaged', 'wrong', 'notNeeded', 'defect'] as const).map((r) => (
                <option key={r} value={r}>{t(`returns.reasons.${r}`)}</option>
              ))}
            </select>
          </div>
          <Textarea label={t('returns.comments')} placeholder={t('returns.commentsPh')} rows={3} value={rmaComments} onChange={(e: any) => setRmaComments(e.target.value)} />
          <Button fullWidth onClick={submitRma}>{t('returns.submit')}</Button>
        </div>
      </Card>
      <Card padding="md" className="lg:col-span-2">
        <CardTitle className="text-base">{t('returns.list')}</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2">{t('returns.rmaId')}</th>
                <th>{t('returns.client')}</th>
                <th>{t('returns.date')}</th>
                <th className="text-right">{t('returns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {rmas.map((r: any) => (
                <tr key={r.id} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 font-mono text-xs">{r.id}</td>
                  <td>{r.client}</td>
                  <td>{r.date}</td>
                  <td className="text-right"><Badge variant={STATUS_TONE[r.status] as any} size="sm">{t(`returns.statuses.${r.status}`)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------- 3PL -------------------- */
export function TplView({ t }: any) {
  const clients = [
    { name: 'TechRetail S.A.', skus: 1280, orders: 3450, sla: 98.4, bill: 24500 },
    { name: 'Moda Capital', skus: 860, orders: 2100, sla: 96.1, bill: 18200 },
    { name: 'Andina Foods', skus: 420, orders: 1820, sla: 99.0, bill: 14800 },
    { name: 'Pacific Tech', skus: 2050, orders: 980, sla: 97.5, bill: 21400 },
  ];
  const breakdown = [
    { c: 'storage', q: 320, u: 12, t: 3840 },
    { c: 'picking', q: 8400, u: 0.45, t: 3780 },
    { c: 'packing', q: 3450, u: 1.2, t: 4140 },
    { c: 'shipping', q: 3450, u: 3.5, t: 12075 },
    { c: 'returns', q: 142, u: 4.7, t: 667 },
  ];
  const total = breakdown.reduce((a, b) => a + b.t, 0);
  return (
    <div className="space-y-6">
      <Card padding="md">
        <CardHeader>
          <CardTitle className="text-xl">{t('tpl.title')}</CardTitle>
          <p className="text-sm text-secondary-500 mt-1">{t('tpl.subtitle')}</p>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2">{t('tpl.client')}</th>
                <th className="text-right">{t('tpl.skusStored')}</th>
                <th className="text-right">{t('tpl.ordersMonth')}</th>
                <th className="text-right">{t('tpl.slaCompliance')}</th>
                <th className="text-right">{t('tpl.monthlyBill')}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.name} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2 font-medium">{c.name}</td>
                  <td className="text-right">{c.skus.toLocaleString()}</td>
                  <td className="text-right">{c.orders.toLocaleString()}</td>
                  <td className="text-right"><Badge variant={c.sla >= 98 ? 'success' : 'warning'} size="sm">{c.sla}%</Badge></td>
                  <td className="text-right font-semibold">$ {c.bill.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card padding="md">
        <CardTitle className="text-base">{t('tpl.billingBreakdown')} · TechRetail S.A.</CardTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-secondary-500 text-left border-b border-secondary-200 dark:border-secondary-700">
                <th className="py-2">{t('tpl.concept')}</th>
                <th className="text-right">{t('tpl.qty')}</th>
                <th className="text-right">{t('tpl.unit')}</th>
                <th className="text-right">{t('tpl.total')}</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b) => (
                <tr key={b.c} className="border-b border-secondary-100 dark:border-secondary-800">
                  <td className="py-2">{t(`tpl.concepts.${b.c}`)}</td>
                  <td className="text-right">{b.q.toLocaleString()}</td>
                  <td className="text-right">$ {b.u.toLocaleString()}</td>
                  <td className="text-right font-semibold">$ {b.t.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-primary-50 dark:bg-primary-900/30">
                <td className="py-2 font-bold">Total</td>
                <td colSpan={2}></td>
                <td className="text-right font-bold text-primary-600">$ {total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
