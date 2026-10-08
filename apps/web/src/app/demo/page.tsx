'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { DEMO_CARDS, EXTRA_DEMOS } from '@/components/demo/demo-cards';
import { DEMO_CATALOG_SLUGS } from '@/lib/demos';
import {
  DEMO_STAFF_ROLES,
  type CatalogItem,
  catalogMap,
  demoName,
  fetchMyDemos,
  fetchPublicCatalog,
  hasSessionCookie,
  storedUser,
} from '@/lib/demo-system';
import { SparklesIcon, ArrowRightIcon, KeyIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface ViewerAccess {
  loggedIn: boolean;
  staff: boolean;
  /** Demos con acceso vigente → días que quedan. */
  grants: Map<string, number>;
}

const NO_VIEWER: ViewerAccess = { loggedIn: false, staff: false, grants: new Map() };

function requestHref(slug: string): string {
  return `/solicitar-demo?demos=${encodeURIComponent(slug)}`;
}

export default function DemosPage() {
  const t = useTranslations();
  const th = useTranslations('demoHub');
  const locale = useLocale();

  // Primer render con la semilla (igual en el servidor y en el navegador);
  // luego el catálogo real del backend y los accesos de la sesión.
  const [catalog, setCatalog] = useState<Map<string, CatalogItem>>(() => catalogMap(null));
  const [viewer, setViewer] = useState<ViewerAccess>(NO_VIEWER);

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicCatalog(controller.signal)
      .then((items) => setCatalog(catalogMap(items)))
      .catch(() => undefined); // sin backend se muestran los modos por defecto

    if (hasSessionCookie()) {
      const role = storedUser()?.role ?? '';
      const staff = DEMO_STAFF_ROLES.includes(role);
      setViewer({ loggedIn: true, staff, grants: new Map() });
      fetchMyDemos(controller.signal)
        .then((items) => {
          if (controller.signal.aborted) return;
          const grants = new Map<string, number>();
          for (const g of items) if (g.vigente) grants.set(g.demoSlug, g.diasRestantes);
          setViewer({ loggedIn: true, staff, grants });
        })
        .catch(() => undefined);
    }
    return () => controller.abort();
  }, []);

  // Los textos que dicen cuántas demos hay usan DEMO_COUNT (src/lib/demos.ts).
  // Si agregas o quitas una tarjeta, actualiza DEMO_CATALOG_SLUGS.
  if (process.env.NODE_ENV !== 'production') {
    const listed = DEMO_CARDS.map((d) => d.slug).join(',');
    if (listed !== DEMO_CATALOG_SLUGS.join(',')) {
      console.error(
        '[demo] El catálogo de /demo no coincide con DEMO_CATALOG_SLUGS (src/lib/demos.ts); actualízalo para que DEMO_COUNT sea correcto.',
      );
    }
  }

  const cards = useMemo(
    () =>
      DEMO_CARDS.map((card) => {
        const base = `${card.ns}.${card.key}`;
        const entry = catalog.get(card.slug);
        return {
          ...card,
          title: t(`${base}.title`),
          description: t(`${base}.description`),
          badge: t(`${base}.badge`),
          features: [0, 1, 2, 3].map((i) => t(`${base}.features.${i}`)),
          accessMode: entry?.accessMode ?? 'privado',
          activo: entry?.activo !== false,
        };
      }),
    [catalog, t],
  );

  const canOpen = (slug: string, accessMode: string, activo: boolean): boolean => {
    if (viewer.staff) return true;
    if (!activo) return false;
    return accessMode === 'publico' || viewer.grants.has(slug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" size="lg" className="mb-6 border-white/30 text-white">
            {t('demos.badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{t('demos.title')}</h1>
          <p className="text-xl md:text-2xl mb-10 text-primary-100 max-w-3xl mx-auto">{t('demos.subtitle')}</p>
          <div className="flex items-center justify-center gap-2 text-primary-100">
            <SparklesIcon className="h-5 w-5" />
            <span className="text-sm">{t('demos.interactive')}</span>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label={th('legend')}>
            <DemoAccessBadge mode="publico" onDark />
            <DemoAccessBadge mode="solicitud" onDark />
            <DemoAccessBadge mode="privado" onDark />
          </div>
          <div className="mt-8">
            <Link
              href="/solicitar-demo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700 hover:bg-primary-50 font-semibold rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {th('requestDemo')}
            </Link>
          </div>
        </div>
      </section>

      {/* Demos Grid */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((demo) => {
              const Icon = demo.icon;
              const gated = demo.accessMode !== 'publico' || !demo.activo;
              const open = canOpen(demo.slug, demo.accessMode, demo.activo);
              const href = `/demo/${demo.slug}`;
              const daysLeft = viewer.grants.get(demo.slug);
              return (
                <Card
                  key={demo.slug}
                  variant="bordered"
                  className="h-full flex flex-col hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
                  data-demo-card={demo.slug}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    {/* Header with gradient */}
                    <Link
                      href={href}
                      prefetch={gated ? false : undefined}
                      className={`block bg-gradient-to-br ${demo.color} p-6 sm:p-8 relative overflow-hidden rounded-t-xl`}
                    >
                      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Icon className="h-10 w-10 text-white" />
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <DemoAccessBadge mode={demo.accessMode} activo={demo.activo} onDark />
                            <Badge variant="outline" size="sm" className="border-white/30 text-white">
                              {demo.badge}
                            </Badge>
                          </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-3">{demo.title}</h2>
                        <p className="text-lg text-white/90">{demo.description}</p>
                      </div>
                    </Link>

                    {/* Features List */}
                    <div className="p-6 sm:p-8 flex flex-col flex-1">
                      <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide mb-4">
                        {t('demos.includes')}
                      </h3>
                      <ul className="space-y-3 mb-6">
                        {demo.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="mt-1">
                              <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                              </div>
                            </div>
                            <span className="text-secondary-700 dark:text-secondary-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-auto pt-6 border-t border-secondary-200 dark:border-secondary-700 flex flex-wrap items-center justify-between gap-3">
                        {open ? (
                          <Link
                            href={href}
                            prefetch={gated ? false : undefined}
                            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                          >
                            {demo.accessMode === 'publico' && demo.activo ? t('demos.tryDemo') : th('open')}
                            <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                          </Link>
                        ) : (
                          <Link
                            href={requestHref(demo.slug)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            <KeyIcon className="h-4 w-4" />
                            {demo.activo ? (demo.accessMode === 'privado' ? th('requestCustom') : th('requestAccess')) : th('requestGuided')}
                          </Link>
                        )}

                        {open && daysLeft !== undefined && demo.accessMode !== 'publico' ? (
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">{th('daysLeft', { days: daysLeft })}</span>
                        ) : open ? (
                          <Link
                            href={requestHref(demo.slug)}
                            className="text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {th('requestGuided')}
                          </Link>
                        ) : !demo.activo ? (
                          <span className="text-sm text-secondary-600 dark:text-secondary-400">{th('maintenance')}</span>
                        ) : !viewer.loggedIn ? (
                          <Link
                            href={`/login?redirect=${encodeURIComponent(href)}`}
                            className="text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {th('login')}
                          </Link>
                        ) : (
                          <Link
                            href={href}
                            prefetch={false}
                            className="text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {th('preview')}
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Demos sin tarjeta en el catálogo (por invitación según la semilla) */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">{th('moreTitle')}</h2>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6">{th('moreSubtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EXTRA_DEMOS.map((extra) => {
                const entry = catalog.get(extra.slug);
                const accessMode = entry?.accessMode ?? 'privado';
                const activo = entry?.activo !== false;
                const open = canOpen(extra.slug, accessMode, activo);
                const Icon = extra.icon;
                const href = `/demo/${extra.slug}`;
                return (
                  <Card key={extra.slug} variant="bordered" data-demo-card={extra.slug}>
                    <CardContent className="p-6 flex flex-col gap-4 h-full">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${extra.color} flex-shrink-0`}>
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
                              {demoName(entry, locale, extra.slug)}
                            </h3>
                            <DemoAccessBadge mode={accessMode} activo={activo} />
                          </div>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            {t(`demoAccess.preview.${extra.key}.description`)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto flex flex-wrap items-center gap-3">
                        {open ? (
                          <Link
                            href={href}
                            prefetch={false}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            {th('open')}
                            <ArrowRightIcon className="h-4 w-4" />
                          </Link>
                        ) : (
                          <Link
                            href={requestHref(extra.slug)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            <KeyIcon className="h-4 w-4" />
                            {accessMode === 'privado' ? th('requestCustom') : th('requestAccess')}
                          </Link>
                        )}
                        {!open && !viewer.loggedIn && (
                          <Link
                            href={`/login?redirect=${encodeURIComponent(href)}`}
                            className="text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {th('login')}
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 text-center">
            <Card variant="elevated" className="max-w-3xl mx-auto">
              <CardContent className="p-8">
                <SparklesIcon className="h-12 w-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-3">{t('demos.custom.title')}</h3>
                <p className="text-secondary-600 dark:text-secondary-400 mb-6">{t('demos.custom.description')}</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/solicitar-demo"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {t('demos.custom.button')}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dashboard/demos"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-600 hover:bg-secondary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <KeyIcon className="h-4 w-4" />
                    {th('myDemos')}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
