import Cookies from 'js-cookie';
import { API_BASE } from '@/lib/backend-url';
import type {
  DetalleFactura,
  Estadisticas,
  Factura,
  FiltrosFacturas,
  ResultadoProcesamiento,
} from './tipos-auditoria';

/**
 * Cliente de la demo para /api/auditoria.
 *
 * Todas las llamadas envían el token de sesión (cookie `accessToken`, la misma
 * que usa `src/lib/api.ts`) como `Authorization: Bearer`. La demo es privada:
 * el backend puede responder 401/403 si la persona no tiene un acceso activo, y
 * la página lo muestra como "Tu acceso a esta demo no está activo".
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** 401 (sin sesión o vencida) o 403 (sin acceso a la demo). */
export function esErrorDeAcceso(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

let refrescoEnCurso: Promise<string | null> | null = null;

/** Renueva el token de acceso con el refresh token (mismo flujo que src/lib/api.ts). */
function refrescarToken(): Promise<string | null> {
  const refreshToken = Cookies.get('refreshToken');
  if (!refreshToken) return Promise.resolve(null);
  if (!refrescoEnCurso) {
    refrescoEnCurso = (async () => {
      try {
        const resp = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!resp.ok) return null;
        const cuerpo = await resp.json();
        const token: string | undefined = cuerpo?.data?.accessToken;
        if (token) Cookies.set('accessToken', token, { expires: 1 / 96 });
        return token ?? null;
      } catch {
        return null;
      } finally {
        refrescoEnCurso = null;
      }
    })();
  }
  return refrescoEnCurso;
}

async function solicitar(ruta: string, init: RequestInit = {}, reintentar = true): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = Cookies.get('accessToken');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let resp: Response;
  try {
    resp = await fetch(`${API_BASE}${ruta}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'network');
  }

  if (resp.status === 401 && reintentar && Cookies.get('refreshToken')) {
    const nuevo = await refrescarToken();
    if (nuevo) return solicitar(ruta, init, false);
  }

  if (!resp.ok) {
    let mensaje = '';
    try {
      const cuerpo = await resp.clone().json();
      mensaje = typeof cuerpo?.message === 'string' ? cuerpo.message : '';
    } catch {
      // respuesta sin JSON
    }
    throw new ApiError(resp.status, mensaje);
  }
  return resp;
}

async function datos<T>(ruta: string, init?: RequestInit): Promise<T> {
  const resp = await solicitar(ruta, init);
  const cuerpo = await resp.json();
  return cuerpo.data as T;
}

export const auditoriaAPI = {
  obtenerEstadisticas(): Promise<Estadisticas> {
    return datos<Estadisticas>('/auditoria/estadisticas');
  },

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
