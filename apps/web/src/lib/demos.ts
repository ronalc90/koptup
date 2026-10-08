/**
 * Demos que el sitio lista en el catálogo de /demo (`src/app/demo/page.tsx`),
 * en el mismo orden.
 *
 * Es la fuente de cualquier texto que diga cuántas demos hay (home, /about,
 * /demo, JSON-LD, metadata…): usa `DEMO_COUNT` en lugar de escribir el número.
 * Si agregas o quitas una tarjeta en /demo, actualiza esta lista (en desarrollo,
 * /demo avisa en consola si no coinciden).
 *
 * No se cuentan:
 *  - /demo/cuentas-medicas ("Sistema experto para salud"): no tiene tarjeta en
 *    el catálogo de /demo (allí se entra con código de acceso); se enlaza
 *    directamente desde las demos destacadas de la home y desde /rag/salud.
 *  - /demo/sistema-experto: no está enlazada desde el catálogo.
 */
export const DEMO_CATALOG_SLUGS = [
  'chatbot',
  'ecommerce',
  'dashboard-ejecutivo',
  'gestor-documentos',
  'sistema-reservas',
  'gestor-contenido',
  'control-proyectos',
  'crm-ia',
  'erp',
  'helpdesk-ia',
  'lms',
  'telemedicina',
  'facturacion-electronica',
  'wms-logistica',
  'pos',
  'hrms',
  'automatizacion',
  'saas-boilerplate',
  'voice-ai',
  'firma-electronica',
  'scraping',
  'code-review-ia',
  'moderacion-contenido',
  'delivery',
  'loyalty',
  'linkedin-ads',
] as const;

/** Demos del catálogo que llaman a un modelo de IA real (OpenAI). */
export const LIVE_AI_DEMO_SLUGS = ['chatbot', 'linkedin-ads'] as const;

/** Número de demos navegables del catálogo de /demo. */
export const DEMO_COUNT: number = DEMO_CATALOG_SLUGS.length;

/** Demos del catálogo con IA real. */
export const LIVE_AI_DEMO_COUNT: number = LIVE_AI_DEMO_SLUGS.length;

/** Demos del catálogo que son prototipos con datos simulados. */
export const MOCKUP_DEMO_COUNT: number = DEMO_COUNT - LIVE_AI_DEMO_COUNT;
