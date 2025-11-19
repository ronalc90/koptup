import ExcelJS from 'exceljs';
import { DatosFacturaPDF } from './pdf-extractor.service';
import { GlosaCalculada } from './glosa-calculator.service';

class ExcelFacturaMedicaService {
  /**
   * Genera un archivo Excel completo con 8 pestañas para auditoría de factura médica
   */
  async generarExcelCompleto(
    datosFactura: DatosFacturaPDF,
    glosas: GlosaCalculada[],
    valorAPagar: number,
    valorGlosaTotal: number
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'Sistema KopTup - Auditoría Médica';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Crear las 8 pestañas
    await this.crearPestanaFacturacion(workbook, datosFactura);
    await this.crearPestanaProcedimientos(workbook, datosFactura, valorAPagar);
    await this.crearPestanaGlosas(workbook, datosFactura, glosas);
    await this.crearPestanaAutorizaciones(workbook, datosFactura);
    await this.crearPestanaPaciente(workbook, datosFactura);
    await this.crearPestanaDiagnosticos(workbook, datosFactura);
    await this.crearPestanaFechas(workbook, datosFactura);
    await this.crearPestanaResumen(workbook, datosFactura, valorAPagar, valorGlosaTotal);

    return workbook;
  }

  /**
   * PESTAÑA 1: FACTURACION
   * Columnas 1-14: Datos de radicación/factura
   */
  private async crearPestanaFacturacion(workbook: ExcelJS.Workbook, datos: DatosFacturaPDF) {
    const sheet = workbook.addWorksheet('FACTURACION');

    // Encabezados
    sheet.columns = [
      { header: 'Nro_Radicacion', key: 'nroRadicacion', width: 15 },
      { header: 'Fecha_Radicacion', key: 'fechaRadicacion', width: 18 },
      { header: 'Nro_Factura', key: 'nroFactura', width: 15 },
      { header: 'Fecha_Factura', key: 'fechaFactura', width: 15 },
      { header: 'Valor_Bruto_Factura', key: 'valorBrutoFactura', width: 20 },
      { header: 'Valor_IVA', key: 'valorIVA', width: 15 },
      { header: 'Valor_Neto_Factura', key: 'valorNetoFactura', width: 20 },
      { header: 'Nro_Atenciones', key: 'nroAtenciones', width: 15 },
      { header: 'Prefijo_Factura', key: 'prefijoFactura', width: 15 },
      { header: 'Consecutivo_Factura', key: 'consecutivoFactura', width: 20 },
      { header: 'Tipo_Documento_IPS', key: 'tipoDocumentoIPS', width: 20 },
      { header: 'Regional', key: 'regional', width: 15 },
      { header: 'Estado_Factura', key: 'estadoFactura', width: 18 },
      { header: 'Observacion', key: 'observacion', width: 40 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    sheet.addRow({
      nroRadicacion: datos.nroRadicacion || '',
      fechaRadicacion: datos.fechaRadicacion || new Date().toLocaleDateString('es-CO'),
      nroFactura: datos.nroFactura,
      fechaFactura: datos.fechaFactura || new Date().toLocaleDateString('es-CO'),
      valorBrutoFactura: datos.valorBrutoFactura,
      valorIVA: datos.valorIVA,
      valorNetoFactura: datos.valorNetoFactura,
      nroAtenciones: datos.nroAtenciones,
      prefijoFactura: datos.prefijoFactura,
      consecutivoFactura: datos.consecutivoFactura,
      tipoDocumentoIPS: datos.tipoDocumentoIPS,
      regional: datos.regional || '',
      estadoFactura: datos.estadoFactura || 'EST',
      observacion: datos.observacion || 'Radicación exitosa',
    });

    // Formato de moneda para columnas de valores
    this.aplicarFormatoMoneda(sheet, 'E2:G2');
  }

  /**
   * PESTAÑA 2: PROCEDIMIENTOS
   * Columnas 15-36: Datos de cada servicio
   */
  private async crearPestanaProcedimientos(
    workbook: ExcelJS.Workbook,
    datos: DatosFacturaPDF,
    valorAPagar: number
  ) {
    const sheet = workbook.addWorksheet('PROCEDIMIENTOS');

    sheet.columns = [
      { header: 'Codigo_Procedimiento', key: 'codigoProcedimiento', width: 20 },
      { header: 'Nombre_Procedimiento', key: 'nombreProcedimiento', width: 50 },
      { header: 'Mapiss', key: 'mapiss', width: 12 },
      { header: 'Cant_Paragr', key: 'cantParagr', width: 12 },
      { header: 'Matric_uno', key: 'matricUno', width: 15 },
      { header: 'Matriz_de_liquidacion', key: 'matrizLiquidacion', width: 22 },
      { header: 'Valor_IPS', key: 'valorIPS', width: 15 },
      { header: 'Cant', key: 'cant', width: 10 },
      { header: 'Valor_a_Pagar', key: 'valorAPagar', width: 18 },
      { header: 'Valor_Nota_Credito', key: 'valorNotaCredito', width: 20 },
      { header: 'Gestion_Glosas', key: 'gestionGlosas', width: 18 },
      { header: 'Valor_Glosa_Admitiva', key: 'valorGlosaAdmitiva', width: 22 },
      { header: 'Valor_Glosa_Auditoria', key: 'valorGlosaAuditoria', width: 22 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Categoria', key: 'categoria', width: 15 },
      { header: 'Tipo_liquidacion', key: 'tipoLiquidacion', width: 18 },
      { header: 'Valor', key: 'valor', width: 15 },
      { header: 'Sub_servicio_Contratado', key: 'subServicioContratado', width: 25 },
      { header: 'UVR', key: 'uvr', width: 10 },
      { header: 'Regimen', key: 'regimen', width: 18 },
      { header: 'Convenio_PaC', key: 'convenioPaC', width: 18 },
      { header: 'Tipo_Documento_IPS_2', key: 'tipoDocumentoIPS2', width: 22 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF92D050' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Calcular valor de glosa admitiva
    const valorGlosaAdmitiva = datos.valorIPS - valorAPagar;

    // Agregar datos
    sheet.addRow({
      codigoProcedimiento: datos.codigoProcedimiento,
      nombreProcedimiento: datos.nombreProcedimiento,
      mapiss: datos.mapiss || '',
      cantParagr: datos.cantParagr || 1,
      matricUno: datos.matricUno || '',
      matrizLiquidacion: datos.matrizLiquidacion,
      valorIPS: datos.valorIPS,
      cant: datos.cant || 1,
      valorAPagar: valorAPagar,
      valorNotaCredito: datos.valorNotaCredito || 0,
      gestionGlosas: datos.gestionGlosas || '',
      valorGlosaAdmitiva: valorGlosaAdmitiva,
      valorGlosaAuditoria: datos.valorGlosaAuditoria || 0,
      estado: datos.estado || 'UNILA',
      categoria: datos.categoria || '',
      tipoLiquidacion: datos.tipoLiquidacion || '',
      valor: valorAPagar,
      subServicioContratado: datos.subServicioContratado || '',
      uvr: datos.uvr || 0,
      regimen: datos.regimen || 'CONTRIBUTIVO',
      convenioPaC: datos.convenioPaC || '',
      tipoDocumentoIPS2: datos.tipoDocumentoIPS2,
    });

    // Formato de moneda
    this.aplicarFormatoMoneda(sheet, 'G2:M2');
    this.aplicarFormatoMoneda(sheet, 'Q2:Q2');

    // Resaltar glosa si existe
    if (valorGlosaAdmitiva > 0) {
      sheet.getCell('L2').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6666' },
      };
      sheet.getCell('L2').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  }

  /**
   * PESTAÑA 3: GLOSAS
   * Columnas 37-46: Detalle de glosas
   */
  private async crearPestanaGlosas(
    workbook: ExcelJS.Workbook,
    datos: DatosFacturaPDF,
    glosas: GlosaCalculada[]
  ) {
    const sheet = workbook.addWorksheet('GLOSAS');

    sheet.columns = [
      { header: 'Codigo_Devolucion', key: 'codigoDevolucion', width: 20 },
      { header: 'Cant_Glosada', key: 'cantGlosada', width: 15 },
      { header: 'Vlr_unit_Glosado', key: 'vlrUnitGlosado', width: 18 },
      { header: 'Valor_devolucion', key: 'valorDevolucion', width: 18 },
      { header: 'Observaciones_Glosa', key: 'observacionesGlosa', width: 80 },
      { header: 'Origen', key: 'origen', width: 15 },
      { header: 'Usuario', key: 'usuario', width: 15 },
      { header: 'Codigo_Devolucion_Item', key: 'codigoDevolucionItem', width: 25 },
      { header: 'Total_Glosas', key: 'totalGlosas', width: 18 },
      { header: 'Diferencia', key: 'diferencia', width: 15 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF0000' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar glosas
    if (glosas.length > 0) {
      const totalGlosas = glosas.reduce((sum, g) => sum + g.valorTotalGlosa, 0);

      glosas.forEach((glosa) => {
        sheet.addRow({
          codigoDevolucion: glosa.codigo,
          cantGlosada: glosa.cantidad,
          vlrUnitGlosado: glosa.diferencia,
          valorDevolucion: glosa.valorTotalGlosa,
          observacionesGlosa: glosa.observacion,
          origen: 'SISTEMA',
          usuario: 'AUTO',
          codigoDevolucionItem: '0',
          totalGlosas: totalGlosas,
          diferencia: 0,
        });
      });

      // Formato de moneda
      const lastRow = sheet.lastRow?.number || 2;
      this.aplicarFormatoMoneda(sheet, `C2:D${lastRow}`);
      this.aplicarFormatoMoneda(sheet, `I2:J${lastRow}`);

      // Resaltar toda la fila en rojo claro
      for (let i = 2; i <= lastRow; i++) {
        sheet.getRow(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' },
        };
      }
    } else {
      // Si no hay glosas, agregar una fila indicándolo
      sheet.addRow({
        codigoDevolucion: '',
        cantGlosada: 0,
        vlrUnitGlosado: 0,
        valorDevolucion: 0,
        observacionesGlosa: '✅ SIN GLOSAS - Factura aprobada según tarifario Nueva EPS',
        origen: 'SISTEMA',
        usuario: 'AUTO',
        codigoDevolucionItem: '0',
        totalGlosas: 0,
        diferencia: 0,
      });

      sheet.getRow(2).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFCCFFCC' },
      };
    }
  }

  /**
   * PESTAÑA 4: AUTORIZACIONES
   * Columnas 47-51: Datos de autorización
   */
  private async crearPestanaAutorizaciones(workbook: ExcelJS.Workbook, datos: DatosFacturaPDF) {
    const sheet = workbook.addWorksheet('AUTORIZACIONES');

    sheet.columns = [
      { header: 'Nro_Aut_Nvo', key: 'nroAutNvo', width: 20 },
      { header: 'Autorizacion', key: 'autorizacion', width: 20 },
      { header: 'Pai', key: 'pai', width: 15 },
      { header: 'Forma_de_Pago', key: 'formaDePago', width: 18 },
      { header: 'Observacion_Aut', key: 'observacionAut', width: 40 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    sheet.addRow({
      nroAutNvo: datos.nroAutNvo,
      autorizacion: datos.autorizacion,
      pai: datos.pai || '',
      formaDePago: datos.formaDePago || 'NORMAL',
      observacionAut: datos.observacionAut || '',
    });
  }

  /**
   * PESTAÑA 5: PACIENTE
   * Columnas 52-61: Datos del paciente
   */
  private async crearPestanaPaciente(workbook: ExcelJS.Workbook, datos: DatosFacturaPDF) {
    const sheet = workbook.addWorksheet('PACIENTE');

    sheet.columns = [
      { header: 'Tipo_Documento_Paciente', key: 'tipoDocumentoPaciente', width: 25 },
      { header: 'Numero_Documento', key: 'numeroDocumento', width: 20 },
      { header: 'Nombre_Paciente', key: 'nombrePaciente', width: 40 },
      { header: 'Regimen', key: 'regimen', width: 18 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Tipo_Afiliado', key: 'tipoAfiliado', width: 25 },
      { header: 'Direccion', key: 'direccion', width: 40 },
      { header: 'Telefono', key: 'telefono', width: 15 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00B0F0' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    sheet.addRow({
      tipoDocumentoPaciente: datos.tipoDocumentoPaciente,
      numeroDocumento: datos.numeroDocumento,
      nombrePaciente: datos.nombrePaciente,
      regimen: datos.regimenPaciente || datos.regimen,
      categoria: datos.categoriaPaciente,
      tipoAfiliado: datos.tipoAfiliado,
      direccion: datos.direccion,
      telefono: datos.telefono,
      departamento: datos.departamento,
      municipio: datos.municipio,
    });
  }

  /**
   * PESTAÑA 6: DIAGNOSTICOS
   * Columnas 62-65: Diagnósticos
   */
  private async crearPestanaDiagnosticos(workbook: ExcelJS.Workbook, datos: DatosFacturaPDF) {
    const sheet = workbook.addWorksheet('DIAGNOSTICOS');

    sheet.columns = [
      { header: 'Diagnostico_Principal', key: 'diagnosticoPrincipal', width: 25 },
      { header: 'Diagnostico_Relacionado_1', key: 'diagnosticoRelacionado1', width: 28 },
      { header: 'Diagnostico_Relacionado_2', key: 'diagnosticoRelacionado2', width: 28 },
      { header: 'Diagnostico_Egreso', key: 'diagnosticoEgreso', width: 25 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7030A0' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    sheet.addRow({
      diagnosticoPrincipal: datos.diagnosticoPrincipal,
      diagnosticoRelacionado1: datos.diagnosticoRelacionado1 || '',
      diagnosticoRelacionado2: datos.diagnosticoRelacionado2 || '',
      diagnosticoEgreso: datos.diagnosticoEgreso,
    });
  }

  /**
   * PESTAÑA 7: FECHAS
   * Columnas 66-71: Fechas y tiempos
   */
  private async crearPestanaFechas(workbook: ExcelJS.Workbook, datos: DatosFacturaPDF) {
    const sheet = workbook.addWorksheet('FECHAS');

    sheet.columns = [
      { header: 'Fecha_Ingreso', key: 'fechaIngreso', width: 18 },
      { header: 'Hora_Ingreso', key: 'horaIngreso', width: 15 },
      { header: 'Fecha_Egreso', key: 'fechaEgreso', width: 18 },
      { header: 'Hora_Egreso', key: 'horaEgreso', width: 15 },
      { header: 'Servicio_Egreso', key: 'servicioEgreso', width: 20 },
      { header: 'Cama', key: 'cama', width: 15 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00B050' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar datos
    sheet.addRow({
      fechaIngreso: datos.fechaIngreso,
      horaIngreso: datos.horaIngreso,
      fechaEgreso: datos.fechaEgreso,
      horaEgreso: datos.horaEgreso,
      servicioEgreso: datos.servicioEgreso || '',
      cama: datos.cama || '',
    });
  }

  /**
   * PESTAÑA 8: RESUMEN
   * Columnas 72-80: Valores finales
   */
  private async crearPestanaResumen(
    workbook: ExcelJS.Workbook,
    datos: DatosFacturaPDF,
    valorAPagar: number,
    valorGlosaTotal: number
  ) {
    const sheet = workbook.addWorksheet('RESUMEN');

    sheet.columns = [
      { header: 'Campo', key: 'campo', width: 25 },
      { header: 'Valor', key: 'valor', width: 20 },
    ];

    // Estilo de encabezados
    sheet.getRow(1).font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF002060' },
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Calcular diferencia
    const diferencia = datos.vlrNetoFact - datos.netoDigitado;

    // Agregar datos
    const rows = [
      { campo: 'Vlr_Bruto_Fact', valor: datos.vlrBrutoFact },
      { campo: 'Vlr_Neto_Fact', valor: datos.vlrNetoFact },
      { campo: 'Neto_digitado', valor: datos.netoDigitado },
      { campo: 'Dif', valor: diferencia },
      { campo: 'Doc_Valor_IPS', valor: datos.docValorIPS },
      { campo: 'Copago', valor: datos.copago },
      { campo: 'Cmo (Cuota Moderadora)', valor: datos.cmo },
      { campo: 'Dacto', valor: datos.dacto },
      { campo: '', valor: '' }, // Espacio
      { campo: '💰 VALOR A PAGAR', valor: valorAPagar },
      { campo: '❌ TOTAL GLOSAS', valor: valorGlosaTotal },
      { campo: '✅ VALOR ACEPTADO', valor: valorAPagar },
      { campo: '', valor: '' }, // Espacio
      { campo: 'Totales', valor: datos.totales },
    ];

    rows.forEach((row, index) => {
      const addedRow = sheet.addRow(row);

      // Formato de moneda para valores numéricos
      if (typeof row.valor === 'number' && row.valor !== 0) {
        addedRow.getCell('valor').numFmt = '$#,##0.00';
      }

      // Resaltar filas importantes
      if (row.campo.includes('VALOR A PAGAR')) {
        addedRow.font = { bold: true, size: 12 };
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFCCFFCC' },
        };
      } else if (row.campo.includes('TOTAL GLOSAS')) {
        addedRow.font = { bold: true, size: 12 };
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCCCC' },
        };
      } else if (row.campo.includes('VALOR ACEPTADO')) {
        addedRow.font = { bold: true, size: 12 };
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF92D050' },
        };
      }
    });

    // Ajustar ancho
    sheet.getColumn('campo').width = 30;
    sheet.getColumn('valor').width = 25;
  }

  /**
   * Aplica formato de moneda colombiana a un rango de celdas
   */
  private aplicarFormatoMoneda(sheet: ExcelJS.Worksheet, range: string) {
    const [start, end] = range.split(':');
    const startCol = start.replace(/\d/g, '');
    const startRow = parseInt(start.replace(/\D/g, ''));
    const endCol = end?.replace(/\d/g, '') || startCol;
    const endRow = parseInt(end?.replace(/\D/g, '') || startRow.toString());

    for (let row = startRow; row <= endRow; row++) {
      const colStart = startCol.charCodeAt(0);
      const colEnd = endCol.charCodeAt(0);

      for (let col = colStart; col <= colEnd; col++) {
        const cellAddress = String.fromCharCode(col) + row;
        const cell = sheet.getCell(cellAddress);
        cell.numFmt = '$#,##0.00';
      }
    }
  }

  /**
   * Obtiene el buffer del workbook para enviar al cliente
   */
  async obtenerBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }
}

export default new ExcelFacturaMedicaService();
