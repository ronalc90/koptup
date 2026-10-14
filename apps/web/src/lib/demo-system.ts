/**
 * Cliente del sistema de demos (wiki 04): catálogo, accesos propios y
 * llamadas del panel. Todas las decisiones de acceso las toma el backend;
 * aquí solo se leen y se muestran.
 *
 * Endpoints (apps/backend/src/routes/demo-public.routes.ts y admin-demos.routes.ts):
 *  - GET  /api/demo-catalog              catálogo (público)
 *  - POST /api/demo-requests             formulario "Solicitar demo"
 *  - GET  /api/demo-access/:slug         ¿puede esta sesión abrir la demo?
 *  - GET  /api/me/demos                  Mis demos (con sesión)
 *  - POST /api/auth/activate[/check]     activación con el enlace mágico
 *  - /api/admin/demo-requests | demo-grants | demo-catalog   (equipo)
 */
import Cookies from 'js-cookie';
import { API_BASE } from './backend-url';
import { authFetch } from './auth-token';
import {
  DEMO_ACCESS_DEFAULTS,
  DEMO_DEFAULTS_BY_SLUG,
  type DemoAccessMode,
} from './demo-access-defaults';

export type { DemoAccessMode } from './demo-access-defaults';

export interface CatalogItem {
  slug: string;
  nombre: string;
  nombreEn: string | null;
  accessMode: DemoAccessMode;
  activo: boolean;
}

export interface AdminCatalogItem extends CatalogItem {
  duracionDiasPorDefecto: number;
  orden: number;
  updatedAt: string | null;
}

/** Motivos de GET /api/demo-access/:slug (services/demo-access.service.ts). */
export type DemoAccessReason =
  | 'staff'
  | 'publico'
  | 'grant'
  | 'sin_sesion'
  | 'sin_acceso'
  | 'expirado'
  | 'revocado'
  | 'desactivada'
  | 'no_existe'
  | 'no_disponible';

export const DENIED_REASONS: readonly DemoAccessReason[] = [
  'sin_sesion',
  'sin_acceso',
  'expirado',
  'revocado',
  'desactivada',
  'no_disponible',
];

export function isDeniedReason(value: unknown): value is DemoAccessReason {
  return typeof value === 'string' && (DENIED_REASONS as readonly string[]).includes(value);
}

export interface DemoAccessDecision {
  slug: string;
  allowed: boolean;
  accessMode: DemoAccessMode | null;
  activo: boolean;
  reason: DemoAccessReason;
  expiresAt: string | null;
  diasRestantes: number | null;
}

/** Un acceso de GET /api/me/demos. */
export interface MyDemo {
  id: string;
  demoSlug: string;
  demoNombre: string;
  demoNombreEn: string | null;
  accessMode: DemoAccessMode | null;
  demoActiva: boolean;
  estado: 'activo' | 'expirado' | 'revocado';
  vigente: boolean;
  expiresAt: string;
  diasRestantes: number;
  ultimoAcceso: string | null;
  accesos: number;
  url: string;
}

/** WhatsApp de KopTup (el mismo de /contact). */
export const KOPTUP_WHATSAPP_NUMBER = '573024794842';

/** Roles del equipo que pueden abrir cualquier demo (config/demos.ts del backend). */
export const DEMO_STAFF_ROLES: readonly string[] = ['admin', 'sales', 'manager', 'developer'];

/** Error de la API con el mensaje, el código y los datos extra del backend. */
export class ApiError extends Error {
  status: number;
  code?: string;
  data: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    const body = (await res.json()) as unknown;
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Convierte una respuesta del backend en `data` o lanza ApiError. */
async function unwrap<T>(res: Response): Promise<T> {
  const body = await parseJson(res);
  if (!res.ok || body.success === false) {
    const message = typeof body.message === 'string' ? body.message : `HTTP ${res.status}`;
    throw new ApiError(message, res.status, typeof body.code === 'string' ? body.code : undefined, body);
  }
  return body.data as T;
}

/** Fallo de red (backend caído, CORS, sin conexión): status 0. */
function networkError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return new ApiError(err instanceof Error ? err.message : 'network_error', 0, 'network_error');
}

