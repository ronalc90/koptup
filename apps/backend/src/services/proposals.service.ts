/**
 * proposals.service.ts — propuestas comerciales (wiki 05 §9, 03 etapas 10–12).
 *
 * Equipo: crear (desde plantillas de precios), editar en borrador, duplicar,
 * enviar (genera el enlace público; email si hay SMTP; SIEMPRE devuelve la
 * URL para copiarla o enviarla por WhatsApp), reenviar (enlace nuevo),
 * opciones de pago, confirmar el anticipo y convertir.
 * Público (token): ver (registra la vista y avisa la primera vez), aceptar
 * (una sola vez y solo si está vigente), rechazar y pagar con Wompi.
 * Portal: las propuestas de la cuenta.
 *
 * Los montos SIEMPRE los calcula el servidor (proposal-calc.ts). Las
 * transiciones usan actualizaciones condicionadas al estado de origen: un
 * doble clic no acepta dos veces ni convierte dos veces.
 */
import crypto from 'crypto';
import type { Request } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Proposal, { type IProposal, type IProposalItem } from '../models/Proposal';
import Lead, { type ILead } from '../models/Lead';
import User, { type IUser } from '../models/User';
import Project from '../models/Project';
import DemoGrant from '../models/DemoGrant';
import PaymentEvent, { type PaymentEventResult } from '../models/PaymentEvent';
import { nextSequence } from '../models/Counter';
import { AppError } from '../middleware/errorHandler';
import {
  CONVERTED_GRANT_DAYS,
  CURRENCIES,
  FX_RATE_MAX,
  FX_RATE_MIN,
  IVA_PCT,
  MAX_PROPOSAL_VALIDITY_DAYS,
  PROPOSAL_OPEN_STATES,
  PROPOSAL_STATES,
  type Currency,
  type ProposalState,
} from '../config/commerce';
import { frontendUrl } from '../config/demos';
import { hashIp, recordAudit } from './audit.service';
import { resolveClientIp } from '../middleware/client-ip';
import { hashToken, isWellFormedToken, issueMagicLink } from './magic-link.service';
import { amountInCents, computeTotals, formatMoney } from './proposal-calc';
import { ProposalItemInputSchema, TRM_REFERENCIA, expandItem, type PricedItem } from './pricing.service';
import { getCommerceSettings } from './commerce-settings.service';
import {
  advanceStage,
  changeStage,
  closeProposalRequest,
  leadPanelUrl,
  loadLead,
  logProposalActivity,
  normalizeLeadEmail,
  upsertLead,
  type LeadActor,
} from './leads.service';
import { awaitEmail, isTeamRole, needsActivation, type EmailOutcome } from './demo-grants.service';
import { emailService } from './email.service';
import { notifyTeamInBackground } from './team-notify.service';
import { sendAcceptedToClient, sendDepositReceivedToClient, sendProposalToClient, sendWelcomeClient } from './proposal-emails.service';
import {
  buildCheckoutUrl,
  eventEnvironmentFor,
  getWompiConfig,
  integritySignature,
  makePaymentReference,
  verifyEventChecksum,
  WOMPI_CURRENCY,
  type WompiEvent,
} from './wompi.service';
import { logger } from '../utils/logger';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Una conversión que lleva más de 5 min "en curso" se considera caída y se puede reintentar. */
const CONVERSION_STALE_MS = 5 * 60 * 1000;
const MAX_WOMPI_REFERENCES = 20;

export type StaffActor = LeadActor;

// ---------------------------------------------------------------------------
//   Utilidades
// ---------------------------------------------------------------------------

function isDuplicateKey(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: number }).code === 11000;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** URL pública de la propuesta (la página la arma la web en /propuesta/<token>). */
export function proposalPublicUrl(token: string): string {
  return `${frontendUrl()}/propuesta/${token}`;
}

function newPublicToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

/** Año en Colombia (UTC−5) para el consecutivo. */
function bogotaYear(now: Date): number {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000).getUTCFullYear();
}

export async function nextProposalNumber(now = new Date()): Promise<string> {
  const year = bogotaYear(now);
  const seq = await nextSequence(`proposal:${year}`);
  return `KOP-${year}-${String(seq).padStart(4, '0')}`;
}

/** Ítems con sus montos y totales calculados en el servidor. */
export function priceProposal(items: PricedItem[], opts: { moneda: Currency; ivaAplica: boolean; anticipoPct: number }) {
  const calc = computeTotals(items, { currency: opts.moneda, ivaAplica: opts.ivaAplica, anticipoPct: opts.anticipoPct });
  const priced: IProposalItem[] = items.map((it, i) => ({
    ...it,
    setupTotal: calc.items[i].setupTotal,
    mensualTotal: calc.items[i].mensualTotal,
    descuento: calc.items[i].setupDescuento + calc.items[i].mensualDescuento,
  }));
  return { items: priced, totales: calc.totales };
}

function isExpired(p: Pick<IProposal, 'estado' | 'validaHasta'>, now = new Date()): boolean {
  return PROPOSAL_OPEN_STATES.includes(p.estado) && !!p.validaHasta && p.validaHasta.getTime() <= now.getTime();
}

/** Marca vencida una propuesta abierta cuya validez pasó (idempotente). */
async function expireIfNeeded(p: IProposal, now = new Date()): Promise<IProposal> {
  if (!isExpired(p, now)) return p;
  const updated = await Proposal.findOneAndUpdate(
    { _id: p._id, estado: { $in: PROPOSAL_OPEN_STATES }, validaHasta: { $lte: now } },
    { $set: { estado: 'vencida', vencidaEn: now } },
    { new: true },
  );
  if (updated) await logProposalActivity(p.lead, `Propuesta ${p.numero} vencida sin respuesta.`, { numero: p.numero, propuesta: String(p._id) }, null);
  return updated ?? ((await Proposal.findById(p._id)) as IProposal);
}

function money(p: Pick<IProposal, 'moneda'>, amount: number): string {
  return formatMoney(amount, p.moneda);
}

// ---------------------------------------------------------------------------
//   Vistas
// ---------------------------------------------------------------------------

function itemView(i: IProposalItem) {
  return {
    tipo: i.tipo,
    planRag: i.planRag ?? null,
    offeringSlug: i.offeringSlug ?? null,
    plan: i.plan ?? null,
    modalidad: i.modalidad,
    descripcion: i.descripcion,
    cantidad: i.cantidad,
    setup: i.setup,
    mensualidad: i.mensualidad,
    descuentoPct: i.descuentoPct,
    setupTotal: i.setupTotal,
    mensualTotal: i.mensualTotal,
    notaPrecio: i.notaPrecio ?? null,
  };
}

/** Métodos de pago del anticipo que se ofrecen de verdad (sin promesas sin respaldo). */
export function paymentMethods(p: IProposal, instruccionesPorDefecto: string) {
  const instrucciones = p.pago?.instrucciones?.trim() || instruccionesPorDefecto.trim() || null;
  return {
    enlace: p.pago?.enlacePago || null,
    transferencia: instrucciones,
    wompi: !!getWompiConfig() && p.moneda === WOMPI_CURRENCY && (p.totales?.anticipo ?? 0) > 0,
  };
}

