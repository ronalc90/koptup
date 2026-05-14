import { Metadata } from 'next';
import {
  generateMetadata,
  getBreadcrumbSchema,
  getSoftwareApplicationSchema,
} from '@/lib/seo-config';

export const metadata: Metadata = generateMetadata('demo-saas-boilerplate');

const softwareSchema = getSoftwareApplicationSchema({
  name: 'KopTup SaaS Boilerplate Multi-tenant',
  description:
    'Boilerplate de SaaS multi-tenant con auth SSO + MFA, billing Stripe + Paddle, audit logs Vanta-style y observability lista.',
  url: 'https://koptup.com/demo/saas-boilerplate',
  applicationCategory: 'DeveloperApplication',
  lowPrice: 499,
  highPrice: 40000,
  reviewCount: 42,
  ratingValue: 4.9,
  featureList: [
    'Multi-tenancy: shared-DB con RLS, schema o DB por tenant',
    'Auth completo: SSO SAML/OIDC, MFA, passkeys, magic links',
    'Billing Stripe + Paddle con trials, usage-based, dunning',
    'Audit logs Vanta-style, feature flags y i18n completo',
  ],
});

export default function SaasBoilerplateLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Inicio', url: '/' },
    { name: 'Demos', url: '/demo' },
    { name: 'SaaS Boilerplate', url: '/demo/saas-boilerplate' },
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
