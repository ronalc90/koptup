/**
 * Tope mensual de gasto de IA y cupo diario por usuario del gestor de
 * documentos (/api/documents: DOCUMENTS_MONTHLY_BUDGET_USD,
 * DOCUMENTS_AI_DAILY_LIMIT_PER_USER) y de las APIs de salud (HEALTH_*).
 * Usa el mock local de OpenAI (1M + 1M tokens por llamada de chat = USD 0,75
 * con gpt-4o-mini; 1M de tokens por embedding).
 */
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import {
  TestUser,
  bearer,
  connectTestDb,
  createUser,
  currentMonth,
  describeDbRedis,
  disconnectTestDb,
  startOpenAiMock,
} from './helpers';

const FEATURES = ['documents', 'health'] as const;
const ENV_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'DOCUMENTS_MONTHLY_BUDGET_USD',
  'HEALTH_MONTHLY_BUDGET_USD',
  'DOCUMENTS_AI_DAILY_LIMIT_PER_USER',
  'HEALTH_AI_DAILY_LIMIT_PER_USER',
] as const;

describeDbRedis('tope de IA y cupo por usuario: documentos y salud (integración)', () => {
  let app: Express;
  let mock: Awaited<ReturnType<typeof startOpenAiMock>>;
  let admin: TestUser;
  let user: TestUser;
  let access: typeof import('../../middleware/access');
  let redis: Awaited<ReturnType<typeof import('../../config/redis').getRedisClient>>;
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};
  const savedSpend: Record<string, string | null> = {};
  const identities = new Set<string>();
  const spendKey = (f: string) => `${f}:spend:${currentMonth()}`;
  const readSpend = async (f: string) => Number((await redis.get(spendKey(f))) ?? 0);

  async function newUser(role = 'user') {
    const u = await createUser(role);
    identities.add(`user:${u.id}`);
    return u;
  }

  async function insertDoc(owner: TestUser, name = 'contrato.txt') {
    const res = await mongoose.connection.collection('documents').insertOne({
      user_id: owner.id,
      filename: `${Date.now()}.txt`,
      original_filename: name,
      file_path: '/tmp/no-existe.txt',
      file_size: 10,
      mime_type: 'text/plain',
      text_content: 'Contrato de prestación de servicios entre las partes con cláusulas de pago y confidencialidad.',
      folder: 'General',
      is_deleted: false,
      is_favorite: false,
      tags: [],
      created_at: new Date(),
      updated_at: new Date(),
    });
    return String(res.insertedId);
  }

  beforeAll(async () => {
    for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
    mock = await startOpenAiMock();
    process.env.OPENAI_API_KEY = 'sk-test-mock';
    process.env.OPENAI_BASE_URL = mock.url;
    process.env.DOCUMENTS_MONTHLY_BUDGET_USD = '100';
    process.env.HEALTH_MONTHLY_BUDGET_USD = '100';
    process.env.DOCUMENTS_AI_DAILY_LIMIT_PER_USER = '100';
    process.env.HEALTH_AI_DAILY_LIMIT_PER_USER = '100';

    await connectTestDb('ailimits');
    access = await import('../../middleware/access');
    const { createApp } = await import('../../app');
    app = createApp();
    const { getRedisClient } = await import('../../config/redis');
    redis = await getRedisClient();
    for (const f of FEATURES) {
      savedSpend[f] = await redis.get(spendKey(f));
      await redis.del(spendKey(f));
    }
    admin = await newUser('admin');
    user = await newUser('user');
  });

  afterAll(async () => {
    access.setDemoAccessResolver(null);
    const { hashIp } = await import('../../services/ai-budget.service');
    const hashes = new Set<string>();
    for (const id of identities) for (const scope of ['documents-ai:day', 'health-ai:day']) hashes.add(hashIp(scope, id));
    for await (const key of redis.scanIterator({ MATCH: 'rl:*', COUNT: 500 })) {
      const hash = String(key).split(':').pop() as string;
      if (hashes.has(hash)) await redis.del(String(key));
    }
    for (const f of FEATURES) {
      await redis.del(spendKey(f));
      const prev = savedSpend[f];
      if (prev !== null && prev !== undefined) await redis.set(spendKey(f), prev);
    }
    await redis.quit();
    await mock.close();
    await disconnectTestDb();
    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  beforeEach(async () => {
    for (const f of FEATURES) await redis.del(spendKey(f));
    process.env.DOCUMENTS_MONTHLY_BUDGET_USD = '100';
    process.env.HEALTH_MONTHLY_BUDGET_USD = '100';
    process.env.DOCUMENTS_AI_DAILY_LIMIT_PER_USER = '100';
    process.env.HEALTH_AI_DAILY_LIMIT_PER_USER = '100';
  });

  describe('gestor de documentos (/api/documents)', () => {
    it('cada llamada a OpenAI suma su costo real al gasto del mes de "documents"', async () => {
      const id = await insertDoc(user);
      const before = mock.calls.length;
      const res = await request(app).get(`/api/documents/${id}/explain`).set(bearer(user));
      expect(res.status).toBe(200);
      expect(mock.calls.length).toBe(before + 1);
      expect(await readSpend('documents')).toBeCloseTo(0.75, 5);
      // Una búsqueda semántica (embedding de 1M de tokens con ada-002) suma USD 0,10.
      expect((await request(app).post('/api/documents/search/semantic').set(bearer(user)).send({ query: 'contrato' })).status).toBe(200);
      expect(await readSpend('documents')).toBeCloseTo(0.85, 5);
      expect(await readSpend('health')).toBe(0);
    });

    it('con el tope del mes agotado: 503 budget_exhausted y no se llama a OpenAI', async () => {
      process.env.DOCUMENTS_MONTHLY_BUDGET_USD = '1';
      await redis.set(spendKey('documents'), '1');
      const id = await insertDoc(user);
      const before = mock.calls.length;
      const res = await request(app).get(`/api/documents/${id}/explain`).set(bearer(user));
      expect(res.status).toBe(503);
      expect(res.body.code).toBe('budget_exhausted');
      expect((await request(app).post('/api/documents/search/semantic').set(bearer(user)).send({ query: 'x' })).status).toBe(503);
      expect(mock.calls.length).toBe(before);
    });

    it('con el tope agotado, subir un documento lo guarda sin análisis y lo dice', async () => {
      process.env.DOCUMENTS_MONTHLY_BUDGET_USD = '1';
      await redis.set(spendKey('documents'), '1');
      const before = mock.calls.length;
      const res = await request(app)
        .post('/api/documents/upload')
        .set(bearer(user))
        .attach('file', Buffer.from('Contrato de servicios con cláusulas de pago, plazos y confidencialidad entre las partes.'), 'contrato.txt');
      expect(res.status).toBe(200);
      expect(res.body.ai).toEqual({ analyzed: false, code: 'budget_exhausted' });
      expect(res.body.message).toMatch(/sin análisis de IA/);
      expect(mock.calls.length).toBe(before);
      // El archivo de la subida se guarda en uploads/: se borra para no dejar basura.
      const saved = await mongoose.connection.collection('documents').findOne({ _id: new mongoose.Types.ObjectId(String(res.body.data.id)) });
      if (saved?.file_path) await import('fs').then((fs) => fs.promises.unlink(String(saved.file_path)).catch(() => undefined));
    });

    it('cupo diario por usuario: al pasarlo, 429 ai_user_limit con Retry-After; el staff no tiene cupo', async () => {
      process.env.DOCUMENTS_AI_DAILY_LIMIT_PER_USER = '2';
      const limited = await newUser('user');
      const id = await insertDoc(limited);
      expect((await request(app).get(`/api/documents/${id}/explain`).set(bearer(limited))).status).toBe(200);
      expect((await request(app).get(`/api/documents/${id}/explain`).set(bearer(limited))).status).toBe(200);
      const third = await request(app).get(`/api/documents/${id}/explain`).set(bearer(limited));
      expect(third.status).toBe(429);
      expect(third.body.code).toBe('ai_user_limit');
      expect(Number(third.headers['retry-after'])).toBeGreaterThan(0);
      // Otra cuenta tiene su propio cupo.
      const other = await newUser('user');
      const otherDoc = await insertDoc(other);
      expect((await request(app).get(`/api/documents/${otherDoc}/explain`).set(bearer(other))).status).toBe(200);
      // El staff (rol de la BD) no tiene cupo por usuario.
      const adminDoc = await insertDoc(admin);
      for (let i = 0; i < 3; i += 1) {
        expect((await request(app).get(`/api/documents/${adminDoc}/explain`).set(bearer(admin))).status).toBe(200);
      }
    });
  });

  describe('APIs de salud', () => {
    it('la búsqueda semántica de CUPS suma su costo a "health" y respeta el cupo por usuario', async () => {
      process.env.HEALTH_AI_DAILY_LIMIT_PER_USER = '1';
      const granted = await newUser('user');
      // Acceso concedido a la demo del sistema experto para esta cuenta.
      access.setDemoAccessResolver(async ({ user: u }) =>
        u && u.id === granted.id ? { allowed: true, reason: 'grant' } : { allowed: false, reason: u ? 'no_access' : 'login_required' },
      );
      try {
        const first = await request(app).post('/api/cups/buscar-semantica').set(bearer(granted)).send({ consulta: 'consulta de medicina general' });
        expect(first.status).toBe(200);
        // text-embedding-3-small: 1M de tokens = USD 0,02.
        expect(await readSpend('health')).toBeCloseTo(0.02, 5);
        expect(await readSpend('documents')).toBe(0);
        const second = await request(app).post('/api/cups/buscar-semantica').set(bearer(granted)).send({ consulta: 'otra' });
        expect(second.status).toBe(429);
        expect(second.body.code).toBe('ai_user_limit');
      } finally {
        access.setDemoAccessResolver(null);
      }
    });

    it('con el tope de salud agotado: 503 en la ruta y el cliente de OpenAI tampoco llama', async () => {
      process.env.HEALTH_MONTHLY_BUDGET_USD = '1';
      await redis.set(spendKey('health'), '1');
      const before = mock.calls.length;
      const res = await request(app).post('/api/cups/buscar-semantica').set(bearer(admin)).send({ consulta: 'x' });
      expect(res.status).toBe(503);
      expect(res.body.code).toBe('budget_exhausted');
      expect((await request(app).post('/api/expert/procesar').set(bearer(admin)).send({})).status).toBe(503);

      // Barrera dura: aunque un servicio llame directo al cliente de la función.
      const { getOpenAIFor } = await import('../../services/openai.service');
      await expect(
        getOpenAIFor('health').chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: 'hola' }] }),
      ).rejects.toMatchObject({ status: 429, code: 'budget_exhausted' });
      expect(mock.calls.length).toBe(before);
    });

    it('la validación de cuentas médicas (rag.service, POST /api/process) suma a "health" y respeta el tope', async () => {
      const rag = await import('../../services/rag.service');
      const before = mock.calls.length;
      // Sin documentos Ley 100 en la base, el código se consulta a la IA.
      await rag.validateCUPSCode('890201');
      expect(mock.calls.length).toBe(before + 1);
      expect(await readSpend('health')).toBeGreaterThan(0);
      expect(await readSpend('documents')).toBe(0);

      process.env.HEALTH_MONTHLY_BUDGET_USD = '1';
      await redis.set(spendKey('health'), '1');
      const blocked = await rag.validateCUPSCode('890201');
      expect(blocked.valido).toBe(false);
      expect(mock.calls.length).toBe(before + 1);
    });

    it('sin Redis no se puede medir el gasto: el cliente de la función no llama (falla cerrada)', async () => {
      const budget = await import('../../services/ai-budget.service');
      const spy = jest.spyOn(budget, 'getBudgetStatus').mockResolvedValue({ available: false, reason: 'unavailable' });
      try {
        const { getOpenAIFor } = await import('../../services/openai.service');
        const before = mock.calls.length;
        await expect(
          getOpenAIFor('documents').embeddings.create({ model: 'text-embedding-3-small', input: 'hola' }),
        ).rejects.toMatchObject({ status: 429, code: 'ai_unavailable' });
        expect(mock.calls.length).toBe(before);
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe('costo estimado por modelo', () => {
    it('reconoce el modelo con fecha y cobra caro un modelo desconocido', async () => {
      const { estimateOpenAICostUSD } = await import('../../services/openai.service');
      expect(estimateOpenAICostUSD('gpt-4o-mini-2024-07-18', 1_000_000, 1_000_000)).toBeCloseTo(0.75, 6);
      expect(estimateOpenAICostUSD('gpt-4o-2024-08-06', 1_000_000, 1_000_000)).toBeCloseTo(12.5, 6);
      expect(estimateOpenAICostUSD('text-embedding-3-small', 1_000_000, 0)).toBeCloseTo(0.02, 6);
      expect(estimateOpenAICostUSD('modelo-nuevo', 1_000_000, 1_000_000)).toBeCloseTo(40, 6);
    });
  });
});
