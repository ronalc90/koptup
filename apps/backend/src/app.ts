/**
 * app.ts — construye la aplicación Express (middleware + rutas) sin abrir el
 * puerto ni conectar a la base de datos. `index.ts` la arranca; las pruebas de
 * integración (supertest) la usan directamente.
 *
 * La política de autorización de cada ruta está en `routes/POLICIES.md` y se
 * aplica en cada archivo de rutas con los middleware de `middleware/access.ts`.
 */
import express, { Express, NextFunction, Request, RequestHandler, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import passport from 'passport';
import { logger } from './utils/logger';
import { CorsError, errorHandler } from './middleware/errorHandler';
import { authMeRateLimiter, rateLimiter, chatbotRateLimiter } from './middleware/rateLimiter';

import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import chatRoutes from './routes/chat.routes';
import contactRoutes from './routes/contact.routes';
import quoteRoutes from './routes/quote.routes';
import projectRoutes from './routes/project.routes';
import ordersRoutes from './routes/orders.routes';
import deliverablesRoutes from './routes/deliverables.routes';
import invoicesRoutes from './routes/invoices.routes';
import messagesRoutes from './routes/messages.routes';
import cuentasRoutes from './routes/cuentas.routes';
import expertSystemRoutes from './routes/expert-system.routes';
import cupsRoutes from './routes/cups.routes';
import chatbotRoutes from './routes/chatbot.routes';
import demoRagRoutes from './routes/demo-rag.routes';
import auditoriaRoutes from './routes/auditoria.routes';
import contentManagerRoutes from './routes/content-manager.routes';
import notificationsRoutes from './routes/notifications.routes';
import documentoConocimientoConfigRoutes from './routes/documentoConocimientoConfig.routes';
import reglasFacturacionRoutes from './routes/reglas-facturacion.routes';
import liquidacionRoutes from './routes/liquidacion.routes';
import testRoutes from './routes/test.routes';
import adminRoutes from './routes/admin.routes';
import linkedinAdsRoutes from './routes/linkedin-ads.routes';

/** Orígenes de producción siempre permitidos. */
const PRODUCTION_ORIGINS = ['https://koptup.com', 'https://www.koptup.com'];
const DEVELOPMENT_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

export function getAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const extra = env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  const base = env.NODE_ENV === 'production' ? PRODUCTION_ORIGINS : [...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS];
  return [...new Set([...base, ...extra])];
}

/** Cabecera con la que el dueño de un bot del chatbot prueba su propiedad. */
export const BOT_OWNER_TOKEN_HEADER = 'X-Bot-Owner-Token';

/** Límite del cuerpo JSON general y el de la ingesta de documentos del chatbot (base64). */
const JSON_LIMIT_DEFAULT = '2mb';
const JSON_LIMIT_CHATBOT_DOCS = '15mb';
const CHATBOT_DOCS_PATH = /^\/api\/chatbot\/bots\/[^/]+\/docs\/?$/;

export function createApp(): Express {
  const app = express();

  // Detrás del proxy de Railway: confiar en N saltos (TRUST_PROXY_HOPS, por
  // defecto 1) para que req.ip sea la IP real del visitante (X-Forwarded-For).
  // Se fija ANTES de los rate limiters, que cuentan por req.ip.
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  app.set('trust proxy', Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);

  app.use(helmet());

  const allowedOrigins = getAllowedOrigins();
  logger.info('CORS origins configurados:', allowedOrigins);
  app.use(
    cors({
      origin: (origin, callback) => {
        // Peticiones sin Origin (servidor a servidor, curl) no llevan cookies
        // del navegador: CORS no aplica.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new CorsError());
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', BOT_OWNER_TOKEN_HEADER],
    }),
  );
  app.use(compression());

  const jsonDefault = express.json({ limit: JSON_LIMIT_DEFAULT });
  const jsonChatbotDocs = express.json({ limit: JSON_LIMIT_CHATBOT_DOCS });
  app.use((req: Request, res: Response, next: NextFunction) =>
    CHATBOT_DOCS_PATH.test(req.path) ? jsonChatbotDocs(req, res, next) : jsonDefault(req, res, next),
  );
  app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT_DEFAULT }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
  }

  // Rate limiters (por IP real): el chatbot tiene uno propio más permisivo.
  app.use('/api/chatbot', chatbotRateLimiter);
  app.use('/api/', (req, res, next) => {
    if (req.path.startsWith('/chatbot')) return next();
    // La verificación de sesión del middleware de la web tiene su propio cupo.
    if (req.path === '/auth/me') return authMeRateLimiter(req, res, next);
    return rateLimiter(req, res, next);
  });

  // --- Salud -----------------------------------------------------------------
  // /health/live: el proceso responde (siempre 200). Lo usa Railway como
  // healthcheck del despliegue (railway.json).
  app.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
  });
  // /health: listo para atender (MongoDB conectado). 503 si no.
  app.get('/health', (_req: Request, res: Response) => {
    const mongoReady = mongoose.connection.readyState === 1;
    res.status(mongoReady ? 200 : 503).json({
      status: mongoReady ? 'healthy' : 'unavailable',
      mongo: mongoReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // --- Documentación de la API: solo fuera de producción o con API_DOCS_ENABLED.
  if (process.env.NODE_ENV !== 'production' || process.env.API_DOCS_ENABLED === 'true') {
    const swaggerSpec = swaggerJsdoc({
      definition: {
        openapi: '3.0.0',
        info: { title: 'KopTup API', version: '1.0.0' },
        servers: [{ url: process.env.API_URL || `http://localhost:${process.env.PORT ?? 3001}` }],
      },
      apis: ['./src/routes/*.ts'],
    });
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use(passport.initialize() as RequestHandler);

  // --- Rutas -------------------------------------------------------------------
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/quotes', quoteRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/deliverables', deliverablesRoutes);
  app.use('/api/invoices', invoicesRoutes);
  app.use('/api/messages', messagesRoutes);
  // cuentas.routes declara rutas con prefijo propio (/cuentas, /ley100,
  // /process, /export) y aplica su política ruta por ruta.
  app.use('/api', cuentasRoutes);
  app.use('/api/expert', expertSystemRoutes);
  app.use('/api/cups', cupsRoutes);
  app.use('/api/chatbot', chatbotRoutes);
  app.use('/api/demo-rag', demoRagRoutes);
  app.use('/api/auditoria', auditoriaRoutes);
  app.use('/api/content', contentManagerRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/documentos-conocimiento', documentoConocimientoConfigRoutes);
  app.use('/api/reglas-facturacion', reglasFacturacionRoutes);
  app.use('/api/liquidacion', liquidacionRoutes);
  app.use('/api/test', testRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/linkedin-ads', linkedinAdsRoutes);

  app.use((_req: Request, res: Response) => res.status(404).json({ success: false, message: 'Endpoint not found' }));
  app.use(errorHandler);

  return app;
}
