import { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

const TITLE = 'Product Hunt: Software a Medida con Demos';
const DESCRIPTION =
  'KopTup en Product Hunt: software a medida y sistemas RAG en Bogotá. Prueba las demos antes de contratar y revisa los precios publicados.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/bienvenido-producthunt') },
  openGraph: {
    title: `${TITLE} | KopTup`,
    description: DESCRIPTION,
    url: absoluteUrl('/bienvenido-producthunt'),
    siteName: 'KopTup',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KopTup en Product Hunt' }],
    locale: 'es_CO',
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

export default function ProductHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
