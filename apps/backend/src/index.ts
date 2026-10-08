// src/index.ts — arranque del servidor
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';
import { assertValidEnv } from './config/env';

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

logger.info('index.ts arrancando');

/**
 * Asegura el rol admin de ADMIN_EMAIL al arrancar. Sin ADMIN_EMAIL no se
 * modifica ningún rol (no hay correo por defecto en el código).
 */
async function ensureAdminFromEnv(): Promise<void> {
  const targetEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!targetEmail) {
    logger.info('ADMIN_EMAIL no definido: el arranque no modifica roles.');
    return;
  }
  try {
    const User = (await import('./models/User')).default;
    const updated = await User.findOneAndUpdate({ email: targetEmail }, { $set: { role: 'admin' } }, { new: true }).lean();
    if (updated) logger.info('Rol admin asegurado para ADMIN_EMAIL');
    else logger.warn('ADMIN_EMAIL no corresponde a ningún usuario registrado (no se cambió ningún rol)');
  } catch (err: any) {
    logger.warn(`Fallo asegurando el rol admin de ADMIN_EMAIL: ${err?.message ?? err}`);
  }
}

const startServer = async () => {
  try {
    // 1. Variables de entorno: en producción falla si falta una imprescindible.
    assertValidEnv({ warn: (m) => logger.warn(m), error: (m) => logger.error(m) });
    const PORT = Number(process.env.PORT ?? 3001);

    // 2. Carpetas de archivos subidos (disco efímero en Railway).
    const uploadDirs = [
      './uploads',
      './uploads/orders',
      './uploads/cuentas-medicas',
      './uploads/ley100',
      './uploads/exports',
      './uploads/temp-images',
      './uploads/temp-processing',
      './uploads/chatbot',
      './data/imports',
    ];
    for (const dir of uploadDirs) {
      const dirPath = path.resolve(dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info(`Directorio creado: ${dir}`);
      }
    }

    // 3. MongoDB (si no conecta, el servidor arranca y /health responde 503).
    try {
      const mongodb = await import('./config/mongodb');
      await mongodb.connectDB();
    } catch (err: any) {
      logger.warn('Fallo al conectar MongoDB. Continuando sin DB:', err?.message ?? err);
    }

    await ensureAdminFromEnv();

    // 3b. Catálogo de demos: inserta las que falten (idempotente; nunca pisa
    // los cambios hechos desde el panel).
    try {
      const { ensureCatalogSeeded } = await import('./services/demo-catalog.service');
      await ensureCatalogSeeded();
    } catch (err: any) {
      logger.warn(`Fallo sembrando el catálogo de demos: ${err?.message ?? err}`);
    }

    // 4. Estrategias de Passport (Google OAuth si está configurado).
    try {
      const passportMod = await import('./config/passport');
      await passportMod.initializePassport();
    } catch (err: any) {
      logger.warn('Fallo inicializando passport:', err?.message ?? err);
    }

    // 5. App con todas las rutas y sus políticas.
    const { createApp } = await import('./app');
    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`Servidor escuchando en http://localhost:${PORT}`);
      console.log('Servidor iniciado correctamente', `http://localhost:${PORT}`);
    });

    // Job de vencimiento de accesos a demos y recordatorios (candado en Redis).
    const { startDemoGrantsJob, stopDemoGrantsJob } = await import('./jobs/demo-grants.job');
    startDemoGrantsJob();

    // Análisis IA de cuentas médicas con PDFs grandes puede tardar minutos.
    server.timeout = 900000;
    server.keepAliveTimeout = 910000;
    server.headersTimeout = 920000;

    const shutdown = (signal: string) => {
      logger.info(`Recibido ${signal}, cerrando...`);
      stopDemoGrantsJob();
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error('Error en startServer:', err);
    console.error('Error en startServer:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
};

startServer();
