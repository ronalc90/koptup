/**
 * Lectura de hojas de cálculo .xlsx con ExcelJS.
 *
 * Reemplaza a `xlsx` (SheetJS), que en npm no tiene corrección para sus avisos
 * de seguridad (prototype pollution y ReDoS). Reproduce lo que usaban los
 * importadores con `XLSX.utils.sheet_to_json(hoja)`:
 *  - la primera fila con datos es el encabezado y da las claves de cada objeto;
 *  - las celdas vacías no generan clave y las filas vacías se omiten;
 *  - un encabezado repetido recibe sufijo (`codigo`, `codigo_1`, ...);
 *  - las fórmulas devuelven su último resultado calculado.
 *
 * Diferencias con SheetJS: solo lee .xlsx (no el formato binario .xls ni .ods)
 * y las fechas llegan como `Date` en vez de número de serie de Excel. Ningún
 * importador actual usa columnas de fecha.
 */
import path from 'path';
import ExcelJS from 'exceljs';

export type FilaHoja = Record<string, unknown>;

export interface HojaLeida {
  /** Nombre de la hoja leída. */
  nombreHoja: string;
  /** Una entrada por fila de datos, con las claves del encabezado. */
  filas: FilaHoja[];
}

export class ExcelReaderError extends Error {}

/** Convierte el valor de una celda de ExcelJS en un valor plano. */
export function valorPlanoDeCelda(valor: ExcelJS.CellValue | undefined): unknown {
  if (valor === null || valor === undefined) return undefined;
  if (valor instanceof Date) return valor;
  if (typeof valor !== 'object') return valor;

  if ('richText' in valor && Array.isArray(valor.richText)) {
    return valor.richText.map((parte) => parte.text).join('');
  }
  if ('formula' in valor || 'sharedFormula' in valor) {
    return valorPlanoDeCelda((valor as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue);
  }
  if ('hyperlink' in valor && 'text' in valor) {
    const texto = (valor as ExcelJS.CellHyperlinkValue).text;
    return typeof texto === 'string' ? texto : valorPlanoDeCelda(texto as ExcelJS.CellValue);
  }
  if ('error' in valor) return undefined;
  return undefined;
}

function esVacio(valor: unknown): boolean {
  return valor === undefined || (typeof valor === 'string' && valor.trim() === '');
}

/** Pasa una hoja de ExcelJS a objetos con las claves de la primera fila. */
export function hojaComoObjetos(hoja: ExcelJS.Worksheet): FilaHoja[] {
  let encabezados: Array<string | undefined> | null = null;
  const filas: FilaHoja[] = [];

  hoja.eachRow({ includeEmpty: false }, (fila) => {
    const valores = fila.values as ExcelJS.CellValue[];

    if (!encabezados) {
      const usados = new Map<string, number>();
      encabezados = valores.map((valor) => {
        const plano = valorPlanoDeCelda(valor);
        if (esVacio(plano)) return undefined;
        const base = plano instanceof Date ? plano.toISOString() : String(plano);
        const veces = usados.get(base) ?? 0;
        usados.set(base, veces + 1);
        return veces === 0 ? base : `${base}_${veces}`;
      });
      return;
    }

    const objeto: FilaHoja = {};
    let tieneDatos = false;
    encabezados.forEach((clave, columna) => {
      if (!clave) return;
      const plano = valorPlanoDeCelda(valores[columna]);
      if (esVacio(plano)) return;
      objeto[clave] = plano;
      tieneDatos = true;
    });
    if (tieneDatos) filas.push(objeto);
  });

  return filas;
}

/**
 * Lee una hoja de un archivo .xlsx. Sin `nombreHoja` usa la primera hoja del
 * libro (el mismo orden que `workbook.SheetNames[0]` de SheetJS).
 */
export async function leerHojaComoObjetos(rutaArchivo: string, nombreHoja?: string): Promise<HojaLeida> {
  const extension = path.extname(rutaArchivo).toLowerCase();
  if (extension !== '.xlsx') {
    throw new ExcelReaderError(
      `Formato no soportado (${extension || 'sin extensión'}): solo se leen archivos .xlsx. ` +
        'Guarda el archivo como "Libro de Excel (.xlsx)" o expórtalo a CSV.'
    );
  }

  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(rutaArchivo);

  const hoja = nombreHoja ? libro.getWorksheet(nombreHoja) : libro.worksheets[0];
  if (!hoja) {
    throw new ExcelReaderError(
      nombreHoja ? `La hoja "${nombreHoja}" no existe en el archivo` : 'El archivo no tiene hojas'
    );
  }

  return { nombreHoja: hoja.name, filas: hojaComoObjetos(hoja) };
}
