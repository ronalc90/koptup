/**
 * demo-grants.service.ts — cuentas de prospecto y accesos a demos.
 *
 * - `linkOrCreateProspect`: vincula la cuenta existente (sin bajarle el rol)
 *   o crea una `prospect` en estado `invitado` (sin contraseña).
 * - `grantDemos`: un DemoGrant `activo` por demo; si ya hay uno vigente lo
 *   extiende (el índice único parcial impide duplicados).
 * - `issueAccessLinks`: si la cuenta no tiene contraseña emite el enlace de
 *   activación (72 h) y SIEMPRE devuelve la URL al admin; envía el correo si
 *   hay SMTP.
 * - `extendGrant`, `revokeGrant`, `resendActivation`, listados y vistas.
 * Toda acción del equipo queda en AuditLog.
 */
import type { Request } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import User, { type IUser } from '../models/User';
import DemoGrant, { type IDemoGrant } from '../models/DemoGrant';
import { AppError } from '../middleware/errorHandler';
import {
  DEFAULT_GRANT_DAYS,
  GRANT_REMINDER_DAYS_BEFORE,
  MAX_GRANT_DAYS,
  MIN_GRANT_DAYS,
  TEAM_ROLES,
  canManagePrivateDemos,
} from '../config/demos';
import { normalizeEmailLikeAuth } from '../utils/email-address';
import { type CatalogEntry, getCatalogMap } from './demo-catalog.service';
import { daysLeft, effectiveGrantState, usableGrantFilter } from './demo-access.service';
import { issueMagicLink } from './magic-link.service';
import { type AuditActor, recordAudit } from './audit.service';
import { emailService } from './email.service';
import { type DemoLinkItem, misDemosLoginUrl, sendAccessExtended, sendAccessGranted } from './demo-emails.service';
import { logger } from '../utils/logger';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Tiempo máximo que una acción del panel espera al SMTP antes de responder. */
const EMAIL_WAIT_MS = 15_000;

export interface StaffActor extends AuditActor {
  id: string;
  email: string;
  role: string;
}

export interface EmailOutcome {
  /** SMTP configurado en este servidor. */
  configurado: boolean;
  /** true enviado · false no enviado (sin SMTP o falló) · null sigue en curso al responder. */
  enviado: boolean | null;
}

/** Espera el envío hasta EMAIL_WAIT_MS (el envío sigue aunque se responda antes). */
export async function awaitEmail(send: () => Promise<boolean>): Promise<EmailOutcome> {
  if (!emailService.isConfigured()) return { configurado: false, enviado: false };
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), EMAIL_WAIT_MS);
  });
  const sending = send().catch((err) => {
    logger.error(`[demo-grants] Error enviando correo: ${(err as Error)?.message ?? err}`);
    return false;
  });
  const enviado = await Promise.race([sending, timeout]);
  if (timer) clearTimeout(timer);
  return { configurado: true, enviado };
}

export function isTeamRole(role: string | undefined | null): boolean {
  return !!role && (TEAM_ROLES as readonly string[]).includes(role);
}

/** La cuenta todavía no tiene cómo iniciar sesión: necesita el enlace de activación. */
export function needsActivation(user: Pick<IUser, 'accountStatus' | 'provider' | 'password'>): boolean {
  return user.accountStatus === 'invitado' || (user.provider === 'local' && !user.password);
}

function isDuplicateKey(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as { code?: number }).code === 11000;
}

/** Valida los slugs contra el catálogo y el permiso del rol (demos `privado` solo admin). */
export async function resolveDemosForGrant(slugs: string[], actor: StaffActor): Promise<Map<string, CatalogEntry>> {
  const unique = [...new Set(slugs.map((s) => s.trim().toLowerCase()))];
  const catalog = await getCatalogMap(unique);
  const unknown = unique.filter((s) => !catalog.has(s));
  if (unknown.length > 0) {
    throw new AppError(`Estas demos no existen en el catálogo: ${unknown.join(', ')}`, 400, 'unknown_demo', { demos: unknown });
  }
  const privadas = unique.filter((s) => catalog.get(s)?.accessMode === 'privado');
  if (privadas.length > 0 && !canManagePrivateDemos(actor.role)) {
    throw new AppError(
      `Solo un administrador puede dar acceso a demos privadas (${privadas.join(', ')}).`,
      403,
      'requires_admin',
      { demos: privadas },
    );
  }
  return catalog;
}

