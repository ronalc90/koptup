import { Metadata } from 'next';
import { pageMetadata, getBreadcrumbSchema } from '@/lib/seo-config';
import { getLocale } from 'next-intl/server';
import { SITE_URL } from '@/lib/site';
import { localizedPath, localizedUrl } from '@/lib/i18n-url';
import { getRagServiceJsonLd } from '@/lib/rag-plans-jsonld';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('services', await getLocale());
}

/** Servicios de /services en el idioma de la página (/en/services o /services). */
function getServicesSchema(locale: string) {
  const en = locale === 'en';
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: en ? 'KopTup - Software Development Services' : 'KopTup - Servicios de Desarrollo de Software',
    url: localizedUrl('/services', locale),
    description: en
      ? 'Custom software development: e-commerce, AI chatbots, mobile apps, dashboards, automation and systems integration.'
      : 'Desarrollo de software a medida: e-commerce, chatbots con IA, apps móviles, dashboards, automatización e integración de sistemas.',
    provider: {
      '@type': 'Organization',
      name: 'KopTup',
      url: SITE_URL,
    },
    areaServed: 'Colombia',
    hasOfferCatalog: en
      ? {
          '@type': 'OfferCatalog',
          name: 'Technology Services',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'E-Commerce', description: 'Complete online stores with payment gateway.' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AI Chatbots', description: 'Intelligent virtual assistants.' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Executive Dashboards', description: 'Indicators and reports connected to your data.' } },
          ],
        }
      : {
          '@type': 'OfferCatalog',
          name: 'Servicios Tecnológicos',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'E-Commerce', description: 'Tiendas online completas con pasarela de pago.' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chatbots con IA', description: 'Asistentes virtuales inteligentes.' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Dashboards Ejecutivos', description: 'Indicadores y reportes conectados a tus datos.' } },
          ],
        },
  };
}

export default async function ServicesLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const en = locale === 'en';
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: en ? 'Home' : 'Inicio', url: localizedPath('/', locale) },
    { name: en ? 'Services' : 'Servicios', url: localizedPath('/services', locale) },
  ]);
  const serviceSchema = getServicesSchema(locale);
  // Planes RAG de la sección #planes-rag (precios visibles en la página).
  const ragServiceSchema = getRagServiceJsonLd(localizedUrl('/services', locale), locale);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ragServiceSchema) }} />
      {children}
    </>
  );
}
