'use client';

import React, { useState } from 'react';
import { Orden, Guia, Factura } from '../store';
import { StatusBadge } from './StatusBadge';
import { motion } from 'framer-motion';

interface DetalleOrdenProps {
  orden: Orden;
  onUpdateOrden: (data: Partial<Orden>) => void;
  onCreateGuia: (guia: Guia) => void;
  onCreateFactura: (factura: Factura) => void;
}

export function DetalleOrden({
  orden,
  onUpdateOrden,
  onCreateGuia,
  onCreateFactura,
}: DetalleOrdenProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStateTransition = async () => {
    setIsTransitioning(true);
    try {
      if (orden.estado === 'borrador') {
        onUpdateOrden({ estado: 'confirmada' });
      } else if (orden.estado === 'confirmada') {
        onUpdateOrden({ estado: 'en_ruta' });
      } else if (orden.estado === 'en_ruta') {
        onUpdateOrden({ estado: 'entregada' });
      }
    } finally {
      setIsTransitioning(false);
    }
  };

  const canCreateGuia = ['confirmada', 'en_ruta', 'entregada'].includes(orden.estado);
  const canCreateFactura = ['entregada', 'en_ruta'].includes(orden.estado);
  const canTransition = ['borrador', 'confirmada', 'en_ruta'].includes(orden.estado);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Información General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Número de Orden</p>
            <p className="font-semibold text-slate-900 dark:text-white">{orden.numero}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Estado</p>
            <StatusBadge estado={orden.estado} />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Peso Total</p>
            <p className="font-semibold text-slate-900 dark:text-white">{orden.pesoTotal} kg</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Bultos</p>
            <p className="font-semibold text-slate-900 dark:text-white">{orden.bultos}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ruta</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Origen</p>
            <p className="text-slate-900 dark:text-white">{orden.origen.direccion}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Destino</p>
            <p className="text-slate-900 dark:text-white">{orden.destino.direccion}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Totales</h3>
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Flete</span>
            <span className="font-semibold text-slate-900 dark:text-white">S/ {orden.flete.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">IGV (18%)</span>
            <span className="font-semibold text-slate-900 dark:text-white">S/ {orden.igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
            <span className="font-semibold text-slate-900 dark:text-white">Total</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">S/ {orden.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        {canTransition && (
          <button
            onClick={handleStateTransition}
            disabled={isTransitioning}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {isTransitioning
              ? 'Procesando...'
              : orden.estado === 'borrador'
                ? 'Confirmar Orden'
                : orden.estado === 'confirmada'
                  ? 'Iniciar Viaje'
                  : 'Marcar Entregada'}
          </button>
        )}

        {canCreateGuia && (
          <button
            onClick={() => {
              const guia: Guia = {
                id: Math.random().toString(),
                numero: `GR-${orden.numero}`,
                ordenId: orden.id,
                remitente: { razonSocial: 'DEMO', numeroDoc: '20505000999' },
                destinatario: { razonSocial: 'CLIENTE DESTINO', numeroDoc: '10123456789' },
                transportista: { razonSocial: 'TRANSPORTES DEMO', ruc: '20505000999' },
                conductor: { nombres: 'Juan García', dni: '12345678' },
                vehiculo: { placa: 'ABC-123' },
                hash: Math.random().toString(36).substring(7),
                xml: '<GuiaRemision></GuiaRemision>',
                estado: 'emitida',
                createdAt: new Date(),
              };
              onCreateGuia(guia);
            }}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Generar Guía de Remisión
          </button>
        )}

        {canCreateFactura && (
          <button
            onClick={() => {
              const detraccion = orden.flete >= 700 ? orden.flete * 0.04 : 0;
              const factura: Factura = {
                id: Math.random().toString(),
                numero: `F-${orden.numero}`,
                ordenId: orden.id,
                clienteId: orden.clienteId,
                clienteRazonSocial: 'CLIENTE DEMO',
                clienteNumeroDoc: '10123456789',
                items: [
                  {
                    id: Math.random().toString(),
                    descripcion: 'Servicio de Transporte',
                    cantidad: 1,
                    unitario: orden.flete,
                    subtotal: orden.flete,
                  },
                ],
                subtotal: orden.flete,
                igv: orden.igv,
                detraccion,
                total: orden.flete + orden.igv - detraccion,
                xml: '<Factura></Factura>',
                estado: 'emitida',
                createdAt: new Date(),
              };
              onCreateFactura(factura);
            }}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Emitir Factura
          </button>
        )}
      </div>
    </motion.div>
  );
}
