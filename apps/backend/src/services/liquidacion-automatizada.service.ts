import { Radicado, IRadicado } from '../models/Radicado';
import PDFExtractorService, { DatosFacturaPDF } from './pdf-extractor.service';
import validacionesAutomaticasService from './validaciones-automaticas.service';
import motorReglasService from './motor-reglas.service';
import endpointExternoService from './endpoint-externo.service';
import excelFacturaMedicaService from './excel-factura-medica.service';
import { GlosaCalculada } from './glosa-calculator.service';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

interface ResultadoLiquidacion {
  radicado: IRadicado;
  datosFactura: DatosFacturaPDF;
  validaciones: any;
  reglasAplicadas: any;
  glosas: GlosaCalculada[];
  valorFinalAPagar: number;
  valorGlosaTotal: number;
  excelGenerado: boolean;
  rutaExcel?: string;
  mensajes: string[];
}

class LiquidacionAutomatizadaService {
  /**
   * Proceso completo de liquidación automatizada
   */
  async liquidarRadicado(numeroRadicado: string): Promise<ResultadoLiquidacion> {
    logger.info(`🚀 Iniciando liquidación automatizada para radicado: ${numeroRadicado}`);

    // 1. Obtener o crear radicado
    let radicado = await Radicado.findOne({ numeroRadicado });

    if (!radicado) {
      throw new Error(`Radicado ${numeroRadicado} no encontrado`);
    }

    radicado.estado = 'en_proceso';
    await radicado.save();

    const mensajes: string[] = [];

    try {
      // 2. Extraer datos de PDFs
      logger.info('📄 Extrayendo datos de PDFs');
      const datosFactura = await this.extraerDatosPDFs(radicado);
      mensajes.push('✅ Datos extraídos de PDFs');

      // 3. Buscar información adicional en sistemas externos si es necesario
      await this.consultarSistemasExternos(radicado, datosFactura);
      mensajes.push('✅ Consultas a sistemas externos completadas');

      // 4. Ejecutar validaciones automáticas
      logger.info('🔍 Ejecutando validaciones automáticas');
      const resultadoValidaciones = await validacionesAutomaticasService.validarRadicadoCompleto(
        radicado,
        datosFactura
      );

      // Guardar validaciones en el radicado
      radicado.validaciones = resultadoValidaciones.validaciones.map((v) => ({
        tipo: v.tipo,
        estado: v.estado,
        mensaje: v.mensaje,
        detalles: v.detalles,
        validadoEn: new Date(),
      }));

      mensajes.push(
        `✅ Validaciones completadas: ${resultadoValidaciones.mensajeResumen}`
      );

      // 5. Calcular glosas iniciales
      logger.info('💰 Calculando glosas');
      const glosas = await this.calcularGlosas(radicado, datosFactura);
      mensajes.push(`📊 ${glosas.length} glosa(s) encontrada(s) inicialmente`);

      // 6. Aplicar reglas de negocio personalizadas
      logger.info('📋 Aplicando reglas de negocio');
      const valorContratado = radicado.valorContratado || datosFactura.valorIPS || 0;
      const resultadoReglas = await motorReglasService.evaluarReglas(
        datosFactura,
        glosas,
        valorContratado
      );

      // Guardar reglas aplicadas
      radicado.reglasAplicadas = resultadoReglas.reglasAplicadas.map((r) => ({
        reglaId: r.reglaId,
        nombreRegla: r.nombreRegla,
        accion: r.accion,
        resultado: r.parametros ? JSON.stringify(r.parametros) : '',
      }));

      mensajes.push(
        `✅ ${resultadoReglas.reglasAplicadas.length} regla(s) aplicada(s)`
      );
      mensajes.push(...resultadoReglas.mensajes);

      // Usar glosas filtradas por reglas
      const glosasFiltradas = resultadoReglas.glosasFiltradas;

      // Guardar glosas en radicado
      radicado.glosas = glosasFiltradas.map((g) => ({
        tipo: 'valor',
        codigo: g.codigo,
        descripcion: g.observacion,
        valor: g.valorTotalGlosa,
        generadaPor: 'sistema',
      }));

      // 7. Calcular valores finales
      const valorGlosaTotal = glosasFiltradas.reduce((sum, g) => sum + g.valorTotalGlosa, 0);
      const valorFinalAPagar = Math.max(
        0,
        (radicado.valorIPS || datosFactura.valorIPS || 0) - valorGlosaTotal
      );

      // 8. Actualizar radicado con resultados
      radicado.liquidacion = {
        valorFinalAPagar,
        valorGlosaTotal,
        valorAceptado: valorFinalAPagar,
        observaciones: mensajes.join('\n'),
        liquidadoEn: new Date(),
        liquidadoPor: 'sistema',
        excelGenerado: false,
      };

      // 9. Generar Excel
      logger.info('📊 Generando Excel de liquidación');
      const rutaExcel = await this.generarExcelLiquidacion(
        radicado,
        datosFactura,
        glosasFiltradas,
        valorFinalAPagar,
        valorGlosaTotal,
        resultadoReglas
      );

      if (rutaExcel) {
        radicado.liquidacion.excelGenerado = true;
        radicado.liquidacion.rutaExcel = rutaExcel;
        mensajes.push(`✅ Excel generado: ${rutaExcel}`);
      }

      // 10. Determinar estado final
      if (glosasFiltradas.length > 0) {
        radicado.estado = 'con_glosas';
      } else if (resultadoValidaciones.requiereRevisionManual) {
        radicado.estado = 'validado'; // Requiere revisión pero puede continuar
      } else {
        radicado.estado = 'liquidado';
      }

      await radicado.save();

      logger.info(
        `✅ Liquidación completada - Estado: ${radicado.estado} - Valor a pagar: $${valorFinalAPagar.toLocaleString()}`
      );

      return {
        radicado,
        datosFactura,
        validaciones: resultadoValidaciones,
        reglasAplicadas: resultadoReglas,
        glosas: glosasFiltradas,
        valorFinalAPagar,
        valorGlosaTotal,
        excelGenerado: !!rutaExcel,
        rutaExcel,
        mensajes,
      };
    } catch (error: any) {
      logger.error('❌ Error en liquidación automatizada:', error);

      radicado.estado = 'rechazado';
      radicado.observacionesGenerales = `Error: ${error.message}`;
      await radicado.save();

      throw error;
    }
  }

