/**
 * privacy.service.ts — derechos del titular (Ley 1581 de 2012): buscar por
 * email todo lo que el sistema guarda de una persona, exportarlo en JSON y
 * suprimirlo. Lo usa Admin › Privacidad (solo rol admin; rutas en
 * routes/admin-privacy.routes.ts).
 *
 * Qué se busca (por el email tal como lo escribieron y normalizado igual que
 * el login: minúsculas y, en Gmail, sin puntos ni +alias):
 *  - Cuenta (User), contactos (Contact), solicitudes de demo (DemoRequest),
 *    accesos a demos (DemoGrant), enlaces de un solo uso (MagicLinkToken,
 *    sin el hash), pipeline comercial (Lead, LeadActivity, Proposal),
 *    preguntas al chatbot que contienen el
 *    email (ChatbotTurn), notificaciones, documentos del gestor, registro de
 *    actividad, registros del portal (pedidos, proyectos, facturas,
 *    entregables, conversaciones) y la bitácora (AuditLog).
 *
 * Supresión: borra los registros y anonimiza los de la bitácora (se quitan
 * los datos de la persona y queda la acción, la fecha y quién del equipo la
 * hizo). Es irreversible. NO procede (409) si la persona es del equipo, o si
 * tiene una relación contractual vigente con registros que la ley obliga a
 * conservar (propuestas aceptadas, pagadas o convertidas, pedidos, proyectos,
 * facturas, entregables o conversaciones del portal): la solicitud de
 * supresión no procede cuando el titular tiene un deber legal o contractual
 * de permanecer en la base de datos (Decreto 1377 de 2013, art. 9). Deja en
 * la bitácora `privacy.erase` sin datos personales: una referencia aleatoria
 * y los conteos.
 */
import crypto from 'crypto';
import fs from 'fs/promises';
import type { Request } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Contact from '../models/Contact';
import DemoRequest from '../models/DemoRequest';
import DemoGrant from '../models/DemoGrant';
import MagicLinkToken from '../models/MagicLinkToken';
import AuditLog from '../models/AuditLog';
import Lead from '../models/Lead';
import LeadActivity from '../models/LeadActivity';
import Proposal from '../models/Proposal';
import Notification from '../models/Notification';
import DocumentModel from '../models/Document';
import ActivityLog from '../models/ActivityLog';
import Order from '../models/Order';
import Project from '../models/Project';
import Invoice from '../models/Invoice';
import Deliverable from '../models/Deliverable';
import Conversation from '../models/Conversation';
import { ChatbotTurn } from '../models/ChatbotBot';
import { TEAM_ROLES } from '../config/demos';
import { AppError } from '../middleware/errorHandler';
import { normalizeEmailLikeAuth } from '../utils/email-address';
import { recordAudit, type AuditActor } from './audit.service';
import { deleteFromS3 } from './storage.service';
import { revokeAllSessions } from './session.service';
import { logger } from '../utils/logger';

/** Estados de una propuesta que prueban una relación contractual. */
const CONTRACT_PROPOSAL_STATES = ['aceptada', 'convertida'];
/** Registros que se devuelven como máximo por categoría (protege la respuesta). */
const MAX_PER_CATEGORY = 500;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Emails con los que se busca: el escrito (en minúsculas) y el normalizado. */
export async function emailCandidates(raw: unknown): Promise<string[]> {
  const normalized = await normalizeEmailLikeAuth(raw);
  if (!normalized || typeof raw !== 'string') {
    throw new AppError('Escribe un email válido.', 400, 'invalid_request', { fields: ['email'], errores: { email: 'Escribe un email válido.' } });
  }
  return [...new Set([raw.trim().toLowerCase(), normalized.toLowerCase()])];
}

const exactAny = (emails: string[]) => ({ $in: emails.map((e) => new RegExp(`^${escapeRegex(e)}$`, 'i')) });

type Lean = Record<string, any>;

export interface PrivacyFindings {
  correosBuscados: string[];
  cuentas: Lean[];
  contactos: Lean[];
  solicitudesDemo: Lean[];
  accesosDemo: Lean[];
  enlacesDeUnSoloUso: Lean[];
  leads: Lean[];
  actividadesLead: Lean[];
  propuestas: Lean[];
  conversacionesChatbot: Lean[];
  notificaciones: Lean[];
  documentos: Lean[];
  registroActividad: Lean[];
  pedidos: Lean[];
  proyectos: Lean[];
  facturas: Lean[];
  entregables: Lean[];
  conversacionesPortal: Lean[];
  bitacora: Lean[];
}

