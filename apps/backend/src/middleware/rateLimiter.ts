import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';
import { generalRateLimitKey } from './client-ip';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  // Por usuario (token válido), por sesión en /auth/refresh o por IP real:
  // así las verificaciones de sesión que hace la web desde Vercel no
  // comparten un solo cupo (ver middleware/client-ip.ts).
  keyGenerator: generalRateLimitKey,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded (${generalRateLimitKey(req).split(':')[0]})`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

/**
 * GET /api/auth/me: lo llama el middleware de la web en cada navegación (y en
 * cada prefetch) a /admin y /dashboard. Tiene su propio cupo por usuario,
 * aparte del general, para que navegar el portal no agote el límite de la API.
 */
export const authMeRateLimiter = rateLimit({
  windowMs: 60000,
  max: parseInt(process.env.AUTH_ME_RATE_LIMIT_MAX || '120', 10) || 120,
  keyGenerator: generalRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const strictRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

/** Validación del enlace de activación al cargar /activar/<token> (por IP). */
export const activationCheckRateLimiter = rateLimit({
  windowMs: 60000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: 'Too many upload requests, please try again later.',
  },
});

export const chatbotRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  // 60 peticiones por minuto por IP (1 por segundo en promedio).
  max: parseInt(process.env.CHATBOT_RATE_LIMIT_MAX || '60', 10) || 60,
  message: {
    success: false,
    message: 'Too many chatbot requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
