import { ReglaFacturacion, IReglaFacturacion } from '../models/ReglaFacturacion';
import { DatosFacturaPDF } from './pdf-extractor.service';
import { GlosaCalculada } from './glosa-calculator.service';
import { logger } from '../utils/logger';

interface ResultadoEvaluacion {
  reglaAplicada: boolean;
  reglasAplicadas: Array<{
    reglaId: string;
    nombreRegla: string;
    accion: string;
    parametros?: any;
    valorAfectado?: number;
  }>;
  glosasFiltradas: GlosaCalculada[];
  validacionesOmitidas: string[];
  ajustesAplicados: Array<{
    tipo: string;
    valorOriginal: number;
    valorAjustado: number;
    motivo: string;
  }>;
  mensajes: string[];
}

interface ContextoEvaluacion {
  valor: number;
  valorIPS: number;
  valorContratado: number;
  codigoCUPS?: string;
  nombreProcedimiento?: string;
  autorizacion?: string;
  fechaServicio?: string;
  fechaAutorizacion?: string;
  diagnostico?: string;
  tipoDocumentoPaciente?: string;
  numeroDocumentoPaciente?: string;
  tipoAtencion?: string;
  rango?: number;
  glosas?: GlosaCalculada[];
}

class MotorReglasService {
  /**
   * Evalúa todas las reglas activas contra los datos de facturación
   */
  async evaluarReglas(
    datosFactura: DatosFacturaPDF,
    glosas: GlosaCalculada[],
    valorContratado: number
  ): Promise<ResultadoEvaluacion> {
    try {
      // Obtener reglas activas ordenadas por prioridad
      const reglas = await ReglaFacturacion.find({ activa: true }).sort({ prioridad: 1 });

      logger.info(`📋 Evaluando ${reglas.length} reglas activas`);

      const contexto: ContextoEvaluacion = this.construirContexto(datosFactura, glosas, valorContratado);

      const resultado: ResultadoEvaluacion = {
        reglaAplicada: false,
        reglasAplicadas: [],
        glosasFiltradas: [...glosas],
        validacionesOmitidas: [],
        ajustesAplicados: [],
        mensajes: [],
      };

      // Evaluar cada regla
      for (const regla of reglas) {
        const aplicada = await this.evaluarRegla(regla, contexto, resultado);

        if (aplicada) {
          resultado.reglaAplicada = true;

          // Actualizar estadísticas de la regla
          await this.actualizarEstadisticasRegla(regla, contexto.valor);
        }
      }

      logger.info(
        `✅ Evaluación completada: ${resultado.reglasAplicadas.length} reglas aplicadas, ` +
          `${resultado.glosasFiltradas.length} glosas después de filtrado`
      );

      return resultado;
    } catch (error: any) {
      logger.error('❌ Error evaluando reglas:', error);
      throw error;
    }
  }

  /**
   * Construye el contexto de evaluación a partir de los datos de factura
   */
  private construirContexto(
    datosFactura: DatosFacturaPDF,
    glosas: GlosaCalculada[],
    valorContratado: number
  ): ContextoEvaluacion {
    // Determinar tipo de atención
    let tipoAtencion = 'consulta externa';
    const nombreProc = (datosFactura.nombreProcedimiento || '').toLowerCase();

    if (nombreProc.includes('urgencia')) {
      tipoAtencion = 'urgencias';
    } else if (nombreProc.includes('hospitalizacion') || nombreProc.includes('hospitalario')) {
      tipoAtencion = 'hospitalización';
    } else if (nombreProc.includes('quirurgico') || nombreProc.includes('cirugia')) {
      tipoAtencion = 'quirúrgico';
    }

    return {
      valor: datosFactura.valorIPS || 0,
      valorIPS: datosFactura.valorIPS || 0,
      valorContratado: valorContratado,
      codigoCUPS: datosFactura.codigoProcedimiento,
      nombreProcedimiento: datosFactura.nombreProcedimiento,
      autorizacion: datosFactura.autorizacion,
      fechaServicio: datosFactura.fechaIngreso || datosFactura.fechaFactura,
      fechaAutorizacion: undefined, // Podría venir de otro lugar
      diagnostico: datosFactura.diagnosticoPrincipal,
      tipoDocumentoPaciente: datosFactura.tipoDocumentoPaciente,
      numeroDocumentoPaciente: datosFactura.numeroDocumento,
      tipoAtencion: tipoAtencion,
      rango: this.calcularRango(datosFactura.valorIPS || 0),
      glosas: glosas,
    };
  }

  /**
   * Calcula el rango de valor según los criterios definidos
   */
  private calcularRango(valor: number): number {
    if (valor < 100000) return 1;
    if (valor >= 100000 && valor < 500000) return 2;
    if (valor >= 500000 && valor < 1000000) return 3;
    return 4;
  }

