/**
 * session.service.ts — sesiones renovables por dispositivo.
 *
 * Cada inicio de sesión (login, activación, Google, cambio de contraseña)
 * crea una sesión propia con un identificador aleatorio (`sid`) que viaja en
 * el token de renovación y en el de acceso. En Redis:
 *  - `refresh_token:<userId>:<sid>`: hash SHA-256 del token de renovación,
 *    con el mismo vencimiento del JWT;
 *  - `refresh_sessions:<userId>`: conjunto ordenado de los `sid` vigentes
 *    (puntaje = vencimiento), para cerrarlas todas a la vez.
 *
 * Así, iniciar sesión en otro navegador ya no cierra la del primero. Cambiar
 * o restablecer la contraseña, o suprimir la cuenta, revoca todas. "Recordarme"
 * desmarcado crea una sesión corta (1 día) que la web guarda en una cookie de
 * sesión (se borra al cerrar el navegador).
 *
 * Compatibilidad: los tokens emitidos antes de este cambio (sin `sid`) se
 * validan contra la clave anterior `refresh_token:<userId>`.
 */
import crypto from 'crypto';
import { getRedisClient, redis } from '../config/redis';
import { generateAccessToken, refreshTokenTtlSeconds, verifyRefreshToken } from '../middleware/auth';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

/** Sesiones simultáneas por cuenta (la más antigua se cierra al pasar el tope). */
export const MAX_SESSIONS_PER_USER = 10;
/** Vida de una sesión sin "Recordarme". */
export const SHORT_SESSION_TTL_SECONDS = 24 * 60 * 60;

export interface SessionUser {
  _id: unknown;
  email: string;
  role: string;
  name?: string;
}

export interface IssuedSession {
  accessToken: string;
  refreshToken: string;
  /** Segundos de vida de la sesión renovable. */
  expiresIn: number;
  remember: boolean;
  user: { id: unknown; email: string; name?: string; role: string };
}

const sessionKey = (userId: string, sid: string) => `refresh_token:${userId}:${sid}`;
const sessionsKey = (userId: string) => `refresh_sessions:${userId}`;
const legacyKey = (userId: string) => `refresh_token:${userId}`;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Crea una sesión nueva (un dispositivo) y devuelve los tokens. */
export async function createSession(user: SessionUser, opts: { remember?: boolean } = {}): Promise<IssuedSession> {
  const remember = opts.remember !== false;
  const userId = String(user._id);
  const sid = crypto.randomBytes(16).toString('hex');
  const ttl = remember ? refreshTokenTtlSeconds() : Math.min(SHORT_SESSION_TTL_SECONDS, refreshTokenTtlSeconds());
  const accessToken = generateAccessToken({ id: userId, email: user.email, role: user.role, name: user.name, sid });
  const refreshToken = jwt.sign({ id: userId, email: user.email, sid, rem: remember ? 1 : 0 }, process.env.JWT_REFRESH_SECRET!, { expiresIn: ttl });

  try {
    const client = await getRedisClient();
    const now = Date.now();
    const expiresAt = now + ttl * 1000;
    await client.setEx(sessionKey(userId, sid), ttl, hashToken(refreshToken));
    await client.zAdd(sessionsKey(userId), { score: expiresAt, value: sid });
    // Limpia las vencidas y aplica el tope de sesiones (cierra las más antiguas).
    await client.zRemRangeByScore(sessionsKey(userId), 0, now);
    const count = await client.zCard(sessionsKey(userId));
    if (count > MAX_SESSIONS_PER_USER) {
      const oldest = await client.zRange(sessionsKey(userId), 0, count - MAX_SESSIONS_PER_USER - 1);
      if (oldest.length) {
        await client.del(oldest.map((s) => sessionKey(userId, s)));
        await client.zRem(sessionsKey(userId), oldest);
      }
    }
    await client.expire(sessionsKey(userId), refreshTokenTtlSeconds());
  } catch (err) {
    // Sin Redis el login responde igual, pero la sesión no se podrá renovar.
    logger.warn(`[session] No se pudo guardar la sesión en Redis: ${(err as Error)?.message ?? err}`);
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: ttl,
    remember,
    user: { id: user._id, email: user.email, name: user.name, role: user.role },
  };
}

export type RefreshCheck = { ok: true; userId: string; sid: string | null } | { ok: false };

/** Verifica un token de renovación: firma, vencimiento y que su sesión siga abierta. */
export async function validateRefreshToken(token: string): Promise<RefreshCheck> {
  let decoded: { id?: string; sid?: string };
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return { ok: false };
  }
  if (!decoded?.id) return { ok: false };
  if (decoded.sid) {
    const stored = await redis.get(sessionKey(decoded.id, decoded.sid));
    return stored && stored === hashToken(token) ? { ok: true, userId: decoded.id, sid: decoded.sid } : { ok: false };
  }
  // Token anterior a las sesiones por dispositivo.
  const stored = await redis.get(legacyKey(decoded.id));
  return stored && stored === token ? { ok: true, userId: decoded.id, sid: null } : { ok: false };
}

/** Cierra una sesión (cerrar sesión en este dispositivo). */
export async function revokeSession(userId: string, sid: string | null | undefined): Promise<void> {
  try {
    const client = await getRedisClient();
    if (sid) {
      await client.del(sessionKey(userId, sid));
      await client.zRem(sessionsKey(userId), sid);
    } else {
      await client.del(legacyKey(userId));
    }
  } catch (err) {
    logger.warn(`[session] No se pudo cerrar la sesión: ${(err as Error)?.message ?? err}`);
  }
}

/**
 * Cierra todas las sesiones de la cuenta (cambio o restablecimiento de
 * contraseña, supresión de datos), salvo `exceptSid` si se indica.
 */
export async function revokeAllSessions(userId: string, opts: { exceptSid?: string | null } = {}): Promise<number> {
  try {
    const client = await getRedisClient();
    const sids = await client.zRange(sessionsKey(userId), 0, -1);
    const toClose = sids.filter((s) => s !== opts.exceptSid);
    if (toClose.length) {
      await client.del(toClose.map((s) => sessionKey(userId, s)));
      await client.zRem(sessionsKey(userId), toClose);
    }
    await client.del(legacyKey(userId));
    return toClose.length;
  } catch (err) {
    logger.warn(`[session] No se pudieron cerrar las sesiones: ${(err as Error)?.message ?? err}`);
    return 0;
  }
}
