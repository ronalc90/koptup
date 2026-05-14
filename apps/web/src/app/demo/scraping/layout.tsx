import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-scraping');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Scraping & Data Extraction',
  description:
    'Plataforma de scraping con visual builder, AI extraction, proxy rotation, captcha solving y auto-fix con LLM cuando cambia el DOM.',
  url: 'https://koptup.com/demo/scraping',
  applicationCategory: 'BusinessApplication',
  lowPrice: 79,
  highPrice: 12000,
  reviewCount: 36,
  ratingValue: 4.7,
  featureList: [
    'Visual builder point-and-click + AI extraction con schemas',
    'Proxy rotation (datacenter, residential, mobile) + captchas',
    'Anti-bot evasion: fingerprinting, stealth, human-like',
    'Auto-fix con LLM cuando cambia el DOM + diff detection',
  ],
});

export default function ScrapingLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Scraping & Data Extraction', url: '/demo/scraping' },
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
