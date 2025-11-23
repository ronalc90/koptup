import { IRadicado } from '../models/Radicado';
import { DatosFacturaPDF } from './pdf-extractor.service';
import endpointExternoService from './endpoint-externo.service';
import { logger } from '../utils/logger';
import { differenceInMonths, differenceInDays, parseISO } from 'date-fns';

interface ResultadoValidacion {
  tipo: 'factura' | 'paciente' | 'autorizacion' | 'valor' | 'fecha' | 'cuota_moderadora';
  estado: 'aprobado' | 'rechazado' | 'advertencia';
  mensaje: string;
  detalles?: any;
}

interface ResultadoValidacionCompleta {
  validaciones: ResultadoValidacion[];
  estadoGeneral: 'aprobado' | 'rechazado' | 'advertencia';
  requiereRevisionManual: boolean;
  mensajeResumen: string;
}

class ValidacionesAutomaticasService {
  /**
   * Ejecuta todas las validaciones automáticas sobre un radicado
   */
  async validarRadicadoCompleto(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<ResultadoValidacionCompleta> {
    logger.info(`🔍 Iniciando validaciones automáticas para radicado: ${radicado.numeroRadicado}`);

    const validaciones: ResultadoValidacion[] = [];

    // 1. Validación de datos de factura
    const validacionFactura = await this.validarDatosFactura(radicado, datosFactura);
    validaciones.push(validacionFactura);

    // 2. Validación de datos del paciente
    const validacionPaciente = await this.validarDatosPaciente(radicado, datosFactura);
    validaciones.push(validacionPaciente);

    // 3. Validación de autorización
    const validacionAutorizacion = await this.validarAutorizacion(radicado, datosFactura);
    validaciones.push(validacionAutorizacion);

    // 4. Validación de valor contratado
    const validacionValor = await this.validarValorContratado(radicado, datosFactura);
    validaciones.push(validacionValor);

    // 5. Validación de fechas
    const validacionFechas = await this.validarFechas(radicado, datosFactura);
    validaciones.push(validacionFechas);

    // 6. Validación de cuota moderadora
    const validacionCuota = await this.validarCuotaModeradora(radicado, datosFactura);
    validaciones.push(validacionCuota);

    // Determinar estado general
    const resultado = this.determinarEstadoGeneral(validaciones);

    logger.info(
      `✅ Validaciones completadas: ${resultado.estadoGeneral} - ${validaciones.length} validaciones realizadas`
    );

    return resultado;
  }

  /**
   * 2.1 Validación de datos de factura contra Nueva EPS
   */
  private async validarDatosFactura(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<ResultadoValidacion> {
    logger.info('📄 Validando datos de factura');

    const errores: string[] = [];

    // Número de factura
    if (!datosFactura.nroFactura || datosFactura.nroFactura.trim() === '') {
      errores.push('Número de factura no encontrado');
    }

    // Fecha de emisión
    if (!datosFactura.fechaFactura) {
      errores.push('Fecha de emisión no encontrada');
    }

    // Valores
    if (!datosFactura.valorNetoFactura || datosFactura.valorNetoFactura <= 0) {
      errores.push('Valor neto de factura inválido');
    }

    // Fecha de radicación vs fecha actual (no debe superar 9 meses)
    if (datosFactura.fechaRadicacion) {
      const fechaRad = parseISO(datosFactura.fechaRadicacion);
      const mesesTranscurridos = differenceInMonths(new Date(), fechaRad);

      if (mesesTranscurridos > 9) {
        errores.push(
          `⚠️ ALERTA: La fecha de radicación supera 9 meses (${mesesTranscurridos} meses)`
        );
      }
    }

    if (errores.length > 0) {
      return {
        tipo: 'factura',
        estado: 'advertencia',
        mensaje: 'Datos de factura incompletos o con advertencias',
        detalles: { errores },
      };
    }

    return {
      tipo: 'factura',
      estado: 'aprobado',
      mensaje: 'Datos de factura válidos',
      detalles: {
        numeroFactura: datosFactura.nroFactura,
        fechaEmision: datosFactura.fechaFactura,
        valorNeto: datosFactura.valorNetoFactura,
      },
    };
  }

  /**
   * 2.2 Validación de datos del paciente
   */
  private async validarDatosPaciente(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<ResultadoValidacion> {
    logger.info('👤 Validando datos del paciente');

    const errores: string[] = [];

    // Cédula correcta
    if (!datosFactura.numeroDocumento || datosFactura.numeroDocumento.trim() === '') {
      errores.push('Número de documento del paciente no encontrado');
    }

    // Si usa permiso temporal, validar fecha del servicio
    if (radicado.paciente?.usaPermisoTemporal) {
      if (!radicado.paciente.fechaServicio && !datosFactura.fechaIngreso) {
        errores.push(
          'Paciente con permiso temporal requiere fecha de servicio para validación'
        );
      } else {
        logger.info('ℹ️ Paciente usa permiso temporal - validando contra fecha de servicio');
      }
    }

    // Validar contra soportes clínicos (historia, evolución, notas)
    // NO se usa la fecha de la factura como validador
    const tieneSoportesClinicosValidos = radicado.documentos.some(
      (doc) =>
        doc.tipo === 'historia_clinica' || doc.tipo === 'soporte' && doc.procesado
    );

    if (!tieneSoportesClinicosValidos) {
      errores.push(
        'No se encontraron soportes clínicos válidos (historia clínica, evolución, notas)'
      );
    }

    if (errores.length > 0) {
      return {
        tipo: 'paciente',
        estado: 'advertencia',
        mensaje: 'Validación de paciente con advertencias',
        detalles: { errores },
      };
    }

    return {
      tipo: 'paciente',
      estado: 'aprobado',
      mensaje: 'Datos del paciente válidos',
      detalles: {
        documento: datosFactura.numeroDocumento,
        nombre: datosFactura.nombrePaciente,
        usaPermisoTemporal: radicado.paciente?.usaPermisoTemporal || false,
      },
    };
  }

  /**
   * 3. Validación de autorizaciones
   */
  private async validarAutorizacion(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<ResultadoValidacion> {
    logger.info('🔐 Validando autorización');

    // Si no hay número de autorización, intentar consultar
    if (!datosFactura.autorizacion && !radicado.autorizacion?.numero) {
      logger.warn('⚠️ No se proporcionó número de autorización');

      return {
        tipo: 'autorizacion',
        estado: 'advertencia',
        mensaje: 'No se proporcionó número de autorización',
        detalles: {
          requiereAutorizacion: true,
          encontrada: false,
        },
      };
    }

    try {
      // Consultar autorización en Nueva EPS
      const resultadoConsulta = await endpointExternoService.consultarAutorizacionNuevaEPS({
        numeroAutorizacion: datosFactura.autorizacion || radicado.autorizacion?.numero,
        cedulaPaciente: datosFactura.numeroDocumento,
        codigoCUPS: datosFactura.codigoProcedimiento,
      });

      if (!resultadoConsulta.exitosa) {
        // Si no carga, intentar cambiar sucursal o solicitar permiso
        logger.warn('⚠️ Autorización no encontrada en sistema Nueva EPS');

        return {
          tipo: 'autorizacion',
          estado: 'advertencia',
          mensaje: 'Autorización no encontrada - Puede requerir solicitud de permiso',
          detalles: {
            numeroAutorizacion: datosFactura.autorizacion,
            accionSugerida: 'Cambiar sucursal o solicitar permiso con radicado y tipo atención=1',
          },
        };
      }

      const autorizacion = resultadoConsulta.datos;

      // Validar que el servicio autorizado sea el mismo servicio facturado
      const servicioCoincide = this.validarCoincidenciaServicio(
        autorizacion.codigoCUPS,
        datosFactura.codigoProcedimiento
      );

      if (!servicioCoincide) {
        return {
          tipo: 'autorizacion',
          estado: 'rechazado',
          mensaje: 'El servicio facturado NO coincide con el servicio autorizado',
          detalles: {
            servicioFacturado: datosFactura.codigoProcedimiento,
            servicioAutorizado: autorizacion.codigoCUPS,
          },
        };
      }

      // Validar diagnóstico principal
      if (autorizacion.diagnostico && datosFactura.diagnosticoPrincipal) {
        if (autorizacion.diagnostico !== datosFactura.diagnosticoPrincipal) {
          logger.warn(
            `⚠️ Diagnóstico en autorización (${autorizacion.diagnostico}) difiere del diagnóstico facturado (${datosFactura.diagnosticoPrincipal})`
          );
        }
      }

      return {
        tipo: 'autorizacion',
        estado: 'aprobado',
        mensaje: 'Autorización válida y servicio coincidente',
        detalles: {
          numeroAutorizacion: autorizacion.numeroAutorizacion,
          servicioAutorizado: autorizacion.servicioAutorizado,
          diagnostico: autorizacion.diagnostico,
          encontrada: true,
        },
      };
    } catch (error: any) {
      logger.error('Error validando autorización:', error);

      return {
        tipo: 'autorizacion',
        estado: 'advertencia',
        mensaje: 'Error al validar autorización',
        detalles: { error: error.message },
      };
    }
  }

  /**
   * 4. Validación del valor contratado
   */
  private async validarValorContratado(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<ResultadoValidacion> {
    logger.info('💰 Validando valor contratado');

    const valorIPS = datosFactura.valorIPS || radicado.valorIPS || 0;
    const valorContratado = radicado.valorContratado || 0;

    if (valorContratado === 0) {
      return {
        tipo: 'valor',
        estado: 'advertencia',
        mensaje: 'No se ha definido el valor contratado por la EPS',
        detalles: { valorIPS },
      };
    }

    // Comparar valores
    if (valorIPS <= valorContratado) {
      return {
        tipo: 'valor',
        estado: 'aprobado',
        mensaje: 'Valor IPS es igual o menor al valor contratado',
        detalles: {
          valorIPS,
          valorContratado,
          diferencia: 0,
        },
      };
    }

    // Valor IPS es mayor que el contratado
    const diferencia = valorIPS - valorContratado;
    const porcentajeDiferencia = ((diferencia / valorContratado) * 100).toFixed(2);

    return {
      tipo: 'valor',
      estado: 'rechazado',
      mensaje: `Valor IPS ($${valorIPS.toLocaleString()}) supera el valor contratado ($${valorContratado.toLocaleString()})`,
      detalles: {
        valorIPS,
        valorContratado,
        diferencia,
        porcentajeDiferencia: `${porcentajeDiferencia}%`,
        generaGlosa: true,
      },
    };
  }

  /**
   * 5. Validación de fechas
   */
  private async validarFechas(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<ResultadoValidacion> {
    logger.info('📅 Validando fechas');

    const advertencias: string[] = [];

    // Validar fecha de servicio vs fecha de autorización
    if (radicado.autorizacion?.fechaAutorizacion && datosFactura.fechaIngreso) {
      const fechaAut = new Date(radicado.autorizacion.fechaAutorizacion);
      const fechaServ = parseISO(datosFactura.fechaIngreso);
      const diasDiferencia = differenceInDays(fechaServ, fechaAut);

      if (diasDiferencia > 30) {
        advertencias.push(
          `Fecha de servicio es ${diasDiferencia} días posterior a la autorización (máximo recomendado: 30 días)`
        );
      }
    }

    // Validar fecha de factura vs fecha de servicio
    if (datosFactura.fechaFactura && datosFactura.fechaIngreso) {
      const fechaFact = parseISO(datosFactura.fechaFactura);
      const fechaServ = parseISO(datosFactura.fechaIngreso);

      if (fechaFact < fechaServ) {
        advertencias.push('Fecha de factura es anterior a la fecha de servicio');
      }
    }

    if (advertencias.length > 0) {
      return {
        tipo: 'fecha',
        estado: 'advertencia',
        mensaje: 'Validación de fechas con advertencias',
        detalles: { advertencias },
      };
    }

    return {
      tipo: 'fecha',
      estado: 'aprobado',
      mensaje: 'Fechas validadas correctamente',
    };
  }

  /**
   * 7. Validación de cuota moderadora
   */
  private async validarCuotaModeradora(
    radicado: IRadicado,
    datosFactura: DatosFacturaPDF
  ): Promise<ResultadoValidacion> {
    logger.info('💳 Validando cuota moderadora');

    const cmo = datosFactura.cmo || radicado.cuotaModeradora?.valor || 0;

    if (cmo === 0) {
      return {
        tipo: 'cuota_moderadora',
        estado: 'aprobado',
        mensaje: 'No aplica cuota moderadora',
        detalles: { tiene: false },
      };
    }

    // Si tiene descuento, validar
    if (radicado.cuotaModeradora?.tieneDescuento) {
      return {
        tipo: 'cuota_moderadora',
        estado: 'aprobado',
        mensaje: 'Cuota moderadora con descuento aplicado',
        detalles: {
          tiene: true,
          valor: cmo,
          tieneDescuento: true,
          detalle: radicado.cuotaModeradora.detalleDescuento,
        },
      };
    }

    // Validar que coincida fecha de atención con la factura
    const fechaCoincide =
      datosFactura.fechaIngreso &&
      datosFactura.fechaFactura &&
      datosFactura.fechaIngreso === datosFactura.fechaFactura;

    return {
      tipo: 'cuota_moderadora',
      estado: fechaCoincide ? 'aprobado' : 'advertencia',
      mensaje: fechaCoincide
        ? 'Cuota moderadora válida'
        : 'Verificar coincidencia de fechas para cuota moderadora',
      detalles: {
        tiene: true,
        valor: cmo,
        fechaCoincide,
      },
    };
  }

  /**
   * Valida coincidencia de servicio (homologa primera vez con control)
   */
  private validarCoincidenciaServicio(codigoAutorizado?: string, codigoFacturado?: string): boolean {
    if (!codigoAutorizado || !codigoFacturado) {
      return false;
    }

    // Coincidencia exacta
    if (codigoAutorizado === codigoFacturado) {
      return true;
    }

    // Homologación: primera vez (890201) con control (890202)
    const consultaPrimeraVez = '890201';
    const consultaControl = '890202';

    if (
      (codigoAutorizado === consultaPrimeraVez && codigoFacturado === consultaControl) ||
      (codigoAutorizado === consultaControl && codigoFacturado === consultaPrimeraVez)
    ) {
      logger.info('✅ Servicio homologado: consulta primera vez ↔ consulta control');
      return true;
    }

    return false;
  }

  /**
   * Determina el estado general de todas las validaciones
   */
  private determinarEstadoGeneral(validaciones: ResultadoValidacion[]): ResultadoValidacionCompleta {
    const rechazadas = validaciones.filter((v) => v.estado === 'rechazado');
    const advertencias = validaciones.filter((v) => v.estado === 'advertencia');
    const aprobadas = validaciones.filter((v) => v.estado === 'aprobado');

    let estadoGeneral: 'aprobado' | 'rechazado' | 'advertencia';
    let requiereRevisionManual = false;
    let mensajeResumen = '';

    if (rechazadas.length > 0) {
      estadoGeneral = 'rechazado';
      requiereRevisionManual = true;
      mensajeResumen = `${rechazadas.length} validación(es) rechazada(s). Requiere revisión manual.`;
    } else if (advertencias.length > 0) {
      estadoGeneral = 'advertencia';
      requiereRevisionManual = advertencias.length > 2; // Más de 2 advertencias requiere revisión
      mensajeResumen = `${advertencias.length} advertencia(s). ${requiereRevisionManual ? 'Requiere revisión.' : 'Puede proceder con precaución.'}`;
    } else {
      estadoGeneral = 'aprobado';
      mensajeResumen = `Todas las validaciones aprobadas (${aprobadas.length}/${validaciones.length})`;
    }

    return {
      validaciones,
      estadoGeneral,
      requiereRevisionManual,
      mensajeResumen,
    };
  }
}

export default new ValidacionesAutomaticasService();
