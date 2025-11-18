/**
 * Motor de Reglas del Sistema Experto
 *
 * Implementa las reglas de negocio para detección automática de glosas
 * en cuentas médicas.
 */

import {
  CodigoGlosa,
  GLOSAS_DESCRIPCION,
  ContextoValidacion,
  ResultadoRegla,
  ReglaValidacion,
  ConfiguracionSistemaExperto,
} from '../types/expert-system.types';
import { logger } from '../utils/logger';

// ============================================================================
// CONFIGURACIÓN POR DEFECTO DEL SISTEMA EXPERTO
// ============================================================================

export const CONFIG_DEFECTO: ConfiguracionSistemaExperto = {
  toleranciaDiferenciaTarifa: 5, // 5% de tolerancia
  manualesTarifarios: ['ISS2001', 'ISS2004', 'SOAT'],
  manualPorDefecto: 'ISS2004',
  reglasHabilitadas: Object.values(CodigoGlosa),
  validarCoherenciaClinica: true,
  requiereAutorizacion: true,
  cacheCUPS: true,
};

// ============================================================================
// REGLAS DE VALIDACIÓN
// ============================================================================

/**
 * REGLA 101: Falta autorización
 */
const REGLA_FALTA_AUTORIZACION: ReglaValidacion = {
  codigo: CodigoGlosa.FALTA_AUTORIZACION,
  nombre: 'Falta Autorización',
  descripcion: 'Verifica que los servicios que requieren autorización la tengan',
  severidad: 'CRITICA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    const { procedimiento, autorizacion, cupsEnBD } = ctx;

    // Si el CUPS requiere autorización y no hay autorización
    const requiereAuth = cupsEnBD?.metadata?.requiereAutorizacion ?? false;

    if (requiereAuth && !autorizacion) {
      return {
        cumple: false,
        glosa: {
          codigo: CodigoGlosa.FALTA_AUTORIZACION,
          descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.FALTA_AUTORIZACION],
          valorGlosado: procedimiento.valorIPS || procedimiento.valorTotal || 0,
          observaciones: `El procedimiento ${procedimiento.codigoCUPS} requiere autorización previa`,
        },
      };
    }

    return { cumple: true };
  },
};

/**
 * REGLA 102: Diferencia de tarifa
 */
const REGLA_DIFERENCIA_TARIFA: ReglaValidacion = {
  codigo: CodigoGlosa.DIFERENCIA_TARIFA,
  nombre: 'Diferencia de Tarifa',
  descripcion: 'Detecta cuando el valor cobrado difiere del contratado',
  severidad: 'ALTA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    const { procedimiento, tarifaContratada } = ctx;

    if (!tarifaContratada) {
      return { cumple: true }; // No se puede validar sin tarifa
    }

    const valorCobrado = procedimiento.valorIPS || procedimiento.valorUnitario || 0;
    const diferencia = Math.abs(valorCobrado - tarifaContratada);
    const porcentajeDiferencia = (diferencia / tarifaContratada) * 100;

    // Si la diferencia supera la tolerancia
    if (porcentajeDiferencia > CONFIG_DEFECTO.toleranciaDiferenciaTarifa) {
      const cantidad = procedimiento.cantidad || 1;
      const valorGlosado = diferencia * cantidad;

      return {
        cumple: false,
        glosa: {
          codigo: CodigoGlosa.DIFERENCIA_TARIFA,
          descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.DIFERENCIA_TARIFA],
          valorGlosado,
          observaciones: `Diferencia del ${porcentajeDiferencia.toFixed(
            2
          )}% entre valor cobrado ($${valorCobrado.toLocaleString()}) y contratado ($${tarifaContratada.toLocaleString()})`,
        },
      };
    }

    return { cumple: true };
  },
};

/**
 * REGLA 201: Código CUPS inválido
 */
