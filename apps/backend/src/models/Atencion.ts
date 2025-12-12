import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAtencion extends Document {
  facturaId: Types.ObjectId;
  numeroAtencion: string;
  numeroAutorizacion?: string;
  fechaAutorizacion?: Date;

  // Paciente (datos mínimos, sin info sensible completa)
  paciente: {
    tipoDocumento: string;
    numeroDocumento: string; // Hasheado o enmascarado en producción
    nombres?: string;
    apellidos?: string;
    edad?: number;
    sexo?: 'M' | 'F' | 'Otro';
  };

  // Diagnósticos
  diagnosticoPrincipal: {
    codigoCIE10: string;
    descripcion: string;
  };
  diagnosticosSecundarios?: Array<{
    codigoCIE10: string;
    descripcion: string;
  }>;

  // Fechas de atención
  fechaInicio: Date;
  fechaFin?: Date;

  // Ubicación
  ipsPrimaria?: string;

  // Financiero
  copago: number;
  cuotaModeradora: number;

  // Procedimientos
  procedimientos: Types.ObjectId[]; // Referencias a Procedimiento

  // Soportes
  soportes: Types.ObjectId[]; // Referencias a SoporteDocumental

  // Validaciones
  tieneAutorizacion: boolean;
  autorizacionValida: boolean;
  pertinenciaValidada: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const AtencionSchema = new Schema<IAtencion>(
  {
    facturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Factura',
      required: true,
      index: true,
    },
    numeroAtencion: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    numeroAutorizacion: {
      type: String,
      index: true,
      trim: true,
    },
    fechaAutorizacion: Date,
    paciente: {
      tipoDocumento: { type: String, required: true },
      numeroDocumento: { type: String, required: true, index: true },
      nombres: String,
      apellidos: String,
      edad: Number,
      sexo: {
        type: String,
        enum: ['M', 'F', 'Otro'],
      },
    },
    diagnosticoPrincipal: {
      codigoCIE10: { type: String, required: true },
      descripcion: { type: String, required: true },
    },
    diagnosticosSecundarios: [{
      codigoCIE10: { type: String, index: true },
      descripcion: String,
    }],
    fechaInicio: {
      type: Date,
      required: true,
      index: true,
    },
    fechaFin: Date,
    ipsPrimaria: String,
    copago: {
      type: Number,
      default: 0,
      min: 0,
    },
    cuotaModeradora: {
      type: Number,
      default: 0,
      min: 0,
    },
    procedimientos: [{
      type: Schema.Types.ObjectId,
      ref: 'Procedimiento',
    }],
    soportes: [{
      type: Schema.Types.ObjectId,
      ref: 'SoporteDocumental',
    }],
    tieneAutorizacion: {
      type: Boolean,
      default: false,
      index: true,
    },
    autorizacionValida: {
      type: Boolean,
      default: false,
    },
    pertinenciaValidada: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'atenciones',
  }
);

// Índices compuestos
AtencionSchema.index({ facturaId: 1, numeroAtencion: 1 }, { unique: true });
AtencionSchema.index({ numeroAutorizacion: 1, facturaId: 1 });
AtencionSchema.index({ 'diagnosticoPrincipal.codigoCIE10': 1 });

export default mongoose.model<IAtencion>('Atencion', AtencionSchema);
