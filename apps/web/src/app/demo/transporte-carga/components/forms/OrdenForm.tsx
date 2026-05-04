'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '../Select';
import Textarea from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import type { OrdenServicio as Orden, Cliente, Conductor, Vehiculo } from '../../types';

const ordenSchema = z.object({
  numero: z.string().min(1),
  clienteId: z.string().min(1),
  conductorId: z.string().min(1),
  vehiculoId: z.string().min(1),
  modalidadTransporte: z.enum(['01', '02']),
  origenDir: z.string().min(5),
  origenUbigeo: z.string().regex(/^\d{6}$/),
  destinoDir: z.string().min(5),
  destinoUbigeo: z.string().regex(/^\d{6}$/),
  fechaInicioTraslado: z.string().optional(),
  pesoTotal: z.number().positive(),
  bultos: z.number().positive(),
  descripcionMercancia: z.string().min(5),
  flete: z.number().positive(),
});

type OrdenFormData = z.infer<typeof ordenSchema>;

interface OrdenFormProps {
  initialData?: Orden;
  clientes: Cliente[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  onSubmit: (data: Orden) => Promise<void>;
  onCancel: () => void;
}

export default function OrdenForm({
  initialData,
  clientes,
  conductores,
  vehiculos,
  onSubmit,
  onCancel,
}: OrdenFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrdenFormData>({
    resolver: zodResolver(ordenSchema),
    defaultValues: {
      numero: initialData?.numero || '',
      clienteId: initialData?.clienteId || '',
      conductorId: initialData?.conductorId || '',
      vehiculoId: initialData?.vehiculoId || '',
      modalidadTransporte: initialData?.modalidadTransporte || '02',
      origenDir: initialData?.origen?.direccion || '',
      origenUbigeo: initialData?.origen?.ubigeo || '',
      destinoDir: initialData?.destino?.direccion || '',
      destinoUbigeo: initialData?.destino?.ubigeo || '',
      fechaInicioTraslado: initialData?.fechaInicioTraslado || '',
      pesoTotal: initialData?.pesoTotalKg || 0,
      bultos: initialData?.bultos || 0,
      descripcionMercancia: initialData?.descripcionMercancia || '',
      flete: initialData?.flete || 0,
    },
  });

  const flete = useWatch({ control, name: 'flete' });
  const igv = flete * 0.18;
  const total = flete + igv;

  const activeClientes = clientes.filter((c) => c.activo);
  const activeConductores = conductores.filter((c) => c.activo);
  const activeVehiculos = vehiculos.filter((v) => v.activo);

  const onFormSubmit = async (data: OrdenFormData) => {
    try {
      // Mapear campos planos a estructura anidada esperada por la API
      const payload = {
        id: initialData?.id || '',
        numero: data.numero,
        clienteId: data.clienteId,
        conductorId: data.conductorId,
        vehiculoId: data.vehiculoId,
        origen: { direccion: data.origenDir, ubigeo: data.origenUbigeo },
        destino: { direccion: data.destinoDir, ubigeo: data.destinoUbigeo },
        fechaInicioTraslado: data.fechaInicioTraslado || new Date().toISOString(),
        pesoTotalKg: data.pesoTotal,
        bultos: data.bultos,
        descripcionMercancia: data.descripcionMercancia,
        modalidadTransporte: data.modalidadTransporte,
        flete: data.flete,
        igv,
        total,
        estado: initialData?.estado || 'borrador',
        fecha: initialData?.fecha || new Date().toISOString(),
        observaciones: initialData?.observaciones,
      };
      await onSubmit(payload as Orden);
    } catch (error) {
      toast.error('Error al guardar orden');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-h-96 overflow-y-auto">
      {/* Número */}
      <div>
        <label className="block text-sm font-medium mb-2">Número de Orden</label>
        <Controller
          name="numero"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              placeholder="ORD-2024-001"
              error={errors.numero?.message}
            />
          )}
        />
      </div>

      {/* Cliente, Conductor, Vehículo */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Cliente</label>
          <Controller
            name="clienteId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={activeClientes.map((c) => ({ value: c.id, label: c.razonSocial }))}
                error={errors.clienteId?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Conductor</label>
          <Controller
            name="conductorId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={activeConductores.map((c) => ({
                  value: c.id,
                  label: `${c.nombres} ${c.apellidos}`,
                }))}
                error={errors.conductorId?.message}
              />
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Vehículo</label>
          <Controller
            name="vehiculoId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={activeVehiculos.map((v) => ({ value: v.id, label: v.placa }))}
                error={errors.vehiculoId?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Modalidad */}
      <div>
        <label className="block text-sm font-medium mb-2">Modalidad de Transporte</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <Controller
              name="modalidadTransporte"
              control={control}
              render={({ field }) => (
                <input
                  type="radio"
                  value="01"
                  checked={field.value === '01'}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-4 h-4"
                />
              )}
            />
            <span className="ml-2 text-sm">Público</span>
          </label>
          <label className="flex items-center">
            <Controller
              name="modalidadTransporte"
              control={control}
              render={({ field }) => (
                <input
                  type="radio"
                  value="02"
                  checked={field.value === '02'}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="w-4 h-4"
                />
              )}
            />
            <span className="ml-2 text-sm">Privado</span>
          </label>
        </div>
      </div>

      {/* Origen */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-3">Origen</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Dirección</label>
            <Controller
              name="origenDir"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Calle y número"
                  error={errors.origenDir?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">UBIGEO</label>
            <Controller
              name="origenUbigeo"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="150000"
                  maxLength={6}
                  error={errors.origenUbigeo?.message}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Destino */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-3">Destino</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Dirección</label>
            <Controller
              name="destinoDir"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Calle y número"
                  error={errors.destinoDir?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">UBIGEO</label>
            <Controller
              name="destinoUbigeo"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="150000"
                  maxLength={6}
                  error={errors.destinoUbigeo?.message}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Fecha Inicio Traslado */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium mb-2">Fecha Inicio Traslado (Opcional)</label>
        <Controller
          name="fechaInicioTraslado"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="datetime-local"
              error={errors.fechaInicioTraslado?.message}
            />
          )}
        />
      </div>

      {/* Mercancía */}
      <div className="border-t pt-4">
        <h4 className="font-semibold text-sm mb-3">Mercancía</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Peso (kg)</label>
            <Controller
              name="pesoTotal"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  placeholder="1000"
                  error={errors.pesoTotal?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bultos</label>
            <Controller
              name="bultos"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  placeholder="10"
                  error={errors.bultos?.message}
                />
              )}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Descripción</label>
          <Controller
            name="descripcionMercancia"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Descripción de la mercancía"
                rows={2}
                error={errors.descripcionMercancia?.message}
              />
            )}
          />
        </div>
      </div>

      {/* Flete y Totales */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Flete (S/)</label>
            <Controller
              name="flete"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  placeholder="0.00"
                  error={errors.flete?.message}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">IGV (18%)</label>
            <Input
              value={igv.toFixed(2)}
              readOnly
              className="bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Total (S/)</label>
            <Input
              value={total.toFixed(2)}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
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
