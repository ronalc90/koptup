import axios, { AxiosRequestConfig } from 'axios';
import { ConfiguracionEndpoints, IEndpointConfig } from '../models/ConfiguracionEndpoints';
import { logger } from '../utils/logger';

interface ConsultaResult {
  exitosa: boolean;
  datos?: any;
  error?: string;
  codigoEstado?: number;
  tiempoRespuesta?: number;
}

class EndpointExternoService {
  /**
   * Consulta un endpoint externo configurado
   */
  async consultarEndpoint(
    tipoEndpoint: 'onbase' | 'nueva_eps' | 'aciel' | 'consulta_seps' | 'intranet' | 'otro',
    parametros: Record<string, any>,
    entidad?: string
  ): Promise<ConsultaResult> {
    try {
      const inicio = Date.now();

      // Obtener configuración activa del endpoint
      const config = await this.obtenerConfiguracionEndpoint(tipoEndpoint, entidad);

      if (!config) {
        return {
          exitosa: false,
          error: `No se encontró configuración activa para endpoint tipo: ${tipoEndpoint}`,
        };
      }

      logger.info(`🌐 Consultando endpoint ${config.nombre}: ${config.url}`);

      // Construir la solicitud
      const requestConfig = this.construirSolicitud(config, parametros);

      // Realizar la consulta con reintentos
      const resultado = await this.consultarConReintentos(requestConfig, config.reintentos || 3);

      const tiempoRespuesta = Date.now() - inicio;

      logger.info(
        `✅ Respuesta de ${config.nombre} en ${tiempoRespuesta}ms - Status: ${resultado.status}`
      );

      return {
        exitosa: resultado.status >= 200 && resultado.status < 300,
        datos: resultado.data,
        codigoEstado: resultado.status,
        tiempoRespuesta,
      };
    } catch (error: any) {
      logger.error(`❌ Error consultando endpoint externo:`, error);

      return {
        exitosa: false,
        error: error.message || 'Error desconocido al consultar endpoint',
        codigoEstado: error.response?.status,
      };
    }
  }

  /**
   * Busca documentos en OnBase por radicado, NIT o factura
   */
  async buscarEnOnBase(criterios: {
    radicado?: string;
    nit?: string;
    numeroFactura?: string;
  }): Promise<ConsultaResult> {
    logger.info(`🔍 Buscando en OnBase:`, criterios);

    const resultado = await this.consultarEndpoint('onbase', criterios);

    if (resultado.exitosa && resultado.datos) {
      // Procesar respuesta de OnBase
      resultado.datos = this.procesarRespuestaOnBase(resultado.datos);
    }

    return resultado;
  }

  /**
   * Consulta autorización en Nueva EPS
   */
  async consultarAutorizacionNuevaEPS(parametros: {
    numeroAutorizacion?: string;
    cedulaPaciente?: string;
    codigoCUPS?: string;
    sucursal?: number;
  }): Promise<ConsultaResult> {
    logger.info(`🏥 Consultando autorización en Nueva EPS:`, parametros);

    // Intentar con sucursal 1, luego con sucursal 2 si falla
    const sucursales = parametros.sucursal ? [parametros.sucursal] : [1, 2];

    for (const sucursal of sucursales) {
      logger.info(`📍 Intentando con sucursal ${sucursal}`);

      const resultado = await this.consultarEndpoint('nueva_eps', {
        ...parametros,
        sucursal,
      });

      if (resultado.exitosa && resultado.datos) {
        // Procesar respuesta de Nueva EPS
        resultado.datos = this.procesarRespuestaNuevaEPS(resultado.datos);
        logger.info(`✅ Autorización encontrada en sucursal ${sucursal}`);
        return resultado;
      }
    }

    return {
      exitosa: false,
      error: 'No se encontró la autorización en ninguna sucursal',
    };
  }

  /**
   * Consulta factura en AcielColombia/Intranet
   */
  async consultarFacturaAciel(criterios: {
    numeroFactura: string;
    nit?: string;
  }): Promise<ConsultaResult> {
    logger.info(`📄 Consultando factura en AcielColombia:`, criterios);

    return await this.consultarEndpoint('aciel', criterios);
  }

  /**
   * Obtiene configuración de endpoint desde la BD
   */
  private async obtenerConfiguracionEndpoint(
    tipo: string,
    entidad?: string
  ): Promise<IEndpointConfig | null> {
    try {
      const query: any = { activa: true };

      if (entidad) {
        query.entidadAsociada = entidad;
      }

      const configuracion = await ConfiguracionEndpoints.findOne(query);

      if (!configuracion) {
        logger.warn(`⚠️ No se encontró configuración para ${tipo}`);
        return null;
      }

      // Buscar el endpoint específico del tipo solicitado
      const endpoint = configuracion.endpoints.find((ep) => ep.tipo === tipo && ep.activo);

      if (!endpoint) {
        logger.warn(`⚠️ No se encontró endpoint activo tipo ${tipo} en configuración`);
        return null;
      }

      return endpoint;
    } catch (error) {
      logger.error('Error obteniendo configuración de endpoint:', error);
      return null;
    }
  }

  /**
   * Construye la configuración de la solicitud HTTP
   */
  private construirSolicitud(
    config: IEndpointConfig,
    parametros: Record<string, any>
  ): AxiosRequestConfig {
    const requestConfig: AxiosRequestConfig = {
      method: config.metodo,
      url: config.url,
      timeout: config.timeout || 30000,
      headers: this.construirHeaders(config),
    };

    // Agregar parámetros según el método
    if (config.metodo === 'GET') {
      requestConfig.params = this.mapearParametros(config, parametros);
    } else {
      requestConfig.data = this.mapearParametros(config, parametros);
    }

    return requestConfig;
  }

