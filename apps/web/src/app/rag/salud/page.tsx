import type { Metadata } from 'next';
import RagSectorLanding from '@/components/rag/RagSectorLanding';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { RAG_PATH, getRagSector } from '@/lib/rag-page';

/** /rag/salud — landing corta del sector (H1, 3 casos de uso, enlace a /rag y CTA). */
export const metadata: Metadata = generateMetadata('rag-salud');

const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Inicio', url: '/' },
  { name: 'Sistemas RAG', url: RAG_PATH },
  { name: 'Salud', url: getRagSector('salud').path },
]);

export default function RagSaludPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <RagSectorLanding sectorId="salud" />
    </>
  );
}
