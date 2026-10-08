'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowLeftIcon,
  BeakerIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useServidor } from './_lib/useServidor';
import type { ConfigServidor } from './_lib/api';
import { CODIGOS_REGLAS, CONFIG_DEFECTO, type ConfigMotor } from './_lib/motor';
import { MANUALES } from './_lib/datos-ejemplo';
import AvisoAcceso from './_components/AvisoAcceso';
import EstadoServidorBadge from './_components/EstadoServidorBadge';
import ResumenTab from './_components/ResumenTab';
import BuscarCodigosTab from './_components/BuscarCodigosTab';
import ReglasTab from './_components/ReglasTab';
import SimuladorTab from './_components/SimuladorTab';
import ComoDecideTab from './_components/ComoDecideTab';
import type { TabId } from './_lib/tabs';

const TABS: Array<{ id: TabId; icon: typeof ChartBarIcon }> = [
  { id: 'resumen', icon: ChartBarIcon },
  { id: 'buscar', icon: MagnifyingGlassIcon },
  { id: 'reglas', icon: Cog6ToothIcon },
  { id: 'simulador', icon: BeakerIcon },
  { id: 'como', icon: LightBulbIcon },
];

/** Toma de la configuración del servidor solo lo que usa el motor de la demo. */
function aConfigMotor(config: ConfigServidor): ConfigMotor {
  const tolerancia = Number(config.toleranciaDiferenciaTarifa);
  return {
    toleranciaDiferenciaTarifa: Number.isFinite(tolerancia) ? Math.min(20, Math.max(0, Math.round(tolerancia))) : 5,
    manualPorDefecto: MANUALES.includes(config.manualPorDefecto) ? config.manualPorDefecto : 'ISS2004',
    reglasHabilitadas: Array.isArray(config.reglasHabilitadas)
      ? CODIGOS_REGLAS.filter((c) => config.reglasHabilitadas.includes(c))
      : [...CODIGOS_REGLAS],
  };
}

export default function SistemaExpertoPage() {
  const t = useTranslations('demoExpertSystem');
  const [tab, setTab] = useState<TabId>('resumen');
  const servidor = useServidor();
  const { guardarConfig } = servidor;
  const configServidor = servidor.datos.config;

  const guardada = useMemo<ConfigMotor>(
    () => (configServidor ? aConfigMotor(configServidor) : CONFIG_DEFECTO),
    [configServidor]
  );
  const [borrador, setBorrador] = useState<ConfigMotor>(CONFIG_DEFECTO);
  const [editado, setEditado] = useState(false);

  // Mientras no haya cambios propios, el borrador sigue a la configuración guardada.
  useEffect(() => {
    if (!editado) setBorrador(guardada);
  }, [guardada, editado]);

  const cambiarBorrador = useCallback((config: ConfigMotor) => {
    setBorrador(config);
    setEditado(true);
  }, []);

  const descartar = useCallback(() => {
    setBorrador(guardada);
    setEditado(false);
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
  }, [borrador, configServidor, guardarConfig]);

  const manuales = useMemo(
    () => configServidor?.manualesTarifarios?.filter((m) => MANUALES.includes(m)) ?? MANUALES,
    [configServidor]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-900 dark:via-secondary-800 dark:to-secondary-900 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4 -ml-2" asChild>
            <Link href="/demo/cuentas-medicas">
              <ArrowLeftIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              {t('back')}
            </Link>
          </Button>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-2">{t('title')}</h1>
              <p className="text-base md:text-lg text-secondary-600 dark:text-secondary-400 max-w-3xl">{t('subtitle')}</p>
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

        <div className="mb-6 border-b border-secondary-200 dark:border-secondary-700">
          <div role="tablist" aria-label={t('tabs.label')} className="flex gap-1 overflow-x-auto">
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
                  onClick={() => setTab(id)}
                  className={`flex shrink-0 items-center gap-2 px-4 py-3 border-b-2 transition-all ${
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
              onIrA={setTab}
            />
          )}
          {tab === 'buscar' && <BuscarCodigosTab estado={servidor.estado} vector={servidor.datos.vector} />}
          {tab === 'reglas' && (
            <ReglasTab
              estado={servidor.estado}
              cargada={Boolean(configServidor)}
              actualizado={servidor.actualizado}
              manuales={manuales}
              borrador={borrador}
              guardada={guardada}
              onCambiar={cambiarBorrador}
              onDescartar={descartar}
              onGuardar={guardar}
              onProbar={() => setTab('simulador')}
            />
          )}
          {tab === 'simulador' && (
            <SimuladorTab
              borrador={borrador}
              guardada={guardada}
              cargada={Boolean(configServidor)}
              onIrAReglas={() => setTab('reglas')}
            />
          )}
          {tab === 'como' && <ComoDecideTab />}
        </div>
      </div>
    </div>
  );
}
