import { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('about', await getLocale());
}

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