export function proposalStaffView(p: IProposal, instruccionesPorDefecto = '') {
  return {
    id: String(p._id),
    numero: p.numero,
    titulo: p.titulo,
    lead: p.lead ? String(p.lead) : null,
    usuario: p.usuario ? String(p.usuario) : null,
    cliente: { nombre: p.cliente.nombre, email: p.cliente.email, empresa: p.cliente.empresa ?? null, telefono: p.cliente.telefono ?? null },
    responsable: p.responsable ? String(p.responsable) : null,
    creadoPor: p.creadoPor ? String(p.creadoPor) : null,
    moneda: p.moneda,
    fxRate: p.fxRate,
    ivaAplica: p.ivaAplica,
    ivaPct: p.ivaPct,
    items: p.items.map((i) => ({ ...itemView(i), precioLista: i.precioLista })),
    totales: p.totales,
    anticipoPct: p.anticipoPct,
    validezDias: p.validezDias,
    validaHasta: p.validaHasta ?? null,
    alcance: p.alcance ?? null,
    condiciones: p.condiciones ?? null,
    exclusiones: p.exclusiones ?? null,
    estado: isExpired(p) ? ('vencida' as ProposalState) : p.estado,
    enlacePublicoActivo: !!p.tokenHash,
    enviadaEn: p.enviadaEn ?? null,
    ultimoEnvioEn: p.ultimoEnvioEn ?? null,
    envios: p.envios ?? 0,
    vistas: { total: p.vistas?.total ?? 0, primera: p.vistas?.primera ?? null, ultima: p.vistas?.ultima ?? null },
    aceptacion: p.aceptacion ? { nombre: p.aceptacion.nombre, email: p.aceptacion.email, fecha: p.aceptacion.fecha } : null,
    rechazo: p.rechazo ? { motivo: p.rechazo.motivo ?? null, fecha: p.rechazo.fecha } : null,
    vencidaEn: p.vencidaEn ?? null,
    pago: {
      estado: p.pago?.estado ?? 'pendiente',
      enlacePago: p.pago?.enlacePago ?? null,
      instrucciones: p.pago?.instrucciones ?? null,
      referencia: p.pago?.referencia ?? null,
      proveedor: p.pago?.proveedor ?? null,
      confirmadoPor: p.pago?.confirmadoPor ? String(p.pago.confirmadoPor) : null,
      confirmadoPorEmail: p.pago?.confirmadoPorEmail ?? null,
      fecha: p.pago?.fecha ?? null,
      monto: p.pago?.monto ?? null,
      nota: p.pago?.nota ?? null,
      metodos: paymentMethods(p, instruccionesPorDefecto),
      wompi: {
        referencias: (p.pago?.wompi?.referencias ?? []).map((r) => ({ referencia: r.referencia, montoCentavos: r.montoCentavos, creadaEn: r.creadaEn })),
        transaccionId: p.pago?.wompi?.transaccionId ?? null,
        estado: p.pago?.wompi?.estado ?? null,
      },
    },
    projectId: p.projectId ? String(p.projectId) : null,
    convertidaEn: p.conversion?.convertidaEn ?? null,
    duplicadaDe: p.duplicadaDe ? String(p.duplicadaDe) : null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

/** Lo que ve el cliente (enlace público o portal): sin datos internos. */
export function proposalPublicView(p: IProposal, instruccionesPorDefecto = '') {
  const estado = isExpired(p) ? ('vencida' as ProposalState) : p.estado;
  const vigente = PROPOSAL_OPEN_STATES.includes(estado);
  const aceptada = estado === 'aceptada' || estado === 'convertida';
  return {
    numero: p.numero,
    titulo: p.titulo,
    cliente: { nombre: p.cliente.nombre, empresa: p.cliente.empresa ?? null },
    moneda: p.moneda,
    ivaAplica: p.ivaAplica,
    ivaPct: p.ivaPct,
    notaIva: p.ivaAplica ? `Incluye IVA del ${p.ivaPct} %.` : 'Valores más IVA si aplica.',
    items: p.items.map(itemView),
    totales: p.totales,
    anticipoPct: p.anticipoPct,
    validaHasta: p.validaHasta ?? null,
    alcance: p.alcance ?? null,
    condiciones: p.condiciones ?? null,
    exclusiones: p.exclusiones ?? null,
    estado,
    puedeResponder: vigente,
    enviadaEn: p.enviadaEn ?? null,
    aceptacion: p.aceptacion ? { nombre: p.aceptacion.nombre, fecha: p.aceptacion.fecha } : null,
    rechazo: p.rechazo ? { fecha: p.rechazo.fecha } : null,
    pago: aceptada
      ? {
          estado: p.pago?.estado ?? 'pendiente',
          anticipo: p.totales?.anticipo ?? 0,
          fecha: p.pago?.estado === 'recibido' ? p.pago?.fecha ?? null : null,
          metodos: p.pago?.estado === 'recibido' ? { enlace: null, transferencia: null, wompi: false } : paymentMethods(p, instruccionesPorDefecto),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
//   Esquemas de entrada
// ---------------------------------------------------------------------------

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const httpsUrl = z
  .string()
  .trim()
  .max(1000)
  .url('Escribe un enlace válido.')
  .refine((v) => /^https:\/\//i.test(v), 'El enlace de pago debe empezar por https://');

const ClienteSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre del cliente.').max(160),
  email: z.string().trim().max(254).email('Escribe un email válido.'),
  empresa: optionalText(160),
  telefono: optionalText(40),
});

const BaseFields = {
  titulo: optionalText(200),
  moneda: z.enum(CURRENCIES).optional(),
  fxRate: z.coerce.number().finite().min(FX_RATE_MIN).max(FX_RATE_MAX).optional(),
  ivaAplica: z.boolean().optional(),
  items: z.array(ProposalItemInputSchema).min(1, 'Agrega al menos un ítem.').max(30).optional(),
  anticipoPct: z.coerce.number().int().min(0).max(100).optional(),
  validezDias: z.coerce.number().int().min(1).max(MAX_PROPOSAL_VALIDITY_DAYS).optional(),
  alcance: optionalText(8000),
  condiciones: optionalText(8000),
  exclusiones: optionalText(8000),
  enlacePago: httpsUrl.optional(),
  instruccionesPago: optionalText(4000),
};

export const CreateProposalSchema = z
  .object({
    leadId: optionalText(40),
    cliente: ClienteSchema.optional(),
    ...BaseFields,
  })
  .strict()
  .refine((b) => !!b.leadId || !!b.cliente, { message: 'Indica el lead (leadId) o los datos del cliente.', path: ['leadId'] })
  .refine((b) => !!b.items && b.items.length > 0, { message: 'Agrega al menos un ítem.', path: ['items'] });

export const UpdateProposalSchema = z
  .object({
    cliente: ClienteSchema.omit({ email: true }).partial().optional(),
    ...BaseFields,
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'No hay cambios para guardar.' });

export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;
export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;

function defaultTitle(items: PricedItem[], empresa?: string | null, nombre?: string): string {
  const first = items[0];
  const base =
    first?.tipo === 'plan_rag'
      ? first.planRag === 'piloto'
        ? 'Piloto RAG'
        : `Sistema RAG plan ${first.planRag}`
      : first?.tipo === 'producto'
        ? first.descripcion.split(',')[0]
        : 'Propuesta KopTup';
  const extra = items.length > 1 ? ` y ${items.length - 1} ítem${items.length - 1 === 1 ? '' : 's'} más` : '';
  return `${base}${extra} · ${empresa || nombre || 'Cliente'}`.slice(0, 200);
}

// ---------------------------------------------------------------------------
//   Equipo: CRUD
// ---------------------------------------------------------------------------

export async function loadProposal(id: string): Promise<IProposal> {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Propuesta no encontrada', 404, 'not_found');
  const p = await Proposal.findById(id);
  if (!p) throw new AppError('Propuesta no encontrada', 404, 'not_found');
  return p;
}

export async function createProposal(body: CreateProposalInput, actor: StaffActor, req?: Request) {
  let lead: ILead;
  if (body.leadId) {
    lead = await loadLead(body.leadId);
  } else {
    const c = body.cliente!;
    lead = (await upsertLead({ email: c.email, nombre: c.nombre, empresa: c.empresa, telefono: c.telefono, source: 'manual' })).lead;
  }
  const settings = await getCommerceSettings();
  const moneda: Currency = body.moneda ?? 'COP';
  const fxRate = body.fxRate ?? TRM_REFERENCIA;
  const anticipoPct = body.anticipoPct ?? settings.anticipoPctPorDefecto;
  const ivaAplica = body.ivaAplica ?? false;
  const expanded = body.items!.map((i) => expandItem(i, moneda, fxRate));
  const { items, totales } = priceProposal(expanded, { moneda, ivaAplica, anticipoPct });
  const usuario = lead.usuario ?? (await User.findOne({ email: lead.email }).select('_id').lean())?._id ?? null;
  const cliente = {
    nombre: body.cliente?.nombre ?? lead.nombre,
    email: lead.email,
    empresa: body.cliente?.empresa ?? lead.empresa ?? undefined,
    telefono: body.cliente?.telefono ?? lead.telefono ?? undefined,
  };

  let doc: IProposal | null = null;
  for (let attempt = 0; attempt < 3 && !doc; attempt += 1) {
    try {
      doc = await Proposal.create({
        numero: await nextProposalNumber(),
        titulo: body.titulo ?? defaultTitle(expanded, cliente.empresa, cliente.nombre),
        lead: lead._id,
        usuario,
        cliente,
        responsable: lead.responsable ?? actor.id,
        creadoPor: actor.id,
        moneda,
        fxRate,
        ivaAplica,
        ivaPct: IVA_PCT,
        items,
        totales,
        anticipoPct,
        validezDias: body.validezDias ?? settings.validezDiasPorDefecto,
        alcance: body.alcance,
        condiciones: body.condiciones,
        exclusiones: body.exclusiones,
        estado: 'borrador',
        pago: { estado: 'pendiente', enlacePago: body.enlacePago ?? null, instrucciones: body.instruccionesPago ?? null },
      });
    } catch (err) {
      // Un número repetido solo puede venir de un contador reiniciado a mano: se pide el siguiente.
      if (!isDuplicateKey(err)) throw err;
    }
  }
  if (!doc) throw new AppError('No se pudo numerar la propuesta. Intenta de nuevo.', 500);

  await recordAudit({
    actor,
    accion: 'proposal.create',
    entidad: { tipo: 'Proposal', id: String(doc._id) },
    detalle: { numero: doc.numero, lead: String(lead._id), email: lead.email, moneda, total: totales.total, items: items.length },
    req,
  });
  return proposalStaffView(doc, settings.instruccionesTransferencia);
}

export async function updateProposal(id: string, body: UpdateProposalInput, actor: StaffActor, req?: Request) {
  const p = await loadProposal(id);
  if (p.estado !== 'borrador') {
    throw new AppError('Solo se edita una propuesta en borrador. Duplícala para hacer una versión nueva.', 409, 'not_draft');
  }
  const moneda: Currency = body.moneda ?? p.moneda;
  const fxRate = body.fxRate ?? p.fxRate;
  if ((moneda !== p.moneda || fxRate !== p.fxRate) && !body.items) {
    throw new AppError('Si cambias la moneda o la tasa, envía de nuevo los ítems para recalcular los precios.', 400, 'items_required', { fields: ['items'] });
  }
  const anticipoPct = body.anticipoPct ?? p.anticipoPct;
  const ivaAplica = body.ivaAplica ?? p.ivaAplica;
  const expanded: PricedItem[] = body.items
    ? body.items.map((i) => expandItem(i, moneda, fxRate))
    : p.items.map((i) => ({
        tipo: i.tipo,
        planRag: i.planRag as PricedItem['planRag'],
        offeringSlug: i.offeringSlug,
        plan: i.plan,
        modalidad: i.modalidad,
        descripcion: i.descripcion,
        cantidad: i.cantidad,
        setup: i.setup,
        mensualidad: i.mensualidad,
        descuentoPct: i.descuentoPct,
        precioLista: i.precioLista,
        notaPrecio: i.notaPrecio,
      }));
  const { items, totales } = priceProposal(expanded, { moneda, ivaAplica, anticipoPct });

  const set: Record<string, unknown> = { moneda, fxRate, ivaAplica, anticipoPct, items, totales };
  if (body.titulo) set.titulo = body.titulo;
  if (body.validezDias) set.validezDias = body.validezDias;
  for (const k of ['alcance', 'condiciones', 'exclusiones'] as const) if (body[k] !== undefined) set[k] = body[k];
  if (body.enlacePago !== undefined) set['pago.enlacePago'] = body.enlacePago;
  if (body.instruccionesPago !== undefined) set['pago.instrucciones'] = body.instruccionesPago;
  if (body.cliente) {
    for (const k of ['nombre', 'empresa', 'telefono'] as const) if (body.cliente[k]) set[`cliente.${k}`] = body.cliente[k];
  }
  const updated = await Proposal.findOneAndUpdate({ _id: p._id, estado: 'borrador' }, { $set: set }, { new: true });
  if (!updated) throw new AppError('La propuesta cambió de estado mientras tanto.', 409, 'not_draft');
  await recordAudit({
    actor,
    accion: 'proposal.update',
    entidad: { tipo: 'Proposal', id: String(p._id) },
    detalle: { numero: p.numero, campos: Object.keys(body), totalAntes: p.totales.total, totalDespues: totales.total },
    req,
  });
  const settings = await getCommerceSettings();
  return proposalStaffView(updated, settings.instruccionesTransferencia);
}

export async function deleteDraft(id: string, actor: StaffActor, req?: Request) {
  const p = await loadProposal(id);
  if (p.estado !== 'borrador') throw new AppError('Solo se puede borrar una propuesta en borrador.', 409, 'not_draft');
  const res = await Proposal.deleteOne({ _id: p._id, estado: 'borrador' });
  if (res.deletedCount === 0) throw new AppError('La propuesta cambió de estado mientras tanto.', 409, 'not_draft');
  await recordAudit({ actor, accion: 'proposal.delete', entidad: { tipo: 'Proposal', id: String(p._id) }, detalle: { numero: p.numero }, req });
  return { id: String(p._id), numero: p.numero };
}

export async function duplicateProposal(id: string, actor: StaffActor, req?: Request) {
  const p = await loadProposal(id);
  const settings = await getCommerceSettings();
  let doc: IProposal | null = null;
  for (let attempt = 0; attempt < 3 && !doc; attempt += 1) {
    try {
      doc = await Proposal.create({
        numero: await nextProposalNumber(),
        titulo: p.titulo,
        lead: p.lead,
        usuario: p.usuario ?? null,
        cliente: p.cliente,
        responsable: p.responsable ?? actor.id,
        creadoPor: actor.id,
        moneda: p.moneda,
        fxRate: p.fxRate,
        ivaAplica: p.ivaAplica,
        ivaPct: p.ivaPct,
        items: p.items,
        totales: p.totales,
        anticipoPct: p.anticipoPct,
        validezDias: p.validezDias,
        alcance: p.alcance,
        condiciones: p.condiciones,
        exclusiones: p.exclusiones,
        estado: 'borrador',
        pago: { estado: 'pendiente', enlacePago: p.pago?.enlacePago ?? null, instrucciones: p.pago?.instrucciones ?? null },
        duplicadaDe: p._id,
      });
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
    }
  }
  if (!doc) throw new AppError('No se pudo numerar la propuesta. Intenta de nuevo.', 500);
  await recordAudit({
    actor,
    accion: 'proposal.duplicate',
    entidad: { tipo: 'Proposal', id: String(doc._id) },
    detalle: { numero: doc.numero, origen: p.numero },
    req,
  });
  return proposalStaffView(doc, settings.instruccionesTransferencia);
}

export async function listProposals(params: { estado?: ProposalState; lead?: string; q?: string; page: number; limit: number }) {
  const now = new Date();
  const filter: Record<string, unknown> = {};
  if (params.lead && mongoose.Types.ObjectId.isValid(params.lead)) filter.lead = params.lead;
  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q), 'i');
    filter.$or = [{ numero: rx }, { titulo: rx }, { 'cliente.nombre': rx }, { 'cliente.email': rx }, { 'cliente.empresa': rx }];
  }
  const base = { ...filter };
  if (params.estado === 'vencida') {
    Object.assign(filter, { $and: [{ $or: [{ estado: 'vencida' }, { estado: { $in: PROPOSAL_OPEN_STATES }, validaHasta: { $lte: now } }] }] });
  } else if (params.estado && PROPOSAL_OPEN_STATES.includes(params.estado)) {
    Object.assign(filter, { estado: params.estado, $nor: [{ validaHasta: { $lte: now } }] });
  } else if (params.estado) {
    filter.estado = params.estado;
  }
  const [total, docs, counts, settings] = await Promise.all([
    Proposal.countDocuments(filter),
    Proposal.find(filter)
      .sort({ createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit),
    Proposal.aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: '$estado', n: { $sum: 1 } } }]),
    getCommerceSettings(),
  ]);
  const conteos: Record<string, number> = Object.fromEntries(PROPOSAL_STATES.map((s) => [s, 0]));
  for (const c of counts) conteos[c._id] = c.n;
  return {
    items: docs.map((d) => proposalStaffView(d, settings.instruccionesTransferencia)),
    total,
    page: params.page,
    pages: Math.max(1, Math.ceil(total / params.limit)),
    conteos,
  };
}

