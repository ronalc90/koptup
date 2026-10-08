/**
 * Memoria local (solo en este navegador) de cómo se leyó cada factura que
 * auditaste aquí: el backend lo informa al procesar el PDF pero no lo guarda.
 * Es una comodidad: si no está, el detalle simplemente no lo muestra.
 */
const CLAVE = 'koptup-demo-cuentas-medicas:lecturas';

export interface LecturaGuardada {
  metodo: string;
  procedimientos: number;
  archivos: number;
}

function leerTodo(): Record<string, LecturaGuardada> {
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as Record<string, LecturaGuardada>) : {};
  } catch {
    return {};
  }
}

export function guardarLectura(facturaId: string, lectura: LecturaGuardada) {
  try {
    const todo = leerTodo();
    todo[facturaId] = lectura;
    // Conserva solo las 50 más recientes.
    const claves = Object.keys(todo);
    claves.slice(0, Math.max(0, claves.length - 50)).forEach((k) => delete todo[k]);
    window.localStorage.setItem(CLAVE, JSON.stringify(todo));
  } catch {
    // almacenamiento no disponible: no pasa nada
  }
}

export function leerLectura(facturaId: string): LecturaGuardada | null {
  return leerTodo()[facturaId] ?? null;
}
