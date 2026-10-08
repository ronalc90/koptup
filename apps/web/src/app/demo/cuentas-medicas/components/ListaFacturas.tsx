'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { auditoriaAPI, esErrorDeAcceso } from '../api';
import type { Factura, FiltrosFacturas } from '../tipos-auditoria';
import {
  CLAVE_ESTADO_FACTURA,
  COLOR_ESTADO_FACTURA,
  ESTADOS_FACTURA,
  formatearCOP,
  formatearFecha,
  localeIntl,
  nombreEntidad,
} from '../lib/formato';
import { exportarListaCSV } from '../lib/reportes';
import MensajeError from './MensajeError';

const POR_PAGINA = 20;

interface Props {
  version: number;
  filtros: FiltrosFacturas;
  onCambiarFiltros: (filtros: FiltrosFacturas) => void;
  onVerDetalle: (id: string) => void;
  onErrorAcceso: () => void;
  onCambioDatos: () => void;
}

export default function ListaFacturas({ version, filtros, onCambiarFiltros, onVerDetalle, onErrorAcceso, onCambioDatos }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<'network' | 'server' | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [porEliminar, setPorEliminar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [actualizadoEn, setActualizadoEn] = useState('');

  const etiquetas = { prestador: t('entities.provider'), pagador: t('entities.payer') };

  const cargar = useCallback(
    async (paginaACargar: number) => {
      setCargando(true);
      setError(null);
      try {
        const res = await auditoriaAPI.obtenerFacturas(filtros, paginaACargar, POR_PAGINA);
        setFacturas((prev) => (paginaACargar === 1 ? res.facturas : [...prev, ...res.facturas]));
        setTotal(res.total);
        setPagina(paginaACargar);
        setActualizadoEn(
          new Date().toLocaleTimeString(localeIntl(locale), {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'America/Bogota',
          }),
        );
      } catch (e) {
        if (esErrorDeAcceso(e)) onErrorAcceso();
        else setError(e instanceof Error && e.message === 'network' ? 'network' : 'server');
      } finally {
        setCargando(false);
      }
    },
    [filtros, locale, onErrorAcceso],
  );

  useEffect(() => {
    cargar(1);
  }, [cargar, version]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return facturas;
    return facturas.filter((f) => f.numeroFactura.toLowerCase().includes(q));
  }, [busqueda, facturas]);

  const hayFiltros = Boolean(filtros.estado || filtros.desde || filtros.hasta || busqueda);

  const eliminar = async (factura: Factura) => {
    setEliminando(true);
    try {
      await auditoriaAPI.eliminarFactura(factura._id);
      toast.success(t('invoices.deleted', { number: factura.numeroFactura }));
      setPorEliminar(null);
      onCambioDatos();
    } catch (e) {
      if (esErrorDeAcceso(e)) onErrorAcceso();
      else toast.error(t('errors.delete'));
    } finally {
      setEliminando(false);
    }
  };

  const etiquetaEstado = (estado: string) => {
    const clave = CLAVE_ESTADO_FACTURA[estado];
    return clave ? t(`states.${clave}`) : estado;
  };

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
          <Button variant="outline" size="sm" onClick={() => cargar(1)} disabled={cargando}>
            <ArrowPathIcon className={`mr-1.5 h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
            {t('common.refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={visibles.length === 0}
            onClick={() => exportarListaCSV(visibles, locale, t, CLAVE_ESTADO_FACTURA)}
          >
            <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t('invoices.exportCsv')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="block md:col-span-1">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoices.search')}</span>
          <span className="relative block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="FEDL-10432"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoices.state')}</span>
          <select
            value={filtros.estado}
            onChange={(e) => onCambiarFiltros({ ...filtros, estado: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoices.to')}</span>
          <input
            type="date"
            value={filtros.hasta}
            min={filtros.desde || undefined}
            onChange={(e) => onCambiarFiltros({ ...filtros, hasta: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </label>
      </div>
      {hayFiltros && (
        <button
          type="button"
          onClick={() => {
            setBusqueda('');
            onCambiarFiltros({ estado: '', desde: '', hasta: '' });
          }}
          className="text-sm font-medium text-primary-700 underline dark:text-primary-300"
        >
          {t('invoices.clear')}
        </button>
      )}

      {error && <MensajeError mensaje={t(`errors.${error}`)} onReintentar={() => cargar(1)} />}

      {cargando && facturas.length === 0 && !error && (
        <div className="py-10 text-center text-gray-600 dark:text-gray-400" aria-busy="true">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" aria-hidden="true" />
          {t('common.loading')}
        </div>
      )}

      {!cargando && !error && visibles.length === 0 && (
        <div className="py-10 text-center">
          <DocumentTextIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">{hayFiltros ? t('invoices.noResults') : t('invoices.empty')}</p>
        </div>
      )}

      {visibles.length > 0 && (
        <ul className="space-y-3">
          {visibles.map((f) => (
            <li key={f._id} className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md dark:border-gray-700">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="break-all text-lg font-semibold text-gray-900 dark:text-white">{f.numeroFactura}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_ESTADO_FACTURA[f.estado] ?? 'bg-gray-100 text-gray-800'}`}>
                      {etiquetaEstado(f.estado)}
                    </span>
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
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950" role="alert">
                    <span className="text-sm text-red-800 dark:text-red-200">{t('invoices.deleteQuestion', { number: f.numeroFactura })}</span>
                    <Button size="sm" variant="danger" onClick={() => eliminar(f)} isLoading={eliminando} disabled={eliminando}>
                      {t('common.confirmDelete')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPorEliminar(null)} disabled={eliminando}>
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
                      className="rounded-lg border-2 border-red-600 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {facturas.length > 0 && (
        <div className="flex flex-col items-center gap-2 text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:justify-between">
          <span>{t('invoices.showing', { shown: visibles.length, total })}</span>
          {facturas.length < total && (
            <Button size="sm" variant="outline" onClick={() => cargar(pagina + 1)} disabled={cargando}>
              {t('invoices.loadMore')}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
