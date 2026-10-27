import type { Glosa, Procedimiento } from '../tipos-auditoria';

/** Locale de Intl según el idioma del sitio. */
export function localeIntl(locale: string): string {
  return locale === 'en' ? 'en-US' : 'es-CO';
}

export function formatearCOP(valor: number | undefined | null, locale: string): string {
  return new Intl.NumberFormat(localeIntl(locale), {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

/**
 * Zona con la que se lee una fecha del backend. Cuando el modelo lee la fecha
 * de la factura, el servidor la guarda como fecha sin hora (medianoche UTC):
 * leerla en hora de Colombia la correría al día anterior, así que se lee en
 * UTC. Las demás (fecha de la auditoría, con hora) se leen en hora de Colombia.
 */
export function zonaDeFecha(iso: string): 'UTC' | 'America/Bogota' {
  return /T00:00:00(?:\.0+)?(?:Z|\+00:00)$/.test(iso) ? 'UTC' : 'America/Bogota';
}

/** Fecha con zona fija (no depende de la zona del navegador: sin errores de hidratación). */
export function formatearFecha(iso: string | undefined, locale: string): string {
  if (!iso) return '';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString(localeIntl(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: zonaDeFecha(iso),
  });
}

/** Clave de traducción para cada estado de factura que devuelve el backend. */
export const CLAVE_ESTADO_FACTURA: Record<string, string> = {
  Radicada: 'radicada',
  'En Auditoría': 'enAuditoria',
  Auditada: 'auditada',
  Glosada: 'glosada',
  Aceptada: 'aceptada',
  Pagada: 'pagada',
  Rechazada: 'rechazada',
};

export const ESTADOS_FACTURA = Object.keys(CLAVE_ESTADO_FACTURA);

export const COLOR_ESTADO_FACTURA: Record<string, string> = {
  Radicada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'En Auditoría': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  Auditada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  Glosada: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  Aceptada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  Pagada: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  Rechazada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

/** Clave de traducción para cada tipo de glosa del backend. */
export const CLAVE_TIPO_GLOSA: Record<string, string> = {
  Tarifa: 'tarifa',
  Soporte: 'soporte',
  Pertinencia: 'pertinencia',
  Duplicidad: 'duplicidad',
  'Autorización': 'autorizacion',
  'Facturación': 'facturacion',
  Otro: 'otro',
};

export type DecisionGlosa = 'pendiente' | 'confirmada' | 'ajustada' | 'descartada';

/** Valor que propuso el motor para la glosa (queda guardado en el procedimiento). */
export function valorPropuesto(glosa: Glosa, procedimientos: Procedimiento[]): number {
  const proc = procedimientos.find((p) => p._id === glosa.procedimientoId);
  if (proc && proc.totalGlosas > 0) return proc.totalGlosas;
  return glosa.valorGlosado;
}

export function decisionDeGlosa(glosa: Glosa, propuesto: number): DecisionGlosa {
  if (glosa.estado === 'Rechazada') return 'descartada';
  if (glosa.estado === 'Aceptada') return glosa.valorGlosado === propuesto ? 'confirmada' : 'ajustada';
  return 'pendiente';
}

/**
 * El backend de la demo guarda un prestador y un pagador fijos (no los lee del
 * PDF) con nombres y NIT de entidades reales, y repite el nombre del pagador en
 * los textos de las glosas y en las instrucciones del modelo. La demo no tiene
 * relación con esas entidades: en pantalla y en los informes se muestran como
 * "de ejemplo". Los patrones cubren solo lo que ese código del backend escribe.
 */
const RE_PAGADOR = /\bnueva\s*e\.?\s?p\.?\s?s\b\.?/gi;
const RE_PRESTADOR = /\bcolsubsidio\b/gi;
const RE_NIT = /\b(?:860\.?007\.?336|900\.?156\.?264)(?:\s?-\s?\d)?\b/g;

function reiniciar() {
  RE_PAGADOR.lastIndex = 0;
  RE_PRESTADOR.lastIndex = 0;
  RE_NIT.lastIndex = 0;
}

export function nombreEntidad(
  nombre: string | undefined,
  tipo: 'prestador' | 'pagador',
  etiquetas: { prestador: string; pagador: string },
): string {
  const limpio = (nombre || '').trim();
  if (!limpio) return etiquetas[tipo];
  reiniciar();
  if (RE_PAGADOR.test(limpio) || RE_PRESTADOR.test(limpio) || /^eps demo$/i.test(limpio)) {
    return etiquetas[tipo];
  }
  return limpio;
}

export function anonimizarTexto(
  texto: string | undefined,
  etiquetas: { prestador: string; pagador: string; nit?: string },
): string {
  if (!texto) return '';
  reiniciar();
  return texto
    .replace(RE_PAGADOR, etiquetas.pagador)
    .replace(RE_PRESTADOR, etiquetas.prestador)
    .replace(RE_NIT, etiquetas.nit ?? 'NIT');
}

/** Nombre de archivo seguro a partir de un texto libre. */
export function nombreArchivo(base: string): string {
  return base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
