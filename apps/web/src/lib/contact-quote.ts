/**
 * Cotización que llega a /contact por la URL.
 *
 *  - Planes RAG (`/services#planes-rag`, `/rag`, `/chatbots-ia`):
 *    `?service=sistema-rag&plan=<piloto|esencial|profesional|empresarial>`.
 *  - "Otras soluciones a medida" › Cotizar este tier (OfferingsCatalog):
 *    `?service=<slug del catálogo>&tier=<nivel>&modality=<compra|saas>`.
 *  - Demos y portal: `?service=<slug del catálogo>` (sin nivel ni modalidad).
 *
 * Solo se aceptan valores conocidos: un slug que no está en el catálogo, un
 * plan, nivel o modalidad desconocidos se ignoran (el formulario no muestra
 * identificadores técnicos ni los guarda en el lead). La página arma los
 * nombres legibles con las traducciones; el backend recibe además los
 * identificadores en `quote` (Contact.cotizacion).
 */
import { OFFERINGS, slugToOfferingNamespace, type TierKey } from './services-catalog';
import { RAG_SERVICE_SLUG, isRagPlanId, type RagPlanId } from './rag-plans';

export const QUOTE_TIERS: readonly TierKey[] = ['basico', 'profesional', 'avanzado', 'enterprise'];
export const QUOTE_MODALITIES = ['compra', 'saas'] as const;
export type QuoteModality = (typeof QUOTE_MODALITIES)[number];

/**
 * Servicios que no están en el catálogo pero que el portal todavía enlaza
 * (`/dashboard`). Su nombre está en `contactPage.quote.legacyServices`.
 */
export const LEGACY_QUOTE_SERVICES = ['agente-ia-ventas', 'desarrollo-web', 'auditoria-cups', 'liquidacion'] as const;
type LegacyQuoteService = (typeof LEGACY_QUOTE_SERVICES)[number];

/**
 * Slugs que equivalen a los planes RAG. `chatbot-rag-ia` es el producto del
 * catálogo que reemplazaron los planes RAG (no tiene tarjeta en /services).
 */
const RAG_ALIASES = new Set([RAG_SERVICE_SLUG, 'chatbot-rag-ia']);

const OFFERING_SLUGS = new Set(OFFERINGS.map((o) => o.slug));

export type ContactQuote =
  | { kind: 'rag'; service: typeof RAG_SERVICE_SLUG; plan: RagPlanId | null }
  | { kind: 'offering'; service: string; tier: TierKey | null; modality: QuoteModality | null }
  | { kind: 'legacy'; service: LegacyQuoteService };

interface ParamsLike {
  get(name: string): string | null;
}

function clean(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function isQuoteTier(value: string): value is TierKey {
  return (QUOTE_TIERS as readonly string[]).includes(value);
}

export function isQuoteModality(value: string): value is QuoteModality {
  return (QUOTE_MODALITIES as readonly string[]).includes(value);
}

function isLegacyService(value: string): value is LegacyQuoteService {
  return (LEGACY_QUOTE_SERVICES as readonly string[]).includes(value);
}

/** Lee `service`, `plan`, `tier` y `modality` de la URL de /contact. */
export function parseContactQuote(params: ParamsLike | null | undefined): ContactQuote | null {
  if (!params) return null;
  const service = clean(params.get('service'));
  if (!service) return null;

  if (RAG_ALIASES.has(service)) {
    const plan = clean(params.get('plan'));
    return { kind: 'rag', service: RAG_SERVICE_SLUG, plan: isRagPlanId(plan) ? plan : null };
  }
  if (OFFERING_SLUGS.has(service)) {
    const tier = clean(params.get('tier'));
    const modality = clean(params.get('modality'));
    return {
      kind: 'offering',
      service,
      tier: isQuoteTier(tier) ? tier : null,
      modality: isQuoteModality(modality) ? modality : null,
    };
  }
  if (isLegacyService(service)) return { kind: 'legacy', service };
  return null;
}

/** Namespace de next-intl con el nombre de una solución del catálogo. */
export function offeringNameKey(slug: string): string {
  return `${slugToOfferingNamespace(slug)}.name`;
}

/**
 * Datos de la cotización que viajan al backend junto con el formulario
 * (`POST /api/contact`, campo `quote`). Sin textos: solo identificadores.
 */
export interface ContactQuotePayload {
  service: string;
  plan?: RagPlanId;
  tier?: TierKey;
  modality?: QuoteModality;
}

export function quotePayload(quote: ContactQuote | null): ContactQuotePayload | undefined {
  if (!quote) return undefined;
  if (quote.kind === 'rag') return { service: quote.service, ...(quote.plan ? { plan: quote.plan } : {}) };
  if (quote.kind === 'offering') {
    return {
      service: quote.service,
      ...(quote.tier ? { tier: quote.tier } : {}),
      ...(quote.modality ? { modality: quote.modality } : {}),
    };
  }
  return { service: quote.service };
}
