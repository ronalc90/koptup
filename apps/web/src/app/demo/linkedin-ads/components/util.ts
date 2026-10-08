/**
 * Utilidades del navegador para la demo: almacenamiento local tolerante a
 * fallos, portapapeles y descargas.
 */

export const LS_BORRADORES = 'koptup-linkedin-ads-borradores-v1';
export const LS_INICIO_CALENDARIO = 'koptup-linkedin-ads-inicio-v1';
export const LS_UTM = 'koptup-linkedin-ads-utm-v1';

export function leerLS<T>(clave: string, porDefecto: T): T {
  try {
    const raw = window.localStorage.getItem(clave);
    return raw === null ? porDefecto : (JSON.parse(raw) as T);
  } catch {
    return porDefecto;
  }
}

export function escribirLS(clave: string, valor: unknown): void {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Modo privado o almacenamiento lleno: la demo sigue funcionando sin guardar.
  }
}

/** Copia al portapapeles; devuelve false si el navegador lo impide. */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // sigue con el método alterno
  }
  try {
    const area = document.createElement('textarea');
    area.value = texto;
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

export function descargarUrl(url: string, nombre: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function descargarTexto(contenido: string, nombre: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  descargarUrl(url, nombre);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV con BOM (para que Excel respete tildes) y comillas escapadas. */
export function aCsv(filas: (string | number)[][]): string {
  const celda = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + filas.map((f) => f.map(celda).join(',')).join('\r\n');
}
