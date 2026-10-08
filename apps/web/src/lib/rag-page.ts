/**
 * Datos compartidos de la página /rag y de sus landings por sector
 * (/rag/salud, /rag/legal, /rag/soporte).
 *
 * Los textos visibles viven en `messages/offerings/_rag-page.{es,en}.json`:
 *  - namespace `ragPage`: secciones de /rag (incluidas las 8 preguntas
 *    frecuentes, que también alimentan el JSON-LD FAQPage);
 *  - namespace `ragSectors`: contenido de cada landing por sector.
 *
 * Los precios y plazos que citan las preguntas frecuentes salen de
 * `rag-plans.ts` (`getRagFaqValues`), para que nunca contradigan la tabla de
 * planes.
 */
import { RAG_EXTRA_QUESTION_PRICE, formatRagCOP, formatRagUSD, getRagPlan } from './rag-plans';

/** Ruta de la página principal de sistemas RAG. */
export const RAG_PATH = '/rag';

/** Ancla de la tabla de planes dentro de /rag (`/rag#planes-rag`). */
export const RAG_PAGE_PLANS_ANCHOR = 'planes-rag';

/** Demo del chatbot RAG ("Prueba con tu documento"). */
export const RAG_DEMO_PATH = '/demo/chatbot';

/** Destino de "Agenda un piloto". */
export const RAG_PILOT_CONTACT_PATH = '/contact';

/**
 * Demo de auditoría de cuentas médicas, presentada como "Sistema experto para
 * salud" (no como caso RAG: no usa embeddings ni búsqueda vectorial). Enlazada
 * desde /rag/salud y desde las demos destacadas de la home.
 */
export const MEDICAL_ACCOUNTS_DEMO_PATH = '/demo/cuentas-medicas';

export type RagSectorId = 'salud' | 'legal' | 'soporte';

export interface RagSector {
  id: RagSectorId;
  /** Ruta de la landing; su metadata está en `seoConfig['rag-<id>']`. */
  path: string;
  /**
   * Demo relacionada, enlazada desde uno de los casos de uso
   * (`caseIndex`, base 0) con el texto `ragSectors.<id>.demoLink`.
   */
  demo?: { path: string; caseIndex: number };
  /** La landing muestra la nota `ragSectors.<id>.disclaimer`. */
  hasDisclaimer: boolean;
}

/** Landings por sector, en el orden en que aparecen en /rag. */
export const RAG_SECTORS: readonly RagSector[] = [
  {
    id: 'salud',
    path: '/rag/salud',
    // Caso "Auditoría de cuentas médicas" → demo "Sistema experto para salud".
    demo: { path: MEDICAL_ACCOUNTS_DEMO_PATH, caseIndex: 2 },
    hasDisclaimer: true,
  },
  { id: 'legal', path: '/rag/legal', hasDisclaimer: true },
  { id: 'soporte', path: '/rag/soporte', hasDisclaimer: false },
];

export function getRagSector(id: RagSectorId): RagSector {
  const sector = RAG_SECTORS.find((s) => s.id === id);
  if (!sector) throw new Error(`Sector RAG desconocido: ${id}`);
  return sector;
}

/** Claves de las 8 preguntas frecuentes de /rag, en orden (`ragPage.faq.items.<clave>`). */
export const RAG_FAQ_KEYS = [
  'whatIsRag',
  'vsChatgpt',
  'training',
  'notFound',
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

  return {
    pilotPrice: copAndUsd(pilot.setup, locale),
    pilotWeeks: String(pilot.weeks.max),
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
