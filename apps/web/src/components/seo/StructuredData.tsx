/**
 * Structured Data Component for SEO
 * Implements Schema.org JSON-LD markup for better search engine understanding
 *
 * Regla: no publicar cifras ni datos que no podamos respaldar (ratings,
 * reseñas, número de clientes o de empleados, año de fundación, países
 * atendidos, modelos de IA que no se usan). Por eso no hay `aggregateRating`,
 * `foundingDate` ni `numberOfEmployees`.
 */

import { RAG_PLANS } from '@/lib/rag-plans';
import { BUSINESS_HOURS, HOME_DESCRIPTION, SITE_URL, SOCIAL_LINKS, absoluteUrl } from '@/lib/site';

// Precio más bajo de los planes RAG (src/lib/rag-plans.ts) para el JSON-LD.
const RAG_LOWEST_COP = Math.min(...RAG_PLANS.map((p) => p.setup.cop));

interface StructuredDataProps {
  type: 'organization' | 'website' | 'service' | 'article' | 'softwareApplication' | 'localBusiness';
  data?: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KopTup',
    alternateName: 'KopTup Soluciones Tecnológicas',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/og-image.png'),
      width: 1200,
      height: 630,
    },
    description:
      'KopTup es un estudio de desarrollo de software a medida en Bogotá, Colombia. Su producto principal son los sistemas RAG: IA que responde con los documentos de cada empresa y cita la fuente. También desarrolla software a medida, chatbots con IA, e-commerce y dashboards ejecutivos.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: '+57-302-479-4842',
        email: 'ronald@koptup.com',
        availableLanguage: ['Spanish', 'English'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: absoluteUrl('/contact'),
        availableLanguage: ['Spanish', 'English'],
      },
    ],
    sameAs: Object.values(SOCIAL_LINKS),
    founder: {
      '@type': 'Person',
      name: 'Ronald Cipagauta',
      jobTitle: 'Fundador',
    },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    knowsAbout: [
      'Sistemas RAG (retrieval augmented generation)',
      'Desarrollo de software a medida',
      'Aplicaciones web con Next.js y Node.js',
      'Chatbots con IA para web y WhatsApp',
      'E-commerce y tiendas en línea',
      'Dashboards ejecutivos',
      'Automatización de procesos',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de Desarrollo de Software',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chatbots RAG para WhatsApp y web', url: absoluteUrl('/chatbots-ia') } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Soluciones de Inteligencia Artificial', url: absoluteUrl('/soluciones-ia') } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Desarrollo web a medida', url: absoluteUrl('/desarrollo-web-colombia') } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'E-commerce profesional' } },
      ],
    },
  });

  const getWebsiteSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KopTup',
    url: SITE_URL,
    description: HOME_DESCRIPTION,
    inLanguage: 'es-CO',
  });

  const getSoftwareApplicationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    // Es el producto de la home (sistemas RAG): nombre, descripción y
    // funciones coinciden con los planes cuyo precio se publica en `offers`.
    name: 'KopTup - Sistemas RAG para empresas',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    // Planes RAG de /services#planes-rag (sin highPrice: Empresarial es "desde").
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: String(RAG_LOWEST_COP),
      priceCurrency: 'COP',
      offerCount: String(RAG_PLANS.length),
      url: absoluteUrl('/services#planes-rag'),
    },
    description: HOME_DESCRIPTION,
    featureList: [
      'Respuestas basadas en los documentos de tu empresa',
      'Cita la fuente de cada respuesta',
      'Dice "no encontré esa información" cuando la respuesta no está en tus documentos',
      'Fuentes: carga manual de documentos y páginas web; conectores a Google Drive o SharePoint que se construyen en cada proyecto',
      'Widget web; canal de WhatsApp que se construye en cada proyecto (plan Profesional)',
      'Permisos por rol y panel de métricas que se construyen en cada proyecto (plan Profesional)',
      'Despliegue en la nube del cliente u on-premise (plan Empresarial)',
    ],
  });

  const getServiceSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'KopTup - Desarrollo de Software',
    description:
      'Servicios profesionales de desarrollo de software a medida para empresas. Aplicaciones web, móviles, e-commerce y soluciones con inteligencia artificial.',
    priceRange: '$$ - $$$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bogotá',
      addressCountry: 'CO',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: BUSINESS_HOURS.opens,
      closes: BUSINESS_HOURS.closes,
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de Desarrollo',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Desarrollo Web a Medida',
            description: 'Aplicaciones web personalizadas con React, Next.js y Node.js.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'E-Commerce',
            description: 'Tiendas en línea completas con carrito, checkout y gestión de inventario.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Chatbots con IA',
            description: 'Asistentes virtuales inteligentes para atención al cliente y automatización.',
          },
        },
      ],
    },
  });

  const getLocalBusinessSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: 'KopTup - Soluciones Tecnológicas',
    description:
      'Empresa de desarrollo de software a medida en Bogotá, Colombia. E-commerce, chatbots con IA, dashboards, aplicaciones móviles y soluciones tecnológicas personalizadas.',
    url: SITE_URL,
    telephone: '+57-302-479-4842',
    email: 'ronald@koptup.com',
    image: absoluteUrl('/og-image.png'),
    logo: absoluteUrl('/logo.svg'),
    priceRange: '$$ - $$$$',
    currenciesAccepted: 'COP, USD',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: BUSINESS_HOURS.opens,
        closes: BUSINESS_HOURS.closes,
      },
    ],
    sameAs: Object.values(SOCIAL_LINKS),
    areaServed: { '@type': 'Country', name: 'Colombia' },
  });

  const getSchemaByType = () => {
    switch (type) {
      case 'organization':
        return getOrganizationSchema();
      case 'website':
        return getWebsiteSchema();
      case 'service':
        return getServiceSchema();
      case 'softwareApplication':
        return getSoftwareApplicationSchema();
      case 'localBusiness':
        return getLocalBusinessSchema();
      case 'article':
        return data;
      default:
        return getOrganizationSchema();
    }
  };

  const schema = getSchemaByType();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
