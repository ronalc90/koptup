'use client';

import { useTranslations } from 'next-intl';
import Shell from './components/Shell';
import { CmsProvider, useCmsMaybe } from './lib/store';

/**
 * Demo "CMS headless": modelos de contenido, entradas, editor visual por
 * bloques, vista previa web/app, SEO, roles, aprobación, publicación
 * programada, webhooks y API de entrega. Todo corre en el navegador con datos
 * de ejemplo; el asistente de redacción usa IA real a través del backend.
 */
function Gate() {
  const ctx = useCmsMaybe();
  const t = useTranslations('demoCms.bar');
  if (ctx) return <Shell />;
  // Primer render (servidor y cliente): sin fechas ni datos, para no romper la hidratación.
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="px-4 sm:px-6 py-3 bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{t('title')}</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-200 dark:border-amber-900">{t('sample')}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{t('subtitle')}</p>
      </div>
      <p className="p-6 text-sm text-slate-500 dark:text-slate-400" role="status">
        {t('loading')}
      </p>
    </div>
  );
}

export default function GestorContenidoPage() {
  return (
    <CmsProvider>
      <Gate />
    </CmsProvider>
  );
}
