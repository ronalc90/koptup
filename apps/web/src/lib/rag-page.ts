/**
 * Datos compartidos de la página /rag y de sus landings por sector
 * (/rag/salud, /rag/legal, /rag/soporte).
 *
 * Los textos visibles viven en `messages/offerings/_rag-page.{es,en}.json`:
 *  - namespace `ragPage`: secciones de /rag (incluidas las preguntas
 *    frecuentes de `RAG_FAQ_KEYS`, que también alimentan el JSON-LD FAQPage);
 *  - namespace `ragSectors`: contenido de cada landing por sector.
 *
 * Los precios y plazos que citan las preguntas frecuentes salen de
 * `rag-plans.ts` (`getRagFaqValues`), para que nunca contradigan la tabla de
 * planes.
 */
import {
  RAG_EXTRA_QUESTION_PRICE,
  formatRagCOP,
  formatRagUSD,
  RAG_SERVICE_SLUG,
  getRagPlan,
  ragFirstYearCop,
  ragPlanContactHref,
  withRagVat,
} from './rag-plans';

/** Ruta de la página principal de sistemas RAG. */
export const RAG_PATH = '/rag';

/** Ancla de la tabla de planes dentro de /rag (`/rag#planes-rag`). */
export const RAG_PAGE_PLANS_ANCHOR = 'planes-rag';

/** Demo del chatbot RAG (abre en "Prueba el asistente", con documentos de ejemplo). */
export const RAG_DEMO_PATH = '/demo/chatbot';

/**
 * Demo del chatbot RAG en la pestaña "Prueba con tu documento" (subida de un
 * documento propio). Es el destino de los botones "Prueba con tu documento"
 * de /rag, de las landings por sector y de /chatbots-ia; la demo lee `?mode=`
 * al cargar (app/demo/chatbot/page.tsx).
 */
export const RAG_UPLOAD_DEMO_PATH = `${RAG_DEMO_PATH}?mode=upload`;

/**
 * Empresa ficticia de "Prueba el asistente" que abre cada landing por sector
 * (`/demo/chatbot?empresa=<clave>`; la demo valida la clave con
 * `isSampleCompanyKey` de app/demo/chatbot/components/sampleKnowledge.ts).
 */
export type RagDemoCompany = 'rrhh' | 'tienda' | 'salud' | 'legal';

/** Demo "Prueba el asistente" con una empresa de ejemplo ya elegida. */
export function ragSampleDemoPath(company: RagDemoCompany): string {
  return `${RAG_DEMO_PATH}?empresa=${company}`;
}

/** Formulario para pedir una demo con acceso controlado, con la demo ya elegida. */
export function demoRequestPath(slug: string): string {
  return `/solicitar-demo?demos=${encodeURIComponent(slug)}`;
}

/**
 * Destino de "Cotizar el piloto": /contact con el servicio y el plan piloto ya
 * elegidos (el lead llega con `cotizacion.plan` y generate_lead con plan_id),
 * igual que en /chatbots-ia.
 */
export const RAG_PILOT_CONTACT_PATH = ragPlanContactHref('piloto');

/**
 * Destino de "Pedir una demo guiada" de la demo RAG: /contact con el servicio
 * "Sistema RAG" y el mensaje "quiero ver una demo guiada con mi caso" ya
 * escritos (la demo del chatbot es abierta: no se pide por /solicitar-demo).
 */
export const RAG_GUIDED_DEMO_PATH = `/contact?service=${RAG_SERVICE_SLUG}&motivo=demo-guiada`;

/**
 * Demo de auditoría de cuentas médicas, presentada como "Sistema experto para
 * salud" (no como caso RAG: no usa embeddings ni búsqueda vectorial). Enlazada
 * desde /rag/salud y desde las demos destacadas de la home. Se abre solo con
 * invitación (modo `privado` en el catálogo): mientras no sea abierta,
 * /rag/salud enlaza el formulario para pedirla (`demoRequestPath`) y no la
 * pantalla de acceso.
 */
export const MEDICAL_ACCOUNTS_DEMO_PATH = '/demo/cuentas-medicas';

export type RagSectorId = 'salud' | 'legal' | 'soporte';

