import fs from 'fs';
import os from 'os';
import path from 'path';
import ExcelJS from 'exceljs';
import { ExcelReaderError, leerHojaComoObjetos, valorPlanoDeCelda } from '../excel-reader';

describe('excel-reader (ExcelJS en lugar de xlsx)', () => {
  let dir: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'excel-reader-'));
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  async function crearLibro(nombre: string, construir: (libro: ExcelJS.Workbook) => void): Promise<string> {
    const libro = new ExcelJS.Workbook();
    construir(libro);
    const ruta = path.join(dir, nombre);
    await libro.xlsx.writeFile(ruta);
    return ruta;
  }

  it('usa la primera fila como encabezado y omite celdas y filas vacías (como sheet_to_json)', async () => {
    const ruta = await crearLibro('cups.xlsx', (libro) => {
      const hoja = libro.addWorksheet('CUPS');
      hoja.addRow(['codigo', 'descripcion', 'tarifaSOAT', 'codigo']);
      hoja.addRow(['890201', 'Consulta de primera vez por medicina general', 35000, 'dup']);
      hoja.addRow([]);
      hoja.addRow(['890301', 'Consulta de control', null, '']);
    });

    const { nombreHoja, filas } = await leerHojaComoObjetos(ruta);

    expect(nombreHoja).toBe('CUPS');
    expect(filas).toEqual([
      {
        codigo: '890201',
        descripcion: 'Consulta de primera vez por medicina general',
        tarifaSOAT: 35000,
        codigo_1: 'dup',
      },
      { codigo: '890301', descripcion: 'Consulta de control' },
    ]);
  });

  it('lee la hoja pedida por nombre y devuelve el resultado de las fórmulas', async () => {
    const ruta = await crearLibro('varias-hojas.xlsx', (libro) => {
      libro.addWorksheet('Primera').addRow(['x']);
      const hoja = libro.addWorksheet('Tarifas');
      hoja.addRow(['codigo', 'total']);
      hoja.addRow(['A1', { formula: '2*3', result: 6 }]);
      hoja.addRow([{ richText: [{ text: 'B' }, { text: '2' }] }, 7]);
    });

    const { filas } = await leerHojaComoObjetos(ruta, 'Tarifas');

    expect(filas).toEqual([
      { codigo: 'A1', total: 6 },
      { codigo: 'B2', total: 7 },
    ]);
  });

  it('rechaza formatos que ExcelJS no lee y hojas inexistentes con un mensaje claro', async () => {
    await expect(leerHojaComoObjetos(path.join(dir, 'viejo.xls'))).rejects.toBeInstanceOf(ExcelReaderError);

    const ruta = await crearLibro('una-hoja.xlsx', (libro) => {
      libro.addWorksheet('Datos').addRow(['codigo']);
    });
    await expect(leerHojaComoObjetos(ruta, 'NoExiste')).rejects.toThrow('La hoja "NoExiste" no existe');
  });

  it('aplana hipervínculos y errores', () => {
    expect(valorPlanoDeCelda({ text: 'Sitio', hyperlink: 'https://example.com' })).toBe('Sitio');
    expect(valorPlanoDeCelda({ error: '#N/A' } as ExcelJS.CellErrorValue)).toBeUndefined();
    expect(valorPlanoDeCelda(null)).toBeUndefined();
  });
});
