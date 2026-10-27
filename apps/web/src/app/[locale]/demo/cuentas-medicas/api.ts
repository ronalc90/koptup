import { API_BASE } from '@/lib/backend-url';
import { authFetch, getValidAccessToken } from '@/lib/auth-token';
import type { DetalleFactura, Factura, FiltrosFacturas, ResultadoProcesamiento } from './tipos-auditoria';

/**
 * Cliente de la demo para /api/auditoria.
 *
 * Todas las llamadas van con la sesión (`authFetch` de `src/lib/auth-token.ts`:
 * envía `Authorization: Bearer` y renueva el token si venció). La demo es
 * privada: el backend responde 401 sin sesión y 403 sin un acceso vigente, y
 * la página lo muestra como "Tu acceso a esta demo no está activo" con el
 * motivo concreto (sesión cerrada, acceso vencido, revocado…).
 */

export class ApiError extends Error {
  readonly status: number;
  /** `code` del cuerpo de error del backend (p. ej. `rate_limited`, `demo_access_required`). */
  readonly code: string;
  /** `motivo` que manda el control de acceso a demos (`expirado`, `revocado`…). */
  readonly motivo: string;

  constructor(status: number, code = '', motivo = '', message = '') {
    super(message || code || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.motivo = motivo;
  }
}

/** 401 (sin sesión o vencida) o 403 (sin acceso a la demo, o demo desactivada). */
export function esErrorDeAcceso(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export type MotivoAcceso = 'sesion' | 'expirado' | 'revocado' | 'sinAcceso' | 'desactivada';

/** Por qué el servidor negó el acceso (para explicarlo en pantalla). */
export function motivoDeAcceso(error: unknown): MotivoAcceso {
  if (!(error instanceof ApiError) || error.status === 401) return 'sesion';
  if (error.code === 'demo_disabled') return 'desactivada';
  if (error.motivo === 'expirado') return 'expirado';
  if (error.motivo === 'revocado') return 'revocado';
  return 'sinAcceso';
}

/** Tipo de error para elegir el mensaje (claves `errors.*` de la demo). */
export type TipoError =
  | 'network'
  | 'server'
  | 'notFound'
  | 'badRequest'
  | 'rateLimited'
  | 'aiLimit'
  | 'aiUnavailable'
  | 'aiBudget'
  | 'unavailable';

export function tipoDeError(error: unknown): TipoError {
  if (!(error instanceof ApiError)) return 'server';
  if (error.status === 0) return 'network';
  if (error.status === 404) return 'notFound';
  if (error.status === 400 || error.status === 422) return 'badRequest';
  if (error.status === 429) return error.code === 'ai_user_limit' ? 'aiLimit' : 'rateLimited';
  if (error.status === 503) {
    if (error.code === 'budget_exhausted') return 'aiBudget';
    if (error.code === 'ai_unavailable') return 'aiUnavailable';
    return 'unavailable';
  }
  return 'server';
}

async function solicitar(ruta: string, init: RequestInit = {}): Promise<Response> {
  // Sin sesión (ni token ni forma de renovarlo) no se llama al servidor: la
  // respuesta sería un 401 seguro. Se muestra directamente «Tu sesión se cerró».
  if (!(await getValidAccessToken())) throw new ApiError(401, 'login_required', 'sin_sesion');
  let resp: Response;
  try {
    resp = await authFetch(`${API_BASE}${ruta}`, init);
  } catch {
    throw new ApiError(0, 'network');
  }
  if (!resp.ok) {
    let cuerpo: { code?: unknown; motivo?: unknown; message?: unknown } | null = null;
    try {
      cuerpo = await resp.clone().json();
    } catch {
      // respuesta sin JSON
    }
    const texto = (v: unknown) => (typeof v === 'string' ? v : '');
    throw new ApiError(resp.status, texto(cuerpo?.code), texto(cuerpo?.motivo), texto(cuerpo?.message));
  }
  return resp;
}

async function datos<T>(ruta: string, init?: RequestInit): Promise<T> {
  const resp = await solicitar(ruta, init);
  const cuerpo = await resp.json();
  return cuerpo.data as T;
}

export const auditoriaAPI = {
  async obtenerFacturas(
    filtros: FiltrosFacturas,
    page = 1,
    limit = 20,
  ): Promise<{ facturas: Factura[]; total: number }> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.desde) params.set('desde', `${filtros.desde}T00:00:00-05:00`);
    // "hasta" incluye todo ese día en hora de Colombia (el backend compara con <=).
    if (filtros.hasta) params.set('hasta', `${filtros.hasta}T23:59:59.999-05:00`);
    const resp = await solicitar(`/auditoria/facturas?${params.toString()}`);
    const cuerpo = await resp.json();
    return { facturas: (cuerpo.data ?? []) as Factura[], total: Number(cuerpo.pagination?.total ?? 0) };
  },

  obtenerFactura(id: string): Promise<DetalleFactura> {
    return datos<DetalleFactura>(`/auditoria/facturas/${encodeURIComponent(id)}`);
  },

  async eliminarFactura(id: string): Promise<void> {
    await solicitar(`/auditoria/facturas/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  /** Sube los PDF: el backend extrae los datos con IA, aplica el tarifario de ejemplo y guarda la factura. */
  auditarPDF(archivos: File[]): Promise<ResultadoProcesamiento> {
    const formData = new FormData();
    archivos.forEach((archivo) => formData.append('files', archivo));
    return datos<ResultadoProcesamiento>('/auditoria/procesar-facturas-pdf', {
      method: 'POST',
      body: formData,
    });
  },

  /** Decisión del auditor sobre una glosa; el backend recalcula los totales de la factura. */
  async actualizarGlosa(
    id: string,
    cambios: { estado: string; valorGlosado: number; observaciones: string },
  ): Promise<void> {
    await solicitar(`/auditoria/glosas/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios),
    });
  },
};
