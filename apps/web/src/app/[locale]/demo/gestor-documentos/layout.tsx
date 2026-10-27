import { Metadata } from 'next';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('demo-gestor-documentos', await getLocale());
}

export default async function GestorDocumentosLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', nameEn: 'Home', url: '/' },
    { name: 'Demos', nameEn: 'Demos', url: '/demo' },
    { name: 'Gestor documental con IA', nameEn: 'AI document manager', url: '/demo/gestor-documentos' },
  ], locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
