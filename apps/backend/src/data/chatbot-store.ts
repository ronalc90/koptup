/**
 * chatbot-store.ts — lectura del archivo heredado del chatbot
 * (`data/chatbots/state.json`, o `CHATBOT_STATE_DIR`).
 *
 * Los bots y sus conversaciones ahora viven en MongoDB
 * (services/chatbot-store.service.ts). Este módulo solo lee el archivo que
 * dejaron las versiones anteriores para migrarlo una vez y luego lo retira
 * (lo borra cuando todo quedó en la base): así las preguntas guardadas sin
 * vencimiento no se quedan en el disco.
 */
import fs from 'fs';
import path from 'path';

export interface LegacyChatbotState {
  bots: Array<[string, any]>;
  docs: Array<[string, any[]]>;
  chunks: Array<[string, any[]]>;
  conversations: Array<[string, any[]]>;
  updatedAt: string;
}

/** Carpeta del archivo heredado (se lee en cada llamada: las pruebas la cambian). */
export function legacyStateDir(): string {
  return process.env.CHATBOT_STATE_DIR ? path.resolve(process.env.CHATBOT_STATE_DIR) : path.join(process.cwd(), 'data', 'chatbots');
}

export function legacyStateFile(): string {
  return path.join(legacyStateDir(), 'state.json');
}

/**
 * Lee el archivo heredado. `null` si no existe; `'corrupt'` si no se puede
 * leer como JSON (no rompe el arranque y el archivo NO se borra: se deja para
 * que el equipo lo revise, porque borrarlo perdería los bots que tenga).
 */
export function readLegacyState(): LegacyChatbotState | 'corrupt' | null {
  const file = legacyStateFile();
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<LegacyChatbotState> | null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return 'corrupt';
    return {
      bots: Array.isArray(parsed.bots) ? parsed.bots : [],
      docs: Array.isArray(parsed.docs) ? parsed.docs : [],
      chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return 'corrupt';
  }
}

/** Borra el archivo heredado (y su temporal, si quedó). */
export function retireLegacyStateFile(): void {
  const file = legacyStateFile();
  for (const f of [file, `${file}.tmp`]) {
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {
      /* sin permiso de escritura: se reintenta en el próximo arranque */
    }
  }
}
