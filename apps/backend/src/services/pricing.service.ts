/**
 * pricing.service.ts — precios para precargar las propuestas.
 *
 * Fuente: data/pricing.data.ts (copia generada de la web; ver
 * data/pricing.types.ts). Reglas (wiki 05 §9):
 *  - Planes RAG: precios fijos en COP y en USD (sin conversión).
 *  - Catálogo "otras soluciones": precios en COP; en una propuesta en USD se
 *    convierten con la tasa de la propuesta (`fxRate`, por defecto
 *    TRM_REFERENCIA = 3300) y se redondean a decenas, igual que /services.
 *  - Modalidad: los planes RAG son `piloto` (pago único) o `suscripcion`
 *    (setup + mensualidad); los productos del catálogo solo se cotizan como
 *    `compra` (setup + mantenimiento opcional). La suscripción SaaS de esos
 *    productos está en lista de espera (DECISIÓN 7) y se rechaza.
 */
import { z } from 'zod';
import { PRICING_DATA } from '../data/pricing.data';
import type { PricingOffering, PricingRagPlan, RagPlanId, TierKey } from '../data/pricing.types';
import { AppError } from '../middleware/errorHandler';
import {
  type Currency,
  type ProposalItemType,
  type ProposalModality,
  PROPOSAL_ITEM_TYPES,
  PROPOSAL_MODALITIES,
} from '../config/commerce';
import { normalizeAmount } from './proposal-calc';

export const TRM_REFERENCIA = PRICING_DATA.trmReferencia;
export const RAG_PLAN_IDS = PRICING_DATA.ragPlans.map((p) => p.id) as RagPlanId[];
export const TIER_KEYS: TierKey[] = ['basico', 'profesional', 'avanzado', 'enterprise'];

/** El producto RAG se vende con los planes RAG (no con su tarjeta del catálogo). */
const OFFERINGS_SOLD_AS_RAG_PLANS = new Set(['chatbot-rag-ia']);

export function getRagPlan(id: string): PricingRagPlan | undefined {
  return PRICING_DATA.ragPlans.find((p) => p.id === id);
}

export function getOffering(slug: string): PricingOffering | undefined {
  return PRICING_DATA.offerings.find((o) => o.slug === slug);
}

/** COP → USD con la tasa dada, redondeado a decenas (igual que `copToUsd` de la web). */
export function copToUsd(cop: number, fxRate: number): number {
  if (cop === 0) return 0;
  return Math.round(cop / fxRate / 10) * 10;
}

function fromCop(cop: number, currency: Currency, fxRate: number): number {
  return currency === 'COP' ? cop : copToUsd(cop, fxRate);
}

export interface PricedItem {
  tipo: ProposalItemType;
  planRag?: RagPlanId;
  offeringSlug?: string;
  plan?: string;
  modalidad: ProposalModality;
  descripcion: string;
  cantidad: number;
  setup: number;
  mensualidad: number;
  descuentoPct: number;
  /** Precio de lista (antes de cambios del equipo) y su origen. */
  precioLista: { setup: number; mensualidad: number; fuente: 'plan_rag' | 'catalogo' | 'manual' };
  /** Aclaraciones del precio ("Setup desde", "Mensualidad según SLA"). */
  notaPrecio?: string;
}

function ragPlanDescription(plan: PricingRagPlan): string {
  if (plan.id === 'piloto') return `${plan.nombre.es}: piloto de ${plan.weeks.min} semanas con tus documentos (pago único)`;
  return `Sistema RAG, plan ${plan.nombre.es}: implementación en ${plan.weeks.min}–${plan.weeks.max} semanas`;
}

function ragPlanNote(plan: PricingRagPlan): string | undefined {
  const notes: string[] = [];
  if (plan.setupIsFrom) notes.push('Setup desde (se ajusta al alcance)');
  if (plan.monthlyMode === 'sla') notes.push('Mensualidad según el SLA acordado');
  return notes.length ? notes.join(' · ') : undefined;
}

