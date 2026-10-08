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

// Intermitente: con 10 cargas seguidas por demo, automatizacion, chatbot,
// facturacion-electronica y pos cargaron alguna vez sin el error (depende de
// qué alcanza a pintarse antes de hidratar), y exigirlo hacía fallar la
// prueba al azar.
const HYDRATION_TO_LOCALE: KnownIssue = {
  motivo:
    'hidratación (#418/#423/#425) con el navegador en es-CO: la página formatea números o fechas con toLocaleString() sin locale y el servidor no pinta lo mismo que el navegador',
  patron: HYDRATION_ERROR,
  intermitente: true,
};

// Demos públicas cuyas APIs exigen sesión desde P3 (autorización en el
// servidor): un visitante anónimo recibe 401 del backend hasta que la demo
// pida iniciar sesión (pista demos). Las demos que requieren acceso o
// invitación (erp, cuentas-medicas, sistema-experto…) ya no llegan a cargar
// sin acceso: el middleware muestra /demo-acceso (ver demo-access.spec.ts).
const ACCESS_REQUIRED: KnownIssue = {
  motivo:
    'la API de la demo exige sesión o acceso (P3); falta la pantalla de acceso (P4) / pedir inicio de sesión (pista demos), así que el anónimo ve 401 en consola',
  patron: /status of 40[13]|Error al cargar|Error al obtener|Error fetching/i,
  // Las llamadas salen en un efecto tras hidratar: según el tiempo de carga
  // pueden quedar fuera de la espera de la prueba.
  intermitente: true,
};

export const KNOWN_CONSOLE_ISSUES: Record<string, KnownIssue> = {
  // pendiente pista demos: con 401 mostrar «inicia sesión» (useDocuments expone
  // `requiresLogin`) o un corpus de muestra, en lugar del error genérico.
  'gestor-documentos': ACCESS_REQUIRED,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  automatizacion: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  chatbot: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'facturacion-electronica': HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'helpdesk-ia': HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  lms: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  loyalty: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'moderacion-contenido': HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  pos: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  scraping: HYDRATION_TO_LOCALE,
  // pendiente pista demos: hidratación por toLocaleString() sin locale.
  'wms-logistica': HYDRATION_TO_LOCALE,
};

/**
 * Textos de error visibles conocidos (misma regla que KNOWN_CONSOLE_ISSUES:
 * cada entrada es un pendiente real y la lista solo se achica).
 */
export const KNOWN_VISIBLE_ISSUES: Record<string, { motivo: string; textos: string[] }> = {
  // pendiente pista demos: pedir inicio de sesión antes de cargar documentos.
  'gestor-documentos': { motivo: ACCESS_REQUIRED.motivo, textos: ['Error al cargar'] },
};

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
