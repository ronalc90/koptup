import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-wms-logistica');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup WMS / Logística',
  description:
    'WMS multi-warehouse con picking optimizado, route optimization ML, last-mile con app driver y carriers integrados (FedEx, DHL, Servientrega, Coordinadora).',
  url: 'https://koptup.com/demo/wms-logistica',
  applicationCategory: 'BusinessApplication',
  lowPrice: 990,
  highPrice: 35000,
  reviewCount: 33,
  ratingValue: 4.8,
  featureList: [
    'Multi-warehouse con zonas, bins y slotting optimization ML',
    'Picking wave/batch/zone/cluster y cycle counting ABC',
    'Route optimization VRP + last-mile con POD',
    'Carriers: FedEx, DHL, Servientrega, Coordinadora, Inter, TCC',
  ],
});

export default function WmsLogisticaLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'WMS / Logística', url: '/demo/wms-logistica' },
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
