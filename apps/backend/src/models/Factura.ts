import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFactura extends Document {
  numeroFactura: string;
  fechaEmision: Date;
  fechaRadicacion?: Date;

  // Entidades
  ips: {
    nit: string;
    nombre: string;
    codigo?: string;
  };
  eps: {
    nit: string;
    nombre: string;
    codigo?: string;
  };

  // Contrato
  numeroContrato?: string;
  convenio?: string;
  regimen: 'Contributivo' | 'Subsidiado' | 'Particular' | 'Otro';

  // Valores
  valorBruto: number;
  iva: number;
  valorTotal: number;

  // Estado
  estado: 'Radicada' | 'En Auditoría' | 'Auditada' | 'Glosada' | 'Aceptada' | 'Pagada' | 'Rechazada';
  estadoDetalle?: string;

  // Referencias
  atenciones: Types.ObjectId[]; // Referencias a Atención
  tarifarioId?: Types.ObjectId; // Tarifario a usar para auditoría

  // Auditoría
  auditoriaCompletada: boolean;
  fechaAuditoria?: Date;
  auditorId?: string;

  // Glosas totales
  totalGlosas: number;
  valorAceptado: number;

  // Metadata
  observaciones?: string;
  archivoOriginal?: {
    filename: string;
    path: string;
    uploadedAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

const FacturaSchema = new Schema<IFactura>(
  {
    numeroFactura: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    fechaEmision: {
      type: Date,
      required: true,
      index: true,
    },
    fechaRadicacion: {
      type: Date,
      index: true,
    },
    ips: {
      nit: { type: String, required: true, index: true },
      nombre: { type: String, required: true },
      codigo: String,
    },
    eps: {
      nit: { type: String, required: true, index: true },
      nombre: { type: String, required: true },
      codigo: String,
    },
    numeroContrato: {
      type: String,
      index: true,
    },
    convenio: String,
    regimen: {
      type: String,
      required: true,
      enum: ['Contributivo', 'Subsidiado', 'Particular', 'Otro'],
      index: true,
    },
    valorBruto: {
      type: Number,
      required: true,
      min: 0,
    },
    iva: {
      type: Number,
      default: 0,
      min: 0,
    },
    valorTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    estado: {
      type: String,
      required: true,
      enum: ['Radicada', 'En Auditoría', 'Auditada', 'Glosada', 'Aceptada', 'Pagada', 'Rechazada'],
      default: 'Radicada',
      index: true,
    },
    estadoDetalle: String,
    atenciones: [{
      type: Schema.Types.ObjectId,
      ref: 'Atencion',
    }],
    tarifarioId: {
      type: Schema.Types.ObjectId,
      ref: 'Tarifario',
      index: true,
    },
    auditoriaCompletada: {
      type: Boolean,
      default: false,
      index: true,
    },
    fechaAuditoria: Date,
    auditorId: {
      type: String,
      index: true,
    },
    totalGlosas: {
      type: Number,
      default: 0,
      min: 0,
    },
    valorAceptado: {
      type: Number,
      default: 0,
      min: 0,
    },
    observaciones: String,
    archivoOriginal: {
      filename: String,
      path: String,
      uploadedAt: Date,
    },
  },
  {
    timestamps: true,
    collection: 'facturas',
  }
);

// Índices compuestos
FacturaSchema.index({ estado: 1, fechaEmision: -1 });
FacturaSchema.index({ 'eps.nit': 1, estado: 1 });
FacturaSchema.index({ 'ips.nit': 1, fechaEmision: -1 });
FacturaSchema.index({ auditoriaCompletada: 1, fechaEmision: -1 });

export default mongoose.model<IFactura>('Factura', FacturaSchema);
