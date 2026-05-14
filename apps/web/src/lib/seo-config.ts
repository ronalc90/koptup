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

  // DEMOS EXTRA (catálogo nuevo)

  'demo-automatizacion': {
    title: 'Plataforma de Automatización de Workflows | n8n / Zapier con IA',
    description:
      'Plataforma de automatización visual estilo n8n / Zapier con 500+ integraciones, AI nodes nativos (LLM, RAG, vision, STT/TTS), code nodes JS/Python y self-hosted opcional. Conectá Gmail, Slack, WhatsApp, Salesforce y más sin programar.',
    keywords: [
      'automatización workflows',
      'plataforma automatización Colombia',
      'alternativa zapier',
      'alternativa n8n',
      'integraciones empresariales',
      'AI workflow automation',
      'orquestación procesos IA',
      'low-code automatización',
    ],
    canonical: `${baseUrl}/demo/automatizacion`,
  },

  'demo-code-review-ia': {
    title: 'Code Review con IA | Revisión Automática de Pull Requests',
    description:
      'Plataforma de code review con inteligencia artificial que analiza pull requests buscando bugs, vulnerabilidades (SAST/DAST/SCA), problemas de performance y diseño. Genera tests automáticos y sugiere refactors. Integración con GitHub, GitLab, Bitbucket.',
    keywords: [
      'code review IA',
      'revisión código automatizada',
      'SAST DAST SCA',
      'seguridad código',
      'generación tests automáticos',
      'devtools IA Colombia',
      'github code review bot',
      'static analysis',
    ],
    canonical: `${baseUrl}/demo/code-review-ia`,
  },

  'demo-delivery': {
    title: 'App de Delivery tipo Rappi / Uber Eats | Customer, Driver, Merchant',
    description:
      'Ecosistema completo para crear tu app de delivery: app de cliente, conductor, comercio y dashboard de operaciones. Tracking en vivo, routing ML, pricing dinámico (surge), anti-fraude y carriers integrados. Listo para lanzar al mercado.',
    keywords: [
      'app delivery Colombia',
      'alternativa rappi',
      'desarrollo app delivery',
      'last-mile delivery software',
      'route optimization ML',
      'surge pricing',
      'app conductor driver',
      'plataforma delivery on-demand',
    ],
    canonical: `${baseUrl}/demo/delivery`,
  },

  'demo-facturacion-electronica': {
    title: 'Facturación Electrónica Multi-país LatAm | DIAN, SAT, AFIP, SII, SUNAT',
    description:
      'Plataforma de facturación electrónica para 8 países de Latinoamérica (Colombia DIAN, México SAT, Argentina AFIP, Chile SII, Perú SUNAT, Uruguay DGI, Paraguay SET, Ecuador SRI). Emisión, recepción, OCR, validación NIT en tiempo real y modo white-label.',
    keywords: [
      'facturación electrónica Colombia DIAN',
      'facturación electrónica México SAT',
      'facturación electrónica multi-país',
      'API facturación electrónica',
      'facturación electrónica white-label',
      'integración DIAN',
      'sdk facturación electrónica',
      'fintech LatAm',
    ],
    canonical: `${baseUrl}/demo/facturacion-electronica`,
  },

  'demo-firma-electronica': {
    title: 'Firma Electrónica Avanzada | eIDAS y Ley 527 Colombia',
    description:
      'Firma electrónica simple, avanzada y cualificada con validez legal eIDAS (Europa) y Ley 527 (Colombia). KYC con SMS, email, ID+selfie, video y biometría. Audit trail criptográfico, RFC 3161 timestamp y blockchain. Multi-firmante con orden y bulk send.',
    keywords: [
      'firma electrónica Colombia',
      'firma digital Ley 527',
      'firma electrónica avanzada',
      'firma cualificada eIDAS',
      'firma electrónica empresas',
      'audit trail firma',
      'firma documentos online',
      'legaltech Colombia',
    ],
    canonical: `${baseUrl}/demo/firma-electronica`,
  },

  'demo-helpdesk-ia': {
    title: 'Help Desk Omnichannel con IA | Ticketing Inteligente',
    description:
      'Mesa de ayuda omnichannel con IA: email, WhatsApp, Instagram, Facebook, X, voice y chat unificados. Routing ML por skills, sentiment e idioma. Sugerencias IA en vivo, SLA management, CSAT/NPS automatizado y QA con IA. Escala soporte sin contratar más agentes.',
    keywords: [
      'help desk IA',
      'ticketing inteligente',
      'mesa ayuda omnichannel',
      'soporte WhatsApp IA',
      'software help desk Colombia',
      'CSAT NPS automatizado',
      'alternativa zendesk',
      'AI customer support',
    ],
    canonical: `${baseUrl}/demo/helpdesk-ia`,
  },

  'demo-hrms': {
    title: 'HRMS Software de Gestión de RRHH | ATS, Nómina y AI Insights',
    description:
      'Sistema HRMS completo con ATS (scoring CV IA), onboarding/offboarding con e-sign, performance, payroll multi-país (Colombia, México, Argentina) y AI insights de retención y eNPS. Predice qué empleados van a renunciar antes que ocurra.',
    keywords: [
      'HRMS Colombia',
      'software RRHH a medida',
      'ATS recursos humanos',
      'payroll multi-país LatAm',
      'gestión nómina Colombia',
      'people analytics IA',
      'eNPS retención predictiva',
      'sistema gestión talento',
    ],
    canonical: `${baseUrl}/demo/hrms`,
  },

  'demo-lms': {
    title: 'LMS Plataforma E-Learning con IA | AI Tutor y Adaptive Learning',
    description:
      'Plataforma LMS / e-learning con AI Tutor 1:1 conversacional, adaptive learning paths, live classes con breakout rooms, subtítulos multi-idioma y gamification (XP, badges, leaderboards). Certificados verificables en blockchain. Para empresas y academias.',
    keywords: [
      'plataforma e-learning Colombia',
      'LMS a medida',
      'AI tutor educación',
      'adaptive learning',
      'capacitación corporativa online',
      'academia online IA',
      'cursos online empresas',
      'gamification educación',
    ],
    canonical: `${baseUrl}/demo/lms`,
  },

  'demo-loyalty': {
    title: 'Loyalty / Fidelización con IA | Points, Tiers, Misiones y Gamification',
    description:
      'Plataforma de fidelización con programas points/tiers/missions, coalitions multi-marca con shared points pool, gamification (badges, streaks, leaderboards), personalization ML, A/B testing y Apple/Google Wallet pass. Aumenta retención y ticket promedio.',
    keywords: [
      'programa fidelización Colombia',
      'loyalty software empresas',
      'puntos recompensas digital',
      'gamification retail',
      'coalición marcas puntos',
      'engagement clientes',
      'Apple Wallet pass loyalty',
      'personalization marketing ML',
    ],
    canonical: `${baseUrl}/demo/loyalty`,
  },

  'demo-moderacion-contenido': {
    title: 'Moderación de Contenido con IA | NSFW, Hate Speech y Spam',
    description:
      'Plataforma de moderación de contenido multi-modal con IA: texto, imagen, video y audio en tiempo real. Custom models por vertical (gaming, dating, kids, fintech), human-in-the-loop con priority routing y appeals, wellness program para moderadores y compliance DSA.',
    keywords: [
      'moderación contenido IA',
      'trust and safety platform',
      'detección NSFW',
      'detección hate speech',
      'moderación imágenes IA',
      'compliance DSA',
      'plataforma user-generated content',
      'AI content moderation Colombia',
    ],
    canonical: `${baseUrl}/demo/moderacion-contenido`,
  },

  'demo-pos': {
    title: 'POS Punto de Venta Offline-First | Restaurantes y Retail',
    description:
      'Punto de venta moderno offline-first con CRDT sync, multi-payment (efectivo, tarjeta, QR, Nequi, Daviplata, BNPL, split), KDS para restaurantes, mesas, modificadores, hardware integrado (scanners, balanzas, impresoras) y facturación electrónica DIAN.',
    keywords: [
      'POS punto de venta Colombia',
      'POS restaurante',
      'POS offline-first',
      'sistema cajas registradoras',
      'POS retail Colombia',
      'integración Nequi Daviplata',
      'KDS cocina restaurante',
      'POS con facturación electrónica',
    ],
    canonical: `${baseUrl}/demo/pos`,
  },

  'demo-saas-boilerplate': {
    title: 'SaaS Boilerplate Multi-tenant | Auth, Billing, Audit y Compliance',
    description:
      'Boilerplate de SaaS multi-tenant listo para producción: auth completo (SSO SAML/OIDC, MFA, passkeys, magic links), billing Stripe + Paddle con trials y usage-based, multi-tenancy (shared-DB con RLS, schema o DB por tenant), audit logs Vanta-style e i18n.',
    keywords: [
      'SaaS boilerplate',
      'multi-tenant SaaS',
      'SSO SAML OIDC',
      'billing Stripe Paddle',
      'audit logs SOC 2',
      'starter SaaS empresarial',
      'plantilla SaaS Next.js',
      'multi-tenancy RLS',
    ],
    canonical: `${baseUrl}/demo/saas-boilerplate`,
  },

  'demo-scraping': {
    title: 'Scraping y Data Extraction con IA | Visual Builder + Auto-Fix',
    description:
      'Plataforma de scraping y extracción de datos con visual builder point-and-click, AI extraction con schemas, proxy rotation (datacenter, residencial, móvil), captcha solving, anti-bot evasion y auto-fix con LLM cuando cambia el DOM del sitio.',
    keywords: [
      'web scraping Colombia',
      'data extraction IA',
      'monitoreo precios competencia',
      'proxy rotation scraping',
      'captcha solving',
      'visual scraper builder',
      'extracción datos automatizada',
      'competitive intelligence',
    ],
    canonical: `${baseUrl}/demo/scraping`,
  },

  'demo-telemedicina': {
    title: 'Telemedicina HIPAA Compliant | Video Consulta, EHR y Receta Digital',
    description:
      'Plataforma de telemedicina HIPAA-compliant con video call WebRTC propio, EHR/EMR integrado, receta electrónica con firma digital, triage IA por síntomas y integración con wearables (Apple Health, Fitbit, Garmin) y laboratorios HL7/FHIR.',
    keywords: [
      'telemedicina Colombia',
      'plataforma telemedicina HIPAA',
      'video consulta médica',
      'EHR EMR Colombia',
      'receta electrónica',
      'triage IA salud',
      'historia clínica digital',
      'integración HL7 FHIR',
    ],
    canonical: `${baseUrl}/demo/telemedicina`,
  },

  'demo-voice-ai': {
    title: 'Voice AI / IVR Conversacional | Call Center con IA en Tiempo Real',
    description:
      'Plataforma Voice AI con IVR conversacional sin menús, STT/TTS sub-300ms (Whisper, Deepgram, ElevenLabs, Cartesia), barge-in natural, function calling para transferir, agendar y consultar en vivo. Compliance DNC, grabación y PCI redaction automático.',
    keywords: [
      'voice AI Colombia',
      'IVR conversacional',
      'agente telefónico IA',
      'call center IA',
      'cobranza automatizada IA',
      'agendamiento telefónico IA',
      'asistente voz tiempo real',
      'alternativa IVR tradicional',
    ],
    canonical: `${baseUrl}/demo/voice-ai`,
  },

  'demo-wms-logistica': {
    title: 'WMS Sistema de Gestión de Almacenes | Logística con IA',
    description:
      'WMS multi-warehouse con picking optimizado (wave, batch, zone, cluster), route optimization ML (VRP), last-mile con POD y app driver, y carriers integrados (FedEx, DHL, Servientrega, Coordinadora, Inter, TCC). Detecta fraude de conductores con IA.',
    keywords: [
      'WMS Colombia',
      'sistema gestión almacenes',
      'software logística Colombia',
      'last-mile delivery',
      'route optimization VRP',
      'picking optimizado IA',
      'integración Servientrega Coordinadora',
      'logística e-commerce',
    ],
    canonical: `${baseUrl}/demo/wms-logistica`,
  },

  // Landing extra: bienvenido-producthunt
  'bienvenido-producthunt': {
    title: 'Bienvenido desde Product Hunt | KopTup - Software a Medida',
    description:
      'Bienvenido cazador de productos. Conocé KopTup: empresa de desarrollo de software a medida con 27+ demos interactivas funcionales, chatbots con IA, e-commerce, dashboards y soluciones para empresas en Colombia y LatAm.',
    keywords: [
      'product hunt koptup',
      'startup software latam',
      'software demos interactivas',
      'desarrollo software a medida',
      'startup colombia tech',
    ],
    canonical: `${baseUrl}/bienvenido-producthunt`,
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

/**
 * SoftwareApplication schema reutilizable para demos.
 * Genera JSON-LD con applicationCategory, offers (rango USD) y aggregateRating
 * realista. Pensado para inyectarse desde cada demo/<slug>/layout.tsx.
 */
export interface DemoSoftwareSchemaInput {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  /** Precio bajo USD (default 499). */
  lowPrice?: number;
  /** Precio alto USD (default 25000). */
  highPrice?: number;
  /** Cantidad de reviews mock (default 47). */
  reviewCount?: number;
  /** Rating mock (default 4.8). */
  ratingValue?: number;
  featureList?: string[];
}

export function getSoftwareApplicationSchema(input: DemoSoftwareSchemaInput) {
  const {
    name,
    description,
    url,
    applicationCategory = 'BusinessApplication',
    lowPrice = 499,
    highPrice = 25000,
    reviewCount = 47,
    ratingValue = 4.8,
    featureList = [],
  } = input;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory,
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: String(lowPrice),
      highPrice: String(highPrice),
      priceCurrency: 'USD',
      offerCount: '3',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'KopTup',
        url: baseUrl,
      },
    },
    provider: {
      '@type': 'Organization',
      name: 'KopTup',
      url: baseUrl,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: String(ratingValue),
      reviewCount: String(reviewCount),
      bestRating: '5',
      worstRating: '1',
    },
    inLanguage: ['es', 'en'],
  };

  if (featureList.length > 0) {
    schema.featureList = featureList;
  }

  return schema;
}