/** Ítem de un plan RAG con sus precios fijos en la moneda. */
export function ragPlanItem(id: RagPlanId, currency: Currency): PricedItem {
  const plan = getRagPlan(id);
  if (!plan) throw new AppError(`El plan RAG "${id}" no existe.`, 400, 'unknown_plan');
  const key = currency === 'COP' ? 'cop' : 'usd';
  const setup = plan.setup[key];
  const mensualidad = plan.monthlyMode === 'fixed' && plan.monthly ? plan.monthly[key] : 0;
  return {
    tipo: 'plan_rag',
    planRag: plan.id,
    modalidad: plan.id === 'piloto' ? 'piloto' : 'suscripcion',
    descripcion: ragPlanDescription(plan),
    cantidad: 1,
    setup,
    mensualidad,
    descuentoPct: 0,
    precioLista: { setup, mensualidad, fuente: 'plan_rag' },
    notaPrecio: ragPlanNote(plan),
  };
}

/** Ítem de un producto del catálogo (modalidad compra) en la moneda. */
export function offeringItem(slug: string, tier: TierKey, currency: Currency, fxRate: number): PricedItem {
  const offering = getOffering(slug);
  if (!offering) throw new AppError(`El producto "${slug}" no existe en el catálogo.`, 400, 'unknown_offering');
  const t = offering.tiers.find((x) => x.key === tier);
  if (!t) throw new AppError(`El producto "${slug}" no tiene el plan "${tier}".`, 400, 'unknown_tier');
  const setup = fromCop(t.compra.setupCOP, currency, fxRate);
  const mensualidad = fromCop(t.compra.mantenimientoCOP, currency, fxRate);
  return {
    tipo: 'producto',
    offeringSlug: offering.slug,
    plan: t.key,
    modalidad: 'compra',
    descripcion: `${offering.nombre.es}, plan ${t.nombre.es}: implementación (compra del software) en ${t.implementacionSemanas.min}–${t.implementacionSemanas.max} semanas; mensualidad = mantenimiento opcional`,
    cantidad: 1,
    setup,
    mensualidad,
    descuentoPct: 0,
    precioLista: { setup, mensualidad, fuente: 'catalogo' },
    notaPrecio: currency === 'USD' ? `Convertido de COP con TRM ${fxRate}` : undefined,
  };
}

export interface ProposalTemplate {
  id: string;
  grupo: 'planes_rag' | 'catalogo';
  nombre: string;
  item: PricedItem;
}

/** Plantillas de ítems en la moneda pedida: planes RAG y catálogo (modalidad compra). */
export function listTemplates(currency: Currency, fxRate: number = TRM_REFERENCIA): ProposalTemplate[] {
  const rag: ProposalTemplate[] = PRICING_DATA.ragPlans.map((p) => ({
    id: `rag:${p.id}`,
    grupo: 'planes_rag',
    nombre: p.id === 'piloto' ? p.nombre.es : `Plan RAG ${p.nombre.es}`,
    item: ragPlanItem(p.id, currency),
  }));
  const catalogo: ProposalTemplate[] = [];
  for (const o of PRICING_DATA.offerings) {
    if (OFFERINGS_SOLD_AS_RAG_PLANS.has(o.slug)) continue;
    for (const t of o.tiers) {
      catalogo.push({
        id: `producto:${o.slug}:${t.key}`,
        grupo: 'catalogo',
        nombre: `${o.nombre.es} · ${t.nombre.es}`,
        item: offeringItem(o.slug, t.key, currency, fxRate),
      });
    }
  }
  return [...rag, ...catalogo];
}

// ---------------------------------------------------------------------------
//   Entrada de ítems (crear/editar propuesta)
// ---------------------------------------------------------------------------

const money = z.coerce.number().finite().min(0).max(100_000_000_000);

export const ProposalItemInputSchema = z
  .object({
    /** Atajo: `rag:<plan>` o `producto:<slug>:<plan>` (ver GET /templates). */
    plantilla: z.string().trim().max(120).optional(),
    tipo: z.enum(PROPOSAL_ITEM_TYPES).optional(),
    planRag: z.string().trim().max(40).optional(),
    offeringSlug: z.string().trim().toLowerCase().max(80).optional(),
    plan: z.string().trim().max(40).optional(),
    modalidad: z.enum(PROPOSAL_MODALITIES).optional(),
    descripcion: z.string().trim().max(1000).optional(),
    cantidad: z.coerce.number().int().min(1).max(10_000).optional(),
    setup: money.optional(),
    mensualidad: money.optional(),
    descuentoPct: z.coerce.number().finite().min(0).max(100).optional(),
  })
  .strict();

