'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '../Select';
import toast from 'react-hot-toast';
import { Vehiculo } from '../../types';

const vehiculoSchema = z.object({
  placa: z.string().regex(/^[A-Z]{3}-?\d{3}$/),
  configuracion: z.string(),
  anio: z.number().min(1990).max(2030),
  capacidadKg: z.number().positive(),
  vencimientoSOAT: z.string(),
  vencimientoRevision: z.string(),
  certificadoMTC: z.string().optional(),
  activo: z.boolean().default(true),
});

type VehiculoFormData = z.infer<typeof vehiculoSchema>;

interface VehiculoFormProps {
  initialData?: Vehiculo;
  onSubmit: (data: Vehiculo) => Promise<void>;
  onCancel: () => void;
}

const CONFIGURACIONES = ['C2', 'C3', 'C4', 'T2S2', 'T2S3', 'T3S2', 'T3S3', 'C2RB1', 'C3RB1'];

export default function VehiculoForm({ initialData, onSubmit, onCancel }: VehiculoFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VehiculoFormData>({
    resolver: zodResolver(vehiculoSchema),
    defaultValues: {
      placa: initialData?.placa || '',
      configuracion: initialData?.configuracion || 'C2',
      anio: initialData?.anio || new Date().getFullYear(),
      capacidadKg: initialData?.capacidadKg || 0,
      vencimientoSOAT: initialData?.vencimientoSOAT || '',
      vencimientoRevision: initialData?.vencimientoRevision || '',
      certificadoMTC: initialData?.certificadoMTC || '',
      activo: initialData?.activo !== false,
    },
  });

  const onFormSubmit = async (data: VehiculoFormData) => {
    try {
      await onSubmit({
        id: initialData?.id || '',
        ...data,
      });
    } catch (error) {
      toast.error('Error al guardar vehículo');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Placa */}
      <div>
        <label className="block text-sm font-medium mb-2">Placa</label>
        <Controller
          name="placa"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="ABC-123"
              maxLength={7}
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              error={errors.placa?.message}
            />
          )}
        />
      </div>

      {/* Configuración y Año */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Configuración</label>
          <Controller
            name="configuracion"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={CONFIGURACIONES.map((conf) => ({ value: conf, label: conf }))}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Año</label>
          <Controller
            name="anio"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                min="1990"
                max="2030"
                error={errors.anio?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Capacidad */}
      <div>
        <label className="block text-sm font-medium mb-2">Capacidad (kg)</label>
        <Controller
          name="capacidadKg"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="number"
              placeholder="5000"
              error={errors.capacidadKg?.message}
            />
          )}
        />
      </div>

      {/* Vencimientos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Vencimiento SOAT</label>
          <Controller
            name="vencimientoSOAT"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                error={errors.vencimientoSOAT?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Vencimiento Revisión</label>
          <Controller
            name="vencimientoRevision"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                error={errors.vencimientoRevision?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Certificado MTC */}
      <div>
        <label className="block text-sm font-medium mb-2">Certificado MTC (Opcional)</label>
        <Controller
          name="certificadoMTC"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Número de certificado"
            />
          )}
        />
      </div>

      {/* Activo */}
      <div>
        <Controller
          name="activo"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Activo</span>
            </label>
          )}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {initialData ? 'Actualizar' : 'Crear'}
        </Button>
        <Button type="button" onClick={onCancel} variant="secondary" className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
