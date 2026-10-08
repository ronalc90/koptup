'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ExclamationTriangleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import type { EstadoServidor } from '../_lib/useServidor';

const RUTA_DEMO = '/demo/sistema-experto';

/**
 * Mensaje claro cuando el servidor responde 401/403/429 o no está disponible.
 * La demo sigue siendo usable (simulador y catálogo de ejemplo).
 */
export default function AvisoAcceso({
  estado,
  onReintentar,
}: {
  estado: EstadoServidor;
  onReintentar: () => void;
}) {
  const t = useTranslations('demoExpertSystem.access');
  if (estado === 'cargando' || estado === 'ok') return null;

  const esAcceso = estado === 'sin-sesion' || estado === 'sin-acceso' || estado === 'limite';
  const Icono = estado === 'sin-sesion' || estado === 'sin-acceso' ? LockClosedIcon : ExclamationTriangleIcon;

  return (
    <div
      role="alert"
      className={`mb-6 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        esAcceso
          ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icono
          className={`mt-0.5 h-6 w-6 shrink-0 ${esAcceso ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-600 dark:text-red-300'}`}
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold text-secondary-900 dark:text-white">{t(`${estado}Title`)}</p>
          <p className="text-sm text-secondary-700 dark:text-secondary-300">{t(`${estado}Text`)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:shrink-0">
        {estado === 'sin-sesion' && (
          <Button size="sm" asChild>
            <Link href={`/login?redirect=${encodeURIComponent(RUTA_DEMO)}`}>{t('login')}</Link>
          </Button>
        )}
        {estado === 'sin-acceso' && (
          <Button size="sm" asChild>
            <Link href="/contact">{t('request')}</Link>
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onReintentar}>
          {t('retry')}
        </Button>
      </div>
    </div>
  );
}
