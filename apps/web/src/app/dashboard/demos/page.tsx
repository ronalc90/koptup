'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  KeyIcon,
  PlayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { DEMO_CARD_BY_SLUG, EXTRA_DEMO_BY_SLUG } from '@/components/demo/demo-cards';
import { type MyDemo, demoName, fetchMyDemos, formatDate, storedUser } from '@/lib/demo-system';
import { cn } from '@/lib/utils';

/** Días antes del vencimiento en que la tarjeta avisa "vence pronto" (igual que el recordatorio del backend). */
const SOON_DAYS = 3;

function statusOf(g: MyDemo): 'activa' | 'pronto' | 'vencida' | 'revocada' | 'mantenimiento' {
  if (g.estado === 'revocado') return 'revocada';
  if (g.estado === 'expirado' || !g.vigente) return 'vencida';
  if (!g.demoActiva) return 'mantenimiento';
  return g.diasRestantes <= SOON_DAYS ? 'pronto' : 'activa';
}

const STATUS_STYLE: Record<ReturnType<typeof statusOf>, string> = {
  activa: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  pronto: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  vencida: 'bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-100',
  revocada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  mantenimiento: 'bg-secondary-200 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-100',
};

function MyDemosInner() {
  const t = useTranslations('myDemos');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const welcome = searchParams.get('bienvenida') === '1';
  const [items, setItems] = useState<MyDemo[] | null>(null);
  const [error, setError] = useState(false);
  const [firstName, setFirstName] = useState('');

  const load = useCallback(() => {
    setError(false);
    fetchMyDemos()
      .then((data) => setItems(data))
      .catch(() => {
        setError(true);
        setItems((current) => current ?? []);
      });
  }, []);

  useEffect(() => {
    setFirstName((storedUser()?.name ?? '').split(' ')[0] ?? '');
    load();
  }, [load]);

  // Vigentes primero (las que vencen antes arriba), luego vencidas y revocadas.
  const sorted = (items ?? []).slice().sort((a, b) => {
    const rank = (g: MyDemo) => (g.vigente ? 0 : g.estado === 'expirado' ? 1 : 2);
    return rank(a) - rank(b) || new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
          {firstName ? t('titleWithName', { name: firstName }) : t('title')}
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t('subtitle')}</p>
      </div>

      {welcome && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800" role="status">
          <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">{t('welcome')}</p>
        </div>
      )}

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{t('loadError')}</p>
          <Button size="sm" variant="outline" onClick={load}>
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            {t('retry')}
          </Button>
        </div>
      )}

      {items === null ? (
        <div className="flex justify-center py-16" role="status" aria-label={t('loading')}>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : sorted.length === 0 && !error ? (
        <Card variant="bordered">
          <CardContent className="p-10 text-center" data-testid="my-demos-empty">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
              <KeyIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{t('emptyTitle')}</h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md mx-auto">{t('emptyBody')}</p>
            <Button asChild>
              <Link href="/solicitar-demo">{t('requestDemo')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sorted.map((g) => {
            const status = statusOf(g);
            const card = DEMO_CARD_BY_SLUG[g.demoSlug];
            const extra = EXTRA_DEMO_BY_SLUG[g.demoSlug];
            const Icon = card?.icon ?? extra?.icon ?? KeyIcon;
            const color = card?.color ?? extra?.color ?? 'from-primary-600 to-primary-800';
            const name = demoName({ slug: g.demoSlug, nombre: g.demoNombre, nombreEn: g.demoNombreEn }, locale);
            const open = status === 'activa' || status === 'pronto';
            return (
              <Card key={g.id} variant="bordered" className={cn('flex flex-col', !open && 'opacity-90')} data-grant={g.demoSlug}>
                <CardContent className="p-0 flex flex-col h-full">
                  <div className={cn('bg-gradient-to-br p-5 rounded-t-xl flex items-center gap-3', color, !open && 'grayscale')}>
                    <div className="p-2.5 bg-white/20 rounded-xl">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    {g.accessMode && <DemoAccessBadge mode={g.accessMode} activo={g.demoActiva} onDark />}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{name}</h2>
                      <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[status])} data-status={status}>
                        {t(`status.${status}`)}
                      </span>
                    </div>

                    {open ? (
                      <p className={cn('text-base font-semibold', status === 'pronto' ? 'text-amber-700 dark:text-amber-400' : 'text-secondary-900 dark:text-white')}>
                        {t('daysLeft', { days: g.diasRestantes })}
                      </p>
                    ) : status === 'revocada' ? (
                      <p className="text-base font-semibold text-secondary-700 dark:text-secondary-300">{t('revoked')}</p>
                    ) : (
                      <p className="text-base font-semibold text-secondary-700 dark:text-secondary-300">{t('ended', { date: formatDate(g.expiresAt, locale) })}</p>
                    )}
                    <ul className="mt-2 space-y-1 text-sm text-secondary-600 dark:text-secondary-400">
                      {open && (
                        <li className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          {t('expiresOn', { date: formatDate(g.expiresAt, locale) })}
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <PlayIcon className="h-4 w-4" />
                        {g.ultimoAcceso ? t('lastAccess', { date: formatDate(g.ultimoAcceso, locale, true) }) : t('neverOpened')}
                      </li>
                    </ul>
                    {status === 'mantenimiento' && <p className="mt-3 text-sm text-secondary-600 dark:text-secondary-400">{t('maintenance')}</p>}

                    <div className="mt-auto pt-5 flex flex-wrap gap-3">
                      {open && (
                        // Navegación completa: el servidor vuelve a verificar el acceso al abrir la demo.
                        <a
                          href={g.url}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          <PlayIcon className="h-4 w-4" />
                          {t('open')}
                        </a>
                      )}
                      {status === 'pronto' && (
                        <Link
                          href={`/solicitar-demo?demos=${encodeURIComponent(g.demoSlug)}`}
                          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-secondary-200 dark:border-secondary-700 text-secondary-800 dark:text-secondary-100 text-sm font-semibold rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-900"
                        >
                          <ClockIcon className="h-4 w-4" />
                          {t('moreTime')}
                        </Link>
                      )}
                      {(status === 'vencida' || status === 'revocada') && (
                        <Link
                          href={`/solicitar-demo?demos=${encodeURIComponent(g.demoSlug)}`}
                          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-primary-600 text-primary-700 dark:text-primary-300 text-sm font-semibold rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          {status === 'vencida' ? t('moreTime') : t('requestAgain')}
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card variant="bordered" className="border-dashed">
            <CardContent className="p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 mb-4 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
                <PlusIcon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">{t('otherTitle')}</h2>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">{t('otherBody')}</p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/solicitar-demo">{t('otherCta')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="flex items-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
        <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />
        {t('dataNote')}
      </p>
      {/* Las demos abiertas del catálogo siguen disponibles para todos. */}
      <p className="text-sm text-secondary-500 dark:text-secondary-400">
        {t.rich('allDemos', {
          link: (chunks) => (
            <Link href="/demo" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}

export default function MyDemosPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <MyDemosInner />
      </Suspense>
    </DashboardLayout>
  );
}
