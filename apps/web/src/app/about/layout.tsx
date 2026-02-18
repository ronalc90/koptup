import { Metadata } from 'next';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('about');

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Nosotros', url: '/about' },
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
