'use client';

import React from 'react';
import { Guia } from '../store';
import { Tabs } from './Tabs';
import { StatusBadge } from './StatusBadge';
import { Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface DetalleGuiaProps {
  guia: Guia;
}

export function DetalleGuia({ guia }: DetalleGuiaProps) {
  const tabs = [
    {
      id: 'general',
      label: 'General',
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Número</p>
            <p className="font-semibold text-slate-900 dark:text-white">{guia.numero}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Estado</p>
            <StatusBadge estado={guia.estado} />
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Remitente</p>
            <p className="text-slate-900 dark:text-white">{guia.remitente.razonSocial}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Destinatario</p>
            <p className="text-slate-900 dark:text-white">{guia.destinatario.razonSocial}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Conductor</p>
            <p className="text-slate-900 dark:text-white">{guia.conductor.nombres}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Vehículo</p>
            <p className="text-slate-900 dark:text-white">{guia.vehiculo.placa}</p>
          </div>
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
                navigator.clipboard.writeText(guia.xml);
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
          <pre className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-xs overflow-auto">{guia.xml}</pre>
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
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">Hash: {guia.hash}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'pdf',
      label: 'PDF',
      content: (
        <div className="space-y-4">
          <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Descargar PDF</span>
          </button>
        </div>
      ),
    },
  ];

  return <Tabs items={tabs} defaultTab="general" />;
}
