import { Metadata } from 'next';
import { generateMetadata, getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('services');

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'KopTup - Servicios de Desarrollo de Software',
  url: 'https://koptup.com/services',
  description:
    'Desarrollo de software a medida: e-commerce, chatbots con IA, apps móviles, dashboards, automatización e integración de sistemas.',
  provider: {
    '@type': 'Organization',
    name: 'KopTup',
    url: 'https://koptup.com',
  },
  areaServed: 'Colombia',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servicios Tecnológicos',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'E-Commerce', description: 'Tiendas online completas con pasarela de pago.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chatbots con IA', description: 'Asistentes virtuales inteligentes.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Aplicaciones Móviles', description: 'Apps iOS y Android.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Dashboards Ejecutivos', description: 'Análisis de datos en tiempo real.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Integración de Sistemas', description: 'APIs y conectores empresariales.' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Diseño UX/UI', description: 'Interfaces modernas y usables.' } },
    ],
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Servicios', url: '/services' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      {children}
    </>
  );
}
