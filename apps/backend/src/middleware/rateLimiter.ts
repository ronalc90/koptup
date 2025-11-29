import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
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
  max: 60, // 60 peticiones por minuto (1 por segundo en promedio)
  message: {
    success: false,
    message: 'Too many chatbot requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
