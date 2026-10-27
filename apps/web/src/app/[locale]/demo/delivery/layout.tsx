import type { Metadata } from 'next';
import { clampDescription } from '@/lib/meta-text';
import { getTranslations, getLocale } from 'next-intl/server';
import { pageMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia (título y descripción en el idioma del visitante) que dice lo
 * que la demo hace de verdad: datos de ejemplo, pago, mapa y seguimiento
 * simulados. Toma la URL canónica y el resto de la entrada de seo-config.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoDelivery.meta');
  const base = metadataBase('demo-delivery', await getLocale());
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

export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('demoDelivery.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('title'), url: '/demo/delivery' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
