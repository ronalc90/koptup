/**
 * Catálogo central de servicios KopTup.
 *
 * Define los 27 servicios ofrecidos, sus 3 tiers (Inicial / Profesional /
 * Enterprise) con precios en pesos colombianos, ciclos de pago y metadata
 * de presentación (íconos, gradientes, slug de demo, categoría).
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

export interface ServicePlan {
  tier: ServiceTier;
  setupCOP: number;
  monthlyCOP: number;
  duracionSemanas: { min: number; max: number };
  /** Cantidad de bullets esperados en `plans.<tier>.setupIncluye[]`. */
  setupIncluyeCount: number;
  /** Cantidad de bullets esperados en `plans.<tier>.mantenimientoIncluye[]`. */
  mantenimientoIncluyeCount: number;
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

function buildPlans(
  prices: [number, number, number, number, number, number],
): ServicePlan[] {
  const [setupI, monthlyI, setupP, monthlyP, setupE, monthlyE] = prices;
  return [
    {
      tier: 'inicial',
      setupCOP: setupI,
      monthlyCOP: monthlyI,
      duracionSemanas: DURACION_SEMANAS.inicial,
      setupIncluyeCount: INCLUYE_COUNTS.inicial.setup,
      mantenimientoIncluyeCount: INCLUYE_COUNTS.inicial.mant,
    },
    {
      tier: 'profesional',
      setupCOP: setupP,
      monthlyCOP: monthlyP,
      duracionSemanas: DURACION_SEMANAS.profesional,
      setupIncluyeCount: INCLUYE_COUNTS.profesional.setup,
      mantenimientoIncluyeCount: INCLUYE_COUNTS.profesional.mant,
    },
    {
      tier: 'enterprise',
      setupCOP: setupE,
      monthlyCOP: monthlyE,
      duracionSemanas: DURACION_SEMANAS.enterprise,
      setupIncluyeCount: INCLUYE_COUNTS.enterprise.setup,
      mantenimientoIncluyeCount: INCLUYE_COUNTS.enterprise.mant,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Catálogo                                                                    */
/* -------------------------------------------------------------------------- */

export const SERVICES: ServiceOffering[] = [
  {
    slug: 'chatbot-rag-ia',
    demoSlug: 'chatbot',
    category: 'aiPlatform',
    icon: 'ChatBubbleLeftRightIcon',
    gradient: 'from-primary-600 to-primary-800',
    plans: buildPlans([2_900_000, 450_000, 12_500_000, 1_500_000, 45_000_000, 5_500_000]),
  },
  {
    slug: 'ecommerce',
    demoSlug: 'ecommerce',
    category: 'commerce',
    icon: 'ShoppingCartIcon',
    gradient: 'from-green-600 to-emerald-800',
    plans: buildPlans([4_500_000, 550_000, 19_500_000, 1_800_000, 65_000_000, 4_500_000]),
  },
  {
    slug: 'bi-dashboard',
    demoSlug: 'dashboard-ejecutivo',
    category: 'aiPlatform',
    icon: 'ChartBarIcon',
    gradient: 'from-purple-600 to-purple-800',
    plans: buildPlans([3_500_000, 400_000, 15_500_000, 1_400_000, 52_000_000, 4_000_000]),
  },
  {
    slug: 'gestor-documental',
    demoSlug: 'gestor-documentos',
    category: 'data',
    icon: 'DocumentTextIcon',
    gradient: 'from-blue-600 to-blue-800',
    plans: buildPlans([2_700_000, 350_000, 11_000_000, 1_200_000, 42_000_000, 3_500_000]),
  },
  {
    slug: 'sistema-reservas',
    demoSlug: 'sistema-reservas',
    category: 'productivity',
    icon: 'CalendarIcon',
    gradient: 'from-orange-600 to-orange-800',
    plans: buildPlans([2_200_000, 290_000, 8_500_000, 900_000, 32_000_000, 2_800_000]),
  },
  {
    slug: 'cms-headless',
    demoSlug: 'gestor-contenido',
    category: 'engagement',
    icon: 'PencilSquareIcon',
    gradient: 'from-pink-600 to-pink-800',
    plans: buildPlans([2_800_000, 320_000, 10_000_000, 950_000, 33_000_000, 2_900_000]),
  },
  {
    slug: 'gestion-proyectos',
    demoSlug: 'control-proyectos',
    category: 'productivity',
    icon: 'RectangleStackIcon',
    gradient: 'from-teal-600 to-teal-800',
    plans: buildPlans([2_500_000, 280_000, 9_000_000, 900_000, 29_000_000, 2_500_000]),
  },
  {
    slug: 'crm-ia',
    demoSlug: 'crm-ia',
    category: 'sales',
    icon: 'BriefcaseIcon',
    gradient: 'from-indigo-600 to-indigo-800',
    plans: buildPlans([3_800_000, 480_000, 16_500_000, 1_700_000, 56_000_000, 4_200_000]),
  },
  {
    slug: 'erp-modular',
    demoSlug: 'erp',
    category: 'finance',
    icon: 'BuildingOfficeIcon',
    gradient: 'from-amber-600 to-amber-800',
    plans: buildPlans([8_500_000, 1_200_000, 38_000_000, 3_200_000, 120_000_000, 9_500_000]),
  },
  {
    slug: 'helpdesk-ia',
    demoSlug: 'helpdesk-ia',
    category: 'support',
    icon: 'LifebuoyIcon',
    gradient: 'from-rose-600 to-rose-800',
    plans: buildPlans([2_900_000, 380_000, 13_000_000, 1_350_000, 47_000_000, 4_000_000]),
  },
  {
    slug: 'lms-elearning',
    demoSlug: 'lms',
    category: 'education',
    icon: 'AcademicCapIcon',
    gradient: 'from-cyan-600 to-cyan-800',
    plans: buildPlans([3_300_000, 420_000, 14_500_000, 1_500_000, 50_000_000, 4_200_000]),
  },
  {
    slug: 'telemedicina',
    demoSlug: 'telemedicina',
    category: 'healthcare',
    icon: 'HeartIcon',
    gradient: 'from-red-600 to-rose-800',
    plans: buildPlans([5_900_000, 850_000, 26_000_000, 2_400_000, 90_000_000, 7_500_000]),
  },
  {
    slug: 'facturacion-electronica',
    demoSlug: 'facturacion-electronica',
    category: 'finance',
    icon: 'DocumentCheckIcon',
    gradient: 'from-emerald-600 to-emerald-800',
    plans: buildPlans([2_400_000, 320_000, 9_500_000, 1_100_000, 35_000_000, 3_200_000]),
  },
  {
    slug: 'wms-logistica',
    demoSlug: 'wms-logistica',
    category: 'operations',
    icon: 'TruckIcon',
    gradient: 'from-stone-600 to-stone-800',
    plans: buildPlans([5_200_000, 680_000, 22_000_000, 2_100_000, 76_000_000, 6_000_000]),
  },
  {
    slug: 'pos-retail',
    demoSlug: 'pos',
    category: 'commerce',
    icon: 'ComputerDesktopIcon',
    gradient: 'from-fuchsia-600 to-fuchsia-800',
    plans: buildPlans([2_600_000, 250_000, 10_500_000, 950_000, 38_000_000, 3_500_000]),
  },
  {
    slug: 'hrms',
    demoSlug: 'hrms',
    category: 'sales',
    icon: 'UserGroupIcon',
    gradient: 'from-violet-600 to-violet-800',
    plans: buildPlans([4_700_000, 620_000, 19_500_000, 1_950_000, 66_000_000, 5_500_000]),
  },
  {
    slug: 'automatizacion-workflows',
    demoSlug: 'automatizacion',
    category: 'aiPlatform',
    icon: 'BoltIcon',
    gradient: 'from-yellow-600 to-orange-700',
    plans: buildPlans([3_100_000, 380_000, 13_500_000, 1_350_000, 48_000_000, 3_800_000]),
  },
  {
    slug: 'saas-multi-tenant',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'Squares2X2Icon',
    gradient: 'from-slate-600 to-slate-800',
    plans: buildPlans([6_500_000, 750_000, 29_000_000, 2_500_000, 100_000_000, 7_000_000]),
  },
  {
    slug: 'voice-ai-callcenter',
    demoSlug: 'voice-ai',
    category: 'voice',
    icon: 'MicrophoneIcon',
    gradient: 'from-sky-600 to-sky-800',
    plans: buildPlans([5_000_000, 1_100_000, 22_000_000, 3_200_000, 80_000_000, 8_500_000]),
  },
  {
    slug: 'firma-electronica',
    demoSlug: 'firma-electronica',
    category: 'security',
    icon: 'PencilIcon',
    gradient: 'from-lime-600 to-lime-800',
    plans: buildPlans([1_900_000, 280_000, 7_500_000, 850_000, 26_000_000, 2_400_000]),
  },
  {
    slug: 'scraping-extraccion',
    demoSlug: 'scraping',
    category: 'data',
    icon: 'GlobeAltIcon',
    gradient: 'from-zinc-600 to-zinc-800',
    plans: buildPlans([2_400_000, 320_000, 10_000_000, 1_050_000, 36_000_000, 3_000_000]),
  },
  {
    slug: 'code-review-ia',
    demoSlug: 'code-review-ia',
    category: 'devTools',
    icon: 'CommandLineIcon',
    gradient: 'from-neutral-700 to-neutral-900',
    plans: buildPlans([2_200_000, 290_000, 9_000_000, 950_000, 31_000_000, 2_700_000]),
  },
  {
    slug: 'moderacion-contenido',
    demoSlug: 'moderacion-contenido',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-red-700 to-red-900',
    plans: buildPlans([3_100_000, 480_000, 13_000_000, 1_450_000, 47_000_000, 4_100_000]),
  },
  {
    slug: 'app-delivery',
    demoSlug: 'delivery',
    category: 'operations',
    icon: 'MapIcon',
    gradient: 'from-orange-500 to-red-600',
    plans: buildPlans([6_500_000, 850_000, 29_000_000, 2_600_000, 100_000_000, 7_500_000]),
  },
  {
    slug: 'loyalty-fidelizacion',
    demoSlug: 'loyalty',
    category: 'engagement',
    icon: 'StarIcon',
    gradient: 'from-yellow-500 to-amber-600',
    plans: buildPlans([2_900_000, 380_000, 12_500_000, 1_300_000, 45_000_000, 3_800_000]),
  },
  {
    slug: 'qa-automatizado-ia',
    demoSlug: 'chatbot',
    category: 'devTools',
    icon: 'CheckBadgeIcon',
    gradient: 'from-teal-700 to-emerald-900',
    plans: buildPlans([2_400_000, 320_000, 9_500_000, 1_100_000, 33_000_000, 2_800_000]),
  },
  {
    slug: 'vpn-empresarial',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-blue-700 to-slate-900',
    plans: buildPlans([3_500_000, 280_000, 11_500_000, 950_000, 38_000_000, 2_800_000]),
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
 * Convierte un slug `kebab-case` al nombre del namespace i18n
 * (`service_<camelCase>`).
 */
export function slugToNamespace(slug: string): string {
  const camel = slug.replace(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
  return `service_${camel}`;
}
