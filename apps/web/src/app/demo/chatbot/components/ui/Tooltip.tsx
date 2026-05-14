'use client';

import { type ReactNode } from 'react';

interface TooltipProps {
  /** Texto del tooltip. Si está vacío/null, no se renderiza ningún overlay. */
  content?: ReactNode | null;
  /** Posición preferida. Por defecto top. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Alineación dentro del eje. */
  align?: 'start' | 'center' | 'end';
  /** Wrapper class adicional. */
  className?: string;
  /** Tamaño máximo del tooltip. */
  maxWidth?: number;
  children: ReactNode;
}

/**
 * Tooltip CSS-only basado en `group` + `group-hover:opacity-100`.
 * Sin libs externas. Usa `pointer-events-none` para no interferir con el target.
 * SRP: solo render visual; no hace cálculo dinámico de posición.
 */
export default function Tooltip({
  content,
  side = 'top',
  align = 'center',
  className,
  maxWidth = 280,
  children,
}: TooltipProps) {
  if (!content) return <>{children}</>;

  const sideClass =
    side === 'top'
      ? 'bottom-full mb-2'
      : side === 'bottom'
      ? 'top-full mt-2'
      : side === 'left'
      ? 'right-full mr-2 top-1/2 -translate-y-1/2'
      : 'left-full ml-2 top-1/2 -translate-y-1/2';

  const alignClass =
    side === 'top' || side === 'bottom'
      ? align === 'start'
        ? 'left-0'
        : align === 'end'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2'
      : '';

  return (
    <span className={`group/tt relative inline-flex ${className ?? ''}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 ${sideClass} ${alignClass} hidden whitespace-normal rounded-md border border-secondary-700/40 bg-secondary-900/95 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-white opacity-0 shadow-xl backdrop-blur-sm transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 dark:border-secondary-600 dark:bg-secondary-800/95 sm:block`}
        style={{ maxWidth }}
      >
        {content}
      </span>
    </span>
  );
}
