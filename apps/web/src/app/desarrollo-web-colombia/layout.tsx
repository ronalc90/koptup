import { Metadata } from 'next';
import { getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Empresa de Desarrollo Web y Software a Medida | KopTup Colombia',
  description:
    'Contrata a KopTup para desarrollar tu aplicación web, chatbot con IA, e-commerce o sistema empresarial. Empresa de desarrollo de software a medida con sede en Colombia, trabajamos con clientes en todo el mundo. +100 proyectos. Cotización gratis.',
  keywords: [
    'empresa de desarrollo de software colombia',
    'desarrollo web colombia',
    'contratar empresa desarrollo software',
    'desarrollo web a medida colombia',
    'empresa software bogotá',
    'contratar desarrolladores web colombia',
    'agencia desarrollo software colombia',
    'desarrollo aplicaciones web colombia',
    'software a medida colombia',
    'empresa tecnología colombia',
    'desarrollo software empresa',
    'contratar desarrollo web',
    'desarrollo de software a medida',
    'empresa software latinoamerica',
    'desarrollo web latinoamerica',
    'offshore software development colombia',
  ],
  alternates: { canonical: 'https://koptup.com/desarrollo-web-colombia' },
  openGraph: {
    title: 'Empresa de Desarrollo Web a Medida | KopTup Colombia',
    description: '+100 proyectos entregados. Aplicaciones web, chatbots IA, e-commerce y apps móviles. Trabajamos con clientes en todo el mundo. Cotización gratis.',
    url: 'https://koptup.com/desarrollo-web-colombia',
    siteName: 'KopTup',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Desarrollo Web Colombia - KopTup' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empresa de Desarrollo de Software Colombia | KopTup',
    description: 'Desarrollo web, chatbots IA, e-commerce y apps móviles a medida. Clientes en todo el mundo. Cotización gratis.',
    images: ['/og-image.png'],
  },
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'KopTup - Desarrollo de Software a Medida',
  description:
    'Empresa de desarrollo de software a medida con sede en Bogotá, Colombia. Desarrollamos aplicaciones web, chatbots con IA, e-commerce, apps móviles, dashboards y sistemas empresariales para clientes en Colombia y todo el mundo.',
  url: 'https://koptup.com',
  telephone: '+57-302-479-4842',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bogotá',
    addressRegion: 'Cundinamarca',
    addressCountry: 'CO',
  },
  areaServed: [
    { '@type': 'Country', name: 'Colombia' },
    { '@type': 'Country', name: 'México' },
    { '@type': 'Country', name: 'Argentina' },
    { '@type': 'Country', name: 'Chile' },
    { '@type': 'Country', name: 'España' },
    { '@type': 'Country', name: 'United States' },
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servicios de Desarrollo de Software',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Desarrollo de Aplicaciones Web a Medida' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chatbots con Inteligencia Artificial' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Desarrollo E-commerce' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Aplicaciones Móviles iOS y Android' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Dashboards y Business Intelligence' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Automatización con IA' } },
    ],
  },
  priceRange: '$499 - $50,000 USD',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '67',
    bestRating: '5',
    worstRating: '1',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta contratar una empresa de desarrollo de software en Colombia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'En KopTup los proyectos parten desde $499 USD para soluciones básicas. Un proyecto web completo generalmente está entre $2,000 y $8,000 USD dependiendo de la complejidad. Ofrecemos cotización gratuita y sin compromiso.',
      },
    },
    {
      '@type': 'Question',
      name: '¿KopTup trabaja con clientes fuera de Colombia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. KopTup trabaja con clientes en cualquier parte del mundo — Colombia, México, Argentina, España, Estados Unidos y más. Todo el trabajo es 100% remoto con comunicación en español e inglés.',
      },
    },
    {
      '@type': 'Question',
      name: '¿KopTup puede desarrollar chatbots para WhatsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Integramos chatbots con la API oficial de WhatsApp Business usando GPT-4 o Claude AI. El chatbot puede atender clientes 24/7, capturar leads y transferir a agentes humanos. Desde $499 USD.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto tiempo toma desarrollar una aplicación web?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Un MVP puede estar listo en 4-8 semanas. Un sistema complejo con múltiples módulos puede tomar 3-6 meses. En el análisis inicial definimos tiempos exactos con compromiso de entrega.',
      },
    },
  ],
};

export default function DesarrolloWebColombiaLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Desarrollo Web Colombia', url: '/desarrollo-web-colombia' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