/** Petición JSON al backend con la sesión (renueva el token si venció). */
export async function apiRequest<T>(
  path: string,
  init: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; auth?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = init;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const request: RequestInit = {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
    cache: 'no-store',
  };
  let res: Response;
  try {
    res = auth ? await authFetch(`${API_BASE}${path}`, request) : await fetch(`${API_BASE}${path}`, request);
  } catch (err) {
    throw networkError(err);
  }
  return unwrap<T>(res);
}

/** ¿Hay sesión en este navegador? (cookies que deja el login). */
export function hasSessionCookie(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(Cookies.get('accessToken') || Cookies.get('refreshToken'));
}

/** Usuario guardado por el login (solo para la interfaz; el backend decide). */
export function storedUser(): { id?: string; name?: string; email?: string; role?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as { id?: string; name?: string; email?: string; role?: string }) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
//   Catálogo
// ---------------------------------------------------------------------------

/** Catálogo según la semilla (antes de que responda el backend). */
export function defaultCatalog(): CatalogItem[] {
  return DEMO_ACCESS_DEFAULTS.map((d) => ({ slug: d.slug, nombre: d.nombre, nombreEn: d.nombreEn, accessMode: d.accessMode, activo: true }));
}

/** Mapa slug → entrada: el catálogo recibido sobre la semilla. */
export function catalogMap(items: readonly CatalogItem[] | null | undefined): Map<string, CatalogItem> {
  const map = new Map<string, CatalogItem>(defaultCatalog().map((i) => [i.slug, i]));
  for (const item of items ?? []) map.set(item.slug, item);
  return map;
}

export async function fetchPublicCatalog(signal?: AbortSignal): Promise<CatalogItem[]> {
  const data = await apiRequest<CatalogItem[]>('/demo-catalog', { auth: false, signal });
  return Array.isArray(data) ? data : [];
}

/** Nombre de la demo en el idioma de la página. */
export function demoName(item: { slug?: string; nombre?: string | null; nombreEn?: string | null } | null | undefined, locale: string, fallbackSlug = ''): string {
  if (!item) return DEMO_DEFAULTS_BY_SLUG[fallbackSlug]?.[locale === 'en' ? 'nombreEn' : 'nombre'] ?? fallbackSlug;
  if (locale === 'en' && item.nombreEn) return item.nombreEn;
  if (item.nombre) return item.nombre;
  const slug = item.slug ?? fallbackSlug;
  return DEMO_DEFAULTS_BY_SLUG[slug]?.[locale === 'en' ? 'nombreEn' : 'nombre'] ?? slug;
}

// ---------------------------------------------------------------------------
//   Acceso y Mis demos
// ---------------------------------------------------------------------------

export function fetchDemoAccess(slug: string, signal?: AbortSignal): Promise<DemoAccessDecision> {
  return apiRequest<DemoAccessDecision>(`/demo-access/${encodeURIComponent(slug)}`, { auth: hasSessionCookie(), signal });
}

export async function fetchMyDemos(signal?: AbortSignal): Promise<MyDemo[]> {
  const data = await apiRequest<MyDemo[]>('/me/demos', { signal });
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
//   Utilidades de presentación
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha corta en hora de Colombia (solo en el cliente, tras cargar datos). */
export function formatDate(value: string | Date | null | undefined, locale: string, withTime = false): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'America/Bogota',
  }).format(date);
}

/** Días completos que faltan para una fecha (0 si ya pasó). */
export function daysUntil(value: string | Date, now = Date.now()): number {
  const t = (value instanceof Date ? value : new Date(value)).getTime();
  return Math.max(0, Math.ceil((t - now) / DAY_MS));
}

/**
 * Número para wa.me (solo dígitos, con indicativo). Un celular colombiano de
 * 10 dígitos que empieza por 3 y llega sin indicativo recibe el 57.
 * Devuelve null si no parece un teléfono.
 */
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('3')) digits = `57${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** Enlace de WhatsApp con el mensaje prellenado (o null si no hay teléfono válido). */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const number = whatsappNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}

/** Copia texto al portapapeles (con alternativa para navegadores sin la API). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // sigue con la alternativa
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Lee `?demos=a,b` (o `?demo=a`) y devuelve los slugs válidos, sin repetir. */
export function parseDemoSlugsParam(...values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    for (const raw of value.split(',')) {
      const slug = raw.trim().toLowerCase();
      if (slug && DEMO_DEFAULTS_BY_SLUG[slug] && !out.includes(slug)) out.push(slug);
    }
  }
  return out.slice(0, 10);
}
