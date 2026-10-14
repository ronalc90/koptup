'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapIcon, CheckCircleIcon, CameraIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { CITY_BY_ID, WAREHOUSE_BY_ID } from '../lib/catalog';
import { evalRoutes } from '../lib/engine';
import { timeToMinutes } from '../lib/dates';
import { fmtClock, fmtDateTime, fmtNum } from '../lib/format';
import { now, useWms } from '../lib/store';
import type { Order, Shipment } from '../lib/types';
import { Empty, Field, Panel, Pill, Segmented, SimNote, inputCls, selectCls, useT } from './ui';
import { RouteMap, routeStops } from './Routes';

const FAIL_REASONS = ['nobody', 'address', 'refused'] as const;

export default function DriverApp() {
  const t = useT();
  const { state, nav, lang, go } = useWms();
  const w = WAREHOUSE_BY_ID[nav.wh];
  const [vehicle, setVehicle] = useState(0);
  useEffect(() => setVehicle(0), [nav.wh]);
  const route = state.routes[nav.wh];
  const stops = useMemo(() => routeStops(state, nav.wh), [state, nav.wh]);
  const ev = evalRoutes(route.plan, stops, w.vehicles, timeToMinutes(route.start));
  const mine = ev.routes[vehicle]?.stops ?? [];
  const items = mine.map((st) => {
    const o = state.orders.find((x) => x.id === st.order)!;
    const sh = state.shipments.find((s) => s.id === o.shipment)!;
    return { st, o, sh };
  });
  const firstPending = items.find((x) => x.sh.status === 'created' || x.sh.status === 'arrived');
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const active = items.find((x) => x.o.id === openId) ?? firstPending ?? items[0];
  const delivered = items.filter((x) => x.sh.status === 'delivered').length;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
      <Panel title={t('driver.title')} subtitle={t('driver.subtitle')} className="xl:col-span-2">
        <Segmented label={t('driver.vehicle')} value={String(vehicle)} options={w.vehicles.map((v, i) => ({ id: String(i), label: v.id }))} onChange={(v) => setVehicle(Number(v))} />
        <div className="mt-4">
          <RouteMap plan={route.plan.map((seq, i) => (i === vehicle ? seq : []))} stops={stops} highlight={active?.o.id} />
        </div>
        <SimNote className="mt-3">{t('driver.note')}</SimNote>
        <Button size="sm" variant="ghost" className="mt-2" onClick={() => go('routes')}>
          {t('driver.toRoutes')}
        </Button>
      </Panel>

      <div className="xl:col-span-3">
        <div className="mx-auto max-w-md rounded-[2rem] border-[10px] border-secondary-900 bg-secondary-50 shadow-xl dark:border-secondary-700 dark:bg-secondary-900">
          <div className="rounded-t-[1.4rem] bg-stone-700 px-4 py-3 text-white">
            <div className="text-xs opacity-80">{t('driver.appName')}</div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">{w.vehicles[vehicle]?.id}</span>
              <span className="text-xs">{t('driver.progress', { done: delivered, total: items.length })}</span>
            </div>
          </div>
          <div className="max-h-[720px] space-y-3 overflow-y-auto p-3 text-sm">
            {items.length === 0 ? (
              <Empty>{t('driver.none')}</Empty>
            ) : (
              <>
                <ol className="space-y-1.5">
                  {items.map(({ st, o, sh }, k) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => setOpenId(o.id)}
                        aria-pressed={active?.o.id === o.id}
                        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left ${active?.o.id === o.id ? 'border-stone-600 bg-white dark:bg-secondary-800' : 'border-transparent bg-white/60 dark:bg-secondary-800/50'}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-800 dark:bg-stone-700 dark:text-white">{k + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{o.address}</span>
                          <span className="block text-xs text-secondary-500">
                            {o.customer} · {t('driver.eta', { time: fmtClock(st.arrive, lang) })}
                          </span>
                        </span>
                        <StatusPill sh={sh} />
                      </button>
                    </li>
                  ))}
                </ol>
                {active && <StopDetail key={active.o.id} item={active} onDone={() => setOpenId(undefined)} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ sh }: { sh: Shipment }) {
  const t = useT();
  const tone = sh.status === 'delivered' ? 'success' : sh.status === 'exception' ? 'danger' : sh.status === 'arrived' ? 'warning' : 'default';
  return <Pill tone={tone}>{sh.status === 'created' ? t('driver.pendingStatus') : t(`tracking.statuses.${sh.status}`)}</Pill>;
}

