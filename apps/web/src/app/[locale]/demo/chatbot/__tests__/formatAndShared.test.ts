/**
 * - Formato de los números de la demo con el idioma de la interfaz (locale fijo).
 * - "Prueba el asistente" usa el bot de ejemplo compartido aunque la primera
 *   pregunta llegue antes de que termine GET /models (no crea uno propio).
 */
import { formatDecimal, formatInteger, formatUsd } from '../components/data';
import { ensureSampleBot } from '../components/sampleBot';
import { getSampleCompany } from '../components/sampleKnowledge';

describe('formato de números', () => {
  it('usa coma decimal en español y punto en inglés', () => {
    expect(formatDecimal(1.198, 3, 'es')).toBe('1,198');
    expect(formatDecimal(1.198, 3, 'en')).toBe('1.198');
    expect(formatInteger(1023, 'es')).toBe('1.023');
    expect(formatInteger(1023, 'en')).toBe('1,023');
  });

  it('el costo en dólares va sin «$» (la etiqueta dice USD; en Colombia «$» se lee como pesos)', () => {
    expect(formatUsd(0.00021, 'es')).toBe('0,00021');
    expect(formatUsd(0.00021, 'en')).toBe('0.00021');
  });
});

describe('bot de ejemplo compartido', () => {
  beforeEach(() => window.localStorage.clear());

  it('espera GET /models y pide el bot compartido sin crear uno propio', async () => {
    const calls: string[] = [];
    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const method = (init?.method ?? 'GET').toUpperCase();
      calls.push(`${method} ${url.pathname}`);
      const json = (status: number, body: unknown) =>
        ({ ok: status < 400, status, json: async () => body, text: async () => JSON.stringify(body) }) as Response;
      if (url.pathname.endsWith('/models')) return json(200, { available: [], activeProvider: 'openai', sharedSampleBots: true });
      if (url.pathname.endsWith('/sample-bots')) return json(200, { botId: 'kbot_compartido', docs: [{}, {}, {}], docsCount: 3, shared: true });
      return json(500, {});
    }) as unknown as typeof fetch;

    const state = await ensureSampleBot(getSampleCompany('tienda', 'en'), 'en');
    expect(state).toEqual({ botId: 'kbot_compartido', docsCount: 3, shared: true });
    expect(calls).toEqual(['GET /api/chatbot/models', 'POST /api/chatbot/sample-bots']);
    const saved = JSON.parse(window.localStorage.getItem('koptup.chatbot.myBots') ?? '{}');
    expect(saved.kbot_compartido).toMatchObject({ kind: 'sample', shared: true, ownerToken: null });
  });
});