/**
 * OfferCatalog completo de servicios — para inyectar en /services.
 */
export function getServicesOfferCatalogSchema() {
  const services: { name: string; description: string; url?: string }[] = [
    { name: 'Chatbots con IA', description: 'Asistentes virtuales con GPT-4, Claude AI y WhatsApp Business.', url: `${baseUrl}/chatbots-ia` },
    { name: 'Soluciones de Inteligencia Artificial', description: 'Implementación de IA para automatización, análisis predictivo y sistemas expertos.', url: `${baseUrl}/soluciones-ia` },
    { name: 'Desarrollo Web a Medida', description: 'Aplicaciones web personalizadas con React, Next.js y Node.js.', url: `${baseUrl}/desarrollo-web-colombia` },
    { name: 'E-commerce', description: 'Plataformas completas de comercio electrónico con pasarela de pagos.', url: `${baseUrl}/demo/ecommerce` },
    { name: 'Aplicaciones Móviles', description: 'Apps nativas y multiplataforma para iOS y Android.' },
    { name: 'Dashboards Ejecutivos', description: 'KPIs y business intelligence en tiempo real.', url: `${baseUrl}/demo/dashboard-ejecutivo` },
    { name: 'Help Desk IA Omnichannel', description: 'Ticketing inteligente con routing ML y AI suggestions.', url: `${baseUrl}/demo/helpdesk-ia` },
    { name: 'LMS / E-learning', description: 'Plataforma educativa con AI tutor 1:1 y adaptive learning.', url: `${baseUrl}/demo/lms` },
    { name: 'Telemedicina HIPAA', description: 'Video consulta segura, EHR integrado y receta electrónica.', url: `${baseUrl}/demo/telemedicina` },
    { name: 'Facturación Electrónica Multi-país', description: 'Emisión y recepción para 8 países LatAm.', url: `${baseUrl}/demo/facturacion-electronica` },
    { name: 'WMS / Logística', description: 'Multi-warehouse, picking optimizado y last-mile.', url: `${baseUrl}/demo/wms-logistica` },
    { name: 'POS Punto de Venta', description: 'Offline-first con KDS y facturación electrónica.', url: `${baseUrl}/demo/pos` },
    { name: 'HRMS / Gestión RRHH', description: 'ATS, onboarding, payroll multi-país y AI insights.', url: `${baseUrl}/demo/hrms` },
    { name: 'Automatización Workflows', description: 'Plataforma estilo n8n / Zapier con AI nodes nativos.', url: `${baseUrl}/demo/automatizacion` },
    { name: 'SaaS Boilerplate Multi-tenant', description: 'Auth SSO+MFA, billing Stripe+Paddle y audit logs.', url: `${baseUrl}/demo/saas-boilerplate` },
    { name: 'Voice AI / Call Center', description: 'IVR conversacional sub-300ms con STT/TTS realista.', url: `${baseUrl}/demo/voice-ai` },
    { name: 'Firma Electrónica', description: 'Simple, avanzada y cualificada (eIDAS, Ley 527 CO).', url: `${baseUrl}/demo/firma-electronica` },
    { name: 'Scraping & Data Extraction', description: 'Visual builder con AI extraction y proxy rotation.', url: `${baseUrl}/demo/scraping` },
    { name: 'Code Review IA', description: 'Review automatizado en PRs con SAST/DAST/SCA.', url: `${baseUrl}/demo/code-review-ia` },
    { name: 'Moderación de Contenido IA', description: 'Multi-modal NSFW/hate/spam con human-in-the-loop.', url: `${baseUrl}/demo/moderacion-contenido` },
    { name: 'App de Delivery', description: '3 apps (customer/driver/merchant) con tracking en vivo.', url: `${baseUrl}/demo/delivery` },
    { name: 'Loyalty / Fidelización', description: 'Programas points/tiers/missions con coalitions.', url: `${baseUrl}/demo/loyalty` },
    { name: 'Sistema de Reservas Online', description: 'Calendario inteligente con confirmaciones automáticas.', url: `${baseUrl}/demo/sistema-reservas` },
    { name: 'Sistema Experto con IA', description: 'Motor de inferencia y base de conocimiento.', url: `${baseUrl}/demo/sistema-experto` },
    { name: 'Gestor Documental Médico', description: 'Organización de archivos clínicos con búsqueda inteligente.', url: `${baseUrl}/demo/gestor-documentos` },
    { name: 'Gestor de Contenido con IA', description: 'Generación automática de emails y documentos médicos.', url: `${baseUrl}/demo/gestor-contenido` },
    { name: 'Auditoría de Cuentas Médicas con IA', description: 'Validación automatizada y gestión de glosas para IPS y EPS.', url: `${baseUrl}/demo/cuentas-medicas` },
    { name: 'Chatbot Médico con IA', description: 'Asistente virtual especializado en salud con RAG.', url: `${baseUrl}/demo/chatbot` },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Catálogo Completo de Servicios KopTup',
    url: `${baseUrl}/services`,
    itemListElement: services.map((s, i) => ({
      '@type': 'Offer',
      position: i + 1,
      itemOffered: {
        '@type': 'Service',
        name: s.name,
        description: s.description,
        ...(s.url ? { url: s.url } : {}),
        provider: {
          '@type': 'Organization',
          name: 'KopTup',
          url: baseUrl,
        },
      },
    })),
  };
}

/**
 * Organization schema global — para root layout.
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'KopTup',
    alternateName: 'KopTup Soluciones Tecnológicas',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
    },
    description:
      'Empresa de desarrollo de software a medida fundada en Colombia. Aplicaciones web, móviles, chatbots con IA, e-commerce, dashboards y soluciones empresariales para LatAm, España y EEUU.',
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
        url: `${baseUrl}/contact`,
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
    areaServed: [
      { '@type': 'Country', name: 'Colombia' },
      { '@type': 'Country', name: 'México' },
      { '@type': 'Country', name: 'Argentina' },
      { '@type': 'Country', name: 'Chile' },
      { '@type': 'Country', name: 'Perú' },
      { '@type': 'Country', name: 'España' },
      { '@type': 'Country', name: 'United States' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '67',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

/**
 * WebSite schema con SearchAction — para root layout.
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'KopTup',
    url: baseUrl,
    description:
      'Desarrollo de software a medida con 27+ demos interactivas funcionales: e-commerce, chatbots IA, dashboards, gestión documental, telemedicina y más.',
    inLanguage: ['es-CO', 'en-US'],
    publisher: { '@id': `${baseUrl}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
