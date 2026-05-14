import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-automatizacion');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Automatización de Workflows',
  description:
    'Plataforma de automatización visual estilo n8n / Zapier con 500+ integraciones, AI nodes nativos y self-hosted opcional.',
  url: 'https://koptup.com/demo/automatizacion',
  applicationCategory: 'BusinessApplication',
  lowPrice: 990,
  highPrice: 35000,
  reviewCount: 41,
  ratingValue: 4.8,
  featureList: [
    'Visual workflow builder drag-drop con 500+ integraciones',
    'AI nodes: LLM, embedding, RAG, vision, STT/TTS',
    'Code nodes JS/Python sandboxed + custom nodes SDK',
    'Versioning git-backed, environments, replay y debug step-through',
  ],
});

export default function AutomatizacionLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Automatización Workflows', url: '/demo/automatizacion' },
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
