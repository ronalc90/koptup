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
 * ADMIN_EMAIL al arrancar: da el rol admin solo si la cuenta existe, está
 * activa y no hay ningún otro admin (primer admin o recuperación), y lo deja
 * en la bitácora. Sin ADMIN_EMAIL no se modifica ningún rol. La regla está en
 * services/admin-bootstrap.service.ts.
 */
async function ensureAdminFromEnv(): Promise<void> {
  try {
    const { ensureAdminFromEnv: ensure, ADMIN_BOOTSTRAP_MESSAGES } = await import('./services/admin-bootstrap.service');
    const result = await ensure();
    const message = ADMIN_BOOTSTRAP_MESSAGES[result];
    if (result === 'no_existe' || result === 'cuenta_invitada' || result === 'hay_otro_admin') logger.warn(message);
    else logger.info(message);
  } catch (err: any) {
    logger.warn(`Fallo revisando ADMIN_EMAIL: ${err?.message ?? err}`);
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

    // 3c. Pipeline comercial: liga al pipeline los contactos anteriores
    // (idempotente; no cambia sus datos).
    try {
      const { migrateContactsToLeads } = await import('./services/leads.service');
      await migrateContactsToLeads();
    } catch (err: any) {
      logger.warn(`Fallo migrando contactos al pipeline de leads: ${err?.message ?? err}`);
    }

    // 3d. Chatbot: si quedó el archivo heredado data/chatbots/state.json, lo
    // pasa a MongoDB una vez y lo borra del disco (idempotente).
    try {
      const { ensureChatbotMigrated } = await import('./services/chatbot-store.service');
      await ensureChatbotMigrated();
    } catch (err: any) {
      logger.warn(`Fallo migrando el estado del chatbot a MongoDB: ${err?.message ?? err}`);
    }

    // 3e. Chatbot: borra lo que dejó la API anterior "por sesión" (colección
    // `chatbots` y uploads/chatbot), que guardaba sin vencimiento (idempotente).
    try {
      const { purgeLegacySessionChatbot } = await import('./services/chatbot-legacy-cleanup.service');
      await purgeLegacySessionChatbot();
    } catch (err: any) {
      logger.warn(`Fallo borrando los datos de la API heredada del chatbot: ${err?.message ?? err}`);
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
    // Job de vencimiento de propuestas (candado en Redis).
    const { startProposalsExpiryJob, stopProposalsExpiryJob } = await import('./jobs/proposals-expiry.job');
    startProposalsExpiryJob();
    // Plazo de conservación de datos personales (candado en Redis, una vez al día).
    const { startRetentionJob, stopRetentionJob } = await import('./jobs/retention.job');
    startRetentionJob();
    // Pago en línea con Wompi: solo con sus variables (sin ellas no se ofrece).
    const { readWompiConfig } = await import('./services/wompi.service');
    const wompi = readWompiConfig();
    if (wompi.enabled) logger.info(`[wompi] Pago del anticipo con Wompi activo (${wompi.config!.env})`);
    else if (wompi.reason !== 'faltan_variables') logger.warn(`[wompi] Wompi apagado: ${wompi.reason}`);

    // Análisis IA de cuentas médicas con PDFs grandes puede tardar minutos.
    server.timeout = 900000;
    server.keepAliveTimeout = 910000;
    server.headersTimeout = 920000;

    const shutdown = (signal: string) => {
      logger.info(`Recibido ${signal}, cerrando...`);
      stopDemoGrantsJob();
      stopProposalsExpiryJob();
      stopRetentionJob();
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
