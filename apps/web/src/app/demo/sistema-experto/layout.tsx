import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-sistema-experto');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Sistema Experto con IA',
  description:
    'Sistema experto basado en IA: motor de inferencia, base de conocimiento, reglas de negocio, recomendaciones automatizadas con explicabilidad.',
  url: 'https://koptup.com/demo/sistema-experto',
  applicationCategory: 'BusinessApplication',
  lowPrice: 1500,
  highPrice: 32000,
  reviewCount: 28,
  ratingValue: 4.7,
  featureList: [
    'Motor de inferencia y reglas de negocio',
    'Base de conocimiento configurable',
    'Recomendaciones con explicabilidad',
    'Integración por API',
  ],
});

export default function SistemaExpertoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Sistema Experto con IA', url: '/demo/sistema-experto' },
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
