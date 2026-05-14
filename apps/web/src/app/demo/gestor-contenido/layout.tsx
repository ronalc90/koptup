import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-gestor-contenido');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Gestor de Contenido con IA',
  description:
    'Generador automático de contenido médico con IA: emails corporativos, comunicados, informes y documentos administrativos.',
  url: 'https://koptup.com/demo/gestor-contenido',
  applicationCategory: 'BusinessApplication',
  lowPrice: 499,
  highPrice: 9000,
  reviewCount: 32,
  ratingValue: 4.7,
  featureList: [
    'Plantillas para emails médicos e institucionales',
    'Exportación a PDF y envío por email',
    'Personalización por área (IPS, hospital, EPS)',
    'IA para redacción y revisión automática',
  ],
});

export default function GestorContenidoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Gestor de Contenido con IA', url: '/demo/gestor-contenido' },
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
