import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProcedimiento extends Document {
  atencionId: Types.ObjectId;
  facturaId: Types.ObjectId;

  // Código del procedimiento
  codigoCUPS: string;
  descripcion: string;
  tipoManual: 'ISS' | 'CUPS' | 'SOAT' | 'Otro';

  // Cantidades
  cantidad: number;

  // Valores
  valorUnitarioIPS: number; // Lo que cobra la IPS
  valorTotalIPS: number; // cantidad * valorUnitarioIPS
  valorUnitarioContrato: number; // Lo que está en el contrato/tarifario
  valorTotalContrato: number; // cantidad * valorUnitarioContrato
  valorAPagar: number; // Valor final después de glosas

  // Diferencias
  diferenciaTarifa: number; // valorTotalIPS - valorTotalContrato

  // Glosas
  glosas: Types.ObjectId[]; // Referencias a Glosa
  totalGlosas: number;
  glosaAdmitida: boolean;

  // Liquidación
  tipoLiquidacion?: string;
  factorLiquidacion?: number;

  // Validaciones
  tarifaValidada: boolean;
  pertinenciaValidada: boolean;
  duplicado: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ProcedimientoSchema = new Schema<IProcedimiento>(
  {
    atencionId: {
      type: Schema.Types.ObjectId,
      ref: 'Atencion',
      required: true,
      index: true,
    },
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
      required: true,
      index: true,
    },
    codigoCUPS: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    tipoManual: {
      type: String,
      required: true,
      enum: ['ISS', 'CUPS', 'SOAT', 'Otro'],
      default: 'CUPS',
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    valorUnitarioIPS: {
      type: Number,
      required: true,
      min: 0,
    },
    valorTotalIPS: {
      type: Number,
      required: true,
      min: 0,
    },
    valorUnitarioContrato: {
      type: Number,
      default: 0,
      min: 0,
    },
    valorTotalContrato: {
      type: Number,
      default: 0,
      min: 0,
    },
    valorAPagar: {
      type: Number,
      default: 0,
      min: 0,
    },
    diferenciaTarifa: {
      type: Number,
      default: 0,
    },
    glosas: [{
      type: Schema.Types.ObjectId,
      ref: 'Glosa',
    }],
    totalGlosas: {
      type: Number,
      default: 0,
      min: 0,
    },
    glosaAdmitida: {
      type: Boolean,
      default: false,
    },
    tipoLiquidacion: String,
    factorLiquidacion: Number,
    tarifaValidada: {
      type: Boolean,
      default: false,
      index: true,
    },
    pertinenciaValidada: {
      type: Boolean,
      default: false,
      index: true,
    },
    duplicado: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'procedimientos',
  }
);

// Índices compuestos
ProcedimientoSchema.index({ facturaId: 1, codigoCUPS: 1 });
ProcedimientoSchema.index({ atencionId: 1, codigoCUPS: 1 });
ProcedimientoSchema.index({ duplicado: 1, facturaId: 1 });

// Middleware para calcular valorTotalIPS automáticamente
ProcedimientoSchema.pre('save', function (next) {
  this.valorTotalIPS = this.cantidad * this.valorUnitarioIPS;
  this.valorTotalContrato = this.cantidad * this.valorUnitarioContrato;
  this.diferenciaTarifa = this.valorTotalIPS - this.valorTotalContrato;
  this.valorAPagar = this.valorTotalIPS - this.totalGlosas;
  next();
});

export default mongoose.model<IProcedimiento>('Procedimiento', ProcedimientoSchema);
