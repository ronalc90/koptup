/**
 * Structured Data Component for SEO
 * Implements Schema.org JSON-LD markup for better search engine understanding
 */

interface StructuredDataProps {
  type: 'organization' | 'website' | 'service' | 'article' | 'softwareApplication';
  data?: any;
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const getOrganizationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'KopTup',
    url: 'https://koptup.com',
    logo: 'https://koptup.com/logo.svg',
    description:
      'Empresa de desarrollo de software a medida. Creamos aplicaciones web, móviles, e-commerce, chatbots con IA, dashboards y soluciones tecnológicas personalizadas para empresas en Colombia y Latinoamérica.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. 68 #1-63',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: '+57-302-479-4842',
      email: 'ronald@koptup.com',
      availableLanguage: ['Spanish', 'English'],
    },
    sameAs: [
      'https://www.linkedin.com/company/koptup',
    ],
    founder: {
      '@type': 'Person',
      name: 'KopTup Team',
    },
    foundingDate: '2024',
    areaServed: [
      { '@type': 'Country', name: 'Colombia' },
      { '@type': 'GeoCircle', name: 'Latinoamérica' },
    ],
    knowsAbout: [
      'Desarrollo de software a medida',
      'Aplicaciones web',
      'Aplicaciones móviles',
      'E-commerce',
      'Chatbots con IA',
      'Dashboards empresariales',
      'Automatización de procesos',
    ],
  });

  const getWebsiteSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KopTup',
    url: 'https://koptup.com',
    description:
      'Desarrollo de software a medida para empresas. Prueba nuestras demos interactivas: e-commerce, chatbots IA, dashboards, gestión documental y más.',
    inLanguage: 'es-CO',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://koptup.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  });

  const getSoftwareApplicationSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'KopTup - Software a Medida',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '500',
      highPrice: '50000',
      priceCurrency: 'USD',
      offerCount: '3',
    },
    description:
      'Plataforma de desarrollo de software empresarial a medida. E-commerce, chatbots con IA, dashboards, gestión documental, sistemas de reservas y más.',
    featureList: [
      'E-commerce completo con pasarela de pagos',
      'Chatbots inteligentes con IA',
      'Dashboards ejecutivos con KPIs en tiempo real',
      'Gestión documental con búsqueda avanzada',
      'Sistemas de reservas online',
      'CMS y gestión de contenido',
      'Control de proyectos y tareas',
      'Integraciones con APIs externas',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '50',
      bestRating: '5',
    },
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
      streetAddress: 'Av. 68 #1-63',
      addressLocality: 'Bogotá',
      addressCountry: 'CO',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '4.6097',
      longitude: '-74.0817',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
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
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Aplicaciones Móviles',
            description: 'Apps nativas y multiplataforma para iOS y Android.',
          },
        },
      ],
    },
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

// Export FAQ Schema for pages that need it
export function FAQStructuredData() {
  const getFAQSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué tipo de software desarrolla KopTup?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Desarrollamos software a medida para empresas: e-commerce, chatbots con IA, dashboards ejecutivos, sistemas de gestión documental, plataformas de reservas, CMS, aplicaciones móviles y soluciones personalizadas según las necesidades de cada negocio.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo probar el software antes de contratar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí. Ofrecemos demos interactivas y completamente funcionales de cada tipo de solución que desarrollamos. Puedes probar e-commerce, chatbot IA, dashboards, gestión documental, reservas y más directamente en nuestro sitio web antes de tomar cualquier decisión.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto cuesta desarrollar software a medida con KopTup?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Ofrecemos planes desde $499 USD para proyectos básicos hasta soluciones enterprise personalizadas. El costo final depende de la complejidad, funcionalidades y alcance del proyecto. Contacta con nosotros para recibir una cotización personalizada sin compromiso.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué tecnologías utilizan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Utilizamos tecnologías de vanguardia: React, Next.js, TypeScript, Node.js, Python, MongoDB, PostgreSQL e inteligencia artificial (OpenAI, Claude). Todas nuestras soluciones son escalables, seguras y optimizadas para rendimiento.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Ofrecen soporte después del desarrollo?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí. Todos nuestros planes incluyen soporte técnico post-lanzamiento. Ofrecemos mantenimiento, actualizaciones, monitoreo y soporte continuo para garantizar que tu software evolucione con tu negocio.',
        },
      },
    ],
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(getFAQSchema()) }}
    />
  );
}
