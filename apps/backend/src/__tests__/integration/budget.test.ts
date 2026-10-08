/**
 * Topes de gasto mensual (Redis) y rate-limit de las funciones con IA:
 * chatbot (CHATBOT_MONTHLY_BUDGET_USD), LinkedIn Ads
 * (LINKEDIN_ADS_MONTHLY_BUDGET_USD) y gestor de contenido
 * (CONTENT_MONTHLY_BUDGET_USD). Usa un mock local de OpenAI que informa
 * 1M de tokens de entrada y 1M de salida por llamada (USD 0,75 con gpt-4o-mini).
 */
import request from 'supertest';
import type { Express } from 'express';
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

const COST_PER_CALL = 0.75;
const FEATURES = ['chatbot', 'linkedin-ads', 'content'] as const;
const ENV_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'CHATBOT_MONTHLY_BUDGET_USD',
  'LINKEDIN_ADS_MONTHLY_BUDGET_USD',
  'CONTENT_MONTHLY_BUDGET_USD',
  'INTERNAL_API_KEY',
] as const;

const linkedinBody = {
  demo: {
    titulo: 'CRM con IA',
    tagline: 'Vende más',
    industria: 'Ventas',
    path: '/demo/crm-ia',
    emoji: '🤖',
    problemaResuelve: 'Seguimiento manual',
    beneficiosClave: ['Prioriza leads'],
    publicoObjetivo: ['Gerentes comerciales'],
    metricaImpactante: 'Dato de ejemplo',
    caracteristicasIA: ['Puntaje de leads'],
    hashtagsEspecificos: ['#CRM'],
  },
  angulo: 'problema',
  tono: 'profesional',
};

/** IPs de prueba únicas por ejecución; sus contadores se borran al final. */
const usedIps = new Set<string>();
/** Cuentas de prueba con cupo propio (`user:<id>`); se borran al final. */
const usedIdentities = new Set<string>();
const octet = () => Math.floor(Math.random() * 254) + 1;
const testIp = () => {
  let ip = '';
  do ip = `10.${octet()}.${octet()}.${octet()}`;
  while (usedIps.has(ip));
  usedIps.add(ip);
  return ip;
};

