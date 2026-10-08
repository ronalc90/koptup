/**
 * JSON-LD de /chatbots-ia ("Chatbots RAG para WhatsApp y web"):
 *  - `Service` con los planes RAG resumidos en un `AggregateOffer` en COP
 *    (desde el piloto; sin highPrice porque Empresarial es "desde"), que apunta
 *    a la tabla de /services#planes-rag;
 *  - `FAQPage` con las mismas preguntas y respuestas de la sección visible.
 *
 * Se arma con los textos en español de
 * `messages/offerings/_chatbots-page.es.json` y con los precios y plazos de
 * `rag-plans.ts`, para que el marcado coincida siempre con el contenido.
 *
 * Solo para componentes de servidor: importa el JSON de mensajes.
 */
import chatbotsMessagesEs from '../../messages/offerings/_chatbots-page.es.json';
import { CHATBOTS_FAQ_KEYS, CHATBOTS_PATH, getChatbotsPageValues, type ChatbotsFaqKey } from './chatbots-page';
import { fillPlaceholders } from './rag-page';
import { RAG_PLANS, RAG_PLANS_PATH } from './rag-plans';
import { SITE_NAME, SITE_URL, absoluteUrl } from './site';

interface FaqText {
  q: string;
  a: string;
}

const TEXT = (chatbotsMessagesEs as unknown as {
  chatbotsPage: { hero: { title: string; subtitle: string }; faq: { items: Record<ChatbotsFaqKey, FaqText> } };
}).chatbotsPage;

/** `Service` "Chatbots RAG para WhatsApp y web" con los planes RAG como `AggregateOffer`. */
export function getChatbotsServiceJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: TEXT.hero.title,
    serviceType: 'Chatbot RAG (retrieval augmented generation)',
    description: TEXT.hero.subtitle,
    url: absoluteUrl(CHATBOTS_PATH),
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: String(Math.min(...RAG_PLANS.map((p) => p.setup.cop))),
      priceCurrency: 'COP',
      offerCount: String(RAG_PLANS.length),
      url: absoluteUrl(RAG_PLANS_PATH),
    },
  };
}

/** `FAQPage` con las preguntas y respuestas de /chatbots-ia (en español). */
export function getChatbotsFaqJsonLd() {
  const values = getChatbotsPageValues('es');
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: CHATBOTS_FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: TEXT.faq.items[key].q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: fillPlaceholders(TEXT.faq.items[key].a, values),
      },
    })),
  };
}
