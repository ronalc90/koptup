import type { Metadata } from 'next';
import RagSectorLanding from '@/components/rag/RagSectorLanding';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';
import { RAG_PATH, getRagSector } from '@/lib/rag-page';

/** /rag/legal — landing corta del sector (H1, 3 casos de uso, enlace a /rag y CTA). */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('rag-legal', await getLocale());
}

const breadcrumbSchema = getBreadcrumbSchema([
  { name: 'Inicio', url: '/' },
  { name: 'Sistemas RAG', url: RAG_PATH },
  { name: 'Legal', url: getRagSector('legal').path },
]);

export default function RagLegalPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <RagSectorLanding sectorId="legal" />
    </>
  );
}
