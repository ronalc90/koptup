import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-lms');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup LMS / E-learning',
  description:
    'Plataforma educativa LMS con AI Tutor 1:1, adaptive learning, live classes y gamification completa (XP, badges, leaderboards, certificados verificables).',
  url: 'https://koptup.com/demo/lms',
  applicationCategory: 'EducationalApplication',
  lowPrice: 9,
  highPrice: 18000,
  reviewCount: 71,
  ratingValue: 4.9,
  featureList: [
    'AI Tutor 1:1 conversacional y quizzes auto-generados',
    'Adaptive learning paths basados en performance',
    'Live classes con breakout rooms y subtítulos multi-idioma',
    'Gamification: XP, badges, leaderboards, certificados verificables',
  ],
});

export default function LmsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'LMS / E-learning', url: '/demo/lms' },
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
