import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-code-review-ia');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Code Review IA',
  description:
    'Plataforma de code review con IA: SAST/DAST/SCA, test generation, refactoring y analytics de calidad. Integraciones con GitHub, GitLab, Bitbucket y Azure DevOps.',
  url: 'https://koptup.com/demo/code-review-ia',
  applicationCategory: 'DeveloperApplication',
  lowPrice: 19,
  highPrice: 5000,
  reviewCount: 58,
  ratingValue: 4.9,
  featureList: [
    'AI review por archivo (style, bugs, security, performance, design)',
    'SAST + DAST + SCA + SBOM + license compliance',
    'Test generation auto y refactoring suggestions con LLM',
    'Integraciones: GitHub, GitLab, Bitbucket, Azure DevOps',
  ],
});

export default function CodeReviewIaLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Code Review IA', url: '/demo/code-review-ia' },
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
