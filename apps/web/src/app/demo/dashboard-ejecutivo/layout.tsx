import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-dashboard-ejecutivo');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Dashboard Ejecutivo',
  description:
    'Dashboard ejecutivo con KPIs, métricas y análisis de datos en tiempo real. Visualización de indicadores clave y reportes automáticos.',
  url: 'https://koptup.com/demo/dashboard-ejecutivo',
  applicationCategory: 'BusinessApplication',
  lowPrice: 1200,
  highPrice: 28000,
  reviewCount: 64,
  ratingValue: 4.8,
  featureList: [
    'KPIs y métricas en tiempo real',
    'Gráficos interactivos y reportes automáticos',
    'Personalizable por sector y rol',
    'Exportación a PDF / Excel',
  ],
});

export default function DashboardEjecutivoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Dashboard Ejecutivo', url: '/demo/dashboard-ejecutivo' },
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
