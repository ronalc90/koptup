import ExcelJS from 'exceljs';
import { ExcelExpertService } from '../excel-expert.service';
import type { ResultadoSistemaExperto } from '../../types/expert-system.types';

function resultadoDeEjemplo(): ResultadoSistemaExperto {
  return {
    metadata: {
      fechaProcesamiento: new Date('2026-10-08T12:00:00Z'),
      tiempoMs: 120,
      version: '1.0.0',
      itemsValidados: 2,
      itemsConGlosas: 1,
      advertencias: [],
    },
    hoja1_radicacion: {
      nroRadicacion: 'RAD-001',
      fechaRadicacion: new Date('2026-10-01T12:00:00Z'),
      tipoCuenta: 'Servicios',
      auditoriaEnfermeria: 'Auditoría',
      regimen: 'Contributivo',
      producto: 'PBS',
      convenio: 'GENERAL',
      ips: 'IPS de ejemplo',
      nroFactura: 'FAC-10',
      fechaFactura: new Date('2026-09-30T12:00:00Z'),
      nroAtenciones: 1,
      valorBrutoFactura: 150000,
      valorIVA: 0,
      valorNetoFactura: 150000,
      observacionFactura: '',
      estadoFactura: 'LIQ',
      regional: 'Centro',
      tipoDocumentoIPS: 'NIT',
    },
    hoja2_detalles: [],
    hoja3_atenciones: [],
    hoja4_procedimientos: [
      {
        nroRadicacion: 'RAD-001',
        nroAtencion: 'AT-1',
        codigoManual: 'ISS2004',
        codigoProcedimiento: '890201',
        nombreProcedimiento: 'Consulta',
        cantidad: 1,
        valorIPS: 150000,
        valorEPS: 120000,
        valorAPagar: 120000,
        valorNotaCredito: 0,
        glosas: true,
        valorGlosaAdmisiva: 0,
        valorGlosaAuditoria: 30000,
        estado: 'GLOS',
        tipoLiquidacion: 'UNIL',
        valorContratadoEPS: 120000,
      },
    ],
    hoja5_glosas: [
      {
        codigoDevolucion: '202',
        cantidadGlosada: 1,
        vrUnitGlosado: 30000,
        valorTotalDevolucion: 30000,
        observacionesGlosa: 'Valor superior al contratado',
        origen: 'Auditoría',
        valorGlosaFinal: 30000,
      },
    ],
    resumen: {
      totalFacturado: 150000,
      totalGlosado: 30000,
      totalAPagar: 120000,
      cantidadGlosas: 1,
      glosasPorTipo: { '202': 1 },
    },
  };
}

describe('ExcelExpertService (ExcelJS)', () => {
  it('genera un .xlsx válido con las 6 hojas, los datos y el formato de moneda', async () => {
    const buffer = await new ExcelExpertService().generarExcelCompleto(resultadoDeEjemplo());

    expect(Buffer.isBuffer(buffer)).toBe(true);
    // Un .xlsx es un ZIP: empieza con "PK".
    expect(buffer.subarray(0, 2).toString('latin1')).toBe('PK');

    const libro = new ExcelJS.Workbook();
    // Los tipos de ExcelJS declaran su propio `Buffer` (ArrayBuffer); en Node acepta el Buffer real.
    await libro.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    expect(libro.worksheets.map((h) => h.name)).toEqual([
      '1. Radicación',
      '2. Detalle Factura',
      '3. Atenciones',
      '4. Procedimientos',
      '5. Glosas',
      'Resumen Ejecutivo',
    ]);

    const radicacion = libro.getWorksheet('1. Radicación')!;
    expect(radicacion.getCell('A1').value).toBe('Nro Radicación');
    expect(radicacion.getCell('A2').value).toBe('RAD-001');
    expect(radicacion.getCell('B2').value).toBe('2026-10-01');

    const procedimientos = libro.getWorksheet('4. Procedimientos')!;
    // Columna H (índice 7) = Valor IPS, con formato de moneda; el encabezado no.
    expect(procedimientos.getCell('H2').value).toBe(150000);
    expect(procedimientos.getCell('H2').numFmt).toBe('$#,##0.00');
    expect(procedimientos.getCell('H1').numFmt).toBeUndefined();
    expect(procedimientos.getCell('M2').value).toBe('SÍ');

    const glosas = libro.getWorksheet('5. Glosas')!;
    expect(glosas.getCell('G2').value).toBe(30000);
    expect(glosas.getCell('G2').numFmt).toBe('$#,##0.00');

    const resumen = libro.getWorksheet('Resumen Ejecutivo')!;
    expect(resumen.getCell('A13').value).toBe('Total Facturado:');
    expect(resumen.getCell('B13').value).toBe(150000);
    expect(resumen.getCell('B13').numFmt).toBe('$#,##0.00');
    expect(resumen.getCell('B14').value).toBe(30000);
    expect(resumen.getCell('B15').value).toBe(120000);
    expect(resumen.getCell('B16').value).toBe('20.00%');
    expect(resumen.getCell('A20').value).toBe('202');
    expect(resumen.getCell('B20').value).toBe(1);
  });
});
