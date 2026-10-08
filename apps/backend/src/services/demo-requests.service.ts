/**
 * demo-requests.service.ts — solicitudes de demo.
 *
 * Público: `createDemoRequest` (formulario "Solicitar demo"): guarda la
 * solicitud con la prueba del consentimiento (Ley 1581), registra el lead por
 * el canal existente (lead.service, origen `demo-request`, que avisa al
 * equipo por email y WhatsApp si están configurados) y envía el acuse al
 * solicitante si hay SMTP. Si el mismo email ya tiene una solicitud abierta
 * de los últimos 30 días, se le suman las demos (no se duplica).
 *
 * Equipo: listar, ver detalle, notas, aprobar y rechazar. Las transiciones
 * usan actualizaciones condicionadas al estado de origen: un doble clic en
 * "Aprobar" responde 409 sin duplicar nada.
 */
import crypto from 'crypto';
import type { Request } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import DemoRequest, { type IDemoRequest } from '../models/DemoRequest';
import AuditLog from '../models/AuditLog';
import { AppError } from '../middleware/errorHandler';
import {
  COMPANY_SIZES,
  DEMO_REQUEST_OPEN_STATES,
  DEMO_REQUEST_STATES,
  MAX_GRANT_DAYS,
  MIN_GRANT_DAYS,
  currentPrivacyPolicyVersion,
  frontendUrl,
} from '../config/demos';
import { normalizeEmailLikeAuth } from '../utils/email-address';
import { getCatalogMap } from './demo-catalog.service';
import { registerLeadWithNotifications } from './lead.service';
import { emailService } from './email.service';
import { sendRequestAck, sendRequestRejected } from './demo-emails.service';
import { hashIp, recordAudit } from './audit.service';
import {
  type StaffActor,
  awaitEmail,
  findAccountByEmail,
  grantDemosToPerson,
  grantsForRequest,
  resendActivation,
  resolveDemosForGrant,
} from './demo-grants.service';
import { logger } from '../utils/logger';

const SLUG = /^[a-z0-9-]{2,60}$/;
const PHONE = /^[+0-9 ().-]{7,40}$/;
const MERGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const DemoRequestInputSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
  empresa: z.string().trim().min(1, 'Escribe el nombre de tu empresa.').max(160),
  cargo: optionalText(120),
  email: z.string().trim().max(254).email('Escribe un email válido.'),
  telefono: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || PHONE.test(v), 'Escribe un teléfono válido (solo números, espacios y +).'),
  pais: z.string().trim().min(2, 'Elige tu país.').max(60),
  tamanoEmpresa: z.enum(COMPANY_SIZES, { errorMap: () => ({ message: 'Elige el tamaño de tu empresa.' }) }),
  demos: z
    .array(z.string().trim().toLowerCase().regex(SLUG))
    .min(1, 'Elige al menos una demo.')
    .max(10, 'Puedes pedir hasta 10 demos por solicitud.'),
  casoDeUso: z.string().trim().min(10, 'Cuéntanos en pocas palabras qué quieres resolver (mínimo 10 caracteres).').max(2000),
  versionPolitica: optionalText(40),
  origen: z
    .object({
      pagina: optionalText(300),
      referrer: optionalText(300),
      utm: z
        .object({
          source: optionalText(120),
          medium: optionalText(120),
          campaign: optionalText(120),
          term: optionalText(120),
          content: optionalText(120),
        })
        .partial()
        .optional(),
    })
    .partial()
    .optional(),
});

export type DemoRequestInput = z.infer<typeof DemoRequestInputSchema>;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRequestCode(now = new Date()): string {
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (const b of bytes) suffix += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `DR-${now.getUTCFullYear()}-${suffix}`;
}

