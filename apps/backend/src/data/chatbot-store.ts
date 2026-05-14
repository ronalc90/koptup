/**
 * chatbot-store.ts — persistencia file-based (JSON) del estado del chatbot.
 *
 * SRP: única responsabilidad → serializar/deserializar las estructuras
 * in-memory del módulo `chatbot.routes.ts` a disco para que sobrevivan
 * reinicios del proceso.
 *
 * No conoce la forma exacta de cada Map (usa `any[]` en los valores) porque
 * eso es responsabilidad de chatbot.routes.ts; este módulo sólo persiste.
 *
 * Las escrituras son síncronas para que el endpoint pueda garantizar que
 * el cliente recibe el 2xx sólo después de que el cambio quedó persistido.
 * Para los volúmenes del demo (decenas/cientos de bots) es perfectamente
 * razonable; si crece, se reemplaza por una BBDD real sin tocar las rutas.
 */
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'chatbots');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

export interface PersistShape {
  bots: Array<[string, any]>;
  docs: Array<[string, any[]]>;
  chunks: Array<[string, any[]]>;
  conversations: Array<[string, any[]]>;
  updatedAt: string;
}

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function load(): PersistShape {
  ensureDir();
  if (!fs.existsSync(STATE_FILE)) {
    return { bots: [], docs: [], chunks: [], conversations: [], updatedAt: '' };
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PersistShape>;
    return {
      bots: Array.isArray(parsed.bots) ? parsed.bots : [],
      docs: Array.isArray(parsed.docs) ? parsed.docs : [],
      chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    // Estado corrupto: no rompemos el arranque, simplemente arrancamos vacío.
    return { bots: [], docs: [], chunks: [], conversations: [], updatedAt: '' };
  }
}

export function persist(state: PersistShape): void {
  ensureDir();
  const payload = JSON.stringify(
    { ...state, updatedAt: new Date().toISOString() },
    null,
    2,
  );
  // Escritura atómica: archivo tmp + rename para evitar lecturas parciales si
  // el proceso muere a la mitad.
  const tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, payload, 'utf-8');
  fs.renameSync(tmp, STATE_FILE);
}