/** Busca la cuenta por email o crea una `prospect` invitada. */
export async function linkOrCreateProspect(args: {
  email: string;
  nombre?: string;
  empresa?: string;
  telefono?: string;
}): Promise<{ user: IUser; creado: boolean }> {
  const existing = await User.findOne({ email: args.email });
  if (existing) {
    if (isTeamRole(existing.role)) {
      throw new AppError('Ese email pertenece a una cuenta del equipo de KopTup: ya puede abrir todas las demos.', 422, 'team_email');
    }
    let changed = false;
    if (!existing.company && args.empresa) {
      existing.company = args.empresa;
      changed = true;
    }
    if (!existing.phone && args.telefono) {
      existing.phone = args.telefono;
      changed = true;
    }
    if (changed) await existing.save();
    return { user: existing, creado: false };
  }
  if (!args.nombre) {
    throw new AppError('Falta el nombre de la persona para crear su cuenta.', 400, 'name_required');
  }
  try {
    const user = await User.create({
      email: args.email,
      name: args.nombre,
      role: 'prospect',
      provider: 'local',
      accountStatus: 'invitado',
      company: args.empresa,
      phone: args.telefono,
    });
    return { user, creado: true };
  } catch (err) {
    if (isDuplicateKey(err)) {
      const user = await User.findOne({ email: args.email });
      if (user) return { user, creado: false };
    }
    throw err;
  }
}

/** Crea (o extiende si ya hay uno vigente) el acceso de un usuario a una demo. */
export async function upsertGrant(args: {
  userId: mongoose.Types.ObjectId | string;
  demoSlug: string;
  dias: number;
  actorId: string;
  requestId?: mongoose.Types.ObjectId | string | null;
  nota?: string;
  now?: Date;
}): Promise<{ grant: IDemoGrant; creado: boolean }> {
  const now = args.now ?? new Date();
  const target = new Date(now.getTime() + args.dias * DAY_MS);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const existing = await DemoGrant.findOne({ user: args.userId, demoSlug: args.demoSlug, estado: 'activo' });
    if (existing) {
      const hasta = existing.expiresAt.getTime() > target.getTime() ? existing.expiresAt : target;
      const grant = await DemoGrant.findOneAndUpdate(
        { _id: existing._id, estado: 'activo' },
        {
          $set: {
            expiresAt: hasta,
            recordatorioEnviadoEn: null,
            ...(args.requestId ? { request: args.requestId } : {}),
            ...(args.nota ? { nota: args.nota } : {}),
          },
          $push: { extensiones: { dias: args.dias, desde: existing.expiresAt, hasta, por: args.actorId, fecha: now } },
        },
        { new: true },
      );
      if (grant) return { grant, creado: false };
      continue;
    }
    try {
      const grant = await DemoGrant.create({
        user: args.userId,
        demoSlug: args.demoSlug,
        request: args.requestId ?? null,
        estado: 'activo',
        expiresAt: target,
        otorgadoPor: args.actorId,
        nota: args.nota,
      });
      return { grant, creado: true };
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
      // Otro proceso lo creó a la vez: se reintenta como extensión.
    }
  }
  throw new AppError('No se pudo crear el acceso; intenta de nuevo.', 409, 'grant_conflict');
}

export interface GrantedAccessResult {
  user: { id: string; email: string; name: string; role: string; accountStatus: string; cuentaNueva: boolean };
  grants: ReturnType<typeof grantView>[];
  /** URL de activación (cuenta sin contraseña) o null si la cuenta ya puede iniciar sesión. */
  activationUrl: string | null;
  activationExpiresAt: Date | null;
  /** Enlace para entrar a Mis demos con la cuenta existente. */
  loginUrl: string;
  email: EmailOutcome;
}

