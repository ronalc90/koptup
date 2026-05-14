import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-ecommerce');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Plataforma E-commerce',
  description:
    'Plataforma e-commerce completa con carrito de compras, pasarelas de pago colombianas, gestión de inventario y panel de administración.',
  url: 'https://koptup.com/demo/ecommerce',
  applicationCategory: 'BusinessApplication',
  lowPrice: 1500,
  highPrice: 30000,
  reviewCount: 78,
  ratingValue: 4.9,
  featureList: [
    'Carrito de compras y checkout optimizado',
    'Pasarelas de pago colombianas (Wompi, PayU, Mercado Pago)',
    'Gestión de inventario multi-bodega',
    'Panel de administración y analytics',
  ],
});

export default function EcommerceLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Plataforma E-commerce', url: '/demo/ecommerce' },
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
