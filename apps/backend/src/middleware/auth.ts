import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';
import { parseDurationSeconds } from '../utils/duration';
import { sendError } from '../utils/http-error';

/**
 * Exige un `Authorization: Bearer` válido. Errores con el formato único
 * (`utils/http-error.ts`):
 *  - 401 `unauthorized`: no hay token.
 *  - 401 `TOKEN_EXPIRED`: el token venció (la web lo renueva y reintenta).
 *  - 401 `invalid_token`: el token no es válido.
 *  - 500 `server_misconfigured`: falta JWT_SECRET en el servidor.
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 401, 'unauthorized', 'Inicia sesión para continuar.');
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      sendError(res, 500, 'server_misconfigured', 'El servicio no está disponible en este momento. Intenta de nuevo más tarde.');
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        email: string;
        role: string;
        name?: string;
        sid?: string;
      };

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        sendError(res, 401, 'TOKEN_EXPIRED', 'Tu sesión expiró. Inicia sesión de nuevo.');
        return;
      }

      sendError(res, 401, 'invalid_token', 'Tu sesión no es válida. Inicia sesión de nuevo.');
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    sendError(res, 500, 'internal_error', 'No pudimos verificar tu sesión. Intenta de nuevo.');
  }
};

export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: string;
  name?: string;
  /** Sesión (dispositivo) a la que pertenece el token (services/session.service.ts). */
  sid?: string;
}): string => {
  const jwtSecret = process.env.JWT_SECRET!;
  const expiresIn: string = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign(payload, jwtSecret, { expiresIn } as jwt.SignOptions);
};

/**
 * Vida máxima (y por defecto) del token de renovación: 7 días, lo mismo que
 * dura la cookie `refreshToken` que guarda la web.
 */
export const MAX_REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Vida del token de renovación en segundos, según JWT_REFRESH_EXPIRES_IN
 * (`7d`, `12h`, `3600`…). La misma cifra firma el JWT y vence la copia en
 * Redis, así que acortarla acorta la sesión de verdad. Un valor inválido o
 * mayor de 7 días usa 7 días (config/env.ts lo avisa al arrancar).
 */
export function refreshTokenTtlSeconds(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = parseDurationSeconds(env.JWT_REFRESH_EXPIRES_IN);
  return parsed === null ? MAX_REFRESH_TTL_SECONDS : Math.min(parsed, MAX_REFRESH_TTL_SECONDS);
}

export const generateRefreshToken = (payload: {
  id: string;
  email: string;
}): string => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;

  return jwt.sign(payload, jwtRefreshSecret, { expiresIn: refreshTokenTtlSeconds() });
};

export const verifyRefreshToken = (token: string): any => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
  return jwt.verify(token, jwtRefreshSecret);
};
