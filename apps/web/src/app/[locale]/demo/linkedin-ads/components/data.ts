/**
 * Datos de la herramienta interna de contenido para LinkedIn.
 *
 * Los textos de cada demo (título, descripción, funciones, sector, público y
 * problema) están en `messages/demos/linkedin-ads.{es,en}.json`
 * (`demoLinkedinAds.catalog.<id>`) y no en la tarjeta del hub: lo que sale de
 * aquí se publica en LinkedIn, así que dice solo lo que cada demo hace de
 * verdad (ver docs/wiki/Guia-Demo-<slug>.md). Aquí solo vive la metadata que
 * no es una afirmación sobre el producto (emoji, ruta y hashtags).
 *
 * Sin métricas: ninguna demo trae cifras de resultados. Las publicaciones no
 * pueden presentar cifras ni testimonios como resultados de KopTup.
 */

export type AnguloPost =
  | 'lanzamiento'
  | 'caso-uso'
  | 'educativo'
  | 'detras-camaras'
  | 'comparativa'
  | 'tip-rapido'
  | 'pregunta-engagement';

export type TonoPost = 'profesional' | 'cercano' | 'tecnico' | 'storytelling' | 'controversial';

export type TipoContenido = 'texto' | 'carrusel' | 'imagen' | 'video';

export interface DemoMeta {
  id: string;
  path: string;
  emoji: string;
  hashtags: string[];
}

/** Demo ya localizada (con los textos de `demoLinkedinAds.catalog`). */
export interface KoptupDemo {
  id: string;
  slug: string;
  path: string;
  emoji: string;
  titulo: string;
  tagline: string;
  funciones: string[];
  industria: string;
  publicoObjetivo: string[];
  problemaResuelve: string;
  hashtagsEspecificos: string[];
}

