import type { Metadata } from 'next';
import RagPageContent from '@/components/rag/RagPageContent';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getRagServiceJsonLd } from '@/lib/rag-plans-jsonld';
import { getRagFaqJsonLd } from '@/lib/rag-page-jsonld';
import { RAG_PAGE_PLANS_ANCHOR, RAG_PATH } from '@/lib/rag-page';
import { absoluteUrl } from '@/lib/site';

/**
 * /rag — página principal de sistemas RAG.
 *
 * El `<title>` es absoluto (texto literal de la especificación, ya con la
 * marca): no pasa por la plantilla "%s | KopTup". Description, canonical y
 * og/twitter salen de `seoConfig.rag`.
 */
export const metadata: Metadata = {
  ...generateMetadata('rag'),
  title: { absolute: 'Sistemas RAG para empresas en Colombia | KopTup' },
};

// JSON-LD (se renderiza en el servidor): Service con cada plan como Offer
// (misma tabla visible en #planes-rag), FAQPage con las 8 preguntas de la
// página y breadcrumb.
const serviceSchema = getRagServiceJsonLd(
  absoluteUrl(RAG_PATH),
  absoluteUrl(`${RAG_PATH}#${RAG_PAGE_PLANS_ANCHOR}`),
);
const faqSchema = getRagFaqJsonLd();
const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Inicio', url: '/' },
  { name: 'Sistemas RAG', url: RAG_PATH },
]);

export default function RagPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <RagPageContent />
    </>
  );
}
