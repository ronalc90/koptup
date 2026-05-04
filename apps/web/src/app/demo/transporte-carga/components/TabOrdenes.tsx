'use client';

import React, { useState, useMemo } from 'react';
import { Package, Plus } from 'lucide-react';
import { Table, ColumnDef } from './Table';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import { Orden } from '../store';
import { DetalleOrden } from './DetalleOrden';
import toast from 'react-hot-toast';

interface TabOrdenesProps {
  ordenes: Orden[];
  onCreateOrden: (data: any) => void;
  onUpdateOrden: (id: string, data: any) => void;
}

export function TabOrdenes({ ordenes, onCreateOrden, onUpdateOrden }: TabOrdenesProps) {
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [filterEstado, setFilterEstado] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filterEstado) return ordenes;
    return ordenes.filter((o) => o.estado === filterEstado);
  }, [ordenes, filterEstado]);

  const stats = useMemo(() => {
    return {
      total: ordenes.length,
      borrador: ordenes.filter((o) => o.estado === 'borrador').length,
      en_ruta: ordenes.filter((o) => o.estado === 'en_ruta').length,
      entregadas: ordenes.filter((o) => o.estado === 'entregada' || o.estado === 'facturada').length,
    };
  }, [ordenes]);

  const columns: ColumnDef<Orden>[] = [
    { key: 'numero', label: 'Número', sortable: true },
    { key: 'clienteId', label: 'Cliente', sortable: true },
    { key: 'fechaInicioTraslado', label: 'Fecha', sortable: true, render: (v) => new Date(v as string).toLocaleDateString() },
    { key: 'pesoTotal', label: 'Peso (kg)', sortable: true },
    { key: 'flete', label: 'Flete (S/)', sortable: true },
    {
      key: 'estado',
      label: 'Estado',
      render: (v) => <StatusBadge estado={v as string} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, estado: null },
          { label: 'Borrador', value: stats.borrador, estado: 'borrador' },
          { label: 'En Ruta', value: stats.en_ruta, estado: 'en_ruta' },
          { label: 'Entregadas', value: stats.entregadas, estado: 'entregada' },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={() => setFilterEstado(stat.estado)}
            className={`p-4 rounded-lg border-2 transition-colors text-left ${
              filterEstado === stat.estado
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500'
            }`}
          >
            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </button>
        ))}
      </div>

      {ordenes.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin órdenes"
          description="No hay órdenes registradas. Crea la primera."
        />
      ) : (
        <Table
          data={filtered}
          columns={columns}
          onRowClick={setSelectedOrden}
        />
      )}

      {selectedOrden && (
        <Modal isOpen={!!selectedOrden} onClose={() => setSelectedOrden(null)}>
          <DetalleOrden
            orden={selectedOrden}
            onUpdateOrden={(data) => {
              onUpdateOrden(selectedOrden.id, data);
              setSelectedOrden(null);
              toast.success('Orden actualizada');
            }}
            onCreateGuia={(guia) => {
              toast.success('Guía creada');
            }}
            onCreateFactura={(factura) => {
              toast.success('Factura creada');
            }}
          />
        </Modal>
      )}
    </div>
  );
}
