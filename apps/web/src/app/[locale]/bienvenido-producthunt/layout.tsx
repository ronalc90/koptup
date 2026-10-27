import { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { localeAlternates, localizedUrl } from '@/lib/i18n-url';

const TITLE = 'Product Hunt: Software a Medida con Demos';
const DESCRIPTION =
  'KopTup en Product Hunt: software a medida y sistemas RAG en Bogotá. Prueba las demos antes de contratar y revisa los precios publicados.';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: localeAlternates('/bienvenido-producthunt', locale),
    openGraph: {
      title: `${TITLE} | KopTup`,
      description: DESCRIPTION,
      url: localizedUrl('/bienvenido-producthunt', locale),
      siteName: 'KopTup',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KopTup en Product Hunt' }],
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${TITLE} | KopTup`,
      description: DESCRIPTION,
      images: ['/og-image.png'],
    },
    robots: { index: false, follow: true }, // No indexar en Google, solo para tráfico directo de PH
  };
}

export default function ProductHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
