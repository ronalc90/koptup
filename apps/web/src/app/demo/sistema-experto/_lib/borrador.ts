/**
 * Borrador de reglas en este navegador (localStorage).
 *
 * Lo que la persona edita en la pestaña Reglas se conserva al recargar hasta
 * que lo guarda en el servidor o lo descarta. Solo es una comodidad: si el
 * almacenamiento no está disponible (modo privado, bloqueado), la demo
 * funciona igual y el borrador vive mientras la página esté abierta.
 */

import { CODIGOS_REGLAS, type ConfigMotor } from './motor';
import { MANUALES, type ManualTarifario } from './datos-ejemplo';

export const CLAVE_BORRADOR = 'koptup:demo-sistema-experto:borrador:v1';

/**
 * Convierte un valor cualquiera (configuración del servidor o lo guardado en
 * el navegador) en una configuración válida del motor de la demo, o null.
 */
export function normalizarConfig(valor: unknown): ConfigMotor | null {
  if (!valor || typeof valor !== 'object') return null;
  const v = valor as Record<string, unknown>;
  const tolerancia = Number(v.toleranciaDiferenciaTarifa);
  if (!Number.isFinite(tolerancia)) return null;
  const manual = MANUALES.includes(v.manualPorDefecto as ManualTarifario)
    ? (v.manualPorDefecto as ManualTarifario)
    : 'ISS2004';
  const reglas = Array.isArray(v.reglasHabilitadas)
    ? CODIGOS_REGLAS.filter((c) => (v.reglasHabilitadas as unknown[]).includes(c))
    : [...CODIGOS_REGLAS];
  return {
    toleranciaDiferenciaTarifa: Math.min(20, Math.max(0, Math.round(tolerancia))),
    manualPorDefecto: manual,
    reglasHabilitadas: reglas,
  };
}

export function leerBorrador(): ConfigMotor | null {
  try {
    const raw = window.localStorage.getItem(CLAVE_BORRADOR);
    return raw ? normalizarConfig(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Guarda el borrador, o lo borra con `null`. */
export function escribirBorrador(config: ConfigMotor | null): void {
  try {
    if (config) window.localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(config));
    else window.localStorage.removeItem(CLAVE_BORRADOR);
  } catch {
    /* almacenamiento no disponible: el borrador vive solo en memoria */
  }
}
