/**
 * Semilla del catálogo de demos: una entrada por cada carpeta de
 * apps/web/src/app/demo/<slug> (28). El modo de acceso inicial sale de
 * `DEFAULT_DEMO_ACCESS_MODES` (middleware/access.ts), que es la misma tabla que
 * usa el respaldo cuando la BD no tiene el registro.
 *
 * services/demo-catalog.service.ts la inserta al arrancar con `$setOnInsert`:
 * nunca pisa lo que el admin cambie desde el panel (modo, activo, vigencia,
 * orden o nombre).
 */
import { DEFAULT_DEMO_ACCESS_MODES, type DemoAccessMode } from '../middleware/access';
import { DEFAULT_GRANT_DAYS } from '../config/demos';

export interface DemoCatalogSeedItem {
  slug: string;
  nombre: string;
  nombreEn: string;
  accessMode: DemoAccessMode;
  activo: boolean;
  duracionDiasPorDefecto: number;
  orden: number;
}

const NAMES: ReadonlyArray<[slug: string, es: string, en: string]> = [
  // publico
  ['chatbot', 'Chatbot RAG con tus documentos', 'RAG chatbot over your documents'],
  ['code-review-ia', 'Revisión de código con IA', 'AI code review'],
  ['crm-ia', 'CRM con IA', 'AI-powered CRM'],
  ['helpdesk-ia', 'Mesa de ayuda con IA', 'AI help desk'],
  ['facturacion-electronica', 'Facturación electrónica', 'E-invoicing'],
  ['pos', 'Punto de venta (POS)', 'Point of sale (POS)'],
  ['ecommerce', 'Tienda en línea', 'Online store'],
  ['loyalty', 'Programa de fidelización', 'Loyalty program'],
  ['control-proyectos', 'Gestión de proyectos', 'Project management'],
  ['sistema-reservas', 'Sistema de reservas', 'Booking system'],
  ['dashboard-ejecutivo', 'Dashboard ejecutivo', 'Executive dashboard'],
  ['gestor-documentos', 'Gestor documental', 'Document manager'],
  ['gestor-contenido', 'Gestor de contenido', 'Content manager'],
  ['automatizacion', 'Automatización de procesos', 'Workflow automation'],
  ['scraping', 'Extracción de datos web', 'Web data extraction'],
  ['moderacion-contenido', 'Moderación de contenido con IA', 'AI content moderation'],
  ['saas-boilerplate', 'Plataforma SaaS multiempresa', 'Multi-tenant SaaS platform'],
  ['firma-electronica', 'Firma electrónica', 'E-signature'],
  // solicitud
  ['voice-ai', 'Voz con IA para call center', 'Voice AI for call centers'],
  ['erp', 'ERP modular', 'Modular ERP'],
  ['delivery', 'App de domicilios', 'Delivery app'],
  ['hrms', 'Gestión de talento humano (HRMS)', 'HR management (HRMS)'],
  ['lms', 'Plataforma de aprendizaje (LMS)', 'Learning platform (LMS)'],
  ['telemedicina', 'Telemedicina', 'Telemedicine'],
  ['wms-logistica', 'Logística y bodegas (WMS)', 'Warehouse and logistics (WMS)'],
  ['linkedin-ads', 'Generador de contenido para LinkedIn con IA', 'AI LinkedIn content generator'],
  // privado
  ['cuentas-medicas', 'Sistema experto para salud (cuentas médicas)', 'Healthcare expert system (medical claims)'],
  ['sistema-experto', 'Sistema experto de auditoría médica', 'Medical audit expert system'],
];

export const DEMO_CATALOG_SEED: readonly DemoCatalogSeedItem[] = NAMES.map(([slug, nombre, nombreEn], i) => {
  const accessMode = DEFAULT_DEMO_ACCESS_MODES[slug];
  if (!accessMode) throw new Error(`demo-catalog.seed: la demo ${slug} no tiene modo por defecto`);
  return {
    slug,
    nombre,
    nombreEn,
    accessMode,
    activo: true,
    duracionDiasPorDefecto: DEFAULT_GRANT_DAYS,
    orden: (i + 1) * 10,
  };
});

/** Nombre legible por slug (respaldo cuando la BD no tiene el registro). */
export const DEMO_SEED_BY_SLUG: Readonly<Record<string, DemoCatalogSeedItem>> = Object.fromEntries(
  DEMO_CATALOG_SEED.map((item) => [item.slug, item]),
);
