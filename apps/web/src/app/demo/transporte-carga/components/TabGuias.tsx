'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Download, Eye, X } from 'lucide-react';
import { Table, ColumnDef } from './Table';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import { Guia } from '../store';
import { DetalleGuia } from './DetalleGuia';
import toast from 'react-hot-toast';

interface TabGuiasProps {
  guias: Guia[];
  onAnularGuia: (id: string) => void;
}

export function TabGuias({ guias, onAnularGuia }: TabGuiasProps) {
  const [selectedGuia, setSelectedGuia] = useState<Guia | null>(null);

  const stats = useMemo(() => {
    return {
      total: guias.length,
      emitidas: guias.filter((g) => g.estado === 'emitida').length,
      aceptadas: guias.filter((g) => g.estado === 'aceptada').length,
      rechazadas: guias.filter((g) => g.estado === 'rechazada').length,
    };
  }, [guias]);

  const columns: ColumnDef<Guia>[] = [
    { key: 'numero', label: 'Número', sortable: true },
    { key: 'remitente', label: 'Remitente', render: (v: any) => v.razonSocial },
    { key: 'destinatario', label: 'Destinatario', render: (v: any) => v.razonSocial },
    { key: 'createdAt', label: 'Fecha', sortable: true, render: (v) => new Date(v as string).toLocaleDateString() },
    {
      key: 'estado',
      label: 'Estado',
      render: (v) => <StatusBadge estado={v as string} />,
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_, row: Guia) => (
        <div className="flex space-x-2">
          <button onClick={() => setSelectedGuia(row)} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Emitidas', value: stats.emitidas },
          { label: 'Aceptadas', value: stats.aceptadas },
          { label: 'Rechazadas', value: stats.rechazadas },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {guias.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Sin guías"
          description="No hay guías de remisión emitidas aún."
        />
      ) : (
        <Table data={guias} columns={columns} />
      )}

      {selectedGuia && (
        <Modal isOpen={!!selectedGuia} onClose={() => setSelectedGuia(null)} title="Detalle de Guía">
          <DetalleGuia guia={selectedGuia} />
        </Modal>
      )}
    </div>
  );
}
