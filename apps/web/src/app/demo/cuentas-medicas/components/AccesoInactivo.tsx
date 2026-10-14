'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import type { MotivoAcceso } from '../api';

/**
 * Formulario de solicitud con esta demo ya elegida (el mismo destino que el
 * botón "Solicitar demo personalizada" de la pantalla de acceso del sitio).
 */
export const RUTA_SOLICITAR_ACCESO = '/solicitar-demo?demos=cuentas-medicas';
export const RUTA_INICIAR_SESION = `/login?redirect=${encodeURIComponent('/demo/cuentas-medicas')}`;

const claseSecundario =
  'inline-flex items-center justify-center rounded-lg border-2 border-primary-600 px-4 py-2 font-medium text-primary-600 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:text-primary-300 dark:hover:bg-primary-950';
const clasePrimario =
  'inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

/**
 * Se muestra cuando el servidor responde 401/403 con la demo abierta: la
 * sesión venció, el acceso venció o se cerró, la cuenta no tiene acceso o la
 * demo se desactivó. Cada caso dice qué pasó y qué hacer.
 */
export default function AccesoInactivo({ motivo }: { motivo: MotivoAcceso }) {
  const t = useTranslations('demoMedicalAccounts.access');
  const mostrarLogin = motivo === 'sesion' || motivo === 'sinAcceso';
  const mostrarSolicitud = motivo !== 'desactivada';

  return (
    <Card variant="bordered" className="mx-auto max-w-2xl text-center" role="alert">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
        <LockClosedIcon className="h-7 w-7 text-amber-700 dark:text-amber-200" aria-hidden="true" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">{t(`reasons.${motivo}.title`)}</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">{t(`reasons.${motivo}.body`)}</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        {mostrarLogin && (
          <Link href={RUTA_INICIAR_SESION} className={motivo === 'sesion' ? clasePrimario : claseSecundario}>
            {t('login')}
          </Link>
        )}
        {mostrarSolicitud && (
          <Link href={RUTA_SOLICITAR_ACCESO} className={motivo === 'sesion' ? claseSecundario : clasePrimario}>
            {t('request')}
          </Link>
        )}
        {!mostrarSolicitud && (
          <Link href="/contact" className={claseSecundario}>
            {t('contact')}
          </Link>
        )}
      </div>
      <Link
        href="/demo"
        className="mt-5 inline-block rounded text-sm font-medium text-primary-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-300"
      >
        {t('allDemos')}
      </Link>
    </Card>
  );
}
