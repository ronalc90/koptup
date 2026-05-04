'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Cliente } from '../../types';

const clienteSchema = z.object({
  tipoDoc: z.enum(['1', '6']),
  numeroDoc: z.string().min(8).max(11),
  razonSocial: z.string().min(3),
  nombreComercial: z.string().optional(),
  direccion: z.string().min(5),
  ubigeo: z.string().regex(/^\d{6}$/),
  telefono: z.string().regex(/^\d{9}$/),
  email: z.string().email(),
  activo: z.boolean().default(true),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  initialData?: Cliente;
  onSubmit: (data: Cliente) => Promise<void>;
  onCancel: () => void;
}

export default function ClienteForm({ initialData, onSubmit, onCancel }: ClienteFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipoDoc: initialData?.tipoDoc || '6',
      numeroDoc: initialData?.numeroDoc || '',
      razonSocial: initialData?.razonSocial || '',
      nombreComercial: initialData?.nombreComercial || '',
      direccion: initialData?.direccion || '',
      ubigeo: initialData?.ubigeo || '',
      telefono: initialData?.telefono || '',
      email: initialData?.email || '',
      activo: initialData?.activo !== false,
    },
  });

  const tipoDoc = watch('tipoDoc');
  const maxLength = tipoDoc === '1' ? 8 : 11;

  const onFormSubmit = async (data: ClienteFormData) => {
    try {
      await onSubmit({
        id: initialData?.id || '',
        ...data,
      });
    } catch (error) {
      toast.error('Error al guardar cliente');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Tipo Documento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <Controller
                name="tipoDoc"
                control={control}
                render={({ field }) => (
                  <input
                    type="radio"
                    value="1"
                    checked={field.value === '1'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-4 h-4"
                  />
                )}
              />
              <span className="ml-2 text-sm">DNI</span>
            </label>
            <label className="flex items-center">
              <Controller
                name="tipoDoc"
                control={control}
                render={({ field }) => (
                  <input
                    type="radio"
                    value="6"
                    checked={field.value === '6'}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-4 h-4"
                  />
                )}
              />
              <span className="ml-2 text-sm">RUC</span>
            </label>
          </div>
        </div>

        {/* Número Documento */}
        <div>
          <label className="block text-sm font-medium mb-2">Número</label>
          <Controller
            name="numeroDoc"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                maxLength={maxLength}
                placeholder={tipoDoc === '1' ? '12345678' : '12345678901'}
                error={errors.numeroDoc?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Razón Social */}
      <div>
        <label className="block text-sm font-medium mb-2">Razón Social</label>
        <Controller
          name="razonSocial"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Nombre empresa o persona"
              error={errors.razonSocial?.message}
            />
          )}
        />
      </div>

      {/* Nombre Comercial */}
      <div>
        <label className="block text-sm font-medium mb-2">Nombre Comercial (Opcional)</label>
        <Controller
          name="nombreComercial"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="Nombre comercial"
            />
          )}
        />
      </div>

      {/* Dirección y UBIGEO */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-2">Dirección</label>
          <Controller
            name="direccion"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Calle, número, distrito"
                error={errors.direccion?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">UBIGEO</label>
          <Controller
            name="ubigeo"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="150000"
                maxLength={6}
                error={errors.ubigeo?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Teléfono y Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Teléfono</label>
          <Controller
            name="telefono"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="987654321"
                maxLength={9}
                error={errors.telefono?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                placeholder="contacto@empresa.com"
                error={errors.email?.message}
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
