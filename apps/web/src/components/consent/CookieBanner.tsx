'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CakeIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { HAS_TRACKING_TAGS } from '@/lib/analytics';
import {
  ACCEPT_ALL_CHOICE,
  ESSENTIAL_ONLY_CHOICE,
  onCookiePreferencesChange,
  readCookiePreferences,
  saveCookiePreferences,
} from '@/lib/cookie-consent';

/** Ruta con el detalle de las cookies y los interruptores por categoría. */
const COOKIES_PATH = '/cookies';

/**
 * Banner de cookies. Aparece mientras el visitante no haya elegido (no existe
 * `cookie_preferences`): "Aceptar" activa todas las categorías y "Rechazar"
 * deja solo las esenciales; "Configurar cookies" lleva a /cookies. En /cookies
 * no se muestra porque esa página ya tiene sus propios controles. Tampoco se
 * muestra si el build no tiene ninguna etiqueta configurada
 * (`HAS_TRACKING_TAGS`): no habría cookies opcionales que aceptar.
 */
export default function CookieBanner() {
  const t = useTranslations('cookieBanner');
  const pathname = usePathname();
  // Solo en el cliente (localStorage): arranca oculto para no desajustar la
  // hidratación.
  const [needsChoice, setNeedsChoice] = useState(false);

  useEffect(() => {
    if (!HAS_TRACKING_TAGS) return;
    const sync = () => setNeedsChoice(readCookiePreferences() === null);
    sync();
    return onCookiePreferencesChange(sync);
  }, []);

  if (!HAS_TRACKING_TAGS || !needsChoice || pathname === COOKIES_PATH) return null;

  return (
    <div
      role="region"
      aria-label={t('ariaLabel')}
      className="fixed inset-x-0 bottom-0 z-[90] p-4 sm:p-6 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-4xl mx-auto rounded-2xl border border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900 shadow-hard p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <CakeIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-secondary-900 dark:text-white">{t('title')}</p>
            <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
              {t('text')}{' '}
              <Link
                href={COOKIES_PATH}
                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('settings')}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex gap-2 md:flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 md:flex-none"
            onClick={() => saveCookiePreferences(ESSENTIAL_ONLY_CHOICE)}
          >
            {t('reject')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1 md:flex-none"
            onClick={() => saveCookiePreferences(ACCEPT_ALL_CHOICE)}
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
