import mongoose, { Schema, Document } from 'mongoose';

export interface IReglaFacturacion extends Document {
  nombre: string;
  descripcion: string; // Regla en lenguaje natural
  tipo: 'glosa' | 'autorizacion' | 'valor' | 'fecha' | 'paciente' | 'servicio' | 'general';
  activa: boolean;
  prioridad: number; // Orden de aplicación (1 = mayor prioridad)
  ambito: {
    tipo: 'global' | 'eps' | 'servicio' | 'rango_valor' | 'tipo_atencion';
    valor?: string; // EPS específica, código CUPS, etc.
  };

  // IA procesada
  reglaInterpretada?: {
    condiciones: Array<{
      campo: string; // 'valor', 'codigoCUPS', 'autorizacion', etc.
      operador: 'menor' | 'mayor' | 'igual' | 'contiene' | 'entre' | 'existe' | 'no_existe';
      valor: any;
      valorMax?: any; // Para operador 'entre'
    }>;
    accion: {
      tipo: 'ignorar_glosa' | 'no_validar_autorizacion' | 'ajustar_valor' | 'homologar_servicio' | 'aceptar_fecha';
      parametros?: any;
    };
    confianza: number; // 0-100: qué tan segura está la IA de la interpretación
    procesadaPor: 'claude' | 'gpt4';
    fechaProcesamiento: Date;
  };

  // Estadísticas
  estadisticas: {
    vecesAplicada: number;
    ultimaAplicacion?: Date;
    montoTotalAfectado: number; // Suma de valores afectados por esta regla
    glosasEvitadas: number;
  };

  // Auditoría
  creadoPor: string; // ID del usuario
  modificadoPor?: string;
  historialCambios: Array<{
    fecha: Date;
    usuario: string;
    cambio: string;
    descripcionAnterior?: string;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

const ReglaFacturacionSchema = new Schema<IReglaFacturacion>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    tipo: {
      type: String,
      enum: ['glosa', 'autorizacion', 'valor', 'fecha', 'paciente', 'servicio', 'general'],
      required: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
    prioridad: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
    },
    ambito: {
      tipo: {
        type: String,
        enum: ['global', 'eps', 'servicio', 'rango_valor', 'tipo_atencion'],
        default: 'global',
      },
      valor: {
        type: String,
        required: false,
      },
    },
    reglaInterpretada: {
      condiciones: [
        {
          campo: { type: String, required: true },
          operador: {
            type: String,
            enum: ['menor', 'mayor', 'igual', 'contiene', 'entre', 'existe', 'no_existe'],
            required: true,
          },
          valor: { type: Schema.Types.Mixed, required: true },
          valorMax: { type: Schema.Types.Mixed },
        },
      ],
      accion: {
        tipo: {
          type: String,
          enum: ['ignorar_glosa', 'no_validar_autorizacion', 'ajustar_valor', 'homologar_servicio', 'aceptar_fecha'],
          required: true,
        },
        parametros: { type: Schema.Types.Mixed },
      },
      confianza: {
        type: Number,
        min: 0,
        max: 100,
      },
      procesadaPor: {
        type: String,
        enum: ['claude', 'gpt4'],
      },
      fechaProcesamiento: {
        type: Date,
      },
    },
    estadisticas: {
      vecesAplicada: {
        type: Number,
        default: 0,
      },
      ultimaAplicacion: {
        type: Date,
      },
      montoTotalAfectado: {
        type: Number,
        default: 0,
      },
      glosasEvitadas: {
        type: Number,
        default: 0,
      },
    },
    creadoPor: {
      type: String,
      required: true,
    },
    modificadoPor: {
      type: String,
    },
    historialCambios: [
      {
        fecha: { type: Date, default: Date.now },
        usuario: { type: String, required: true },
        cambio: { type: String, required: true },
        descripcionAnterior: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Índices para búsqueda eficiente
ReglaFacturacionSchema.index({ activa: 1, prioridad: 1 });
ReglaFacturacionSchema.index({ tipo: 1, activa: 1 });
ReglaFacturacionSchema.index({ 'ambito.tipo': 1, 'ambito.valor': 1 });

export const ReglaFacturacion = mongoose.model<IReglaFacturacion>(
  'ReglaFacturacion',
  ReglaFacturacionSchema
);
