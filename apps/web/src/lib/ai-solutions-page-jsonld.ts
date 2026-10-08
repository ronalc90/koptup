/**
 * JSON-LD de /soluciones-ia:
 *  - `Service` "Soluciones de IA para empresas" con un `OfferCatalog` de las
 *    soluciones en el orden de la página (sistemas RAG primero, con su URL y
 *    sus planes resumidos en un `AggregateOffer` en COP que apunta a
 *    /services#planes-rag). Las demás soluciones no llevan precio: se cotizan
 *    según el alcance;
 *  - `FAQPage` con las mismas preguntas y respuestas de la sección visible.
 *
 * Se arma con los textos en español de
 * `messages/offerings/_ai-solutions-page.es.json` y con los precios y plazos de
 * `rag-plans.ts`, para que el marcado coincida siempre con el contenido.
 *
 * Solo para componentes de servidor: importa el JSON de mensajes.
 */
import aiSolutionsMessagesEs from '../../messages/offerings/_ai-solutions-page.es.json';
import {
  AI_SOLUTIONS,
  AI_SOLUTIONS_FAQ_KEYS,
  AI_SOLUTIONS_PATH,
  getAiSolutionsPageValues,
  type AiSolutionsFaqKey,
} from './ai-solutions-page';
import { fillPlaceholders } from './rag-page';
import { RAG_PLANS, RAG_PLANS_PATH } from './rag-plans';
import { SITE_NAME, SITE_URL, absoluteUrl } from './site';

interface FaqText {
  q: string;
  a: string;
}

const TEXT = (aiSolutionsMessagesEs as unknown as {
  aiSolutionsPage: {
    hero: { title: string; subtitle: string };
    solutions: { title: string; items: Record<string, { title: string; desc: string }> };
    faq: { items: Record<AiSolutionsFaqKey, FaqText> };
  };
}).aiSolutionsPage;

/** `Service` con las soluciones de IA como `OfferCatalog` (RAG primero). */
export function getAiSolutionsServiceJsonLd() {
  const values = getAiSolutionsPageValues('es');
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Soluciones de Inteligencia Artificial para Empresas',
    serviceType: 'Artificial Intelligence Implementation',
    description: TEXT.hero.subtitle,
    url: absoluteUrl(AI_SOLUTIONS_PATH),
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: ['Colombia', 'Latinoamérica'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: TEXT.solutions.title,
      itemListElement: AI_SOLUTIONS.map(({ key, href }) => {
        const item = TEXT.solutions.items[key];
        const service = {
          '@type': 'Service',
          name: item.title,
          description: fillPlaceholders(item.desc, values),
          ...(href ? { url: absoluteUrl(href) } : {}),
        };
        if (key === 'rag') {
          // Única solución con precios publicados: los planes RAG.
          return {
            '@type': 'AggregateOffer',
            itemOffered: service,
            lowPrice: String(Math.min(...RAG_PLANS.map((p) => p.setup.cop))),
            priceCurrency: 'COP',
            offerCount: String(RAG_PLANS.length),
            url: absoluteUrl(RAG_PLANS_PATH),
          };
        }
        return { '@type': 'Offer', itemOffered: service };
      }),
    },
  };
}

/** `FAQPage` con las preguntas y respuestas de /soluciones-ia (en español). */
export function getAiSolutionsFaqJsonLd() {
  const values = getAiSolutionsPageValues('es');
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: AI_SOLUTIONS_FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: TEXT.faq.items[key].q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: fillPlaceholders(TEXT.faq.items[key].a, values),
      },
    })),
  };
}