export type PrivacyCategory = Exclude<keyof PrivacyFindings, 'correosBuscados'>;

export const PRIVACY_CATEGORIES: PrivacyCategory[] = [
  'cuentas',
  'contactos',
  'solicitudesDemo',
  'accesosDemo',
  'enlacesDeUnSoloUso',
  'leads',
  'actividadesLead',
  'propuestas',
  'conversacionesChatbot',
  'notificaciones',
  'documentos',
  'registroActividad',
  'pedidos',
  'proyectos',
  'facturas',
  'entregables',
  'conversacionesPortal',
  'bitacora',
];

/** Quita secretos e internos de un registro antes de mostrarlo o exportarlo. */
function clean(doc: Lean, drop: string[] = []): Lean {
  const out: Lean = {};
  for (const [k, v] of Object.entries(doc)) {
    if (k === '__v' || drop.includes(k)) continue;
    out[k] = v instanceof mongoose.Types.ObjectId ? String(v) : v;
  }
  if (out._id !== undefined) {
    out.id = String(out._id);
    delete out._id;
  }
  return out;
}

/** Reúne todo lo que el sistema guarda de una persona (sin modificar nada). */
export async function findPersonalData(rawEmail: unknown): Promise<PrivacyFindings> {
  const emails = await emailCandidates(rawEmail);
  const byEmail = exactAny(emails);

  const [users, contacts, leads] = await Promise.all([
    User.find({ email: byEmail }).limit(MAX_PER_CATEGORY).lean(),
    Contact.find({ email: byEmail }).limit(MAX_PER_CATEGORY).lean(),
    Lead.find({ email: byEmail }).limit(MAX_PER_CATEGORY).lean(),
  ]);
  const userIds = users.map((u) => u._id as mongoose.Types.ObjectId);
  const userIdStrings = userIds.map(String);
  const leadIds = leads.map((l) => l._id as mongoose.Types.ObjectId);

  const requests = await DemoRequest.find({ $or: [{ email: byEmail }, ...(userIds.length ? [{ user: { $in: userIds } }] : [])] })
    .limit(MAX_PER_CATEGORY)
    .lean();
  const requestIds = requests.map((r) => r._id as mongoose.Types.ObjectId);

  const emailText = new RegExp(emails.map(escapeRegex).join('|'), 'i');
  const [grants, magicLinks, activities, proposals, turns, notifications, documents, activityLog, orders, projects, invoices, deliverables, portalConversations] =
    await Promise.all([
      DemoGrant.find({ $or: [{ user: { $in: userIds } }, { request: { $in: requestIds } }] }).limit(MAX_PER_CATEGORY).lean(),
      MagicLinkToken.find({ user: { $in: userIds } }).limit(MAX_PER_CATEGORY).lean(),
      LeadActivity.find({ lead: { $in: leadIds } }).sort({ createdAt: 1 }).limit(MAX_PER_CATEGORY).lean(),
      Proposal.find({ $or: [{ lead: { $in: leadIds } }, { 'cliente.email': byEmail }, { usuario: { $in: userIds } }] }).limit(MAX_PER_CATEGORY).lean(),
      ChatbotTurn.find({ content: emailText }).sort({ timestamp: 1 }).limit(MAX_PER_CATEGORY).lean(),
      Notification.find({ userId: { $in: userIdStrings } }).limit(MAX_PER_CATEGORY).lean(),
      DocumentModel.find({ user_id: { $in: userIdStrings } }).select('-embedding -text_content').limit(MAX_PER_CATEGORY).lean(),
      ActivityLog.find({ user_id: { $in: userIds } }).limit(MAX_PER_CATEGORY).lean(),
      Order.find({ userId: { $in: userIds } }).limit(MAX_PER_CATEGORY).lean(),
      Project.find({ client_id: { $in: userIds } }).limit(MAX_PER_CATEGORY).lean(),
      Invoice.find({ userId: { $in: userIds } }).limit(MAX_PER_CATEGORY).lean(),
      Deliverable.find({ userId: { $in: userIds } }).limit(MAX_PER_CATEGORY).lean(),
      Conversation.find({ $or: [{ 'participants.userId': { $in: userIds } }, { 'participants.email': byEmail }] }).limit(MAX_PER_CATEGORY).lean(),
    ]);

  const relatedIds = [
    ...userIdStrings,
    ...contacts.map((c) => String(c._id)),
    ...requestIds.map(String),
    ...grants.map((g) => String(g._id)),
    ...leadIds.map(String),
    ...proposals.map((p) => String(p._id)),
  ];
  const audit = await AuditLog.find({
    $or: [
      { actorEmail: byEmail },
      { 'detalle.email': byEmail },
      { 'detalle.usuario': byEmail },
      ...(userIds.length ? [{ actor: { $in: userIds } }] : []),
      ...(relatedIds.length ? [{ 'entidad.id': { $in: relatedIds } }] : []),
    ],
  })
    .sort({ createdAt: 1 })
    .limit(MAX_PER_CATEGORY)
    .lean();

  return {
    correosBuscados: emails,
    cuentas: users.map((u) => clean(u, ['password', 'google_id'])),
    contactos: contacts.map((c) => clean(c)),
    solicitudesDemo: requests.map((r) => clean(r)),
    accesosDemo: grants.map((g) => clean(g)),
    enlacesDeUnSoloUso: magicLinks.map((m) => clean(m, ['tokenHash'])),
    leads: leads.map((l) => clean(l)),
    actividadesLead: activities.map((a) => clean(a)),
    propuestas: proposals.map((p) => clean(p, ['tokenHash'])),
    conversacionesChatbot: turns.map((t) => clean(t, ['sources'])),
    notificaciones: notifications.map((n) => clean(n)),
    documentos: documents.map((d) => clean(d)),
    registroActividad: activityLog.map((a) => clean(a)),
    pedidos: orders.map((o) => clean(o)),
    proyectos: projects.map((p) => clean(p)),
    facturas: invoices.map((i) => clean(i)),
    entregables: deliverables.map((d) => clean(d)),
    conversacionesPortal: portalConversations.map((c) => clean(c)),
    bitacora: audit.map((a) => clean(a, ['ipHash'])),
  };
}

