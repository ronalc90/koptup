'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeftIcon, CalculatorIcon, PresentationChartBarIcon } from '@heroicons/react/24/outline';
import { btn } from './ui';

/** Salidas comerciales: demo guiada con esta demo ya elegida y cotización del producto «CMS headless». */
export const REQUEST_DEMO_HREF = '/solicitar-demo?demos=gestor-contenido';
export const QUOTE_HREF = '/contact?service=cms-headless';

/** Enlace «Volver al catálogo de demos» (también en la pantalla de carga). */
export function BackToCatalog() {
  const t = useTranslations('demoCms.bar');
  return (
    <Link
      href="/demo"
      className="mb-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
    >
      <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
      {t('back')}
    </Link>
  );
}

/** «Solicitar demo guiada» y «Cotizar tu CMS» (encabezado y cierre del recorrido). */
export function CommercialLinks({ className = '' }: { className?: string }) {
  const t = useTranslations('demoCms.bar');
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Link href={REQUEST_DEMO_HREF} className={`${btn.primary} focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}>
        <PresentationChartBarIcon className="w-4 h-4" aria-hidden="true" />
        {t('requestDemo')}
      </Link>
      <Link href={QUOTE_HREF} className={`${btn.outline} focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500`}>
        <CalculatorIcon className="w-4 h-4" aria-hidden="true" />
        {t('quote')}
      </Link>
    </div>
  );
}
