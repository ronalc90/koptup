'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import Table from './Table';
import EmptyState from './EmptyState';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Vehiculo } from '../types';
import { transporteAPI } from '../api';
import VehiculoForm from './forms/VehiculoForm';
import { formatFecha } from '../lib/format';

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-l-4 border-blue-500' },
  success: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-300', border: 'border-l-4 border-green-500' },
  warning: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-l-4 border-yellow-500' },
};

export default function TabVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehiculo, setSelectedVehiculo] = useState<Vehiculo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadVehiculos();
  }, []);

  const loadVehiculos = async () => {
    setIsLoading(true);
    try {
      const data = await transporteAPI.vehiculos.list();
      setVehiculos(data);
    } catch (error) {
      toast.error('Error al cargar vehículos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: Vehiculo) => {
    try {
      await transporteAPI.vehiculos.create(data);
      toast.success('Vehículo creado correctamente');
      setShowForm(false);
      loadVehiculos();
    } catch (error) {
      toast.error('Error al crear vehículo');
    }
  };

  const handleUpdate = async (data: Vehiculo) => {
    try {
      await transporteAPI.vehiculos.update(selectedVehiculo!.id, data);
      toast.success('Vehículo actualizado correctamente');
      setShowForm(false);
      setSelectedVehiculo(null);
      loadVehiculos();
    } catch (error) {
      toast.error('Error al actualizar vehículo');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await transporteAPI.vehiculos.delete(confirmDelete);
      toast.success('Vehículo eliminado correctamente');
      setConfirmDelete(null);
      loadVehiculos();
    } catch (error) {
      toast.error('Error al eliminar vehículo');
    } finally {
      setDeleting(false);
    }
  };

  const filteredVehiculos = vehiculos.filter(
    (v) =>
      v.placa.toUpperCase().includes(searchTerm.toUpperCase()) ||
      v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDaysUntilExpiration = (fecha: string) => {
    const today = new Date();
    const expDate = new Date(fecha);
    const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const stats = [
    { label: 'Total', value: vehiculos.length, color: 'primary' },
    { label: 'Activos', value: vehiculos.filter((v) => v.activo).length, color: 'success' },
    {
      label: 'SOAT < 30d',
      value: vehiculos.filter((v) => getDaysUntilExpiration(v.vencimientoSOAT) < 30).length,
      color: 'warning',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {stats.map((stat) => {
          const colors = COLOR_CLASSES[stat.color] || COLOR_CLASSES.primary;
          return (
            <Card key={stat.label} className={colors.border}>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${colors.text}`}>{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Search and Create */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por placa, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            setSelectedVehiculo(null);
            setShowForm(true);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Vehículo
        </Button>
      </div>

      {/* Table */}
      {filteredVehiculos.length > 0 ? (
        <Card>
          <Table
            columns={[
              {
                key: 'placa',
                label: 'Placa',
                render: (v: Vehiculo) => (
                  <span className="font-mono font-bold">{v.placa}</span>
                ),
              },
              {
                key: 'marca',
                label: 'Marca/Modelo',
                render: (v: Vehiculo) => `${v.marca} ${v.modelo}`,
              },
              {
                key: 'tipo',
                label: 'Tipo',
                render: (v: Vehiculo) => (
                  <Badge variant="primary" size="sm">
                    {v.tipo}
                  </Badge>
                ),
              },
              { key: 'anio', label: 'Año' },
              {
                key: 'vencimientoSOAT',
                label: 'SOAT',
                render: (v: Vehiculo) => {
                  const days = getDaysUntilExpiration(v.vencimientoSOAT);
                  const variant = days < 30 ? 'warning' : 'success';
                  return (
                    <Badge variant={variant} size="sm">
                      {formatFecha(v.vencimientoSOAT)} ({days}d)
                    </Badge>
                  );
                },
              },
              {
                key: 'activo',
                label: 'Estado',
                render: (v: Vehiculo) => (
                  <Badge variant={v.activo ? 'success' : 'secondary'} size="sm">
                    {v.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'acciones',
                label: 'Acciones',
                render: (v: Vehiculo) => (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-white transition-colors"
                      title="Editar"
                      onClick={() => {
                        setSelectedVehiculo(v);
                        setShowForm(true);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      title="Eliminar"
                      onClick={() => setConfirmDelete(v.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredVehiculos}
          />
        </Card>
      ) : (
        <EmptyState title="Sin vehículos" description="No hay vehículos registrados" />
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen
          onClose={() => {
            setShowForm(false);
            setSelectedVehiculo(null);
          }}
          title={selectedVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        >
          <VehiculoForm
            initialData={selectedVehiculo || undefined}
            onSubmit={selectedVehiculo ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setSelectedVehiculo(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar vehículo"
        description="Esta acción no se puede deshacer. El vehículo será eliminado permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </motion.div>
  );
}