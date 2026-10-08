import { randomBytes, randomInt } from 'node:crypto';
import { request, type APIRequestContext, type APIResponse } from '@playwright/test';

/**
 * Helpers para sembrar datos en el backend por su API REST (la misma que usa
 * la web): cuentas, solicitudes de demo, aprobaciones, accesos y catálogo.
 * Nada se escribe directo en la base; la única excepción es dar el rol admin
 * a la cuenta de pruebas (ver global-setup.ts), porque la API no permite que
 * nadie se lo asigne a sí mismo.
 *
 * Visitantes distintos: el backend limita por IP el login, el registro, la
 * activación y el formulario de contacto (5 por minuto entre todos), las
 * solicitudes de demo (5 por hora) y la subida de documentos de la demo RAG
 * (3 al día). Como todas las pruebas salen de la misma máquina, cada contexto
 * se presenta con una IP propia en `X-Forwarded-For`, igual que hace el proxy
 * de Railway con cada visitante real. Funciona porque el backend confía en un
 * salto de proxy (TRUST_PROXY_HOPS, por defecto 1): sin proxy delante, esa
 * cabecera la pone el cliente.
 */

export const API_URL = (process.env.E2E_API_URL ?? '').trim().replace(/\/+$/, '');
export const HAS_API = API_URL !== '';
export const NEEDS_API =
  'E2E_API_URL no está definida: estas pruebas siembran datos en el backend por su API (ver README › Pruebas y CI)';

/**
 * Demo que access-mode.spec.ts pasa de "publico" a "solicitud" desde el panel
 * y devuelve a "publico" (global-setup.ts la restaura si una corrida anterior
 * se interrumpió a mitad).
 */
export const ACCESS_MODE_TEST_DEMO = 'firma-electronica';

/** IP privada al azar (10.0.0.0/8): un visitante distinto en cada llamada. */
export function visitorIp(): string {
  return `10.${randomInt(0, 256)}.${randomInt(0, 256)}.${randomInt(1, 255)}`;
}

