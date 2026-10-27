import { clampDescription } from '@/lib/meta-text';
import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { pageMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia y traducida: describe lo que la demo hace de verdad (datos de
 * ejemplo, comentarios de IA pregenerados, integraciones simuladas y un
 * analizador de reglas local). Conserva canonical, Open Graph e imagen de la
 * entrada compartida de seo-config (con un texto alternativo propio).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoCodeReview.meta');
  const base = metadataBase('demo-code-review-ia', await getLocale());
  const plantilla =
    base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template
      ? base.title.template
      : '%s';
  const titulo = t('title');
  const descripcion = clampDescription(t('description'));
  const tituloCompleto = plantilla.replace('%s', titulo);
  // La imagen social conserva su archivo, pero su texto alternativo describe esta demo.
  const imagenes = base.openGraph?.images;
  const imagenesOg = Array.isArray(imagenes)
    ? imagenes.map((img) => (typeof img === 'object' && img !== null && !(img instanceof URL) ? { ...img, alt: tituloCompleto } : img))
    : imagenes;

  return {
    ...base,
    title: { default: titulo, template: plantilla },
    description: descripcion,
    openGraph: { ...base.openGraph, title: tituloCompleto, description: descripcion, images: imagenesOg },
    twitter: { ...base.twitter, title: tituloCompleto, description: descripcion },
  };
}

export default async function CodeReviewIaLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('demoCodeReview.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('breadcrumbName'), url: '/demo/code-review-ia' },
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
