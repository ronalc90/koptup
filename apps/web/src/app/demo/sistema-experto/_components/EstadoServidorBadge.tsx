'use client';

import { useTranslations } from 'next-intl';
import type { EstadoServidor } from '../_lib/useServidor';

const ESTILOS: Record<EstadoServidor, { caja: string; punto: string }> = {
  cargando: {
    caja: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-200',
    punto: 'bg-secondary-400 animate-pulse',
  },
  ok: {
    caja: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    punto: 'bg-green-500',
  },
  'sin-sesion': {
    caja: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    punto: 'bg-yellow-500',
  },
  'sin-acceso': {
    caja: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    punto: 'bg-yellow-500',
  },
  limite: {
    caja: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    punto: 'bg-yellow-500',
  },
  'sin-conexion': {
    caja: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    punto: 'bg-red-500',
  },
  servidor: {
    caja: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    punto: 'bg-red-500',
  },
};

/** Estado real de la conexión con el servidor del motor (no una insignia fija). */
export default function EstadoServidorBadge({ estado }: { estado: EstadoServidor }) {
  const t = useTranslations('demoExpertSystem.status');
  const estilo = ESTILOS[estado];
  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${estilo.caja}`}
    >
      <span className={`h-2 w-2 rounded-full ${estilo.punto}`} aria-hidden="true" />
      {t(estado)}
    </span>
  );
}
