'use client';

import React from 'react';
import { Factura } from '../store';
import { Tabs } from './Tabs';
import { StatusBadge } from './StatusBadge';
import { Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface DetalleFacturaProps {
  factura: Factura;
}

export function DetalleFactura({ factura }: DetalleFacturaProps) {
  const netAmount = factura.total + (factura.detraccion || 0);

  const tabs = [
    {
      id: 'resumen',
      label: 'Resumen',
      content: (
        <div className="space-y-4">
          {factura.detraccion && factura.detraccion > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Detracción aplicada (4%)</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">S/ {factura.detraccion.toFixed(2)}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">Monto a pagar: S/ {factura.total.toFixed(2)}</p>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">S/ {factura.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">IGV (18%)</span>
              <span className="font-semibold text-slate-900 dark:text-white">S/ {factura.igv.toFixed(2)}</span>
            </div>
            {factura.detraccion && factura.detraccion > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Detracción (4%)</span>
                <span className="font-semibold">-S/ {factura.detraccion.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-600">
              <span className="font-bold text-slate-900 dark:text-white">Total</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">S/ {factura.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'items',
      label: 'Items',
      content: (
        <div className="space-y-3">
          {factura.items.map((item) => (
            <div key={item.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded">
              <p className="font-semibold text-slate-900 dark:text-white">{item.descripcion}</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <div>Cantidad: {item.cantidad}</div>
                <div>Unitario: S/ {item.unitario.toFixed(2)}</div>
                <div>Subtotal: S/ {item.subtotal.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'xml',
      label: 'XML',
      content: (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(factura.xml);
                toast.success('XML copiado');
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors flex items-center space-x-1"
            >
              <Copy className="w-4 h-4" />
              <span>Copiar</span>
            </button>
            <button className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors flex items-center space-x-1">
              <Download className="w-4 h-4" />
              <span>Descargar</span>
            </button>
          </div>
          <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto">{factura.xml}</pre>
        </div>
      ),
    },
    {
      id: 'cdr',
      label: 'CDR',
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
            <p className="text-sm font-semibold text-green-900 dark:text-green-200">Estado: Aceptado</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-2">CDR Mock - Hash: abc123def456</p>
          </div>
        </div>
      ),
    },
  ];

  return <Tabs items={tabs} defaultTab="resumen" />;
}
