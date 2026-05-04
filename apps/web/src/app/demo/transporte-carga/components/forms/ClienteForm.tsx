'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cliente } from '../../store';
import { Input } from '../Input';
import { Select } from '../Select';
import toast from 'react-hot-toast';

const clienteSchema = z.object({
  tipoDoc: z.number(),
  numeroDoc: z.string().min(1, 'Requerido'),
  razonSocial: z.string().min(1, 'Requerido'),
  nombreComercial: z.string().optional(),
  dirección: z.string().min(1, 'Requerido'),
  ubigeo: z.string().min(1, 'Requerido'),
  telefono: z.string().min(1, 'Requerido'),
  email: z.string().email('Email inválido'),
  activo: z.boolean(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  initialData?: Cliente;
  onSubmit: (data: ClienteFormData) => void | Promise<void>;
  onCancel: () => void;
}

export function ClienteForm({ initialData, onSubmit, onCancel }: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData || { tipoDoc: 6, activo: true },
  });

  const tipoDoc = watch('tipoDoc');

  const onSubmitHandler = async (data: ClienteFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tipo Doc"
          {...register('tipoDoc')}
          options={[
            { value: 1, label: 'DNI' },
            { value: 6, label: 'RUC' },
          ]}
        />
        <Input
          label="Número Doc"
          {...register('numeroDoc')}
          error={errors.numeroDoc?.message}
          maxLength={tipoDoc === 6 ? 11 : 8}
        />
      </div>

      <Input
        label="Razón Social"
        {...register('razonSocial')}
        error={errors.razonSocial?.message}
      />

      <Input
        label="Nombre Comercial"
        {...register('nombreComercial')}
        error={errors.nombreComercial?.message}
      />

      <Input
        label="Dirección"
        {...register('dirección')}
        error={errors.dirección?.message}
      />

      <Input
        label="UBIGEO"
        {...register('ubigeo')}
        error={errors.ubigeo?.message}
        placeholder="150131"
      />

      <Input
        label="Teléfono"
        {...register('telefono')}
        error={errors.telefono?.message}
      />

      <Input
        type="email"
        label="Email"
        {...register('email')}
        error={errors.email?.message}
      />

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
