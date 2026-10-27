'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  BeakerIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useServidor } from './_lib/useServidor';
import { usePermisos } from './_lib/usePermisos';
import { CODIGOS_REGLAS, CONFIG_DEFECTO, mismaConfig, type ConfigMotor } from './_lib/motor';
import { escribirBorrador, leerBorrador, normalizarConfig } from './_lib/borrador';
import { MANUALES } from './_lib/datos-ejemplo';
import AvisoAcceso from './_components/AvisoAcceso';
import EstadoServidorBadge from './_components/EstadoServidorBadge';
import PrimerosPasos, { type Progreso } from './_components/PrimerosPasos';
import ResumenTab from './_components/ResumenTab';
import BuscarCodigosTab from './_components/BuscarCodigosTab';
import ReglasTab from './_components/ReglasTab';
import SimuladorTab from './_components/SimuladorTab';
import ComoDecideTab from './_components/ComoDecideTab';
import type { TabId } from './_lib/tabs';

const TABS: Array<{ id: TabId; icon: typeof ChartBarIcon }> = [
  { id: 'resumen', icon: ChartBarIcon },
  { id: 'simulador', icon: BeakerIcon },
  { id: 'reglas', icon: Cog6ToothIcon },
  { id: 'buscar', icon: MagnifyingGlassIcon },
  { id: 'como', icon: LightBulbIcon },
];

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-secondary-900';

