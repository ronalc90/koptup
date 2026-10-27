'use client';

import { useRef, type ReactNode } from 'react';
import { useDialogFocus } from './useDialogFocus';

interface DrawerProps {
  open: boolean;
  side: 'left' | 'right';
  onClose: () => void;
  /** Nombre accesible del panel. */
  label?: string;
  /** O el id del título que lo nombra. */
  labelledBy?: string;
  /** Clases extra del fondo (p. ej. `md:hidden` para mostrarlo solo en pantallas pequeñas). */
  className?: string;
  children: ReactNode;
}

/** Panel lateral modal (celulares y tabletas): se cierra con Escape, con la X o tocando fuera. */
export default function Drawer({ open, side, onClose, label, labelledBy, className, children }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(open, ref, onClose);
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-stretch bg-black/50 ${side === 'right' ? 'justify-end' : ''} ${className ?? ''}`}
      onClick={onClose}
    >
      <div
        ref={ref}
        className="flex w-80 max-w-[88vw] flex-col bg-white shadow-2xl dark:bg-secondary-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  );
}
