/**
 * Generador de Excel para el Sistema Experto
 *
 * Genera un archivo Excel con 5 hojas:
 * 1. Radicación / Factura General
 * 2. Detalle de la Factura
 * 3. Registro de Atenciones
 * 4. Procedimientos por Atención
 * 5. Glosas
 * (más una hoja de Resumen Ejecutivo)
 *
 * Usa ExcelJS (antes `xlsx`/SheetJS, retirado por avisos de seguridad sin
 * corrección en npm). La generación es asíncrona: `generarExcelCompleto`
 * devuelve una promesa con el Buffer del .xlsx.
 */

import ExcelJS from 'exceljs';
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

type Fila = ExcelJS.CellValue[];

/** Formato de moneda de las columnas de valores (el mismo que se usaba con xlsx). */
const FORMATO_MONEDA = '$#,##0.00';

export class ExcelExpertService {
  /**
   * Genera Excel completo con las 5 hojas
   */
  async generarExcelCompleto(resultado: ResultadoSistemaExperto): Promise<Buffer> {
    logger.info('Generando Excel con 5 hojas...');

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KopTup';
    workbook.created = new Date();

    // Hoja 1: Radicación / Factura General
    this.agregarHoja(workbook, '1. Radicación', this.generarHoja1Radicacion(resultado.hoja1_radicacion));

    // Hoja 2: Detalle de la Factura
    this.agregarHoja(workbook, '2. Detalle Factura', this.generarHoja2Detalle(resultado.hoja2_detalles));

    // Hoja 3: Registro de Atenciones
    this.agregarHoja(workbook, '3. Atenciones', this.generarHoja3Atenciones(resultado.hoja3_atenciones));

    // Hoja 4: Procedimientos por Atención (columnas de valores en moneda)
    this.agregarHoja(
      workbook,
      '4. Procedimientos',
      this.generarHoja4Procedimientos(resultado.hoja4_procedimientos),
      [7, 8, 9, 10, 13, 14, 17]
    );

    // Hoja 5: Glosas (Vr Unit, Valor Total y Valor Final en moneda)
    this.agregarHoja(workbook, '5. Glosas', this.generarHoja5Glosas(resultado.hoja5_glosas), [6, 7, 10]);

    // Hoja 6: Resumen Ejecutivo (bonus)
    const resumen = this.agregarHoja(workbook, 'Resumen Ejecutivo', this.generarHojaResumen(resultado));
    // Total Facturado, Total Glosado y Total a Pagar (filas 13 a 15, columna B)
    for (const celda of ['B13', 'B14', 'B15']) {
      resumen.getCell(celda).numFmt = FORMATO_MONEDA;
    }

    // Generar buffer
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    logger.info('Excel generado exitosamente');
    return buffer;
  }

  /**
   * Agrega una hoja con las filas dadas. `columnasMoneda` son índices de
   * columna en base 0; el formato se aplica desde la fila 2 (la 1 es el
   * encabezado).
   */
  private agregarHoja(
    workbook: ExcelJS.Workbook,
    nombre: string,
    filas: Fila[],
    columnasMoneda: number[] = []
  ): ExcelJS.Worksheet {
    const hoja = workbook.addWorksheet(nombre);
    for (const fila of filas) {
      hoja.addRow(fila.map((valor) => (valor === undefined ? null : valor)));
    }
    for (let numeroFila = 2; numeroFila <= filas.length; numeroFila++) {
      for (const columna of columnasMoneda) {
        const celda = hoja.getRow(numeroFila).getCell(columna + 1);
        if (celda.value !== null && celda.value !== undefined && celda.value !== '') {
          celda.numFmt = FORMATO_MONEDA;
        }
      }
    }
    return hoja;
  }

  /**
   * HOJA 1: Radicación / Factura General
   */
  private generarHoja1Radicacion(datos: RadicacionFacturaGeneral): Fila[] {
    const rows: Fila[] = [
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

    return rows;
  }

  /**
   * HOJA 2: Detalle de la Factura
   */
  private generarHoja2Detalle(datos: DetalleFactura[]): Fila[] {
    const rows: Fila[] = [
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

    return rows;
  }

  /**
   * HOJA 3: Registro de Atenciones
   */
  private generarHoja3Atenciones(datos: RegistroAtencion[]): Fila[] {
    const rows: Fila[] = [
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

    return rows;
  }

  /**
   * HOJA 4: Procedimientos por Atención
   */
  private generarHoja4Procedimientos(datos: ProcedimientoAtencion[]): Fila[] {
    const rows: Fila[] = [
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

    // El formato de moneda (columnas 7, 8, 9, 10, 13, 14 y 17) lo aplica agregarHoja
    return rows;
  }

  /**
   * HOJA 5: Glosas
   */
  private generarHoja5Glosas(datos: GlosaDetalle[]): Fila[] {
    const rows: Fila[] = [
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

    // El formato de moneda (columnas 6, 7 y 10) lo aplica agregarHoja
    return rows;
  }

  /**
   * HOJA BONUS: Resumen Ejecutivo
   */
  private generarHojaResumen(resultado: ResultadoSistemaExperto): Fila[] {
    const rows: Fila[] = [
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

    // Las filas 13 a 15 (columna B) llevan los totales como número; el
    // formato de moneda lo aplica generarExcelCompleto.
    return rows;
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
    const buffer = await this.generarExcelCompleto(resultado);
    const fs = await import('fs/promises');
    await fs.writeFile(rutaDestino, buffer);
    logger.info(`Excel guardado en: ${rutaDestino}`);
  }
}

// Exportar instancia singleton
export const excelExpertService = new ExcelExpertService();
