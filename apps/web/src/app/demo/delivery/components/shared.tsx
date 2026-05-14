'use client';

import { ReactNode } from 'react';

export const fmt = (n: number) => `$${n.toFixed(2)}`;

export function PhoneFrame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="mx-auto w-full max-w-[420px]">
      {label && (
        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-secondary-500 dark:text-secondary-400">
          {label}
        </div>
      )}
      <div className="relative rounded-[2.2rem] border-[10px] border-secondary-900 dark:border-secondary-700 bg-secondary-900 dark:bg-secondary-950 shadow-2xl overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-5 w-28 rounded-b-2xl bg-secondary-900 dark:bg-secondary-950 z-20" />
        <div className="h-[720px] overflow-y-auto bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-white">
          {children}
        </div>
      </div>
    </div>
  );
}

export function MapPlaceholder({
  driverPos,
  customerPos,
  storePos,
  labels,
}: {
  driverPos: { x: number; y: number };
  customerPos: { x: number; y: number };
  storePos: { x: number; y: number };
  labels: { you: string; driver: string; store: string; hint: string };
}) {
  return (
    <div className="relative w-full h-56 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-sky-100 dark:from-secondary-800 dark:to-secondary-900 border border-secondary-200 dark:border-secondary-700">
      <div
        className="absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          color: '#64748b',
        }}
      />
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <line x1={`${storePos.x}%`} y1={`${storePos.y}%`} x2={`${driverPos.x}%`} y2={`${driverPos.y}%`} stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
        <line x1={`${driverPos.x}%`} y1={`${driverPos.y}%`} x2={`${customerPos.x}%`} y2={`${customerPos.y}%`} stroke="#0ea5e9" strokeWidth={2} strokeDasharray="4 4" />
      </svg>
      <Pin x={storePos.x} y={storePos.y} color="bg-amber-500" label={labels.store} />
      <Pin x={driverPos.x} y={driverPos.y} color="bg-emerald-500" label={labels.driver} pulse />
      <Pin x={customerPos.x} y={customerPos.y} color="bg-sky-500" label={labels.you} />
      <div className="absolute bottom-2 right-2 rounded-md bg-white/80 dark:bg-secondary-900/80 px-2 py-1 text-[10px] font-medium text-secondary-600 dark:text-secondary-300">
        {labels.hint}
      </div>
    </div>
  );
}

function Pin({ x, y, color, label, pulse }: { x: number; y: number; color: string; label: string; pulse?: boolean }) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -100%)' }}>
      <div className="relative flex flex-col items-center">
        <div className={`relative h-6 w-6 rounded-full ${color} border-2 border-white shadow-md`}>
          {pulse && <span className={`absolute inset-0 -m-1 rounded-full ${color} opacity-40 animate-ping`} />}
        </div>
        <div className="mt-1 rounded bg-white dark:bg-secondary-800 px-1.5 py-0.5 text-[10px] font-semibold text-secondary-700 dark:text-secondary-200 shadow">
          {label}
        </div>
      </div>
    </div>
  );
}

export function Kpi({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl bg-white dark:bg-secondary-800 p-3 border border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase text-secondary-500 dark:text-secondary-400">{title}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

export function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-base' : ''}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