export const DEMOS_META: DemoMeta[] = [
  { id: 'chatbot', path: '/demo/chatbot', emoji: '🤖', hashtags: ['#RAG', '#Chatbot', '#IAGenerativa'] },
  { id: 'ecommerce', path: '/demo/ecommerce', emoji: '🛒', hashtags: ['#ComercioElectrónico', '#Retail', '#TiendaEnLínea'] },
  { id: 'dashboard-ejecutivo', path: '/demo/dashboard-ejecutivo', emoji: '📊', hashtags: ['#AnalíticaDeDatos', '#Gerencia', '#Indicadores'] },
  { id: 'gestor-documentos', path: '/demo/gestor-documentos', emoji: '📄', hashtags: ['#GestiónDocumental', '#Cumplimiento', '#Productividad'] },
  { id: 'sistema-reservas', path: '/demo/sistema-reservas', emoji: '📅', hashtags: ['#Reservas', '#Citas', '#Servicios'] },
  { id: 'gestor-contenido', path: '/demo/gestor-contenido', emoji: '✍️', hashtags: ['#Contenido', '#Comunicaciones', '#Mercadeo'] },
  { id: 'control-proyectos', path: '/demo/control-proyectos', emoji: '📋', hashtags: ['#GestiónDeProyectos', '#Kanban', '#Equipos'] },
  { id: 'crm-ia', path: '/demo/crm-ia', emoji: '💼', hashtags: ['#CRM', '#Ventas', '#VentasB2B'] },
  { id: 'erp', path: '/demo/erp', emoji: '🏭', hashtags: ['#ERP', '#Operaciones', '#Pymes'] },
  { id: 'helpdesk-ia', path: '/demo/helpdesk-ia', emoji: '🎧', hashtags: ['#MesaDeAyuda', '#Soporte', '#ServicioAlCliente'] },
  { id: 'lms', path: '/demo/lms', emoji: '🎓', hashtags: ['#Capacitación', '#Aprendizaje', '#Educación'] },
  { id: 'telemedicina', path: '/demo/telemedicina', emoji: '🩺', hashtags: ['#Telemedicina', '#Salud', '#SaludDigital'] },
  { id: 'facturacion-electronica', path: '/demo/facturacion-electronica', emoji: '🧾', hashtags: ['#FacturaciónElectrónica', '#Contabilidad', '#Pymes'] },
  { id: 'wms-logistica', path: '/demo/wms-logistica', emoji: '📦', hashtags: ['#Logística', '#Bodegas', '#CadenaDeSuministro'] },
  { id: 'pos', path: '/demo/pos', emoji: '💳', hashtags: ['#PuntoDeVenta', '#Retail', '#Restaurantes'] },
  { id: 'hrms', path: '/demo/hrms', emoji: '👥', hashtags: ['#GestiónHumana', '#Talento', '#Nómina'] },
  { id: 'automatizacion', path: '/demo/automatizacion', emoji: '⚡', hashtags: ['#Automatización', '#Procesos', '#Productividad'] },
  { id: 'saas-boilerplate', path: '/demo/saas-boilerplate', emoji: '🚀', hashtags: ['#SaaS', '#Startups', '#Emprendimiento'] },
  { id: 'voice-ai', path: '/demo/voice-ai', emoji: '📞', hashtags: ['#IAConversacional', '#AtenciónTelefónica', '#ServicioAlCliente'] },
  { id: 'firma-electronica', path: '/demo/firma-electronica', emoji: '✒️', hashtags: ['#FirmaElectrónica', '#Contratos', '#Legal'] },
  { id: 'scraping', path: '/demo/scraping', emoji: '🕷️', hashtags: ['#Datos', '#InteligenciaDeMercado', '#Precios'] },
  { id: 'code-review-ia', path: '/demo/code-review-ia', emoji: '💻', hashtags: ['#DesarrolloDeSoftware', '#CalidadDeSoftware', '#Programación'] },
  { id: 'moderacion-contenido', path: '/demo/moderacion-contenido', emoji: '🛡️', hashtags: ['#Moderación', '#Comunidades', '#Confianza'] },
  { id: 'delivery', path: '/demo/delivery', emoji: '🛵', hashtags: ['#Domicilios', '#ÚltimaMilla', '#Logística'] },
  { id: 'loyalty', path: '/demo/loyalty', emoji: '⭐', hashtags: ['#Fidelización', '#Clientes', '#Retail'] },
];

export const HASHTAGS_GLOBALES = ['#KopTup', '#SoftwareAMedida', '#TransformaciónDigital', '#Colombia'];

export const ANGULOS: { key: AnguloPost; emoji: string }[] = [
  { key: 'lanzamiento', emoji: '🚀' },
  { key: 'caso-uso', emoji: '🎯' },
  { key: 'educativo', emoji: '🧠' },
  { key: 'detras-camaras', emoji: '🛠️' },
  { key: 'comparativa', emoji: '⚖️' },
  { key: 'tip-rapido', emoji: '💡' },
  { key: 'pregunta-engagement', emoji: '❓' },
];

export const TONOS: TonoPost[] = ['profesional', 'cercano', 'tecnico', 'storytelling', 'controversial'];

export interface DiaCalendario {
  dia: number;
  demoId: string;
  angulo: AnguloPost;
  tipoContenido: TipoContenido;
}

/**
 * Plan editorial de 30 días que empieza un lunes. Entre semana va el contenido
 * más elaborado (video, carrusel, imagen); los sábados y domingos (días 6-7,
 * 13-14, 20-21 y 27-28) van preguntas y consejos cortos en texto.
 * La nota estratégica de cada día está en messages: `calendar.notes.<dia>`.
 */
