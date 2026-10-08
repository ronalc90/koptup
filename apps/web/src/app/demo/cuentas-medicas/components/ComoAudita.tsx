'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  CheckBadgeIcon,
  CpuChipIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  ScaleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TARIFARIO_DEMO } from '../lib/tarifarioDemo';
import { formatearCOP } from '../lib/formato';

const PASOS = [
  { clave: 's1', icono: DocumentTextIcon },
  { clave: 's2', icono: SparklesIcon },
  { clave: 's3', icono: ScaleIcon },
  { clave: 's4', icono: CpuChipIcon },
  { clave: 's5', icono: CheckBadgeIcon },
] as const;

const REGLAS = ['r1', 'r2', 'r3'] as const;
const NO_INCLUIDO = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8'] as const;

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function ComoAudita() {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const [busqueda, setBusqueda] = useState('');

  const tarifas = useMemo(() => {
    const q = normalizar(busqueda.trim());
    if (!q) return TARIFARIO_DEMO;
    return TARIFARIO_DEMO.filter((f) => f.codigo.includes(q) || normalizar(f.descripcion).includes(q));
  }, [busqueda]);

  return (
    <div className="space-y-6">
      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-xl">{t('howItWorks.title')}</CardTitle>
          <p className="mt-2 text-gray-700 dark:text-gray-300">{t('howItWorks.intro')}</p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {PASOS.map((p, i) => (
              <li key={p.clave} className="flex gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-200">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <p.icono className="h-5 w-5 text-primary-600 dark:text-primary-300" aria-hidden="true" />
                    {t(`howItWorks.pipeline.${p.clave}.title`)}
                  </p>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{t(`howItWorks.pipeline.${p.clave}.desc`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-lg">{t('howItWorks.rulesTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-800 dark:text-gray-200">
              {REGLAS.map((r) => (
                <li key={r}>{t(`howItWorks.rules.${r}`)}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <NoSymbolIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              {t('howItWorks.notIncludedTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-800 dark:text-gray-200">
              {NO_INCLUIDO.map((n) => (
                <li key={n}>{t(`howItWorks.notIncluded.${n}`)}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{t('howItWorks.projectNote')}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-lg">{t('howItWorks.tariffTitle')}</CardTitle>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{t('howItWorks.tariffNote')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="relative block max-w-md">
            <span className="sr-only">{t('howItWorks.tariffSearch')}</span>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t('howItWorks.tariffSearch')}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </label>
          {tarifas.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('howItWorks.tariffEmpty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    <th scope="col" className="px-3 py-2 font-semibold">{t('howItWorks.tariffCols.code')}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{t('howItWorks.tariffCols.description')}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t('howItWorks.tariffCols.value')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifas.map((f) => (
                    <tr key={f.codigo} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100">{f.codigo}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{f.descripcion}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-gray-900 dark:text-gray-100">{formatearCOP(f.valor, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
