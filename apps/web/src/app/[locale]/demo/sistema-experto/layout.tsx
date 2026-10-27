import { clampDescription } from '@/lib/meta-text';
import type { Metadata } from 'next';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import { pageMetadata as metadataBase, getBreadcrumbSchema } from '@/lib/seo-config';

/**
 * Metadata propia: la entrada compartida de seo-config para esta ruta promete un
 * "sistema experto para toma de decisiones" genérico. Esta demo es el motor de
 * reglas de la auditoría de cuentas médicas y es privada, así que no se indexa.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('demoExpertSystem.meta');
  const base = metadataBase('demo-sistema-experto', await getLocale());
  const plantilla =
    base.title && typeof base.title === 'object' && 'template' in base.title && base.title.template
      ? base.title.template
      : '%s';
  const titulo = t('title');
  const descripcion = clampDescription(t('description'));
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

export default async function SistemaExpertoLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  // Sin esto, getTranslations leería el idioma de las cabeceras y la ruta sería dinámica.
  setRequestLocale(locale);
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
