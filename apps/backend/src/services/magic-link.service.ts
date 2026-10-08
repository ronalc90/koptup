/**
 * magic-link.service.ts — enlaces de un solo uso (activación de cuenta y
 * restablecimiento de contraseña).
 *
 * - El token es aleatorio (32 bytes, base64url); en la BD solo queda su hash
 *   SHA-256 (MagicLinkToken.tokenHash).
 * - Emitir uno nuevo invalida los pendientes del mismo usuario y propósito.
 * - `consumeMagicLink` es atómico: dos consumos simultáneos del mismo token
 *   no pueden tener éxito los dos.
 */
import crypto from 'crypto';
import mongoose from 'mongoose';
import MagicLinkToken, { type IMagicLinkToken } from '../models/MagicLinkToken';
import {
  ACTIVATION_TOKEN_TTL_MS,
  RESET_TOKEN_TTL_MS,
  frontendUrl,
  type MagicLinkPurpose,
} from '../config/demos';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isWellFormedToken(token: unknown): token is string {
  return typeof token === 'string' && TOKEN_PATTERN.test(token);
}

/** URL de la web donde se usa el token. */
export function magicLinkUrl(proposito: MagicLinkPurpose, token: string): string {
  return proposito === 'activacion'
    ? `${frontendUrl()}/activar/${token}`
    : `${frontendUrl()}/reset-password?token=${token}`;
}

export interface IssuedMagicLink {
  token: string;
  url: string;
  expiresAt: Date;
  id: string;
}

export async function issueMagicLink(args: {
  userId: string | mongoose.Types.ObjectId;
  proposito: MagicLinkPurpose;
  creadoPor?: string | mongoose.Types.ObjectId | null;
  requestId?: string | mongoose.Types.ObjectId | null;
  now?: Date;
}): Promise<IssuedMagicLink> {
  const now = args.now ?? new Date();
  await invalidatePendingMagicLinks(args.userId, args.proposito, now);
  const token = crypto.randomBytes(32).toString('base64url');
  const ttl = args.proposito === 'activacion' ? ACTIVATION_TOKEN_TTL_MS : RESET_TOKEN_TTL_MS;
  const expiresAt = new Date(now.getTime() + ttl);
  const doc = await MagicLinkToken.create({
    tokenHash: hashToken(token),
    user: args.userId,
    proposito: args.proposito,
    expiresAt,
    creadoPor: args.creadoPor ?? undefined,
    request: args.requestId ?? undefined,
  });
  return { token, url: magicLinkUrl(args.proposito, token), expiresAt, id: String(doc._id) };
}

/** Marca como usados (invalidados) los enlaces pendientes de un usuario. */
export async function invalidatePendingMagicLinks(
  userId: string | mongoose.Types.ObjectId,
  proposito: MagicLinkPurpose,
  now = new Date(),
): Promise<number> {
  const res = await MagicLinkToken.updateMany(
    { user: userId, proposito, usedAt: null },
    { $set: { usedAt: now, invalidado: true } },
  );
  return res.modifiedCount ?? 0;
}

export type MagicLinkFailure = 'token_invalid' | 'token_used' | 'token_replaced' | 'token_expired';

/** `ok: true` trae `doc`; `ok: false` trae `reason`. */
export interface MagicLinkLookup {
  ok: boolean;
  doc?: IMagicLinkToken;
  reason?: MagicLinkFailure;
}

/** Explica por qué un token no sirve (sin consumirlo). */
async function diagnose(tokenHash: string, proposito: MagicLinkPurpose, now: Date): Promise<MagicLinkFailure> {
  const doc = await MagicLinkToken.findOne({ tokenHash, proposito }).lean();
  if (!doc) return 'token_invalid';
  if (doc.usedAt && doc.invalidado) return 'token_replaced';
  if (doc.usedAt) return 'token_used';
  if (doc.expiresAt.getTime() <= now.getTime()) return 'token_expired';
  return 'token_invalid';
}

/** Valida el token sin consumirlo (la página de activación lo usa al cargar). */
export async function inspectMagicLink(token: unknown, proposito: MagicLinkPurpose, now = new Date()): Promise<MagicLinkLookup> {
  if (!isWellFormedToken(token)) return { ok: false, reason: 'token_invalid' };
  const tokenHash = hashToken(token);
  const doc = await MagicLinkToken.findOne({ tokenHash, proposito, usedAt: null, expiresAt: { $gt: now } });
  if (doc) return { ok: true, doc };
  return { ok: false, reason: await diagnose(tokenHash, proposito, now) };
}

/** Consume el token de forma atómica (un solo uso). */
export async function consumeMagicLink(token: unknown, proposito: MagicLinkPurpose, now = new Date()): Promise<MagicLinkLookup> {
  if (!isWellFormedToken(token)) return { ok: false, reason: 'token_invalid' };
  const tokenHash = hashToken(token);
  const doc = await MagicLinkToken.findOneAndUpdate(
    { tokenHash, proposito, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true },
  );
  if (doc) return { ok: true, doc };
  return { ok: false, reason: await diagnose(tokenHash, proposito, now) };
}

/** Deshace un consumo (si la operación que seguía falló), para poder reintentar. */
export async function releaseMagicLink(id: string | mongoose.Types.ObjectId): Promise<void> {
  await MagicLinkToken.updateOne({ _id: id, invalidado: { $ne: true } }, { $set: { usedAt: null } });
}

export const MAGIC_LINK_ERRORS: Record<MagicLinkFailure, string> = {
  token_invalid: 'El enlace no es válido. Revisa que lo hayas copiado completo o pide uno nuevo.',
  token_used: 'Este enlace ya se usó. Si ya creaste tu contraseña, inicia sesión; si no, pide uno nuevo.',
  token_replaced: 'Este enlace fue reemplazado por uno más reciente. Usa el último enlace que te enviamos.',
  token_expired: 'El enlace venció. Pide uno nuevo.',
};
