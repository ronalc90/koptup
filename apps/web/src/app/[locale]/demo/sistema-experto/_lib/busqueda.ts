/**
 * Búsqueda por texto en el catálogo de ejemplo (en el navegador, sin IA):
 * compara las palabras de la consulta con la descripción, la traducción y
 * los sinónimos de cada código, sin tildes ni mayúsculas.
 */

import { CATALOGO_EJEMPLO, type CodigoCatalogo } from './datos-ejemplo';

const VACIAS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'por', 'para', 'con', 'en', 'y', 'o', 'u', 'a', 'al', 'un', 'una', 'se',
  'the', 'of', 'for', 'and', 'with', 'in', 'to', 'an', 'by', 'on',
]);

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function palabras(texto: string): string[] {
  return normalizar(texto)
    .split(/\s+/)
    .filter((p) => p.length > 1 && !VACIAS.has(p));
}

function coincide(termino: string, palabra: string): boolean {
  if (termino === palabra) return true;
  if (termino.length >= 4 && palabra.startsWith(termino)) return true;
  if (palabra.length >= 4 && termino.startsWith(palabra)) return true;
  return false;
}

export interface ResultadoLocal {
  item: CodigoCatalogo;
  puntaje: number;
  /** Palabras de la consulta (como las escribió la persona) que encontraron el código. */
  coincidencias: string[];
}

export function buscarEnCatalogo(consulta: string, catalogo: CodigoCatalogo[] = CATALOGO_EJEMPLO): ResultadoLocal[] {
  const originales = consulta
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((original) => ({ original: original.replace(/[.,;:¿?¡!()"]/g, ''), normal: palabras(original)[0] }))
    .filter((p): p is { original: string; normal: string } => Boolean(p.normal));

  if (originales.length === 0) return [];

  const resultados: ResultadoLocal[] = [];
  for (const item of catalogo) {
    const vocabulario = new Set([
      ...palabras(item.descripcion),
      ...palabras(item.descripcionEn),
      ...item.sinonimos.flatMap(palabras),
    ]);
    const coincidencias: string[] = [];
    let enDescripcion = 0;
    const deDescripcion = new Set(palabras(item.descripcion));

    for (const { original, normal } of originales) {
      const porCodigo = /^\d+$/.test(normal) && normal.length >= 3 && item.codigo.startsWith(normal);
      const porTexto = Array.from(vocabulario).some((p) => coincide(normal, p));
      if (porCodigo || porTexto) {
        coincidencias.push(original);
        if (porCodigo || Array.from(deDescripcion).some((p) => coincide(normal, p))) enDescripcion += 1;
      }
    }

    const puntaje = coincidencias.length / originales.length;
    if (coincidencias.length > 0 && puntaje >= 0.5) {
      // Desempate: más palabras en la descripción oficial y descripciones más cortas primero.
      resultados.push({
        item,
        puntaje: puntaje + enDescripcion * 0.01 - item.descripcion.length * 0.00001,
        coincidencias,
      });
    }
  }

  return resultados.sort((a, b) => b.puntaje - a.puntaje).slice(0, 10);
}
