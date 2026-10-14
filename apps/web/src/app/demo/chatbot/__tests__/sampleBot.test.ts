/**
 * Bots de ejemplo de "Prueba el asistente" (components/sampleBot.ts):
 * - un navegador reutiliza el bot que ya indexó (la vista pública trae `docsCount`, no la lista);
 * - se crea con `kind: "sample"` solo cuando hace falta;
 * - si el backend anuncia `sharedSampleBots`, se usa POST /sample-bots y no se crea bot propio;
 * - el 429 del límite de creación se reconoce como tal (no como problema de conexión).
 */
import { ensureSampleBot, findSampleBot, sampleKeyFor } from '../components/sampleBot';
import { BotApiError, listModels } from '../components/builder/api';
import { kbErrorReason, chatErrorForAsk } from '../components/errors';
import { getSampleCompany } from '../components/sampleKnowledge';

type Call = { method: string; path: string; body: unknown; headers: Record<string, string> };

const company = getSampleCompany('rrhh', 'es');
const LS_KEY = 'koptup.chatbot.myBots';

function json(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) } as Response;
}

function mockBackend(handler: (call: Call) => Response): Call[] {
  const calls: Call[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const call: Call = {
      method: (init?.method ?? 'GET').toUpperCase(),
      path: url.pathname,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
      headers: (init?.headers ?? {}) as Record<string, string>,
    };
    calls.push(call);
    return handler(call);
  }) as unknown as typeof fetch;
  return calls;
}

const docs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `d${i}`, name: `doc${i}.txt`, size: 1, mime: 'text/plain', hash: 'h', uploadedAt: '2026-10-01T00:00:00Z' }));

beforeEach(() => {
  window.localStorage.clear();
});

describe('bots de ejemplo', () => {
  it('sin bot previo no crea nada al consultar y lo crea con kind "sample" al preparar', async () => {
    const calls = mockBackend((c) => {
      if (c.method === 'POST' && c.path.endsWith('/api/chatbot/bots')) return json(201, { botId: 'kbot_a', name: company.name, ownerToken: 'x'.repeat(40) });
      if (c.method === 'POST' && c.path.endsWith('/bots/kbot_a/docs')) return json(200, { docs: docs(3), added: docs(3) });
      return json(404, { code: 'not_found' });
    });

    await expect(findSampleBot(company, 'es')).resolves.toBeNull();
    expect(calls).toHaveLength(0);

    const state = await ensureSampleBot(company, 'es');
    expect(state).toEqual({ botId: 'kbot_a', docsCount: 3, shared: false });
    const create = calls.find((c) => c.method === 'POST' && c.path.endsWith('/bots'));
    expect(create?.body).toMatchObject({ kind: 'sample', name: company.name, languages: ['es'] });
    const saved = JSON.parse(window.localStorage.getItem(LS_KEY) ?? '{}');
    expect(saved.kbot_a).toMatchObject({ kind: 'sample', sampleKey: sampleKeyFor(company, 'es') });
  });

  it('reutiliza el bot de este navegador con la vista pública (docsCount) sin crear otro', async () => {
    window.localStorage.setItem(
      LS_KEY,
      JSON.stringify({ kbot_b: { ownerToken: 't'.repeat(40), name: company.name, kind: 'sample', sampleKey: sampleKeyFor(company, 'es'), savedAt: '2026-10-01T00:00:00Z' } }),
    );
    const calls = mockBackend((c) => {
      if (c.method === 'GET' && c.path.endsWith('/bots/kbot_b')) return json(200, { botId: 'kbot_b', docs: [], docsCount: 3, owned: false });
      return json(500, {});
    });

    const state = await ensureSampleBot(company, 'es');
    expect(state).toEqual({ botId: 'kbot_b', docsCount: 3, shared: false });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(['GET /api/chatbot/bots/kbot_b']);
    // El GET lleva el token del dueño para recibir la lista completa.
    expect(calls[0].headers['X-Bot-Owner-Token']).toBe('t'.repeat(40));
  });

  it('descarta el bot de una versión anterior de los textos (lo borra con su token)', async () => {
    window.localStorage.setItem(
      LS_KEY,
      JSON.stringify({ kbot_old: { ownerToken: 'o'.repeat(40), name: company.name, kind: 'sample', sampleKey: 'rrhh:es:2020-01-v0', savedAt: '2026-10-01T00:00:00Z' } }),
    );
    const calls = mockBackend((c) => (c.method === 'DELETE' ? json(200, { deleted: true, botId: 'kbot_old' }) : json(404, {})));

    await expect(findSampleBot(company, 'es')).resolves.toBeNull();
    const del = calls.find((c) => c.method === 'DELETE');
    expect(del?.path).toMatch(/\/bots\/kbot_old$/);
    expect(del?.headers['X-Bot-Owner-Token']).toBe('o'.repeat(40));
    expect(JSON.parse(window.localStorage.getItem(LS_KEY) ?? '{}')).toEqual({});
  });

  it('usa el bot compartido del servidor cuando GET /models anuncia sharedSampleBots', async () => {
    const calls = mockBackend((c) => {
      if (c.path.endsWith('/models')) return json(200, { available: [], activeProvider: 'openai', sharedSampleBots: true });
      if (c.method === 'POST' && c.path.endsWith('/sample-bots')) return json(200, { botId: 'kbot_shared', docs: docs(3), shared: true });
      return json(500, {});
    });
    await listModels();

    const state = await ensureSampleBot(getSampleCompany('salud', 'es'), 'es');
    expect(state).toEqual({ botId: 'kbot_shared', docsCount: 3, shared: true });
    const req = calls.find((c) => c.path.endsWith('/sample-bots'));
    expect(req?.body).toMatchObject({ sampleKey: sampleKeyFor(getSampleCompany('salud', 'es'), 'es') });
    expect((req?.body as { files: unknown[] }).files).toHaveLength(getSampleCompany('salud', 'es').docs.length);
    expect(calls.some((c) => c.method === 'POST' && c.path.endsWith('/bots'))).toBe(false);
  });

  it('el límite de creación (429) se informa como límite, no como conexión', async () => {
    mockBackend((c) => {
      if (c.path.endsWith('/models')) return json(200, { available: [], activeProvider: 'openai' });
      if (c.method === 'POST') return json(429, { success: false, code: 'rate_limited', message: 'Creaste demasiados bots.' });
      return json(404, {});
    });
    await listModels();

    const err = await ensureSampleBot(getSampleCompany('tienda', 'es'), 'es').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BotApiError);
    expect((err as BotApiError).code).toBe('rate_limited');
    expect(kbErrorReason(err)).toBe('rateLimited');
    expect(kbErrorReason(new BotApiError(0, 'network'))).toBe('network');
    expect(kbErrorReason(new BotApiError(503, 'x', 'capacity'))).toBe('capacity');
    expect(chatErrorForAsk(new BotApiError(429, 'x'))).toBe('errorChatRateLimited');
  });
});
