import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: describe lo que la demo hace de verdad (datos de ejemplo,
 * cálculos en el navegador, transmisión y pagos simulados) en lugar de la
 * descripción compartida de seo-config.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoPos.meta');
  const base = metadataBase('demo-pos');
  const plantilla =
    base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template
      ? base.title.template
      : '%s';
  const titulo = t('title');
  const descripcion = t('description');
  const tituloCompleto = plantilla.replace('%s', titulo);

  return {
    ...base,
    title: { default: titulo, template: plantilla },
    description: descripcion,
    openGraph: { ...base.openGraph, title: tituloCompleto, description: descripcion },
    twitter: { ...base.twitter, title: tituloCompleto, description: descripcion },
  };
}

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('demoPos.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('breadcrumbName'), url: '/demo/pos' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
