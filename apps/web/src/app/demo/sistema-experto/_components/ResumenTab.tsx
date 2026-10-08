'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowPathIcon,
  BeakerIcon,
  CheckCircleIcon,
  CpuChipIcon,
  DocumentCheckIcon,
  InformationCircleIcon,
  ListBulletIcon,
  SparklesIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { DatosServidor, EstadoServidor } from '../_lib/useServidor';
import { CODIGOS_REGLAS } from '../_lib/motor';
import { CATALOGO_EJEMPLO, CONVENIO_EJEMPLO, LOTE_EJEMPLO } from '../_lib/datos-ejemplo';
import { conPorcentaje, formatoCOP, formatoNumero, formatoPorcentaje } from '../_lib/formato';
import type { TabId } from '../_lib/tabs';

const TOTAL_LOTE = LOTE_EJEMPLO.reduce(
  (s, f) => s + f.lineas.reduce((sl, l) => sl + l.cantidad * l.valorUnitario, 0),
  0
);
const LINEAS_LOTE = LOTE_EJEMPLO.reduce((s, f) => s + f.lineas.length, 0);
const IPS_LOTE = new Set(LOTE_EJEMPLO.map((f) => f.ips)).size;
const PACTADAS = Object.keys(CONVENIO_EJEMPLO.tarifasPactadas).length;

function Kpi({
  titulo,
  valor,
  detalle,
  icono: Icono,
  color,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: typeof SparklesIcon;
  color: string;
}) {
  return (
    <Card variant="bordered" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">{titulo}</p>
          <p className={`mt-2 text-3xl font-bold ${color}`}>{valor}</p>
          <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">{detalle}</p>
        </div>
        <Icono className={`h-10 w-10 shrink-0 ${color}`} aria-hidden="true" />
      </div>
    </Card>
  );
}

