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
import { HOME_DESCRIPTION, RAG_OG_IMAGE, SITE_NAME, SITE_URL, TITLE_TEMPLATE } from './site';

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
    ogImage: RAG_OG_IMAGE,
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

  // Formulario "Solicitar demo" (sistema de demos, wiki 04)
  'solicitar-demo': {
    title: 'Solicitar una demo guiada',
    description:
      'Elige las demos de KopTup que te interesan y cuéntanos tu caso. Revisamos tu solicitud y, si la aprobamos, te enviamos un enlace para entrar a tus demos.',
    canonical: `${baseUrl}/solicitar-demo`,
  },

  // About page
  about: {
    title: 'Nosotros: estudio de software a medida en Bogotá',
    description:
      `KopTup es un estudio de software a medida en Bogotá: sistemas RAG y software para empresas. Prueba ${DEMO_COUNT} demos y revisa nuestros planes y precios publicados.`,
    canonical: `${baseUrl}/about`,
  },

  // Demo hub page
  demo: {
    title: 'Prototipos Interactivos: Prueba Antes de Contratar',
    description:
      `Explora ${DEMO_COUNT} demos navegables del tipo de soluciones que construimos. Algunas usan IA real, como el chatbot RAG; la mayoría funcionan con datos de ejemplo y cada demo lo indica. Las abiertas no piden registro; las demás se solicitan.`,
    canonical: `${baseUrl}/demo`,
  },

  // Privacy page
  privacy: {
    title: 'Política de Privacidad',
    description:
      'Política de privacidad y tratamiento de datos de KopTup: qué datos recogemos, para qué, con quién los compartimos, cuánto los guardamos y cómo ejerces tus derechos (Ley 1581 de 2012).',
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
      'Contrata a KopTup para desarrollar tu aplicación web, chatbot con IA, e-commerce o sistema empresarial. Estudio de software a medida en Bogotá, Colombia. Precios publicados y cotización gratis.',
    canonical: `${baseUrl}/desarrollo-web-colombia`,
  },

  // Usada por src/app/chatbots-ia/layout.tsx (precios de rag-plans.ts).
  'chatbots-ia': {
    title: 'Chatbots RAG para WhatsApp y web',
    description:
      `Chatbots RAG para WhatsApp y tu sitio web: responden con los documentos de tu empresa y citan la fuente. Desde ${formatRagCOP(RAG_ESSENTIAL.setup.cop)}, o piloto de ${formatRagCOP(RAG_PILOT.setup.cop)}.`,
    canonical: `${baseUrl}/chatbots-ia`,
    ogImage: RAG_OG_IMAGE,
  },

  // Usada por src/app/soluciones-ia/layout.tsx (sistemas RAG primero).
  'soluciones-ia': {
    title: 'Soluciones de Inteligencia Artificial para Empresas',
    description:
      'Soluciones de IA para empresas en Colombia: sistemas RAG que responden con tus documentos y citan la fuente, chatbots, automatización y análisis predictivo.',
    canonical: `${baseUrl}/soluciones-ia`,
    ogImage: RAG_OG_IMAGE,
  },

  // Sistemas RAG: página principal y landings por sector (src/app/rag/*).
  // /rag usa un `<title>` absoluto (ver src/app/rag/page.tsx) igual a
  // "<title> | KopTup"; las landings usan la plantilla.
  rag: {
    title: 'Sistemas RAG para empresas en Colombia',
    description:
      `Sistemas RAG (retrieval augmented generation) para empresas en Colombia: un chatbot con los documentos de tu empresa que cita la fuente. Piloto en ${RAG_PILOT.weeks.max} semanas.`,
    canonical: `${baseUrl}/rag`,
    ogImage: RAG_OG_IMAGE,
  },

  'rag-salud': {
    title: 'RAG para salud: protocolos, normativa y auditoría',
    description:
      'RAG para salud: IA que responde con tus protocolos clínicos y la normativa del sector, cita la fuente y apoya la auditoría de cuentas médicas.',
    canonical: `${baseUrl}/rag/salud`,
    ogImage: RAG_OG_IMAGE,
  },

  'rag-legal': {
    title: 'Buscar en contratos con IA: RAG para áreas legales',
    description:
      'Busca en contratos con IA: un sistema RAG que responde con tus contratos, conceptos jurídicos internos y normativa, y cita la cláusula de donde sale.',
    canonical: `${baseUrl}/rag/legal`,
    ogImage: RAG_OG_IMAGE,
  },

  'rag-soporte': {
    title: 'Asistente IA para manuales internos y soporte',
    description:
      'Asistente IA para manuales internos: tus agentes consultan manuales, políticas y la base de conocimiento con IA y responden con la fuente citada.',
    canonical: `${baseUrl}/rag/soporte`,
    ogImage: RAG_OG_IMAGE,
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
      'Sistema experto para salud que audita cuentas médicas con reglas y un tarifario de ejemplo, y señala posibles glosas. La IA extrae los datos de la factura. Demo por invitación.',
    canonical: `${baseUrl}/demo/cuentas-medicas`,
  },

  // Demo: Chatbot RAG (Playground, "Prueba con tu documento" y Builder)
  'demo-chatbot': {
    title: 'Demo RAG: prueba con tu documento',
    description:
      'Sube un PDF, DOCX o TXT y hazle preguntas a un chatbot RAG que cita la página o el fragmento de donde sale cada respuesta. También puedes probar la demo con un documento de ejemplo, sin registro.',
    canonical: `${baseUrl}/demo/chatbot`,
    ogImage: RAG_OG_IMAGE,
  },

  // Demo: Generador LinkedIn (marketing engine)
  'demo-linkedin-ads': {
    title: 'Generador de Contenido para LinkedIn con IA',
    description:
      'Así usamos IA para preparar nuestro contenido de LinkedIn: calendario de 30 días, posts, textos de anuncio y carruseles generados con IA, y capturas de las demos. No publica en LinkedIn: copias el texto y lo publicas tú.',
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
    title: 'Gestor documental con IA: resume y busca documentos',
    description:
      'Sube PDF, DOCX, TXT o CSV: la IA resume y etiqueta cada documento y puedes buscarlos por su significado y pedir que te los explique. Las funciones avanzadas muestran ejemplos fijos.',
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
    title: 'Dashboard Ejecutivo: KPIs, Finanzas y Cartera',
    description:
      'Demo de tablero ejecutivo con datos de ejemplo: ventas frente a la meta, finanzas, cartera, flujo de caja y reportes. Muestra el tipo de tablero que conectamos a los datos de tu empresa.',
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
      'Maqueta interactiva de un editor de flujos de automatización con pasos de IA: nodos, historial de ejecuciones, plantillas y SDK, con datos de ejemplo. Muestra cómo se vería automatizar un proceso de tu empresa.',
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
    title: 'App de Domicilios: Pedidos y Repartidores',
    description:
      'Demo de una plataforma de domicilios con datos de ejemplo: pedidos, asignación de repartidores y seguimiento simulado de la entrega. Muestra el tipo de app que construimos para restaurantes y comercios.',
    canonical: `${baseUrl}/demo/delivery`,
  },

  // Demo: ERP Modular
  'demo-erp': {
    title: 'ERP: Finanzas, Inventario y Facturación DIAN',
    description:
      'Demo de un ERP modular con datos de ejemplo: finanzas, inventario, contabilidad y facturación. Muestra el tipo de sistema que construimos para integrar las áreas de tu empresa.',
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
    title: 'Firma electrónica de documentos: demo interactiva',
    description:
      'Maqueta interactiva de una plataforma de firma electrónica: arma un sobre con documento, firmantes y campos, y mira la línea de tiempo de auditoría. Datos de ejemplo: no firma ni envía correos.',
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
      'Consola de ejemplo para un equipo de moderación (trust & safety): cola priorizada de contenidos reportados, reglas por puntaje, apelaciones y auditoría. Datos de ejemplo en el navegador, sin modelo de IA.',
    canonical: `${baseUrl}/demo/moderacion-contenido`,
  },

  // Demo: POS para Retail
  'demo-pos': {
    title: 'POS Multi-sucursal con Facturación DIAN',
    description:
      'Demo de punto de venta con datos de ejemplo: ventas, varias sedes, inventario y cierre de caja. Muestra el tipo de POS que construimos para tiendas y restaurantes.',
    canonical: `${baseUrl}/demo/pos`,
  },

  // Demo: SaaS Multi-tenant Boilerplate
  'demo-saas-boilerplate': {
    title: 'SaaS multiempresa: vitrina técnica de la base',
    description:
      'Vitrina técnica de una base para construir un SaaS B2B multiempresa: aislamiento de datos por cliente, autenticación, planes y cobro, auditoría y feature flags. Datos y código de ejemplo: no cobra ni guarda nada.',
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
      'Demo de un agente de voz con IA para call center, con llamadas de ejemplo: menú de voz, transcripción y paso a un asesor. Muestra el tipo de solución que implementamos con tu telefonía.',
    canonical: `${baseUrl}/demo/voice-ai`,
  },

  // Demo: WMS / Logística de Bodegas
  'demo-wms-logistica': {
    title: 'WMS: Logística de Bodegas, Picking e Inventario',
    description:
      'Demo de un sistema WMS con datos de ejemplo: recepción, ubicaciones, picking, inventario y despachos. Muestra el tipo de sistema que construimos para tu bodega.',
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
 * Metadata de las páginas de cuenta y de los enlaces de un solo uso (login,
 * registro, recuperación de contraseña, retorno de Google, activación,
 * propuesta). No se indexan (`noindex`, además de `Disallow` en robots.txt) y
 * no heredan la canonical, el og:url ni el título de la home:
 *  - `path`: su propia ruta sin parámetros (el token de `/reset-password`
 *    viaja en `?token=` y no entra en la canonical);
 *  - `path: null` en las rutas cuyo segmento es el token (`/activar/<token>`,
 *    `/propuesta/<token>`): sin canonical, para no repetir el token en el HTML.
 * `title` ya viene traducido; la plantilla agrega " | KopTup".
 */
export function privatePageMetadata(title: string, path: string | null): Metadata {
  const url = path ? `${baseUrl}${path}` : null;
  const fullTitle = TITLE_TEMPLATE.replace('%s', title);
  return {
    title,
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: url },
    openGraph: { title: fullTitle, url: url ?? undefined, siteName: SITE_NAME, type: 'website' },
    twitter: { card: 'summary', title: fullTitle },
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
