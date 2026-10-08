/**
 * leads.service.ts — pipeline comercial (wiki 05 §8 y 03 etapas 8–10).
 *
 *  - Un `Lead` por email (normalizado igual que el login) reúne todos sus
 *    `Contact`: el formulario de contacto, "Prueba con tu documento" y
 *    "Solicitar demo" siguen guardando su Contact como antes
 *    (lead.service.ts) y además actualizan el Lead (`syncLeadFromContact`).
 *  - Los contactos anteriores al pipeline se migran al arrancar
 *    (`migrateContactsToLeads`, idempotente: solo toca los Contact sin
 *    `lead`, y nunca borra ni cambia sus datos).
 *  - Etapas: nuevo → contactado → demo → propuesta → ganado | perdido. El
 *    sistema solo las hace avanzar (nunca retroceder): registrar contacto con
 *    el lead lo pasa a `contactado`, conceder demos a `demo`, pedir o enviar
 *    una propuesta a `propuesta` y convertir la propuesta a `ganado`. El
 *    equipo puede moverlo a cualquier etapa; `perdido` exige motivo.
 *  - Cada cambio de etapa deja una actividad `cambio_etapa`; las acciones
 *    del equipo quedan además en AuditLog.
 */
import type { Request } from 'express';
import mongoose from 'mongoose';
import Lead, { type ILead } from '../models/Lead';
import LeadActivity, { type ILeadActivity } from '../models/LeadActivity';
import Contact, { type IContact } from '../models/Contact';
import User from '../models/User';
import DemoRequest from '../models/DemoRequest';
import DemoGrant from '../models/DemoGrant';
import Proposal from '../models/Proposal';
import { AppError } from '../middleware/errorHandler';
import {
  LEAD_OWNER_ROLES,
  LEAD_STAGE_ORDER,
  LEAD_STAGES,
  TASK_PREPARE_PROPOSAL,
  type LeadActivityType,
  type LeadLostReason,
  type LeadSource,
  type LeadStage,
} from '../config/commerce';
import { frontendUrl } from '../config/demos';
import { normalizeEmailLikeAuth } from '../utils/email-address';
import { addBusinessDays } from '../utils/business-days';
import { recordAudit } from './audit.service';
import { getCatalogMap } from './demo-catalog.service';
import { grantView } from './demo-grants.service';
import { notifyTeamInBackground } from './team-notify.service';
import { logger } from '../utils/logger';

export interface LeadActor {
  id: string;
  email: string;
  role: string;
}

const CONTACT_ACTIVITY_TYPES: readonly LeadActivityType[] = ['llamada', 'email', 'whatsapp', 'reunion'];

function isDuplicateKey(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: number }).code === 11000;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Email del lead: normalizado como el login; si no valida, en minúsculas. */
export async function normalizeLeadEmail(raw: string): Promise<string> {
  return (await normalizeEmailLikeAuth(raw)) ?? raw.trim().toLowerCase();
}

export function leadPanelUrl(leadId: string | mongoose.Types.ObjectId): string {
  return `${frontendUrl()}/admin/leads/${String(leadId)}`;
}

// ---------------------------------------------------------------------------
//   Alta / actualización (adaptador de Contact)
// ---------------------------------------------------------------------------

export interface UpsertLeadArgs {
  email: string;
  nombre: string;
  empresa?: string | null;
  telefono?: string | null;
  source: LeadSource;
  interes?: string | null;
  fecha?: Date;
  usuarioId?: string | mongoose.Types.ObjectId | null;
}

/**
 * Crea o actualiza el lead de un email. Solo usa operaciones idempotentes
 * ($setOnInsert, $addToSet, $max): procesar dos veces la misma entrada no
 * duplica nada. Completa empresa, teléfono y cuenta si el lead no los tenía.
 */
