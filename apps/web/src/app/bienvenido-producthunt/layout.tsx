import { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Product Hunt: Software a Medida con Demos',
  description:
    'KopTup en Product Hunt. Desarrollamos software a medida: chatbots con IA, e-commerce, dashboards, apps móviles. Prueba demos interactivos gratis. Oferta especial para la comunidad de Product Hunt: 15% de descuento en tu primer proyecto.',
  alternates: { canonical: absoluteUrl('/bienvenido-producthunt') },
  openGraph: {
    title: 'Custom Software with Interactive Demos | KopTup',
    description: 'Build your chatbot, e-commerce, dashboard or mobile app with KopTup. Try live demos before you pay. Special 15% off for Product Hunt community.',
    url: absoluteUrl('/bienvenido-producthunt'),
    siteName: 'KopTup',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KopTup on Product Hunt' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Software with Live Demos | KopTup',
    description: 'Chatbots, e-commerce, dashboards & more. Try live demos for free. 15% off for PH community.',
    images: ['/og-image.png'],
  },
  robots: { index: false, follow: true }, // No indexar en Google, solo para tráfico directo de PH
};

export default function ProductHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
