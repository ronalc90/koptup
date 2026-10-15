/**
 * Qué demos muestra el sitio, y dónde (decisión de la revisión del 15-oct-2026).
 *
 * - VITRINA (5): portada, /demo («Demos principales»), sitemap e indexables.
 * - APOYO (9): solo /demo («Más ejemplos»), con noindex. Fuera de la portada,
 *   del menú y del sitemap. Se muestran cuando un cliente pide ese caso.
 * - OCULTAS (14): fuera de /demo, de la portada y del sitemap. La URL sigue
 *   viva con noindex para quien ya tiene el enlace.
 *
 * Los slugs deben existir en `DEMO_CATALOG_SLUGS` (src/lib/demos.ts) o en las
 * demos de apoyo de `EXTRA_DEMOS` (src/components/demo/demo-cards.ts).
 */
export const DEMOS_VITRINA = [
  'chatbot',
  'helpdesk-ia',
  'gestor-documentos',
  'dashboard-ejecutivo',
  'ecommerce',
] as const;

export const DEMOS_APOYO = [
  'crm-ia',
  'sistema-reservas',
  'pos',
  'loyalty',
  'control-proyectos',
  'saas-boilerplate',
  'code-review-ia',
  'facturacion-electronica',
  'firma-electronica',
] as const;

export const DEMOS_OCULTAS = [
  'gestor-contenido',
  'erp',
  'lms',
  'telemedicina',
  'wms-logistica',
  'hrms',
  'automatizacion',
  'voice-ai',
  'scraping',
  'moderacion-contenido',
  'delivery',
  'linkedin-ads',
  'cuentas-medicas',
  'sistema-experto',
] as const;

/** Demos que aparecen en /demo (vitrina + apoyo), en ese orden. */
export const DEMOS_VISIBLES: readonly string[] = [...DEMOS_VITRINA, ...DEMOS_APOYO];

/** Demos que llevan `noindex` (apoyo y ocultas). */
export const DEMOS_SIN_INDEXAR: readonly string[] = [...DEMOS_APOYO, ...DEMOS_OCULTAS];

export function isDemoVitrina(slug: string): boolean {
  return (DEMOS_VITRINA as readonly string[]).includes(slug);
}

export function isDemoSinIndexar(slug: string): boolean {
  return DEMOS_SIN_INDEXAR.includes(slug);
}
