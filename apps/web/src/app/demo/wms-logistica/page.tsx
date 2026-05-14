'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  CubeTransparentIcon,
  MapIcon,
  DevicePhoneMobileIcon,
  ArrowUturnLeftIcon,
  BanknotesIcon,
  BoltIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import Badge from '@/components/ui/Badge';
import { Bin, WAREHOUSES, buildBins } from './components/shared';
import {
  WarehouseView,
  ReceivingView,
  PickingView,
  CycleCountView,
  CrossDockView,
  CarriersView,
  DriverView,
  RoutesView,
  TrackingView,
  ReturnsView,
  TplView,
} from './components/views';

type TabId =
  | 'warehouse'
  | 'receiving'
  | 'picking'
  | 'cycleCount'
  | 'crossDock'
  | 'carriers'
  | 'driver'
  | 'routes'
  | 'tracking'
  | 'returns'
  | 'tpl';

type WarehouseId = 'bog01' | 'mde02' | 'bar03';
type PickingMode = 'wave' | 'batch' | 'zone' | 'cluster';

type RmaStatus = 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';
type Rma = { id: string; client: string; date: string; status: RmaStatus };

export default function WmsLogisticaPage() {
  const t = useTranslations('demoWms');
  const [activeTab, setActiveTab] = useState<TabId>('warehouse');
  const [warehouse, setWarehouse] = useState<WarehouseId>('bog01');
  const [tmsOn, setTmsOn] = useState(true);

  const wIndex = WAREHOUSES.findIndex((w) => w.id === warehouse);
  const bins = useMemo(() => buildBins(wIndex + 1), [wIndex]);
  const [hoveredBin, setHoveredBin] = useState<Bin | null>(null);

  const [scans, setScans] = useState<{ code: string; at: string }[]>([]);
  const [scanInput, setScanInput] = useState('');
  const handleScan = () => {
    const code = scanInput.trim();
    if (!code) return;
    setScans((prev) => [{ code, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
    setScanInput('');
  };

  const [confirmedPutaway, setConfirmedPutaway] = useState<Record<number, boolean>>({});

  const [pickingMode, setPickingMode] = useState<PickingMode>('wave');
  const [waveStarted, setWaveStarted] = useState(false);

  const [rmaOrder, setRmaOrder] = useState('');
  const [rmaReason, setRmaReason] = useState<'damaged' | 'wrong' | 'notNeeded' | 'defect'>('damaged');
  const [rmaComments, setRmaComments] = useState('');
  const [rmas, setRmas] = useState<Rma[]>([
    { id: 'RMA-2041', client: 'Cliente Corp.', date: '2026-05-10', status: 'requested' },
    { id: 'RMA-2042', client: 'Tienda Andina', date: '2026-05-11', status: 'approved' },
    { id: 'RMA-2043', client: 'Drogas la 21', date: '2026-05-12', status: 'received' },
    { id: 'RMA-2044', client: 'MarketPro', date: '2026-05-09', status: 'refunded' },
  ]);
  const submitRma = () => {
    if (!rmaOrder.trim()) return;
    const id = `RMA-${2050 + rmas.length}`;
    setRmas((prev) => [
      { id, client: rmaOrder.trim(), date: new Date().toISOString().slice(0, 10), status: 'requested' },
      ...prev,
    ]);
    setRmaOrder('');
    setRmaComments('');
  };

  const [podCaptured, setPodCaptured] = useState<number | null>(null);

  const tabs: { id: TabId; icon: any; label: string }[] = [
    { id: 'warehouse', icon: BuildingStorefrontIcon, label: t('tabs.warehouse') },
    { id: 'receiving', icon: ArchiveBoxIcon, label: t('tabs.receiving') },
    { id: 'picking', icon: ClipboardDocumentCheckIcon, label: t('tabs.picking') },
    { id: 'cycleCount', icon: ChartBarIcon, label: t('tabs.cycleCount') },
    { id: 'crossDock', icon: ArrowsRightLeftIcon, label: t('tabs.crossDock') },
    { id: 'carriers', icon: TruckIcon, label: t('tabs.carriers') },
    { id: 'driver', icon: DevicePhoneMobileIcon, label: t('tabs.driver') },
    { id: 'routes', icon: MapIcon, label: t('tabs.routes') },
    { id: 'tracking', icon: BoltIcon, label: t('tabs.tracking') },
    { id: 'returns', icon: ArrowUturnLeftIcon, label: t('tabs.returns') },
    { id: 'tpl', icon: BanknotesIcon, label: t('tabs.tpl') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-stone-600 to-stone-800 p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm text-white shadow-lg">
                <CubeTransparentIcon className="h-6 w-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                {t('pageTitle')}
              </h1>
            </div>
            <p className="mt-2 text-lg text-stone-100/90 max-w-2xl">{t('pageSubtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success" className="gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {t('statusLive')}
            </Badge>
            <button
              onClick={() => setTmsOn((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-sm text-white"
            >
              <span className="text-white/90">{t('tms.label')}</span>
              <span
                className={`w-9 h-5 rounded-full transition-colors ${
                  tmsOn ? 'bg-primary-500' : 'bg-white/30'
                }`}
              >
                <span
                  className={`block w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                    tmsOn ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </span>
              <span className="text-xs font-medium text-white/80">
                {tmsOn ? t('tms.on') : t('tms.off')}
              </span>
            </button>
          </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {WAREHOUSES.map((w) => {
            const active = w.id === warehouse;
            return (
              <button
                key={w.id}
                onClick={() => setWarehouse(w.id)}
                className={`text-left rounded-2xl border transition-all p-4 shadow-sm hover:shadow-lg ${
                  active
                    ? 'border-stone-500 bg-stone-50 dark:bg-stone-900/30 shadow-md'
                    : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-secondary-500 dark:text-secondary-400">
                      {t(`warehouses.list.${w.id}.city`)}
                    </div>
                    <div className="font-semibold text-secondary-900 dark:text-white">
                      {t(`warehouses.list.${w.id}.name`)}
                    </div>
                    <div className="text-xs text-secondary-500 mt-0.5">
                      {t(`warehouses.list.${w.id}.type`)}
                    </div>
                  </div>
                  {active && (
                    <Badge variant="primary" size="sm">
                      {t('warehouses.active')}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-secondary-500">{t('warehouses.occupancy')}</div>
                    <div className={`font-semibold ${w.occupancy > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {w.occupancy}%
                    </div>
                  </div>
                  <div>
                    <div className="text-secondary-500">{t('warehouses.picksDay')}</div>
                    <div className="font-semibold text-secondary-900 dark:text-white">
                      {w.picksDay.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-secondary-500">{t('warehouses.accuracy')}</div>
                    <div className="font-semibold text-emerald-600">{w.accuracy}%</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-secondary-500">
                  {w.skus.toLocaleString()} {t('warehouses.skus')}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mb-6 border-b border-secondary-200 dark:border-secondary-700 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-stone-600 text-stone-700 dark:text-stone-300 font-semibold'
                    : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'warehouse' && (
            <WarehouseView t={t} bins={bins} hoveredBin={hoveredBin} setHoveredBin={setHoveredBin} />
          )}
          {activeTab === 'receiving' && (
            <ReceivingView
              t={t}
              scans={scans}
              scanInput={scanInput}
              setScanInput={setScanInput}
              handleScan={handleScan}
              confirmedPutaway={confirmedPutaway}
              setConfirmedPutaway={setConfirmedPutaway}
            />
          )}
          {activeTab === 'picking' && (
            <PickingView
              t={t}
              mode={pickingMode}
              setMode={setPickingMode}
              waveStarted={waveStarted}
              setWaveStarted={setWaveStarted}
            />
          )}
          {activeTab === 'cycleCount' && <CycleCountView t={t} />}
          {activeTab === 'crossDock' && <CrossDockView t={t} />}
          {activeTab === 'carriers' && <CarriersView t={t} />}
          {activeTab === 'driver' && (
            <DriverView t={t} podCaptured={podCaptured} setPodCaptured={setPodCaptured} />
          )}
          {activeTab === 'routes' && <RoutesView t={t} />}
          {activeTab === 'tracking' && <TrackingView t={t} />}
          {activeTab === 'returns' && (
            <ReturnsView
              t={t}
              rmaOrder={rmaOrder}
              setRmaOrder={setRmaOrder}
              rmaReason={rmaReason}
              setRmaReason={setRmaReason}
              rmaComments={rmaComments}
              setRmaComments={setRmaComments}
              rmas={rmas}
              submitRma={submitRma}
            />
          )}
          {activeTab === 'tpl' && <TplView t={t} />}
        </div>
      </div>
    </div>
  );
}
