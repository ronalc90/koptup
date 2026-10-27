import { Metadata } from 'next';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('demo-firma-electronica', await getLocale());
}

export default function FirmaElectronicaLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', nameEn: 'Home', url: '/' },
    { name: 'Demos', nameEn: 'Demos', url: '/demo' },
    { name: 'Firma Electrónica', nameEn: 'Electronic signature', url: '/demo/firma-electronica' },
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
