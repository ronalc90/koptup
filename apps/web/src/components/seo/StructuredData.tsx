/**
 * Structured Data Component for SEO
 * Implements Schema.org JSON-LD markup for better search engine understanding
 *
 * Regla: no publicar cifras ni datos que no podamos respaldar (ratings,
 * reseñas, número de clientes o de empleados, año de fundación, países
 * atendidos, modelos de IA que no se usan). Por eso no hay `aggregateRating`,
 * `foundingDate` ni `numberOfEmployees`.
 *
 * Idioma: el componente lee el locale de la petición (next-intl). En /en los
 * textos y las URLs de página salen en inglés; en español, el marcado no cambia.
 */

import { getLocale } from 'next-intl/server';
import { RAG_PLANS } from '@/lib/rag-plans';
import { localizedUrl } from '@/lib/i18n-url';
import {
  BUSINESS_HOURS,
  HOME_DESCRIPTION,
  HOME_DESCRIPTION_EN,
  ORGANIZATION_DESCRIPTION,
  ORGANIZATION_DESCRIPTION_EN,
  SITE_URL,
  SOCIAL_LINKS,
  absoluteUrl,
} from '@/lib/site';

// Precio más bajo de los planes RAG (src/lib/rag-plans.ts) para el JSON-LD.
const RAG_LOWEST_COP = Math.min(...RAG_PLANS.map((p) => p.setup.cop));

interface StructuredDataProps {
  type: 'organization' | 'website' | 'service' | 'article' | 'softwareApplication' | 'localBusiness';
  data?: any;
}

export default async function StructuredData({ type, data }: StructuredDataProps) {
  const locale = await getLocale();
  const en = locale === 'en';

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
    description: en ? ORGANIZATION_DESCRIPTION_EN : ORGANIZATION_DESCRIPTION,
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
        url: localizedUrl('/contact', locale),
        availableLanguage: ['Spanish', 'English'],
      },
    ],
    sameAs: Object.values(SOCIAL_LINKS),
    founder: {
      '@type': 'Person',
      name: 'Ronald Cipagauta',
      jobTitle: en ? 'Founder' : 'Fundador',
    },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    knowsAbout: en
      ? [
          'RAG systems (retrieval augmented generation)',
          'Custom software development',
          'Web applications with Next.js and Node.js',
          'AI chatbots for web and WhatsApp',
          'E-commerce and online stores',
          'Executive dashboards',
          'Process automation',
        ]
      : [
          'Sistemas RAG (retrieval augmented generation)',
          'Desarrollo de software a medida',
          'Aplicaciones web con Next.js y Node.js',
          'Chatbots con IA para web y WhatsApp',
          'E-commerce y tiendas en línea',
          'Dashboards ejecutivos',
          'Automatización de procesos',
        ],
    hasOfferCatalog: en
      ? {
          '@type': 'OfferCatalog',
          name: 'Software Development Services',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'RAG chatbots for WhatsApp and web', url: localizedUrl('/chatbots-ia', locale) } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Artificial intelligence solutions', url: localizedUrl('/soluciones-ia', locale) } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Custom web development', url: localizedUrl('/desarrollo-web-colombia', locale) } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Professional e-commerce' } },
          ],
        }
      : {
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
    description: en ? HOME_DESCRIPTION_EN : HOME_DESCRIPTION,
    inLanguage: en ? 'en' : 'es-CO',
  });

  const getSoftwareApplicationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    // Es el producto de la home (sistemas RAG): nombre, descripción y
    // funciones coinciden con los planes cuyo precio se publica en `offers`.
    name: en ? 'KopTup - RAG systems for companies' : 'KopTup - Sistemas RAG para empresas',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    // Planes RAG de /services#planes-rag (sin highPrice: Empresarial es "desde").
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: String(RAG_LOWEST_COP),
      priceCurrency: 'COP',
      offerCount: String(RAG_PLANS.length),
      url: localizedUrl('/services#planes-rag', locale),
    },
    description: en ? HOME_DESCRIPTION_EN : HOME_DESCRIPTION,
    featureList: en
      ? [
          "Answers based on your company's documents",
          'Cites the source of each answer',
          'Says "I couldn\'t find that information" when the answer is not in your documents',
          'Sources: manual upload of documents and web pages; Google Drive or SharePoint connectors built in each project',
          'Web widget; WhatsApp channel built in each project (Professional plan)',
          'Role-based permissions and metrics dashboard built in each project (Professional plan)',
          'Deployment on your cloud or on-premise (Enterprise plan)',
        ]
      : [
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
    name: en ? 'KopTup - Software Development' : 'KopTup - Desarrollo de Software',
    description: en
      ? 'Professional custom software development for companies. Web, mobile and e-commerce applications and solutions with artificial intelligence.'
      : 'Servicios profesionales de desarrollo de software a medida para empresas. Aplicaciones web, móviles, e-commerce y soluciones con inteligencia artificial.',
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
      name: en ? 'Development Services' : 'Servicios de Desarrollo',
      itemListElement: en
        ? [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Custom Web Development',
                description: 'Custom web applications with React, Next.js and Node.js.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'E-Commerce',
                description: 'Complete online stores with cart, checkout and inventory management.',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'AI Chatbots',
                description: 'Intelligent virtual assistants for customer service and automation.',
              },
            },
          ]
        : [
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
    description: en
      ? 'Custom software development company in Bogotá, Colombia. E-commerce, AI chatbots, dashboards, mobile apps and custom technology solutions.'
      : 'Empresa de desarrollo de software a medida en Bogotá, Colombia. E-commerce, chatbots con IA, dashboards, aplicaciones móviles y soluciones tecnológicas personalizadas.',
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