export async function getProposalDetail(id: string) {
  const p = await loadProposal(id);
  const settings = await getCommerceSettings();
  const AuditLog = (await import('../models/AuditLog')).default;
  const historial = await AuditLog.find({ 'entidad.tipo': 'Proposal', 'entidad.id': String(p._id) }).sort({ createdAt: -1 }).limit(100).lean();
  return {
    proposal: proposalStaffView(p, settings.instruccionesTransferencia),
    historial: historial.map((h) => ({ accion: h.accion, actorEmail: h.actorEmail ?? null, actorRol: h.actorRol ?? null, detalle: h.detalle ?? null, fecha: h.createdAt })),
  };
}

// ---------------------------------------------------------------------------
//   Envío
// ---------------------------------------------------------------------------

function whatsappShare(p: IProposal, url: string): { mensaje: string; url: string } {
  const mensaje = `Hola ${p.cliente.nombre}, te comparto la propuesta ${p.numero} de KopTup (${p.titulo}): ${url}`;
  const digits = (p.cliente.telefono ?? '').replace(/\D/g, '');
  const phone = digits.length >= 10 ? (digits.length === 10 ? `57${digits}` : digits) : '';
  return { mensaje, url: `https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}` };
}

export interface SendResult {
  proposal: ReturnType<typeof proposalStaffView>;
  url: string;
  whatsapp: { mensaje: string; url: string };
  email: EmailOutcome;
}

