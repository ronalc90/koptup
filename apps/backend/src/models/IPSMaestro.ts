import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo: IPSMaestro
 *
 * Catálogo maestro de IPS (Instituciones Prestadoras de Servicios de Salud) en Colombia.
 * Contiene información detallada de hospitales, clínicas, centros médicos, etc.
 *
 * Fuentes de datos:
 * - REPS (Registro Especial de Prestadores de Servicios de Salud)
 * - Superintendencia Nacional de Salud
 * - Secretarías de Salud Departamentales
 */

export interface IIPSMaestro extends Document {
  nit: string;
  codigoHabilitacion: string;
  razonSocial: string;
  nombreComercial: string;
  tipoIPS:
    | 'HOSPITAL'
    | 'CLINICA'
    | 'CENTRO_SALUD'
    | 'CONSULTORIO'
    | 'LABORATORIO'
    | 'IMAGENOLOGIA'
    | 'IPS_AMBULATORIA'
    | 'IPS_HOSPITALARIA'
    | 'IPS_MIXTA';
  nivelAtencion: '1' | '2' | '3' | '4';
  naturaleza: 'PUBLICA' | 'PRIVADA' | 'MIXTA';
  estado: 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA' | 'CLAUSURADA';
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
  sedes: {
    nombre: string;
    direccion: string;
    ciudad: string;
    departamento: string;
    telefono?: string;
    activa: boolean;
  }[];
  serviciosHabilitados: {
    codigoServicio: string;
    nombreServicio: string;
    complejidad: 'BAJA' | 'MEDIA' | 'ALTA';
    fechaHabilitacion: Date;
    fechaVencimiento?: Date;
    activo: boolean;
  }[];
  especialidades: string[];
  convenios: {
    epsNit: string;
    epsNombre: string;
    tipoConvenio: string;
    fechaInicio: Date;
    fechaFin?: Date;
    activo: boolean;
  }[];
  capacidadInstalada?: {
    camas?: number;
    camasUCI?: number;
    camasUrgencias?: number;
    quirofanos?: number;
    consultorios?: number;
  };
  tarifarioPreferido?: 'ISS_2001' | 'ISS_2004' | 'SOAT' | 'PERSONALIZADO';
  observaciones?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IPSMaestroSchema: Schema = new Schema(
  {
    nit: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    codigoHabilitacion: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    tipoIPS: {
      type: String,
      enum: [
        'HOSPITAL',
        'CLINICA',
        'CENTRO_SALUD',
        'CONSULTORIO',
        'LABORATORIO',
        'IMAGENOLOGIA',
        'IPS_AMBULATORIA',
        'IPS_HOSPITALARIA',
        'IPS_MIXTA',
      ],
      required: true,
      index: true,
    },
    nivelAtencion: {
      type: String,
      enum: ['1', '2', '3', '4'],
      required: true,
      index: true,
    },
    naturaleza: {
      type: String,
      enum: ['PUBLICA', 'PRIVADA', 'MIXTA'],
      required: true,
      index: true,
    },
    estado: {
      type: String,
      enum: ['ACTIVA', 'SUSPENDIDA', 'CANCELADA', 'CLAUSURADA'],
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
        index: true,
      },
      departamento: {
        type: String,
        required: true,
        index: true,
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
    sedes: [
      {
        nombre: {
          type: String,
          required: true,
        },
        direccion: String,
        ciudad: String,
        departamento: String,
        telefono: String,
        activa: {
          type: Boolean,
          default: true,
        },
      },
    ],
    serviciosHabilitados: [
      {
        codigoServicio: {
          type: String,
          required: true,
        },
        nombreServicio: {
          type: String,
          required: true,
        },
        complejidad: {
          type: String,
          enum: ['BAJA', 'MEDIA', 'ALTA'],
        },
        fechaHabilitacion: {
          type: Date,
          required: true,
        },
        fechaVencimiento: Date,
        activo: {
          type: Boolean,
          default: true,
        },
      },
    ],
    especialidades: [String],
    convenios: [
      {
        epsNit: {
          type: String,
          required: true,
        },
        epsNombre: {
          type: String,
          required: true,
        },
        tipoConvenio: String,
        fechaInicio: {
          type: Date,
          required: true,
        },
        fechaFin: Date,
        activo: {
          type: Boolean,
          default: true,
        },
      },
    ],
    capacidadInstalada: {
      camas: Number,
      camasUCI: Number,
      camasUrgencias: Number,
      quirofanos: Number,
      consultorios: Number,
    },
    tarifarioPreferido: {
      type: String,
      enum: ['ISS_2001', 'ISS_2004', 'SOAT', 'PERSONALIZADO'],
      default: 'ISS_2004',
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
IPSMaestroSchema.index({ razonSocial: 'text', nombreComercial: 'text' });

// Índices compuestos
IPSMaestroSchema.index({ tipoIPS: 1, nivelAtencion: 1, activo: 1 });
IPSMaestroSchema.index({ 'contacto.departamento': 1, 'contacto.ciudad': 1, activo: 1 });
IPSMaestroSchema.index({ especialidades: 1, activo: 1 });

/**
 * Método estático: Buscar IPS por NIT o nombre
 */
IPSMaestroSchema.statics.buscar = async function (termino: string) {
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
 * Método estático: Obtener IPS por ubicación y tipo
 */
IPSMaestroSchema.statics.obtenerPorUbicacion = async function (
  departamento: string,
  ciudad?: string,
  tipoIPS?: string
) {
  const query: any = {
    'contacto.departamento': departamento,
    activo: true,
    estado: 'ACTIVA',
  };

  if (ciudad) {
    query['contacto.ciudad'] = ciudad;
  }

  if (tipoIPS) {
    query.tipoIPS = tipoIPS;
  }

  return await this.find(query);
};

/**
 * Método estático: Obtener IPS con convenio EPS
 */
IPSMaestroSchema.statics.obtenerPorEPS = async function (epsNit: string) {
  return await this.find({
    'convenios.epsNit': epsNit,
    'convenios.activo': true,
    activo: true,
    estado: 'ACTIVA',
  });
};

/**
 * Método de instancia: Verificar servicio habilitado
 */
IPSMaestroSchema.methods.tieneServicioHabilitado = function (codigoServicio: string): boolean {
  const hoy = new Date();

  const servicio = this.serviciosHabilitados.find(
    (s: any) =>
      s.codigoServicio === codigoServicio &&
      s.activo &&
      (!s.fechaVencimiento || s.fechaVencimiento >= hoy)
  );

  return !!servicio;
};

/**
 * Método de instancia: Verificar convenio con EPS
 */
IPSMaestroSchema.methods.tieneConvenioConEPS = function (epsNit: string): boolean {
  const hoy = new Date();

  const convenio = this.convenios.find(
    (c: any) =>
      c.epsNit === epsNit &&
      c.activo &&
      (!c.fechaFin || c.fechaFin >= hoy)
  );

  return !!convenio;
};

export default mongoose.model<IIPSMaestro>('IPSMaestro', IPSMaestroSchema);
