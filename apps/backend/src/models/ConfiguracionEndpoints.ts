import mongoose, { Schema, Document } from 'mongoose';

export interface IEndpointConfig {
  nombre: string; // 'OnBase', 'Nueva EPS', 'AcielColombia', etc.
  url: string;
  tipo: 'onbase' | 'nueva_eps' | 'aciel' | 'consulta_seps' | 'intranet' | 'otro';
  activo: boolean;
  metodo: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  autenticacion?: {
    tipo: 'none' | 'bearer' | 'basic' | 'api_key' | 'custom';
    credenciales?: {
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
      customHeaders?: Record<string, string>;
    };
  };
  parametrosConsulta?: {
    // Parámetros específicos para construir la consulta
    campoRadicado?: string; // nombre del parámetro para el radicado
    campoNIT?: string; // nombre del parámetro para el NIT
    campoFactura?: string; // nombre del parámetro para número de factura
    formatoRespuesta?: 'json' | 'xml' | 'pdf' | 'html';
  };
  timeout?: number; // milisegundos
  reintentos?: number;
  descripcion?: string;
}

export interface IConfiguracionEndpoints extends Document {
  nombreConfig: string; // "Configuración Nueva EPS Sucursal 1", etc.
  entidadAsociada: string; // "Nueva EPS", "Sanitas", etc.
  endpoints: IEndpointConfig[];
  activa: boolean;
  creadoPor: string;
  modificadoPor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EndpointConfigSchema = new Schema<IEndpointConfig>({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  tipo: {
    type: String,
    enum: ['onbase', 'nueva_eps', 'aciel', 'consulta_seps', 'intranet', 'otro'],
    required: true,
  },
  activo: {
    type: Boolean,
    default: true,
  },
  metodo: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE'],
    default: 'GET',
  },
  headers: {
    type: Map,
    of: String,
  },
  autenticacion: {
    tipo: {
      type: String,
      enum: ['none', 'bearer', 'basic', 'api_key', 'custom'],
      default: 'none',
    },
    credenciales: {
      username: String,
      password: String,
      token: String,
      apiKey: String,
      customHeaders: {
        type: Map,
        of: String,
      },
    },
  },
  parametrosConsulta: {
    campoRadicado: String,
    campoNIT: String,
    campoFactura: String,
    formatoRespuesta: {
      type: String,
      enum: ['json', 'xml', 'pdf', 'html'],
      default: 'json',
    },
  },
  timeout: {
    type: Number,
    default: 30000, // 30 segundos
  },
  reintentos: {
    type: Number,
    default: 3,
  },
  descripcion: {
    type: String,
  },
});

const ConfiguracionEndpointsSchema = new Schema<IConfiguracionEndpoints>(
  {
    nombreConfig: {
      type: String,
      required: true,
      trim: true,
    },
    entidadAsociada: {
      type: String,
      required: true,
      trim: true,
    },
    endpoints: [EndpointConfigSchema],
    activa: {
      type: Boolean,
      default: true,
    },
    creadoPor: {
      type: String,
      required: true,
    },
    modificadoPor: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
ConfiguracionEndpointsSchema.index({ entidadAsociada: 1, activa: 1 });
ConfiguracionEndpointsSchema.index({ nombreConfig: 1 });

export const ConfiguracionEndpoints = mongoose.model<IConfiguracionEndpoints>(
  'ConfiguracionEndpoints',
  ConfiguracionEndpointsSchema
);