function StopDetail({ item, onDone }: { item: { st: { arrive: number; late: boolean }; o: Order; sh: Shipment }; onDone: () => void }) {
  const t = useT();
  const { lang, today, dispatch, notify } = useWms();
  const { st, o, sh } = item;
  const [mode, setMode] = useState<'idle' | 'pod' | 'fail'>('idle');
  const [receiver, setReceiver] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [reason, setReason] = useState<(typeof FAIL_REASONS)[number]>('nobody');
  const city = CITY_BY_ID[o.city];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.address}, ${city?.name ?? ''}, Colombia`)}`;

  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
      <div className="text-xs text-secondary-500">
        {o.id} · {sh.id}
      </div>
      <div className="text-base font-semibold">{o.customer}</div>
      <div>
        {o.address}, {city?.name}
      </div>
      <div className={`text-xs ${st.late ? 'font-semibold text-red-600' : 'text-secondary-500'}`}>
        {t('driver.window', { from: fmtClock(o.stop?.from ?? 480, lang), to: fmtClock(o.stop?.to ?? 1080, lang), eta: fmtClock(st.arrive, lang) })}
      </div>
      <div className="text-xs text-secondary-500">{t('driver.package', { kg: fmtNum(sh.weightKg, lang, 2), box: sh.box })}</div>

      {sh.status === 'delivered' && sh.pod ? (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
          <div className="flex items-center gap-1 font-semibold">
            <CheckCircleIcon className="h-4 w-4" /> {t('driver.deliveredTo', { name: sh.pod.name, at: fmtDateTime(sh.pod.at, today, lang) })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sh.pod.signature && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sh.pod.signature} alt={t('driver.signatureAlt')} className="h-16 rounded border border-emerald-300 bg-white" />
            )}
            {sh.pod.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sh.pod.photo} alt={t('driver.photoAlt')} className="h-16 rounded border border-emerald-300 object-cover" />
            )}
          </div>
        </div>
      ) : sh.status === 'exception' ? (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-200">{t('driver.failed', { reason: t(`driver.reasons.${sh.failReason ?? 'nobody'}`) })}</div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              dispatch({ type: 'driver.retry', shipment: sh.id, at: now() });
              notify(t('driver.retried'));
            }}
          >
            {t('driver.retry')}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1 rounded-lg border border-secondary-300 px-3 py-1.5 text-sm font-medium hover:bg-secondary-50 dark:border-secondary-600 dark:hover:bg-secondary-700">
              <MapIcon className="h-4 w-4" /> {t('driver.navigate')}
            </a>
            {sh.status === 'created' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  dispatch({ type: 'driver.arrive', shipment: sh.id, at: now() });
                  notify(t('driver.arrivedToast'));
                }}
              >
                {t('driver.arrived')}
              </Button>
            ) : (
              <Pill tone="warning" className="justify-center">
                {t('driver.onSite')}
              </Pill>
            )}
          </div>
          {mode === 'idle' && (
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" onClick={() => setMode('pod')}>
                {t('driver.deliver')}
              </Button>
              <Button size="sm" variant="danger" onClick={() => setMode('fail')}>
                {t('driver.notDelivered')}
              </Button>
            </div>
          )}
          {mode === 'pod' && (
            <div className="space-y-3 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
              <Field label={t('driver.receiver')}>
                <input className={inputCls} value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder={o.customer} />
              </Field>
              <div>
                <div className="mb-1 text-sm font-medium">{t('driver.signature')}</div>
                <SignaturePad onChange={setSignature} />
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">{t('driver.photo')}</div>
                <PhotoInput value={photo} onChange={setPhoto} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={!receiver.trim() || !signature}
                  onClick={() => {
                    dispatch({ type: 'driver.deliver', shipment: sh.id, pod: { name: receiver.trim().slice(0, 60), at: now(), signature: signature ?? undefined, photo: photo ?? undefined } });
                    notify(t('driver.deliveredToast', { order: o.id }));
                    onDone();
                  }}
                >
                  {t('driver.confirm')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMode('idle')}>
                  {t('common.cancel')}
                </Button>
              </div>
              {(!receiver.trim() || !signature) && <p className="text-xs text-secondary-500">{t('driver.podRequired')}</p>}
            </div>
          )}
          {mode === 'fail' && (
            <div className="space-y-2 rounded-lg border border-red-200 p-3 dark:border-red-800">
              <Field label={t('driver.reason')}>
                <select className={selectCls} value={reason} onChange={(e) => setReason(e.target.value as (typeof FAIL_REASONS)[number])}>
                  {FAIL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`driver.reasons.${r}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    dispatch({ type: 'driver.fail', shipment: sh.id, reason, at: now() });
                    notify(t('driver.failedToast'), 'warn');
                    setMode('idle');
                  }}
                >
                  <XCircleIcon className="mr-1 h-4 w-4" />
                  {t('driver.registerFail')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMode('idle')}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Firma con el dedo o el mouse en un canvas (se guarda como imagen PNG en el navegador). */
function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const t = useT();
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  return (
    <div>
      <canvas
        ref={ref}
        width={300}
        height={110}
        aria-label={t('driver.signatureArea')}
        className="w-full touch-none rounded-lg border border-dashed border-secondary-400 bg-white"
        onPointerDown={(e) => {
          const ctx = ref.current?.getContext('2d');
          if (!ctx) return;
          drawing.current = true;
          ref.current?.setPointerCapture(e.pointerId);
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = ref.current?.getContext('2d');
          if (!ctx) return;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          dirty.current = true;
        }}
        onPointerUp={() => {
          drawing.current = false;
          if (dirty.current && ref.current) onChange(ref.current.toDataURL('image/png'));
        }}
      />
      <button
        type="button"
        className="mt-1 text-xs font-semibold text-secondary-600 hover:underline dark:text-secondary-300"
        onClick={() => {
          const c = ref.current;
          const ctx = c?.getContext('2d');
          if (!c || !ctx) return;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, c.width, c.height);
          dirty.current = false;
          onChange(null);
        }}
      >
        {t('driver.clearSignature')}
      </button>
    </div>
  );
}

/** Foto opcional de la entrega: se reduce a 320 px y se guarda solo en este navegador. */
function PhotoInput({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const t = useT();
  const { notify } = useWms();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" type="button" onClick={() => inputRef.current?.click()}>
        <CameraIcon className="mr-1 h-4 w-4" />
        {value ? t('driver.changePhoto') : t('driver.takePhoto')}
      </Button>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={t('driver.photoAlt')} className="h-12 w-12 rounded object-cover" />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          if (!f.type.startsWith('image/') || f.size > 12 * 1024 * 1024) {
            notify(t('driver.photoError'), 'error');
            return;
          }
          const url = URL.createObjectURL(f);
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1, 320 / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * scale);
            c.height = Math.round(img.height * scale);
            c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
            onChange(c.toDataURL('image/jpeg', 0.7));
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            notify(t('driver.photoError'), 'error');
          };
          img.src = url;
        }}
      />
    </div>
  );
}
