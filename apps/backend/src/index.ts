// src/index.ts — arranque robusto
import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

const app: Express = express();
const PORT = Number(process.env.PORT ?? 3001);

// Global safety nets
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
  logger.error('uncaughtException', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason);
  logger.error('unhandledRejection', reason as any);
  process.exit(1);
});

console.log('index.ts arrancando', new Date().toISOString());
logger.info('index.ts arrancando');

// Basic middleware that never fails
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use('/api/', rateLimiter);

// Health and docs (swagger spec can be built later)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'KopTup API', version: '1.0.0' },
    servers: [{ url: process.env.API_URL || `http://localhost:${PORT}` }],
  },
  apis: ['./src/routes/*.ts'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Robust startup
const startServer = async () => {
  try {
    console.log('Comprobando MONGODB_URI:', Boolean(process.env.MONGODB_URI));
    if (!process.env.MONGODB_URI) {
      logger.warn('MONGODB_URI no definido. Algunas funcionalidades pueden fallar.');
    }

    // Conectar a la DB y cargar passport antes de registrar rutas que dependan de modelos
    try {
      const mongodb = await import('./config/mongodb');
      if (mongodb?.connectDB) {
        await mongodb.connectDB();
        logger.info('MongoDB conectada');
      } else {
        logger.warn('connectDB no exportado desde ./config/mongodb');
      }
    } catch (err: any) {
      logger.warn('Fallo al cargar/conectar MongoDB. Continuando sin DB:', err?.message ?? err);
    }

    try {
      const passportMod = await import('./config/passport');
      if (passportMod?.initializePassport && passportMod?.passport) {
        await passportMod.initializePassport();
        app.use(passportMod.passport.initialize());
        logger.info('Passport inicializado');
      } else {
        logger.info('Passport no exportado completamente. OAuth deshabilitado.');
      }
    } catch (err: any) {
      logger.warn('Fallo inicializando passport:', err?.message ?? err);
    }

    // Registrar rutas de forma dinámica para capturar errores de importación aquí
    try {
      const [
        authRoutes,
        documentRoutes,
        chatRoutes,
        contactRoutes,
        quoteRoutes,
        blogRoutes,
        projectRoutes,
        ordersRoutes,
        deliverablesRoutes,
        invoicesRoutes,
        messagesRoutes,
        notificationsRoutes,
        cuentasRoutes,
      ] = await Promise.all([
        import('./routes/auth.routes'),
        import('./routes/document.routes'),
        import('./routes/chat.routes'),
        import('./routes/contact.routes'),
        import('./routes/quote.routes'),
        import('./routes/blog.routes'),
        import('./routes/project.routes'),
        import('./routes/orders.routes'),
        import('./routes/deliverables.routes'),
        import('./routes/invoices.routes'),
        import('./routes/messages.routes'),
        import('./routes/notifications.routes'),
        import('./routes/cuentas.routes'),
      ]);

      if (authRoutes.default) app.use('/api/auth', authRoutes.default);
      if (documentRoutes.default) app.use('/api/documents', documentRoutes.default);
      if (chatRoutes.default) app.use('/api/chat', chatRoutes.default);
      if (contactRoutes.default) app.use('/api/contact', contactRoutes.default);
      if (quoteRoutes.default) app.use('/api/quotes', quoteRoutes.default);
      if (blogRoutes.default) app.use('/api/blog', blogRoutes.default);
      if (projectRoutes.default) app.use('/api/projects', projectRoutes.default);
      if (ordersRoutes.default) app.use('/api/orders', ordersRoutes.default);
      if (deliverablesRoutes.default) app.use('/api/deliverables', deliverablesRoutes.default);
      if (invoicesRoutes.default) app.use('/api/invoices', invoicesRoutes.default);
      if (messagesRoutes.default) app.use('/api/messages', messagesRoutes.default);
      if (notificationsRoutes.default) app.use('/api/notifications', notificationsRoutes.default);
      if (cuentasRoutes.default) app.use('/api', cuentasRoutes.default);

      logger.info('Rutas registradas');
    } catch (err: any) {
      logger.error('Error registrando rutas:', err);
      throw err;
    }

    // 404 handler (must be after all routes)
    app.use((_req: Request, res: Response) => res.status(404).json({ success: false, message: 'Endpoint not found' }));

    // Error handler (must be last)
    app.use(errorHandler);

    const server = app.listen(PORT, () => {
      logger.info(`Servidor escuchando en http://localhost:${PORT}`);
      logger.info(`Docs: http://localhost:${PORT}/api-docs`);
      logger.info(`Health: http://localhost:${PORT}/health`);
      console.log('Servidor iniciado correctamente', `http://localhost:${PORT}`);
    });

    const shutdown = (signal: string) => {
      logger.info(`Recibido ${signal}, cerrando...`);
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Error en startServer:', err);
    console.error('Error en startServer:', err);
    process.exit(1);
  }
};

startServer();
export default app;