export async function upsertLead(args: UpsertLeadArgs): Promise<{ lead: ILead; creado: boolean }> {
  const email = await normalizeLeadEmail(args.email);
  const fecha = args.fecha ?? new Date();
  const now = new Date();
  const interes = args.interes?.trim().slice(0, 200) || null;
  const update = {
    $setOnInsert: {
      email,
      nombre: (args.nombre || email).trim().slice(0, 160),
      etapa: 'nuevo' as LeadStage,
      etapaCambiadaEn: fecha,
      origenPrincipal: args.source,
      contactos: 0,
      createdAt: fecha,
    },
    $addToSet: { origenes: args.source, ...(interes ? { intereses: interes } : {}) },
    $max: { ultimaActividadEn: fecha },
    $set: { updatedAt: now },
  };
  let lead: ILead | null = null;
  let creado = false;
  for (let attempt = 0; attempt < 2 && !lead; attempt += 1) {
    try {
      const res = await Lead.findOneAndUpdate({ email }, update, { upsert: true, new: true, timestamps: false, includeResultMetadata: true });
      lead = res.value;
      creado = !!res.lastErrorObject?.upserted;
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
    }
  }
  if (!lead) throw new AppError('No se pudo registrar el lead.', 500);

  const fill: Record<string, unknown> = {};
  if (!lead.empresa && args.empresa?.trim()) fill.empresa = args.empresa.trim().slice(0, 160);
  if (!lead.telefono && args.telefono?.trim()) fill.telefono = args.telefono.trim().slice(0, 40);
  if (!lead.usuario) {
    const userId = args.usuarioId ?? (await User.findOne({ email }).select('_id').lean())?._id ?? null;
    if (userId) fill.usuario = userId;
  }
  if (Object.keys(fill).length) {
    lead = (await Lead.findByIdAndUpdate(lead._id, { $set: fill }, { new: true })) ?? lead;
  }
  return { lead, creado };
}

/**
 * Liga un Contact a su lead (adaptador del pipeline). `reabrirPerdido`: un
 * lead `perdido` que vuelve a escribir regresa a `nuevo` (wiki 04 §6.3).
 */
export async function syncLeadFromContact(
  contact: Pick<IContact, '_id' | 'name' | 'email' | 'phone' | 'company' | 'service' | 'source' | 'created_at'>,
  opts: { reabrirPerdido?: boolean } = {},
): Promise<{ lead: ILead; creado: boolean; ligado: boolean }> {
  const source = (contact.source ?? 'contact-form') as LeadSource;
  const { lead, creado } = await upsertLead({
    email: contact.email,
    nombre: contact.name,
    empresa: contact.company,
    telefono: contact.phone,
    source,
    interes: contact.service,
    fecha: contact.created_at ?? new Date(),
  });
  // El contacto se cuenta una sola vez aunque dos procesos lo liguen a la vez.
  const linked = await Contact.updateOne(
    { _id: contact._id, $or: [{ lead: { $exists: false } }, { lead: null }] },
    { $set: { lead: lead._id } },
  );
  const ligado = linked.modifiedCount > 0;
  let current = lead;
  if (ligado) current = (await Lead.findByIdAndUpdate(lead._id, { $inc: { contactos: 1 } }, { new: true })) ?? lead;
  if (ligado && opts.reabrirPerdido && current.etapa === 'perdido') {
    current = await changeStage(current, 'nuevo', { actor: null, nota: 'Volvió a escribir: se reabre el lead.', automatico: true });
  }
  return { lead: current, creado, ligado };
}

/** Hook de lead.service: nunca hace fallar el registro del contacto. */
export async function syncLeadFromContactSafe(contact: IContact): Promise<ILead | null> {
  try {
    const { lead } = await syncLeadFromContact(contact, { reabrirPerdido: true });
    return lead;
  } catch (err) {
    logger.error(`[leads] No se pudo ligar el contacto ${String(contact._id)} a su lead: ${(err as Error)?.message ?? err}`);
    return null;
  }
}

export interface MigrationResult {
  contactosProcesados: number;
  leadsCreados: number;
  etapasDerivadas: number;
}

/**
 * Migra los Contact sin lead (los anteriores al pipeline) sin perder datos:
 * crea o actualiza su lead y los liga. La etapa inicial se deriva de lo que
 * ya pasó: un contacto `responded` → `contactado`; una cuenta con accesos a
 * demos → `demo`. Idempotente: una segunda corrida no encuentra pendientes.
 */
