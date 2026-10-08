/**
 * Tipos de los datos de precios del backend (data/pricing.data.ts).
 *
 * Los precios públicos viven en la web:
 *  - planes RAG: apps/web/src/lib/rag-plans.ts (COP y USD fijos);
 *  - catálogo "otras soluciones": apps/web/src/lib/services-catalog.ts (COP;
 *    en USD se convierten con TRM_REFERENCIA).
 * El backend no importa código de la web: guarda una copia generada con
 * `npm run sync:pricing` (src/scripts/sync-pricing.ts) y la prueba
 * __tests__/unit/pricing-sync.test.ts falla si la copia y la web divergen.
 */

export type RagPlanId = 'piloto' | 'esencial' | 'profesional' | 'empresarial';
export type TierKey = 'basico' | 'profesional' | 'avanzado' | 'enterprise';

export interface Bilingual {
  es: string;
  en: string;
}

export interface PricingRagPlan {
  id: RagPlanId;
  nombre: Bilingual;
  /** Pago inicial (en el piloto es el pago único). */
  setup: { cop: number; usd: number };
  /** true si el setup es un precio "desde" (Empresarial). */
  setupIsFrom: boolean;
  /** `none`: sin mensualidad · `fixed`: `monthly` · `sla`: se define según el SLA. */
  monthlyMode: 'none' | 'fixed' | 'sla';
  monthly: { cop: number; usd: number } | null;
  weeks: { min: number; max: number };
}

export interface PricingTier {
  key: TierKey;
  nombre: Bilingual;
  compra: { setupCOP: number; mantenimientoCOP: number };
  saas: { setupCOP: number; monthlyCOP: number };
  implementacionSemanas: { min: number; max: number };
}

export interface PricingOffering {
  slug: string;
  demoSlug: string;
  nombre: Bilingual;
  tiers: PricingTier[];
}

export interface PricingData {
  /** COP por 1 USD para convertir el catálogo (los planes RAG no la usan). */
  trmReferencia: number;
  ragPlans: PricingRagPlan[];
  offerings: PricingOffering[];
}
