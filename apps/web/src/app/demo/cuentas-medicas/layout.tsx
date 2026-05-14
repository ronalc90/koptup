import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-cuentas-medicas');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Auditoría de Cuentas Médicas con IA',
  description:
    'Sistema de auditoría de cuentas médicas con IA. Detecta y previene glosas. Valida tarifas SOAT, ISS 2001, ISS 2004 y contratos EPS.',
  url: 'https://koptup.com/demo/cuentas-medicas',
  applicationCategory: 'HealthApplication',
  lowPrice: 2500,
  highPrice: 80000,
  reviewCount: 56,
  ratingValue: 4.9,
  featureList: [
    'Detección automática de glosas administrativas y técnicas',
    'Validación de tarifas SOAT, ISS 2001 e ISS 2004',
    'Contratos EPS: Nueva EPS, Salud Total, Compensar',
    'Reducción de rechazos hasta 80%',
  ],
});

export default function CuentasMedicasLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Auditoría de Cuentas Médicas', url: '/demo/cuentas-medicas' },
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
