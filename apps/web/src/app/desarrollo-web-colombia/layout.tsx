import { Metadata } from 'next';
import { getBreadcrumbSchema } from '@/lib/seo-config';
import { SITE_URL, absoluteUrl } from '@/lib/site';
import { getChatbotsPageValues } from '@/lib/chatbots-page';

// Precios del FAQ (chatbots y piloto RAG): los mismos de /chatbots-ia, desde rag-plans.ts.
const chatbotPrice = getChatbotsPageValues('es');

export const metadata: Metadata = {
  title: 'Desarrollo Web y Software a Medida en Colombia',
  description:
    'Contrata a KopTup para desarrollar tu aplicación web, chatbot con IA, e-commerce o sistema empresarial. Estudio de software a medida en Bogotá, Colombia. Precios publicados y cotización gratis.',
  alternates: { canonical: absoluteUrl('/desarrollo-web-colombia') },
  openGraph: {
    title: 'Empresa de Desarrollo Web a Medida | KopTup',
    description: 'Aplicaciones web, chatbots con IA, e-commerce y apps móviles a medida, desde Bogotá. Cotización gratis.',
    url: absoluteUrl('/desarrollo-web-colombia'),
    siteName: 'KopTup',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Desarrollo Web Colombia - KopTup' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Empresa de Desarrollo de Software Colombia | KopTup',
    description: 'Desarrollo web, chatbots con IA, e-commerce y apps móviles a medida, desde Bogotá. Cotización gratis.',
    images: ['/og-image.png'],
  },
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'KopTup - Desarrollo de Software a Medida',
  description:
    'Estudio de desarrollo de software a medida con sede en Bogotá, Colombia. Desarrollamos aplicaciones web, chatbots con IA, e-commerce, apps móviles, dashboards y sistemas empresariales.',
  url: SITE_URL,
  telephone: '+57-302-479-4842',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bogotá',
    addressRegion: 'Cundinamarca',
    addressCountry: 'CO',
  },
  areaServed: { '@type': 'Country', name: 'Colombia' },
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
  // Mismo criterio que StructuredData: los precios publicados están en /services.
  priceRange: '$$ - $$$$',
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
        text: `Publicamos nuestros precios en www.koptup.com/services, en COP y con su referencia en USD (más IVA si aplica). Los sistemas RAG empiezan con un piloto de ${chatbotPrice.pilotFrom} y las demás soluciones a medida tienen precios por plan según su alcance. Ofrecemos cotización gratuita y sin compromiso.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Trabajan con empresas de toda Colombia o solo de Bogotá?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Trabajamos de forma remota con empresas de cualquier ciudad: las reuniones son por videollamada y atendemos en español e inglés.',
      },
    },
    {
      '@type': 'Question',
      name: '¿KopTup puede desarrollar chatbots para WhatsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. Los chatbots RAG para WhatsApp se conectan con la API oficial de WhatsApp Business (desde el plan Profesional) y usan modelos de OpenAI. Responden con los documentos de tu empresa a cualquier hora y, si no encuentran la respuesta, lo dicen. Desde ${chatbotPrice.essentialFrom}, o piloto de ${chatbotPrice.pilotFrom} (más IVA si aplica).`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto tiempo toma desarrollar una aplicación web?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Depende del alcance. Un MVP (versión inicial funcional) puede estar listo en 4-8 semanas. Un sistema complejo con múltiples módulos puede tomar 3-6 meses. En el análisis inicial definimos tiempos exactos.',
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
