'use client';

import { useTranslations } from 'next-intl';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export default function MensajeError({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  const t = useTranslations('demoMedicalAccounts.common');
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="flex items-start gap-2">
        <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <span>{mensaje}</span>
      </p>
      {onReintentar && (
        <Button variant="outline" size="sm" onClick={onReintentar} className="flex-shrink-0 border-red-600 text-red-700 hover:bg-red-100 dark:text-red-200">
          {t('retry')}
        </Button>
      )}
    </div>
  );
}
