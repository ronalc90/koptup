'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { downloadBlob } from '@/lib/utils';
import { ApiError, auditoriaAPI, esErrorDeAcceso } from '../api';
import type { ResultadoProcesamiento } from '../tipos-auditoria';
import { formatearCOP } from '../lib/formato';
import { generarFacturaEjemplo } from '../lib/facturaEjemplo';

const MAX_ARCHIVOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;

interface ArchivoCargado {
  file: File;
  /** Factura de ejemplo generada por la demo (datos ficticios). */
  ejemplo: boolean;
}

interface Props {
  abierto: boolean;
  autoEjemplo: boolean;
  onCerrar: () => void;
  onAuditada: (resultado: ResultadoProcesamiento) => void;
  onVerDetalle: (facturaId: string) => void;
  onErrorAcceso: () => void;
}

type Estado = 'editando' | 'procesando' | 'listo' | 'error';

export default function ModalAuditar({ abierto, autoEjemplo, onCerrar, onAuditada, onVerDetalle, onErrorAcceso }: Props) {
  const t = useTranslations('demoMedicalAccounts');
  const locale = useLocale();
  const idTitulo = useId();
  const idInput = useId();
  const dialogo = useRef<HTMLDivElement>(null);
  const autoLanzado = useRef(false);

  const [archivos, setArchivos] = useState<ArchivoCargado[]>([]);
  const [consentimiento, setConsentimiento] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [estado, setEstado] = useState<Estado>('editando');
  const [resultado, setResultado] = useState<ResultadoProcesamiento | null>(null);
  const [mensajeError, setMensajeError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const [generando, setGenerando] = useState(false);

  const reiniciar = useCallback(() => {
    setArchivos([]);
    setConsentimiento(false);
    setAvisos([]);
    setEstado('editando');
    setResultado(null);
    setMensajeError('');
  }, []);

  const cerrar = useCallback(() => {
    if (estado === 'procesando') return;
    reiniciar();
    autoLanzado.current = false;
    onCerrar();
  }, [estado, onCerrar, reiniciar]);

  // Bloquea el scroll de la página, enfoca el diálogo y cierra con Escape.
  useEffect(() => {
    if (!abierto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogo.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [abierto, cerrar]);

  const auditar = useCallback(
    async (lista: ArchivoCargado[]) => {
      setEstado('procesando');
      setMensajeError('');
      try {
        const res = await auditoriaAPI.auditarPDF(lista.map((a) => a.file));
        setResultado(res);
        setEstado('listo');
        onAuditada(res);
      } catch (e) {
        if (esErrorDeAcceso(e)) {
          reiniciar();
          onErrorAcceso();
          return;
        }
        let mensaje = t('upload.errors.server');
        if (e instanceof ApiError && e.status === 400) mensaje = t('upload.errors.noInvoice');
        if (e instanceof ApiError && e.status === 0) mensaje = t('errors.network');
        setMensajeError(mensaje);
        setEstado('error');
      }
    },
    [onAuditada, onErrorAcceso, reiniciar, t],
  );

  const agregarEjemplo = useCallback(async (): Promise<ArchivoCargado | null> => {
    setGenerando(true);
    try {
      const file = await generarFacturaEjemplo();
      return { file, ejemplo: true };
    } catch {
      setAvisos([t('upload.errors.sample')]);
      return null;
    } finally {
      setGenerando(false);
    }
  }, [t]);

  // "Auditar la factura de ejemplo" desde el tablero: genera la factura y la audita de una vez.
  useEffect(() => {
    if (!abierto || !autoEjemplo || autoLanzado.current) return;
    autoLanzado.current = true;
    (async () => {
      const ejemplo = await agregarEjemplo();
      if (!ejemplo) return;
      setArchivos([ejemplo]);
      await auditar([ejemplo]);
    })();
  }, [abierto, autoEjemplo, agregarEjemplo, auditar]);

  if (!abierto) return null;

  const agregarArchivos = (lista: FileList | File[] | null) => {
    if (!lista) return;
    const nuevos: ArchivoCargado[] = [];
    const problemas: string[] = [];
    Array.from(lista).forEach((file) => {
      const esPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!esPdf) problemas.push(t('upload.errors.notPdf', { name: file.name }));
      else if (file.size > MAX_BYTES) problemas.push(t('upload.errors.tooBig', { name: file.name }));
      else nuevos.push({ file, ejemplo: false });
    });
    const total = archivos.length + nuevos.length;
    if (total > MAX_ARCHIVOS) problemas.push(t('upload.errors.tooMany'));
    setArchivos([...archivos, ...nuevos].slice(0, MAX_ARCHIVOS));
    setAvisos(problemas);
  };

  const usarEjemplo = async () => {
    const ejemplo = await agregarEjemplo();
    if (!ejemplo) return;
    setArchivos((prev) => [...prev.filter((a) => !a.ejemplo), ejemplo].slice(0, MAX_ARCHIVOS));
    setAvisos([]);
  };

  const descargarEjemplo = async () => {
    const ejemplo = await agregarEjemplo();
    if (ejemplo) downloadBlob(ejemplo.file, ejemplo.file.name);
  };

  const requiereConsentimiento = archivos.some((a) => !a.ejemplo);
  const puedeEnviar = archivos.length > 0 && (!requiereConsentimiento || consentimiento) && estado === 'editando';

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-2xl outline-none dark:bg-gray-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-gray-700">
          <div>
            <h2 id={idTitulo} className="text-xl font-bold text-gray-900 dark:text-white">
              {t('upload.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('upload.intro')}</p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            disabled={estado === 'procesando'}
            aria-label={t('common.close')}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {estado === 'procesando' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center" role="status" aria-live="polite">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" aria-hidden="true" />
              <p className="font-medium text-gray-900 dark:text-white">{t('upload.processing')}</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400">
                {archivos.map((a) => (
                  <li key={a.file.name}>{a.file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {estado === 'listo' && resultado && (
            <div className="space-y-4" role="status" aria-live="polite">
              <p className="flex items-center gap-2 text-lg font-semibold text-green-700 dark:text-green-300">
                <CheckCircleIcon className="h-6 w-6" aria-hidden="true" />
                {t('upload.resultTitle', { number: resultado.factura.numeroFactura })}
              </p>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{t('upload.resultProcedures')}</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">{resultado.archivosProcessed.procedimientos}</dd>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{t('upload.resultMethod')}</dt>
                  <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                    {['HIBRIDO', 'IA', 'REGEX'].includes(resultado.archivosProcessed.metodo)
                      ? t(`upload.methods.${resultado.archivosProcessed.metodo}`)
                      : resultado.archivosProcessed.metodo}
                  </dd>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{t('upload.resultDenials')}</dt>
                  <dd className="text-lg font-semibold text-orange-700 dark:text-orange-300">
                    {resultado.glosas.length} · {formatearCOP(resultado.factura.totalGlosas, locale)}
                  </dd>
                </div>
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">{t('upload.resultToPay')}</dt>
                  <dd className="text-lg font-semibold text-green-700 dark:text-green-300">
                    {formatearCOP(resultado.factura.valorAceptado, locale)}
                  </dd>
                </div>
              </dl>
              {!resultado.factura.auditoriaCompletada && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  {t('upload.resultReview')}
                </p>
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={reiniciar}>
                  {t('upload.another')}
                </Button>
                <Button
                  onClick={() => {
                    const id = resultado.factura._id;
                    reiniciar();
                    autoLanzado.current = false;
                    onVerDetalle(id);
                  }}
                >
                  {t('upload.viewDetail')}
                </Button>
              </div>
            </div>
          )}

          {estado === 'error' && (
            <div className="space-y-4">
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                <p className="mb-1 flex items-center gap-2 font-semibold">
                  <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                  {t('upload.failedTitle')}
                </p>
                <p className="text-sm">{mensajeError}</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={cerrar}>
                  {t('common.close')}
                </Button>
                <Button onClick={() => setEstado('editando')}>{t('common.retry')}</Button>
              </div>
            </div>
          )}

          {estado === 'editando' && (
            <>
              <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-primary-800 dark:bg-primary-950">
                <p className="font-semibold text-primary-900 dark:text-primary-100">{t('upload.sampleTitle')}</p>
                <p className="mt-1 text-sm text-primary-800 dark:text-primary-200">{t('upload.sampleBody')}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button size="sm" onClick={usarEjemplo} isLoading={generando} disabled={generando}>
                    <SparklesIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t('upload.useSample')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={descargarEjemplo} disabled={generando}>
                    <ArrowDownTrayIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t('upload.downloadSample')}
                  </Button>
                </div>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastrando(true);
                }}
                onDragLeave={() => setArrastrando(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setArrastrando(false);
                  agregarArchivos(e.dataTransfer.files);
                }}
                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                  arrastrando ? 'border-primary-500 bg-primary-50 dark:bg-primary-950' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <DocumentArrowUpIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" aria-hidden="true" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {t('upload.dropzone')}{' '}
                  <label htmlFor={idInput} className="cursor-pointer font-semibold text-primary-700 underline dark:text-primary-300">
                    {t('upload.choose')}
                  </label>
                </p>
                <input
                  id={idInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    agregarArchivos(e.target.files);
                    e.target.value = '';
                  }}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('upload.limits')}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('upload.multiNote')}</p>
              </div>

              {avisos.length > 0 && (
                <ul role="alert" className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  {avisos.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              )}

              {archivos.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('upload.selected', { count: archivos.length })}
                  </p>
                  <ul className="max-h-48 space-y-2 overflow-y-auto">
                    {archivos.map((a, i) => (
                      <li
                        key={`${a.file.name}-${i}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <DocumentTextIcon className="h-5 w-5 flex-shrink-0 text-red-500" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{a.file.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(a.file.size / 1024).toFixed(1)} KB{a.ejemplo ? ` · ${t('badges.sampleData')}` : ''}
                            </span>
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setArchivos(archivos.filter((_, j) => j !== i))}
                          aria-label={t('upload.remove', { name: a.file.name })}
                          className="rounded p-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                        >
                          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {requiereConsentimiento && (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">{t('upload.consent')}</span>
                </label>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400">{t('upload.sharedNote')}</p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={cerrar}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={() => auditar(archivos)} disabled={!puedeEnviar}>
                  {t('upload.submit', { count: archivos.length })}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
