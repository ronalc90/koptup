'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';

/**
 * Ruta de la pantalla "sin acceso" del sistema de demos (DemoGrant), que ofrece
 * "Solicitar demo personalizada" para las demos privadas.
 */
export const RUTA_SOLICITAR_ACCESO = '/demo/acceso?demo=cuentas-medicas&motivo=sin_acceso';
export const RUTA_INICIAR_SESION = '/login?redirect=/demo/cuentas-medicas';

export default function AccesoInactivo() {
  const t = useTranslations('demoMedicalAccounts.access');
  return (
    <Card variant="bordered" className="mx-auto max-w-2xl text-center" role="alert">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
        <LockClosedIcon className="h-7 w-7 text-amber-700 dark:text-amber-200" aria-hidden="true" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
      <p className="mb-6 text-gray-700 dark:text-gray-300">{t('body')}</p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={RUTA_INICIAR_SESION}
          className="inline-flex items-center justify-center rounded-lg border-2 border-primary-600 px-4 py-2 font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950"
        >
          {t('login')}
        </Link>
        <Link
          href={RUTA_SOLICITAR_ACCESO}
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-700"
        >
          {t('request')}
        </Link>
      </div>
    </Card>
  );
}
