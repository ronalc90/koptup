import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDatoExtraido {
  campo: string;
  valor: string;
  origen: string;
  ubicacion: string;
  explicacion: string;
}

export interface IResultadoPaso {
  label: string;
  valor: string;
  tipo?: 'exito' | 'advertencia' | 'error';
}

export interface IPasoDetalle {
  numero: number;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en-proceso' | 'completado' | 'error';
  datosUsados: string[];
  datosExtraidos?: IDatoExtraido[];
  procesoDetallado?: string[];
  resultados?: IResultadoPaso[];
  duracion?: number; // en milisegundos
  inicioTimestamp?: Date;
  finTimestamp?: Date;
  error?: string;
}

export interface IAuditoriaSesion extends Document {
  _id: Types.ObjectId;
  facturaId: Types.ObjectId;
  pasoActual: number;
  totalPasos: number;
  estado: 'iniciada' | 'en-progreso' | 'completada' | 'error';
  pasos: IPasoDetalle[];
  resultadoFinal?: {
    totalGlosas: number;
    valorFacturaOriginal: number;
    valorAceptado: number;
    cantidadGlosas: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DatoExtraidoSchema = new Schema<IDatoExtraido>({
  campo: { type: String, required: true },
  valor: { type: String, required: true },
  origen: { type: String, required: true },
  ubicacion: { type: String, required: true },
  explicacion: { type: String, required: true },
});

const ResultadoPasoSchema = new Schema<IResultadoPaso>({
  label: { type: String, required: true },
  valor: { type: String, required: true },
  tipo: { type: String, enum: ['exito', 'advertencia', 'error'] },
});

const PasoDetalleSchema = new Schema<IPasoDetalle>({
  numero: { type: Number, required: true },
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  estado: {
    type: String,
    enum: ['pendiente', 'en-proceso', 'completado', 'error'],
    default: 'pendiente'
  },
  datosUsados: [{ type: String }],
  datosExtraidos: [DatoExtraidoSchema],
  procesoDetallado: [{ type: String }],
  resultados: [ResultadoPasoSchema],
  duracion: { type: Number },
  inicioTimestamp: { type: Date },
  finTimestamp: { type: Date },
  error: { type: String },
});

const AuditoriaSesionSchema = new Schema<IAuditoriaSesion>(
  {
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
      required: true
    },
    pasoActual: {
      type: Number,
      default: 0
    },
    totalPasos: {
      type: Number,
      default: 6
    },
    estado: {
      type: String,
      enum: ['iniciada', 'en-progreso', 'completada', 'error'],
      default: 'iniciada'
    },
    pasos: [PasoDetalleSchema],
    resultadoFinal: {
      totalGlosas: { type: Number },
      valorFacturaOriginal: { type: Number },
      valorAceptado: { type: Number },
      cantidadGlosas: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Índices
AuditoriaSesionSchema.index({ facturaId: 1, createdAt: -1 });

const AuditoriaSesion = mongoose.model<IAuditoriaSesion>('AuditoriaSesion', AuditoriaSesionSchema);

export default AuditoriaSesion;
