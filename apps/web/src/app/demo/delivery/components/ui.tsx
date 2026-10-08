'use client';

import { useEffect, useRef, type ComponentType, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import type { Place, Stage, ZoneId } from './types';
import { ZONE_CENTERS, fmtMoney } from './engine';
import { useDelivery } from './store';

export function useMoney() {
  const locale = useLocale();
  return (n: number) => fmtMoney(n, locale);
}

export function PhoneFrame({ children, label, overlay }: { children: ReactNode; label: string; overlay?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-secondary-500 dark:text-secondary-400">{label}</div>
      <div className="relative overflow-hidden rounded-[2.2rem] border-[10px] border-secondary-900 bg-secondary-900 shadow-2xl dark:border-secondary-700 dark:bg-secondary-950">
        <div className="absolute left-1/2 top-0 z-20 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-secondary-900 dark:bg-secondary-950" />
        <div className="h-[680px] overflow-y-auto overflow-x-hidden bg-secondary-50 text-secondary-900 dark:bg-secondary-900 dark:text-white">{children}</div>
        {overlay}
      </div>
    </div>
  );
}

/** Ventana modal. Dentro del teléfono usa scope="phone" (cubre solo la pantalla del teléfono). */
export function Modal({
  title, onClose, children, footer, scope = 'page',
}: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; scope?: 'page' | 'phone' }) {
  const t = useTranslations('demoDelivery.common');
  const ref = useRef<HTMLDivElement>(null);
  // El reloj de la demo vuelve a renderizar cada segundo: el foco se pone solo al abrir
  // (no en cada render) para no sacar al usuario del campo que está escribiendo.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const wrap = scope === 'page' ? 'fixed inset-0 z-[70] items-center p-4' : 'absolute inset-0 z-30 items-end';
  const box = scope === 'page' ? 'max-h-[85vh] w-full max-w-lg rounded-2xl' : 'max-h-[88%] w-full rounded-t-2xl';
  return (
    <div className={`flex justify-center bg-black/50 ${wrap}`} onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`flex flex-col overflow-hidden bg-white text-secondary-900 shadow-xl outline-none dark:bg-secondary-900 dark:text-white ${box}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-secondary-200 px-4 py-3 dark:border-secondary-700">
          <h3 className="text-sm font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label={t('close')} className="rounded-full p-1 hover:bg-secondary-100 dark:hover:bg-secondary-800">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 text-sm">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-secondary-200 px-4 py-3 dark:border-secondary-700">{footer}</div>}
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useDelivery();
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[80] flex flex-col items-end gap-2 sm:left-auto" aria-live="polite">
      {toasts.map((x) => (
        <div
          key={x.id}
          role="status"
          className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg px-4 py-2 text-sm shadow-lg ${
            x.tone === 'warn' ? 'bg-amber-600 text-white' : x.tone === 'info' ? 'bg-secondary-800 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          <span className="flex-1">{x.text}</span>
          <button type="button" onClick={() => dismissToast(x.id)} className="opacity-80 hover:opacity-100" aria-label="×">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Kpi({ title, value, hint, icon: Icon, color }: { title: string; value: string; hint?: string; icon: ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-3 dark:border-secondary-700 dark:bg-secondary-800">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase leading-tight text-secondary-500 dark:text-secondary-400">{title}</span>
        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
      </div>
      <p className="text-lg font-bold">{value}</p>
      {hint && <p className="text-[10px] text-secondary-500 dark:text-secondary-400">{hint}</p>}
    </div>
  );
}

export function Row({ k, v, bold, tone }: { k: string; v: string; bold?: boolean; tone?: 'green' }) {
  return (
    <div className={`flex justify-between gap-3 ${bold ? 'text-base font-bold' : ''} ${tone === 'green' ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
      <span>{k}</span>
      <span className="whitespace-nowrap">{v}</span>
    </div>
  );
}

const STAGE_TONE: Record<Stage, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  preparing: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  ready: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  pickedUp: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  cancelled: 'bg-secondary-200 text-secondary-700 dark:bg-secondary-700 dark:text-secondary-200',
};

export function StageBadge({ stage }: { stage: Stage }) {
  const t = useTranslations('demoDelivery.stage');
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${STAGE_TONE[stage]}`}>{t(stage)}</span>;
}

export function Stars({ value, onChange, size = 'h-4 w-4', label }: { value: number; onChange?: (n: number) => void; size?: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : undefined} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}`} onClick={() => onChange(n)}>
            <StarSolid className={`${size} ${n <= value ? 'text-amber-400' : 'text-secondary-300 dark:text-secondary-600'}`} />
          </button>
        ) : (
          <StarSolid key={n} className={`${size} ${n <= value ? 'text-amber-400' : 'text-secondary-300 dark:text-secondary-600'}`} />
        ),
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Mapa ilustrativo (no a escala) a partir de calles y carreras
// ---------------------------------------------------------------------------

export interface MapPoint {
  id: string;
  place: Place;
  kind: 'sede' | 'driver' | 'customer' | 'order';
  label: string;
  pulse?: boolean;
  muted?: boolean;
}

export interface MapRoute {
  id: string;
  from: Place;
  to: Place;
  color: string;
  dashed?: boolean;
}

const project = (p: Place) => ({ x: 95 - Math.sqrt(Math.max(0, p.carrera)) * 8, y: (160 - p.calle) / 2 });
const ROAD_CALLES = [26, 72, 100, 127, 147];
const ROAD_CARRERAS = [7, 15, 30, 45, 68];
const PIN: Record<MapPoint['kind'], string> = {
  sede: 'bg-amber-500',
  driver: 'bg-emerald-500',
  customer: 'bg-sky-500',
  order: 'bg-rose-500',
};

