import { clampDescription } from '@/lib/meta-text';
import type { Metadata } from 'next';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import { pageMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia y traducida: describe lo que la demo hace de verdad (datos de ejemplo,
 * video, pagos, factura y RIPS simulados). Conserva canonical, Open Graph e imagen de la
 * entrada compartida de seo-config.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoTelemed.meta');
  const base = metadataBase('demo-telemedicina', await getLocale());
  const plantilla = base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template ? base.title.template : '%s';
  const titulo = t('title');
  const descripcion = clampDescription(t('description'));
  const tituloCompleto = plantilla.replace('%s', titulo);

  return {
    ...base,
    title: { default: titulo, template: plantilla },
    description: descripcion,
    openGraph: { ...base.openGraph, title: tituloCompleto, description: descripcion },
    twitter: { ...base.twitter, title: tituloCompleto, description: descripcion },
  };
}

export default async function TelemedicinaLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  // Sin esto, getTranslations leería el idioma de las cabeceras y la ruta sería dinámica.
  setRequestLocale(locale);
  const t = await getTranslations('demoTelemed.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('breadcrumbName'), url: '/demo/telemedicina' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