export async function migrateContactsToLeads(opts: { batchSize?: number } = {}): Promise<MigrationResult> {
  const batchSize = opts.batchSize ?? 500;
  const touched = new Set<string>();
  const created = new Set<string>();
  let contactosProcesados = 0;
  for (;;) {
    const batch = await Contact.find({ $or: [{ lead: { $exists: false } }, { lead: null }] })
      .sort({ created_at: 1 })
      .limit(batchSize);
    if (batch.length === 0) break;
    let progress = 0;
    for (const contact of batch) {
      try {
        const { lead, creado, ligado } = await syncLeadFromContact(contact);
        if (ligado) progress += 1;
        touched.add(String(lead._id));
        if (creado) created.add(String(lead._id));
        contactosProcesados += 1;
      } catch (err) {
        logger.warn(`[leads] Migración: contacto ${String(contact._id)} omitido: ${(err as Error)?.message ?? err}`);
      }
    }
    if (progress === 0) break; // nada avanzó (errores): evita un bucle infinito
  }

  let etapasDerivadas = 0;
  for (const id of created) {
    const lead = await Lead.findById(id);
    if (!lead || lead.etapa !== 'nuevo') continue;
    let target: LeadStage | null = null;
    if (lead.usuario && (await DemoGrant.exists({ user: lead.usuario }))) target = 'demo';
    else if (await Contact.exists({ lead: lead._id, status: 'responded' })) target = 'contactado';
    if (target) {
      await changeStage(lead, target, { actor: null, nota: 'Etapa inicial derivada de su historial (migración de contactos).', automatico: true });
      etapasDerivadas += 1;
    }
  }
  if (contactosProcesados > 0) {
    logger.info(`[leads] Migración: ${contactosProcesados} contactos ligados, ${created.size} leads nuevos, ${etapasDerivadas} etapas derivadas`);
  }
  return { contactosProcesados, leadsCreados: created.size, etapasDerivadas };
}

// ---------------------------------------------------------------------------
//   Etapas, responsable, próxima acción y actividades
// ---------------------------------------------------------------------------

async function addActivityDoc(args: {
  leadId: mongoose.Types.ObjectId | string;
  tipo: LeadActivityType;
  texto: string;
  meta?: Record<string, unknown>;
  actor?: LeadActor | null;
  tarea?: { clase?: string | null; vence: Date } | null;
}): Promise<ILeadActivity> {
  const doc = await LeadActivity.create({
    lead: args.leadId,
    tipo: args.tipo,
    texto: args.texto.slice(0, 4000),
    meta: args.meta,
    autor: args.actor?.id && mongoose.Types.ObjectId.isValid(args.actor.id) ? args.actor.id : null,
    autorEmail: args.actor?.email ?? null,
    tarea: args.tarea ? { clase: args.tarea.clase ?? null, vence: args.tarea.vence, completadaEn: null } : null,
  });
  await Lead.updateOne({ _id: args.leadId }, { $max: { ultimaActividadEn: doc.createdAt } });
  return doc;
}

export async function loadLead(id: string): Promise<ILead> {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Lead no encontrado', 404, 'not_found');
  const lead = await Lead.findById(id);
  if (!lead) throw new AppError('Lead no encontrado', 404, 'not_found');
  return lead;
}

/**
 * Cambia la etapa (con una actualización condicionada a la etapa leída para
 * no pisar un cambio simultáneo) y deja la actividad `cambio_etapa`.
 */
