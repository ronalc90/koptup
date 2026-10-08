/**
 * Llave de propietario de los bots del chatbot (Builder de /demo/chatbot).
 *
 * Contrato con el backend (apps/backend/src/routes/chatbot.routes.ts):
 *  - Cabecera `X-Bot-Owner-Token` (CHATBOT_OWNER_TOKEN_HEADER) con un token de
 *    32 a 128 caracteres `[A-Za-z0-9_-]`. Se puede enviar más de uno separado
 *    por comas (máximo 50).
 *  - `POST /api/chatbot/bots` con UN token en la cabecera crea el bot a nombre
 *    de ese token; sin cabecera, el backend genera uno. En ambos casos lo
 *    devuelve UNA sola vez en el campo `ownerToken` de la respuesta.
 *  - Exigen la cabecera (401 `owner_token_required` sin ella, 403
 *    `forbidden_not_owner` con un token ajeno): `PATCH` y `DELETE
 *    /bots/:botId`, `POST /bots/:botId/docs`, `DELETE /bots/:botId/docs/:docId`,
 *    `POST /bots/:botId/urls`, `GET` y `DELETE /bots/:botId/conversations`.
 *  - `GET /bots` devuelve solo los bots de los tokens enviados (más los de
 *    ejemplo, `example: true`); `GET /bots/:botId` devuelve la vista completa
 *    (`owned: true`) solo al dueño. `POST /bots/:botId/chat` y `GET /models`
 *    son públicos.
 *
 * Este módulo guarda una sola llave por navegador (localStorage) y la usa
 * para todos los bots que se creen en él. Si el backend devuelve otra
 * (`ownerToken` distinto), se guarda también, para no perder el acceso.
 */

export const CHATBOT_OWNER_TOKEN_HEADER = 'X-Bot-Owner-Token';

const STORAGE_KEY = 'koptup.chatbot.ownerTokens';
const TOKEN_RE = /^[A-Za-z0-9_-]{32,128}$/;
const MAX_TOKENS = 50;

function readStored(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string' && TOKEN_RE.test(t)) : [];
  } catch {
    return [];
  }
}

function writeStored(tokens: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens.slice(0, MAX_TOKENS)));
  } catch {
    /* almacenamiento no disponible (modo privado): la llave dura la sesión */
  }
}

/** Token aleatorio de 43 caracteres base64url (256 bits). */
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Llave principal del navegador (la crea la primera vez). */
export function getChatbotOwnerToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = readStored();
  if (stored.length > 0) return stored[0];
  const token = generateToken();
  writeStored([token]);
  return token;
}

/** Guarda el `ownerToken` que devolvió el backend al crear un bot. */
export function rememberChatbotOwnerToken(token: unknown): void {
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) return;
  const stored = readStored();
  if (stored.includes(token)) return;
  writeStored([...stored, token]);
}

/**
 * Cabeceras para las llamadas del Builder: `{ 'X-Bot-Owner-Token': <llaves> }`.
 * Va en TODAS las llamadas a /api/chatbot/bots (crear, leer, editar, borrar,
 * subir documentos, URLs y conversaciones).
 */
export function chatbotOwnerHeaders(): Record<string, string> {
  const primary = getChatbotOwnerToken();
  if (!primary) return {};
  const all = [primary, ...readStored().filter((t) => t !== primary)].slice(0, MAX_TOKENS);
  return { [CHATBOT_OWNER_TOKEN_HEADER]: all.join(',') };
}
