import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-pos');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup POS Punto de Venta',
  description:
    'POS moderno offline-first con multi-payment, KDS para restaurantes, hardware integrado y facturación electrónica.',
  url: 'https://koptup.com/demo/pos',
  applicationCategory: 'BusinessApplication',
  lowPrice: 19,
  highPrice: 8000,
  reviewCount: 55,
  ratingValue: 4.8,
  featureList: [
    'Offline-first con CRDT sync y conflict resolution',
    'Multi-payment: cash, card, QR, wallets, BNPL, split',
    'KDS, mesas, modificadores, combos y happy hour',
    'Hardware: scanners Bluetooth, balanzas, impresoras, cash drawer',
  ],
});

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'POS Punto de Venta', url: '/demo/pos' },
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