/**
 * Enviar (desde borrador) o reenviar (enviada, vista o aceptada). Cada envío
 * emite un token nuevo: el enlace anterior deja de funcionar. La URL se
 * devuelve SIEMPRE para copiarla o compartirla por WhatsApp.
 */
export async function sendProposal(id: string, actor: StaffActor, opts: { reenvio: boolean; req?: Request }): Promise<SendResult> {
  let p = await loadProposal(id);
  const now = new Date();
  p = await expireIfNeeded(p, now);
  const { token, hash } = newPublicToken();
  let updated: IProposal | null;
  if (!opts.reenvio) {
    if (p.estado !== 'borrador') throw new AppError('Esta propuesta ya se envió: usa "Reenviar".', 409, 'already_sent', { estado: p.estado });
    if (!p.items.length) throw new AppError('La propuesta no tiene ítems.', 400, 'no_items');
    const usuario = p.usuario ?? (await User.findOne({ email: p.cliente.email }).select('_id').lean())?._id ?? null;
    updated = await Proposal.findOneAndUpdate(
      { _id: p._id, estado: 'borrador' },
      {
        $set: {
          estado: 'enviada',
          tokenHash: hash,
          tokenEmitidoEn: now,
          enviadaEn: now,
          ultimoEnvioEn: now,
          validaHasta: new Date(now.getTime() + p.validezDias * DAY_MS),
          usuario,
        },
        $inc: { envios: 1 },
      },
      { new: true },
    );
    if (!updated) throw new AppError('Esta propuesta ya se envió.', 409, 'already_sent');
  } else {
    if (!['enviada', 'vista', 'aceptada'].includes(p.estado)) {
      const msg =
        p.estado === 'vencida'
          ? 'La propuesta venció: duplícala para enviar una versión nueva.'
          : p.estado === 'borrador'
            ? 'La propuesta aún no se ha enviado: usa "Enviar".'
            : `No se puede reenviar una propuesta ${p.estado}.`;
      throw new AppError(msg, 409, p.estado === 'vencida' ? 'proposal_expired' : 'invalid_state', { estado: p.estado });
    }
    updated = await Proposal.findOneAndUpdate(
      { _id: p._id, estado: p.estado },
      { $set: { tokenHash: hash, tokenEmitidoEn: now, ultimoEnvioEn: now }, $inc: { envios: 1 } },
      { new: true },
    );
    if (!updated) throw new AppError('La propuesta cambió de estado mientras tanto.', 409, 'invalid_state');
  }

  const url = proposalPublicUrl(token);
  const email = await awaitEmail(() =>
    sendProposalToClient({
      to: updated!.cliente.email,
      nombre: updated!.cliente.nombre,
      numero: updated!.numero,
      titulo: updated!.titulo,
      url,
      validaHasta: updated!.validaHasta!,
      total: money(updated!, updated!.totales.total),
      mensual: updated!.totales.mensualTotal > 0 ? money(updated!, updated!.totales.mensualTotal) : null,
      reenvio: opts.reenvio,
    }),
  );

  if (!opts.reenvio) {
    await closeProposalRequest(updated.lead, actor, `Se envió la propuesta ${updated.numero}: la solicitud de propuesta queda atendida.`);
    const lead = await Lead.findById(updated.lead);
    if (lead) await advanceStage(lead, 'propuesta', { actor, nota: `Propuesta ${updated.numero} enviada.`, req: opts.req });
  }
  await logProposalActivity(
    updated.lead,
    `Propuesta ${updated.numero} ${opts.reenvio ? 'reenviada' : 'enviada'} (${money(updated, updated.totales.total)}${updated.totales.mensualTotal > 0 ? ` + ${money(updated, updated.totales.mensualTotal)}/mes` : ''}).`,
    { numero: updated.numero, propuesta: String(updated._id), total: updated.totales.total, moneda: updated.moneda, emailEnviado: email.enviado },
    actor,
  );
  await recordAudit({
    actor,
    accion: opts.reenvio ? 'proposal.resend' : 'proposal.send',
    entidad: { tipo: 'Proposal', id: String(updated._id) },
    detalle: { numero: updated.numero, email: updated.cliente.email, emailEnviado: email.enviado, validaHasta: updated.validaHasta, envios: updated.envios },
    req: opts.req,
  });
  const settings = await getCommerceSettings();
  return { proposal: proposalStaffView(updated, settings.instruccionesTransferencia), url, whatsapp: whatsappShare(updated, url), email };
}

// ---------------------------------------------------------------------------
//   Pago del anticipo
// ---------------------------------------------------------------------------

export const PaymentOptionsSchema = z
  .object({
    enlacePago: z.union([httpsUrl, z.null()]).optional(),
    instrucciones: z.union([z.string().trim().max(4000), z.null()]).optional(),
  })
  .strict()
  .refine((b) => b.enlacePago !== undefined || b.instrucciones !== undefined, { message: 'No hay cambios para guardar.' });

export async function updatePaymentOptions(id: string, body: { enlacePago?: string | null; instrucciones?: string | null }, actor: StaffActor, req?: Request) {
  const p = await loadProposal(id);
  if (['rechazada', 'convertida'].includes(p.estado) || p.pago?.estado === 'recibido') {
    throw new AppError('El anticipo ya no está pendiente en esta propuesta.', 409, 'invalid_state', { estado: p.estado });
  }
  const set: Record<string, unknown> = {};
  if (body.enlacePago !== undefined) set['pago.enlacePago'] = body.enlacePago || null;
  if (body.instrucciones !== undefined) set['pago.instrucciones'] = body.instrucciones || null;
  const updated = await Proposal.findOneAndUpdate({ _id: p._id, 'pago.estado': 'pendiente' }, { $set: set }, { new: true });
  if (!updated) throw new AppError('El anticipo ya se registró.', 409, 'deposit_received');
  await recordAudit({
    actor,
    accion: 'proposal.payment_options',
    entidad: { tipo: 'Proposal', id: String(p._id) },
    detalle: { numero: p.numero, enlacePago: body.enlacePago !== undefined ? !!body.enlacePago : undefined, instrucciones: body.instrucciones !== undefined ? !!body.instrucciones : undefined },
    req,
  });
  const settings = await getCommerceSettings();
  return proposalStaffView(updated, settings.instruccionesTransferencia);
}

