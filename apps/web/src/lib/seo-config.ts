/**
 * SEO Configuration for all pages
 * Centralized metadata for better maintainability and SEO optimization
 *
 * Convenciones:
 * - `title` es solo el título de la página: el sufijo " | KopTup" lo agrega la
 *   plantilla `TITLE_TEMPLATE` (src/lib/site.ts). El `<title>` final no debe
 *   pasar de 60 caracteres; verifícalo con `node scripts/check-titles.mjs`.
 * - No se usa la meta `keywords` (Google la ignora desde 2009 y solo expone la
 *   estrategia de palabras clave a la competencia).
 * - Las URLs absolutas salen de `SITE_URL` (dominio canónico con www).
 */

import { Metadata } from 'next';
import { DEMO_COUNT } from './demos';
import { formatRagCOP, getRagPlan } from './rag-plans';
import { HOME_DESCRIPTION, SITE_NAME, SITE_URL, TITLE_TEMPLATE } from './site';

const baseUrl = SITE_URL;

// Precios citados en la description de /services (fuente: src/lib/rag-plans.ts).
const RAG_PILOT = getRagPlan('piloto');
const RAG_ESSENTIAL = getRagPlan('esencial');

export interface PageSEO {
  title: string;
  description: string;
  ogImage?: string;
  canonical?: string;
}

