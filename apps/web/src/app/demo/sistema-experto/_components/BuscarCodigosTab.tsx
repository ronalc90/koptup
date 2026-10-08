'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { InformationCircleIcon, MagnifyingGlassIcon, ServerIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { apiMotor, ErrorApi, type EstadisticasVectorizacion, type ResultadoBusquedaServidor } from '../_lib/api';
import { buscarEnCatalogo, type ResultadoLocal } from '../_lib/busqueda';
import { CATALOGO_EJEMPLO } from '../_lib/datos-ejemplo';
import { formatoCOP, formatoNumero, formatoPorcentaje } from '../_lib/formato';
import type { EstadoServidor } from '../_lib/useServidor';

type Fuente = 'ejemplo' | 'servidor';

type Resultado =
  | { fuente: 'ejemplo'; items: ResultadoLocal[]; ms: number }
  | { fuente: 'servidor'; items: ResultadoBusquedaServidor[]; ms: number };

const EJEMPLOS = ['example1', 'example2', 'example3', 'example4', 'example5'] as const;

export default function BuscarCodigosTab({
  estado,
  vector,
}: {
  estado: EstadoServidor;
  vector?: EstadisticasVectorizacion;
}) {
  const t = useTranslations('demoExpertSystem.search');
  const tCat = useTranslations('demoExpertSystem.categories');
  const locale = useLocale();
  const [fuente, setFuente] = useState<Fuente>('ejemplo');
  const [consulta, setConsulta] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vectorizados = vector?.cupsVectorizados ?? 0;
  const servidorDisponible = estado === 'ok' && vectorizados > 0;
  const fuenteEfectiva: Fuente = fuente === 'servidor' && servidorDisponible ? 'servidor' : 'ejemplo';

  const buscar = async (texto: string) => {
    const q = texto.trim();
    if (!q) return;
    setError(null);
    const inicio = performance.now();
    if (fuenteEfectiva === 'ejemplo') {
      const items = buscarEnCatalogo(q);
      setResultado({ fuente: 'ejemplo', items, ms: Math.max(1, Math.round(performance.now() - inicio)) });
      return;
    }
    setBuscando(true);
    try {
      const data = await apiMotor.buscarSemantica(q);
      setResultado({ fuente: 'servidor', items: data.resultados || [], ms: Math.round(performance.now() - inicio) });
    } catch (e) {
      setError(t(`error.${e instanceof ErrorApi ? e.tipo : 'servidor'}`));
      setResultado(null);
    } finally {
      setBuscando(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    buscar(consulta);
  };

  const usarEjemplo = (texto: string) => {
    setConsulta(texto);
    buscar(texto);
  };

  const cambiarFuente = (f: Fuente) => {
    setFuente(f);
    setResultado(null);
    setError(null);
  };

  const opcion = (f: Fuente, titulo: string, detalle: string, Icono: typeof ServerIcon, deshabilitada: boolean) => {
    const activa = fuenteEfectiva === f;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={activa}
        disabled={deshabilitada}
        onClick={() => cambiarFuente(f)}
        className={`flex flex-1 items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          activa
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-secondary-200 hover:border-primary-300 dark:border-secondary-700'
        }`}
      >
        <Icono className="mt-0.5 h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block font-medium text-secondary-900 dark:text-white">{titulo}</span>
          <span className="block text-xs text-secondary-600 dark:text-secondary-400">{detalle}</span>
        </span>
      </button>
    );
  };

  const total = resultado?.items.length ?? 0;

  return (
    <Card variant="bordered">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('title')}</h2>
        <p className="mt-1 text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
      </div>

      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-secondary-700 dark:text-secondary-300" id="fuente-busqueda">
          {t('sourceLabel')}
        </p>
        <div role="radiogroup" aria-labelledby="fuente-busqueda" className="flex flex-col gap-2 sm:flex-row">
          {opcion('ejemplo', t('sourceSample'), t('sourceSampleHint', { total: CATALOGO_EJEMPLO.length }), ComputerDesktopIcon, false)}
          {opcion(
            'servidor',
            t('sourceServer'),
            servidorDisponible ? t('sourceServerHint', { total: formatoNumero(vectorizados, locale) }) : t('sourceServerOff'),
            ServerIcon,
            !servidorDisponible
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="consulta-cups" className="sr-only">
          {t('inputLabel')}
        </label>
        <div className="relative flex-1">
          <input
            id="consulta-cups"
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full rounded-lg border border-secondary-300 px-4 py-3 pr-10 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-800 dark:text-white"
            disabled={buscando}
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-secondary-400" aria-hidden="true" />
        </div>
        <Button type="submit" disabled={buscando || !consulta.trim()} className="px-6">
          {buscando ? t('searching') : t('button')}
        </Button>
      </form>

      <div className="mb-6">
        <p className="mb-2 text-xs text-secondary-500 dark:text-secondary-400">{t('examples')}</p>
        <div className="flex flex-wrap gap-2">
          {EJEMPLOS.map((clave) => (
            <button
              key={clave}
              type="button"
              onClick={() => usarEjemplo(t(clave))}
              disabled={buscando}
              className="rounded-full bg-secondary-100 px-3 py-1 text-xs text-secondary-700 transition-colors hover:bg-primary-100 hover:text-primary-700 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:bg-primary-900 dark:hover:text-primary-300"
            >
              {t(clave)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-medium">{t('errorTitle')}</p>
          <p>{error}</p>
        </div>
      )}

      {resultado && (
        <p className="mb-3 text-sm text-secondary-600 dark:text-secondary-400" aria-live="polite">
          {t('results', { total, ms: resultado.ms })}
        </p>
      )}

      {resultado?.fuente === 'ejemplo' && total > 0 && (
        <ul className="space-y-3">
          {resultado.items.map(({ item, coincidencias }) => (
            <li key={item.codigo} className="rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="primary" size="sm">{item.codigo}</Badge>
                    <Badge variant="default" size="sm">{tCat(item.categoria)}</Badge>
                    {item.requiereAutorizacion && <Badge variant="warning" size="sm">{t('requiresAuth')}</Badge>}
                  </div>
                  <p className="font-medium text-secondary-900 dark:text-white break-words">
                    {locale === 'en' ? item.descripcionEn : item.descripcion}
                  </p>
                  {locale === 'en' && (
                    <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400 break-words">
                      {t('officialDescription', { descripcion: item.descripcion })}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                    {t('matches', { terminos: coincidencias.join(', ') })}
                  </p>
                </div>
                <div className="text-sm sm:text-right sm:shrink-0">
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('sampleTariffs')}</p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    ISS 2004: <span className="font-semibold">{formatoCOP(item.tarifas.ISS2004, locale)}</span>
                  </p>
                  <p className="text-secondary-700 dark:text-secondary-300">
                    SOAT: <span className="font-semibold">{formatoCOP(item.tarifas.SOAT, locale)}</span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {resultado?.fuente === 'servidor' && total > 0 && (
        <ul className="space-y-3">
          {resultado.items.map(({ cups, similaridad }) => (
            <li key={cups.codigo} className="rounded-lg border border-secondary-200 p-4 dark:border-secondary-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="primary" size="sm">{cups.codigo}</Badge>
                    {cups.categoria && <Badge variant="default" size="sm">{cups.categoria}</Badge>}
                  </div>
                  <p className="font-medium text-secondary-900 dark:text-white break-words">{cups.descripcion}</p>
                  <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">
                    {t('similarity', { porcentaje: formatoPorcentaje(similaridad * 100, locale) })}
                  </p>
                </div>
                {(cups.tarifaISS2004 || cups.tarifaSOAT) && (
                  <div className="text-sm sm:text-right sm:shrink-0">
                    {cups.tarifaISS2004 ? (
                      <p className="text-secondary-700 dark:text-secondary-300">
                        ISS 2004: <span className="font-semibold">{formatoCOP(cups.tarifaISS2004, locale)}</span>
                      </p>
                    ) : null}
                    {cups.tarifaSOAT ? (
                      <p className="text-secondary-700 dark:text-secondary-300">
                        SOAT: <span className="font-semibold">{formatoCOP(cups.tarifaSOAT, locale)}</span>
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!resultado && !error && !buscando && (
        <div className="py-10 text-center">
          <MagnifyingGlassIcon className="mx-auto mb-3 h-12 w-12 text-secondary-300 dark:text-secondary-600" aria-hidden="true" />
          <p className="font-medium text-secondary-900 dark:text-white">{t('emptyTitle')}</p>
          <p className="mx-auto max-w-md text-sm text-secondary-600 dark:text-secondary-400">{t('emptyText')}</p>
        </div>
      )}

      {resultado && total === 0 && (
        <div className="py-8 text-center">
          <p className="font-medium text-secondary-900 dark:text-white">{t('noResultsTitle')}</p>
          <p className="mx-auto max-w-md text-sm text-secondary-600 dark:text-secondary-400">
            {resultado.fuente === 'ejemplo'
              ? t('noResultsSample', { total: CATALOGO_EJEMPLO.length })
              : t('noResultsServer')}
          </p>
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs text-secondary-500 dark:text-secondary-400">
        <InformationCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('disclaimer')}
      </p>
    </Card>
  );
}
