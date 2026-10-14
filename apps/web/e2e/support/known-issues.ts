import { test } from '@playwright/test';

/**
 * Problemas conocidos de las demos (los usan demos.spec.ts y las pruebas de la
 * plataforma que pasan por una demo, como rag-upload.spec.ts). Cada entrada es
 * un bug real de la demo, no de la prueba: la prueba lo sigue vigilando y la
 * lista solo se achica (ver demos.spec.ts).
 */

/**
 * Errores de hidratación de React. En la build de producción llegan como
 * "Minified React error #418/#423/#425"; en desarrollo, con su texto completo.
 */
export const HYDRATION_ERROR = /Minified React error #(418|423|425)\b|Hydration failed|did not match|while hydrating|server-rendered HTML/i;

/**
 * Demos con errores de consola conocidos. Cada entrada es un bug real de la
 * demo, no de la prueba, y la prueba la sigue vigilando:
 * - falla si aparece cualquier error que no coincida con `patron` (un error
 *   nuevo nunca queda tapado por la lista);
 * - falla si el error conocido ya no ocurre, para que se borre la entrada
 *   (la lista solo se achica), salvo que sea `intermitente`: entonces solo
 *   deja una anotación "problema conocido no apareció" en el reporte.
 * Para exigir cero errores también en estas demos:
 * E2E_INCLUDE_KNOWN_ISSUES=1 npm run test:e2e
 */
export interface KnownIssue {
  motivo: string;
  patron: RegExp;
  /** El error no sale en todas las cargas: no se exige que aparezca. */
  intermitente?: boolean;
}

/**
 * Hoy no hay ninguno. Las entradas de hidratación (automatizacion,
 * facturacion-electronica, helpdesk-ia, lms, loyalty, moderacion-contenido,
 * pos, scraping y wms-logistica) y la de gestor-documentos (401 sin sesión)
 * se borraron el 14 de octubre de 2026: con E2E_INCLUDE_KNOWN_ISSUES=1 y
 * --repeat-each=5 (10 cargas por demo en es-CO, escritorio y móvil, build de
 * producción) ninguna registró errores, y gestor-documentos sin sesión ya
 * muestra sus datos de ejemplo sin llamar a la API.
 *
 * Para agregar uno: `slug: { motivo, patron, intermitente? }`, con el motivo
 * del bug real de la demo (nunca de la prueba).
 */
export const KNOWN_CONSOLE_ISSUES: Record<string, KnownIssue> = {};

/**
 * Textos de error visibles conocidos (misma regla que KNOWN_CONSOLE_ISSUES:
 * cada entrada es un pendiente real y la lista solo se achica). Hoy no hay
 * ninguno.
 */
export const KNOWN_VISIBLE_ISSUES: Record<string, { motivo: string; textos: string[] }> = {};

export const STRICT = Boolean(process.env.E2E_INCLUDE_KNOWN_ISSUES);

/**
 * Los errores de consola de `errors` que NO son el problema conocido de la
 * demo `slug`. Si se filtró alguno, lo anota en el reporte. Con
 * E2E_INCLUDE_KNOWN_ISSUES=1 no filtra nada.
 */
export function withoutKnownIssues(slug: string, errors: string[]): string[] {
  const known = STRICT ? undefined : KNOWN_CONSOLE_ISSUES[slug];
  if (!known) return errors;
  const rest = errors.filter((error) => !known.patron.test(error));
  if (rest.length !== errors.length) {
    test.info().annotations.push({ type: 'problema conocido', description: `pendiente pista demos (${slug}): ${known.motivo}` });
  }
  return rest;
}
