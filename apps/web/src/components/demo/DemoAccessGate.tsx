'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  KeyIcon,
  LockClosedIcon,
  NoSymbolIcon,
  SparklesIcon,
  UserIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent } from '@/components/ui/Card';
import DemoAccessBadge from '@/components/demo/DemoAccessBadge';
import { DEMO_CARD_BY_SLUG, EXTRA_DEMO_BY_SLUG } from '@/components/demo/demo-cards';
import { DEMO_DEFAULTS_BY_SLUG, type DemoAccessMode } from '@/lib/demo-access-defaults';
import {
  type CatalogItem,
  type DemoAccessReason,
  demoName,
  fetchDemoAccess,
  fetchPublicCatalog,
  formatDate,
  hasSessionCookie,
} from '@/lib/demo-system';

interface DemoAccessGateProps {
  slug: string;
  /** Motivo que calculó el middleware (null si se abrió la página directamente). */
  initialReason: DemoAccessReason | null;
  initialMode: DemoAccessMode | null;
  expiresAt: string | null;
  /** Ruta de la demo a la que se vuelve al iniciar sesión o reintentar. */
  returnPath: string;
}

type State =
  | { kind: 'checking' }
  | { kind: 'denied'; reason: DemoAccessReason; expiresAt: string | null }
  | { kind: 'allowed'; diasRestantes: number | null };

const REASON_ICON: Partial<Record<DemoAccessReason, typeof LockClosedIcon>> = {
  sin_sesion: LockClosedIcon,
  sin_acceso: LockClosedIcon,
  expirado: ClockIcon,
  revocado: NoSymbolIcon,
  desactivada: WrenchScrewdriverIcon,
  no_disponible: ArrowPathIcon,
};