export const MarkPaidSchema = z
  .object({
    referencia: z.string().trim().min(2, 'Escribe la referencia del pago.').max(200),
    proveedor: z.enum(['transferencia', 'enlace', 'otro']).optional(),
    fecha: z.coerce.date().optional(),
    nota: optionalText(1000),
  })
  .strict();

/** Marca el anticipo como recibido (manual o Wompi). Condicionado a pendiente + aceptada. */
async function applyDepositReceived(
  p: IProposal,
  data: { proveedor: 'transferencia' | 'enlace' | 'otro' | 'wompi'; referencia: string; fecha: Date; nota?: string; actor: StaffActor | null; wompiTx?: { id: string; estado: string } },
  req?: Request,
): Promise<IProposal | null> {
  const set: Record<string, unknown> = {
    'pago.estado': 'recibido',
    'pago.referencia': data.referencia,
    'pago.proveedor': data.proveedor,
    'pago.fecha': data.fecha,
    'pago.nota': data.nota ?? null,
    'pago.monto': p.totales.anticipo,
    'pago.confirmadoPor': data.actor?.id ?? null,
    'pago.confirmadoPorEmail': data.actor?.email ?? (data.proveedor === 'wompi' ? 'wompi' : null),
  };
  if (data.wompiTx) {
    set['pago.wompi.transaccionId'] = data.wompiTx.id;
    set['pago.wompi.estado'] = data.wompiTx.estado;
  }
  const updated = await Proposal.findOneAndUpdate({ _id: p._id, estado: 'aceptada', 'pago.estado': 'pendiente' }, { $set: set }, { new: true });
  if (!updated) return null;

  const montoTxt = money(updated, updated.totales.anticipo);
  await logProposalActivity(
    updated.lead,
    `Anticipo de la propuesta ${updated.numero} recibido (${montoTxt}, ${data.proveedor}, ref. ${data.referencia}).`,
    { numero: updated.numero, propuesta: String(updated._id), proveedor: data.proveedor, referencia: data.referencia },
    data.actor,
  );
  await recordAudit({
    actor: data.actor ?? { email: 'wompi', role: 'pasarela' },
    accion: 'proposal.payment_received',
    entidad: { tipo: 'Proposal', id: String(updated._id) },
    detalle: { numero: updated.numero, proveedor: data.proveedor, referencia: data.referencia, monto: updated.totales.anticipo, moneda: updated.moneda, fecha: data.fecha },
    req,
  });
  void notifyTeamInBackground({
    asunto: `Anticipo recibido: ${updated.numero}`,
    lineas: [
      `${updated.cliente.nombre}${updated.cliente.empresa ? ` (${updated.cliente.empresa})` : ''} pagó el anticipo de ${montoTxt} (${data.proveedor}, ref. ${data.referencia}).`,
      'Ya puedes convertir la propuesta en proyecto desde el panel.',
    ],
    enlace: `${frontendUrl()}/admin/propuestas/${String(updated._id)}`,
  });
  if (emailService.isConfigured()) {
    void sendDepositReceivedToClient({ to: updated.cliente.email, nombre: updated.cliente.nombre, numero: updated.numero, titulo: updated.titulo, monto: montoTxt }).catch(() => false);
  }
  return updated;
}

export async function markDepositReceived(
  id: string,
  body: { referencia: string; proveedor?: 'transferencia' | 'enlace' | 'otro'; fecha?: Date; nota?: string },
  actor: StaffActor,
  req?: Request,
) {
  const p = await loadProposal(id);
  if (p.pago?.estado === 'recibido') throw new AppError('El anticipo de esta propuesta ya estaba registrado.', 409, 'deposit_received');
  if (p.estado !== 'aceptada') {
    throw new AppError('El anticipo se registra cuando el cliente ya aceptó la propuesta.', 409, 'not_accepted', { estado: p.estado });
  }
  const updated = await applyDepositReceived(p, {
    proveedor: body.proveedor ?? 'transferencia',
    referencia: body.referencia,
    fecha: body.fecha ?? new Date(),
    nota: body.nota,
    actor,
  }, req);
  if (!updated) throw new AppError('El anticipo ya se registró o la propuesta cambió de estado.', 409, 'deposit_received');
  const settings = await getCommerceSettings();
  return proposalStaffView(updated, settings.instruccionesTransferencia);
}

// ---------------------------------------------------------------------------
//   Conversión a cliente
// ---------------------------------------------------------------------------

export interface ConversionResult {
  yaConvertida: boolean;
  proposal: ReturnType<typeof proposalStaffView>;
  project: { id: string; name: string; status: string } | null;
  user: { id: string; email: string; name: string; role: string; accountStatus: string; cuentaNueva: boolean } | null;
  grantsConvertidos: number;
  activationUrl: string | null;
  loginUrl: string;
  email: EmailOutcome;
}

async function conversionSnapshot(p: IProposal, settingsInstr: string): Promise<ConversionResult> {
  const project = p.projectId ? await Project.findById(p.projectId).select('name status').lean() : null;
  const user = p.usuario ? await User.findById(p.usuario).select('email name role accountStatus').lean() : null;
  return {
    yaConvertida: true,
    proposal: proposalStaffView(p, settingsInstr),
    project: project ? { id: String(project._id), name: project.name, status: project.status } : null,
    user: user ? { id: String(user._id), email: user.email, name: user.name, role: user.role, accountStatus: user.accountStatus ?? 'activo', cuentaNueva: false } : null,
    grantsConvertidos: 0,
    activationUrl: null,
    loginUrl: `${frontendUrl()}/login?redirect=${encodeURIComponent('/dashboard')}`,
    email: { configurado: emailService.isConfigured(), enviado: false },
  };
}

/**
 * Convierte una propuesta aceptada con anticipo recibido: crea el Project
 * (estado planning) ligado al usuario (lo crea como `client` invitado con
 * enlace de activación si no existe), pasa el rol prospect/user → client,
 * los accesos a demos → `convertido` con 90 días de referencia y el lead →
 * `ganado`. Idempotente: una segunda llamada devuelve lo ya creado.
 */
