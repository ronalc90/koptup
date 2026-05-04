'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vehiculo } from '../../store';
import { Input } from '../Input';
import { Select } from '../Select';
import toast from 'react-hot-toast';

const vehiculoSchema = z.object({
  placa: z.string().regex(/^[A-Z]{3}-\d{3}$/, 'Formato: ABC-123'),
  configuracion: z.string().min(1, 'Requerido'),
  anio: z.number().min(1990).max(new Date().getFullYear()),
  capacidadKg: z.number().positive('Debe ser mayor a 0'),
  vencimientoSOAT: z.string().min(1, 'Requerido'),
  vencimientoRevision: z.string().min(1, 'Requerido'),
  certificadoMTC: z.string().optional(),
  activo: z.boolean(),
});

type VehiculoFormData = z.infer<typeof vehiculoSchema>;

interface VehiculoFormProps {
  initialData?: Vehiculo;
  onSubmit: (data: VehiculoFormData) => void | Promise<void>;
  onCancel: () => void;
}

const configuraciones = ['C2', 'C3', 'C4', 'T2S2', 'T2S3', 'T3S2', 'T3S3', 'C2RB1', 'C3RB1'];

export function VehiculoForm({ initialData, onSubmit, onCancel }: VehiculoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehiculoFormData>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: initialData || { activo: true, anio: new Date().getFullYear() },
  });

  const onSubmitHandler = async (data: VehiculoFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      <Input
        label="Placa"
        {...register('placa')}
        error={errors.placa?.message}
        placeholder="ABC-123"
        maxLength={8}
      />

      <Select
        label="Configuración"
        {...register('configuracion')}
        options={configuraciones.map((c) => ({ value: c, label: c }))}
        error={errors.configuracion?.message}
      />

      <Input
        type="number"
        label="Año"
        {...register('anio', { valueAsNumber: true })}
        error={errors.anio?.message}
      />

      <Input
        type="number"
        label="Capacidad (kg)"
        {...register('capacidadKg', { valueAsNumber: true })}
        error={errors.capacidadKg?.message}
      />

      <Input
        type="date"
        label="Vencimiento SOAT"
        {...register('vencimientoSOAT')}
        error={errors.vencimientoSOAT?.message}
      />

      <Input
        type="date"
        label="Vencimiento Revisión"
        {...register('vencimientoRevision')}
        error={errors.vencimientoRevision?.message}
      />

      <Input label="Certificado MTC" {...register('certificadoMTC')} />

      <label className="flex items-center space-x-2">
        <input type="checkbox" {...register('activo')} className="w-4 h-4" />
        <span className="text-slate-700 dark:text-slate-300">Activo</span>
      </label>

      <div className="flex space-x-2 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-400 dark:hover:bg-slate-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
