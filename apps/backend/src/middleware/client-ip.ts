/**
 * client-ip.ts — IP del visitante y clave del rate-limit general.
 *
 * - `req.ip` ya es la IP real del visitante cuando el navegador llama directo
 *   al backend (trust proxy = TRUST_PROXY_HOPS).
 * - Cuando llama el servidor de la web (middleware de Next o la ruta proxy de
 *   LinkedIn Ads), `req.ip` es la IP de salida de Vercel, compartida por todos
 *   los visitantes. Si la petición trae `X-Internal-Key` igual a
 *   INTERNAL_API_KEY, se usa `X-Client-IP` (la IP que vio la web).
 * - El rate-limit general cuenta por usuario cuando hay un token válido, por
 *   sesión en /api/auth/refresh y por IP en el resto, para que las
 *   verificaciones de sesión que hace la web desde Vercel no compartan cupo.
 */
import crypto from 'crypto';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { readBearer } from './access';
import { AuthRequest } from '../types';

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function isValidRefreshToken(token: string): boolean {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) return false;
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/** true si la petición viene del servidor de la web con la clave interna. */
export function hasValidInternalKey(req: Request): boolean {
  const internalKey = process.env.INTERNAL_API_KEY;
  const provided = req.header('x-internal-key');
  return !!internalKey && !!provided && safeEqual(provided, internalKey);
}

/** IP del visitante (ver encabezado del archivo). */
export function resolveClientIp(req: Request): string {
  const clientIp = req.header('x-client-ip');
  if (clientIp && clientIp.length <= 64 && hasValidInternalKey(req)) return clientIp.trim();
  return req.ip || 'unknown';
}

/** Clave del rate-limit general: usuario, sesión de refresco o IP. */
export function generalRateLimitKey(req: Request): string {
  const bearer = readBearer(req as AuthRequest);
  if (bearer.user) return `user:${bearer.user.id}`;
  const refreshToken = (req.body as { refreshToken?: unknown } | undefined)?.refreshToken;
  if (
    req.originalUrl.startsWith('/api/auth/refresh') &&
    typeof refreshToken === 'string' &&
    refreshToken.length > 0 &&
    refreshToken.length <= 4096 &&
    isValidRefreshToken(refreshToken)
  ) {
    // Solo un refresh token con firma válida tiene cupo propio; uno inventado
    // cuenta por IP (si no, cada valor al azar tendría un cupo nuevo).
    return `refresh:${crypto.createHash('sha256').update(refreshToken).digest('hex').slice(0, 32)}`;
  }
  return `ip:${resolveClientIp(req)}`;
}
