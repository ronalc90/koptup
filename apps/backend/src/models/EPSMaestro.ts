import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo: EPSMaestro
 *
 * Catálogo maestro de EPS (Entidades Promotoras de Salud) en Colombia.
 * Contiene información detallada de todas las EPS del país.
 *
 * Fuentes de datos:
 * - Superintendencia Nacional de Salud
 * - Ministerio de Salud y Protección Social
 * - FOSYGA (Fondo de Solidaridad y Garantía)
 */

export interface IEPSMaestro extends Document {
  nit: string;
  codigoHabilitacion: string;
  razonSocial: string;
  nombreComercial: string;
  regimen: 'CONTRIBUTIVO' | 'SUBSIDIADO' | 'ESPECIAL' | 'EXCEPCION';
  tipoEPS: 'EPS' | 'EPS_S' | 'EPS_I' | 'EOC' | 'CCF';
  estado: 'ACTIVA' | 'SUSPENDIDA' | 'LIQUIDADA' | 'INTERVENIDA';
  contacto: {
    direccion: string;
    ciudad: string;
    departamento: string;
    telefono?: string;
    email?: string;
    sitioWeb?: string;
  };
  representanteLegal?: {
    nombres: string;
    tipoDocumento: string;
    numeroDocumento: string;
  };
  cobertura: {
    departamentos: string[];
    ciudades: string[];
    nacional: boolean;
  };
  afiliados?: {
    contributivo?: number;
    subsidiado?: number;
    total?: number;
    fechaCorte?: Date;
  };
  tarifarioPreferido?: 'ISS_2001' | 'ISS_2004' | 'SOAT' | 'PERSONALIZADO';
  factorGlobalTipico?: number;
  observaciones?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EPSMaestroSchema: Schema = new Schema(
  {
    nit: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    codigoHabilitacion: {
      type: String,
      unique: true,
      sparse: true,
    },
    razonSocial: {
      type: String,
      required: true,
      trim: true,
    },
    nombreComercial: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    regimen: {
      type: String,
      enum: ['CONTRIBUTIVO', 'SUBSIDIADO', 'ESPECIAL', 'EXCEPCION'],
      required: true,
      index: true,
    },
    tipoEPS: {
      type: String,
      enum: ['EPS', 'EPS_S', 'EPS_I', 'EOC', 'CCF'],
      required: true,
    },
    estado: {
      type: String,
      enum: ['ACTIVA', 'SUSPENDIDA', 'LIQUIDADA', 'INTERVENIDA'],
      default: 'ACTIVA',
      index: true,
    },
    contacto: {
      direccion: {
        type: String,
        required: true,
      },
      ciudad: {
        type: String,
        required: true,
      },
      departamento: {
        type: String,
        required: true,
      },
      telefono: String,
      email: {
        type: String,
        lowercase: true,
      },
      sitioWeb: String,
    },
    representanteLegal: {
      nombres: String,
      tipoDocumento: String,
      numeroDocumento: String,
    },
    cobertura: {
      departamentos: [String],
      ciudades: [String],
      nacional: {
        type: Boolean,
        default: false,
      },
    },
    afiliados: {
      contributivo: Number,
      subsidiado: Number,
      total: Number,
      fechaCorte: Date,
    },
    tarifarioPreferido: {
      type: String,
      enum: ['ISS_2001', 'ISS_2004', 'SOAT', 'PERSONALIZADO'],
      default: 'ISS_2004',
    },
    factorGlobalTipico: {
      type: Number,
      default: 1.0,
    },
    observaciones: String,
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índices de texto para búsqueda
EPSMaestroSchema.index({ razonSocial: 'text', nombreComercial: 'text' });

// Índices compuestos
EPSMaestroSchema.index({ regimen: 1, estado: 1, activo: 1 });
EPSMaestroSchema.index({ 'contacto.departamento': 1, 'contacto.ciudad': 1 });

/**
 * Método estático: Buscar EPS por NIT o nombre
 */
EPSMaestroSchema.statics.buscar = async function (termino: string) {
  return await this.find({
    $or: [
      { nit: new RegExp(termino, 'i') },
      { razonSocial: new RegExp(termino, 'i') },
      { nombreComercial: new RegExp(termino, 'i') },
    ],
    activo: true,
  }).limit(10);
};

/**
 * Método estático: Obtener EPS por departamento/ciudad
 */
EPSMaestroSchema.statics.obtenerPorCobertura = async function (departamento: string, ciudad?: string) {
  const query: any = {
    activo: true,
    estado: 'ACTIVA',
    $or: [
      { 'cobertura.nacional': true },
      { 'cobertura.departamentos': departamento },
    ],
  };

  if (ciudad) {
    query.$or.push({ 'cobertura.ciudades': ciudad });
  }

  return await this.find(query);
};

export default mongoose.model<IEPSMaestro>('EPSMaestro', EPSMaestroSchema);
