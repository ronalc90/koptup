import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo: Autorizacion
 *
 * Gestiona autorizaciones de servicios médicos emitidas por las EPS.
 * Las autorizaciones son requisito para facturar ciertos procedimientos.
 *
 * Flujo típico:
 * 1. IPS solicita autorización a la EPS
 * 2. EPS aprueba/rechaza la autorización
 * 3. IPS presta el servicio
 * 4. IPS factura usando el número de autorización
 * 5. Durante auditoría se valida que la autorización sea válida
 */

export interface IAutorizacion extends Document {
  numeroAutorizacion: string;
  epsNit: string;
  epsNombre: string;
  ipsNit: string;
  ipsNombre: string;
  paciente: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    edad?: number;
    sexo?: 'M' | 'F';
  };
  diagnosticoPrincipal: {
    codigoCIE10: string;
    descripcion: string;
  };
  diagnosticosSecundarios?: {
    codigoCIE10: string;
    descripcion: string;
  }[];
  serviciosAutorizados: {
    codigoCUPS: string;
    descripcion: string;
    cantidad: number;
    cantidadUtilizada?: number;
    valorAutorizado?: number;
  }[];
  estado: 'ACTIVA' | 'VENCIDA' | 'ANULADA' | 'UTILIZADA' | 'PARCIALMENTE_UTILIZADA';
  fechaEmision: Date;
  fechaVencimiento: Date;
  fechaUtilizacion?: Date;
  observaciones?: string;
  motivoAnulacion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AutorizacionSchema: Schema = new Schema(
  {
    numeroAutorizacion: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
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
      required: true,
      index: true,
    },
    ipsNombre: {
      type: String,
      required: true,
    },
    paciente: {
      tipoDocumento: {
        type: String,
        required: true,
        enum: ['CC', 'TI', 'RC', 'CE', 'PA', 'SC', 'MS', 'AS'],
      },
      numeroDocumento: {
        type: String,
        required: true,
        index: true,
      },
      nombres: {
        type: String,
        required: true,
      },
      apellidos: {
        type: String,
        required: true,
      },
      edad: Number,
      sexo: {
        type: String,
        enum: ['M', 'F'],
      },
    },
    diagnosticoPrincipal: {
      codigoCIE10: {
        type: String,
        required: true,
      },
      descripcion: {
        type: String,
        required: true,
      },
    },
    diagnosticosSecundarios: [
      {
        codigoCIE10: String,
        descripcion: String,
      },
    ],
    serviciosAutorizados: [
      {
        codigoCUPS: {
          type: String,
          required: true,
        },
        descripcion: {
          type: String,
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
          default: 1,
        },
        cantidadUtilizada: {
          type: Number,
          default: 0,
        },
        valorAutorizado: Number,
      },
    ],
    estado: {
      type: String,
      enum: ['ACTIVA', 'VENCIDA', 'ANULADA', 'UTILIZADA', 'PARCIALMENTE_UTILIZADA'],
      default: 'ACTIVA',
      index: true,
    },
    fechaEmision: {
      type: Date,
      required: true,
      index: true,
    },
    fechaVencimiento: {
      type: Date,
      required: true,
      index: true,
    },
    fechaUtilizacion: Date,
    observaciones: String,
    motivoAnulacion: String,
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

// Índices compuestos
AutorizacionSchema.index({ numeroAutorizacion: 1, estado: 1 });
AutorizacionSchema.index({ epsNit: 1, fechaEmision: 1 });
AutorizacionSchema.index({ ipsNit: 1, estado: 1 });
AutorizacionSchema.index({ 'paciente.numeroDocumento': 1, estado: 1 });
AutorizacionSchema.index({ fechaVencimiento: 1, estado: 1 });

/**
 * Método estático: Validar autorización
 */
AutorizacionSchema.statics.validarAutorizacion = async function (
  numeroAutorizacion: string,
  codigoCUPS: string,
  cantidad: number = 1
) {
  const autorizacion = await this.findOne({
    numeroAutorizacion,
    activo: true,
  });

  if (!autorizacion) {
    return {
      valida: false,
      motivo: 'Autorización no encontrada',
    };
  }

  // Verificar estado
  if (autorizacion.estado === 'ANULADA') {
    return {
      valida: false,
      motivo: 'Autorización anulada',
    };
  }

  // Verificar vigencia
  const hoy = new Date();
  if (hoy > autorizacion.fechaVencimiento) {
    // Actualizar estado a vencida
    autorizacion.estado = 'VENCIDA';
    await autorizacion.save();

    return {
      valida: false,
      motivo: 'Autorización vencida',
    };
  }

  // Verificar servicio autorizado
  const servicio = autorizacion.serviciosAutorizados.find((s: any) => s.codigoCUPS === codigoCUPS);

  if (!servicio) {
    return {
      valida: false,
      motivo: `Servicio ${codigoCUPS} no está autorizado`,
    };
  }

  // Verificar cantidad
  const cantidadDisponible = servicio.cantidad - (servicio.cantidadUtilizada || 0);

  if (cantidad > cantidadDisponible) {
    return {
      valida: false,
      motivo: `Cantidad excede lo autorizado. Disponible: ${cantidadDisponible}, Solicitado: ${cantidad}`,
    };
  }

  return {
    valida: true,
    autorizacion,
    servicio,
  };
};

/**
 * Método de instancia: Registrar uso de autorización
 */
AutorizacionSchema.methods.registrarUso = async function (codigoCUPS: string, cantidad: number = 1) {
  const servicio = this.serviciosAutorizados.find((s: any) => s.codigoCUPS === codigoCUPS);

  if (!servicio) {
    throw new Error(`Servicio ${codigoCUPS} no está autorizado`);
  }

  servicio.cantidadUtilizada = (servicio.cantidadUtilizada || 0) + cantidad;

  // Actualizar estado
  const todosUtilizados = this.serviciosAutorizados.every(
    (s: any) => s.cantidadUtilizada >= s.cantidad
  );

  const algunoUtilizado = this.serviciosAutorizados.some(
    (s: any) => s.cantidadUtilizada > 0
  );

  if (todosUtilizados) {
    this.estado = 'UTILIZADA';
  } else if (algunoUtilizado) {
    this.estado = 'PARCIALMENTE_UTILIZADA';
  }

  this.fechaUtilizacion = new Date();

  await this.save();

  return this;
};

/**
 * Método de instancia: Anular autorización
 */
AutorizacionSchema.methods.anular = async function (motivo: string) {
  this.estado = 'ANULADA';
  this.motivoAnulacion = motivo;
  this.activo = false;

  await this.save();

  return this;
};

/**
 * Pre-save hook: Actualizar estado según fecha
 */
AutorizacionSchema.pre('save', function (next) {
  const hoy = new Date();

  if (this.estado === 'ACTIVA' && hoy > this.fechaVencimiento) {
    this.estado = 'VENCIDA';
  }

  next();
});

export default mongoose.model<IAutorizacion>('Autorizacion', AutorizacionSchema);
