import type { Metadata } from 'next';
import { clampDescription } from '@/lib/meta-text';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import { pageMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: el título de la entrada compartida de seo-config para esta
 * ruta («ERP: Finanzas, Inventario y Facturación DIAN») no dice que la DIAN
 * está simulada y no cambia con el idioma. Aquí se describe lo que la demo
 * hace de verdad (datos de ejemplo, DIAN simulada), en ES y EN.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoErp.meta');
  const base = metadataBase('demo-erp', await getLocale());
  const plantilla =
    base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template ? base.title.template : '%s';
  const titulo = t('seoTitle');
  const descripcion = clampDescription(t('seoDescription'));
  const tituloCompleto = plantilla.replace('%s', titulo);
  // El texto alternativo de la imagen compartida también sale de la entrada compartida: se reemplaza
  const imagenes = base.openGraph?.images;
  const imagenesOg = (Array.isArray(imagenes) ? imagenes : imagenes ? [imagenes] : []).map((img) =>
    typeof img === 'string' || img instanceof URL ? { url: img, alt: tituloCompleto } : { ...img, alt: tituloCompleto },
  );
  return {
    ...base,
    title: { default: titulo, template: plantilla },
    description: descripcion,
    openGraph: { ...base.openGraph, title: tituloCompleto, description: descripcion, ...(imagenesOg.length ? { images: imagenesOg } : {}) },
    twitter: { ...base.twitter, title: tituloCompleto, description: descripcion },
  };
}

export default async function ErpLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Sin esto, getTranslations leería el idioma de las cabeceras y la ruta sería dinámica.
  setRequestLocale(locale);
  const t = await getTranslations('demoErp.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('title'), url: '/demo/erp' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
