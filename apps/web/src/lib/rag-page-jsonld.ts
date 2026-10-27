/**
 * JSON-LD de /rag: `FAQPage` con las 8 preguntas frecuentes de la página.
 *
 * Se arma con los textos de `messages/offerings/_rag-page.{es,en}.json` (los
 * mismos que se ven en la sección "Preguntas frecuentes" del idioma de la
 * página) y con los precios y plazos de `rag-plans.ts`, para que el marcado
 * coincida siempre con el contenido visible. El `Service` con los planes como
 * `Offer` sale de `rag-plans-jsonld.ts`.
 *
 * Solo para componentes de servidor: importa el JSON de mensajes.
 */
import ragPageMessagesEn from '../../messages/offerings/_rag-page.en.json';
import ragPageMessagesEs from '../../messages/offerings/_rag-page.es.json';
import { RAG_FAQ_KEYS, fillPlaceholders, getRagFaqValues, type RagFaqKey } from './rag-page';

interface RagFaqText {
  q: string;
  a: string;
}

type RagFaqItems = Record<RagFaqKey, RagFaqText>;

const FAQ_ES = (ragPageMessagesEs as unknown as {
  ragPage: { faq: { items: RagFaqItems } };
}).ragPage.faq.items;

const FAQ_EN = (ragPageMessagesEn as unknown as {
  ragPage: { faq: { items: RagFaqItems } };
}).ragPage.faq.items;

/** `FAQPage` con las preguntas y respuestas de /rag en el idioma `locale`. */
export function getRagFaqJsonLd(locale = 'es') {
  const items = locale === 'en' ? FAQ_EN : FAQ_ES;
  const values = getRagFaqValues(locale);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: RAG_FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: items[key].q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: fillPlaceholders(items[key].a, values),
      },
    })),
  };
}
