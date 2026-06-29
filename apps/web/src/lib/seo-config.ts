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
    title: '27 Prototipos Interactivos | Probá Nuestro Trabajo Antes de Contratar',
    description:
      'Explora 27 prototipos navegables que muestran el rango de soluciones que construimos. Dos usan OpenAI real (chatbot RAG y LinkedIn Ads); el resto son mockups interactivos con datos simulados. Sin registro ni tarjeta de crédito.',
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

  // Landing pages SEO
  'desarrollo-web-colombia': {
    title: 'Empresa de Desarrollo Web y Software a Medida | KopTup Colombia',
    description:
      'Contrata a KopTup para desarrollar tu aplicación web, chatbot con IA, e-commerce o sistema empresarial. Empresa de desarrollo de software a medida en Colombia, trabajamos con clientes en todo el mundo. +100 proyectos. Cotización gratis.',
    keywords: [
      'empresa desarrollo software colombia',
      'desarrollo web colombia',
      'contratar empresa desarrollo software',
      'desarrollo web a medida colombia',
      'software a medida colombia',
      'agencia desarrollo software',
    ],
    canonical: `${baseUrl}/desarrollo-web-colombia`,
  },

  'chatbots-ia': {
    title: 'Chatbots con IA para Empresas | Venta e Implementación Colombia',
    description:
      'Implementamos chatbots con inteligencia artificial para empresas en Colombia. Integración con WhatsApp Business, GPT-4 y Claude AI. Atención 24/7, captura de leads y ventas automatizadas. Desde $499 USD.',
    keywords: [
      'chatbot con ia',
      'chatbot inteligencia artificial',
      'implementar chatbot empresa',
      'venta chatbots colombia',
      'chatbot whatsapp colombia',
      'chatbot para negocios',
    ],
    canonical: `${baseUrl}/chatbots-ia`,
  },

  'soluciones-ia': {
    title: 'Soluciones de Inteligencia Artificial para Empresas | KopTup Colombia',
    description:
      'Implementamos soluciones de inteligencia artificial para empresas en Colombia: chatbots, automatización, análisis predictivo y sistemas expertos con GPT-4 y Claude AI. Consultoría gratuita.',
    keywords: [
      'soluciones de inteligencia artificial',
      'inteligencia artificial para empresas',
      'implementar IA empresa',
      'automatización con IA',
      'IA colombia',
      'transformación digital IA',
    ],
    canonical: `${baseUrl}/soluciones-ia`,
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

  // Demo: Generador LinkedIn (marketing engine)
  'demo-linkedin-ads': {
    title: 'Generador de Contenido LinkedIn con IA | Marketing Engine Koptup',
    description:
      'Genera 30 días de posts para LinkedIn en minutos: calendario editorial, hooks, cuerpo, CTA y hashtags por demo. Plantillas visuales 1200×627 exportables a PNG y captura real del demo en foto/video. Para founders y equipos de marketing que necesitan publicar consistente sin contratar una agencia.',
    keywords: [
      'generador contenido LinkedIn',
      'marketing automation IA',
      'posts LinkedIn automáticos',
      'calendario editorial LinkedIn',
      'ad copy LinkedIn',
      'plantillas visuales LinkedIn',
      'screenshot demo automatico',
      'captura pantalla SaaS',
      'social media B2B',
      'marketing startups LATAM',
      'content engine startup',
      'LinkedIn marketing tool',
      'B2B content automation',
      'plan editorial 30 días',
      'sponsored content LinkedIn',
    ],
    canonical: `${baseUrl}/demo/linkedin-ads`,
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

  // Demo: Automatización de Workflows
  'demo-automatizacion': {
    title: 'Automatización de Workflows | Orquestación de Procesos',
    description:
      'Automatiza procesos de negocio sin código: orquesta workflows, conecta integraciones y elimina tareas repetitivas. Constructor visual de flujos, disparadores y acciones encadenadas. Ahorra horas de trabajo manual cada semana. Demo interactivo.',
    keywords: [
      'automatización de workflows',
      'orquestación de procesos',
      'automatización no-code',
      'integraciones empresariales',
      'flujos de trabajo automáticos',
      'automatización de tareas',
      'workflow automation',
      'constructor de flujos',
      'automatización procesos negocio',
    ],
    canonical: `${baseUrl}/demo/automatizacion`,
  },

  // Demo: Code Review con IA
  'demo-code-review-ia': {
    title: 'Code Review con IA | Revisión Automática de Pull Requests',
    description:
      'Revisión automática de Pull Requests con inteligencia artificial. Detecta bugs, vulnerabilidades de seguridad y problemas de calidad antes del merge. Sugerencias en línea y métricas de código. Acelera tus revisiones de código. Demo interactivo.',
    keywords: [
      'code review con IA',
      'revisión automática de código',
      'revisión pull requests',
      'calidad de código',
      'detección de bugs IA',
      'seguridad de código',
      'análisis estático código',
      'IA para desarrollo',
      'revisión código automática',
    ],
    canonical: `${baseUrl}/demo/code-review-ia`,
  },

  // Demo: CRM con IA
  'demo-crm-ia': {
    title: 'CRM con IA | Gestión de Clientes y Pipeline de Ventas',
    description:
      'CRM con inteligencia artificial para gestionar clientes, contactos y el pipeline de ventas. Scoring automático de leads, automatización comercial y seguimiento de oportunidades. Prioriza los negocios con mayor probabilidad de cierre. Demo interactivo.',
    keywords: [
      'CRM con IA',
      'gestión de clientes',
      'scoring de leads',
      'pipeline de ventas',
      'automatización comercial',
      'software CRM',
      'gestión de contactos',
      'embudo de ventas',
      'CRM inteligencia artificial',
    ],
    canonical: `${baseUrl}/demo/crm-ia`,
  },

  // Demo: App de Delivery
  'demo-delivery': {
    title: 'App de Delivery | Pedidos a Domicilio y Tracking en Tiempo Real',
    description:
      'Aplicación de delivery completa con pedidos a domicilio, tracking en tiempo real y gestión de repartidores. Optimización de rutas, seguimiento GPS y notificaciones de estado. Plataforma escalable para restaurantes y comercios. Demo interactivo.',
    keywords: [
      'app de delivery',
      'pedidos a domicilio',
      'tracking en tiempo real',
      'gestión de repartidores',
      'optimización de rutas',
      'software delivery',
      'plataforma domicilios',
      'seguimiento GPS pedidos',
      'app reparto comida',
    ],
    canonical: `${baseUrl}/demo/delivery`,
  },

  // Demo: ERP Modular
  'demo-erp': {
    title: 'ERP Modular | Finanzas, Inventario y Facturación DIAN',
    description:
      'Sistema ERP modular para empresas: finanzas, inventario, contabilidad y facturación electrónica DIAN. Integra todas las áreas de tu negocio en una sola plataforma. Reportes en tiempo real y módulos escalables. Demo interactivo.',
    keywords: [
      'ERP modular',
      'software ERP empresas',
      'gestión de inventario',
      'facturación DIAN',
      'contabilidad empresarial',
      'sistema de gestión empresarial',
      'ERP Colombia',
      'integración empresarial',
      'software finanzas empresas',
    ],
    canonical: `${baseUrl}/demo/erp`,
  },

  // Demo: Facturación Electrónica DIAN
  'demo-facturacion-electronica': {
    title: 'Facturación Electrónica DIAN | Nómina Electrónica Colombia',
    description:
      'Plataforma de facturación electrónica para Colombia, certificada DIAN. Emite facturas, notas crédito y nómina electrónica de forma sencilla. Validación automática, envío al adquirente y archivo seguro. Cumple la normativa vigente. Demo interactivo.',
    keywords: [
      'facturación electrónica DIAN',
      'facturación electrónica Colombia',
      'nómina electrónica',
      'factura electrónica',
      'software facturación DIAN',
      'documentos electrónicos DIAN',
      'notas crédito electrónicas',
      'facturador electrónico',
      'cumplimiento DIAN',
    ],
    canonical: `${baseUrl}/demo/facturacion-electronica`,
  },

  // Demo: Firma Electrónica
  'demo-firma-electronica': {
    title: 'Firma Electrónica | Firma Digital de Documentos con Validez Legal',
    description:
      'Firma electrónica de documentos con validez legal. Define flujos de firmantes, envía solicitudes y rastrea el estado en tiempo real. Firma digital segura, auditable y con trazabilidad completa. Agiliza tus contratos. Demo interactivo.',
    keywords: [
      'firma electrónica',
      'firma digital documentos',
      'validez legal firma',
      'flujos de firmantes',
      'firma de contratos online',
      'software firma electrónica',
      'firma digital segura',
      'gestión de firmas',
      'documentos firmados digitalmente',
    ],
    canonical: `${baseUrl}/demo/firma-electronica`,
  },

  // Demo: Helpdesk con IA
  'demo-helpdesk-ia': {
    title: 'Helpdesk con IA | Mesa de Ayuda y Tickets Omnicanal',
    description:
      'Mesa de ayuda con inteligencia artificial: gestión de tickets, clasificación automática con IA y base de conocimiento. Soporte omnicanal desde email, chat y WhatsApp. Resuelve más rápido y mejora la satisfacción del cliente. Demo interactivo.',
    keywords: [
      'helpdesk con IA',
      'mesa de ayuda',
      'gestión de tickets',
      'clasificación tickets IA',
      'base de conocimiento',
      'soporte omnicanal',
      'software helpdesk',
      'atención al cliente IA',
      'sistema de tickets',
    ],
    canonical: `${baseUrl}/demo/helpdesk-ia`,
  },

  // Demo: HRMS / Gestión de Talento
  'demo-hrms': {
    title: 'HRMS | Gestión de Talento, Nómina y Desempeño',
    description:
      'Sistema HRMS para la gestión integral de talento humano: empleados, nómina, vacaciones y evaluación de desempeño. Centraliza la información del personal y automatiza procesos de RRHH. Reportes y autoservicio para empleados. Demo interactivo.',
    keywords: [
      'HRMS',
      'gestión de talento',
      'software recursos humanos',
      'gestión de empleados',
      'nómina',
      'gestión de vacaciones',
      'evaluación de desempeño',
      'software RRHH',
      'gestión de personal',
    ],
    canonical: `${baseUrl}/demo/hrms`,
  },

  // Demo: LMS / Plataforma E-learning
  'demo-lms': {
    title: 'LMS | Plataforma E-learning con Cursos y Certificados',
    description:
      'Plataforma LMS de e-learning para crear y gestionar cursos online. Inscripciones, evaluaciones, seguimiento de progreso y emisión de certificados. Contenido multimedia y rutas de aprendizaje. Ideal para empresas y academias. Demo interactivo.',
    keywords: [
      'LMS',
      'plataforma e-learning',
      'cursos online',
      'software educativo',
      'gestión de cursos',
      'evaluaciones online',
      'certificados digitales',
      'inscripciones cursos',
      'plataforma formación online',
    ],
    canonical: `${baseUrl}/demo/lms`,
  },

  // Demo: Programa de Fidelización
  'demo-loyalty': {
    title: 'Programa de Fidelización | Puntos, Recompensas y Retención',
    description:
      'Programa de fidelización para premiar y retener clientes: acumulación de puntos, recompensas y segmentación inteligente. Aumenta la recompra y el valor de vida del cliente con incentivos personalizados. Métricas de retención. Demo interactivo.',
    keywords: [
      'programa de fidelización',
      'puntos y recompensas',
      'retención de clientes',
      'segmentación de clientes',
      'loyalty program',
      'fidelización de clientes',
      'recompensas clientes',
      'sistema de puntos',
      'marketing de fidelización',
    ],
    canonical: `${baseUrl}/demo/loyalty`,
  },

  // Demo: Moderación de Contenido con IA
  'demo-moderacion-contenido': {
    title: 'Moderación de Contenido con IA | Trust & Safety Automático',
    description:
      'Moderación de contenido con inteligencia artificial para texto e imágenes. Filtrado automático de contenido inapropiado, trust & safety y detección de riesgos a escala. Protege tu comunidad y tu marca en tiempo real. Demo interactivo.',
    keywords: [
      'moderación de contenido con IA',
      'moderación de texto',
      'moderación de imágenes',
      'trust and safety',
      'filtrado automático contenido',
      'detección contenido inapropiado',
      'moderación automática',
      'IA moderación',
      'seguridad de plataformas',
    ],
    canonical: `${baseUrl}/demo/moderacion-contenido`,
  },

  // Demo: POS para Retail
  'demo-pos': {
    title: 'POS para Retail | Punto de Venta Multi-sucursal con DIAN',
    description:
      'Sistema POS para retail con punto de venta ágil, gestión multi-sucursal e inventario en tiempo real. Facturación electrónica DIAN integrada y reportes de ventas centralizados. Ideal para tiendas y cadenas. Demo interactivo.',
    keywords: [
      'POS retail',
      'punto de venta',
      'software POS',
      'multi-sucursal',
      'gestión de inventario',
      'facturación DIAN',
      'sistema punto de venta',
      'POS Colombia',
      'caja registradora digital',
    ],
    canonical: `${baseUrl}/demo/pos`,
  },

  // Demo: SaaS Multi-tenant Boilerplate
  'demo-saas-boilerplate': {
    title: 'SaaS Multi-tenant Boilerplate | Auth y Billing con Stripe',
    description:
      'Base SaaS multi-tenant lista para producción: autenticación, gestión de organizaciones y billing con Stripe. Arquitectura escalable para lanzar tu producto más rápido. Roles, suscripciones y aislamiento de datos por tenant. Demo interactivo.',
    keywords: [
      'SaaS multi-tenant',
      'SaaS boilerplate',
      'base SaaS',
      'autenticación SaaS',
      'billing Stripe',
      'arquitectura multi-tenant',
      'plantilla SaaS',
      'desarrollo SaaS',
      'suscripciones SaaS',
    ],
    canonical: `${baseUrl}/demo/saas-boilerplate`,
  },

  // Demo: Scraping y Extracción de Datos
  'demo-scraping': {
    title: 'Scraping y Extracción de Datos | Web Scraping a Escala',
    description:
      'Plataforma de web scraping y extracción de datos a escala. Recolecta información estructurada de sitios web con rotación de proxies y procesamiento automático. Datos limpios y listos para usar en tus análisis. Demo interactivo.',
    keywords: [
      'web scraping',
      'extracción de datos',
      'scraping a escala',
      'datos estructurados',
      'rotación de proxies',
      'recolección de datos web',
      'extracción web automática',
      'data scraping',
      'minería de datos web',
    ],
    canonical: `${baseUrl}/demo/scraping`,
  },

  // Demo: Telemedicina
  'demo-telemedicina': {
    title: 'Telemedicina | Consultas por Video e Historia Clínica',
    description:
      'Plataforma de telemedicina con consultas médicas por video, historia clínica digital y agendamiento de citas. Atención remota segura, recetas y seguimiento de pacientes. Acerca la salud a tus pacientes desde cualquier lugar. Demo interactivo.',
    keywords: [
      'telemedicina',
      'consultas médicas por video',
      'historia clínica digital',
      'agendamiento de citas médicas',
      'atención médica remota',
      'software telemedicina',
      'salud digital',
      'teleconsulta médica',
      'plataforma médica online',
    ],
    canonical: `${baseUrl}/demo/telemedicina`,
  },

  // Demo: Voice AI / Call Center
  'demo-voice-ai': {
    title: 'Voice AI | Agentes de Voz con IA para Call Center',
    description:
      'Agentes de voz con inteligencia artificial para call center: IVR inteligente, transcripción automática y telefonía automatizada. Atiende llamadas 24/7, resuelve consultas y deriva casos complejos. Reduce costos de operación. Demo interactivo.',
    keywords: [
      'voice AI',
      'agentes de voz IA',
      'call center con IA',
      'IVR inteligente',
      'transcripción de llamadas',
      'telefonía automatizada',
      'asistente de voz',
      'automatización call center',
      'IA telefonía',
    ],
    canonical: `${baseUrl}/demo/voice-ai`,
  },

  // Demo: WMS / Logística de Bodegas
  'demo-wms-logistica': {
    title: 'WMS | Logística de Bodegas, Picking e Inventario',
    description:
      'Sistema WMS para la gestión de bodegas y logística: picking optimizado, control de inventario en tiempo real e integración con transportadoras. Mejora la precisión y la velocidad de tus operaciones de almacén. Demo interactivo.',
    keywords: [
      'WMS',
      'logística de bodegas',
      'gestión de almacenes',
      'picking',
      'control de inventario',
      'integración transportadoras',
      'software logística',
      'gestión de bodegas',
      'optimización de almacén',
    ],
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
