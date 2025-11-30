import { Request, Response } from 'express';
import { ReglaFacturacion } from '../models/ReglaFacturacion';
import reglasIAService from '../services/reglas-ia.service';
import { logger } from '../utils/logger';

/**
 * Crear una nueva regla de facturación
 * POST /api/reglas-facturacion
 */
export async function crearRegla(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, descripcion, tipo, activa, prioridad, ambito, creadoPor } = req.body;

    // Validaciones básicas
    if (!nombre || !descripcion || !tipo) {
      res.status(400).json({
        success: false,
        message: 'Los campos nombre, descripcion y tipo son requeridos',
      });
      return;
    }

    // Procesar la regla con IA
    logger.info(`🤖 Interpretando regla con IA: "${descripcion}"`);

    const reglaInterpretada = await reglasIAService.interpretarRegla(descripcion, tipo);

    // Validar la regla interpretada
    const validacion = reglasIAService.validarReglaInterpretada(reglaInterpretada);

    if (!validacion.valida) {
      res.status(400).json({
        success: false,
        message: 'La regla no pudo ser interpretada correctamente',
        errores: validacion.errores,
      });
      return;
    }

    // Crear la regla en la base de datos
    const nuevaRegla = new ReglaFacturacion({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      tipo,
      activa: activa !== undefined ? activa : true,
      prioridad: prioridad || 100,
      ambito: ambito || { tipo: 'global' },
      reglaInterpretada: {
        ...reglaInterpretada,
        procesadaPor: 'claude',
        fechaProcesamiento: new Date(),
      },
      creadoPor: creadoPor || 'sistema',
      estadisticas: {
        vecesAplicada: 0,
        montoTotalAfectado: 0,
        glosasEvitadas: 0,
      },
      historialCambios: [
        {
          fecha: new Date(),
          usuario: creadoPor || 'sistema',
          cambio: 'Regla creada',
        },
      ],
    });

    await nuevaRegla.save();

    logger.info(`✅ Regla creada exitosamente: ${nuevaRegla.id}`);

    res.status(201).json({
      success: true,
      message: 'Regla creada exitosamente',
      data: {
        id: nuevaRegla.id,
        nombre: nuevaRegla.nombre,
        descripcion: nuevaRegla.descripcion,
        tipo: nuevaRegla.tipo,
        activa: nuevaRegla.activa,
        interpretacion: reglaInterpretada,
      },
    });
  } catch (error: any) {
    logger.error('❌ Error creando regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la regla',
      error: error.message,
    });
  }
}

/**
 * Obtener todas las reglas
 * GET /api/reglas-facturacion
 */
export async function obtenerReglas(req: Request, res: Response): Promise<void> {
  try {
    const { activa, tipo, limit = 100, offset = 0 } = req.query;

    const filtro: any = {};

    if (activa !== undefined) {
      filtro.activa = activa === 'true';
    }

    if (tipo) {
      filtro.tipo = tipo;
    }

    const reglas = await ReglaFacturacion.find(filtro)
      .sort({ prioridad: 1, createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await ReglaFacturacion.countDocuments(filtro);

    const reglasFormateadas = reglas.map((regla) => ({
      id: regla.id,
      nombre: regla.nombre,
      descripcion: regla.descripcion,
      tipo: regla.tipo,
      activa: regla.activa,
      prioridad: regla.prioridad,
      ambito: regla.ambito,
      estadisticas: regla.estadisticas,
      interpretacion: regla.reglaInterpretada
        ? {
            confianza: regla.reglaInterpretada.confianza,
            explicacion: (regla.reglaInterpretada as any).explicacion || '',
            accion: regla.reglaInterpretada.accion.tipo,
          }
        : null,
      createdAt: regla.createdAt,
      updatedAt: regla.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: reglasFormateadas,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    logger.error('❌ Error obteniendo reglas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reglas',
      error: error.message,
    });
  }
}

/**
 * Obtener una regla por ID
 * GET /api/reglas-facturacion/:id
 */
export async function obtenerReglaPorId(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const regla = await ReglaFacturacion.findById(id);

    if (!regla) {
      res.status(404).json({
        success: false,
        message: 'Regla no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: regla,
    });
  } catch (error: any) {
    logger.error('❌ Error obteniendo regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la regla',
      error: error.message,
    });
  }
}

/**
 * Actualizar una regla
 * PATCH /api/reglas-facturacion/:id
 */
export async function actualizarRegla(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nombre, descripcion, tipo, activa, prioridad, ambito, modificadoPor } = req.body;

    const regla = await ReglaFacturacion.findById(id);

    if (!regla) {
      res.status(404).json({
        success: false,
        message: 'Regla no encontrada',
      });
      return;
    }

    const descripcionAnterior = regla.descripcion;
    let necesitaReprocesar = false;

    // Verificar si cambió la descripción (necesita reprocesar con IA)
    if (descripcion && descripcion !== regla.descripcion) {
      necesitaReprocesar = true;
    }

    // Actualizar campos básicos
    if (nombre) regla.nombre = nombre.trim();
    if (tipo) regla.tipo = tipo;
    if (activa !== undefined) regla.activa = activa;
    if (prioridad !== undefined) regla.prioridad = prioridad;
    if (ambito) regla.ambito = ambito;

    // Si cambió la descripción, reprocesar con IA
    if (necesitaReprocesar) {
      logger.info(`🤖 Re-interpretando regla con IA: "${descripcion}"`);

      const reglaInterpretada = await reglasIAService.interpretarRegla(descripcion, regla.tipo);

      const validacion = reglasIAService.validarReglaInterpretada(reglaInterpretada);

      if (!validacion.valida) {
        res.status(400).json({
          success: false,
          message: 'La nueva regla no pudo ser interpretada correctamente',
          errores: validacion.errores,
        });
        return;
      }

      regla.descripcion = descripcion.trim();
      regla.reglaInterpretada = {
        ...reglaInterpretada,
        procesadaPor: 'claude',
        fechaProcesamiento: new Date(),
      };
    }

    // Agregar al historial
    regla.modificadoPor = modificadoPor || 'sistema';
    regla.historialCambios.push({
      fecha: new Date(),
      usuario: modificadoPor || 'sistema',
      cambio: 'Regla actualizada',
      descripcionAnterior: necesitaReprocesar ? descripcionAnterior : undefined,
    });

    await regla.save();

    logger.info(`✅ Regla actualizada: ${regla.id}`);

    res.status(200).json({
      success: true,
      message: 'Regla actualizada exitosamente',
      data: {
        id: regla.id,
        nombre: regla.nombre,
        descripcion: regla.descripcion,
        activa: regla.activa,
        reprocesada: necesitaReprocesar,
      },
    });
  } catch (error: any) {
    logger.error('❌ Error actualizando regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la regla',
      error: error.message,
    });
  }
}