/** Vista de una solicitud para el panel (sin el hash de IP). */
export function requestView(r: IDemoRequest) {
  return {
    id: String(r._id),
    codigo: r.codigo,
    nombre: r.nombre,
    empresa: r.empresa,
    cargo: r.cargo ?? null,
    email: r.email,
    telefono: r.telefono ?? null,
    pais: r.pais,
    tamanoEmpresa: r.tamanoEmpresa,
    demos: r.demos,
    casoDeUso: r.casoDeUso,
    consentimiento: {
      aceptado: r.consentimiento?.aceptado === true,
      fecha: r.consentimiento?.fecha ?? null,
      versionPolitica: r.consentimiento?.versionPolitica ?? null,
    },
    origen: r.origen ?? null,
    estado: r.estado,
    motivoRechazo: r.motivoRechazo ?? null,
    notas: (r.notas ?? []).map((n) => ({ texto: n.texto, autor: n.autor ? String(n.autor) : null, autorEmail: n.autorEmail ?? null, fecha: n.fecha })),
    revisadoPor: r.revisadoPor ? String(r.revisadoPor) : null,
    revisadoEn: r.revisadoEn ?? null,
    decision: r.decision?.demos?.length
      ? { demos: r.decision.demos, dias: r.decision.dias ?? null, grants: (r.decision.grants ?? []).map(String) }
      : null,
    user: r.user ? String(r.user) : null,
    lead: r.lead ? String(r.lead) : null,
    reenvios: r.reenvios ?? 0,
    notificaciones: {
      equipoEmail: r.notificaciones?.equipoEmail ?? null,
      equipoWhatsapp: r.notificaciones?.equipoWhatsapp ?? null,
      acuseSolicitante: r.notificaciones?.acuseSolicitante ?? null,
      decisionSolicitante: r.notificaciones?.decisionSolicitante ?? null,
    },
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function leadMessage(r: IDemoRequest, demoNames: string[]): string {
  return [
    `Solicitud de demo ${r.codigo}`,
    `Demos: ${demoNames.join(', ')}`,
    `Empresa: ${r.empresa}${r.cargo ? ` · Cargo: ${r.cargo}` : ''}`,
    `País: ${r.pais} · Tamaño: ${r.tamanoEmpresa} personas`,
    '',
    `Caso de uso: ${r.casoDeUso}`,
    '',
    `Autorizó el tratamiento de sus datos personales (Ley 1581 de 2012, política ${r.consentimiento.versionPolitica}) el ${r.consentimiento.fecha.toISOString()}.`,
    `Revisar en el panel: ${frontendUrl()}/admin/solicitudes/${String(r._id)}`,
  ].join('\n');
}

async function setNotification(id: mongoose.Types.ObjectId, fields: Record<string, boolean>): Promise<void> {
  const set: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(fields)) set[`notificaciones.${k}`] = v;
  await DemoRequest.updateOne({ _id: id }, { $set: set }).catch((err) =>
    logger.warn(`[demo-requests] No se pudo guardar el estado de los avisos: ${(err as Error)?.message ?? err}`),
  );
}

export interface CreateDemoRequestResult {
  request: IDemoRequest;
  /** true si se sumó a una solicitud abierta del mismo email. */
  fusionada: boolean;
  /** Promesa (para pruebas) que termina cuando se registraron el lead y los avisos. */
  done: Promise<void>;
}

/** Crea (o fusiona) una solicitud. La entrada ya pasó el honeypot y el consentimiento. */
export async function createDemoRequest(
  input: DemoRequestInput,
  ctx: { ip: string; userAgent?: string },
): Promise<CreateDemoRequestResult> {
  const email = await normalizeEmailLikeAuth(input.email);
  if (!email) throw new AppError('Escribe un email válido.', 400, 'invalid_request', { fields: ['email'] });

  const demos = [...new Set(input.demos)];
  const catalog = await getCatalogMap(demos);
  const unknown = demos.filter((d) => !catalog.has(d));
  if (unknown.length > 0) {
    throw new AppError(`Estas demos no existen: ${unknown.join(', ')}`, 400, 'unknown_demo', { demos: unknown });
  }

  const now = new Date();
  const consentimiento = {
    aceptado: true,
    fecha: now,
    ipHash: hashIp(ctx.ip),
    userAgent: ctx.userAgent?.slice(0, 300),
    versionPolitica: input.versionPolitica ?? currentPrivacyPolicyVersion(),
  };

  // ¿Ya tiene una solicitud abierta reciente? Se le suman las demos.
  const merged = await DemoRequest.findOneAndUpdate(
    { email, estado: { $in: DEMO_REQUEST_OPEN_STATES }, createdAt: { $gte: new Date(now.getTime() - MERGE_WINDOW_MS) } },
    {
      $addToSet: { demos: { $each: demos } },
      $inc: { reenvios: 1 },
      $set: { consentimiento },
      $push: { notas: { texto: `El solicitante volvió a enviar el formulario. Demos: ${demos.join(', ')}. Caso de uso: ${input.casoDeUso}`.slice(0, 2000), fecha: now } },
    },
    { new: true, sort: { createdAt: -1 } },
  );
  if (merged) return { request: merged, fusionada: true, done: Promise.resolve() };

  let request: IDemoRequest | null = null;
  for (let attempt = 0; attempt < 3 && !request; attempt += 1) {
    try {
      request = await DemoRequest.create({
        codigo: generateRequestCode(now),
        nombre: input.nombre,
        empresa: input.empresa,
        cargo: input.cargo,
        email,
        telefono: input.telefono,
        pais: input.pais,
        tamanoEmpresa: input.tamanoEmpresa,
        demos,
        casoDeUso: input.casoDeUso,
        consentimiento,
        origen: input.origen,
        estado: 'pendiente',
      });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
  if (!request) throw new AppError('No se pudo registrar la solicitud. Intenta de nuevo.', 500);

  const saved = request;
  const demoNames = demos.map((d) => catalog.get(d)?.nombre ?? d);
  const leadAndNotify = (async () => {
    try {
      const { contact, notified } = await registerLeadWithNotifications({
        name: saved.nombre,
        email: saved.email,
        phone: saved.telefono,
        company: saved.empresa,
        service: `Solicitud de demo: ${demoNames.join(', ')}`.slice(0, 300),
        message: leadMessage(saved, demoNames),
        source: 'demo-request',
      });
      await DemoRequest.updateOne({ _id: saved._id }, { $set: { lead: contact._id } });
      const result = await notified;
      await setNotification(saved._id as mongoose.Types.ObjectId, { equipoEmail: result.email, equipoWhatsapp: result.whatsapp });
    } catch (err) {
      logger.error(`[demo-requests] No se pudo registrar el lead de ${saved.codigo}: ${(err as Error)?.message ?? err}`);
    }
  })();
  const ack = (async () => {
    const sent = emailService.isConfigured()
      ? await sendRequestAck({ to: saved.email, nombre: saved.nombre, codigo: saved.codigo, demos: demos.map((d) => ({ slug: d, nombre: catalog.get(d)?.nombre ?? d })) }).catch(() => false)
      : false;
    await setNotification(saved._id as mongoose.Types.ObjectId, { acuseSolicitante: sent });
  })();

  return { request: saved, fusionada: false, done: Promise.all([leadAndNotify, ack]).then(() => undefined) };
}

// ---------------------------------------------------------------------------
//   Equipo
// ---------------------------------------------------------------------------

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listDemoRequests(params: { estado?: string; demo?: string; q?: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = {};
  if (params.estado && (DEMO_REQUEST_STATES as readonly string[]).includes(params.estado)) filter.estado = params.estado;
  if (params.demo) filter.demos = params.demo;
  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q), 'i');
    filter.$or = [{ nombre: rx }, { empresa: rx }, { email: rx }, { codigo: rx }, { casoDeUso: rx }];
  }
  const countFilter = { ...filter };
  delete countFilter.estado;
  const [total, docs, counts] = await Promise.all([
    DemoRequest.countDocuments(filter),
    DemoRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit),
    DemoRequest.aggregate<{ _id: string; n: number }>([{ $match: countFilter }, { $group: { _id: '$estado', n: { $sum: 1 } } }]),
  ]);
  const conteos: Record<string, number> = { pendiente: 0, en_revision: 0, aprobada: 0, rechazada: 0 };
  for (const c of counts) conteos[c._id] = c.n;
  return {
    items: docs.map(requestView),
    total,
    page: params.page,
    pages: Math.max(1, Math.ceil(total / params.limit)),
    conteos,
  };
}

