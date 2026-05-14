import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-telemedicina');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Telemedicina HIPAA',
  description:
    'Plataforma de telemedicina HIPAA-compliant con video consulta segura, EHR integrado, triage IA, receta electrónica y wearables.',
  url: 'https://koptup.com/demo/telemedicina',
  applicationCategory: 'HealthApplication',
  lowPrice: 1500,
  highPrice: 45000,
  reviewCount: 27,
  ratingValue: 4.9,
  featureList: [
    'Video call HIPAA-compliant con WebRTC propio',
    'EHR/EMR + receta electrónica con firma digital',
    'Triage IA con síntomas y derivación por especialidad',
    'Integración wearables, labs HL7/FHIR y farmacias',
  ],
});

export default function TelemedicinaLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Telemedicina HIPAA', url: '/demo/telemedicina' },
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
