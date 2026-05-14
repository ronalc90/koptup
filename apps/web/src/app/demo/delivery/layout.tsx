import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-delivery');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup App de Delivery',
  description:
    'Ecosistema de delivery con 3 apps (customer / driver / merchant), tracking en vivo, routing ML, surge pricing, anti-fraude y carriers integrados.',
  url: 'https://koptup.com/demo/delivery',
  applicationCategory: 'MobileApplication',
  lowPrice: 2500,
  highPrice: 60000,
  reviewCount: 34,
  ratingValue: 4.7,
  featureList: [
    '3 apps: customer, driver, merchant + ops dashboard',
    'Routing ML multi-pickup + tracking en vivo + ETA ML',
    'Pricing dinámico (surge), loyalty y suscripción membership',
    'Anti-fraude: GPS spoofing, multi-account, KYC drivers',
  ],
});

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'App de Delivery', url: '/demo/delivery' },
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
