'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  BanknotesIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { auditoriaAPI, esErrorDeAcceso } from '../api';
import type { Estadisticas } from '../tipos-auditoria';
import {
  CLAVE_ESTADO_FACTURA,
  CLAVE_TIPO_GLOSA,
  COLOR_ESTADO_FACTURA,
  formatearCOP,
} from '../lib/formato';
import MensajeError from './MensajeError';

interface Props {
  version: number;
  onErrorAcceso: () => void;
  onAuditarEjemplo: () => void;
  onSubirPDF: () => void;
}

const PASOS = [
  { clave: 's1', icono: DocumentArrowUpIcon },
  { clave: 's2', icono: SparklesIcon },
  { clave: 's3', icono: ScaleIcon },
  { clave: 's4', icono: CpuChipIcon },
  { clave: 's5', icono: CheckBadgeIcon },
] as const;

export default function Tablero({ version, onErrorAcceso, onAuditarEjemplo, onSubirPDF }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<'network' | 'server' | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEstadisticas(await auditoriaAPI.obtenerEstadisticas());
    } catch (e) {
      if (esErrorDeAcceso(e)) onErrorAcceso();
      else setError(e instanceof Error && e.message === 'network' ? 'network' : 'server');
    } finally {
      setCargando(false);
    }
  }, [onErrorAcceso]);

  useEffect(() => {
    cargar();
  }, [cargar, version]);

  const etiquetaEstado = (estado: string) => {
    const clave = CLAVE_ESTADO_FACTURA[estado];
    return clave ? t(`states.${clave}`) : estado;
  };
  const etiquetaTipo = (tipo: string) => {
    const clave = CLAVE_TIPO_GLOSA[tipo];
    return clave ? t(`denialTypes.${clave}`) : tipo;
  };

  const kpis = estadisticas
    ? [
        { etiqueta: t('dashboard.kpis.invoices'), valor: String(estadisticas.totalFacturas), icono: DocumentTextIcon, color: 'border-blue-500', fondo: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' },
        { etiqueta: t('dashboard.kpis.billed'), valor: formatearCOP(estadisticas.totales.valorTotal, locale), icono: BanknotesIcon, color: 'border-purple-500', fondo: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200' },
        { etiqueta: t('dashboard.kpis.denied'), valor: formatearCOP(estadisticas.totales.totalGlosas, locale), icono: ExclamationTriangleIcon, color: 'border-orange-500', fondo: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200' },
        { etiqueta: t('dashboard.kpis.toPay'), valor: formatearCOP(estadisticas.totales.valorAceptado, locale), icono: CheckBadgeIcon, color: 'border-green-500', fondo: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {error && <MensajeError mensaje={t(`errors.${error}`)} onReintentar={cargar} />}

      {cargando && !estadisticas && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white/70 dark:bg-gray-800" />
          ))}
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      )}

      {estadisticas && estadisticas.totalFacturas === 0 && (
        <Card variant="bordered" className="text-center">
          <DocumentArrowUpIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" aria-hidden="true" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">{t('dashboard.emptyTitle')}</h2>
          <p className="mb-5 text-gray-600 dark:text-gray-400">{t('dashboard.emptyBody')}</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={onAuditarEjemplo} className="bg-green-600 hover:bg-green-700 focus:ring-green-500">
              <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              {t('dashboard.emptyCta')}
            </Button>
            <Button variant="outline" onClick={onSubirPDF}>
              {t('dashboard.emptyUpload')}
            </Button>
          </div>
        </Card>
      )}

      {estadisticas && estadisticas.totalFacturas > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.etiqueta} variant="bordered" padding="md" className={`border-l-4 ${k.color}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{k.etiqueta}</p>
                    <p className="truncate text-2xl font-bold text-gray-900 dark:text-white">{k.valor}</p>
                  </div>
                  <div className={`flex-shrink-0 rounded-full p-3 ${k.fondo}`}>
                    <k.icono className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.kpiHint')}</p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.byState')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {estadisticas.estadoPorFactura.map((item) => (
                    <li key={item._id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${COLOR_ESTADO_FACTURA[item._id] ?? 'bg-gray-100 text-gray-800'}`}>
                          {etiquetaEstado(item._id)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('dashboard.invoicesCount', { count: item.count })}
                        </span>
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatearCOP(item.total, locale)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.byType')}</CardTitle>
              </CardHeader>
              <CardContent>
                {estadisticas.glosasPorTipo.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.noDenials')}</p>
                ) : (
                  <ul className="space-y-3">
                    {estadisticas.glosasPorTipo.map((item) => (
                      <li key={item._id} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full bg-orange-500" aria-hidden="true" />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{etiquetaTipo(item._id)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('dashboard.denialsCount', { count: item.count })}
                          </span>
                        </span>
                        <span className="font-semibold text-orange-600 dark:text-orange-300">{formatearCOP(item.valorTotal, locale)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-lg">{t('dashboard.stepsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PASOS.map((p, i) => (
              <li key={p.clave} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-200">
                    {i + 1}
                  </span>
                  <p.icono className="h-5 w-5 text-primary-600 dark:text-primary-300" aria-hidden="true" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">{t(`dashboard.steps.${p.clave}.title`)}</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t(`dashboard.steps.${p.clave}.desc`)}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