export async function changeStage(
  leadOrId: ILead | string,
  etapa: LeadStage,
  ctx: { actor: LeadActor | null; motivo?: LeadLostReason; detalle?: string; nota?: string; automatico?: boolean; req?: Request },
): Promise<ILead> {
  if (!LEAD_STAGES.includes(etapa)) throw new AppError('Etapa inválida.', 400, 'invalid_stage');
  if (etapa === 'perdido' && !ctx.motivo) {
    throw new AppError('Indica el motivo de la pérdida.', 400, 'lost_reason_required', { fields: ['motivo'] });
  }
  let lead = typeof leadOrId === 'string' ? await loadLead(leadOrId) : leadOrId;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const de = lead.etapa;
    if (de === etapa && etapa !== 'perdido') return lead;
    const now = new Date();
    const updated = await Lead.findOneAndUpdate(
      { _id: lead._id, etapa: de },
      {
        $set: {
          etapa,
          etapaCambiadaEn: now,
          motivoPerdida: etapa === 'perdido' ? ctx.motivo : null,
          detallePerdida: etapa === 'perdido' ? ctx.detalle?.slice(0, 1000) ?? null : null,
          ultimaActividadEn: now,
        },
      },
      { new: true },
    );
    if (!updated) {
      lead = await loadLead(String(lead._id));
      continue;
    }
    const partes = [`Etapa: ${de} → ${etapa}`];
    if (etapa === 'perdido') partes.push(`Motivo: ${ctx.motivo}${ctx.detalle ? ` (${ctx.detalle})` : ''}`);
    if (ctx.nota) partes.push(ctx.nota);
    await addActivityDoc({
      leadId: updated._id as mongoose.Types.ObjectId,
      tipo: 'cambio_etapa',
      texto: partes.join('. '),
      meta: { de, a: etapa, motivo: ctx.motivo ?? null, detalle: ctx.detalle ?? null, automatico: !!ctx.automatico },
      actor: ctx.actor,
    });
    if (ctx.actor) {
      await recordAudit({
        actor: ctx.actor,
        accion: 'lead.stage_change',
        entidad: { tipo: 'Lead', id: String(updated._id) },
        detalle: { email: updated.email, de, a: etapa, motivo: ctx.motivo ?? null, detalle: ctx.detalle ?? null, automatico: !!ctx.automatico },
        req: ctx.req,
      });
    }
    return updated;
  }
  throw new AppError('El lead cambió mientras tanto; intenta de nuevo.', 409, 'conflict');
}

/**
 * Avance automático: solo hacia adelante y nunca desde `ganado`. Un lead
 * `perdido` solo se reabre si la persona lo pide (`permitirDesdePerdido`).
 */
export async function advanceStage(
  leadOrId: ILead | string,
  target: LeadStage,
  ctx: { actor: LeadActor | null; nota?: string; permitirDesdePerdido?: boolean; req?: Request },
): Promise<ILead> {
  const lead = typeof leadOrId === 'string' ? await loadLead(leadOrId) : leadOrId;
  if (lead.etapa === 'ganado') return lead;
  if (lead.etapa === 'perdido') {
    if (!ctx.permitirDesdePerdido || target === 'perdido') return lead;
    return changeStage(lead, target, { actor: ctx.actor, nota: ctx.nota, automatico: true, req: ctx.req });
  }
  if (LEAD_STAGE_ORDER[target] <= LEAD_STAGE_ORDER[lead.etapa]) return lead;
  return changeStage(lead, target, { actor: ctx.actor, nota: ctx.nota, automatico: true, req: ctx.req });
}

export async function assignOwner(id: string, ownerId: string | null, actor: LeadActor, req?: Request) {
  const lead = await loadLead(id);
  let owner: { _id: unknown; email: string; name: string; role: string } | null = null;
  if (ownerId) {
    if (!mongoose.Types.ObjectId.isValid(ownerId)) throw new AppError('Responsable no encontrado.', 400, 'invalid_owner');
    owner = await User.findById(ownerId).select('email name role').lean();
    if (!owner || !(LEAD_OWNER_ROLES as readonly string[]).includes(owner.role)) {
      throw new AppError('El responsable debe ser alguien del equipo comercial (admin, sales o manager).', 400, 'invalid_owner');
    }
  }
  const antes = lead.responsable ? String(lead.responsable) : null;
  const updated = await Lead.findByIdAndUpdate(lead._id, { $set: { responsable: owner ? owner._id : null } }, { new: true });
  await addActivityDoc({
    leadId: lead._id as mongoose.Types.ObjectId,
    tipo: 'sistema',
    texto: owner ? `Responsable asignado: ${owner.name} (${owner.email})` : 'Lead sin responsable',
    meta: { responsableAntes: antes, responsable: owner ? String(owner._id) : null },
    actor,
  });
  await recordAudit({
    actor,
    accion: 'lead.assign',
    entidad: { tipo: 'Lead', id: String(lead._id) },
    detalle: { email: lead.email, antes, despues: owner ? String(owner._id) : null },
    req,
  });
  return updated!;
}

