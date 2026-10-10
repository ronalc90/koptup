/**
 * Canal del chat embebido (`/embed/chatbot/[botId]`).
 *
 * El backend guarda el historial de un bot (que su dueño ve en "Configura el
 * tuyo" › Conversaciones, y que vence solo a los 30 días) únicamente cuando la
 * pregunta llega del widget con `channel: "widget"`. La vista previa del
 * Builder carga este mismo chat dentro de /demo/chatbot: ahí se envía
 * `channel: "preview"` y la pregunta no se guarda.
 */
import { BACKEND_URL } from '@/lib/backend-url';
import { BotApiError, type RemoteChatReply } from '@/app/demo/chatbot/components/builder/api';

export type EmbedChannel = 'widget' | 'preview';

/**
 * ¿Este chat está dentro de una página de demos de KopTup (la vista previa
 * del Builder)? En el sitio de un cliente la ventana superior es de otro
 * origen y leerla lanza un error: entonces es el widget real.
 */
export function detectEmbedChannel(win: Window = window): EmbedChannel {
  try {
    if (win.top === win) return 'widget';
    const top = win.top as Window;
    if (top.location.origin === win.location.origin && top.location.pathname.startsWith('/demo/')) return 'preview';
  } catch {
    /* ventana superior de otro origen: el widget en el sitio de un cliente */
  }
  return 'widget';
}

/** Pregunta al bot indicando el canal (mismo contrato que `chatWithBot`). */
export async function chatFromEmbed(
  botId: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  channel: EmbedChannel,
): Promise<RemoteChatReply> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/chatbot/bots/${encodeURIComponent(botId)}/chat`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, channel }),
    });
  } catch {
    throw new BotApiError(0, 'network');
  }
  if (!res.ok) throw new BotApiError(res.status, `HTTP ${res.status}`);
  return (await res.json()) as RemoteChatReply;
}
