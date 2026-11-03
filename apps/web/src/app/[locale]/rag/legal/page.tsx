import type { Metadata } from 'next';
import RagSectorLanding from '@/components/rag/RagSectorLanding';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';
import { RAG_PATH, getRagSector } from '@/lib/rag-page';

/** /rag/legal — landing corta del sector (H1, 3 casos de uso, enlace a /rag y CTA). */
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('rag-legal', await getLocale());
}

export default async function RagLegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', nameEn: 'Home', url: '/' },
    { name: 'Sistemas RAG', nameEn: 'RAG systems', url: RAG_PATH },
    { name: 'Legal', nameEn: 'Legal', url: getRagSector('legal').path },
  ], locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <RagSectorLanding sectorId="legal" />
    </>
  );
}
