/**
 * demo-access.service.ts — decide en el servidor si alguien puede abrir una
 * demo. Es la única fuente de verdad: la usan GET /api/demo-access/:slug (la
 * web, al abrir /demo/<slug>) y el middleware `requireStaffOrDemoAccess` de
 * las APIs de demos con backend real (vía `demoGrantResolver`).
 *
 * Reglas, en este orden (wiki 04, §10.1):
 *  1. La demo no existe en el catálogo → `no_existe`.
 *  2. Staff (admin, sales, manager, developer) → permitido (`staff`).
 *  3. Demo desactivada → `desactivada`.
 *  4. Modo `publico` → permitido (`publico`); si hay un acceso vigente se
 *     informa su vencimiento y se registra el uso.
 *  5. Sin sesión → `sin_sesion`.
 *  6. Acceso `activo` (o `convertido`, la referencia de 90 días de un
 *     cliente) con `expiresAt` futuro → permitido (`grant`). La fecha se
 *     compara en cada consulta: no depende del job de expiración.
 *  7. Acceso vencido o marcado `expirado` → `expirado`.
 *  8. Acceso revocado → `revocado`.
 *  9. En otro caso → `sin_acceso`.
 * Si MongoDB no responde, las demos `publico` (según la semilla) siguen
 * abiertas y el resto falla cerrada (`no_disponible`).
 */
import mongoose from 'mongoose';
import DemoGrant, { type IDemoGrant } from '../models/DemoGrant';
import { isDemoStaffRole } from '../config/demos';
import { type DemoAccessMode, type DemoAccessResolver, isDbReady } from '../middleware/access';
import { type CatalogEntry, getCatalogEntry, seedEntry } from './demo-catalog.service';
import { logger } from '../utils/logger';

const DAY_MS = 24 * 60 * 60 * 1000;
/** El middleware de las APIs actualiza `ultimoAcceso` como máximo cada 5 min. */
const LAST_ACCESS_THROTTLE_MS = 5 * 60 * 1000;
/**
 * Una "apertura" (`accesos`) es una visita: las consultas a GET
 * /api/demo-access con menos de 30 min desde el último uso (p. ej. la web
 * que renueva la verificación cada pocos minutos con la demo abierta) solo
 * actualizan `ultimoAcceso` y no inflan el conteo que ve el equipo.
 */
export const VISIT_GAP_MS = 30 * 60 * 1000;

export type DemoAccessReason =
  | 'staff'
  | 'publico'
  | 'grant'
  | 'sin_sesion'
  | 'sin_acceso'
  | 'expirado'
  | 'revocado'
  | 'desactivada'
  | 'no_existe'
  | 'no_disponible';

export interface DemoAccessResult {
  allowed: boolean;
  slug: string;
  accessMode: DemoAccessMode | null;
  activo: boolean;
  reason: DemoAccessReason;
  /** Vencimiento del acceso del usuario (si tiene uno), o null. */
  expiresAt: Date | null;
  diasRestantes: number | null;
  grantId?: string;
}

export interface AccessUser {
  id: string;
  role: string;
}

export type EffectiveGrantState = 'activo' | 'expirado' | 'revocado' | 'convertido';

/**
 * Estado real de un acceso según la hora actual. Un acceso `convertido`
 * (la persona ya es cliente) sigue abriendo la demo como referencia hasta
 * su `expiresAt`; después cuenta como `expirado`.
 */
export function effectiveGrantState(g: Pick<IDemoGrant, 'estado' | 'expiresAt'>, now = new Date()): EffectiveGrantState {
  if (g.estado === 'revocado') return 'revocado';
  if (g.estado === 'expirado' || g.expiresAt.getTime() <= now.getTime()) return 'expirado';
  if (g.estado === 'convertido') return 'convertido';
  return 'activo';
}

/** El acceso abre la demo ahora (activo o convertido vigente). */
export function isGrantUsable(g: Pick<IDemoGrant, 'estado' | 'expiresAt'>, now = new Date()): boolean {
  const state = effectiveGrantState(g, now);
  return state === 'activo' || state === 'convertido';
}

/** Filtro de MongoDB de los accesos que abren la demo ahora. */
export function usableGrantFilter(now = new Date()): Record<string, unknown> {
  return { estado: { $in: ['activo', 'convertido'] }, expiresAt: { $gt: now } };
}

/** Días que le quedan a un acceso (0 si ya venció). */
export function daysLeft(expiresAt: Date, now = new Date()): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_MS));
}

function result(entry: CatalogEntry, allowed: boolean, reason: DemoAccessReason, grant?: IDemoGrant | null, now = new Date()): DemoAccessResult {
  // Con acceso: vencimiento y días restantes. Sin acceso: solo la fecha en
  // que venció (motivo `expirado`); un acceso revocado no informa fechas.
  const showDate = !!grant && (allowed || reason === 'expirado');
  return {
    allowed,
    slug: entry.slug,
    accessMode: entry.accessMode,
    activo: entry.activo,
    reason,
    expiresAt: showDate ? grant!.expiresAt : null,
    diasRestantes: showDate ? (allowed ? daysLeft(grant!.expiresAt, now) : 0) : null,
    grantId: allowed && grant ? String(grant._id) : undefined,
  };
}

