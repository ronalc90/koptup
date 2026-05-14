import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-hrms');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup HRMS / Gestión RRHH',
  description:
    'HRMS completo con ATS, onboarding, performance, payroll multi-país (Colombia, México, Argentina) y AI insights de retención predictiva y eNPS.',
  url: 'https://koptup.com/demo/hrms',
  applicationCategory: 'BusinessApplication',
  lowPrice: 6,
  highPrice: 12000,
  reviewCount: 49,
  ratingValue: 4.7,
  featureList: [
    'ATS con scoring CV IA y screening calls automáticas',
    'Onboarding / offboarding con e-sign de contratos',
    'Payroll multi-país con compliance laboral (CO, MX, AR)',
    'AI: retención predicha, eNPS sentiment y salary benchmarks',
  ],
});

export default function HrmsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'HRMS / Gestión RRHH', url: '/demo/hrms' },
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
