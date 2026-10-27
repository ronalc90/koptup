/**
 * errors.ts — traduce los errores del backend del chatbot a mensajes honestos.
 *
 * El backend responde 429 cuando se pasa un límite (crear bots: por hora y por
 * red; preguntar: por minuto), 503 con `capacity` si la demo llegó a su tope
 * de bots y 503 (`storage_unavailable`…) si no puede guardar bots. Solo un
 * error sin respuesta (status 0) es un problema de conexión.
 */
import { BotApiError } from './builder/api';
import type { ChatErrorKey } from './data';

/** Por qué no se pudo preparar (indexar) el bot de la empresa de ejemplo. */
export type KbErrorReason = 'rateLimited' | 'capacity' | 'unavailable' | 'network' | 'generic';

export function kbErrorReason(err: unknown): KbErrorReason {
  if (!(err instanceof BotApiError)) return 'generic';
  if (err.status === 0) return 'network';
  if (err.status === 429) return 'rateLimited';
  if (err.status === 503) return err.code === 'capacity' ? 'capacity' : 'unavailable';
  return 'generic';
}

const KB_TO_CHAT: Record<KbErrorReason, ChatErrorKey> = {
  rateLimited: 'errorRateLimited',
  capacity: 'errorCapacity',
  unavailable: 'errorUnavailable',
  network: 'errorNetwork',
  generic: 'errorGeneric',
};

/** Mensaje del chat cuando falló la preparación del bot. */
export function chatErrorForKb(reason: KbErrorReason): ChatErrorKey {
  return KB_TO_CHAT[reason];
}

/** Mensaje del chat cuando falló la pregunta (el bot ya estaba listo). */
export function chatErrorForAsk(err: unknown): ChatErrorKey {
  if (err instanceof BotApiError) {
    if (err.status === 0) return 'errorNetwork';
    if (err.status === 429) return 'errorChatRateLimited';
    if (err.status === 503) return 'errorUnavailable';
  }
  return 'errorGeneric';
}

/** Errores en los que conviene ofrecer "Prueba con tu documento" como alternativa. */
export function suggestsUpload(key: ChatErrorKey | undefined): boolean {
  return key === 'errorRateLimited' || key === 'errorCapacity';
}
