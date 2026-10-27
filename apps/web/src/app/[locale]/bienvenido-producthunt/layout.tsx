import { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { localeAlternates, localizedUrl } from '@/lib/i18n-url';

const TITLE = 'Product Hunt: Software a Medida con Demos';
const TITLE_EN = 'Product Hunt: Custom Software with Demos';
const DESCRIPTION_EN =
  'KopTup on Product Hunt: custom software and RAG systems in Bogotá. Try the demos before you hire and check the published prices.';
const DESCRIPTION =
  'KopTup en Product Hunt: software a medida y sistemas RAG en Bogotá. Prueba las demos antes de contratar y revisa los precios publicados.';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const en = locale === 'en';
  const title = en ? TITLE_EN : TITLE;
  const description = en ? DESCRIPTION_EN : DESCRIPTION;
  return {
    title,
    description,
    alternates: localeAlternates('/bienvenido-producthunt', locale),
    openGraph: {
      title: `${title} | KopTup`,
      description,
      url: localizedUrl('/bienvenido-producthunt', locale),
      siteName: 'KopTup',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KopTup en Product Hunt' }],
      locale: locale === 'en' ? 'en_US' : 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | KopTup`,
      description,
      images: ['/og-image.png'],
    },
    robots: { index: false, follow: true }, // No indexar en Google, solo para tráfico directo de PH
  };
}

export default function ProductHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
