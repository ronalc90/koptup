'use client';

import { type ReactNode } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Tooltip from './Tooltip';

interface InfoIconProps {
  /** Contenido del tooltip. Si está vacío, no se renderiza nada. */
  content: ReactNode | null | undefined;
  /** Tamaño del icono (clase tailwind). */
  size?: 'xs' | 'sm' | 'md';
  /** Posición del tooltip respecto al icono. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Alineación del tooltip. */
  align?: 'start' | 'center' | 'end';
  /** Label accesible. */
  ariaLabel?: string;
  className?: string;
}

const SIZE: Record<NonNullable<InfoIconProps['size']>, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

/**
 * Icono `ⓘ` con tooltip al hover. Diseñado para acompañar headings/labels
 * complejos donde una breve explicación al hover mejora claridad sin saturar.
 */
export default function InfoIcon({
  content,
  size = 'sm',
  side = 'top',
  align = 'center',
  ariaLabel,
  className,
}: InfoIconProps) {
  if (!content) return null;
  return (
    <Tooltip content={content} side={side} align={align}>
      <span
        tabIndex={0}
        role="img"
        aria-label={ariaLabel ?? 'info'}
        className={`inline-flex cursor-help items-center justify-center rounded-full text-secondary-400 outline-none transition hover:text-primary-600 focus-visible:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-secondary-500 dark:hover:text-primary-300 ${className ?? ''}`}
      >
        <InformationCircleIcon className={SIZE[size]} />
      </span>
    </Tooltip>
  );
}
