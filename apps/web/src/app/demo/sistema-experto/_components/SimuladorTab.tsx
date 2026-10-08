'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowDownTrayIcon, ArrowRightIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { downloadBlob } from '@/lib/utils';
import { CODIGOS_REGLAS, REGLAS, comparar, mismaConfig, simular, type ConfigMotor, type Glosa } from '../_lib/motor';
import { CATALOGO_POR_CODIGO, CONVENIO_EJEMPLO, LOTE_EJEMPLO } from '../_lib/datos-ejemplo';
import { formatoCOP, formatoFecha, formatoPorcentaje } from '../_lib/formato';
import { VARIANTE_SEVERIDAD } from './severidad';

const LINEAS = Object.fromEntries(LOTE_EJEMPLO.flatMap((f) => f.lineas.map((l) => [l.id, l])));
const FECHA_FACTURA = Object.fromEntries(LOTE_EJEMPLO.map((f) => [f.numero, f.fecha]));

export default function SimuladorTab({
  borrador,
  guardada,
  cargada,
  onIrAReglas,
}: {
  borrador: ConfigMotor;
  guardada: ConfigMotor;
  /** Si la configuración guardada vino del servidor (si no, son los valores por defecto). */
  cargada: boolean;
  onIrAReglas: () => void;
}) {
  const t = useTranslations('demoExpertSystem.simulator');
  const tReglas = useTranslations('demoExpertSystem.rulesCatalog');
  const tSev = useTranslations('demoExpertSystem.severity');
  const tMan = useTranslations('demoExpertSystem.manuals');
  const tMot = useTranslations('demoExpertSystem.reasons');
  const locale = useLocale();
  const [filtroRegla, setFiltroRegla] = useState('todas');
  const [filtroTexto, setFiltroTexto] = useState('');

  const resultado = useMemo(() => simular(borrador), [borrador]);
  const base = useMemo(() => simular(guardada), [guardada]);
  const sinCambios = mismaConfig(borrador, guardada);
  const diferencia = useMemo(() => comparar(base, resultado), [base, resultado]);
  const nuevas = useMemo(() => new Set(diferencia.nuevas.map((g) => g.clave)), [diferencia]);

  const cop = (v: number) => formatoCOP(v, locale);

  const descripcion = (cups: string) => {
    const item = CATALOGO_POR_CODIGO[cups];
    if (!item) return t('unknownCode');
    return locale === 'en' ? item.descripcionEn : item.descripcion;
  };

  const explicar = (g: Glosa): string => {
    const d = g.datos;
    switch (g.motivo) {
      case 'r102':
        return tMot('r102', {
          cobrado: cop(Number(d.cobrado)),
          tarifa: cop(Number(d.tarifa)),
          manual: tMan(String(d.manual)),
          porcentaje: formatoPorcentaje(Number(d.porcentaje), locale),
          tolerancia: String(d.tolerancia),
        });
      case 'r401':
        return tMot('r401', { cobrado: cop(Number(d.cobrado)), pactado: cop(Number(d.pactado)) });
      case 'r202Incompleta':
        return tMot('r202Incompleta', {
          faltan: String(d.faltan)
            .split(',')
            .map((f) => tMot(`missing.${f}`))
            .join(', '),
        });
      case 'r202Vencida':
        return tMot('r202Vencida', {
          numero: String(d.numero),
          vigencia: formatoFecha(String(d.vigencia), locale),
          fecha: formatoFecha(String(d.fecha), locale),
        });
      case 'r301':
        return tMot('r301', { cups: String(d.cups), sexo: tMot(`sex.${d.sexo}`) });
      case 'r303':
        return tMot('r303', {
          cups: String(d.cups),
          paciente: String(d.paciente),
          fecha: formatoFecha(String(d.fecha), locale),
        });
      case 'r402':
        return tMot('r402', {
          cantidad: String(d.cantidad),
          autorizada: String(d.autorizada),
          exceso: String(d.exceso),
        });
      default:
        return tMot(g.motivo, { cups: String(d.cups) });
    }
  };

  const configTexto = (c: ConfigMotor) =>
    t('configLine', {
      tolerancia: c.toleranciaDiferenciaTarifa,
      manual: tMan(c.manualPorDefecto),
      activas: CODIGOS_REGLAS.filter((r) => c.reglasHabilitadas.includes(r)).length,
      total: CODIGOS_REGLAS.length,
    });

  const texto = filtroTexto.trim().toLowerCase();
  const visibles = resultado.glosas.filter(
    (g) =>
      (filtroRegla === 'todas' || g.regla === filtroRegla) &&
      (!texto || g.factura.toLowerCase().includes(texto) || g.cups.includes(texto) || g.ips.toLowerCase().includes(texto))
  );

  const descargarCsv = () => {
    const sep = locale === 'en' ? ',' : ';';
    const celda = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const encabezado = ['invoice', 'ips', 'line', 'code', 'description', 'rule', 'severity', 'value', 'reason'].map((k) =>
      celda(t(`csv.${k}`))
    );
    const filas = visibles.map((g) =>
      [
        g.factura,
        g.ips,
        g.lineaId,
        g.cups,
        descripcion(g.cups),
        `${g.regla} ${tReglas(`${g.regla}.name`)}`,
        tSev(g.severidad),
        g.valor,
        explicar(g),
      ]
        .map(celda)
        .join(sep)
    );
    const contenido = '\uFEFF' + [encabezado.join(sep), ...filas].join('\r\n');
    downloadBlob(new Blob([contenido], { type: 'text/csv;charset=utf-8' }), t('csvFile'));
  };

  const pct = resultado.totalFacturado > 0 ? (resultado.totalGlosado / resultado.totalFacturado) * 100 : 0;
  const maxPorRegla = Math.max(1, ...CODIGOS_REGLAS.map((c) => resultado.porRegla[c].valor));

  return (
    <div className="space-y-6">
      <Card variant="bordered">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">{t('title')}</h2>
        <p className="mt-1 text-secondary-600 dark:text-secondary-400">{t('subtitle', { facturas: LOTE_EJEMPLO.length })}</p>
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-primary-50 px-3 py-2 dark:bg-primary-900/20">
            <dt className="font-medium text-primary-800 dark:text-primary-200">{t('draft')}</dt>
            <dd className="text-secondary-700 dark:text-secondary-300">{configTexto(borrador)}</dd>
          </div>
          <div className="rounded-lg bg-secondary-50 px-3 py-2 dark:bg-secondary-800">
            <dt className="font-medium text-secondary-800 dark:text-secondary-200">{cargada ? t('saved') : t('savedDefault')}</dt>
            <dd className="text-secondary-700 dark:text-secondary-300">{configTexto(guardada)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card variant="bordered" padding="sm">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('billed')}</p>
          <p className="mt-1 text-xl font-bold text-secondary-900 dark:text-white sm:text-2xl">{cop(resultado.totalFacturado)}</p>
        </Card>
        <Card variant="bordered" padding="sm">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('glossed')}</p>
          <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400 sm:text-2xl">{cop(resultado.totalGlosado)}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">
            {t('glossedPct', { porcentaje: formatoPorcentaje(pct, locale) })}
          </p>
        </Card>
        <Card variant="bordered" padding="sm">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('glosas')}</p>
          <p className="mt-1 text-xl font-bold text-secondary-900 dark:text-white sm:text-2xl">{resultado.glosas.length}</p>
        </Card>
        <Card variant="bordered" padding="sm">
          <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('invoicesAffected')}</p>
          <p className="mt-1 text-xl font-bold text-secondary-900 dark:text-white sm:text-2xl">{resultado.facturasConGlosa}</p>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{t('invoicesOf', { total: resultado.facturas })}</p>
        </Card>
      </div>

      {sinCambios ? (
        <div className="flex flex-col gap-3 rounded-xl border border-secondary-200 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-secondary-900 dark:text-white">{cargada ? t('noDiffTitle') : t('noDiffTitleDefault')}</p>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('noDiffText')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onIrAReglas} className="sm:shrink-0">
            {t('goToRules')}
            <ArrowRightIcon className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-900/20" aria-live="polite">
          <p className="font-semibold text-primary-900 dark:text-primary-100">{cargada ? t('diffTitle') : t('diffTitleDefault')}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <Badge variant="danger">{t('diffNew', { total: diferencia.nuevas.length })}</Badge>
            <Badge variant="success">{t('diffRemoved', { total: diferencia.eliminadas.length })}</Badge>
            <Badge variant="default">
              {t('diffValue', {
                valor: `${diferencia.diferenciaValor > 0 ? '+' : ''}${cop(diferencia.diferenciaValor)}`,
              })}
            </Badge>
          </div>
          {diferencia.eliminadas.length > 0 && (
            <div className="mt-3 text-sm text-secondary-700 dark:text-secondary-300">
              <p className="font-medium">{t('removedLabel')}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {diferencia.eliminadas.map((g) => (
                  <li key={g.clave} className="break-words">
                    {g.factura} · {g.cups} · {g.regla} {tReglas(`${g.regla}.name`)} ({cop(g.valor)})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Card variant="bordered">
        <h3 className="mb-4 text-lg font-semibold text-secondary-900 dark:text-white">{t('byRule')}</h3>
        <ul className="space-y-3">
          {REGLAS.map(({ codigo }) => {
            const datos = resultado.porRegla[codigo];
            const activa = borrador.reglasHabilitadas.includes(codigo);
            return (
              <li key={codigo}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 text-sm">
                  <span className={`font-medium ${activa ? 'text-secondary-800 dark:text-secondary-200' : 'text-secondary-400'}`}>
                    {codigo} · {tReglas(`${codigo}.name`)}
                  </span>
                  <span className="text-secondary-600 dark:text-secondary-400">
                    {activa ? `${datos.cantidad} · ${cop(datos.valor)}` : t('ruleOff')}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary-200 dark:bg-secondary-700">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${activa ? Math.max(datos.cantidad > 0 ? 2 : 0, (datos.valor / maxPorRegla) * 100) : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card variant="bordered">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">{t('listTitle')}</h3>
            <p className="text-sm text-secondary-500 dark:text-secondary-400">
              {t('showing', { mostradas: visibles.length, total: resultado.glosas.length })}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div>
              <label htmlFor="filtro-regla" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-400">
                {t('filterRule')}
              </label>
              <select
                id="filtro-regla"
                value={filtroRegla}
                onChange={(e) => setFiltroRegla(e.target.value)}
                className="w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 dark:border-secondary-600 dark:bg-secondary-800 dark:text-white sm:w-56"
              >
                <option value="todas">{t('allRules')}</option>
                {REGLAS.map(({ codigo }) => (
                  <option key={codigo} value={codigo}>
                    {codigo} · {tReglas(`${codigo}.name`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtro-texto" className="mb-1 block text-xs font-medium text-secondary-600 dark:text-secondary-400">
                {t('filterText')}
              </label>
              <input
                id="filtro-texto"
                type="search"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                placeholder={t('filterPlaceholder')}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm dark:border-secondary-600 dark:bg-secondary-800 dark:text-white sm:w-60"
              />
            </div>
            <Button variant="outline" size="sm" onClick={descargarCsv} disabled={visibles.length === 0} className="h-[38px]">
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('download')}
            </Button>
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="py-6 text-center text-sm text-secondary-500 dark:text-secondary-400">{t('noGlosas')}</p>
        ) : (
          <ul className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {visibles.map((g) => {
              const linea = LINEAS[g.lineaId];
              return (
                <li key={g.clave} className="py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge size="sm" variant={VARIANTE_SEVERIDAD[g.severidad]}>
                          {g.regla} · {tReglas(`${g.regla}.name`)}
                        </Badge>
                        <span className="text-xs text-secondary-500 dark:text-secondary-400">{tSev(g.severidad)}</span>
                        {nuevas.has(g.clave) && <Badge size="sm" variant="primary">{t('newBadge')}</Badge>}
                      </div>
                      <p className="mt-1 text-sm font-medium text-secondary-900 dark:text-white break-words">
                        {g.factura} · {g.ips}
                        <span className="font-normal text-secondary-500 dark:text-secondary-400">
                          {' '}
                          · {formatoFecha(FECHA_FACTURA[g.factura], locale)}
                        </span>
                      </p>
                      <p className="text-sm text-secondary-700 dark:text-secondary-300 break-words">
                        {g.cups} · {descripcion(g.cups)}
                        {linea && (
                          <span className="text-secondary-500 dark:text-secondary-400">
                            {' '}
                            ({t('lineInfo', { cantidad: linea.cantidad, valor: cop(linea.valorUnitario) })})
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-secondary-600 dark:text-secondary-400">{explicar(g)}</p>
                    </div>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400 sm:shrink-0 sm:text-right">
                      {g.valor > 0 ? cop(g.valor) : t('review')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <p className="flex items-start gap-2 text-xs text-secondary-500 dark:text-secondary-400">
        <InformationCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t('note', { convenio: CONVENIO_EJEMPLO.nombre })}
      </p>
    </div>
  );
}
