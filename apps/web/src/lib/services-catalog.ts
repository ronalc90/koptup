/**
 * Catálogo central de servicios KopTup.
 *
 * Define los 27 servicios ofrecidos, sus 3 tiers (Inicial / Profesional /
 * Enterprise) con precios en pesos colombianos, ciclos de pago y metadata
 * de presentación (íconos, gradientes, slug de demo, categoría).
 *
 * Cada plan trae además:
 *   - `limits`: usuarios admin/finales, cuentas, volumen mensual, storage, SLA.
 *   - `costosAdicionales`: APIs (OpenAI, Anthropic), infra (AWS, Vercel),
 *     integraciones (Twilio, Stripe, etc.) que el CLIENTE paga directamente
 *     al proveedor — no las facturamos nosotros.
 *   - `integraciones`: nivel y lista de integraciones incluidas en el tier.
 *
 * Las cadenas visibles (nombres, descripciones, bullets) viven en
 * `messages/services/<slug>.{es,en}.json` para soportar i18n.
 */

export type ServiceCategory =
  | 'sales'
  | 'finance'
  | 'operations'
  | 'productivity'
  | 'aiPlatform'
  | 'security'
  | 'healthcare'
  | 'education'
  | 'commerce'
  | 'support'
  | 'devTools'
  | 'voice'
  | 'data'
  | 'engagement';

export type ServiceTier = 'inicial' | 'profesional' | 'enterprise';

export type BillingCycleId = 'monthly' | 'semestral' | 'annual';

export interface BillingCycle {
  id: BillingCycleId;
  monthsBilled: 1 | 6 | 12;
  /** Descuento sobre el total facturado (0 = sin descuento). */
  discountPct: number;
}

export const BILLING_CYCLES: BillingCycle[] = [
  { id: 'monthly', monthsBilled: 1, discountPct: 0 },
  { id: 'semestral', monthsBilled: 6, discountPct: 0.1 },
  { id: 'annual', monthsBilled: 12, discountPct: 0.2 },
];

/* -------------------------------------------------------------------------- */
/* Conversión COP <-> USD                                                      */
/* -------------------------------------------------------------------------- */

/** TRM de referencia (2026): 1 USD = $4.000 COP. */
export const USD_RATE = 4000;

/** Mínimo de mantenimiento mensual SaaS — cubre costo operativo real. */
export const MIN_SAAS_MONTHLY_COP = 400_000;

/** Convierte COP a USD redondeando al múltiplo de 10 USD más cercano. */
export function copToUsd(cop: number): number {
  if (cop === 0) return 0;
  return Math.round(cop / USD_RATE / 10) * 10;
}

/** Formatea un valor en USD. Para 0 muestra "Personalizado". */
export function formatUSD(usd: number): string {
  if (usd === 0) return 'Personalizado';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd);
}

export type DisplayCurrency = 'COP' | 'USD';

/** Aplica el mínimo de mantenimiento SaaS ($400.000 COP/mes). Setup queda igual. */
function enforceMinMonthly(monthly: number): number {
  if (monthly === 0) return 0;
  return Math.max(monthly, MIN_SAAS_MONTHLY_COP);
}

/* -------------------------------------------------------------------------- */
/* Soporte: SLA por tier (horario laboral Colombia, sin guardia humana fuera) */
/* -------------------------------------------------------------------------- */

/**
 * SLA de soporte estándar de Koptup. TODO el soporte humano se presta en
 * horario laboral Colombia (Lun-Vie 8 AM - 5 PM). El monitoreo automatizado
 * y el auto-escalado SI están activos siempre — pero no hay personas de
 * guardia fuera de horario.
 */
export type SupportSlaId = 'email-24h' | 'email-whatsapp-4h' | 'priority-1h';

export const SUPPORT_SLA_BY_SAAS_TIER: Record<'starter' | 'growth' | 'business', SupportSlaId> = {
  starter: 'email-24h',
  growth: 'email-whatsapp-4h',
  business: 'priority-1h',
};

/* -------------------------------------------------------------------------- */
/* Notas globales (infraestructura y custom builds)                            */
/* -------------------------------------------------------------------------- */

export const INFRA_NOTE_ES =
  'Monitoreo automatizado y auto-escalado configurados desde el día 1. Los costos de infraestructura (AWS/GCP/Vercel/Datadog) y APIs de terceros (OpenAI, Twilio, Stripe) los factura el proveedor directamente al cliente — nosotros no los marcamos.';

export const INFRA_NOTE_EN =
  'Automated monitoring and auto-scaling configured from day one. Infrastructure costs (AWS/GCP/Vercel/Datadog) and third-party API costs (OpenAI, Twilio, Stripe) are billed by the provider directly to the customer — we do not mark them up.';

export const CUSTOM_NOTICE_ES = {
  title: '¿No encontrás lo que buscás?',
  body:
    'Si necesitás algo que no está en nuestro catálogo, lo construimos a medida desde cero. Pedinos cotización y te respondemos con scope, tiempos y propuesta en 48 horas hábiles.',
  cta: 'Solicitar cotización personalizada',
};

export const CUSTOM_NOTICE_EN = {
  title: "Can't find what you need?",
  body:
    "If you need something not in our catalog, we build it from scratch. Request a quote and we'll come back with scope, timeline and proposal within 48 business hours.",
  cta: 'Request a custom quote',
};

/* -------------------------------------------------------------------------- */
/* Tipos compartidos: límites, costos adicionales, integraciones              */
/* -------------------------------------------------------------------------- */

export type UnlimitedOrNumber = number | 'unlimited';

export interface ResourceLimits {
  /** Usuarios admin incluidos (asientos). */
  adminUsers: UnlimitedOrNumber;
  /** Usuarios finales / clientes / leads / contactos. */
  endUsers: UnlimitedOrNumber;
  /** Cuentas / tenants / empresas separadas (multi-tenant). */
  accounts: UnlimitedOrNumber;
  /** Volumen mensual: conversaciones, transacciones, llamadas, etc. */
  monthlyVolume: UnlimitedOrNumber;
  /** Etiqueta human-readable para mostrar el límite principal. */
  volumeLabel: string;
  /** Storage incluido en GB. */
  storageGB: UnlimitedOrNumber;
  /** Soporte: nivel. Todo soporte humano corre en horario laboral Colombia (Lun-Vie 8 AM - 5 PM). */
  supportSLA: '24-48h email' | '4h business' | '1h business' | 'priority-1h';
}

export interface CostoAdicional {
  /** Nombre del recurso (ej. "OpenAI GPT-4o"). */
  recurso: string;
  /** Estimación mensual aproximada en USD (ej. "$150-400"). */
  estimadoUSD: string;
  /** Quién factura: 'cliente' (paga al provider directo) | 'koptup' (incluido). */
  facturadoPor: 'cliente' | 'koptup';
  /** Explicación 1 línea. */
  detalle: string;
}

export type IntegrationLevelName = 'Básica' | 'Media' | 'Avanzada' | 'Empresarial';

export interface IntegrationLevel {
  nombre: IntegrationLevelName;
  /** Lista de integraciones incluidas en este nivel. */
  items: string[];
}

export interface ServicePlan {
  tier: ServiceTier;
  setupCOP: number;
  monthlyCOP: number;
  /** Equivalente USD del setup (TRM 4.000, redondeado a múltiplo de 10). */
  setupUSD: number;
  /** Equivalente USD de la mensualidad. */
  monthlyUSD: number;
  duracionSemanas: { min: number; max: number };
  /** Cantidad de bullets esperados en `plans.<tier>.setupIncluye[]`. */
  setupIncluyeCount: number;
  /** Cantidad de bullets esperados en `plans.<tier>.mantenimientoIncluye[]`. */
  mantenimientoIncluyeCount: number;
  limits?: ResourceLimits;
  costosAdicionales?: CostoAdicional[];
  integraciones?: IntegrationLevel;
}

export interface ServiceOffering {
  slug: string;
  /** Slug de demo bajo `/demo/<demoSlug>` (vacío si no aplica). */
  demoSlug: string;
  category: ServiceCategory;
  /** Nombre del heroicon outline (ej. `BriefcaseIcon`). */
  icon: string;
  /** Clases tailwind para gradiente de header (`from-x to-y`). */
  gradient: string;
  plans: ServicePlan[];
}

/* -------------------------------------------------------------------------- */
/* Builders                                                                    */
/* -------------------------------------------------------------------------- */

const DURACION_SEMANAS = {
  inicial: { min: 2, max: 5 },
  profesional: { min: 6, max: 10 },
  enterprise: { min: 10, max: 18 },
} as const;

const INCLUYE_COUNTS = {
  inicial: { setup: 5, mant: 5 },
  profesional: { setup: 6, mant: 6 },
  enterprise: { setup: 7, mant: 7 },
} as const;

/** Prices tuple: [setupI, monthlyI, setupP, monthlyP, setupE, monthlyE]. */
type ServicePrices = [number, number, number, number, number, number];

/** Extras por tier, en el mismo orden: inicial, profesional, enterprise. */
interface ServiceExtras {
  limits: [ResourceLimits, ResourceLimits, ResourceLimits];
  costosAdicionales: [CostoAdicional[], CostoAdicional[], CostoAdicional[]];
  integraciones: [IntegrationLevel, IntegrationLevel, IntegrationLevel];
}