/**
 * Eliminar una regla
 * DELETE /api/reglas-facturacion/:id
 */
export async function eliminarRegla(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const regla = await ReglaFacturacion.findById(id);

    if (!regla) {
      res.status(404).json({
        success: false,
        message: 'Regla no encontrada',
      });
      return;
    }

    await ReglaFacturacion.findByIdAndDelete(id);

    logger.info(`🗑️ Regla eliminada: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Regla eliminada exitosamente',
    });
  } catch (error: any) {
    logger.error('❌ Error eliminando regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la regla',
      error: error.message,
    });
  }
}

/**
 * Activar/Desactivar una regla
 * PATCH /api/reglas-facturacion/:id/toggle
 */
export async function toggleRegla(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const regla = await ReglaFacturacion.findById(id);

    if (!regla) {
      res.status(404).json({
        success: false,
        message: 'Regla no encontrada',
      });
      return;
    }

    regla.activa = !regla.activa;

    regla.historialCambios.push({
      fecha: new Date(),
      usuario: 'sistema',
      cambio: regla.activa ? 'Regla activada' : 'Regla desactivada',
    });

    await regla.save();

    logger.info(`🔄 Regla ${regla.activa ? 'activada' : 'desactivada'}: ${id}`);

    res.status(200).json({
      success: true,
      message: `Regla ${regla.activa ? 'activada' : 'desactivada'} exitosamente`,
      data: {
        id: regla.id,
        activa: regla.activa,
      },
    });
  } catch (error: any) {
    logger.error('❌ Error toggling regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de la regla',
      error: error.message,
    });
  }
}

/**
 * Obtener ejemplos de reglas
 * GET /api/reglas-facturacion/ejemplos
 */
export async function obtenerEjemplosReglas(req: Request, res: Response): Promise<void> {
  try {
    const ejemplos = reglasIAService.obtenerEjemplosReglas();

    res.status(200).json({
      success: true,
      data: ejemplos,
    });
  } catch (error: any) {
    logger.error('❌ Error obteniendo ejemplos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ejemplos',
      error: error.message,
    });
  }
}

/**
 * Previsualizar interpretación de una regla sin guardarla
 * POST /api/reglas-facturacion/previsualizar
 */
export async function previsualizarRegla(req: Request, res: Response): Promise<void> {
  try {
    const { descripcion, tipo } = req.body;

    if (!descripcion || !tipo) {
      res.status(400).json({
        success: false,
        message: 'Los campos descripcion y tipo son requeridos',
      });
      return;
    }

    logger.info(`🔍 Previsualizando regla: "${descripcion}"`);

    const reglaInterpretada = await reglasIAService.interpretarRegla(descripcion, tipo);

    const validacion = reglasIAService.validarReglaInterpretada(reglaInterpretada);

    res.status(200).json({
      success: true,
      data: {
        interpretacion: reglaInterpretada,
        validacion: validacion,
      },
    });
  } catch (error: any) {
    logger.error('❌ Error previsualizando regla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al previsualizar la regla',
      error: error.message,
    });
  }
}

export default {
  crearRegla,
  obtenerReglas,
  obtenerReglaPorId,
  actualizarRegla,
  eliminarRegla,
  toggleRegla,
  obtenerEjemplosReglas,
  previsualizarRegla,
};