  /**
   * Extrae datos de todos los PDFs del radicado
   */
  private async extraerDatosPDFs(radicado: IRadicado): Promise<DatosFacturaPDF> {
    const facturas = radicado.documentos.filter((doc) => doc.tipo === 'factura');

    if (facturas.length === 0) {
      throw new Error('No se encontró PDF de factura en el radicado');
    }

    // Procesar la primera factura encontrada
    const facturaPrincipal = facturas[0];

    logger.info(`📄 Extrayendo datos de: ${facturaPrincipal.path}`);

    const datosExtraidos = await PDFExtractorService.extraerDatosFactura(
      facturaPrincipal.path
    );

    // Marcar documento como procesado
    facturaPrincipal.procesado = true;
    facturaPrincipal.datosExtraidos = datosExtraidos;

    // Actualizar datos del radicado con lo extraído
    if (!radicado.numeroFactura) {
      radicado.numeroFactura = datosExtraidos.nroFactura;
    }
    if (!radicado.valorTotal) {
      radicado.valorTotal = datosExtraidos.valorNetoFactura;
    }
    if (!radicado.valorIPS) {
      radicado.valorIPS = datosExtraidos.valorIPS;
    }

    return datosExtraidos;
  }

  /**
   * Consulta sistemas externos para obtener información adicional
   */
  private async consultarSistemasExternos(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<void> {
    const consultasRealizadas: any[] = [];

    // 5. Si no hay detalle en Nueva EPS, buscar en OnBase
    if (!datosFactura.codigoProcedimiento || !datosFactura.nombreProcedimiento) {
      logger.info('🔍 Detalle incompleto, buscando en OnBase');

      const resultadoOnBase = await endpointExternoService.buscarEnOnBase({
        radicado: radicado.numeroRadicado,
        nit: radicado.nit,
        numeroFactura: datosFactura.nroFactura,
      });

      consultasRealizadas.push({
        sistema: 'onbase',
        url: 'OnBase Document Search',
        exitosa: resultadoOnBase.exitosa,
        datosObtenidos: resultadoOnBase.datos,
        error: resultadoOnBase.error,
        consultadoEn: new Date(),
      });

      if (resultadoOnBase.exitosa && resultadoOnBase.datos) {
        logger.info(`✅ Documentos encontrados en OnBase: ${resultadoOnBase.datos.length}`);
      }
    }

    // Consultar autorización en Nueva EPS si no se tiene
    if (!radicado.autorizacion?.encontrada && datosFactura.autorizacion) {
      logger.info('🏥 Consultando autorización en Nueva EPS');

      const resultadoAutorizacion =
        await endpointExternoService.consultarAutorizacionNuevaEPS({
          numeroAutorizacion: datosFactura.autorizacion,
          cedulaPaciente: datosFactura.numeroDocumento,
        });

      consultasRealizadas.push({
        sistema: 'nueva_eps',
        url: 'Nueva EPS - Autorización',
        exitosa: resultadoAutorizacion.exitosa,
        datosObtenidos: resultadoAutorizacion.datos,
        error: resultadoAutorizacion.error,
        consultadoEn: new Date(),
      });

      if (resultadoAutorizacion.exitosa && resultadoAutorizacion.datos) {
        radicado.autorizacion = {
          numero: resultadoAutorizacion.datos.numeroAutorizacion,
          fechaAutorizacion: resultadoAutorizacion.datos.fechaAutorizacion,
          servicioAutorizado: resultadoAutorizacion.datos.servicioAutorizado,
          codigoCUPS: resultadoAutorizacion.datos.codigoCUPS,
          diagnostico: resultadoAutorizacion.datos.diagnostico,
          encontrada: true,
          valida: true,
          observaciones: 'Encontrada en Nueva EPS',
        };
      }
    }

    // Guardar consultas realizadas
    radicado.consultasExternas = consultasRealizadas;
  }

  /**
   * Calcula glosas basándose en las validaciones
   */
  private async calcularGlosas(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<GlosaCalculada[]> {
    const glosas: GlosaCalculada[] = [];

    // Glosa por diferencia de valor
    const valorIPS = radicado.valorIPS || datosFactura.valorIPS || 0;
    const valorContratado = radicado.valorContratado || 0;

    if (valorContratado > 0 && valorIPS > valorContratado) {
      const diferencia = valorIPS - valorContratado;

      glosas.push({
        codigo: datosFactura.codigoProcedimiento || 'N/A',
        tipo: 'DIFERENCIA_TARIFA',
        codigoProcedimiento: datosFactura.codigoProcedimiento || 'N/A',
        descripcionProcedimiento: datosFactura.nombreProcedimiento || '',
        valorIPS,
        valorContrato: valorContratado,
        cantidad: 1,
        diferencia: diferencia,
        valorTotalGlosa: diferencia,
        observacion: `Valor IPS ($${valorIPS.toLocaleString()}) supera valor contratado ($${valorContratado.toLocaleString()})`,
        automatica: true,
      });
    }

    // Glosa por falta de autorización
    if (!radicado.autorizacion?.encontrada && radicado.valorTotal && radicado.valorTotal > 50000) {
      glosas.push({
        codigo: datosFactura.codigoProcedimiento || 'N/A',
        tipo: 'SIN_AUTORIZACION',
        codigoProcedimiento: datosFactura.codigoProcedimiento || 'N/A',
        descripcionProcedimiento: datosFactura.nombreProcedimiento || '',
        valorIPS,
        valorContrato: valorContratado,
        cantidad: 1,
        diferencia: valorIPS,
        valorTotalGlosa: valorIPS,
        observacion: 'Servicio sin autorización válida (valor > $50,000 requiere autorización)',
        automatica: true,
      });
    }

    return glosas;
  }

  /**
   * Genera Excel con toda la información de liquidación
   */
  private async generarExcelLiquidacion(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF,
    glosas: GlosaCalculada[],
    valorAPagar: number,
    valorGlosaTotal: number,
    resultadoReglas: any
  ): Promise<string | undefined> {
    try {
      // Generar workbook con las 8 pestañas
      const workbook = await excelFacturaMedicaService.generarExcelCompleto(
        datosFactura,
        glosas,
        valorAPagar,
        valorGlosaTotal
      );

      // Agregar pestaña de REGLAS APLICADAS si hay reglas
      if (resultadoReglas.reglasAplicadas.length > 0) {
        const sheetReglas = workbook.addWorksheet('REGLAS_APLICADAS');

        sheetReglas.columns = [
          { header: 'Regla', key: 'regla', width: 40 },
          { header: 'Acción', key: 'accion', width: 30 },
          { header: 'Valor Afectado', key: 'valorAfectado', width: 20 },
        ];

        // Estilo de encabezados
        sheetReglas.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheetReglas.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };

        resultadoReglas.reglasAplicadas.forEach((regla: any) => {
          sheetReglas.addRow({
            regla: regla.nombreRegla,
            accion: regla.accion,
            valorAfectado: regla.valorAfectado || 0,
          });
        });
      }

      // Agregar pestaña de CLASIFICACIÓN
      const sheetClasificacion = workbook.addWorksheet('CLASIFICACION');

      sheetClasificacion.columns = [
        { header: 'Campo', key: 'campo', width: 30 },
        { header: 'Valor', key: 'valor', width: 30 },
      ];

      sheetClasificacion.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheetClasificacion.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF00B050' },
      };

      const rangoDescripcion = this.obtenerDescripcionRango(radicado.rango);

      sheetClasificacion.addRow({ campo: 'Número Radicado', valor: radicado.numeroRadicado });
      sheetClasificacion.addRow({ campo: 'NIT IPS', valor: radicado.nit });
      sheetClasificacion.addRow({ campo: 'EPS', valor: radicado.eps });
      sheetClasificacion.addRow({ campo: 'Rango', valor: `${radicado.rango} - ${rangoDescripcion}` });
      sheetClasificacion.addRow({ campo: 'Tipo Atención', valor: radicado.tipoAtencion || 'N/A' });
      sheetClasificacion.addRow({ campo: 'Estado', valor: radicado.estado });

      // Guardar archivo
      const nombreArchivo = `liquidacion_${radicado.numeroRadicado}_${Date.now()}.xlsx`;
      const rutaCompleta = path.join('./uploads/exports', nombreArchivo);

      // Crear directorio si no existe
      await fs.mkdir('./uploads/exports', { recursive: true });

      const buffer = await excelFacturaMedicaService.obtenerBuffer(workbook);
      await fs.writeFile(rutaCompleta, buffer as any);

      logger.info(`📊 Excel generado exitosamente: ${rutaCompleta}`);

      return rutaCompleta;
    } catch (error) {
      logger.error('Error generando Excel:', error);
      return undefined;
    }
  }

  /**
   * Obtiene descripción del rango
   */
  private obtenerDescripcionRango(rango: number): string {
    switch (rango) {
      case 1:
        return '< $100,000';
      case 2:
        return '$100,000 - $500,000';
      case 3:
        return '$500,000 - $1,000,000';
      case 4:
        return '> $1,000,000';
      default:
        return 'No clasificado';
    }
  }

  /**
   * Crea un radicado inicial con datos básicos
   */
  async crearRadicado(datos: {
    numeroRadicado: string;
    nit: string;
    eps: string;
    nombreIPS?: string;
    creadoPor: string;
  }): Promise<IRadicado> {
    const radicado = new Radicado({
      numeroRadicado: datos.numeroRadicado,
      nit: datos.nit,
      eps: datos.eps,
      nombreIPS: datos.nombreIPS,
      documentos: [],
      validaciones: [],
      estado: 'pendiente',
      rango: 1, // Se actualizará automáticamente cuando se tenga el valor
      creadoPor: datos.creadoPor,
    });

    await radicado.save();

    logger.info(`✅ Radicado creado: ${radicado.numeroRadicado}`);

    return radicado;
  }
}

export default new LiquidacionAutomatizadaService();
