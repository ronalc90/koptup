import { Metadata } from 'next';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-transporte-carga');

interface LayoutProps {
  children: React.ReactNode;
}

export default function TransporteCargaLayout({ children }: LayoutProps) {
  // Schema breadcrumb para SEO - URL dinámica generada desde la configuración
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Transporte de Carga', url: '/demo/transporte-carga' },
  ]);

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