const REGLA_CUPS_INVALIDO: ReglaValidacion = {
  codigo: CodigoGlosa.CUPS_INVALIDO,
  nombre: 'CUPS Inválido',
  descripcion: 'Verifica que el código CUPS exista en el catálogo oficial',
  severidad: 'CRITICA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    const { procedimiento, cupsEnBD } = ctx;

    // Si no se encontró el CUPS en BD
    if (!cupsEnBD) {
      return {
        cumple: false,
        glosa: {
          codigo: CodigoGlosa.CUPS_INVALIDO,
          descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.CUPS_INVALIDO],
          valorGlosado: procedimiento.valorIPS || procedimiento.valorTotal || 0,
          observaciones: `Código CUPS ${procedimiento.codigoCUPS} no encontrado en catálogo oficial SISPRO`,
        },
      };
    }

    // Verificar que esté activo
    if (cupsEnBD.activo === false) {
      return {
        cumple: false,
        glosa: {
          codigo: CodigoGlosa.CUPS_INVALIDO,
          descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.CUPS_INVALIDO],
          valorGlosado: procedimiento.valorIPS || procedimiento.valorTotal || 0,
          observaciones: `Código CUPS ${procedimiento.codigoCUPS} está inactivo en el catálogo`,
        },
      };
    }

    return { cumple: true };
  },
};

/**
 * REGLA 202: Autorización incompleta o vencida
 */
const REGLA_AUTORIZACION_INCOMPLETA: ReglaValidacion = {
  codigo: CodigoGlosa.AUTORIZACION_INCOMPLETA,
  nombre: 'Autorización Incompleta',
  descripcion: 'Verifica que la autorización esté completa y vigente',
  severidad: 'ALTA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    const { procedimiento, autorizacion } = ctx;

    if (!autorizacion) {
      return { cumple: true }; // Se valida con REGLA_FALTA_AUTORIZACION
    }

    // Verificar campos requeridos
    const camposFaltantes: string[] = [];
    if (!autorizacion.numero) camposFaltantes.push('número de autorización');
    if (!autorizacion.fecha) camposFaltantes.push('fecha de autorización');
    if (!autorizacion.vigencia) camposFaltantes.push('vigencia');

    if (camposFaltantes.length > 0) {
      return {
        cumple: false,
        glosa: {
          codigo: CodigoGlosa.AUTORIZACION_INCOMPLETA,
          descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.AUTORIZACION_INCOMPLETA],
          valorGlosado: procedimiento.valorIPS || procedimiento.valorTotal || 0,
          observaciones: `Autorización incompleta. Faltan: ${camposFaltantes.join(', ')}`,
        },
      };
    }

    // Verificar vigencia
    if (autorizacion.vigencia) {
      const fechaVigencia = new Date(autorizacion.vigencia);
      const fechaServicio = procedimiento.fecha ? new Date(procedimiento.fecha) : new Date();

      if (fechaServicio > fechaVigencia) {
        return {
          cumple: false,
          glosa: {
            codigo: CodigoGlosa.AUTORIZACION_VENCIDA,
            descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.AUTORIZACION_VENCIDA],
            valorGlosado: procedimiento.valorIPS || procedimiento.valorTotal || 0,
            observaciones: `Autorización vencida. Vigencia: ${fechaVigencia.toLocaleDateString()}, Servicio: ${fechaServicio.toLocaleDateString()}`,
          },
        };
      }
    }

    return { cumple: true };
  },
};

/**
 * REGLA 301: Incoherencia diagnóstico-procedimiento
 */
