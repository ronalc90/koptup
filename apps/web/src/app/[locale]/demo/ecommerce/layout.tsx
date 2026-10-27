import type { Metadata } from 'next';
import { clampDescription } from '@/lib/meta-text';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import { pageMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: la entrada compartida de seo-config para esta ruta habla de
 * "pasarelas de pago" e "integración con medios de pago colombianos" como si
 * fueran reales. Aquí se describe lo que la demo hace de verdad (datos de
 * ejemplo y pago simulado).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoEcommerce2.meta');
  const base = metadataBase('demo-ecommerce', await getLocale());
  const plantilla =
    base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template ? base.title.template : '%s';
  const titulo = t('seoTitle');
  const descripcion = clampDescription(t('seoDescription'));
  const tituloCompleto = plantilla.replace('%s', titulo);
  return {
    ...base,
    title: { default: titulo, template: plantilla },
    description: descripcion,
    openGraph: { ...base.openGraph, title: tituloCompleto, description: descripcion },
    twitter: { ...base.twitter, title: tituloCompleto, description: descripcion },
  };
}

export default async function EcommerceLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  // Sin esto, getTranslations leería el idioma de las cabeceras y la ruta sería dinámica.
  setRequestLocale(locale);
  const t = await getTranslations('demoEcommerce2.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('title'), url: '/demo/ecommerce' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