  /**
   * Construye headers incluyendo autenticación
   */
  private construirHeaders(config: IEndpointConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Agregar autenticación
    if (config.autenticacion) {
      switch (config.autenticacion.tipo) {
        case 'bearer':
          if (config.autenticacion.credenciales?.token) {
            headers['Authorization'] = `Bearer ${config.autenticacion.credenciales.token}`;
          }
          break;

        case 'basic':
          if (
            config.autenticacion.credenciales?.username &&
            config.autenticacion.credenciales?.password
          ) {
            const auth = Buffer.from(
              `${config.autenticacion.credenciales.username}:${config.autenticacion.credenciales.password}`
            ).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
          }
          break;

        case 'api_key':
          if (config.autenticacion.credenciales?.apiKey) {
            headers['X-API-Key'] = config.autenticacion.credenciales.apiKey;
          }
          break;

        case 'custom':
          if (config.autenticacion.credenciales?.customHeaders) {
            Object.assign(headers, config.autenticacion.credenciales.customHeaders);
          }
          break;
      }
    }

    return headers;
  }

  /**
   * Mapea parámetros según la configuración del endpoint
   */
  private mapearParametros(
    config: IEndpointConfig,
    parametros: Record<string, any>
  ): Record<string, any> {
    const mapped: Record<string, any> = {};

    if (!config.parametrosConsulta) {
      return parametros; // Sin mapeo, usar parámetros tal cual
    }

    // Mapear campos específicos
    if (parametros.radicado && config.parametrosConsulta.campoRadicado) {
      mapped[config.parametrosConsulta.campoRadicado] = parametros.radicado;
    }

    if (parametros.nit && config.parametrosConsulta.campoNIT) {
      mapped[config.parametrosConsulta.campoNIT] = parametros.nit;
    }

    if (parametros.numeroFactura && config.parametrosConsulta.campoFactura) {
      mapped[config.parametrosConsulta.campoFactura] = parametros.numeroFactura;
    }

    // Agregar otros parámetros que no estén mapeados
    Object.keys(parametros).forEach((key) => {
      if (!['radicado', 'nit', 'numeroFactura'].includes(key)) {
        mapped[key] = parametros[key];
      }
    });

    return mapped;
  }

  /**
   * Consulta con reintentos exponenciales
   */
  private async consultarConReintentos(
    config: AxiosRequestConfig,
    maxReintentos: number
  ): Promise<any> {
    let ultimoError: any;

    for (let intento = 1; intento <= maxReintentos; intento++) {
      try {
        logger.info(`📡 Intento ${intento}/${maxReintentos} - ${config.method} ${config.url}`);

        const response = await axios(config);
        return response;
      } catch (error: any) {
        ultimoError = error;

        if (intento < maxReintentos) {
          // Esperar antes del siguiente intento (backoff exponencial)
          const tiempoEspera = Math.pow(2, intento) * 1000; // 2s, 4s, 8s...
          logger.warn(`⚠️ Error en intento ${intento}, reintentando en ${tiempoEspera}ms...`);
          await this.esperar(tiempoEspera);
        }
      }
    }

    // Si llegamos aquí, fallaron todos los intentos
    throw ultimoError;
  }

  /**
   * Espera un tiempo determinado
   */
  private esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Procesa la respuesta de OnBase
   */
  private procesarRespuestaOnBase(datos: any): any {
    // Aquí puedes adaptar la respuesta según el formato de OnBase
    if (Array.isArray(datos)) {
      return datos.map((doc) => ({
        id: doc.id || doc.documentId,
        nombre: doc.name || doc.documentName,
        tipo: doc.type || doc.documentType,
        url: doc.url || doc.viewUrl,
        fecha: doc.date || doc.createdDate,
        metadata: doc.metadata || {},
      }));
    }

    return datos;
  }

  /**
   * Procesa la respuesta de Nueva EPS
   */
  private procesarRespuestaNuevaEPS(datos: any): any {
    // Adaptar según el formato de respuesta de Nueva EPS
    return {
      autorizacionEncontrada: true,
      numeroAutorizacion: datos.numeroAutorizacion || datos.numero,
      estado: datos.estado || datos.status,
      servicioAutorizado: datos.servicio || datos.service,
      codigoCUPS: datos.codigoCUPS || datos.cups,
      diagnostico: datos.diagnostico || datos.diagnosis,
      fechaAutorizacion: datos.fechaAutorizacion || datos.fecha,
      fechaVencimiento: datos.fechaVencimiento || datos.expiration,
      cantidadAutorizada: datos.cantidad || datos.quantity,
      valorAutorizado: datos.valor || datos.amount,
      paciente: {
        nombre: datos.paciente?.nombre || datos.patientName,
        documento: datos.paciente?.documento || datos.patientId,
      },
      original: datos, // Guardar respuesta original
    };
  }

  /**
   * Valida si una autorización está vigente
   */
  validarVigenciaAutorizacion(autorizacion: any, fechaServicio: Date): boolean {
    if (!autorizacion.fechaVencimiento) {
      logger.warn('⚠️ Autorización sin fecha de vencimiento');
      return true; // Si no hay fecha de vencimiento, asumimos que es válida
    }

    const fechaVenc = new Date(autorizacion.fechaVencimiento);
    const vigente = fechaServicio <= fechaVenc;

    if (!vigente) {
      logger.warn(
        `⚠️ Autorización vencida: servicio ${fechaServicio.toISOString()} > vencimiento ${fechaVenc.toISOString()}`
      );
    }

    return vigente;
  }
}

export default new EndpointExternoService();
