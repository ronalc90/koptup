import ExcelJS from 'exceljs';
import Factura from '../models/Factura';
import Atencion from '../models/Atencion';
import Procedimiento from '../models/Procedimiento';
import Glosa from '../models/Glosa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

class ExcelAuditoriaService {
  /**
   * Genera Excel completo de auditoría
   */
  async generarExcelAuditoria(facturaId: string): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    // Obtener datos
    const factura = await Factura.findById(facturaId).populate('atenciones');
    if (!factura) {
      throw new Error('Factura no encontrada');
    }

    const atenciones = await Atencion.find({ facturaId }).populate('procedimientos soportes');
    const procedimientos = await Procedimiento.find({ facturaId }).populate('glosas');
    const glosas = await Glosa.find({ facturaId });

    // 1. Hoja de resumen
    await this.crearHojaResumen(workbook, factura, glosas);

    // 2. Hoja de atenciones
    await this.crearHojaAtenciones(workbook, atenciones);

    // 3. Hoja de procedimientos
    await this.crearHojaProcedimientos(workbook, procedimientos);

    // 4. Hoja de glosas
    await this.crearHojaGlosas(workbook, glosas);

    // 5. Hoja de estadísticas
    await this.crearHojaEstadisticas(workbook, factura, procedimientos, glosas);

