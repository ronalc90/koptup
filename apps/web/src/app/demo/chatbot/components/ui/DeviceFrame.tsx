'use client';

import { type ReactNode } from 'react';

export type DeviceKind = 'desktop' | 'mobile';

interface DeviceFrameProps {
  device: DeviceKind;
  /** Label opcional encima del frame (en modo mobile). */
  label?: string;
  /** Etiqueta accesible del frame. */
  ariaLabel?: string;
  /** Hijos a renderizar dentro del frame. Cuando es desktop el frame es transparente. */
  children: ReactNode;
}

/**
 * Wrapper visual que envuelve el área dada en un marco de dispositivo.
 * En `mobile`: simula un iPhone con notch, marco oscuro y radius generoso.
 * En `desktop`: passthrough (sin chrome).
 *
 * Se mantiene puramente presentacional para que pueda envolver chat,
 * preview u otros widgets sin acoplarse a su lógica.
 */
export default function DeviceFrame({
  device,
  label,
  ariaLabel,
  children,
}: DeviceFrameProps) {
  if (device === 'desktop') {
    return (
      <div className="flex h-full w-full flex-col" aria-label={ariaLabel}>
        {children}
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-start gap-3 overflow-y-auto bg-secondary-100 px-6 py-8 dark:bg-secondary-950"
      aria-label={ariaLabel}
    >
      {label ? (
        <span className="text-[10px] font-semibold uppercase tracking-widest text-secondary-500 dark:text-secondary-400">
          {label}
        </span>
      ) : null}
      <div
        className="relative mx-auto flex w-full max-w-[380px] flex-col"
        style={{ aspectRatio: '380 / 760' }}
      >
        {/* Marco físico */}
        <div className="absolute inset-0 rounded-[44px] bg-secondary-900 p-[10px] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.45)] ring-1 ring-secondary-700/60 dark:bg-black dark:shadow-[0_30px_80px_-12px_rgba(0,0,0,0.7)]">
          <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-white dark:bg-secondary-900">
            {/* Notch */}
            <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-5 w-28 -translate-x-1/2 rounded-full bg-secondary-900 dark:bg-black" />
            <div className="absolute inset-0 flex flex-col overflow-hidden pt-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
