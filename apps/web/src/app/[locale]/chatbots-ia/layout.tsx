import type { Metadata } from 'next';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';
import { CHATBOTS_PATH } from '@/lib/chatbots-page';
import { getChatbotsFaqJsonLd, getChatbotsServiceJsonLd } from '@/lib/chatbots-page-jsonld';

/**
 * /chatbots-ia — "Chatbots RAG para WhatsApp y web".
 *
 * Title, description, canonical y og/twitter salen de `seoConfig['chatbots-ia']`
 * (precios derivados de `rag-plans.ts`).
 */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('chatbots-ia', await getLocale());
}

// JSON-LD (se renderiza en el servidor): Service con los planes RAG como
// AggregateOffer, FAQPage con las mismas preguntas de la página y breadcrumb.
const serviceSchema = getChatbotsServiceJsonLd();
const faqSchema = getChatbotsFaqJsonLd();

export default async function ChatbotsIALayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', nameEn: 'Home', url: '/' },
    { name: 'Chatbots RAG para WhatsApp y web', nameEn: 'RAG chatbots for WhatsApp and web', url: CHATBOTS_PATH },
  ], locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
