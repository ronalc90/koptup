import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: la entrada compartida de seo-config para esta ruta habla de
 * "scraping a escala" y "rotación de proxies", que la demo no muestra. Aquí se
 * describe lo que la demo hace de verdad (fuentes de ejemplo, constructor con
 * clic sobre tiendas ficticias, cambios detectados, alertas, CSV y ficha legal).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoScraping.meta');
  const base = metadataBase('demo-scraping');
  const plantilla =
    base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template ? base.title.template : '%s';
  const titulo = t('seoTitle');
  const descripcion = t('seoDescription');
  const tituloCompleto = plantilla.replace('%s', titulo);
  return {
    ...base,
    title: { default: titulo, template: plantilla },
    description: descripcion,
    openGraph: {
      ...base.openGraph,
      title: tituloCompleto,
      description: descripcion,
      images: Array.isArray(base.openGraph?.images)
        ? base.openGraph.images.map((img) => (typeof img === 'object' && img !== null && 'url' in img ? { ...img, alt: tituloCompleto } : img))
        : base.openGraph?.images,
    },
    twitter: { ...base.twitter, title: tituloCompleto, description: descripcion },
  };
}

export default async function ScrapingLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('demoScraping.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('title'), url: '/demo/scraping' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