/** Email único en el dominio reservado .test (nunca llega a un buzón real). */
export function uniqueEmail(prefix: string): string {
  const tag = `${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
  return `${prefix.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.${tag}@e2e.koptup.test`;
}

/** Contraseña al azar de una sola corrida (nunca se versiona ninguna). */
export function randomPassword(): string {
  return `E2e-${randomBytes(12).toString('base64url')}`;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

/** Sesión que devuelven el login y la activación (POST /api/auth/login|activate). */
export interface Session {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface DemoRequestInput {
  nombre: string;
  empresa: string;
  email: string;
  pais: string;
  tamanoEmpresa: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  demos: string[];
  casoDeUso: string;
  cargo?: string;
  telefono?: string;
}

export interface GrantView {
  id: string;
  demoSlug: string;
  estado: string;
  estadoEfectivo: string;
  diasRestantes: number;
  user?: { email?: string } | null;
}

export interface GrantResult {
  user: { id: string; email: string; role: string; accountStatus: string; cuentaNueva: boolean };
  grants: GrantView[];
  activationUrl: string | null;
}

export interface CatalogItem {
  slug: string;
  accessMode: 'publico' | 'solicitud' | 'privado';
  activo: boolean;
}

export interface ContactLead {
  id: string;
  email: string;
  name: string;
  service: string;
  message: string;
  source: string;
}

class ApiError extends Error {}

async function unwrap<T>(response: APIResponse, what: string, expected: number[]): Promise<T> {
  const text = await response.text();
  if (!expected.includes(response.status())) {
    throw new ApiError(`${what}: el backend respondió ${response.status()} (se esperaba ${expected.join(' o ')}): ${text.slice(0, 400)}`);
  }
  const json = JSON.parse(text) as { data?: T };
  return json.data as T;
}

/**
 * Cliente de la API del backend. Cada instancia es un visitante (una IP); con
 * `token`, las llamadas van con la sesión de esa cuenta.
 */
export class Api {
  private constructor(
    private readonly ctx: APIRequestContext,
    readonly ip: string,
  ) {}

  static async open(ip: string = visitorIp()): Promise<Api> {
    if (!HAS_API) throw new Error(NEEDS_API);
    const ctx = await request.newContext({
      baseURL: `${API_URL}/`,
      extraHTTPHeaders: { 'X-Forwarded-For': ip, Accept: 'application/json' },
    });
    return new Api(ctx, ip);
  }

  async dispose(): Promise<void> {
    await this.ctx.dispose();
  }

  private headers(token?: string): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // --- Cuentas -------------------------------------------------------------

  async register(name: string, email: string, password: string): Promise<void> {
    await unwrap(await this.ctx.post('api/auth/register', { data: { name, email, password } }), 'POST /api/auth/register', [201]);
  }

  async login(email: string, password: string): Promise<Session> {
    return unwrap<Session>(await this.ctx.post('api/auth/login', { data: { email, password } }), 'POST /api/auth/login', [200]);
  }

  async activate(token: string, password: string): Promise<Session> {
    return unwrap<Session>(await this.ctx.post('api/auth/activate', { data: { token, password } }), 'POST /api/auth/activate', [200]);
  }

  async me(token: string): Promise<SessionUser> {
    return unwrap<SessionUser>(await this.ctx.get('api/auth/me', { headers: this.headers(token) }), 'GET /api/auth/me', [200]);
  }

  // --- Sistema de demos (público) -------------------------------------------

  async createDemoRequest(input: DemoRequestInput): Promise<{ codigo: string; estado: string }> {
    return unwrap(
      await this.ctx.post('api/demo-requests', { data: { ...input, consentimiento: true } }),
      'POST /api/demo-requests',
      [201],
    );
  }

  async catalog(): Promise<CatalogItem[]> {
    return unwrap<CatalogItem[]>(await this.ctx.get('api/demo-catalog'), 'GET /api/demo-catalog', [200]);
  }

  async demoAccess(slug: string, token?: string): Promise<{ allowed: boolean; reason: string; accessMode: string }> {
    return unwrap(
      await this.ctx.get(`api/demo-access/${slug}?registrar=0`, { headers: this.headers(token) }),
      `GET /api/demo-access/${slug}`,
      [200],
    );
  }

  // --- Panel (equipo) -------------------------------------------------------

  async findRequestByEmail(token: string, email: string): Promise<{ id: string; codigo: string; estado: string }> {
    const data = await unwrap<{ items: Array<{ id: string; codigo: string; estado: string; email: string }> }>(
      await this.ctx.get('api/admin/demo-requests', { headers: this.headers(token), params: { q: email } }),
      'GET /api/admin/demo-requests',
      [200],
    );
    const found = data.items.find((r) => r.email === email);
    if (!found) throw new ApiError(`No hay una solicitud de demo con el email ${email}`);
    return found;
  }

  async approveRequest(token: string, id: string, body: { demos?: string[]; dias?: number; nota?: string }): Promise<GrantResult> {
    return unwrap<GrantResult>(
      await this.ctx.post(`api/admin/demo-requests/${id}/approve`, { headers: this.headers(token), data: body }),
      'POST /api/admin/demo-requests/:id/approve',
      [200],
    );
  }

  /** Acceso directo por email (Admin › Accesos a demos › Invitar). */
  async grantDemos(token: string, body: { email: string; nombre: string; demos: string[]; dias?: number }): Promise<GrantResult> {
    return unwrap<GrantResult>(
      await this.ctx.post('api/admin/demo-grants', { headers: this.headers(token), data: body }),
      'POST /api/admin/demo-grants',
      [201],
    );
  }

  async grantsOf(token: string, email: string): Promise<GrantView[]> {
    const data = await unwrap<{ items: GrantView[] }>(
      await this.ctx.get('api/admin/demo-grants', { headers: this.headers(token), params: { q: email } }),
      'GET /api/admin/demo-grants',
      [200],
    );
    return data.items;
  }

  async patchCatalog(token: string, slug: string, changes: Partial<Pick<CatalogItem, 'accessMode' | 'activo'>>): Promise<CatalogItem> {
    return unwrap<CatalogItem>(
      await this.ctx.patch(`api/admin/demo-catalog/${slug}`, { headers: this.headers(token), data: changes }),
      'PATCH /api/admin/demo-catalog/:slug',
      [200],
    );
  }

  async contacts(token: string): Promise<ContactLead[]> {
    return unwrap<ContactLead[]>(await this.ctx.get('api/admin/contacts', { headers: this.headers(token) }), 'GET /api/admin/contacts', [200]);
  }
}

/** Token de activación de un enlace /activar/<token>. */
export function activationToken(activationUrl: string): string {
  const token = new URL(activationUrl).pathname.split('/').filter(Boolean).pop();
  if (!token) throw new Error(`Enlace de activación sin token: ${activationUrl}`);
  return token;
}

// ---------------------------------------------------------------------------
//   Cuentas de prueba
// ---------------------------------------------------------------------------

let adminSessionCache: { session: Promise<Session>; at: number } | null = null;
/** El access token dura 15 min: se renueva antes. */
const ADMIN_SESSION_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Sesión de la cuenta admin de pruebas (la crea global-setup.ts o llega por
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD). Se reutiliza dentro de cada worker.
 */
export function adminSession(): Promise<Session> {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Falta la cuenta admin de pruebas (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD; ver e2e/global-setup.ts).');
  }
  if (!adminSessionCache || Date.now() - adminSessionCache.at > ADMIN_SESSION_MAX_AGE_MS) {
    const session = (async () => {
      const api = await Api.open();
      try {
        return await api.login(email, password);
      } finally {
        await api.dispose();
      }
    })();
    adminSessionCache = { session, at: Date.now() };
    session.catch(() => {
      adminSessionCache = null;
    });
  }
  return adminSessionCache.session;
}

/**
 * Prospecto con acceso vigente a `demos`, creado como en producción: el admin
 * lo invita (POST /api/admin/demo-grants) y la persona activa la cuenta con su
 * enlace mágico (POST /api/auth/activate). Devuelve su sesión.
 */
export async function prospectWithAccess(demos: string[], prefix = 'prospecto'): Promise<Session & { password: string }> {
  const admin = await adminSession();
  const api = await Api.open();
  try {
    const email = uniqueEmail(prefix);
    const granted = await api.grantDemos(admin.accessToken, { email, nombre: 'Prospecto E2E', demos, dias: 14 });
    if (!granted.activationUrl) throw new Error('La invitación no devolvió enlace de activación');
    const password = randomPassword();
    const session = await api.activate(activationToken(granted.activationUrl), password);
    return { ...session, password };
  } finally {
    await api.dispose();
  }
}
