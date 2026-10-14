'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { auditoriaAPI, esErrorDeAcceso, tipoDeError, type TipoError } from '../api';
import type { FiltrosFacturas } from '../tipos-auditoria';
import {
  CLAVE_ESTADO_FACTURA,
  COLOR_ESTADO_FACTURA,
  ESTADOS_FACTURA,
  formatearCOP,
  formatearFecha,
  localeIntl,
  nombreEntidad,
} from '../lib/formato';
import { cargarEspacio, MAX_FACTURAS, type FacturaRevisada } from '../lib/espacio';
import { diaColombia } from '../lib/revision';
import { exportarListaCSV } from '../lib/reportes';
import MensajeError from './MensajeError';

const POR_PAGINA = 20;

interface Props {
  version: number;
  /** Cambia cuando la persona pide actualizar (pestaña abierta pulsada otra vez). */
  recarga: number;
  filtros: FiltrosFacturas;
  onCambiarFiltros: (filtros: FiltrosFacturas) => void;
  onVerDetalle: (id: string) => void;
  onErrorAcceso: (error: unknown) => void;
  onCambioDatos: () => void;
}

export default function ListaFacturas({ version, recarga, filtros, onCambiarFiltros, onVerDetalle, onErrorAcceso, onCambioDatos }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const [facturas, setFacturas] = useState<FacturaRevisada[]>([]);
  const [total, setTotal] = useState(0);
  const [mostradas, setMostradas] = useState(POR_PAGINA);
  const [cargando, setCargando] = useState(true);
  const [cargadoUnaVez, setCargadoUnaVez] = useState(false);
  const [error, setError] = useState<TipoError | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [porEliminar, setPorEliminar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [actualizadoEn, setActualizadoEn] = useState('');
  // Al pedir confirmación para eliminar, el foco pasa a «No» (la opción segura).
  const botonNo = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (porEliminar) botonNo.current?.focus();
  }, [porEliminar]);

  const etiquetas = { prestador: t('entities.provider'), pagador: t('entities.payer'), nit: t('entities.nit') };

  const cargar = useCallback(async (manual = false) => {
    setCargando(true);
    setError(null);
    try {
      const espacio = await cargarEspacio();
      setFacturas(espacio.facturas);
      setTotal(espacio.total);
      setCargadoUnaVez(true);
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

  // Al cambiar un filtro se vuelve a la primera "página".
  useEffect(() => {
    setMostradas(POR_PAGINA);
  }, [busqueda, filtros]);

  const coincidentes = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return facturas.filter(({ factura, revision }) => {
      if (q && !factura.numeroFactura.toLowerCase().includes(q)) return false;
      if (filtros.estado && revision.estado !== filtros.estado) return false;
      const dia = diaColombia(factura.fechaEmision);
      if (filtros.desde && dia < filtros.desde) return false;
      if (filtros.hasta && dia > filtros.hasta) return false;
      return true;
    });
  }, [busqueda, facturas, filtros]);

  const visibles = coincidentes.slice(0, mostradas);
  const hayFiltros = Boolean(filtros.estado || filtros.desde || filtros.hasta || busqueda);

  const eliminar = async (item: FacturaRevisada) => {
    setEliminando(true);
    try {
      await auditoriaAPI.eliminarFactura(item.factura._id);
      toast.success(t('invoices.deleted', { number: item.factura.numeroFactura }));
      setPorEliminar(null);
      onCambioDatos();
    } catch (e) {
      if (esErrorDeAcceso(e)) onErrorAcceso(e);
      else {
        const tipo = tipoDeError(e);
        toast.error(tipo === 'rateLimited' || tipo === 'unavailable' || tipo === 'network' ? t(`errors.${tipo}`) : t('errors.delete'));
      }
    } finally {
      setEliminando(false);
    }
  };

  const etiquetaEstado = (estado: string) => {
    const clave = CLAVE_ESTADO_FACTURA[estado];
    return clave ? t(`states.${clave}`) : estado;
  };

  const claseCampo =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white';

  return (
    <Card variant="bordered" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('invoices.title')}</h2>
          {actualizadoEn && (
            <p className="text-xs text-gray-500 dark:text-gray-400" aria-live="polite">
              {t('invoices.updatedAt', { time: actualizadoEn })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => cargar(true)} disabled={cargando}>
            <ArrowPathIcon className={`mr-1.5 h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('common.refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={coincidentes.length === 0}
            onClick={() => exportarListaCSV(coincidentes, locale, t, CLAVE_ESTADO_FACTURA)}
          >
            <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t('invoices.exportCsv')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoices.search')}</span>
          <span className="relative block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="FEDL-12345"
              className={`${claseCampo} pl-9`}
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoices.state')}</span>
          <select
            value={filtros.estado}
            onChange={(e) => onCambiarFiltros({ ...filtros, estado: e.target.value })}
            className={claseCampo}
          >
            <option value="">{t('invoices.allStates')}</option>
            {ESTADOS_FACTURA.map((e) => (
              <option key={e} value={e}>
                {etiquetaEstado(e)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoices.from')}</span>
          <input
            type="date"
            value={filtros.desde}
            max={filtros.hasta || undefined}
            onChange={(e) => onCambiarFiltros({ ...filtros, desde: e.target.value })}
            className={claseCampo}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoices.to')}</span>
          <input
            type="date"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={(e) => onCambiarFiltros({ ...filtros, hasta: e.target.value })}
            className={claseCampo}
          />
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('invoices.stateHint')}</p>
      {hayFiltros && (
        <button
          type="button"
          onClick={() => {
            setBusqueda('');
            onCambiarFiltros({ estado: '', desde: '', hasta: '' });
          }}
          className="rounded text-sm font-medium text-primary-700 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-primary-300"
        >
          {t('invoices.clear')}
        </button>
      )}

      {error && <MensajeError mensaje={t(`errors.${error}`)} onReintentar={() => cargar()} />}

      {cargando && !cargadoUnaVez && !error && (
        <div className="py-10 text-center text-gray-600 dark:text-gray-400" aria-busy="true">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" aria-hidden="true" />
          {t('common.loading')}
        </div>
      )}

      {cargadoUnaVez && !error && coincidentes.length === 0 && (
        <div className="py-10 text-center">
          <DocumentTextIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">{hayFiltros ? t('invoices.noResults') : t('invoices.empty')}</p>
        </div>
      )}

      {visibles.length > 0 && (
        <ul className="space-y-3">
          {visibles.map((item) => {
            const { factura: f, revision } = item;
            return (
              <li key={f._id} className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="break-all text-lg font-semibold text-gray-900 dark:text-white">{f.numeroFactura}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_ESTADO_FACTURA[revision.estado] ?? 'bg-gray-100 text-gray-800'}`}>
                        {etiquetaEstado(revision.estado)}
                      </span>
                      {revision.glosas > 0 && (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {revision.pendientes > 0
                            ? t('invoices.pendingDenials', { count: revision.pendientes })
                            : t('invoices.reviewClosed')}
                        </span>
                      )}
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 xl:grid-cols-6">
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('invoices.columns.provider')}</dt>
                        <dd className="font-medium text-gray-900 dark:text-gray-100">{nombreEntidad(f.ips?.nombre, 'prestador', etiquetas)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('invoices.columns.payer')}</dt>
                        <dd className="font-medium text-gray-900 dark:text-gray-100">{nombreEntidad(f.eps?.nombre, 'pagador', etiquetas)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('invoices.columns.registered')}</dt>
                        <dd className="font-medium text-gray-900 dark:text-gray-100">{formatearFecha(f.fechaEmision, locale)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('invoices.columns.billed')}</dt>
                        <dd className="font-semibold text-blue-700 dark:text-blue-300">{formatearCOP(f.valorTotal, locale)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('invoices.columns.denied')}</dt>
                        <dd className="font-semibold text-orange-600 dark:text-orange-300">{formatearCOP(f.totalGlosas, locale)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500 dark:text-gray-400">{t('invoices.columns.toPay')}</dt>
                        <dd className="font-semibold text-green-700 dark:text-green-300">{formatearCOP(f.valorAceptado, locale)}</dd>
                      </div>
                    </dl>
                  </div>

                  {porEliminar === f._id ? (
                    <div
                      className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950"
                      role="alert"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape' && !eliminando) setPorEliminar(null);
                      }}
                    >
                      <span className="text-sm text-red-800 dark:text-red-200">{t('invoices.deleteQuestion', { number: f.numeroFactura })}</span>
                      <Button size="sm" variant="danger" onClick={() => eliminar(item)} isLoading={eliminando} disabled={eliminando}>
                        {t('common.confirmDelete')}
                      </Button>
                      <Button ref={botonNo} size="sm" variant="ghost" onClick={() => setPorEliminar(null)} disabled={eliminando}>
                        {t('common.keep')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onVerDetalle(f._id)}>
                        {t('invoices.view')}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setPorEliminar(f._id)}
                        aria-label={`${t('common.delete')} ${f.numeroFactura}`}
                        title={`${t('common.delete')} ${f.numeroFactura}`}
                        className="rounded-lg border-2 border-red-600 p-1.5 text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:hover:bg-red-950"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {coincidentes.length > 0 && (
        <div className="flex flex-col items-center gap-2 text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:justify-between">
          <span>{t('invoices.showing', { shown: visibles.length, total: coincidentes.length })}</span>
          {visibles.length < coincidentes.length && (
            <Button size="sm" variant="outline" onClick={() => setMostradas((n) => n + POR_PAGINA)}>
              {t('invoices.loadMore')}
            </Button>
          )}
        </div>
      )}
      {total > MAX_FACTURAS && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('invoices.capped', { max: MAX_FACTURAS, total })}</p>
      )}
    </Card>
  );
}