function Servicio({ titulo, texto, disponible }: { titulo: string; texto: string; disponible: boolean }) {
  const t = useTranslations('demoExpertSystem.summary');
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-secondary-200 p-3 dark:border-secondary-700">
      <div className="flex items-start gap-3 min-w-0">
        {disponible ? (
          <CheckCircleIcon className="h-6 w-6 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
        ) : (
          <XCircleIcon className="h-6 w-6 shrink-0 text-secondary-400" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="font-medium text-secondary-900 dark:text-white">{titulo}</p>
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{texto}</p>
        </div>
      </div>
      <Badge size="sm" variant={disponible ? 'success' : 'default'} className="shrink-0">
        {disponible ? t('available') : t('unavailable')}
      </Badge>
    </div>
  );
}

export default function ResumenTab({
  estado,
  datos,
  actualizado,
  onActualizar,
  onIrA,
}: {
  estado: EstadoServidor;
  datos: DatosServidor;
  actualizado: string | null;
  onActualizar: () => void;
  onIrA: (tab: TabId) => void;
}) {
  const t = useTranslations('demoExpertSystem.summary');
  const locale = useLocale();
  const { experto, cups, vector, config } = datos;
  const cargando = estado === 'cargando';
  const sinDato = cargando ? '…' : '—';
  const n = (v: number) => formatoNumero(v, locale);

  const reglasActivas = config
    ? CODIGOS_REGLAS.filter((c) => (config.reglasHabilitadas || []).includes(c)).length
    : null;
  const vectorizados = vector?.cupsVectorizados ?? 0;
  const categorias = cups ? Object.entries(cups.cupsPorCategoria || {}).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('title')}</h2>
          <p className="mt-1 text-secondary-600 dark:text-secondary-400">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {actualizado && !cargando && (
            <span className="text-xs text-secondary-500 dark:text-secondary-400">{t('updatedAt', { hora: actualizado })}</span>
          )}
          <Button size="sm" variant="outline" onClick={onActualizar} disabled={cargando}>
            <ArrowPathIcon className={`mr-2 h-4 w-4 ${cargando ? 'animate-spin' : ''}`} aria-hidden="true" />
            {cargando ? t('refreshing') : t('refresh')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          titulo={t('accounts')}
          valor={experto ? n(experto.totalCuentas) : sinDato}
          detalle={
            experto
              ? t('accountsProcessed', {
                  procesadas: n(experto.cuentasProcesadas),
                  porcentaje: formatoPorcentaje(experto.porcentajeProcesado || 0, locale),
                })
              : cargando
                ? t('loading')
                : t('noData')
          }
          icono={DocumentCheckIcon}
          color="text-primary-600 dark:text-primary-400"
        />
        <Kpi
          titulo={t('catalog')}
          valor={cups ? n(cups.totalCUPS) : sinDato}
          detalle={cups ? t('catalogActive', { activos: n(cups.cupsActivos) }) : cargando ? t('loading') : t('noData')}
          icono={ListBulletIcon}
          color="text-blue-600 dark:text-blue-400"
        />
        <Kpi
          titulo={t('vectorized')}
          valor={vector ? (vector.totalCUPS > 0 ? conPorcentaje(vector.porcentajeVectorizado, locale) : '0') : sinDato}
          detalle={
            vector
              ? vector.totalCUPS > 0
                ? t('vectorizedDetail', {
                    hechos: n(vector.cupsVectorizados),
                    total: n(vector.totalCUPS),
                    porcentaje: formatoPorcentaje(vector.porcentajeVectorizado, locale),
                  })
                : t('vectorizedEmpty')
              : cargando
                ? t('loading')
                : t('noData')
          }
          icono={SparklesIcon}
          color="text-purple-600 dark:text-purple-400"
        />
        <Kpi
          titulo={t('rulesActive')}
          valor={reglasActivas !== null ? String(reglasActivas) : sinDato}
          detalle={
            reglasActivas !== null
              ? t('rulesActiveDetail', { total: CODIGOS_REGLAS.length })
              : cargando
                ? t('loading')
                : t('noData')
          }
          icono={CpuChipIcon}
          color="text-green-600 dark:text-green-400"
        />
      </div>

      {(cups?.totalCUPS === 0 || experto?.totalCuentas === 0) && (
        <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100">
          {cups?.totalCUPS === 0 && (
            <p className="flex items-start gap-2">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              {t('emptyCatalog')}
            </p>
          )}
          {experto?.totalCuentas === 0 && (
            <p className="flex items-start gap-2">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              {t('emptyAccounts')}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <h3 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-white">{t('services')}</h3>
          <div className="space-y-3">
            <Servicio
              titulo={t('serviceRules')}
              texto={
                reglasActivas !== null
                  ? t('serviceRulesOk', { activas: reglasActivas, total: CODIGOS_REGLAS.length })
                  : cargando
                    ? t('loading')
                    : t('serviceRulesUnknown')
              }
              disponible={reglasActivas !== null}
            />
            <Servicio
              titulo={t('serviceSemantic')}
              texto={
                vectorizados > 0
                  ? t('serviceSemanticOk', { total: n(vectorizados) })
                  : cargando
                    ? t('loading')
                    : t('serviceSemanticOff')
              }
              disponible={vectorizados > 0}
            />
            <Servicio
              titulo={t('serviceSample')}
              texto={t('serviceSampleText', { total: CATALOGO_EJEMPLO.length })}
              disponible
            />
          </div>
        </Card>

        <Card variant="bordered" className="flex flex-col">
          <div className="flex items-center gap-3">
            <BeakerIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{t('batchTitle')}</h3>
          </div>
          <p className="mt-3 text-secondary-700 dark:text-secondary-300">
            {t('batchText', {
              facturas: LOTE_EJEMPLO.length,
              lineas: LINEAS_LOTE,
              total: formatoCOP(TOTAL_LOTE, locale),
              convenio: CONVENIO_EJEMPLO.nombre,
            })}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-secondary-600 dark:text-secondary-400">
            <li>{t('batchPoint1', { ips: IPS_LOTE })}</li>
            <li>{t('batchPoint2', { reglas: CODIGOS_REGLAS.length })}</li>
            <li>{t('batchPoint3', { pactadas: PACTADAS })}</li>
          </ul>
          <div className="mt-auto pt-4">
            <Button onClick={() => onIrA('simulador')}>{t('batchCta')}</Button>
          </div>
        </Card>
      </div>

      {categorias.length > 0 && cups && (
        <Card variant="bordered">
          <h3 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-white">{t('byCategory')}</h3>
          <div className="space-y-3">
            {categorias.map(([categoria, cantidad]) => {
              const porcentaje = cups.totalCUPS > 0 ? (cantidad / cups.totalCUPS) * 100 : 0;
              return (
                <div key={categoria}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-secondary-700 dark:text-secondary-300">{categoria}</span>
                    <span className="text-secondary-600 dark:text-secondary-400">
                      {n(cantidad)} ({conPorcentaje(porcentaje, locale)})
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary-200 dark:bg-secondary-700">
                    <div className="h-2 rounded-full bg-primary-500" style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
