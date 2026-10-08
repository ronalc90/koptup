import type { Metadata } from 'next';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { CHATBOTS_PATH } from '@/lib/chatbots-page';
import { getChatbotsFaqJsonLd, getChatbotsServiceJsonLd } from '@/lib/chatbots-page-jsonld';

/**
 * /chatbots-ia — "Chatbots RAG para WhatsApp y web".
 *
 * Title, description, canonical y og/twitter salen de `seoConfig['chatbots-ia']`
 * (precios derivados de `rag-plans.ts`).
 */
export const metadata: Metadata = generateMetadata('chatbots-ia');

// JSON-LD (se renderiza en el servidor): Service con los planes RAG como
// AggregateOffer, FAQPage con las mismas preguntas de la página y breadcrumb.
const serviceSchema = getChatbotsServiceJsonLd();
const faqSchema = getChatbotsFaqJsonLd();
const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Inicio', url: '/' },
  { name: 'Chatbots RAG para WhatsApp y web', url: CHATBOTS_PATH },
]);

export default function ChatbotsIALayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