async function recordUse(grant: IDemoGrant, registrar: boolean, now: Date): Promise<void> {
  try {
    // Uso tras 30 min (o más) sin actividad, o el primero: cuenta una visita.
    const nuevaVisita = await DemoGrant.updateOne(
      { _id: grant._id, $or: [{ ultimoAcceso: null }, { ultimoAcceso: { $lt: new Date(now.getTime() - VISIT_GAP_MS) } }] },
      { $inc: { accesos: 1 }, $set: { ultimoAcceso: now } },
    );
    if (nuevaVisita.modifiedCount > 0) return;
    // Misma visita: solo se actualiza la fecha (las APIs, como máximo cada 5 min).
    const filtro = registrar
      ? { _id: grant._id }
      : { _id: grant._id, ultimoAcceso: { $lt: new Date(now.getTime() - LAST_ACCESS_THROTTLE_MS) } };
    await DemoGrant.updateOne(filtro, { $set: { ultimoAcceso: now } });
  } catch (err) {
    logger.warn(`[demo-access] No se pudo registrar el uso: ${(err as Error)?.message ?? err}`);
  }
}

/**
 * Evalúa el acceso y, si hay un acceso vigente, registra el uso: una visita
 * nueva (`accesos`) cuando pasaron 30 min o más desde el último uso, y la
 * fecha del último uso (`registrar: true` en GET /api/demo-access; el
 * middleware de las APIs la actualiza como máximo cada 5 min).
 */
export async function evaluateDemoAccess(
  slug: string,
  user: AccessUser | null,
  opts: { registrar?: boolean; sinRegistro?: boolean; now?: Date } = {},
): Promise<DemoAccessResult> {
  const now = opts.now ?? new Date();
  const registrar = opts.registrar === true;
  // `sinRegistro`: solo decide, no cuenta uso (prefetch de la web).
  const record = (grant: IDemoGrant) => (opts.sinRegistro ? Promise.resolve() : recordUse(grant, registrar, now));

  let entry: CatalogEntry | null;
  let dbDown = !isDbReady();
  if (dbDown) {
    entry = seedEntry(slug);
  } else {
    try {
      entry = await getCatalogEntry(slug);
    } catch (err) {
      logger.warn(`[demo-access] Catálogo no disponible: ${(err as Error)?.message ?? err}`);
      dbDown = true;
      entry = seedEntry(slug);
    }
  }

  if (!entry) {
    return { allowed: false, slug, accessMode: null, activo: false, reason: 'no_existe', expiresAt: null, diasRestantes: null };
  }
  if (user && isDemoStaffRole(user.role)) return result(entry, true, 'staff', null, now);
  if (!entry.activo) return result(entry, false, 'desactivada', null, now);

  if (entry.accessMode === 'publico') {
    if (!user || dbDown || !mongoose.Types.ObjectId.isValid(user.id)) return result(entry, true, 'publico', null, now);
    try {
      const grant = await DemoGrant.findOne({ user: user.id, demoSlug: slug, ...usableGrantFilter(now) });
      if (grant) await record(grant);
      return result(entry, true, 'publico', grant, now);
    } catch {
      return result(entry, true, 'publico', null, now);
    }
  }

  if (dbDown) return result(entry, false, 'no_disponible', null, now);
  if (!user || !mongoose.Types.ObjectId.isValid(user.id)) return result(entry, false, 'sin_sesion', null, now);

  let grants: IDemoGrant[];
  try {
    grants = await DemoGrant.find({ user: user.id, demoSlug: slug }).sort({ updatedAt: -1 }).limit(20);
  } catch (err) {
    logger.warn(`[demo-access] No se pudieron leer los accesos: ${(err as Error)?.message ?? err}`);
    return result(entry, false, 'no_disponible', null, now);
  }

  const vigente = grants.find((g) => isGrantUsable(g, now));
  if (vigente) {
    await record(vigente);
    return result(entry, true, 'grant', vigente, now);
  }
  const ultimo = grants[0];
  if (!ultimo) return result(entry, false, 'sin_acceso', null, now);
  const estado = effectiveGrantState(ultimo, now);
  return result(entry, false, estado === 'revocado' ? 'revocado' : 'expirado', ultimo, now);
}

/** Error que el middleware traduce a 503 (falla cerrada). */
export class DemoAccessUnavailableError extends Error {}

/**
 * Resolvedor de P4 para `requireStaffOrDemoAccess` (middleware/access.ts):
 * catálogo editable + DemoGrant vigente. Se registra en createApp().
 */
export const demoGrantResolver: DemoAccessResolver = async ({ slug, user }) => {
  const r = await evaluateDemoAccess(slug, user ? { id: user.id, role: user.role } : null);
  if (r.reason === 'no_disponible') throw new DemoAccessUnavailableError('MongoDB no disponible');
  if (r.allowed) {
    const reason = r.reason === 'staff' ? 'staff' : r.reason === 'grant' ? 'grant' : 'public';
    return { allowed: true, reason, grantId: r.grantId, motivo: r.reason };
  }
  return { allowed: false, reason: user ? 'no_access' : 'login_required', motivo: r.reason };
};
