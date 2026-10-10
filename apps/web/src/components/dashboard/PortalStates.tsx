'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Card, { CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/** Cargando una sección del portal. */
export function PortalLoading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-64" role="status" aria-busy="true">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      {label ? <span className="sr-only">{label}</span> : null}
    </div>
  );
}

/**
 * La API falló: lo dice y ofrece reintentar (nunca se muestran datos de
 * ejemplo en su lugar).
 */
export function PortalError({ message, onRetry, compact = false }: { message: string; onRetry?: () => void; compact?: boolean }) {
  const tc = useTranslations('portalCommon');
  return (
    <Card variant="bordered">
      <CardContent className={compact ? 'p-5 text-center' : 'p-10 text-center'} role="alert" data-testid="portal-error">
        <ExclamationTriangleIcon className={`${compact ? 'h-8 w-8' : 'h-12 w-12'} mx-auto text-amber-500 mb-3`} />
        <p className="text-secondary-700 dark:text-secondary-300 mb-4">{message}</p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            {tc('retry')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Sección sin datos todavía: explica qué verá aquí y, si aplica, el siguiente paso. */
export function PortalEmpty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: { href: string; label: string };
}) {
  return (
    <Card variant="bordered">
      <CardContent className="p-10 text-center" data-testid="portal-empty">
        {Icon ? <Icon className="h-12 w-12 mx-auto text-secondary-400 mb-4" /> : null}
        <p className="font-semibold text-secondary-900 dark:text-white">{title}</p>
        {body ? <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2 max-w-xl mx-auto">{body}</p> : null}
        {action ? (
          <Button className="mt-5" size="sm" asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