export interface RagSector {
  id: RagSectorId;
  /** Ruta de la landing; su metadata está en `seoConfig['rag-<id>']`. */
  path: string;
  /**
   * Empresa de ejemplo de la demo que abre el botón principal de la landing
   * ("Probar la demo con …") y de la que salen el "Ejemplo ilustrativo" y la
   * pregunta sugerida (`ragSectors.<id>.example`).
   */
  demoCompany: RagDemoCompany;
  /**
   * Otro producto relacionado (no RAG), presentado en un bloque aparte con
   * los textos `ragSectors.<id>.related`: hoy, en salud, el "Sistema experto
   * para salud" (auditoría de cuentas médicas con reglas).
   */
  relatedDemoPath?: string;
  /** La landing muestra la nota `ragSectors.<id>.disclaimer`. */
  hasDisclaimer: boolean;
}

/** Landings por sector, en el orden en que aparecen en /rag. */
export const RAG_SECTORS: readonly RagSector[] = [
  {
    id: 'salud',
    path: '/rag/salud',
    demoCompany: 'salud',
    // Bloque aparte: "Sistema experto para salud" (otro producto, con invitación).
    relatedDemoPath: MEDICAL_ACCOUNTS_DEMO_PATH,
    hasDisclaimer: true,
  },
  { id: 'legal', path: '/rag/legal', demoCompany: 'legal', hasDisclaimer: true },
  { id: 'soporte', path: '/rag/soporte', demoCompany: 'tienda', hasDisclaimer: false },
];

export function getRagSector(id: RagSectorId): RagSector {
  const sector = RAG_SECTORS.find((s) => s.id === id);
  if (!sector) throw new Error(`Sector RAG desconocido: ${id}`);
  return sector;
}

/** Claves de las preguntas frecuentes de /rag, en orden (`ragPage.faq.items.<clave>`). */
export const RAG_FAQ_KEYS = [
  'whatIsRag',
  'vsChatgpt',
  'training',
  'notFound',
  'synonyms',
  'pilotInput',
  'formats',
  'whatsapp',
  'cost',
  'time',
] as const;

export type RagFaqKey = (typeof RAG_FAQ_KEYS)[number];

/** "COP 3.900.000 (USD 1.200)" según el idioma. */
function copAndUsd(price: { cop: number; usd: number }, locale: string): string {
  return `${formatRagCOP(price.cop, locale)} (${formatRagUSD(price.usd, locale)})`;
}

/**
 * Valores de los marcadores `{…}` de las respuestas "¿Cuánto cuesta?" y
 * "¿Cuánto tarda?" (y de otros textos de /rag que citan precios o plazos).
 */
export function getRagFaqValues(locale = 'es'): Record<string, string> {
  const pilot = getRagPlan('piloto');
  const essential = getRagPlan('esencial');
  const pro = getRagPlan('profesional');
  const enterprise = getRagPlan('empresarial');

  const essentialYear = ragFirstYearCop(essential);
  const proYear = ragFirstYearCop(pro);

  return {
    pilotPrice: copAndUsd(pilot.setup, locale),
    pilotPriceVat: formatRagCOP(withRagVat(pilot.setup.cop), locale),
    pilotWeeks: String(pilot.weeks.max),
    essentialFirstYear: essentialYear !== null ? formatRagCOP(essentialYear, locale) : '',
    proFirstYear: proYear !== null ? formatRagCOP(proYear, locale) : '',
    essentialSetup: copAndUsd(essential.setup, locale),
    essentialMonthly: essential.monthly ? copAndUsd(essential.monthly, locale) : '',
    essentialWeeks: `${essential.weeks.min}–${essential.weeks.max}`,
    proSetup: copAndUsd(pro.setup, locale),
    proMonthly: pro.monthly ? copAndUsd(pro.monthly, locale) : '',
    proWeeks: `${pro.weeks.min}–${pro.weeks.max}`,
    enterpriseSetup: copAndUsd(enterprise.setup, locale),
    enterpriseWeeks: `${enterprise.weeks.min}–${enterprise.weeks.max}`,
    extraQuestion: copAndUsd(RAG_EXTRA_QUESTION_PRICE, locale),
  };
}

/**
 * Reemplaza marcadores simples `{nombre}` (sin sintaxis ICU) fuera de
 * next-intl, p. ej. al armar el JSON-LD en el servidor.
 */
export function fillPlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? values[name] : match,
  );
}