export default function SistemaExpertoPage() {
  const t = useTranslations('demoExpertSystem');
  const [tab, setTab] = useState<TabId>('resumen');
  const servidor = useServidor();
  const permisos = usePermisos();
  const { guardarConfig } = servidor;
  const configServidor = servidor.datos.config;
  const tabsRef = useRef<HTMLDivElement>(null);

  const guardada = useMemo<ConfigMotor>(
    () => (configServidor ? normalizarConfig(configServidor) ?? CONFIG_DEFECTO : CONFIG_DEFECTO),
    [configServidor]
  );
  const [borrador, setBorrador] = useState<ConfigMotor>(CONFIG_DEFECTO);
  const [editado, setEditado] = useState(false);
  const [progreso, setProgreso] = useState<Progreso>({ simulador: false, cambio: false, efecto: false });
  const hayCambios = !mismaConfig(borrador, guardada);

  // Mientras no haya cambios propios, el borrador sigue a la configuración guardada.
  useEffect(() => {
    if (!editado) setBorrador(guardada);
  }, [guardada, editado]);

  // Va después del efecto anterior (los efectos corren en orden): el borrador
  // guardado en este navegador se recupera después de montar (no en el render
  // inicial, para que el HTML del servidor y el del navegador coincidan).
  useEffect(() => {
    const previo = leerBorrador();
    if (previo) {
      setBorrador(previo);
      setEditado(true);
    }
  }, []);

  useEffect(() => {
    if (editado && hayCambios) setProgreso((p) => (p.cambio ? p : { ...p, cambio: true }));
    if (tab === 'simulador') {
      setProgreso((p) => {
        const efecto = p.efecto || (editado && hayCambios);
        return p.simulador && p.efecto === efecto ? p : { ...p, simulador: true, efecto };
      });
    }
  }, [tab, editado, hayCambios]);

  const cambiarBorrador = useCallback((config: ConfigMotor) => {
    setBorrador(config);
    setEditado(true);
    escribirBorrador(config);
  }, []);

  const descartar = useCallback(() => {
    setBorrador(guardada);
    setEditado(false);
    escribirBorrador(null);
  }, [guardada]);

  const guardar = useCallback(async () => {
    if (!configServidor) return;
    // Conserva los códigos que el servidor conoce pero esta demo no muestra.
    const otros = (configServidor.reglasHabilitadas || []).filter((c) => !CODIGOS_REGLAS.includes(c));
    await guardarConfig({
      ...configServidor,
      toleranciaDiferenciaTarifa: borrador.toleranciaDiferenciaTarifa,
      manualPorDefecto: borrador.manualPorDefecto,
      reglasHabilitadas: [...otros, ...borrador.reglasHabilitadas],
    });
    setEditado(false);
    escribirBorrador(null);
  }, [borrador, configServidor, guardarConfig]);

  const manuales = useMemo(
    () => configServidor?.manualesTarifarios?.filter((m) => MANUALES.includes(m)) ?? MANUALES,
    [configServidor]
  );

  /** Cambia de pestaña desde un botón de la página y lleva la vista a las pestañas. */
  const irA = useCallback((destino: TabId) => {
    setTab(destino);
    const el = tabsRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, []);

  /** Flechas, Inicio y Fin mueven entre pestañas (patrón de pestañas accesibles). */
  const onTeclaPestanas = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((x) => x.id === tab);
    let siguiente = -1;
    if (e.key === 'ArrowRight') siguiente = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') siguiente = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') siguiente = 0;
    else if (e.key === 'End') siguiente = TABS.length - 1;
    if (siguiente < 0) return;
    e.preventDefault();
    const id = TABS[siguiente].id;
    setTab(id);
    document.getElementById(`tab-${id}`)?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/demo"
            className={`mb-4 inline-flex items-center gap-2 rounded-md text-sm font-medium text-secondary-600 hover:text-primary-600 dark:text-secondary-300 dark:hover:text-primary-400 ${focusRing}`}
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            {t('back')}
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
              <p className="text-base md:text-lg text-secondary-600 dark:text-secondary-400 max-w-3xl">{t('subtitle')}</p>
              <p className="mt-2 text-sm text-secondary-500 dark:text-secondary-400 max-w-3xl">{t('audience')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end md:shrink-0">
              <span
                className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                title={t('sampleBadgeHint')}
              >
                {t('sampleBadge')}
              </span>
              <EstadoServidorBadge estado={servidor.estado} />
            </div>
          </div>
        </div>

        <AvisoAcceso estado={servidor.estado} onReintentar={servidor.recargar} />

        <PrimerosPasos progreso={progreso} onIr={irA} />

        <div ref={tabsRef} className="mb-6 scroll-mt-24 border-b border-secondary-200 dark:border-secondary-700">
          <div role="tablist" aria-label={t('tabs.label')} className="flex gap-1 overflow-x-auto" onKeyDown={onTeclaPestanas}>
            {TABS.map(({ id, icon: Icon }) => {
              const activa = tab === id;
              return (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  aria-controls={`panel-${id}`}
                  tabIndex={activa ? 0 : -1}
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-2 rounded-t-md px-4 py-3 border-b-2 transition-all ${focusRing} ${
                    activa
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-transparent text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:border-secondary-300 dark:hover:border-secondary-600'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-left">
                    <span className="block font-medium whitespace-nowrap">{t(`tabs.${id}`)}</span>
                    <span className="hidden sm:block text-xs opacity-75 whitespace-nowrap">{t(`tabs.${id}Desc`)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'resumen' && (
            <ResumenTab
              estado={servidor.estado}
              datos={servidor.datos}
              actualizado={servidor.actualizado}
              onActualizar={servidor.recargar}
              onIrA={irA}
            />
          )}
          {tab === 'buscar' && <BuscarCodigosTab estado={servidor.estado} vector={servidor.datos.vector} />}
          {tab === 'reglas' && (
            <ReglasTab
              estado={servidor.estado}
              cargada={Boolean(configServidor)}
              actualizado={servidor.actualizado}
              puedeGuardar={permisos.guardar}
              manuales={manuales}
              borrador={borrador}
              guardada={guardada}
              onCambiar={cambiarBorrador}
              onDescartar={descartar}
              onGuardar={guardar}
              onProbar={() => irA('simulador')}
            />
          )}
          {tab === 'simulador' && (
            <SimuladorTab
              borrador={borrador}
              guardada={guardada}
              cargada={Boolean(configServidor)}
              onIrAReglas={() => irA('reglas')}
            />
          )}
          {tab === 'como' && <ComoDecideTab accesoOtraDemo={permisos.otraDemo} />}
        </div>
      </div>
    </div>
  );
}