/**
 * Concede las demos a una persona (aprobación o invitación directa): cuenta,
 * accesos, enlace de activación y correo. Si algo falla a mitad, deshace lo
 * que creó.
 */
export async function grantDemosToPerson(args: {
  persona: { email: string; nombre?: string; empresa?: string; telefono?: string };
  demos: string[];
  catalog: Map<string, CatalogEntry>;
  dias?: number;
  nota?: string;
  mensaje?: string;
  actor: StaffActor;
  requestId?: mongoose.Types.ObjectId | string | null;
}): Promise<GrantedAccessResult> {
  const now = new Date();
  const { user, creado } = await linkOrCreateProspect(args.persona);
  const createdGrantIds: mongoose.Types.ObjectId[] = [];
  const grants: IDemoGrant[] = [];
  try {
    for (const slug of args.demos) {
      const dias = args.dias ?? args.catalog.get(slug)?.duracionDiasPorDefecto ?? DEFAULT_GRANT_DAYS;
      const { grant, creado: nuevo } = await upsertGrant({
        userId: user._id as mongoose.Types.ObjectId,
        demoSlug: slug,
        dias,
        actorId: args.actor.id,
        requestId: args.requestId ?? null,
        nota: args.nota,
        now,
      });
      if (nuevo) createdGrantIds.push(grant._id as mongoose.Types.ObjectId);
      grants.push(grant);
    }
  } catch (err) {
    if (createdGrantIds.length > 0) await DemoGrant.deleteMany({ _id: { $in: createdGrantIds } }).catch(() => undefined);
    if (creado) await User.deleteOne({ _id: user._id, accountStatus: 'invitado' }).catch(() => undefined);
    throw err;
  }

  const activation = needsActivation(user)
    ? await issueMagicLink({ userId: user._id as mongoose.Types.ObjectId, proposito: 'activacion', creadoPor: args.actor.id, requestId: args.requestId ?? null })
    : null;

  const latest = grants.reduce((a, g) => (g.expiresAt > a ? g.expiresAt : a), grants[0].expiresAt);
  const items: DemoLinkItem[] = grants.map((g) => ({ slug: g.demoSlug, nombre: args.catalog.get(g.demoSlug)?.nombre ?? g.demoSlug }));
  const email = await awaitEmail(() =>
    sendAccessGranted({
      to: user.email,
      nombre: user.name,
      demos: items,
      expiresAt: latest,
      dias: daysLeft(latest, now),
      activationUrl: activation?.url ?? null,
      mensaje: args.mensaje,
    }),
  );

  return {
    user: {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      accountStatus: user.accountStatus ?? 'activo',
      cuentaNueva: creado,
    },
    grants: grants.map((g) => grantView(g, args.catalog.get(g.demoSlug) ?? null, now)),
    activationUrl: activation?.url ?? null,
    activationExpiresAt: activation?.expiresAt ?? null,
    loginUrl: misDemosLoginUrl(),
    email,
  };
}

// ---------------------------------------------------------------------------
//   Vistas
// ---------------------------------------------------------------------------

type GrantLike = Pick<
  IDemoGrant,
  | '_id'
  | 'demoSlug'
  | 'estado'
  | 'expiresAt'
  | 'ultimoAcceso'
  | 'accesos'
  | 'request'
  | 'otorgadoPor'
  | 'extensiones'
  | 'revocadoEn'
  | 'motivoRevocacion'
  | 'nota'
  | 'createdAt'
  | 'updatedAt'
> & { user?: unknown; convertidoEn?: Date | null; propuesta?: unknown };

