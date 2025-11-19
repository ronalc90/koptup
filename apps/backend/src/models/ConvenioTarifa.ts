import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo: ConvenioTarifa
 *
 * Almacena los convenios y tarifas pactadas entre IPS y EPS.
 * Cada convenio tiene tarifas específicas por código CUPS.
 *
 * Ejemplo de uso:
 * - Hospital San José tiene convenio con NUEVA EPS
 * - NUEVA EPS paga ISS 2004 + 10% para consultas
 * - NUEVA EPS paga ISS 2004 - 5% para procedimientos
 */

export interface IConvenioTarifa extends Document {
  nombre: string;
  epsNit: string;
  epsNombre: string;
  ipsNit?: string;
  ipsNombre?: string;
  tipoConvenio: 'POS' | 'NO_POS' | 'SOAT' | 'PARTICULAR' | 'EVENTOS_CATASTROFICOS';
  tipoTarifario: 'ISS_2001' | 'ISS_2004' | 'SOAT' | 'PERSONALIZADO';
  factorGlobal?: number; // Ej: 1.10 = ISS + 10%
  vigenciaInicio: Date;
  vigenciaFin: Date;
  tarifasPorCUPS: {
    codigoCUPS: string;
    valorPactado: number;
    factorMultiplicador?: number;
    observaciones?: string;
  }[];
  reglasEspeciales: {
    categoria?: string; // Ej: "Consulta", "Cirugía"
    especialidad?: string;
    factorMultiplicador: number;
    observaciones?: string;
  }[];
  cuotaModeradoras: {
    regimen: 'CONTRIBUTIVO' | 'SUBSIDIADO';
    categoria: 'A' | 'B' | 'C';
    tipoServicio: 'CONSULTA' | 'PROCEDIMIENTO' | 'HOSPITALIZACION' | 'URGENCIAS';
    valor: number;
  }[];
  copagos: {
    regimen: 'CONTRIBUTIVO' | 'SUBSIDIADO';
    categoria: 'A' | 'B' | 'C';
    porcentaje: number; // Ej: 20 para 20%
    valorMaximo?: number;
  }[];
  activo: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConvenioTarifaSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    epsNit: {
      type: String,
      required: true,
      index: true,
    },
    epsNombre: {
      type: String,
      required: true,
    },
    ipsNit: {
      type: String,
      index: true,
    },
    ipsNombre: {
      type: String,
    },
    tipoConvenio: {
      type: String,
      enum: ['POS', 'NO_POS', 'SOAT', 'PARTICULAR', 'EVENTOS_CATASTROFICOS'],
      required: true,
    },
    tipoTarifario: {
      type: String,
      enum: ['ISS_2001', 'ISS_2004', 'SOAT', 'PERSONALIZADO'],
      required: true,
    },
    factorGlobal: {
      type: Number,
      default: 1.0,
    },
    vigenciaInicio: {
      type: Date,
      required: true,
    },
    vigenciaFin: {
      type: Date,
      required: true,
    },
    tarifasPorCUPS: [
      {
        codigoCUPS: {
          type: String,
          required: true,
        },
        valorPactado: {
          type: Number,
          required: true,
        },
        factorMultiplicador: {
          type: Number,
        },
        observaciones: String,
      },
    ],
    reglasEspeciales: [
      {
        categoria: String,
        especialidad: String,
        factorMultiplicador: {
          type: Number,
          required: true,
        },
        observaciones: String,
      },
    ],
    cuotaModeradoras: [
      {
        regimen: {
          type: String,
          enum: ['CONTRIBUTIVO', 'SUBSIDIADO'],
          required: true,
        },
        categoria: {
          type: String,
          enum: ['A', 'B', 'C'],
          required: true,
        },
        tipoServicio: {
          type: String,
          enum: ['CONSULTA', 'PROCEDIMIENTO', 'HOSPITALIZACION', 'URGENCIAS'],
          required: true,
        },
        valor: {
          type: Number,
          required: true,
        },
      },
    ],
    copagos: [
      {
        regimen: {
          type: String,
          enum: ['CONTRIBUTIVO', 'SUBSIDIADO'],
          required: true,
        },
        categoria: {
          type: String,
          enum: ['A', 'B', 'C'],
          required: true,
        },
        porcentaje: {
          type: Number,
          required: true,
        },
        valorMaximo: Number,
      },
    ],
    activo: {
      type: Boolean,
      default: true,
    },
    observaciones: String,
  },
  {
    timestamps: true,
  }
);

// Índices compuestos
ConvenioTarifaSchema.index({ epsNit: 1, tipoConvenio: 1, activo: 1 });
ConvenioTarifaSchema.index({ ipsNit: 1, epsNit: 1, activo: 1 });
ConvenioTarifaSchema.index({ vigenciaInicio: 1, vigenciaFin: 1 });

export default mongoose.model<IConvenioTarifa>('ConvenioTarifa', ConvenioTarifaSchema);
