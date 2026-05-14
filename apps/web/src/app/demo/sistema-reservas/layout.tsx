import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-sistema-reservas');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Sistema de Reservas Online',
  description:
    'Plataforma de reservas y agendamiento online: calendario inteligente, gestión de citas, confirmaciones automáticas y recordatorios email/SMS.',
  url: 'https://koptup.com/demo/sistema-reservas',
  applicationCategory: 'BusinessApplication',
  lowPrice: 499,
  highPrice: 12000,
  reviewCount: 47,
  ratingValue: 4.8,
  featureList: [
    'Calendario inteligente y multi-usuario',
    'Confirmaciones automáticas por email y SMS',
    'Integración con Google Calendar',
    'Recordatorios y reagendamiento',
  ],
});

export default function SistemaReservasLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Sistema de Reservas', url: '/demo/sistema-reservas' },
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