export function grantView(g: GrantLike, entry: CatalogEntry | null, now = new Date()) {
  const estadoEfectivo = effectiveGrantState(g, now);
  const u = g.user as { _id?: unknown; email?: string; name?: string; company?: string; role?: string; accountStatus?: string } | undefined;
  const populated = u && typeof u === 'object' && 'email' in u;
  return {
    id: String(g._id),
    demoSlug: g.demoSlug,
    demoNombre: entry?.nombre ?? g.demoSlug,
    demoNombreEn: entry?.nombreEn ?? null,
    accessMode: entry?.accessMode ?? null,
    demoActiva: entry?.activo ?? true,
    estado: g.estado,
    estadoEfectivo,
    vigente: estadoEfectivo === 'activo' || estadoEfectivo === 'convertido',
    expiresAt: g.expiresAt,
    diasRestantes: estadoEfectivo === 'activo' || estadoEfectivo === 'convertido' ? daysLeft(g.expiresAt, now) : 0,
    ultimoAcceso: g.ultimoAcceso ?? null,
    accesos: g.accesos ?? 0,
    request: g.request ? String(g.request) : null,
    otorgadoPor: g.otorgadoPor ? String(g.otorgadoPor) : null,
    extensiones: (g.extensiones ?? []).map((e) => ({ dias: e.dias, desde: e.desde, hasta: e.hasta, por: e.por ? String(e.por) : null, fecha: e.fecha })),
    revocadoEn: g.revocadoEn ?? null,
    motivoRevocacion: g.motivoRevocacion ?? null,
    nota: g.nota ?? null,
    convertidoEn: g.convertidoEn ?? null,
    propuesta: g.propuesta ? String(g.propuesta) : null,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    user: populated
      ? {
          id: String(u._id),
          email: u.email,
          name: u.name,
          company: u.company ?? null,
          role: u.role,
          accountStatus: u.accountStatus ?? 'activo',
        }
      : g.user
        ? { id: String(g.user) }
        : null,
  };
}

// ---------------------------------------------------------------------------
//   Acciones del equipo sobre un acceso
// ---------------------------------------------------------------------------

async function loadGrantForAction(id: string, actor: StaffActor): Promise<{ grant: IDemoGrant; entry: CatalogEntry | null }> {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Acceso no encontrado', 404, 'not_found');
  const grant = await DemoGrant.findById(id);
  if (!grant) throw new AppError('Acceso no encontrado', 404, 'not_found');
  const entry = (await getCatalogMap([grant.demoSlug])).get(grant.demoSlug) ?? null;
  if (entry?.accessMode === 'privado' && !canManagePrivateDemos(actor.role)) {
    throw new AppError('Solo un administrador puede gestionar accesos a demos privadas.', 403, 'requires_admin');
  }
  return { grant, entry };
}

export async function extendGrant(id: string, dias: number, actor: StaffActor, req?: Request) {
  const { grant, entry } = await loadGrantForAction(id, actor);
  if (grant.estado === 'revocado') {
    throw new AppError('Este acceso fue revocado; para volver a dar acceso crea uno nuevo.', 409, 'grant_revoked');
  }
  const now = new Date();
  const base = grant.expiresAt.getTime() > now.getTime() ? grant.expiresAt : now;
  const hasta = new Date(base.getTime() + dias * DAY_MS);
  let updated: IDemoGrant | null;
  try {
    updated = await DemoGrant.findOneAndUpdate(
      { _id: grant._id, estado: { $ne: 'revocado' } },
      {
        // Un acceso convertido (cliente) sigue convertido: solo se amplía su referencia.
        $set: { estado: grant.estado === 'convertido' ? 'convertido' : 'activo', expiresAt: hasta, recordatorioEnviadoEn: null, expiradoEn: null },
        $push: { extensiones: { dias, desde: grant.expiresAt, hasta, por: actor.id, fecha: now } },
      },
      { new: true },
    ).populate('user', 'email name company role accountStatus');
  } catch (err) {
    if (isDuplicateKey(err)) {
      throw new AppError('Esta persona ya tiene otro acceso vigente a esta demo: extiende ese.', 409, 'active_grant_exists');
    }
    throw err;
  }
  if (!updated) throw new AppError('Este acceso fue revocado mientras tanto.', 409, 'grant_revoked');

  // La cuenta pudo borrarse: el acceso se extiende igual, pero no hay a quién escribir.
  const u = (updated.user as unknown as IUser | null) ?? null;
  const email: EmailOutcome = u
    ? await awaitEmail(() =>
        sendAccessExtended({ to: u.email, nombre: u.name, demo: { slug: updated!.demoSlug, nombre: entry?.nombre ?? updated!.demoSlug }, expiresAt: hasta }),
      )
    : { configurado: emailService.isConfigured(), enviado: false };
  await recordAudit({
    actor,
    accion: 'demo_grant.extend',
    entidad: { tipo: 'DemoGrant', id: String(updated._id) },
    detalle: { demoSlug: updated.demoSlug, dias, desde: grant.expiresAt, hasta, estadoAnterior: grant.estado, usuario: u?.email ?? null, emailEnviado: email.enviado },
    req,
  });
  return { grant: grantView(updated, entry, now), email };
}

