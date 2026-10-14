/**
 * chatbot-legacy-cleanup.service.ts — limpieza única de la API anterior del
 * chatbot "por sesión" (/api/chatbot/session, /upload, /message…), que se
 * retiró porque guardaba preguntas, respuestas y documentos sin vencimiento.
 *
 * Al arrancar (index.ts) borra lo que esa API dejó:
 *  - la colección `chatbots` de MongoDB (mensajes y texto de los documentos);
 *  - los archivos de `uploads/chatbot` y la carpeta.
 *
 * Es idempotente: si ya no queda nada, no hace nada. No toca los bots del
 * chatbot RAG actual (`chatbot_bots`, `chatbot_bot_chunks`, `chatbot_turns`).
 */
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { isDbReady } from '../middleware/access';
import { logger } from '../utils/logger';

/** Colección que usaba el modelo `Chatbot` de la API heredada. */
export const LEGACY_CHATBOT_COLLECTION = 'chatbots';

export interface LegacyChatbotCleanupResult {
  /** Documentos que tenía la colección `chatbots` (null: no se revisó, sin base). */
  sessions: number | null;
  /** Archivos borrados de uploads/chatbot. */
  files: number;
}

function defaultUploadsDir(): string {
  return path.resolve(process.cwd(), 'uploads', 'chatbot');
}

/** Borra los archivos de la carpeta (sin seguir enlaces) y la carpeta. */
function removeUploadsDir(dir: string): number {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return 0;
    throw err;
  }
  let files = 0;
  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files += removeUploadsDir(target);
    } else {
      fs.rmSync(target, { force: true });
      files += 1;
    }
  }
  fs.rmSync(dir, { recursive: true, force: true });
  return files;
}

export async function purgeLegacySessionChatbot(
  opts: { uploadsDir?: string } = {},
): Promise<LegacyChatbotCleanupResult> {
  const result: LegacyChatbotCleanupResult = { sessions: null, files: 0 };

  if (isDbReady() && mongoose.connection.db) {
    const db = mongoose.connection.db;
    const exists = await db.listCollections({ name: LEGACY_CHATBOT_COLLECTION }, { nameOnly: true }).toArray();
    if (exists.length > 0) {
      result.sessions = await db.collection(LEGACY_CHATBOT_COLLECTION).countDocuments();
      await db.dropCollection(LEGACY_CHATBOT_COLLECTION);
    } else {
      result.sessions = 0;
    }
  }

  result.files = removeUploadsDir(opts.uploadsDir ?? defaultUploadsDir());

  if ((result.sessions ?? 0) > 0 || result.files > 0) {
    logger.info(
      `[chatbot] Limpieza de la API heredada por sesión: ${result.sessions ?? 0} sesiones y ${result.files} archivos borrados`,
    );
  }
  return result;
}