export async function setNextAction(id: string, accion: { descripcion: string; fecha: Date } | null, actor: LeadActor, req?: Request) {
  const lead = await loadLead(id);
  const value = accion ? { descripcion: accion.descripcion, fecha: accion.fecha, asignadaPor: actor.id } : null;
  const updated = await Lead.findByIdAndUpdate(lead._id, { $set: { proximaAccion: value } }, { new: true });
  await recordAudit({
    actor,
    accion: 'lead.next_action',
    entidad: { tipo: 'Lead', id: String(lead._id) },
    detalle: { email: lead.email, proximaAccion: accion ? { descripcion: accion.descripcion, fecha: accion.fecha } : null },
    req,
  });
  return updated!;
}

/** Registra una actividad del equipo; contactar a un lead `nuevo` lo pasa a `contactado`. */
export async function addManualActivity(
  id: string,
  body: { tipo: LeadActivityType; texto: string; vence?: Date },
  actor: LeadActor,
  req?: Request,
) {
  let lead = await loadLead(id);
  if (body.tipo === 'tarea' && !body.vence) throw new AppError('Indica la fecha de vencimiento de la tarea.', 400, 'invalid_request', { fields: ['vence'] });
  const activity = await addActivityDoc({
    leadId: lead._id as mongoose.Types.ObjectId,
    tipo: body.tipo,
    texto: body.texto,
    actor,
    tarea: body.tipo === 'tarea' ? { vence: body.vence!, clase: null } : null,
  });
  if (CONTACT_ACTIVITY_TYPES.includes(body.tipo)) {
    lead = await advanceStage(lead, 'contactado', { actor, nota: `Primer contacto registrado (${body.tipo}).`, req });
  }
  return { activity: activityView(activity), lead: leadView(lead) };
}

/** Completa o reabre una tarea. Completar la de "preparar propuesta" cierra la solicitud. */
export async function updateTask(id: string, activityId: string, completada: boolean, actor: LeadActor) {
  const lead = await loadLead(id);
  if (!mongoose.Types.ObjectId.isValid(activityId)) throw new AppError('Actividad no encontrada', 404, 'not_found');
  const activity = await LeadActivity.findOne({ _id: activityId, lead: lead._id });
  if (!activity) throw new AppError('Actividad no encontrada', 404, 'not_found');
  if (activity.tipo !== 'tarea' || !activity.tarea) throw new AppError('Solo las tareas se pueden completar.', 400, 'not_a_task');
  const updated = await LeadActivity.findByIdAndUpdate(
    activity._id,
    { $set: { 'tarea.completadaEn': completada ? new Date() : null, 'tarea.completadaPor': completada ? actor.id : null } },
    { new: true },
  );
  if (completada && activity.tarea.clase === TASK_PREPARE_PROPOSAL) {
    await Lead.updateOne({ _id: lead._id, 'solicitudPropuesta.tarea': activity._id }, { $set: { solicitudPropuesta: null } });
  }
  return { activity: activityView(updated!) };
}

/** Cierra la solicitud de propuesta abierta (y su tarea) al enviar una propuesta. */
export async function closeProposalRequest(leadId: mongoose.Types.ObjectId | string, actor: LeadActor | null, nota: string): Promise<boolean> {
  const lead = await Lead.findOneAndUpdate({ _id: leadId, solicitudPropuesta: { $ne: null } }, { $set: { solicitudPropuesta: null } });
  if (!lead || !lead.solicitudPropuesta) return false;
  if (lead.solicitudPropuesta.tarea) {
    await LeadActivity.updateOne(
      { _id: lead.solicitudPropuesta.tarea, 'tarea.completadaEn': null },
      { $set: { 'tarea.completadaEn': new Date(), 'tarea.completadaPor': actor?.id ?? null } },
    );
  }
  await addActivityDoc({ leadId, tipo: 'sistema', texto: nota, actor });
  return true;
}

/** Registra en la línea de tiempo un hito de la propuesta (enviada, vista, aceptada…). */
export async function logProposalActivity(
  leadId: mongoose.Types.ObjectId | string,
  texto: string,
  meta: Record<string, unknown>,
  actor: LeadActor | null,
): Promise<void> {
  try {
    await addActivityDoc({ leadId, tipo: 'propuesta', texto, meta, actor });
  } catch (err) {
    logger.warn(`[leads] No se pudo registrar la actividad de propuesta: ${(err as Error)?.message ?? err}`);
  }
}