export async function convertProposal(id: string, actor: StaffActor, req?: Request): Promise<ConversionResult> {
  const p = await loadProposal(id);
  const settings = await getCommerceSettings();
  if (p.estado === 'convertida') return conversionSnapshot(p, settings.instruccionesTransferencia);
  if (p.estado !== 'aceptada') {
    throw new AppError('Solo se convierte una propuesta aceptada por el cliente.', 409, 'not_accepted', { estado: isExpired(p) ? 'vencida' : p.estado });
  }
  if (p.pago?.estado !== 'recibido') {
    throw new AppError('Registra primero el anticipo recibido.', 409, 'deposit_pending');
  }

  const email = await normalizeLeadEmail(p.cliente.email);
  let user: IUser | null = p.usuario ? await User.findById(p.usuario) : null;
  if (!user) user = await User.findOne({ email });
  if (user && isTeamRole(user.role)) {
    throw new AppError('El email del cliente pertenece a una cuenta del equipo de KopTup.', 422, 'team_email');
  }

  const now = new Date();
  const claimed = await Proposal.findOneAndUpdate(
    {
      _id: p._id,
      estado: 'aceptada',
      'pago.estado': 'recibido',
      $or: [{ conversion: null }, { 'conversion.enCursoDesde': null }, { 'conversion.enCursoDesde': { $lt: new Date(now.getTime() - CONVERSION_STALE_MS) } }],
    },
    { $set: { conversion: { enCursoDesde: now, convertidaEn: null, convertidaPor: null } } },
    { new: true },
  );
  if (!claimed) {
    const current = await loadProposal(id);
    if (current.estado === 'convertida') return conversionSnapshot(current, settings.instruccionesTransferencia);
    throw new AppError('La conversión de esta propuesta ya está en curso.', 409, 'conversion_in_progress');
  }

  try {
    // 1. Cuenta del cliente.
    let cuentaNueva = false;
    let rolAnterior: string | null = null;
    if (!user) {
      try {
        user = await User.create({
          email,
          name: p.cliente.nombre,
          role: 'client',
          provider: 'local',
          accountStatus: 'invitado',
          company: p.cliente.empresa,
          phone: p.cliente.telefono,
        });
        cuentaNueva = true;
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        user = await User.findOne({ email });
        if (!user) throw err;
      }
    }
    if (user.role === 'prospect' || user.role === 'user') {
      rolAnterior = user.role;
      user.role = 'client';
      await user.save();
      await recordAudit({
        actor,
        accion: 'user.role_change',
        entidad: { tipo: 'User', id: String(user._id) },
        detalle: { email: user.email, de: rolAnterior, a: 'client', motivo: `Conversión de la propuesta ${p.numero}` },
        req,
      });
    }
    const activation = needsActivation(user)
      ? await issueMagicLink({ userId: user._id as mongoose.Types.ObjectId, proposito: 'activacion', creadoPor: actor.id })
      : null;

    // 2. Proyecto (único por propuesta: índice único en proposal_id).
    let project = await Project.findOne({ proposal_id: p._id });
    if (!project) {
      try {
        project = await Project.create({
          name: p.titulo,
          description: [p.alcance, ...p.items.map((i) => `• ${i.descripcion}`)].filter(Boolean).join('\n').slice(0, 5000),
          client_id: user._id,
          manager_id: p.responsable ?? actor.id,
          status: 'planning',
          priority: 'medium',
          budget: p.totales.total,
          currency: p.moneda,
          start_date: now,
          proposal_id: p._id,
        });
      } catch (err) {
        if (!isDuplicateKey(err)) throw err;
        project = await Project.findOne({ proposal_id: p._id });
        if (!project) throw err;
      }
    }

    // 3. Accesos a demos → convertido con 90 días de referencia.
    const hasta = new Date(now.getTime() + CONVERTED_GRANT_DAYS * DAY_MS);
    const grants = await DemoGrant.updateMany(
      { user: user._id, estado: { $in: ['activo', 'expirado'] } },
      { $set: { estado: 'convertido', expiresAt: hasta, convertidoEn: now, propuesta: p._id, recordatorioEnviadoEn: null } },
    );
    const grantsConvertidos = grants.modifiedCount ?? 0;

    // 4. Lead → ganado (y ligado a la cuenta).
    await Lead.updateOne({ _id: p.lead, usuario: null }, { $set: { usuario: user._id } });
    const lead = await Lead.findById(p.lead);
    if (lead && lead.etapa !== 'ganado') {
      await changeStage(lead, 'ganado', { actor, nota: `Propuesta ${p.numero} convertida en proyecto.`, req });
    }

    // 5. Propuesta → convertida.
    const done = await Proposal.findOneAndUpdate(
      { _id: p._id, estado: 'aceptada' },
      {
        $set: {
          estado: 'convertida',
          projectId: project._id,
          usuario: user._id,
          conversion: { enCursoDesde: null, convertidaEn: now, convertidaPor: actor.id },
        },
      },
      { new: true },
    );
    if (!done) throw new AppError('La propuesta cambió de estado durante la conversión.', 409, 'invalid_state');

    await logProposalActivity(p.lead, `Propuesta ${p.numero} convertida: proyecto "${project.name}" creado.`, { numero: p.numero, propuesta: String(p._id), proyecto: String(project._id) }, actor);
    await recordAudit({
      actor,
      accion: 'proposal.convert',
      entidad: { tipo: 'Proposal', id: String(p._id) },
      detalle: {
        numero: p.numero,
        proyecto: String(project._id),
        usuario: String(user._id),
        email: user.email,
        cuentaNueva,
        rolAnterior,
        grantsConvertidos,
        accesoReferenciaHasta: hasta,
        lead: String(p.lead),
        enlaceActivacion: activation ? 'emitido' : 'no_necesario',
      },
      req,
    });

    const loginUrl = `${frontendUrl()}/login?redirect=${encodeURIComponent('/dashboard')}`;
    const mail = await awaitEmail(() =>
      sendWelcomeClient({
        to: user!.email,
        nombre: user!.name,
        numero: p.numero,
        titulo: p.titulo,
        proyecto: project!.name,
        activationUrl: activation?.url ?? null,
        loginUrl,
      }),
    );

    return {
      yaConvertida: false,
      proposal: proposalStaffView(done, settings.instruccionesTransferencia),
      project: { id: String(project._id), name: project.name, status: project.status },
      user: { id: String(user._id), email: user.email, name: user.name, role: user.role, accountStatus: user.accountStatus ?? 'activo', cuentaNueva },
      grantsConvertidos,
      activationUrl: activation?.url ?? null,
      loginUrl,
      email: mail,
    };
  } catch (err) {
    // Libera el reclamo para poder reintentar (los pasos hechos son idempotentes).
    await Proposal.updateOne({ _id: p._id, estado: 'aceptada' }, { $set: { conversion: null } }).catch(() => undefined);
    throw err;
  }
}

// ---------------------------------------------------------------------------
//   Público (token)
// ---------------------------------------------------------------------------

async function findByToken(token: unknown): Promise<IProposal> {
  if (!isWellFormedToken(token)) throw new AppError('Propuesta no encontrada', 404, 'not_found');
  const p = await Proposal.findOne({ tokenHash: hashToken(token) });
  if (!p || p.estado === 'borrador') throw new AppError('Propuesta no encontrada', 404, 'not_found');
  return p;
}

/** Ve la propuesta por su enlace. Registra la vista (salvo `registrar: false`) y avisa la primera vez. */
export async function viewPublicProposal(token: unknown, opts: { registrar: boolean; req?: Request }) {
  let p = await findByToken(token);
  const now = new Date();
  p = await expireIfNeeded(p, now);
  if (opts.registrar) {
    const first = await Proposal.findOneAndUpdate(
      { _id: p._id, 'vistas.primera': null },
      { $set: { 'vistas.primera': now } },
      { new: true },
    );
    const set: Record<string, unknown> = { 'vistas.ultima': now };
    const updated = await Proposal.findOneAndUpdate({ _id: p._id }, { $inc: { 'vistas.total': 1 }, $set: set }, { new: true });
    if (updated) p = updated;
    if (p.estado === 'enviada') {
      p = (await Proposal.findOneAndUpdate({ _id: p._id, estado: 'enviada' }, { $set: { estado: 'vista' } }, { new: true })) ?? p;
    }
    if (first) {
      await logProposalActivity(p.lead, `El cliente abrió la propuesta ${p.numero} por primera vez.`, { numero: p.numero, propuesta: String(p._id) }, null);
      const responsable = p.responsable ? await User.findById(p.responsable).select('email').lean() : null;
      void notifyTeamInBackground({
        asunto: `Propuesta vista: ${p.numero}`,
        lineas: [`${p.cliente.nombre}${p.cliente.empresa ? ` (${p.cliente.empresa})` : ''} abrió la propuesta "${p.titulo}" por primera vez.`],
        enlace: `${frontendUrl()}/admin/propuestas/${String(p._id)}`,
        copiaA: [responsable?.email],
      });
    }
  }
  const settings = await getCommerceSettings();
  return proposalPublicView(p, settings.instruccionesTransferencia);
}

export const AcceptSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre completo.').max(160),
    email: z.string().trim().max(254).email('Escribe un email válido.'),
    acepto: z.literal(true, { errorMap: () => ({ message: 'Debes confirmar que aceptas la propuesta y sus condiciones.' }) }),
  })
  .strict();

export const RejectSchema = z.object({ motivo: optionalText(2000) }).strict();

