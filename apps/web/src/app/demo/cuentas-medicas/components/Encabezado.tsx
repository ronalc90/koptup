'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BeakerIcon,
  LockClosedIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

export type Vista = 'tablero' | 'facturas' | 'detalle' | 'como';

interface Props {
  vista: Vista;
  onCambiarVista?: (vista: Vista) => void;
  onAuditar?: () => void;
  mostrarNavegacion: boolean;
}

const PESTANAS: Array<{ id: Exclude<Vista, 'detalle'>; clave: 'dashboard' | 'invoices' | 'howItWorks' }> = [
  { id: 'tablero', clave: 'dashboard' },
  { id: 'facturas', clave: 'invoices' },
  { id: 'como', clave: 'howItWorks' },
];

export default function Encabezado({ vista, onCambiarVista, onAuditar, mostrarNavegacion }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const activa = vista === 'detalle' ? 'facturas' : vista;

  return (
    <header className="mb-6">
      <Link
        href="/demo"
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-700 hover:bg-white/70 dark:text-gray-300 dark:hover:bg-white/10"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {t('backToDemos')}
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              <BeakerIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('badges.sampleData')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white/80 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200">
              <LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {t('badges.private')}
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">{t('title')}</h1>
          <p className="max-w-3xl text-gray-700 dark:text-gray-300">{t('subtitle')}</p>
          <Link
            href="/rag"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-700 underline decoration-primary-300 underline-offset-4 hover:text-primary-800 hover:decoration-primary-600 dark:text-primary-300"
          >
            {t('ragLink')}
            <ArrowRightIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          </Link>
        </div>
        {mostrarNavegacion && onAuditar && (
          <Button onClick={onAuditar} className="flex-shrink-0 self-start bg-green-600 hover:bg-green-700 focus:ring-green-500">
            <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            {t('auditButton')}
          </Button>
        )}
      </div>

      {mostrarNavegacion && onCambiarVista && (
        <nav aria-label={t('tabs.label')} className="mt-6 overflow-x-auto">
          <ul className="flex min-w-max gap-1 rounded-xl border border-gray-200 bg-white/80 p-1 dark:border-gray-700 dark:bg-gray-900/80">
            {PESTANAS.map((p) => {
              const seleccionada = activa === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onCambiarVista(p.id)}
                    aria-current={seleccionada ? 'page' : undefined}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      seleccionada
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {t(`tabs.${p.clave}`)}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