export async function revokeGrant(id: string, motivo: string | undefined, actor: StaffActor, req?: Request) {
  const { grant, entry } = await loadGrantForAction(id, actor);
  if (grant.estado === 'revocado') throw new AppError('Este acceso ya estaba revocado.', 409, 'grant_revoked');
  const now = new Date();
  const updated = await DemoGrant.findOneAndUpdate(
    { _id: grant._id, estado: { $ne: 'revocado' } },
    { $set: { estado: 'revocado', revocadoPor: actor.id, revocadoEn: now, motivoRevocacion: motivo } },
    { new: true },
  ).populate('user', 'email name company role accountStatus');
  if (!updated) throw new AppError('Este acceso ya estaba revocado.', 409, 'grant_revoked');
  await recordAudit({
    actor,
    accion: 'demo_grant.revoke',
    entidad: { tipo: 'DemoGrant', id: String(updated._id) },
    detalle: { demoSlug: updated.demoSlug, motivo: motivo ?? null, estadoAnterior: grant.estado, usuario: (updated.user as unknown as IUser)?.email },
    req,
  });
  return { grant: grantView(updated, entry, now) };
}

/**
 * Emite un enlace de activación nuevo (invalida los anteriores) para la
 * cuenta de un acceso o de una solicitud aprobada. Si la cuenta ya está
 * activa responde 409 con el enlace de inicio de sesión.
 */
export async function resendActivation(userId: string, actor: StaffActor, ctx: { entidad: { tipo: string; id: string }; req?: Request }) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('La cuenta ya no existe.', 404, 'not_found');
  if (!needsActivation(user)) {
    throw new AppError('Esta cuenta ya está activa: la persona puede iniciar sesión y ver sus demos en Mis demos.', 409, 'account_active', {
      loginUrl: misDemosLoginUrl(),
    });
  }
  const now = new Date();
  const link = await issueMagicLink({ userId: user._id as mongoose.Types.ObjectId, proposito: 'activacion', creadoPor: actor.id });
  const grants = await DemoGrant.find({ user: user._id, ...usableGrantFilter(now) });
  const catalog = await getCatalogMap(grants.map((g) => g.demoSlug));
  let email: EmailOutcome = { configurado: emailService.isConfigured(), enviado: false };
  if (grants.length > 0) {
    const latest = grants.reduce((a, g) => (g.expiresAt > a ? g.expiresAt : a), grants[0].expiresAt);
    email = await awaitEmail(() =>
      sendAccessGranted({
        to: user.email,
        nombre: user.name,
        demos: grants.map((g) => ({ slug: g.demoSlug, nombre: catalog.get(g.demoSlug)?.nombre ?? g.demoSlug })),
        expiresAt: latest,
        dias: daysLeft(latest, now),
        activationUrl: link.url,
      }),
    );
  }
  await recordAudit({
    actor,
    accion: 'demo_grant.resend_activation',
    entidad: ctx.entidad,
    detalle: { usuario: user.email, emailEnviado: email.enviado, accesosVigentes: grants.length },
    req: ctx.req,
  });
  return {
    user: { id: String(user._id), email: user.email, name: user.name, accountStatus: user.accountStatus },
    activationUrl: link.url,
    activationExpiresAt: link.expiresAt,
    email,
  };
}