  /**
   * Evalúa una regla específica
   */
  private async evaluarRegla(
    regla: IReglaFacturacion,
    contexto: ContextoEvaluacion,
    resultado: ResultadoEvaluacion
  ): Promise<boolean> {
    try {
      // Verificar si la regla aplica al ámbito actual
      if (!this.verificarAmbito(regla, contexto)) {
        return false;
      }

      // Verificar si la regla tiene interpretación IA
      if (!regla.reglaInterpretada || !regla.reglaInterpretada.condiciones) {
        logger.warn(`⚠️ Regla "${regla.nombre}" no tiene interpretación IA, se omite`);
        return false;
      }

      // Evaluar todas las condiciones (todas deben cumplirse - AND)
      const todasCondicionesCumplen = regla.reglaInterpretada.condiciones.every((condicion) =>
        this.evaluarCondicion(condicion, contexto)
      );

      if (!todasCondicionesCumplen) {
        return false;
      }

      // Aplicar la acción
      logger.info(`✅ Regla "${regla.nombre}" APLICADA`);

      this.aplicarAccion(regla, contexto, resultado);

      resultado.reglasAplicadas.push({
        reglaId: regla.id,
        nombreRegla: regla.nombre,
        accion: regla.reglaInterpretada.accion.tipo,
        parametros: regla.reglaInterpretada.accion.parametros,
        valorAfectado: contexto.valor,
      });

      resultado.mensajes.push(
        `📌 Regla aplicada: "${regla.nombre}" - ${regla.reglaInterpretada.accion.tipo}`
      );

      return true;
    } catch (error: any) {
      logger.error(`❌ Error evaluando regla "${regla.nombre}":`, error);
      return false;
    }
  }

  /**
   * Verifica si la regla aplica al ámbito actual
   */
  private verificarAmbito(regla: IReglaFacturacion, contexto: ContextoEvaluacion): boolean {
    if (regla.ambito.tipo === 'global') {
      return true;
    }

    if (regla.ambito.tipo === 'servicio' && regla.ambito.valor) {
      return contexto.codigoCUPS === regla.ambito.valor;
    }

    if (regla.ambito.tipo === 'rango_valor' && regla.ambito.valor) {
      const rangoRegla = parseInt(regla.ambito.valor);
      return contexto.rango === rangoRegla;
    }

    if (regla.ambito.tipo === 'tipo_atencion' && regla.ambito.valor) {
      return contexto.tipoAtencion === regla.ambito.valor;
    }

    return true;
  }

  /**
   * Evalúa una condición específica
   */
  private evaluarCondicion(
    condicion: {
      campo: string;
      operador: string;
      valor: any;
      valorMax?: any;
    },
    contexto: ContextoEvaluacion
  ): boolean {
    const valorCampo = this.obtenerValorCampo(condicion.campo, contexto);

    switch (condicion.operador) {
      case 'menor':
        return this.compararNumerico(valorCampo) < this.compararNumerico(condicion.valor);

      case 'mayor':
        return this.compararNumerico(valorCampo) > this.compararNumerico(condicion.valor);

      case 'igual':
        return valorCampo === condicion.valor;

      case 'contiene':
        if (typeof valorCampo === 'string') {
          return valorCampo.toLowerCase().includes(String(condicion.valor).toLowerCase());
        }
        return false;

      case 'entre':
        const numValor = this.compararNumerico(valorCampo);
        return (
          numValor >= this.compararNumerico(condicion.valor) &&
          numValor <= this.compararNumerico(condicion.valorMax)
        );

      case 'existe':
        return valorCampo !== null && valorCampo !== undefined && valorCampo !== '';

      case 'no_existe':
        return valorCampo === null || valorCampo === undefined || valorCampo === '';

      default:
        logger.warn(`⚠️ Operador desconocido: ${condicion.operador}`);
        return false;
    }
  }

  /**
   * Obtiene el valor de un campo del contexto
   */
  private obtenerValorCampo(campo: string, contexto: ContextoEvaluacion): any {
    return (contexto as any)[campo];
  }

