/**
 * Llamadas al backend del motor (`/api/expert/*` y `/api/cups/*`).
 *
 * Todas envían el token de sesión (cookie `accessToken`) como `Bearer` y
 * traducen 401/403/429 a errores tipados para mostrar un mensaje claro.
 */

import Cookies from 'js-cookie';
import { API_BASE } from '@/lib/backend-url';
import type { ManualTarifario } from './datos-ejemplo';

export type TipoErrorApi = 'sin-sesion' | 'sin-acceso' | 'limite' | 'sin-conexion' | 'servidor';

export class ErrorApi extends Error {
  tipo: TipoErrorApi;
  estado: number;

  constructor(tipo: TipoErrorApi, estado: number, mensaje?: string) {
    super(mensaje || tipo);
    this.tipo = tipo;
    this.estado = estado;
  }
}

async function llamar<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = Cookies.get('accessToken');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${ruta}`, { ...init, headers, cache: 'no-store' });
  } catch {
    throw new ErrorApi('sin-conexion', 0);
  }

  if (res.status === 401) throw new ErrorApi('sin-sesion', 401);
  if (res.status === 403) throw new ErrorApi('sin-acceso', 403);
  if (res.status === 429) throw new ErrorApi('limite', 429);

  let cuerpo: { success?: boolean; data?: T; error?: string; message?: string } | null = null;
  try {
    cuerpo = await res.json();
  } catch {
    cuerpo = null;
  }
  if (!res.ok || !cuerpo || cuerpo.success === false) {
    throw new ErrorApi('servidor', res.status, cuerpo?.error || cuerpo?.message);
  }
  return cuerpo.data as T;
}

export interface EstadisticasExperto {
  totalCuentas: number;
  cuentasProcesadas: number;
  porcentajeProcesado: number;
  /** Misma configuración que devuelve GET /api/expert/configuracion. */
  configuracionActual?: ConfigServidor;
}

export interface EstadisticasCups {
  totalCUPS: number;
  cupsActivos: number;
  cupsInactivos: number;
  cupsPorCategoria: Record<string, number>;
  cupsConTarifaISS2004: number;
}

export interface EstadisticasVectorizacion {
  totalCUPS: number;
  cupsVectorizados: number;
  cupsPendientes: number;
  porcentajeVectorizado: number;
}

/** Configuración completa tal como la guarda el servidor. */
export interface ConfigServidor {
  toleranciaDiferenciaTarifa: number;
  manualesTarifarios: ManualTarifario[];
  manualPorDefecto: ManualTarifario;
  reglasHabilitadas: string[];
  [otro: string]: unknown;
}

export interface ResultadoBusquedaServidor {
  cups: {
    codigo: string;
    descripcion: string;
    categoria: string;
    especialidad?: string;
    tarifaISS2004?: number;
    tarifaSOAT?: number;
  };
  similaridad: number;
}

export const apiMotor = {
  estadisticas: () => llamar<EstadisticasExperto>('/expert/estadisticas'),
  guardarConfiguracion: (config: ConfigServidor) =>
    llamar<ConfigServidor>('/expert/configuracion', { method: 'PUT', body: JSON.stringify(config) }),
  estadisticasCups: () => llamar<EstadisticasCups>('/cups/estadisticas'),
  estadisticasVectorizacion: () => llamar<EstadisticasVectorizacion>('/cups/estadisticas-vectorizacion'),
  buscarSemantica: (consulta: string) =>
    llamar<{ consulta: string; total: number; resultados: ResultadoBusquedaServidor[] }>('/cups/buscar-semantica', {
      method: 'POST',
      body: JSON.stringify({ consulta, limite: 10, umbralSimilaridad: 0.7 }),
    }),
};
