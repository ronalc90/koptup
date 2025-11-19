import Factura from '../models/Factura';
import Atencion from '../models/Atencion';
import Procedimiento from '../models/Procedimiento';
import Glosa from '../models/Glosa';
import Tarifario from '../models/Tarifario';
import ReglaAuditoria from '../models/ReglaAuditoria';
import CUPS from '../models/CUPS';
import { Types } from 'mongoose';

interface ResultadoAuditoria {
  facturaId: Types.ObjectId;
  totalGlosas: number;
  valorFacturaOriginal: number;
  valorAceptado: number;
  glosasPorTipo: Record<string, number>;
  glosas: any[];
  observaciones: string[];
}

class AuditoriaService {
  /**
   * Ejecuta auditoría completa de una factura
   */
  async ejecutarAuditoria(facturaId: string): Promise<ResultadoAuditoria> {
    try {
      // 1. Obtener factura y validar
      const factura = await Factura.findById(facturaId).populate('atenciones');
      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      // 2. Obtener tarifario a usar
      let tarifario;
      if (factura.tarifarioId) {
        tarifario = await Tarifario.findById(factura.tarifarioId);
      } else {
        // Buscar tarifario por EPS y fecha
        tarifario = await this.obtenerTarifarioVigente(factura.eps.nit, factura.fechaEmision);
      }

      if (!tarifario) {
        throw new Error('No se encontró tarifario aplicable para esta factura');
      }

      // 3. Actualizar valores de contrato en procedimientos
      await this.actualizarValoresContrato(facturaId, tarifario);

      // 4. Detectar duplicidades
      await this.detectarDuplicidades(facturaId);

      // 5. Validar autorizaciones
      await this.validarAutorizaciones(facturaId);

      // 6. Validar pertinencia
      await this.validarPertinencia(facturaId);

      // 7. Aplicar reglas de auditoría
      const reglas = await ReglaAuditoria.find({ activa: true }).sort({ prioridad: 1 });
      const glosas = await this.aplicarReglasAuditoria(facturaId, reglas);

      // 8. Calcular totales
      const resultado = await this.calcularTotales(facturaId);

      // 9. Actualizar factura
      await Factura.findByIdAndUpdate(facturaId, {
        estado: 'Auditada',
        auditoriaCompletada: true,
        fechaAuditoria: new Date(),
        totalGlosas: resultado.totalGlosas,
        valorAceptado: resultado.valorAceptado,
      });

      return resultado;
    } catch (error) {
      console.error('Error ejecutando auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene el tarifario vigente para una EPS en una fecha determinada
   */
  private async obtenerTarifarioVigente(epsNit: string, fecha: Date) {
    // Primero buscar contrato específico de la EPS
    let tarifario = await Tarifario.findOne({
      eps: { $exists: true },
      activo: true,
      vigenciaInicio: { $lte: fecha },
      $or: [{ vigenciaFin: { $exists: false } }, { vigenciaFin: { $gte: fecha } }],
    }).sort({ vigenciaInicio: -1 });

    // Si no hay contrato específico, usar ISS 2004 como default
    if (!tarifario) {
      tarifario = await Tarifario.findOne({
        nombre: 'ISS 2004',
        activo: true,
      });
    }

    return tarifario;
  }

  /**
   * Actualiza los valores de contrato en todos los procedimientos de una factura
   */
  private async actualizarValoresContrato(facturaId: string, tarifario: any) {
    const procedimientos = await Procedimiento.find({ facturaId });

    for (const proc of procedimientos) {
      const itemTarifario = tarifario.items.find(
        (item: any) => item.codigoCUPS === proc.codigoCUPS
      );

      if (itemTarifario) {
        proc.valorUnitarioContrato = itemTarifario.valor;
        proc.valorTotalContrato = proc.cantidad * itemTarifario.valor;
        proc.diferenciaTarifa = proc.valorTotalIPS - proc.valorTotalContrato;
        proc.tarifaValidada = true;
        await proc.save();
      } else {
        console.warn(`⚠️ Código CUPS ${proc.codigoCUPS} no encontrado en tarifario`);
      }
    }
  }

  /**
   * Detecta procedimientos duplicados en la misma atención
   */
  private async detectarDuplicidades(facturaId: string) {
    const atenciones = await Atencion.find({ facturaId });

    for (const atencion of atenciones) {
      const procedimientos = await Procedimiento.find({ atencionId: atencion._id });

      // Agrupar por código CUPS
      const procedimientosPorCodigo: Record<string, any[]> = {};
      for (const proc of procedimientos) {
        if (!procedimientosPorCodigo[proc.codigoCUPS]) {
          procedimientosPorCodigo[proc.codigoCUPS] = [];
        }
        procedimientosPorCodigo[proc.codigoCUPS].push(proc);
      }

      // Marcar duplicados
      for (const codigo in procedimientosPorCodigo) {
        const procs = procedimientosPorCodigo[codigo];
        if (procs.length > 1) {
          // Marcar todos excepto el primero como duplicados
          for (let i = 1; i < procs.length; i++) {
            procs[i].duplicado = true;
            await procs[i].save();
          }
        }
      }
    }
  }

  /**
   * Valida que los procedimientos tengan autorización cuando sea necesario
   */
  private async validarAutorizaciones(facturaId: string) {
    const atenciones = await Atencion.find({ facturaId });

    for (const atencion of atenciones) {
      const procedimientos = await Procedimiento.find({ atencionId: atencion._id });

      for (const proc of procedimientos) {
        // Obtener info del CUPS
        const cups = await CUPS.findOne({ codigo: proc.codigoCUPS });

        if (cups?.metadata?.requiereAutorizacion) {
          atencion.tieneAutorizacion = !!atencion.numeroAutorizacion;
          atencion.autorizacionValida = this.validarFechaAutorizacion(
            atencion.fechaAutorizacion,
            atencion.fechaInicio
          );
          await atencion.save();
        }
      }
    }
  }

  /**
   * Valida si la fecha de autorización es válida
   */
  private validarFechaAutorizacion(
    fechaAutorizacion?: Date,
    fechaAtencion?: Date
  ): boolean {
    if (!fechaAutorizacion || !fechaAtencion) return false;

    // La autorización debe ser anterior o igual a la fecha de atención
    // y no más de 30 días antes
    const diffDias = Math.floor(
      (fechaAtencion.getTime() - fechaAutorizacion.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffDias >= 0 && diffDias <= 30;
  }

  /**
   * Valida la pertinencia médica de los procedimientos
   */
  private async validarPertinencia(facturaId: string) {
    const atenciones = await Atencion.find({ facturaId });

    for (const atencion of atenciones) {
      const procedimientos = await Procedimiento.find({ atencionId: atencion._id });

      for (const proc of procedimientos) {
        // Aquí se podría implementar lógica más compleja con IA
        // Por ahora, validación simple basada en categorías
        const pertinente = await this.verificarPertinenciaCUPSconCIE10(
          proc.codigoCUPS,
          atencion.diagnosticoPrincipal.codigoCIE10
        );

        proc.pertinenciaValidada = pertinente;
        await proc.save();
      }
    }
  }

  /**
   * Verifica pertinencia básica entre CUPS y CIE-10
   */
  private async verificarPertinenciaCUPSconCIE10(
    codigoCUPS: string,
    codigoCIE10: string
  ): boolean {
    // Implementación simplificada
    // En producción, esto debería usar tablas de correspondencia o IA
    const cups = await CUPS.findOne({ codigo: codigoCUPS });

    // Por defecto, marcar como pertinente
    // Solo marcar como no pertinente si hay incompatibilidad evidente
    return true;
  }

  /**
   * Aplica todas las reglas de auditoría activas
   */
  private async aplicarReglasAuditoria(facturaId: string, reglas: any[]) {
    const glosas: any[] = [];
    const procedimientos = await Procedimiento.find({ facturaId }).populate('atencionId');

    for (const proc of procedimientos) {
      for (const regla of reglas) {
        const cumpleRegla = this.evaluarCondiciones(proc, regla);

        if (cumpleRegla) {
          const glosa = await this.crearGlosa(proc, regla);
          if (glosa) {
            glosas.push(glosa);
          }
        }
      }
    }

    return glosas;
  }

  /**
   * Evalúa si un procedimiento cumple las condiciones de una regla
   */
  private evaluarCondiciones(procedimiento: any, regla: any): boolean {
    const { condiciones, operadorLogico } = regla;

    const resultados = condiciones.map((condicion: any) =>
      this.evaluarCondicion(procedimiento, condicion)
    );

    if (operadorLogico === 'AND') {
      return resultados.every((r) => r);
    } else {
      return resultados.some((r) => r);
    }
  }

  /**
   * Evalúa una condición individual
   */
  private evaluarCondicion(procedimiento: any, condicion: any): boolean {
    const { campo, operador, valor } = condicion;

    let valorCampo = this.obtenerValorCampo(procedimiento, campo);

    switch (operador) {
      case '>':
        return valorCampo > valor;
      case '<':
        return valorCampo < valor;
      case '=':
        return valorCampo === valor;
      case '!=':
        return valorCampo !== valor;
      case '>=':
        return valorCampo >= valor;
      case '<=':
        return valorCampo <= valor;
      case 'contains':
        return String(valorCampo).includes(valor);
      case 'exists':
        return valorCampo !== null && valorCampo !== undefined;
      case 'not_exists':
        return valorCampo === null || valorCampo === undefined;
      default:
        return false;
    }
  }

  /**
   * Obtiene el valor de un campo del procedimiento
   */
  private obtenerValorCampo(procedimiento: any, campo: string): any {
    // Campos directos
    if (campo in procedimiento) {
      return procedimiento[campo];
    }

    // Campos calculados
    if (campo === 'porcentajeDiferencia') {
      if (procedimiento.valorTotalContrato === 0) return 0;
      return (
        (procedimiento.diferenciaTarifa / procedimiento.valorTotalContrato) *
        100
      );
    }

    if (campo === 'requiereAutorizacion') {
      // Necesitaríamos acceder al CUPS, por simplicidad retornamos false
      return false;
    }

    if (campo === 'tieneAutorizacion') {
      return procedimiento.atencionId?.tieneAutorizacion || false;
    }

    if (campo === 'autorizacionValida') {
      return procedimiento.atencionId?.autorizacionValida || false;
    }

    if (campo === 'soportes') {
      return procedimiento.atencionId?.soportes?.length > 0
        ? procedimiento.atencionId.soportes
        : null;
    }

    return null;
  }

  /**
   * Crea una glosa basada en una regla
   */
  private async crearGlosa(procedimiento: any, regla: any) {
    const { accion } = regla;

    // Verificar si ya existe glosa del mismo tipo
    const glosaExistente = await Glosa.findOne({
      procedimientoId: procedimiento._id,
      codigo: accion.codigoGlosa,
    });

    if (glosaExistente) {
      return null; // Ya existe
    }

    // Calcular valor de la glosa
    let valorGlosado = 0;
    let porcentaje = 0;

    switch (accion.calcularValor) {
      case 'diferencia':
        valorGlosado = Math.max(0, procedimiento.diferenciaTarifa);
        break;
      case 'total':
        valorGlosado = procedimiento.valorTotalIPS;
        break;
      case 'porcentaje':
        porcentaje = accion.porcentaje || 0;
        valorGlosado = (procedimiento.valorTotalIPS * porcentaje) / 100;
        break;
      case 'fijo':
        valorGlosado = accion.valorFijo || 0;
        break;
    }

    // Crear glosa
    const glosa = new Glosa({
      procedimientoId: procedimiento._id,
      atencionId: procedimiento.atencionId._id,
      facturaId: procedimiento.facturaId,
      codigo: accion.codigoGlosa,
      tipo: accion.tipo,
      descripcion: accion.descripcion,
      valorGlosado,
      porcentaje: porcentaje > 0 ? porcentaje : undefined,
      observaciones: `Generada por regla: ${regla.nombre}`,
      estado: 'Pendiente',
      generadaAutomaticamente: true,
      fechaGeneracion: new Date(),
    });

    await glosa.save();

    // Actualizar procedimiento
    procedimiento.glosas.push(glosa._id);
    procedimiento.totalGlosas += valorGlosado;
    procedimiento.valorAPagar = procedimiento.valorTotalIPS - procedimiento.totalGlosas;
    await procedimiento.save();

    return glosa;
  }

  /**
   * Calcula los totales de la auditoría
   */
  private async calcularTotales(facturaId: string): Promise<ResultadoAuditoria> {
    const factura = await Factura.findById(facturaId);
    const glosas = await Glosa.find({ facturaId });
    const procedimientos = await Procedimiento.find({ facturaId });

    const totalGlosas = glosas.reduce((sum, g) => sum + g.valorGlosado, 0);
    const valorFacturaOriginal = factura!.valorTotal;
    const valorAceptado = valorFacturaOriginal - totalGlosas;

    // Glosas por tipo
    const glosasPorTipo: Record<string, number> = {};
    for (const glosa of glosas) {
      glosasPorTipo[glosa.tipo] = (glosasPorTipo[glosa.tipo] || 0) + glosa.valorGlosado;
    }

    // Observaciones
    const observaciones: string[] = [];
    if (totalGlosas > 0) {
      observaciones.push(`Se generaron ${glosas.length} glosas por un total de $${totalGlosas.toLocaleString('es-CO')}`);
    }

    const duplicados = procedimientos.filter((p) => p.duplicado).length;
    if (duplicados > 0) {
      observaciones.push(`Se detectaron ${duplicados} procedimientos duplicados`);
    }

    return {
      facturaId: factura!._id,
      totalGlosas,
      valorFacturaOriginal,
      valorAceptado,
      glosasPorTipo,
      glosas: glosas.map((g) => g.toObject()),
      observaciones,
    };
  }
}

export default new AuditoriaService();
