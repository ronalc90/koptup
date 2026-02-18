import { Metadata } from 'next';
import { getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Soluciones de Inteligencia Artificial para Empresas | KopTup Colombia',
  description:
    'Implementamos soluciones de inteligencia artificial para empresas en Colombia y Latinoamérica. Chatbots con IA, automatización de procesos, análisis predictivo, sistemas expertos y generación de contenido con GPT-4 y Claude AI. Consultoría gratuita.',
  keywords: [
    'soluciones de inteligencia artificial',
    'inteligencia artificial para empresas',
    'implementar IA empresa',
    'automatización con IA',
    'análisis predictivo',
    'machine learning colombia',
    'IA colombia',
    'inteligencia artificial colombia',
    'empresa IA bogotá',
    'transformación digital IA',
    'automatización procesos IA',
    'chatbot inteligencia artificial colombia',
    'sistema experto IA',
    'procesamiento documentos IA',
    'GPT-4 empresas',
    'Claude AI empresas',
  ],
  alternates: { canonical: 'https://koptup.com/soluciones-ia' },
  openGraph: {
    title: 'Soluciones de Inteligencia Artificial para Empresas | KopTup',
    description: 'Chatbots, automatización, análisis predictivo y sistemas expertos con IA para tu empresa en Colombia.',
    url: 'https://koptup.com/soluciones-ia',
    siteName: 'KopTup',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Soluciones IA - KopTup' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Soluciones de IA para Empresas | KopTup Colombia',
    description: 'Implementamos IA en tu empresa: chatbots, automatización, análisis predictivo. Consultoría gratuita.',
    images: ['/og-image.png'],
  },
};

const aiSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Soluciones de Inteligencia Artificial - KopTup',
  serviceType: 'Artificial Intelligence Implementation',
  description:
    'Implementación de soluciones de inteligencia artificial para empresas: chatbots conversacionales, automatización de procesos, análisis predictivo, sistemas expertos y procesamiento inteligente de documentos.',
  provider: {
    '@type': 'Organization',
    name: 'KopTup',
    url: 'https://koptup.com',
    areaServed: ['Colombia', 'Latinoamérica'],
  },
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '499',
    highPrice: '50000',
    priceCurrency: 'USD',
    offerCount: '6',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Soluciones de IA',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chatbots Conversacionales con IA' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Automatización de Procesos con IA' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Análisis Predictivo' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Procesamiento Inteligente de Documentos' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sistemas Expertos' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Generación de Contenido con IA' } },
    ],
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué soluciones de inteligencia artificial ofrece KopTup?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'KopTup implementa 6 tipos de soluciones IA: chatbots conversacionales con WhatsApp y GPT-4, automatización de procesos repetitivos, análisis predictivo de datos, procesamiento inteligente de documentos (OCR + IA), sistemas expertos para toma de decisiones, y generación automática de contenido.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta implementar inteligencia artificial en mi empresa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El costo de implementar IA en una empresa varía según la complejidad. Proyectos básicos de automatización o chatbots parten desde $499 USD. Soluciones enterprise con análisis predictivo y sistemas expertos pueden superar los $10,000 USD. Ofrecemos consultoría gratuita para evaluar tu caso.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo implementar inteligencia artificial en mi negocio en Colombia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El proceso: 1) Análisis de procesos y oportunidades de automatización, 2) Selección de tecnología IA adecuada (GPT-4, Claude, modelos propios), 3) Desarrollo e integración con tus sistemas actuales, 4) Capacitación de tu equipo, 5) Soporte y mejora continua. En KopTup guiamos todo el proceso.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué empresas en Colombia pueden beneficiarse de la inteligencia artificial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cualquier empresa puede beneficiarse. Tenemos casos de éxito en retail (atención al cliente con chatbots), salud (auditoría automática de documentos), finanzas (detección de fraude), logística (predicción de demanda), educación (tutores virtuales) y manufactura (control de calidad con visión artificial).',
      },
    },
  ],
};

export default function SolucionesIALayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Soluciones de IA', url: '/soluciones-ia' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aiSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
