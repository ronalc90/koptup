import { ApiError, auditoriaAPI } from '../api';
import type { Factura, Glosa } from '../tipos-auditoria';
import { resumirRevision, type ResumenRevision } from './revision';

/**
 * Carga todas las facturas del espacio compartido con el estado de su revisión.
 *
 * El listado del backend no trae las glosas, y el estado de la revisión depende
 * de ellas (ver `revision.ts`), así que se pide el detalle de cada factura. Para
 * no repetir peticiones (el servidor limita cuántas hace cada cuenta), las
 * glosas de cada factura se recuerdan mientras la factura no cambie
 * (`updatedAt` cambia cada vez que alguien decide una glosa): en memoria y en
 * el almacenamiento local del navegador, así que recargar la página no vuelve
 * a pedir el detalle de las facturas que no cambiaron.
 */

/** Tope de facturas que carga la demo (el espacio de demo es pequeño). */
export const MAX_FACTURAS = 500;
const POR_PAGINA_API = 100;
const CONCURRENCIA = 6;

export interface FacturaRevisada {
  factura: Factura;
  glosas: Glosa[];
  revision: ResumenRevision;
}

export interface Espacio {
  facturas: FacturaRevisada[];
  /** Total de facturas en el servidor (puede ser mayor que las cargadas si supera MAX_FACTURAS). */
  total: number;
}

const CLAVE_ALMACEN = 'koptup-demo-cuentas-medicas:glosas';

type Recuerdo = { marca: string; glosas: Glosa[] };
let memoria: Map<string, Recuerdo> | null = null;

/** Memoria de glosas por factura (se lee del navegador la primera vez). */
function recuerdos(): Map<string, Recuerdo> {
  if (memoria) return memoria;
  memoria = new Map();
  try {
    const crudo = window.localStorage.getItem(CLAVE_ALMACEN);
    const datos = crudo ? (JSON.parse(crudo) as Record<string, Recuerdo>) : {};
    Object.entries(datos).forEach(([id, r]) => {
      if (r && typeof r.marca === 'string' && Array.isArray(r.glosas)) memoria!.set(id, r);
    });
  } catch {
    // almacenamiento no disponible o dañado: se empieza sin memoria
  }
  return memoria;
}

function guardarRecuerdos() {
  try {
    window.localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(Object.fromEntries(recuerdos())));
  } catch {
    // almacenamiento lleno o bloqueado: la memoria sigue en esta pestaña
  }
}

function marcaDe(factura: Factura): string {
  return `${factura.updatedAt ?? ''}|${factura.totalGlosas}|${factura.valorAceptado}`;
}

async function enParalelo<T, R>(items: T[], limite: number, tarea: (item: T) => Promise<R>): Promise<R[]> {
  const resultados: R[] = new Array(items.length);
  let siguiente = 0;
  const trabajador = async () => {
    while (siguiente < items.length) {
      const i = siguiente++;
      resultados[i] = await tarea(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limite, items.length) }, trabajador));
  return resultados;
}

export async function cargarEspacio(): Promise<Espacio> {
  const facturas: Factura[] = [];
  let total = 0;
  for (let pagina = 1; facturas.length < MAX_FACTURAS; pagina++) {
    const res = await auditoriaAPI.obtenerFacturas({ estado: '', desde: '', hasta: '' }, pagina, POR_PAGINA_API);
    total = res.total;
    facturas.push(...res.facturas);
    if (res.facturas.length < POR_PAGINA_API || facturas.length >= total) break;
  }
  const lista = facturas.slice(0, MAX_FACTURAS);

  // Olvida las facturas que ya no existen.
  const mem = recuerdos();
  const vigentes = new Set(lista.map((f) => f._id));
  Array.from(mem.keys()).forEach((id) => {
    if (!vigentes.has(id)) mem.delete(id);
  });

  const revisadas = await enParalelo(lista, CONCURRENCIA, async (factura): Promise<FacturaRevisada | null> => {
    const marca = marcaDe(factura);
    let glosas = mem.get(factura._id)?.marca === marca ? mem.get(factura._id)!.glosas : null;
    if (!glosas) {
      try {
        glosas = (await auditoriaAPI.obtenerFactura(factura._id)).glosas ?? [];
      } catch (e) {
        // La eliminaron entre el listado y el detalle.
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
      mem.set(factura._id, { marca, glosas });
    }
    return { factura, glosas, revision: resumirRevision(factura, glosas) };
  });
  guardarRecuerdos();

  return { facturas: revisadas.filter((f): f is FacturaRevisada => f !== null), total };
}

/** Actualiza la memoria con un detalle recién leído (evita pedirlo otra vez al volver a la lista). */
export function recordarDetalle(factura: Factura, glosas: Glosa[]) {
  recuerdos().set(factura._id, { marca: marcaDe(factura), glosas });
  guardarRecuerdos();
}