export function summarize(f: PrivacyFindings): Record<PrivacyCategory, number> {
  const out = {} as Record<PrivacyCategory, number>;
  for (const c of PRIVACY_CATEGORIES) out[c] = f[c].length;
  return out;
}

export interface ErasureBlock {
  motivo: 'team_account' | 'contractual_records';
  detalle: Partial<Record<PrivacyCategory, number>>;
}

/** Por qué no procede la supresión (vacío si procede). */
export function erasureBlocks(f: PrivacyFindings): ErasureBlock[] {
  const blocks: ErasureBlock[] = [];
  const team = f.cuentas.filter((u) => (TEAM_ROLES as readonly string[]).includes(u.role));
  if (team.length) blocks.push({ motivo: 'team_account', detalle: { cuentas: team.length } });
  const contractualProposals = f.propuestas.filter((p) => CONTRACT_PROPOSAL_STATES.includes(p.estado) || p.pago?.estado === 'recibido');
  const contract: Partial<Record<PrivacyCategory, number>> = {};
  if (contractualProposals.length) contract.propuestas = contractualProposals.length;
  for (const c of ['pedidos', 'proyectos', 'facturas', 'entregables', 'conversacionesPortal'] as const) {
    if (f[c].length) contract[c] = f[c].length;
  }
  if (Object.keys(contract).length) blocks.push({ motivo: 'contractual_records', detalle: contract });
  return blocks;
}

export function hasAnyData(f: PrivacyFindings): boolean {
  return PRIVACY_CATEGORIES.some((c) => f[c].length > 0);
}

