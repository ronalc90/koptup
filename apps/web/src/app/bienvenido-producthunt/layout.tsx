import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KopTup en Product Hunt | Desarrollo de Software a Medida con Demos Interactivos',
  description:
    'KopTup en Product Hunt. Desarrollamos software a medida: chatbots con IA, e-commerce, dashboards, apps móviles. Prueba demos interactivos gratis. Oferta especial para la comunidad de Product Hunt: 15% de descuento en tu primer proyecto.',
  keywords: [
    'koptup producthunt',
    'software development colombia',
    'custom software',
    'ai chatbot',
    'e-commerce development',
    'interactive demos software',
  ],
  alternates: { canonical: 'https://koptup.com/bienvenido-producthunt' },
  openGraph: {
    title: 'KopTup — Custom Software with Interactive Demos | Product Hunt',
    description: 'Build your chatbot, e-commerce, dashboard or mobile app with KopTup. Try live demos before you pay. Special 15% off for Product Hunt community.',
    url: 'https://koptup.com/bienvenido-producthunt',
    siteName: 'KopTup',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'KopTup on Product Hunt' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KopTup on Product Hunt | Custom Software with Live Demos',
    description: 'Chatbots, e-commerce, dashboards & more. Try live demos for free. 15% off for PH community.',
    images: ['/og-image.png'],
  },
  robots: { index: false, follow: true }, // No indexar en Google, solo para tráfico directo de PH
};

export default function ProductHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