async function loadRequest(id: string): Promise<IDemoRequest> {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Solicitud no encontrada', 404, 'not_found');
  const doc = await DemoRequest.findById(id);
  if (!doc) throw new AppError('Solicitud no encontrada', 404, 'not_found');
  return doc;
}

export async function getDemoRequestDetail(id: string) {
  const r = await loadRequest(id);
  const [cuenta, grants, historial, catalog] = await Promise.all([
    findAccountByEmail(r.email),
    grantsForRequest(String(r._id), r.user ? String(r.user) : null),
    AuditLog.find({ 'entidad.tipo': 'DemoRequest', 'entidad.id': String(r._id) }).sort({ createdAt: -1 }).limit(50).lean(),
    getCatalogMap(r.demos),
  ]);
  return {
    request: requestView(r),
    demos: r.demos.map((slug) => {
      const e = catalog.get(slug);
      return { slug, nombre: e?.nombre ?? slug, accessMode: e?.accessMode ?? null, activo: e?.activo ?? false };
    }),
    cuenta,
    grants,
    historial: historial.map((h) => ({
      accion: h.accion,
      actorEmail: h.actorEmail ?? null,
      actorRol: h.actorRol ?? null,
      detalle: h.detalle ?? null,
      fecha: h.createdAt,
    })),
  };
}

