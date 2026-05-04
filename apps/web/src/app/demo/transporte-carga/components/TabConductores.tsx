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
import { Conductor } from '../types';
import { transporteAPI } from '../api';
import ConductorForm from './forms/ConductorForm';
import { formatFecha } from '../lib/format';

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  primary: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-l-4 border-blue-500' },
  success: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-300', border: 'border-l-4 border-green-500' },
  error: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', border: 'border-l-4 border-red-500' },
  warning: { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-l-4 border-yellow-500' },
};

export default function TabConductores() {
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadConductores();
  }, []);

  const loadConductores = async () => {
    setIsLoading(true);
    try {
      const data = await transporteAPI.conductores.list();
      setConductores(data);
    } catch (error) {
      toast.error('Error al cargar conductores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: Conductor) => {
    try {
      await transporteAPI.conductores.create(data);
      toast.success('Conductor creado correctamente');
      setShowForm(false);
      loadConductores();
    } catch (error) {
      toast.error('Error al crear conductor');
    }
  };

  const handleUpdate = async (data: Conductor) => {
    try {
      await transporteAPI.conductores.update(selectedConductor!.id, data);
      toast.success('Conductor actualizado correctamente');
      setShowForm(false);
      setSelectedConductor(null);
      loadConductores();
    } catch (error) {
      toast.error('Error al actualizar conductor');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await transporteAPI.conductores.delete(confirmDelete);
      toast.success('Conductor eliminado correctamente');
      setConfirmDelete(null);
      loadConductores();
    } catch (error) {
      toast.error('Error al eliminar conductor');
    } finally {
      setDeleting(false);
    }
  };

  const filteredConductores = conductores.filter(
    (c) =>
      c.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dni.includes(searchTerm)
  );

  const getDaysUntilExpiration = (fecha: string) => {
    const today = new Date();
    const expDate = new Date(fecha);
    const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getLicenseStatus = (fecha: string) => {
    const days = getDaysUntilExpiration(fecha);
    if (days < 0) return { variant: 'error', text: 'Vencida' };
    if (days < 30) return { variant: 'error', text: `${days}d` };
    if (days < 60) return { variant: 'warning', text: `${days}d` };
    return { variant: 'success', text: `${days}d` };
  };

  const stats = [
    { label: 'Total', value: conductores.length, color: 'primary' },
    { label: 'Activos', value: conductores.filter((c) => c.activo).length, color: 'success' },
    {
      label: 'Licencia < 30d',
      value: conductores.filter((c) => getDaysUntilExpiration(c.vencimientoLicencia) < 30)
        .length,
      color: 'error',
    },
    {
      label: 'Licencia < 60d',
      value: conductores.filter((c) => getDaysUntilExpiration(c.vencimientoLicencia) < 60)
        .length,
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
            placeholder="Buscar por nombre, apellido o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            setSelectedConductor(null);
            setShowForm(true);
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Conductor
        </Button>
      </div>

      {/* Table */}
      {filteredConductores.length > 0 ? (
        <Card>
          <Table
            columns={[
              {
                key: 'dni',
                label: 'DNI',
                render: (c: Conductor) => (
                  <span className="font-mono">{c.dni}</span>
                ),
              },
              {
                key: 'nombres',
                label: 'Nombres',
                render: (c: Conductor) => `${c.nombres} ${c.apellidos}`,
              },
              {
                key: 'licencia',
                label: 'Licencia',
                render: (c: Conductor) => (
                  <span>
                    <span className="font-mono">{c.licencia}</span>
                    {' '}
                    <Badge variant="info" size="sm">
                      {c.categoriaLicencia}
                    </Badge>
                  </span>
                ),
              },
              {
                key: 'vencimientoLicencia',
                label: 'Vencimiento',
                render: (c: Conductor) => {
                  const licenseStatus = getLicenseStatus(c.vencimientoLicencia);
                  const dias = getDaysUntilExpiration(c.vencimientoLicencia);
                  return (
                    <Badge variant={licenseStatus.variant as any} size="sm">
                      {formatFecha(c.vencimientoLicencia)} ({dias}d)
                    </Badge>
                  );
                },
              },
              {
                key: 'activo',
                label: 'Estado',
                render: (c: Conductor) => (
                  <Badge
                    variant={c.activo ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'acciones',
                label: 'Acciones',
                render: (c: Conductor) => (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="p-1.5 rounded text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800 dark:hover:text-white transition-colors"
                      title="Editar"
                      onClick={() => {
                        setSelectedConductor(c);
                        setShowForm(true);
                      }}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      title="Eliminar"
                      onClick={() => setConfirmDelete(c.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredConductores}
          />
        </Card>
      ) : (
        <EmptyState title="Sin conductores" description="No hay conductores registrados" />
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          isOpen
          onClose={() => {
            setShowForm(false);
            setSelectedConductor(null);
          }}
          title={selectedConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
        >
          <ConductorForm
            initialData={selectedConductor || undefined}
            onSubmit={selectedConductor ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setSelectedConductor(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar conductor"
        description="Esta acción no se puede deshacer. El conductor será eliminado permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </motion.div>
  );
}