export const CALENDARIO_30_DIAS: DiaCalendario[] = [
  { dia: 1, demoId: 'chatbot', angulo: 'lanzamiento', tipoContenido: 'video' },
  { dia: 2, demoId: 'ecommerce', angulo: 'caso-uso', tipoContenido: 'carrusel' },
  { dia: 3, demoId: 'dashboard-ejecutivo', angulo: 'comparativa', tipoContenido: 'imagen' },
  { dia: 4, demoId: 'gestor-documentos', angulo: 'educativo', tipoContenido: 'texto' },
  { dia: 5, demoId: 'crm-ia', angulo: 'tip-rapido', tipoContenido: 'texto' },
  { dia: 6, demoId: 'sistema-reservas', angulo: 'pregunta-engagement', tipoContenido: 'texto' },
  { dia: 7, demoId: 'helpdesk-ia', angulo: 'pregunta-engagement', tipoContenido: 'texto' },
  { dia: 8, demoId: 'voice-ai', angulo: 'lanzamiento', tipoContenido: 'video' },
  { dia: 9, demoId: 'erp', angulo: 'detras-camaras', tipoContenido: 'carrusel' },
  { dia: 10, demoId: 'facturacion-electronica', angulo: 'tip-rapido', tipoContenido: 'imagen' },
  { dia: 11, demoId: 'control-proyectos', angulo: 'caso-uso', tipoContenido: 'carrusel' },
  { dia: 12, demoId: 'lms', angulo: 'educativo', tipoContenido: 'texto' },
  { dia: 13, demoId: 'firma-electronica', angulo: 'pregunta-engagement', tipoContenido: 'texto' },
  { dia: 14, demoId: 'telemedicina', angulo: 'tip-rapido', tipoContenido: 'texto' },
  { dia: 15, demoId: 'automatizacion', angulo: 'lanzamiento', tipoContenido: 'video' },
  { dia: 16, demoId: 'wms-logistica', angulo: 'comparativa', tipoContenido: 'imagen' },
  { dia: 17, demoId: 'gestor-contenido', angulo: 'tip-rapido', tipoContenido: 'texto' },
  { dia: 18, demoId: 'pos', angulo: 'detras-camaras', tipoContenido: 'carrusel' },
  { dia: 19, demoId: 'hrms', angulo: 'caso-uso', tipoContenido: 'texto' },
  { dia: 20, demoId: 'saas-boilerplate', angulo: 'pregunta-engagement', tipoContenido: 'texto' },
  { dia: 21, demoId: 'scraping', angulo: 'tip-rapido', tipoContenido: 'texto' },
  { dia: 22, demoId: 'loyalty', angulo: 'caso-uso', tipoContenido: 'imagen' },
  { dia: 23, demoId: 'code-review-ia', angulo: 'tip-rapido', tipoContenido: 'texto' },
  { dia: 24, demoId: 'moderacion-contenido', angulo: 'educativo', tipoContenido: 'texto' },
  { dia: 25, demoId: 'delivery', angulo: 'caso-uso', tipoContenido: 'video' },
  { dia: 26, demoId: 'chatbot', angulo: 'detras-camaras', tipoContenido: 'imagen' },
  { dia: 27, demoId: 'dashboard-ejecutivo', angulo: 'tip-rapido', tipoContenido: 'texto' },
  { dia: 28, demoId: 'ecommerce', angulo: 'pregunta-engagement', tipoContenido: 'texto' },
  { dia: 29, demoId: 'crm-ia', angulo: 'detras-camaras', tipoContenido: 'carrusel' },
  { dia: 30, demoId: 'chatbot', angulo: 'lanzamiento', tipoContenido: 'video' },
];

/** Límites de LinkedIn que usa la herramienta (caracteres). */
export const LIMITES = {
  post: 3000,
  adHeadline: 70,
  adIntro: 150,
  adDescription: 70,
} as const;

/** Botones de anuncio que acepta la ruta de IA (contrato de /api/linkedin-ads/generate). */
export const AD_CTAS = ['Más información', 'Visitar sitio web', 'Registrarse', 'Probar demo'] as const;
export type AdCta = (typeof AD_CTAS)[number];
export const AD_CTA_KEYS: Record<AdCta, 'learnMore' | 'visitSite' | 'register' | 'tryDemo'> = {
  'Más información': 'learnMore',
  'Visitar sitio web': 'visitSite',
  Registrarse: 'register',
  'Probar demo': 'tryDemo',
};
