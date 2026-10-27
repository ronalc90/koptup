/**
 * Formatos deterministas (mismo resultado en el servidor y en el navegador,
 * para no provocar errores de hidratación por diferencias de ICU o zona horaria).
 */

export function formatoNumero(n: number, locale: string, decimales = 0): string {
  const [entero, decimal] = Math.abs(n).toFixed(decimales).split('.');
  const miles = locale === 'en' ? ',' : '.';
  const coma = locale === 'en' ? '.' : ',';
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, miles);
  return `${n < 0 ? '-' : ''}${conMiles}${decimal ? coma + decimal : ''}`;
}

export function formatoCOP(n: number, locale: string): string {
  return `${n < 0 ? '-' : ''}$${formatoNumero(Math.abs(n), locale)}`;
}

/** Porcentaje con un decimal como máximo (sin ",0"). */
export function formatoPorcentaje(n: number, locale: string): string {
  const redondeado = Math.round(n * 10) / 10;
  return formatoNumero(redondeado, locale, Number.isInteger(redondeado) ? 0 : 1);
}

const MESES: Record<string, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** Fecha ISO (AAAA-MM-DD) a texto corto, sin depender de la zona horaria. */
export function formatoFecha(iso: string, locale: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const mes = (MESES[locale] || MESES.es)[m - 1];
  return locale === 'en' ? `${mes} ${d}, ${a}` : `${d} ${mes} ${a}`;
}

/** Hora local HH:MM:SS; solo se usa después de una acción del usuario o en efectos. */
export function horaActual(): string {
  const ahora = new Date();
  return [ahora.getHours(), ahora.getMinutes(), ahora.getSeconds()]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

/** Valor con signo de porcentaje según el idioma: "5 %" en español, "5%" en inglés. */
export function conPorcentaje(n: number, locale: string): string {
  return `${formatoPorcentaje(n, locale)}${locale === 'en' ? '%' : ' %'}`;
}