/** Código que el equipo le entrega al titular como constancia (no identifica a la persona). */
export function newErasureReference(now = new Date()): string {
  return `SUP-${now.getUTCFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function deleteDocumentFile(filePath: string | undefined): Promise<void> {
  if (!filePath) return;
  try {
    if (filePath.startsWith('https://')) {
      const key = filePath.split('.com/')[1];
      if (key) await deleteFromS3(key);
    } else {
      await fs.unlink(filePath);
    }
  } catch {
    /* el archivo ya no existe (disco efímero) o S3 no responde: el registro igual se borra */
  }
}

/** Cierra las sesiones renovables de las cuentas suprimidas (sin Redis no hay sesiones que cerrar). */
async function dropRefreshSessions(userIds: string[]): Promise<void> {
  // Todas las sesiones de cada dispositivo (services/session.service.ts).
  for (const id of userIds) await revokeAllSessions(id);
}

export interface ErasureResult {
  referencia: string;
  eliminados: Partial<Record<PrivacyCategory, number>>;
  anonimizados: { bitacora: number };
}

/**
 * Suprime los datos de una persona. `confirmacion` debe ser el mismo email
 * escrito otra vez. Irreversible.
 */
export async function erasePersonalData(rawEmail: unknown, confirmacion: unknown, actor: AuditActor, req?: Request): Promise<ErasureResult> {
  if (typeof rawEmail !== 'string' || typeof confirmacion !== 'string' || rawEmail.trim().toLowerCase() !== confirmacion.trim().toLowerCase()) {
    throw new AppError('Para suprimir, escribe otra vez el mismo email exactamente.', 400, 'confirmation_mismatch', {
      fields: ['confirmacion'],
      errores: { confirmacion: 'Escribe otra vez el mismo email exactamente.' },
    });
  }
  const f = await findPersonalData(rawEmail);
  if (!hasAnyData(f)) throw new AppError('No encontramos datos guardados con ese email.', 404, 'not_found');
  const blocks = erasureBlocks(f);
  if (blocks.length) {
    const team = blocks.some((b) => b.motivo === 'team_account');
    throw new AppError(
      team
        ? 'Ese email es de una cuenta del equipo de KopTup: primero quítale el rol desde Usuarios.'
        : 'Esta persona tiene registros de una relación contractual (propuestas aceptadas o pagadas, pedidos, proyectos, facturas, entregables o conversaciones del portal) que se deben conservar mientras exista la obligación. La supresión no procede por ahora.',
      409,
      team ? 'team_account' : 'contractual_records',
      { bloqueos: blocks },
    );
  }

  const ids = (list: Lean[]) => list.map((x) => new mongoose.Types.ObjectId(String(x.id)));
  const userIds = f.cuentas.map((u) => String(u.id));
  const eliminados: Partial<Record<PrivacyCategory, number>> = {};
  const count = (c: PrivacyCategory, n: number | undefined) => {
    if (n) eliminados[c] = n;
  };

  // Bitácora: se conservan la acción, la fecha y el actor del equipo; se
  // quitan los datos de la persona (detalle, su email y su id de actor).
  const auditIds = ids(f.bitacora);
  const anon = auditIds.length
    ? await AuditLog.updateMany({ _id: { $in: auditIds } }, { $set: { detalle: { datosSuprimidos: true } } })
    : { modifiedCount: 0 };
  if (auditIds.length) {
    await AuditLog.updateMany(
      { _id: { $in: auditIds }, $or: [{ actorEmail: exactAny(f.correosBuscados) }, { actor: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) } }] },
      { $set: { actor: null }, $unset: { actorEmail: '', ipHash: '' } },
    );
  }

  for (const d of f.documentos) await deleteDocumentFile(d.file_path);

  const results = await Promise.all([
    Contact.deleteMany({ _id: { $in: ids(f.contactos) } }),
    DemoRequest.deleteMany({ _id: { $in: ids(f.solicitudesDemo) } }),
    DemoGrant.deleteMany({ _id: { $in: ids(f.accesosDemo) } }),
    MagicLinkToken.deleteMany({ _id: { $in: ids(f.enlacesDeUnSoloUso) } }),
    LeadActivity.deleteMany({ _id: { $in: ids(f.actividadesLead) } }),
    Proposal.deleteMany({ _id: { $in: ids(f.propuestas) } }),
    Lead.deleteMany({ _id: { $in: ids(f.leads) } }),
    ChatbotTurn.deleteMany({ _id: { $in: ids(f.conversacionesChatbot) } }),
    Notification.deleteMany({ _id: { $in: ids(f.notificaciones) } }),
    DocumentModel.deleteMany({ _id: { $in: ids(f.documentos) } }),
    ActivityLog.deleteMany({ _id: { $in: ids(f.registroActividad) } }),
    User.deleteMany({ _id: { $in: ids(f.cuentas) } }),
  ]);
  const order: PrivacyCategory[] = [
    'contactos',
    'solicitudesDemo',
    'accesosDemo',
    'enlacesDeUnSoloUso',
    'actividadesLead',
    'propuestas',
    'leads',
    'conversacionesChatbot',
    'notificaciones',
    'documentos',
    'registroActividad',
    'cuentas',
  ];
  order.forEach((c, i) => count(c, results[i].deletedCount));

  await dropRefreshSessions(userIds);

  const referencia = newErasureReference();
  const anonimizados = { bitacora: anon.modifiedCount ?? 0 };
  // Constancia sin datos personales: referencia aleatoria y conteos.
  await recordAudit({
    actor,
    accion: 'privacy.erase',
    entidad: { tipo: 'Titular', id: referencia },
    detalle: { referencia, eliminados, anonimizados },
    req,
  });
  logger.info(`[privacy] Supresión ${referencia} completada`);
  return { referencia, eliminados, anonimizados };
}
