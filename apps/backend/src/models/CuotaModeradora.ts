import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo: CuotaModeradora
 *
 * Define las cuotas moderadoras según régimen, categoría y tipo de servicio.
 * Las cuotas moderadoras son pagos que hace el afiliado por servicios del POS.
 *
 * Según normativa colombiana:
 * - Régimen Contributivo: Aplica cuotas moderadoras
 * - Régimen Subsidiado: Aplica cuotas moderadoras menores o exentas
 * - Categorías A, B, C según nivel de ingreso
 *
 * Referencia legal:
 * - Acuerdo 260 de 2004 CNSSS
 * - Resolución 5521 de 2013
 */

export interface ICuotaModeradora extends Document {
  nombre: string;
  regimen: 'CONTRIBUTIVO' | 'SUBSIDIADO';
  categoria: 'A' | 'B' | 'C';
  tipoServicio:
    | 'CONSULTA_MEDICINA_GENERAL'
    | 'CONSULTA_ESPECIALIZADA'
    | 'CONSULTA_ODONTOLOGIA'
    | 'CONSULTA_URGENCIAS'
    | 'PROCEDIMIENTO_AMBULATORIO'
    | 'PROCEDIMIENTO_QUIRURGICO'
    | 'HOSPITALIZACION'
    | 'MEDICAMENTOS'
    | 'AYUDAS_DIAGNOSTICAS'
    | 'IMAGENOLOGIA'
    | 'LABORATORIO';
  valorCuota: number; // Valor fijo en COP
  porcentaje?: number; // Porcentaje del salario mínimo (para cálculos dinámicos)
  valorMaximo?: number; // Tope máximo de la cuota
  salarioMinimo?: number; // Referencia del salario mínimo vigente
  exenciones: string[]; // Ej: ["Menores de 1 año", "Mujeres en embarazo"]
  vigenciaInicio: Date;
  vigenciaFin: Date;
  activo: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CuotaModeradoraSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    regimen: {
      type: String,
      enum: ['CONTRIBUTIVO', 'SUBSIDIADO'],
      required: true,
      index: true,
    },
    categoria: {
      type: String,
      enum: ['A', 'B', 'C'],
      required: true,
      index: true,
    },
    tipoServicio: {
      type: String,
      enum: [
        'CONSULTA_MEDICINA_GENERAL',
        'CONSULTA_ESPECIALIZADA',
        'CONSULTA_ODONTOLOGIA',
        'CONSULTA_URGENCIAS',
        'PROCEDIMIENTO_AMBULATORIO',
        'PROCEDIMIENTO_QUIRURGICO',
        'HOSPITALIZACION',
        'MEDICAMENTOS',
        'AYUDAS_DIAGNOSTICAS',
        'IMAGENOLOGIA',
        'LABORATORIO',
      ],
      required: true,
      index: true,
    },
    valorCuota: {
      type: Number,
      required: true,
      min: 0,
    },
    porcentaje: {
      type: Number,
      min: 0,
      max: 100,
    },
    valorMaximo: {
      type: Number,
      min: 0,
    },
    salarioMinimo: {
      type: Number,
      default: 1300000, // Salario mínimo 2024 Colombia
    },
    exenciones: [String],
    vigenciaInicio: {
      type: Date,
      required: true,
    },
    vigenciaFin: {
      type: Date,
      required: true,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    observaciones: String,
  },
  {
    timestamps: true,
  }
);

// Índices compuestos
CuotaModeradoraSchema.index({ regimen: 1, categoria: 1, tipoServicio: 1, activo: 1 });
CuotaModeradoraSchema.index({ vigenciaInicio: 1, vigenciaFin: 1 });

/**
 * Método estático: Obtener cuota moderadora vigente
 */
CuotaModeradoraSchema.statics.obtenerCuota = async function (
  regimen: string,
  categoria: string,
  tipoServicio: string,
  fecha: Date = new Date()
) {
  const cuota = await this.findOne({
    regimen,
    categoria,
    tipoServicio,
    activo: true,
    vigenciaInicio: { $lte: fecha },
    vigenciaFin: { $gte: fecha },
  });

  return cuota;
};

/**
 * Método de instancia: Calcular valor de cuota moderadora
 */
CuotaModeradoraSchema.methods.calcularValor = function (salarioMinimo?: number): number {
  if (this.valorCuota > 0) {
    // Valor fijo
    if (this.valorMaximo && this.valorCuota > this.valorMaximo) {
      return this.valorMaximo;
    }
    return this.valorCuota;
  }

  if (this.porcentaje && salarioMinimo) {
    // Valor calculado como porcentaje del salario mínimo
    const calculado = (salarioMinimo * this.porcentaje) / 100;

    if (this.valorMaximo && calculado > this.valorMaximo) {
      return this.valorMaximo;
    }

    return Math.round(calculado);
  }

  return 0;
};

/**
 * Método de instancia: Verificar si aplica exención
 */
CuotaModeradoraSchema.methods.verificarExencion = function (perfil: {
  edad?: number;
  embarazada?: boolean;
  desplazado?: boolean;
  victima?: boolean;
}): boolean {
  // Menores de 1 año
  if (perfil.edad !== undefined && perfil.edad < 1 && this.exenciones.includes('Menores de 1 año')) {
    return true;
  }

  // Mujeres en embarazo
  if (perfil.embarazada && this.exenciones.includes('Mujeres en embarazo')) {
    return true;
  }

  // Población desplazada
  if (perfil.desplazado && this.exenciones.includes('Población desplazada')) {
    return true;
  }

  // Víctimas del conflicto
  if (perfil.victima && this.exenciones.includes('Víctimas del conflicto')) {
    return true;
  }

  return false;
};

export default mongoose.model<ICuotaModeradora>('CuotaModeradora', CuotaModeradoraSchema);