function buildPlans(prices: ServicePrices, extras: ServiceExtras): ServicePlan[] {
  const [setupI, monthlyI, setupP, monthlyP, setupE, monthlyE] = prices;
  const mI = enforceMinMonthly(monthlyI);
  const mP = enforceMinMonthly(monthlyP);
  const mE = enforceMinMonthly(monthlyE);
  return [
    {
      tier: 'inicial',
      setupCOP: setupI,
      monthlyCOP: mI,
      setupUSD: copToUsd(setupI),
      monthlyUSD: copToUsd(mI),
      duracionSemanas: DURACION_SEMANAS.inicial,
      setupIncluyeCount: INCLUYE_COUNTS.inicial.setup,
      mantenimientoIncluyeCount: INCLUYE_COUNTS.inicial.mant,
      limits: extras.limits[0],
      costosAdicionales: extras.costosAdicionales[0],
      integraciones: extras.integraciones[0],
    },
    {
      tier: 'profesional',
      setupCOP: setupP,
      monthlyCOP: mP,
      setupUSD: copToUsd(setupP),
      monthlyUSD: copToUsd(mP),
      duracionSemanas: DURACION_SEMANAS.profesional,
      setupIncluyeCount: INCLUYE_COUNTS.profesional.setup,
      mantenimientoIncluyeCount: INCLUYE_COUNTS.profesional.mant,
      limits: extras.limits[1],
      costosAdicionales: extras.costosAdicionales[1],
      integraciones: extras.integraciones[1],
    },
    {
      tier: 'enterprise',
      setupCOP: setupE,
      monthlyCOP: mE,
      setupUSD: copToUsd(setupE),
      monthlyUSD: copToUsd(mE),
      duracionSemanas: DURACION_SEMANAS.enterprise,
      setupIncluyeCount: INCLUYE_COUNTS.enterprise.setup,
      mantenimientoIncluyeCount: INCLUYE_COUNTS.enterprise.mant,
      limits: extras.limits[2],
      costosAdicionales: extras.costosAdicionales[2],
      integraciones: extras.integraciones[2],
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Helpers de extras                                                          */
/* -------------------------------------------------------------------------- */

const lim = (
  adminUsers: UnlimitedOrNumber,
  endUsers: UnlimitedOrNumber,
  accounts: UnlimitedOrNumber,
  monthlyVolume: UnlimitedOrNumber,
  volumeLabel: string,
  storageGB: UnlimitedOrNumber,
  supportSLA: ResourceLimits['supportSLA'],
): ResourceLimits => ({
  adminUsers,
  endUsers,
  accounts,
  monthlyVolume,
  volumeLabel,
  storageGB,
  supportSLA,
});

const c = (
  recurso: string,
  estimadoUSD: string,
  detalle: string,
  facturadoPor: 'cliente' | 'koptup' = 'cliente',
): CostoAdicional => ({ recurso, estimadoUSD, facturadoPor, detalle });

const integ = (nombre: IntegrationLevelName, items: string[]): IntegrationLevel => ({
  nombre,
  items,
});

/* Costos comunes reutilizables (paga el cliente al proveedor directo). */
const COST_HOSTING_S = c('Hosting (Vercel/AWS)', '$20-80', 'Servidor + dominio + SSL + CDN básico');
const COST_HOSTING_M = c('Hosting (AWS/GCP)', '$200-600', 'Producción + staging + auto-scaling');
const COST_HOSTING_L = c('Hosting enterprise (AWS/GCP multi-región)', '$1500-8000', 'Multi-AZ + DR + WAF + observabilidad');
const COST_DB_S = c('Base de datos (Postgres/Mongo managed)', '$25-80', 'Plan starter con backups diarios');
const COST_DB_M = c('Base de datos managed (RDS/Atlas M30+)', '$150-600', 'Replicas + backups + métricas');
const COST_DB_L = c('Cluster DB enterprise (Aurora/Atlas dedicado)', '$1200-6000', 'HA multi-región + PITR + auditoría');
const COST_EMAIL_S = c('Email transaccional (SendGrid/Resend)', '$20-50', 'Hasta 40k emails/mes');
const COST_EMAIL_M = c('Email transaccional (SendGrid Pro)', '$90-300', 'Hasta 1M emails/mes + dominio dedicado');
const COST_MONITOR_M = c('Monitoreo (Datadog/Sentry/Logflare)', '$80-300', 'APM + errores + logs');
const COST_MONITOR_L = c('Observabilidad enterprise (Datadog/New Relic)', '$800-3000', 'Multi-cluster + retención larga');
const COST_OPENAI_S = c('OpenAI GPT-4o-mini', '$80-200', 'Tokens del modelo según uso real');
const COST_OPENAI_M = c('OpenAI GPT-4o + Claude Sonnet', '$400-1500', 'Tokens según volumen real de tráfico');
const COST_OPENAI_L = c('LLM mix (OpenAI + Anthropic + Mistral)', '$3000-15000', 'Uso productivo a gran escala');
const COST_EMBED_S = c('OpenAI Embeddings text-embedding-3', '$10-30', 'Vectorización inicial y de actualizaciones');
const COST_EMBED_M = c('OpenAI Embeddings text-embedding-3-large', '$50-150', 'Vectorización de base de conocimiento grande');
const COST_PINECONE_M = c('Pinecone/Qdrant managed', '$200-500', 'Vector DB multi-tenant en producción');
const COST_PINECONE_L = c('Vector DB dedicado (Pinecone Enterprise)', '$1500-6000', 'Pods dedicados + multi-región');
const COST_TWILIO = c('Twilio WhatsApp Business API', '$50-300', 'Mensajes salientes + sesiones de conversación');
const COST_TWILIO_L = c('Twilio WhatsApp + SMS + voz', '$1500-6000', 'Multi-país, números dedicados, voz IA');
const COST_STRIPE = c('Stripe', '2.9% + $0.30/tx', 'Comisión por transacción procesada');
const COST_WOMPI = c('Wompi (Colombia)', '2.99% + IVA', 'Pasarela de pagos local');
const COST_MAPBOX = c('Mapbox', '$50-300', 'Mapas + rutas + geocoding');
const COST_TWILIO_VOICE = c('Twilio Voice + Deepgram STT', '$300-1500', 'Llamadas entrantes/salientes + transcripción');
const COST_ELEVENLABS = c('ElevenLabs TTS', '$99-500', 'Síntesis de voz natural en tiempo real');
const COST_DIAN = c('Proveedor tecnológico DIAN', '$30-150', 'Emisión de facturas electrónicas certificadas');
const COST_DIAN_L = c('Proveedor tecnológico DIAN enterprise', '$300-1500', 'Alto volumen + nómina + radian');
const COST_KYC = c('KYC/AML (Veriff/Truora)', '$0.50-2 por verificación', 'Verificación de identidad biométrica');
const COST_OBSERV = c('Backups + CDN + WAF (Cloudflare)', '$50-200', 'Protección DDoS + edge cache');

/* -------------------------------------------------------------------------- */
/* Catálogo SERVICIOS — el cliente recibe el código fuente                    */
/* -------------------------------------------------------------------------- */

export const SERVICES: ServiceOffering[] = [
  /* 1. Chatbot RAG IA ------------------------------------------------------- */
  {
    slug: 'chatbot-rag-ia',
    demoSlug: 'chatbot',
    category: 'aiPlatform',
    icon: 'ChatBubbleLeftRightIcon',
    gradient: 'from-primary-600 to-primary-800',
    plans: buildPlans(
      [9_500_000, 850_000, 38_000_000, 2_900_000, 145_000_000, 9_500_000],
      {
        limits: [
          lim(3, 1000, 1, 5000, '5.000 conversaciones/mes', 5, '24-48h email'),
          lim(10, 10000, 1, 50000, '50.000 conversaciones/mes', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Volumen ilimitado', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_OPENAI_S, COST_EMBED_S, COST_HOSTING_S, c('Pinecone serverless (opcional)', '$70', 'Vector DB; alternativa gratis: pgvector')],
          [COST_OPENAI_M, COST_EMBED_M, COST_HOSTING_M, COST_PINECONE_M, COST_TWILIO, COST_MONITOR_M],
          [COST_OPENAI_L, COST_EMBED_M, COST_HOSTING_L, COST_PINECONE_L, COST_TWILIO_L, COST_MONITOR_L, c('Compliance/auditoría (SOC2)', '$2000-5000', 'Auditorías + pentesting + certificaciones')],
        ],
        integraciones: [
          integ('Básica', ['Sitio web (widget JS)', 'Email para notificaciones', '1 canal: WhatsApp Business o web chat']),
          integ('Avanzada', ['WhatsApp Business API', 'Slack/Teams', 'Salesforce/HubSpot CRM', 'Sitio web + iframe embebido', 'API REST custom', 'Webhooks salientes']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SSO SAML/OIDC', 'SIEM (Splunk/Sentinel)', 'LLMs on-prem opcional', 'Multi-región failover', 'HIPAA/SOC2/ISO27001', 'VPC peering dedicado']),
        ],
      },
    ),
  },

  /* 2. Ecommerce ------------------------------------------------------------ */
  {
    slug: 'ecommerce',
    demoSlug: 'ecommerce',
    category: 'commerce',
    icon: 'ShoppingCartIcon',
    gradient: 'from-green-600 to-emerald-800',
    plans: buildPlans(
      [12_000_000, 950_000, 48_000_000, 3_500_000, 175_000_000, 11_000_000],
      {
        limits: [
          lim(3, 5000, 1, 2000, '2.000 órdenes/mes', 20, '24-48h email'),
          lim(15, 50000, 1, 30000, '30.000 órdenes/mes', 200, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Órdenes ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_EMAIL_S, COST_STRIPE, COST_WOMPI],
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_M, COST_STRIPE, COST_WOMPI, COST_MONITOR_M, c('Algolia search', '$50-300', 'Búsqueda y filtros rápidos')],
          [COST_HOSTING_L, COST_DB_L, c('Email enterprise (SendGrid Premier)', '$500-2500', 'Multi-IP dedicada + soporte premium del proveedor'), COST_STRIPE, COST_MONITOR_L, COST_OBSERV, c('Anti-fraude (Stripe Radar/Sift)', '$200-1500', 'Reglas + ML antifraude por transacción')],
        ],
        integraciones: [
          integ('Básica', ['Stripe/Wompi/PayU', 'Tracking (Servientrega/Coordinadora)', 'Google Analytics', 'Email transaccional']),
          integ('Avanzada', ['ERP (Siigo/SAP B1)', 'Marketplaces (ML/Amazon)', 'POS físico', 'CRM marketing', 'WhatsApp Business', 'OMS/WMS', 'Multi-pasarela']),
          integ('Empresarial', ['Todo lo de Avanzada', 'ERP enterprise (SAP S/4HANA)', 'PIM dedicado', 'Multi-país/moneda/idioma', 'B2B con catálogos privados', 'EDI con proveedores', 'PCI-DSS']),
        ],
      },
    ),
  },

  /* 3. BI Dashboard --------------------------------------------------------- */
  {
    slug: 'bi-dashboard',
    demoSlug: 'dashboard-ejecutivo',
    category: 'aiPlatform',
    icon: 'ChartBarIcon',
    gradient: 'from-purple-600 to-purple-800',
    plans: buildPlans(
      [9_000_000, 750_000, 38_000_000, 2_700_000, 135_000_000, 8_500_000],
      {
        limits: [
          lim(5, 50, 1, 100000, '100k filas procesadas/mes', 10, '24-48h email'),
          lim(25, 500, 1, 5_000_000, '5M filas procesadas/mes', 100, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Filas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, c('OpenAI (insights IA opcional)', '$30-100', 'Resúmenes y forecasting con LLM')],
          [COST_HOSTING_M, COST_DB_M, c('Data warehouse (BigQuery/Snowflake)', '$200-1500', 'Procesamiento OLAP + storage columnar'), COST_OPENAI_M, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Warehouse enterprise (Snowflake/Databricks)', '$2000-12000', 'Clusters dedicados + tiempo real'), COST_OPENAI_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['CSV/Excel upload', 'Google Sheets', 'Postgres/MySQL directo']),
          integ('Avanzada', ['ERP (SAP/Oracle/Siigo)', 'CRM (Salesforce/HubSpot)', 'Marketing (GA4, Meta Ads)', 'Webhooks + REST', 'Snowflake/BigQuery', 'S3/GCS data lakes']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SSO SAML/OIDC', 'Data lineage + governance', 'Multi-warehouse federation', 'CDC en tiempo real (Debezium)', 'Row-level security', 'SOC2/ISO27001']),
        ],
      },
    ),
  },

  /* 4. Gestor documental ---------------------------------------------------- */
  {
    slug: 'gestor-documental',
    demoSlug: 'gestor-documentos',
    category: 'data',
    icon: 'DocumentTextIcon',
    gradient: 'from-blue-600 to-blue-800',
    plans: buildPlans(
      [7_500_000, 650_000, 32_000_000, 2_300_000, 120_000_000, 7_500_000],
      {
        limits: [
          lim(5, 100, 1, 10000, '10.000 documentos/mes', 50, '24-48h email'),
          lim(25, 2000, 1, 200000, '200.000 documentos/mes', 500, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Documentos ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, c('Storage S3/GCS', '$20-80', 'Almacenamiento de PDFs/Office'), c('OCR (AWS Textract/Google Vision)', '$30-150', 'Extracción de texto de imágenes/PDF')],
          [COST_HOSTING_M, c('Storage S3/GCS Intelligent-Tiering', '$200-800', 'Storage con auto-archivado'), c('OCR avanzado (Textract Plus)', '$300-1500', 'Tablas + formularios + handwriting'), COST_OPENAI_M, COST_MONITOR_M],
          [COST_HOSTING_L, c('Storage enterprise (S3 + Glacier)', '$1500-8000', 'Retención legal + WORM compliance'), c('OCR + IDP enterprise', '$2000-10000', 'Pipeline IDP con HITL'), COST_OPENAI_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['Upload manual', 'Email forward', 'Google Drive (OAuth)']),
          integ('Avanzada', ['SharePoint', 'OneDrive enterprise', 'Box', 'Webhooks de eventos', 'API REST', 'Firmas electrónicas integradas']),
          integ('Empresarial', ['Todo lo de Avanzada', 'ECM (Documentum/OpenText)', 'SAP ArchiveLink', 'Workflows BPMN', 'Retention policies legales', 'DLP + clasificación automática', 'eDiscovery']),
        ],
      },
    ),
  },

  /* 5. Sistema de reservas -------------------------------------------------- */
  {
    slug: 'sistema-reservas',
    demoSlug: 'sistema-reservas',
    category: 'productivity',
    icon: 'CalendarIcon',
    gradient: 'from-orange-600 to-orange-800',
    plans: buildPlans(
      [6_500_000, 550_000, 25_000_000, 1_900_000, 95_000_000, 6_000_000],
      {
        limits: [
          lim(3, 500, 1, 1000, '1.000 reservas/mes', 5, '24-48h email'),
          lim(15, 10000, 5, 20000, '20.000 reservas/mes', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Reservas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_EMAIL_S, c('SMS (Twilio/Labsmobile)', '$20-100', 'Recordatorios de cita por SMS')],
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_M, COST_TWILIO, COST_STRIPE, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Comunicaciones multi-canal enterprise', '$1000-5000', 'SMS + WhatsApp + voz a alto volumen'), COST_STRIPE, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['Google Calendar (1 vía)', 'Email recordatorios', 'Stripe/Wompi']),
          integ('Avanzada', ['Outlook/Microsoft 365', 'Apple Calendar', 'WhatsApp Business', 'Zoom/Google Meet auto-link', 'CRM (HubSpot)', 'POS para no-shows']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Multi-sucursal con franquicias', 'ERP/HRMS con disponibilidad de profesionales', 'SIS/EHR para salud', 'Marketplaces verticales', 'API GraphQL']),
        ],
      },
    ),
  },

  /* 6. CMS Headless --------------------------------------------------------- */
  {
    slug: 'cms-headless',
    demoSlug: 'gestor-contenido',
    category: 'engagement',
    icon: 'PencilSquareIcon',
    gradient: 'from-pink-600 to-pink-800',
    plans: buildPlans(
      [7_000_000, 600_000, 28_000_000, 2_100_000, 105_000_000, 6_800_000],
      {
        limits: [
          lim(5, 0, 1, 100000, '100k vistas/mes', 10, '24-48h email'),
          lim(20, 0, 3, 5_000_000, '5M vistas/mes', 100, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Vistas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, c('CDN (Cloudflare/Fastly)', '$20-80', 'Edge cache global')],
          [COST_HOSTING_M, COST_DB_M, c('CDN + image optimization', '$200-800', 'Vercel/Cloudflare Pro + transformaciones'), COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('CDN enterprise multi-región', '$1500-6000', 'Edge functions + WAF + analytics'), COST_MONITOR_L, c('DAM (Cloudinary/Bynder)', '$500-3000', 'Asset management con AI tagging')],
        ],
        integraciones: [
          integ('Básica', ['Webhook a un solo frontend', 'Imágenes vía Cloudinary free', 'Algolia free tier']),
          integ('Avanzada', ['Multi-frontend (web + app + email)', 'GraphQL federado', 'PIM/DAM externos', 'CDN propietario', 'A/B testing (Optimizely)', 'Personalización por segmento']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Multi-marca y multi-idioma', 'Workflow editorial con aprobaciones', 'Translation memory (Lokalise/Phrase)', 'SSO empresarial', 'DXP completo', 'Web vitals SLA']),
        ],
      },
    ),
  },

  /* 7. Gestión de proyectos ------------------------------------------------- */
  {
    slug: 'gestion-proyectos',
    demoSlug: 'control-proyectos',
    category: 'productivity',
    icon: 'RectangleStackIcon',
    gradient: 'from-teal-600 to-teal-800',
    plans: buildPlans(
      [6_500_000, 580_000, 25_000_000, 2_000_000, 95_000_000, 6_200_000],
      {
        limits: [
          lim(10, 0, 1, 50, '50 proyectos activos', 10, '24-48h email'),
          lim(50, 0, 5, 500, '500 proyectos activos', 100, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Proyectos ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_EMAIL_S],
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_M, COST_MONITOR_M, c('Slack/Teams integraciones', '$0-200', 'Apps + webhooks de notificaciones')],
          [COST_HOSTING_L, COST_DB_L, COST_MONITOR_L, c('Integraciones enterprise (Jira/Azure DevOps)', '$500-2500', 'Conectores premium + middleware')],
        ],
        integraciones: [
          integ('Básica', ['Email', 'Slack (free)', 'Google Calendar']),
          integ('Avanzada', ['Jira/Linear', 'GitHub/GitLab/Bitbucket', 'MS Teams', 'Outlook', 'Tempo/Harvest tiempos', 'Webhooks + REST API']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Azure DevOps + ServiceNow', 'ERP enterprise (HCM + finanzas)', 'PPM portfolio management', 'Power BI/Tableau', 'SSO + provisioning SCIM', 'Resource forecasting AI']),
        ],
      },
    ),
  },

  /* 8. CRM IA --------------------------------------------------------------- */
  {
    slug: 'crm-ia',
    demoSlug: 'crm-ia',
    category: 'sales',
    icon: 'BriefcaseIcon',
    gradient: 'from-indigo-600 to-indigo-800',
    plans: buildPlans(
      [10_500_000, 950_000, 42_000_000, 3_200_000, 155_000_000, 10_000_000],
      {
        limits: [
          lim(5, 5000, 1, 20000, '20.000 contactos + 2k deals/mes', 10, '24-48h email'),
          lim(30, 100000, 3, 500000, '500k contactos + 50k deals/mes', 200, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Contactos y deals ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_EMAIL_S, c('OpenAI (scoring + drafting)', '$50-200', 'Lead scoring + redacción de emails')],
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_M, COST_OPENAI_M, COST_TWILIO, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Email enterprise + multi-IP', '$500-2500', 'Deliverability premium'), COST_OPENAI_L, COST_TWILIO_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['Gmail/Outlook 1 cuenta', 'WhatsApp Business 1 línea', 'CSV import']),
          integ('Avanzada', ['Gmail/Outlook multi-cuenta', 'WhatsApp Business API', 'Calendly/Outlook calendar sync', 'Marketing (Mailchimp/Sendgrid)', 'Telefonía (Twilio/Aircall)', 'ERP/facturación']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Marketing automation enterprise (Marketo/Eloqua)', 'Data warehouse + reverse ETL', 'CPQ + facturación recurrente', 'Call center omnicanal', 'SSO + SCIM', 'Compliance GDPR/HIPAA']),
        ],
      },
    ),
  },

  /* 9. ERP Modular ---------------------------------------------------------- */
  {
    slug: 'erp-modular',
    demoSlug: 'erp',
    category: 'finance',
    icon: 'BuildingOfficeIcon',
    gradient: 'from-amber-600 to-amber-800',
    plans: buildPlans(
      [24_000_000, 2_200_000, 95_000_000, 6_500_000, 320_000_000, 19_500_000],
      {
        limits: [
          lim(10, 0, 1, 5000, '5.000 transacciones/mes', 50, '24-48h email'),
          lim(50, 0, 5, 100000, '100.000 transacciones/mes', 500, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Transacciones ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_S, COST_DIAN, COST_WOMPI],
          [c('Hosting (AWS multi-AZ)', '$500-2000', 'Producción + staging + dev'), COST_DB_M, COST_EMAIL_M, COST_DIAN_L, COST_STRIPE, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Email enterprise', '$500-2500', 'Multi-país + dominio dedicado'), c('DIAN + bancos enterprise', '$2000-8000', 'Conexión PSE + corresponsales + libros oficiales'), COST_MONITOR_L, c('Compliance/auditoría', '$3000-10000', 'NIIF + ISO + SOX')],
        ],
        integraciones: [
          integ('Media', ['Facturación electrónica DIAN', 'Wompi/PSE', 'Bancos (cargue de extractos)', 'Excel import/export', 'POS básico']),
          integ('Avanzada', ['Bancos via PSE/API', 'EDI con proveedores', 'WMS/POS multi-sucursal', 'Nómina y operadores PILA', 'Múltiples monedas y centros de costo', 'API REST + webhooks']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SAP/Oracle interoperability', 'EDI multi-protocolo (AS2/X12)', 'Treasury + cash pooling', 'Consolidación multi-NIIF', 'Auditoría continua (SOX)', 'BI corporativo + planning']),
        ],
      },
    ),
  },

  /* 10. Helpdesk IA --------------------------------------------------------- */
  {
    slug: 'helpdesk-ia',
    demoSlug: 'helpdesk-ia',
    category: 'support',
    icon: 'LifebuoyIcon',
    gradient: 'from-rose-600 to-rose-800',
    plans: buildPlans(
      [8_500_000, 800_000, 35_000_000, 2_700_000, 130_000_000, 8_500_000],
      {
        limits: [
          lim(5, 2000, 1, 3000, '3.000 tickets/mes', 10, '24-48h email'),
          lim(30, 50000, 3, 50000, '50.000 tickets/mes', 100, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Tickets ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_EMAIL_S, COST_OPENAI_S],
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_M, COST_OPENAI_M, COST_TWILIO, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Email + voz enterprise', '$1500-6000', 'Centralita en la nube + dialer outbound'), COST_OPENAI_L, COST_TWILIO_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['Email a ticket', 'Web widget', 'Slack notify']),
          integ('Avanzada', ['WhatsApp/Telegram/Messenger', 'Jira/Linear sync', 'CRM (Salesforce/HubSpot)', 'Telefonía cloud', 'Knowledge base autoservicio', 'SLA + escalado por equipo']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Omnicanal con cola unificada', 'IVR + ACD con voice AI', 'Workforce management (NICE/Verint)', 'QM + speech analytics', 'BI con CSAT/NPS forecasting', 'SSO + GDPR']),
        ],
      },
    ),
  },

  /* 11. LMS eLearning ------------------------------------------------------- */
  {
    slug: 'lms-elearning',
    demoSlug: 'lms',
    category: 'education',
    icon: 'AcademicCapIcon',
    gradient: 'from-cyan-600 to-cyan-800',
    plans: buildPlans(
      [9_000_000, 850_000, 38_000_000, 2_900_000, 140_000_000, 8_900_000],
      {
        limits: [
          lim(5, 500, 1, 5000, '5.000 inscripciones/mes', 50, '24-48h email'),
          lim(30, 20000, 5, 100000, '100.000 inscripciones/mes', 500, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Inscripciones ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, c('Video hosting (Mux/Vimeo)', '$50-200', 'Streaming HLS adaptativo'), COST_STRIPE],
          [COST_HOSTING_M, COST_DB_M, c('Video CDN (Mux Pro/Cloudflare Stream)', '$300-1500', 'DRM + analytics + transcodificación'), COST_STRIPE, COST_OPENAI_M],
          [COST_HOSTING_L, COST_DB_L, c('Video enterprise (Kaltura/Brightcove)', '$2000-10000', 'Live + DRM + multi-bitrate global'), COST_OPENAI_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['Stripe/Wompi', 'Zoom (manual links)', 'Email recordatorios']),
          integ('Avanzada', ['Zoom/Meet auto-create', 'SCORM/xAPI', 'HRMS para certificaciones', 'CRM marketing', 'Webhooks de progreso', 'Proctoring básico']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SAP SuccessFactors / Workday Learning', 'LTI 1.3', 'Proctoring AI (ProctorU)', 'Talent Management', 'SSO + SCIM', 'Multi-tenant por sede']),
        ],
      },
    ),
  },

  /* 12. Telemedicina -------------------------------------------------------- */
  {
    slug: 'telemedicina',
    demoSlug: 'telemedicina',
    category: 'healthcare',
    icon: 'HeartIcon',
    gradient: 'from-red-600 to-rose-800',
    plans: buildPlans(
      [15_500_000, 1_600_000, 65_000_000, 4_900_000, 235_000_000, 15_000_000],
      {
        limits: [
          lim(5, 500, 1, 1000, '1.000 consultas/mes', 50, '24-48h email'),
          lim(30, 20000, 5, 30000, '30.000 consultas/mes', 500, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Consultas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, c('Video WebRTC (LiveKit/Daily)', '$50-300', 'Salas P2P con SFU'), COST_EMAIL_S, c('Cumplimiento HABEAS DATA', '$50-200', 'Auditoría protección datos')],
          [COST_HOSTING_M, COST_DB_M, c('Video managed (Daily Pro/Vonage)', '$500-2500', 'Recording + transcripción + chat'), COST_OPENAI_M, COST_TWILIO, COST_MONITOR_M],
          [COST_HOSTING_L, c('DB HIPAA-eligible (RDS/Atlas)', '$1500-6000', 'PHI con encriptación y auditoría'), c('Video enterprise (Agora/Vonage)', '$2000-10000', 'Multi-región + alta calidad + DR'), COST_OPENAI_L, COST_TWILIO_L, COST_MONITOR_L, c('Compliance HIPAA/HABEAS', '$3000-10000', 'BAA + auditoría continua')],
        ],
        integraciones: [
          integ('Básica', ['Email recordatorios', 'Stripe/Wompi', 'Calendar links manuales']),
          integ('Avanzada', ['EHR/HIS clínicas', 'Laboratorio (HL7 básico)', 'Farmacia con receta digital', 'WhatsApp Business', 'Wearables (Apple Health/Fitbit)', 'eRX']),
          integ('Empresarial', ['Todo lo de Avanzada', 'HL7 FHIR completo', 'PACS (DICOM)', 'EHR enterprise (Epic/Cerner)', 'Aseguradoras / EPS / IPS', 'Cumplimiento HIPAA + HABEAS DATA + Resolución 2654']),
        ],
      },
    ),
  },

  /* 13. Facturación electrónica -------------------------------------------- */
  {
    slug: 'facturacion-electronica',
    demoSlug: 'facturacion-electronica',
    category: 'finance',
    icon: 'DocumentCheckIcon',
    gradient: 'from-emerald-600 to-emerald-800',
    plans: buildPlans(
      [7_000_000, 650_000, 28_000_000, 2_200_000, 105_000_000, 6_500_000],
      {
        limits: [
          lim(3, 0, 1, 500, '500 facturas/mes', 5, '24-48h email'),
          lim(15, 0, 5, 20000, '20.000 facturas/mes', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Facturas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_DIAN, COST_EMAIL_S],
          [COST_HOSTING_M, COST_DB_M, COST_DIAN_L, COST_EMAIL_M, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Proveedor DIAN enterprise + multi-país', '$1500-6000', 'CO + MX + Perú + retención'), COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['DIAN', 'Email envío al cliente', 'CSV import']),
          integ('Avanzada', ['ERP (Siigo/SAP B1/World Office)', 'Bancos para conciliación', 'POS', 'CRM', 'API REST + webhooks', 'Multi-resoluciones DIAN']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SAP S/4HANA / Oracle', 'Multi-país (CO/MX/PE/CL/EC)', 'RADIAN + nómina electrónica', 'Auditoría + libros oficiales', 'EDI con clientes corporativos', 'SSO + SOX']),
        ],
      },
    ),
  },

  /* 14. WMS Logística ------------------------------------------------------- */
  {
    slug: 'wms-logistica',
    demoSlug: 'wms-logistica',
    category: 'operations',
    icon: 'TruckIcon',
    gradient: 'from-stone-600 to-stone-800',
    plans: buildPlans(
      [14_000_000, 1_350_000, 58_000_000, 4_200_000, 215_000_000, 13_500_000],
      {
        limits: [
          lim(5, 0, 1, 5000, '5.000 órdenes de almacén/mes', 20, '24-48h email'),
          lim(30, 0, 5, 100000, '100.000 órdenes/mes', 200, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Órdenes ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, c('Scanner/labels (Zebra cloud)', '$30-150', 'Impresión + drivers'), COST_EMAIL_S],
          [COST_HOSTING_M, COST_DB_M, c('Transportistas APIs (Servientrega/TCC)', '$100-500', 'Cotizaciones + tracking integrado'), COST_MAPBOX, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Transportistas multi-país enterprise', '$1500-6000', 'EDI + integraciones bidireccionales'), COST_MONITOR_L, c('IoT sensores frío', '$500-3000', 'IoT cadena de frío + alertas')],
        ],
        integraciones: [
          integ('Básica', ['Scanner USB', 'Transportistas (1 manual)', 'CSV upload']),
          integ('Avanzada', ['ERP (SAP B1/Siigo)', 'Marketplaces (ML/Amazon)', 'TMS para rutas', 'Servientrega/TCC/Coordinadora API', 'POS retail', 'RFID readers']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SAP EWM / Oracle WMS interop', 'Multi-bodega multi-país', 'Carriers multi-modal (terrestre/aéreo/marítimo)', 'IoT temperatura/humedad', 'ASN/EDI con proveedores', 'Yard management']),
        ],
      },
    ),
  },

  /* 15. POS Retail ---------------------------------------------------------- */
  {
    slug: 'pos-retail',
    demoSlug: 'pos',
    category: 'commerce',
    icon: 'ComputerDesktopIcon',
    gradient: 'from-fuchsia-600 to-fuchsia-800',
    plans: buildPlans(
      [7_500_000, 550_000, 30_000_000, 1_950_000, 110_000_000, 7_000_000],
      {
        limits: [
          lim(3, 0, 1, 5000, '5.000 ventas/mes en 1 sucursal', 10, '24-48h email'),
          lim(20, 0, 10, 100000, '100k ventas/mes en hasta 10 sucursales', 100, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Sucursales y ventas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_DIAN, c('Hardware POS (impresora + caja + scanner)', '$200-600 una vez', 'Equipos por terminal')],
          [COST_HOSTING_M, COST_DB_M, COST_DIAN_L, COST_STRIPE, c('Datafono (Redeban/Credibanco)', 'Por contrato', 'Comisiones por transacción'), COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('DIAN enterprise + multi-país', '$2000-8000', 'CO + MX + Perú facturación'), COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['DIAN', 'Datafono (manual)', 'Caja simple']),
          integ('Avanzada', ['ERP inventario', 'Ecommerce sync (Shopify/WooCommerce)', 'Datafonos integrados', 'Loyalty/CRM', 'WMS', 'Reportes Power BI']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SAP Retail / Oracle Retail', 'Centralized pricing & promotions', 'EDI proveedores', 'Self-checkout + kiosks', 'Loss prevention IA', 'Multi-país multi-tax']),
        ],
      },
    ),
  },

  /* 16. HRMS ---------------------------------------------------------------- */
  {
    slug: 'hrms',
    demoSlug: 'hrms',
    category: 'sales',
    icon: 'UserGroupIcon',
    gradient: 'from-violet-600 to-violet-800',
    plans: buildPlans(
      [13_500_000, 1_250_000, 56_000_000, 3_900_000, 195_000_000, 12_500_000],
      {
        limits: [
          lim(3, 100, 1, 100, '100 empleados', 10, '24-48h email'),
          lim(20, 5000, 5, 5000, '5.000 empleados', 100, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Empleados ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_EMAIL_S, c('PILA / operador (Aportes en Línea)', '$30-100', 'Pago de aportes mensuales')],
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_M, c('PILA enterprise + nómina electrónica DIAN', '$200-800', 'Multi-empresa + radian'), COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Compliance laboral multi-país', '$1500-6000', 'CO + MX + Perú con experts'), COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['DIAN nómina electrónica', 'PILA', 'Email a empleados']),
          integ('Avanzada', ['ATS reclutamiento', 'LMS de capacitación', 'Pasarela de pagos (banco)', 'Bonos/Sodexo', 'Slack/Teams onboarding', 'Performance reviews 360']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SAP SuccessFactors / Workday', 'Talent + Comp + Performance', 'EAP/seguros', 'BI con HR analytics', 'SSO + SCIM', 'Multi-país con compliance local']),
        ],
      },
    ),
  },

  /* 17. Automatización Workflows ------------------------------------------- */
  {
    slug: 'automatizacion-workflows',
    demoSlug: 'automatizacion',
    category: 'aiPlatform',
    icon: 'BoltIcon',
    gradient: 'from-yellow-600 to-orange-700',
    plans: buildPlans(
      [9_000_000, 800_000, 38_000_000, 2_700_000, 140_000_000, 8_500_000],
      {
        limits: [
          lim(3, 0, 1, 50000, '50.000 ejecuciones/mes', 5, '24-48h email'),
          lim(15, 0, 3, 1_000_000, '1M ejecuciones/mes', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Ejecuciones ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, c('OpenAI/Claude (steps IA opcionales)', '$50-200', 'Tokens según steps automatizados'), COST_EMAIL_S],
          [COST_HOSTING_M, COST_OPENAI_M, COST_DB_M, COST_MONITOR_M, c('Conectores premium (Zapier/Make alternativa)', '$200-800', 'Apps verticales con OAuth gestionado')],
          [COST_HOSTING_L, COST_OPENAI_L, COST_DB_L, COST_MONITOR_L, c('Workers dedicados + cola distribuida', '$1500-6000', 'BullMQ/Temporal cluster')],
        ],
        integraciones: [
          integ('Básica', ['HTTP/REST', 'Email', 'Google Sheets', 'Slack']),
          integ('Avanzada', ['CRM (Salesforce/HubSpot)', 'ERP (SAP B1/Siigo)', 'Bases de datos (Postgres/Mongo)', 'Cloud storage (S3/Drive)', 'WhatsApp Business', 'Webhooks bidireccionales']),
          integ('Empresarial', ['Todo lo de Avanzada', 'iPaaS enterprise (MuleSoft/Boomi)', 'SAP S/4HANA / Oracle EBS', 'EDI (AS2/X12/EDIFACT)', 'Kafka/RabbitMQ event bus', 'Temporal workflows long-running', 'Governance + auditoría']),
        ],
      },
    ),
  },

  /* 18. SaaS Multi-tenant --------------------------------------------------- */
  {
    slug: 'saas-multi-tenant',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'Squares2X2Icon',
    gradient: 'from-slate-600 to-slate-800',
    plans: buildPlans(
      [16_500_000, 1_500_000, 68_000_000, 4_900_000, 245_000_000, 14_500_000],
      {
        limits: [
          lim(5, 1000, 5, 50000, '50k requests/mes y 5 tenants', 20, '24-48h email'),
          lim(30, 100000, 50, 5_000_000, '5M requests/mes y 50 tenants', 200, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Tenants y requests ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_STRIPE, COST_EMAIL_S],
          [COST_HOSTING_M, COST_DB_M, COST_STRIPE, COST_EMAIL_M, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Auth0/Clerk enterprise', '$1500-6000', 'SSO + MFA + audit logs'), COST_MONITOR_L, c('Compliance SOC2/ISO27001', '$3000-10000', 'Auditoría continua + pentesting')],
        ],
        integraciones: [
          integ('Básica', ['Stripe billing', 'Email transaccional', 'Auth con email/password']),
          integ('Avanzada', ['Stripe billing avanzado (subscriptions + metered)', 'OAuth providers (Google/Microsoft/Apple)', 'Tenant isolation por row/schema', 'Webhooks + API REST', 'Audit log básico', 'Custom domains por tenant']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SSO SAML/OIDC por tenant', 'SCIM provisioning', 'Tenant isolation por DB dedicada', 'Compliance SOC2/ISO27001', 'Data residency multi-región', 'SLA dedicated']),
        ],
      },
    ),
  },

  /* 19. Voice AI Callcenter ------------------------------------------------- */
  {
    slug: 'voice-ai-callcenter',
    demoSlug: 'voice-ai',
    category: 'voice',
    icon: 'MicrophoneIcon',
    gradient: 'from-sky-600 to-sky-800',
    plans: buildPlans(
      [14_500_000, 2_200_000, 62_000_000, 6_500_000, 230_000_000, 17_500_000],
      {
        limits: [
          lim(3, 0, 1, 5000, '5.000 minutos/mes de llamadas', 5, '24-48h email'),
          lim(20, 0, 5, 100000, '100.000 minutos/mes', 100, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Minutos ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_TWILIO_VOICE, COST_ELEVENLABS, COST_OPENAI_S, COST_HOSTING_S],
          [c('Twilio Voice + Deepgram + LiveKit', '$1500-5000', 'STT + telefonía + WebRTC alta calidad'), c('ElevenLabs Pro / Azure Speech', '$500-2500', 'Voces premium + cloning'), COST_OPENAI_M, COST_HOSTING_M, COST_MONITOR_M],
          [c('Telefonía enterprise (Twilio Flex/Vonage)', '$5000-25000', 'Multi-país + números dedicados + DR'), c('Voice AI enterprise (ElevenLabs/Cartesia)', '$2000-10000', 'SLA + voces dedicadas + retención'), COST_OPENAI_L, COST_HOSTING_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['1 línea telefónica', 'WhatsApp voice notes (manual)', 'Email transcripts']),
          integ('Avanzada', ['Multi-línea + IVR', 'CRM (Salesforce/HubSpot) con call logging', 'Helpdesk con tickets desde llamada', 'WhatsApp Business voice', 'Calendarios para agendar']),
          integ('Empresarial', ['Todo lo de Avanzada', 'PBX/SIP enterprise (Asterisk/Genesys)', 'WFM + QM + speech analytics', 'Compliance grabaciones (PCI redaction)', 'Multi-país + multi-idioma', 'TTS clonado de voz corporativa']),
        ],
      },
    ),
  },

  /* 20. Firma electrónica --------------------------------------------------- */
  {
    slug: 'firma-electronica',
    demoSlug: 'firma-electronica',
    category: 'security',
    icon: 'PencilIcon',
    gradient: 'from-lime-600 to-lime-800',
    plans: buildPlans(
      [5_500_000, 550_000, 22_000_000, 1_700_000, 80_000_000, 5_000_000],
      {
        limits: [
          lim(3, 100, 1, 500, '500 firmas/mes', 5, '24-48h email'),
          lim(15, 5000, 5, 10000, '10.000 firmas/mes', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Firmas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, c('Certificado digital (Andes SCD/Certicámara)', '$30-150', 'Tokens hardware o nube por firmante'), COST_EMAIL_S],
          [COST_HOSTING_M, COST_DB_M, c('Estampa cronológica + LTV (Certicámara)', '$200-800', 'Tiempo certificado y verificación a largo plazo'), COST_KYC, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('PKI enterprise + HSM (Thales/AWS CloudHSM)', '$1500-6000', 'HSM dedicado para firmas masivas'), c('eIDAS / cualificada multi-país', '$2000-8000', 'Firma cualificada europea + LatAm')],
        ],
        integraciones: [
          integ('Básica', ['Email envío + recepción', 'Upload PDF/Word', 'Verificación pública por link']),
          integ('Avanzada', ['CRM (HubSpot/Salesforce)', 'ERP/contratos', 'API REST + webhooks', 'KYC integrado (Truora/Veriff)', 'WhatsApp Business para entrega', 'Templates dinámicos']),
          integ('Empresarial', ['Todo lo de Avanzada', 'DocuSign/Adobe Sign migration', 'PKI corporativa + HSM', 'eIDAS cualificada', 'SAP/Oracle adapter', 'Compliance multi-país (CO, MX, EU)']),
        ],
      },
    ),
  },

  /* 21. Scraping / Extracción ---------------------------------------------- */
  {
    slug: 'scraping-extraccion',
    demoSlug: 'scraping',
    category: 'data',
    icon: 'GlobeAltIcon',
    gradient: 'from-zinc-600 to-zinc-800',
    plans: buildPlans(
      [6_500_000, 650_000, 28_000_000, 2_100_000, 105_000_000, 6_500_000],
      {
        limits: [
          lim(2, 0, 1, 100000, '100k páginas raspadas/mes', 10, '24-48h email'),
          lim(10, 0, 5, 2_000_000, '2M páginas raspadas/mes', 100, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Páginas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, c('Proxies residenciales (Bright Data/Smartproxy)', '$50-300', 'Pool de IPs rotatorias por GB'), c('Captcha solver (2Captcha)', '$20-100', 'Solver para sitios protegidos')],
          [COST_HOSTING_M, c('Proxies residenciales/mobile', '$500-2500', 'Alto volumen + geo targeting'), c('Headless browsers managed (Browserless/ScrapingBee)', '$200-1500', 'Pool de Chrome headless'), COST_OPENAI_M, COST_MONITOR_M],
          [COST_HOSTING_L, c('Proxies enterprise multi-país', '$2000-10000', 'Datacenter + residencial + mobile'), c('Browser farm dedicada', '$1500-8000', 'Cluster k8s con Playwright'), COST_OPENAI_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['CSV/JSON export', 'Webhook a tu sistema', 'Email reporte']),
          integ('Avanzada', ['S3/GCS/Azure Blob', 'Postgres/Mongo direct write', 'Webhooks por cambio', 'Slack/Teams alertas', 'API REST para query', 'Data quality checks']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Data warehouse (Snowflake/BigQuery)', 'CDC + reverse ETL', 'Kafka stream output', 'Compliance (robots.txt, ToS legal)', 'Anti-detection enterprise', 'Multi-región scrapers']),
        ],
      },
    ),
  },

  /* 22. Code review IA ------------------------------------------------------ */
  {
    slug: 'code-review-ia',
    demoSlug: 'code-review-ia',
    category: 'devTools',
    icon: 'CommandLineIcon',
    gradient: 'from-neutral-700 to-neutral-900',
    plans: buildPlans(
      [6_000_000, 590_000, 25_000_000, 1_900_000, 90_000_000, 5_500_000],
      {
        limits: [
          lim(5, 0, 1, 500, '500 PRs analizados/mes', 5, '24-48h email'),
          lim(50, 0, 5, 10000, '10.000 PRs analizados/mes', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'PRs ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_OPENAI_S],
          [COST_HOSTING_M, c('Claude Sonnet + GPT-4o para análisis profundo', '$300-1500', 'Tokens según tamaño de PRs'), COST_MONITOR_M],
          [COST_HOSTING_L, c('LLMs mix + reasoning enterprise', '$2000-12000', 'Análisis de codebases grandes con cache'), COST_MONITOR_L, c('SAST/SCA enterprise (Snyk/Sonar)', '$500-3000', 'Licencias para análisis estático')],
        ],
        integraciones: [
          integ('Básica', ['GitHub (1 repo)', 'PR comments', 'Slack notify']),
          integ('Avanzada', ['GitHub/GitLab/Bitbucket multi-repo', 'Jira/Linear ticket sync', 'Slack/Teams reviews', 'SAST básico (Semgrep)', 'IDE plugin (VSCode)', 'CI/CD hooks']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Azure DevOps + Perforce', 'Sonar/Snyk/Checkmarx enterprise', 'Custom security rules + policy as code', 'DORA metrics + DevEx', 'Multi-org + SSO', 'Air-gapped option']),
        ],
      },
    ),
  },

  /* 23. Moderación contenido ----------------------------------------------- */
  {
    slug: 'moderacion-contenido',
    demoSlug: 'moderacion-contenido',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-red-700 to-red-900',
    plans: buildPlans(
      [8_500_000, 950_000, 36_000_000, 2_900_000, 135_000_000, 8_500_000],
      {
        limits: [
          lim(3, 0, 1, 100000, '100k items moderados/mes', 10, '24-48h email'),
          lim(20, 0, 5, 5_000_000, '5M items moderados/mes', 100, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Items ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, c('OpenAI moderation + GPT-4o-mini', '$80-300', 'Clasificación de texto'), c('Image moderation (Hive/AWS Rekognition)', '$50-200', 'Análisis NSFW/violence')],
          [COST_HOSTING_M, c('LLMs mix + Hive Pro', '$500-2500', 'Multi-categoría + custom rules'), c('Audio/video moderation', '$300-1500', 'Hive + AWS Transcribe'), COST_MONITOR_M],
          [COST_HOSTING_L, c('Moderation enterprise (Hive/Modulate)', '$2000-12000', 'Multi-idioma + custom models'), c('Trust & Safety platform', '$1500-8000', 'Workflow humano + ML loop'), COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['API REST', 'Webhook por flag', 'Dashboard de revisión']),
          integ('Avanzada', ['Webhooks bidireccionales', 'Queue para revisores humanos', 'CRM/CMS de tu plataforma', 'Slack/Discord alertas', 'Métricas por canal', 'API GraphQL']),
          integ('Empresarial', ['Todo lo de Avanzada', 'SIEM + Trust & Safety dashboards', 'Custom ML models entrenados con tu data', 'Multi-modal (texto+imagen+audio+video)', 'Compliance DSA (UE) + COPPA', 'BPO/outsourcing de moderadores']),
        ],
      },
    ),
  },

  /* 24. App delivery -------------------------------------------------------- */
  {
    slug: 'app-delivery',
    demoSlug: 'delivery',
    category: 'operations',
    icon: 'MapIcon',
    gradient: 'from-orange-500 to-red-600',
    plans: buildPlans(
      [16_500_000, 1_700_000, 68_000_000, 5_200_000, 245_000_000, 15_500_000],
      {
        limits: [
          lim(3, 5000, 1, 5000, '5.000 pedidos/mes con 1 ciudad', 10, '24-48h email'),
          lim(20, 100000, 10, 100000, '100k pedidos/mes en hasta 10 ciudades', 100, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Pedidos y ciudades ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_M, COST_DB_S, COST_MAPBOX, COST_STRIPE, c('Push notifications (OneSignal)', '$50-200', 'Apps iOS + Android')],
          [c('Hosting (AWS auto-scaling)', '$500-2500', 'API + workers + cache + queue'), COST_DB_M, c('Mapbox/Google Maps Pro', '$500-2500', 'Rutas + ETA + geocoding alto volumen'), COST_STRIPE, COST_TWILIO, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('Google Maps Platform enterprise', '$3000-15000', 'Routes + Places + Roads alto volumen'), c('Telefonía + push enterprise', '$1500-8000', 'Multi-país + IVR + masking'), COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['Stripe/Wompi', 'Google Maps básico', 'Email pedidos']),
          integ('Avanzada', ['Multi-pasarela (Stripe/Wompi/PayU)', 'TMS rutas dinámicas', 'WhatsApp Business', 'POS restaurantes', 'Marketplaces (Rappi/Didi delivery)', 'Loyalty/cashback']),
          integ('Empresarial', ['Todo lo de Avanzada', 'OMS/ERP enterprise', 'ML routing + demand forecasting', 'Marketplaces multi-país', 'Compliance laboral riders/repartidores', 'Fraud + chargeback ML', 'Multi-tenant para franquicias']),
        ],
      },
    ),
  },

  /* 25. Loyalty / Fidelización --------------------------------------------- */
  {
    slug: 'loyalty-fidelizacion',
    demoSlug: 'loyalty',
    category: 'engagement',
    icon: 'StarIcon',
    gradient: 'from-yellow-500 to-amber-600',
    plans: buildPlans(
      [8_500_000, 780_000, 36_000_000, 2_600_000, 130_000_000, 7_500_000],
      {
        limits: [
          lim(3, 5000, 1, 10000, '10.000 miembros + 50k transacciones/mes', 10, '24-48h email'),
          lim(20, 200000, 5, 500000, '500k miembros + 5M transacciones/mes', 100, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Miembros y transacciones ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_DB_S, COST_EMAIL_S, c('SMS/Push básico', '$30-150', 'Notificaciones de puntos')],
          [COST_HOSTING_M, COST_DB_M, COST_EMAIL_M, c('SMS + WhatsApp + push masivo', '$500-2500', 'Campañas segmentadas'), COST_OPENAI_M, COST_MONITOR_M],
          [COST_HOSTING_L, COST_DB_L, c('CDP + email enterprise (Iterable/Braze)', '$2000-12000', 'Marketing automation a millones'), COST_OPENAI_L, COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['POS retail', 'Email basic', 'CSV miembros']),
          integ('Avanzada', ['POS retail multi-sucursal', 'Ecommerce (Shopify/WooCommerce)', 'WhatsApp Business', 'CRM (HubSpot)', 'Marketing tools (Mailchimp/Klaviyo)', 'Apps iOS/Android']),
          integ('Empresarial', ['Todo lo de Avanzada', 'CDP enterprise (Segment/RudderStack)', 'CRM enterprise (Salesforce/Dynamics)', 'Marketing automation (Braze/Iterable)', 'BI con ML (predictive churn)', 'Multi-marca + coalición', 'Compliance habeas data']),
        ],
      },
    ),
  },

  /* 26. QA Automatizado IA ------------------------------------------------- */
  {
    slug: 'qa-automatizado-ia',
    demoSlug: 'chatbot',
    category: 'devTools',
    icon: 'CheckBadgeIcon',
    gradient: 'from-teal-700 to-emerald-900',
    plans: buildPlans(
      [6_500_000, 650_000, 28_000_000, 2_200_000, 100_000_000, 5_800_000],
      {
        limits: [
          lim(3, 0, 1, 5000, '5.000 test runs/mes', 5, '24-48h email'),
          lim(20, 0, 5, 100000, '100.000 test runs/mes', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Test runs ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [COST_HOSTING_S, COST_OPENAI_S, c('Browser CI (BrowserStack/LambdaTest)', '$50-200', 'Pruebas multi-browser')],
          [COST_HOSTING_M, c('OpenAI + Claude para generación de tests', '$300-1500', 'Tokens según volumen de pruebas'), c('Browser farm (BrowserStack/Sauce)', '$300-2000', 'Paralelismo + dispositivos reales'), COST_MONITOR_M],
          [COST_HOSTING_L, c('LLMs enterprise + reasoning', '$2000-10000', 'Generación y mantenimiento de suites'), c('Device farm enterprise', '$2000-10000', 'Apps móviles + IoT'), COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['GitHub Actions', 'Slack notify', 'Playwright runners']),
          integ('Avanzada', ['GitHub/GitLab/Bitbucket CI', 'Jira/TestRail', 'BrowserStack/Sauce', 'Selenium grid', 'Slack/Teams alerts', 'Code coverage reports']),
          integ('Empresarial', ['Todo lo de Avanzada', 'Azure DevOps + Jenkins', 'XRay + TestRail enterprise', 'Visual regression (Percy/Applitools)', 'API contract testing (Pact)', 'Performance (k6/Gatling)', 'DORA + flaky tests analytics']),
        ],
      },
    ),
  },

  /* 27. VPN Empresarial ---------------------------------------------------- */
  {
    slug: 'vpn-empresarial',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-blue-700 to-slate-900',
    plans: buildPlans(
      [6_500_000, 550_000, 22_000_000, 1_900_000, 80_000_000, 5_500_000],
      {
        limits: [
          lim(3, 0, 1, 25, '25 usuarios concurrentes', 5, '24-48h email'),
          lim(15, 0, 5, 500, '500 usuarios concurrentes', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Usuarios ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [c('Servidores VPN (DigitalOcean/Hetzner)', '$30-150', 'Hasta 3 regiones + bandwidth'), COST_MONITOR_M, c('IDs y certificados (Let\'s Encrypt + propios)', '$0-50', 'PKI y rotación de keys')],
          [c('Servidores multi-región (AWS/GCP)', '$300-1500', 'Hasta 10 regiones + alta disponibilidad'), c('SIEM básico (Wazuh/Elastic)', '$200-800', 'Logs + alerting'), COST_MONITOR_M],
          [c('Backbone enterprise (Cloudflare Magic WAN/Zscaler)', '$3000-15000', 'ZTNA + SD-WAN global'), c('SIEM enterprise (Splunk/Sentinel)', '$2000-10000', 'Retención larga + correlación'), c('Compliance (SOC2/ISO27001)', '$3000-10000', 'Auditoría continua + pentesting'), COST_MONITOR_L],
        ],
        integraciones: [
          integ('Básica', ['WireGuard/OpenVPN clients', 'LDAP/Email auth', 'Logs locales']),
          integ('Avanzada', ['SSO con Google/Microsoft', 'MFA (TOTP/U2F)', 'SIEM básico', 'MDM básico (Jamf/Intune)', 'Split tunneling', 'Policy as code']),
          integ('Empresarial', ['Todo lo de Avanzada', 'ZTNA enterprise (Zscaler/Cloudflare)', 'SIEM corporativo (Splunk)', 'EDR/XDR + DLP', 'Compliance SOC2 + ISO27001', 'Multi-tenant para clientes', 'SD-WAN multi-país']),
        ],
      },
    ),
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers de presentación                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Formatea un valor numérico como pesos colombianos sin decimales.
 */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatea un monto COP en la moneda elegida por el usuario (COP o USD).
 * Para USD aplica la conversión a través de `copToUsd`.
 */
export function formatMoney(amountCOP: number, currency: DisplayCurrency): string {
  if (currency === 'USD') return formatUSD(copToUsd(amountCOP));
  return formatCOP(amountCOP);
}

export interface CycleCalc {
  /** Total a pagar por el ciclo (con descuento aplicado). */
  totalCOP: number;
  /** Equivalente mensual una vez aplicado el descuento. */
  effectiveMonthlyCOP: number;
  /** Ahorro frente a pagar mes a mes durante el mismo periodo. */
  savingsCOP: number;
}

/**
 * Calcula el total facturado y el ahorro para un ciclo de pago dado.
 */
export function calcularCicloPago(monthlyCOP: number, cycle: BillingCycle): CycleCalc {
  const total = monthlyCOP * cycle.monthsBilled;
  const discounted = Math.round(total * (1 - cycle.discountPct));
  const effective = Math.round(discounted / cycle.monthsBilled);
  return {
    totalCOP: discounted,
    effectiveMonthlyCOP: effective,
    savingsCOP: total - discounted,
  };
}

/**
 * Convierte un slug `kebab-case` al nombre del namespace i18n del SERVICIO
 * (`service_<camelCase>`).
 */
export function slugToNamespace(slug: string): string {
  const camel = slug.replace(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
  return `service_${camel}`;
}

/**
 * Convierte un slug `kebab-case` al nombre del namespace i18n del PLAN SaaS
 * (`plan_<camelCase>`).
 */
export function slugToPlanNamespace(slug: string): string {
  const camel = slug.replace(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
  return `plan_${camel}`;
}

/* -------------------------------------------------------------------------- */
/* PLANES SaaS — software hospedado por KopTup con mensualidad recurrente     */
/* -------------------------------------------------------------------------- */

export type PlanTier = 'starter' | 'growth' | 'business';

export interface SaasPlan {
  tier: PlanTier;
  /** Setup mínimo (puede ser 0). NO confundir con SERVICIOS donde el setup es la inversión grande. */
  setupCOP: number;
  /** Mensualidad estándar (sin descuento por ciclo). Mínimo $400.000 COP. */
  monthlyCOP: number;
  /** Equivalente USD del setup (TRM 4.000, redondeado a múltiplo de 10). */
  setupUSD: number;
  /** Equivalente USD de la mensualidad. */
  monthlyUSD: number;
  /** SLA de soporte aplicable a este tier. */
  supportSla: SupportSlaId;
  /** Cantidad de items en `plans.<tier>.incluye[]` del i18n. */
  incluyeCount: number;
  limits?: ResourceLimits;
  costosAdicionales?: CostoAdicional[];
  integraciones?: IntegrationLevel;
}

export interface SaasOffering {
  slug: string;
  /** Slug bajo `/demo/<demoSlug>` (vacío si no aplica). */
  demoSlug: string;
  category: ServiceCategory;
  icon: string;
  gradient: string;
  plans: SaasPlan[];
}

const PLAN_INCLUYE_COUNTS: Record<PlanTier, number> = {
  starter: 5,
  growth: 7,
  business: 9,
};

/** Prices tuple para SaaS: [setupS, monthlyS, setupG, monthlyG, setupB, monthlyB]. */
type SaasPrices = [number, number, number, number, number, number];

interface SaasExtras {
  limits: [ResourceLimits, ResourceLimits, ResourceLimits];
  costosAdicionales: [CostoAdicional[], CostoAdicional[], CostoAdicional[]];
  integraciones: [IntegrationLevel, IntegrationLevel, IntegrationLevel];
}

function buildSaasPlans(prices: SaasPrices, extras: SaasExtras): SaasPlan[] {
  const [setupS, monthlyS, setupG, monthlyG, setupB, monthlyB] = prices;
  const mS = enforceMinMonthly(monthlyS);
  const mG = enforceMinMonthly(monthlyG);
  const mB = enforceMinMonthly(monthlyB);
  return [
    {
      tier: 'starter',
      setupCOP: setupS,
      monthlyCOP: mS,
      setupUSD: copToUsd(setupS),
      monthlyUSD: copToUsd(mS),
      supportSla: SUPPORT_SLA_BY_SAAS_TIER.starter,
      incluyeCount: PLAN_INCLUYE_COUNTS.starter,
      limits: extras.limits[0],
      costosAdicionales: extras.costosAdicionales[0],
      integraciones: extras.integraciones[0],
    },
    {
      tier: 'growth',
      setupCOP: setupG,
      monthlyCOP: mG,
      setupUSD: copToUsd(setupG),
      monthlyUSD: copToUsd(mG),
      supportSla: SUPPORT_SLA_BY_SAAS_TIER.growth,
      incluyeCount: PLAN_INCLUYE_COUNTS.growth,
      limits: extras.limits[1],
      costosAdicionales: extras.costosAdicionales[1],
      integraciones: extras.integraciones[1],
    },
    {
      tier: 'business',
      setupCOP: setupB,
      monthlyCOP: mB,
      setupUSD: copToUsd(setupB),
      monthlyUSD: copToUsd(mB),
      supportSla: SUPPORT_SLA_BY_SAAS_TIER.business,
      incluyeCount: PLAN_INCLUYE_COUNTS.business,
      limits: extras.limits[2],
      costosAdicionales: extras.costosAdicionales[2],
      integraciones: extras.integraciones[2],
    },
  ];
}

/* Costos comunes para planes SaaS (los paga el cliente del plan, no incluye uso interno de KopTup). */
const SAAS_NOTE_BUNDLED = c('Hosting + DB + monitoreo', 'Incluido', 'Cubierto por la mensualidad del plan', 'koptup');
const SAAS_OPENAI_S = c('OpenAI GPT-4o-mini', '$30-100', 'Pagás directamente a OpenAI según uso real');
const SAAS_OPENAI_M = c('OpenAI GPT-4o + Claude Sonnet', '$200-1000', 'Tokens según volumen real de tráfico');
const SAAS_OPENAI_L = c('LLM mix premium (OpenAI + Anthropic)', '$1500-10000', 'Uso productivo a gran escala');
const SAAS_TWILIO_S = c('Twilio WhatsApp/SMS', '$20-150', 'Solo si activás canales pagos');
const SAAS_TWILIO_M = c('Twilio WhatsApp + SMS', '$100-800', 'Canales en producción');
const SAAS_TWILIO_L = c('Twilio enterprise multi-canal', '$1000-5000', 'Voz + SMS + WhatsApp multi-país');
const SAAS_STRIPE_NOTE = c('Stripe / Wompi', '2.9% + $0.30/tx', 'Comisión por transacción procesada');
const SAAS_MAPBOX_S = c('Mapbox / Google Maps', '$20-150', 'Solo si tu uso requiere mapas');
const SAAS_DIAN = c('Proveedor DIAN', '$20-100', 'Costo por documento emitido (CO)');

/* -------------------------------------------------------------------------- */
/* Catálogo PLANES SaaS — el cliente NO recibe código, usa la plataforma      */
/* -------------------------------------------------------------------------- */

export const PLANS: SaasOffering[] = [
  /* 1. Chatbot RAG IA */
  {
    slug: 'chatbot-rag-ia',
    demoSlug: 'chatbot',
    category: 'aiPlatform',
    icon: 'ChatBubbleLeftRightIcon',
    gradient: 'from-primary-600 to-primary-800',
    plans: buildSaasPlans(
      [1_490_000, 690_000, 2_490_000, 1_890_000, 0, 5_490_000],
      {
        limits: [
          lim(2, 1000, 1, 1500, '1.500 conversaciones/mes', 2, '24-48h email'),
          lim(8, 20000, 1, 15000, '15.000 conversaciones/mes', 20, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Conversaciones ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_S],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_M, SAAS_TWILIO_S],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_L, SAAS_TWILIO_M],
        ],
        integraciones: [
          integ('Básica', ['Widget web', 'Email notificaciones', '1 fuente de conocimiento']),
          integ('Avanzada', ['WhatsApp Business', 'CRM (HubSpot)', 'Sitio web + iframe', '5 fuentes con reentrenamiento', 'Handoff humano']),
          integ('Empresarial', ['Multi-tenant', 'Modelos privados u on-prem', 'SSO SAML/OIDC', 'Compliance HIPAA/SOC2', 'SLA 99,9%']),
        ],
      },
    ),
  },

  /* 2. Ecommerce */
  {
    slug: 'ecommerce',
    demoSlug: 'ecommerce',
    category: 'commerce',
    icon: 'ShoppingCartIcon',
    gradient: 'from-green-600 to-emerald-800',
    plans: buildSaasPlans(
      [1_590_000, 890_000, 2_890_000, 2_490_000, 0, 6_490_000],
      {
        limits: [
          lim(2, 5000, 1, 500, '500 órdenes/mes', 5, '24-48h email'),
          lim(10, 50000, 1, 10000, '10.000 órdenes/mes', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Órdenes ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_STRIPE_NOTE],
          [SAAS_NOTE_BUNDLED, SAAS_STRIPE_NOTE, c('Email transaccional Pro', '$30-150', 'Solo si superás 40k emails/mes')],
          [SAAS_NOTE_BUNDLED, SAAS_STRIPE_NOTE, c('Anti-fraude (Stripe Radar)', '$100-1000', 'Por transacción de alto valor')],
        ],
        integraciones: [
          integ('Básica', ['Stripe/Wompi', 'Email', 'Servientrega manual']),
          integ('Avanzada', ['ERP (Siigo)', 'Marketplaces (ML)', 'POS', 'CRM marketing', 'Multi-pasarela']),
          integ('Empresarial', ['ERP enterprise', 'B2B + B2C en mismo store', 'Multi-país', 'PCI-DSS', 'SLA 99,9%']),
        ],
      },
    ),
  },

  /* 3. BI Dashboard */
  {
    slug: 'bi-dashboard',
    demoSlug: 'dashboard-ejecutivo',
    category: 'aiPlatform',
    icon: 'ChartBarIcon',
    gradient: 'from-purple-600 to-purple-800',
    plans: buildSaasPlans(
      [990_000, 590_000, 1_990_000, 1_490_000, 0, 4_290_000],
      {
        limits: [
          lim(3, 0, 1, 50000, '50k filas procesadas/mes', 5, '24-48h email'),
          lim(15, 0, 3, 1_000_000, '1M filas procesadas/mes', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Filas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED],
          [SAAS_NOTE_BUNDLED, c('Warehouse opcional (BigQuery)', '$50-500', 'Solo si necesitás OLAP')],
          [SAAS_NOTE_BUNDLED, c('Warehouse enterprise (Snowflake)', '$500-5000', 'Procesamiento de millones de filas')],
        ],
        integraciones: [
          integ('Básica', ['CSV/Google Sheets', 'Postgres directo']),
          integ('Avanzada', ['ERP (SAP B1/Siigo)', 'CRM (HubSpot)', 'GA4', 'Webhooks', 'Snowflake/BigQuery']),
          integ('Empresarial', ['SSO + row-level security', 'Multi-warehouse', 'CDC tiempo real', 'SOC2', 'White-label']),
        ],
      },
    ),
  },

  /* 4. Gestor documental */
  {
    slug: 'gestor-documental',
    demoSlug: 'gestor-documentos',
    category: 'data',
    icon: 'DocumentTextIcon',
    gradient: 'from-blue-600 to-blue-800',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_690_000],
      {
        limits: [
          lim(3, 50, 1, 2000, '2.000 documentos/mes', 10, '24-48h email'),
          lim(15, 500, 1, 50000, '50.000 documentos/mes', 100, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Documentos ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('OCR avanzado opcional', '$20-100', 'Solo si procesás imágenes/scans')],
          [SAAS_NOTE_BUNDLED, c('OCR + IDP', '$100-800', 'Pipeline para alto volumen')],
          [SAAS_NOTE_BUNDLED, c('OCR enterprise + DLP', '$1000-5000', 'Multi-idioma + classification')],
        ],
        integraciones: [
          integ('Básica', ['Upload', 'Email forward', 'Google Drive']),
          integ('Avanzada', ['SharePoint', 'OneDrive', 'Webhooks', 'Firmas electrónicas']),
          integ('Empresarial', ['ECM enterprise', 'BPMN workflows', 'Retention legal', 'eDiscovery']),
        ],
      },
    ),
  },

  /* 5. Sistema de reservas */
  {
    slug: 'sistema-reservas',
    demoSlug: 'sistema-reservas',
    category: 'productivity',
    icon: 'CalendarIcon',
    gradient: 'from-orange-600 to-orange-800',
    plans: buildSaasPlans(
      [790_000, 490_000, 1_490_000, 1_190_000, 0, 3_490_000],
      {
        limits: [
          lim(2, 200, 1, 300, '300 reservas/mes', 2, '24-48h email'),
          lim(10, 5000, 3, 5000, '5.000 reservas/mes', 25, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Reservas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_TWILIO_S],
          [SAAS_NOTE_BUNDLED, SAAS_TWILIO_M, SAAS_STRIPE_NOTE],
          [SAAS_NOTE_BUNDLED, SAAS_TWILIO_L, SAAS_STRIPE_NOTE],
        ],
        integraciones: [
          integ('Básica', ['Google Calendar 1 vía', 'Email']),
          integ('Avanzada', ['Outlook', 'WhatsApp', 'Zoom auto-link', 'CRM']),
          integ('Empresarial', ['Multi-sucursal', 'ERP/HRMS', 'SIS/EHR', 'API GraphQL']),
        ],
      },
    ),
  },

  /* 6. CMS Headless */
  {
    slug: 'cms-headless',
    demoSlug: 'gestor-contenido',
    category: 'engagement',
    icon: 'PencilSquareIcon',
    gradient: 'from-pink-600 to-pink-800',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_490_000],
      {
        limits: [
          lim(3, 0, 1, 50000, '50k vistas/mes', 5, '24-48h email'),
          lim(15, 0, 3, 1_000_000, '1M vistas/mes', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Vistas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED],
          [SAAS_NOTE_BUNDLED, c('CDN/image opt avanzado', '$50-300', 'Vercel Pro o Cloudflare Pro')],
          [SAAS_NOTE_BUNDLED, c('CDN enterprise + DAM', '$500-3000', 'Multi-región + assets premium')],
        ],
        integraciones: [
          integ('Básica', ['Webhook 1 frontend', 'Imágenes Cloudinary free']),
          integ('Avanzada', ['Multi-frontend', 'PIM/DAM', 'A/B testing', 'GraphQL federado']),
          integ('Empresarial', ['Multi-marca/idioma', 'Workflow editorial', 'Translation memory', 'SSO']),
        ],
      },
    ),
  },

  /* 7. Gestión de proyectos */
  {
    slug: 'gestion-proyectos',
    demoSlug: 'control-proyectos',
    category: 'productivity',
    icon: 'RectangleStackIcon',
    gradient: 'from-teal-600 to-teal-800',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_490_000],
      {
        limits: [
          lim(5, 0, 1, 20, '20 proyectos activos', 5, '24-48h email'),
          lim(30, 0, 3, 200, '200 proyectos activos', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Proyectos ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED],
          [SAAS_NOTE_BUNDLED, c('Conectores premium', '$0-200', 'Slack/Teams/Jira con webhooks intensivos')],
          [SAAS_NOTE_BUNDLED, c('Conectores enterprise', '$200-1500', 'Jira/Azure DevOps/SAP')],
        ],
        integraciones: [
          integ('Básica', ['Email', 'Slack', 'Calendar']),
          integ('Avanzada', ['Jira/Linear', 'GitHub/GitLab', 'Teams', 'Webhooks']),
          integ('Empresarial', ['Azure DevOps', 'PPM portfolio', 'BI + ML', 'SSO/SCIM']),
        ],
      },
    ),
  },

  /* 8. CRM IA */
  {
    slug: 'crm-ia',
    demoSlug: 'crm-ia',
    category: 'sales',
    icon: 'BriefcaseIcon',
    gradient: 'from-indigo-600 to-indigo-800',
    plans: buildSaasPlans(
      [1_490_000, 790_000, 2_490_000, 1_890_000, 0, 5_690_000],
      {
        limits: [
          lim(3, 5000, 1, 1000, '1.000 deals/mes y 5k contactos', 5, '24-48h email'),
          lim(15, 50000, 3, 20000, '20.000 deals/mes y 50k contactos', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Contactos y deals ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_S],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_M, SAAS_TWILIO_M],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_L, SAAS_TWILIO_L],
        ],
        integraciones: [
          integ('Básica', ['Gmail/Outlook 1 cuenta', 'WhatsApp 1 línea', 'CSV import']),
          integ('Avanzada', ['Gmail multi-cuenta', 'WhatsApp API', 'Calendly', 'Mailchimp', 'Twilio voice']),
          integ('Empresarial', ['Marketo/Eloqua', 'CPQ + facturación', 'Call center omnicanal', 'SSO/SCIM']),
        ],
      },
    ),
  },

  /* 9. ERP Modular */
  {
    slug: 'erp-modular',
    demoSlug: 'erp',
    category: 'finance',
    icon: 'BuildingOfficeIcon',
    gradient: 'from-amber-600 to-amber-800',
    plans: buildSaasPlans(
      [2_990_000, 1_890_000, 4_990_000, 4_290_000, 0, 11_490_000],
      {
        limits: [
          lim(5, 0, 1, 1000, '1.000 transacciones/mes', 20, '24-48h email'),
          lim(25, 0, 3, 30000, '30.000 transacciones/mes', 200, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Transacciones ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_DIAN],
          [SAAS_NOTE_BUNDLED, SAAS_DIAN, c('PSE/bancos', '$50-200', 'Conexiones para conciliación')],
          [SAAS_NOTE_BUNDLED, c('DIAN + bancos multi-país', '$300-2000', 'CO + MX + Perú'), c('Auditoría NIIF/SOX', '$1000-5000', 'Auditores externos certificados')],
        ],
        integraciones: [
          integ('Básica', ['DIAN', 'Wompi', 'Excel']),
          integ('Avanzada', ['Bancos vía PSE', 'EDI', 'WMS/POS', 'Multi-moneda']),
          integ('Empresarial', ['SAP/Oracle interop', 'Treasury', 'Consolidación NIIF', 'SOX']),
        ],
      },
    ),
  },

  /* 10. Helpdesk IA */
  {
    slug: 'helpdesk-ia',
    demoSlug: 'helpdesk-ia',
    category: 'support',
    icon: 'LifebuoyIcon',
    gradient: 'from-rose-600 to-rose-800',
    plans: buildSaasPlans(
      [990_000, 590_000, 1_990_000, 1_690_000, 0, 4_990_000],
      {
        limits: [
          lim(3, 2000, 1, 1000, '1.000 tickets/mes', 5, '24-48h email'),
          lim(15, 20000, 3, 15000, '15.000 tickets/mes', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Tickets ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_S],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_M, SAAS_TWILIO_M],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_L, SAAS_TWILIO_L],
        ],
        integraciones: [
          integ('Básica', ['Email a ticket', 'Widget web', 'Slack notify']),
          integ('Avanzada', ['WhatsApp/Messenger', 'Jira sync', 'CRM', 'Telefonía cloud']),
          integ('Empresarial', ['Omnicanal unificado', 'IVR + voice AI', 'WFM', 'BI con CSAT']),
        ],
      },
    ),
  },

  /* 11. LMS eLearning */
  {
    slug: 'lms-elearning',
    demoSlug: 'lms',
    category: 'education',
    icon: 'AcademicCapIcon',
    gradient: 'from-cyan-600 to-cyan-800',
    plans: buildSaasPlans(
      [1_190_000, 690_000, 2_190_000, 1_890_000, 0, 5_290_000],
      {
        limits: [
          lim(3, 200, 1, 500, '500 inscripciones/mes', 20, '24-48h email'),
          lim(15, 10000, 3, 20000, '20.000 inscripciones/mes', 200, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Inscripciones ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Video hosting (Mux/Vimeo)', '$30-200', 'Solo si subís cursos en video'), SAAS_STRIPE_NOTE],
          [SAAS_NOTE_BUNDLED, c('Video CDN Pro', '$200-1000', 'Streaming HLS adaptativo + DRM básico'), SAAS_STRIPE_NOTE, SAAS_OPENAI_M],
          [SAAS_NOTE_BUNDLED, c('Video enterprise + Live', '$1500-8000', 'Kaltura/Brightcove'), SAAS_OPENAI_L],
        ],
        integraciones: [
          integ('Básica', ['Stripe/Wompi', 'Zoom manual', 'Email']),
          integ('Avanzada', ['Zoom auto', 'SCORM/xAPI', 'HRMS', 'Webhooks progreso']),
          integ('Empresarial', ['SAP/Workday Learning', 'LTI 1.3', 'Proctoring AI', 'SSO/SCIM']),
        ],
      },
    ),
  },

  /* 12. Telemedicina */
  {
    slug: 'telemedicina',
    demoSlug: 'telemedicina',
    category: 'healthcare',
    icon: 'HeartIcon',
    gradient: 'from-red-600 to-rose-800',
    plans: buildSaasPlans(
      [1_990_000, 1_290_000, 3_490_000, 2_990_000, 0, 8_490_000],
      {
        limits: [
          lim(3, 200, 1, 300, '300 consultas/mes', 20, '24-48h email'),
          lim(15, 5000, 3, 5000, '5.000 consultas/mes', 200, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Consultas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Video WebRTC', '$30-200', 'Hasta 1.000 minutos incluidos')],
          [SAAS_NOTE_BUNDLED, c('Video Pro + grabación', '$200-1500', 'HD + transcripción + storage'), SAAS_OPENAI_M, SAAS_TWILIO_M],
          [SAAS_NOTE_BUNDLED, c('Video enterprise + DR', '$1500-8000', 'Multi-región + alta calidad'), SAAS_OPENAI_L, c('Compliance HIPAA/HABEAS', '$1000-5000', 'BAA + auditoría continua')],
        ],
        integraciones: [
          integ('Básica', ['Email', 'Stripe/Wompi']),
          integ('Avanzada', ['EHR clínicas', 'Lab HL7', 'WhatsApp', 'Wearables']),
          integ('Empresarial', ['HL7 FHIR', 'PACS DICOM', 'Epic/Cerner', 'EPS/IPS', 'HIPAA + HABEAS']),
        ],
      },
    ),
  },

  /* 13. Facturación electrónica */
  {
    slug: 'facturacion-electronica',
    demoSlug: 'facturacion-electronica',
    category: 'finance',
    icon: 'DocumentCheckIcon',
    gradient: 'from-emerald-600 to-emerald-800',
    plans: buildSaasPlans(
      [790_000, 490_000, 1_490_000, 1_190_000, 0, 3_490_000],
      {
        limits: [
          lim(2, 0, 1, 100, '100 facturas/mes', 2, '24-48h email'),
          lim(10, 0, 3, 5000, '5.000 facturas/mes', 25, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Facturas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_DIAN],
          [SAAS_NOTE_BUNDLED, c('DIAN enterprise', '$100-500', 'Alto volumen + nómina electrónica')],
          [SAAS_NOTE_BUNDLED, c('DIAN multi-país', '$500-3000', 'CO + MX + Perú + radian')],
        ],
        integraciones: [
          integ('Básica', ['DIAN', 'Email', 'CSV']),
          integ('Avanzada', ['ERP (Siigo/SAP B1)', 'Bancos', 'POS', 'API REST']),
          integ('Empresarial', ['SAP S/4HANA', 'Multi-país', 'RADIAN + nómina', 'SSO/SOX']),
        ],
      },
    ),
  },

  /* 14. WMS Logística */
  {
    slug: 'wms-logistica',
    demoSlug: 'wms-logistica',
    category: 'operations',
    icon: 'TruckIcon',
    gradient: 'from-stone-600 to-stone-800',
    plans: buildSaasPlans(
      [1_990_000, 1_190_000, 3_490_000, 2_690_000, 0, 7_490_000],
      {
        limits: [
          lim(3, 0, 1, 1000, '1.000 órdenes/mes en 1 bodega', 5, '24-48h email'),
          lim(15, 0, 3, 30000, '30.000 órdenes/mes en 3 bodegas', 50, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Órdenes y bodegas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Hardware scanner (compra una vez)', '$100-400', 'Scanner USB o Bluetooth')],
          [SAAS_NOTE_BUNDLED, c('Transportistas APIs', '$100-500', 'Servientrega/TCC en producción'), SAAS_MAPBOX_S],
          [SAAS_NOTE_BUNDLED, c('Transportistas multi-país', '$1000-5000', 'EDI con carriers enterprise'), c('IoT cadena de frío', '$300-2000', 'Sensores + plataforma')],
        ],
        integraciones: [
          integ('Básica', ['Scanner USB', 'Transportista manual', 'CSV']),
          integ('Avanzada', ['ERP', 'Marketplaces', 'TMS', 'Carriers API', 'POS']),
          integ('Empresarial', ['SAP EWM', 'Multi-país', 'IoT', 'EDI', 'Yard management']),
        ],
      },
    ),
  },

  /* 15. POS Retail */
  {
    slug: 'pos-retail',
    demoSlug: 'pos',
    category: 'commerce',
    icon: 'ComputerDesktopIcon',
    gradient: 'from-fuchsia-600 to-fuchsia-800',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_290_000],
      {
        limits: [
          lim(2, 0, 1, 1000, '1.000 ventas/mes en 1 sucursal', 2, '24-48h email'),
          lim(10, 0, 5, 30000, '30.000 ventas/mes en hasta 5 sucursales', 25, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Sucursales y ventas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_DIAN, c('Hardware POS', '$200-600 una vez', 'Impresora + scanner + caja')],
          [SAAS_NOTE_BUNDLED, c('DIAN Pro', '$100-500', 'Alto volumen'), c('Datafono', 'Por contrato', 'Comisiones del adquirente')],
          [SAAS_NOTE_BUNDLED, c('DIAN multi-país', '$500-3000', 'CO + MX + Perú')],
        ],
        integraciones: [
          integ('Básica', ['DIAN', 'Datafono manual']),
          integ('Avanzada', ['ERP', 'Ecommerce sync', 'Loyalty', 'WMS']),
          integ('Empresarial', ['SAP Retail', 'Self-checkout', 'EDI proveedores', 'Loss prevention IA']),
        ],
      },
    ),
  },

  /* 16. HRMS */
  {
    slug: 'hrms',
    demoSlug: 'hrms',
    category: 'sales',
    icon: 'UserGroupIcon',
    gradient: 'from-violet-600 to-violet-800',
    plans: buildSaasPlans(
      [1_490_000, 890_000, 2_490_000, 2_290_000, 0, 6_490_000],
      {
        limits: [
          lim(2, 25, 1, 25, '25 empleados', 5, '24-48h email'),
          lim(15, 1000, 3, 1000, '1.000 empleados', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Empleados ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('PILA/Aportes', '$20-100', 'Pago de aportes mensuales')],
          [SAAS_NOTE_BUNDLED, c('PILA + nómina DIAN', '$100-500', 'Multi-empresa + radian')],
          [SAAS_NOTE_BUNDLED, c('Compliance multi-país', '$500-3000', 'CO + MX + Perú')],
        ],
        integraciones: [
          integ('Básica', ['DIAN nómina', 'PILA', 'Email']),
          integ('Avanzada', ['ATS', 'LMS', 'Bancos', 'Slack/Teams']),
          integ('Empresarial', ['SuccessFactors/Workday', 'Talent+Comp', 'BI HR analytics', 'SSO/SCIM']),
        ],
      },
    ),
  },

  /* 17. Automatización Workflows */
  {
    slug: 'automatizacion-workflows',
    demoSlug: 'automatizacion',
    category: 'aiPlatform',
    icon: 'BoltIcon',
    gradient: 'from-yellow-600 to-orange-700',
    plans: buildSaasPlans(
      [1_190_000, 690_000, 2_190_000, 1_890_000, 0, 5_290_000],
      {
        limits: [
          lim(2, 0, 1, 10000, '10.000 ejecuciones/mes', 2, '24-48h email'),
          lim(15, 0, 3, 250000, '250.000 ejecuciones/mes', 25, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Ejecuciones ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_S],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_M, c('Conectores premium', '$50-300', 'Apps verticales con OAuth')],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_L, c('Workers/cola dedicada', '$500-3000', 'Temporal cluster')],
        ],
        integraciones: [
          integ('Básica', ['HTTP/REST', 'Email', 'Sheets', 'Slack']),
          integ('Avanzada', ['CRM', 'ERP', 'DBs', 'Cloud storage', 'WhatsApp']),
          integ('Empresarial', ['MuleSoft/Boomi', 'SAP S/4HANA', 'EDI', 'Kafka', 'Temporal']),
        ],
      },
    ),
  },

  /* 18. SaaS Multi-tenant */
  {
    slug: 'saas-multi-tenant',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'Squares2X2Icon',
    gradient: 'from-slate-600 to-slate-800',
    plans: buildSaasPlans(
      [1_490_000, 990_000, 2_490_000, 2_490_000, 0, 7_490_000],
      {
        limits: [
          lim(3, 500, 3, 10000, '10k requests/mes y 3 tenants', 5, '24-48h email'),
          lim(15, 50000, 25, 1_000_000, '1M requests/mes y 25 tenants', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Tenants y requests ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_STRIPE_NOTE],
          [SAAS_NOTE_BUNDLED, SAAS_STRIPE_NOTE, c('Auth premium (Clerk/Auth0)', '$100-800', 'MFA + audit logs')],
          [SAAS_NOTE_BUNDLED, SAAS_STRIPE_NOTE, c('SSO enterprise + compliance', '$500-3000', 'SAML + SCIM + SOC2')],
        ],
        integraciones: [
          integ('Básica', ['Stripe billing', 'Email', 'Auth básico']),
          integ('Avanzada', ['Stripe metered', 'OAuth providers', 'Custom domains', 'Webhooks']),
          integ('Empresarial', ['SSO SAML/OIDC', 'SCIM', 'Data residency', 'SLA dedicated']),
        ],
      },
    ),
  },

  /* 19. Voice AI Callcenter */
  {
    slug: 'voice-ai-callcenter',
    demoSlug: 'voice-ai',
    category: 'voice',
    icon: 'MicrophoneIcon',
    gradient: 'from-sky-600 to-sky-800',
    plans: buildSaasPlans(
      [1_990_000, 1_690_000, 3_490_000, 3_690_000, 0, 9_990_000],
      {
        limits: [
          lim(2, 0, 1, 1000, '1.000 minutos/mes', 2, '24-48h email'),
          lim(10, 0, 3, 30000, '30.000 minutos/mes', 25, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Minutos ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Twilio Voice + TTS', '$300-1000', 'Por minuto, paga el cliente directo'), SAAS_OPENAI_M],
          [SAAS_NOTE_BUNDLED, c('Twilio + ElevenLabs Pro', '$1000-4000', 'Voces premium + multi-país'), SAAS_OPENAI_M],
          [SAAS_NOTE_BUNDLED, c('Telefonía enterprise', '$3000-15000', 'Multi-país + números dedicados'), SAAS_OPENAI_L],
        ],
        integraciones: [
          integ('Básica', ['1 línea', 'Email transcripts']),
          integ('Avanzada', ['Multi-línea + IVR', 'CRM', 'Helpdesk', 'WhatsApp voice']),
          integ('Empresarial', ['PBX/SIP', 'WFM + QM', 'Compliance PCI', 'Voice cloning']),
        ],
      },
    ),
  },

  /* 20. Firma electrónica */
  {
    slug: 'firma-electronica',
    demoSlug: 'firma-electronica',
    category: 'security',
    icon: 'PencilIcon',
    gradient: 'from-lime-600 to-lime-800',
    plans: buildSaasPlans(
      [790_000, 400_000, 1_290_000, 890_000, 0, 2_990_000],
      {
        limits: [
          lim(2, 50, 1, 100, '100 firmas/mes', 2, '24-48h email'),
          lim(10, 2000, 3, 3000, '3.000 firmas/mes', 25, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Firmas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Certificado digital', '$20-80', 'Por firmante con certificado')],
          [SAAS_NOTE_BUNDLED, c('Estampa cronológica + KYC', '$100-500', 'LTV + verificación biométrica')],
          [SAAS_NOTE_BUNDLED, c('PKI + HSM enterprise', '$1000-5000', 'Hardware security module')],
        ],
        integraciones: [
          integ('Básica', ['Email', 'Upload PDF']),
          integ('Avanzada', ['CRM', 'ERP/contratos', 'KYC', 'WhatsApp', 'API REST']),
          integ('Empresarial', ['DocuSign migration', 'PKI corporativa', 'eIDAS', 'SAP adapter']),
        ],
      },
    ),
  },

  /* 21. Scraping */
  {
    slug: 'scraping-extraccion',
    demoSlug: 'scraping',
    category: 'data',
    icon: 'GlobeAltIcon',
    gradient: 'from-zinc-600 to-zinc-800',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_690_000],
      {
        limits: [
          lim(2, 0, 1, 20000, '20.000 páginas raspadas/mes', 2, '24-48h email'),
          lim(10, 0, 3, 500000, '500k páginas raspadas/mes', 25, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Páginas ilimitadas', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Proxies básicos', '$30-150', 'Pool rotatorio por GB')],
          [SAAS_NOTE_BUNDLED, c('Proxies residenciales/mobile', '$300-1500', 'Alto volumen + geo'), c('Headless browsers managed', '$100-800', 'Browserless/ScrapingBee')],
          [SAAS_NOTE_BUNDLED, c('Proxies enterprise + browser farm', '$2000-10000', 'Multi-país + cluster k8s')],
        ],
        integraciones: [
          integ('Básica', ['CSV/JSON', 'Webhook']),
          integ('Avanzada', ['S3/GCS', 'Postgres/Mongo direct', 'Slack alerts', 'API REST']),
          integ('Empresarial', ['Snowflake/BigQuery', 'CDC + reverse ETL', 'Kafka', 'Multi-región']),
        ],
      },
    ),
  },

  /* 22. Code review IA */
  {
    slug: 'code-review-ia',
    demoSlug: 'code-review-ia',
    category: 'devTools',
    icon: 'CommandLineIcon',
    gradient: 'from-neutral-700 to-neutral-900',
    plans: buildSaasPlans(
      [790_000, 400_000, 1_490_000, 890_000, 0, 2_890_000],
      {
        limits: [
          lim(3, 0, 1, 200, '200 PRs analizados/mes', 0, '24-48h email'),
          lim(25, 0, 3, 3000, '3.000 PRs analizados/mes', 0, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'PRs ilimitados', 0, 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_S],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_M],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_L, c('SAST/SCA enterprise', '$300-2000', 'Snyk/Sonar licencias')],
        ],
        integraciones: [
          integ('Básica', ['GitHub 1 repo', 'PR comments', 'Slack']),
          integ('Avanzada', ['GitHub/GitLab/Bitbucket', 'Jira', 'Semgrep', 'IDE plugin']),
          integ('Empresarial', ['Azure DevOps', 'Sonar/Snyk', 'Policy as code', 'DORA metrics', 'SSO']),
        ],
      },
    ),
  },

  /* 23. Moderación contenido */
  {
    slug: 'moderacion-contenido',
    demoSlug: 'moderacion-contenido',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-red-700 to-red-900',
    plans: buildSaasPlans(
      [1_190_000, 690_000, 2_190_000, 1_690_000, 0, 4_890_000],
      {
        limits: [
          lim(2, 0, 1, 20000, '20.000 items moderados/mes', 2, '24-48h email'),
          lim(10, 0, 3, 1_000_000, '1M items moderados/mes', 25, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Items ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Moderation API básico', '$50-250', 'OpenAI moderation + GPT-4o-mini')],
          [SAAS_NOTE_BUNDLED, c('Hive + Rekognition', '$300-1500', 'Multi-categoría imágenes + video')],
          [SAAS_NOTE_BUNDLED, c('Moderation enterprise', '$1500-10000', 'Multi-modal + custom models')],
        ],
        integraciones: [
          integ('Básica', ['API REST', 'Dashboard']),
          integ('Avanzada', ['Webhooks bidireccionales', 'Queue revisores', 'CMS', 'Discord alerts']),
          integ('Empresarial', ['SIEM', 'Custom ML models', 'Multi-modal', 'Compliance DSA']),
        ],
      },
    ),
  },

  /* 24. App delivery */
  {
    slug: 'app-delivery',
    demoSlug: 'delivery',
    category: 'operations',
    icon: 'MapIcon',
    gradient: 'from-orange-500 to-red-600',
    plans: buildSaasPlans(
      [1_990_000, 1_190_000, 3_490_000, 2_990_000, 0, 8_690_000],
      {
        limits: [
          lim(2, 500, 1, 500, '500 pedidos/mes en 1 ciudad', 5, '24-48h email'),
          lim(15, 25000, 5, 20000, '20.000 pedidos/mes en hasta 5 ciudades', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Pedidos y ciudades ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_MAPBOX_S, SAAS_STRIPE_NOTE],
          [SAAS_NOTE_BUNDLED, c('Mapbox/Maps Pro', '$300-1500', 'Routes + ETA alto volumen'), SAAS_STRIPE_NOTE, SAAS_TWILIO_M],
          [SAAS_NOTE_BUNDLED, c('Maps Platform enterprise', '$2000-10000', 'Routes + Places enterprise'), c('Telefonía enterprise', '$1000-5000', 'IVR + masking + multi-país')],
        ],
        integraciones: [
          integ('Básica', ['Stripe/Wompi', 'Maps básico', 'Email']),
          integ('Avanzada', ['Multi-pasarela', 'TMS rutas', 'WhatsApp', 'POS restaurantes']),
          integ('Empresarial', ['OMS/ERP', 'ML routing', 'Compliance riders', 'Multi-tenant franquicias']),
        ],
      },
    ),
  },

  /* 25. Loyalty */
  {
    slug: 'loyalty-fidelizacion',
    demoSlug: 'loyalty',
    category: 'engagement',
    icon: 'StarIcon',
    gradient: 'from-yellow-500 to-amber-600',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_690_000],
      {
        limits: [
          lim(2, 2000, 1, 5000, '5.000 miembros + 10k transacciones/mes', 5, '24-48h email'),
          lim(15, 100000, 5, 200000, '200k miembros + 1M transacciones/mes', 50, '4h business'),
          lim('unlimited', 'unlimited', 'unlimited', 'unlimited', 'Miembros y transacciones ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('SMS/Push básico', '$20-100', 'Notificaciones de puntos')],
          [SAAS_NOTE_BUNDLED, c('SMS + WhatsApp masivo', '$300-1500', 'Campañas segmentadas'), SAAS_OPENAI_M],
          [SAAS_NOTE_BUNDLED, c('CDP + email enterprise', '$1000-8000', 'Iterable/Braze')],
        ],
        integraciones: [
          integ('Básica', ['POS retail', 'Email', 'CSV']),
          integ('Avanzada', ['POS multi-sucursal', 'Ecommerce', 'WhatsApp', 'CRM', 'Apps móviles']),
          integ('Empresarial', ['CDP', 'Salesforce/Dynamics', 'Braze/Iterable', 'BI ML', 'Multi-marca']),
        ],
      },
    ),
  },

  /* 26. QA IA */
  {
    slug: 'qa-automatizado-ia',
    demoSlug: 'chatbot',
    category: 'devTools',
    icon: 'CheckBadgeIcon',
    gradient: 'from-teal-700 to-emerald-900',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_290_000],
      {
        limits: [
          lim(2, 0, 1, 1000, '1.000 test runs/mes', 2, '24-48h email'),
          lim(10, 0, 3, 30000, '30.000 test runs/mes', 25, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Test runs ilimitados', 'unlimited', 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_S, c('Browser CI básico', '$30-150', 'Multi-browser limitado')],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_M, c('Browser farm Pro', '$200-1000', 'Paralelismo + dispositivos reales')],
          [SAAS_NOTE_BUNDLED, SAAS_OPENAI_L, c('Device farm enterprise', '$1000-5000', 'Móviles + IoT')],
        ],
        integraciones: [
          integ('Básica', ['GitHub Actions', 'Slack']),
          integ('Avanzada', ['Multi-CI', 'Jira/TestRail', 'BrowserStack', 'Selenium grid']),
          integ('Empresarial', ['Azure DevOps', 'XRay enterprise', 'Visual regression', 'k6/Gatling']),
        ],
      },
    ),
  },

  /* 27. VPN Empresarial */
  {
    slug: 'vpn-empresarial',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-blue-700 to-slate-900',
    plans: buildSaasPlans(
      [890_000, 490_000, 1_690_000, 1_190_000, 0, 3_290_000],
      {
        limits: [
          lim(2, 0, 1, 10, '10 usuarios concurrentes', 0, '24-48h email'),
          lim(10, 0, 3, 100, '100 usuarios concurrentes', 0, '4h business'),
          lim('unlimited', 0, 'unlimited', 'unlimited', 'Usuarios ilimitados', 0, 'priority-1h'),
        ],
        costosAdicionales: [
          [SAAS_NOTE_BUNDLED, c('Bandwidth extra (opcional)', '$0-50', 'Solo si superás 100GB/mes')],
          [SAAS_NOTE_BUNDLED, c('SIEM básico', '$100-500', 'Logs + alerting')],
          [SAAS_NOTE_BUNDLED, c('ZTNA enterprise + SIEM corp', '$2000-10000', 'Zscaler/Splunk')],
        ],
        integraciones: [
          integ('Básica', ['WireGuard/OpenVPN', 'LDAP/Email']),
          integ('Avanzada', ['SSO Google/Microsoft', 'MFA', 'SIEM básico', 'MDM']),
          integ('Empresarial', ['ZTNA enterprise', 'SIEM corp', 'EDR/XDR', 'SOC2/ISO27001']),
        ],
      },
    ),
  },
];
