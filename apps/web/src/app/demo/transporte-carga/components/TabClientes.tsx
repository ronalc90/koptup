'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { Table, ColumnDef } from './Table';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { Cliente } from '../store';
import { ClienteForm } from './forms/ClienteForm';
import toast from 'react-hot-toast';

interface TabClientesProps {
  clientes: Cliente[];
  onAddCliente: (cliente: Omit<Cliente, 'id' | 'createdAt'>) => void;
  onUpdateCliente: (id: string, cliente: Partial<Cliente>) => void;
  onDeleteCliente: (id: string) => void;
}

export function TabClientes({
  clientes,
  onAddCliente,
  onUpdateCliente,
  onDeleteCliente,
}: TabClientesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nombre: string } | null>(null);

  const stats = useMemo(() => {
    return {
      total: clientes.length,
      activos: clientes.filter((c) => c.activo).length,
      juridicos: clientes.filter((c) => c.tipoDoc === 6).length,
      naturales: clientes.filter((c) => c.tipoDoc === 1).length,
    };
  }, [clientes]);

  const columns: ColumnDef<Cliente>[] = [
    { key: 'razonSocial', label: 'Razón Social', sortable: true, searchable: true },
    { key: 'numeroDoc', label: 'RUC/DNI', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: false },
    { key: 'email', label: 'Email', sortable: false },
    {
      key: 'activo',
      label: 'Estado',
      render: (value) => (value ? 'Activo' : 'Inactivo'),
    },
    {
      key: 'id',
      label: 'Acciones',
      render: (value, row: Cliente) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCliente(row);
              setIsFormOpen(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteConfirm({ id: row.id, nombre: row.razonSocial });
            }}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (data: any) => {
    try {
      if (selectedCliente) {
        onUpdateCliente(selectedCliente.id, data);
        toast.success('Cliente actualizado');
      } else {
        onAddCliente(data);
        toast.success('Cliente creado');
      }
      setIsFormOpen(false);
      setSelectedCliente(null);
    } catch (error) {
      toast.error('Error al guardar cliente');
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      onDeleteCliente(deleteConfirm.id);
      toast.success('Cliente eliminado');
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Activos', value: stats.activos },
          { label: 'Jurídicos', value: stats.juridicos },
          { label: 'Naturales', value: stats.naturales },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setSelectedCliente(null);
          setIsFormOpen(true);
        }}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Nuevo Cliente</span>
      </button>

      {clientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clientes"
          description="No hay clientes registrados aún. Crea el primero para comenzar."
          action={{ label: 'Crear Cliente', onClick: () => setIsFormOpen(true) }}
        />
      ) : (
        <Table
          data={clientes}
          columns={columns}
          searchable
          searchKeys={['razonSocial', 'numeroDoc']}
        />
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedCliente ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <ClienteForm
          initialData={selectedCliente || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Eliminar Cliente"
        description={`¿Estás seguro de que deseas eliminar a ${deleteConfirm?.nombre}?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
