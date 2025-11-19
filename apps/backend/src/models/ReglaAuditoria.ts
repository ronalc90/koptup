import mongoose, { Schema, Document } from 'mongoose';

export interface ICondicion {
  campo: string; // Ej: "valorDiferencia", "tieneAutorizacion", etc.
  operador: '>' | '<' | '=' | '!=' | '>=' | '<=' | 'contains' | 'exists' | 'not_exists';
  valor?: any;
}

export interface IAccionGlosa {
  codigoGlosa: string;
  tipo: 'Tarifa' | 'Soporte' | 'Pertinencia' | 'Duplicidad' | 'Autorización' | 'Facturación' | 'Otro';
  descripcion: string;
  calcularValor: 'diferencia' | 'total' | 'porcentaje' | 'fijo';
  valorFijo?: number;
  porcentaje?: number;
}

export interface IReglaAuditoria extends Document {
  nombre: string;
  descripcion: string;
  codigo: string; // Identificador único de la regla

  // Condiciones
  condiciones: ICondicion[];
  operadorLogico: 'AND' | 'OR'; // Cómo combinar las condiciones

  // Acción si se cumple
  accion: IAccionGlosa;

  // Prioridad
  prioridad: number; // Orden de ejecución (1 = primero)

  // Estado
  activa: boolean;
  categoria: string; // Para agrupar reglas

  // Metadata
  creadaPor?: string;
  ultimaModificacion?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const CondicionSchema = new Schema<ICondicion>({
  campo: { type: String, required: true },
  operador: {
    type: String,
    required: true,
    enum: ['>', '<', '=', '!=', '>=', '<=', 'contains', 'exists', 'not_exists'],
  },
  valor: Schema.Types.Mixed,
});

const AccionGlosaSchema = new Schema<IAccionGlosa>({
  codigoGlosa: { type: String, required: true },
  tipo: {
    type: String,
    required: true,
    enum: ['Tarifa', 'Soporte', 'Pertinencia', 'Duplicidad', 'Autorización', 'Facturación', 'Otro'],
  },
  descripcion: { type: String, required: true },
  calcularValor: {
    type: String,
    required: true,
    enum: ['diferencia', 'total', 'porcentaje', 'fijo'],
  },
  valorFijo: Number,
  porcentaje: Number,
});

const ReglaAuditoriaSchema = new Schema<IReglaAuditoria>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    condiciones: [CondicionSchema],
    operadorLogico: {
      type: String,
      required: true,
      enum: ['AND', 'OR'],
      default: 'AND',
    },
    accion: {
      type: AccionGlosaSchema,
      required: true,
    },
    prioridad: {
      type: Number,
      required: true,
      default: 100,
      index: true,
    },
    activa: {
      type: Boolean,
      default: true,
      index: true,
    },
    categoria: {
      type: String,
      required: true,
      index: true,
    },
    creadaPor: String,
    ultimaModificacion: Date,
  },
  {
    timestamps: true,
    collection: 'reglas_auditoria',
  }
);

// Índices compuestos
ReglaAuditoriaSchema.index({ activa: 1, prioridad: 1 });
ReglaAuditoriaSchema.index({ categoria: 1, activa: 1 });

export default mongoose.model<IReglaAuditoria>('ReglaAuditoria', ReglaAuditoriaSchema);
