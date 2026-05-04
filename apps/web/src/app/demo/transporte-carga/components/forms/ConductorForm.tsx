'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '../Select';
import toast from 'react-hot-toast';
import { Conductor } from '../../types';

const conductorSchema = z.object({
  dni: z.string().regex(/^\d{8}$/),
  nombres: z.string().min(3),
  apellidos: z.string().min(3),
  licencia: z.string().min(6),
  categoriaLicencia: z.string(),
  vencimientoLicencia: z.string(),
  telefono: z.string().regex(/^\d{9}$/).optional(),
  email: z.string().email().optional(),
  activo: z.boolean().default(true),
});

type ConductorFormData = z.infer<typeof conductorSchema>;

interface ConductorFormProps {
  initialData?: Conductor;
  onSubmit: (data: Conductor) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIAS = [
  'A-I',
  'A-IIa',
  'A-IIb',
  'A-IIIa',
  'A-IIIb',
  'A-IIIc',
  'B-I',
  'B-II',
  'B-IIa',
  'B-IIb',
  'B-IIc',
];

export default function ConductorForm({ initialData, onSubmit, onCancel }: ConductorFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConductorFormData>({
    resolver: zodResolver(conductorSchema),
    defaultValues: {
      dni: initialData?.dni || '',
      nombres: initialData?.nombres || '',
      apellidos: initialData?.apellidos || '',
      licencia: initialData?.licencia || '',
      categoriaLicencia: initialData?.categoriaLicencia || 'B-I',
      vencimientoLicencia: initialData?.vencimientoLicencia || '',
      telefono: initialData?.telefono || '',
      email: initialData?.email || '',
      activo: initialData?.activo !== false,
    },
  });

  const onFormSubmit = async (data: ConductorFormData) => {
    try {
      await onSubmit({
        id: initialData?.id || '',
        ...data,
      });
    } catch (error) {
      toast.error('Error al guardar conductor');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* DNI y Nombres */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">DNI</label>
          <Controller
            name="dni"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="12345678"
                maxLength={8}
                error={errors.dni?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Nombres</label>
          <Controller
            name="nombres"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Juan"
                error={errors.nombres?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Apellidos */}
      <div>
        <label className="block text-sm font-medium mb-2">Apellidos</label>
        <Controller
          name="apellidos"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Pérez García"
              error={errors.apellidos?.message}
            />
          )}
        />
      </div>

      {/* Licencia */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Número Licencia</label>
          <Controller
            name="licencia"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="000123456"
                error={errors.licencia?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Categoría</label>
          <Controller
            name="categoriaLicencia"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={CATEGORIAS.map((cat) => ({ value: cat, label: cat }))}
              />
            )}
          />
        </div>
      </div>

      {/* Vencimiento */}
      <div>
        <label className="block text-sm font-medium mb-2">Vencimiento de Licencia</label>
        <Controller
          name="vencimientoLicencia"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              error={errors.vencimientoLicencia?.message}
            />
          )}
        />
      </div>

      {/* Teléfono y Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Teléfono (Opcional)</label>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="987654321"
                maxLength={9}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email (Opcional)</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                placeholder="juan@example.com"
              />
            )}
          />
        </div>
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
