'use client';

import { useTranslations } from 'next-intl';
import { LockClosedIcon, LockOpenIcon, KeyIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { DemoAccessMode } from '@/lib/demo-access-defaults';

interface DemoAccessBadgeProps {
  mode: DemoAccessMode;
  /** Demo desactivada desde el panel ("En mantenimiento"). */
  activo?: boolean;
  /** Sobre un fondo de color (encabezado con degradado). */
  onDark?: boolean;
  className?: string;
}

const STYLES: Record<DemoAccessMode | 'inactiva', { light: string; dark: string }> = {
  publico: {
    light: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    dark: 'bg-white/90 text-green-800',
  },
  solicitud: {
    light: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    dark: 'bg-white/90 text-amber-800',
  },
  privado: {
    light: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100',
    dark: 'bg-white/90 text-violet-800',
  },
  inactiva: {
    light: 'bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-100',
    dark: 'bg-white/90 text-secondary-800',
  },
};

/** Etiqueta del modo de acceso de una demo: Abierta, Requiere acceso o Solo por invitación. */
export default function DemoAccessBadge({ mode, activo = true, onDark = false, className }: DemoAccessBadgeProps) {
  const t = useTranslations('demoAccessBadge');
  const kind = activo ? mode : 'inactiva';
  const Icon = !activo ? WrenchScrewdriverIcon : mode === 'publico' ? LockOpenIcon : mode === 'solicitud' ? KeyIcon : LockClosedIcon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        onDark ? STYLES[kind].dark : STYLES[kind].light,
        className,
      )}
      data-access-mode={kind}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {t(kind)}
    </span>
  );
}
