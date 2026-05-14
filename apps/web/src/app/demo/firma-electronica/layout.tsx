import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-firma-electronica');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Firma Electrónica',
  description:
    'Plataforma de firma electrónica simple, avanzada y cualificada (eIDAS, Ley 527 Colombia) con audit trail criptográfico, RFC 3161 timestamp y blockchain.',
  url: 'https://koptup.com/demo/firma-electronica',
  applicationCategory: 'BusinessApplication',
  lowPrice: 15,
  highPrice: 4500,
  reviewCount: 52,
  ratingValue: 4.8,
  featureList: [
    'Firma simple, avanzada y cualificada (eIDAS, Ley 527 CO)',
    'KYC firmante: SMS OTP, email, ID+selfie, video, biometría',
    'Audit trail criptográfico con hash chain y RFC 3161',
    'Multi-firmante con orden, condicional, paralelo + bulk send',
  ],
});

export default function FirmaElectronicaLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Firma Electrónica', url: '/demo/firma-electronica' },
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
