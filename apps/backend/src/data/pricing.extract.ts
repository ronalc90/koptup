/**
 * Extrae los datos de precios desde las fuentes de la web (módulos y
 * mensajes ya cargados). La usan:
 *  - src/scripts/sync-pricing.ts, que regenera data/pricing.data.ts, y
 *  - __tests__/unit/pricing-sync.test.ts, que falla si la copia del backend
 *    no coincide con la web.
 *
 * No importa nada de la web: recibe los módulos ya cargados (`require` con
 * una ruta calculada en tiempo de ejecución) para no acoplar la compilación
 * del backend a la de la web.
 */
import fs from 'fs';
import path from 'path';
import type { Bilingual, PricingData, PricingOffering, PricingRagPlan, PricingTier, RagPlanId, TierKey } from './pricing.types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WebPricingSources {
  ragPlansModule: any;
  catalogModule: any;
  /** messages/offerings/_rag-plans.{es,en}.json */
  ragMessages: { es: any; en: any };
  /** messages/offerings/<slug>.{es,en}.json por slug */
  offeringMessages: Record<string, { es: any; en: any }>;
}

function slugToNamespace(slug: string): string {
  return `offering_${slug.replace(/-([a-z0-9])/g, (_m, ch: string) => ch.toUpperCase())}`;
}

function bilingual(es: unknown, en: unknown, fallback: string): Bilingual {
  return {
    es: typeof es === 'string' && es.trim() ? es : fallback,
    en: typeof en === 'string' && en.trim() ? en : typeof es === 'string' && es.trim() ? es : fallback,
  };
}

export function extractPricing(src: WebPricingSources): PricingData {
  const ragPlans: PricingRagPlan[] = (src.ragPlansModule.RAG_PLANS as any[]).map((p) => ({
    id: p.id as RagPlanId,
    nombre: bilingual(src.ragMessages.es?.ragPlans?.plans?.[p.id]?.name, src.ragMessages.en?.ragPlans?.plans?.[p.id]?.name, p.id),
    setup: { cop: p.setup.cop, usd: p.setup.usd },
    setupIsFrom: !!p.setupIsFrom,
    monthlyMode: p.monthlyMode,
    monthly: p.monthly ? { cop: p.monthly.cop, usd: p.monthly.usd } : null,
    weeks: { min: p.weeks.min, max: p.weeks.max },
  }));

  const tierLabels = src.catalogModule.TIER_LABELS as Record<TierKey, { es: string; en: string }>;
  const offerings: PricingOffering[] = (src.catalogModule.OFFERINGS as any[]).map((o) => {
    const ns = slugToNamespace(o.slug);
    const msgs = src.offeringMessages[o.slug] ?? { es: {}, en: {} };
    const tiers: PricingTier[] = (o.tiers as any[]).map((t) => ({
      key: t.key as TierKey,
      nombre: bilingual(tierLabels?.[t.key as TierKey]?.es, tierLabels?.[t.key as TierKey]?.en, t.key),
      compra: { setupCOP: t.compra.setupCOP, mantenimientoCOP: t.compra.mantenimientoCOP },
      saas: { setupCOP: t.saas.setupCOP, monthlyCOP: t.saas.monthlyCOP },
      implementacionSemanas: { min: t.implementacionSemanas.min, max: t.implementacionSemanas.max },
    }));
    return {
      slug: o.slug,
      demoSlug: o.demoSlug ?? '',
      nombre: bilingual(msgs.es?.[ns]?.name, msgs.en?.[ns]?.name, o.slug),
      tiers,
    };
  });

  return {
    trmReferencia: src.catalogModule.TRM_REFERENCIA,
    ragPlans,
    offerings,
  };
}

/** Raíz de la web (apps/web) a partir de esta carpeta (apps/backend/src/data). */
export function defaultWebRoot(): string {
  return path.resolve(__dirname, '../../../web');
}

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/**
 * Carga las fuentes de la web desde disco. `requireTs` debe saber cargar
 * archivos .ts (ts-node en el script; ts-jest en las pruebas).
 */
export function loadWebPricingSources(webRoot: string, requireTs: (file: string) => any): WebPricingSources {
  const lib = path.join(webRoot, 'src', 'lib');
  const msgs = path.join(webRoot, 'messages', 'offerings');
  const ragPlansModule = requireTs(path.join(lib, 'rag-plans.ts'));
  const catalogModule = requireTs(path.join(lib, 'services-catalog.ts'));
  const offeringMessages: Record<string, { es: any; en: any }> = {};
  for (const o of catalogModule.OFFERINGS as Array<{ slug: string }>) {
    const es = path.join(msgs, `${o.slug}.es.json`);
    const en = path.join(msgs, `${o.slug}.en.json`);
    offeringMessages[o.slug] = {
      es: fs.existsSync(es) ? readJson(es) : {},
      en: fs.existsSync(en) ? readJson(en) : {},
    };
  }
  return {
    ragPlansModule,
    catalogModule,
    ragMessages: { es: readJson(path.join(msgs, '_rag-plans.es.json')), en: readJson(path.join(msgs, '_rag-plans.en.json')) },
    offeringMessages,
  };
}

/** Contenido de data/pricing.data.ts para unos datos dados. */
export function renderPricingDataModule(data: PricingData): string {
  return `/**
 * Precios que usa el backend para precargar las propuestas (planes RAG y
 * catálogo "otras soluciones a medida").
 *
 * GENERADO por \`npm run sync:pricing --workspace=apps/backend\`
 * (src/scripts/sync-pricing.ts) desde apps/web/src/lib/rag-plans.ts,
 * apps/web/src/lib/services-catalog.ts y apps/web/messages/offerings. No lo
 * edites a mano: cambia la web y vuelve a generarlo. La prueba
 * __tests__/unit/pricing-sync.test.ts falla si esta copia y la web divergen.
 */
import type { PricingData } from './pricing.types';

export const PRICING_DATA: PricingData = ${JSON.stringify(data, null, 2)};
`;
}
