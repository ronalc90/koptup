import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-loyalty');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup Loyalty / Fidelización',
  description:
    'Plataforma de fidelización con programas points/tiers/missions, coalitions multi-marca, gamification, personalization ML y Apple/Google Wallet pass.',
  url: 'https://koptup.com/demo/loyalty',
  applicationCategory: 'BusinessApplication',
  lowPrice: 199,
  highPrice: 14000,
  reviewCount: 38,
  ratingValue: 4.8,
  featureList: [
    'Points, tiers, missions, referrals, cashback, sweepstakes',
    'Coalitions multi-marca con shared points pool',
    'Gamification: badges, streaks, challenges, leaderboards',
    'Personalization ML + A/B testing + Wallet pass',
  ],
});

export default function LoyaltyLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'Loyalty / Fidelización', url: '/demo/loyalty' },
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
