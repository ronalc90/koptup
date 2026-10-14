/**
 * Tutor con IA: los cursos de ejemplo usan el bot de ejemplo COMPARTIDO del
 * servidor (POST /sample-bots, sin crear un bot por visitante); los cursos
 * creados en la demo o un servidor sin esa ruta usan un bot de ejemplo propio
 * (POST /bots con kind "sample").
 */
import { COURSES } from '../lib/catalog';
import type { Course } from '../lib/types';

type Call = { method: string; path: string; body: Record<string, unknown> | null };

const json = (status: number, body: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

function mockFetch(handler: (c: Call) => Response): Call[] {
  const calls: Call[] = [];
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const c: Call = { method: init?.method ?? 'GET', path: url.pathname, body: init?.body ? JSON.parse(String(init.body)) : null };
    calls.push(c);
    return handler(c);
  }) as unknown as typeof fetch;
  return calls;
}

async function loadTutor() {
  let mod: typeof import('../lib/tutor') | undefined;
  jest.isolateModules(() => {
    mod = require('../lib/tutor');
  });
  return mod!;
}

const finanzas = COURSES.find((c) => c.id === 'finanzas')!;
const chatReply = { reply: 'La utilidad no es caja [1].', sources: [{ index: 1, name: 'L2 - Utilidad no es lo mismo que caja.txt', chunk: 'texto' }], model: 'gpt-4o-mini' };

describe('demo LMS · tutor', () => {
  const realFetch = global.fetch;
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('un curso de ejemplo usa el bot compartido y no crea bots propios', async () => {
    const calls = mockFetch((c) =>
      c.path.endsWith('/sample-bots') ? json(201, { botId: 'kbot_lms', docs: [], shared: true }) : json(200, chatReply),
    );
    const { askTutor } = await loadTutor();
    const a = await askTutor(finanzas, 'es', '¿Utilidad o caja?', []);
    await askTutor(finanzas, 'es', 'Otra pregunta', []);
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      'POST /api/chatbot/sample-bots',
      'POST /api/chatbot/bots/kbot_lms/chat',
      'POST /api/chatbot/bots/kbot_lms/chat',
    ]);
    const req = calls[0].body as { sampleKey: string; files: { name: string; mime: string }[] };
    expect(req.sampleKey).toBe('lms:finanzas:es:v1');
    expect(req.files.length).toBeGreaterThan(0);
    expect(req.files.every((f) => f.mime === 'text/plain')).toBe(true);
    expect(a.llm).toBe(true);
    expect(a.sources[0].lessonId).toBe('finanzas-l2');
  });

  it('si el servidor no tiene /sample-bots, crea un bot de ejemplo propio', async () => {
    const calls = mockFetch((c) => {
      if (c.path.endsWith('/sample-bots')) return json(404, { code: 'not_found' });
      if (c.method === 'POST' && c.path.endsWith('/bots')) return json(201, { botId: 'kbot_propio', ownerToken: 'x'.repeat(40) });
      if (c.path.endsWith('/docs')) return json(200, { docs: [] });
      return json(200, { ...chatReply, model: 'extractive' });
    });
    const { askTutor } = await loadTutor();
    const a = await askTutor(finanzas, 'es', '¿Utilidad o caja?', []);
    const create = calls.find((c) => c.method === 'POST' && c.path.endsWith('/bots'));
    expect(create?.body?.kind).toBe('sample');
    expect(calls.some((c) => c.path === '/api/chatbot/bots/kbot_propio/chat')).toBe(true);
    expect(a.llm).toBe(false);
    expect(a.degraded).toBe('noKey');
  });

  it('un curso creado en la demo no usa el bot compartido', async () => {
    const custom: Course = { ...finanzas, id: 'custom-abc', custom: true, published: true };
    const calls = mockFetch((c) => {
      if (c.method === 'POST' && c.path.endsWith('/bots')) return json(201, { botId: 'kbot_custom', ownerToken: 'y'.repeat(40) });
      if (c.path.endsWith('/docs')) return json(200, { docs: [] });
      return json(200, chatReply);
    });
    const { askTutor } = await loadTutor();
    await askTutor(custom, 'es', 'Hola', []);
    expect(calls.some((c) => c.path.endsWith('/sample-bots'))).toBe(false);
    expect(calls[0].body?.kind).toBe('sample');
  });
});
