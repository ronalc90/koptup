'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Conductor } from '../../store';
import { Input } from '../Input';
import { Select } from '../Select';
import toast from 'react-hot-toast';

const conductorSchema = z.object({
  dni: z.string().length(8, 'DNI debe tener 8 dígitos'),
  nombres: z.string().min(1, 'Requerido'),
  apellidos: z.string().min(1, 'Requerido'),
  licencia: z.string().min(1, 'Requerido'),
  categoriaLicencia: z.string().min(1, 'Requerido'),
  vencimientoLicencia: z.string().min(1, 'Requerido'),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  activo: z.boolean(),
});

type ConductorFormData = z.infer<typeof conductorSchema>;

interface ConductorFormProps {
  initialData?: Conductor;
  onSubmit: (data: ConductorFormData) => void | Promise<void>;
  onCancel: () => void;
}

const categorias = [
  'A-I',
  'A-II',
  'A-IIA',
  'A-IIB',
  'A-III',
  'A-IIIA',
  'A-IIIB',
  'B-I',
  'B-II',
  'B-IIC',
];

export function ConductorForm({ initialData, onSubmit, onCancel }: ConductorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConductorFormData>({
    resolver: zodResolver(conductorSchema),
    defaultValues: initialData || { activo: true },
  });

  const onSubmitHandler = async (data: ConductorFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      <Input label="DNI" {...register('dni')} error={errors.dni?.message} />
      <Input label="Nombres" {...register('nombres')} error={errors.nombres?.message} />
      <Input label="Apellidos" {...register('apellidos')} error={errors.apellidos?.message} />
      <Input label="Licencia" {...register('licencia')} error={errors.licencia?.message} />

      <Select
        label="Categoría Licencia"
        {...register('categoriaLicencia')}
        options={categorias.map((c) => ({ value: c, label: c }))}
        error={errors.categoriaLicencia?.message}
      />

      <Input
        type="date"
        label="Vencimiento Licencia"
        {...register('vencimientoLicencia')}
        error={errors.vencimientoLicencia?.message}
      />

      <Input label="Teléfono" {...register('telefono')} />
      <Input type="email" label="Email" {...register('email')} />

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
