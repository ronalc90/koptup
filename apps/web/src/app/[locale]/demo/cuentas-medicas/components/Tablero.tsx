'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { esErrorDeAcceso, tipoDeError, type TipoError } from '../api';
import {
  CLAVE_ESTADO_FACTURA,
  CLAVE_TIPO_GLOSA,
  COLOR_ESTADO_FACTURA,
  ESTADOS_FACTURA,
  formatearCOP,
  localeIntl,
} from '../lib/formato';
import { cargarEspacio, type Espacio } from '../lib/espacio';
import MensajeError from './MensajeError';

interface Props {
  version: number;
  /** Cambia cuando la persona pide actualizar (pestaña abierta pulsada otra vez). */
  recarga: number;
  onErrorAcceso: (error: unknown) => void;
  onAuditarEjemplo: () => void;
  onSubirPDF: () => void;
  onVerFacturas: () => void;
  onVerComo: () => void;
}

export default function Tablero({ version, recarga, onErrorAcceso, onAuditarEjemplo, onSubirPDF, onVerFacturas, onVerComo }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const [espacio, setEspacio] = useState<Espacio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<TipoError | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState('');

  const cargar = useCallback(async (manual = false) => {
    setCargando(true);
    setError(null);
    try {
      // Todo sale de las facturas y glosas guardadas en el servidor (una sola
      // fuente: los mismos números que la lista y el detalle).
      setEspacio(await cargarEspacio());
      setActualizadoEn(
        new Date().toLocaleTimeString(localeIntl(locale), {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Bogota',
        }),
      );
      if (manual) toast.success(t('common.updated'), { id: 'cm-actualizado' });
    } catch (e) {
      if (esErrorDeAcceso(e)) onErrorAcceso(e);
      else setError(tipoDeError(e));
    } finally {
      setCargando(false);
    }
  }, [locale, onErrorAcceso, t]);

  useEffect(() => {
    cargar();
  }, [cargar, version]);

  const recargaVista = useRef(recarga);
  useEffect(() => {
    if (recarga === recargaVista.current) return;
    recargaVista.current = recarga;
    cargar(true);
  }, [cargar, recarga]);

  const etiquetaEstado = (estado: string) => {
    const clave = CLAVE_ESTADO_FACTURA[estado];
    return clave ? t(`states.${clave}`) : estado;
  };
  const etiquetaTipo = (tipo: string) => {
    const clave = CLAVE_TIPO_GLOSA[tipo];
    return clave ? t(`denialTypes.${clave}`) : tipo;
  };

  const facturas = espacio?.facturas ?? [];
  const hayFacturas = facturas.length > 0;
  const pendientes = facturas.reduce((s, f) => s + f.revision.pendientes, 0);

  const porEstado = (() => {
    const grupos = new Map<string, { count: number; total: number }>();
    facturas.forEach(({ factura, revision }) => {
      const g = grupos.get(revision.estado) ?? { count: 0, total: 0 };
      g.count += 1;
      g.total += Number(factura.valorTotal) || 0;
      grupos.set(revision.estado, g);
    });
    const orden = (estado: string) => {
      const i = ESTADOS_FACTURA.indexOf(estado);
      return i === -1 ? ESTADOS_FACTURA.length : i;
    };
    return Array.from(grupos.entries())
      .map(([estado, g]) => ({ estado, ...g }))
      .sort((a, b) => orden(a.estado) - orden(b.estado));
  })();

  const porTipo = (() => {
    const grupos = new Map<string, { count: number; valor: number }>();
    facturas.forEach(({ glosas }) => {
      glosas
        .filter((g) => g.estado !== 'Rechazada')
        .forEach((g) => {
          const actual = grupos.get(g.tipo) ?? { count: 0, valor: 0 };
          actual.count += 1;
          actual.valor += Number(g.valorGlosado) || 0;
          grupos.set(g.tipo, actual);
        });
    });
    return Array.from(grupos.entries()).map(([tipo, g]) => ({ tipo, ...g }));
  })();

  const suma = (campo: 'valorTotal' | 'totalGlosas' | 'valorAceptado') =>
    facturas.reduce((s, { factura }) => s + (Number(factura[campo]) || 0), 0);

  const kpis = [
    { etiqueta: t('dashboard.kpis.invoices'), valor: String(facturas.length), icono: DocumentTextIcon, color: 'border-blue-500', fondo: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200' },
    { etiqueta: t('dashboard.kpis.billed'), valor: formatearCOP(suma('valorTotal'), locale), icono: BanknotesIcon, color: 'border-purple-500', fondo: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-200' },
    { etiqueta: t('dashboard.kpis.denied'), valor: formatearCOP(suma('totalGlosas'), locale), icono: ExclamationTriangleIcon, color: 'border-orange-500', fondo: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200' },
    { etiqueta: t('dashboard.kpis.toPay'), valor: formatearCOP(suma('valorAceptado'), locale), icono: CheckBadgeIcon, color: 'border-green-500', fondo: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' },
  ];

  const pasos = [
    { clave: 's1', icono: DocumentArrowUpIcon },
    { clave: 's2', icono: ScaleIcon },
    { clave: 's3', icono: DocumentArrowDownIcon },
  ] as const;

  return (
    <div className="space-y-6">
      {error && <MensajeError mensaje={t(`errors.${error}`)} onReintentar={() => cargar()} />}

      <Card variant="bordered" className="border-primary-200 dark:border-primary-900">
        <CardHeader>
          <CardTitle className="text-lg">{t('dashboard.start.title')}</CardTitle>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('dashboard.start.intro')}</p>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {pasos.map((p, i) => (
              <li key={p.clave} className="flex flex-col rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-200">
                    {i + 1}
                  </span>
                  <p.icono className="h-5 w-5 text-primary-600 dark:text-primary-300" aria-hidden="true" />
                  <p className="font-semibold text-gray-900 dark:text-white">{t(`dashboard.start.${p.clave}.title`)}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t(`dashboard.start.${p.clave}.desc`)}</p>
                {p.clave === 's1' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={onAuditarEjemplo} className="bg-green-600 hover:bg-green-700 focus:ring-green-500">
                      <SparklesIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                      {t('dashboard.emptyCta')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={onSubirPDF}>
                      {t('dashboard.emptyUpload')}
                    </Button>
                  </div>
                )}
                {p.clave === 's2' && (
                  <div className="mt-3">
                    {hayFacturas ? (
                      <Button size="sm" variant="outline" onClick={onVerFacturas}>
                        {pendientes > 0 ? t('dashboard.start.goPending', { count: pendientes }) : t('dashboard.start.goInvoices')}
                        <ArrowRightIcon className="ml-1.5 h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('dashboard.start.afterAudit')}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {espacio && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.summaryTitle')}</h2>
          <div className="flex items-center gap-3">
            {actualizadoEn && (
              <span className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
                {t('invoices.updatedAt', { time: actualizadoEn })}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => cargar(true)} disabled={cargando}>
              <ArrowPathIcon className={`mr-1.5 h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
              {t('common.refresh')}
            </Button>
          </div>
        </div>
      )}

      {cargando && !espacio && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white/70 dark:bg-gray-800" />
          ))}
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      )}

      {espacio && !hayFacturas && (
        <Card variant="bordered" className="text-center">
          <DocumentArrowUpIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" aria-hidden="true" />
          <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.emptyTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.emptyBody')}</p>
        </Card>
      )}

      {hayFacturas && (
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
                  {porEstado.map((item) => (
                    <li key={item.estado} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${COLOR_ESTADO_FACTURA[item.estado] ?? 'bg-gray-100 text-gray-800'}`}>
                          {etiquetaEstado(item.estado)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('dashboard.invoicesCount', { count: item.count })}
                        </span>
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{formatearCOP(item.total, locale)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('dashboard.byStateHint')}</p>
              </CardContent>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle className="text-lg">{t('dashboard.byType')}</CardTitle>
              </CardHeader>
              <CardContent>
                {porTipo.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.noDenials')}</p>
                ) : (
                  <ul className="space-y-3">
                    {porTipo.map((item) => (
                      <li key={item.tipo} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-3">
                          <span className="h-3 w-3 rounded-full bg-orange-500" aria-hidden="true" />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{etiquetaTipo(item.tipo)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t('dashboard.denialsCount', { count: item.count })}
                          </span>
                        </span>
                        <span className="font-semibold text-orange-600 dark:text-orange-300">{formatearCOP(item.valor, locale)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('dashboard.byTypeHint')}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <p className="text-sm text-gray-700 dark:text-gray-300">
        {t('dashboard.howNote')}{' '}
        <button
          type="button"
          onClick={onVerComo}
          className="rounded font-semibold text-primary-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-300"
        >
          {t('dashboard.howLink')}
        </button>
      </p>
    </div>
  );
}
