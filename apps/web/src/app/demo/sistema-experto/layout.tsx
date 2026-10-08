import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { generateMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: la entrada compartida de seo-config para esta ruta promete un
 * "sistema experto para toma de decisiones" genérico. Esta demo es el motor de
 * reglas de la auditoría de cuentas médicas y es privada, así que no se indexa.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoExpertSystem.meta');
  const base = metadataBase('demo-sistema-experto');
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
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  };
}

export default async function SistemaExpertoLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('demoExpertSystem.meta');
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: t('breadcrumbHome'), url: '/' },
    { name: t('breadcrumbDemos'), url: '/demo' },
    { name: t('breadcrumbName'), url: '/demo/sistema-experto' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