describeDbRedis('topes de gasto y rate-limit de IA (integración)', () => {
  let app: Express;
  let mock: Awaited<ReturnType<typeof startOpenAiMock>>;
  let admin: TestUser;
  let user: TestUser;
  let redis: Awaited<ReturnType<typeof import('../../config/redis').getRedisClient>>;
  const savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};
  const savedSpend: Record<string, string | null> = {};
  const spendKey = (f: string) => `${f}:spend:${currentMonth()}`;
  const readSpend = async (f: string) => Number((await redis.get(spendKey(f))) ?? 0);

  beforeAll(async () => {
    for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
    mock = await startOpenAiMock();
    process.env.OPENAI_API_KEY = 'sk-test-mock';
    process.env.OPENAI_BASE_URL = mock.url;
    process.env.CHATBOT_MONTHLY_BUDGET_USD = '100';
    process.env.LINKEDIN_ADS_MONTHLY_BUDGET_USD = '100';
    process.env.CONTENT_MONTHLY_BUDGET_USD = '100';

    await connectTestDb('budget');
    const { createApp } = await import('../../app');
    app = createApp();
    const { getRedisClient } = await import('../../config/redis');
    redis = await getRedisClient();
    for (const f of FEATURES) {
      savedSpend[f] = await redis.get(spendKey(f));
      await redis.del(spendKey(f));
    }
    admin = await createUser('admin');
    user = await createUser('user');
  });

  afterAll(async () => {
    // Borra los contadores de rate-limit de las IPs de prueba.
    const { hashIp } = await import('../../services/ai-budget.service');
    const hashes = new Set<string>();
    for (const ip of [...usedIps, ...usedIdentities]) {
      for (const scope of ['linkedin-ads:10m', 'linkedin-ads:day', 'content:10m', 'content:day']) hashes.add(hashIp(scope, ip));
    }
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

  describe('chatbot', () => {
    async function createBot() {
      const res = await request(app).post('/api/chatbot/bots').send({ name: 'Bot presupuesto' });
      return res.body as { botId: string; ownerToken: string };
    }

    it('modelo fuera de la lista blanca → se usa gpt-4o-mini; uno permitido se respeta', async () => {
      const bot = await createBot();
      const before = mock.calls.length;
      const res = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'hola', model: 'gpt-5-ultra-caro' });
      expect(res.status).toBe(200);
      expect(res.body.model).toBe('gpt-4o-mini');
      expect(mock.calls[before].model).toBe('gpt-4o-mini');

      const res2 = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'hola', model: 'gpt-4o' });
      expect(res2.body.model).toBe('gpt-4o');
      expect(mock.calls[before + 1].model).toBe('gpt-4o');
    });

    it('suma el costo al gasto del mes y, al llegar al tope, deja de llamar al modelo', async () => {
      await redis.del(spendKey('chatbot'));
      process.env.CHATBOT_MONTHLY_BUDGET_USD = '1';
      const bot = await createBot();

      const first = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'pregunta uno' });
      expect(first.body.model).toBe('gpt-4o-mini');
      expect(first.body.costUSD).toBeCloseTo(COST_PER_CALL, 5);
      expect(await readSpend('chatbot')).toBeCloseTo(COST_PER_CALL, 5);

      await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'pregunta dos' });
      expect(await readSpend('chatbot')).toBeCloseTo(2 * COST_PER_CALL, 5);

      const callsBefore = mock.calls.length;
      const blocked = await request(app).post(`/api/chatbot/bots/${bot.botId}/chat`).send({ message: 'pregunta tres' });
      expect(blocked.status).toBe(200);
      expect(blocked.body.model).toBe('extractive-bm25');
      expect(blocked.body.error).toBe('budget_exhausted');
      expect(mock.calls.length).toBe(callsBefore);
      process.env.CHATBOT_MONTHLY_BUDGET_USD = '100';
    });
  });

  describe('LinkedIn Ads (/api/linkedin-ads/generate)', () => {
    it('401 anónimo, 403 sin acceso a la demo, 400 cuerpo inválido', async () => {
      expect((await request(app).post('/api/linkedin-ads/generate').send(linkedinBody)).status).toBe(401);
      expect((await request(app).post('/api/linkedin-ads/generate').set(bearer(user)).send(linkedinBody)).status).toBe(403);
      expect((await request(app).post('/api/linkedin-ads/generate').set(bearer(admin)).send({ angulo: 'x' })).status).toBe(400);
    });

    it('200 con staff: devuelve el paquete y registra el gasto', async () => {
      usedIdentities.add(`user:${admin.id}`);
      await redis.del(spendKey('linkedin-ads'));
      const res = await request(app).post('/api/linkedin-ads/generate').set(bearer(admin)).set('X-Forwarded-For', testIp()).send(linkedinBody);
      expect(res.status).toBe(200);
      expect(res.body.model).toBe('gpt-4o-mini');
      expect(res.body.data.ad.cta).toBe('Probar demo');
      expect(mock.calls[mock.calls.length - 1].responseFormat).toBe('json_schema');
      expect(await readSpend('linkedin-ads')).toBeCloseTo(COST_PER_CALL, 5);
    });

    it('rate-limit por cuenta: 5 cada 10 minutos, luego 429 (aunque cambie la IP)', async () => {
      const staff = await createUser('admin');
      usedIdentities.add(`user:${staff.id}`);
      for (let i = 0; i < 5; i += 1) {
        expect((await request(app).post('/api/linkedin-ads/generate').set(bearer(staff)).set('X-Forwarded-For', testIp()).send(linkedinBody)).status).toBe(200);
      }
      const limited = await request(app).post('/api/linkedin-ads/generate').set(bearer(staff)).set('X-Forwarded-For', testIp()).send(linkedinBody);
      expect(limited.status).toBe(429);
      expect(limited.body.code).toBe('rate_limited');
      expect(limited.headers['retry-after']).toBeDefined();
      // Otra cuenta desde la misma IP de salida (p. ej. Vercel) tiene su propio cupo.
      const other = await createUser('admin');
      usedIdentities.add(`user:${other.id}`);
      expect((await request(app).post('/api/linkedin-ads/generate').set(bearer(other)).send(linkedinBody)).status).toBe(200);
    });

    describe('sin sesión (si el admin deja la demo pública)', () => {
      beforeAll(async () => {
        const { setDemoAccessResolver } = await import('../../middleware/access');
        setDemoAccessResolver(async ({ slug }) =>
          slug === 'linkedin-ads' ? { allowed: true, reason: 'public' } : { allowed: false, reason: 'login_required' },
        );
      });
      afterAll(async () => {
        const { setDemoAccessResolver } = await import('../../middleware/access');
        setDemoAccessResolver(null);
      });

      it('rate-limit por IP: 5 cada 10 minutos, luego 429', async () => {
        const ip = testIp();
        for (let i = 0; i < 5; i += 1) {
          expect((await request(app).post('/api/linkedin-ads/generate').set('X-Forwarded-For', ip).send(linkedinBody)).status).toBe(200);
        }
        const limited = await request(app).post('/api/linkedin-ads/generate').set('X-Forwarded-For', ip).send(linkedinBody);
        expect(limited.status).toBe(429);
        expect(limited.body.code).toBe('rate_limited');
      });

      it('con INTERNAL_API_KEY, el proxy de Next informa la IP del visitante', async () => {
        process.env.INTERNAL_API_KEY = 'clave-interna-de-prueba-0123456789';
        try {
          const visitor = testIp();
          for (let i = 0; i < 5; i += 1) {
            const res = await request(app)
              .post('/api/linkedin-ads/generate')
              .set('X-Forwarded-For', testIp())
              .set('X-Internal-Key', 'clave-interna-de-prueba-0123456789')
              .set('X-Client-IP', visitor)
              .send(linkedinBody);
            expect(res.status).toBe(200);
          }
          const sixth = await request(app)
            .post('/api/linkedin-ads/generate')
            .set('X-Forwarded-For', testIp())
            .set('X-Internal-Key', 'clave-interna-de-prueba-0123456789')
            .set('X-Client-IP', visitor)
            .send(linkedinBody);
          expect(sixth.status).toBe(429);
          // Con una clave incorrecta, X-Client-IP se ignora (no se puede falsear).
          const spoof = await request(app)
            .post('/api/linkedin-ads/generate')
            .set('X-Forwarded-For', testIp())
            .set('X-Internal-Key', 'otra')
            .set('X-Client-IP', visitor)
            .send(linkedinBody);
          expect(spoof.status).toBe(200);
        } finally {
          delete process.env.INTERNAL_API_KEY;
        }
      });
    });

    it('tope mensual alcanzado → 503 budget_exhausted sin llamar al modelo', async () => {
      process.env.LINKEDIN_ADS_MONTHLY_BUDGET_USD = '0.5';
      const callsBefore = mock.calls.length;
      const res = await request(app).post('/api/linkedin-ads/generate').set(bearer(admin)).set('X-Forwarded-For', testIp()).send(linkedinBody);
      expect(res.status).toBe(503);
      expect(res.body.code).toBe('budget_exhausted');
      expect(mock.calls.length).toBe(callsBefore);
      process.env.LINKEDIN_ADS_MONTHLY_BUDGET_USD = '100';
    });
  });

  describe('gestor de contenido (demo pública)', () => {
    it('anónimo puede usarlo (demo publico), registra gasto y respeta el tope', async () => {
      await redis.del(spendKey('content'));
      const ok = await request(app)
        .post('/api/content/improve')
        .set('X-Forwarded-For', testIp())
        .send({ content: 'Texto a mejorar', template: 'email' });
      expect(ok.status).toBe(200);
      expect(await readSpend('content')).toBeCloseTo(COST_PER_CALL, 5);

      process.env.CONTENT_MONTHLY_BUDGET_USD = '0.5';
      const blocked = await request(app)
        .post('/api/content/improve')
        .set('X-Forwarded-For', testIp())
        .send({ content: 'Texto a mejorar', template: 'email' });
      expect(blocked.status).toBe(503);
      expect(blocked.body.code).toBe('budget_exhausted');
      process.env.CONTENT_MONTHLY_BUDGET_USD = '100';
    });

    it('texto demasiado largo → 400', async () => {
      const res = await request(app).post('/api/content/improve').send({ content: 'x'.repeat(10_001), template: 'email' });
      expect(res.status).toBe(400);
    });
  });
});