const REGLA_INCOHERENCIA_DIAGNOSTICO: ReglaValidacion = {
  codigo: CodigoGlosa.INCOHERENCIA_DIAGNOSTICO,
  nombre: 'Incoherencia Clínica',
  descripcion: 'Valida coherencia entre diagnóstico y procedimiento',
  severidad: 'MEDIA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    const { procedimiento, diagnosticos, cupsEnBD } = ctx;

    if (!diagnosticos || diagnosticos.length === 0) {
      return { cumple: true }; // No se puede validar sin diagnósticos
    }

    // Reglas básicas de coherencia
    const codigoDiag = diagnosticos[0]?.codigoCIE10 || '';
    const codigoCUPS = procedimiento.codigoCUPS || '';
    const especialidad = cupsEnBD?.especialidad || '';

    // Ejemplos de incoherencias obvias
    const incoherencias = [
      // Procedimientos de ortopedia con diagnósticos de cardiología
      {
        cups: /^0[0-9]{5}/, // Capítulo 01 - Sistema Nervioso
        diag: /^I[0-9]{2}/, // Capítulo I - Enfermedades del sistema circulatorio
        mensaje: 'Procedimiento de sistema nervioso con diagnóstico cardiovascular',
      },
      // Procedimientos obstétricos en hombres
      {
        cups: /^74[0-9]{4}/, // Procedimientos obstétricos
        genero: 'M',
        mensaje: 'Procedimiento obstétrico en paciente masculino',
      },
    ];

    for (const regla of incoherencias) {
      if (regla.cups && regla.cups.test(codigoCUPS)) {
        if (regla.diag && regla.diag.test(codigoDiag)) {
          return {
            cumple: false,
            glosa: {
              codigo: CodigoGlosa.INCOHERENCIA_DIAGNOSTICO,
              descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.INCOHERENCIA_DIAGNOSTICO],
              valorGlosado: 0, // No se glosa automáticamente, requiere revisión
              observaciones: regla.mensaje,
            },
          };
        }
      }
    }

    return { cumple: true };
  },
};

/**
 * REGLA 303: Duplicidad de servicios
 */
const REGLA_DUPLICIDAD_SERVICIOS: ReglaValidacion = {
  codigo: CodigoGlosa.DUPLICIDAD_SERVICIOS,
  nombre: 'Duplicidad de Servicios',
  descripcion: 'Detecta servicios duplicados en la misma atención',
  severidad: 'ALTA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    // Esta regla se aplica a nivel de atención completa, no por procedimiento individual
    // Se implementa en el servicio principal
    return { cumple: true };
  },
};

/**
 * REGLA 401: Valor superior al contratado
 */
const REGLA_VALOR_SUPERIOR_CONTRATADO: ReglaValidacion = {
  codigo: CodigoGlosa.VALOR_SUPERIOR_CONTRATADO,
  nombre: 'Valor Superior al Contratado',
  descripcion: 'Detecta cuando el valor cobrado supera el contratado',
  severidad: 'CRITICA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    const { procedimiento, tarifaContratada } = ctx;

    if (!tarifaContratada) {
      return { cumple: true };
    }

    const valorCobrado = procedimiento.valorIPS || procedimiento.valorUnitario || 0;

    if (valorCobrado > tarifaContratada) {
      const cantidad = procedimiento.cantidad || 1;
      const diferencia = valorCobrado - tarifaContratada;
      const valorGlosado = diferencia * cantidad;

      return {
        cumple: false,
        glosa: {
          codigo: CodigoGlosa.VALOR_SUPERIOR_CONTRATADO,
          descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.VALOR_SUPERIOR_CONTRATADO],
          valorGlosado,
          observaciones: `Valor cobrado ($${valorCobrado.toLocaleString()}) superior al contratado ($${tarifaContratada.toLocaleString()})`,
        },
      };
    }

    return { cumple: true };
  },
};

/**
 * REGLA 402: Cantidad excede lo autorizado
 */
