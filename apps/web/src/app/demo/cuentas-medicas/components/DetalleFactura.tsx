'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  CpuChipIcon,
  DocumentTextIcon,
  TrashIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ApiError, auditoriaAPI, esErrorDeAcceso } from '../api';
import type { DetalleFactura as Detalle } from '../tipos-auditoria';
import {
  CLAVE_ESTADO_FACTURA,
  COLOR_ESTADO_FACTURA,
  anonimizarTexto,
  decisionDeGlosa,
  formatearCOP,
  formatearFecha,
  nombreEntidad,
  valorPropuesto,
} from '../lib/formato';
import { leerLectura, type LecturaGuardada } from '../lib/memoria';
import { exportarDetalleCSV, exportarDetallePDF } from '../lib/reportes';
import { tarifaDe } from '../lib/tarifarioDemo';
import MensajeError from './MensajeError';
import TarjetaGlosa, { type CambiosGlosa } from './TarjetaGlosa';

interface Props {
  facturaId: string;
  onVolver: () => void;
  onErrorAcceso: () => void;
  onCambioDatos: () => void;
}

export default function DetalleFactura({ facturaId, onVolver, onErrorAcceso, onCambioDatos }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<'network' | 'server' | 'notFound' | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [lectura, setLectura] = useState<LecturaGuardada | null>(null);

  const etiquetas = { prestador: t('entities.provider'), pagador: t('entities.payer') };

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      setError(null);
      try {
        setDetalle(await auditoriaAPI.obtenerFactura(facturaId));
      } catch (e) {
        if (esErrorDeAcceso(e)) onErrorAcceso();
        else if (e instanceof ApiError && e.status === 404) setError('notFound');
        else setError(e instanceof ApiError && e.status === 0 ? 'network' : 'server');
      } finally {
        setCargando(false);
      }
    },
    [facturaId, onErrorAcceso],
  );

  useEffect(() => {
    cargar();
    setLectura(leerLectura(facturaId));
  }, [cargar, facturaId]);

  const guardarDecision = async (glosaId: string, cambios: CambiosGlosa): Promise<boolean> => {
    setOcupado(glosaId);
    try {
      await auditoriaAPI.actualizarGlosa(glosaId, cambios);
      await cargar(true);
      onCambioDatos();
      toast.success(t('denials.saved'));
      return true;
    } catch (e) {
      if (esErrorDeAcceso(e)) onErrorAcceso();
      else toast.error(t('errors.saveDecision'));
      return false;
    } finally {
      setOcupado(null);
    }
  };

  const eliminar = async () => {
    if (!detalle) return;
    setEliminando(true);
    try {
      await auditoriaAPI.eliminarFactura(detalle.factura._id);
      toast.success(t('invoices.deleted', { number: detalle.factura.numeroFactura }));
      onCambioDatos();
      onVolver();
    } catch (e) {
      if (esErrorDeAcceso(e)) onErrorAcceso();
      else toast.error(t('errors.delete'));
      setEliminando(false);
    }
  };

  const descargarPDF = async () => {
    if (!detalle) return;
    try {
      await exportarDetallePDF(detalle, locale, t, CLAVE_ESTADO_FACTURA);
    } catch {
      toast.error(t('errors.report'));
    }
  };

  const volver = (
    <Button variant="ghost" onClick={onVolver} className="mb-4">
      <ArrowLeftIcon className="mr-2 h-4 w-4" aria-hidden="true" />
      {t('detail.back')}
    </Button>
  );

  if (cargando && !detalle) {
    return (
      <div>
        {volver}
        <div className="space-y-4" aria-busy="true">
          <div className="h-40 animate-pulse rounded-xl bg-white/70 dark:bg-gray-800" />
          <div className="h-64 animate-pulse rounded-xl bg-white/70 dark:bg-gray-800" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div>
        {volver}
        <MensajeError
          mensaje={t(`errors.${error ?? 'server'}`)}
          onReintentar={error === 'notFound' ? undefined : () => cargar()}
        />
      </div>
    );
  }

  const { factura, atenciones, procedimientos, glosas } = detalle;
  const atencion = atenciones[0];
  const claveEstado = CLAVE_ESTADO_FACTURA[factura.estado];
  const decididas = glosas.filter((g) => decisionDeGlosa(g, valorPropuesto(g, procedimientos)) !== 'pendiente').length;
  const conDiferencia = procedimientos.filter((p) => (p.diferenciaTarifa || 0) > 0).length;
  const nombrePaciente = [atencion?.paciente?.nombres, atencion?.paciente?.apellidos].filter(Boolean).join(' ').trim();
  const diagnostico = atencion?.diagnosticoPrincipal;
  // El backend guarda "Diagnóstico <código>" cuando no conoce la descripción: no la repetimos.
  const descripcionDiagnostico =
    diagnostico?.descripcion && !/^diagn[oó]stico\s/i.test(diagnostico.descripcion) ? diagnostico.descripcion : '';

  const valores = [
    { etiqueta: t('detail.values.billed'), valor: factura.valorTotal, color: 'text-gray-900 dark:text-white' },
    { etiqueta: t('detail.values.vat'), valor: factura.iva, color: 'text-gray-900 dark:text-white' },
    { etiqueta: t('detail.values.denied'), valor: factura.totalGlosas, color: 'text-orange-600 dark:text-orange-300' },
    { etiqueta: t('detail.values.toPay'), valor: factura.valorAceptado, color: 'text-green-700 dark:text-green-300' },
  ];

  return (
    <div className="space-y-6">
      <div>
        {volver}
        <Card variant="bordered">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="break-all text-2xl font-bold text-gray-900 dark:text-white">
                  {t('detail.title', { number: factura.numeroFactura })}
                </h2>
                <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${COLOR_ESTADO_FACTURA[factura.estado] ?? 'bg-gray-100 text-gray-800'}`}>
                  {claveEstado ? t(`states.${claveEstado}`) : factura.estado}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                {nombreEntidad(factura.ips?.nombre, 'prestador', etiquetas)} → {nombreEntidad(factura.eps?.nombre, 'pagador', etiquetas)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('detail.registered', { date: formatearFecha(factura.fechaEmision, locale) })}
              </p>
            </div>
            {confirmandoBorrado ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950" role="alert">
                <span className="text-sm text-red-800 dark:text-red-200">
                  {t('invoices.deleteQuestion', { number: factura.numeroFactura })}
                </span>
                <Button size="sm" variant="danger" onClick={eliminar} isLoading={eliminando} disabled={eliminando}>
                  {t('common.confirmDelete')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmandoBorrado(false)} disabled={eliminando}>
                  {t('common.keep')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => exportarDetalleCSV(detalle, locale, t)}>
                  <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t('detail.downloadCsv')}
                </Button>
                <Button size="sm" variant="outline" onClick={descargarPDF}>
                  <DocumentTextIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t('detail.downloadPdf')}
                </Button>
                <Button size="sm" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => setConfirmandoBorrado(true)}>
                  <TrashIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t('common.delete')}
                </Button>
              </div>
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {valores.map((v) => (
              <div key={v.etiqueta}>
                <dt className="mb-1 text-sm text-gray-500 dark:text-gray-400">{v.etiqueta}</dt>
                <dd className={`text-lg font-semibold sm:text-xl ${v.color}`}>{formatearCOP(v.valor, locale)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.review.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!factura.auditoriaCompletada && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {t('detail.review.flagged')}
            </p>
          )}
          {glosas.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">{t('detail.review.none')}</p>
          ) : (
            <>
              <div>
                <div className="mb-1 flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{t('detail.review.progress', { done: decididas, total: glosas.length })}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(decididas / glosas.length) * 100}%` }} />
                </div>
                {decididas === glosas.length && (
                  <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-300">{t('detail.review.complete')}</p>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('denials.title', { count: glosas.length })}</h3>
              <ul className="space-y-3">
                {glosas.map((g) => {
                  const proc = procedimientos.find((p) => p._id === g.procedimientoId);
                  return (
                    <TarjetaGlosa
                      key={g._id}
                      glosa={g}
                      procedimiento={proc}
                      propuesto={valorPropuesto(g, procedimientos)}
                      maximo={Math.max(proc?.valorTotalIPS ?? 0, valorPropuesto(g, procedimientos))}
                      ocupado={ocupado === g._id}
                      onGuardar={(cambios) => guardarDecision(g._id, cambios)}
                    />
                  );
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.procedures.title', { count: procedimientos.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {procedimientos.length === 0 ? (
            <p className="text-gray-700 dark:text-gray-300">{t('detail.procedures.empty')}</p>
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-700 dark:border-gray-700 dark:text-gray-300">
                    <th scope="col" className="px-3 py-2 font-semibold">{t('detail.procedures.code')}</th>
                    <th scope="col" className="px-3 py-2 font-semibold">{t('detail.procedures.description')}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t('detail.procedures.qty')}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t('detail.procedures.billed')}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t('detail.procedures.tariff')}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t('detail.procedures.difference')}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t('detail.procedures.proposed')}</th>
                  </tr>
                </thead>
                <tbody>
                  {procedimientos.map((p) => {
                    const enTarifario = Boolean(tarifaDe(p.codigoCUPS));
                    return (
                      <tr key={p._id} className={`border-b border-gray-100 dark:border-gray-800 ${p.totalGlosas > 0 ? 'bg-orange-50/70 dark:bg-orange-950/30' : ''}`}>
                        <td className="px-3 py-2 font-mono text-gray-900 dark:text-gray-100">{p.codigoCUPS}</td>
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{p.descripcion}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{p.cantidad}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{formatearCOP(p.valorTotalIPS, locale)}</td>
                        <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                          {enTarifario ? formatearCOP(p.valorTotalContrato, locale) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('detail.procedures.notInTariff')}</span>
                          )}
                        </td>
                        <td className={`px-3 py-2 text-right font-semibold ${p.diferenciaTarifa > 0 ? 'text-orange-600 dark:text-orange-300' : 'text-gray-900 dark:text-gray-100'}`}>
                          {formatearCOP(p.diferenciaTarifa, locale)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-orange-600 dark:text-orange-300">{formatearCOP(p.totalGlosas, locale)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
              {t('detail.patient.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.patient.name')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{nombrePaciente || t('detail.patient.notRead')}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.patient.document')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {atencion?.paciente?.numeroDocumento
                    ? `${atencion.paciente.tipoDocumento ?? ''} ${atencion.paciente.numeroDocumento}`.trim()
                    : t('detail.patient.notRead')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.patient.diagnosis')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {diagnostico?.codigoCIE10 ? `${diagnostico.codigoCIE10}${descripcionDiagnostico ? ` · ${descripcionDiagnostico}` : ''}` : t('detail.patient.notRead')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.patient.authorization')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {atencion?.numeroAutorizacion || t('detail.patient.noAuthorization')}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.patient.copay')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{formatearCOP(atencion?.copago, locale)}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">{t('detail.patient.moderatorFee')}</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">{formatearCOP(atencion?.cuotaModeradora, locale)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CpuChipIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
              {t('detail.proposal.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{t('detail.proposal.note')}</p>
            {factura.observaciones ? (
              <p className="whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {anonimizarTexto(factura.observaciones, etiquetas)}
              </p>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">{t('detail.proposal.empty')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card variant="bordered">
        <CardHeader>
          <CardTitle className="text-lg">{t('detail.trace.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                titulo: t('detail.trace.read'),
                valor: lectura
                  ? t('detail.trace.readValue', {
                      method: ['HIBRIDO', 'IA', 'REGEX'].includes(lectura.metodo) ? t(`upload.methods.${lectura.metodo}`) : lectura.metodo,
                      count: lectura.procedimientos,
                    })
                  : t('detail.trace.readUnknown', { count: procedimientos.length }),
              },
              {
                titulo: t('detail.trace.tariff'),
                valor: t('detail.trace.tariffValue', { over: conDiferencia, total: procedimientos.length }),
              },
              {
                titulo: t('detail.trace.model'),
                valor: factura.auditoriaCompletada ? t('detail.trace.modelOk') : t('detail.trace.modelFlagged'),
              },
              {
                titulo: t('detail.trace.auditor'),
                valor: glosas.length ? t('detail.review.progress', { done: decididas, total: glosas.length }) : t('detail.trace.auditorNone'),
              },
            ].map((paso, i) => (
              <li key={paso.titulo} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {i + 1}. {paso.titulo}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{paso.valor}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
