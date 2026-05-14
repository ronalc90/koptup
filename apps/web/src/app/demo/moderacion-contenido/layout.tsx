import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-moderacion-contenido');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Moderación de Contenido IA',
  description:
    'Plataforma de moderación de contenido multi-modal (texto, imagen, video, audio) con custom models por vertical, human-in-the-loop y compliance DSA.',
  url: 'https://koptup.com/demo/moderacion-contenido',
  applicationCategory: 'BusinessApplication',
  lowPrice: 99,
  highPrice: 20000,
  reviewCount: 29,
  ratingValue: 4.7,
  featureList: [
    'Multi-modal: texto, imagen, video, audio en tiempo real',
    'Custom models por vertical (gaming, dating, kids, fintech)',
    'Human-in-the-loop con priority routing y appeals',
    'Wellness program: blur, breaks, rotación + compliance DSA',
  ],
});

export default function ModeracionContenidoLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Moderación de Contenido IA', url: '/demo/moderacion-contenido' },
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
