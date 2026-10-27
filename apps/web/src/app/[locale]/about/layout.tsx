import { Metadata } from 'next';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('about', await getLocale());
}

export default async function AboutLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Sin esto, getTranslations leería el idioma de las cabeceras y la ruta sería dinámica.
  setRequestLocale(locale);
  const t = await getTranslations('aboutPage');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbAbout'), url: '/about' },
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
