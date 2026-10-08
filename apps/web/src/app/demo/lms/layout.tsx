import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: describe lo que la demo hace de verdad (academia de
 * ejemplo, pagos y factura simulados, tutor con IA real sobre el material).
 * La entrada compartida de seo-config solo aporta canonical e imágenes.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoLms.meta');
  const base = metadataBase('demo-lms');
  const plantilla =
    base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template ? base.title.template : '%s';
  const titulo = t('seoTitle');
  const descripcion = t('seoDescription');
  const tituloCompleto = plantilla.replace('%s', titulo);
  return {
    ...base,
    title: { default: titulo, template: plantilla },
    description: descripcion,
    openGraph: { ...base.openGraph, title: tituloCompleto, description: descripcion },
    twitter: { ...base.twitter, title: tituloCompleto, description: descripcion },
  };
}

export default async function LmsLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('demoLms.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('breadcrumbTitle'), url: '/demo/lms' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
