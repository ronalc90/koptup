/**
 * audit.service.ts — escribe en la bitácora (AuditLog). Nunca hace fallar la
 * operación que audita: si MongoDB rechaza el registro, lo deja en el log.
 */
import crypto from 'crypto';
import type { Request } from 'express';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog';
import { resolveClientIp } from '../middleware/client-ip';
import { logger } from '../utils/logger';

export interface AuditActor {
  id?: string | null;
  email?: string;
  role?: string;
}

export interface AuditEntry {
  actor: AuditActor | null;
  accion: string;
  entidad: { tipo: string; id?: string | mongoose.Types.ObjectId | null };
  detalle?: Record<string, unknown>;
  req?: Request;
}

export function hashIp(ip: string | undefined | null): string | undefined {
  if (!ip) return undefined;
  return crypto.createHash('sha256').update(`koptup-ip:${ip}`).digest('hex').slice(0, 32);
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const actorId = entry.actor?.id && mongoose.Types.ObjectId.isValid(entry.actor.id) ? entry.actor.id : null;
    await AuditLog.create({
      actor: actorId,
      actorEmail: entry.actor?.email,
      actorRol: entry.actor?.role,
      accion: entry.accion,
      entidad: { tipo: entry.entidad.tipo, id: entry.entidad.id ? String(entry.entidad.id) : undefined },
      detalle: entry.detalle,
      ipHash: entry.req ? hashIp(resolveClientIp(entry.req)) : undefined,
    });
  } catch (err) {
    logger.error(`[audit] No se pudo registrar ${entry.accion}: ${(err as Error)?.message ?? err}`);
  }
}
