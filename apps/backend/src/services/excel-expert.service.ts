/**
 * Generador de Excel para el Sistema Experto
 *
 * Genera un archivo Excel con 5 hojas:
 * 1. Radicación / Factura General
 * 2. Detalle de la Factura
 * 3. Registro de Atenciones
 * 4. Procedimientos por Atención
 * 5. Glosas
 */

import XLSX from 'xlsx';
import { format } from 'date-fns';
import {
  ResultadoSistemaExperto,
  RadicacionFacturaGeneral,
  DetalleFactura,
  RegistroAtencion,
  ProcedimientoAtencion,
  GlosaDetalle,
} from '../types/expert-system.types';
import { logger } from '../utils/logger';

export class ExcelExpertService {
  /**
   * Genera Excel completo con las 5 hojas
   */
  generarExcelCompleto(resultado: ResultadoSistemaExperto): Buffer {
    logger.info('Generando Excel con 5 hojas...');

    const workbook = XLSX.utils.book_new();

    // Hoja 1: Radicación / Factura General
    const hoja1 = this.generarHoja1Radicacion(resultado.hoja1_radicacion);
    XLSX.utils.book_append_sheet(workbook, hoja1, '1. Radicación');

    // Hoja 2: Detalle de la Factura
    const hoja2 = this.generarHoja2Detalle(resultado.hoja2_detalles);
    XLSX.utils.book_append_sheet(workbook, hoja2, '2. Detalle Factura');

    // Hoja 3: Registro de Atenciones
    const hoja3 = this.generarHoja3Atenciones(resultado.hoja3_atenciones);
    XLSX.utils.book_append_sheet(workbook, hoja3, '3. Atenciones');

    // Hoja 4: Procedimientos por Atención
    const hoja4 = this.generarHoja4Procedimientos(resultado.hoja4_procedimientos);
    XLSX.utils.book_append_sheet(workbook, hoja4, '4. Procedimientos');

    // Hoja 5: Glosas
    const hoja5 = this.generarHoja5Glosas(resultado.hoja5_glosas);
    XLSX.utils.book_append_sheet(workbook, hoja5, '5. Glosas');

    // Hoja 6: Resumen Ejecutivo (bonus)
    const hoja6 = this.generarHojaResumen(resultado);
    XLSX.utils.book_append_sheet(workbook, hoja6, 'Resumen Ejecutivo');

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    logger.info('Excel generado exitosamente');
    return buffer;
  }

