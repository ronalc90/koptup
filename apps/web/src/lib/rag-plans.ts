/**
 * Planes de sistemas RAG de KopTup: fuente única de precios y datos.
 *
 * Los precios son fijos en COP y en USD (no se convierten con TRM) y se
 * muestran "más IVA si aplica". Los textos visibles (nombres, alcance, notas)
 * viven en `messages/offerings/_rag-plans.{es,en}.json`, namespace `ragPlans`,
 * con una entrada por plan en `ragPlans.plans.<id>`.
 *
 * Lo usan:
 *  - `src/components/rag/RagPlans.tsx` (tabla de planes de /services#planes-rag
 *    y de /rag),
 *  - `src/lib/rag-plans-jsonld.ts` (JSON-LD Service + Offer),
 *  - el formulario de /contact (plan preseleccionado), /register y el JSON-LD
 *    de la home.
 */

export type RagPlanId = 'piloto' | 'esencial' | 'profesional' | 'empresarial';

export interface RagPrice {
  cop: number;
  usd: number;
}

export interface RagPlan {
  id: RagPlanId;
  /**
   * Pago inicial. En el piloto es el precio total (pago único); en los demás
   * planes es el setup. En Empresarial es un precio "desde" (`setupIsFrom`).
   */
  setup: RagPrice;
  setupIsFrom: boolean;
  /**
   * Mensualidad:
   *  - `none`: no tiene (piloto, pago único).
   *  - `fixed`: precio fijo en `monthly`.
   *  - `sla`: se define según el SLA (Empresarial).
   */
  monthlyMode: 'none' | 'fixed' | 'sla';
  monthly: RagPrice | null;
  /** Duración del piloto o tiempo de implementación, en semanas. */
  weeks: { min: number; max: number };
  /**
   * El plan tiene lista "La mensualidad incluye" en
   * `ragPlans.plans.<id>.monthlyIncludes` (el alcance siempre está en
   * `ragPlans.plans.<id>.features`).
   */
  hasMonthlyIncludes: boolean;
  /** El plan tiene una nota propia en `ragPlans.plans.<id>.note`. */
  hasNote: boolean;
}

export const RAG_PLANS: readonly RagPlan[] = [
  {
    id: 'piloto',
    setup: { cop: 3_900_000, usd: 1_200 },
    setupIsFrom: false,
    monthlyMode: 'none',
    monthly: null,
    weeks: { min: 2, max: 2 },
    hasMonthlyIncludes: false,
    hasNote: true,
  },
  {
    id: 'esencial',
    setup: { cop: 9_900_000, usd: 2_990 },
    setupIsFrom: false,
    monthlyMode: 'fixed',
    monthly: { cop: 1_490_000, usd: 450 },
    weeks: { min: 3, max: 4 },
    hasMonthlyIncludes: true,
    hasNote: false,
  },
  {
    id: 'profesional',
    setup: { cop: 24_900_000, usd: 7_490 },
    setupIsFrom: false,
    monthlyMode: 'fixed',
    monthly: { cop: 2_990_000, usd: 890 },
    weeks: { min: 6, max: 8 },
    hasMonthlyIncludes: true,
    hasNote: false,
  },
  {
    id: 'empresarial',
    setup: { cop: 59_900_000, usd: 17_900 },
    setupIsFrom: true,
    monthlyMode: 'sla',
    monthly: null,
    weeks: { min: 10, max: 14 },
    hasMonthlyIncludes: false,
    hasNote: false,
  },
];

/** Precio de cada pregunta adicional sobre el tope mensual del plan. */
export const RAG_EXTRA_QUESTION_PRICE: RagPrice = { cop: 250, usd: 0.08 };

/** Ancla de la sección de planes en /services (`/services#planes-rag`). */
export const RAG_PLANS_ANCHOR = 'planes-rag';

/** Ruta pública de la tabla de planes. */
export const RAG_PLANS_PATH = `/services#${RAG_PLANS_ANCHOR}`;

/**
 * Valor de `?service=` con el que los planes RAG abren /contact. El formulario
 * lo traduce a la opción "Sistema RAG" (`contactPage.services.rag`).
 */
export const RAG_SERVICE_SLUG = 'sistema-rag';

export function isRagPlanId(value: string | null | undefined): value is RagPlanId {
  return RAG_PLANS.some((p) => p.id === value);
}

export function getRagPlan(id: RagPlanId): RagPlan {
  const plan = RAG_PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Plan RAG desconocido: ${id}`);
  return plan;
}

/** Enlace al formulario de contacto con el plan preseleccionado. */
export function ragPlanContactHref(id: RagPlanId): string {
  return `/contact?service=${RAG_SERVICE_SLUG}&plan=${id}`;
}

/* -------------------------------------------------------------------------- */
/* Formato de precios                                                          */
/* -------------------------------------------------------------------------- */

function numberLocale(locale: string): string {
  return locale.startsWith('en') ? 'en-US' : 'es-CO';
}

/** "COP 3.900.000" (es) / "COP 3,900,000" (en). */
export function formatRagCOP(value: number, locale = 'es'): string {
  return `COP ${new Intl.NumberFormat(numberLocale(locale), { maximumFractionDigits: 0 }).format(value)}`;
}

/** "USD 1.200" y "USD 0,08" (es) / "USD 1,200" y "USD 0.08" (en). */
export function formatRagUSD(value: number, locale = 'es'): string {
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `USD ${new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`;
}
