'use client';

import React, { useState, useMemo } from 'react';
import { FileText, Eye } from 'lucide-react';
import { Table, ColumnDef } from './Table';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import { Factura } from '../store';
import { DetalleFactura } from './DetalleFactura';
import toast from 'react-hot-toast';

interface TabFacturasProps {
  facturas: Factura[];
  onAnularFactura: (id: string) => void;
}

export function TabFacturas({ facturas, onAnularFactura }: TabFacturasProps) {
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);

  const stats = useMemo(() => {
    return {
      total: facturas.length,
      montoTotal: facturas.reduce((sum, f) => sum + f.total, 0),
      detracciones: facturas.reduce((sum, f) => sum + (f.detraccion || 0), 0),
      emitidas: facturas.filter((f) => f.estado === 'emitida').length,
    };
  }, [facturas]);

  const columns: ColumnDef<Factura>[] = [
    { key: 'numero', label: 'Número', sortable: true },
    { key: 'clienteRazonSocial', label: 'Cliente', sortable: true },
    { key: 'subtotal', label: 'Subtotal (S/)', sortable: true, render: (v) => (v as number).toFixed(2) },
    { key: 'igv', label: 'IGV (S/)', render: (v) => (v as number).toFixed(2) },
    {
      key: 'detraccion',
      label: 'Detracción (S/)',
      render: (v) => (
        <span className={v ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
          {(v as number)?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    { key: 'total', label: 'Total (S/)', sortable: true, render: (v) => (v as number).toFixed(2) },
    {
      key: 'estado',
      label: 'Estado',
      render: (v) => <StatusBadge estado={v as string} />,
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (_, row: Factura) => (
        <div className="flex space-x-2">
          <button onClick={() => setSelectedFactura(row)} className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Monto Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">S/ {stats.montoTotal.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Detracciones</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">S/ {stats.detracciones.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400">Emitidas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.emitidas}</p>
        </div>
      </div>

      {facturas.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Sin facturas"
          description="No hay facturas emitidas aún."
        />
      ) : (
        <Table data={facturas} columns={columns} />
      )}

      {selectedFactura && (
        <Modal isOpen={!!selectedFactura} onClose={() => setSelectedFactura(null)} title="Detalle de Factura">
          <DetalleFactura factura={selectedFactura} />
        </Modal>
      )}
    </div>
  );
}
