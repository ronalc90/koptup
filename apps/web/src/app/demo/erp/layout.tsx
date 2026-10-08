import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: la entrada compartida de seo-config para esta ruta promete
 * "reportes en tiempo real" y facturación DIAN como si fuera real. Aquí se
 * describe lo que la demo hace de verdad (datos de ejemplo, DIAN simulada).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoErp.meta');
  const base = metadataBase('demo-erp');
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

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
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
