import mongoose, { Schema, Document } from 'mongoose';

/**
 * Modelo: CUPSEquivalencia
 *
 * Maneja equivalencias entre diferentes formatos del mismo código CUPS.
 * Los códigos CUPS pueden venir en diferentes formatos según la fuente.
 *
 * Ejemplos:
 * - "890201" = "0000890201" = "89.02.01" = "89-02-01"
 * - "871001" = "0000871001" = "87.10.01" = "87-10-01"
 *
 * Este modelo permite normalizar y buscar códigos en cualquier formato.
 */

export interface ICUPSEquivalencia extends Document {
  codigoPrincipal: string; // Código canónico (sin puntos ni guiones)
  equivalencias: string[]; // Todas las variaciones posibles
  descripcion: string;
  fuentes: string[]; // De dónde provienen los códigos
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CUPSEquivalenciaSchema: Schema = new Schema(
  {
    codigoPrincipal: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    equivalencias: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    descripcion: {
      type: String,
      required: true,
    },
    fuentes: [String],
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice de texto para búsqueda
CUPSEquivalenciaSchema.index({ equivalencias: 1 });
CUPSEquivalenciaSchema.index({ descripcion: 'text' });

/**
 * Método estático: Buscar código CUPS por cualquier equivalencia
 */
CUPSEquivalenciaSchema.statics.buscarPorCodigo = async function (codigo: string) {
  // Normalizar código de entrada
  const codigoNormalizado = normalizarCodigoCUPS(codigo);

  // Buscar en código principal o equivalencias
  const resultado = await this.findOne({
    $or: [{ codigoPrincipal: codigoNormalizado }, { equivalencias: { $in: [codigo, codigoNormalizado] } }],
    activo: true,
  });

  return resultado;
};

/**
 * Método estático: Crear equivalencias automáticamente
 */
CUPSEquivalenciaSchema.statics.crearEquivalencias = async function (
  codigoPrincipal: string,
  descripcion: string
) {
  const equivalencias = generarEquivalencias(codigoPrincipal);

  const existente = await this.findOne({ codigoPrincipal });

  if (existente) {
    // Actualizar agregando nuevas equivalencias
    existente.equivalencias = Array.from(new Set([...existente.equivalencias, ...equivalencias]));
    await existente.save();
    return existente;
  } else {
    // Crear nuevo
    return await this.create({
      codigoPrincipal,
      equivalencias,
      descripcion,
      fuentes: ['Sistema'],
      activo: true,
    });
  }
};

/**
 * Normaliza un código CUPS removiendo caracteres especiales
 */
function normalizarCodigoCUPS(codigo: string): string {
  if (!codigo) return '';

  // Remover espacios, puntos, guiones
  let normalizado = codigo.toUpperCase().trim();
  normalizado = normalizado.replace(/[\s\.\-]/g, '');

  // Remover ceros a la izquierda excepto si es el único dígito
  normalizado = normalizado.replace(/^0+/, '');

  return normalizado;
}

/**
 * Genera todas las variaciones posibles de un código CUPS
 */
function generarEquivalencias(codigoPrincipal: string): string[] {
  const normalizado = normalizarCodigoCUPS(codigoPrincipal);
  const equivalencias = new Set<string>();

  // Agregar código principal
  equivalencias.add(normalizado);
  equivalencias.add(codigoPrincipal);

  // Variación con ceros a la izquierda (10 dígitos)
  const conCeros = normalizado.padStart(10, '0');
  equivalencias.add(conCeros);

  // Variaciones con 6 dígitos
  if (normalizado.length === 6) {
    // Formato con puntos: 89.02.01
    equivalencias.add(`${normalizado.substring(0, 2)}.${normalizado.substring(2, 4)}.${normalizado.substring(4, 6)}`);

    // Formato con guiones: 89-02-01
    equivalencias.add(`${normalizado.substring(0, 2)}-${normalizado.substring(2, 4)}-${normalizado.substring(4, 6)}`);

    // Formato espaciado: 89 02 01
    equivalencias.add(`${normalizado.substring(0, 2)} ${normalizado.substring(2, 4)} ${normalizado.substring(4, 6)}`);
  }

  // Variaciones con 10 dígitos
  if (conCeros.length === 10) {
    // Formato con puntos: 0000.89.02.01
    equivalencias.add(`${conCeros.substring(0, 4)}.${conCeros.substring(4, 6)}.${conCeros.substring(6, 8)}.${conCeros.substring(8, 10)}`);

    // Formato SISPRO común
    equivalencias.add(`${conCeros.substring(4, 6)}${conCeros.substring(6, 8)}${conCeros.substring(8, 10)}`);
  }

  return Array.from(equivalencias);
}

export default mongoose.model<ICUPSEquivalencia>('CUPSEquivalencia', CUPSEquivalenciaSchema);
export { normalizarCodigoCUPS, generarEquivalencias };