/**
 * Al conceder demos (aprobación o invitación directa): liga la cuenta al
 * lead y lo pasa a `demo`. Nunca hace fallar la acción del equipo.
 */
export async function onDemoAccessGranted(args: {
  email: string;
  nombre: string;
  empresa?: string;
  telefono?: string;
  userId: string;
  demos: string[];
  source: LeadSource;
  actor: LeadActor;
}): Promise<void> {
  try {
    const { lead } = await upsertLead({
      email: args.email,
      nombre: args.nombre,
      empresa: args.empresa,
      telefono: args.telefono,
      source: args.source,
      usuarioId: args.userId,
    });
    if (!lead.usuario) await Lead.updateOne({ _id: lead._id }, { $set: { usuario: args.userId } });
    await addActivityDoc({ leadId: lead._id as mongoose.Types.ObjectId, tipo: 'sistema', texto: `Acceso a demos concedido: ${args.demos.join(', ')}`, meta: { demos: args.demos }, actor: args.actor });
    await advanceStage(lead, 'demo', { actor: args.actor, nota: 'Recibió acceso a demos.' });
  } catch (err) {
    logger.warn(`[leads] No se pudo actualizar el lead de ${args.email}: ${(err as Error)?.message ?? err}`);
  }
}

// ---------------------------------------------------------------------------
//   Solicitar propuesta (portal)
// ---------------------------------------------------------------------------

export interface PortalUser {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  phone?: string;
}

export function proposalRequestView(lead: ILead) {
  const s = lead.solicitudPropuesta;
  return s
    ? { abierta: true, abiertaEn: s.abiertaEn, interes: s.interes ?? null, mensaje: s.mensaje ?? null }
    : { abierta: false, abiertaEn: null, interes: null, mensaje: null };
}

/**
 * "Solicitar propuesta" (DECISIÓN 14): pasa el lead a `propuesta`, crea la
 * actividad y una tarea "Preparar propuesta" que vence en 1 día hábil, y
 * avisa al equipo por el canal existente. Idempotente: si ya hay una
 * solicitud abierta responde con ella sin crear otra tarea ni otro aviso.
 */
export async function requestProposal(user: PortalUser, body: { interes?: string; mensaje?: string }, req?: Request) {
  const now = new Date();
  const { lead } = await upsertLead({
    email: user.email,
    nombre: user.name,
    empresa: user.company,
    telefono: user.phone,
    source: 'portal',
    interes: body.interes,
    fecha: now,
    usuarioId: user.id,
  });
  const claimed = await Lead.findOneAndUpdate(
    { _id: lead._id, solicitudPropuesta: null },
    { $set: { solicitudPropuesta: { abiertaEn: now, interes: body.interes, mensaje: body.mensaje, tarea: null } } },
    { new: true },
  );
  if (!claimed) {
    const current = (await Lead.findById(lead._id))!;
    return { creada: false, solicitud: proposalRequestView(current), lead: current };
  }

  const actor: LeadActor = { id: user.id, email: user.email, role: user.role };
  const textoSolicitud = [
    `Pidió una propuesta desde el portal${body.interes ? `: ${body.interes}` : ''}.`,
    body.mensaje ? `Mensaje: ${body.mensaje}` : '',
  ]
    .filter(Boolean)
    .join(' ');
  await addActivityDoc({ leadId: claimed._id as mongoose.Types.ObjectId, tipo: 'solicitud_propuesta', texto: textoSolicitud, meta: { interes: body.interes ?? null }, actor });
  const vence = addBusinessDays(now, 1);
  const tarea = await addActivityDoc({
    leadId: claimed._id as mongoose.Types.ObjectId,
    tipo: 'tarea',
    texto: `Preparar y enviar la propuesta${body.interes ? ` (${body.interes})` : ''}: plazo de 1 día hábil.`,
    tarea: { clase: TASK_PREPARE_PROPOSAL, vence },
    actor: null,
  });
  await Lead.updateOne({ _id: claimed._id }, { $set: { 'solicitudPropuesta.tarea': tarea._id } });
  const updated = await advanceStage(claimed, 'propuesta', { actor: null, nota: 'La persona pidió una propuesta.', permitirDesdePerdido: true });

  await recordAudit({
    actor,
    accion: 'proposal_request.create',
    entidad: { tipo: 'Lead', id: String(claimed._id) },
    detalle: { email: user.email, interes: body.interes ?? null, tarea: String(tarea._id), vence },
    req,
  });

  const responsable = updated.responsable ? await User.findById(updated.responsable).select('email').lean() : null;
  void notifyTeamInBackground({
    asunto: `Solicitud de propuesta: ${updated.nombre}${updated.empresa ? ` (${updated.empresa})` : ''}`,
    lineas: [
      `${updated.nombre} <${updated.email}> pidió una propuesta desde el portal.`,
      body.interes ? `Interés: ${body.interes}` : '',
      body.mensaje ? `Mensaje: ${body.mensaje}` : '',
      `La tarea "Preparar propuesta" vence el ${vence.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}.`,
    ].filter(Boolean),
    enlace: leadPanelUrl(updated._id as mongoose.Types.ObjectId),
    copiaA: [responsable?.email],
  });

  const fresh = (await Lead.findById(claimed._id))!;
  return { creada: true, solicitud: proposalRequestView(fresh), lead: fresh, tareaVence: vence };
}

