import { Metadata } from 'next';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('terms');

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Términos y Condiciones', url: '/terms' },
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
