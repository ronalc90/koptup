/**
 * Datos compartidos de /soluciones-ia ("Soluciones de IA para empresas").
 *
 * Los textos visibles viven en `messages/offerings/_ai-solutions-page.{es,en}.json`
 * (namespace `aiSolutionsPage`). Las preguntas frecuentes alimentan también el
 * JSON-LD FAQPage (`ai-solutions-page-jsonld.ts`), y los precios y plazos que
 * citan salen de `rag-plans.ts` (vía `getRagFaqValues`), para que nunca
 * contradigan la tabla de planes de /services#planes-rag.
 */
import { CHATBOTS_PATH } from './chatbots-page';
import { RAG_PATH, getRagFaqValues } from './rag-page';

/** Ruta de la página. */
export const AI_SOLUTIONS_PATH = '/soluciones-ia';

/**
 * Soluciones, en orden (`aiSolutionsPage.solutions.items.<clave>`). Los
 * sistemas RAG van primero (producto principal) y, como los chatbots, enlazan
 * a su página con `aiSolutionsPage.solutions.items.<clave>.link`.
 */
export const AI_SOLUTIONS: readonly { key: string; href?: string }[] = [
  { key: 'rag', href: RAG_PATH },
  { key: 'chatbots', href: CHATBOTS_PATH },
  { key: 'automation' },
  { key: 'predictive' },
  { key: 'documents' },
  { key: 'expert' },
  { key: 'content' },
];

/** Claves de las preguntas frecuentes, en orden (`aiSolutionsPage.faq.items.<clave>`). */
export const AI_SOLUTIONS_FAQ_KEYS = ['solutions', 'cost', 'howTo', 'whoBenefits'] as const;

export type AiSolutionsFaqKey = (typeof AI_SOLUTIONS_FAQ_KEYS)[number];

/** Valores de los marcadores `{…}` de la página (precios y semanas de los planes RAG). */
export function getAiSolutionsPageValues(locale = 'es'): Record<string, string> {
  return getRagFaqValues(locale);
}
