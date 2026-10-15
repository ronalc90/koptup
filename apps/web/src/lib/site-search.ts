import { DEMOS_VISIBLES } from '@/lib/demo-showcase';

/**
 * Índice del buscador del menú. Solo páginas públicas y demos visibles
 * (`DEMOS_VISIBLES`): las demos ocultas no aparecen en ningún listado.
 */
export interface SearchEntry {
  href: string;
  es: string;
  en: string;
  /** Palabras extra para encontrar la entrada (sin tildes). */
  keywords: string;
}

const PAGES: SearchEntry[] = [
  { href: '/rag', es: 'Sistemas RAG: IA con tus documentos', en: 'RAG systems: AI over your documents', keywords: 'rag ia documentos citas planes piloto' },
  { href: '/services', es: 'Planes y servicios', en: 'Plans and services', keywords: 'precios planes servicios cotizar productos' },
  { href: '/chatbots-ia', es: 'Chatbots con IA', en: 'AI chatbots', keywords: 'chatbot whatsapp asistente atencion' },
  { href: '/desarrollo-web-colombia', es: 'Desarrollo web en Colombia', en: 'Web development in Colombia', keywords: 'web sitio paginas tienda' },
  { href: '/demo', es: 'Demos', en: 'Demos', keywords: 'demo prueba ejemplos' },
  { href: '/about', es: 'Nosotros', en: 'About us', keywords: 'empresa quienes somos fundador' },
  { href: '/contact', es: 'Contacto y agenda de 30 minutos', en: 'Contact and 30-minute call', keywords: 'contacto agenda llamada correo cotizacion presupuesto' },
  { href: '/solicitar-demo', es: 'Solicitar demo', en: 'Request a demo', keywords: 'acceso demo privada guiada' },
  { href: '/login', es: 'Iniciar sesión', en: 'Log in', keywords: 'cuenta clientes acceso portal' },
  { href: '/privacy', es: 'Política de privacidad', en: 'Privacy policy', keywords: 'datos personales ley 1581 habeas' },
  { href: '/terms', es: 'Términos y condiciones', en: 'Terms and conditions', keywords: 'condiciones legales uso' },
  { href: '/cookies', es: 'Política de cookies', en: 'Cookie policy', keywords: 'cookies consentimiento medicion' },
];

/** Nombre de cada demo visible, en los dos idiomas. */
const DEMO_NAMES: Record<string, { es: string; en: string }> = {
  chatbot: { es: 'Chatbot con IA (RAG)', en: 'AI chatbot (RAG)' },
  'helpdesk-ia': { es: 'Mesa de ayuda con IA', en: 'AI help desk' },
  'gestor-documentos': { es: 'Gestor de documentos', en: 'Document manager' },
  'dashboard-ejecutivo': { es: 'Dashboard ejecutivo', en: 'Executive dashboard' },
  ecommerce: { es: 'Tienda en línea', en: 'Online store' },
  'crm-ia': { es: 'CRM con IA', en: 'AI CRM' },
  'sistema-reservas': { es: 'Sistema de reservas', en: 'Booking system' },
  pos: { es: 'Punto de venta (POS)', en: 'Point of sale (POS)' },
  loyalty: { es: 'Fidelización de clientes', en: 'Customer loyalty' },
  'control-proyectos': { es: 'Control de proyectos', en: 'Project control' },
  'saas-boilerplate': { es: 'Base SaaS multi-cliente', en: 'Multi-tenant SaaS base' },
  'code-review-ia': { es: 'Revisión de código con IA', en: 'AI code review' },
  'facturacion-electronica': { es: 'Facturación electrónica', en: 'E-invoicing' },
  'firma-electronica': { es: 'Firma electrónica', en: 'E-signature' },
};

const DEMOS: SearchEntry[] = DEMOS_VISIBLES.map((slug) => ({
  href: `/demo/${slug}`,
  es: DEMO_NAMES[slug]?.es ?? slug,
  en: DEMO_NAMES[slug]?.en ?? slug,
  keywords: `demo ${slug.replace(/-/g, ' ')}`,
}));

export const SEARCH_ENTRIES: readonly SearchEntry[] = [...PAGES, ...DEMOS];

/** Minúsculas y sin tildes: «facturación» encuentra «Facturacion». */
export function normalizeSearchText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Entradas que contienen todas las palabras de la búsqueda (en el texto del
 * idioma activo o en sus palabras clave). Sin búsqueda, no devuelve nada.
 */
export function searchSite(query: string, locale: 'es' | 'en', limit = 6): { href: string; label: string }[] {
  const words = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const matches: { href: string; label: string }[] = [];
  for (const entry of SEARCH_ENTRIES) {
    const haystack = normalizeSearchText(`${entry.es} ${entry.en} ${entry.keywords}`);
    if (words.every((word) => haystack.includes(word))) {
      matches.push({ href: entry.href, label: locale === 'en' ? entry.en : entry.es });
      if (matches.length === limit) break;
    }
  }
  return matches;
}
