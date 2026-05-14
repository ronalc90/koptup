/**
 * Catálogo unificado de OFFERINGS de KopTup.
 *
 * Un único array `OFFERINGS` con 27 productos. Cada producto tiene 4 tiers
 * (básico / profesional / avanzado / enterprise) y, dentro de cada tier, dos
 * modalidades de contratación:
 *
 *   - `compra`: el cliente compra el software (setup one-time + mantenimiento
 *     opcional). El código fuente queda en su poder.
 *   - `saas`: suscripción mensual hospedada por KopTup (setup mínimo + cuota
 *     mensual). Cancelás cuando quieras.
 *
 * Las cadenas visibles (nombres, descripciones, bullets) viven en
 * `messages/offerings/<slug>.{es,en}.json` para soportar i18n.
 *
 * Los aliases `SERVICES` y `PLANS` apuntan al mismo array — se mantienen para
 * no romper imports legacy. La fuente de verdad es `OFFERINGS`.
 */

/* -------------------------------------------------------------------------- */
/* Tipos                                                                       */
/* -------------------------------------------------------------------------- */

export type OfferingCategory =
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

/** Alias retro-compatible. */
export type ServiceCategory = OfferingCategory;

export type TierKey = 'basico' | 'profesional' | 'avanzado' | 'enterprise';

export type UnlimitedOrNumber = number | 'unlimited';

export interface TierLimits {
  adminUsers: UnlimitedOrNumber;
  endUsers: UnlimitedOrNumber;
  accounts: UnlimitedOrNumber;
  monthlyVolume: UnlimitedOrNumber;
  /** Etiqueta human-readable (queda en la data, no en i18n por ahora). */
  volumeLabel: string;
  storageGB: UnlimitedOrNumber;
}

export type SupportLevel =
  | 'email-24h'
  | 'email-whatsapp-4h'
  | 'email-whatsapp-slack-2h'
  | 'tickets-jira-zendesk-1h';

export type IntegrationLevel = 'basicas' | 'medias' | 'avanzadas' | 'empresariales';

export interface CostoClienteUSD {
  min: number;
  max: number;
  /** Detalle libre, ej. "OpenAI + hosting + DB managed". */
  detalle: string;
}

export interface Tier {
  key: TierKey;
  /** Compra del software (one-time setup + mantenimiento opcional mensual). */
  compra: {
    setupCOP: number;
    /** Mantenimiento opcional en COP. Puede ser 0 si el cliente elige no mantener. */
    mantenimientoCOP: number;
  };
  /** Suscripción SaaS hospedada por Koptup. `setupCOP` puede ser 0 en Enterprise. */
  saas: {
    setupCOP: number;
    monthlyCOP: number;
  };
  limits: TierLimits;
  soporte: SupportLevel;
  /** Horas de mantenimiento/evolutivos incluidas (en compra-mantenimiento o en saas). */
  mantenimientoHoras: number;
  integraciones: IntegrationLevel;
  /** Costos USD/mes que el cliente paga directo al proveedor (OpenAI, AWS, etc). */
  costosClienteUSD: CostoClienteUSD;
  /** Tiempo de implementación. */
  implementacionSemanas: { min: number; max: number };
  /** Cantidad de items en `messages.offering_<slug>.tiers.<tier>.incluye[]`. */
  incluyeCount: number;
}

export interface Offering {
  slug: string;
  /** Ruta de la demo bajo `/demo/<demoSlug>` (vacío si no aplica). */
  demoSlug: string;
  category: OfferingCategory;
  /** Nombre del heroicon outline (ej. `BriefcaseIcon`). */
  icon: string;
  /** Clases tailwind para gradiente del header (`from-x to-y`). */
  gradient: string;
  /** Siempre 4 tiers: basico, profesional, avanzado, enterprise. */
  tiers: Tier[];
}

/* -------------------------------------------------------------------------- */
/* Helpers de presentación: COP, USD, ciclos                                   */
/* -------------------------------------------------------------------------- */

/** TRM de referencia (fallback si la API falla): 1 USD = $4.000 COP. */
export const TRM_FALLBACK = 4000;
/** Compat: la antigua constante. */
export const USD_RATE = TRM_FALLBACK;

export type DisplayCurrency = 'COP' | 'USD';

export function formatCOP(value: number): string {
  if (value === 0) return 'Personalizado';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function copToUsd(cop: number, rate: number = TRM_FALLBACK): number {
  if (cop === 0) return 0;
  return Math.round(cop / rate / 10) * 10;
}

export function formatUSD(usd: number): string {
  if (usd === 0) return 'Custom';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd);
}

export function formatMoney(
  amountCOP: number,
  currency: DisplayCurrency,
  rate: number = TRM_FALLBACK,
): string {
  if (currency === 'USD') return formatUSD(copToUsd(amountCOP, rate));
  return formatCOP(amountCOP);
}

export const TIER_LABELS: Record<TierKey, { es: string; en: string }> = {
  basico: { es: 'Básico', en: 'Basic' },
  profesional: { es: 'Profesional', en: 'Professional' },
  avanzado: { es: 'Avanzado', en: 'Advanced' },
  enterprise: { es: 'Enterprise', en: 'Enterprise' },
};

export const TIER_ORDER: TierKey[] = ['basico', 'profesional', 'avanzado', 'enterprise'];

export type BillingCycleId = 'monthly' | 'semestral' | 'annual';

export interface BillingCycle {
  id: BillingCycleId;
  monthsBilled: 1 | 6 | 12;
  discountPct: number;
}

export const BILLING_CYCLES: readonly BillingCycle[] = [
  { id: 'monthly', monthsBilled: 1, discountPct: 0 },
  { id: 'semestral', monthsBilled: 6, discountPct: 0.1 },
  { id: 'annual', monthsBilled: 12, discountPct: 0.2 },
] as const;

