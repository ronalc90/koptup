import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: la entrada compartida de seo-config para esta ruta promete
 * "datos en tiempo real" y "reportes automáticos". Aquí se describe lo que la
 * demo hace de verdad (datos de ejemplo o tu CSV, proyección estadística,
 * alertas por reglas, informe PDF).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoBiDashboard.meta');
  const base = metadataBase('demo-dashboard-ejecutivo');
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

export default async function DashboardEjecutivoLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('demoBiDashboard.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('title'), url: '/demo/dashboard-ejecutivo' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