    return workbook;
  }

  /**
   * Hoja 1: Resumen de Factura
   */
  private async crearHojaResumen(workbook: ExcelJS.Workbook, factura: any, glosas: any[]) {
    const sheet = workbook.addWorksheet('Resumen');

    // Configurar ancho de columnas
    sheet.columns = [
      { width: 30 },
      { width: 40 },
    ];

    // Título
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'AUDITORÍA DE CUENTA MÉDICA';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    titleCell.font.color = { argb: 'FFFFFFFF' };

    sheet.getRow(1).height = 30;

    // Información de la factura
    let row = 3;
    this.addLabelValue(sheet, row++, 'Número de Factura:', factura.numeroFactura);
    this.addLabelValue(
      sheet,
      row++,
      'Fecha de Emisión:',
      this.formatearFecha(factura.fechaEmision)
    );
    this.addLabelValue(
      sheet,
      row++,
      'Fecha de Radicación:',
      factura.fechaRadicacion ? this.formatearFecha(factura.fechaRadicacion) : 'N/A'
    );

    row++;
    this.addLabelValue(sheet, row++, 'IPS:', `${factura.ips.nombre} (NIT: ${factura.ips.nit})`);
    this.addLabelValue(sheet, row++, 'EPS:', `${factura.eps.nombre} (NIT: ${factura.eps.nit})`);
    this.addLabelValue(sheet, row++, 'Régimen:', factura.regimen);
    this.addLabelValue(sheet, row++, 'Contrato:', factura.numeroContrato || 'N/A');

    row++;
    // Valores
    this.addLabelValue(
      sheet,
      row++,
      'Valor Bruto:',
      this.formatearMoneda(factura.valorBruto),
      true
    );
    this.addLabelValue(sheet, row++, 'IVA:', this.formatearMoneda(factura.iva), true);
    this.addLabelValue(
      sheet,
      row++,
      'Valor Total Factura:',
      this.formatearMoneda(factura.valorTotal),
      true
    );

    row++;
    this.addLabelValue(
      sheet,
      row++,
      'Total Glosas:',
      this.formatearMoneda(factura.totalGlosas),
      true,
      'FFFF0000'
    );
    this.addLabelValue(
      sheet,
      row++,
      'Valor Aceptado:',
      this.formatearMoneda(factura.valorAceptado),
      true,
      'FF00B050'
    );

    row++;
    this.addLabelValue(sheet, row++, 'Estado:', factura.estado);
    this.addLabelValue(
      sheet,
      row++,
      'Fecha Auditoría:',
      factura.fechaAuditoria ? this.formatearFecha(factura.fechaAuditoria) : 'N/A'
    );
    this.addLabelValue(sheet, row++, 'Número de Glosas:', glosas.length.toString());
  }

  /**
   * Hoja 2: Atenciones
   */
  private async crearHojaAtenciones(workbook: ExcelJS.Workbook, atenciones: any[]) {
    const sheet = workbook.addWorksheet('Atenciones');

    // Encabezados
    const headers = [
      'N° Atención',
      'N° Autorización',
      'Paciente',
      'Diagnóstico Principal',
      'Fecha Inicio',
      'Fecha Fin',
      'Copago',
      'Cuota Moderadora',
      'Tiene Autorización',
      'Autorización Válida',
    ];

    const headerRow = sheet.addRow(headers);
    this.aplicarEstiloEncabezado(headerRow);

    // Datos
    for (const atencion of atenciones) {
      sheet.addRow([
        atencion.numeroAtencion,
        atencion.numeroAutorizacion || 'N/A',
        `${atencion.paciente.tipoDocumento} ${atencion.paciente.numeroDocumento}`,
        `${atencion.diagnosticoPrincipal.codigoCIE10} - ${atencion.diagnosticoPrincipal.descripcion}`,
        this.formatearFecha(atencion.fechaInicio),
        atencion.fechaFin ? this.formatearFecha(atencion.fechaFin) : 'N/A',
        atencion.copago,
        atencion.cuotaModeradora,
        atencion.tieneAutorizacion ? 'SÍ' : 'NO',
        atencion.autorizacionValida ? 'SÍ' : 'NO',
      ]);
    }

    // Autoajustar columnas
    sheet.columns.forEach((column) => {
      column.width = 15;
    });
    sheet.getColumn(4).width = 40;
  }

  /**
   * Hoja 3: Procedimientos
   */
  private async crearHojaProcedimientos(workbook: ExcelJS.Workbook, procedimientos: any[]) {
    const sheet = workbook.addWorksheet('Procedimientos');

    // Encabezados
    const headers = [
      'N° Atención',
      'Código CUPS',
      'Descripción',
      'Cantidad',
      'Valor Unit. IPS',
      'Valor Total IPS',
      'Valor Unit. Contrato',
      'Valor Total Contrato',
      'Diferencia',
      'Total Glosas',
      'Valor a Pagar',
      'Duplicado',
      'Validado',
    ];

    const headerRow = sheet.addRow(headers);
    this.aplicarEstiloEncabezado(headerRow);

    // Datos
    for (const proc of procedimientos) {
      const row = sheet.addRow([
        proc.atencionId?.numeroAtencion || 'N/A',
        proc.codigoCUPS,
        proc.descripcion,
        proc.cantidad,
        proc.valorUnitarioIPS,
        proc.valorTotalIPS,
        proc.valorUnitarioContrato,
        proc.valorTotalContrato,
        proc.diferenciaTarifa,
        proc.totalGlosas,
        proc.valorAPagar,
        proc.duplicado ? 'SÍ' : 'NO',
        proc.tarifaValidada ? 'SÍ' : 'NO',
      ]);

      // Colorear diferencias
      if (proc.diferenciaTarifa > 0) {
        row.getCell(9).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEB9C' },
        };
      }

      // Colorear duplicados
      if (proc.duplicado) {
        row.getCell(12).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF0000' },
        };
        row.getCell(12).font = { color: { argb: 'FFFFFFFF' }, bold: true };
      }
    }

    // Formato moneda
    for (let i = 5; i <= 11; i++) {
      sheet.getColumn(i).numFmt = '"$"#,##0';
    }

    // Autoajustar columnas
    sheet.columns.forEach((column, index) => {
      if (index === 2) {
        column.width = 40; // Descripción
      } else {
        column.width = 15;
      }
    });
  }

  /**
   * Hoja 4: Glosas
   */
  private async crearHojaGlosas(workbook: ExcelJS.Workbook, glosas: any[]) {
    const sheet = workbook.addWorksheet('Glosas');

    // Encabezados
    const headers = [
      'Código',
      'Tipo',
      'Descripción',
      'Valor Glosado',
      'Estado',
      'Generada Automáticamente',
      'Fecha',
      'Observaciones',
    ];

    const headerRow = sheet.addRow(headers);
    this.aplicarEstiloEncabezado(headerRow);

    // Datos
    for (const glosa of glosas) {
      sheet.addRow([
        glosa.codigo,
        glosa.tipo,
        glosa.descripcion,
        glosa.valorGlosado,
        glosa.estado,
        glosa.generadaAutomaticamente ? 'SÍ' : 'NO',
        this.formatearFecha(glosa.fechaGeneracion),
        glosa.observaciones || '',
      ]);
    }

    // Formato moneda
    sheet.getColumn(4).numFmt = '"$"#,##0';

    // Autoajustar columnas
    sheet.columns.forEach((column, index) => {
      if (index === 2 || index === 7) {
        column.width = 40;
      } else {
        column.width = 15;
      }
    });

    // Totales
    const totalRow = sheet.addRow([
      '',
      '',
      'TOTAL GLOSAS:',
      { formula: `SUM(D2:D${sheet.rowCount})` },
      '',
      '',
      '',
      '',
    ]);
    this.aplicarEstiloTotal(totalRow);
  }

  /**
   * Hoja 5: Estadísticas
   */
  private async crearHojaEstadisticas(
    workbook: ExcelJS.Workbook,
    factura: any,
    procedimientos: any[],
    glosas: any[]
  ) {
    const sheet = workbook.addWorksheet('Estadísticas');

    sheet.columns = [{ width: 30 }, { width: 20 }];

    // Título
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'ESTADÍSTICAS DE AUDITORÍA';
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    titleCell.font.color = { argb: 'FFFFFFFF' };

    let row = 3;

    // Estadísticas generales
    this.addLabelValue(sheet, row++, 'Total Procedimientos:', procedimientos.length.toString());
    this.addLabelValue(
      sheet,
      row++,
      'Procedimientos Duplicados:',
      procedimientos.filter((p) => p.duplicado).length.toString()
    );
    this.addLabelValue(
      sheet,
      row++,
      'Procedimientos Validados:',
      procedimientos.filter((p) => p.tarifaValidada).length.toString()
    );

    row++;
    this.addLabelValue(sheet, row++, 'Total Glosas:', glosas.length.toString());

    // Glosas por tipo
    const glosasPorTipo: Record<string, number> = {};
    glosas.forEach((g) => {
      glosasPorTipo[g.tipo] = (glosasPorTipo[g.tipo] || 0) + 1;
    });

    row++;
    sheet.getCell(`A${row}`).value = 'Glosas por Tipo:';
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    for (const [tipo, cantidad] of Object.entries(glosasPorTipo)) {
      this.addLabelValue(sheet, row++, `  ${tipo}:`, cantidad.toString());
    }

    // Valores por tipo
    const valoresPorTipo: Record<string, number> = {};
    glosas.forEach((g) => {
      valoresPorTipo[g.tipo] = (valoresPorTipo[g.tipo] || 0) + g.valorGlosado;
    });

    row++;
    sheet.getCell(`A${row}`).value = 'Valor Glosas por Tipo:';
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    for (const [tipo, valor] of Object.entries(valoresPorTipo)) {
      this.addLabelValue(sheet, row++, `  ${tipo}:`, this.formatearMoneda(valor), true);
    }

    // Porcentaje de glosas
    row++;
    const porcentajeGlosas = ((factura.totalGlosas / factura.valorTotal) * 100).toFixed(2);
    this.addLabelValue(
      sheet,
      row++,
      'Porcentaje de Glosas:',
      `${porcentajeGlosas}%`,
      true,
      'FFFF0000'
    );
  }

  /**
   * Utilidades
   */
  private addLabelValue(
    sheet: ExcelJS.Worksheet,
    row: number,
    label: string,
    value: string,
    isMoney: boolean = false,
    colorFondo?: string
  ) {
    const labelCell = sheet.getCell(`A${row}`);
    const valueCell = sheet.getCell(`B${row}`);

    labelCell.value = label;
    labelCell.font = { bold: true };

    valueCell.value = value;

    if (isMoney) {
      valueCell.numFmt = '"$"#,##0';
    }

    if (colorFondo) {
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorFondo },
      };
      valueCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }
  }

  private aplicarEstiloEncabezado(row: ExcelJS.Row) {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
    row.height = 20;
  }

  private aplicarEstiloTotal(row: ExcelJS.Row) {
    row.font = { bold: true };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };
  }

  private formatearFecha(fecha: Date): string {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es });
  }

  private formatearMoneda(valor: number): string {
    return `$${valor.toLocaleString('es-CO')}`;
  }

  /**
   * Guarda el Excel en un archivo
   */
  async guardarExcel(workbook: ExcelJS.Workbook, rutaArchivo: string): Promise<void> {
    await workbook.xlsx.writeFile(rutaArchivo);
  }

  /**
   * Retorna el Excel como buffer para descarga
   */
  async obtenerBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    return await workbook.xlsx.writeBuffer() as Buffer;
  }
}

export default new ExcelAuditoriaService();