// ---------------------------------------------------------------------------
//   Listados
// ---------------------------------------------------------------------------

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Filtros de estado del listado de accesos (`por_vencer`: vigentes que vencen
 * en 3 días o menos; `convertido`: clientes con la demo como referencia).
 */
export const GRANT_LIST_STATES = ['activo', 'por_vencer', 'expirado', 'revocado', 'convertido'] as const;
export type GrantListState = (typeof GRANT_LIST_STATES)[number];

function grantStateFilter(estado: GrantListState, now: Date): Record<string, unknown> {
  switch (estado) {
    case 'activo':
      return { estado: 'activo', expiresAt: { $gt: now } };
    case 'por_vencer':
      return { estado: 'activo', expiresAt: { $gt: now, $lte: new Date(now.getTime() + GRANT_REMINDER_DAYS_BEFORE * DAY_MS) } };
    case 'expirado':
      return { $or: [{ estado: 'expirado' }, { estado: { $in: ['activo', 'convertido'] }, expiresAt: { $lte: now } }] };
    case 'revocado':
      return { estado: 'revocado' };
    case 'convertido':
      return { estado: 'convertido', expiresAt: { $gt: now } };
  }
}

export async function listGrants(params: { estado?: string; demo?: string; q?: string; user?: string; request?: string; page: number; limit: number }) {
  const now = new Date();
  const filter: Record<string, unknown> = {};
  if (params.demo) filter.demoSlug = params.demo;
  if (params.user && mongoose.Types.ObjectId.isValid(params.user)) filter.user = params.user;
  if (params.request && mongoose.Types.ObjectId.isValid(params.request)) filter.request = params.request;
  if (params.q) {
    const rx = new RegExp(escapeRegex(params.q), 'i');
    const users = await User.find({ $or: [{ email: rx }, { name: rx }, { company: rx }] }).select('_id').limit(500).lean();
    filter.user = { $in: users.map((u) => u._id) };
  }
  // Conteos por estado con los mismos filtros de demo, persona o búsqueda.
  const base = { ...filter };
  const estado = (GRANT_LIST_STATES as readonly string[]).includes(params.estado ?? '') ? (params.estado as GrantListState) : null;
  if (estado) Object.assign(filter, grantStateFilter(estado, now));
  const [total, docs, ...counts] = await Promise.all([
    DemoGrant.countDocuments(filter),
    DemoGrant.find(filter)
      .sort({ createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .populate('user', 'email name company role accountStatus'),
    DemoGrant.countDocuments(base),
    ...GRANT_LIST_STATES.map((st) => DemoGrant.countDocuments({ ...base, ...grantStateFilter(st, now) })),
  ]);
  const conteos: Record<string, number> = { todos: counts[0] ?? 0 };
  GRANT_LIST_STATES.forEach((st, i) => {
    conteos[st] = counts[i + 1] ?? 0;
  });
  const catalog = await getCatalogMap(docs.map((d) => d.demoSlug));
  return {
    items: docs.map((d) => grantView(d, catalog.get(d.demoSlug) ?? null, now)),
    total,
    page: params.page,
    pages: Math.max(1, Math.ceil(total / params.limit)),
    conteos,
  };
}

/** Accesos de la persona que inició sesión (portal › Mis demos). */
export async function listMyGrants(userId: string) {
  const now = new Date();
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];
  const docs = await DemoGrant.find({ user: userId }).sort({ expiresAt: -1 }).limit(200);
  const catalog = await getCatalogMap(docs.map((d) => d.demoSlug));
  return docs.map((d) => {
    const view = grantView(d, catalog.get(d.demoSlug) ?? null, now);
    // Solo lo que le sirve al prospecto (sin notas internas ni quién lo otorgó).
    return {
      id: view.id,
      demoSlug: view.demoSlug,
      demoNombre: view.demoNombre,
      demoNombreEn: view.demoNombreEn,
      accessMode: view.accessMode,
      demoActiva: view.demoActiva,
      estado: view.estadoEfectivo,
      vigente: view.vigente,
      expiresAt: view.expiresAt,
      diasRestantes: view.diasRestantes,
      ultimoAcceso: view.ultimoAcceso,
      accesos: view.accesos,
      url: `/demo/${view.demoSlug}`,
    };
  });
}

/** Accesos ligados a una solicitud o a la cuenta de su email (detalle del panel). */
export async function grantsForRequest(requestId: string, userId?: string | null) {
  const now = new Date();
  const or: Record<string, unknown>[] = [{ request: requestId }];
  if (userId) or.push({ user: userId });
  const docs = await DemoGrant.find({ $or: or }).sort({ createdAt: -1 }).limit(100).populate('user', 'email name company role accountStatus');
  const catalog = await getCatalogMap(docs.map((d) => d.demoSlug));
  return docs.map((d) => grantView(d, catalog.get(d.demoSlug) ?? null, now));
}

/** Para el panel: la cuenta ligada a un email (si existe). */
export async function findAccountByEmail(email: string) {
  const user = await User.findOne({ email }).select('email name role accountStatus company created_at last_login').lean();
  if (!user) return null;
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    accountStatus: user.accountStatus ?? 'activo',
    company: user.company ?? null,
    creadaEn: user.created_at,
    ultimoIngreso: user.last_login ?? null,
  };
}


