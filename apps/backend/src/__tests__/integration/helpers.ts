/**
 * Utilidades de las pruebas de integración (supertest + MongoDB + Redis).
 * No es una suite: Jest solo ejecuta archivos *.test.ts.
 */
import http from 'http';
import { AddressInfo } from 'net';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const MONGO_OK = process.env.INTEGRATION_MONGO_OK === '1';
export const REDIS_OK = process.env.INTEGRATION_REDIS_OK === '1';

/** `describe` que se omite si no hay MongoDB de pruebas. */
export const describeDb = MONGO_OK ? describe : describe.skip;
/** `describe` que se omite si no hay MongoDB y Redis de pruebas. */
export const describeDbRedis = MONGO_OK && REDIS_OK ? describe : describe.skip;

/** Base propia por archivo de pruebas: `<base>_<sufijo>`. */
export function testDbUri(suffix: string): string {
  const url = new URL(process.env.MONGODB_URI_TEST as string);
  const base = url.pathname.replace(/^\//, '') || 'koptup_test';
  url.pathname = `/${base}_${suffix}`;
  return url.toString();
}

export async function connectTestDb(suffix: string): Promise<void> {
  await mongoose.connect(testDbUri(suffix), { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.dropDatabase();
}

export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    // Espera la creación de índices de los modelos (es asíncrona) para que no
    // vuelva a crear la base después de borrarla.
    await Promise.all(Object.values(mongoose.models).map((m) => m.init().catch(() => undefined)));
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
}

export interface TestUser {
  id: string;
  email: string;
  role: string;
  token: string;
}

/** Crea un usuario en la BD y devuelve un JWT válido para él. */
export async function createUser(role: string, email = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`): Promise<TestUser> {
  const res = await mongoose.connection.collection('users').insertOne({
    email,
    name: `Usuario ${role}`,
    role,
    provider: 'local',
    password: 'hash-de-prueba',
    created_at: new Date(),
    updated_at: new Date(),
  });
  const id = String(res.insertedId);
  return { id, email, role, token: signToken({ id, email, role }) };
}

export function signToken(payload: { id: string; email: string; role: string }, opts: jwt.SignOptions = { expiresIn: '15m' }): string {
  return jwt.sign({ ...payload, name: 'Prueba' }, process.env.JWT_SECRET as string, opts);
}

export const bearer = (u: { token: string }) => ({ Authorization: `Bearer ${u.token}` });

/**
 * Mock mínimo de OpenAI (chat/completions) en un puerto local. Cuenta las
 * llamadas y devuelve un uso de tokens fijo para poder verificar el gasto.
 */
export async function startOpenAiMock(): Promise<{
  url: string;
  calls: Array<{ model: string; responseFormat?: string }>;
  close: () => Promise<void>;
}> {
  const calls: Array<{ model: string; responseFormat?: string }> = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      let body: any = {};
      try {
        body = JSON.parse(raw || '{}');
      } catch {
        /* cuerpo vacío */
      }
      calls.push({ model: body.model, responseFormat: body.response_format?.type });
      let content = 'Respuesta de prueba [1].';
      if (body.response_format?.type === 'json_schema' || body.response_format?.type === 'json_object') {
        content = JSON.stringify({
          post: { hook: 'Hook', body: 'Cuerpo', cta: 'CTA', hashtags: ['#Koptup', '#IA', '#B2B', '#LATAM'] },
          ad: { headline: 'Titular', introText: 'Intro', description: 'Descripción', cta: 'Probar demo' },
          carrusel: [{ numero: 1, titulo: 'Portada', bullets: ['Uno'], notaVisual: 'Logo' }],
          estrategia: 'Funciona porque es de prueba.',
        });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          id: 'chatcmpl-test',
          object: 'chat.completion',
          model: body.model,
          choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
          // 1M de entrada + 1M de salida con gpt-4o-mini = USD 0,75 por llamada.
          usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000, total_tokens: 2_000_000 },
        }),
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/v1`,
    calls,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** Mes de facturación (UTC) de las claves de gasto. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