export async function updateDemoRequest(
  id: string,
  body: { estado?: 'pendiente' | 'en_revision'; nota?: string },
  actor: StaffActor,
  req?: Request,
) {
  const r = await loadRequest(id);
  const update: Record<string, unknown> = {};
  const push: Record<string, unknown> = {};
  if (body.estado && body.estado !== r.estado) {
    if (!DEMO_REQUEST_OPEN_STATES.includes(r.estado)) {
      throw new AppError(`La solicitud ya está ${r.estado}; no se puede volver a ${body.estado}.`, 409, 'invalid_transition');
    }
    update.estado = body.estado;
  }
  if (body.nota) push.notas = { texto: body.nota, autor: actor.id, autorEmail: actor.email, fecha: new Date() };
  if (!Object.keys(update).length && !Object.keys(push).length) return { request: requestView(r) };

  const filter: Record<string, unknown> = { _id: r._id };
  if (update.estado) filter.estado = { $in: DEMO_REQUEST_OPEN_STATES };
  const doc = await DemoRequest.findOneAndUpdate(
    filter,
    { ...(Object.keys(update).length ? { $set: update } : {}), ...(Object.keys(push).length ? { $push: push } : {}) },
    { new: true },
  );
  if (!doc) throw new AppError('La solicitud cambió de estado mientras tanto.', 409, 'invalid_transition');
  await recordAudit({
    actor,
    accion: 'demo_request.update',
    entidad: { tipo: 'DemoRequest', id: String(r._id) },
    detalle: { codigo: r.codigo, ...(update.estado ? { de: r.estado, a: update.estado } : {}), ...(body.nota ? { nota: body.nota } : {}) },
    req,
  });
  return { request: requestView(doc) };
}

export const ApproveSchema = z.object({
  demos: z.array(z.string().trim().toLowerCase().regex(SLUG)).min(1).max(10).optional(),
  dias: z.coerce.number().int().min(MIN_GRANT_DAYS).max(MAX_GRANT_DAYS).optional(),
  nota: optionalText(2000),
  mensaje: optionalText(2000),
});

