'use client';

import React, { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cliente, Conductor, Vehiculo } from '../../store';
import { Input } from '../Input';
import { Select } from '../Select';
import toast from 'react-hot-toast';

const ordenSchema = z.object({
  numero: z.string().min(1, 'Requerido'),
  clienteId: z.string().min(1, 'Requerido'),
  conductorId: z.string().min(1, 'Requerido'),
  vehiculoId: z.string().min(1, 'Requerido'),
  modalidadTransporte: z.string().min(1, 'Requerido'),
  origenDir: z.string().min(1, 'Requerido'),
  origenUbigeo: z.string().min(1, 'Requerido'),
  destinoDir: z.string().min(1, 'Requerido'),
  destinoUbigeo: z.string().min(1, 'Requerido'),
  fechaInicioTraslado: z.string().min(1, 'Requerido'),
  pesoTotal: z.number().positive('Debe ser mayor a 0'),
  bultos: z.number().positive('Debe ser mayor a 0'),
  descripcionMercancia: z.string().min(1, 'Requerido'),
  flete: z.number().positive('Debe ser mayor a 0'),
});

type OrdenFormData = z.infer<typeof ordenSchema>;

interface OrdenFormProps {
  clientes: Cliente[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  onSubmit: (data: any) => void | Promise<void>;
  onCancel: () => void;
}

export function OrdenForm({
  clientes,
  conductores,
  vehiculos,
  onSubmit,
  onCancel,
}: OrdenFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OrdenFormData>({
    resolver: zodResolver(ordenSchema),
    defaultValues: { modalidadTransporte: '01' },
  });

  const flete = useWatch({ control, name: 'flete' });
  const igv = useMemo(() => (flete || 0) * 0.18, [flete]);

  const onSubmitHandler = async (data: OrdenFormData) => {
    try {
      const orden = {
        ...data,
        origen: { direccion: data.origenDir, ubigeo: data.origenUbigeo },
        destino: { direccion: data.destinoDir, ubigeo: data.destinoUbigeo },
        igv,
        total: (data.flete || 0) + igv,
      };
      delete orden.origenDir;
      delete orden.origenUbigeo;
      delete orden.destinoDir;
      delete orden.destinoUbigeo;
      await onSubmit(orden);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const activeClientes = clientes.filter((c) => c.activo);
  const activeConductores = conductores.filter((c) => c.activo);
  const activeVehiculos = vehiculos.filter((v) => v.activo);

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      <Input label="Número Orden" {...register('numero')} error={errors.numero?.message} />

      <Select
        label="Cliente"
        {...register('clienteId')}
        options={activeClientes.map((c) => ({ value: c.id, label: c.razonSocial }))}
        error={errors.clienteId?.message}
      />

      <Select
        label="Conductor"
        {...register('conductorId')}
        options={activeConductores.map((c) => ({ value: c.id, label: `${c.nombres} ${c.apellidos}` }))}
        error={errors.conductorId?.message}
      />

      <Select
        label="Vehículo"
        {...register('vehiculoId')}
        options={activeVehiculos.map((v) => ({ value: v.id, label: v.placa }))}
        error={errors.vehiculoId?.message}
      />

      <Select
        label="Modalidad Transporte"
        {...register('modalidadTransporte')}
        options={[
          { value: '01', label: 'Público' },
          { value: '02', label: 'Privado' },
        ]}
      />

      <Input label="Origen" {...register('origenDir')} error={errors.origenDir?.message} />
      <Input label="Origen UBIGEO" {...register('origenUbigeo')} error={errors.origenUbigeo?.message} placeholder="150131" />

      <Input label="Destino" {...register('destinoDir')} error={errors.destinoDir?.message} />
      <Input label="Destino UBIGEO" {...register('destinoUbigeo')} error={errors.destinoUbigeo?.message} placeholder="080131" />

      <Input type="date" label="Fecha Inicio Traslado" {...register('fechaInicioTraslado')} error={errors.fechaInicioTraslado?.message} />

      <Input type="number" label="Peso Total (kg)" {...register('pesoTotal', { valueAsNumber: true })} error={errors.pesoTotal?.message} />
      <Input type="number" label="Bultos" {...register('bultos', { valueAsNumber: true })} error={errors.bultos?.message} />
      <Input label="Descripción Mercancía" {...register('descripcionMercancia')} error={errors.descripcionMercancia?.message} />
      <Input type="number" label="Flete (S/)" {...register('flete', { valueAsNumber: true })} error={errors.flete?.message} />

      <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded">
        <div className="flex justify-between text-sm">
          <span>IGV (18%)</span>
          <span>S/ {igv.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200 dark:border-slate-600">
          <span>Total</span>
          <span>S/ {((flete || 0) + igv).toFixed(2)}</span>
        </div>
      </div>

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