async function acceptDoc(p: IProposal, signer: { nombre: string; email: string }, req?: Request, token?: string) {
  const now = new Date();
  p = await expireIfNeeded(p, now);
  if (p.estado === 'vencida') throw new AppError('Esta propuesta venció. Escríbenos y te enviamos una actualizada.', 410, 'proposal_expired');
  if (p.estado === 'aceptada' || p.estado === 'convertida') throw new AppError('Esta propuesta ya fue aceptada.', 409, 'already_accepted');
  if (p.estado === 'rechazada') throw new AppError('Esta propuesta fue rechazada. Escríbenos si quieres retomarla.', 409, 'already_rejected');
  const updated = await Proposal.findOneAndUpdate(
    { _id: p._id, estado: { $in: PROPOSAL_OPEN_STATES }, validaHasta: { $gt: now } },
    {
      $set: {
        estado: 'aceptada',
        aceptacion: {
          nombre: signer.nombre,
          email: signer.email.toLowerCase(),
          fecha: now,
          ipHash: req ? hashIp(resolveClientIp(req)) : undefined,
          userAgent: req?.get('user-agent')?.slice(0, 300),
        },
      },
    },
    { new: true },
  );
  if (!updated) {
    const current = (await Proposal.findById(p._id))!;
    if (current.estado === 'aceptada' || current.estado === 'convertida') throw new AppError('Esta propuesta ya fue aceptada.', 409, 'already_accepted');
    if (isExpired(current, now) || current.estado === 'vencida') throw new AppError('Esta propuesta venció.', 410, 'proposal_expired');
    throw new AppError('Esta propuesta ya no admite respuesta.', 409, 'invalid_state', { estado: current.estado });
  }
  const settings = await getCommerceSettings();
  const metodos = paymentMethods(updated, settings.instruccionesTransferencia);
  const anticipoTxt = money(updated, updated.totales.anticipo);
  await logProposalActivity(updated.lead, `${signer.nombre} aceptó la propuesta ${updated.numero}. Anticipo: ${anticipoTxt}.`, { numero: updated.numero, propuesta: String(updated._id) }, null);
  await recordAudit({
    actor: { email: signer.email.toLowerCase(), role: 'cliente' },
    accion: 'proposal.accept',
    entidad: { tipo: 'Proposal', id: String(updated._id) },
    detalle: { numero: updated.numero, nombre: signer.nombre, email: signer.email.toLowerCase(), total: updated.totales.total, anticipo: updated.totales.anticipo, moneda: updated.moneda },
    req,
  });
  const responsable = updated.responsable ? await User.findById(updated.responsable).select('email').lean() : null;
  void notifyTeamInBackground({
    asunto: `Propuesta aceptada: ${updated.numero}`,
    lineas: [
      `${signer.nombre} <${signer.email}> aceptó la propuesta "${updated.titulo}".`,
      `Total: ${money(updated, updated.totales.total)} · Anticipo (${updated.anticipoPct} %): ${anticipoTxt}.`,
      metodos.enlace || metodos.transferencia || metodos.wompi
        ? 'El cliente ve los métodos de pago del anticipo en la propuesta.'
        : 'La propuesta no tiene método de pago: agrega el enlace de pago o las instrucciones de transferencia.',
    ],
    enlace: `${frontendUrl()}/admin/propuestas/${String(updated._id)}`,
    copiaA: [responsable?.email],
  });
  if (emailService.isConfigured()) {
    void sendAcceptedToClient({
      to: updated.cliente.email,
      nombre: updated.cliente.nombre,
      numero: updated.numero,
      titulo: updated.titulo,
      anticipo: anticipoTxt,
      enlacePago: metodos.enlace,
      instrucciones: metodos.transferencia,
      wompi: metodos.wompi,
      url: token ? proposalPublicUrl(token) : null,
    }).catch(() => false);
  }
  return proposalPublicView(updated, settings.instruccionesTransferencia);
}

async function rejectDoc(p: IProposal, motivo: string | undefined, actorEmail: string | null, req?: Request) {
  const now = new Date();
  p = await expireIfNeeded(p, now);
  if (p.estado === 'vencida') throw new AppError('Esta propuesta ya venció.', 410, 'proposal_expired');
  if (p.estado === 'aceptada' || p.estado === 'convertida') throw new AppError('Esta propuesta ya fue aceptada.', 409, 'already_accepted');
  if (p.estado === 'rechazada') throw new AppError('Ya nos habías indicado que no te interesa esta propuesta.', 409, 'already_rejected');
  const updated = await Proposal.findOneAndUpdate(
    { _id: p._id, estado: { $in: PROPOSAL_OPEN_STATES }, validaHasta: { $gt: now } },
    { $set: { estado: 'rechazada', rechazo: { motivo: motivo ?? null, fecha: now, ipHash: req ? hashIp(resolveClientIp(req)) : undefined } } },
    { new: true },
  );
  if (!updated) throw new AppError('Esta propuesta ya no admite respuesta.', 409, 'invalid_state');
  await logProposalActivity(updated.lead, `El cliente rechazó la propuesta ${updated.numero}${motivo ? `: ${motivo}` : '.'}`, { numero: updated.numero, propuesta: String(updated._id), motivo: motivo ?? null }, null);
  await recordAudit({
    actor: actorEmail ? { email: actorEmail, role: 'cliente' } : null,
    accion: 'proposal.reject',
    entidad: { tipo: 'Proposal', id: String(updated._id) },
    detalle: { numero: updated.numero, motivo: motivo ?? null },
    req,
  });
  const responsable = updated.responsable ? await User.findById(updated.responsable).select('email').lean() : null;
  void notifyTeamInBackground({
    asunto: `Propuesta rechazada: ${updated.numero}`,
    lineas: [`${updated.cliente.nombre} rechazó la propuesta "${updated.titulo}".`, motivo ? `Motivo: ${motivo}` : 'No indicó motivo.'],
    enlace: leadPanelUrl(updated.lead),
    copiaA: [responsable?.email],
  });
  const settings = await getCommerceSettings();
  return proposalPublicView(updated, settings.instruccionesTransferencia);
}

export async function acceptPublicProposal(token: unknown, body: { nombre: string; email: string }, req?: Request) {
  return acceptDoc(await findByToken(token), body, req, token as string);
}

export async function rejectPublicProposal(token: unknown, motivo: string | undefined, req?: Request) {
  return rejectDoc(await findByToken(token), motivo, null, req);
}

/**
 * Inicia el pago del anticipo con Wompi (Web Checkout): referencia nueva
 * (`<número>-<sufijo>`), monto en centavos y firma de integridad calculados
 * en el servidor. Solo COP, solo con la propuesta aceptada y el anticipo
 * pendiente, y solo si Wompi está configurado.
 */
export async function startWompiCheckout(token: string, req?: Request) {
  const cfg = getWompiConfig();
  if (!cfg) throw new AppError('El pago en línea no está disponible.', 404, 'wompi_disabled');
  const p = await findByToken(token);
  if (p.estado !== 'aceptada') throw new AppError('Primero acepta la propuesta.', 409, 'not_accepted', { estado: p.estado });
  if (p.pago?.estado === 'recibido') throw new AppError('El anticipo ya está pagado.', 409, 'deposit_received');
  if (p.moneda !== WOMPI_CURRENCY) throw new AppError('El pago en línea con Wompi solo está disponible en COP.', 422, 'currency_not_supported');
  const amountCents = amountInCents(p.totales.anticipo);
  if (amountCents <= 0) throw new AppError('Esta propuesta no tiene anticipo por pagar.', 422, 'no_deposit');

  const referencia = makePaymentReference(p.numero);
  const signature = integritySignature({ reference: referencia, amountInCents: amountCents, currency: WOMPI_CURRENCY }, cfg.integritySecret);
  const refs = [...(p.pago?.wompi?.referencias ?? []), { referencia, montoCentavos: amountCents, creadaEn: new Date() }].slice(-MAX_WOMPI_REFERENCES);
  const updated = await Proposal.findOneAndUpdate(
    { _id: p._id, estado: 'aceptada', 'pago.estado': 'pendiente' },
    { $set: { 'pago.wompi.referencias': refs } },
    { new: true },
  );
  if (!updated) throw new AppError('El anticipo ya no está pendiente.', 409, 'deposit_received');
  const checkoutUrl = buildCheckoutUrl({
    publicKey: cfg.publicKey,
    reference: referencia,
    amountInCents: amountCents,
    currency: WOMPI_CURRENCY,
    signature,
    redirectUrl: proposalPublicUrl(token),
    customerEmail: p.cliente.email,
    customerName: p.cliente.nombre,
  });
  await recordAudit({
    actor: { email: p.cliente.email, role: 'cliente' },
    accion: 'proposal.wompi_checkout',
    entidad: { tipo: 'Proposal', id: String(p._id) },
    detalle: { numero: p.numero, referencia, montoCentavos: amountCents, ambiente: cfg.env },
    req,
  });
  return { checkoutUrl, referencia, montoCentavos: amountCents, moneda: WOMPI_CURRENCY, ambiente: cfg.env };
}

