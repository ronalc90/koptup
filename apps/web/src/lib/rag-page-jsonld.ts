/**
 * JSON-LD de /rag: `FAQPage` con las 8 preguntas frecuentes de la página.
 *
 * Se arma con los textos en español de `messages/offerings/_rag-page.es.json`
 * (los mismos que se ven en la sección "Preguntas frecuentes") y con los
 * precios y plazos de `rag-plans.ts`, para que el marcado coincida siempre
 * con el contenido visible. El `Service` con los planes como `Offer` sale de
 * `rag-plans-jsonld.ts`.
 *
 * Solo para componentes de servidor: importa el JSON de mensajes.
 */
import ragPageMessagesEs from '../../messages/offerings/_rag-page.es.json';
import { RAG_FAQ_KEYS, fillPlaceholders, getRagFaqValues, type RagFaqKey } from './rag-page';

interface RagFaqText {
  q: string;
  a: string;
}

const FAQ = (ragPageMessagesEs as unknown as {
  ragPage: { faq: { items: Record<RagFaqKey, RagFaqText> } };
}).ragPage.faq.items;

/** `FAQPage` con las preguntas y respuestas de /rag (en español). */
export function getRagFaqJsonLd() {
  const values = getRagFaqValues('es');
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: RAG_FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: FAQ[key].q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: fillPlaceholders(FAQ[key].a, values),
      },
    })),
  };
}
