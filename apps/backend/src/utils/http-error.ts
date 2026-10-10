/**
 * http-error.ts — formato único de los errores de la API.
 *
 *   { "success": false, "code": "<código estable>", "message": "<texto en español>" }
 *
 * `code` es lo que lee la web para decidir qué mostrar (nunca el texto);
 * `message` se puede mostrar tal cual a la persona. Algunos errores agregan
 * datos útiles (`max`, `field`, `retryAfterSec`…), nunca datos internos.
 *
 * Lo usan las rutas que responden sus propios errores (sesión, roles,
 * chatbot, LinkedIn, la demo RAG); el resto lanza `AppError` y lo formatea
 * `errorHandler` con el mismo formato. `normalizeErrorResponses` (montado en
 * app.ts) completa además cualquier respuesta 4xx/5xx antigua que se arme a
 * mano, para que la web siempre reciba `code` y `message`.
 */
import type { NextFunction, Request, Response } from 'express';

export interface ApiErrorBody {
  success: false;
  code: string;
  message: string;
  [extra: string]: unknown;
}

export function errorBody(code: string, message: string, extra: Record<string, unknown> = {}): ApiErrorBody {
  return { ...extra, success: false, code, message };
}

export function sendError(res: Response, status: number, code: string, message: string, extra: Record<string, unknown> = {}): void {
  res.status(status).json(errorBody(code, message, extra));
}

/** Código por defecto de cada estado HTTP (respuestas antiguas sin `code`). */
const DEFAULT_CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  422: 'unprocessable',
  429: 'rate_limited',
  500: 'internal_error',
  502: 'bad_gateway',
  503: 'service_unavailable',
  504: 'timeout',
};

/** Código estable por defecto para un estado HTTP (sin `code` propio). */
export function defaultErrorCode(status: number): string {
  return DEFAULT_CODES[status] ?? (status >= 500 ? 'internal_error' : 'bad_request');
}

/** Mensaje por defecto (en español) cuando la respuesta no trae uno. */
const DEFAULT_MESSAGES: Record<string, string> = {
  bad_request: 'La solicitud no es válida.',
  unauthorized: 'Inicia sesión para continuar.',
  forbidden: 'No tienes permiso para esta acción.',
  not_found: 'No encontramos lo que buscas.',
  conflict: 'La operación choca con el estado actual. Recarga e intenta de nuevo.',
  payload_too_large: 'La solicitud es demasiado grande.',
  unsupported_media_type: 'El formato enviado no es compatible.',
  unprocessable: 'No pudimos procesar los datos enviados.',
  rate_limited: 'Hiciste demasiadas solicitudes. Espera un momento e intenta de nuevo.',
  internal_error: 'Ocurrió un error inesperado. Intenta de nuevo.',
  bad_gateway: 'Un servicio externo no respondió bien. Intenta de nuevo.',
  service_unavailable: 'El servicio no está disponible en este momento. Intenta de nuevo en unos minutos.',
  timeout: 'El servicio tardó demasiado en responder. Intenta de nuevo.',
};

/** Un `error` antiguo es un código si va en snake_case (`bot_not_found`, `TOKEN_EXPIRED`). */
const CODE_LIKE = /^(?:[a-z][a-z0-9_]{1,63}|[A-Z][A-Z0-9_]{1,63})$/;

/**
 * Lleva un cuerpo de error al formato único sin quitar datos útiles:
 *  - `success: false`;
 *  - `code`: el que traía, o el `error` si es un código (`bot_not_found`),
 *    o el del estado HTTP;
 *  - `message`: el que traía, o el `error` si es texto, o uno por defecto.
 * En producción, un 5xx no devuelve `error` ni `stack` (pueden tener detalles
 * internos). Los cuerpos que no son objetos se dejan igual.
 */
export function normalizeErrorBody(status: number, body: unknown, production = process.env.NODE_ENV === 'production'): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.isBuffer(body)) return body;
  const src = body as Record<string, unknown>;
  const legacyError = typeof src.error === 'string' ? src.error.trim() : '';
  const fallbackCode = defaultErrorCode(status);
  const code =
    typeof src.code === 'string' && src.code.trim()
      ? src.code
      : legacyError && CODE_LIKE.test(legacyError)
        ? legacyError
        : fallbackCode;
  const message =
    typeof src.message === 'string' && src.message.trim()
      ? src.message
      : legacyError && !CODE_LIKE.test(legacyError) && !(production && status >= 500)
        ? legacyError
        : DEFAULT_MESSAGES[fallbackCode] ?? DEFAULT_MESSAGES.internal_error;
  const out: Record<string, unknown> = { ...src, success: false, code, message };
  if (production && status >= 500) {
    delete out.error;
    delete out.stack;
  }
  return out;
}

/**
 * Middleware global: toda respuesta JSON con estado 4xx o 5xx sale con el
 * formato único (red de seguridad para las rutas antiguas que responden
 * `{ success, message }` o `{ error }` a mano).
 */
export function normalizeErrorResponses(_req: Request, res: Response, next: NextFunction): void {
  const json = res.json.bind(res);
  res.json = ((body?: unknown) => json(res.statusCode >= 400 ? normalizeErrorBody(res.statusCode, body) : body)) as Response['json'];
  next();
}
