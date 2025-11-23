import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentoRadicado {
  tipo: 'factura' | 'historia_clinica' | 'autorizacion' | 'soporte' | 'otro';
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  procesado: boolean;
  datosExtraidos?: any; // Datos extraídos del PDF con IA
}

export interface IValidacionRealizada {
  tipo: 'factura' | 'paciente' | 'autorizacion' | 'valor' | 'fecha' | 'cuota_moderadora';
  estado: 'aprobado' | 'rechazado' | 'advertencia';
  mensaje: string;
  detalles?: any;
  validadoEn: Date;
}

export interface IRadicado extends Document {
  numeroRadicado: string; // Número único del radicado
  nit: string; // NIT de la IPS
  nombreIPS?: string;
  eps: string; // "Nueva EPS", "Sanitas", etc.

  // Datos iniciales de factura
  numeroFactura?: string;
  fechaFactura?: Date;
  valorTotal?: number;
  valorIPS?: number;
  valorContratado?: number;

  // Clasificación
  rango: number; // 1-4 según valor
  tipoAtencion?: 'urgencias' | 'consulta_externa' | 'hospitalizacion' | 'quirurgico' | 'otro';

  // Documentos asociados
  documentos: IDocumentoRadicado[];

  // Datos del paciente
  paciente?: {
    tipoDocumento: string;
    numeroDocumento: string;
    nombre?: string;
    tipoAfiliado?: string;
    usaPermisoTemporal?: boolean;
    fechaServicio?: Date;
  };

  // Autorización
  autorizacion?: {
    numero?: string;
    fechaAutorizacion?: Date;
    servicioAutorizado?: string;
    codigoCUPS?: string;
    diagnostico?: string;
    encontrada: boolean;
    valida: boolean;
    observaciones?: string;
  };

  // Validaciones realizadas
  validaciones: IValidacionRealizada[];

  // Estado del proceso
  estado: 'pendiente' | 'en_proceso' | 'validado' | 'liquidado' | 'con_glosas' | 'finalizado' | 'rechazado';

  // Glosas encontradas
  glosas?: Array<{
    tipo: string;
    codigo?: string;
    descripcion: string;
    valor: number;
    generadaPor: 'sistema' | 'regla' | 'manual';
  }>;

  // Reglas aplicadas
  reglasAplicadas?: Array<{
    reglaId: string;
    nombreRegla: string;
    accion: string;
    resultado: string;
  }>;

  // Cuota moderadora
  cuotaModeradora?: {
    tiene: boolean;
    valor?: number;
    tieneDescuento?: boolean;
    detalleDescuento?: string;
    fechaValidada?: Date;
  };

  // Resultado de la liquidación
  liquidacion?: {
    valorFinalAPagar: number;
    valorGlosaTotal: number;
    valorAceptado: number;
    observaciones?: string;
    excelGenerado?: boolean;
    rutaExcel?: string;
    liquidadoEn?: Date;
    liquidadoPor?: string;
  };

  // Consultas externas realizadas
  consultasExternas?: Array<{
    sistema: 'onbase' | 'nueva_eps' | 'aciel' | 'otro';
    url: string;
    exitosa: boolean;
    datosObtenidos?: any;
    error?: string;
    consultadoEn: Date;
  }>;

