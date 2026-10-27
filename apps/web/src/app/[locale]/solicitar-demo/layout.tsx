import { Metadata } from 'next';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('solicitar-demo', await getLocale());
}

export default function SolicitarDemoLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', nameEn: 'Home', url: '/' },
    { name: 'Solicitar demo', nameEn: 'Request a demo', url: '/solicitar-demo' },
  ], locale);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
