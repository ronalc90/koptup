/**
 * SEO Configuration for all pages
 * Centralized metadata for better maintainability and SEO optimization
 */

import { Metadata } from 'next';

const baseUrl = 'https://koptup.com';

export interface PageSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
}

export const seoConfig: Record<string, PageSEO> = {
  // Homepage
  home: {
    title: 'KopTup - Desarrollo de Software a Medida | Demos Interactivas',
    description:
      'KopTup: empresa de desarrollo de software a medida en Colombia. Creamos e-commerce, chatbots con IA, dashboards ejecutivos, apps móviles y soluciones tecnológicas personalizadas. Prueba nuestras demos gratuitas.',
    keywords: [
      'desarrollo de software a medida',
      'empresa de software Colombia',
      'software personalizado empresas',
      'desarrollo web Colombia',
      'aplicaciones web a medida',
      'e-commerce Colombia',
      'chatbot inteligencia artificial',
      'dashboard ejecutivo',
      'transformación digital',
      'desarrollo software Bogotá',
    ],
    canonical: baseUrl,
  },

  // Services page
  services: {
    title: 'Servicios de Desarrollo de Software | E-commerce, IA, Apps Móviles',
    description:
      'Servicios profesionales de desarrollo de software a medida: e-commerce, chatbots con IA, aplicaciones móviles, dashboards, integración de sistemas, consultoría tecnológica y diseño UX/UI. Soluciones para empresas en Colombia y Latinoamérica.',
    keywords: [
      'servicios desarrollo software',
      'desarrollo e-commerce',
      'chatbot con IA',
      'aplicaciones móviles',
      'dashboard empresarial',
      'integración de sistemas',
      'consultoría tecnológica',
      'diseño UX UI',
      'desarrollo web profesional',
      'software empresarial',
      'automatización procesos',
      'seguridad informática',
    ],
    canonical: `${baseUrl}/services`,
  },

  // Pricing page
  pricing: {
    title: 'Planes y Precios | Software a Medida desde $499 USD',
    description:
      'Planes de desarrollo de software a medida para cada necesidad. Desde proyectos básicos ($499 USD) hasta soluciones enterprise personalizadas. Incluye diseño, desarrollo, deploy y soporte. Cotización sin compromiso.',
    keywords: [
      'precios desarrollo software',
      'costo software a medida',
      'planes software empresarial',
      'cotización desarrollo web',
      'precio aplicación móvil',
      'desarrollo software Colombia precios',
      'planes tecnológicos empresas',
      'inversión software',
    ],
    canonical: `${baseUrl}/pricing`,
  },

  // Contact page
  contact: {
    title: 'Contacto | Solicita tu Cotización de Software Gratis',
    description:
      'Contacta con KopTup para solicitar tu cotización de desarrollo de software sin compromiso. Respondemos en menos de 24 horas. WhatsApp, email y llamada disponibles. Bogotá, Colombia.',
    keywords: [
      'contacto empresa software',
      'cotización software Colombia',
      'presupuesto desarrollo web',
      'consultoría software gratis',
      'contactar desarrolladores',
      'empresa software Bogotá',
      'solicitar propuesta tecnológica',
    ],
    canonical: `${baseUrl}/contact`,
  },

  // About page
  about: {
    title: 'Sobre Nosotros | KopTup - Empresa de Software en Bogotá',
    description:
      'Conoce al equipo de KopTup: empresa de desarrollo de software a medida en Bogotá, Colombia. Expertos en React, Next.js, Node.js, IA y cloud computing. Más de 100 proyectos entregados con éxito.',
    keywords: [
      'equipo koptup',
      'empresa software bogotá',
      'quiénes somos koptup',
      'desarrolladores colombia',
      'empresa tecnología colombia',
      'startup software bogotá',
      'expertos react nextjs',
      'desarrollo software equipo',
    ],
    canonical: `${baseUrl}/about`,
  },

  // Demo hub page
  demo: {
    title: 'Demos Interactivas | Prueba Gratis Nuestras Soluciones de Software',
    description:
      'Explora demos interactivas y funcionales de nuestras soluciones: e-commerce, chatbot IA, dashboard ejecutivo, gestor de documentos, sistema de reservas, CMS y más. Sin registro ni tarjeta de crédito.',
    keywords: [
      'demos software interactivas',
      'prueba software gratis',
      'demo ecommerce',
      'demo chatbot IA',
      'demo dashboard',
      'demo gestión documental',
      'demo sistema reservas',
      'software demo gratuito',
      'prototipo funcional software',
    ],
    canonical: `${baseUrl}/demo`,
  },

  // Privacy page
  privacy: {
    title: 'Política de Privacidad | KopTup',
    description:
      'Política de privacidad de KopTup. Cómo recopilamos, usamos y protegemos tu información personal. Cumplimiento con la Ley 1581 de 2012 (Colombia) y GDPR.',
    keywords: ['política privacidad', 'protección datos', 'GDPR', 'ley 1581', 'privacidad koptup'],
    canonical: `${baseUrl}/privacy`,
  },

  // Terms page
  terms: {
    title: 'Términos y Condiciones | KopTup',
    description:
      'Términos y condiciones de uso de los servicios de KopTup. Condiciones de contratación, responsabilidades, pagos y garantías para desarrollo de software a medida.',
    keywords: ['términos condiciones', 'condiciones uso', 'términos servicio koptup', 'contrato software'],
    canonical: `${baseUrl}/terms`,
  },

  // Cookies page
  cookies: {
    title: 'Política de Cookies | KopTup',
    description:
      'Política de cookies de KopTup. Qué cookies usamos, para qué sirven y cómo puedes gestionarlas o desactivarlas en tu navegador.',
    keywords: ['política cookies', 'cookies koptup', 'gestión cookies', 'cookies sitio web'],
    canonical: `${baseUrl}/cookies`,
  },

  // DEMOS MÉDICOS

  // Demo: Cuentas Médicas (Auditoría)
  'demo-cuentas-medicas': {
    title: 'Auditoría de Cuentas Médicas con IA | Gestión de Glosas',
    description:
      'Sistema automatizado de auditoría de cuentas médicas con inteligencia artificial. Detecta y previene glosas administrativas y técnicas. Valida tarifas SOAT, ISS 2001, ISS 2004 y contratos EPS (Nueva EPS, Salud Total, Compensar). Reduce rechazos hasta 80%. Demo gratuito.',
    keywords: [
      'auditoría cuentas médicas',
      'auditoría médica automatizada',
      'glosas médicas',
      'gestión glosas hospitalarias',
      'validación facturas médicas',
      'glosas administrativas',
      'glosas técnicas',
      'reducción glosas',
      'tarifas SOAT',
      'tarifas ISS 2001',
      'tarifas ISS 2004',
      'contratos Nueva EPS',
      'contratos Salud Total',
      'contratos Compensar',
      'liquidación cuentas médicas',
      'radicación cuentas médicas',
      'facturación IPS',
      'auditoría IPS',
      'software auditoría médica',
      'inteligencia artificial salud',
      'IA auditoría médica',
      'validación CUPS',
      'validación CIE-10',
      'resolución 3047',
      'ley 100',
    ],
    canonical: `${baseUrl}/demo/cuentas-medicas`,
  },

  // Demo: Chatbot Médico
  'demo-chatbot': {
    title: 'Chatbot Médico con IA | Asistente Virtual para el Sector Salud',
    description:
      'Chatbot inteligente especializado en salud. Consulta normatividad (Ley 100, Resolución 3047), códigos CUPS, CIE-10, tarifas médicas y procedimientos. Integra documentos de conocimiento con IA. Respuestas instantáneas basadas en contratos EPS y guías clínicas. Demo interactivo.',
    keywords: [
      'chatbot médico',
      'chatbot salud',
      'asistente virtual médico',
      'asistente IA salud',
      'bot médico inteligente',
      'chatbot normatividad salud',
      'consulta códigos CUPS',
      'consulta CIE-10',
      'chatbot ley 100',
      'chatbot resolución 3047',
      'asistente contratos EPS',
      'chatbot tarifas médicas',
      'IA conversacional salud',
      'bot facturación médica',
      'asistente IPS',
      'chatbot hospital',
      'inteligencia artificial médica',
      'NLP salud',
      'procesamiento lenguaje natural médico',
      'chatbot personalizado salud',
    ],
    canonical: `${baseUrl}/demo/chatbot`,
  },

  // Demo: Gestor de Contenido
  'demo-gestor-contenido': {
    title: 'Gestor de Contenido con IA | Emails y Documentos Médicos',
    description:
      'Generador automático de contenido médico con inteligencia artificial. Crea emails corporativos, comunicados, informes médicos y documentos administrativos. Templates personalizables para IPS y hospitales. Exporta a PDF, copia a email. Optimiza comunicación institucional. Prueba gratis.',
    keywords: [
      'gestor contenido médico',
      'generador emails médicos',
      'IA generación contenido',
      'plantillas emails IPS',
      'documentos médicos automáticos',
      'comunicados médicos',
      'emails corporativos salud',
      'informes médicos IA',
      'redacción automática médica',
      'templates documentos salud',
      'gestión documental IPS',
      'comunicación institucional salud',
      'generador informes médicos',
      'IA escritura médica',
      'automatización documentos salud',
    ],
    canonical: `${baseUrl}/demo/gestor-contenido`,
  },

  // Demo: Gestor de Documentos
  'demo-gestor-documentos': {
    title: 'Gestor Documental Médico | Organización de Archivos Clínicos',
    description:
      'Sistema de gestión documental para instituciones de salud. Organiza historias clínicas, resultados de exámenes, consentimientos informados y documentos administrativos. Búsqueda inteligente, control de versiones, carpetas por paciente. Cumple normatividad de archivo clínico. Demo online.',
    keywords: [
      'gestor documental médico',
      'gestión documentos clínicos',
      'archivo digital médico',
      'historias clínicas digitales',
      'organización documentos IPS',
      'gestión archivos hospital',
      'documentos médicos digitales',
      'sistema archivo clínico',
      'gestión consentimientos informados',
      'control versiones documentos médicos',
      'búsqueda documentos clínicos',
      'carpetas pacientes',
      'gestión documental salud',
      'digitalización documentos médicos',
      'normatividad archivo clínico',
    ],
    canonical: `${baseUrl}/demo/gestor-documentos`,
  },

  // DEMOS GENERALES

  // Demo: E-commerce
  'demo-ecommerce': {
    title: 'Plataforma E-commerce Completa | Tienda Online Profesional',
    description:
      'Solución e-commerce completa con carrito de compras, pasarelas de pago, gestión de inventario y panel de administración. Sistema moderno y escalable para ventas online. Integración con medios de pago colombianos. Responsive y optimizado. Demo funcional.',
    keywords: [
      'plataforma ecommerce',
      'tienda online Colombia',
      'carrito compras',
      'pasarela pago Colombia',
      'sistema ventas online',
      'ecommerce profesional',
      'tienda virtual',
      'comercio electrónico',
      'software ecommerce',
      'plataforma ventas',
    ],
    canonical: `${baseUrl}/demo/ecommerce`,
  },

  // Demo: Dashboard Ejecutivo
  'demo-dashboard-ejecutivo': {
    title: 'Dashboard Ejecutivo | Análisis de Datos en Tiempo Real',
    description:
      'Dashboard ejecutivo con KPIs, métricas y análisis de datos en tiempo real. Visualización de indicadores clave, gráficos interactivos y reportes automáticos. Toma de decisiones basada en datos. Personalizable por sector. Demo interactivo.',
    keywords: [
      'dashboard ejecutivo',
      'análisis datos tiempo real',
      'KPIs empresariales',
      'métricas negocio',
      'business intelligence',
      'visualización datos',
      'reportes ejecutivos',
      'panel control empresarial',
      'indicadores gestión',
      'análisis empresarial',
    ],
    canonical: `${baseUrl}/demo/dashboard-ejecutivo`,
  },

  // Demo: Control de Proyectos
  'demo-control-proyectos': {
    title: 'Gestión de Proyectos | Software de Control y Seguimiento',
    description:
      'Sistema completo de gestión de proyectos. Planificación, asignación de tareas, seguimiento de avances, gestión de recursos y cronogramas. Metodologías ágiles integradas. Colaboración en equipo. Reportes de progreso. Demo funcional.',
    keywords: [
      'gestión proyectos',
      'control proyectos',
      'software proyectos',
      'planificación proyectos',
      'seguimiento tareas',
      'gestión equipos',
      'metodologías ágiles',
      'scrum',
      'kanban',
      'cronograma proyectos',
    ],
    canonical: `${baseUrl}/demo/control-proyectos`,
  },

  // Demo: Sistema de Reservas
  'demo-sistema-reservas': {
    title: 'Sistema de Reservas Online | Gestión de Citas y Agendamiento',
    description:
      'Plataforma de reservas y agendamiento online. Calendario inteligente, gestión de citas, confirmaciones automáticas, recordatorios por email/SMS. Integración con Google Calendar. Multi-usuario. Ideal para consultorios, spas, restaurantes. Prueba gratis.',
    keywords: [
      'sistema reservas',
      'agendamiento online',
      'citas online',
      'calendario reservas',
      'gestión citas',
      'reservas automáticas',
      'sistema turnos',
      'agendamiento médico',
      'reservas consultorios',
      'booking system',
    ],
    canonical: `${baseUrl}/demo/sistema-reservas`,
  },

  // Demo: Sistema Experto
  'demo-sistema-experto': {
    title: 'Sistema Experto con IA | Toma de Decisiones Inteligente',
    description:
      'Sistema experto basado en inteligencia artificial para toma de decisiones complejas. Motor de inferencia, base de conocimiento, reglas de negocio. Recomendaciones automatizadas basadas en datos. Explicabilidad de decisiones. Demo interactivo.',
    keywords: [
      'sistema experto',
      'IA toma decisiones',
      'inteligencia artificial',
      'motor inferencia',
      'reglas negocio',
      'sistema recomendaciones',
      'decisiones automatizadas',
      'base conocimiento',
      'sistema inteligente',
      'IA empresarial',
    ],
    canonical: `${baseUrl}/demo/sistema-experto`,
  },
};

/**
 * Genera metadata completa para una página
 */
export function generateMetadata(pageKey: string): Metadata {
  const config = seoConfig[pageKey];
  if (!config) {
    console.warn(`No SEO config found for page: ${pageKey}`);
    return {};
  }

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    alternates: {
      canonical: config.canonical || baseUrl,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.canonical || baseUrl,
      siteName: 'KopTup',
      images: [
        {
          url: config.ogImage || '/og-image.png',
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      locale: 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: [config.ogImage || '/og-image.png'],
      creator: '@koptup',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Get breadcrumb structured data
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}
