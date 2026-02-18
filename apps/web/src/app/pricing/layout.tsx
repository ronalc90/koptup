import { Metadata } from 'next';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('pricing');

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Precios', url: '/pricing' },
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