export default function DemoAccessGate({ slug, initialReason, initialMode, expiresAt, returnPath }: DemoAccessGateProps) {
  const t = useTranslations();
  const ta = useTranslations('demoAccess');
  const locale = useLocale();

  const fallback = DEMO_DEFAULTS_BY_SLUG[slug];
  const [entry, setEntry] = useState<CatalogItem | null>(null);
  const [mode, setMode] = useState<DemoAccessMode>(initialMode ?? fallback?.accessMode ?? 'privado');
  const [state, setState] = useState<State>(
    initialReason ? { kind: 'denied', reason: initialReason, expiresAt } : { kind: 'checking' },
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPublicCatalog(controller.signal)
      .then((items) => {
        const found = items.find((i) => i.slug === slug) ?? null;
        setEntry(found);
        if (found && !initialMode) setMode(found.accessMode);
      })
      .catch(() => undefined);

    // Abierta sin motivo (enlace directo o "Reintentar"): se pregunta al backend.
    if (!initialReason) {
      fetchDemoAccess(slug, controller.signal)
        .then((d) => {
          if (d.accessMode) setMode(d.accessMode);
          setState(d.allowed ? { kind: 'allowed', diasRestantes: d.diasRestantes } : { kind: 'denied', reason: d.reason, expiresAt: d.expiresAt });
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setState({ kind: 'denied', reason: hasSessionCookie() ? 'no_disponible' : 'sin_sesion', expiresAt: null });
        });
    }
    return () => controller.abort();
  }, [slug, initialReason, initialMode]);

  const name = demoName(entry ?? fallback ?? null, locale, slug);
  const requestHref = `/solicitar-demo?demos=${encodeURIComponent(slug)}`;
  const loginHref = `/login?redirect=${encodeURIComponent(returnPath)}`;
  const isPrivate = mode === 'privado';

  // Vista previa: textos de la tarjeta del hub (o de las demos por invitación).
  const card = DEMO_CARD_BY_SLUG[slug];
  const extra = EXTRA_DEMO_BY_SLUG[slug];
  const previewBase = card ? `${card.ns}.${card.key}` : extra ? `demoAccess.preview.${extra.key}` : null;
  const previewFeatures = card ? [0, 1, 2, 3] : [0, 1, 2];
  const PreviewIcon = card?.icon ?? extra?.icon ?? SparklesIcon;
  const previewColor = card?.color ?? extra?.color ?? 'from-primary-600 to-primary-800';

  const reason = state.kind === 'denied' ? state.reason : null;
  const StatusIcon = (reason && REASON_ICON[reason]) || KeyIcon;

  let message = '';
  if (state.kind === 'denied') {
    const r = state.reason;
    if (r === 'sin_sesion' || r === 'sin_acceso') message = ta(`message.${r}.${isPrivate ? 'privado' : 'solicitud'}`);
    else if (r === 'expirado') message = state.expiresAt ? ta('message.expiradoFecha', { date: formatDate(state.expiresAt, locale) }) : ta('message.expirado');
    else message = ta(`message.${r}`);
  }

  const primaryButton = 'inline-flex w-full items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors';
  const secondaryButton =
    'inline-flex w-full items-center justify-center gap-2 px-6 py-3 border-2 border-secondary-200 dark:border-secondary-700 text-secondary-800 dark:text-secondary-100 hover:bg-secondary-50 dark:hover:bg-secondary-900 font-semibold rounded-lg transition-colors';

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-secondary-950 dark:via-black dark:to-primary-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card variant="elevated" className="shadow-2xl">
          <CardContent className="p-6 sm:p-10 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <StatusIcon className="h-9 w-9 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
              <DemoAccessBadge mode={mode} activo={reason !== 'desactivada'} />
              {reason && (
                <span
                  className="inline-flex items-center rounded-full bg-secondary-100 dark:bg-secondary-800 px-2.5 py-0.5 text-xs font-semibold text-secondary-700 dark:text-secondary-200"
                  data-access-reason={reason}
                >
                  {ta(`status.${reason}`)}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 dark:text-white mb-4">{name}</h1>

            {state.kind === 'checking' && (
              <p className="text-secondary-600 dark:text-secondary-400" role="status">
                {ta('checking')}
              </p>
            )}

            {state.kind === 'allowed' && (
              <>
                <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-6">
                  {state.diasRestantes !== null ? ta('allowedDays', { days: state.diasRestantes }) : ta('allowed')}
                </p>
                <div className="max-w-md mx-auto">
                  <a href={returnPath} className={primaryButton}>
                    {ta('cta.open')}
                    <ArrowRightIcon className="h-5 w-5" />
                  </a>
                </div>
              </>
            )}

            {state.kind === 'denied' && (
              <>
                <p className="text-lg text-secondary-700 dark:text-secondary-300 mb-8 max-w-xl mx-auto">{message}</p>
                <div className="max-w-md mx-auto space-y-3">
                  {(state.reason === 'sin_sesion' || state.reason === 'sin_acceso') && (
                    <>
                      <Link href={requestHref} className={primaryButton}>
                        <KeyIcon className="h-5 w-5" />
                        {isPrivate ? ta('cta.requestCustom') : ta('cta.requestAccess')}
                      </Link>
                      {state.reason === 'sin_sesion' ? (
                        <Link href={loginHref} className={secondaryButton}>
                          <UserIcon className="h-5 w-5" />
                          {ta('cta.login')}
                        </Link>
                      ) : (
                        <Link href="/dashboard/demos" className={secondaryButton}>
                          {ta('cta.myDemos')}
                        </Link>
                      )}
                    </>
                  )}
                  {state.reason === 'expirado' && (
                    <>
                      <Link href={requestHref} className={primaryButton}>
                        <ClockIcon className="h-5 w-5" />
                        {ta('cta.moreTime')}
                      </Link>
                      <Link href="/dashboard/demos" className={secondaryButton}>
                        {ta('cta.myDemos')}
                      </Link>
                    </>
                  )}
                  {state.reason === 'revocado' && (
                    <>
                      <Link href={requestHref} className={primaryButton}>
                        <KeyIcon className="h-5 w-5" />
                        {ta('cta.requestAgain')}
                      </Link>
                      <Link href="/contact" className={secondaryButton}>
                        <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        {ta('cta.contact')}
                      </Link>
                    </>
                  )}
                  {state.reason === 'desactivada' && (
                    <>
                      <Link href="/demo" className={primaryButton}>
                        {ta('cta.otherDemos')}
                      </Link>
                      <Link href={requestHref} className={secondaryButton}>
                        {ta('cta.requestGuided')}
                      </Link>
                    </>
                  )}
                  {state.reason === 'no_disponible' && (
                    <>
                      <a href={returnPath} className={primaryButton}>
                        <ArrowPathIcon className="h-5 w-5" />
                        {ta('cta.retry')}
                      </a>
                      <Link href={requestHref} className={secondaryButton}>
                        {isPrivate ? ta('cta.requestCustom') : ta('cta.requestAccess')}
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="mt-6">
              <Link href="/demo" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                {ta('cta.allDemos')}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {previewBase && (
          <Card variant="bordered" className="mt-8">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${previewColor} p-6 rounded-t-xl flex items-start gap-4`}>
                <div className="p-3 bg-white/20 rounded-xl flex-shrink-0">
                  <PreviewIcon className="h-8 w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide font-semibold text-white/80 mb-1">{ta('previewTitle')}</p>
                  <h2 className="text-xl font-bold text-white">{t(`${previewBase}.title`)}</h2>
                  <p className="text-white/90 mt-1">{t(`${previewBase}.description`)}</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 uppercase tracking-wide mb-3">
                  {t('demos.includes')}
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {previewFeatures.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-secondary-700 dark:text-secondary-300">
                      <SparklesIcon className="h-4 w-4 mt-1 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      <span>{t(`${previewBase}.features.${i}`)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-secondary-500 dark:text-secondary-400">{ta('previewNote')}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
