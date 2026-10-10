/**
 * rateLimiter.ts — límites de peticiones (en memoria, por instancia).
 *
 * Cada ruta sensible tiene su propio limitador (su propio contador): agotar
 * el cupo del registro no bloquea el inicio de sesión ni la recuperación de
 * contraseña, y viceversa. Todos responden 429 en español con
 * `code: 'rate_limited'` y la cabecera `Retry-After`. Los que cuentan por
 * email van después de la validación de la ruta, que normaliza el correo
 * (`normalizeEmail`), para que sus variantes compartan el contador.
 *
 *  | Limitador                        | Clave            | Cupo por defecto      | Variable                         |
 *  |----------------------------------|------------------|-----------------------|----------------------------------|
 *  | loginRateLimiter                 | IP + email       | 10 cada 15 min        | LOGIN_RATE_LIMIT_MAX             |
 *  | loginIpRateLimiter               | IP               | 30 cada 15 min        | LOGIN_IP_RATE_LIMIT_MAX          |
 *  | registerRateLimiter              | IP               | 5 por hora            | REGISTER_RATE_LIMIT_MAX          |
 *  | forgotPasswordRateLimiter        | IP + email       | 3 cada 15 min         | FORGOT_PASSWORD_RATE_LIMIT_MAX   |
 *  | forgotPasswordIpRateLimiter      | IP               | 10 cada 15 min        | —                                |
 *  | resetPasswordRateLimiter         | IP               | 10 cada 15 min        | RESET_PASSWORD_RATE_LIMIT_MAX    |
 *  | activationRateLimiter            | IP               | 10 cada 15 min        | ACTIVATION_RATE_LIMIT_MAX        |
 *  | activationCheckRateLimiter       | IP               | 20 por minuto         | —                                |
 *  | changePasswordRateLimiter        | cuenta (o IP)    | 5 cada 15 min         | CHANGE_PASSWORD_RATE_LIMIT_MAX   |
 *  | oauthExchangeRateLimiter         | IP               | 20 por minuto         | —                                |
 *  | quoteRateLimiter                 | IP               | 5 por minuto          | —                                |
 *  | strictRateLimiter (contacto)     | IP               | 5 por minuto          | —                                |
 */
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { generalRateLimitKey, resolveClientIp } from './client-ip';
import { readBearer } from './access';
import type { AuthRequest } from '../types';

const MINUTE = 60 * 1000;

function envLimit(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

/** Respuesta 429 común (la cabecera Retry-After la pone express-rate-limit). */
function tooMany(message: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({ success: false, code: 'rate_limited', message });
  };
}

const ipKey = (req: Request) => `ip:${resolveClientIp(req)}`;

/** IP + email del cuerpo (normalizado), para no castigar a otras cuentas de la misma red. */
function ipEmailKey(req: Request): string {
  const raw = (req.body as { email?: unknown } | undefined)?.email;
  const email = typeof raw === 'string' ? raw.trim().toLowerCase().slice(0, 254) : '';
  return `ip:${resolveClientIp(req)}|email:${email}`;
}

/** Cuenta con sesión válida; si no hay, la IP. */
function accountKey(req: Request): string {
  const bearer = readBearer(req as AuthRequest);
  return bearer.user ? `user:${bearer.user.id}` : ipKey(req);
}

interface LimiterOptions {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}

