import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterialInsumo extends Document {
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  unidadMedida: string;
  precioUnitario: number;
  proveedor?: string;
  marca?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialInsumoSchema = new Schema<IMaterialInsumo>(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      index: 'text',
    },
    descripcion: {
      type: String,
      required: true,
    },
    categoria: {
      type: String,
      required: true,
      enum: [
        'Material quirúrgico',
        'Material de curación',
        'Insumo médico',
        'Prótesis',
        'Órtesis',
        'Equipo médico',
        'Reactivos',
        'Otro',
      ],
      index: true,
    },
    unidadMedida: {
      type: String,
      required: true,
      enum: ['Unidad', 'Caja', 'Paquete', 'Frasco', 'Litro', 'Kilogramo', 'Metro', 'Par'],
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 0,
    },
    proveedor: String,
    marca: String,
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'materiales_insumos',
  }
);

// Índices compuestos
MaterialInsumoSchema.index({ categoria: 1, activo: 1 });

export default mongoose.model<IMaterialInsumo>('MaterialInsumo', MaterialInsumoSchema);