export const seoConfig: Record<string, PageSEO> = {
  // Homepage. Referencia: la home NO usa esta entrada; su metadata real está
  // en src/app/layout.tsx + src/app/page.tsx (título absoluto HOME_TITLE,
  // "KopTup | …", que no sigue la plantilla).
  home: {
    title: 'IA que responde con los documentos de tu empresa',
    description: HOME_DESCRIPTION,
    canonical: baseUrl,
  },

  // Services page
  services: {
    title: 'Precios de sistemas RAG y software a medida',
    description:
      `Sistemas RAG: piloto de ${RAG_PILOT.weeks.max} semanas por ${formatRagCOP(RAG_PILOT.setup.cop)} y planes desde ${formatRagCOP(RAG_ESSENTIAL.setup.cop)} (precios en COP y USD, más IVA si aplica). Y otras soluciones a medida.`,
    canonical: `${baseUrl}/services`,
  },

  // Pricing page
  pricing: {
    title: 'Planes y Precios',
    description:
      'Planes de sistemas RAG con precios en COP y USD, más IVA si aplica, y otras soluciones de software a medida.',
    // `/pricing` redirige a `/services#planes-rag`: el canónico es /services.
    canonical: `${baseUrl}/services`,
  },

  // Contact page
  contact: {
    title: 'Contacto: Solicita tu Cotización Gratis',
    description:
      'Contacta con KopTup para solicitar tu cotización de desarrollo de software sin compromiso. Respondemos en menos de 24 horas. WhatsApp, email y llamada disponibles. Bogotá, Colombia.',
    canonical: `${baseUrl}/contact`,
  },

  // About page
  about: {
    title: 'Sobre Nosotros: Empresa de Software en Bogotá',
    description:
      'Conoce al equipo de KopTup: empresa de desarrollo de software a medida en Bogotá, Colombia. Expertos en React, Next.js, Node.js, IA y cloud computing.',
    canonical: `${baseUrl}/about`,
  },

  // Demo hub page
  demo: {
    title: 'Prototipos Interactivos: Prueba Antes de Contratar',
    description:
      `Explora ${DEMO_COUNT} prototipos navegables que muestran el rango de soluciones que construimos. Dos usan OpenAI real (chatbot RAG y LinkedIn Ads); el resto son mockups interactivos con datos simulados. Sin registro ni tarjeta de crédito.`,
    canonical: `${baseUrl}/demo`,
  },

  // Privacy page
  privacy: {
    title: 'Política de Privacidad',
    description:
      'Política de privacidad de KopTup. Cómo recopilamos, usamos y protegemos tu información personal. Cumplimiento con la Ley 1581 de 2012 (Colombia) y GDPR.',
    canonical: `${baseUrl}/privacy`,
  },

  // Terms page
  terms: {
    title: 'Términos y Condiciones',
    description:
      'Términos y condiciones de uso de los servicios de KopTup. Condiciones de contratación, responsabilidades, pagos y garantías para desarrollo de software a medida.',
    canonical: `${baseUrl}/terms`,
  },

  // Cookies page
  cookies: {
    title: 'Política de Cookies',
    description:
      'Política de cookies de KopTup. Qué cookies usamos, para qué sirven y cómo puedes gestionarlas o desactivarlas en tu navegador.',
    canonical: `${baseUrl}/cookies`,
  },

  // Landing pages SEO
  'desarrollo-web-colombia': {
    title: 'Desarrollo Web y Software a Medida en Colombia',
    description:
      'Contrata a KopTup para desarrollar tu aplicación web, chatbot con IA, e-commerce o sistema empresarial. Empresa de desarrollo de software a medida en Colombia, trabajamos con clientes en todo el mundo. Cotización gratis.',
    canonical: `${baseUrl}/desarrollo-web-colombia`,
  },

  // Usada por src/app/chatbots-ia/layout.tsx (precios de rag-plans.ts).
  'chatbots-ia': {
    title: 'Chatbots RAG para WhatsApp y web',
    description:
      `Chatbots RAG para WhatsApp y tu sitio web: responden con los documentos de tu empresa y citan la fuente. Desde ${formatRagCOP(RAG_ESSENTIAL.setup.cop)}, o piloto de ${formatRagCOP(RAG_PILOT.setup.cop)}.`,
    canonical: `${baseUrl}/chatbots-ia`,
  },

  // Usada por src/app/soluciones-ia/layout.tsx (sistemas RAG primero).
  'soluciones-ia': {
    title: 'Soluciones de Inteligencia Artificial para Empresas',
    description:
      'Soluciones de IA para empresas en Colombia: sistemas RAG que responden con tus documentos y citan la fuente, chatbots, automatización y análisis predictivo.',
    canonical: `${baseUrl}/soluciones-ia`,
  },

  // Sistemas RAG: página principal y landings por sector (src/app/rag/*).
  // /rag usa un `<title>` absoluto (ver src/app/rag/page.tsx) igual a
  // "<title> | KopTup"; las landings usan la plantilla.
  rag: {
    title: 'Sistemas RAG para empresas en Colombia',
    description:
      `Sistemas RAG (retrieval augmented generation) para empresas en Colombia: un chatbot con los documentos de tu empresa que cita la fuente. Piloto en ${RAG_PILOT.weeks.max} semanas.`,
    canonical: `${baseUrl}/rag`,
  },

  'rag-salud': {
    title: 'RAG para salud: protocolos, normativa y auditoría',
    description:
      'RAG para salud: IA que responde con tus protocolos clínicos y la normativa del sector, cita la fuente y apoya la auditoría de cuentas médicas.',
    canonical: `${baseUrl}/rag/salud`,
  },

  'rag-legal': {
    title: 'Buscar en contratos con IA: RAG para áreas legales',
    description:
      'Busca en contratos con IA: un sistema RAG que responde con tus contratos, conceptos jurídicos internos y normativa, y cita la cláusula de donde sale.',
    canonical: `${baseUrl}/rag/legal`,
  },

  'rag-soporte': {
    title: 'Asistente IA para manuales internos y soporte',
    description:
      'Asistente IA para manuales internos: tus agentes consultan manuales, políticas y la base de conocimiento con IA y responden con la fuente citada.',
    canonical: `${baseUrl}/rag/soporte`,
  },

  // DEMOS MÉDICOS

  // Demo: Cuentas Médicas (Auditoría). Se presenta como "Sistema experto para
  // salud" y no como caso RAG: su código (frontend y endpoints /api/auditoria y
  // /api/documentos-conocimiento) no usa embeddings ni búsqueda vectorial, sino
  // reglas de auditoría, búsqueda exacta por código CUPS y tarifario, y GPT-4o /
  // GPT-4o mini para extraer los datos de las facturas.
  'demo-cuentas-medicas': {
    title: 'Sistema experto para salud: auditar cuentas médicas',
    description:
      'Sistema experto para salud que audita cuentas médicas con reglas, códigos CUPS y CIE-10 y tarifarios SOAT, ISS o de contrato, y señala posibles glosas.',
    canonical: `${baseUrl}/demo/cuentas-medicas`,
  },

  // Demo: Chatbot RAG (Playground, "Prueba con tu documento" y Builder)
  'demo-chatbot': {
    title: 'Demo RAG: prueba con tu documento',
    description:
      'Sube un PDF, DOCX o TXT y hazle preguntas a un chatbot RAG que cita la página o el fragmento de donde sale cada respuesta. También puedes probar la demo con un documento de ejemplo, sin registro.',
    canonical: `${baseUrl}/demo/chatbot`,
  },

  // Demo: Generador LinkedIn (marketing engine)
  'demo-linkedin-ads': {
    title: 'Generador de Contenido para LinkedIn con IA',
    description:
      'Genera 30 días de posts para LinkedIn en minutos: calendario editorial, hooks, cuerpo, CTA y hashtags por demo. Plantillas visuales 1200×627 exportables a PNG y captura real del demo en foto/video. Para founders y equipos de marketing que necesitan publicar consistente sin contratar una agencia.',
    canonical: `${baseUrl}/demo/linkedin-ads`,
  },

  // Demo: Gestor de Contenido
  'demo-gestor-contenido': {
    title: 'Gestor de Contenido Médico con IA',
    description:
      'Generador automático de contenido médico con inteligencia artificial. Crea emails corporativos, comunicados, informes médicos y documentos administrativos. Templates personalizables para IPS y hospitales. Exporta a PDF, copia a email. Optimiza comunicación institucional. Prueba gratis.',
    canonical: `${baseUrl}/demo/gestor-contenido`,
  },

  // Demo: Gestor de Documentos
  'demo-gestor-documentos': {
    title: 'Gestor Documental Médico para Archivos Clínicos',
    description:
      'Sistema de gestión documental para instituciones de salud. Organiza historias clínicas, resultados de exámenes, consentimientos informados y documentos administrativos. Búsqueda inteligente, control de versiones, carpetas por paciente. Cumple normatividad de archivo clínico. Demo online.',
    canonical: `${baseUrl}/demo/gestor-documentos`,
  },

  // DEMOS GENERALES

  // Demo: E-commerce
  'demo-ecommerce': {
    title: 'Plataforma E-commerce: Tienda Online Profesional',
    description:
      'Solución e-commerce completa con carrito de compras, pasarelas de pago, gestión de inventario y panel de administración. Sistema moderno y escalable para ventas online. Integración con medios de pago colombianos. Responsive y optimizado. Demo funcional.',
    canonical: `${baseUrl}/demo/ecommerce`,
  },

  // Demo: Dashboard Ejecutivo
  'demo-dashboard-ejecutivo': {
    title: 'Dashboard Ejecutivo con Datos en Tiempo Real',
    description:
      'Dashboard ejecutivo con KPIs, métricas y análisis de datos en tiempo real. Visualización de indicadores clave, gráficos interactivos y reportes automáticos. Toma de decisiones basada en datos. Personalizable por sector. Demo interactivo.',
    canonical: `${baseUrl}/demo/dashboard-ejecutivo`,
  },

  // Demo: Control de Proyectos
  'demo-control-proyectos': {
    title: 'Software de Gestión y Control de Proyectos',
    description:
      'Sistema completo de gestión de proyectos. Planificación, asignación de tareas, seguimiento de avances, gestión de recursos y cronogramas. Metodologías ágiles integradas. Colaboración en equipo. Reportes de progreso. Demo funcional.',
    canonical: `${baseUrl}/demo/control-proyectos`,
  },

  // Demo: Sistema de Reservas
  'demo-sistema-reservas': {
    title: 'Sistema de Reservas Online y Agendamiento de Citas',
    description:
      'Plataforma de reservas y agendamiento online. Calendario inteligente, gestión de citas, confirmaciones automáticas, recordatorios por email/SMS. Integración con Google Calendar. Multi-usuario. Ideal para consultorios, spas, restaurantes. Prueba gratis.',
    canonical: `${baseUrl}/demo/sistema-reservas`,
  },

  // Demo: Sistema Experto
  'demo-sistema-experto': {
    title: 'Sistema Experto con IA para Toma de Decisiones',
    description:
      'Sistema experto basado en inteligencia artificial para toma de decisiones complejas. Motor de inferencia, base de conocimiento, reglas de negocio. Recomendaciones automatizadas basadas en datos. Explicabilidad de decisiones. Demo interactivo.',
    canonical: `${baseUrl}/demo/sistema-experto`,
  },

  // Demo: Automatización de Workflows
  'demo-automatizacion': {
    title: 'Automatización de Workflows y Procesos',
    description:
      'Automatiza procesos de negocio sin código: orquesta workflows, conecta integraciones y elimina tareas repetitivas. Constructor visual de flujos, disparadores y acciones encadenadas. Ahorra horas de trabajo manual cada semana. Demo interactivo.',
    canonical: `${baseUrl}/demo/automatizacion`,
  },

  // Demo: Code Review con IA
  'demo-code-review-ia': {
    title: 'Code Review con IA: Revisión de Pull Requests',
    description:
      'Revisión automática de Pull Requests con inteligencia artificial. Detecta bugs, vulnerabilidades de seguridad y problemas de calidad antes del merge. Sugerencias en línea y métricas de código. Acelera tus revisiones de código. Demo interactivo.',
    canonical: `${baseUrl}/demo/code-review-ia`,
  },

  // Demo: CRM con IA
  'demo-crm-ia': {
    title: 'CRM con IA: Clientes y Pipeline de Ventas',
    description:
      'CRM con inteligencia artificial para gestionar clientes, contactos y el pipeline de ventas. Scoring automático de leads, automatización comercial y seguimiento de oportunidades. Prioriza los negocios con mayor probabilidad de cierre. Demo interactivo.',
    canonical: `${baseUrl}/demo/crm-ia`,
  },

  // Demo: App de Delivery
  'demo-delivery': {
    title: 'App de Delivery con Tracking en Tiempo Real',
    description:
      'Aplicación de delivery completa con pedidos a domicilio, tracking en tiempo real y gestión de repartidores. Optimización de rutas, seguimiento GPS y notificaciones de estado. Plataforma escalable para restaurantes y comercios. Demo interactivo.',
    canonical: `${baseUrl}/demo/delivery`,
  },

  // Demo: ERP Modular
  'demo-erp': {
    title: 'ERP: Finanzas, Inventario y Facturación DIAN',
    description:
      'Sistema ERP modular para empresas: finanzas, inventario, contabilidad y facturación electrónica DIAN. Integra todas las áreas de tu negocio en una sola plataforma. Reportes en tiempo real y módulos escalables. Demo interactivo.',
    canonical: `${baseUrl}/demo/erp`,
  },

  // Demo: Facturación Electrónica DIAN
  'demo-facturacion-electronica': {
    title: 'Facturación y Nómina Electrónica DIAN',
    description:
      'Plataforma de facturación electrónica para Colombia, certificada DIAN. Emite facturas, notas crédito y nómina electrónica de forma sencilla. Validación automática, envío al adquirente y archivo seguro. Cumple la normativa vigente. Demo interactivo.',
    canonical: `${baseUrl}/demo/facturacion-electronica`,
  },

  // Demo: Firma Electrónica
  'demo-firma-electronica': {
    title: 'Firma Electrónica de Documentos con Validez Legal',
    description:
      'Firma electrónica de documentos con validez legal. Define flujos de firmantes, envía solicitudes y rastrea el estado en tiempo real. Firma digital segura, auditable y con trazabilidad completa. Agiliza tus contratos. Demo interactivo.',
    canonical: `${baseUrl}/demo/firma-electronica`,
  },

  // Demo: Helpdesk con IA
  'demo-helpdesk-ia': {
    title: 'Helpdesk con IA: Mesa de Ayuda y Tickets Omnicanal',
    description:
      'Mesa de ayuda con inteligencia artificial: gestión de tickets, clasificación automática con IA y base de conocimiento. Soporte omnicanal desde email, chat y WhatsApp. Resuelve más rápido y mejora la satisfacción del cliente. Demo interactivo.',
    canonical: `${baseUrl}/demo/helpdesk-ia`,
  },

  // Demo: HRMS / Gestión de Talento
  'demo-hrms': {
    title: 'HRMS: Gestión de Talento, Nómina y Desempeño',
    description:
      'Sistema HRMS para la gestión integral de talento humano: empleados, nómina, vacaciones y evaluación de desempeño. Centraliza la información del personal y automatiza procesos de RRHH. Reportes y autoservicio para empleados. Demo interactivo.',
    canonical: `${baseUrl}/demo/hrms`,
  },

  // Demo: LMS / Plataforma E-learning
  'demo-lms': {
    title: 'LMS: Plataforma E-learning con Certificados',
    description:
      'Plataforma LMS de e-learning para crear y gestionar cursos online. Inscripciones, evaluaciones, seguimiento de progreso y emisión de certificados. Contenido multimedia y rutas de aprendizaje. Ideal para empresas y academias. Demo interactivo.',
    canonical: `${baseUrl}/demo/lms`,
  },

  // Demo: Programa de Fidelización
  'demo-loyalty': {
    title: 'Programa de Fidelización: Puntos y Recompensas',
    description:
      'Programa de fidelización para premiar y retener clientes: acumulación de puntos, recompensas y segmentación inteligente. Aumenta la recompra y el valor de vida del cliente con incentivos personalizados. Métricas de retención. Demo interactivo.',
    canonical: `${baseUrl}/demo/loyalty`,
  },

  // Demo: Moderación de Contenido con IA
  'demo-moderacion-contenido': {
    title: 'Moderación de Contenido con IA: Trust & Safety',
    description:
      'Moderación de contenido con inteligencia artificial para texto e imágenes. Filtrado automático de contenido inapropiado, trust & safety y detección de riesgos a escala. Protege tu comunidad y tu marca en tiempo real. Demo interactivo.',
    canonical: `${baseUrl}/demo/moderacion-contenido`,
  },

  // Demo: POS para Retail
  'demo-pos': {
    title: 'POS Multi-sucursal con Facturación DIAN',
    description:
      'Sistema POS para retail con punto de venta ágil, gestión multi-sucursal e inventario en tiempo real. Facturación electrónica DIAN integrada y reportes de ventas centralizados. Ideal para tiendas y cadenas. Demo interactivo.',
    canonical: `${baseUrl}/demo/pos`,
  },

  // Demo: SaaS Multi-tenant Boilerplate
  'demo-saas-boilerplate': {
    title: 'SaaS Multi-tenant: Auth y Billing con Stripe',
    description:
      'Base SaaS multi-tenant lista para producción: autenticación, gestión de organizaciones y billing con Stripe. Arquitectura escalable para lanzar tu producto más rápido. Roles, suscripciones y aislamiento de datos por tenant. Demo interactivo.',
    canonical: `${baseUrl}/demo/saas-boilerplate`,
  },

  // Demo: Scraping y Extracción de Datos
  'demo-scraping': {
    title: 'Web Scraping y Extracción de Datos a Escala',
    description:
      'Plataforma de web scraping y extracción de datos a escala. Recolecta información estructurada de sitios web con rotación de proxies y procesamiento automático. Datos limpios y listos para usar en tus análisis. Demo interactivo.',
    canonical: `${baseUrl}/demo/scraping`,
  },

  // Demo: Telemedicina
  'demo-telemedicina': {
    title: 'Telemedicina con Videoconsulta e Historia Clínica',
    description:
      'Plataforma de telemedicina con consultas médicas por video, historia clínica digital y agendamiento de citas. Atención remota segura, recetas y seguimiento de pacientes. Acerca la salud a tus pacientes desde cualquier lugar. Demo interactivo.',
    canonical: `${baseUrl}/demo/telemedicina`,
  },

  // Demo: Voice AI / Call Center
  'demo-voice-ai': {
    title: 'Voice AI: Agentes de Voz con IA para Call Center',
    description:
      'Agentes de voz con inteligencia artificial para call center: IVR inteligente, transcripción automática y telefonía automatizada. Atiende llamadas 24/7, resuelve consultas y deriva casos complejos. Reduce costos de operación. Demo interactivo.',
    canonical: `${baseUrl}/demo/voice-ai`,
  },

  // Demo: WMS / Logística de Bodegas
  'demo-wms-logistica': {
    title: 'WMS: Logística de Bodegas, Picking e Inventario',
    description:
      'Sistema WMS para la gestión de bodegas y logística: picking optimizado, control de inventario en tiempo real e integración con transportadoras. Mejora la precisión y la velocidad de tus operaciones de almacén. Demo interactivo.',
    canonical: `${baseUrl}/demo/wms-logistica`,
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

  // Título completo para og:title / twitter:title (no pasan por la plantilla).
  const fullTitle = TITLE_TEMPLATE.replace('%s', config.title);

  return {
    // Objeto con `template` (no string): en Next 14, si un layout intermedio
    // (p. ej. /demo) define `title` como string, sus rutas hijas pierden la
    // plantilla del layout raíz y salen sin " | KopTup". Re-declararla aquí
    // la propaga a las rutas anidadas (/demo/*, /rag/*…).
    title: { default: config.title, template: TITLE_TEMPLATE },
    description: config.description,
    alternates: {
      canonical: config.canonical || baseUrl,
    },
    openGraph: {
      title: fullTitle,
      description: config.description,
      url: config.canonical || baseUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: config.ogImage || '/og-image.png',
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: 'es_CO',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
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
