import { Metadata } from 'next';
import { getBreadcrumbSchema } from '@/lib/seo-config';

export const metadata: Metadata = {
  title: 'Chatbots con IA para Empresas | Venta e Implementación de Chatbots Colombia',
  description:
    'Implementamos chatbots con inteligencia artificial para empresas en Colombia y Latinoamérica. Integración con WhatsApp Business, GPT-4 y Claude AI. Atención 24/7, captura de leads y ventas automatizadas. Desde $499 USD.',
  keywords: [
    'chatbot con ia',
    'chatbot inteligencia artificial',
    'implementar chatbot empresa',
    'venta chatbots colombia',
    'chatbot whatsapp colombia',
    'chatbot para negocios',
    'asistente virtual ia',
    'chatbot gpt colombia',
    'chatbot whatsapp business',
    'chatbot ventas automatizadas',
    'chatbot atención al cliente',
    'chatbot 24/7',
    'chatbot empresarial colombia',
    'comprar chatbot ia',
    'chatbot para ecommerce',
    'automatización atención cliente',
  ],
  alternates: { canonical: 'https://koptup.com/chatbots-ia' },
  openGraph: {
    title: 'Chatbots con IA para Empresas | KopTup Colombia',
    description: 'Implementamos chatbots inteligentes con WhatsApp, GPT-4 y Claude. Atención 24/7 desde $499 USD.',
    url: 'https://koptup.com/chatbots-ia',
    siteName: 'KopTup',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Chatbots con IA - KopTup' }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chatbots con IA para Empresas | KopTup',
    description: 'Implementamos chatbots inteligentes con WhatsApp, GPT-4 y Claude. Desde $499 USD.',
    images: ['/og-image.png'],
  },
};

const chatbotSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Chatbot con IA - KopTup',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, WhatsApp, Mobile',
  description:
    'Chatbot con inteligencia artificial para empresas. Integración con WhatsApp Business, GPT-4 y Claude AI. Atención 24/7, generación de leads y ventas automatizadas.',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '499',
    highPrice: '15000',
    priceCurrency: 'USD',
    offerCount: '3',
  },
  provider: {
    '@type': 'Organization',
    name: 'KopTup',
    url: 'https://koptup.com',
  },
  featureList: [
    'Integración con WhatsApp Business API',
    'Inteligencia Artificial GPT-4 y Claude',
    'Disponibilidad 24/7',
    'Captura y cualificación de leads',
    'Integración con CRM',
    'Escalamiento a agente humano',
    'Multiidioma (español e inglés)',
  ],
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta implementar un chatbot con IA en Colombia?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nuestros chatbots con IA van desde $499 USD para soluciones básicas hasta proyectos enterprise personalizados. El precio incluye diseño, desarrollo, integración con WhatsApp u otros canales, y soporte técnico. Ofrecemos cotización gratuita sin compromiso.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo implementar un chatbot con IA en mi empresa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El proceso tiene 4 pasos: 1) Análisis de tu negocio y casos de uso, 2) Diseño de flujos de conversación, 3) Desarrollo e integración con tus sistemas, 4) Lanzamiento y capacitación. Tu chatbot puede estar funcionando en 2-4 semanas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Dónde puedo comprar un chatbot con IA para mi negocio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'KopTup desarrolla y vende chatbots con IA personalizados para empresas en Colombia y Latinoamérica. Puedes solicitar una demo gratuita o una cotización en koptup.com/contact. Somos expertos en implementación de chatbots con WhatsApp Business, GPT-4 y Claude AI.',
      },
    },
    {
      '@type': 'Question',
      name: '¿El chatbot con IA funciona con WhatsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Integramos chatbots con la API oficial de WhatsApp Business. Tu chatbot puede atender miles de conversaciones simultáneas, enviar mensajes proactivos, compartir imágenes y documentos, y transferir a agentes humanos cuando sea necesario.',
      },
    },
  ],
};

export default function ChatbotsIALayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Chatbots con IA', url: '/chatbots-ia' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(chatbotSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {children}
    </>
  );
}