export function MapView({
  points, routes = [], fit, height = 'h-52', hint, zones,
}: { points: MapPoint[]; routes?: MapRoute[]; fit?: Place[]; height?: string; hint: string; zones?: { id: ZoneId; label: string }[] }) {
  const fitPts = (fit && fit.length ? fit : points.map((p) => p.place)).map(project);
  let minX = 0;
  let maxX = 100;
  let minY = 0;
  let maxY = 100;
  if (fit && fitPts.length) {
    minX = Math.min(...fitPts.map((p) => p.x));
    maxX = Math.max(...fitPts.map((p) => p.x));
    minY = Math.min(...fitPts.map((p) => p.y));
    maxY = Math.max(...fitPts.map((p) => p.y));
    const padX = Math.max(6, (maxX - minX) * 0.2);
    const padY = Math.max(6, (maxY - minY) * 0.2);
    minX -= padX;
    maxX += padX;
    minY -= padY;
    maxY += padY;
  }
  const sx = maxX - minX || 1;
  const sy = maxY - minY || 1;
  const pct = (p: Place) => {
    const q = project(p);
    return { x: ((q.x - minX) / sx) * 100, y: ((q.y - minY) / sy) * 100 };
  };
  const inside = (v: number) => v >= 0 && v <= 100;
  const clamp = (v: number) => Math.max(4, Math.min(96, v));

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-secondary-200 bg-gradient-to-br from-emerald-50 to-sky-100 dark:border-secondary-700 dark:from-secondary-800 dark:to-secondary-900 ${height}`}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {ROAD_CALLES.map((c) => {
          const y = pct({ calle: c, carrera: 0 }).y;
          return inside(y) ? <line key={`c${c}`} x1={0} x2={100} y1={y} y2={y} stroke="#94a3b8" strokeOpacity={0.55} strokeWidth={3} vectorEffect="non-scaling-stroke" /> : null;
        })}
        {ROAD_CARRERAS.map((c) => {
          const x = pct({ calle: 0, carrera: c }).x;
          return inside(x) ? <line key={`k${c}`} y1={0} y2={100} x1={x} x2={x} stroke="#94a3b8" strokeOpacity={0.55} strokeWidth={3} vectorEffect="non-scaling-stroke" /> : null;
        })}
        {routes.map((r) => {
          const a = pct(r.from);
          const b = pct(r.to);
          const mid = pct({ calle: r.from.calle, carrera: r.to.carrera });
          return (
            <polyline
              key={r.id}
              points={`${a.x},${a.y} ${mid.x},${mid.y} ${b.x},${b.y}`}
              fill="none"
              stroke={r.color}
              strokeWidth={2.5}
              strokeDasharray={r.dashed ? '5 4' : undefined}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {ROAD_CALLES.map((c) => {
        const y = pct({ calle: c, carrera: 0 }).y;
        return inside(y) && y > 4 && y < 92 ? (
          <span key={`lc${c}`} className="absolute left-1 text-[9px] font-medium text-secondary-500 dark:text-secondary-400" style={{ top: `${y}%`, transform: 'translateY(-110%)' }}>
            Cl {c}
          </span>
        ) : null;
      })}
      {ROAD_CARRERAS.map((c) => {
        const x = pct({ calle: 0, carrera: c }).x;
        return inside(x) && x > 4 && x < 94 ? (
          <span key={`lk${c}`} className="absolute top-1 text-[9px] font-medium text-secondary-500 dark:text-secondary-400" style={{ left: `${x}%`, transform: 'translateX(-50%)' }}>
            Cra {c}
          </span>
        ) : null;
      })}
      {zones?.map((z) => {
        const p = pct(ZONE_CENTERS[z.id]);
        return inside(p.x) && inside(p.y) ? (
          <span key={z.id} className="absolute text-[10px] font-semibold uppercase tracking-wide text-secondary-400 dark:text-secondary-500" style={{ left: `${clamp(p.x)}%`, top: `${clamp(p.y)}%`, transform: 'translate(-50%, 40%)' }}>
            {z.label}
          </span>
        ) : null;
      })}
      {points.map((pt) => {
        const p = pct(pt.place);
        return (
          <div
            key={pt.id}
            className={`absolute ${pt.muted ? 'opacity-50' : ''} ${pt.kind === 'driver' ? 'z-10' : ''}`}
            // El repartidor lleva la etiqueta debajo del punto y el resto encima, para que no se tapen cuando coinciden.
            style={{ left: `${clamp(p.x)}%`, top: `${clamp(p.y)}%`, transform: pt.kind === 'driver' ? 'translate(-50%, -8px)' : 'translate(-50%, -100%)' }}
          >
            <div className="relative flex flex-col items-center">
              <div className={`relative h-4 w-4 rounded-full border-2 border-white shadow-md ${PIN[pt.kind]}`}>
                {pt.pulse && <span className={`absolute inset-0 -m-1 animate-ping rounded-full opacity-40 ${PIN[pt.kind]}`} />}
              </div>
              <div className="mt-0.5 max-w-[110px] truncate rounded bg-white px-1 py-0.5 text-[9px] font-semibold text-secondary-700 shadow dark:bg-secondary-800 dark:text-secondary-200">{pt.label}</div>
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-1.5 right-1.5 max-w-[90%] rounded-md bg-white/85 px-2 py-0.5 text-right text-[9px] font-medium text-secondary-600 dark:bg-secondary-900/85 dark:text-secondary-300">{hint}</div>
    </div>
  );
}

export function useMonths(): string[] {
  const t = useTranslations('demoDelivery');
  return t.raw('months') as string[];
}