export type ProposalItemInput = z.infer<typeof ProposalItemInputSchema>;

function parseTemplateId(id: string): { tipo: ProposalItemType; planRag?: string; offeringSlug?: string; plan?: string } {
  const [kind, a, b] = id.split(':');
  if (kind === 'rag' && a && !b) return { tipo: 'plan_rag', planRag: a };
  if (kind === 'producto' && a && b) return { tipo: 'producto', offeringSlug: a, plan: b };
  throw new AppError(`La plantilla "${id}" no existe.`, 400, 'unknown_template');
}

/**
 * Convierte la entrada de un ítem en un ítem con precios: si no trae precios
 * se precargan de la lista; si los trae (el equipo los ajustó) se respetan y
 * se conserva el precio de lista. Los totales siempre los calcula el servidor.
 */
export function expandItem(input: ProposalItemInput, currency: Currency, fxRate: number): PricedItem {
  const ref = input.plantilla ? parseTemplateId(input.plantilla) : { tipo: input.tipo, planRag: input.planRag, offeringSlug: input.offeringSlug, plan: input.plan };
  const tipo = ref.tipo ?? (ref.planRag ? 'plan_rag' : ref.offeringSlug ? 'producto' : 'personalizado');

  let base: PricedItem;
  if (tipo === 'plan_rag') {
    if (!ref.planRag || !RAG_PLAN_IDS.includes(ref.planRag as RagPlanId)) {
      throw new AppError(`El plan RAG "${ref.planRag ?? ''}" no existe.`, 400, 'unknown_plan');
    }
    base = ragPlanItem(ref.planRag as RagPlanId, currency);
    if (input.modalidad && input.modalidad !== base.modalidad) {
      throw new AppError(`El plan RAG ${ref.planRag} se cotiza con modalidad "${base.modalidad}".`, 422, 'invalid_modality');
    }
  } else if (tipo === 'producto') {
    if (!ref.offeringSlug) throw new AppError('Indica el producto del catálogo (offeringSlug).', 400, 'invalid_request', { fields: ['offeringSlug'] });
    const tier = (ref.plan ?? 'basico') as TierKey;
    if (!TIER_KEYS.includes(tier)) throw new AppError(`El plan "${ref.plan}" no existe (básico, profesional, avanzado o enterprise).`, 400, 'unknown_tier');
    if (input.modalidad === 'saas') {
      throw new AppError(
        'La suscripción SaaS de este producto está en lista de espera: cotízalo como compra (setup + mantenimiento opcional).',
        422,
        'saas_waitlist',
      );
    }
    if (input.modalidad && input.modalidad !== 'compra') {
      throw new AppError('Los productos del catálogo se cotizan con modalidad "compra".', 422, 'invalid_modality');
    }
    base = offeringItem(ref.offeringSlug, tier, currency, fxRate);
  } else {
    if (!input.descripcion) throw new AppError('Describe la línea personalizada.', 400, 'invalid_request', { fields: ['descripcion'] });
    if (input.modalidad && !['servicio', 'compra'].includes(input.modalidad)) {
      throw new AppError('Una línea personalizada usa la modalidad "servicio" o "compra".', 422, 'invalid_modality');
    }
    base = {
      tipo: 'personalizado',
      modalidad: input.modalidad ?? 'servicio',
      descripcion: input.descripcion,
      cantidad: 1,
      setup: 0,
      mensualidad: 0,
      descuentoPct: 0,
      precioLista: { setup: 0, mensualidad: 0, fuente: 'manual' },
    };
  }

  const setup = normalizeAmount(input.setup ?? base.setup, currency);
  const mensualidad = normalizeAmount(input.mensualidad ?? base.mensualidad, currency);
  const item: PricedItem = {
    ...base,
    descripcion: input.descripcion ?? base.descripcion,
    cantidad: input.cantidad ?? base.cantidad,
    setup,
    mensualidad,
    descuentoPct: input.descuentoPct ?? 0,
  };
  if (base.tipo === 'personalizado') item.precioLista = { setup, mensualidad, fuente: 'manual' };
  // El piloto es un pago único: no lleva mensualidad.
  if (item.modalidad === 'piloto' && item.mensualidad > 0) {
    throw new AppError('El Piloto RAG es un pago único: no lleva mensualidad.', 422, 'invalid_monthly');
  }
  return item;
}
