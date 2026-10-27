import type { Metadata } from 'next';
import { clampDescription } from '@/lib/meta-text';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import { pageMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: la entrada compartida de seo-config para esta ruta habla de
 * "contenido médico", "informes médicos" y "emails", que la demo no hace. Aquí
 * se describe lo que la demo muestra de verdad (CMS headless con datos de
 * ejemplo), también en el texto alternativo de la imagen para redes.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoCms.meta');
  const base = metadataBase('demo-gestor-contenido', await getLocale());
  const plantilla = base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template ? base.title.template : '%s';
  const titulo = t('seoTitle');
  const descripcion = clampDescription(t('seoDescription'));
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

export default async function GestorContenidoLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Sin esto, getTranslations leería el idioma de las cabeceras y la ruta sería dinámica.
  setRequestLocale(locale);
  const t = await getTranslations('demoCms.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('breadcrumb'), url: '/demo/gestor-contenido' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
