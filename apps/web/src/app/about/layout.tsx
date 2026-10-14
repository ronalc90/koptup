import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('about');

export default async function AboutLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('aboutPage');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbAbout'), url: '/about' },
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
