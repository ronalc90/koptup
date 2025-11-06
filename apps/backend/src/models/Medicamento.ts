import mongoose, { Schema, Document } from 'mongoose';

export interface IMedicamento extends Document {
  codigoATC: string; // Código Anatómico Terapéutico Químico
  codigoCUM?: string; // Código Único de Medicamentos
  principioActivo: string;
  nombreComercial?: string;
  concentracion: string;
  formaFarmaceutica: string;
  viaAdministracion: string[];
  presentacion: string;
  precioUnitario: number;
  precioVenta?: number;
  laboratorio?: string;
  pos: boolean; // Si está en el Plan Obligatorio de Salud
  requiereFormula: boolean;
  controlEspecial: boolean;
  metadata?: {
    indicaciones?: string[];
    contraindicaciones?: string[];
    efectosSecundarios?: string[];
    dosis?: string;
  };
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicamentoSchema = new Schema<IMedicamento>(
  {
    codigoATC: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    codigoCUM: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    principioActivo: {
      type: String,
      required: true,
      index: 'text',
    },
    nombreComercial: {
      type: String,
      index: 'text',
    },
    concentracion: {
      type: String,
      required: true,
    },
    formaFarmaceutica: {
      type: String,
      required: true,
      enum: [
        'Tableta',
        'Cápsula',
        'Jarabe',
        'Suspensión',
        'Solución',
        'Inyectable',
        'Ampolla',
        'Crema',
        'Ungüento',
        'Gel',
        'Supositorio',
        'Gotas',
        'Parche',
        'Inhalador',
        'Otro',
      ],
    },
    viaAdministracion: {
      type: [String],
      required: true,
      enum: [
        'Oral',
        'Sublingual',
        'Intramuscular',
        'Intravenosa',
        'Subcutánea',
        'Tópica',
        'Rectal',
        'Vaginal',
        'Oftálmica',
        'Ótica',
        'Nasal',
        'Inhalatoria',
        'Transdérmica',
      ],
    },
    presentacion: {
      type: String,
      required: true,
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 0,
    },
    precioVenta: {
      type: Number,
      min: 0,
    },
    laboratorio: String,
    pos: {
      type: Boolean,
      default: true,
      index: true,
    },
    requiereFormula: {
      type: Boolean,
      default: true,
    },
    controlEspecial: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      indicaciones: [String],
      contraindicaciones: [String],
      efectosSecundarios: [String],
      dosis: String,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'medicamentos',
  }
);

// Índices compuestos
MedicamentoSchema.index({ pos: 1, activo: 1 });
MedicamentoSchema.index({ controlEspecial: 1, activo: 1 });

export default mongoose.model<IMedicamento>('Medicamento', MedicamentoSchema);
