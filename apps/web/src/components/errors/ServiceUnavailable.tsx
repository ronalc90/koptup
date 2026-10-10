'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

/**
 * Pantalla del panel y del portal cuando el backend no responde: no manda al
 * login (la sesión puede estar bien) y ofrece reintentar.
 */
export default function ServiceUnavailable({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('sessionState');
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-black px-4" data-testid="service-unavailable">
      <div role="alert" className="max-w-md w-full rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-secondary-950 p-8 text-center shadow-sm">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-amber-500 mb-4" aria-hidden="true" />
        <h1 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{t('unavailableTitle')}</h1>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6">{t('unavailableBody')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onRetry}>{t('retry')}</Button>
          <Button variant="outline" asChild>
            <Link href="/">{t('backHome')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
