import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-gestor-documentos');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Gestor Documental Médico',
  description:
    'Gestión documental para instituciones de salud: historias clínicas, exámenes y documentos administrativos con búsqueda inteligente.',
  url: 'https://koptup.com/demo/gestor-documentos',
  applicationCategory: 'HealthApplication',
  lowPrice: 990,
  highPrice: 20000,
  reviewCount: 44,
  ratingValue: 4.8,
  featureList: [
    'Búsqueda inteligente sobre documentos',
    'Control de versiones y auditoría de accesos',
    'Carpetas por paciente y proceso',
    'Cumple normatividad de archivo clínico',
  ],
});

export default function GestorDocumentosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Gestor Documental Médico', url: '/demo/gestor-documentos' },
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