export async function approveDemoRequest(id: string, body: z.infer<typeof ApproveSchema>, actor: StaffActor, req?: Request) {
  const r = await loadRequest(id);
  if (!DEMO_REQUEST_OPEN_STATES.includes(r.estado)) {
    throw new AppError(`Esta solicitud ya fue ${r.estado === 'aprobada' ? 'aprobada' : 'rechazada'}.`, 409, 'already_processed', { estado: r.estado });
  }
  const demos = [...new Set(body.demos ?? r.demos)];
  const catalog = await resolveDemosForGrant(demos, actor);

  // Reclama la solicitud (solo una aprobación gana; un doble clic recibe 409).
  const now = new Date();
  const estadoAnterior = r.estado;
  const claimed = await DemoRequest.findOneAndUpdate(
    { _id: r._id, estado: { $in: DEMO_REQUEST_OPEN_STATES } },
    { $set: { estado: 'aprobada', revisadoPor: actor.id, revisadoEn: now } },
    { new: true },
  );
  if (!claimed) throw new AppError('Esta solicitud ya fue procesada.', 409, 'already_processed');

  let granted;
  try {
    granted = await grantDemosToPerson({
      persona: { email: r.email, nombre: r.nombre, empresa: r.empresa, telefono: r.telefono },
      demos,
      catalog,
      dias: body.dias,
      nota: body.nota,
      mensaje: body.mensaje,
      actor,
      requestId: r._id as mongoose.Types.ObjectId,
    });
  } catch (err) {
    await DemoRequest.updateOne({ _id: r._id, estado: 'aprobada' }, { $set: { estado: estadoAnterior }, $unset: { revisadoPor: 1, revisadoEn: 1 } });
    throw err;
  }

  const dias = body.dias ?? Math.max(...demos.map((d) => catalog.get(d)?.duracionDiasPorDefecto ?? 14));
  const updated = await DemoRequest.findOneAndUpdate(
    { _id: r._id },
    {
      $set: {
        user: granted.user.id,
        decision: { demos, dias, grants: granted.grants.map((g) => g.id) },
        'notificaciones.decisionSolicitante': granted.email.enviado === true,
      },
      ...(body.nota ? { $push: { notas: { texto: body.nota, autor: actor.id, autorEmail: actor.email, fecha: now } } } : {}),
    },
    { new: true },
  );

  await recordAudit({
    actor,
    accion: 'demo_request.approve',
    entidad: { tipo: 'DemoRequest', id: String(r._id) },
    detalle: {
      codigo: r.codigo,
      email: r.email,
      demos,
      dias: body.dias ?? null,
      grants: granted.grants.map((g) => g.id),
      usuario: granted.user.id,
      cuentaNueva: granted.user.cuentaNueva,
      enlaceActivacion: granted.activationUrl ? 'emitido' : 'no_necesario',
      emailEnviado: granted.email.enviado,
      ...(body.nota ? { nota: body.nota } : {}),
    },
    req,
  });

  return { request: requestView(updated ?? claimed), ...granted };
}

export const RejectSchema = z.object({
  motivo: z.string().trim().min(3, 'Escribe el motivo del rechazo.').max(1000),
  notificar: z.boolean().optional().default(false),
  mensaje: optionalText(2000),
});

export async function rejectDemoRequest(id: string, body: z.infer<typeof RejectSchema>, actor: StaffActor, req?: Request) {
  const r = await loadRequest(id);
  if (!DEMO_REQUEST_OPEN_STATES.includes(r.estado)) {
    throw new AppError(`Esta solicitud ya fue ${r.estado === 'aprobada' ? 'aprobada' : 'rechazada'}.`, 409, 'already_processed', { estado: r.estado });
  }
  const now = new Date();
  const doc = await DemoRequest.findOneAndUpdate(
    { _id: r._id, estado: { $in: DEMO_REQUEST_OPEN_STATES } },
    { $set: { estado: 'rechazada', motivoRechazo: body.motivo, revisadoPor: actor.id, revisadoEn: now } },
    { new: true },
  );
  if (!doc) throw new AppError('Esta solicitud ya fue procesada.', 409, 'already_processed');

  // Nunca se avisa a un spam. El motivo es interno: al solicitante solo le
  // llega el `mensaje` opcional (o un texto genérico).
  const esSpam = /^\s*spam\s*$/i.test(body.motivo);
  const notificar = body.notificar === true && !esSpam;
  const email = notificar
    ? await awaitEmail(() => sendRequestRejected({ to: doc.email, nombre: doc.nombre, motivo: body.mensaje }))
    : { configurado: emailService.isConfigured(), enviado: false };
  if (notificar) await DemoRequest.updateOne({ _id: doc._id }, { $set: { 'notificaciones.decisionSolicitante': email.enviado === true } });

  await recordAudit({
    actor,
    accion: 'demo_request.reject',
    entidad: { tipo: 'DemoRequest', id: String(r._id) },
    detalle: { codigo: r.codigo, email: r.email, motivo: body.motivo, notificar: body.notificar, emailEnviado: email.enviado },
    req,
  });
  return { request: requestView(doc), email, notificado: notificar && email.enviado === true };
}

export async function resendActivationForRequest(id: string, actor: StaffActor, req?: Request) {
  const r = await loadRequest(id);
  if (r.estado !== 'aprobada' || !r.user) {
    throw new AppError('La solicitud no está aprobada: no tiene cuenta a la cual reenviar el enlace.', 409, 'not_approved');
  }
  return resendActivation(String(r.user), actor, { entidad: { tipo: 'DemoRequest', id: String(r._id) }, req });
}