export interface CycleCalc {
  totalCOP: number;
  effectiveMonthlyCOP: number;
  savingsCOP: number;
}

export function calcularCicloPago(
  monthlyCOP: number,
  monthsBilled: number,
  discountPct: number,
): CycleCalc {
  const total = monthlyCOP * monthsBilled;
  const discounted = Math.round(total * (1 - discountPct));
  const effective = Math.round(discounted / monthsBilled);
  return {
    totalCOP: discounted,
    effectiveMonthlyCOP: effective,
    savingsCOP: total - discounted,
  };
}

/** Convierte un slug `kebab-case` a `offering_camelCase`. */
export function slugToOfferingNamespace(slug: string): string {
  const camel = slug.replace(/-([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
  return `offering_${camel}`;
}

/** Aliases retro-compatibles (apuntan al mismo namespace unificado). */
export const slugToNamespace = slugToOfferingNamespace;
export const slugToPlanNamespace = slugToOfferingNamespace;

/* -------------------------------------------------------------------------- */
/* Catálogo: builders                                                          */
/* -------------------------------------------------------------------------- */

const SUPPORT_BY_TIER: Record<TierKey, SupportLevel> = {
  basico: 'email-24h',
  profesional: 'email-whatsapp-4h',
  avanzado: 'email-whatsapp-slack-2h',
  enterprise: 'tickets-jira-zendesk-1h',
};

const INTEG_BY_TIER: Record<TierKey, IntegrationLevel> = {
  basico: 'basicas',
  profesional: 'medias',
  avanzado: 'avanzadas',
  enterprise: 'empresariales',
};

const SAAS_SETUP_BY_TIER: Record<TierKey, number> = {
  basico: 1_500_000,
  profesional: 2_500_000,
  avanzado: 4_000_000,
  enterprise: 0,
};

const IMPL_SEMANAS_BY_TIER: Record<TierKey, { min: number; max: number }> = {
  basico: { min: 2, max: 5 },
  profesional: { min: 5, max: 9 },
  avanzado: { min: 9, max: 14 },
  enterprise: { min: 12, max: 20 },
};

const MANT_HORAS_BY_TIER: Record<TierKey, number> = {
  basico: 5,
  profesional: 12,
  avanzado: 25,
  enterprise: 50,
};

const INCLUYE_COUNT_BY_TIER: Record<TierKey, number> = {
  basico: 5,
  profesional: 7,
  avanzado: 8,
  enterprise: 9,
};

/** Tuple por tier: [compraSetupCOP, compraMantenimientoCOP, saasMonthlyCOP]. */
type TierPrices = [number, number, number];

interface BuildArgs {
  /** Orden básico, profesional, avanzado, enterprise. */
  prices: [TierPrices, TierPrices, TierPrices, TierPrices];
  limits: [TierLimits, TierLimits, TierLimits, TierLimits];
  costos: [CostoClienteUSD, CostoClienteUSD, CostoClienteUSD, CostoClienteUSD];
}

function buildTiers(args: BuildArgs): Tier[] {
  return TIER_ORDER.map((key, idx) => {
    const [compraSetup, compraMant, saasMonthly] = args.prices[idx];
    return {
      key,
      compra: { setupCOP: compraSetup, mantenimientoCOP: compraMant },
      saas: { setupCOP: SAAS_SETUP_BY_TIER[key], monthlyCOP: saasMonthly },
      limits: args.limits[idx],
      soporte: SUPPORT_BY_TIER[key],
      mantenimientoHoras: MANT_HORAS_BY_TIER[key],
      integraciones: INTEG_BY_TIER[key],
      costosClienteUSD: args.costos[idx],
      implementacionSemanas: IMPL_SEMANAS_BY_TIER[key],
      incluyeCount: INCLUYE_COUNT_BY_TIER[key],
    } satisfies Tier;
  });
}

/** Constructor abreviado para límites. */
const lim = (
  adminUsers: UnlimitedOrNumber,
  endUsers: UnlimitedOrNumber,
  accounts: UnlimitedOrNumber,
  monthlyVolume: UnlimitedOrNumber,
  volumeLabel: string,
  storageGB: UnlimitedOrNumber,
): TierLimits => ({
  adminUsers,
  endUsers,
  accounts,
  monthlyVolume,
  volumeLabel,
  storageGB,
});

const co = (min: number, max: number, detalle: string): CostoClienteUSD => ({
  min,
  max,
  detalle,
});

/* -------------------------------------------------------------------------- */
/* Catálogo OFFERINGS (27 productos)                                           */
/* -------------------------------------------------------------------------- */

export const OFFERINGS: Offering[] = [
  /* 1. chatbot-rag-ia */
  {
    slug: 'chatbot-rag-ia',
    demoSlug: 'chatbot',
    category: 'aiPlatform',
    icon: 'ChatBubbleLeftRightIcon',
    gradient: 'from-primary-600 to-primary-800',
    tiers: buildTiers({
      prices: [
        [9_500_000, 850_000, 690_000],
        [28_000_000, 2_500_000, 1_890_000],
        [65_000_000, 5_500_000, 3_490_000],
        [145_000_000, 11_000_000, 5_490_000],
      ],
      limits: [
        lim(3, 1000, 1, 5000, '5.000 conversaciones/mes', 5),
        lim(10, 10000, 1, 25000, '25.000 conversaciones/mes', 30),
        lim(30, 100000, 5, 100000, '100.000 conversaciones/mes', 150),
        lim('unlimited', 'unlimited', 'unlimited', 500000, '500.000+ conversaciones/mes', 'unlimited'),
      ],
      costos: [
        co(80, 250, 'OpenAI + hosting básico + DB starter'),
        co(400, 1200, 'OpenAI + hosting + vector DB + monitoreo'),
        co(1500, 4500, 'LLM mix + Pinecone + AWS prod + WhatsApp'),
        co(4000, 15000, 'LLM premium + multi-región + telefonía + observabilidad'),
      ],
    }),
  },
  /* 2. ecommerce */
  {
    slug: 'ecommerce',
    demoSlug: 'ecommerce',
    category: 'commerce',
    icon: 'ShoppingCartIcon',
    gradient: 'from-green-600 to-emerald-800',
    tiers: buildTiers({
      prices: [
        [12_000_000, 1_100_000, 890_000],
        [35_000_000, 3_100_000, 2_490_000],
        [80_000_000, 6_800_000, 4_490_000],
        [175_000_000, 13_500_000, 6_490_000],
      ],
      limits: [
        lim(3, 5000, 1, 1000, '1.000 órdenes/mes', 10),
        lim(15, 50000, 1, 10000, '10.000 órdenes/mes', 80),
        lim(40, 250000, 5, 75000, '75.000 órdenes/mes', 400),
        lim('unlimited', 'unlimited', 'unlimited', 250000, '250.000+ órdenes/mes', 'unlimited'),
      ],
      costos: [
        co(80, 250, 'Hosting + DB + email + comisiones de pasarela'),
        co(400, 1200, 'Hosting prod + DB managed + email Pro + Algolia'),
        co(1500, 5000, 'Multi-región + image opt + anti-fraude + email enterprise'),
        co(5000, 18000, 'Hosting global + DB cluster + email premier + PCI-DSS'),
      ],
    }),
  },
  /* 3. bi-dashboard */
  {
    slug: 'bi-dashboard',
    demoSlug: 'dashboard-ejecutivo',
    category: 'aiPlatform',
    icon: 'ChartBarIcon',
    gradient: 'from-purple-600 to-purple-800',
    tiers: buildTiers({
      prices: [
        [9_000_000, 800_000, 590_000],
        [28_000_000, 2_500_000, 1_490_000],
        [65_000_000, 5_500_000, 2_690_000],
        [135_000_000, 10_500_000, 4_290_000],
      ],
      limits: [
        lim(5, 50, 1, 100000, '100.000 filas procesadas/mes', 10),
        lim(25, 500, 1, 1_000_000, '1M filas procesadas/mes', 80),
        lim(75, 5000, 5, 25_000_000, '25M filas procesadas/mes', 500),
        lim('unlimited', 'unlimited', 'unlimited', 250_000_000, '250M+ filas procesadas/mes', 'unlimited'),
      ],
      costos: [
        co(50, 200, 'Hosting + DB + LLM opcional para resúmenes'),
        co(300, 1000, 'Warehouse (BigQuery) + LLM + monitoreo'),
        co(1500, 5000, 'Warehouse enterprise + dashboards real-time'),
        co(5000, 20000, 'Multi-warehouse + CDC + retención larga'),
      ],
    }),
  },
  /* 4. gestor-documental */
  {
    slug: 'gestor-documental',
    demoSlug: 'gestor-documentos',
    category: 'data',
    icon: 'DocumentTextIcon',
    gradient: 'from-blue-600 to-blue-800',
    tiers: buildTiers({
      prices: [
        [7_500_000, 650_000, 490_000],
        [24_000_000, 2_100_000, 1_190_000],
        [55_000_000, 4_700_000, 2_190_000],
        [120_000_000, 9_500_000, 3_690_000],
      ],
      limits: [
        lim(5, 100, 1, 2000, '2.000 documentos/mes', 20),
        lim(25, 2000, 1, 50000, '50.000 documentos/mes', 200),
        lim(75, 25000, 5, 500000, '500.000 documentos/mes', 1000),
        lim('unlimited', 'unlimited', 'unlimited', 5_000_000, '5M+ documentos/mes', 'unlimited'),
      ],
      costos: [
        co(50, 250, 'Hosting + storage S3 + OCR básico'),
        co(300, 1500, 'Hosting + S3 + OCR avanzado + LLM clasificación'),
        co(1500, 6000, 'Storage tiered + IDP enterprise + LLM mix'),
        co(5000, 20000, 'Storage Glacier compliance + IDP + DLP'),
      ],
    }),
  },
  /* 5. sistema-reservas */
  {
    slug: 'sistema-reservas',
    demoSlug: 'sistema-reservas',
    category: 'productivity',
    icon: 'CalendarIcon',
    gradient: 'from-orange-600 to-orange-800',
    tiers: buildTiers({
      prices: [
        [6_500_000, 550_000, 490_000],
        [20_000_000, 1_800_000, 1_190_000],
        [45_000_000, 3_800_000, 1_990_000],
        [95_000_000, 7_500_000, 3_490_000],
      ],
      limits: [
        lim(3, 500, 1, 500, '500 reservas/mes', 5),
        lim(15, 10000, 5, 8000, '8.000 reservas/mes', 50),
        lim(40, 75000, 25, 60000, '60.000 reservas/mes', 250),
        lim('unlimited', 'unlimited', 'unlimited', 500000, '500.000+ reservas/mes', 'unlimited'),
      ],
      costos: [
        co(50, 200, 'Hosting + DB + email + SMS básico'),
        co(300, 1200, 'Hosting + DB + email Pro + Twilio + Stripe'),
        co(1500, 5000, 'Multi-sucursal + comunicaciones omnicanal'),
        co(5000, 18000, 'Multi-país + omnicanal enterprise + DR'),
      ],
    }),
  },
  /* 6. cms-headless */
  {
    slug: 'cms-headless',
    demoSlug: 'gestor-contenido',
    category: 'engagement',
    icon: 'PencilSquareIcon',
    gradient: 'from-pink-600 to-pink-800',
    tiers: buildTiers({
      prices: [
        [7_000_000, 600_000, 490_000],
        [22_000_000, 1_900_000, 1_190_000],
        [50_000_000, 4_200_000, 2_090_000],
        [105_000_000, 8_500_000, 3_490_000],
      ],
      limits: [
        lim(5, 0, 1, 50000, '50.000 vistas/mes', 10),
        lim(20, 0, 3, 1_000_000, '1M vistas/mes', 80),
        lim(60, 0, 10, 25_000_000, '25M vistas/mes', 400),
        lim('unlimited', 0, 'unlimited', 250_000_000, '250M+ vistas/mes', 'unlimited'),
      ],
      costos: [
        co(50, 200, 'Hosting + DB + CDN básico'),
        co(300, 1200, 'Hosting + DB + CDN Pro + image opt'),
        co(1500, 5000, 'CDN multi-región + DAM + edge functions'),
        co(5000, 20000, 'CDN enterprise + translation memory + DXP'),
      ],
    }),
  },
  /* 7. gestion-proyectos */
  {
    slug: 'gestion-proyectos',
    demoSlug: 'control-proyectos',
    category: 'productivity',
    icon: 'RectangleStackIcon',
    gradient: 'from-teal-600 to-teal-800',
    tiers: buildTiers({
      prices: [
        [6_500_000, 580_000, 490_000],
        [20_000_000, 1_800_000, 1_190_000],
        [45_000_000, 3_800_000, 2_090_000],
        [95_000_000, 7_500_000, 3_490_000],
      ],
      limits: [
        lim(10, 0, 1, 25, '25 proyectos activos', 10),
        lim(50, 0, 5, 250, '250 proyectos activos', 80),
        lim(150, 0, 25, 2500, '2.500 proyectos activos', 400),
        lim('unlimited', 0, 'unlimited', 25000, '25.000+ proyectos activos', 'unlimited'),
      ],
      costos: [
        co(50, 200, 'Hosting + DB + email'),
        co(300, 1000, 'Hosting + DB + Slack/Teams + monitoreo'),
        co(1500, 5000, 'Hosting + Jira/Azure DevOps connectors'),
        co(5000, 18000, 'PPM enterprise + BI ML + SSO/SCIM'),
      ],
    }),
  },
  /* 8. crm-ia */
  {
    slug: 'crm-ia',
    demoSlug: 'crm-ia',
    category: 'sales',
    icon: 'BriefcaseIcon',
    gradient: 'from-indigo-600 to-indigo-800',
    tiers: buildTiers({
      prices: [
        [10_500_000, 950_000, 790_000],
        [32_000_000, 2_800_000, 1_890_000],
        [72_000_000, 6_000_000, 3_490_000],
        [155_000_000, 12_000_000, 5_690_000],
      ],
      limits: [
        lim(5, 2000, 1, 500, '2.000 contactos + 500 deals/mes', 10),
        lim(30, 15000, 3, 5000, '15.000 contactos + 5k deals/mes', 80),
        lim(80, 75000, 15, 25000, '75.000 contactos + 25k deals/mes', 400),
        lim('unlimited', 'unlimited', 'unlimited', 100000, '250k+ contactos + 100k deals/mes', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + DB + email + OpenAI scoring'),
        co(400, 1500, 'Hosting prod + DB + email Pro + LLM + WhatsApp'),
        co(1500, 5500, 'Email premier + LLM mix + telefonía + DW'),
        co(5000, 20000, 'Marketo/Eloqua + DW + call center omnicanal'),
      ],
    }),
  },
  /* 9. erp-modular */
  {
    slug: 'erp-modular',
    demoSlug: 'erp',
    category: 'finance',
    icon: 'BuildingOfficeIcon',
    gradient: 'from-amber-600 to-amber-800',
    tiers: buildTiers({
      prices: [
        [24_000_000, 2_000_000, 1_890_000],
        [70_000_000, 6_000_000, 4_290_000],
        [145_000_000, 11_500_000, 7_490_000],
        [320_000_000, 25_000_000, 11_490_000],
      ],
      limits: [
        lim(10, 0, 1, 1500, '1.500 transacciones/mes', 50),
        lim(50, 0, 5, 30000, '30.000 transacciones/mes', 400),
        lim(150, 0, 25, 250000, '250.000 transacciones/mes', 1500),
        lim('unlimited', 0, 'unlimited', 2_500_000, '2.5M+ transacciones/mes', 'unlimited'),
      ],
      costos: [
        co(150, 500, 'Hosting prod + DB + DIAN + Wompi'),
        co(600, 2500, 'Hosting AWS multi-AZ + DB + DIAN Pro + bancos'),
        co(2500, 10000, 'Hosting enterprise + DIAN multi-país + auditoría'),
        co(8000, 35000, 'Multi-país + SAP/Oracle interop + SOX/NIIF'),
      ],
    }),
  },
  /* 10. helpdesk-ia */
  {
    slug: 'helpdesk-ia',
    demoSlug: 'helpdesk-ia',
    category: 'support',
    icon: 'LifebuoyIcon',
    gradient: 'from-rose-600 to-rose-800',
    tiers: buildTiers({
      prices: [
        [8_500_000, 750_000, 590_000],
        [26_000_000, 2_300_000, 1_690_000],
        [60_000_000, 5_000_000, 3_090_000],
        [130_000_000, 10_000_000, 4_990_000],
      ],
      limits: [
        lim(5, 2000, 1, 500, '500 tickets/mes', 10),
        lim(30, 25000, 3, 10000, '10.000 tickets/mes', 80),
        lim(80, 150000, 15, 100000, '100.000 tickets/mes', 400),
        lim('unlimited', 'unlimited', 'unlimited', 1_000_000, '1M+ tickets/mes', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + DB + email + OpenAI clasificación'),
        co(400, 1500, 'Hosting + DB + email Pro + LLM + WhatsApp'),
        co(1500, 6000, 'Telefonía cloud + LLM mix + KB autoservicio'),
        co(5000, 20000, 'Omnicanal enterprise + WFM + speech analytics'),
      ],
    }),
  },
  /* 11. lms-elearning */
  {
    slug: 'lms-elearning',
    demoSlug: 'lms',
    category: 'education',
    icon: 'AcademicCapIcon',
    gradient: 'from-cyan-600 to-cyan-800',
    tiers: buildTiers({
      prices: [
        [9_000_000, 800_000, 690_000],
        [28_000_000, 2_500_000, 1_890_000],
        [65_000_000, 5_500_000, 3_390_000],
        [140_000_000, 11_000_000, 5_290_000],
      ],
      limits: [
        lim(5, 500, 1, 1000, '1.000 inscripciones/mes', 50),
        lim(30, 20000, 5, 20000, '20.000 inscripciones/mes', 400),
        lim(80, 150000, 25, 200000, '200.000 inscripciones/mes', 2000),
        lim('unlimited', 'unlimited', 'unlimited', 2_000_000, '2M+ inscripciones/mes', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + DB + video básico (Mux/Vimeo) + Stripe'),
        co(400, 1500, 'Hosting prod + video Pro + DRM + LLM + Stripe'),
        co(1500, 6000, 'Video CDN enterprise + Live + proctoring'),
        co(5000, 25000, 'Kaltura/Brightcove + LTI 1.3 + SCIM'),
      ],
    }),
  },
  /* 12. telemedicina */
  {
    slug: 'telemedicina',
    demoSlug: 'telemedicina',
    category: 'healthcare',
    icon: 'HeartIcon',
    gradient: 'from-red-600 to-rose-800',
    tiers: buildTiers({
      prices: [
        [15_500_000, 1_400_000, 1_290_000],
        [48_000_000, 4_200_000, 2_990_000],
        [110_000_000, 9_000_000, 5_290_000],
        [235_000_000, 18_000_000, 8_490_000],
      ],
      limits: [
        lim(5, 500, 1, 300, '300 consultas/mes', 30),
        lim(30, 20000, 5, 5000, '5.000 consultas/mes', 400),
        lim(80, 150000, 25, 50000, '50.000 consultas/mes', 1500),
        lim('unlimited', 'unlimited', 'unlimited', 500000, '500.000+ consultas/mes', 'unlimited'),
      ],
      costos: [
        co(150, 500, 'Hosting + DB + video WebRTC + email'),
        co(600, 2500, 'Hosting prod + video managed + LLM + WhatsApp'),
        co(2500, 10000, 'DB compliance-eligible + video enterprise + LLM'),
        co(8000, 30000, 'Multi-región + video premium + compliance HIPAA/HABEAS'),
      ],
    }),
  },
  /* 13. facturacion-electronica */
  {
    slug: 'facturacion-electronica',
    demoSlug: 'facturacion-electronica',
    category: 'finance',
    icon: 'DocumentCheckIcon',
    gradient: 'from-emerald-600 to-emerald-800',
    tiers: buildTiers({
      prices: [
        [7_000_000, 600_000, 490_000],
        [22_000_000, 1_900_000, 1_190_000],
        [50_000_000, 4_200_000, 2_090_000],
        [105_000_000, 8_500_000, 3_490_000],
      ],
      limits: [
        lim(3, 0, 1, 200, '200 facturas/mes', 5),
        lim(15, 0, 5, 5000, '5.000 facturas/mes', 50),
        lim(40, 0, 25, 50000, '50.000 facturas/mes', 250),
        lim('unlimited', 0, 'unlimited', 500000, '500.000+ facturas/mes', 'unlimited'),
      ],
      costos: [
        co(50, 200, 'Hosting + DB + DIAN básico + email'),
        co(300, 1200, 'Hosting + DB + DIAN Pro + email Pro'),
        co(1500, 5000, 'DIAN multi-país (CO/MX/PE) + nómina'),
        co(5000, 18000, 'DIAN enterprise + RADIAN + SAP/Oracle adapter'),
      ],
    }),
  },
  /* 14. wms-logistica */
  {
    slug: 'wms-logistica',
    demoSlug: 'wms-logistica',
    category: 'operations',
    icon: 'TruckIcon',
    gradient: 'from-stone-600 to-stone-800',
    tiers: buildTiers({
      prices: [
        [14_000_000, 1_250_000, 1_190_000],
        [44_000_000, 3_800_000, 2_690_000],
        [100_000_000, 8_500_000, 4_790_000],
        [215_000_000, 17_000_000, 7_490_000],
      ],
      limits: [
        lim(5, 0, 1, 1000, '1.000 órdenes/mes (1 bodega)', 20),
        lim(30, 0, 5, 20000, '20.000 órdenes/mes (5 bodegas)', 200),
        lim(80, 0, 25, 200000, '200.000 órdenes/mes (25 bodegas)', 1000),
        lim('unlimited', 0, 'unlimited', 2_500_000, '2.5M+ órdenes/mes (bodegas ilimitadas)', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + DB + scanner cloud + email'),
        co(400, 1500, 'Hosting prod + DB + carriers APIs + Mapbox'),
        co(1500, 6000, 'Carriers multi-país + IoT cadena de frío'),
        co(5000, 20000, 'SAP EWM interop + IoT + yard management'),
      ],
    }),
  },
  /* 15. pos-retail */
  {
    slug: 'pos-retail',
    demoSlug: 'pos',
    category: 'commerce',
    icon: 'ComputerDesktopIcon',
    gradient: 'from-fuchsia-600 to-fuchsia-800',
    tiers: buildTiers({
      prices: [
        [7_500_000, 650_000, 490_000],
        [23_000_000, 2_000_000, 1_190_000],
        [52_000_000, 4_400_000, 1_990_000],
        [110_000_000, 8_800_000, 3_290_000],
      ],
      limits: [
        lim(3, 0, 1, 1000, '1.000 ventas/mes (1 sucursal)', 5),
        lim(20, 0, 10, 25000, '25.000 ventas/mes (10 sucursales)', 80),
        lim(60, 0, 50, 250000, '250.000 ventas/mes (50 sucursales)', 400),
        lim('unlimited', 0, 'unlimited', 2_500_000, '2.5M+ ventas/mes (sucursales ilimitadas)', 'unlimited'),
      ],
      costos: [
        co(50, 250, 'Hosting + DB + DIAN + hardware POS (compra una vez)'),
        co(300, 1200, 'Hosting + DB + DIAN Pro + datafono'),
        co(1500, 5000, 'DIAN multi-país + central pricing + multi-tax'),
        co(5000, 18000, 'SAP Retail + self-checkout + loss prevention IA'),
      ],
    }),
  },
  /* 16. hrms */
  {
    slug: 'hrms',
    demoSlug: 'hrms',
    category: 'sales',
    icon: 'UserGroupIcon',
    gradient: 'from-violet-600 to-violet-800',
    tiers: buildTiers({
      prices: [
        [13_500_000, 1_200_000, 890_000],
        [42_000_000, 3_700_000, 2_290_000],
        [95_000_000, 8_000_000, 4_090_000],
        [195_000_000, 15_500_000, 6_490_000],
      ],
      limits: [
        lim(3, 50, 1, 50, '50 empleados', 10),
        lim(20, 1500, 5, 1500, '1.500 empleados', 80),
        lim(60, 12000, 25, 12000, '12.000 empleados', 400),
        lim('unlimited', 'unlimited', 'unlimited', 100000, '100.000+ empleados', 'unlimited'),
      ],
      costos: [
        co(50, 250, 'Hosting + DB + PILA + email'),
        co(300, 1200, 'Hosting + DB + PILA + nómina DIAN'),
        co(1500, 5000, 'Compliance multi-país (CO/MX/PE)'),
        co(5000, 18000, 'SuccessFactors/Workday adapter + analytics'),
      ],
    }),
  },
  /* 17. automatizacion-workflows */
  {
    slug: 'automatizacion-workflows',
    demoSlug: 'automatizacion',
    category: 'aiPlatform',
    icon: 'BoltIcon',
    gradient: 'from-yellow-600 to-orange-700',
    tiers: buildTiers({
      prices: [
        [9_000_000, 800_000, 690_000],
        [28_000_000, 2_500_000, 1_890_000],
        [65_000_000, 5_500_000, 3_390_000],
        [140_000_000, 11_000_000, 5_290_000],
      ],
      limits: [
        lim(3, 0, 1, 10000, '10.000 ejecuciones/mes', 5),
        lim(15, 0, 3, 250000, '250.000 ejecuciones/mes', 50),
        lim(40, 0, 15, 2_500_000, '2.5M ejecuciones/mes', 250),
        lim('unlimited', 0, 'unlimited', 25_000_000, '25M+ ejecuciones/mes', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + DB + OpenAI steps opcionales'),
        co(400, 1500, 'Hosting prod + OpenAI + conectores premium'),
        co(1500, 6000, 'Workers cluster + LLM mix + Temporal'),
        co(5000, 20000, 'MuleSoft/Boomi + Kafka + EDI multi-protocolo'),
      ],
    }),
  },
  /* 18. saas-multi-tenant */
  {
    slug: 'saas-multi-tenant',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'Squares2X2Icon',
    gradient: 'from-slate-600 to-slate-800',
    tiers: buildTiers({
      prices: [
        [16_500_000, 1_400_000, 990_000],
        [50_000_000, 4_200_000, 2_490_000],
        [115_000_000, 9_500_000, 4_690_000],
        [245_000_000, 19_000_000, 7_490_000],
      ],
      limits: [
        lim(5, 1000, 5, 10000, '10k requests/mes y 5 tenants', 20),
        lim(30, 100000, 50, 1_000_000, '1M requests/mes y 50 tenants', 200),
        lim(80, 500000, 200, 25_000_000, '25M requests/mes y 200 tenants', 1000),
        lim('unlimited', 'unlimited', 'unlimited', 250_000_000, '250M+ requests/mes (tenants ilimitados)', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + DB + Stripe + email'),
        co(400, 1500, 'Hosting + DB + Stripe + Auth premium'),
        co(1500, 6000, 'Auth0/Clerk enterprise + MFA + audit logs'),
        co(5000, 25000, 'Data residency multi-región + compliance arquitectura'),
      ],
    }),
  },
  /* 19. voice-ai-callcenter */
  {
    slug: 'voice-ai-callcenter',
    demoSlug: 'voice-ai',
    category: 'voice',
    icon: 'MicrophoneIcon',
    gradient: 'from-sky-600 to-sky-800',
    tiers: buildTiers({
      prices: [
        [14_500_000, 1_400_000, 1_690_000],
        [46_000_000, 4_000_000, 3_690_000],
        [105_000_000, 9_000_000, 6_490_000],
        [230_000_000, 18_000_000, 9_990_000],
      ],
      limits: [
        lim(3, 0, 1, 1000, '1.000 minutos/mes', 5),
        lim(20, 0, 5, 30000, '30.000 minutos/mes', 80),
        lim(60, 0, 25, 250000, '250.000 minutos/mes', 400),
        lim('unlimited', 0, 'unlimited', 2_500_000, '2.5M+ minutos/mes', 'unlimited'),
      ],
      costos: [
        co(300, 1000, 'Twilio Voice + STT + TTS + OpenAI'),
        co(1500, 5000, 'Twilio + Deepgram + ElevenLabs Pro + LLM'),
        co(5000, 18000, 'Telefonía enterprise + voces premium + multi-país'),
        co(15000, 50000, 'PBX/SIP enterprise + multi-país + voice cloning'),
      ],
    }),
  },
  /* 20. firma-electronica */
  {
    slug: 'firma-electronica',
    demoSlug: 'firma-electronica',
    category: 'security',
    icon: 'PencilIcon',
    gradient: 'from-lime-600 to-lime-800',
    tiers: buildTiers({
      prices: [
        [5_500_000, 500_000, 400_000],
        [17_000_000, 1_500_000, 890_000],
        [38_000_000, 3_200_000, 1_690_000],
        [80_000_000, 6_500_000, 2_990_000],
      ],
      limits: [
        lim(3, 100, 1, 100, '100 firmas/mes', 5),
        lim(15, 5000, 5, 2000, '2.000 firmas/mes', 50),
        lim(40, 50000, 25, 25000, '25.000 firmas/mes', 250),
        lim('unlimited', 'unlimited', 'unlimited', 500000, '500.000+ firmas/mes', 'unlimited'),
      ],
      costos: [
        co(50, 200, 'Hosting + DB + certificado digital + email'),
        co(300, 1000, 'Hosting + estampa cronológica + KYC'),
        co(1500, 5000, 'PKI + HSM cloud + KYC biométrico'),
        co(5000, 18000, 'PKI corporativa + HSM dedicado + eIDAS'),
      ],
    }),
  },
  /* 21. scraping-extraccion */
  {
    slug: 'scraping-extraccion',
    demoSlug: 'scraping',
    category: 'data',
    icon: 'GlobeAltIcon',
    gradient: 'from-zinc-600 to-zinc-800',
    tiers: buildTiers({
      prices: [
        [6_500_000, 600_000, 490_000],
        [21_000_000, 1_800_000, 1_190_000],
        [48_000_000, 4_000_000, 2_190_000],
        [105_000_000, 8_500_000, 3_690_000],
      ],
      limits: [
        lim(2, 0, 1, 25000, '25.000 páginas/mes', 10),
        lim(10, 0, 5, 500000, '500.000 páginas/mes', 80),
        lim(40, 0, 25, 10_000_000, '10M páginas/mes', 400),
        lim('unlimited', 0, 'unlimited', 100_000_000, '100M+ páginas/mes', 'unlimited'),
      ],
      costos: [
        co(80, 350, 'Hosting + proxies básicos + captcha solver'),
        co(500, 2000, 'Hosting + proxies residenciales + browser cluster'),
        co(2000, 8000, 'Proxies multi-país + browser farm + LLM'),
        co(6000, 25000, 'Proxies enterprise + cluster k8s + multi-región'),
      ],
    }),
  },
  /* 22. code-review-ia */
  {
    slug: 'code-review-ia',
    demoSlug: 'code-review-ia',
    category: 'devTools',
    icon: 'CommandLineIcon',
    gradient: 'from-neutral-700 to-neutral-900',
    tiers: buildTiers({
      prices: [
        [6_000_000, 550_000, 400_000],
        [19_000_000, 1_700_000, 890_000],
        [43_000_000, 3_600_000, 1_690_000],
        [90_000_000, 7_200_000, 2_890_000],
      ],
      limits: [
        lim(5, 0, 1, 200, '200 PRs analizados/mes', 5),
        lim(50, 0, 5, 3000, '3.000 PRs analizados/mes', 30),
        lim(150, 0, 25, 30000, '30.000 PRs analizados/mes', 150),
        lim('unlimited', 0, 'unlimited', 300000, '300.000+ PRs analizados/mes', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + OpenAI básico'),
        co(400, 1800, 'Hosting + Claude + GPT-4o para análisis profundo'),
        co(2000, 8000, 'LLMs reasoning + cache + SAST básico'),
        co(6000, 25000, 'SAST/SCA enterprise (Snyk/Sonar) + air-gapped'),
      ],
    }),
  },
  /* 23. moderacion-contenido */
  {
    slug: 'moderacion-contenido',
    demoSlug: 'moderacion-contenido',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-red-700 to-red-900',
    tiers: buildTiers({
      prices: [
        [8_500_000, 800_000, 690_000],
        [27_000_000, 2_400_000, 1_690_000],
        [62_000_000, 5_200_000, 3_090_000],
        [135_000_000, 10_500_000, 4_890_000],
      ],
      limits: [
        lim(3, 0, 1, 25000, '25.000 items moderados/mes', 10),
        lim(20, 0, 5, 1_000_000, '1M items moderados/mes', 80),
        lim(60, 0, 25, 25_000_000, '25M items moderados/mes', 400),
        lim('unlimited', 0, 'unlimited', 250_000_000, '250M+ items moderados/mes', 'unlimited'),
      ],
      costos: [
        co(80, 350, 'Hosting + OpenAI moderation + image moderation'),
        co(500, 2000, 'Hosting + LLMs mix + Hive Pro + audio moderation'),
        co(2000, 10000, 'Moderation enterprise + Trust & Safety workflow'),
        co(6000, 25000, 'Multi-modal + custom ML + cumplimiento DSA/COPPA'),
      ],
    }),
  },
  /* 24. app-delivery */
  {
    slug: 'app-delivery',
    demoSlug: 'delivery',
    category: 'operations',
    icon: 'MapIcon',
    gradient: 'from-orange-500 to-red-600',
    tiers: buildTiers({
      prices: [
        [16_500_000, 1_500_000, 1_190_000],
        [51_000_000, 4_400_000, 2_990_000],
        [115_000_000, 9_500_000, 5_390_000],
        [245_000_000, 19_000_000, 8_690_000],
      ],
      limits: [
        lim(3, 5000, 1, 1000, '1.000 pedidos/mes (1 ciudad)', 10),
        lim(20, 100000, 10, 20000, '20.000 pedidos/mes (10 ciudades)', 80),
        lim(60, 500000, 50, 200000, '200.000 pedidos/mes (50 ciudades)', 400),
        lim('unlimited', 'unlimited', 'unlimited', 2_500_000, '2.5M+ pedidos/mes (ciudades ilimitadas)', 'unlimited'),
      ],
      costos: [
        co(150, 500, 'Hosting + DB + Mapbox + Stripe + push'),
        co(600, 2500, 'Hosting auto-scaling + Maps Pro + Stripe + Twilio'),
        co(2500, 10000, 'Maps Platform enterprise + telefonía multi-país'),
        co(8000, 30000, 'OMS enterprise + ML routing + fraude ML'),
      ],
    }),
  },
  /* 25. loyalty-fidelizacion */
  {
    slug: 'loyalty-fidelizacion',
    demoSlug: 'loyalty',
    category: 'engagement',
    icon: 'StarIcon',
    gradient: 'from-yellow-500 to-amber-600',
    tiers: buildTiers({
      prices: [
        [8_500_000, 750_000, 490_000],
        [26_000_000, 2_200_000, 1_190_000],
        [60_000_000, 5_000_000, 2_290_000],
        [130_000_000, 10_000_000, 3_690_000],
      ],
      limits: [
        lim(3, 5000, 1, 10000, '5.000 miembros + 10k transacciones/mes', 10),
        lim(20, 200000, 5, 1_000_000, '200k miembros + 1M transacciones/mes', 80),
        lim(60, 2_000_000, 25, 25_000_000, '2M miembros + 25M transacciones/mes', 400),
        lim('unlimited', 'unlimited', 'unlimited', 250_000_000, '20M+ miembros + 250M+ transacciones/mes', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + DB + email + SMS/push básico'),
        co(400, 1500, 'Hosting + SMS + WhatsApp masivo + LLM segmentación'),
        co(1500, 6000, 'CDP + email enterprise (Iterable/Braze)'),
        co(5000, 25000, 'CDP enterprise + Salesforce/Dynamics + ML churn'),
      ],
    }),
  },
  /* 26. qa-automatizado-ia */
  {
    slug: 'qa-automatizado-ia',
    demoSlug: 'chatbot',
    category: 'devTools',
    icon: 'CheckBadgeIcon',
    gradient: 'from-teal-700 to-emerald-900',
    tiers: buildTiers({
      prices: [
        [6_500_000, 600_000, 490_000],
        [21_000_000, 1_800_000, 1_190_000],
        [47_000_000, 4_000_000, 1_990_000],
        [100_000_000, 8_000_000, 3_290_000],
      ],
      limits: [
        lim(3, 0, 1, 1000, '1.000 test runs/mes', 5),
        lim(20, 0, 5, 25000, '25.000 test runs/mes', 50),
        lim(60, 0, 25, 250000, '250.000 test runs/mes', 250),
        lim('unlimited', 0, 'unlimited', 2_500_000, '2.5M+ test runs/mes', 'unlimited'),
      ],
      costos: [
        co(80, 300, 'Hosting + OpenAI + browser CI básico'),
        co(400, 1800, 'Hosting + LLMs + browser farm (BrowserStack/Sauce)'),
        co(2000, 8000, 'LLM reasoning + device farm enterprise'),
        co(6000, 25000, 'Visual regression + perf testing + DORA analytics'),
      ],
    }),
  },
  /* 27. vpn-empresarial */
  {
    slug: 'vpn-empresarial',
    demoSlug: 'saas-boilerplate',
    category: 'security',
    icon: 'ShieldCheckIcon',
    gradient: 'from-blue-700 to-slate-900',
    tiers: buildTiers({
      prices: [
        [6_500_000, 550_000, 490_000],
        [17_000_000, 1_500_000, 1_190_000],
        [38_000_000, 3_200_000, 1_890_000],
        [80_000_000, 6_500_000, 3_290_000],
      ],
      limits: [
        lim(3, 0, 1, 25, '25 usuarios concurrentes', 5),
        lim(15, 0, 5, 200, '200 usuarios concurrentes', 30),
        lim(50, 0, 25, 1500, '1.500 usuarios concurrentes', 150),
        lim('unlimited', 0, 'unlimited', 25000, '25.000+ usuarios concurrentes', 'unlimited'),
      ],
      costos: [
        co(50, 250, 'Servidores VPN (DO/Hetzner) + certificados'),
        co(300, 1500, 'Multi-región AWS/GCP + SIEM básico'),
        co(2000, 8000, 'Backbone enterprise + SIEM corporativo'),
        co(6000, 25000, 'ZTNA (Zscaler) + SIEM (Splunk) + EDR/XDR + DLP'),
      ],
    }),
  },
];

/* -------------------------------------------------------------------------- */
/* Aliases retro-compatibles                                                   */
/* -------------------------------------------------------------------------- */

/** Alias: la fuente única es `OFFERINGS`. Mantenido para no romper imports legacy. */
export const SERVICES: Offering[] = OFFERINGS;
/** Alias: la fuente única es `OFFERINGS`. Mantenido para no romper imports legacy. */
export const PLANS: Offering[] = OFFERINGS;

/* -------------------------------------------------------------------------- */
/* Lookup                                                                      */
/* -------------------------------------------------------------------------- */

export function getOfferingBySlug(slug: string): Offering | undefined {
  return OFFERINGS.find((o) => o.slug === slug);
}

export function getTier(offering: Offering, key: TierKey): Tier | undefined {
  return offering.tiers.find((t) => t.key === key);
}