function limiter(opts: LimiterOptions) {
  return rateLimit({
    windowMs: opts.windowMs,
    limit: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: opts.keyGenerator ?? ipKey,
    handler: tooMany(opts.message),
  });
}

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  // Por usuario (token válido), por sesión en /auth/refresh o por IP real:
  // así las verificaciones de sesión que hace la web desde Vercel no
  // comparten un solo cupo (ver middleware/client-ip.ts).
  keyGenerator: generalRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded (${generalRateLimitKey(req).split(':')[0]})`);
    res.status(429).json({
      success: false,
      code: 'rate_limited',
      message: 'Hiciste demasiadas solicitudes. Espera unos minutos e intenta de nuevo.',
    });
  },
});

/**
 * GET /api/auth/me: lo llama el middleware de la web en cada navegación (y en
 * cada prefetch) a /admin y /dashboard. Tiene su propio cupo por usuario,
 * aparte del general, para que navegar el portal no agote el límite de la API.
 */
export const authMeRateLimiter = rateLimit({
  windowMs: MINUTE,
  max: parseInt(process.env.AUTH_ME_RATE_LIMIT_MAX || '120', 10) || 120,
  keyGenerator: generalRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Hiciste demasiadas solicitudes. Espera un momento e intenta de nuevo.'),
});

// --- Cuenta (cada ruta con su propio contador) -------------------------------

/** POST /api/auth/login: por IP + email. */
export const loginRateLimiter = limiter({
  windowMs: 15 * MINUTE,
  max: envLimit('LOGIN_RATE_LIMIT_MAX', 10),
  keyGenerator: ipEmailKey,
  message: 'Demasiados intentos de inicio de sesión con este correo. Espera unos minutos e intenta de nuevo.',
});

/** POST /api/auth/login: tope por IP (muchos correos distintos desde la misma red). */
export const loginIpRateLimiter = limiter({
  windowMs: 15 * MINUTE,
  max: envLimit('LOGIN_IP_RATE_LIMIT_MAX', 30),
  message: 'Demasiados intentos de inicio de sesión desde esta conexión. Espera unos minutos e intenta de nuevo.',
});

/** POST /api/auth/register: por IP. */
export const registerRateLimiter = limiter({
  windowMs: 60 * MINUTE,
  max: envLimit('REGISTER_RATE_LIMIT_MAX', 5),
  message: 'Demasiados registros desde esta conexión. Intenta de nuevo más tarde.',
});

/** POST /api/auth/forgot-password: por IP + email. */
export const forgotPasswordRateLimiter = limiter({
  windowMs: 15 * MINUTE,
  max: envLimit('FORGOT_PASSWORD_RATE_LIMIT_MAX', 3),
  keyGenerator: ipEmailKey,
  message: 'Ya pediste varios enlaces para este correo. Revisa tu bandeja (y el spam) o intenta de nuevo en unos minutos.',
});

/** POST /api/auth/forgot-password: tope por IP (muchos correos distintos desde la misma red). */
export const forgotPasswordIpRateLimiter = limiter({
  windowMs: 15 * MINUTE,
  max: 10,
  message: 'Pediste demasiados enlaces desde esta conexión. Espera unos minutos e intenta de nuevo.',
});

/** POST /api/auth/reset-password: por IP. */
export const resetPasswordRateLimiter = limiter({
  windowMs: 15 * MINUTE,
  max: envLimit('RESET_PASSWORD_RATE_LIMIT_MAX', 10),
  message: 'Demasiados intentos de cambiar la contraseña. Espera unos minutos e intenta de nuevo.',
});

/** POST /api/auth/activate: por IP. */
export const activationRateLimiter = limiter({
  windowMs: 15 * MINUTE,
  max: envLimit('ACTIVATION_RATE_LIMIT_MAX', 10),
  message: 'Demasiados intentos de activar la cuenta. Espera unos minutos e intenta de nuevo.',
});

/** Validación del enlace de activación al cargar /activar/<token> (por IP). */
export const activationCheckRateLimiter = limiter({
  windowMs: MINUTE,
  max: 20,
  message: 'Demasiadas verificaciones del enlace. Espera un momento e intenta de nuevo.',
});

/** POST /api/auth/change-password: por cuenta (o IP sin sesión). */
export const changePasswordRateLimiter = limiter({
  windowMs: 15 * MINUTE,
  max: envLimit('CHANGE_PASSWORD_RATE_LIMIT_MAX', 5),
  keyGenerator: accountKey,
  message: 'Demasiados intentos de cambiar la contraseña. Espera unos minutos e intenta de nuevo.',
});

/** POST /api/auth/google/exchange: por IP. */
export const oauthExchangeRateLimiter = limiter({
  windowMs: MINUTE,
  max: 20,
  message: 'Demasiados intentos de inicio de sesión con Google. Espera un momento e intenta de nuevo.',
});

// --- Formularios públicos -------------------------------------------------------

/** POST /api/quotes: por IP. */
export const quoteRateLimiter = limiter({
  windowMs: MINUTE,
  max: 5,
  message: 'Enviaste varias solicitudes seguidas. Espera un minuto e intenta de nuevo.',
});

/** Formulario de contacto (POST /api/contact): por IP, 5 por minuto. */
export const strictRateLimiter = limiter({
  windowMs: MINUTE,
  max: 5,
  message: 'Enviaste varias solicitudes seguidas. Espera un minuto e intenta de nuevo.',
});

export const uploadRateLimiter = limiter({
  windowMs: MINUTE,
  max: 10,
  message: 'Subiste demasiados archivos seguidos. Espera un minuto e intenta de nuevo.',
});

export const chatbotRateLimiter = rateLimit({
  windowMs: MINUTE,
  // 60 peticiones por minuto por IP (1 por segundo en promedio).
  max: parseInt(process.env.CHATBOT_RATE_LIMIT_MAX || '60', 10) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany('Enviaste demasiados mensajes seguidos. Espera un momento.'),
});
