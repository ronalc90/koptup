/**
 * Tabla de respaldo del sistema de acceso a demos (wiki 04, §4 y §10).
 *
 * Es la misma semilla que usa el backend (apps/backend/src/data/demo-catalog.seed.ts
 * y DEFAULT_DEMO_ACCESS_MODES en middleware/access.ts): una entrada por cada
 * carpeta de src/app/demo/<slug>. La fuente de verdad es el catálogo del
 * backend (GET /api/demo-catalog), que el administrador edita desde
 * Admin › Catálogo de demos. Esta tabla solo se usa:
 *  - en el middleware, si el backend no responde (las demos `publico` siguen
 *    abiertas y las demás muestran la pantalla de acceso);
 *  - para pintar el hub /demo y el formulario antes de que llegue el catálogo;
 *  - en el sitemap (solo se listan las demos `publico`).
 *
 * Una prueba (src/__tests__/demo-access-defaults.test.ts) verifica que esta
 * tabla coincida con la semilla del backend y con las carpetas de demos.
 */

export const DEMO_ACCESS_MODES = ['publico', 'solicitud', 'privado'] as const;
export type DemoAccessMode = (typeof DEMO_ACCESS_MODES)[number];

export interface DemoDefault {
  slug: string;
  accessMode: DemoAccessMode;
  /** Nombre comercial en español y en inglés (igual que la semilla). */
  nombre: string;
  nombreEn: string;
}

export const DEMO_ACCESS_DEFAULTS: readonly DemoDefault[] = [
  // publico
  { slug: 'chatbot', accessMode: 'publico', nombre: 'Chatbot RAG con tus documentos', nombreEn: 'RAG chatbot over your documents' },
  { slug: 'code-review-ia', accessMode: 'publico', nombre: 'Revisión de código con IA', nombreEn: 'AI code review' },
  { slug: 'crm-ia', accessMode: 'publico', nombre: 'CRM con IA', nombreEn: 'AI-powered CRM' },
  { slug: 'helpdesk-ia', accessMode: 'publico', nombre: 'Mesa de ayuda con IA', nombreEn: 'AI help desk' },
  { slug: 'facturacion-electronica', accessMode: 'publico', nombre: 'Facturación electrónica', nombreEn: 'E-invoicing' },
  { slug: 'pos', accessMode: 'publico', nombre: 'Punto de venta (POS)', nombreEn: 'Point of sale (POS)' },
  { slug: 'ecommerce', accessMode: 'publico', nombre: 'Tienda en línea', nombreEn: 'Online store' },
  { slug: 'loyalty', accessMode: 'publico', nombre: 'Programa de fidelización', nombreEn: 'Loyalty program' },
  { slug: 'control-proyectos', accessMode: 'publico', nombre: 'Gestión de proyectos', nombreEn: 'Project management' },
  { slug: 'sistema-reservas', accessMode: 'publico', nombre: 'Sistema de reservas', nombreEn: 'Booking system' },
  { slug: 'dashboard-ejecutivo', accessMode: 'publico', nombre: 'Dashboard ejecutivo', nombreEn: 'Executive dashboard' },
  { slug: 'gestor-documentos', accessMode: 'publico', nombre: 'Gestor documental', nombreEn: 'Document manager' },
  { slug: 'gestor-contenido', accessMode: 'publico', nombre: 'Gestor de contenido', nombreEn: 'Content manager' },
  { slug: 'automatizacion', accessMode: 'publico', nombre: 'Automatización de procesos', nombreEn: 'Workflow automation' },
  { slug: 'scraping', accessMode: 'publico', nombre: 'Extracción de datos web', nombreEn: 'Web data extraction' },
  { slug: 'moderacion-contenido', accessMode: 'publico', nombre: 'Moderación de contenido con IA', nombreEn: 'AI content moderation' },
  { slug: 'saas-boilerplate', accessMode: 'publico', nombre: 'Plataforma SaaS multiempresa', nombreEn: 'Multi-tenant SaaS platform' },
  { slug: 'firma-electronica', accessMode: 'publico', nombre: 'Firma electrónica', nombreEn: 'E-signature' },
  // solicitud
  { slug: 'voice-ai', accessMode: 'solicitud', nombre: 'Voz con IA para call center', nombreEn: 'Voice AI for call centers' },
  { slug: 'erp', accessMode: 'solicitud', nombre: 'ERP modular', nombreEn: 'Modular ERP' },
  { slug: 'delivery', accessMode: 'solicitud', nombre: 'App de domicilios', nombreEn: 'Delivery app' },
  { slug: 'hrms', accessMode: 'solicitud', nombre: 'Gestión de talento humano (HRMS)', nombreEn: 'HR management (HRMS)' },
  { slug: 'lms', accessMode: 'solicitud', nombre: 'Plataforma de aprendizaje (LMS)', nombreEn: 'Learning platform (LMS)' },
  { slug: 'telemedicina', accessMode: 'solicitud', nombre: 'Telemedicina', nombreEn: 'Telemedicine' },
  { slug: 'wms-logistica', accessMode: 'solicitud', nombre: 'Logística y bodegas (WMS)', nombreEn: 'Warehouse and logistics (WMS)' },
  { slug: 'linkedin-ads', accessMode: 'solicitud', nombre: 'Generador de contenido para LinkedIn con IA', nombreEn: 'AI LinkedIn content generator' },
  // privado
  { slug: 'cuentas-medicas', accessMode: 'privado', nombre: 'Sistema experto para salud (cuentas médicas)', nombreEn: 'Healthcare expert system (medical claims)' },
  { slug: 'sistema-experto', accessMode: 'privado', nombre: 'Sistema experto de auditoría médica', nombreEn: 'Medical audit expert system' },
];

export const DEMO_DEFAULTS_BY_SLUG: Readonly<Record<string, DemoDefault>> = Object.fromEntries(
  DEMO_ACCESS_DEFAULTS.map((d) => [d.slug, d]),
);

/** ¿Es una demo conocida (una carpeta de src/app/demo)? */
export function isKnownDemoSlug(slug: string | null | undefined): slug is string {
  return !!slug && Object.prototype.hasOwnProperty.call(DEMO_DEFAULTS_BY_SLUG, slug);
}

/** Modo de acceso por defecto (semilla) de una demo, o null si no existe. */
export function defaultAccessMode(slug: string): DemoAccessMode | null {
  return DEMO_DEFAULTS_BY_SLUG[slug]?.accessMode ?? null;
}

/** Demos abiertas según la semilla (las que se listan en el sitemap). */
export const PUBLIC_DEMO_SLUGS: readonly string[] = DEMO_ACCESS_DEFAULTS.filter((d) => d.accessMode === 'publico').map((d) => d.slug);

/** Slugs válidos en una URL (?demos=a,b): minúsculas, números y guiones. */
export const DEMO_SLUG_PATTERN = /^[a-z0-9-]{2,60}$/;
