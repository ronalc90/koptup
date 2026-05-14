import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-helpdesk-ia');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Help Desk IA Omnichannel',
  description:
    'Help desk omnichannel con ticketing inteligente, routing ML, sugerencias IA al agente en vivo, SLA management y CSAT/NPS automatizado.',
  url: 'https://koptup.com/demo/helpdesk-ia',
  applicationCategory: 'BusinessApplication',
  lowPrice: 49,
  highPrice: 15000,
  reviewCount: 63,
  ratingValue: 4.8,
  featureList: [
    'Omnichannel: email, WhatsApp, IG, FB, X, voice, chat',
    'Routing inteligente con ML (skills, sentiment, idioma)',
    'Sugerencias IA en vivo y auto-respuestas con confidence',
    'SLA escalations, CSAT/NPS post-resolution y QA con IA',
  ],
});

export default function HelpdeskIaLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Help Desk IA', url: '/demo/helpdesk-ia' },
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
