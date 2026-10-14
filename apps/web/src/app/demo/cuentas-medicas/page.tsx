'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import type { FiltrosFacturas, ResultadoProcesamiento } from './tipos-auditoria';
import { motivoDeAcceso, type MotivoAcceso } from './api';
import { guardarLectura } from './lib/memoria';
import Encabezado, { type Vista } from './components/Encabezado';
import AccesoInactivo from './components/AccesoInactivo';
import Tablero from './components/Tablero';
import ListaFacturas from './components/ListaFacturas';
import DetalleFactura from './components/DetalleFactura';
import ComoAudita from './components/ComoAudita';
import ModalAuditar from './components/ModalAuditar';

/**
 * Demo privada "Sistema experto para salud": auditoría de cuentas médicas.
 * Usa el backend real (/api/auditoria): extracción con IA de facturas en PDF,
 * tarifario de ejemplo, propuesta del modelo y decisión del auditor por glosa.
 */
export default function CuentasMedicasPage() {
  const t = useTranslations('demoMedicalAccounts');
  const [vista, setVista] = useState<Vista>('tablero');
  const [facturaId, setFacturaId] = useState<string | null>(null);
  const [accesoInactivo, setAccesoInactivo] = useState<MotivoAcceso | null>(null);
  const [modal, setModal] = useState<{ abierto: boolean; autoEjemplo: boolean }>({ abierto: false, autoEjemplo: false });
  const [filtros, setFiltros] = useState<FiltrosFacturas>({ estado: '', desde: '', hasta: '' });
  // Cambia cuando se crean, deciden o eliminan datos, para que las vistas recarguen.
  const [version, setVersion] = useState(0);
  // Cambia cuando la persona pide actualizar (vuelve a pulsar la pestaña abierta).
  const [recarga, setRecarga] = useState(0);

  const marcarAccesoInactivo = useCallback((error: unknown) => {
    setModal({ abierto: false, autoEjemplo: false });
    setAccesoInactivo(motivoDeAcceso(error));
    window.scrollTo({ top: 0 });
  }, []);
  const refrescar = useCallback(() => setVersion((v) => v + 1), []);

  const irA = useCallback(
    (v: Vista) => {
      // Volver a pulsar la pestaña abierta vuelve a pedir los datos al servidor.
      if (v === vista) setRecarga((r) => r + 1);
      setVista(v);
      setFacturaId(null);
    },
    [vista],
  );

  const verDetalle = useCallback((id: string) => {
    setModal({ abierto: false, autoEjemplo: false });
    setFacturaId(id);
    setVista('detalle');
    window.scrollTo({ top: 0 });
  }, []);

  const alAuditar = useCallback(
    (resultado: ResultadoProcesamiento) => {
      guardarLectura(resultado.factura._id, {
        metodo: resultado.archivosProcessed.metodo,
        procedimientos: resultado.archivosProcessed.procedimientos,
        archivos: resultado.archivosProcessed.total,
      });
      refrescar();
    },
    [refrescar],
  );

  const cerrarModal = useCallback(() => setModal({ abierto: false, autoEjemplo: false }), []);
  const auditarEjemplo = useCallback(() => setModal({ abierto: true, autoEjemplo: true }), []);
  const subirPDF = useCallback(() => setModal({ abierto: true, autoEjemplo: false }), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-6 dark:from-gray-950 dark:via-black dark:to-gray-950 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Encabezado
          vista={vista}
          mostrarNavegacion={!accesoInactivo}
          onCambiarVista={irA}
          onAuditar={subirPDF}
        />

        {accesoInactivo ? (
          <AccesoInactivo motivo={accesoInactivo} />
        ) : (
          <div>
            <p className="mb-6 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/80 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-100">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {t('sharedSpaceNote')}
            </p>

            {vista === 'tablero' && (
              <Tablero
                version={version}
                recarga={recarga}
                onErrorAcceso={marcarAccesoInactivo}
                onAuditarEjemplo={auditarEjemplo}
                onSubirPDF={subirPDF}
                onVerFacturas={() => irA('facturas')}
                onVerComo={() => irA('como')}
              />
            )}
            {vista === 'facturas' && (
              <ListaFacturas
                version={version}
                recarga={recarga}
                filtros={filtros}
                onCambiarFiltros={setFiltros}
                onVerDetalle={verDetalle}
                onErrorAcceso={marcarAccesoInactivo}
                onCambioDatos={refrescar}
              />
            )}
            {vista === 'detalle' && facturaId && (
              <DetalleFactura
                key={facturaId}
                facturaId={facturaId}
                onVolver={() => {
                  setVista('facturas');
                  setFacturaId(null);
                }}
                onErrorAcceso={marcarAccesoInactivo}
                onCambioDatos={refrescar}
              />
            )}
            {vista === 'como' && <ComoAudita onAuditarEjemplo={auditarEjemplo} />}
          </div>
        )}
      </div>

      <ModalAuditar
        abierto={modal.abierto}
        autoEjemplo={modal.autoEjemplo}
        onCerrar={cerrarModal}
        onAuditada={alAuditar}
        onVerDetalle={verDetalle}
        onErrorAcceso={marcarAccesoInactivo}
      />
    </div>
  );
}