// ---------------------------------------------------------------------------
//   Invitación directa (sin solicitud previa)
// ---------------------------------------------------------------------------

const SLUG = /^[a-z0-9-]{2,60}$/;
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const DirectGrantSchema = z.object({
  email: z.string().trim().max(254).email('Escribe un email válido.'),
  nombre: optionalText(120),
  empresa: optionalText(160),
  telefono: optionalText(40),
  demos: z.array(z.string().trim().toLowerCase().regex(SLUG)).min(1, 'Elige al menos una demo.').max(10),
  dias: z.coerce.number().int().min(MIN_GRANT_DAYS).max(MAX_GRANT_DAYS).optional(),
  nota: optionalText(2000),
  mensaje: optionalText(2000),
});

export async function createDirectGrants(body: z.infer<typeof DirectGrantSchema>, actor: StaffActor, req?: Request) {
  const email = await normalizeEmailLikeAuth(body.email);
  if (!email) throw new AppError('Escribe un email válido.', 400, 'invalid_request', { fields: ['email'] });
  const demos = [...new Set(body.demos)];
  const catalog = await resolveDemosForGrant(demos, actor);
  const granted = await grantDemosToPerson({
    persona: { email, nombre: body.nombre, empresa: body.empresa, telefono: body.telefono },
    demos,
    catalog,
    dias: body.dias,
    nota: body.nota,
    mensaje: body.mensaje,
    actor,
    requestId: null,
  });
  // Pipeline comercial: lead ligado a la cuenta y en etapa `demo`.
  const { onDemoAccessGranted } = await import('./leads.service');
  await onDemoAccessGranted({
    email,
    nombre: granted.user.name,
    empresa: body.empresa,
    telefono: body.telefono,
    userId: granted.user.id,
    demos,
    source: 'invitacion',
    actor,
  });

  await recordAudit({
    actor,
    accion: 'demo_grant.create',
    entidad: { tipo: 'User', id: granted.user.id },
    detalle: {
      email,
      demos,
      dias: body.dias ?? null,
      grants: granted.grants.map((g) => g.id),
      cuentaNueva: granted.user.cuentaNueva,
      enlaceActivacion: granted.activationUrl ? 'emitido' : 'no_necesario',
      emailEnviado: granted.email.enviado,
      ...(body.nota ? { nota: body.nota } : {}),
    },
    req,
  });
  return granted;
}
