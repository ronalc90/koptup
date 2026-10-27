/**
 * urlIngest.ts — ayudas para "O agrega una página web pública" del Builder
 * (`POST /api/chatbot/bots/:id/urls`, ver `api.ts › ingestBotUrls`).
 */

/** Motivos de rechazo del servidor con mensaje propio en `builder.knowledge.urlErrors.*`. */
const URL_ERROR_KEYS = new Set([
  'invalid_url',
  'blocked_address',
  'blocked_port',
  'dns_failed',
  'timeout',
  'too_large',
  'too_many_redirects',
  'unsupported_content_type',
  'empty_content',
  'bot_capacity',
  'fetch_failed',
]);

/**
 * Completa la dirección (sin esquema se asume `https://`) y la valida.
 * Devuelve null si no es una URL http(s) válida.
 */
export function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Clave del mensaje para un motivo del servidor y, si es un error HTTP de la
 * página (`http_404`), su código.
 */
export function urlErrorMessage(reason: string): { key: string; status?: string } {
  if (URL_ERROR_KEYS.has(reason)) return { key: reason };
  const http = /^http_(\d{3})$/.exec(reason);
  if (http) return { key: 'http', status: http[1] };
  return { key: 'generic' };
}
