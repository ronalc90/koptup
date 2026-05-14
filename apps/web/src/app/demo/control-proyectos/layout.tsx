import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-control-proyectos');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Control de Proyectos',
  description:
    'Sistema completo de gestión de proyectos: planificación, tareas, recursos, cronogramas y metodologías ágiles (Scrum, Kanban).',
  url: 'https://koptup.com/demo/control-proyectos',
  applicationCategory: 'BusinessApplication',
  lowPrice: 199,
  highPrice: 9000,
  reviewCount: 51,
  ratingValue: 4.8,
  featureList: [
    'Planificación y asignación de tareas',
    'Cronogramas Gantt y Kanban',
    'Gestión de recursos y reportes',
    'Colaboración en equipo',
  ],
});

export default function ControlProyectosLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Control de Proyectos', url: '/demo/control-proyectos' },
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
