import type { Metadata } from 'next';
import RagSectorLanding from '@/components/rag/RagSectorLanding';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { RAG_PATH, getRagSector } from '@/lib/rag-page';

/** /rag/soporte — landing corta del sector (H1, 3 casos de uso, enlace a /rag y CTA). */
export const metadata: Metadata = generateMetadata('rag-soporte');

const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Inicio', url: '/' },
  { name: 'Sistemas RAG', url: RAG_PATH },
  { name: 'Soporte', url: getRagSector('soporte').path },
]);

export default function RagSoportePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <RagSectorLanding sectorId="soporte" />
    </>
  );
}