// ---------------------------------------------------------------------------
//   Vistas y listados
// ---------------------------------------------------------------------------

export function leadView(l: ILead) {
  const owner = l.responsable as unknown as { _id?: unknown; email?: string; name?: string } | null;
  const populated = owner && typeof owner === 'object' && 'email' in owner;
  return {
    id: String(l._id),
    email: l.email,
    nombre: l.nombre,
    empresa: l.empresa ?? null,
    telefono: l.telefono ?? null,
    etapa: l.etapa,
    etapaCambiadaEn: l.etapaCambiadaEn,
    motivoPerdida: l.motivoPerdida ?? null,
    detallePerdida: l.detallePerdida ?? null,
    responsable: populated ? { id: String(owner!._id), email: owner!.email, nombre: owner!.name } : l.responsable ? { id: String(l.responsable) } : null,
    proximaAccion: l.proximaAccion
      ? { descripcion: l.proximaAccion.descripcion, fecha: l.proximaAccion.fecha, vencida: l.proximaAccion.fecha.getTime() < Date.now() }
      : null,
    origenes: l.origenes,
    origenPrincipal: l.origenPrincipal,
    intereses: l.intereses,
    usuario: l.usuario ? String(l.usuario) : null,
    contactos: l.contactos ?? 0,
    solicitudPropuesta: proposalRequestView(l),
    ultimaActividadEn: l.ultimaActividadEn,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

export function activityView(a: ILeadActivity) {
  return {
    id: String(a._id),
    tipo: a.tipo,
    texto: a.texto,
    meta: a.meta ?? null,
    autor: a.autor ? String(a.autor) : null,
    autorEmail: a.autorEmail ?? null,
    tarea: a.tarea
      ? {
          clase: a.tarea.clase ?? null,
          vence: a.tarea.vence,
          completada: !!a.tarea.completadaEn,
          completadaEn: a.tarea.completadaEn ?? null,
          vencida: !a.tarea.completadaEn && a.tarea.vence.getTime() < Date.now(),
        }
      : null,
    fecha: a.createdAt,
  };
}

export interface LeadListParams {
  etapa?: LeadStage;
  responsable?: string;
  origen?: LeadSource;
  q?: string;
  vencidas?: boolean;
  page: number;
  limit: number;
  actorId: string;
}

export async function listLeads(p: LeadListParams) {
  const filter: Record<string, unknown> = {};
  if (p.responsable === 'none') filter.responsable = null;
  else if (p.responsable === 'me') filter.responsable = p.actorId;
  else if (p.responsable && mongoose.Types.ObjectId.isValid(p.responsable)) filter.responsable = p.responsable;
  if (p.origen) filter.origenes = p.origen;
  if (p.q) {
    const rx = new RegExp(escapeRegex(p.q), 'i');
    filter.$or = [{ nombre: rx }, { email: rx }, { empresa: rx }, { intereses: rx }];
  }
  if (p.vencidas) filter['proximaAccion.fecha'] = { $lt: new Date() };
  const countFilter = { ...filter };
  if (p.etapa) filter.etapa = p.etapa;
  const [total, docs, counts] = await Promise.all([
    Lead.countDocuments(filter),
    Lead.find(filter)
      .sort({ ultimaActividadEn: -1 })
      .skip((p.page - 1) * p.limit)
      .limit(p.limit)
      .populate('responsable', 'email name'),
    Lead.aggregate<{ _id: LeadStage; n: number }>([{ $match: countFilter }, { $group: { _id: '$etapa', n: { $sum: 1 } } }]),
  ]);
  const conteos: Record<string, number> = Object.fromEntries(LEAD_STAGES.map((s) => [s, 0]));
  for (const c of counts) conteos[c._id] = c.n;
  return {
    items: docs.map(leadView),
    total,
    page: p.page,
    pages: Math.max(1, Math.ceil(total / p.limit)),
    conteos,
  };
}

export async function getLeadDetail(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Lead no encontrado', 404, 'not_found');
  const lead = await Lead.findById(id).populate('responsable', 'email name');
  if (!lead) throw new AppError('Lead no encontrado', 404, 'not_found');
  const [actividades, contactos, solicitudes, grants, propuestas] = await Promise.all([
    LeadActivity.find({ lead: lead._id }).sort({ createdAt: -1 }).limit(300),
    Contact.find({ lead: lead._id }).sort({ created_at: -1 }).limit(100).lean(),
    DemoRequest.find({ email: lead.email }).sort({ createdAt: -1 }).limit(50).select('codigo estado demos createdAt').lean(),
    lead.usuario ? DemoGrant.find({ user: lead.usuario }).sort({ createdAt: -1 }).limit(100) : Promise.resolve([]),
    Proposal.find({ lead: lead._id }).sort({ createdAt: -1 }).limit(50).select('numero titulo estado moneda totales validaHasta createdAt').lean(),
  ]);
  const catalog = await getCatalogMap(grants.map((g) => g.demoSlug));
  const now = new Date();
  return {
    lead: leadView(lead),
    actividades: actividades.map(activityView),
    contactos: contactos.map((c) => ({
      id: String(c._id),
      origen: c.source ?? 'contact-form',
      servicio: c.service,
      mensaje: c.message,
      presupuesto: c.budget ?? null,
      estado: c.status,
      fecha: c.created_at,
    })),
    solicitudesDemo: solicitudes.map((r) => ({ id: String(r._id), codigo: r.codigo, estado: r.estado, demos: r.demos, fecha: r.createdAt })),
    accesos: grants.map((g) => grantView(g, catalog.get(g.demoSlug) ?? null, now)),
    propuestas: propuestas.map((pr) => ({
      id: String(pr._id),
      numero: pr.numero,
      titulo: pr.titulo,
      estado: pr.estado,
      moneda: pr.moneda,
      total: pr.totales?.total ?? 0,
      validaHasta: pr.validaHasta ?? null,
      fecha: pr.createdAt,
    })),
  };
}

/** Lead creado a mano por el equipo (si el email ya existe, devuelve ese). */
export async function createManualLead(
  body: { nombre: string; email: string; empresa?: string; telefono?: string; interes?: string; nota?: string },
  actor: LeadActor,
  req?: Request,
) {
  const email = await normalizeEmailLikeAuth(body.email);
  if (!email) throw new AppError('Escribe un email válido.', 400, 'invalid_request', { fields: ['email'] });
  const { lead, creado } = await upsertLead({
    email,
    nombre: body.nombre,
    empresa: body.empresa,
    telefono: body.telefono,
    source: 'manual',
    interes: body.interes,
  });
  if (body.nota) await addActivityDoc({ leadId: lead._id as mongoose.Types.ObjectId, tipo: 'nota', texto: body.nota, actor });
  if (creado) {
    await recordAudit({ actor, accion: 'lead.create', entidad: { tipo: 'Lead', id: String(lead._id) }, detalle: { email }, req });
  }
  return { lead: leadView(lead), creado };
}

/** Lead de una cuenta del portal (null si no tiene). */
export async function findLeadForUser(userId: string, email: string): Promise<ILead | null> {
  const normalized = await normalizeLeadEmail(email);
  return Lead.findOne({ $or: [{ usuario: userId }, { email: normalized }] });
}
