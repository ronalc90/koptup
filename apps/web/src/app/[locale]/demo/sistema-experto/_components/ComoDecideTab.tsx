'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ArrowTopRightOnSquareIcon, CheckIcon, DocumentMagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { SLUG_OTRA_DEMO, type Permiso } from '../_lib/usePermisos';

const PASOS = ['s1', 's2', 's3', 's4', 's5'] as const;

const REALIDAD: Array<{ seccion: string; texto: string }> = [
  { seccion: 'tabs.resumen', texto: 'how.realSummary' },
  { seccion: 'tabs.reglas', texto: 'how.realRules' },
  { seccion: 'tabs.simulador', texto: 'how.realSimulator' },
  { seccion: 'tabs.buscar', texto: 'how.realSearch' },
  { seccion: 'how.rowCodes', texto: 'how.realCodes' },
  { seccion: 'how.rowReading', texto: 'how.realReading' },
];

export default function ComoDecideTab({ accesoOtraDemo }: { accesoOtraDemo: Permiso }) {
  const t = useTranslations('demoExpertSystem');
  const puedeAbrir = accesoOtraDemo === 'si';

  return (
    <div className="space-y-6">
      <Card variant="bordered">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('how.title')}</h2>
        <p className="mt-1 text-secondary-600 dark:text-secondary-400">{t('how.subtitle')}</p>
        <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {PASOS.map((paso) => (
            <li key={paso} className="rounded-lg bg-secondary-50 p-4 dark:bg-secondary-800">
              <p className="font-semibold text-secondary-900 dark:text-white">{t(`how.steps.${paso}Title`)}</p>
              <p className="mt-2 text-sm text-secondary-600 dark:text-secondary-400">{t(`how.steps.${paso}Text`)}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <h3 className="mb-3 text-lg font-semibold text-secondary-900 dark:text-white">{t('how.aiTitle')}</h3>
          <ul className="space-y-3 text-sm text-secondary-700 dark:text-secondary-300">
            <li className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
              {t('how.ai1')}
            </li>
            <li className="flex items-start gap-2">
              <XMarkIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              {t('how.ai2')}
            </li>
            <li className="flex items-start gap-2">
              <XMarkIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              {t('how.ai3')}
            </li>
          </ul>
        </Card>

        <Card variant="bordered">
          <h3 className="mb-3 text-lg font-semibold text-secondary-900 dark:text-white">{t('how.projectTitle')}</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-secondary-700 dark:text-secondary-300">
            <li>{t('how.project1')}</li>
            <li>{t('how.project2')}</li>
            <li>{t('how.project3')}</li>
            <li>{t('how.project4')}</li>
          </ul>
        </Card>
      </div>

      <Card variant="bordered">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <DocumentMagnifyingGlassIcon className="h-8 w-8 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{t('how.otherTitle')}</h3>
              <p className="mt-1 text-sm text-secondary-700 dark:text-secondary-300">{t('how.otherText')}</p>
              <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                {puedeAbrir ? t('how.otherHasAccess') : t('how.otherNeedsInvite')}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:shrink-0">
            {puedeAbrir ? (
              <Button size="sm" asChild>
                <Link href={`/demo/${SLUG_OTRA_DEMO}`}>
                  {t('how.otherOpen')}
                  <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/solicitar-demo?demos=${SLUG_OTRA_DEMO}`}>{t('how.otherRequest')}</Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card variant="bordered">
        <h3 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-white">{t('how.realTitle')}</h3>
        <dl className="divide-y divide-secondary-200 dark:divide-secondary-700">
          {REALIDAD.map(({ seccion, texto }) => (
            <div key={seccion} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-4 sm:gap-4">
              <dt className="font-medium text-secondary-900 dark:text-white">{t(seccion)}</dt>
              <dd className="text-sm text-secondary-700 dark:text-secondary-300 sm:col-span-3">{t(texto)}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
