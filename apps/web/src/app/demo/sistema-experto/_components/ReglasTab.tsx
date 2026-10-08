'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BeakerIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CODIGOS_REGLAS, CONFIG_DEFECTO, REGLAS, mismaConfig, type ConfigMotor } from '../_lib/motor';
import type { ManualTarifario } from '../_lib/datos-ejemplo';
import { ErrorApi, type TipoErrorApi } from '../_lib/api';
import { conPorcentaje, horaActual } from '../_lib/formato';
import type { EstadoServidor } from '../_lib/useServidor';
import { VARIANTE_SEVERIDAD } from './severidad';

export function Interruptor({
  activo,
  onCambiar,
  etiqueta,
}: {
  activo: boolean;
  onCambiar: () => void;
  etiqueta: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onCambiar}
      className={`relative h-6 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        activo ? 'bg-green-600' : 'bg-secondary-300 dark:bg-secondary-600'
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
          activo ? 'translate-x-6' : 'translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

export default function ReglasTab({
  estado,
  cargada,
  actualizado,
  manuales,
  borrador,
  guardada,
  onCambiar,
  onDescartar,
  onGuardar,
  onProbar,
}: {
  estado: EstadoServidor;
  cargada: boolean;
  actualizado: string | null;
  manuales: ManualTarifario[];
  borrador: ConfigMotor;
  guardada: ConfigMotor;
  onCambiar: (c: ConfigMotor) => void;
  onDescartar: () => void;
  onGuardar: () => Promise<void>;
  onProbar: () => void;
}) {
  const t = useTranslations('demoExpertSystem.rules');
  const tReglas = useTranslations('demoExpertSystem.rulesCatalog');
  const tSev = useTranslations('demoExpertSystem.severity');
  const tMan = useTranslations('demoExpertSystem.manuals');
  const locale = useLocale();
  const [guardando, setGuardando] = useState(false);
  const [guardadoA, setGuardadoA] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<TipoErrorApi | null>(null);

  const hayCambios = !mismaConfig(borrador, guardada);
  const esDefecto = mismaConfig(borrador, CONFIG_DEFECTO);
  const activas = CODIGOS_REGLAS.filter((c) => borrador.reglasHabilitadas.includes(c)).length;

  const cambiar = (parcial: Partial<ConfigMotor>) => {
    setGuardadoA(null);
    setErrorGuardar(null);
    onCambiar({ ...borrador, ...parcial });
  };

  const alternarRegla = (codigo: string) => {
    const activa = borrador.reglasHabilitadas.includes(codigo);
    cambiar({
      reglasHabilitadas: activa
        ? borrador.reglasHabilitadas.filter((c) => c !== codigo)
        : CODIGOS_REGLAS.filter((c) => c === codigo || borrador.reglasHabilitadas.includes(c)),
    });
  };

  const guardar = async () => {
    setGuardando(true);
    setErrorGuardar(null);
    setGuardadoA(null);
    try {
      await onGuardar();
      setGuardadoA(horaActual());
    } catch (e) {
      setErrorGuardar(e instanceof ErrorApi ? e.tipo : 'servidor');
    } finally {
      setGuardando(false);
    }
  };

  let origen: string;
  if (cargada) origen = actualizado ? t('loadedAt', { hora: actualizado }) : t('loading');
  else origen = estado === 'cargando' ? t('loading') : t('notLoaded');

  return (
    <div className="space-y-6">
      <Card variant="bordered">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('title')}</h2>
            <p className="mt-1 text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
            <p className={`mt-2 text-sm ${cargada || estado === 'cargando' ? 'text-secondary-500 dark:text-secondary-400' : 'text-red-700 dark:text-red-300'}`}>
              {origen}
            </p>
          </div>
          <Badge variant={hayCambios ? 'warning' : 'default'} className="self-start whitespace-nowrap">
            {hayCambios ? t('unsaved') : t('noChanges')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {t('activeCount', { activas, total: CODIGOS_REGLAS.length })}
              </p>
            </div>
            <ul className="space-y-2">
              {REGLAS.map(({ codigo, severidad }) => {
                const activa = borrador.reglasHabilitadas.includes(codigo);
                const nombre = tReglas(`${codigo}.name`);
                return (
                  <li
                    key={codigo}
                    className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                      activa ? 'bg-secondary-50 dark:bg-secondary-800' : 'bg-secondary-50/50 opacity-70 dark:bg-secondary-800/50'
                    }`}
                  >
                    <Interruptor
                      activo={activa}
                      onCambiar={() => alternarRegla(codigo)}
                      etiqueta={t('toggle', { codigo, nombre })}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {codigo} · {nombre}
                        </p>
                        <Badge size="sm" variant={VARIANTE_SEVERIDAD[severidad]}>
                          {tSev(severidad)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                        {tReglas(`${codigo}.description`)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-lg bg-secondary-50 p-4 dark:bg-secondary-800">
              <label htmlFor="tolerancia" className="mb-2 block text-sm font-medium text-secondary-900 dark:text-white">
                {t('tolerance')}
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="tolerancia"
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={borrador.toleranciaDiferenciaTarifa}
                  onChange={(e) => cambiar({ toleranciaDiferenciaTarifa: Number(e.target.value) })}
                  className="min-w-0 flex-1 accent-primary-600"
                />
                <span className="min-w-[4rem] text-right text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {conPorcentaje(borrador.toleranciaDiferenciaTarifa, locale)}
                </span>
              </div>
              <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">{t('toleranceHelp')}</p>
            </div>

            <div className="rounded-lg bg-secondary-50 p-4 dark:bg-secondary-800">
              <label htmlFor="manual" className="mb-2 block text-sm font-medium text-secondary-900 dark:text-white">
                {t('manual')}
              </label>
              <select
                id="manual"
                value={borrador.manualPorDefecto}
                onChange={(e) => cambiar({ manualPorDefecto: e.target.value as ManualTarifario })}
                className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-secondary-900 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white"
              >
                {manuales.map((m) => (
                  <option key={m} value={m}>
                    {tMan(m)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-secondary-600 dark:text-secondary-400">{t('manualHelp')}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={guardar} disabled={!cargada || !hayCambios || guardando} isLoading={guardando}>
                {guardando ? t('saving') : t('save')}
              </Button>
              <Button variant="outline" onClick={onProbar}>
                <BeakerIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                {t('test')}
              </Button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="ghost" className="flex-1" onClick={onDescartar} disabled={!hayCambios || guardando}>
                  {t('discard')}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => cambiar({ ...CONFIG_DEFECTO, reglasHabilitadas: [...CONFIG_DEFECTO.reglasHabilitadas] })}
                  disabled={esDefecto || guardando}
                >
                  {t('reset')}
                </Button>
              </div>
            </div>

            <div aria-live="polite">
              {guardadoA && (
                <p className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200">
                  <CheckCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {t('saved', { hora: guardadoA })}
                </p>
              )}
              {errorGuardar && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {t(`saveError.${errorGuardar}`)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100">
          <InformationCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t('storageTitle')}</p>
            <p>{t('storageText')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-secondary-200 bg-white p-4 text-sm text-secondary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300">
          <InformationCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{t('codesNote')}</p>
        </div>
      </div>
    </div>
  );
}
