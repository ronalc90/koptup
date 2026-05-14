import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-facturacion-electronica');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Facturación Electrónica Multi-país',
  description:
    'Facturación electrónica multi-país LatAm con DIAN (CO), SAT (MX), AFIP (AR), SII (CL), SUNAT (PE), DGI (UY), SET (PY), SRI (EC). API, SDKs, plugins y modo white-label.',
  url: 'https://koptup.com/demo/facturacion-electronica',
  applicationCategory: 'FinanceApplication',
  lowPrice: 29,
  highPrice: 12000,
  reviewCount: 76,
  ratingValue: 4.9,
  featureList: [
    '8 países LatAm: CO, MX, AR, CL, PE, UY, PY, EC',
    'Factura, NC, ND, POS, contingencia y validación NIT en tiempo real',
    'Recepción proveedor con OCR + validación automática',
    'API + SDKs + plugins ERP/POS + modo white-label',
  ],
});

export default function FacturacionElectronicaLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Facturación Electrónica', url: '/demo/facturacion-electronica' },
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
