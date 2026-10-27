import { Metadata } from 'next';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('demo-moderacion-contenido', await getLocale());
}

export default function ModeracionContenidoLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', nameEn: 'Home', url: '/' },
    { name: 'Demos', nameEn: 'Demos', url: '/demo' },
    { name: 'Moderación de contenido con IA', nameEn: 'AI content moderation', url: '/demo/moderacion-contenido' },
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
