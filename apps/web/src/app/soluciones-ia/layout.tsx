import type { Metadata } from 'next';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { AI_SOLUTIONS_PATH } from '@/lib/ai-solutions-page';
import { getAiSolutionsFaqJsonLd, getAiSolutionsServiceJsonLd } from '@/lib/ai-solutions-page-jsonld';

/**
 * /soluciones-ia — "Soluciones de IA para empresas", con los sistemas RAG como
 * primera solución.
 *
 * Title, description, canonical y og/twitter salen de `seoConfig['soluciones-ia']`.
 */
export const metadata: Metadata = generateMetadata('soluciones-ia');

// JSON-LD (se renderiza en el servidor): Service con las soluciones como
// OfferCatalog (RAG primero, con sus planes), FAQPage con las mismas preguntas
// de la página y breadcrumb.
const serviceSchema = getAiSolutionsServiceJsonLd();
const faqSchema = getAiSolutionsFaqJsonLd();
const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Inicio', url: '/' },
  { name: 'Soluciones de IA', url: AI_SOLUTIONS_PATH },
]);

export default function SolucionesIALayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
