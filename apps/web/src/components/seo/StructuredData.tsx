/**
 * Structured Data Component for SEO
 * Implements Schema.org JSON-LD markup for better search engine understanding
 */

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
    url: 'https://koptup.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://koptup.com/og-image.png',
      width: 1200,
      height: 630,
    },
    description:
      'KopTup es una empresa de desarrollo de software a medida fundada en Colombia. Desarrollamos aplicaciones web, chatbots con inteligencia artificial (GPT-4, Claude AI), e-commerce, aplicaciones móviles, dashboards ejecutivos y sistemas de automatización para empresas en Colombia y todo el mundo. Trabajamos 100% remoto con clientes en Latinoamérica, España y Estados Unidos.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. 68 #1-63',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
      postalCode: '111321',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: '+57-302-479-4842',
        email: 'ronald@koptup.com',
        availableLanguage: ['Spanish', 'English'],
        areaServed: 'Worldwide',
      },
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: 'https://koptup.com/contact',
        availableLanguage: ['Spanish', 'English'],
      },
    ],
    sameAs: [
      'https://www.linkedin.com/company/koptup',
      'https://github.com/koptup',
      'https://www.instagram.com/koptup',
      'https://x.com/koptup',
    ],
    founder: {
      '@type': 'Person',
      name: 'Ronald Cipagauta',
      jobTitle: 'CEO & Founder',
    },
    foundingDate: '2019',
    numberOfEmployees: { '@type': 'QuantitativeValue', value: 5 },
    areaServed: [
      { '@type': 'Country', name: 'Colombia' },
      { '@type': 'Country', name: 'México' },
      { '@type': 'Country', name: 'Argentina' },
      { '@type': 'Country', name: 'Chile' },
      { '@type': 'Country', name: 'España' },
      { '@type': 'Country', name: 'United States' },
    ],
    knowsAbout: [
      'Desarrollo de software a medida',
      'Aplicaciones web con React y Next.js',
      'Aplicaciones móviles con React Native',
      'E-commerce y tiendas online',
      'Chatbots con inteligencia artificial GPT-4',
      'Chatbots con Claude AI de Anthropic',
      'Automatización de procesos con IA',
      'Dashboards ejecutivos y business intelligence',
      'Integración con WhatsApp Business API',
      'Machine Learning y análisis predictivo',
      'Consultoría tecnológica y transformación digital',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Servicios de Desarrollo de Software',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Chatbots con IA para empresas', url: 'https://koptup.com/chatbots-ia' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Soluciones de Inteligencia Artificial', url: 'https://koptup.com/soluciones-ia' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Desarrollo web a medida', url: 'https://koptup.com/desarrollo-web-colombia' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'E-commerce profesional' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Aplicaciones móviles iOS y Android' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consultoría tecnológica' } },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '67',
      bestRating: '5',
      worstRating: '1',
    },
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

  const getLocalBusinessSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://koptup.com/#localbusiness',
    name: 'KopTup - Soluciones Tecnológicas',
    description:
      'Empresa de desarrollo de software a medida en Bogotá, Colombia. E-commerce, chatbots con IA, dashboards, aplicaciones móviles y soluciones tecnológicas personalizadas.',
    url: 'https://koptup.com',
    telephone: '+57-302-479-4842',
    email: 'ronald@koptup.com',
    image: 'https://koptup.com/og-image.png',
    logo: 'https://koptup.com/logo.svg',
    priceRange: '$$ - $$$$',
    currenciesAccepted: 'COP, USD',
    paymentAccepted: 'Transferencia bancaria, tarjeta de crédito',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Av. 68 #1-63',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      postalCode: '111321',
      addressCountry: 'CO',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '4.6097',
      longitude: '-74.0817',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
    sameAs: ['https://www.linkedin.com/company/koptup'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '50',
      bestRating: '5',
      worstRating: '1',
    },
    hasMap: 'https://maps.google.com/?q=Av.+68+%231-63,+Bogotá,+Colombia',
    areaServed: [
      { '@type': 'Country', name: 'Colombia' },
      { '@type': 'Country', name: 'México' },
      { '@type': 'Country', name: 'Argentina' },
      { '@type': 'Country', name: 'España' },
    ],
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