const REGLA_CANTIDAD_EXCEDE_AUTORIZADO: ReglaValidacion = {
  codigo: CodigoGlosa.CANTIDAD_EXCEDE_AUTORIZADO,
  nombre: 'Cantidad Excede Autorizado',
  descripcion: 'Detecta cuando la cantidad facturada excede la autorizada',
  severidad: 'ALTA',

  validar: (ctx: ContextoValidacion): ResultadoRegla => {
    const { procedimiento, autorizacion } = ctx;

    if (!autorizacion || !autorizacion.cantidadAutorizada) {
      return { cumple: true };
    }

    const cantidadCobrada = procedimiento.cantidad || 1;
    const cantidadAutorizada = autorizacion.cantidadAutorizada;

    if (cantidadCobrada > cantidadAutorizada) {
      const valorUnitario = procedimiento.valorIPS || procedimiento.valorUnitario || 0;
      const cantidadExcedida = cantidadCobrada - cantidadAutorizada;
      const valorGlosado = cantidadExcedida * valorUnitario;

      return {
        cumple: false,
        glosa: {
          codigo: CodigoGlosa.CANTIDAD_EXCEDE_AUTORIZADO,
          descripcion: GLOSAS_DESCRIPCION[CodigoGlosa.CANTIDAD_EXCEDE_AUTORIZADO],
          valorGlosado,
          observaciones: `Cantidad facturada (${cantidadCobrada}) excede autorizada (${cantidadAutorizada}). Exceso: ${cantidadExcedida} unidades`,
        },
      };
    }

    return { cumple: true };
  },
};

// ============================================================================
// MOTOR DE REGLAS
// ============================================================================

export class MotorReglasExperto {
  private reglas: Map<CodigoGlosa, ReglaValidacion> = new Map();
  private config: ConfiguracionSistemaExperto;

  constructor(config: ConfiguracionSistemaExperto = CONFIG_DEFECTO) {
    this.config = config;
    this.inicializarReglas();
  }

  /**
   * Inicializa todas las reglas disponibles
   */
  private inicializarReglas(): void {
    const reglasDisponibles = [
      REGLA_FALTA_AUTORIZACION,
      REGLA_DIFERENCIA_TARIFA,
      REGLA_CUPS_INVALIDO,
      REGLA_AUTORIZACION_INCOMPLETA,
      REGLA_INCOHERENCIA_DIAGNOSTICO,
      REGLA_DUPLICIDAD_SERVICIOS,
      REGLA_VALOR_SUPERIOR_CONTRATADO,
      REGLA_CANTIDAD_EXCEDE_AUTORIZADO,
    ];

    for (const regla of reglasDisponibles) {
      if (this.config.reglasHabilitadas.includes(regla.codigo)) {
        this.reglas.set(regla.codigo, regla);
        logger.info(`Regla habilitada: ${regla.nombre} (${regla.codigo})`);
      }
    }
  }

  /**
   * Valida un procedimiento contra todas las reglas habilitadas
   */
  public validarProcedimiento(contexto: ContextoValidacion): ResultadoRegla[] {
    const resultados: ResultadoRegla[] = [];

    for (const [codigo, regla] of this.reglas) {
      try {
        const resultado = regla.validar(contexto);
        if (!resultado.cumple) {
          resultados.push(resultado);
          logger.warn(`Glosa detectada: ${regla.nombre} - ${resultado.glosa?.observaciones}`);
        }
      } catch (error) {
        logger.error(`Error ejecutando regla ${codigo}:`, error);
      }
    }

    return resultados;
  }

  /**
   * Obtiene una regla específica
   */
  public obtenerRegla(codigo: CodigoGlosa): ReglaValidacion | undefined {
    return this.reglas.get(codigo);
  }

  /**
   * Habilita o deshabilita una regla
   */
  public configurarRegla(codigo: CodigoGlosa, habilitada: boolean): void {
    if (habilitada) {
      this.config.reglasHabilitadas.push(codigo);
    } else {
      this.config.reglasHabilitadas = this.config.reglasHabilitadas.filter((c) => c !== codigo);
    }
    this.inicializarReglas();
  }

  /**
   * Actualiza la configuración del sistema
   */
  public actualizarConfiguracion(config: Partial<ConfiguracionSistemaExperto>): void {
    this.config = { ...this.config, ...config };
    this.inicializarReglas();
  }

  /**
   * Obtiene la configuración actual
   */
  public obtenerConfiguracion(): ConfiguracionSistemaExperto {
    return { ...this.config };
  }
}

// Exportar instancia singleton
export const motorReglas = new MotorReglasExperto();
