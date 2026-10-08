/**
 * Datos compartidos de /chatbots-ia ("Chatbots RAG para WhatsApp y web").
 *
 * Los textos visibles viven en `messages/offerings/_chatbots-page.{es,en}.json`
 * (namespace `chatbotsPage`). Las preguntas frecuentes alimentan también el
 * JSON-LD FAQPage (`chatbots-page-jsonld.ts`), y los precios y plazos que citan
 * salen de `rag-plans.ts`, para que nunca contradigan la tabla de planes de
 * /services#planes-rag.
 */
import { formatRagCOP, getRagPlan } from './rag-plans';
import { getRagFaqValues, type RagSectorId } from './rag-page';

/** Ruta de la página. */
export const CHATBOTS_PATH = '/chatbots-ia';

/** Claves de las preguntas frecuentes, en orden (`chatbotsPage.faq.items.<clave>`). */
export const CHATBOTS_FAQ_KEYS = ['cost', 'time', 'whatsapp', 'technology', 'updates', 'notFound'] as const;

export type ChatbotsFaqKey = (typeof CHATBOTS_FAQ_KEYS)[number];

/**
 * Casos de uso, en orden (`chatbotsPage.useCases.items.<clave>`). Los que
 * tienen landing por sector la enlazan con `chatbotsPage.useCases.items.<clave>.link`.
 */
export const CHATBOTS_USE_CASES: readonly { key: string; sector?: RagSectorId }[] = [
  { key: 'customers' },
  { key: 'support', sector: 'soporte' },
  { key: 'health', sector: 'salud' },
  { key: 'legal', sector: 'legal' },
  { key: 'hr' },
  { key: 'education' },
];

/**
 * Valores de los marcadores `{…}` de la página: los de /rag (precios "COP … (USD …)"
 * y semanas por plan) más `essentialFrom` y `pilotFrom`, solo en COP, para la
 * frase "Desde COP 9.900.000, o piloto de COP 3.900.000".
 */
export function getChatbotsPageValues(locale = 'es'): Record<string, string> {
  return {
    ...getRagFaqValues(locale),
    essentialFrom: formatRagCOP(getRagPlan('esencial').setup.cop, locale),
    pilotFrom: formatRagCOP(getRagPlan('piloto').setup.cop, locale),
  };
}