  /**
   * Convierte un valor a número para comparación
   */
  private compararNumerico(valor: any): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') return parseFloat(valor.replace(/[^0-9.-]/g, ''));
    return 0;
  }

  /**
   * Aplica la acción de una regla
   */
  private aplicarAccion(
    regla: IReglaFacturacion,
    contexto: ContextoEvaluacion,
    resultado: ResultadoEvaluacion
  ): void {
    const accion = regla.reglaInterpretada!.accion;

    switch (accion.tipo) {
      case 'ignorar_glosa':
        this.aplicarIgnorarGlosa(regla, contexto, resultado);
        break;

      case 'no_validar_autorizacion':
        this.aplicarNoValidarAutorizacion(regla, contexto, resultado);
        break;

      case 'ajustar_valor':
        this.aplicarAjustarValor(regla, contexto, resultado, accion.parametros);
        break;

      case 'homologar_servicio':
        this.aplicarHomologarServicio(regla, contexto, resultado, accion.parametros);
        break;

      case 'aceptar_fecha':
        this.aplicarAceptarFecha(regla, contexto, resultado, accion.parametros);
        break;

      default:
        logger.warn(`⚠️ Tipo de acción desconocido: ${accion.tipo}`);
    }
  }

  /**
   * ACCIÓN: Ignorar glosa
   */
  private aplicarIgnorarGlosa(
    regla: IReglaFacturacion,
    contexto: ContextoEvaluacion,
    resultado: ResultadoEvaluacion
  ): void {
    // Filtrar glosas relacionadas con este servicio/valor
    const glosasFiltradas = resultado.glosasFiltradas.filter((glosa) => {
      // Si la glosa afecta al mismo código o valor, la removemos
      if (glosa.codigo === contexto.codigoCUPS || glosa.valorTotalGlosa <= contexto.valor) {
        logger.info(`🗑️ Glosa removida por regla "${regla.nombre}": ${glosa.observacion}`);
        return false;
      }
      return true;
    });

    const glosasRemovidas = resultado.glosasFiltradas.length - glosasFiltradas.length;

    if (glosasRemovidas > 0) {
      resultado.glosasFiltradas = glosasFiltradas;
      resultado.mensajes.push(`🗑️ ${glosasRemovidas} glosa(s) ignorada(s) por la regla`);
    }
  }

  /**
   * ACCIÓN: No validar autorización
   */
  private aplicarNoValidarAutorizacion(
    regla: IReglaFacturacion,
    contexto: ContextoEvaluacion,
    resultado: ResultadoEvaluacion
  ): void {
    resultado.validacionesOmitidas.push('autorizacion');
    resultado.mensajes.push('✅ Validación de autorización omitida por regla');
  }

  /**
   * ACCIÓN: Ajustar valor
   */
  private aplicarAjustarValor(
    regla: IReglaFacturacion,
    contexto: ContextoEvaluacion,
    resultado: ResultadoEvaluacion,
    parametros: any
  ): void {
    if (!parametros || !parametros.porcentajePermitido) {
      logger.warn('⚠️ Acción ajustar_valor sin porcentajePermitido');
      return;
    }

    const porcentaje = parametros.porcentajePermitido;
    const direccion = parametros.direccion || 'superior';
    const valorOriginal = contexto.valorContratado;

    let valorAjustado = valorOriginal;

    if (direccion === 'superior') {
      valorAjustado = valorOriginal * (1 + porcentaje / 100);
    } else if (direccion === 'inferior') {
      valorAjustado = valorOriginal * (1 - porcentaje / 100);
    } else if (direccion === 'ambos') {
      // Verificar si está dentro del rango
      const min = valorOriginal * (1 - porcentaje / 100);
      const max = valorOriginal * (1 + porcentaje / 100);
      if (contexto.valorIPS >= min && contexto.valorIPS <= max) {
        valorAjustado = contexto.valorIPS;
      }
    }

    resultado.ajustesAplicados.push({
      tipo: 'ajuste_porcentaje',
      valorOriginal: valorOriginal,
      valorAjustado: valorAjustado,
      motivo: `Regla "${regla.nombre}": ±${porcentaje}% permitido`,
    });

    resultado.mensajes.push(
      `💰 Valor ajustado: $${valorOriginal.toLocaleString()} → $${valorAjustado.toLocaleString()}`
    );
  }

  /**
   * ACCIÓN: Homologar servicio
   */
  private aplicarHomologarServicio(
    regla: IReglaFacturacion,
    contexto: ContextoEvaluacion,
    resultado: ResultadoEvaluacion,
    parametros: any
  ): void {
    if (!parametros || !parametros.codigoDestino) {
      logger.warn('⚠️ Acción homologar_servicio sin codigoDestino');
      return;
    }

    resultado.mensajes.push(
      `🔄 Servicio homologado: ${contexto.codigoCUPS} → ${parametros.codigoDestino} (${parametros.nombreDestino || 'N/A'})`
    );

    // Aquí podrías modificar el contexto para usar el código destino en validaciones posteriores
    // Pero como estamos en evaluación, solo registramos la acción
  }

  /**
   * ACCIÓN: Aceptar fecha
   */
  private aplicarAceptarFecha(
    regla: IReglaFacturacion,
    contexto: ContextoEvaluacion,
    resultado: ResultadoEvaluacion,
    parametros: any
  ): void {
    resultado.validacionesOmitidas.push('validacion_fecha');
    resultado.mensajes.push('📅 Validación de fechas flexibilizada por regla');
  }

  /**
   * Actualiza las estadísticas de una regla aplicada
   */
  private async actualizarEstadisticasRegla(regla: IReglaFacturacion, valorAfectado: number): Promise<void> {
    try {
      regla.estadisticas.vecesAplicada += 1;
      regla.estadisticas.ultimaAplicacion = new Date();
      regla.estadisticas.montoTotalAfectado += valorAfectado;

      if (regla.tipo === 'glosa') {
        regla.estadisticas.glosasEvitadas += 1;
      }

      await regla.save();
    } catch (error) {
      logger.error('Error actualizando estadísticas de regla:', error);
    }
  }
}

export default new MotorReglasService();