/** Resultado del webhook (siempre 200 salvo checksum inválido o Wompi apagado). */
export interface WompiEventOutcome {
  status: 200 | 401 | 404;
  resultado: PaymentEventResult | 'checksum_invalido' | 'wompi_apagado' | 'duplicado' | 'evento_ignorado';
  propuesta?: string;
}

export async function processWompiEvent(event: WompiEvent, headerChecksum: string | undefined, req?: Request): Promise<WompiEventOutcome> {
  const cfg = getWompiConfig();
  if (!cfg) return { status: 404, resultado: 'wompi_apagado' };
  if (!verifyEventChecksum(event, cfg.eventsSecret, headerChecksum)) {
    logger.warn('[wompi] Evento con checksum inválido: descartado');
    return { status: 401, resultado: 'checksum_invalido' };
  }
  if (event.event !== 'transaction.updated' || !event.data?.transaction?.id) {
    return { status: 200, resultado: 'evento_ignorado' };
  }
  const tx = event.data.transaction;
  const clave = `wompi:${tx.id}:${tx.status ?? 'SIN_ESTADO'}`;
  let record;
  try {
    record = await PaymentEvent.create({
      proveedor: 'wompi',
      clave,
      evento: event.event,
      transaccionId: String(tx.id),
      referencia: tx.reference,
      estado: tx.status,
      montoCentavos: typeof tx.amount_in_cents === 'number' ? tx.amount_in_cents : undefined,
      moneda: tx.currency,
      ambiente: event.environment,
      resultado: 'ignorado',
    });
  } catch (err) {
    if (isDuplicateKey(err)) return { status: 200, resultado: 'duplicado' };
    throw err;
  }

  const finish = async (resultado: PaymentEventResult, propuestaId?: mongoose.Types.ObjectId): Promise<WompiEventOutcome> => {
    await PaymentEvent.updateOne({ _id: record._id }, { $set: { resultado, propuesta: propuestaId ?? null } });
    if (resultado !== 'aplicado' && resultado !== 'no_aprobado' && resultado !== 'ya_pagada') {
      logger.warn(`[wompi] Evento ${clave} no aplicado: ${resultado}`);
    }
    return { status: 200, resultado, propuesta: propuestaId ? String(propuestaId) : undefined };
  };

  if (event.environment !== eventEnvironmentFor(cfg.env)) return finish('ambiente_no_coincide');
  const p = tx.reference ? await Proposal.findOne({ 'pago.wompi.referencias.referencia': tx.reference }) : null;
  if (!p) return finish('referencia_desconocida');
  const pid = p._id as mongoose.Types.ObjectId;
  if (tx.status) await Proposal.updateOne({ _id: pid, 'pago.estado': 'pendiente' }, { $set: { 'pago.wompi.estado': tx.status, 'pago.wompi.transaccionId': String(tx.id) } });
  if (tx.status !== 'APPROVED') return finish('no_aprobado', pid);
  if (tx.currency !== WOMPI_CURRENCY || p.moneda !== WOMPI_CURRENCY) return finish('moneda_no_coincide', pid);
  const ref = p.pago?.wompi?.referencias?.find((r) => r.referencia === tx.reference);
  if (!ref || tx.amount_in_cents !== ref.montoCentavos || tx.amount_in_cents !== amountInCents(p.totales.anticipo)) return finish('monto_no_coincide', pid);
  if (p.pago?.estado === 'recibido') return finish('ya_pagada', pid);
  if (p.estado !== 'aceptada') return finish('estado_no_permite', pid);
  const applied = await applyDepositReceived(
    p,
    { proveedor: 'wompi', referencia: String(tx.id), fecha: new Date(), nota: `Wompi ${tx.payment_method_type ?? ''} · ref. ${tx.reference}`.trim(), actor: null, wompiTx: { id: String(tx.id), estado: tx.status } },
    req,
  );
  if (!applied) {
    const current = await Proposal.findById(pid).select('pago.estado').lean();
    return finish(current?.pago?.estado === 'recibido' ? 'ya_pagada' : 'estado_no_permite', pid);
  }
  return finish('aplicado', pid);
}

// ---------------------------------------------------------------------------
//   Portal (cuenta autenticada)
// ---------------------------------------------------------------------------

async function myFilter(user: { id: string; email: string }): Promise<Record<string, unknown>> {
  const email = await normalizeLeadEmail(user.email);
  return { $or: [{ usuario: user.id }, { 'cliente.email': email }], estado: { $ne: 'borrador' } };
}

export async function listMyProposals(user: { id: string; email: string }) {
  if (!mongoose.Types.ObjectId.isValid(user.id)) return [];
  const [docs, settings] = await Promise.all([Proposal.find(await myFilter(user)).sort({ createdAt: -1 }).limit(100), getCommerceSettings()]);
  return docs.map((d) => ({ id: String(d._id), ...proposalPublicView(d, settings.instruccionesTransferencia) }));
}

async function loadMine(user: { id: string; email: string }, id: string): Promise<IProposal> {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Propuesta no encontrada', 404, 'not_found');
  const p = await Proposal.findOne({ _id: id, ...(await myFilter(user)) });
  if (!p) throw new AppError('Propuesta no encontrada', 404, 'not_found');
  return p;
}

export async function getMyProposal(user: { id: string; email: string }, id: string) {
  const p = await expireIfNeeded(await loadMine(user, id));
  const settings = await getCommerceSettings();
  return { id: String(p._id), ...proposalPublicView(p, settings.instruccionesTransferencia) };
}

export async function acceptMyProposal(user: { id: string; email: string; name?: string }, id: string, nombre: string | undefined, req?: Request) {
  const p = await loadMine(user, id);
  const view = await acceptDoc(p, { nombre: nombre || user.name || p.cliente.nombre, email: user.email }, req);
  return { id: String(p._id), ...view };
}

export async function rejectMyProposal(user: { id: string; email: string }, id: string, motivo: string | undefined, req?: Request) {
  const p = await loadMine(user, id);
  const view = await rejectDoc(p, motivo, user.email, req);
  return { id: String(p._id), ...view };
}

// ---------------------------------------------------------------------------
//   Vencimiento (job)
// ---------------------------------------------------------------------------

/** Marca `vencida` las propuestas enviadas o vistas cuya validez pasó. */
export async function expireProposals(now = new Date()): Promise<number> {
  const candidates = await Proposal.find({ estado: { $in: PROPOSAL_OPEN_STATES }, validaHasta: { $lte: now } }).select('_id lead numero').limit(1000).lean();
  let n = 0;
  for (const c of candidates) {
    const res = await Proposal.updateOne({ _id: c._id, estado: { $in: PROPOSAL_OPEN_STATES }, validaHasta: { $lte: now } }, { $set: { estado: 'vencida', vencidaEn: now } });
    if (res.modifiedCount > 0) {
      n += 1;
      await logProposalActivity(c.lead, `Propuesta ${c.numero} vencida sin respuesta.`, { numero: c.numero, propuesta: String(c._id) }, null);
    }
  }
  return n;
}