  /**
   * HOJA 1: Radicación / Factura General
   */
  private generarHoja1Radicacion(datos: RadicacionFacturaGeneral): XLSX.WorkSheet {
    const rows = [
      // Encabezados
      [
        'Nro Radicación',
        'Fecha Radicación',
        'Tipo de Cuenta',
        'Auditoría/Enfermería',
        'Régimen',
        'Producto',
        'Convenio',
        'IPS',
        'No de Factura',
        'Fecha Factura',
        'No. Atenciones',
        'Valor Bruto Factura',
        'Valor IVA',
        'Valor Neto Factura',
        'Observación Factura',
        'Estado Factura',
        'Regional',
        'Tipo Documento IPS',
        'Radicación PIC',
      ],
      // Datos
      [
        datos.nroRadicacion,
        this.formatearFecha(datos.fechaRadicacion),
        datos.tipoCuenta,
        datos.auditoriaEnfermeria,
        datos.regimen,
        datos.producto,
        datos.convenio,
        datos.ips,
        datos.nroFactura,
        this.formatearFecha(datos.fechaFactura),
        datos.nroAtenciones,
        datos.valorBrutoFactura,
        datos.valorIVA,
        datos.valorNetoFactura,
        datos.observacionFactura,
        datos.estadoFactura,
        datos.regional,
        datos.tipoDocumentoIPS,
        datos.radicacionPIC || '',
      ],
    ];

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * HOJA 2: Detalle de la Factura
   */
  private generarHoja2Detalle(datos: DetalleFactura[]): XLSX.WorkSheet {
    const rows = [
      // Encabezados
      [
        'Línea/Consecutivo',
        'Autoriza',
        'Tipo Doc',
        'Identificación',
        'Nombre',
        'Fecha Inicio',
        'Fecha Fin',
        'Régimen',
        'IPS Primaria',
        'Documento Soporte',
        'Valor IPS',
        'Copago IPS',
        'CMO IPS',
        'Descuento',
        'Totales',
        'Estado',
        'Usuario',
        'Plan',
      ],
      // Datos
      ...datos.map((d) => [
        d.lineaConsecutivo,
        d.autoriza || '',
        d.tipoDoc,
        d.identificacion,
        d.nombre,
        this.formatearFecha(d.fechaInicio),
        this.formatearFecha(d.fechaFin),
        d.regimen,
        d.ipsPrimaria || '',
        d.documentoSoporte || '',
        d.valorIPS,
        d.copagoIPS,
        d.cmoIPS,
        d.descuento,
        d.totales,
        d.estado,
        d.usuario || '',
        d.plan,
      ]),
    ];

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * HOJA 3: Registro de Atenciones
   */
  private generarHoja3Atenciones(datos: RegistroAtencion[]): XLSX.WorkSheet {
    const rows = [
      // Encabezados
      [
        'Nro Radicación',
        'Nro Atención',
        'Autorización',
        'PAI',
        'Forma de Pago',
        'Observación Autorización',
        'Diagnóstico',
        'Dx Nombre',
        'Dx Clase',
      ],
      // Datos
      ...datos.map((d) => [
        d.nroRadicacion,
        d.nroAtencion,
        d.autorizacion || '',
        d.pai || '',
        d.formaPago,
        d.observacionAutorizacion || '',
        d.diagnostico,
        d.dxNombre,
        d.dxClase,
      ]),
    ];

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * HOJA 4: Procedimientos por Atención
   */
  private generarHoja4Procedimientos(datos: ProcedimientoAtencion[]): XLSX.WorkSheet {
    const rows = [
      // Encabezados
      [
        'Nro Radicación',
        'Nro Atención',
        'Código Manual',
        'Código Procedimiento',
        'Nombre Procedimiento',
        'MAPIISS',
        'Cantidad',
        'Valor IPS',
        'Valor EPS',
        'Valor a Pagar',
        'Valor Nota Crédito',
        'Gestión',
        'Glosas',
        'Valor Glosa Admisiva',
        'Valor Glosa Auditoría',
        'Estado',
        'Tipo Liquidación',
        'Valor Contratado EPS',
        'Subservicio',
      ],
      // Datos
      ...datos.map((d) => [
        d.nroRadicacion,
        d.nroAtencion,
        d.codigoManual,
        d.codigoProcedimiento,
        d.nombreProcedimiento,
        d.mapiiss || '',
        d.cantidad,
        d.valorIPS,
        d.valorEPS,
        d.valorAPagar,
        d.valorNotaCredito,
        d.gestion || '',
        d.glosas ? 'SÍ' : 'NO',
        d.valorGlosaAdmisiva,
        d.valorGlosaAuditoria,
        d.estado,
        d.tipoLiquidacion,
        d.valorContratadoEPS,
        d.subservicio || '',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Aplicar formato de moneda a columnas de valores
    const columnasMoneda = [7, 8, 9, 10, 13, 14, 17]; // índices de columnas con valores
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let R = 1; R <= range.e.r; R++) {
      // Empezar desde 1 para saltar encabezados
      for (const C of columnasMoneda) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = '$#,##0.00';
        }
      }
    }

    return worksheet;
  }

  /**
   * HOJA 5: Glosas
   */
  private generarHoja5Glosas(datos: GlosaDetalle[]): XLSX.WorkSheet {
    const rows = [
      // Encabezados
      [
        'Nro Radicación',
        'Nro Atención',
        'Código Procedimiento',
        'Nombre Procedimiento',
        'Código Devolución',
        'Cantidad Glosada',
        'Vr Unit Glosado',
        'Valor Total Devolución',
        'Observaciones Glosa',
        'Origen',
        'Valor Glosa Final',
      ],
      // Datos
      ...datos.map((d) => [
        d.nroRadicacion || '',
        d.nroAtencion || '',
        d.codigoProcedimiento || '',
        d.nombreProcedimiento || '',
        d.codigoDevolucion,
        d.cantidadGlosada,
        d.vrUnitGlosado,
        d.valorTotalDevolucion,
        d.observacionesGlosa,
        d.origen,
        d.valorGlosaFinal,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Aplicar formato de moneda
    const columnasMoneda = [6, 7, 10]; // Vr Unit, Valor Total, Valor Final
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    for (let R = 1; R <= range.e.r; R++) {
      for (const C of columnasMoneda) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = '$#,##0.00';
        }
      }
    }

    return worksheet;
  }

  /**
   * HOJA BONUS: Resumen Ejecutivo
   */
  private generarHojaResumen(resultado: ResultadoSistemaExperto): XLSX.WorkSheet {
    const rows = [
      ['RESUMEN EJECUTIVO - AUDITORÍA DE CUENTA MÉDICA'],
      [],
      ['Fecha de Procesamiento:', this.formatearFecha(resultado.metadata.fechaProcesamiento)],
      ['Tiempo de Procesamiento:', `${resultado.metadata.tiempoMs} ms`],
      ['Versión del Sistema:', resultado.metadata.version],
      [],
      ['ESTADÍSTICAS'],
      ['Total de Items Validados:', resultado.metadata.itemsValidados],
      ['Items con Glosas:', resultado.metadata.itemsConGlosas],
      ['Total de Glosas Detectadas:', resultado.resumen.cantidadGlosas],
      [],
      ['VALORES'],
      ['Total Facturado:', resultado.resumen.totalFacturado],
      ['Total Glosado:', resultado.resumen.totalGlosado],
      ['Total a Pagar:', resultado.resumen.totalAPagar],
      [
        'Porcentaje Glosado:',
        resultado.resumen.totalFacturado > 0
          ? `${((resultado.resumen.totalGlosado / resultado.resumen.totalFacturado) * 100).toFixed(2)}%`
          : '0%',
      ],
      [],
      ['GLOSAS POR TIPO'],
      ['Código', 'Cantidad'],
      ...Object.entries(resultado.resumen.glosasPorTipo).map(([codigo, cantidad]) => [codigo, cantidad]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Aplicar formato de moneda a valores
    worksheet['B13'] = { t: 'n', v: resultado.resumen.totalFacturado, z: '$#,##0.00' };
    worksheet['B14'] = { t: 'n', v: resultado.resumen.totalGlosado, z: '$#,##0.00' };
    worksheet['B15'] = { t: 'n', v: resultado.resumen.totalAPagar, z: '$#,##0.00' };

    return worksheet;
  }

  /**
   * Formatea una fecha para Excel
   */
  private formatearFecha(fecha: Date | string | undefined): string {
    if (!fecha) return '';
    try {
      const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return format(fechaObj, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  }

  /**
   * Guarda el Excel en un archivo
   */
  async guardarExcel(resultado: ResultadoSistemaExperto, rutaDestino: string): Promise<void> {
    const buffer = this.generarExcelCompleto(resultado);
    const fs = await import('fs/promises');
    await fs.writeFile(rutaDestino, buffer);
    logger.info(`Excel guardado en: ${rutaDestino}`);
  }
}

// Exportar instancia singleton
export const excelExpertService = new ExcelExpertService();
