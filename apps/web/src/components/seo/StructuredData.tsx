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
    logo: 'https://koptup.com/logo.png',
    description:
      'Plataforma líder en auditoría médica automatizada con IA. Gestión de glosas, facturación hospitalaria y soluciones tecnológicas para el sector salud en Colombia.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CO',
      addressLocality: 'Colombia',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Spanish', 'English'],
      email: 'soporte@koptup.com',
    },
    sameAs: [
      'https://www.linkedin.com/company/koptup',
      'https://twitter.com/koptup',
      'https://www.facebook.com/koptup',
    ],
    founder: {
      '@type': 'Person',
      name: 'KopTup Team',
    },
    foundingDate: '2024',
    areaServed: {
      '@type': 'Country',
      name: 'Colombia',
    },
  });

  const getWebsiteSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KopTup',
    url: 'https://koptup.com',
    description:
      'Auditoría médica automatizada con IA, gestión de glosas y facturación en salud para IPS, hospitales y clínicas en Colombia.',
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
    name: 'KopTup - Auditoría Médica con IA',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'COP',
    },
    description:
      'Plataforma de auditoría médica automatizada con inteligencia artificial para la gestión de glosas, facturación hospitalaria y liquidación de cuentas médicas.',
    featureList: [
      'Auditoría médica automatizada con IA',
      'Gestión de glosas administrativas y técnicas',
      'Facturación hospitalaria optimizada',
      'Análisis de tarifas SOAT, ISS y contratos EPS',
      'Liquidación automatizada de cuentas médicas',
      'Validación de códigos CUPS y CIE-10',
      'Chatbot médico inteligente',
      'Gestión documental médica',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
  });

  const getMedicalServiceSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: 'KopTup - Auditoría Médica',
    description:
      'Servicios de auditoría médica automatizada, gestión de glosas y optimización de facturación para instituciones de salud en Colombia.',
    medicalSpecialty: [
      'Auditoría Médica',
      'Gestión de Glosas',
      'Facturación en Salud',
    ],
    priceRange: '$$',
    availableService: [
      {
        '@type': 'MedicalProcedure',
        name: 'Auditoría Médica Automatizada',
        description:
          'Auditoría de cuentas médicas con inteligencia artificial, validación de tarifas y procedimientos.',
      },
      {
        '@type': 'Service',
        name: 'Gestión de Glosas',
        description:
          'Identificación, análisis y gestión de glosas administrativas y técnicas en facturación médica.',
      },
      {
        '@type': 'Service',
        name: 'Liquidación de Cuentas Médicas',
        description:
          'Liquidación automatizada de cuentas médicas con validación de tarifas SOAT, ISS y contratos EPS.',
      },
    ],
  });

  const getFAQSchema = () => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Qué es la auditoría médica automatizada?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La auditoría médica automatizada es un proceso que utiliza inteligencia artificial para revisar, validar y analizar cuentas médicas, procedimientos, tarifas y diagnósticos de forma automática, reduciendo errores y optimizando el proceso de facturación.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo ayuda KopTup a reducir las glosas médicas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KopTup identifica automáticamente posibles glosas antes de la radicación, valida tarifas contra contratos EPS (Nueva EPS, Salud Total, Compensar), verifica códigos CUPS y CIE-10, y sugiere correcciones para evitar rechazos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué tarifas maneja el sistema?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KopTup maneja tarifas SOAT, ISS 2001, ISS 2004, y contratos específicos de EPS como Nueva EPS, Salud Total y Compensar. El sistema valida automáticamente que los valores cobrados correspondan a las tarifas contratadas.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Para qué instituciones está diseñado KopTup?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KopTup está diseñado para IPS (Instituciones Prestadoras de Salud), hospitales, clínicas, centros médicos y cualquier institución que facture servicios de salud en Colombia.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo funciona el chatbot médico?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'El chatbot médico de KopTup utiliza IA para responder consultas sobre normatividad en salud (Ley 100, Resolución 3047), tarifas, códigos CUPS, CIE-10, y procedimientos de facturación, basándose en documentos oficiales y contratos.',
        },
      },
    ],
  });

  const getBreadcrumbSchema = (items: { name: string; url: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });

  const getSchemaByType = () => {
    switch (type) {
      case 'organization':
        return getOrganizationSchema();
      case 'website':
        return getWebsiteSchema();
      case 'service':
        return getMedicalServiceSchema();
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
        name: '¿Qué es la auditoría médica automatizada?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La auditoría médica automatizada es un proceso que utiliza inteligencia artificial para revisar, validar y analizar cuentas médicas, procedimientos, tarifas y diagnósticos de forma automática, reduciendo errores y optimizando el proceso de facturación.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cómo ayuda KopTup a reducir las glosas médicas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KopTup identifica automáticamente posibles glosas antes de la radicación, valida tarifas contra contratos EPS (Nueva EPS, Salud Total, Compensar), verifica códigos CUPS y CIE-10, y sugiere correcciones para evitar rechazos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué tarifas maneja el sistema?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KopTup maneja tarifas SOAT, ISS 2001, ISS 2004, y contratos específicos de EPS como Nueva EPS, Salud Total y Compensar. El sistema valida automáticamente que los valores cobrados correspondan a las tarifas contratadas.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Para qué instituciones está diseñado KopTup?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'KopTup está diseñado para IPS (Instituciones Prestadoras de Salud), hospitales, clínicas, centros médicos y cualquier institución que facture servicios de salud en Colombia.',
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