  // Auditoría
  creadoPor: string;
  modificadoPor?: string;
  observacionesGenerales?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DocumentoRadicadoSchema = new Schema<IDocumentoRadicado>({
  tipo: {
    type: String,
    enum: ['factura', 'historia_clinica', 'autorizacion', 'soporte', 'otro'],
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  procesado: {
    type: Boolean,
    default: false,
  },
  datosExtraidos: {
    type: Schema.Types.Mixed,
  },
});

const ValidacionRealizadaSchema = new Schema<IValidacionRealizada>({
  tipo: {
    type: String,
    enum: ['factura', 'paciente', 'autorizacion', 'valor', 'fecha', 'cuota_moderadora'],
    required: true,
  },
  estado: {
    type: String,
    enum: ['aprobado', 'rechazado', 'advertencia'],
    required: true,
  },
  mensaje: {
    type: String,
    required: true,
  },
  detalles: {
    type: Schema.Types.Mixed,
  },
  validadoEn: {
    type: Date,
    default: Date.now,
  },
});

const RadicadoSchema = new Schema<IRadicado>(
  {
    numeroRadicado: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    nit: {
      type: String,
      required: true,
      trim: true,
    },
    nombreIPS: {
      type: String,
      trim: true,
    },
    eps: {
      type: String,
      required: true,
      trim: true,
    },
    numeroFactura: {
      type: String,
      trim: true,
    },
    fechaFactura: {
      type: Date,
    },
    valorTotal: {
      type: Number,
    },
    valorIPS: {
      type: Number,
    },
    valorContratado: {
      type: Number,
    },
    rango: {
      type: Number,
      min: 1,
      max: 4,
      required: true,
    },
    tipoAtencion: {
      type: String,
      enum: ['urgencias', 'consulta_externa', 'hospitalizacion', 'quirurgico', 'otro'],
    },
    documentos: [DocumentoRadicadoSchema],
    paciente: {
      tipoDocumento: String,
      numeroDocumento: String,
      nombre: String,
      tipoAfiliado: String,
      usaPermisoTemporal: Boolean,
      fechaServicio: Date,
    },
    autorizacion: {
      numero: String,
      fechaAutorizacion: Date,
      servicioAutorizado: String,
      codigoCUPS: String,
      diagnostico: String,
      encontrada: { type: Boolean, default: false },
      valida: { type: Boolean, default: false },
      observaciones: String,
    },
    validaciones: [ValidacionRealizadaSchema],
    estado: {
      type: String,
      enum: ['pendiente', 'en_proceso', 'validado', 'liquidado', 'con_glosas', 'finalizado', 'rechazado'],
      default: 'pendiente',
    },
    glosas: [
      {
        tipo: String,
        codigo: String,
        descripcion: String,
        valor: Number,
        generadaPor: {
          type: String,
          enum: ['sistema', 'regla', 'manual'],
          default: 'sistema',
        },
      },
    ],
    reglasAplicadas: [
      {
        reglaId: String,
        nombreRegla: String,
        accion: String,
        resultado: String,
      },
    ],
    cuotaModeradora: {
      tiene: Boolean,
      valor: Number,
      tieneDescuento: Boolean,
      detalleDescuento: String,
      fechaValidada: Date,
    },
    liquidacion: {
      valorFinalAPagar: Number,
      valorGlosaTotal: Number,
      valorAceptado: Number,
      observaciones: String,
      excelGenerado: Boolean,
      rutaExcel: String,
      liquidadoEn: Date,
      liquidadoPor: String,
    },
    consultasExternas: [
      {
        sistema: {
          type: String,
          enum: ['onbase', 'nueva_eps', 'aciel', 'otro'],
        },
        url: String,
        exitosa: Boolean,
        datosObtenidos: Schema.Types.Mixed,
        error: String,
        consultadoEn: { type: Date, default: Date.now },
      },
    ],
    creadoPor: {
      type: String,
      required: true,
    },
    modificadoPor: {
      type: String,
    },
    observacionesGenerales: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para búsqueda eficiente
RadicadoSchema.index({ numeroRadicado: 1 });
RadicadoSchema.index({ nit: 1 });
RadicadoSchema.index({ eps: 1 });
RadicadoSchema.index({ estado: 1 });
RadicadoSchema.index({ createdAt: -1 });
RadicadoSchema.index({ numeroFactura: 1 });
RadicadoSchema.index({ 'paciente.numeroDocumento': 1 });

// Método para calcular el rango automáticamente
RadicadoSchema.pre('save', function (next) {
  if (this.valorTotal) {
    if (this.valorTotal < 100000) {
      this.rango = 1;
    } else if (this.valorTotal >= 100000 && this.valorTotal < 500000) {
      this.rango = 2;
    } else if (this.valorTotal >= 500000 && this.valorTotal < 1000000) {
      this.rango = 3;
    } else {
      this.rango = 4;
    }
  } else {
    // Si no hay valor total aún, asignar rango 1 por defecto
    if (!this.rango) {
      this.rango = 1;
    }
  }
  next();
});

export const Radicado = mongoose.model<IRadicado>('Radicado', RadicadoSchema);
