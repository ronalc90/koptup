import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-chatbot');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Chatbot Médico con IA',
  description:
    'Chatbot inteligente especializado en salud con RAG: normativa Ley 100, Resolución 3047, códigos CUPS / CIE-10 y contratos EPS.',
  url: 'https://koptup.com/demo/chatbot',
  applicationCategory: 'HealthApplication',
  lowPrice: 499,
  highPrice: 18000,
  reviewCount: 89,
  ratingValue: 4.9,
  featureList: [
    'RAG sobre normativa de salud (Ley 100, Resolución 3047)',
    'Búsqueda semántica de códigos CUPS y CIE-10',
    'Integración con WhatsApp Business y portales IPS',
    'Multi-idioma español e inglés',
  ],
});

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Chatbot Médico con IA', url: '/demo/chatbot' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {children}
    </>
  );
}
