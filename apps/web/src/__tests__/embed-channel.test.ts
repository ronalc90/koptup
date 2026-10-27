/**
 * Canal del chat embebido: solo el widget real guarda historial; la vista
 * previa del Builder (el chat dentro de /demo/chatbot) envía `preview`.
 */
import { chatFromEmbed, detectEmbedChannel, embedErrorKey } from '@/app/[locale]/embed/chatbot/[botId]/embedChannel';
import { BotApiError } from '@/app/[locale]/demo/chatbot/components/builder/api';

function fakeWindow(top: unknown, origin = 'https://www.koptup.com'): Window {
  const win: { location: { origin: string; pathname: string }; top?: unknown } = { location: { origin, pathname: '/embed/chatbot/kbot_x' } };
  win.top = top === 'self' ? win : top;
  return win as unknown as Window;
}

describe('detectEmbedChannel', () => {
  it('ventana propia (enlace directo en una pestaña): widget', () => {
    expect(detectEmbedChannel(fakeWindow('self'))).toBe('widget');
  });

  it('dentro de /demo/chatbot del mismo origen (vista previa del Builder): preview', () => {
    const top = { location: { origin: 'https://www.koptup.com', pathname: '/demo/chatbot' } };
    expect(detectEmbedChannel(fakeWindow(top))).toBe('preview');
  });

  it('en el sitio de un cliente (ventana superior de otro origen): widget', () => {
    const crossOrigin = {
      get location(): never {
        throw new DOMException('Blocked a frame with origin', 'SecurityError');
      },
    };
    expect(detectEmbedChannel(fakeWindow(crossOrigin))).toBe('widget');
  });

  it('en otra página del mismo origen que no es una demo: widget', () => {
    const top = { location: { origin: 'https://www.koptup.com', pathname: '/rag' } };
    expect(detectEmbedChannel(fakeWindow(top))).toBe('widget');
  });
});

describe('chatFromEmbed', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('envía el canal en el cuerpo de la pregunta', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ botId: 'kbot_x', reply: 'ok', sources: [], timestamp: '' }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    await chatFromEmbed('kbot_x', 'hola', [], 'preview');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/chatbot\/bots\/kbot_x\/chat$/);
    expect(JSON.parse(init.body)).toEqual({ message: 'hola', history: [], channel: 'preview' });
  });

  it('un error HTTP conserva el código para la interfaz', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }) as unknown as typeof fetch;
    await expect(chatFromEmbed('kbot_x', 'hola', [], 'widget')).rejects.toMatchObject({ status: 503 });
  });
});

describe('embedErrorKey', () => {
  it('429 → pausa por muchas preguntas; 5xx → servidor no disponible', () => {
    expect(embedErrorKey(new BotApiError(429, 'HTTP 429'))).toBe('errorRateLimited');
    expect(embedErrorKey(new BotApiError(503, 'HTTP 503'))).toBe('errorUnavailable');
    expect(embedErrorKey(new BotApiError(500, 'HTTP 500'))).toBe('errorUnavailable');
  });

  it('sin respuesta del servidor → red; otro error → genérico', () => {
    expect(embedErrorKey(new BotApiError(0, 'network'))).toBe('errorNetwork');
    expect(embedErrorKey(new BotApiError(400, 'HTTP 400'))).toBe('errorGeneric');
    expect(embedErrorKey(new Error('json inválido'))).toBe('errorGeneric');
  });
});
